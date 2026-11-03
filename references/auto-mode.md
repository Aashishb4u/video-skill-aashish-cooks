# Auto mode: plan the whole edit from the transcript

`/aashish-cooks auto` means: read what is said, then build a plan the way the reference reel is edited. The goal is a live UI card that acts out each sentence, with full-screen moments for the big ideas.

## 1. Gather
1. Run `scripts/analyze.py <video>` to get the duration and where the face sits. Apply its `frame` fix if it suggests one.
2. Run `scripts/words.py <video>` (add `--lang hi` for Hinglish). Open the `.words.json` file. If Hindi came back in Devanagari or got translated, rewrite each word in romanized Hinglish exactly as spoken ("ismein", "karke", "jaayega"). Keep the times. Captions show these words as written.
3. Read the transcript as sentences. Note every product name, number, list, "how it works" moment and the call to action.

## 2. Cut it into beats
- One beat = one idea, usually one sentence, 1.5–4 s long. A 40 s reel has about 8–12 beats.
- Start each beat on the first word of its sentence, so the card change lands with the voice.

## 3. Match each beat to card content (v1 set)
| What is said | Content |
|---|---|
| A product, repo, tool or price ("it's free", "open source") | `repo-card` (put `price_at` on "free") |
| "X connects to Y", "works with" | `connect` (full screen) |
| "Everything / end-to-end / handles all of it" + a list | `orbit-ring` (full screen; `toggle_at` near the end of the sentence) |
| A number of things, a list of features or commands | `counter-grid` (`ticks` so the count hits the spoken number) |
| A line worth quoting, a promise, a summary | `headline` |
| "Setup is easy / just paste the link / install" | `chat-install` |
| "Comment X / I'll DM you the link" | `dm-cta` (always last) |

Fill every text option from the speaker's own words and topic. Leave nothing generic: the title is their product name and the chips are their real features.

## 3b. Figures and sounds
- For AI or tech talk, give 2–4 beats a hairline figure (table in `plan-format.md`), in a card (`"show": "figure"`) or alone (`illustrate`). Put its `moves` on the words that matter (keys sink on "type", the padlock opens on "secure").
- Sounds come automatically with moves and card content. Then read the transcript for the **sound moments** in `plan-format.md` and add them as `sfx` effects:
  - the hook's shock line gets `surprise` on its last words;
  - each shocking fact gets `faaah` at its end;
  - each money phrase gets `cash` at its end;
  - each stretch where someone is doing a task (finding, scanning, researching, building) gets a `cooking` bed with `dur` over the whole stretch;
  - a `riser` only before a reveal that has no shock/reveal sound of its own;
  - meme sounds on their moments (table in `plan-format.md`: punch, are-bapre, ayeee, quack, oof, caw, funny-reveal, yooo, meme-sting), up to 4 per reel, client reels included. Aim to use the whole pack across reels, not the same two every time.
  Do not stack: one moment sound per line.

## 3c. Screen effects
- Pick 2–4 beats for a screen effect from the table at the end of `screen-effects.md` (the reel's one big word, a list of steps, "look at this", growth numbers, the CTA).
- Not on a boom beat, not two camera effects at once, and not on a beat where a rise-card is up unless the effect sits behind (behind effects and cards can share a beat).
- Fill their text from the speaker's words.

## 4. Choose the moves
- Pick the card family from `analyze.py`: `rise-card` when there is space above the head (the usual framing), otherwise `card-in` or `"layout": "below"`.
- The first beat with a card uses `rise-card` (or `card-in`). Before it, put a `hook-title` over the first 2–3 s. Use the user's title, or turn the first sentence into a 4–7 word Title Case promise.
- Use `boom-card` for the **2–3 most visual beats** (connect, orbit-ring, big lists), each 2–8 s, and `boom-card-back` right after. Never keep full screen for more than 9 s at a stretch, because the face is the reel.
- Use `card-swap` everywhere else.
- Add **one** `card-out` / `rise-out` of 1–2 s just before the biggest reveal or the final section (a breath), then come back with `rise-card` (or `card-in` with `"style": "pill"`).
- Keep moves at least 0.8 s apart.
- Give each card a short `status` in lowercase mono style (`open-source`, `connected`, `11 skills`, `install`, `link via DM`) and a `chapter` name of 1–2 words.

## 5. Captions
- `emphasis`: about one word per beat, picking the key noun or verb the speaker leans on (agent, free, virality, audience). Never pick filler.
- Leave `max_words` at 4 unless the speaker talks very fast (use 3).

## 6. Mascot (only if the user added one)
- No mascot is bundled. If `mascot/` has no image files, skip this section. If it has the user's mascot, give the reel 2–3 mascot moments, 1.5–4 s each, using the state names it has (`mascot/README.md` lists the names to use):
  - `greeting-fluid` in the hook (pos `corner`), `thinking-fluid` while something is explained, `typing-fluid` or `writing-fluid` during `chat-install`, `searching-web-fluid` during research or a `cooking` stretch, `done` right after a ✓ or a win, `error-fluid` on a fail, `asleep-fluid` during the `card-out` breath, `waiting-for-you-fluid` on the CTA, a `gag-*` state on a funny line.
  - Put it on the card (`pos: card`) when a card is up, `corner` otherwise. Never over the face.
  - `mascot-walk` with `walking-fluid` only if asked.

## 7. Before rendering
- If the user is around, show the plan as a short table (time · move · content · what it says) and ask for changes. In a scheduled or unattended run, go ahead and say which reading you took.
- Render check frames at the middle of every beat and 0.2 s into every boom. Look at them. Fix any overlap with the face, cut-off text or wrong words.
