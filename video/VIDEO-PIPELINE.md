# Demo video pipeline — Claude + video skills + ElevenLabs

**Goal:** a 45–60 s product video (confirm the required length with the organisers), shown at the end of the pitch and submitted with the deliverables. It counts for 25% of the ElevenLabs challenge and is the backup if the live demo fails.
**Owner:** the storyteller. **Timing:** style + opener from Loop 2 (≈12:00), real product shots after the **15:30 freeze**, MP4 uploaded by **16:30**.

## The stack (one engine, one director, one voice)

| Layer | Tool | What it adds to Claude | Installed by |
|---|---|---|---|
| Engine + renderer | **Remotion** + official Remotion agent skills (best-practices, render, captions, multimedia) | Video as React code, frame-exact render to MP4; Claude follows Remotion's own conventions | `setup.sh` |
| Director | **video-shotcraft** | Captures your real app pages, 150 tuned shot recipes (openers, camera moves, UI entrances, transitions, typography, outros), storyboard, beat sync, sound design, frame-by-frame QA, MP4 + a CapCut-style browser editor to tweak after | `setup.sh` |
| Voice, music, SFX | **ElevenLabs** hosted MCP | Voiceover sized to the cut; also music (Compose) and sound effects — using 3 ElevenLabs products helps the *creativity* score | `setup.sh` |
| Alternative engine | HyperFrames (HeyGen) | HTML + GSAP compositions, ~450 ready blocks (titles, transitions, charts, captions), own lint/preview/render CLI. Node 22+ | `setup.sh --hyperframes` |
| Extra styles (optional) | Bang Motion · Lemo Opuscar | Cinematic HTML openers/explainers · 99 named film styles | `setup.sh --extras` |
| Prompt ideas | awesome-opus5-5-videos (GitHub, 700+ prompts) | Starting prompts when stuck | browse only |

**Pick one engine on Friday and stick with it.** Default: Remotion + shotcraft (built for product promos from real UI). Switch to HyperFrames only if Friday's test with it is clearly faster for you.
Not for Saturday: Blender MCP (3D is slow, and its code tool runs arbitrary Python), video-talkcraft (non-commercial license, Chinese docs), pixel-art packs.
Remotion's license is free for individuals and small teams — fine for a student hackathon.

Rules that apply whatever the tool (Rourke's video): storyboard first · real high-res assets only · each shot transforms into the next (no cross-dissolves) · action in the centre · always something moving · **visuals first, sound last** · VO written to the exact length · check every frame against the real product.

---

## Folder (create on the day)
```
video/
  assets/   logo (svg/png, high-res), screenshots, screen-recording.mp4, brand colours
  vo/       vo-script.txt, vo.mp3, music.mp3, sfx/
  film/     the Remotion project shotcraft creates
```
Start each video job in a **new Claude Code session** opened in `video/`.

## 1. Brief → storyboard (Loop 2, ~20 min)
> Use video-shotcraft to make a **50-second, 16:9 promo** for **[product]**, for **[user]**, solving **[problem]**. Value statement: "[paste]". Our app runs at **[URL or localhost]** — capture the real pages; logo and screenshots are in `video/assets/`, never recreate them. Structure: 0–8 s opener on the logo, 8–40 s the core flow being used (camera follows the clicks), 40–50 s value statement + "CDTM Valencia Hacks 2026". Storyboard first with the shot cards you'd use; no code until I approve. Every shot must transform into the next — no cross-dissolves. Leave room for a voiceover; no music yet.

Approve or swap shots (browse the shotcraft Gallery and name cards you like, e.g. "use text-as-mask for the opener").

## 2. Build + first render (Loop 2–3, runs while the product is built)
> Approved. Build it with placeholder screens where the product isn't ready. Render stills of the key frames and check them before rendering the full film.

The storyteller iterates on the opener and outro, which don't depend on the product.

## 3. Real product shots (after 15:30 freeze, ~15 min)
> The product is frozen. Re-capture the pages from [URL] (the `/demo` route) and replace the placeholders. Check every UI detail against the live app — no features we didn't build.

If page capture struggles, record the happy path (Cmd+Shift+5, 20–30 s) into `video/assets/screen-recording.mp4` and ask Claude to place it inside a device frame.

## 4. Voice, music, SFX with ElevenLabs (~10 min)
> The film is exactly [N] s. Write a voiceover that fits it: one short paragraph per scene, ~2.5 words/s, max [N×2.5] words, in [English/Spanish]. Save to `vo/vo-script.txt`.

> Use the elevenlabs MCP: (1) text-to-speech from `vo/vo-script.txt`, warm confident voice, model eleven_multilingual_v2 → `vo/vo.mp3`; (2) compose a [N]-second instrumental, [mood], low under voice → `vo/music.mp3`; (3) 3–4 short UI sound effects (whoosh, click, chime) → `vo/sfx/`.

> Retime the film to `vo/vo.mp3` so each scene starts with its paragraph. Mix: voice on top, music ducked under it, SFX on the transitions. Render the final MP4.

Fallbacks: ElevenLabs website (Text to Speech / Music / Sound Effects → download) · or the API:
```bash
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" -H "Content-Type: application/json" \
  -d "{\"text\": $(jq -Rs . < video/vo/vo-script.txt), \"model_id\": \"eleven_multilingual_v2\"}" \
  -o video/vo/vo.mp3
```
Credits: a 50 s VO is ~800 characters; the Creator plan has 131k credits. Music and SFX cost more — make them once, not ten times.

## 5. QA + ship (16:15–16:30)
- Watch it once, full screen, with sound. Names, numbers and UI must match the real product.
- Small fixes: open shotcraft's Motion Workbench (`node workbench/scripts/open.mjs <project>`) and edit copy/timing without re-prompting.
- Upload to Polievalúa by **16:30**. Keep the MP4 open on the pitch laptop as the backup demo.

## Friday rehearsal (≈45 min)
Fake product (any landing page works): steps 1 → 2 → 4 → 5 as a **20-second** film. Time each step — that's your Saturday budget. If Remotion/shotcraft feels slow, try the same brief with `/hyperframes` and keep whichever wins.

---

### Note on the ElevenLabs score
VO + music + SFX in the video secures the demo-video 25% and helps creativity. But **50% is integration into the product**: if Case 1 has any moment where a user would rather talk than type, a small voice feature (ElevenLabs agent widget or speech-to-text input) is what turns "entered" into "contender" — and it becomes the hero shot of the video.
