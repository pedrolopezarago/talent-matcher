# Backend pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock FastAPI stub with the real pipeline: brief → hard filters (SQL) → keyword retrieval → LLM screening → LLM judging → grounding → score → team, behind the exact shapes of `shared/contract.ts`.

**Architecture:** FastAPI app in `backend/app`, Postgres + pgvector (Docker locally) seeded from `profiles.parquet`. Deterministic steps (filters, retrieval, grounding, score, team) are plain Python/SQL with unit tests; LLM steps go through one adapter `llm.complete_json()` with a `fake` provider so tests cost nothing.

**Tech Stack:** Python 3.13, FastAPI, Pydantic v2, psycopg 3, pgvector/pg16, pyarrow, scipy, anthropic SDK, openai SDK, pytest.

**Spec:** `docs/superpowers/specs/2026-11-21-backend-pipeline-design.md` (wins over `.plans/ai-talent-matcher-spec.md` for the backend).

## Global Constraints

- Feature freeze 15:30, submission 16:45 (21 Nov 2026). Build order: core `/api/match` → `/api/team` → reserve lane + hidden flags → vector mode (only if an embedding key appears). Later items drop if time runs out.
- Budget: $7.58 Anthropic credit total. Tests never call a real LLM (`LLM_PROVIDER=fake`). One live end-to-end run at the end, cost logged.
- Hard rules (availability, `min_years`, must-have languages) are enforced in SQL, never by the LLM.
- No provider-specific code outside `backend/app/llm.py` / `backend/app/embed.py`.
- No API key in the repo or the frontend. `.env` is git-ignored; only `.env.example` is committed.
- Responses match `shared/contract.ts` exactly. Contract changes are additive only: `MatchResult.retrieval?: "vector" | "keyword"`, optional `lang` in match/team bodies (default `"en"`), updated comments on `review_depth` ("screening depth, clamped 100–1000") and `similarity` ("vector similarity, or normalised keyword score in keyword mode"). Announce in the commit message and `docs/backend-log.md`.
- `review_depth` clamped to `[100, SCREEN_MAX_PER_ROLE]` (default 1000). `JUDGE_TOP_N=40`, `MAX_LLM_CONCURRENCY=8`, `MAX_USD_PER_REQUEST=0.75`.
- CEFR order: Nativo > C2 > C1 > B2 > B1 > A2 > A1.
- Availability values: `En banca`, `Roll-off próximo (<3 meses)`, `Asignado`.
- Do not touch `supabase/migrations/`, `drizzle/`, `src/`, `frontend/` (Lovable / frontend owner).
- After each task: commit on `be/pipeline`, merge to `main` and push (authorised for this project in the spec). Never force-push.
- Update `docs/backend-log.md` (what + why) in every task's commit.

## Review Focus

1. Brief with no roles or empty text → `/api/brief/parse` returns 422, not a 500 or an empty `Brief`. (Task 4)
2. Filters leave zero candidates for a role (e.g. "Nativo" + immediate + 15 years) → role returned with `funnel.after_filters = 0`, `candidates = []`, no LLM call. (Task 9)
3. LLM cites a path that doesn't exist or an index out of range (`skills[99]`) → dropped and counted, never a crash. (Task 7)
4. A screening/judging batch returns invalid JSON or fails twice → batch dropped, counted, request still succeeds. (Tasks 6, 7)
5. `/api/team` with fewer candidates than slots for a role → slots left unfilled, no exception from `linear_sum_assignment`. (Task 10)

---

## File structure

```
backend/__init__.py, backend/app/__init__.py, backend/app/pipeline/__init__.py   empty
backend/app/config.py      Settings dataclass from env
backend/app/models.py      Pydantic mirror of shared/contract.ts (+ additive fields)
backend/app/db.py          connection pool, fetch helpers
backend/app/vocab.py       distinct areas/roles/sectors/skills, cached
backend/app/llm.py         complete_json(); providers anthropic | openai_compat | fake
backend/app/profile_view.py  compact card / judge JSON / path resolution + display rendering
backend/app/pipeline/{parse,filters,retrieve,screen,judge,ground,score,team,match}.py
backend/app/main.py        routes
backend/tests/             pytest; conftest.py sets LLM_PROVIDER=fake
scripts/inspect_parquet.py, scripts/ingest.py
docs/data-schema.md, docs/backend-log.md, docs/backend-architecture.md
```

