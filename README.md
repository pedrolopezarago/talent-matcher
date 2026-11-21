# AI Talent Matcher

NTT DATA case, CDTM × UPV-UV Hackathon, 21 Nov 2026.

**The person you need is already in the company. We find them.** Describe a project, and the app extracts requirements per role, applies hard filters in code, matches people by meaning, explains every match with verified evidence and builds the best overall team.

The full spec is in [`.plans/ai-talent-matcher-spec.md`](.plans/ai-talent-matcher-spec.md). The API contract is in [`shared/contract.ts`](shared/contract.ts).

## Layout
| Folder | Owner | What |
|---|---|---|
| `frontend/` | Builder B | Vite + React + TS, deployed to Vercel. Works against `src/mocks/` until the API is live |
| `backend/` | Builder A | FastAPI, the matching pipeline, Postgres + pgvector |
| `shared/` | both | API contract and test briefs. Tell the other person before changing them |
| `scripts/` | Builder A | Ingest, embedding job, pitch stats |

## Run locally
```bash
cp .env.example .env            # fill in the keys (never commit them)
docker compose up -d            # Postgres + pgvector
python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000

cd frontend && npm install && npm run dev
```

## Data
`profiles.parquet` (190k synthetic NTT DATA profiles) is **not** in the repo. Download it from the link in the NTT DATA "Data & Resources" PDF and put it in the repo root.

## Honesty
- The endpoints return seeded mocks until the pipeline is wired up.
- The `/demo` route uses a seeded result.
