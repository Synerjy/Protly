"""Stability feature module.

This module intentionally contains pure, deterministic computation logic so the
API layer can stay thin and resilient.
"""

from typing import Any


def compute_stability_metrics(sequence: str) -> dict[str, Any]:
    """Compute deterministic stability metrics from an amino-acid sequence."""
    seq_length = len(sequence)

    aromatic_count = sum(1 for aa in sequence if aa in "FWY")
    aromaticity = aromatic_count / seq_length if seq_length > 0 else 0

    a_count = sequence.count("A")
    v_count = sequence.count("V")
    i_count = sequence.count("I")
    l_count = sequence.count("L")
    aliphatic_index = (
        ((a_count + 2.9 * v_count + 3.9 * (i_count + l_count)) / seq_length * 100)
        if seq_length > 0
        else 0
    )

    positive = sum(1 for aa in sequence if aa in "KRH")
    negative = sum(1 for aa in sequence if aa in "DE")
    charge_density = (positive + negative) / seq_length if seq_length > 0 else 0

    disorder_count = sum(1 for aa in sequence if aa in "PGSQEN")
    disorder_fraction = disorder_count / seq_length if seq_length > 0 else 0

    instability_index = (
        50
        + (disorder_fraction * 70)
        - (aromaticity * 20)
        - (aliphatic_index * 0.12)
        + (max(charge_density - 0.25, 0) * 25)
    )
    instability_index = float(max(5, min(95, instability_index)))

    stability_score = round(100 - instability_index, 2)
    if stability_score >= 65:
        stability_class = "High"
    elif stability_score >= 45:
        stability_class = "Moderate"
    else:
        stability_class = "Low"

    return {
        "sequence_length": seq_length,
        "instability_index": round(instability_index, 2),
        "stability_score": stability_score,
        "stability_class": stability_class,
        "aromaticity": round(aromaticity, 3),
        "aliphatic_index": round(aliphatic_index, 2),
        "charge_density": round(charge_density, 3),
        "details": {
            "aromatic_residues": aromatic_count,
            "disorder_promoting_residues": disorder_count,
            "positively_charged_residues": positive,
            "negatively_charged_residues": negative,
            "model": "Deterministic heuristic model for MVP stability screening",
        },
    }