Run everything from the repo root with the venv active: `python -m pytest backend/tests -q`.

---

### Task 1: Project setup, config, contract models

**Files:**
- Create: `backend/__init__.py`, `backend/app/__init__.py`, `backend/app/pipeline/__init__.py`, `backend/app/config.py`, `backend/app/models.py`, `backend/tests/conftest.py`, `backend/tests/test_models.py`, `docs/backend-log.md`
- Modify: `backend/requirements.txt` (add `anthropic`, `pytest`, `httpx`), `.env.example` (replace with spec §5 config block), `shared/contract.ts` (additive changes from Global Constraints)

**Interfaces:**
- Produces: `config.settings: Settings` with fields `llm_provider, llm_api_key, llm_base_url, llm_model_extract, llm_model_screen, llm_model_judge, llm_model_team, embed_provider, embed_base_url, embed_api_key, embed_model, embed_dim:int, database_url, screen_max_per_role:int=1000, judge_top_n:int=40, max_llm_concurrency:int=8, max_usd_per_request:float=0.75, cors_origins:list[str]`; `config.load_settings() -> Settings` (re-reads env, used by tests).
- Produces: Pydantic models with the contract's names: `Requirement, Role, Brief, Evidence, Coverage, Hidden, VocabBridge, Candidate, Funnel, RoleResult, MatchResult (retrieval: Literal["vector","keyword"]|None), TeamSlot, Swap, JointCoverage, TeamResult`, request bodies `ParseRequest{text:str (min_length=1), lang:Literal["es","en"]="en"}`, `MatchRequest{brief, lang="en"}`, `TeamRequest{brief, match, lang="en"}`.

- [ ] **Step 1:** `python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt`. Expected: installs without error.
- [ ] **Step 2: Write the failing test** `backend/tests/test_models.py`:
  - `test_mocks_validate`: `Brief.model_validate(json of frontend/src/mocks/brief.json)`, same for `MatchResult` / `match.json` and `TeamResult` / `team.json` — no exception.
  - `test_parse_request_rejects_empty_text`: `ParseRequest(text="")` raises `ValidationError`.
  - `test_settings_defaults`: with env cleared except `LLM_PROVIDER=fake`, `load_settings().screen_max_per_role == 1000` and `.judge_top_n == 40`.
- [ ] **Step 3:** Run `python -m pytest backend/tests/test_models.py -q`. Expected: FAIL (ImportError).
- [ ] **Step 4:** Implement `config.py` (plain `os.getenv` + `python-dotenv`), `models.py`, `conftest.py` (sets `LLM_PROVIDER=fake`, `EMBED_PROVIDER=none` via `monkeypatch`/`os.environ` before imports).
- [ ] **Step 5:** Run the test. Expected: 3 passed.
- [ ] **Step 6:** Commit `feat(backend): config, contract models, test setup`; mention the additive contract changes in the message and in `docs/backend-log.md`. Merge to `main`, push.

### Task 2: Data — inspect schema, ingest to Postgres, vocabulary

Needs `profiles.parquet` in the repo root and `docker compose up -d` running.

**Files:**
- Create: `scripts/inspect_parquet.py`, `docs/data-schema.md`, `scripts/ingest.py`, `backend/app/db.py`, `backend/app/vocab.py`, `backend/tests/test_ingest.py`

**Interfaces:**
- Produces: table `profiles` — every scalar parquet column as a column, nested fields as `jsonb`, plus `lang_levels jsonb` (`{"Inglés": 5, ...}` with Nativo=7, C2=6, C1=5, B2=4, B1=3, A2=2, A1=1), `embedding halfvec(512) NULL`, `search_text text` (lowercased role + skills + project technologies + certs, used by keyword retrieval). Primary key `employee_id`. Indexes on `disponibilidad`, `anios_experiencia`, `pais`.
- Produces: `db.fetch_all(sql:str, params:dict|tuple) -> list[dict]`, `db.fetch_one(...) -> dict|None`, `db.get_profile(employee_id:str) -> dict|None`.
- Produces: `vocab.get_vocab() -> Vocab{areas:list[str], roles:list[str], sectors:list[str], skills:list[str], modal_area_by_role:dict[str,str]}` (cached).
- Produces: `scripts/ingest.py` pure helpers `cefr_rank(level:str) -> int` and `build_lang_levels(idiomas:list[dict]) -> dict[str,int]`.

