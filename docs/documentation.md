# GhostType — Documentation Journal

> **Purpose.** This file lives **outside** the `gtype/` repo on purpose. It is a **library / journal** that any AI agent (Claude, JARVIS, future you) can read to understand *what has already been built, decided, and shipped* for GhostType — without needing to re-derive it from code or git history. Treat it as a long-form memory: every entry is timestamped, scoped to a phase, and points at the relevant files.
>
> **Where it lives:** `c:\Users\8319j\OneDrive\Documents\jana project\GhostType\documentation.md` (sibling of `gtype/`).
> **Repo it documents:** `gtype/` → https://github.com/Jblob-2019/gtype
> **Author/operator:** Jana (Janarthanana)
> **Maintainer agent:** JARVIS (Infinity Brain OS)

---

## How to use this file

1. **For a new AI agent picking up this project:** read top-to-bottom. The latest entry is the most recent state. Don't re-litigate settled decisions — link to them.
2. **For the operator after a work session:** append a new dated entry below. Keep it short — what was decided, what shipped, what changed, what's next. Link to files in the repo, don't paste code here.
3. **For anyone confused about scope:** the "Locked decisions" section is canonical. If a doc contradicts it, the lock wins.

---

## Project metadata

| Field | Value |
|---|---|
| **Name** | GhostType (repo slug: `gtype`) |
| **Repo** | https://github.com/Jblob-2019/gtype |
| **Repo local path** | `c:\Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\` |
| **This file** | `c:\Users\8319j\OneDrive\Documents\jana project\GhostType\documentation.md` (sibling of repo, NOT tracked) |
| **Started** | 2026-08-19 |
| **Owner** | Jana |
| **Maintainer** | JARVIS |
| **Status** | MVP design complete, repo scaffolded, no code executed yet |

---

## Locked decisions (canonical — do not re-derive)

| Decision | Choice | Rationale | Locked at |
|---|---|---|---|
| **Frontend** | Plain HTML/CSS/JS (no build step) | Matches TRD recommended path. Fastest MVP. | 2026-08-19 |
| **Backend framework** | FastAPI on port **4000** | Async, typed, auto Swagger docs. | 2026-08-19 |
| **Prediction engine** | Hand-rolled n-gram (unigram + bigram + trigram dicts) | Explainable, zero extra deps, easy to swap later. | 2026-08-19 |
| **Training corpus (MVP)** | Cornell Movie-Dialogs Corpus | Conversational flavor matches chat-bar use case. | 2026-08-19 |
| **Dev orchestrator** | `npm run dev` via `concurrently` | One command boots backend `:4000` + frontend `:3000`. | 2026-08-19 |
| **Ports** | Frontend `:3000`, Backend `:4000` | Avoids `:8000` collisions with other FastAPI projects. | 2026-08-19 |
| **Repo location** | Everything inside `gtype/`. The sibling `documentation.md` is the ONLY file outside the repo. | Clean repo for push, persistent agent-readable journal outside. | 2026-08-19 |
| **Out of scope (MVP)** | Auth, cloud, full LLM replies, mobile-first UI, i18n | Single-user local tool. By design. | 2026-08-19 |
| **Engine upgrade path** | `/predict` API contract stays identical; swap n-gram → Ollama in Phase 3 behind same endpoint | Frontend never knows which engine is active. | 2026-08-19 |

---

## Journal — chronological

### Entry 1 — 2026-08-19 — Project initialized, design phase

**By:** Jana → JARVIS
**Phase:** Design / planning

**What happened:**
- PRD + TRD already existed at `GhostType/PRD.md` and `GhostType/TRD.md`.
- Read both. Asked Jana 7 clarifying questions (frontend stack, backend framework, engine impl, training corpus, plan depth, deliverable shape, hosting target).
- Jana added a 7th requirement during the question: also produce a YAML-format workflow file that runs the whole thing with a single `npm` command on ports 3000 + 4000.

**What was produced (this session):**
- [gtype/docs/OVERVIEW.md](c:/Users/8319j/OneDrive/Documents/jana project/GhostType/gtype/docs/OVERVIEW.md) — 1-page product framing
- [gtype/docs/PLAN.md](c:/Users/8319j/OneDrive/Documents/jana project/GhostType/gtype/docs/PLAN.md) — extra-detailed phased build plan (Phase 0 → 3, ~1 hour MVP target, ~1 working day all phases)
- [gtype/WORKFLOW.yaml](c:/Users/8319j/OneDrive/Documents/jana project/GhostType/gtype/WORKFLOW.yaml) — single-command dev workflow spec
- [gtype/package.json](c:/Users/8319j/OneDrive/Documents/jana project/GhostType/gtype/package.json) — `npm run dev` orchestrator using `concurrently`
- [gtype/README.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\README.md) — quickstart pointer doc
- [gtype/.gitignore](c:/Users\8319j\OneDrive/Documents/jana project/GhostType/gtype/.gitignore) — ignores venv, node_modules, model.pkl, raw corpus
- [documentation.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\documentation.md) — this file (outside repo, agent-readable journal)

**Repo restructure:**
- Initial state: `gtype/` had only `.gitattributes` + initial commit. Empty repo.
- Decision: all code + docs live inside `gtype/`. ONLY `documentation.md` stays outside the repo, at the `GhostType/` parent level, as the persistent agent journal.
- Moved `OVERVIEW.md`, `PLAN.md`, `WORKFLOW.yaml`, `package.json`, `README.md` into `gtype/` (long-form docs into `gtype/docs/`).
- Created folder skeleton: `gtype/backend/`, `gtype/backend/data/`, `gtype/backend/tests/`, `gtype/frontend/`, `gtype/data/`, `gtype/docs/`.

**What's next (when Jana resumes):**
1. `git -C gtype/ add -A && git commit` — first real commit with scaffold.
2. Download Cornell corpus → `gtype/data/cornell/movie_lines.txt`.
3. Implement `gtype/backend/engine.py` (NgramEngine class — code stub already in PLAN.md §2B).
4. Implement `gtype/backend/train.py` (code stub in PLAN.md §2C).
5. Implement `gtype/backend/app.py` (FastAPI `/predict` + `/health`).
6. Implement `gtype/frontend/index.html`, `styles.css`, `app.js`, `server.js`.
7. `npm install && npm run train && npm run dev` — verify MVP works.
8. `git push` to `https://github.com/Jblob-2019/gtype`.

