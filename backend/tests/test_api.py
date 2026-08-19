import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_health():
    assert client.get("/health").json()["status"] == "ok"

def test_predict_shape():
    r = client.post("/predict", json={"text": "how are"})
    assert "suggestions" in r.json()
    assert isinstance(r.json()["suggestions"], list)
    assert len(r.json()["suggestions"]) <= 3
