"""
Protly Backend — FastAPI server for ESMFold protein structure prediction.

Endpoints:
  GET  /api/health   → health check
  POST /api/predict   → accepts { sequence: str }, returns PDB + pLDDT data
"""

import io
import re
import time
import logging
import tempfile
import os
import traceback

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, Field, field_validator
import requests
import numpy as np
import biotite.structure.io as bsio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("protly")

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Protly API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# Supabase Auth Config
# ---------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_JWT_SECRET:
    logger.warning("SUPABASE_JWT_SECRET is not set — JWT auth verification will be skipped!")

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server and common local origins
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# ---------------------------------------------------------------------------
# Security headers middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none'"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# ---------------------------------------------------------------------------
# JWT Authentication middleware
# ---------------------------------------------------------------------------
# Endpoints that do NOT require authentication
PUBLIC_PATHS = {"/api/health", "/docs", "/openapi.json", "/redoc"}

@app.middleware("http")
async def authenticate_requests(request: Request, call_next):
    """Validate Supabase JWT on protected endpoints."""
    path = request.url.path

    # Skip auth for public endpoints and CORS preflight
    if path in PUBLIC_PATHS or request.method == "OPTIONS":
        return await call_next(request)

    # If no JWT secret configured, skip validation (dev mode)
    if not SUPABASE_JWT_SECRET:
        return await call_next(request)

    # Extract Bearer token
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing or invalid Authorization header. Please sign in."},
        )

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        # Attach user info to request state for downstream handlers
        request.state.user_id = payload.get("sub")
        request.state.user_email = payload.get("email", "")
    except JWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or expired token. Please sign in again."},
        )

    return await call_next(request)

# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    logger.info("→ %s %s", request.method, request.url.path)
    try:
        response = await call_next(request)
        elapsed = (time.time() - start) * 1000
        logger.info("← %s %s  %d  %.0fms", request.method, request.url.path, response.status_code, elapsed)
        return response
    except Exception as exc:
        elapsed = (time.time() - start) * 1000
        logger.error("✖ %s %s  ERROR  %.0fms — %s", request.method, request.url.path, elapsed, exc)
        raise

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
VALID_AMINO_ACIDS = set(os.getenv("VALID_AMINO_ACIDS", "A,C,D,E,F,G,H,I,K,L,M,N,P,Q,R,S,T,V,W,Y").replace(",", ""))

class PredictRequest(BaseModel):
    sequence: str = Field(..., min_length=10, max_length=2000, description="Amino-acid sequence (single letter codes)")

    @field_validator("sequence")
    @classmethod
    def validate_amino_acids(cls, v: str) -> str:
        """Strip whitespace/digits, uppercase, then reject invalid amino-acid letters."""
        cleaned = re.sub(r"[\s\d]", "", v).upper()
        invalid = set(cleaned) - VALID_AMINO_ACIDS
        if invalid:
            raise ValueError(
                f"Sequence contains invalid characters: {', '.join(sorted(invalid))}. "
                f"Only standard amino-acid letters are allowed: {''.join(sorted(VALID_AMINO_ACIDS))}"
            )
        return cleaned


class PlddtData(BaseModel):
    mean: float
    per_residue: list[float]
    very_high: float   # % residues with pLDDT > 90
    confident: float   # % residues 70–90
    low: float          # % residues 50–70
    very_low: float     # % residues < 50


class PredictResponse(BaseModel):
    pdb: str
    plddt: PlddtData
    sequence_length: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/predict", response_model=PredictResponse)
