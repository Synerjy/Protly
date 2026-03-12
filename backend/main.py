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

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator
import requests
import numpy as np
import biotite.structure.io as bsio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
try:
    from .stability import compute_stability_metrics
except ImportError:
    from stability import compute_stability_metrics

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
# CORS — allow the Vite dev server and common local origins
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return response

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
VALID_AMINO_ACIDS = set("ACDEFGHIKLMNPQRSTVWY")

class PredictRequest(BaseModel):
    sequence: str = Field(..., min_length=10, max_length=2000, description="Amino-acid sequence (single letter codes)")

    @field_validator("sequence")
    @classmethod
    def validate_amino_acids(cls, v: str) -> str:
        """Strip whitespace/digits, uppercase, then reject invalid amino-acid letters."""
        cleaned = re.sub(r"[\s\d]", "", v).upper()
        if not 10 <= len(cleaned) <= 2000:
            raise ValueError("Sequence length must be between 10 and 2000 amino acids after cleaning")
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


class SolubilityRequest(BaseModel):
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


class SolubilityResponse(BaseModel):
    sequence_length: int
    solubility_score: float  # 0-100, higher = more soluble
    solubility_class: str    # "High", "Moderate", "Low"
    hydrophobicity: float    # average hydrophobicity score
    charge_ratio: float      # ratio of charged residues
    prediction_confidence: float
    details: dict


class StabilityRequest(BaseModel):
    sequence: str = Field(..., description="Amino-acid sequence (single letter codes)")

    @field_validator("sequence")
    @classmethod
    def validate_amino_acids(cls, v: str) -> str:
        """Strip whitespace/digits, uppercase, then reject invalid amino-acid letters."""
        cleaned = re.sub(r"[\s\d]", "", v).upper()
        if not 10 <= len(cleaned) <= 2000:
            raise ValueError("Sequence length must be between 10 and 2000 amino acids after cleaning")
        invalid = set(cleaned) - VALID_AMINO_ACIDS
        if invalid:
            raise ValueError(
                f"Sequence contains invalid characters: {', '.join(sorted(invalid))}. "
                f"Only standard amino-acid letters are allowed: {''.join(sorted(VALID_AMINO_ACIDS))}"
            )
        return cleaned


class StabilityResponse(BaseModel):
    sequence_length: int
    instability_index: float
    stability_score: float  # 0-100, higher = more stable
    stability_class: str    # "High", "Moderate", "Low"
    aromaticity: float
    aliphatic_index: float
    charge_density: float
    details: dict


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


@app.post("/api/solubility", response_model=SolubilityResponse)
@limiter.limit("20/minute")
async def measure_solubility(request: Request, body: SolubilityRequest):
    """
    Measure and predict protein solubility from amino acid sequence.
    Returns dummy/mock data for demonstration purposes.
    """
    sequence = body.sequence  # already cleaned by validator

    # ---- Hydrophobicity scale (Kyte-Doolittle) ----
    hydro_scale = {
        'A': 1.8, 'R': -4.5, 'N': -3.5, 'D': -3.5, 'C': 2.5,
        'Q': -3.5, 'E': -3.5, 'G': -0.4, 'H': -3.2, 'I': 4.5,
        'L': 3.8, 'K': -3.9, 'M': 1.9, 'F': 2.8, 'P': -1.6,
        'S': -0.8, 'T': -0.7, 'W': -0.9, 'Y': -1.3, 'V': 4.2
    }

    # ---- Calculate features ----
    seq_length = len(sequence)
    
    # Average hydrophobicity
    hydro_sum = sum(hydro_scale.get(aa, 0) for aa in sequence)
    hydrophobicity = hydro_sum / seq_length if seq_length > 0 else 0

    # Count charged residues (positive: K, R; negative: D, E)
    positive = sum(1 for aa in sequence if aa in 'KR')
    negative = sum(1 for aa in sequence if aa in 'DE')
    total_charged = positive + negative
    charge_ratio = total_charged / seq_length if seq_length > 0 else 0

    # ---- Dummy solubility prediction ----
    # Combine features to get a solubility score (0-100)
    # Higher charge ratio and lower hydrophobicity generally = more soluble
    base_score = 50
    
    # Adjust for hydrophobicity (very hydrophobic proteins are less soluble)
    if hydrophobicity > 2:
        base_score -= 20
    elif hydrophobicity > 1:
        base_score -= 10
    elif hydrophobicity < -1:
        base_score += 15
    
    # Adjust for charge (more charged = more soluble)
    if charge_ratio > 0.3:
        base_score += 20
    elif charge_ratio > 0.15:
        base_score += 10
    
    # Add some randomness for demonstration
    solubility_score = min(100, max(0, base_score + np.random.uniform(-5, 5)))
    
    # Classify solubility
    if solubility_score >= 65:
        solubility_class = "High"
    elif solubility_score >= 45:
        solubility_class = "Moderate"
    else:
        solubility_class = "Low"

    prediction_confidence = round(0.75 + np.random.uniform(-0.1, 0.15), 2)

    return SolubilityResponse(
        sequence_length=seq_length,
        solubility_score=round(solubility_score, 2),
        solubility_class=solubility_class,
        hydrophobicity=round(hydrophobicity, 3),
        charge_ratio=round(charge_ratio, 3),
        prediction_confidence=prediction_confidence,
        details={
            "positive_residues": positive,
            "negative_residues": negative,
            "total_charged": total_charged,
            "hydrophobic_residues": sum(1 for aa in sequence if aa in 'AILMFVP'),
            "note": "Dummy prediction for demonstration. In production, this would use ML models."
        }
    )


@app.post("/api/stability", response_model=StabilityResponse)
@limiter.limit("20/minute")
async def measure_stability(request: Request, body: StabilityRequest):
    """Estimate protein stability from sequence-derived biochemical features."""
    sequence = body.sequence  # already cleaned by validator

    try:
        metrics = compute_stability_metrics(sequence)
    except Exception as exc:
        logger.error("Stability computation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Stability computation failed. Please try again.")

    return StabilityResponse(**metrics)


@app.get("/api/solubility/search")
@limiter.limit("20/minute")
async def search_solubility(request: Request, protein_name: str = "", min_score: float = 0, max_score: float = 100):
    """
    Search protein solubility database.
    Returns dummy data matching the search criteria.
    """
    if min_score < 0 or min_score > 100 or max_score < 0 or max_score > 100:
        raise HTTPException(status_code=400, detail="Scores must be between 0 and 100")
    
    if min_score > max_score:
        raise HTTPException(status_code=400, detail="min_score must be less than or equal to max_score")

    # ---- Dummy database ----
    dummy_proteins = [
        {"name": "Ubiquitin", "solubility_score": 82.5, "class": "High"},
        {"name": "insulin", "solubility_score": 45.3, "class": "Moderate"},
        {"name": "Lysozyme", "solubility_score": 78.9, "class": "High"},
        {"name": "Hemoglobin", "solubility_score": 55.2, "class": "Moderate"},
        {"name": "Myoglobin", "solubility_score": 72.1, "class": "High"},
        {"name": "Collagen", "solubility_score": 28.4, "class": "Low"},
        {"name": "Amylase", "solubility_score": 85.7, "class": "High"},
        {"name": "Protease", "solubility_score": 61.3, "class": "Moderate"},
    ]

    # Filter by name and score range
    results = [
        p for p in dummy_proteins
        if (protein_name.lower() in p["name"].lower() and
            min_score <= p["solubility_score"] <= max_score)
    ]

    return {
        "query": {
            "protein_name": protein_name,
            "min_score": min_score,
            "max_score": max_score
        },
        "count": len(results),
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
