# GhostType — Build Plan (Extra-Detailed)

> Companion to [OVERVIEW.md](./OVERVIEW.md) and the original [PRD.md](./PRD.md) / [TRD.md](./TRD.md). This is the **execution doc** — every phase has files, contracts, tests, and acceptance criteria. Built around the chosen stack: **plain HTML/CSS/JS frontend**, **FastAPI backend**, **hand-rolled n-gram engine**, **Cornell Movie-Dialogs corpus**, **single-command dev startup** (`npm run dev` → backend `:4000`, frontend `:3000`).

---

## 0. Repository layout (target)

> Repo root is **`gtype/`** (https://github.com/Jblob-2019/gtype). The persistent AI-agent journal [documentation.md](../documentation.md) lives one level up at `GhostType/` — outside the repo on purpose.

```
gtype/                                    ← repo root (this is what gets pushed)
├── .gitattributes
├── .gitignore                             # ignores venv, node_modules, model.pkl, raw corpus
├── package.json                           # Root: `npm run dev` orchestrates both services
├── WORKFLOW.yml                           # Self-bootstrapping dev workflow spec (also runnable)
├── README.md                              # Quickstart pointer doc
├── PRD.md                                 # Original product requirements
├── TRD.md                                 # Original technical requirements
├── docs/
│   ├── OVERVIEW.md                        # 1-page product framing
│   └── PLAN.md                            # this file
├── data/
│   └── cornell/                           # Downloaded Cornell Movie-Dialogs corpus (raw text, gitignored)
├── backend/
│   ├── app.py                             # FastAPI entry, /predict + /health
│   ├── engine.py                          # NgramEngine class — unigram/bigram/trigram tables + predict()
│   ├── train.py                           # CLI: build model from corpus, save to data/model.pkl
│   ├── data/                              # trained artifacts (model.pkl, gitignored)
│   ├── tests/
│   │   ├── test_engine.py                 # Unit tests for NgramEngine.predict()
│   │   └── test_api.py                    # FastAPI TestClient smoke tests
│   └── requirements.txt                   # fastapi, uvicorn, pydantic, pytest, httpx
└── frontend/
    ├── index.html                         # Chat bar + suggestion chips
    ├── styles.css                         # ChatGPT-like centered bar, dark mode friendly
    ├── app.js                             # Debounced /predict fetch, chip rendering, click-to-insert
    └── server.js                          # Tiny static server on :3000 (zero-dep Node http module)
```

**Sibling of the repo (NOT tracked, NOT pushed):**

```
GhostType/                                ← parent of gtype/, holds the persistent AI-agent journal
├── documentation.md                       # Long-form journal of all work done (lives forever outside the repo)
└── gtype/                                ← the actual repo (see above)
```

---

## 1. Phase 0 — Bootstrap (15 min)

**Goal:** Repo skeleton, Python venv, Node deps, "hello world" running.

### Tasks

| # | Task | File | Notes |
|---|------|------|-------|
| 0.1 | Create folder layout above | `backend/`, `frontend/`, `data/cornell/` | mkdir -p equivalents |
| 0.2 | Python venv + install deps | `backend/requirements.txt` | `python -m venv .venv && source .venv/bin/activate` (Windows: `.venv\Scripts\activate`) |
| 0.3 | Initialize npm + install `concurrently` | root `package.json` | `npm init -y && npm i -D concurrently` |
| 0.4 | Stub FastAPI `/health` returning `{"status":"ok"}` | `backend/app.py` | Validates uvicorn boots |
| 0.5 | Stub static server on `:3000` serving empty page | `frontend/server.js` + `frontend/index.html` | Use Node's built-in `http` module + `fs` to avoid extra deps, OR use `http-server` (1 dep) |
| 0.6 | Wire `npm run dev` to launch both | `package.json` scripts | See §6 for exact script |
| 0.7 | Smoke test: `curl localhost:4000/health` and visit `localhost:3000` | manual | Both green = Phase 0 done |

### Acceptance

- `npm run dev` boots backend on `:4000` AND frontend on `:3000` from a single command
- `/health` returns `200 {"status":"ok"}`
- `localhost:3000` shows a placeholder "GhostType booting…" page
- Stopping the script (Ctrl+C) cleanly kills both processes

### Risk

- **Windows path issues with `concurrently`**: ensure Node is in PATH. If `concurrently` hangs, fall back to `npm-run-all`.
- **Port already in use**: pick `:4000` for backend specifically (avoids common `:8000` collisions with other FastAPI projects).

---

## 2. Phase 1 — MVP (45–60 min, matches PRD's "hour 1")

**Goal:** Working chat bar with live n-gram suggestions, offline, end-to-end demo.

### 2A. Training data — Cornell Movie-Dialogs Corpus (10 min)

| # | Task | Detail |
|---|------|--------|
| 1.1 | Download corpus | `https://www.cs.cornell.edu/~cristian/Cornell_Movie-Dialogs_Corpus.html` → grab the ZIP, extract to `data/cornell/` |
| 1.2 | Pick the right file | `movie_lines.txt` contains one utterance per line (perfect for n-grams). Skip `movie_conversations.txt` (we don't need turn boundaries for word-level prediction). |
| 1.3 | Quick EDA | `wc -l data/cornell/movie_lines.txt` → expect ~300k lines. Spot-check 5 random lines for encoding issues. |
| 1.4 | Normalize | Lowercase, strip punctuation except intra-word apostrophes (`don't` → `don't`), collapse whitespace. Write normalized corpus to `backend/data/cornell_clean.txt`. |

**Normalization rules** (final, documented):
- Lowercase all text
- Strip leading/trailing whitespace
- Remove all punctuation except `'` (preserves contractions)
- Collapse internal whitespace to single space
- Drop lines shorter than 3 words (too noisy for n-grams)
- Drop duplicate lines (corpus has many)

### 2B. N-gram engine (15 min)

File: `backend/engine.py`

```python
# ponytail: hand-rolled n-grams beat markovify for this scale — explainable, zero deps,
# easy to swap. Upgrade path: swap this class for OllamaEngine behind same .predict() interface.
from collections import defaultdict, Counter
from typing import List, Tuple
import pickle

class NgramEngine:
    def __init__(self):
        self.unigrams: Counter = Counter()        # word -> count
        self.bigrams:  dict[Tuple[str], Counter] = defaultdict(Counter)  # (w,) -> {next: count}
        self.trigrams: dict[Tuple[str, str], Counter] = defaultdict(Counter)  # (w1,w2) -> {next: count}

    def fit(self, lines: List[str]):
        for line in lines:
            tokens = ["<s>"] + line.split() + ["</s>"]
            for t in tokens: self.unigrams[t] += 1
            for a, b in zip(tokens, tokens[1:]):
                self.bigrams[(a,)][b] += 1
            for a, b, c in zip(tokens, tokens[1:], tokens[2:]):
                self.trigrams[(a, b)][c] += 1

    # ponytail: SENTINELS must never appear in suggestions. Filter at every return path.
    SENTINELS = ("<s>", "</s>")

    def _clean(self, words, k):
        seen, out = set(), []
        for w in words:
            if w in self.SENTINELS or w in seen:
                continue
            seen.add(w); out.append(w)
            if len(out) >= k: break
        return out

    def predict(self, text: str, k: int = 3) -> List[str]:
        toks = ["<s>"] + text.lower().split()
        # Try trigram (last 2 words)
        if len(toks) >= 3:
            key = (toks[-2], toks[-1])
            cands = self.trigrams.get(key)
            if cands:
                return self._clean([w for w, _ in cands.most_common(k * 3)], k)
        # Bigram fallback (last word)
        if len(toks) >= 2:
            key = (toks[-1],)
            cands = self.bigrams.get(key)
            if cands:
                return self._clean([w for w, _ in cands.most_common(k * 3)], k)
        # Unigram fallback (top frequent, sentinels and dedupes already filtered)
        return self._clean([w for w, _ in self.unigrams.most_common(k * 4)], k)

    def save(self, path: str): pickle.dump(self, open(path, "wb"))
    @classmethod
    def load(cls, path: str) -> "NgramEngine": return pickle.load(open(path, "rb"))
```

**Acceptance for engine alone:**
- `python -c "from engine import NgramEngine; ..."` trains in <5s on cleaned Cornell
- `predict("how are")` returns non-empty list with at least one "you"-like word
- `predict("the")` falls back gracefully to top unigrams
- `predict("")` returns top unigrams (no crash)
- `predict("hello my name is")` returns `["jana", "janarthanana", …]` — covered by starter corpus
- `predict("</s>")` or `predict("<s>")` returns no sentinels in output (sentinels filtered)

### 2C. FastAPI backend (10 min)

File: `backend/app.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # used in Phase 2 for single-port deploy
from pydantic import BaseModel
import os

from engine import NgramEngine

app = FastAPI(title="GhostType")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

MODEL_PATH = os.getenv("GHOSTTYPE_MODEL", "data/model.pkl")
engine = NgramEngine.load(MODEL_PATH)

class PredictRequest(BaseModel):
    text: str

class PredictResponse(BaseModel):
    suggestions: list[str]

@app.get("/health")
def health(): return {"status": "ok", "model": "ngram-v1"}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    return {"suggestions": engine.predict(req.text, k=3)}
```

File: `backend/train.py`

```python
import argparse, pickle, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from engine import NgramEngine

def normalize(line: str) -> str:
    line = line.lower().strip()
    # Strip all punctuation except apostrophes inside words
    cleaned = "".join(c for c in line if c.isalpha() or c == "'" or c.isspace() or c.isdigit())
    return " ".join(cleaned.split())

def load_corpus(path: Path, encoding: str = "utf-8") -> list[str]:
    """Read + normalize a one-utterance-per-line corpus."""
    raw = path.read_text(encoding=encoding, errors="ignore").splitlines()
    return [normalize(l) for l in raw if len(l.split()) >= 2]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cornell", default="data/cornell/movie_lines.txt",
                    help="Cornell movie_lines.txt (encoding iso-8859-1)")
    ap.add_argument("--starter", default="data/starter_corpus.txt",
                    help="Hand-curated starter corpus (utf-8)")
    ap.add_argument("--out", dest="outp", default="backend/data/model.pkl")
    args = ap.parse_args()

    # ponytail: starter corpus (small, high-signal) gets DUPLICATED 50× during training
    # so it outweighs the noisy Cornell tail and dominates common-phrase predictions.
    STARTER_BOOST = 50
    cornell = load_corpus(Path(args.cornell), encoding="iso-8859-1")
    starter = load_corpus(Path(args.starter), encoding="utf-8")
    lines = cornell + starter * STARTER_BOOST
    lines = list({l for l in lines if l})  # dedupe exact lines, drop empties
    print(f"cornell: {len(cornell)}  starter×{STARTER_BOOST}: {len(starter)*STARTER_BOOST}  unique: {len(lines)}")

    eng = NgramEngine()
    eng.fit(lines)
    eng.save(args.outp)
    print(f"Saved model → {args.outp}")

if __name__ == "__main__": main()
```

**Acceptance:**
- `python train.py` writes `data/model.pkl` in <10s
- `uvicorn app:app --port 4000 --reload` boots
- `curl -X POST localhost:4000/predict -H 'Content-Type: application/json' -d '{"text":"how are"}'` returns 3 suggestions in JSON
- `curl localhost:4000/health` returns `{"status":"ok","model":"ngram-v1"}`
- `predict("hello my name is")` returns suggestions containing `jana` / `janarthanana` (starter corpus wins)
- NO suggestion ever equals `<s>` or `</s>` (sentinels filtered at every return path)

### 2D. Frontend chat bar (15 min)

File: `frontend/index.html` — single page, no build step, all inline `<script>` and `<link>` to `styles.css`.

**Layout:**
```
┌────────────────────────────────────────────────┐
│                                                │
│              GhostType                         │
│         Predictive text, locally               │
│                                                │
│   ┌────────────────────────────────────┐       │
│   │ how are|                          │ ◀ chat bar
│   └────────────────────────────────────┘       │
│       [ you ]   [ things ]   [ we ]            ◀ chips (above bar, like Gboard)
│                                                │
│              [    Send    ]                    │
└────────────────────────────────────────────────┘
```

File: `frontend/app.js` — minimal vanilla JS:

```js
// ponytail: 150ms debounce — short enough to feel live, long enough to skip mid-word churn.
const DEBOUNCE_MS = 150;
const API = "http://localhost:4000/predict";

const bar    = document.getElementById("bar");
const chips  = document.getElementById("chips");
const send   = document.getElementById("send");

let timer;
bar.addEventListener("input", () => {
  clearTimeout(timer);
  timer = setTimeout(fetchSuggestions, DEBOUNCE_MS);
});

async function fetchSuggestions() {
  const text = bar.value.trim();
  if (!text) { chips.innerHTML = ""; return; }
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({text}),
    });
    const {suggestions} = await r.json();
    renderChips(suggestions);
  } catch (e) {
    chips.innerHTML = "";  // fail silently — never block the typing UX
  }
}

function renderChips(words) {
  chips.innerHTML = "";
  for (const w of words) {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = w;
    b.onclick = () => {
      bar.value = bar.value.trimEnd() + " " + w + " ";
      bar.focus();
      fetchSuggestions();  // re-predict on new context immediately
    };
    chips.appendChild(b);
  }
}

send.onclick = () => {
  // MVP: just clear. Phase 2: persist to /history.
  console.log("[GhostType] sent:", bar.value);
  bar.value = "";
  chips.innerHTML = "";
};
```

File: `frontend/styles.css` — ChatGPT-ish dark theme:

```css
:root {
  --bg: #0f0f0f;  --fg: #ececec;  --muted: #8e8e8e;
  --bar: #2a2a2a; --accent: #10a37f; --chip: #3a3a3a;
}
body {
  background: var(--bg); color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 100vh; margin: 0;
}
h1 { font-weight: 600; letter-spacing: -0.5px; }
.subtitle { color: var(--muted); margin-bottom: 2rem; }
#bar {
  width: min(640px, 92vw); padding: 14px 18px;
  background: var(--bar); border: 1px solid #333; border-radius: 12px;
  color: var(--fg); font-size: 16px; outline: none;
}
#bar:focus { border-color: var(--accent); }
#chips { margin: 12px 0; display: flex; gap: 8px; min-height: 36px; }
.chip {
  background: var(--chip); color: var(--fg); border: 1px solid #444;
  padding: 6px 14px; border-radius: 999px; cursor: pointer; font-size: 14px;
}
.chip:hover { background: var(--accent); border-color: var(--accent); }
#send {
  margin-top: 8px; background: var(--accent); color: white;
  border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer;
}
```

File: `frontend/server.js` — minimal static server on `:3000`:

```js
// ponytail: zero-dep static server. ~25 lines. http-server is fine too but this is one less dep.
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname, port = 3000;
const mime = { ".html":"text/html", ".css":"text/css", ".js":"application/javascript" };

http.createServer((req, res) => {
  let url = req.url === "/" ? "/index.html" : req.url;
  const p = path.join(root, url);
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, {"Content-Type": mime[path.extname(p)] || "text/plain"});
    res.end(data);
  });
}).listen(port, () => console.log(`frontend → http://localhost:${port}`));
```

**Acceptance for Phase 1:**
- Open `localhost:3000`, see the chat bar
- Type "how are" → within 150ms+network, see chips like `you things we`
- Click a chip → it inserts into the bar, new chips appear for new context
- Hit Send → input clears
- Disable WiFi entirely → everything still works (offline ✓)

---

## 2.5 Phase 1.5 — Teach-a-word (30 min, ships in MVP)

**Goal:** A `+` button inside the chat bar lets the user feed custom words / short phrases / a whole list of them straight into the running model's personalization tables — no rebuild, no restart, instant effect.

### Why this exists (and why now)
- Jana's actual usage: typing the same words ("jana", "janarthanana", project names, jargon) constantly. The starter corpus helps, but the user's own vocabulary is the highest-signal data possible.
- Personalization was planned for Phase 2 (3.4) but it relies on "blend personal Counter into base predict()". The teach feature needs the same plumbing — so we add it now and Phase 2.4 becomes "use typed history the same way".

### UX

```
┌────────────────────────────────────────────────────┐
│              GhostType                             │
│         Predictive text, locally                   │
│                                                    │
│   ┌──────────────────────────────┬─────────┐       │
│   │ how are                     │   +     │ ◀ + button INSIDE the bar
│   └──────────────────────────────┴─────────┘       │
│       [ you ]   [ things ]   [ we ]                │
│                                                    │
│              [    Send    ]                        │
└────────────────────────────────────────────────────┘
```

Clicking `+` opens a small popover anchored to the button:

```
┌──────────────────────────────────────┐
│  Teach GhostType a word or phrase    │
│  �──────────────────────────────┐    │
│  │ janarthanana                 │    │
│  └──────────────────────────────┘    │
│  [Teach single]  [Teach list…]      │
└──────────────────────────────────────┘
```

- **Teach single** — teaches the single string in the input box (normalized same way as training data).
- **Teach list** — opens a larger textarea where the user pastes a list of words/phrases, one per line. Each line taught. (Phase 2 lets them import a file; Phase 1.5 is paste-only.)
- After teaching, the popover shows a small confirmation: "Taught 12 words ✓" → auto-closes in 1.2s.
- Suggestions re-trigger immediately — the new words appear in chips within the next keystroke.

### Backend

New endpoint `POST /teach` — request:

```json
{
  "phrases": ["janarthanana", "ghosttype", "self-hosted predictive text"]
}
```

Response:
```json
{ "taught": 3, "vocab_size": 1247 }
```

Engine changes:

```python
# ponytail: in-memory personalization tables + periodic snapshot to disk.
# No retrain on every teach — O(1) per insert via Counter increment.
class NgramEngine:
    def teach(self, phrase: str):
        """Normalize + fold a user-supplied phrase into the personal tables."""
        toks = ["<s>"] + normalize(phrase).split() + ["</s>"]
        for t in toks: self.personal_unigrams[t] += 1
        for a, b in zip(toks, toks[1:]):
            self.personal_bigrams[(a,)][b] += 1
        for a, b, c in zip(toks, toks[1:], toks[2:]):
            self.personal_trigrams[(a, b)][c] += 1
        self._dirty = True  # snapshot on shutdown or every N teaches

    def predict(self, text, k=3):
        base    = self._top(self.trigrams, self.bigrams, self.unigrams, text, k*4)
        personal = self._top(self.personal_trigrams, self.personal_bigrams, self.personal_unigrams, text, k*4)
        return self._blend(base, personal, k)  # 0.7 base + 0.3 personal by default
```

**Why blend, not replace:** user-taught words surface first, but base-model words don't disappear. If the user teaches "ghosttype", it gets boosted, but "how are you" still works.

**Persistence:**
- On every teach, append the normalized phrase to `backend/data/personal.txt` (one per line).
- On server startup, `app.py` reads `personal.txt` and folds it into the personal tables before serving.
- Personal tables stay in memory; `personal.txt` is the durable record.

### Frontend (`frontend/app.js` addition)

```js
// ponytail: minimal — open popover, POST, close. No framework.
const teachBtn = document.getElementById("teach");
const pop      = document.getElementById("teach-pop");
teachBtn.onclick = () => { pop.hidden = false; pop.querySelector("input").focus(); };

document.getElementById("teach-single").onclick = async () => {
  const phrase = pop.querySelector("input").value.trim();
  if (!phrase) return;
  await fetch("http://localhost:4000/teach", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({phrases:[phrase]}),
  });
  await confirm("Taught ✓");
  pop.hidden = true; fetchSuggestions();  // re-predict with new context
};

document.getElementById("teach-list").onclick = async () => {
  const lines = pop.querySelector("textarea").value.split("\n").map(s=>s.trim()).filter(Boolean);
  if (!lines.length) return;
  await fetch("http://localhost:4000/teach", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({phrases:lines}),
  });
  await confirm(`Taught ${lines.length} ✓`);
  pop.hidden = true; fetchSuggestions();
};
```

### CSS addition

```css
#bar-wrap { display: flex; gap: 8px; align-items: center; }
#teach {
  width: 36px; height: 36px; border-radius: 50%;
  background: var(--accent); color: white; border: none;
  font-size: 22px; cursor: pointer; flex-shrink: 0;
}
#teach-pop {
  position: absolute; margin-top: 12px;
  background: var(--bar); border: 1px solid #444; border-radius: 12px;
  padding: 12px; display: flex; flex-direction: column; gap: 8px;
  min-width: 280px;
}
#teach-pop[hidden] { display: none; }
#teach-pop input, #teach-pop textarea {
  background: #1a1a1a; color: var(--fg); border: 1px solid #333;
  border-radius: 8px; padding: 8px; font: inherit;
}
#teach-pop button {
  background: var(--accent); color: white; border: none;
  padding: 8px; border-radius: 6px; cursor: pointer;
}
```

### Acceptance for Phase 1.5

- `+` button visible inside the chat bar (right edge)
- Clicking `+` opens the popover; clicking outside or pressing Esc closes it
- Teach "janarthanana" → typing "hello my name is" shows `janarthanana` as the first chip
- Teach a list of 50 words via paste → confirm "Taught 50 ✓" → next keystroke uses them
- Restart server (`Ctrl+C`, `npm run dev` again) → all taught words persist (loaded from `personal.txt`)
- `personal.txt` is gitignored (it's user-private vocabulary, not shared)
- `predict()` blends correctly: taught words rank higher, base words still appear

---

## 3. Phase 2 — Polish & Personalization (3–6 hours)

### 3.1 Keyboard navigation (45 min)

- **Tab** from inside the input → highlights first chip
- **Arrow keys** (or `Tab` again) → cycles chips
- **Enter** on a chip → inserts it (Enter alone in empty input still sends)
- Implementation: keep a `selectedChipIndex` state, render with `.chip.selected` class, intercept keydown.

### 3.2 Phrase-level suggestions (1–2 hours)

Currently `predict()` returns 1-word completions. Add phrase mode:

```python
def predict_phrase(self, text: str, max_len: int = 3) -> List[str]:
    """Return top continuations of 1–max_len words, scored by joint probability."""
    # Walk the trigram chain greedily until <s> sentinel or max_len hit.
    # Score = product of per-step counts (or sum of log-counts for stability).