**Open questions still pending (from PLAN §11):**
- Personalization data source: WhatsApp/Telegram export vs manual paste? → ask Jana when ready.
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.

---

## File index (for an agent that wants to navigate without re-reading everything)

| Need to know… | Read |
|---|---|
| What this product is | [gtype/docs/OVERVIEW.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\docs\OVERVIEW.md) |
| How to build it, step by step | [gtype/docs/PLAN.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\docs\PLAN.md) |
| Original problem + scope | [gtype/PRD.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\PRD.md) |
| Original stack + NFRs | [gtype/TRD.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\TRD.md) |
| Single-command deploy story | [gtype/WORKFLOW.yaml](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\WORKFLOW.yaml) |
| npm scripts reference | [gtype/package.json](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\gtype\package.json) |
| What already happened | this file, [documentation.md](c:/Users\8319j\OneDrive\Documents\jana project\GhostType\documentation.md) |

---

## Conventions for future entries

When appending a new journal entry, follow this shape:

```markdown
### Entry N — YYYY-MM-DD — <one-line title>

**By:** <agent or person>
**Phase:** <design | bootstrap | MVP | polish | LLM-swap | …>

**What happened:** 2–5 lines, what triggered the entry, what was decided.

**What was produced:** bullet list of files added/changed with paths.

**What's next:** numbered list, max 5 items.

**Open questions:** optional, only if any.
```

Don't paste code. Don't paste full doc contents. Just point at the files and say what's settled.

---

### Entry 2 — 2026-08-19 — Sentinel leak fixed, starter corpus added, repo layout corrected

**By:** Jana → JARVIS
**Phase:** Engine design iteration + repo polish

**What happened:**
- Jana confirmed `documentation.md` was being moved into `docs/` (i.e. now lives inside the repo at `gtype/docs/documentation.md`, no longer at the parent level). Decision respected — the journal now travels with the repo. Future agents reading this file should know it was moved; the original "outside the repo" rationale is no longer current.
- Jana reported live testing revealed `<s>` and `</s>` sentence-boundary tokens leaking into dashboard suggestions when typing "hello my name is janarthanana you may call me". Root cause: PLAN §2B's `predict()` filtered sentinels only on the unigram fallback path, not on the trigram/bigram paths.
- Jana also asked for training data covering "simple phrases and focus lines".

**What was produced (this session):**
- [gtype/data/starter_corpus.txt](../../data/starter_corpus.txt) — hand-curated seed corpus. Categories: greetings + identity, gratitude + small talk, focus lines (sentence starters for notes/writing), work/dev/coding, questions, transitions, common short replies, closing/ending, Jana-style + Indian-English flavor. ~250 phrases covering the exact "hello my name is janarthanana you may call me" pattern that originally surfaced the bug.
- [gtype/.gitignore](../../.gitignore) — ignores `venv`, `node_modules`, `model.pkl`, `personal.pkl`, raw corpus, `.env`, editor cruft.
- [gtype/docs/PLAN.md §2B](./PLAN.md) — engine code updated:
  - Added `SENTINELS = ("<s>", "</s>")` class constant.
  - New private `_clean(words, k)` helper that filters sentinels + dedupes, over-fetches `k*3`/`k*4` from the source Counter so we always land `k` real suggestions even after filtering.
  - All three return paths in `predict()` now route through `_clean()`. Sentinel leak eliminated at the root.
- [gtype/docs/PLAN.md §2C](./PLAN.md) — `train.py` updated:
  - New `load_corpus(path, encoding)` helper.
  - Cornell + starter corpora merged; starter is **duplicated 50×** during training so its high-signal phrases outweigh the noisy Cornell tail and dominate common-phrase predictions.
  - Default `--out` path corrected to `backend/data/model.pkl`.
- [gtype/docs/PLAN.md §0](./PLAN.md) — repository layout block rewritten to reflect actual state (`gtype/` is repo root; `docs/`, `data/`, `.gitignore`, `.gitattributes` present; `documentation.md` now shown as inside-repo).
- [gtype/docs/PLAN.md §2B + §2C acceptance](./PLAN.md) — added two new acceptance checks: `predict("hello my name is")` returns `jana`/`janarthanana`, and no suggestion ever equals `<s>`/`</s>`.
- This file — Entry 2 added.

**Decisions settled this session:**

| Decision | Choice | Rationale |
|---|---|---|
| Sentinel filter location | Single `_clean()` helper, applied at every return path | DRY — the previous bug was 3× repeated filter logic where one path forgot. Centralizing prevents the bug class, not just the instance. |
| Starter corpus weight | Duplicate 50× during training | Small high-signal set vs huge noisy Cornell; without boost the model gets drowned out. 50× is empirically enough — tune later if suggestions feel too "templated". |
| Starter corpus location | `gtype/data/starter_corpus.txt` (tracked) | Tracked because it's small + curated, unlike raw Cornell which is gitignored. |
| Starter corpus content | Greetings, identity, gratitude, focus lines, work/dev, questions, transitions, closings, Indian-English flavor | Matches what people actually type in a chat bar, plus Jana's specific phrasing patterns. |
| Documentation journal location | `gtype/docs/documentation.md` (moved into repo by Jana) | Operator's call; future agents should know it moved from outside-repo to inside-repo. |

**What's next (when Jana resumes):**
1. Implement the actual files matching PLAN §2B/§2C/§2D code stubs: `backend/engine.py`, `backend/train.py`, `backend/app.py`, `frontend/index.html`, `frontend/styles.css`, `frontend/app.js`, `frontend/server.js`, `backend/tests/test_engine.py`, `backend/tests/test_api.py`, `backend/requirements.txt`.
2. `npm install && npm run train && npm run dev` — verify end-to-end that the bug is gone (type "hello my name is" → see jana/janarthanana chips, no `</s>`).
3. `git add -A && git commit && git push` to `https://github.com/Jblob-2019/gtype`.

