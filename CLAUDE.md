# Project: [name] — CDTM Valencia Hacks 2026

> Fill this in during 10:00–10:30 on Saturday, then keep it short. Claude reads it at the start of every session.

## Context
- One-day hackathon. Hard submission deadline **16:45** (Polievalúa). Feature freeze **15:30**.
- Case: **Case 1** — [company + case title, revealed at 9:00 kickoff]
- Demo video: Bang Motion opener + product tour, ElevenLabs voiceover (see `video/VIDEO-PIPELINE.md`).
- Spec from `/jmo-workflow:interview` lives in `.plans/` — read it before building.
- Goal: a small but complete MVP that works end to end in a **3-minute live demo**.

## User & problem
- User: NTT DATA staffing / resource manager.
- Problem: the right person is already in the company, in another department and described with different jargon, so NTT DATA hires externally.
- Value statement: For staffing managers who must staff projects fast, AI Talent Matcher is an AI staffing copilot that finds and explains the best available internal people and builds the optimal team. Unlike keyword search over CVs, it matches by meaning, proves every claim with profile evidence and never breaks hard rules.

## Scope
- Full spec: `.plans/ai-talent-matcher-spec.md` (read it first). API contract: `shared/contract.ts`.
- NOW: brief → editable requirement chips · hard filters in code · pgvector retrieval · LLM coverage judging + code-verified citations · code score · ranked cards + evidence drawer · compare · team builder (optimal vs greedy) · hidden-talent badges · reserve lane · ES/EN.
- LATER: auth, history, multi-project optimisation, voice, pitch stats in app.

## Stack
- Frontend: Vite + React + TS (+ Tailwind) on Vercel. Owner: Pedro.
- Backend: Python FastAPI on Render/Railway; Postgres + pgvector (local Docker → Supabase). Owner: teammate.
- LLM: any OpenAI-compatible endpoint via env vars, backend only. Embeddings 512-dim, precomputed once.
- Hard rules: availability + min years + must languages are SQL filters, never LLM. No API keys in frontend or repo. Don't commit parquet/PDFs.

## Rules for Claude
- Build the demo's happy path first; no auth, settings or admin pages unless the demo needs them.
- Prefer the simplest working solution. Mock data is fine and should be clearly seeded.
- After each change, run the app and check the demo flow still works (screenshot the browser if possible).
- Ask before adding dependencies or new features not in NOW.
- UI: clean, sentence case (no ALL-CAPS headings), match the reference design in `/design-ref` if present.
- Keep explanations short and plain.
- Use plan mode for anything touching more than one file. One feature per worktree.
- Keep a `/demo` route (or seeded state) that shows the happy path instantly — the video and live pitch both use it.

## Current status
- Loop: [1/2/3]
- Working: 
- Broken / next: 
