# Backend pipeline — design

Date: 2026-11-21 · Owner: backend team (Builder A) · Branch: `be/pipeline` (merged + pushed to `main` after every step so the frontend owner always sees progress)

Builds on `.plans/ai-talent-matcher-spec.md` (the product spec) and `shared/contract.ts` (the API contract). Where this document differs from the spec, this document wins for the backend.

## 1. Intent

NTT DATA's staffing department receives a project need and has to propose a team. The right people usually already work at NTT DATA but sit in other departments and describe their skills with different words, so the company hires externally. The backend turns a free-text brief into a ranked, evidence-backed shortlist per role and an optimal team.

- Team size and composition come **only from the brief**. A Project Manager is just one more role (`rol = "Project Manager"` in the data), present only if the brief asks for it.
- The frontend (Vite/React, already deployed on Vercel) works today against seeded mocks (`frontend/src/mocks/`). That is the demo simulation. The backend's job is to be the real thing behind the same contract: when the frontend sets `VITE_API_URL`, it switches from mocks to the API with no other change.

## 2. Goals, non-goals, anti-goals

**Goals**
- `POST /api/brief/parse`, `POST /api/match`, `POST /api/team`, `GET /api/profile/{id}`, `GET /api/health`, all returning exactly the shapes in `shared/contract.ts`.
- **Provider-agnostic.** LLM and embedding providers are swapped by editing `.env` only (Anthropic today; OpenRouter or Azure OpenAI tomorrow). This is a pitch point: each client company plugs in the provider and key it already trusts.
- The LLM reads **as many candidates as possible** within budget and latency: up to ~1,000 per role in a cheap screening pass.
- Hard rules (availability, minimum years, must-have languages) are enforced in SQL, never by the LLM.
- Every claim shown to the user is backed by a profile field verified in code.
- Thorough documentation for technical Q&A.

