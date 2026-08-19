"""
Ollama wrapper — cloud-first autocomplete + tone rewrite.

Two endpoints:
  • complete(text, k) → list[str] of next-word candidates (Tab-walkable)
  • rewrite(text, tone) → str rewritten in given tone

Models:
  • Cloud primary: qwen3.5:cloud (397B on Ollama's GPU fleet, fastest)
  • Local fallback: qwen3.5:4b (already installed, ~3.2 GB Q4_K_M)
  • N-gram last resort: returned by app.py using NgramEngine
"""
import os
import json
import urllib.request
import urllib.error
import urllib.parse
from typing import List

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# ponytail: tier list — tried in order, first success wins. Cloud first for speed,
# local fallback for offline, last resort = n-gram (handled in app.py).
CLOUD_MODEL  = os.getenv("GHOSTTYPE_LLM_CLOUD",  "gemma4:31b-cloud")
LOCAL_MODEL  = os.getenv("GHOSTTYPE_LLM_LOCAL",  "qwen3.5:4b")

# Hard timeout per Ollama call. Cloud usually 80-300ms; local 100-400ms.
# Past this we give up and let app.py fall back to n-gram.
TIMEOUT_S = float(os.getenv("GHOSTTYPE_LLM_TIMEOUT", "1.5"))


def _post(path: str, payload: dict, timeout: float = TIMEOUT_S) -> dict:
    """POST JSON to Ollama, return parsed response. Raises on non-2xx or timeout."""
    url = f"{OLLAMA_HOST}{path}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _ollama_ok() -> bool:
    """Health-check — is Ollama running and reachable? Cheap GET /api/tags."""
    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=0.5) as r:
            return r.status == 200
    except Exception:
        return False


def _try_complete(model: str, text: str, k: int) -> List[str]:
    """
    Ask Ollama for the next k words of natural continuation.
    Prompt: imperative, constrained — return ONLY the words, no punctuation, no quotes.
    Returns [] on any failure so caller can try the next tier.
    """
    prompt = (
        f"Continue this text naturally with the next 1 to {k} words.\n"
        f"Return ONLY the continuation words separated by single spaces.\n"
        f"No punctuation. No quotes. No explanation.\n\n"
        f"Text: {text}\n"
        f"Continuation:"
    )
    try:
        r = _post("/api/generate", {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.4,    # ponytail: low temp — predictable autocomplete, not creative prose
                "num_predict": 12,     # cap token generation to ~12 (a few words + safety)
                "stop": ["\n", "."],   # stop at sentence boundary — we want fragments, not sentences
            },
        })
        raw = (r.get("response") or "").strip()
    except Exception:
        return []
    # Parse: split on whitespace, drop empties, strip punctuation/quotes, keep first k.
    words: List[str] = []
    for tok in raw.split():
        cleaned = "".join(c for c in tok if c.isalpha() or c == "'" or c.isdigit()).lower()
        if cleaned and cleaned not in ("<s>", "</s>"):
            words.append(cleaned)
        if len(words) >= k:
            break
    return words


def complete(text: str, k: int = 3) -> tuple[List[str], str]:
    """
    Cloud-first autocomplete. Returns (suggestions, source) where source ∈
    {"cloud", "local", "none"}. App.py fills "none" with n-gram fallback.
    """
    if not _ollama_ok():
        return [], "none"
    cloud = _try_complete(CLOUD_MODEL, text, k)
    if cloud:
        return cloud, "cloud"
    local = _try_complete(LOCAL_MODEL, text, k)
    if local:
        return local, "local"
    return [], "none"


# ponytail: tone-rewrite prompt. Imperative, tight constraints, JSON return so we
# can parse cleanly. Few-shot examples anchor the model — qwen3.5:4b respects them.
REWRITE_PROMPT = """\
You are a writing assistant. Rewrite the user's sentence in the requested tone.

Return ONLY a JSON object with one key "rewritten" containing the rewritten sentence.
No markdown, no explanation, no preamble.

Tone definitions:
- formal:    professional, polite, complete sentences. No contractions.
- friendly:  warm, conversational, contractions OK, slight enthusiasm.
- informal:  casual, terse, slang-friendly, may drop filler words.

Example:
Input: "hey i need the report by friday thanks"
Tone: formal
Output: {"rewritten": "Could you please send me the report by Friday? Thank you."}

Example:
Input: "i need the report by friday"
Tone: friendly
Output: {"rewritten": "Hey! Could you get me the report by Friday? Thanks a ton!"}

Example:
Input: "I need the report by Friday."
Tone: informal
Output: {"rewritten": "need the report by friday pls"}

Input: {text}
Tone: {tone}
Output:"""

