"""
test_subcellular.py

Tests for the /api/uniprot/entry/{accession} endpoint which provides
subcellular localization data (and other metadata) for the analysis view.
"""

from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
import main

# Bypass JWT auth for testing
main.SUPABASE_JWT_SECRET = ""

client = TestClient(main.app)


# ---------------------------------------------------------------------------
# Helpers — build mock UniProt REST API payloads
# ---------------------------------------------------------------------------


def _make_uniprot_entry(
    accession="P12345",
    protein_name="Test Protein",
    gene_name="TESTP",
    organism="Homo sapiens",
    sequence="MACDEFGHIKLMN",
    subcellular_locations=None,
    function_text="Plays a critical role in testing.",
):
    """Build a minimal UniProtKB-style JSON payload."""
    if subcellular_locations is None:
        subcellular_locations = [
            {
                "location": {"value": "Nucleus", "id": "SL-0191"},
                "topology": None,
                "orientation": None,
            },
            {
                "location": {"value": "Cytoplasm", "id": "SL-0086"},
                "topology": None,
                "orientation": None,
            },
        ]

    comments = [
        {
            "commentType": "FUNCTION",
            "texts": [{"value": function_text}],
        },
        {
            "commentType": "SUBCELLULAR LOCATION",
            "subcellularLocations": subcellular_locations,
            "note": {"texts": [{"value": "Isoform-specific annotation"}]},
        },
    ]

    return {
        "primaryAccession": accession,
        "uniProtkbId": f"{gene_name}_HUMAN",
        "proteinDescription": {"recommendedName": {"fullName": {"value": protein_name}}},
        "genes": [{"geneName": {"value": gene_name}}],
        "organism": {"scientificName": organism},
        "sequence": {"value": sequence, "length": len(sequence)},
        "comments": comments,
    }


# ---------------------------------------------------------------------------
# Tests — happy path
# ---------------------------------------------------------------------------


@patch("main.requests.get")
def test_entry_returns_protein_metadata(mock_get):
    """Endpoint should return accession, protein name, gene name, organism."""
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = _make_uniprot_entry()
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")

    assert resp.status_code == 200
    data = resp.json()
    assert data["accession"] == "P12345"
    assert data["proteinName"] == "Test Protein"
    assert data["geneName"] == "TESTP"
    assert data["organism"] == "Homo sapiens"
    assert data["sequence"] == "MACDEFGHIKLMN"
    assert data["length"] == 13


@patch("main.requests.get")
def test_entry_returns_subcellular_locations(mock_get):
    """Endpoint must parse SUBCELLULAR LOCATION comment blocks correctly."""
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = _make_uniprot_entry()
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    locs = data["subcellularLocations"]
    assert isinstance(locs, list)
    assert len(locs) == 2

    location_names = [l["location"] for l in locs]
    assert "Nucleus" in location_names
    assert "Cytoplasm" in location_names


@patch("main.requests.get")
def test_entry_subcellular_location_has_expected_fields(mock_get):
    """Each location object must include location, id, topology, orientation, note fields."""
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = _make_uniprot_entry(
        subcellular_locations=[
            {
                "location": {"value": "Cell membrane", "id": "SL-0039"},
                "topology": {"value": "Single-pass type I membrane protein"},
                "orientation": {"value": "Extracellular side"},
            }
        ]
    )
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    loc = data["subcellularLocations"][0]
    assert loc["location"] == "Cell membrane"
    assert loc["id"] == "SL-0039"
    assert loc["topology"] == "Single-pass type I membrane protein"
    assert loc["orientation"] == "Extracellular side"
    # Block note
    assert loc["note"] == "Isoform-specific annotation"


@patch("main.requests.get")
def test_entry_returns_function_text(mock_get):
    """Endpoint should extract FUNCTION comment text."""
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = _make_uniprot_entry(function_text="Involved in signal transduction.")
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    assert data["function"] == "Involved in signal transduction."


# ---------------------------------------------------------------------------
# Tests — edge cases
# ---------------------------------------------------------------------------


@patch("main.requests.get")
def test_entry_empty_subcellular_locations(mock_get):
    """If the UniProt entry has no SUBCELLULAR LOCATION comment, return empty list."""
    payload = _make_uniprot_entry()
    # Strip out the subcellular location comment
    payload["comments"] = [c for c in payload["comments"] if c["commentType"] != "SUBCELLULAR LOCATION"]

    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = payload
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    assert data["subcellularLocations"] == []


@patch("main.requests.get")
def test_entry_submission_name_fallback(mock_get):
    """If there is no recommendedName, fall back to submissionNames."""
    payload = _make_uniprot_entry()
    payload["proteinDescription"] = {"submissionNames": [{"fullName": {"value": "Unreviewed Protein"}}]}

    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = payload
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    assert data["proteinName"] == "Unreviewed Protein"


@patch("main.requests.get")
def test_entry_no_function_text(mock_get):
    """If entry has no FUNCTION comment, function field should be empty string."""
    payload = _make_uniprot_entry()
    payload["comments"] = [c for c in payload["comments"] if c["commentType"] != "FUNCTION"]

    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = payload
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    assert data["function"] == ""


# ---------------------------------------------------------------------------
# Tests — failure modes
# ---------------------------------------------------------------------------


@patch("main.requests.get")
def test_entry_upstream_failure_returns_502(mock_get):
    """When UniProt is unreachable, the endpoint must return 502 Bad Gateway."""
    import requests as req_lib

    mock_get.side_effect = req_lib.RequestException("Connection refused")

    resp = client.get("/api/uniprot/entry/P00001")

    assert resp.status_code == 502
    assert "UniProt" in resp.json()["detail"]


@patch("main.requests.get")
def test_entry_location_with_empty_value_is_skipped(mock_get):
    """Location entries with no location value must be silently skipped."""
    payload = _make_uniprot_entry(
        subcellular_locations=[
            {"location": {"value": "", "id": ""}, "topology": None, "orientation": None},
            {"location": {"value": "Mitochondrion", "id": "SL-0173"}, "topology": None, "orientation": None},
        ]
    )

    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.json.return_value = payload
    mock_get.return_value = mock_response

    resp = client.get("/api/uniprot/entry/P12345")
    data = resp.json()

    # Only the valid location should appear
    assert len(data["subcellularLocations"]) == 1
    assert data["subcellularLocations"][0]["location"] == "Mitochondrion"
