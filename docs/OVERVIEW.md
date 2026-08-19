# GhostType — Overview

> A self-hosted, locally-running dashboard with a ChatGPT-style chat bar that offers **Gboard-style predictive text / autocomplete** as you type. No LLM, no cloud, no telemetry. Just n-gram suggestions from a local corpus.

---

## 1. What it is

GhostType is a **single-page web dashboard** centered on one input — a chat-style text bar. As the user types, the system suggests the **next word(s)** as clickable chips above/below the bar. Clicking a chip appends the suggested word (plus a space) and re-triggers prediction. Sending the composed message just logs it to local history for now — there is **no conversational reply** in the MVP.

The engine behind the suggestions is a **hand-rolled n-gram language model** (unigram + bigram + trigram tables built from a text corpus at server startup) wrapped behind a single `POST /predict` endpoint. Everything runs on `localhost` — backend on `:4000`, frontend on `:3000`.

This is **autocomplete, not Q&A.** If you wanted to chat with an LLM, you already have that. GhostType fills the gap for people who want a fast, private, explainable, offline typing aid that lives next to their other self-hosted apps.

---

## 2. Why it exists

Predictive typing (Gboard, iOS keyboard, swipe-to-type) is one of the most loved UX features of the last decade — and it's locked inside mobile OS keyboards. There is no general-purpose, standalone, self-hosted equivalent:

- **Gboard** is great on Android but isn't a web tool you can plug into a dashboard.
- **LLM-powered autocompletion** (Copilot, etc.) is heavyweight, costly, and requires the cloud.
- **DIY n-gram demos** exist in tutorials but never ship as a usable product.

GhostType is the missing middle: a real, runnable, self-hostable autocomplete dashboard you can deploy alongside Jellyfin, Traefik, or whatever else lives on your home server — and extend later (personalization, phrase suggestions, optional local LLM swap via Ollama).

---

## 3. Who it's for

| Tier | User | What they get today | What they get later |
|------|------|---------------------|---------------------|
| **Primary** | Self-host hobbyist (you, today) | A demoable local tool, ~1h build, fun to show off | A real autocomplete for their own typing across notes/docs |
| **Secondary** | Privacy-conscious writers/devs | An offline typing aid with no telemetry | Personalized suggestions trained on their own writing |
| **Future** | Anyone wanting a private autocomplete | Same product, polished | Multi-profile corpora, phrase suggestions, LLM-backed smart mode |

---

## 4. The experience (MVP)

1. Open `http://localhost:3000` → centered chat bar with placeholder *"Type something…"*
2. Type a partial sentence, e.g. *"how are"*
3. Within ~100ms, three suggestion chips appear: **you**, **things**, **we**
4. Click any chip → it inserts into the bar, prediction re-runs on the new context
5. Hit Enter / Send → text is logged to history (Phase 2), input clears

That's it. No auth, no settings screen, no LLM round-trip. The chat bar is the whole product.

---

## 5. What's in scope (MVP)

✅ Centralized chat-bar input, ChatGPT-style
✅ Up to 3 next-word suggestion chips, debounced ~150ms
✅ Click-to-insert chip behavior with auto re-prediction
✅ Hand-rolled n-gram engine (unigram + bigram + trigram with frequency fallback)
✅ FastAPI `POST /predict` + `GET /health` endpoints
✅ Plain HTML/CSS/JS frontend, single `index.html`
✅ Trained on **Cornell Movie-Dialogs Corpus** (conversational flavor)
✅ Single-command dev startup via `npm run dev` (backend `:4000`, frontend `:3000`)
✅ Fully offline after initial setup — no external API calls at runtime

## 6. What's explicitly out of scope (MVP)

❌ User accounts / auth (single-user local tool)
❌ Cloud hosting or sync (this is the opposite of cloud)
❌ Full LLM conversational replies (autocomplete only — by design)
❌ Multi-language tokenization (English-only for MVP)
❌ Production hardening: rate-limiting, request signing, secrets, TLS (local-only)

---

## 7. The upgrade path

The architecture is **deliberately swappable** behind the `/predict` endpoint:

| Phase | Engine | UI additions |
|-------|--------|--------------|
| **MVP (this plan)** | n-gram dicts | Chat bar + chips |
| **Phase 2** | n-gram + personalized history blending | Keyboard nav (Tab/arrows), multiple corpus profiles, sentence-level phrase suggestions |
| **Phase 3** | Same `/predict` API, swap engine to **Ollama** (Phi-3 / Llama 3.2 1B) for context-aware smart suggestions | Same UI — engine swap invisible to the frontend |

Frontend never knows which engine is behind `/predict`. That's the whole point of the clean API boundary.

---

## 8. How you'll run it

```bash
npm install        # one-time, installs concurrently
npm run dev        # boots backend on :4000 AND frontend on :3000, in parallel
```

Open `http://localhost:3000`. Done. See `PLAN.md` for the full step-by-step build, and `WORKFLOW.md` (or the YAML it points to) for the dev orchestration details.

---

## 9. Success criteria (MVP)

| Metric | Target |
|--------|--------|
| First suggestion appears after keystroke pause | ≤ 100ms (p95) |
| Round-trip `/predict` latency (localhost) | ≤ 50ms p50, ≤ 100ms p95 |
| Suggestions shown for common word pairs in corpus | ≥ 1 relevant suggestion per common bigram |
| Works with no internet after `pip install` / `npm install` | ✅ |
| End-to-end demo (type → chip → click → send) | Runs offline on a fresh laptop |

---

## 10. Companion docs

- **[PRD.md](./PRD.md)** — original product requirements (problem, user, scope)
- **[TRD.md](./TRD.md)** — original technical requirements (stack, components, NFRs)
- **[PLAN.md](./PLAN.md)** — extra-detailed phased build plan (start here for execution)
- **[WORKFLOW.yaml](./WORKFLOW.yaml)** — single-command dev orchestration (backend :4000 + frontend :3000)
- **[package.json](./package.json)** — `npm run dev` entry point that drives WORKFLOW.yaml