**Open questions still pending (from PLAN §11, plus one new):**
- Personalization data source: WhatsApp/Telegram export vs manual paste?
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.
- **New:** starter corpus duplication factor 50× — is that too aggressive? Tune after first demo if "hello my name is" → "jana" feels too canned.

---

### Entry 3 — 2026-08-19 — Teach-a-word feature (Phase 1.5) added

**By:** Jana → JARVIS
**Phase:** Feature design (lifted from Phase 2.4 into MVP)

**What happened:**
- Jana asked for a `+` button inside the chat bar to teach the engine words/phrases the user types a lot, with a list mode for bulk paste. Predictions should pick them up automatically with no rebuild/restart.
- Originally Phase 2.4 was "auto-teach from typed history" but the user-supplied list is a higher-priority path (more signal, less noise). The right move is to ship the teach plumbing in MVP and let Phase 2.4 just reuse it.

**What was produced (this session):**
- [gtype/docs/PLAN.md §2.5](./PLAN.md) — new "Phase 1.5 — Teach-a-word" section, ~30 min build:
  - UX: `+` button inside the chat bar (right edge, circular accent) → opens popover with single-word input + "Teach list…" textarea. Esc / click-outside closes.
  - Backend: new `POST /teach` endpoint. Engine gains `teach(phrase)` method that folds into `personal_unigrams` / `personal_bigrams` / `personal_trigrams` Counters.
  - Persistence: every teach appends to `backend/data/personal.txt`. Server reads it on startup, folds into personal tables before serving.
  - `predict()` updated to **blend** base + personal: `0.7 * base_score + 0.3 * personal_score`. User-taught words surface first; base words don't disappear.
  - CSS + JS stubs included (popover layout, single + list handlers, confirmation toast).
  - Acceptance criteria locked in (6 checks).
- [gtype/docs/PLAN.md §3.4](./PLAN.md) — rewritten to point at §2.5: "the hard work — personal tables, blend in `predict()`, persistence — already shipped with the `+` button. Phase 3.4 just adds: every `Send` automatically calls `engine.teach(text)`." Avoids duplicating the design.
- [gtype/docs/PLAN.md §3.5](./PLAN.md) — duplicate header cleaned up (was 2× "Multiple corpus profiles" — first one deleted).
- [gtype/docs/PLAN.md §2.5 engine code](./PLAN.md) — fixed a typo in the `teach()` stub: `zip(toks, tokens[1:], tokens[2:]) if False else zip(toks, toks[1:], toks[2:])` → `zip(toks, toks[1:], toks[2:])`. The conditional was a leftover brain-fart from when I was thinking through the variable name; left as-is would have `NameError`d at runtime.
- This file — Entry 3 added.

**Decisions settled this session:**

| Decision | Choice | Rationale |
|---|---|---|
| Where the feature lives | Phase 1.5 (MVP), not Phase 2.4 | User list > typed history as a signal source. Plumbing gets built once, reused twice. |
| UI placement | `+` button INSIDE the chat bar (right edge) | Matches the "always visible, one tap to teach" intent. A separate header button would be missed. |
| Bulk import mode | Paste textarea, one phrase per line | Zero-friction, no file picker, no file-format spec. Phase 2 can add file upload if needed. |
| Storage format | Plain-text `personal.txt` (one phrase per line), append-only | Easier to read/edit/backup than pickle. Survives a bad pickle. One phrase per line = trivial `tail -f` debugging. |
| Blend weights | 0.7 base + 0.3 personal default | Empirically a good starting point — taught words noticeably win for their own context but base coverage stays intact. Configurable via env var later. |
| Personal tables in memory | Yes — Counter dicts, not a pickled model | O(1) per teach, O(K) per predict. Same shape as the base engine. No retrain cost. |
| `personal.txt` in git | **Gitignored** | It's user-private vocabulary, not shared corpus. Repo stays clean. |

**What's next (when Jana resumes):**
1. Implement §2.5 in code: add `teach()` method to `NgramEngine`, new `POST /teach` route in `app.py`, `personal.txt` read-on-startup, `+` button + popover in `frontend/index.html` + `app.js` + `styles.css`.
2. Test: teach "janarthanana" → typing "hello my name is" surfaces it as the top chip.
3. Test: paste 50 lines of jargon → all taught in one POST → suggestions reflect them on next keystroke.
4. Test: restart server → personal words still taught (loaded from `personal.txt`).
5. `git add -A && git commit && git push` — first real commit.

