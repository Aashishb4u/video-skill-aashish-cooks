# Reference style spec: "Warm UI explainer"

Source: `refetrences/reference_edit.mp4` · 720×1280 vertical · 30 fps · 42.1 s · Hinglish talking head.
Measurements are in pixels at 720 px wide; scale ×1.5 for 1080p. Colours were sampled from the frames.
Values marked *(est.)* are visual estimates. Confirm them against the frames before treating them as final.

---

## 1. The idea in one line
A talking head at the bottom, with a **live product-UI card** floating above the head. The card behaves like a mini app demo. Its content types, counts up, ticks and morphs in sync with every sentence. For the biggest moments, the card **expands to fill the screen** on a warm paper background, then shrinks back. Handwritten **word-by-word captions** sit in a frosted pill at the bottom.

The look is calm, warm and editorial, like Claude's UI: cream paper, serif headlines, one crimson accent. It feels nothing like a loud, neon reel.

---

## 2. Colour palette

| Role | Hex | Where it's used |
|---|---|---|
| Paper (page background) | `#F2F0E3` | Full-screen takeover background |
| Ivory surface | `#FDFDF3` / `#FFF9F2` | Inner panels, chips, price box, script.md card |
| Frosted card on video | `#F5EFE0` at ~88% + backdrop blur *(est.)*; reads `#E8E0C9` over the warm room | The floating top card |
| Hairline / divider | `#DDDBCE` | Header divider, panel borders |
| Track grey | `#D5D3C6` | Unfilled progress segments |
| Ink | `#0A0705` (warm near-black) | Serif headlines, chip labels, captions |
| Body text | `#3F3726` | Descriptions, meta text |
| Crimson accent | `#D30135` (ring `#DA0133`) | Progress fill, ring, check badges, highlight borders, multiplier tags |
| YouTube red | `#E5002B` | YouTube play icon only |
| Claude terracotta | `#CC6350` | Asterisk logo, toggle ON, big numerals (`10`, `21`), send button |
| Brick (italic accent) | `#95493F` | Italic serif accents ("end-to-end.", "free to use", "Comment anything."), status-pill text |
| Blush pill | `#F7DED4` / `#F5E2D4` | Status pill and "Open source" chip backgrounds |
| Neutral chip | `#E9E6D8` *(est.)* | "MIT License" and "11 skills" chips |
| Hook title box | `#000000`, text `#FAFAFA` | Opening hook title only |
| Data-grid pastels | mustard `#E3B23C`, brick `#C8614F`, olive `#5E6F2E`, mauve `#B9A3AE`, sky `#BFD3DD`, pink `#EE97A7`, charcoal `#2E2B28` *(est.)* | Thumbnail tiles in the virality grid |

**Rule:** one saturated colour per moment. Crimson marks progress and selection, and terracotta marks the brand. Everything else stays cream or ink.

---

## 3. Typography

