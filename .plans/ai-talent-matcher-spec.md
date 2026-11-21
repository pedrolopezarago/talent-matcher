# AI Talent Matcher — spec

CDTM × UPV-UV Hackathon · NTT DATA case · 21 Nov 2026
Feature freeze 15:30 · submission 16:45 · 3-minute pitch

## 1. One line
A staffing manager describes a project in plain language (Spanish or English). The app turns it into structured requirements per role, finds the best **available** internal people out of 190,000 profiles by meaning rather than keywords, explains every match with evidence checked against the profile, and proposes the best overall team.

**Problem (from NTT DATA):** the person you need is already in the company, but sits in another department and uses different words. So NTT DATA hires externally.

## 2. User
- **Primary user:** a staffing or resource manager at NTT DATA who receives a project need and must propose a team quickly.
- **Demo story:** they paste or type a multi-role brief, check the requirements the AI extracted, review the ranked candidates per role, compare two or three of them, then click **Build team**.

## 3. Scope

### Now (build in this order)
1. **Brief → structured requirements.** One LLM call. Output: the roles, and for each role its requirements, each tagged *must* or *nice*, *explicit* or *implicit*, with a weight. The user can edit them as chips.
2. **Hard filters in code.** Availability (based on the start date), minimum years of experience and must-have language levels are SQL `WHERE` clauses, never LLM decisions.
3. **Semantic retrieval.** Vector search with pgvector, run only on the profiles that pass the filters. The LLM chooses review depth K per role; code caps it.
4. **LLM judges coverage and cites evidence.** The LLM rates each requirement for each candidate as met, partial or missing, and cites a profile field. A **code check verifies every citation**; claims without valid evidence are dropped and logged.
5. **Score in code.** A reproducible formula over that coverage, plus depth (level, years, recency). Output: ranked cards showing fit %, strengths, requirements covered, gaps, **risks** and evidence.
6. **Compare.** Tick 2–4 candidates to see a table: match %, strengths, gaps, risks.
7. **Team builder.** One person per slot, availability respected, global optimisation weighted by role criticality. Show **optimal vs greedy** and the swap that made the difference.
8. **Hidden-talent badges.** "Different area" (the person works outside the requested role family) and "Different vocabulary" (e.g. *container orchestration → Kubernetes*: keyword search would miss them).
9. **Reserve lane.** Strong but *Asignado* (assigned) people, shown separately as "would need to be released". Never in the main ranking.
10. **ES/EN toggle** for the UI.

### Later (don't build)
- Auth, users, history, integration with real NTT DATA systems.
- Multiple projects competing for the same people (optimiser across briefs).
- Voice input. ElevenLabs is not in scope; this team is entered for NTT DATA only.
- Pitch statistics in the app. AI-vs-keyword numbers come from an offline script, used **only in the pitch** (§9).

## 4. Architecture

```
Vercel (React + Vite + TS)  ──HTTPS──▶  Render/Railway (Python FastAPI)
                                              │
                         ┌────────────────────┼────────────────────┐
                         ▼                    ▼                    ▼
            Postgres + pgvector        OpenAI-compatible      scipy optimiser
   (local Docker → Supabase later)     LLM + embeddings       (in process)
```

- **Model access is provider-agnostic.** The `openai` Python client talks to any OpenAI-compatible endpoint, so a client can bring its own key and model. Settings come from env vars (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `EMBED_BASE_URL`, `EMBED_API_KEY`, `EMBED_MODEL`, `EMBED_DIM`), and keys stay on the backend only.
  - Each task can use a different model: `LLM_MODEL_EXTRACT`, `LLM_MODEL_JUDGE`, `LLM_MODEL_TEAM`, each falling back to `LLM_MODEL`.
  - Pitch angle: in the SaaS, each client company plugs in its own provider and key, so its data stays with the LLM vendor it already trusts.
