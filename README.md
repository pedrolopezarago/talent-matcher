# AI Talent Matcher

NTT DATA case, CDTM × UPV-UV Hackathon, 21 Nov 2026.

**The person you need is already in the company. We find them.** Describe a project, and the app extracts requirements per role, applies hard filters in code, matches people by meaning, explains every match with verified evidence and builds the best overall team.

**Live:** https://talent-matcher-five.vercel.app · demo with seeded data: https://talent-matcher-five.vercel.app/demo

The full spec is in [`.plans/ai-talent-matcher-spec.md`](.plans/ai-talent-matcher-spec.md). The API contract is in [`shared/contract.ts`](shared/contract.ts).

## Layout
| Folder | Owner | What |
|---|---|---|
| `src/` (repo root) | Frontend | Lovable app (TanStack Start + React + TS), deployed to Vercel with bun. UI in `src/talent/`; works against `src/talent/mocks/` until `VITE_API_URL` is set |
| `backend/` | Builder A | FastAPI, the matching pipeline, Postgres + pgvector |
| `shared/` | both | API contract and test briefs. Tell the other person before changing them |
| `scripts/` | Builder A | Ingest, embedding job, pitch stats |

## Run locally
```bash
cp .env.example .env            # fill in the keys (never commit them)
docker compose up -d            # Postgres + pgvector
python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt
python -m scripts.ingest profiles.parquet   # once: loads 190k profiles (~30 s)
uvicorn backend.app.main:app --reload --port 8000
python -m pytest -q                         # backend tests, no LLM cost

bun install && bun run dev       # frontend, from the repo root
```

## Data
`profiles.parquet` (190k synthetic NTT DATA profiles) is **not** in the repo. Download it from the link in the NTT DATA "Data & Resources" PDF and put it in the repo root.

## Honesty
- The backend pipeline is real (see `docs/backend-architecture.md`); the deployed frontend still uses its seeded mocks until `VITE_API_URL` points at a deployed backend.
- The `/demo` route uses a seeded result.
