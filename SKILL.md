---
name: aashish-cooks
description: Edit a talking-head reel in Aashish's warm UI-explainer style. A live product card acts out what the speaker says (typing, counters, ticks, toggles); rise-card pops it up from behind the speaker, boom-card bursts it to a full cream screen, illustrate adds animated isometric line figures, 45 screen effects (spotlight, orbit, lean-in, the-bill, glass widgets, split-headline and more) sit behind or around the speaker, and sound effects land on every move. Includes handwritten word-by-word captions, a hook title, a chapter progress bar and the pixel mascot. Use when the user types /aashish-cooks, says "auto" for a full edit, names one of its effects (rise-card, boom-card, card-in, illustrate, orbit-ring, checklist, chat-install, dm-cta, mascot, sfx, or any of the 45 screen effects such as spotlight, noise, lean-in, pause-point, tier-list), or asks to add animated UI cards, explainer graphics, sound effects or captions to a vertical talking video. Also fix-audio: clean only the audio, picture unchanged.
---

# Aashish Cooks

The user is a creator, not a developer. Keep replies short. Do the work for them and never ask them to run commands.

Paths below are relative to this skill's folder. Use its absolute path in commands. Python is `.venv/bin/python` (`.venv\Scripts\python.exe` on Windows).

## 1. First run: set up (once)
Run `bash scripts/setup.sh`. It prints `READY` when done (the first run takes 2–4 minutes and installs a headless browser).
- `NEED_FFMPEG`: install it for them. Mac: `brew install ffmpeg`; if `brew` is missing, tell them to get Homebrew from brew.sh. Windows: `winget install ffmpeg`.
- `NEED_PYTHON`: Mac: `brew install python@3.12`. Windows: `winget install Python.Python.3.12`. Then run setup again.

## 2. Get the video
- The user drags a file into the chat or gives a path. Vertical 9:16 works best; other shapes are centre-cropped to 9:16.
- Run `scripts/analyze.py <video>`. It reports the space above the head and which layouts fit:
  - **Empty space on top (220px+)**: use `rise-card` for cards; it pops up from behind the speaker. This is the usual framing.
  - **Head low, room for a card over the hair**: `card-in` (the reference look).
  - **Face high, no room above**: `"layout": "below"` (card under the chin) or full screens (`boom-card`).
- Run `scripts/words.py <video> --lang <code>` with the spoken language (`hi` Hindi/Hinglish, `mr` Marathi, `en` English). Listen for the language before choosing: Marathi passed as `hi` gives garbage. It saves `<video>.words.json` next to the video. Open it, fix any misheard words, and write them in Roman script exactly as spoken (Hinglish, or Marathi like "kes kharab zhale"), keeping the times. Captions use Kalam Bold, which also covers Devanagari.

## 3. Read the prompt
Prompts look like:
```
/aashish-cooks auto
/aashish-cooks fix-audio
/aashish-cooks at 2s show boom-card
/aashish-cooks - 3s card-in with repo-card "my-skill", price ₹0 - at 4.7s boom-card with connect Claude ~ YouTube - at 9s boom-card-back
/aashish-cooks when I say "free" ...
```
- **`fix-audio`** (also "audio only", "just fix the audio", "clean the audio"): change nothing in the picture. No plan, no transcript, no analyze, no check frames, no effects, captions, cards, mascot or sound effects. Run `.venv/bin/python scripts/fix_audio.py <video>` (add `--strength light|medium|strong` if they said; default `medium`, `strong` for roads or fans). It removes background noise, polishes and levels the voice to -14 LUFS, and copies the video stream unchanged, so lip-sync stays exact. It writes `<video-name>_audiofix.mp4` next to the original. Tell them where it is in one line. Do not ask the voice question in this mode: the tag is the answer.
- **`auto`**: read `references/auto-mode.md` and plan the whole reel yourself.
- **Timed steps**: map each to a move or effect in `references/plan-format.md`, or to one of the 45 screen effects in `references/screen-effects.md`. "When I say X" means the start time of that word in the `.words.json`.
- **A move without content** ("at 2s show boom-card"): if no card is on screen yet, add a `card-in` about 1.5 s earlier with content that fits what is being said at that point, then the boom. Tell them in one line.
- **An effect not built yet** (the plan-format list says which): say so and offer the closest effect.
- **Animated icons or illustrations**: use line figures, always inside the card (`"show": "figure"`). Use `illustrate` (no card) only if the user asks. There are no Lottie files.
- **A figure the library does not have** ("show Twitter", "an AI agent", "a Claude bot"): draw it. Follow `references/figure-maker.md`: plan it in one sentence, write `figures/<name>.js`, check frames, keep it. The reels are mostly AI and tech, so expect to draw new tech figures often.

## 4. Ask about the voice
Before rendering, ask once: "Shall I clean the voice too (remove background noise, light polish)?" If yes, add `"voice": {"clean": true}` to the plan (`"strength": "strong"` for noisy places like roads or fans, `"light"` for quiet rooms). The cleaner (DeepFilterNet) downloads once on first use.