GRAMMAR_PROMPT = """\
You are a grammar and spelling checker. Review the user's text and correct any spelling or grammatical errors.
If the text is already correct, return it exactly as it is.
Do not change the tone, style, or meaning of the text. Only fix clear errors.
CRITICAL: Do NOT capitalize the entire text. Do NOT change words to ALL CAPS unless they are acronyms. Preserve the user's original casing as much as possible, only applying capitalization where strictly required by English grammatical rules (e.g., the first letter of a sentence, proper nouns, and the pronoun 'I').

Return ONLY a JSON object with one key "corrected" containing the corrected text.
No markdown, no explanation, no preamble.

Example:
Input: "they is going to the store"
Output: {"corrected": "they are going to the store"}

Example:
Input: "This is perfectly fine."
Output: {"corrected": "This is perfectly fine."}

Input: {text}
Output:"""


def rewrite(text: str, tone: str) -> tuple[str, str]:
    """
    Rewrite `text` in the given tone via cloud (preferred) or local.
    Returns (rewritten_text, source) — source ∈ {"cloud", "local", "error"}.
    On error returns ("", "error").
    """
    if not text.strip():
        return "", "error"
    if tone not in ("formal", "friendly", "informal"):
        tone = "friendly"

    prompt = REWRITE_PROMPT.replace("{text}", text).replace("{tone}", tone)

    def _call(model: str) -> str:
        try:
            r = _post("/api/generate", {
                "model": model,
                "prompt": prompt,
                "stream": False,
                # "format": "json",     # Removed as it causes gemma4 to break or output plain strings
                "options": {
                    "temperature": 0.7,   # slightly higher than autocomplete — creative rephrasing
                    "num_predict": 200,    # a sentence is ~30 tokens
                },
            }, timeout=8.0)
            
            resp_text = (r.get("response") or "").strip()
            # Try to extract JSON if it was wrapped in markdown
            if resp_text.startswith("```json"):
                resp_text = resp_text.replace("```json", "").replace("```", "").strip()
            
            try:
                payload = json.loads(resp_text)
                return payload.get("rewritten", "").strip()
            except json.JSONDecodeError:
                # Fallback if the model just output the raw sentence instead of JSON
                if resp_text.startswith("{"): return ""
                return resp_text
        except Exception:
            return ""

    if _ollama_ok():
        out = _call(CLOUD_MODEL)
        if out:
            return out, "cloud"
        out = _call(LOCAL_MODEL)
        if out:
            return out, "local"
    return "", "error"


def check_grammar(text: str) -> tuple[str, str]:
    """
    Check and correct grammar/spelling for `text` via cloud (preferred) or local.
    Returns (corrected_text, source).
    If no correction is needed or on error, returns the original text.
    """
    if not text.strip():
        return text, "error"

    prompt = GRAMMAR_PROMPT.replace("{text}", text)

    def _call(model: str) -> str:
        try:
            r = _post("/api/generate", {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.2,   # low temp for grammar corrections
                    "num_predict": 200,
                },
            }, timeout=8.0)
            
            resp_text = (r.get("response") or "").strip()
            if resp_text.startswith("```json"):
                resp_text = resp_text.replace("```json", "").replace("```", "").strip()
                
            try:
                payload = json.loads(resp_text)
                return payload.get("corrected", "").strip()
            except json.JSONDecodeError:
                if resp_text.startswith("{"): return ""
                return resp_text
        except Exception:
            return ""

    if _ollama_ok():
        out = _call(CLOUD_MODEL)
        if out:
            return out, "cloud"
        out = _call(LOCAL_MODEL)
        if out:
            return out, "local"
    return text, "error"