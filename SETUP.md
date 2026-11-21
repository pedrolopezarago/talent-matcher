# Claude Code setup — CDTM Valencia Hacks 2026 (Case 1)

Everything here comes from the 5 prep videos, trimmed for a **one-day** hackathon (6h45 of building).
Rule from two of the videos: **few skills, well tested**. Install on Thursday, rehearse on Friday, change nothing on Saturday.

## What you're installing and why

| Tool | From video | Use on Saturday | Install |
|---|---|---|---|
| **jmo-workflow** plugin (`/jmo-workflow:interview`, `:better-ui`, `:animate`, `:agentation`, `:ste`) | Johnathan Mo — *won 5 hackathons* | 10:00 interview → spec in `.plans/`; UI polish in Loop 3 | `setup.sh` |
| **Remotion agent skills** + **video-shotcraft** | Rourke (Claude as motion designer) + research | Demo video: real app pages → storyboard → shot recipes → beat-synced MP4 | `setup.sh` |
| HyperFrames (alt. engine) · Bang Motion, Lemo Opuscar (extra styles) | research | Only if they beat the default in Friday's test | `--hyperframes` / `--extras` |
| **ElevenLabs hosted MCP** | Rourke — *voiceover via connector, sized to the cut* | Generate the VO from inside Claude Code | `setup.sh` |
| Plan mode (Shift+Tab), `/voice`, `/context`, worktrees (`claude --worktree`), subagents | Coding Sloth + Johnathan Mo | Built in — nothing to install | — |
| Ponytail plugin (less code), RTK (fewer tokens), Matt Pocock skills | Coding Sloth | Optional; only if you tested them Friday | `setup.sh --extras` |
| Code Mode (`CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=1 claude`) | Ray Amjad | Optional, experimental (~30% cheaper in his tests). Conflicts with some hooks | manual |
| Superset (agent workspace), Wispr Flow (dictation) | Johnathan Mo | Optional desktop apps | superset.sh, wisprflow.ai |
| ~~Everything Claude Code (ECC)~~ | Petar Krastev | **Skip.** 300+ skills is the opposite of "few skills"; installing it now risks clashing hooks | — |

## Thursday: install (20 min)

```bash
cd ~/Documents/"CDTM Hack "
chmod +x setup.sh
./setup.sh            # or ./setup.sh --extras
```
Then in `claude`:
1. `/mcp` → **elevenlabs** → sign in (use the account where you redeemed the hackathon Creator code).
2. `/plugin` → confirm `jmo-workflow` is enabled; `/skills` → confirm `video-shotcraft` and the `remotion-*` skills are listed. Install **one** copy of each.
3. Each teammate who codes runs the same script — so usage limits are spread across accounts.

## Friday: rehearsal (1 hour) — the most important step

Make a fake product and run the whole day in miniature:

1. **Spec** — `/jmo-workflow:interview` "a voice-first app that helps students practise job interviews". Let it grill you; it saves a spec in `.plans/`.
2. **Build** — Shift+Tab (plan mode) → approve → build one screen. Ask Claude to open it in the browser and screenshot it to verify.
3. **Polish** — `/jmo-workflow:better-ui` on that screen.
4. **Demo video** — follow `video/VIDEO-PIPELINE.md` for a **20-second** test: shotcraft storyboard → render → VO + music via ElevenLabs MCP → retime → MP4.
5. Write down how long each step took. That's your real budget for Saturday.

If anything breaks on Friday, uninstall it. Saturday is not the day to debug a plugin.

## Saturday: how to drive Claude Code

| When | Command / habit |
|---|---|
| 10:00 framing | `/jmo-workflow:interview` with the whole team talking (use `/voice`). Paste the value statement into `CLAUDE.md`. |
| Each loop | Shift+Tab plan → approve → build. **New session per task**; check `/context`; if it auto-compacts, start fresh. |
| Parallel work | One feature per worktree: `claude --worktree feature-x` (Builder A and B never edit the same files). |
| Design | Give Claude a screenshot/URL of a UI you like — agents copy better than they invent. |
| Verify | "Run it, open it in the browser, screenshot the demo flow." Don't trust "done". |
| Loop 3 | `/jmo-workflow:better-ui` and `/jmo-workflow:animate` for polish — only on screens in the demo. |
| 15:30 freeze | Storyteller switches to the video pipeline. |

## Code Mode (optional test, Friday only)
```bash
claude --version      # needs 2.1.323 or later
CLAUDE_CODE_EXPERIMENTAL_CODE_MODE=1 claude
```
Ask "what tools do you have?" — it should say REPL + Poll. If it warns about hooks/mods, just skip it.
