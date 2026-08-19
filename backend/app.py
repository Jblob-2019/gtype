from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path

from engine import NgramEngine
import llm

app = FastAPI(title="GhostType")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("GHOSTTYPE_MODEL", "data/model.pkl")
PERSONAL_PATH = os.getenv("GHOSTTYPE_PERSONAL", "data/personal.txt")
DEFAULTS_PATH = os.getenv("GHOSTTYPE_DEFAULTS", "../data/default_phrases.txt")
# Blend weight: 0 = pure base, 1 = pure personal. Default 0.3 (per PLAN §2.5).
PERSONAL_WEIGHT = float(os.getenv("GHOSTTYPE_PERSONAL_WEIGHT", "0.3"))

# In dev mode, we might start before model.pkl is generated, so handle it gracefully
try:
    engine = NgramEngine.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: could not load model from {MODEL_PATH}: {e}")
    engine = NgramEngine() # Fallback empty engine

# ponytail: backfill personal-table attributes on pickles from pre-teach code.
# Old models saved before Phase 1.5 lack p_unigrams/p_bigrams/p_trigrams/personal_weight.
for _attr, _default in (
    ("p_unigrams", None),
    ("p_bigrams", None),
    ("p_trigrams", None),
    ("personal_weight", 0.3),
):
    if not hasattr(engine, _attr) or getattr(engine, _attr, None) is None:
        from collections import Counter, defaultdict as _dd
        if _attr == "p_unigrams": setattr(engine, _attr, Counter())
        elif _attr in ("p_bigrams", "p_trigrams"):
            setattr(engine, _attr, _dd(Counter))
        else:
            setattr(engine, _attr, _default)

engine.personal_weight = PERSONAL_WEIGHT
# Note: pickle migration (p_unigrams/p_bigrams/p_trigrams backfill) is handled
# by NgramEngine.__setstate__ in engine.py — no inline backfill needed here.

# ponytail: load persisted personal vocab on startup so taught words survive restarts.
_personal_file = Path(PERSONAL_PATH)
if _personal_file.exists():
    _loaded = 0
    for line in _personal_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line:
            engine.teach(line)
            _loaded += 1
    print(f"Loaded {_loaded} personal phrases from {PERSONAL_PATH}")
else:
    _personal_file.parent.mkdir(parents=True, exist_ok=True)
    _personal_file.touch()

# ponytail: fold default phrases into PERSONAL tables so they get the personal_weight
# boost at predict time — same treatment as user-taught words, no manual teach needed.
# Defaults live in the repo (tracked) and are loaded fresh on every startup.
_defaults_file = Path(DEFAULTS_PATH)
if _defaults_file.exists():
    _dloaded = 0
    for line in _defaults_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            engine.teach(line)
            _dloaded += 1
    print(f"Loaded {_dloaded} default phrases from {DEFAULTS_PATH}")
else:
    print(f"warn: {DEFAULTS_PATH} not found — defaults not loaded")

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    suggestions: list[str]

class TeachRequest(BaseModel):
    phrases: list[str]

class TeachResponse(BaseModel):
    taught: int
    vocab_size: int

class RewriteRequest(BaseModel):
    text: str
    tone: str   # "formal" | "friendly" | "informal"

class RewriteResponse(BaseModel):
    rewritten: str
    source: str   # "cloud" | "local" | "error"

class GrammarRequest(BaseModel):
    text: str

class GrammarResponse(BaseModel):
    corrected: str
    source: str

@app.get("/health")
def health(): return {"status": "ok", "model": "ngram-v1", "personal_weight": PERSONAL_WEIGHT, "llm_cloud": llm.CLOUD_MODEL, "llm_local": llm.LOCAL_MODEL}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    # ponytail: pure N-gram prediction for instant response.
    # LLM fallback removed to guarantee zero-latency typing.
    return {"suggestions": engine.predict(req.text, k=3)}

# ponytail: append-only write to personal.txt — survives crashes, easy to edit by hand.
@app.post("/teach", response_model=TeachResponse)
def teach(req: TeachRequest):
    cleaned = [p.strip() for p in req.phrases if p and p.strip()]
    if not cleaned:
        return {"taught": 0, "vocab_size": len(engine.p_unigrams)}
    total_tokens = 0
    with _personal_file.open("a", encoding="utf-8") as f:
        for phrase in cleaned:
            total_tokens += engine.teach(phrase)
            f.write(phrase + "\n")
    return {"taught": len(cleaned), "vocab_size": len(engine.p_unigrams)}

@app.post("/rewrite", response_model=RewriteResponse)
def rewrite(req: RewriteRequest):
    """Tone-rewrite via Ollama (cloud primary, local fallback). Frontend shows preview."""
    out, source = llm.rewrite(req.text, req.tone)
    return {"rewritten": out, "source": source}

@app.post("/grammar", response_model=GrammarResponse)
def grammar(req: GrammarRequest):
    """Grammar and spelling correction via Ollama."""
    out, source = llm.check_grammar(req.text)
    return {"corrected": out, "source": source}