- [ ] **Step 1:** Write and run `python scripts/inspect_parquet.py profiles.parquet` (pyarrow schema + 2 example rows + distinct counts for `disponibilidad`, `rol`, `area`). Write the result into `docs/data-schema.md`: every column, nested struct field names, and the exact display format each list item will use in evidence (e.g. skill → `"AWS (nivel 5, 6 años)"`, language → `"Inglés C1"`). **Every later task uses the field names in this file.** If a field named in the spec (`disponibilidad`, `anios_experiencia`, `rol`, `area`, `skills`, `proyectos`, `idiomas`, `certificaciones`) has a different name, record the mapping there.
- [ ] **Step 2: Write the failing test** `test_ingest.py`: `cefr_rank("Nativo")==7`, `cefr_rank("c1")==5`, `cefr_rank("??")==0`; `build_lang_levels([{"idioma":"Inglés","nivel":"C1"}]) == {"Inglés":5}` (adjust keys to `docs/data-schema.md`).
- [ ] **Step 3:** Run it. Expected: FAIL.
- [ ] **Step 4:** Implement `scripts/ingest.py`: create table if missing, read parquet in batches of 5,000 with pyarrow, upsert by `employee_id` (`ON CONFLICT DO UPDATE`), idempotent. Implement `db.py` (psycopg `ConnectionPool` from `psycopg_pool` → add `psycopg[pool]` to requirements, rows as dicts) and `vocab.py` (`SELECT DISTINCT` + `jsonb_array_elements` for skills; modal area per `rol` via `mode() WITHIN GROUP`).
- [ ] **Step 5:** Run tests. Expected: pass. Run `python scripts/ingest.py profiles.parquet`, then `psql`/`fetch_one("select count(*) ...")`. Expected: `190000`; availability counts 156k/18.7k/15.3k; `len(get_vocab().skills) == 614`, 87 roles, 12 areas. Paste numbers into `docs/backend-log.md`.
- [ ] **Step 6:** Commit `feat(backend): parquet ingest, db helpers, vocabulary`. Merge, push.

### Task 3: LLM adapter

**Files:**
- Create: `backend/app/llm.py`, `backend/tests/test_llm.py`