@limiter.limit("10/minute")
async def predict(request: Request, body: PredictRequest):
    """Call the ESMAtlas fold API and return the PDB string + pLDDT statistics."""

    sequence = body.sequence  # already cleaned by validator

    # ---- call ESMAtlas ----
    try:
        resp = requests.post(
            "https://api.esmatlas.com/foldSequence/v1/pdb/",
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data=sequence,
            timeout=120,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.error("ESMAtlas API call failed: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"The protein structure prediction service (ESMAtlas) is currently unavailable. Please try again later. ({type(exc).__name__})"
        )

    pdb_string = resp.text

    # ---- parse pLDDT from B-factor column ----
    try:
        # biotite needs a file on disk
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdb", mode="w")
        tmp.write(pdb_string)
        tmp.close()

        struct = bsio.load_structure(tmp.name, extra_fields=["b_factor"])
        b_factors = struct.b_factor

        # Extract per-residue pLDDT (one value per residue, from first atom)
        per_residue = []
        residue_ids = struct.res_id
        seen = set()
        for i, rid in enumerate(residue_ids):
            if rid not in seen:
                seen.add(rid)
                per_residue.append(float(b_factors[i]))

        arr = np.array(per_residue)

        # ESMAtlas returns pLDDT in 0-1 range — scale to 0-100 if needed
        if arr.max() <= 1.0:
            arr = arr * 100.0
            per_residue = [v * 100.0 for v in per_residue]

        mean_plddt = float(np.mean(arr))

        # Confidence bands (on 0-100 scale)
        total = len(arr)
        very_high = float(np.sum(arr > 90) / total * 100)
        confident = float(np.sum((arr > 70) & (arr <= 90)) / total * 100)
        low = float(np.sum((arr > 50) & (arr <= 70)) / total * 100)
        very_low = float(np.sum(arr <= 50) / total * 100)

        os.unlink(tmp.name)

    except Exception as exc:
        logger.error("PDB parsing failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to parse the predicted structure. Please try a different sequence. ({type(exc).__name__})")

    return PredictResponse(
        pdb=pdb_string,
        plddt=PlddtData(
            mean=round(mean_plddt, 4),
            per_residue=[round(v, 2) for v in per_residue],
            very_high=round(very_high, 1),
            confident=round(confident, 1),
            low=round(low, 1),
            very_low=round(very_low, 1),
        ),
        sequence_length=len(sequence),
    )


# ---------------------------------------------------------------------------
# UniProt Search Proxy
# ---------------------------------------------------------------------------

UNIPROT_BASE = "https://rest.uniprot.org/uniprotkb"

ORGANISM_MAP = {
    "human": "9606",
    "mouse": "10090",
    "ecoli": "83333",
}


class AnalyzeRequest(BaseModel):
    sequence: str = Field(..., min_length=10, max_length=10000, description="Amino-acid sequence")

    @field_validator("sequence")
    @classmethod
    def validate_amino_acids_analyze(cls, v: str) -> str:
        cleaned = re.sub(r"[\s\d]", "", v).upper()
        invalid = set(cleaned) - VALID_AMINO_ACIDS
        if invalid:
            raise ValueError(f"Invalid characters: {', '.join(sorted(invalid))}")
        return cleaned


@app.get("/api/uniprot/search")
@limiter.limit("30/minute")
async def uniprot_search(
    request: Request,
    query: str,
    reviewed: bool = True,
    organism: str = "",
    length_min: int = 1,
    length_max: int = 1000,
    page: int = 0,
    size: int = 25,
):
    """Proxy search to UniProt REST API with filters."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    # Build Solr query
    parts = [query.strip()]
    if reviewed:
        parts.append("(reviewed:true)")
    if organism and organism.lower() in ORGANISM_MAP:
        parts.append(f"(organism_id:{ORGANISM_MAP[organism.lower()]})")
    if length_max > 0:
        safe_min = max(1, length_min)  # UniProt requires min >= 1
        parts.append(f"(length:[{safe_min} TO {length_max}])")

    solr_query = " AND ".join(parts)
    offset = page * size

    params = {
        "query": solr_query,
        "fields": "accession,id,protein_name,gene_names,organism_name,length",
        "format": "json",
        "size": size,
        "offset": offset,
    }

    try:
        resp = requests.get(
            f"{UNIPROT_BASE}/search",
            params=params,
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.error("UniProt search failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"UniProt API is unavailable. ({type(exc).__name__})")

    data = resp.json()
    results = data.get("results", [])

    # Parse total from Link header (x-total-results header)
    total = int(resp.headers.get("x-total-results", len(results)))

    # Flatten results for the frontend
    rows = []
    for r in results:
        protein_name = ""
        pn = r.get("proteinDescription", {})
        rec_name = pn.get("recommendedName")
        if rec_name:
            protein_name = rec_name.get("fullName", {}).get("value", "")
        elif pn.get("submissionNames"):
            protein_name = pn["submissionNames"][0].get("fullName", {}).get("value", "")

        gene_name = ""
        genes = r.get("genes", [])
        if genes and genes[0].get("geneName"):
            gene_name = genes[0]["geneName"].get("value", "")

        organism_name = r.get("organism", {}).get("scientificName", "")

        rows.append({
            "accession": r.get("primaryAccession", ""),
            "entryName": r.get("uniProtkbId", ""),
            "proteinName": protein_name,
            "geneName": gene_name,
            "organism": organism_name,
            "length": r.get("sequence", {}).get("length", 0),
        })

    return {"results": rows, "total": total, "page": page, "size": size}


@app.get("/api/uniprot/entry/{accession}")
@limiter.limit("30/minute")
async def uniprot_entry(request: Request, accession: str):
    """Fetch a full UniProt entry by accession (sequence + metadata)."""
    try:
        resp = requests.get(
            f"{UNIPROT_BASE}/{accession}",
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
    except requests.RequestException as exc:
        logger.error("UniProt entry fetch failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"UniProt API is unavailable. ({type(exc).__name__})")

    data = resp.json()

    # Extract protein name
    protein_name = ""
    pn = data.get("proteinDescription", {})
    rec_name = pn.get("recommendedName")
    if rec_name:
        protein_name = rec_name.get("fullName", {}).get("value", "")
    elif pn.get("submissionNames"):
        protein_name = pn["submissionNames"][0].get("fullName", {}).get("value", "")

    # Gene name
    gene_name = ""
    genes = data.get("genes", [])
    if genes and genes[0].get("geneName"):
        gene_name = genes[0]["geneName"].get("value", "")

    # Organism
    organism_name = data.get("organism", {}).get("scientificName", "")

    # Function (cc_function)
    function_text = ""
    comments = data.get("comments", [])
    for c in comments:
        if c.get("commentType") == "FUNCTION":
            texts = c.get("texts", [])
            if texts:
                function_text = texts[0].get("value", "")
                break

    # Sequence
    seq = data.get("sequence", {}).get("value", "")
    length = data.get("sequence", {}).get("length", len(seq))

    return {
        "accession": data.get("primaryAccession", accession),
        "entryName": data.get("uniProtkbId", ""),
        "proteinName": protein_name,
        "geneName": gene_name,
        "organism": organism_name,
        "function": function_text,
        "sequence": seq,
        "length": length,
    }


@app.post("/api/analyze")
@limiter.limit("30/minute")
async def analyze_protein(request: Request, body: AnalyzeRequest):
    """Run Biopython ProteinAnalysis to calculate lab-readiness metrics."""
    from Bio.SeqUtils.ProtParam import ProteinAnalysis

    sequence = body.sequence
    try:
        analysis = ProteinAnalysis(sequence)
        instability = analysis.instability_index()
        isoelectric = analysis.isoelectric_point()
        gravy = analysis.gravy()
    except Exception as exc:
        logger.error("ProteinAnalysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Protein analysis failed: {type(exc).__name__}")

    return {
        "instability_index": round(instability, 2),
        "isoelectric_point": round(isoelectric, 2),
        "gravy": round(gravy, 4),
        "is_stable": instability < 40,
        "sequence_length": len(sequence),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