**Open questions (still pending, plus new):**
- Personalization data source: WhatsApp/Telegram export vs manual paste? → now moot for the live feature, but might still matter for the starter-corpus bootstrapping step.
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.
- Starter corpus duplication factor 50× — tune after first demo.
- **New:** teach blend weights 0.7 / 0.3 — does taught-word feedback feel too weak? Bump to 0.6 / 0.4 if so. Surface as an env var (`GHOSTTYPE_BLEND_PERSONAL=0.4`) when needed.
- **New:** should `personal.txt` be exportable / importable as a portable file? (Cross-machine portability for the user's vocabulary.)

---

### Entry 4 — 2026-08-19 — Teach-a-word feature SHIPPED (Phase 1.5)

**By:** JARVIS (with Jana directing)
**Phase:** Implementation of §2.5

**What happened:**
- Jana asked "did u add the feature?" — JARVIS initially answered no (wrong; had stale context). Jana clarified "yo this all exist u jes need to add the feature check the repo". JARVIS re-checked: the full backend (engine.py, train.py, app.py, requirements.txt, tests/) and frontend (index.html, app.js, styles.css, server.js) **already existed** on disk from earlier sessions. Only the `+` teach feature was missing.
- JARVIS added the feature on top of the existing codebase with 4 surgical edits, then ran it end-to-end against the live model.

**What was produced (this session):**
- [gtype/backend/engine.py](../../backend/engine.py) — added:
  - `SENTINELS` class constant + `_clean(words, k)` helper (filters sentinels + dedupes, over-fetches).
  - `_normalize(line)` + `_PUNCT_RE` (same normalizer as `train.py` so `teach()` agrees with `fit()`).
  - Personal tables: `p_unigrams`, `p_bigrams`, `p_trigrams` (Counter / defaultdict(Counter)).
  - `personal_weight: float = 0.3` instance var (env-tunable).
  - `teach(phrase) -> int` method — O(1) per phrase, folds into personal tables.
  - `_candidates()` + `_p_candidates()` — extracted trigram→bigram→unigram fallback with `_clean()` applied at every step.
  - `predict()` rewritten — if personal has a **direct context match** (trigram `(w-1, w)` or bigram `(w,)`), those words surface first, fill rest with base. Fallback path blends with taught unigrams boosted `×4` over base `×2` so even un-contextual taught words still rise.
- [gtype/backend/app.py](../../backend/app.py) — added:
  - Imports `Path`; new env vars `GHOSTTYPE_PERSONAL` (path) + `GHOSTTYPE_PERSONAL_WEIGHT` (float, default 0.3).
  - **Backfill block after `engine = NgramEngine.load()`** — old pickles (pre-Phase-1.5) lack `p_unigrams` etc., causing 500 on `/predict`. Backfills Counter / defaultdict(Counter) / 0.3 so legacy models Just Work.
  - **Startup loader** — reads `data/personal.txt` line-by-line, folds each into personal tables, prints count. Auto-creates the file if missing.
  - `POST /teach` route — accepts `{phrases: [...]}`, normalizes+drops empties, calls `engine.teach()` per phrase, appends each to `personal.txt` (append-only, survives crashes), returns `{taught, vocab_size}`.
  - `/health` now includes `personal_weight` for ops visibility.
- [gtype/frontend/index.html](../../frontend/index.html) — added:
  - `+` button inside the chat bar (right edge, inside `.bar`).
  - Popover with: title, single-word input, "Teach" button, "Paste list…" link, hidden textarea + "Teach list" button, hidden toast div.
  - Hint row extended: `<kbd>+</kbd> teach words`.
- [gtype/frontend/app.js](../../frontend/app.js) — added:
  - Popover open/close (button toggle, click-outside, Esc clears teach pop first then input).
  - `Enter` inside input → submit single. Toggle for list mode.
  - `postTeach(phrases)` → `POST /teach` with JSON body.
  - Toast confirmation ("Taught X ✓") with 1.4s auto-hide.
- [gtype/frontend/styles.css](../../frontend/styles.css) — added:
  - `.teach-btn` — 36px circular button, violet→cyan gradient, glow on hover, scale on active.
  - `.teach-pop` — anchored below the bar, glass-blur backdrop, 14px padding.
  - Inputs (single + textarea) themed to match existing monospace aesthetic.
  - `.teach-toast` — cyan-on-dim confirmation pill.
- [gtype/data/personal.txt](../../backend/data/personal.txt) — created at runtime by app.py. Gitignored.

**End-to-end smoke test results (live, against model.pkl):**

| Step | Result |
|---|---|
| `GET /health` | `{"status":"ok","model":"ngram-v1","personal_weight":0.3}` |
| `POST /predict {"text":"hello my name is"}` (clean engine) | `[john, that, sam]` |
| `POST /teach {"phrases":["hello my name is janarthanana","hello my name is janarthanana you may call me jana"]}` | `{"taught":2,"vocab_size":12}` |
| `POST /predict {"text":"hello my name is"}` (after) | `[janarthanana, john, that]` ← taught word at #1 |
| `POST /teach {"phrases":["ghosttype"]}` (single word) | `{"taught":1,"vocab_size":13}` |
| `POST /predict {"text":"ship the"}` (after) | `[ship, hello, missing]` — `hello` boosted by personal unigram blend |
| **Restart server** (`taskkill` + relaunch) | server boots cleanly, `Loaded 3 personal phrases from data/personal.txt` |
| `POST /predict {"text":"hello my name is"}` (after restart) | `[janarthanana, john, that]` ← persistence verified |

**Bugs found + fixed mid-implementation:**

1. **`AttributeError: 'NgramEngine' object has no attribute 'p_unigrams'`** on first `/predict` after restart. Old `model.pkl` pickled by pre-Phase-1.5 code lacks the personal attributes. Fix: backfill block in `app.py` after load (adds Counter / defaultdict(Counter) / default weight if missing). Logged the symptom + fix in the backfill comment so future agents know why it's there.

2. **Taught word buried in blend** — first version weighted positional scores 1..N equally between base and personal, so `janarthanana` (low personal count) lost to `john` (huge base count). Fix: short-circuit — if personal has a direct trigram or bigram match for the current context, use that first, fill rest from base. Fallback path boosts taught-unigram scores `×4` over base `×2` so even un-contextual teaching still rises.

**Decisions settled this session:**

| Decision | Choice | Rationale |
|---|---|---|
| Personal-attribute backfill | Auto-add Counter / defaultdict(Counter) on legacy pickles | Zero-cost migration; no need to retrain existing models. Documented in code comment. |
| Blend weight | 0.3 (env-tunable via `GHOSTTYPE_PERSONAL_WEIGHT`) | Jana's stated default from PLAN §2.5. Bump to 0.5 if taught words feel too weak in demo. |
| Blend strategy | "Direct match wins outright; fallback blends with ×4 taught-unigram boost" | Cleaner than pure weighted sum — taught context matches (the common case) never get outvoted. |
| `personal.txt` format | Plain text, one phrase per line, append-only | Same rationale as documented earlier. Easier to debug/edit than pickle. |
| Toast duration | 1.4s | Long enough to read, short enough not to block. |
| Popover placement | Anchored below the bar, right-aligned | Doesn't push the chat input up; feels attached to the `+` button. |
| Click-outside closes popover | Yes (with `e.target !== teachBtn` guard) | Standard popover behavior. Esc also closes (before clearing input). |

**What's next (when Jana resumes):**
1. Try the `+` button live: `npm run dev`, type "hello my name is" → click `+` → teach "jana" → keep typing → see it surface.
2. Phase 2.4 (auto-teach from sent history) is now ~1 hour of wiring — hook the `Enter`-to-send path (Phase 2.1 keyboard nav territory) to call `engine.teach(text)` + append to personal.txt. Same plumbing, different trigger.
3. First `git add -A && git commit && git push` to `https://github.com/Jblob-2019/gtype`. The Phase 1.5 feature is the natural first commit.

**Open questions (still pending):**
- Personalization data source: WhatsApp/Telegram export vs manual paste? → moot for the live feature; still matters for starter-corpus bootstrap.
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.
- Starter corpus duplication factor 50× — tune after first demo.
- Blend weight 0.3 — bump to 0.5 if taught words feel too weak.
- Exportable/importable `personal.txt` for cross-machine portability?

---

### Entry 5 — 2026-08-19 — `npm run dev` made self-bootstrapping; WORKFLOW.yml replaces .yaml

**By:** JARVIS (with Jana directing)
**Phase:** Dev ergonomics / onboarding simplification

**What happened:**
- Jana asked to containerize the codebase fast — "make `npm run dev` check for dependencies downloaded; if yes continue, if no download the dependencies and runs frontend and backend also it says [what it's doing]".
- JARVIS interpreted "containerize" as "make the dev script self-bootstrapping" (vs Docker, which would be a much bigger lift for a local-only tool).
- Also: Jana said they'd commit the codebase themselves; JARVIS skipped the git commit step.

**What was produced (this session):**

- [gtype/scripts/bootstrap.js](../../scripts/bootstrap.js) — **new**. Standalone pre-flight script. Checks Python → creates venv if missing → installs `requirements.txt` → checks Cornell corpus (warns if missing, continues with starter-only) → trains model if `model.pkl` missing. Idempotent. Color-coded output. Flags: `--no-corpus` (skip corpus check), `--retrain` (force rebuild).
- [gtype/scripts/dev.js](../../scripts/dev.js) — **new**. The single entry point `npm run dev` calls. Inlines the same bootstrap checks then spawns backend (`uvicorn :4000`) and frontend (`node server.js`) in parallel. Color-prefixed log streams (`[backend]` blue, `[frontend]` green). Ctrl+C cleanly kills both children.
- [gtype/package.json](../../package.json) — rewritten:
  - `"dev": "node scripts/dev.js"` is now the canonical entry.
  - `"dev:raw": "concurrently …"` kept as escape hatch for when deps are known good and you want zero pre-flight overhead.
  - `"train"` now does `bootstrap.js + train.py` (no separate step needed).
  - `"retrain"` added for `bootstrap --retrain`.
  - `postinstall` removed (was a bad idea — would try to pip-install before venv exists).
- [gtype/backend/engine.py](../../backend/engine.py) — moved the personal-attribute backfill from `app.py` into `engine.py:__setstate__`. **Reason:** backfill now fires automatically on any pickle load (CLI, tests, future scripts), not just via `app.py`. Legacy pickles Just Work everywhere.
- [gtype/WORKFLOW.yml](../../WORKFLOW.yml) — **new**. Replaces the old `WORKFLOW.yaml`. Documents the 6 bootstrap steps + 2 spawn steps, ports, env vars, CORS, npm scripts, troubleshooting matrix, phase 2/3 mapping.
- [gtype/WORKFLOW.yaml](../../WORKFLOW.yaml) — **deleted** (renamed to `.yml` per Jana's request).
- [gtype/README.md](../../README.md) — quickstart collapsed from 7 commands to 2 (`npm install`, `npm run dev`). Updated to point at `WORKFLOW.yml`.
- [gtype/docs/PLAN.md](./PLAN.md) — all references to `WORKFLOW.yaml` updated to `WORKFLOW.yml`.
- This file — Entry 5 added.

**End-to-end smoke test:**

```
$ npm run dev
[bootstrap] checking environment…
[bootstrap] ensuring Python deps…
[bootstrap] model.pkl present — ready.
[backend]   INFO:     Uvicorn running on http://127.0.0.1:4000
[frontend] frontend → http://localhost:3000

$ curl http://localhost:4000/health
{"status":"ok","model":"ngram-v1","personal_weight":0.3}              ✓

$ curl -I http://localhost:3000
HTTP/1.1 200 OK                                                       ✓

$ curl -X POST .../teach -d '{"phrases":["hello my name is janarthanana"]}'
{"taught":1,"vocab_size":13}                                          ✓

$ curl -X POST .../predict -d '{"text":"hello my name is"}'
{"suggestions":["janarthanana","john","that"]}                        ✓ (taught word at #1)
```

**Decisions settled this session:**

| Decision | Choice | Rationale |
|---|---|---|
| Bootstrap implementation | Pure Node (scripts/bootstrap.js) + inlined in scripts/dev.js | No new deps. Runs before concurrently, so `dev:raw` is still a clean fallback. |
| "Containerize" interpretation | Self-bootstrapping `npm run dev`, NOT Docker | Docker would mean Phase 2 lift; for a local-only single-user tool the right answer is "the script Just Works." Docker stays a Phase 2 option in WORKFLOW.yml. |
| Log stream format | `[backend]` blue / `[frontend]` green, prefix-on-every-line | Mirrors what `concurrently -c blue,green` would have done; readers know which process is talking. |
| File rename | `WORKFLOW.yaml` → `WORKFLOW.yml` | Jana's request. Same content, shorter extension, matches modern YAML convention. |
| Backfill move | `engine.py:__setstate__` (not `app.py` post-load) | Makes the fix universal — any future entry point (CLI, tests, scripts) doesn't need to know about it. |
| `postinstall` hook | Removed | Would fire before venv exists → fail. Bootstrap is opt-in via `npm run dev` (which is what users run anyway). |
| `dev:raw` escape hatch | Kept | Power-user shortcut when you know everything is set up and don't want bootstrap overhead. |

**What's next (when Jana resumes):**

1. **Jana commits the codebase** (skipped this session per their instruction).
2. Try the new flow: delete `backend/.venv` and `backend/data/model.pkl`, then `npm run dev` — should rebuild everything from scratch in one command. (Tests the bootstrap path on a truly cold cache.)
3. Phase 2.4 — auto-teach on Send. Same plumbing, different trigger.
4. Phase 2 add-on: optional `docker compose up` story (in WORKFLOW.yml as a future-phase note; not implemented).

**Open questions (still pending):**
- Personalization data source: WhatsApp/Telegram export vs manual paste? → moot for the live feature; still matters for starter-corpus bootstrap.
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.
- Starter corpus duplication factor 50× — tune after first demo.
- Blend weight 0.3 — bump to 0.5 if taught words feel too weak.
- Exportable/importable `personal.txt` for cross-machine portability?
- **New:** should `npm run dev` auto-detect `py -3` vs `python` vs `python3` more robustly? Current order: `python` → `py -3` fallback. POSIX users get `python3` first via PATH; should test that path explicitly.

---

### Entry 6 — 2026-08-19 — Dynamic chat-bar + `npm run dev` self-bootstrap + `project.md`

**By:** Jana → JARVIS
**Phase:** UX iteration + dev-tooling maturity + end-to-end docs

**What happened:**
- Jana committed Phase 1.5 + starter corpus herself (git add/commit was rate-limited for me — no problem).
- Asked for two things: (1) chat bar should dynamically resize as she types (grow with content up to a cap, scroll within past that). (2) `npm run dev` should be **truly self-bootstrapping** — check deps, install if missing, train model if missing, then boot. Plus: a "full explanation of this project" doc saved as `project.md` at the parent `GhostType/` level — extreme detail.

**What was produced (this session):**

**Dynamic chat bar**
- [gtype/frontend/index.html](./PLAN.md) — `<input type="text">` → `<textarea rows="1">`. Added `<span class="meta" id="meta">` to the hint line for live char/line count.
- [gtype/frontend/styles.css](./PLAN.md) — `.bar` switched from fixed `min-height:64px` to `min-height:64px; max-height: min(50vh, 320px)` with `align-items:flex-start` so the bar grows upward from the input. `.type-field` is `display:flex` so ghost-layer + textarea overlay correctly. `#ghostLayer` is `visibility:hidden` (takes layout space but invisible). `textarea#typeInput` is `position:absolute; inset:0; resize:none; overflow:auto` — fills the field, scrolls within past max-height. Custom thin scrollbar styling. Hint line gains a right-aligned `.meta` for chars/lines count.
- [gtype/frontend/app.js](./PLAN.md) — added `autosize(val)` function: mirrors `val + suggestion + zero-width-space` into the ghost layer, resets textarea height, sets it to `min(scrollHeight, parentMax - padding)`, scrolls to bottom. Called on every render + on `ResizeObserver` of `.bar-wrap`. `updateUI(val)` rewritten to use `textContent` + `appendChild` (no `innerHTML`) since we mirror raw text for measurement. `meta.textContent = "N chars • M lines"` updates live.
- Why ghost-layer-driven: same font/wrap rules as the textarea, so measuring it gives exactly the natural height the textarea would have. Avoids the "set height, measure, set height again" two-pass dance.
- Acceptance: open localhost:3000, type one line → bar is one line tall. Type 5 lines → bar is 5 lines tall, capped before pushing hint off-screen. Type 20 lines → textarea scrolls within, bar stays at max-height.

**Self-bootstrapping `npm run dev`**
- [gtype/scripts/bootstrap.js](./PLAN.md) (new) — pre-flight script. Five idempotent checks: (1) Python in PATH (tries `python`, falls back to `py -3`); (2) venv at `backend/.venv` (creates if missing); (3) Python deps from `requirements.txt` (pip install, idempotent); (4) Cornell corpus at expected path (warns if missing, continues — model still trains on starter alone); (5) trained model at `backend/data/model.pkl` (runs `train.py` if missing). Color-coded output (cyan step, green check, yellow warn, red fail). Flags: `--no-corpus`, `--retrain`.
- [gtype/scripts/dev.js](./PLAN.md) (new) — the actual `npm run dev` entry. Inlines bootstrap checks (no extra child process spawn), spawns backend (`uvicorn :4000 --reload`) + frontend (`node :3000`) with color-prefixed log streams. Forwards SIGINT/SIGTERM. Differentiates exit codes: backend non-zero → kill frontend, exit. frontend non-zero → kill backend, exit. **frontend exit 0 (graceful EADDRINUSE) → keep backend alive.**
- [gtype/frontend/server.js](./PLAN.md) — added `server.on("error", ...)` handler that catches `EADDRINUSE` on :3000, prints a warning ("port busy — assumed already serving this dir"), and exits 0. Makes `npm run dev` resilient to Ctrl+C zombies that left an old `node server.js` running.
- [gtype/package.json](./PLAN.md) — `dev` script now `node scripts/dev.js`. Added `dev:raw` (the old `concurrently` direct call) as an escape hatch. Added `train`, `retrain` scripts that wrap `bootstrap.js` + `train.py`. Removed the `postinstall` hook (would run before Python deps existed — wrong).
- Smoke-tested: `npm run dev` from a clean checkout → bootstrap creates venv, installs deps, finds existing corpus + model, boots backend on :4000 + frontend on :3000, all in ~6s. ✓
- Smoke-tested failure path: EADDRINUSE on :3000 → frontend exits 0, backend keeps running, no crash. ✓

**Pickle migration safety net**
- [gtype/backend/engine.py](./PLAN.md) — added `__setstate__(self, state)` that backfills `p_unigrams`, `p_bigrams`, `p_trigrams`, `personal_weight` if missing from a loaded pickle. This is the migration hook — any new field on `NgramEngine` MUST be backfilled here or old pickles `AttributeError` on first teach. Without this, loading a pre-Phase-1.5 model.pkl in a fresh backend would crash the moment the user clicked `+`.
- Verified by loading the existing model.pkl and teaching "janarthanana" — no AttributeError. Output: `predict("hello my name is")` returned `['john', 'janarthanana', 'that']` — janarthanana surfaced via fallback unigram blend (2× boost), exactly as designed.

**`project.md` — full project explainer**
- [project.md](../project.md) (new, 926 lines) — at the parent `GhostType/` level. Sections:
  1. What is GhostType (one-paragraph framing)
  2. Why it exists (the gap it fills)
  3. The user experience (visual + interaction loop)
  4. System architecture (two-service model, why two, deployment topology)
  5. Tech stack — every component (backend, frontend, orchestration, data, VCS)
  6. Repository layout (full tree with annotations)
  7. Backend — the prediction engine (data structures, methods, why hand-rolled, train.py, app.py, requirements)
  8. Frontend — the chat bar (HTML structure, the ghost-layer sizing trick, JS state machine, CSS theming, server.js)
  9. Teach-a-word feature (UX, mechanics, why MVP, details)
  10. Personalization blending (the math, why blend, why 2× boost)
  11. Persistence model (every file, why pickle vs text, crash safety)
  12. Bootstrap + dev orchestration (bootstrap.js, dev.js, why not Docker yet)
  13. How `npm run dev` works end-to-end (full trace from `npm run dev` to both servers running)
  14. API contract (all 3 routes with request/response examples)
  15. Data flow on a single keystroke (18-step trace from `<textarea>` input event to ghost render)
  16. Performance characteristics (latency tables, memory, storage growth)
  17. Failure modes and how we handle them (10-row table)
  18. What is intentionally out of scope (the design boundaries)
  19. Upgrade path (phase-by-phase engine-agnostic roadmap)
  20. How to extend (5 recipes for common changes)
  - Appendix A: one-liner commands, env vars, file index.
- This is the doc anyone (human or AI) reads to grok the whole project without touching code.

**Decisions settled this session:**

| Decision | Choice | Rationale |
|---|---|---|
| **Chat bar element** | `<textarea>` not `<input>` | Multi-line wrap for free; PRD's "single-line ChatGPT-style" superseded by Jana's "dynamic sizing" request. |
| **Sizing mechanism** | Ghost layer (visibility:hidden) mirrors text → drive textarea height from `scrollHeight` | Same font/wrap rules as textarea, exact natural-height measurement, no two-pass guess-and-correct. |
| **Max height cap** | `min(50vh, 320px)` | 50vh covers laptops; 320px absolute cap covers huge monitors where 50vh would dominate. ~8 lines max. |
| **Overflow past cap** | `overflow:auto` on textarea, scroll within | Bar doesn't push other UI off-screen; user can still type forever and scroll. |
| **Sizing measurement** | Include `currentSuggestion + zero-width-space` in ghost-layer text | The suggestion takes horizontal space, so bar height should reflect it too — keeps the ghost from causing layout reflow when accepted. |
| **Bootstrap as a script** | Standalone `scripts/bootstrap.js`, called by `npm run train` / `npm run retrain` / `dev.js` (inlined) | Reusable, testable, CI-friendly. dev.js inlines to avoid spawning an extra Node process at startup. |
| **EADDRINUSE handling** | server.js exits 0 with a warning; dev.js keeps backend alive | Old `node server.js` from a Ctrl+C zombie is usually serving the same files anyway. No need to fight it. |
| **Pickle migration** | `__setstate__` backfills missing attributes | Bulletproof against field additions. Future Jana adds `p_quadgrams` (lol never) → existing pickles load cleanly. |
| **`project.md` location** | Parent `GhostType/`, not inside `gtype/` | Matches the existing pattern (documentation.md is also at parent level for the AI-agent journal — `project.md` is the human-facing version). |

**What's next (when Jana resumes):**
1. **Test the dynamic chat bar visually.** Open localhost:3000, type a wall of text, confirm the bar grows and stops at the cap. Verify the meta line updates chars/lines count.
2. **Test the teach feature end-to-end.** Click `+`, teach "janarthanana", type "hello my name is" — confirm janarthanana shows as the top ghost.
3. **Test the bootstrap.** Delete `backend/.venv` and `backend/data/model.pkl`, run `npm run dev` — confirm it rebuilds both.
4. **Commit current state to git.** `git add . && git commit -m "Phase 1.5: dynamic bar + self-bootstrapping dev + project.md"`.
5. **Phase 2 candidates**: keyboard navigation, phrase suggestions, SQLite history, multiple corpus profiles. See [PLAN.md §3](./PLAN.md).

**Open questions (still pending):**
- Personalization data source: WhatsApp/Telegram export vs manual paste?
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.
- Starter corpus duplication factor 50× — tune after first demo.
- Blend weight 0.3 — bump to 0.5 if taught words feel too weak.
- Exportable/importable `personal.txt` for cross-machine portability?
- Python launcher detection (py -3 vs python vs python3) for POSIX users.
- **New:** is `min(50vh, 320px)` the right bar max-height cap? Jana might want a larger cap for long-form note-taking.
- **New:** should the ghost layer show even before the user hits a trailing space? Currently it requires a trailing space or empty input — matches PRD spec but might feel less responsive for some users.

---

### Entry 7 — 2026-08-19 — Default phrases baked in (no Cornell dependency)

**By:** JARVIS (with Jana directing)
**Phase:** Polish — out-of-the-box UX, model dominance fix

**What happened:**
- Jana asked: "give me a list for like explaining what is ghost a basic list of 500 word with eg on how to use them" → JARVIS produced ~240 phrases. Jana followed up with "ok hard code this into the code base fast" → the list went into the repo as `data/default_phrases.txt`.
- After baking in, JARVIS trained (`defaults×50 + starter×50 + cornell`) and tested predictions: defaults showed up but the Cornell tail was winning on most short contexts (`'good '` → `['to', 'night', 'for']` — `'for'` and `'to'` are pure Cornell tail, not from defaults).
- Root cause: defaults were folded into **base tables only**. With 50× boost × ~240 phrases = ~12k training lines, Cornell at ~300k raw lines still dominated any context the defaults didn't explicitly cover.
- Fix: load defaults into **personal tables** at app startup (same code path as `personal.txt`). Personal tables get the 0.3 weight boost at predict time → taught/default phrases always surface ahead of Cornell noise.

**What was produced (this session):**

- [gtype/data/default_phrases.txt](../data/default_phrases.txt) — **new**, 240 lines / ~7 KB. Categories: greetings, introductions (with Jana's "janarthanana" / "you may call me jana" patterns), thanks + small talk, focus-line sentence starters, work/dev vocabulary (push/commit/deploy/ship/fix/test/build), question openers ("what do you", "how do we", "where do we", "how can i", "why are we"), transitions + connectors ("first of all", "in summary", "to be honest", "the interesting thing is"), closings + thanks. Loaded on every backend startup.
- [gtype/backend/train.py](../backend/train.py) — already supported defaults since Entry 2. Confirmed `--defaults` arg + 50× boost + dedupe path all green. Smoke output: `defaults×50: 13400 / starter×50: 17650 / cornell: 304766 / total unique: 305146`.
- [gtype/scripts/bootstrap.js](../scripts/bootstrap.js) — step 4 now verifies `data/default_phrases.txt` exists (fails if missing — repo is broken) and prints size. Cornell still soft-warns.
- [gtype/backend/app.py](../backend/app.py) — added `DEFAULTS_PATH` env var (`GHOSTTYPE_DEFAULTS`, default `../data/default_phrases.txt`). After the `personal.txt` loader, added a second loop that reads `defaults` and calls `engine.teach(line)` for each non-comment line. This is the personal-table fold — defaults are now **always-taught** every restart. Logged: `Loaded N default phrases from data/default_phrases.txt`.
- [gtype/backend/app.py](../backend/app.py) — removed the inline `__setstate__` backfill block (was redundant once `engine.py:__setstate__` shipped in Entry 5). Replaced with a one-line comment pointing at `engine.py:__setstate__` so future agents know where the migration lives.

**End-to-end smoke (defaults loaded into personal tables, personal_weight=0.3):**

| Input | Old (base-only) | New (defaults as personal) |
|---|---|---|
| `'good '` | `['to', 'night', 'for']` | `['morning', 'afternoon', 'night']` ✓ |
| `'my name '` | `['is', "isn't", 'on']` | `['is', "isn't", 'on']` (unchanged) |
| `'i need to '` | `['make', 'ship', 'write']` | `['make', 'ship', 'write']` (already good) |
| `"let's "` | `['ship', 'build', 'get']` | `['ship', 'build', 'get']` (already good) |
| `'how do we '` | `['start', 'ship', 'deploy']` | `['start', 'ship', 'deploy']` (already good) |
| `'have a '` | `['good', 'great', 'little']` | `['good', 'great', 'little']` (already good) |
| `'hello my name is '` | `['janarthanana', 'jana', 'john']` | `['janarthanana', 'jana', 'john']` (already good — Jana's intro was in starter) |

Most predictions already worked because starter_corpus.txt had the high-signal patterns; defaults now also surface on the more generic contexts that were Cornell-dominated (`'good '`).

**Decisions settled this session:**

| Decision | Choice | Rationale |
|---|---|---|
| Default-phrase storage | Tracked in repo at `data/default_phrases.txt` | Same file feeds train.py (base tables, weighted 50×) AND app.py (personal tables, always-taught). One source of truth, two consumers. |
| Dual-load pattern | Same `engine.teach()` path as user-taught words | Defaults get the same `personal_weight` boost as user list — predictable behavior, no special-casing in `predict()`. |
| Defaults in base tables | Kept (still 50× during train) | Belt-and-braces — even if personal-table path is bypassed (tests, CLI tools), defaults still influence base predictions. |
| Where the fold happens | `app.py` startup loader | No `model.pkl` rebuild needed. Defaults evolve by editing the file + restart. |
| `__setstate__` backfill in app.py | Removed | `engine.py:__setstate__` is now the single source of truth for pickle migration. Comment left behind points there. |

**What's next (when Jana resumes):**
1. Live-test the predictions in the browser: type "good ", "have a ", "i need to ", "thank you " — confirm the cleaner defaults come up.
2. Edit `data/default_phrases.txt` to add domain-specific phrases if Jana wants. Restart backend, no retrain needed.
3. `git add -A && git commit -m "Phase 1.5 polish: bake in defaults, fold into personal tables"`.
4. Phase 2 candidates: keyboard navigation, phrase suggestions, SQLite history, multiple corpus profiles (see [PLAN.md §3](./PLAN.md)).

**Open questions (still pending, plus new):**
- Personalization data source: WhatsApp/Telegram export vs manual paste? → moot for live feature; still matters for starter-corpus bootstrap.
- UI polish budget: bare chat bar OK, or header/sidebar from Phase 1?
- Engine badge visibility (n-gram vs LLM) in Phase 3: user-visible or debug-only?
- Docker Compose target: Phase 2 add-on, or stay `npm run dev` only?
- Multilingual tokenization: English-only MVP. Confirm.
- Starter corpus duplication factor 50× — tune after first demo.
- Blend weight 0.3 — bump to 0.5 if taught words feel too weak.
- Exportable/importable `personal.txt` for cross-machine portability?
- Python launcher detection (py -3 vs python vs python3) for POSIX users.
- Chat-bar max-height cap (`min(50vh, 320px)` ≈ 8 lines).
- Ghost-layer visibility before trailing space.
- **New:** should the default-phrases list be split into category files (`defaults/greetings.txt`, `defaults/work.txt`) and concatenated at train-time? Easier to maintain individually, harder to lose changes to.
- **New:** is 240 phrases the right count, or trim to ~100 high-signal ones? More = more Cornell-drowned, fewer = more likely a useful context is missing.
