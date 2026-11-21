# Perfect Fit Talent Finder

Imported website: https://github.com/pedrolopezarago/talent-matcher.git

NTT DATA case, CDTM × UPV-UV Hackathon, 21 Nov 2026.

**The person you need is already in the company. We find them.** Describe a project, and the app extracts requirements per role, applies hard filters in code, matches people by meaning, explains every match with verified evidence and builds the best overall team.

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8279d0ff-ecf6-4822-ba34-790536047c76).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

### Value statement
For **NTT DATA staffing managers** who must staff a new project fast, **AI Talent Matcher** is an internal talent search that turns a free-text project brief into an evidence-backed shortlist per role and the best overall team in about a minute. **Unlike** keyword search in HR tools (or hiring externally), it finds people who describe the same skill with other words, enforces hard rules (availability, years, languages) in code, and shows the profile evidence behind every match.

### Riskiest bet
We believe the right people often already work at NTT DATA but are missed because they describe their skills with different words or sit in another department. We'll know if the pipeline surfaces strong, available candidates whose evidence doesn't literally contain the asked term (vocabulary bridges) or who come from another area (hidden talent).
*First evidence (loop 3, live run on the core-banking brief):* "Microservicios" was covered by a candidate whose evidence is "Spring Boot (nivel 5, 6.5 años)". One brief is not proof yet — more briefs to run.

### Loop logbook
| Loop | What we wanted to learn | What we built | What people told us | What we decided |
|---|---|---|---|---|
| **1 · Concept** (~10:50–11:40) | Can a staffing manager go from a brief to a justified shortlist in one screen? | Spec + API contract + seeded mocks; first UI: brief box → requirement chips (must/nice, implicit ✦) → ranked candidates → evidence drawer → compare → team view, ES/EN | The idea needed some polishing. | Contract first so frontend and backend move in parallel; the demo always works on mocks |
| **2 · MVP** (~11:50–13:10) | Is it usable by someone outside the team, and what must the real engine guarantee? | UI redesigns in Lovable (editorial palette → bento grid → macOS-style flat), live on Vercel from 12:56. Backend design: hard filters in SQL, two-tier LLM reading (cheap screening of ~1,000 profiles, deep judging of the top 40), every claim verified in code | **NTT DATA:** location doesn't matter, everyone can work remotely. **Staffing practice (team):** real teams are one expert plus more junior people. | Location dropped as a filter and as a risk. Expert + juniors team mix → Later (keep best fit per slot for now) |
| **3 · Improved MVP** (~13:10–14:30) | Does the real engine work on 190,000 profiles, what does it cost, and does the team look like a real NTT DATA team? | Real pipeline end to end (`/api/brief/parse`, `/api/match`, `/api/team`), 80 tests, independent code review (5 fixes), first live run with Claude. Then: one expert per team with Junior/Mid support, and training plans for people who join without fully meeting a requirement | **Live run:** first attempt failed (screening ran out of tokens) and the parser turned "hybrid in Madrid" into a MUST requirement, contradicting NTT DATA's guidance. | Screening without reasoning on Haiku; location requirements removed in prompt **and** code. Measured: 74 s, $1.14 per 3-role match; cost scales with briefs × judged candidates, not with company size. Expert + juniors moved from Later to Now: with it, the optimal team (95.8) beats greedy (94.6) by placing the expert where it adds most |

Photos of each version: `docs/improven/` _(add screenshots: loop1, loop2, loop3)_. Full technical log: [`docs/backend-log.md`](docs/backend-log.md).

### Now / Later
- **Now:** brief → roles and requirements (editable) · hard filters in code · ranked candidates with verified evidence, gaps and risks · reserve lane (strong people currently assigned) · optimal team vs greedy with one expert and Junior/Mid support · training plans for unmet requirements.
- **Later:** semantic embeddings (vector search) · live HR database sync with triggers · auth and per-user history · multi-project allocation.

### What we left out and why
- **Location / work mode** — NTT DATA confirmed it doesn't matter.
- **Embeddings** — keyword search plus LLM synonyms already bridges vocabulary; embeddings cost money and time we preferred to spend on evidence verification.
- **Auth, users, history** — not needed to prove the matching value.
- **Letting the LLM decide hard rules** — availability, years and languages are always enforced in SQL so the AI can't break them.

### One minute for the Improven jury
1. **Problem and user:** NTT DATA staffing hires externally because the right people inside describe skills differently or sit in other departments.
2. **Evolution:** v1 a clickable concept on mocks → v2 a live, redesigned UI plus the engine design → v3 the real engine on 190k profiles.
3. **What we learnt:** NTT DATA told us location doesn't matter — we removed it, and the live run showed the AI still added it, so we enforced it in code too. Measuring cost showed it depends on how many briefs you run, not on company size.
4. **What we left out:** embeddings, auth, live HR sync — on the Later list, on purpose. What we added late: the expert + juniors team rule, straight from how staffing really works.

---

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
