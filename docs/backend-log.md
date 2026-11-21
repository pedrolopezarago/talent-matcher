# Backend log

Running log of what the backend team did and why. Newest at the bottom.

## 2026-11-21

### Task 1 — config, contract models, tests
- `backend/app/config.py` reads `.env`; `backend/app/models.py` mirrors `shared/contract.ts`. The three frontend mocks validate against the models (test).
- **Contract changes (additive, for the frontend owner):** `MatchResult.retrieval?: "vector" | "keyword"`; optional `lang` (`es|en`, default `en`) in `/api/match` and `/api/team` bodies; `review_depth` now means screening depth, clamped 100–1000; `similarity` is the normalised keyword score in keyword mode. Applied to both `shared/contract.ts` and `src/shared/contract.ts` (identical copies).
- `.env.example` now follows the backend design (provider switch via `.env` only).
- Tests run with `LLM_PROVIDER=fake`: no test spends credit.

### Task 2 — data ingest, db helpers, vocabulary
- Real schema recorded in `docs/data-schema.md` (field names match the spec; seniority is `nivel_seniority`, name `nombre_completo`).
- `python -m scripts.ingest profiles.parquet` loads 190,000 rows into Postgres in ~30 s (M1), idempotent upsert by `employee_id`. Nested fields as `jsonb`, plus `lang_levels` (CEFR rank) and `search_text` (lowercased role + skills + technologies + certs + methodologies) for keyword retrieval.
- Verified: 190,000 rows; Asignado 155,997 · Roll-off 18,736 · En banca 15,267; vocabulary 614 skills, 87 roles, 12 areas, 10 sectors.
- Language levels in the data: Nativo, C2, C1, B2, B1, A2 (no A1).

### Task 3 — provider-agnostic LLM adapter
- `backend/app/llm.py` is the only file that knows providers: `anthropic` (structured outputs via `output_config.format`), `openai_compat` (OpenRouter/Azure, `response_format: json_schema`), `fake` (tests).
- Why structured outputs and not forced tool use: Sonnet 5.5 rejects forced `tool_choice` (400). Structured outputs guarantee valid JSON on both providers.
- Effort per task: screening `low` (cheap pass), extract/judge `medium`. System prompt cached (`cache_control`), so the requirements block repeated across screening batches is billed at cache rates.
- Prices (USD/MTok in/out): Haiku 5.5 0.10/0.50, Sonnet 5.5 2/10. Screening 1,000 cards × ~150 tokens ≈ 150k tokens ≈ $0.015 per role on Haiku.
- Every call retries once, then raises `LLMError`; callers drop the batch and count it.

### Task 4 — `/api/brief/parse`
- One structured-output call with the data vocabulary (87 roles, 12 areas, sectors, 614 skills) in the cached system prompt; the LLM maps requirements onto real data words and adds vocabulary synonyms (how keyword mode bridges different wording).
- Code clamps: review_depth 100–SCREEN_MAX_PER_ROLE, criticality 1–5, weight 1–3; ids `r{n}` / `r{n}-q{m}`; no date → `immediate=true`.
- Errors: empty text or no roles → 422; LLM failure → 502.