**Non-goals**
- Auth, users, history, multi-project optimisation, voice.
- Running the live demo against the real backend (the frontend's mock mode is the demo).
- Generating embeddings for the demo (no embedding key is funded today).

**Anti-goals** (it would be a failure even if it "works")
- An LLM deciding a hard filter.
- A strength or evidence item shown without a verified citation.
- Provider-specific code leaking outside `llm.py` / `embed.py`.
- Any API key in the repo or the frontend.

## 3. Constraints

- **Budget:** $7.58 of Anthropic credit for all development and runs. No OpenRouter/Voyage credit.
- **Anthropic has no embeddings API.** Embeddings must come from an OpenAI-compatible provider (OpenRouter, Azure OpenAI) or Voyage, configured separately.
- **Time:** hackathon day, feature freeze 15:30, submission 16:45.
- **Hardware:** M1 8 GB (dev). Local embedding models were measured at 48 profiles/s (multilingual-e5-small) → too slow for 190k; rejected.
- **Data:** `profiles.parquet`, 190,000 rows, 87 roles, 12 areas, 614 skills. Availability: 156k `Asignado`, 18.7k `Roll-off próximo (<3 meses)`, 15.3k `En banca`. In production this is a live HR database we query; the parquet is a snapshot used to seed Postgres.

## 4. Approaches considered

| | Approach | Trade-off | Decision |
|---|---|---|---|
| A | Own thin adapter: `LLM_PROVIDER=anthropic\|openai_compat`, Anthropic SDK natively + `openai` client for any OpenAI-compatible endpoint | ~60 extra lines; native Anthropic features (structured outputs) available; swapping = `.env` only | **Chosen** |
| B | Everything through OpenRouter, with the Anthropic key as BYOK | One code path, but unverified fees/behaviour and an extra intermediary on demo day | Rejected |
| C | Anthropic's OpenAI-compatibility endpoint | Single client, but a limited compatibility layer that may break structured outputs | Rejected |

Embeddings options weighed: OpenRouter `text-embedding-3-small` @512 (~$1.3, Azure-compatible), Voyage `voyage-4-lite` (free 200M tokens, needs a payment method for usable rate limits), local e5-small (too slow), no embeddings. Decision: **pluggable embeddings with a keyword fallback** (§6.3); no embeddings are generated today.

LLM reading depth: the original spec capped the LLM at K = 20–150. Reading all available profiles (~34k per role) costs ~$4 per role on Haiku 5.5 and takes minutes, so it does not fit. Decision: **two-tier reading** (screen ~1,000, judge ~40), §6.4–6.5.

## 5. Architecture

```
Vercel (frontend, mocks today)  ──HTTPS──▶  FastAPI (backend/app)
                                              │
               ┌──────────────────────────────┼──────────────────────────┐
               ▼                              ▼                          ▼
     Postgres + pgvector             llm.py  (anthropic | openai_compat)  scipy
   (Docker local → Supabase)         embed.py (openai_compat | voyage | none)
```

### Module layout

```
backend/app/
  main.py        FastAPI routes, CORS, error mapping
  config.py      reads .env (pydantic-settings style, plain os.getenv ok)
  models.py      Pydantic mirror of shared/contract.ts
  db.py          psycopg connection pool, query helpers
  llm.py         complete_json(task, system, user, schema) → dict ; provider switch
  embed.py       embed(texts) → list[vector] | None ; provider switch
  vocab.py       distinct areas, roles, sectors, 614 skills (cached at startup)
  pipeline/
    parse.py     step 1 brief → Brief
    filters.py   step 2 SQL WHERE builder + funnel counts
    retrieve.py  step 3 vector or keyword retrieval
    screen.py    step 4 LLM screening pass
    judge.py     step 5 LLM coverage judging
    ground.py    step 6 citation verification
    score.py     step 7 fit formula + hidden-talent flags
    team.py      step 8 optimal vs greedy
scripts/
  ingest.py      parquet → Postgres (idempotent, upsert by employee_id)
  embed.py       optional embedding job (resumable, only rows with embedding IS NULL)
docs/
  backend-log.md           running log: what we did and why
  backend-architecture.md  deep technical reference for Q&A
```

### Configuration (`.env`, never committed; `.env.example` committed)

```
LLM_PROVIDER=anthropic            # anthropic | openai_compat
LLM_API_KEY=                      # Anthropic key today
LLM_BASE_URL=                     # only for openai_compat (OpenRouter, Azure)
LLM_MODEL_EXTRACT=claude-sonnet-5-5
LLM_MODEL_SCREEN=claude-haiku-5-5
LLM_MODEL_JUDGE=claude-sonnet-5-5
LLM_MODEL_TEAM=claude-haiku-5-5   # one-sentence swap explanation

EMBED_PROVIDER=none               # none | openai_compat | voyage
EMBED_BASE_URL= / EMBED_API_KEY= / EMBED_MODEL= / EMBED_DIM=512

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/talent
SCREEN_MAX_PER_ROLE=1000
JUDGE_TOP_N=40
MAX_LLM_CONCURRENCY=8
```

## 6. Pipeline

### 6.1 Parse (`/api/brief/parse`)
One structured-output call (`LLM_MODEL_EXTRACT`). Input: brief text + vocabulary (areas, roles, sectors, 614 skills). Output: `Brief` per the contract (roles with headcount, seniority, min_years, criticality 1–5, review_depth, requirements with must/implicit/weight/source_quote/synonyms). "Deseable / valorable / not essential" → `must=false`. No date → `immediate=true`. `review_depth` is kept in the contract but now means the screening depth; code clamps it to `[100, SCREEN_MAX_PER_ROLE]`.

### 6.2 Hard filters (SQL)
- Availability from the start date: < 1 month or immediate → `En banca`; 1–3 months → `En banca` + `Roll-off` (roll-off gets a timing risk); ≥ 3 months → same pool, no risk. `Asignado` always excluded (feeds the reserve lane).
- `anios_experiencia >= min_years` if stated.
- Must-have languages: CEFR rank ≥ required (Nativo > C2 > C1 > B2 > B1 > A2 > A1), via a precomputed `lang_levels jsonb`.
- Location is never a filter; mismatch becomes a risk.
- Funnel: `total → after_filters → reviewed → ranked`.

### 6.3 Retrieval
- **Vector mode** (embeddings present and `EMBED_PROVIDER != none`): embed a role query (title + must reqs + synonyms + nice reqs), `ORDER BY embedding <=> q LIMIT review_depth` over the filtered set.
- **Keyword mode** (default today): score each filtered profile in SQL by weighted overlap between its skills / project technologies / role and the role's requirement values + synonyms (must = 3×, nice = 1×; skill level adds a small bonus), `LIMIT review_depth`. The LLM's synonym expansion at parse time is what bridges vocabulary in this mode.
- Mode is reported in `/api/health` and in the match response (`retrieval` field — additive contract change, announced to the frontend owner).
- Reserve lane: same retrieval restricted to `Asignado`, top 5, then screened/judged like the rest.

### 6.4 Screening (LLM reads up to ~1,000 per role)
`LLM_MODEL_SCREEN`, batches of ~50 compact profile cards (~150 tokens each: role, area, seniority, years, top skills with level, project techs, certs, languages), parallel up to `MAX_LLM_CONCURRENCY`. Output per candidate: score 0–10 + one short reason. Top `JUDGE_TOP_N` go to judging. Low effort; requirements block is identical across batches (prompt-cache friendly).

### 6.5 Judging
`LLM_MODEL_JUDGE`, batches of ~10, compact profile JSON with stable paths. Per candidate × requirement: `met | partial | missing` + evidence `[{path, value}]`; plus strengths, gaps, risks. Prompt rewards skills evidenced in projects/experience over merely listed ones; flags "level 1 despite 3+ years" and "only in an old project".

### 6.6 Grounding (code)
The LLM cites a `path`; code resolves it against the stored profile and renders `value` itself in the frontend's display format (e.g. `skills[1]` → `"AWS (nivel 5, 6 años)"`, `proyectos[0].cliente_sector` → `"Seguros"`), so a value can never be invented. Paths that don't resolve are dropped. Requirement with no surviving evidence → `missing`. Strengths citing nothing valid are removed. Totals → `grounding {claims, dropped}`.

### 6.7 Score + hidden talent (code)
Credit met 1 / partial 0.5 / missing 0; skill reqs × depth factor `0.6 + 0.4·avg(level/5, min(years,5)/5)`; weight must = 3w, nice = w; `fit = Σ credit·w / Σ w` (0–100); any must missing → cap 69. Ties by similarity (vector or normalised keyword score). `different_area`: candidate area ≠ modal area for that role title in the data and must coverage ≥ 0.7. `vocab_bridge`: met requirement whose evidence value doesn't contain the requirement's literal term.

### 6.8 Team (`/api/team`)
Slots = roles × headcount. Cost = −(fit × criticality). `scipy.optimize.linear_sum_assignment`, one person per slot. Greedy baseline: most critical role first, top available candidate each time. Return both teams, scores, swaps, a one-sentence explanation (`LLM_MODEL_TEAM`, grounded in the numbers; template fallback if the LLM fails), joint coverage of must requirements.

### 6.9 Language
`/api/match` and `/api/team` accept an optional `lang` (`es|en`, default `en`, matching the mocks); strengths, gaps, risks and the team explanation are written in it. Additive contract change.

## 7. Error handling and cost guards
- `SCREEN_MAX_PER_ROLE` defaults to 1000 and is tuned after measuring the account's real rate limit on the first live call (our call; the design goal is "as many as the account allows within ~60 s per match").
- LLM batch failures retry once (SDK retries 429/5xx); a batch that still fails is dropped and counted, never fakes results.
- Per-request token/cost tally logged; a hard cap (`MAX_USD_PER_REQUEST`, default 0.75) stops screening early rather than overspend.
- Invalid structured output → one retry, then drop the batch.

## 8. Testing
- Unit tests (pytest) for the deterministic parts: filters SQL builder, grounding, score formula, hidden flags, team optimiser vs greedy, keyword retrieval on a small fixture DB.
- LLM-dependent steps tested with a fake provider (`LLM_PROVIDER=fake`) returning canned JSON, so tests cost nothing.
- One live end-to-end run on test brief 1 at the end, with cost recorded in the log.

## 8b. Build order (our call; if time runs short, later items drop)
1. Core `/api/match`: parse → filters → keyword retrieval → screen → judge → ground → score.
2. `/api/team`.
3. Reserve lane + hidden-talent flags.
4. Vector mode (only if an embedding key appears).
Docs are updated at every step. Every step is merged and pushed to `main` (authorised by the user for this project).

## 8c. Contract changes
Additive only, made by us in `shared/contract.ts` + `backend/app/models.py`, announced to the frontend owner in the commit message and `docs/backend-log.md`: `MatchResult.retrieval?: "vector" | "keyword"`, optional `lang` in match/team bodies, `review_depth` comment now "screening depth, clamped 100–1000", `similarity` comment now "vector similarity, or normalised keyword score in keyword mode".

## 9. Decisions left to the builder
- Exact prompts and compact-card format.
- Batch sizes within the ranges above.
- Pool sizes, timeouts.

## 10. Open items
- **Where the backend runs** so the Vercel frontend can reach it (Render/Railway vs laptop + tunnel). Not needed for the demo (mocks), needed if the frontend ever points at the real API.
- Real NTT DATA test briefs: until they arrive, the drafts in `shared/test-briefs.md` are used.
- Embedding provider funding (OpenRouter ~$2 or Voyage with a payment method) to switch retrieval to vector mode.
