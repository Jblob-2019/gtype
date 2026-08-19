# GhostType (gtype)

> Local predictive-text chat bar. FastAPI n-gram backend + vanilla HTML/JS frontend. Self-hosted, offline, **single command to run — does everything for you**.

## Quickstart

```bash
npm install     # one-time, downloads concurrently + node deps
npm run dev     # checks Python venv + deps + model, trains if missing, then boots both
```

Open **http://localhost:3000** → type something → chips appear → click to autocomplete.

The `npm run dev` script is **self-bootstrapping**: it verifies Python, creates the venv if missing, installs `requirements.txt`, trains `model.pkl` if absent, and starts both servers in parallel. Re-running on a fully-prepared machine just verifies and continues.

## Docs

- **[docs/OVERVIEW.md](./docs/OVERVIEW.md)** — what it is, why, who for
- **[docs/PLAN.md](./docs/PLAN.md)** — extra-detailed phased build plan
- **[PRD.md](./PRD.md)** — original product requirements
- **[TRD.md](./TRD.md)** — original technical requirements
- **[WORKFLOW.yml](./WORKFLOW.yml)** — self-bootstrapping dev workflow spec

## Ports

| Service  | Port | URL                          |
|----------|------|------------------------------|
| Frontend | 3000 | http://localhost:3000        |
| Backend  | 4000 | http://localhost:4000        |
| API docs | 4000 | http://localhost:4000/docs   |

## Repo layout

```
gtype/
├── backend/        # FastAPI app, n-gram engine, training script, tests
├── frontend/       # Vanilla HTML/CSS/JS chat bar + tiny static server
├── scripts/        # bootstrap.js + dev.js — the self-bootstrapping dev pipeline
├── data/           # Raw corpus downloads (gitignored)
├── docs/           # OVERVIEW, PLAN, documentation.md (agent journal)
├── package.json    # npm run dev entry point
├── WORKFLOW.yml    # Dev workflow spec
├── PRD.md
├── TRD.md
└── README.md
```

## Status

**MVP + Phase 1.5 (teach-a-word) shipped.** See [docs/PLAN.md §1-2](./docs/PLAN.md).
