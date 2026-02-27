"""
Protly Backend — FastAPI server for ESMFold protein structure prediction.

Endpoints:
  GET  /api/health   → health check
  POST /api/predict   → accepts { sequence: str }, returns PDB + pLDDT data
"""

import io
import tempfile
import os
import traceback

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
import numpy as np
import biotite.structure.io as bsio

app = FastAPI(title="Protly API", version="1.0.0")

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
# Models
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    sequence: str = Field(..., min_length=10, max_length=2000, description="Amino-acid sequence (single letter codes)")


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
async def predict(body: PredictRequest):
    """Call the ESMAtlas fold API and return the PDB string + pLDDT statistics."""

    sequence = body.sequence.strip().upper()

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
        raise HTTPException(status_code=502, detail=f"ESMAtlas API error: {exc}")

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
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDB parsing error: {exc}")

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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
