# Backend Testing Guide 🧪

This document outlines the testing conventions, libraries, and instructions for writing tests in the Protly FastAPI Backend application.

## Libraries & Stack

1. **[Pytest](https://pytest.org/)**: The premier Python testing framework. It makes it easy to write small, readable tests, and scales to support complex functional testing.
2. **[FastAPI TestClient](https://fastapi.tiangolo.com/tutorial/testing/)**: A built-in class powered by `httpx`. It allows us to send HTTP requests to our FastAPI app directly in Python without spinning up a real server on a port.
3. **[Pytest-Asyncio](https://pytest-asyncio.readthedocs.io/en/latest/)**: Allows us to write asynchronous (`async def`) tests natively in Pytest.
4. **[unittest.mock](https://docs.python.org/3/library/unittest.mock.html)**: Native Python library for mocking dependencies (like external network calls to the UniProt network or ESMAtlas).

---

## How to Run the Tests

To run the entire Backend test suite:
```bash
pytest tests/
```

To run a single test file with verbose output:
```bash
pytest tests/test_api.py -v
```

To enforce code style standards (these also run in our CI pipeline):
```bash
black .          # Automatically formats python files
flake8 .         # Analyzes code for PEP8 violations and unused imports
```

---

## How to Write a Test

1. **Where to place tests**: Place new files inside the `backend/tests/` folder.
2. **Naming convention**: Python test files **must** begin with `test_` (e.g., `test_validation.py`). Inside the file, test functions **must** also begin with `test_` (e.g., `def test_predict_endpoint():`).

### Example 1: Testing Pure Python Logic (Pydantic Validation)

If you are verifying validation or data transformation, you can just import the class and test it directly.

```python
import pytest
from pydantic import ValidationError
from main import PredictRequest

def test_short_sequence():
    """Verify that sequences under 10 chars correctly throw an error."""
    with pytest.raises(ValidationError) as exc:
        PredictRequest(sequence="MAC")
    
    assert "String should have at least 10 characters" in str(exc.value)
```

### Example 2: Testing an API Route (Integration)

To test an API endpoint like `/api/predict`, use the `TestClient`. Note that any external API calls made by your endpoint (e.g., `requests.post`) **should be mocked** so your tests run offline and quickly.

```python
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import main

# If testing public functionality and avoiding middleware token checks:
main.SUPABASE_JWT_SECRET = "" 

client = TestClient(main.app)

@patch("main.requests.post")
def test_predict_endpoint_success(mock_post):
    """Test our API assuming upstream ESMAtlas returns success."""
    
    # 1. Setup the Mock response
    class MockResponse:
        def raise_for_status(self): pass
        text = "ATOM      1  N   MET A   1      27.340  24.430   2.314  1.00 85.00           N  "
    mock_post.return_value = MockResponse()
    
    # 2. Fire the test request
    response = client.post("/api/predict", json={"sequence": "MACDEFGHIKLMN"})
    
    # 3. Assertions
    assert response.status_code == 200
    assert "pdb" in response.json()
```

### Best Practices
- **Mock External Dependencies**: Never make real network calls in your test suite. It causes slow tests and "flaky" failures when the internet goes down. Mock `requests.get` and `requests.post`.
- **Test the Errors**: Don't just test the "Happy Path". Explicitly write tests that submit horrible data (wrong types, empty inputs) to assure the API returns a neat `422` or `400` instead of a server crash.