| Role | Look | Free font to match |
|---|---|---|
| Hook title (0–3 s) | High-contrast condensed serif, white, Title Case, 2 lines | **Instrument Serif** (bolder weight if available) |
| Card headlines | Book-weight transitional serif, ink; italic variant in brick for the accent phrase | **Newsreader** or **Source Serif 4** (Claude's own font is Tiempos/Copernicus) |
| Big numerals (`₹0`, `10`, `21`) | Same serif, 64–90 px, ink or terracotta | Newsreader |
| UI labels / chips / meta | Clean geometric sans, medium 500–600 | **DM Sans** (Inter works too) |
| Code / commands / status pill | Monospace, 14–16 px; `/yt-` prefix in brick, rest ink | **DM Mono** or **JetBrains Mono** |
| Tiny caps labels ("PRICE", "5 SCORED", "HOOK") | Sans, 11 px, letter-spaced +8%, grey-brown | DM Sans |
| Captions | Handwritten marker. Normal words are thinner; emphasis words are heavier with a soft drop shadow | **Caveat** (normal) + **Caveat Brush** (emphasis) *(closest match; confirm)* |
| Thumbnail tiles | Heavy all-caps sans | **Archivo Black** / Inter Black |

---

## 4. Layout grid (720 × 1280)

- **Hook title:** y 140–325, centred, each line in its own black rounded box (radius ~14), and the boxes stack and touch.
- **Floating card:** x 40–680 (40 px side margins), y 148–507 (~360 tall, grows or shrinks to fit content), radius ~22, soft shadow `0 12px 40px rgba(60,40,20,.18)` *(est.)*.
  - **Header row** (y ≈ 171): terracotta asterisk + YouTube icon + "YouTube Agent Skill" (DM Sans 600, 17 px). On the right is a **status pill** (blush, red dot, mono text), and the text changes per section: `open-source → connected → 11 skills → /yt-script → … → install → link via DM`.
  - **Hairline divider** under the header.
  - **Content area** (~250 px).
  - **Progress bar** at the bottom of the card (y ≈ 490).
- **Speaker:** the face stays in the lower ~55–60% of the frame and the card never covers it. The A-roll is jump-cut, with cuts hidden under card transitions.
- **Caption pill:** centred, y ≈ 1065–1145 (bottom ~15% of frame), radius ~14.
- **Full-screen takeover:** the header row stays at the **same y (171)** as in card mode, so the card appears to grow down around it. Content runs from ~y 200 to 760. The progress row moves to y ≈ 800–826, and the bottom third stays empty paper except for the caption.

---

## 5. Signature components

1. **Chapter progress bar.** It looks like a YouTube player scrubber and is a real timer for the reel. It has 10 segments, one per chapter, with segment widths proportional to chapter length; filled segments are crimson, unfilled ones track grey, and a crimson dot marks the playhead. In full-screen mode it also shows `0:27 / 0:42 • Virality agent` (the chapter name) plus CC and settings icons. It ticks forward constantly.
2. **Status pill.** It names the current section in mono text, like a terminal breadcrumb.
3. **Ivory chips.** Small rounded rectangles in ivory with a 1 px hairline, holding icon + label (`Ideas`, `Scripts`) or a command (`/yt-script`).
4. **Crimson check badge.** A small red circle with a white tick, popped onto the top-right corner of a chip when that item is "done".
5. **Counters.** Big serif numerals that count up (2→5→8→11 skills, 3→21 hooks, view multipliers, comment counts).
6. **Typing.** Every text field types character by character with a thin caret: repo name, headline, search bar, script, comment, chat prompt.
7. **Skeleton → content.** Blank ivory blocks with a soft shimmer sweep resolve into real content (thumbnail, waveform, text lines).
8. **Highlight-and-dim.** When something is chosen, the winners get a crimson 3 px border, a glow and a numbered red badge (#1, #2, #3), and everything else fades to ~40% opacity.
9. **Marker highlight.** A yellow highlighter fills behind key words in a title or quote, and filler words get a red strikethrough.
10. **Claude-style chat box.** "How can I help you today?", a + button, a link chip, a send arrow that turns terracotta, then "Installing…" with a shimmer, then "✓ 11 skills installed".

---

## 6. Motion language

All motion is soft and quick: **ease-out, 150–300 ms**, with no bounces or overshoot. The key move is a **blur dissolve**, where content fades in from ~8 px blur and 0% opacity to sharp.

| Move | What happens | Timing |
|---|---|---|
| **Card in (A)** | A small blank frosted panel appears at the top-left, then slides right and grows to full card size while the content types in | ~0.25 s grow, then content |
| **Card in (B), pill morph** | A thin 4 px line appears top-centre → stretches into a pill → expands vertically into the card (Dynamic Island style) | ~0.3 s total |
| **Card content swap** | The card stays put and its height eases to the new content. Old content blur-fades out and new content blur-fades in | ~0.15–0.2 s |
| **Card → full screen** | Content fades out, then the card expands down and out to the edges, covering the video with paper. The header stays in place | ~0.2 s |
| **Full screen → card** | The paper panel shrinks up into the card position, revealing the speaker, and the content cross-fades to the next section | ~0.3 s |
| **Hook title out** | A hard cut-off on the frame the first card arrives | 0 s |
| **Element pop-in** | Chips and tiles fade and scale from 96% to 100%, staggered ~60–80 ms | 0.15 s each |
| **Line draw** | The ring, connector squiggle, graph line and underline draw along their path | 0.4–0.6 s |
| **Toggle** | The knob slides, the track fills terracotta and "ON" appears | 0.2 s |
| **Chip fly** | The chosen chip (`/yt-script`) lifts out of the grid to top-centre while the others fade | 0.3 s |

---

## 7. Captions

- **Font:** handwritten marker (see §3), ink colour `#0A0705`, ~30 px.
- **Pill on video:** frosted white, ~45% opacity, blurred backdrop, no border.
- **Pill on paper:** near-solid `#F8F7F3`, very soft shadow.
- **Reveal:** words appear **one at a time on the spoken word**, each fading in from grey and blurred to solid ink in ~0.12 s. The phrase builds up to 2–5 words, then the pill clears and starts the next phrase.
- **Pill width:** fits the phrase and grows as it builds.
- **Emphasis words** (about one per chapter, on the key noun: *agent, video editing, calendar, virality, viral, videos, audience*): heavier brush weight, slightly larger, a soft dark shadow and a **hand-drawn red underline swoosh** in `#D30135` that draws left to right under the word.
- **Language:** captions keep the spoken Hinglish exactly as said, in lowercase except names (Claude, YouTube, DM).

---

## 8. Edit structure & rhythm (the timeline)

The video has about 10–11 chapters in 42 s (the progress bar shows 10 segments), so something changes every 1.5–3 s and nothing sits idle.

| Time | Mode | Chapter (status pill) | What the card shows |
|---|---|---|---|
| 0.0–3.0 | A-roll + hook title | — | Black-box serif title "Automate Your Complete Youtube Channel" |
| 3.0–4.7 | Card | `open-source` | Repo card: `youtube-agent-skill` types in, Public tag, description, chips (MIT License / Open source / 11 skills). Price panel: **₹0**, *free to use*, "No signup · No API key" |
| 4.7–9.1 | **Full screen** | `connected` | Claude asterisk + YouTube logo pop in → squiggle connector draws with a check → shrinks to centre → headline types "Your whole YouTube channel, *end-to-end.*" → 7 feature chips orbit in → crimson ring draws clockwise and check badges pop on each chip → Autopilot toggle flips ON |
| 9.1–12.75 | Card | `11 skills` | Path `skills/youtube-agent-skill` types → serif title "YouTube Agent Skill" types → counter 2→5→8→11 while `/yt-*` chips pop into a grid |
| 12.75–15.4 | Card | `/yt-script` | Chip flies up → stacked hook cards (#01 HOOK "Curiosity gap"), 3→21 *proven hooks* → 5 scored hooks list, top one highlighted, arrow → `script.md` types the hook |
| 15.4–17.6 | **Full screen** | `/yt-package` | YouTube home mock: category chips, skeleton thumbnail shimmer → real thumbnail "AI DOES IT ALL" → title types → "Pair check" chips tick |
| 17.6–18.9 | Card | `/yt-edit` | Edit decision list: transcript with "umm", "[2.1s silence]" and "wait, let me redo that" struck through in red; waveform with pink cut regions → collapses to a "✂ 3.1s cut" pill |
| 19.0–21.6 | Card | `/yt-comment` | Comments 546: tagged comments (QUESTION / PRAISE), category counters tick up, a reply "in your voice" types, "📌 Pin @neha.creates" |
| 21.7–23.5 | Card | `/yt-plan` | "This week" Mon–Sun calendar: tiles drop in (long video crimson, short peach, post grey), "Fits your 8 hrs", "✓ Planned" |
| 23.5–24.8 | **No overlay** | — | A deliberate breath of plain A-roll right before the climax ("And iska craziest part…") |
| 24.8–25.9 | Card (pill morph in) | `/yt-viral` | Serif italic "Virality" + "Agent" with a line graph that spikes to a **18.4×** tag |
| 25.9–34.4 | **Full screen** | `/yt-viral` | Niche search types → 3×3 grid of coloured title tiles with view multipliers → top 3 outliers highlighted and the rest dimmed → pick #1 → breakdown: title pattern (yellow marker), hook quote, structure graph with segment tags → "Blueprint → Your version" card: new thumbnail, Hinglish title types, voice waveform `voice.md`, audience chips (India · Hinglish · 18–30 · Creators), black "● Ready to shoot" pill |
| 34.4–40.0 | Card | `install` | Steps 1 Paste link · 2 Ask to install · 3 Ready. Chat box → link chip pastes → "install this skill" types → send turns terracotta → "Installing…" → "✓ 11 skills installed. Try /yt-script" |
| 40.0–42.1 | Card | `link via DM` | Link + Setup guide chips, *Comment anything.*, comment "Link please!" posts → a "New message" DM notification pops in with the link |

**Rhythm rules found in this edit:**
- **Card on video** for explaining and **full screen** for the 3 most visual "wow" moments, 2–8 s each.
- Every chapter is about a **single idea** with **one animated payoff**: a count, a tick, a toggle or a highlight.
- The visual action lands **on the spoken keyword**: a counter hits 11 when he says "11", and "free" appears with ₹0.
- One **empty beat** (no overlay) just before the biggest section.
- The CTA is shown **as UI** (a comment field and a DM), not as a text card.
- No sound-design cues are visible; check the audio for whooshes and clicks.

---

## 9. What this means for building the skill

- This style is **UI motion graphics**, not face effects. It needs layout, typing, counters and blur dissolves, which are easiest to build as **HTML/CSS templates rendered frame by frame** in headless Chrome (Playwright) and then composited over the A-roll with ffmpeg. Hand-drawing them in Python/PIL, the way `fx.py` does, would be much harder. It looks like you already have HyperFrames installed (`~/.hyperframes`), which takes the same HTML-to-video approach.
- **What to reuse from the effects skill:** setup, word timings (`words.py`) for captions and on-keyword sync, the plan JSON, check frames, and the "never cover the face" rule. Face detection can decide how far down the card is allowed to reach.
- **New building blocks to create:** card shell (header, status pill, progress bar), full-screen takeover, caption track, plus content templates such as repo card, counter + chip grid, ring diagram, list-with-scores, comments, calendar, outlier grid, chat-install box and DM notification.
