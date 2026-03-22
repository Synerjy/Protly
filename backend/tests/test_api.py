from fastapi.testclient import TestClient
from unittest.mock import patch
import main

# Force bypass of JWT auth for testing by removing the secret
main.SUPABASE_JWT_SECRET = ""

client = TestClient(main.app)


def test_health_check():
    """Test that the public health check endpoint works."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("main.requests.post")
def test_predict_upstream_failure(mock_post):
    """Test that upstream API errors are caught and surfaced via 502 Bad Gateway."""
    # Mimic a connection error or timeout from ESMAtlas
    import requests

    mock_post.side_effect = requests.RequestException("Connection error")

    response = client.post("/api/predict", json={"sequence": "MACDEFGHIKLMN"})

    assert response.status_code == 502
    assert "Prediction Request Failed" in response.json()["detail"] or "ESMAtlas" in response.json()["detail"]


def test_predict_invalid_schema():
    """Test that submitting completely broken JSON to predict returns 422 Unprocessable Entity."""
    response = client.post("/api/predict", json={"wrong_key": "MACD"})
    assert response.status_code == 422