- **Database:** develop against a local Postgres with pgvector (`docker compose`, image `pgvector/pgvector:pg16`), then point `DATABASE_URL` at Supabase. No code change needed.
- **Embeddings:** precomputed **once** per profile at **512 dims** (stored as `halfvec`, about 200 MB, which fits the Supabase free tier).
  - Re-embed only profiles that change.
  - Per-query cost is one query embedding per role plus LLM calls on the reviewed candidates. That is the token-saving story.
- **Scaling story for the pitch:**
  - Filters run first in SQL, and an HNSW index serves the vector search, so the LLM only ever sees K candidates per role, whether the company has 190k or 2M people.
  - Ingest is incremental.

### Data model (Postgres)
- `profiles`: every scalar column from the parquet, plus the nested fields (skills, projects, experiencia, idiomas, estudios, certificaciones, metodologias, habilidades_blandas) kept as `jsonb`.
- Derived columns: `lang_levels jsonb` (language → CEFR rank) and `embedding halfvec(512)`.
- Indexes: `disponibilidad`, `anios_experiencia`, `pais`, and HNSW on `embedding`.
- **Text that gets embedded:** role, current position, area, seniority, years, main sector, skills with level and years, project names with sector and technologies, certifications, methodologies and the summary. The format is fixed, so the same profile always produces the same vector.

## 5. Matching pipeline

### Step 1 — Parse the brief (`POST /api/brief/parse`)
- LLM call with structured output (JSON schema).
- Input: the free-text brief in ES or EN, plus the data vocabulary: area, role and sector values, and the 614 skill names, so the model maps requirements onto words that actually exist in the data.
- Output: `Brief`, defined in §7.
  - Each role has: title, headcount, seniority, min years, **criticality 1–5**, **review depth K** (the LLM picks it from how scarce the skill is; code clamps it to 20–150), and requirements.
  - Each requirement has: `type` (skill / sector / language / certification / methodology / soft_skill / seniority / client_facing / other), `value`, `must`, `implicit`, `weight`, `source_quote` (the phrase in the brief it came from) and `synonyms` (related skills from the vocabulary).
- **"Not essential" / "deseable" / "valorable" → `must=false`.** These are never filters.
- Implicit requirements (e.g. banking experience for core banking) are allowed, but marked `implicit=true` and nice-to-have unless the brief says otherwise.

### Step 2 — Hard filters, in code
- **Availability, from the project start date:**
  - Start within 1 month, or "immediate": only `En banca`.
  - Start in 1–3 months: `En banca` plus `Roll-off próximo`. Roll-off people get a timing risk flag.
  - Start 3 months or more out: same pool, no timing risk.
  - `Asignado`: always excluded from the main pool; these feed the reserve lane.
  - If the brief gives no date, assume an immediate start and tell the user so in the UI.
- **Minimum years:** `anios_experiencia >= min_years`, only when the brief states it.
- **Must-have language:** at least the stated CEFR level (Nativo > C2 > C1 > B2 > B1 > A2 > A1).
- **Location/mobility** is not a hard filter; a mismatch becomes a risk.
- Return a funnel: `total → after_filters → reviewed (K) → ranked`.

### Step 3 — Retrieval
- Embed a role query built from the role title, the must requirements (with synonyms) and the nice requirements.
- SQL: the filters from step 2, `ORDER BY embedding <=> $q LIMIT K`.
- Reserve lane: the same query restricted to `Asignado`, `LIMIT 5`.

### Step 4 — LLM coverage judging
- Batches of about 10 candidates per call, run in parallel.
- Input: the role's requirements plus each candidate's **compact profile JSON** (only the fields that matter, each with a stable path).
- Output per candidate and requirement: `status` (met / partial / missing) and `evidence` (a list of `{path, value}`), plus short `strengths`, `gaps` and `risks`.
- **Superficial vs relevant:**
  - Prompt and score reward a skill that appears in projects or experience (with technologies and years) over one that is only listed.
  - Flag "level 1 despite 3+ years" and "only in an old project" as risks.

