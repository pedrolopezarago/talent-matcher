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

### Task 5 — hard filters + keyword retrieval
- Availability rule from the start date (immediate/<1 month → En banca; 1–3 months → + Roll-off with timing risk; ≥3 → same pool, no risk). Unparseable date → immediate. Must-have languages filtered by CEFR rank in SQL (no level → B2). Location and nice requirements are never filters.
- Keyword retrieval scored in SQL: each requirement counts once if its value or any synonym is in `search_text` (must 3×w, nice w), + 0.1 × skill level, sector via `sector_principal` / project `cliente_sector`, +2 if the role title matches. Normalised to 0–1 (used as `similarity`).
- Measured: Cloud Architect (AWS, Terraform, banking nice, English B2 must), start in 2 months → 26,555 after filters, top 1,000 retrieved in 0.64 s.

### Task 6 — profile views + screening
- `profile_view.py`: compact card (~150 tokens) for screening, judge view (stored keys so paths resolve), `resolve_path` (never raises, only whitelisted roots — `email` can't be cited) and `render` (display values in the formats of `docs/data-schema.md`). Email never goes to the LLM.
- Screening: batches of 50 cards, parallel (semaphore `MAX_LLM_CONCURRENCY`), score 0–10 + short reason; unknown ids ignored; failed batches counted and skipped; stops launching batches once the per-request cost cap is hit. Ties keep retrieval order.

### Task 7 — judging + grounding
- Judging: batches of 10 compact-JSON profiles, per requirement `met|partial|missing` + evidence **paths only**, plus strengths (with paths), gaps, risks in the requested language. Prompt rewards skills evidenced in projects/experience and flags "low level despite years" and "only in an old project".
- Grounding (code): each path resolved against the stored profile and its value rendered by code. Unresolvable path → dropped and counted; requirement left without evidence → `missing`; strength with no valid path → removed; unknown req_id → dropped; every requirement appears exactly once. Totals feed `grounding {claims, dropped}`.

### Task 8 — fit score + hidden talent
- `fit = Σ credit·w / Σ w` (met 1, partial 0.5, missing 0; must 3×weight, nice 1×weight), skill requirements × depth `0.6 + 0.4·mean(level/5, min(years,5)/5)` using the cited skill (else name/synonym match). Any must missing → capped at 69.
- `different_area`: area ≠ modal area for that role title in the data, and must coverage ≥ 0.7. `vocab_bridges`: met requirement whose evidence doesn't contain the literal asked term.

### Task 9 — `/api/match` end to end, reserve lane, `/api/profile/{id}`
- Per role, concurrently: availability rule → SQL filters → count → keyword retrieval (`review_depth`, clamped) → screening → top `JUDGE_TOP_N` judged → grounded → scored → hidden flags → sorted by (fit, similarity). Roll-off candidates get a timing risk when the start is 1–3 months away.
- Reserve lane: same retrieval over `Asignado`, top 5, judged and scored the same way (no screening).
- Role with zero profiles after filters → returned with an empty list and no LLM calls.
- Funnel: total 190,000 → after_filters → reviewed (retrieved and screened) → ranked (judged).
- Live run pending: needs `LLM_API_KEY` in `.env` (empty for now).