**Interfaces:**
- Produces: `async complete_json(task: Literal["extract","screen","judge","team"], system: str, user: str, schema: dict, max_tokens: int = 4096) -> dict`. Picks the model from `settings.llm_model_<task>`. Raises `LLMError` after one retry on invalid/unparseable output.
- Produces: `llm.fake_responses: dict[str, Callable[[str], dict]]` — tests register canned outputs per task; `fake` provider calls `fake_responses[task](user)`.
- Produces: `llm.usage: UsageTally` with `add(model, input_tokens, output_tokens)`, `usd() -> float`, `reset()`; prices hard-coded per model in one dict (look up current Haiku/Sonnet prices with the claude-api skill; don't guess).
- Provider `anthropic`: `AsyncAnthropic`, forced tool use (`tools=[{"name":"emit","input_schema":schema}]`, `tool_choice={"type":"tool","name":"emit"}`), return the tool input. Put `system` in a cache-controlled block (requirements block repeats across screening batches). Verify parameter names with Context7 / claude-api skill before coding.
- Provider `openai_compat`: `AsyncOpenAI(base_url, api_key)`, `response_format={"type":"json_schema", ...}`, `json.loads`.
- Concurrency: module-level `asyncio.Semaphore(settings.max_llm_concurrency)` around every call.

- [ ] **Step 1: Write the failing test** `test_llm.py`:
  - `test_fake_provider_returns_registered`: register `fake_responses["screen"] = lambda u: {"items": []}`; `await complete_json("screen","s","u",{})` == `{"items": []}`.
  - `test_invalid_output_retries_then_raises`: fake returns a non-dict twice → `LLMError`; count calls == 2.
  - `test_usage_usd`: `usage.add("claude-haiku-5-5", 1_000_000, 0)` → `usd()` equals the Haiku input price per MTok.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Add `pytest-asyncio` to requirements (`asyncio_mode = auto` in `pytest.ini` at repo root).
- [ ] **Step 4:** Run. Expected: pass.
- [ ] **Step 5:** Commit `feat(backend): provider-agnostic LLM adapter with fake provider`. Merge, push.

### Task 4: Parse brief (`POST /api/brief/parse`)

**Files:**
- Create: `backend/app/pipeline/parse.py`, `backend/tests/test_parse.py`
- Modify: `backend/app/main.py` (route + `/api/health` returning `{"ok": True, "llm": settings.llm_provider, "retrieval": "vector"|"keyword"}`; CORS from `settings.cors_origins`)

**Interfaces:**
- Consumes: `complete_json("extract", ...)`, `get_vocab()`, `Brief`.
- Produces: `async parse_brief(text: str, lang: str) -> Brief`. Post-processing in code: `review_depth = clamp(review_depth, 100, settings.screen_max_per_role)`; `immediate = start_date is None` when no date; requirement ids `"{role_id}-q{n}"`; weights clamped 1–3; criticality clamped 1–5; raise `ValueError` if `roles` is empty.
- Prompt rules (spec §6.1): map values onto the vocabulary; "deseable / valorable / not essential / a plus" → `must=false`; implicit requirements `implicit=true, must=false` unless stated; Project Manager only if the brief asks.

- [ ] **Step 1: Write the failing test** `test_parse.py` with a fake extract response for test brief 2:
  - `test_review_depth_clamped`: fake returns `review_depth=20` → result `100`; `5000` → `1000`.
  - `test_no_date_means_immediate`: fake omits `start_date` → `brief.immediate is True`.
  - `test_empty_roles_rejected`: route `POST /api/brief/parse` (FastAPI `TestClient`) with fake returning `roles=[]` → 422; with `text=""` → 422.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; JSON schema for the LLM generated from `Brief.model_json_schema()`.
- [ ] **Step 4:** Run. Expected: pass.
- [ ] **Step 5:** Commit `feat(backend): brief parsing endpoint`. Merge, push.

### Task 5: Hard filters + keyword retrieval

Needs the ingested DB. DB tests use the real `talent` DB read-only and are skipped (`pytest.mark.skipif`) when Postgres is unreachable.

**Files:**
- Create: `backend/app/pipeline/filters.py`, `backend/app/pipeline/retrieve.py`, `backend/tests/test_filters.py`, `backend/tests/test_retrieve.py`

**Interfaces:**
- Produces: `availability_rule(brief: Brief, today: date) -> tuple[list[str], bool, str]` → (allowed availability values, roll_off_is_risk, human-readable rule). Rules: immediate or < 1 month → `["En banca"]`, False, `"Immediate start → only 'En banca'"`; 1–3 months → `["En banca","Roll-off próximo (<3 meses)"]`, True; ≥ 3 months → same two, False.
- Produces: `build_where(role: Role, availability: list[str]) -> tuple[str, dict]` — SQL fragment + params: `disponibilidad = ANY(%(avail)s)`, `anios_experiencia >= %(min_years)s` only if set, one `(lang_levels->>%(lang_i)s)::int >= %(rank_i)s` per **must** language requirement (rank from `cefr_rank(req.level)`; no level → B2). Never filters on location or on nice requirements.
- Produces: `count(where, params) -> int`, `total_profiles() -> int`.
- Produces: `keyword_retrieve(role: Role, where: str, params: dict, limit: int) -> list[tuple[str, float]]` → `(employee_id, score_normalised_0_1)` ordered desc. Score in SQL: for each requirement term (value + synonyms, lowercased), `search_text LIKE '%term%'` → +3 if must else +1; skill level bonus: +0.1 × level when the skill is in `skills` jsonb. Normalise by the max possible score.

- [ ] **Step 1: Write the failing tests:**
  - `test_rule_immediate`: `immediate=True` → `(["En banca"], False, ...)`.
  - `test_rule_two_months`: start = today+60d → two values, `True`.
  - `test_rule_four_months`: today+120d → two values, `False`.
  - `test_where_skips_nice_language_and_location`: role with nice `Inglés C1` and a location req → no `lang_levels` in SQL.
  - `test_where_must_language`: must `Español Nativo` → params contain rank 7.
  - DB: `test_filtered_count_le_total`, `test_keyword_retrieve_orders_desc_and_respects_filter` (every returned id has an allowed `disponibilidad`).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: pass. Time `keyword_retrieve` for test brief 1 role 1 with limit 1000; note it in the log (target < 3 s).
- [ ] **Step 5:** Commit `feat(backend): SQL hard filters and keyword retrieval`. Merge, push.

### Task 6: Profile views + screening

**Files:**
- Create: `backend/app/profile_view.py`, `backend/app/pipeline/screen.py`, `backend/tests/test_profile_view.py`, `backend/tests/test_screen.py`

**Interfaces:**
- Produces: `compact_card(p: dict) -> str` (~150 tokens: id, role, area, seniority, years, top 10 skills with level, project techs, certs, languages).
- Produces: `judge_view(p: dict) -> dict` — profile JSON restricted to judgeable fields, keys exactly as in `docs/data-schema.md` so paths like `skills[1]`, `proyectos[0].tecnologias[2]` resolve against the stored profile.
- Produces: `resolve_path(p: dict, path: str) -> Any | None` (supports `a.b`, `a[3]`, `a[3].b[1]`; returns None for missing key/index, never raises).
- Produces: `render(p: dict, path: str) -> str | None` — display string per `docs/data-schema.md` formats.
- Produces: `async screen(role: Role, profiles: list[dict], top_n: int) -> tuple[list[str], int]` → (top_n employee_ids by LLM score desc, failed_batches). Batches of 50, run with `asyncio.gather`; per batch schema `{"items":[{"employee_id":str,"score":number 0–10,"reason":str}]}`; ids not in the batch ignored; failed batch (LLMError) counted and skipped; stops launching new batches once `usage.usd() > settings.max_usd_per_request`.

- [ ] **Step 1: Write the failing tests:**
  - `test_resolve_path_nested`, `test_resolve_path_out_of_range_is_none` (`skills[99]` → None), `test_resolve_path_garbage_is_none` (`"]]x"` → None).
  - `test_render_skill_format` using a fixture profile copied from a real row in `docs/data-schema.md`.
  - `test_screen_top_n`: 120 fake profiles, fake screen scores = index-based → returns 40 ids, highest scores first.
  - `test_screen_failed_batch_counted`: fake raises `LLMError` for the batch containing id X → `failed_batches == 1`, result excludes that batch, no exception.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: pass.
- [ ] **Step 5:** Commit `feat(backend): profile views and LLM screening`. Merge, push.

### Task 7: Judging + grounding

**Files:**
- Create: `backend/app/pipeline/judge.py`, `backend/app/pipeline/ground.py`, `backend/tests/test_judge.py`, `backend/tests/test_ground.py`

**Interfaces:**
- Produces: `async judge(role: Role, profiles: list[dict], lang: str) -> tuple[list[RawJudgement], int]`; `RawJudgement = {"employee_id", "coverage":[{"req_id","status","evidence":[{"path"}]}], "strengths":[{"text","paths":[...]}], "gaps":[str], "risks":[str]}`. Batches of 10, parallel, failed batches counted. Prompt (spec §6.5): reward skills evidenced in projects/experience over listed ones; flag "level 1 despite 3+ years" and "only in an old project" as risks; write strengths/gaps/risks in `lang`. The LLM returns paths only — never values.
- Produces: `ground(raw: RawJudgement, profile: dict, role: Role) -> tuple[list[Coverage], list[str], int, int]` → (coverage, strengths, claims, dropped). For each evidence path: `render(profile, path)`; None → dropped. A requirement with no surviving evidence → `missing` (and its evidence dropped). A strength whose paths all fail → removed and counted. Unknown `req_id` → dropped. Every role requirement appears exactly once in the output coverage (missing if the LLM skipped it).

- [ ] **Step 1: Write the failing tests** (`test_ground.py`, fixture profile):
  - `test_valid_path_rendered_by_code`: evidence `skills[0]` → value equals `render(profile,"skills[0]")`, not anything from the LLM.
  - `test_bad_path_dropped_and_req_becomes_missing`: only evidence `skills[99]`, status `met` → status `missing`, `dropped == 1`.
  - `test_strength_without_valid_path_removed`.
  - `test_missing_req_filled`: LLM omits `r1-q2` → coverage has `r1-q2` as `missing`.
  - `test_judge.py::test_failed_batch_counted` (fake raises for one batch).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: pass.
- [ ] **Step 5:** Commit `feat(backend): LLM judging and code-side grounding`. Merge, push.

### Task 8: Score + hidden talent

**Files:**
- Create: `backend/app/pipeline/score.py`, `backend/tests/test_score.py`

**Interfaces:**
- Produces: `fit(role: Role, coverage: list[Coverage], profile: dict) -> int` (0–100). Credit met 1 / partial 0.5 / missing 0; skill reqs × `0.6 + 0.4 * mean(level/5, min(years,5)/5)` using the matching skill in the profile (factor 1.0 when not a skill req or the skill isn't found in `skills`); weight must = 3·w, nice = w; `round(100 * Σ credit·w / Σ w)`; any must missing → `min(fit, 69)`.
- Produces: `hidden_flags(role: Role, coverage: list[Coverage], profile: dict, modal_area: str | None) -> Hidden`. `different_area`: `profile area != modal_area` and must coverage (met=1, partial=0.5, over must reqs) ≥ 0.7. `vocab_bridges`: for each met req, if no evidence value contains `req.value` (case-insensitive) → `{asked: req.value, found: first evidence value}`.

- [ ] **Step 1: Write the failing tests:**
  - `test_all_met_non_skill_is_100`.
  - `test_must_missing_caps_69`: everything met except one must → `<= 69`.
  - `test_depth_factor`: one skill req met with level 5, years 5 → 100; level 1, years 1 → `round(100*(0.6+0.4*0.2))` = 68.
  - `test_nice_weighs_less`: must met + nice missing (both weight 1) → 75.
  - `test_vocab_bridge`: req "container orchestration" met with evidence "Kubernetes (nivel 4, 3 años)" → bridge `{asked:"container orchestration", found:"Kubernetes (nivel 4, 3 años)"}`.
  - `test_different_area_requires_coverage`: other area + must coverage 0.5 → False; 1.0 → True.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: pass.
- [ ] **Step 5:** Commit `feat(backend): fit score and hidden-talent flags`. Merge, push.

### Task 9: Match orchestration, `/api/match`, `/api/profile/{id}`, reserve lane

**Files:**
- Create: `backend/app/pipeline/match.py`, `backend/tests/test_match.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: Tasks 5–8.
- Produces: `async match(brief: Brief, lang: str, today: date | None = None) -> MatchResult`, roles processed concurrently. Per role: rule → where → `count` → `keyword_retrieve(limit=role.review_depth)` → fetch profiles → `screen(top_n=settings.judge_top_n)` → `judge` → `ground` → `fit` → `hidden_flags` → sort by (fit desc, similarity desc). `risks` gets `"Roll-off within 3 months"` (in `lang`) when `roll_off_is_risk` and the candidate is Roll-off; location mismatch with the brief becomes a risk when the brief states a city/country. Funnel: `total=total_profiles()`, `after_filters=count`, `reviewed=len(retrieved)`, `ranked=len(candidates)`. Reserve lane: same where with `disponibilidad='Asignado'`, `keyword_retrieve(limit=5)`, judged/grounded/scored the same way, skip screening. `grounding` summed over all roles. `retrieval="keyword"`. If `after_filters == 0`: return the role with empty lists, no LLM calls.
- Routes: `POST /api/match` (body `MatchRequest`), `GET /api/profile/{id}` → `db.get_profile` or 404. Log `usage.usd()` per request.

- [ ] **Step 1: Write the failing tests** (DB-backed, skipped without Postgres; fake LLM):
  - `test_match_shape_and_funnel`: test brief 1 parsed fixture → validates as `MatchResult`, `funnel.total == 190000`, `after_filters >= reviewed >= ranked`, candidates sorted by fit desc.
  - `test_zero_after_filters_no_llm`: role with must `Español Nativo`, `min_years=60` → `after_filters == 0`, `candidates == []`, fake LLM never called.
  - `test_profile_404`: `GET /api/profile/NOPE` → 404.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run full suite `python -m pytest backend/tests -q`. Expected: all pass.
- [ ] **Step 5: Live run (first real cost).** Set `SCREEN_MAX_PER_ROLE=200` in `.env`, start `uvicorn backend.app.main:app --port 8000`, `curl -X POST localhost:8000/api/brief/parse` with test brief 1, then `/api/match` with that brief. Record latency, `usage.usd()`, and 2 example candidates in `docs/backend-log.md`. Raise `SCREEN_MAX_PER_ROLE` only if cost/latency allow (target ≤ 60 s, ≤ $0.75).
- [ ] **Step 6:** Commit `feat(backend): /api/match end to end with reserve lane`. Merge, push.

### Task 10: Team builder (`/api/team`)

**Files:**
- Create: `backend/app/pipeline/team.py`, `backend/tests/test_team.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Produces: `build_team(brief: Brief, match: MatchResult) -> tuple[list[TeamSlot], list[TeamSlot], float, float]` → (optimal, greedy, optimal_score, greedy_score). Slots = roles × headcount (`slot` 0-based). Cost matrix rows = slots, cols = unique candidates across roles; cost = `-(fit × criticality)`, a large positive cost (`1e6`) where the candidate isn't in that role's list. `linear_sum_assignment` on the rectangular matrix; assignments with cost `1e6` are discarded (slot unfilled). Greedy: roles by criticality desc, each slot takes the top unused candidate of that role. Score = `Σ fit·criticality / Σ criticality over all slots` (unfilled = 0), rounded to 1 decimal.
- Produces: `async explain(optimal, greedy, swaps, lang) -> str` via `complete_json("team", ...)` schema `{"explanation": str}`; on `LLMError` fall back to a template ("Optimal team scores X vs Y for greedy: ...").
- Produces: `joint_coverage(brief, match, optimal) -> list[JointCoverage]` — for each must requirement value, names of team members whose coverage for it is met/partial.
- Route `POST /api/team` (body `TeamRequest`) → `TeamResult`.

- [ ] **Step 1: Write the failing tests:**
  - `test_optimal_beats_greedy_classic_case`: role A (crit 5) candidates X=90, Y=85; role B (crit 3) candidates X=88, Z=40 → greedy {A:X, B:Z}, optimal {A:Y, B:X}, `optimal_score > greedy_score`, swaps non-empty.
  - `test_no_person_twice`.
  - `test_fewer_candidates_than_slots`: role with headcount 2 and 1 candidate → one slot filled, no exception.
  - `test_explain_fallback`: fake team LLM raises → non-empty template string.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run full suite. Expected: all pass. One live `/api/team` call with the Task 9 output; log cost.
- [ ] **Step 5:** Commit `feat(backend): team optimiser vs greedy`. Merge, push.

### Task 11: Docs + security review

**Files:**
- Create: `docs/backend-architecture.md` (pipeline, why keyword mode, grounding guarantee, cost numbers measured, how to switch provider via `.env`, how to enable vector mode)
- Modify: `README.md` (backend run steps reflect reality), `docs/backend-log.md`

- [ ] **Step 1:** Write the docs from the log; every number must come from a measured run.
- [ ] **Step 2:** Run `/security-review` (API exposed, secrets in env); show findings to Dani; fix any high ones.
- [ ] **Step 3:** Commit `docs(backend): architecture reference`. Merge, push.

Vector mode (spec build order item 4) is deliberately not planned: it only starts if an embedding key appears, and then gets its own short plan.
