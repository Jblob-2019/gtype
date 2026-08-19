import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from engine import NgramEngine

def test_unigram_fallback():
    eng = NgramEngine()
    eng.fit(["the cat sat", "the dog ran", "the cat ran"])
    assert "cat" in eng.predict("the") or "dog" in eng.predict("the")

def test_bigram_used_when_present():
    eng = NgramEngine()
    eng.fit(["how are you", "how are they", "how are we"])
    sugs = eng.predict("how are")
    assert set(sugs) >= {"you", "they", "we"}  # at least the trained ones appear

def test_trigram_beats_bigram():
    eng = NgramEngine()
    eng.fit(["i love you", "i love pizza", "you love cats"])
    assert "pizza" in eng.predict("i love")  # trigram from (i,love)->pizza

def test_empty_input_does_not_crash():
    eng = NgramEngine()
    eng.fit(["hello world"])
    assert isinstance(eng.predict(""), list)

def test_unknown_context_returns_something():
    eng = NgramEngine()
    eng.fit(["hello world"])
    assert len(eng.predict("xyzzy")) >= 1  # falls back to unigrams
