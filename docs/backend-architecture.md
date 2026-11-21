# Backend architecture — technical reference

FastAPI app (`backend/app`) over Postgres + pgvector, seeded from `profiles.parquet` (190,000 synthetic NTT DATA profiles). Design: `docs/superpowers/specs/2026-11-21-backend-pipeline-design.md`. Running log with measurements: `docs/backend-log.md`. Data fields: `docs/data-schema.md`.

## Endpoints (shapes in `shared/contract.ts`, mirrored by `backend/app/models.py`)
| Endpoint | What |
|---|---|
| `POST /api/brief/parse {text, lang}` | Brief → roles + requirements (1 LLM call). 422 on empty text / no roles, 502 if the LLM fails |
| `POST /api/match {brief, lang?}` | Ranked, evidence-backed candidates per role + reserve lane + funnel + grounding totals |
| `POST /api/team {brief, match, lang?}` | Optimal team vs greedy, swaps, explanation, joint coverage |
| `GET /api/profile/{id}` | Full stored profile (drawer). 404 if unknown |
| `GET /api/health` | `{ok, llm, retrieval}` |

## Pipeline per role
1. **Parse** (LLM, `LLM_MODEL_EXTRACT`): requirements mapped onto the data vocabulary (614 skills, 87 roles, sectors) + vocabulary synonyms. Code clamps numbers and assigns ids.
2. **Hard filters (SQL, never the LLM)**: availability from start date, `anios_experiencia >= min_years`, must-have languages by CEFR rank. Location is never a filter.
3. **Retrieval**: keyword mode (default) scores every filtered profile in SQL by weighted requirement overlap on `search_text`; synonyms bridge different wording. Vector mode is designed (`embedding halfvec(512)` column) but not active: no embedding key funded.
4. **Screening** (LLM, `LLM_MODEL_SCREEN` = Haiku, effort low): up to `SCREEN_MAX_PER_ROLE` compact cards in batches of 50, scored 0–10.
5. **Judging** (LLM, `LLM_MODEL_JUDGE` = Sonnet): top `JUDGE_TOP_N` in batches of 10; per requirement met/partial/missing citing **paths only**.
6. **Grounding (code)**: every path resolved against the stored profile; the display value is rendered by code. Bad paths dropped and counted; unsupported requirements become missing; strengths with no valid path are deleted. `grounding.dropped` is the number of blocked claims.
7. **Score (code)**: weighted credit with a skill depth factor; any must missing caps fit at 69. Hidden talent: different area with ≥0.7 must coverage; vocabulary bridges.
8. **Team (code)**: Hungarian algorithm (`linear_sum_assignment`) on fit × criticality vs greedy.

## Provider switch (`.env` only)
`LLM_PROVIDER=anthropic` (structured outputs) or `openai_compat` with `LLM_BASE_URL` (OpenRouter, Azure OpenAI). Models per task: `LLM_MODEL_EXTRACT/SCREEN/JUDGE/TEAM`. No provider code outside `backend/app/llm.py`.

## Cost and safety guards
- Prices in `llm.PRICES`; every call is tallied, logged per request. `MAX_USD_PER_REQUEST` (default 0.75) stops launching screening batches once exceeded.
- Each LLM call retries once; a failed batch is dropped and counted, never faked.
- Tests use `LLM_PROVIDER=fake` → zero cost (`python -m pytest -q`).
- Email is never sent to the LLM and cannot be cited as evidence (path whitelist).

## Run
```
docker compose up -d
python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt
python -m scripts.ingest profiles.parquet
uvicorn backend.app.main:app --reload --port 8000
python -m pytest -q
```
