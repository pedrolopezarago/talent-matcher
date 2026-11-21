#!/usr/bin/env bash
# CDTM Valencia Hacks 2026 — Claude Code setup (macOS)
# Built from the tools shown in the 5 prep videos. Run on Thursday/Friday, NOT on the day.
#
#   ./setup.sh                 core setup (recommended)
#   ./setup.sh --extras        core + token savers, code-minimiser, extra motion styles
#   ./setup.sh --hyperframes   core + HyperFrames (alternative video engine) — flags can be combined
#
# Safe to re-run: steps that are already done just print a warning.

set -u
EXTRAS=0; [[ " $* " == *" --extras "* ]] && EXTRAS=1

ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
step() { printf "\n\033[1m%s\033[0m\n" "$1"; }

step "1. Prerequisites"
for c in git node npm; do
  command -v $c >/dev/null && ok "$c $($c --version 2>/dev/null | head -1)" || warn "$c missing — install it (brew install $c)"
done
if ! command -v claude >/dev/null; then
  warn "Claude Code missing — installing"; npm install -g @anthropic-ai/claude-code
fi
ok "claude $(claude --version 2>/dev/null)"
if ! command -v brew >/dev/null; then
  warn "Homebrew missing — needed for ffmpeg. Install from https://brew.sh then re-run."
else
  command -v ffmpeg >/dev/null && ok "ffmpeg present" || { brew install ffmpeg && ok "ffmpeg installed"; }
fi

step "2. Hackathon workflow skills (Johnathan Mo — 5x hackathon winner)"
# /jmo-workflow:interview, :better-ui, :animate, :agentation, :ste, :codex
claude plugin marketplace add 23jmo/jmo-skills || warn "marketplace already added?"
claude plugin install jmo-workflow@jmo-skills  || warn "jmo-workflow already installed?"

step "3. Video production stack (demo video)"
# Engine + renderer: Remotion (React → MP4). Official agent skills teach Claude its conventions.
npx -y skills add remotion-dev/skills -g -a claude-code \
  -s remotion-best-practices remotion-render remotion-captions remotion-multimedia -y \
  && ok "Remotion agent skills" || warn "Remotion skills failed"
# Director on top of Remotion: captures real app pages, 150 shot recipes, storyboard,
# beat sync, sound design, frame QA, MP4 + editable Motion Workbench.
npx -y skills add Vincentwei1021/video-shotcraft -g -a claude-code -y \
  && ok "video-shotcraft" || warn "video-shotcraft failed"
# uv is only needed for shotcraft's music beat analysis
command -v uv >/dev/null || { command -v brew >/dev/null && brew install uv; }

if [[ "${HYPERFRAMES:-0}" == 1 || " $* " == *" --hyperframes "* ]]; then
  # Alternative engine (HTML + GSAP, ~450 ready blocks, own CLI renderer). Needs Node 22+.
  claude plugin marketplace add heygen-com/hyperframes || true
  claude plugin install hyperframes@hyperframes && ok "HyperFrames plugin" || warn "HyperFrames failed"
fi

step "4. ElevenLabs hosted MCP (voiceover from inside Claude Code)"
# Official hosted server, OAuth login — no API key stored in config.
claude mcp add --transport http --scope user elevenlabs https://api.elevenlabs.io/v1/mcp \
  && ok "elevenlabs MCP added — open claude and run /mcp to sign in" \
  || warn "elevenlabs MCP already added?"

step "4b. Project permissions (fewer approval prompts during the build)"
cd "$(dirname "$0")"
if [[ -f claude-settings.json && ! -f .claude/settings.json ]]; then
  mkdir -p .claude && cp claude-settings.json .claude/settings.json && ok ".claude/settings.json created"
else
  warn ".claude/settings.json already exists — left unchanged"
fi

if [[ $EXTRAS == 1 ]]; then
  step "5. Extras"
  # Ponytail: makes the agent write less code (Coding Sloth's list)
  claude plugin marketplace add DietrichGebert/ponytail || true
  claude plugin install ponytail@ponytail || true
  # RTK: compresses command output so you burn fewer tokens / usage limit
  command -v brew >/dev/null && { brew install rtk && rtk init -g && ok "rtk installed (check: rtk gain)"; }
  # Matt Pocock skills (grill-with-docs, improve-codebase-architecture, tdd...) — big pack, optional
  claude plugin install mattpocock-skills@claude-plugins-official || true
  # Extra motion styles: Bang Motion (HTML openers/explainers), Lemo Opuscar (99 named film styles)
  claude plugin marketplace add bangtutorial/bang-motion || true
  claude plugin install bang-motion@bang-motion || true
  claude plugin marketplace add lemomo-ai/lemo-opuscar || true
  claude plugin install lemo-opuscar@lemolab || true
fi

step "Done. Next:"
cat <<'EOF'
  1. Restart Claude Code, run /mcp → authenticate "elevenlabs" with the hackathon email.
  2. Run /plugin to check what's enabled. Disable anything you won't use on Saturday.
  3. Do the Friday rehearsal in SETUP.md (20-second test video end to end).
EOF
