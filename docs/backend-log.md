# Backend log

Running log of what the backend team did and why. Newest at the bottom.

## 2026-11-21

### Task 1 — config, contract models, tests
- `backend/app/config.py` reads `.env`; `backend/app/models.py` mirrors `shared/contract.ts`. The three frontend mocks validate against the models (test).
- **Contract changes (additive, for the frontend owner):** `MatchResult.retrieval?: "vector" | "keyword"`; optional `lang` (`es|en`, default `en`) in `/api/match` and `/api/team` bodies; `review_depth` now means screening depth, clamped 100–1000; `similarity` is the normalised keyword score in keyword mode. Applied to both `shared/contract.ts` and `src/shared/contract.ts` (identical copies).
- `.env.example` now follows the backend design (provider switch via `.env` only).
- Tests run with `LLM_PROVIDER=fake`: no test spends credit.