```

UI: keep word chips, but add a small **"→"** between them showing they're a phrase suggestion. Click inserts the whole phrase.

### 3.3 Persistence — SQLite history (1 hour)

New table:
```sql
CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  ts TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- New endpoint `POST /history` body `{text}` → inserts row, returns `{"id": N}`
- New endpoint `GET /history?limit=20` → returns recent rows for a side-panel UI
- Send button now actually POSTs to `/history` (replaces console.log in MVP)
- Add `data/history.db` to `.gitignore`

### 3.4 Personalization — auto-teach from typed history (1 hour, mostly wiring)

> **Done in Phase 1.5.** The hard work — personal tables, blend in `predict()`, persistence to `personal.txt` — already shipped with the `+` button. Phase 2.4 just adds: every `Send` automatically calls `engine.teach(text)` behind the scenes, so the user doesn't have to press `+` for words they typed and sent.
>
> Acceptance: send "let's ship the ghosttype MVP" → next typing of "let's" shows `ship` ranked first.

### 3.5 Multiple corpus profiles (45 min)

- Allow `corpus/profile/<name>/` directories with `.txt` files
- `POST /predict` body now includes `"profile": "casual" | "technical" | "code"`
- Switch via a small dropdown in the header
- Default: `casual` (Cornell + your chat export)