### Step 5 — Grounding check, in code
- For each piece of evidence, resolve `path` against the stored profile and check that `value` matches (case-insensitive, trimmed).
- Evidence that fails is removed. A requirement left with no evidence drops to `missing`.
- Strengths that cite no valid evidence are removed.
- Count everything removed and return it as `grounding.dropped` (useful in the Q&A: "we block hallucinations").

### Step 6 — Score, in code
- Per requirement, credit is `met = 1`, `partial = 0.5`, `missing = 0`.
- Skill requirements are multiplied by a depth factor: `0.6 + 0.4 × avg(level/5, min(years, 5)/5)`.
- Weights: must = 3 × weight, nice = 1 × weight.
- `fit = Σ(credit × w) / Σ(w)`, shown as a percentage.
- **Any must missing → fit is capped at 69%**, with a red gap.
- Ties are broken by vector similarity.

### Step 7 — Hidden-talent flags, in code
- **`different_area`:** the candidate's `area` is not the area most common among roles like the requested one, but their must coverage is at least 0.7.
- **`vocab_bridge`:** a met requirement whose evidence value doesn't contain the requirement's literal term. Show `{asked: "container orchestration", found: "Kubernetes"}`.

### Step 8 — Team builder (`POST /api/team`)
- Slots = roles × headcount. Cost matrix = `-(fit × criticality)`. Solve with `scipy.optimize.linear_sum_assignment`, never assigning one person to two slots.
- **Greedy baseline:** fill the most critical role first, each time with that role's top candidate.
- Return:
  - both teams;
  - both weighted totals;
  - the people who differ, and a one-sentence LLM explanation of the swap (grounded in the fit numbers);
  - team-level coverage: which must requirements the team covers jointly.

## 6. UI (frontend: my slice)

A single page that builds up step by step, with a chat-like input at the top.
1. **Brief box.** Large textarea and "Analyse". It is pre-filled through example buttons (the 3 test briefs) for the demo.
2. **Requirements.** A card per role with chips:
   - must chips are solid, nice chips are outlined;
   - implicit chips get a ✦ marker and a tooltip with the `source_quote`;
   - click a chip to flip must/nice or remove it; there's also an "add requirement" button;
   - role header shows headcount, criticality, start date and the availability rule applied.

   Then "Find candidates".
3. **Funnel strip per role:** `190,000 → 3,412 available → 80 reviewed by AI → top 10`.
4. **Role tabs with ranked cards.** Each card shows:
   - name, current role and area, seniority, availability;
   - fit % ring;
   - covered requirements as ticks, gaps in red, risks in amber;
   - hidden-talent badges;
   - a checkbox for compare.
5. **Evidence drawer** (opens on card click). Every claim links to the highlighted profile field (skill row, project, language, certification).
6. **Compare table** for 2–4 candidates: match %, strengths, gaps, risks. Requirement rows × candidate columns with ✓ / ½ / ✗.
7. **Reserve lane** at the bottom of each role tab: "Strong fits currently assigned (would need release)".
8. **Build team** → a team view:
   - slot cards;
   - "Optimal 86% vs greedy 78%" with the swap explained;
   - joint coverage.
9. **ES/EN toggle** in the header (all UI strings in one dictionary). Sentence case throughout, in a clean NTT-blue style.
10. **`/demo` route.** Loads a seeded result for the banking brief instantly (from `src/talent/mocks/`), for the video and as a fallback if the API is slow.

## 7. API contract (agreed first so both slices can run in parallel)
The source of truth is `shared/contract.ts`, mirrored by the Pydantic models in `backend/app/models.py`. Mocks live in `src/talent/mocks/`.

