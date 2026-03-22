import pytest
from pydantic import ValidationError
from main import PredictRequest


def test_valid_sequence():
    """Test that a valid 10+ length sequence passes formatting and validation."""
    req = PredictRequest(sequence="MACDEFGHIK")
    assert req.sequence == "MACDEFGHIK"


def test_lowercase_and_whitespace():
    """Test that spaces and lowercase characters are stripped and uppercased."""
    req = PredictRequest(sequence="m a c d e f g h i k")
    assert req.sequence == "MACDEFGHIK"


def test_invalid_characters():
    """Test that invalid amino acids throw a clear ValidationError."""
    with pytest.raises(ValidationError) as exc:
        PredictRequest(sequence="MACXGOPQRST")

    error_msg = str(exc.value)
    assert "Sequence contains invalid characters" in error_msg
    assert "O, X" in error_msg


def test_short_sequence():
    """Test that a sequence under 10 characters is rejected by Pydantic."""
    with pytest.raises(ValidationError) as exc:
        PredictRequest(sequence="MAC")
    assert "String should have at least 10 characters" in str(exc.value)