## 5. Write the plan, check, render
1. Write the plan next to their video as `<video-name>_cook.json`, following `references/plan-format.md`. Fill all card text from what the speaker actually says.
2. Render check frames: `.venv/bin/python scripts/cook.py --plan <plan> <video> <folder>/check.png --still 4.2,6.0,9.4`. Use the middle of each card, 0.25 s after each boom, and the middle of each screen effect. Look at every frame yourself. Fix it if text is cut off, the card covers the face (forehead down), a caption is wrong, or a counter does not match the spoken number.
3. Render: `.venv/bin/python scripts/cook.py --plan <plan> <video> <video-name>_cooked.mp4`. It renders 1080x1920 and mixes sound effects under the original voice (it prints the list of sounds and times). `--no-sfx` keeps the original audio only. Add `--width 2160` for 4K (about 4x slower). Rendering takes about 5–7 s per second of video (more with rise-cards), so tell them roughly how long before starting.
4. Tell them where the file is. In one line, remind them to watch it before posting: it drafts, they approve.

## The look (from `references/style.md`)
Cream paper `#F2F0E3`, ivory panels, ink `#0A0705`, one crimson accent `#D30135`, terracotta `#CC6350`, brick italics `#95493F`. Newsreader serif headlines, DM Sans labels, DM Mono commands, Kalam Bold handwritten captions. Hairline figures use the same palette (ink, terracotta or crimson lines on ivory). Motion is soft and quick (150–400 ms ease-out with blur dissolves) and never bouncy. Only read `references/style.md` when designing something new.

## Logos and mascot
- No brand logos are bundled. If the user wants real logos in the header (`icons`) or in `connect` and `orbit-ring` (`a_logo`, `b_logo`), they put the files in a `logos/` folder next to the plan. Otherwise, lettered tiles are used.
- No mascot is bundled. The `mascot` effect is optional: it plays the user's own mascot files (SVG, GIF, WebP or PNG) by state name from `mascot/` or `mascot/states/` (see `mascot/README.md`). Check before planning: if `mascot/` has no image files, plan no mascot moments and do not mention it. If a state is missing, the render skips it and prints a warning; nothing else changes. Never draw a mascot or brand character yourself.

## Sound effects
Sounds live in `sfx/` and are described in `sfx/sfx.json` (role, volume, meme or not, and the learned `moments`). Moves and card content place their own sounds. Then add the **sound moments** from the transcript (table in `references/plan-format.md`): `surprise` on the hook's shock line, `faaah` at the end of a shocking fact, `cash` at the end of money talk, a `cooking` bed while someone is doing a task. Typing always uses the WhatsApp typing sound; clicks use the meme-click; boom-card uses woosh/pop, never a riser. Meme sounds (`punch`, `are-bapre`, `ayeee`, `quack`, `oof`, `caw`, `funny-reveal`, `yooo`, `meme-sting`) are cleared for use, client reels included: put each on its moment from the table, up to `sfx.meme_max` per reel (4). **Custom sounds:** the user can drop audio files (mp3, wav, m4a, aiff, ogg) into `sfx/custom/`. Each one is ready at once under its file name (`sfx/custom/boing.mp3` is `boing`): place it with `{"fx": "sfx", "name": "boing", "at": 4.2}`. A `sfx/custom/custom.json` can set `gain`, `role` and `meme` per sound. A `sfx/` folder next to the plan with its own `sfx.json` adds to the built-in sounds (same names replace them). If the user tells you where a sound belongs and why, add the rule under `moments` in `sfx/sfx.json` so later reels use it.

## Licences to keep in mind
- The skill's own code is MIT (`LICENSE`). Every third-party part and its licence is listed in `THIRD_PARTY_NOTICES.md`; keep that file with any copy.
- **Meme sounds** in `sfx/` are included with permission, client reels included. Sounds users add in `sfx/custom/` are theirs: they need the right to use them.
- **Screen effects** are rebuilt from claude-video-effects (MIT, Vibha Ramprakash). **hairline** figures (MIT, Lucas Marques) and **Lucide** icons (ISC) are free to use; keep their licence files.
- **DeepFilterNet** (voice cleaner, MIT/Apache 2.0) downloads into `bin/` on first use.

## Rules
- Never cover the face. The card may overlap hair, but not the forehead or anything below it.
- One idea per card. Change cards every 1.5–4 s, use at most 2–3 full screens per reel, and keep each under 9 s.
- Numbers on cards should land when they are spoken (`ticks`, `price_at`, `toggle_at`).
- Captions keep the speaker's exact words. Do not translate or clean up their Hinglish.
- Captions end 15% above the bottom (Instagram's name and caption area) and never cover the face.
- A rise-card never covers the face: it only fills the space above the head. If `analyze.py` says there is under 220px, use another move.
- Figures explain an idea and always sit in the card (`"show": "figure"`). Choose or draw the figure for what is being said, and put its `moves` on the spoken words.