- `POST /api/brief/parse` `{text, lang}` → `Brief`
- `POST /api/match` `{brief}` → `MatchResult { roles: RoleResult[] }`
  - `RoleResult`: `{role_id, funnel, availability_rule, candidates: Candidate[], reserve: Candidate[]}`
  - `Candidate`: `{employee_id, name, current_role, area, seniority, availability, country, city, fit, similarity, coverage: Coverage[], strengths, gaps, risks, hidden: {different_area, vocab_bridges}}`
  - `Coverage`: `{req_id, status, evidence: {path, value}[]}`
  - `grounding`: `{claims, dropped}`
- `POST /api/team` `{brief, match}` → `TeamResult {optimal, greedy, optimal_score, greedy_score, swaps, explanation, joint_coverage}`
- `GET /api/profile/{id}` → the full profile, for the drawer.
- `GET /api/health`

## 8. Work split (2 builders, separate folders, one repo)
- **Builder A (backend):** `backend/` and `scripts/`.
  - Docker Postgres, the ingest and embedding script, the pipeline steps 1–8, the FastAPI app, and deploying to Render/Railway + Supabase.
- **Builder B (frontend, Pedro + Irene):** the Lovable app at the repo root (`src/`, UI in `src/talent/`).
  - Vite + React + TS + Tailwind, built against the mocks first, then pointed at `VITE_API_URL`. Deploy to Vercel.
- **Shared:** `shared/contract.ts`. Change it only after telling the other person.
- **Git:** short-lived branches `be/*` and `fe/*`, merged to `main` often. Never commit `.env`, the parquet file or the NTT PDFs.

## 9. Pitch-only stats (not in the app)
`scripts/pitch_stats.py` compares two searches for each test brief:
- **Keyword search:** literal `ILIKE` on `skills_texto` and `rol` plus the same hard filters.
- **Our pipeline.**

The headline numbers:
- how many relevant people keyword search finds vs the AI;
- how many of the AI's top 10 keyword search would never have surfaced;
- how many top-10 people come from a different area.

## 10. Timeline
| Time | Backend (A) | Frontend (B) |
|---|---|---|
| 10:30–11:30 Loop 1 | Docker pgvector, ingest parquet, start embedding job (runs in background) | Scaffold, page layout, chips + cards from mocks |
| 11:30–13:30 Loop 2 | Parse, filter, retrieve, judge, ground, score; `/api/match` live; deploy API | Drawer, compare, funnel, wire to API; **deploy to Vercel**. Live URL by 13:30 |
| 14:00–15:30 Loop 3 | Team builder + greedy diff, reserve lane, hidden flags, move to Supabase | Team view, ES/EN, `/demo`, polish (`/jmo-workflow:better-ui`) |
| 15:30–16:45 | Freeze. Pitch stats script, bug fixes only | Demo rehearsal, video, submission |

## 11. Risks and decisions
- **Embedding job time/cost:** 190k profiles × ~300 tokens ≈ 57M tokens, about $1 with `text-embedding-3-small` at 512 dims. Run it with concurrency and resume support, starting as early as possible. Fallback: embed bench + roll-off first (~34k), the rest after.
- **LLM latency:** judging K = 80 in batches of 10 means 8 parallel calls per role. Stream progress per role in the UI, and cap total K across roles at about 300.
- **Brief with no date:** assume an immediate start and say so in the UI.
- **Honesty rule:** the README and the pitch say what is simulated: the `/demo` seeded result and the € assumptions, if any.
- **API keys:** server-side only; `.env` is gitignored and `.env.example` is committed.

## 12. Open items
- [ ] **Full text of the 3 test briefs:** ask an NTT DATA mentor for the format PDF. Until then, the drafted versions in `shared/test-briefs.md` are placeholders.
- [ ] **Which OpenAI-compatible provider and key** to use on the day (needs chat + embeddings).
- [ ] **Accounts:** Supabase, Vercel, Render or Railway.
- [ ] **Business model, TAM/SAM/SOM:** the storyteller decides; candidate idea is SaaS per indexed employee per year with bring-your-own model.