---

## 4. Phase 3 — Engine swap to local LLM (optional, 2–4 hours)

**Why:** Trigram tops out around 80% accuracy for chat-style text. For smarter, context-aware suggestions, swap to a tiny local LLM behind the **same** `/predict` endpoint.

### Steps
1. Install [Ollama](https://ollama.com/) locally: `ollama pull llama3.2:1b` (or `phi3:mini`)
2. New file: `backend/llm_engine.py` with class `OllamaEngine` exposing `predict(text, k=3) -> list[str]`
3. Prompt strategy:
   ```
   System: You are a next-word autocomplete engine. Given the user's partial
   sentence, output the top 3 most likely next words as a JSON array of strings.
   Output ONLY the JSON. No prose.
   User: how are
   Assistant: ["you", "things", "we"]
   ```
4. Backend route picks engine based on env var: `GHOSTTYPE_ENGINE=llm|ngram`
5. Add a small **engine badge** in the UI showing which one is active (debug-only toggle)
6. Latency note: LLM inference ~200–500ms per call. Bump frontend debounce to 300ms, show a subtle typing indicator.

### Acceptance
- Switch env var → `/predict` returns LLM suggestions without frontend change
- Suggestions for "the meaning of" are noticeably more semantically coherent than n-gram

---

## 5. Tests & quality gates

### Engine unit tests — `backend/tests/test_engine.py`

```python
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
```

### API smoke tests — `backend/tests/test_api.py`

```python
from fastapi.testclient import TestClient
from app import app
client = TestClient(app)

def test_health(): assert client.get("/health").json()["status"] == "ok"

def test_predict_shape():
    r = client.post("/predict", json={"text": "how are"})
    assert "suggestions" in r.json()
    assert isinstance(r.json()["suggestions"], list)
    assert len(r.json()["suggestions"]) <= 3
```

### Frontend — minimal manual checklist
- Type 5 different sentences → suggestions appear each time
- Click a chip → chip inserts, new suggestions appear
- Refresh page → still works (no state required)
- Open DevTools Network → only call is to `localhost:4000/predict`

### CI (optional, Phase 2)
- GitHub Actions: `pytest backend/` on every push
- Curl `localhost:3000` and `/health` in a smoke job if you containerize

---

## 6. Single-command dev workflow (`npm run dev`)

This is the **deploy-and-run story**: one command boots both services.

### `package.json` (root)

```json
{
  "name": "ghosttype",
  "version": "0.1.0",
  "private": true,
  "description": "Local predictive-text chat bar (FastAPI + n-gram + plain JS)",
  "scripts": {
    "dev":       "concurrently -n backend,frontend -c blue,green \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend":  "cd backend && .venv\\Scripts\\python -m uvicorn app:app --port 4000 --reload",
    "dev:frontend": "node frontend/server.js",
    "train":     "cd backend && .venv\\Scripts\\python train.py",
    "test":      "cd backend && .venv\\Scripts\\python -m pytest tests/ -q",
    "build":     "echo 'no build step — vanilla frontend' && exit 0"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

> **Windows note:** paths use `\\` and `Scripts\\python` for the venv activator. POSIX users swap to `backend/.venv/bin/python` and forward slashes — keep both variants in a `package.json` comment block if you cross-platform.

### `WORKFLOW.yml` — document + reference (also runnable as a Make target if you ever want)

```yaml
# GhostType dev workflow — single command boots backend :4000 + frontend :3000.
# `npm run dev` is the canonical entry. This file documents the orchestration for ops reference.
name: ghosttype-dev
version: 1

services:
  backend:
    description: "FastAPI prediction engine (n-gram MVP)"
    cwd: backend
    command:
      # Windows:
      - ".venv\\Scripts\\python"
      # POSIX (uncomment for Mac/Linux):
      # - ".venv/bin/python"
      - "-m"
      - "uvicorn"
      - "app:app"
      - "--port"
      - "4000"
      - "--reload"
    port: 4000
    healthcheck:
      url: http://localhost:4000/health
      expect: status == "ok"
    prerequisites:
      - ".venv exists (python -m venv backend/.venv)"
      - "backend/requirements.txt installed (.venv\\Scripts\\pip install -r requirements.txt)"
      - "data/model.pkl exists (npm run train)"

  frontend:
    description: "Vanilla HTML/JS chat bar, static-served on :3000"
    cwd: frontend
    command:
      - "node"
      - "server.js"
    port: 3000
    prerequisites:
      - "Node 18+"

orchestrator:
  tool: npm-run-script (concurrently)
  entrypoint: "npm run dev"
  parallel: true
  logs:
    backend:  blue
    frontend: green
  shutdown:
    signal: SIGINT  # Ctrl+C cleanly tears down both

ports:
  frontend: 3000
  backend:  4000

deploy_steps:
  - "git clone <repo>"
  - "cd GhostType"
  - "python -m venv backend/.venv"           # Windows: py -3 -m venv backend/.venv
  - "backend\\.venv\\Scripts\\pip install -r backend/requirements.txt"  # POSIX: backend/.venv/bin/pip
  - "npm install"                             # installs concurrently
  - "npm run train"                           # builds data/model.pkl from Cornell corpus
  - "npm run dev"                             # boots both services

open:
  url: http://localhost:3000
  api_docs: http://localhost:4000/docs  # FastAPI auto Swagger UI
```

### Why YAML?
The user asked for a YAML-format workflow document. It doubles as:
1. **Documentation** — anyone reading the repo sees the deploy story in one file
2. **Ops reference** — Docker Compose, systemd, and CI all map cleanly onto this shape later (Phase 2)
3. **Makefile alt** — you can write `make -f WORKFLOW.yml` adapters later without rewriting the spec

---

## 7. Acceptance — full MVP checklist

- [ ] `npm install` works on a fresh clone
- [ ] `npm run train` produces `backend/data/model.pkl` in <10s
- [ ] `npm run dev` boots backend on `:4000` AND frontend on `:3000` with one command
- [ ] `curl localhost:4000/health` returns `200 {"status":"ok"}`
- [ ] Open `localhost:3000`, type "how are", see 3 suggestion chips within 150–250ms
- [ ] Click any chip → inserts into bar, re-predicts on new context
- [ ] Hit Send → input clears (Phase 2: also persists to history)
- [ ] Disable WiFi → entire demo still works
- [ ] `npm test` (engine + API tests) passes
- [ ] No external HTTP calls anywhere in the request path (verify in DevTools Network)
- [ ] All docs (PRD/TRD/OVERVIEW/PLAN/WORKFLOW) agree on the same scope and ports

---

## 8. Out of scope for this plan (explicit non-goals)

� Authentication / multi-user (single-user local tool by design)
❌ Cloud sync / hosted version (this is the anti-cloud)
❌ Full conversational LLM replies (autocomplete only)
❌ Mobile-first responsive UI (desktop dashboard only for MVP)
❌ Internationalization / non-English tokenization (English-only MVP)
❌ Production hardening: TLS, rate-limiting, secrets management (local-only)

---

## 9. Time budget summary

| Phase | Time | What ships |
|-------|------|------------|
| **0 — Bootstrap** | 15 min | Repo, venv, deps, `npm run dev` boots both stubs |
| **1 — MVP** | 45–60 min | Working chat bar with live n-gram suggestions, offline |
| **2 — Polish** | 3–6 hrs | Keyboard nav, phrases, SQLite history, personalization, profiles |
| **3 — LLM swap** | 2–4 hrs | Ollama behind same `/predict`, smarter suggestions |
| **Total MVP** | **~1 hour** | matches PRD's "Hour 1" target |
| **Total all phases** | ~1 working day | matches PRD's "Later sessions" |

---

## 10. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Cornell corpus encoding weirdness (`iso-8859-1`, not UTF-8) | High | Low | Specify encoding in `train.py`, already documented |
| Suggestions feel "stale" (always same top-3 words) | Medium | Medium | Trigram + per-user personalization (Phase 2) |
| `npm run dev` hangs on Windows due to PATH | Low | High | Document `concurrently` fallback to `npm-run-all` |
| FastAPI CORS blocks frontend fetch | Medium | High | Explicit `allow_origins=[localhost:3000]`, documented |
| LLM swap in Phase 3 too slow on laptop | Medium | Low | Keep n-gram as fallback, document latency budget |
| Model file grows large with personalization | Low | Low | Periodic pruning, optional `--prune` flag in `train.py` |

---

## 11. Open questions for the user (when you're ready)

1. **Personalization data source**: do you want GhostType to read a WhatsApp/Telegram export on demand, or fully manual "paste text to train" mode?
2. **UI polish budget**: are you OK with MVP looking like a single dark-mode chat bar, or do you want a header/sidebar/settings drawer from Phase 1?
3. **Engine badge in UI** for n-gram vs LLM mode (Phase 3): visible to end-user, or hidden behind a debug flag?
4. **Deployment target**: do you want Docker Compose ready in Phase 2, or is "runs on my laptop with `npm run dev`" the only deploy story?
5. **Multiple languages**: Phase 1 = English-only. If you type Tamil/Hindi mixed input, the unigram/bigram tables need Unicode-aware tokenization. Worth scoping now or later?

---

*Last updated: 2026-08-19. Companion to [OVERVIEW.md](./OVERVIEW.md), [PRD.md](./PRD.md), [TRD.md](./TRD.md), [WORKFLOW.yml](./WORKFLOW.yml).*
