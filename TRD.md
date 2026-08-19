# Technical Requirements Document (TRD)
## Project: Predictive Text Chat Bar (Local Dashboard)

### 1. Architecture Overview

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   Frontend (Dashboard)   │  HTTP  │   Backend (Prediction)   │
│  Chat-bar UI, JS fetch   │ <----> │  FastAPI/Flask service   │
│  shows suggestion chips  │        │  n-gram model in memory  │
└─────────────────────────┘        └──────────────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────────────┐
                                   │  Corpus / Training data   │
                                   │  (.txt file(s) on disk)   │
                                   └──────────────────────────┘
```

Everything runs on localhost. No external network calls at inference time.

### 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Prediction engine | Python (custom n-gram / `markovify` / `nltk`) | Simple, fast to build, explainable |
| Backend API | FastAPI (or Flask) | Lightweight, easy `/predict` endpoint, good local dev experience |
| Frontend | Plain HTML/JS, or React if you want it to match a bigger dashboard later | Fast to wire up a chat-bar UI |
| Data storage (optional Phase 2) | SQLite | Simple local persistence for user history |
| Hosting | Local process / Docker Compose | Matches your existing self-hosted setup style |

### 3. Component Breakdown

**A. Prediction Engine**
- Tokenizes training corpus, builds:
  - Unigram frequency table (fallback)
  - Bigram table: `word_n-1 → {word_n: count}`
  - Trigram table (optional, for better accuracy): `(word_n-2, word_n-1) → {word_n: count}`
- `predict(text: str) -> list[str]`:
  1. Take last 1–2 words of input.
  2. Look up trigram matches; if none, fall back to bigram; if none, fall back to top unigrams.
  3. Return top 3 by frequency.

**B. Backend API**
- `POST /predict` — body: `{ "text": "how are" }` → response: `{ "suggestions": ["you", "things", "we"] }`
- `GET /health` — basic liveness check.
- CORS enabled for local frontend origin.

**C. Frontend (Chat Bar UI)**
- Centered input bar (visually like ChatGPT's).
- `onkeyup` (debounced ~150ms) → calls `/predict` → renders suggestion chips.
- Clicking a chip appends the word + a space to the input and re-triggers prediction.
- No streaming needed for MVP (single request/response per keystroke pause).

### 4. Data Model (MVP)
No DB needed for MVP — model lives in memory, rebuilt from the corpus file(s) at server startup.

Phase 2 (optional) SQLite tables:
- `history(id, text, timestamp)` — logs what was typed, used to retrain/personalize.

### 5. Non-Functional Requirements
- **Latency:** prediction lookup should be O(1) dict access — sub-10ms; network round-trip dominates (~50–100ms target).
- **Offline:** must work with no internet access after initial setup.
- **Resource use:** should run comfortably on a small home server / laptop — no GPU needed for n-gram approach.
- **Extensibility:** prediction engine should be swappable behind the same `/predict` API (so a local LLM via Ollama could replace it later without touching the frontend).

### 6. Deployment
- MVP: run backend with `uvicorn app:app --reload`, open static HTML file or `npm run dev` frontend, point it at `http://localhost:8000`.
- Later: wrap in Docker Compose (`frontend` + `backend` services) to match your existing self-hosted stack pattern.

### 7. Open Source Resources / Libraries

**Language modeling / prediction:**
- [`markovify`](https://github.com/jsvine/markovify) — dead-simple Markov chain text generation in Python, good for a quick n-gram-like predictor.
- [`nltk`](https://www.nltk.org/) — has n-gram utilities (`nltk.ngrams`), tokenizers, and sample corpora built in.
- [KenLM](https://github.com/kpu/kenlm) — fast, production-grade n-gram language model toolkit (more setup, much faster at scale).
- [`spaCy`](https://spacy.io/) — good tokenizer if your corpus needs cleaner preprocessing.
- [Hugging Face `tokenizers`](https://github.com/huggingface/tokenizers) — if you want subword-level tokenization instead of whole-word.

**Corpora / training text (public domain / open):**
- [Project Gutenberg](https://www.gutenberg.org/) — free books, good general-English corpus.
- [Cornell Movie-Dialogs Corpus](https://www.cs.cornell.edu/~cristian/Cornell_Movie-Dialogs_Corpus.html) — conversational text, good for chat-style predictions.
- [Tatoeba](https://tatoeba.org/) — large set of short, everyday sentences.
- Your own WhatsApp/Telegram chat export — best for personalized predictions.

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) — lightweight Python API framework, auto-generates docs.
- [Flask](https://flask.palletsprojects.com/) — even simpler alternative if you don't need FastAPI's extras.

**Frontend (chat-bar style UI):**
- Plain HTML/CSS/JS is enough for MVP.
- [Vercel AI SDK UI components](https://sdk.vercel.ai/) — prebuilt chat-input components if you want a polished ChatGPT-like bar fast.
- [shadcn/ui](https://ui.shadcn.com/) — if going React, has clean input/command-palette components that fit a chat-bar look.

**Optional future upgrade path:**
- [Ollama](https://ollama.com/) — run small local LLMs (e.g., Phi-3, Llama 3.2 1B/3B) behind the same `/predict` API for smarter, context-aware suggestions once the n-gram MVP is working.
