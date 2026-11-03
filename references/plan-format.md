# Plan format (`<video-name>_cook.json`)

One JSON file describes the whole edit. Times are seconds in the video. Image paths (logos, icons, mascot files) can be relative to the plan file.

```json
{
  "title": "YouTube Agent Skill",
  "icons": "logos/claude.svg|logos/youtube.svg",
  "accent": "#D30135",
  "frame": {"zoom": 1.0},
  "captions": {"words": "myvideo.words.json", "emphasis": "free|agent|video editing", "max_words": 4},
  "chapters": null,
  "effects": [
    {"fx": "hook-title", "start": 0, "end": 3, "text": "Automate Your Complete|YouTube Channel"},
    {"fx": "card-in", "at": 3.0, "show": "repo-card", "name": "youtube-agent-skill"},
    {"fx": "boom-card", "at": 4.7, "show": "connect", "a": "Claude", "b": "YouTube"},
    {"fx": "card-swap", "at": 6.8, "show": "orbit-ring", "toggle_at": 8.5},
    {"fx": "boom-card-back", "at": 9.1, "show": "counter-grid", "title": "YouTube Agent Skill"},
    {"fx": "card-out", "at": 23.5},
    {"fx": "mascot", "state": "thinking", "start": 3, "end": 6}
  ]
}
```

## Top-level settings (all optional)
| Key | Meaning | Default |
|---|---|---|
| `title` | Name in the card header | `Aashish Cooks` |
| `icons` | Header icons, `\|`-separated: logo files or Lucide icon names (`scissors`, `sparkles`) | `sparkles` |
| `layout` | `top`: card above the head (the reference look). `below`: card under the chin, captions above the head. Use it when `analyze.py` says the face is too high | `top` |
| `card_y` | Top edge of the card in `below` layout | 790 |
| `accent` | Crimson accent colour (progress bar, ring, badges, underline) | `#D30135` |
| `frame` | `{"zoom": 1.2}` zooms the video from its top edge so the face sits lower under the card | none |
| `captions` | `false` turns captions off. `font`: `kalam` (default, Kalam Bold) or `caveat`. `words`: word-timing file (default `<video>.words.json`). `emphasis`: words or phrases (`\|`) that get the bigger weight and red underline. `max_words`: words per caption phrase (4). `bottom`: where captions end (1088 = 15% above the bottom, clear of Instagram's name and caption area). Captions always sit at the bottom; if the chin reaches them they tighten | on |
| `sfx` | `false` turns sound effects off. `{"auto": true, "volume": 0, "meme_max": 4, "music": "music.mp3", "music_gain": -20}`: auto places sounds on every move; `volume` shifts all sounds in dB; `mute`: cue kinds to keep silent (`["money"]` when a price panel is not about money); `music` plays under the voice and ducks when she or he speaks | on |
| `client` | `true` for a client's reel (memes are allowed: the user has permission) | false |
| `voice` | `{"clean": true, "strength": "medium", "polish": true}` removes background noise with DeepFilterNet (`light` 10 dB, `medium` 15 dB, `strong` 22 dB of noise cut) and polishes the voice (rumble cut, clarity boost, even level, softer "s"). Length never changes, so lip-sync is safe. **Ask the user before turning it on** | off |
| `chapters` | Override the progress-bar chapters: `[{"at": 0, "name": "Intro"}, ...]`. By default each new card content starts a chapter | auto |
| `intro` | Name of the chapter before the first card | `Intro` |

## Moves (the card track)
Card moves run in time order. Only one card exists at a time.

| `fx` | Needs | What happens |
|---|---|---|
| `card-in` | `at`, `show` | The card enters above the head. `style: "pill"` morphs line → pill → card; the default slides in and grows |
| `card-swap` | `at`, `show` | New content in the same card (or the same full screen), with a blur dissolve |
| `boom-card` | `at` | The card bursts to full screen. With `show`, the content swaps as it grows; without it, the current content keeps playing and scales up |
| `boom-card-back` | `at` | Full screen shrinks back into the card. `show` works the same way |
| `card-out` | `at` | The card leaves (card → pill → gone). Use it for a breath of plain video |
| `rise-card` | `at`, `show` | The card pops up from **behind the speaker** (they stay in front of it) into the empty space above the head, then stays clear of the face. Its height fits the space above the head while it is up (220–420px). Needs footage with room on top: `analyze.py` says how much |
| `rise-out` | `at` | The rise-card sinks back down behind the speaker |

`card-swap`, `boom-card` and `boom-card-back` work on a rise-card too: a boom grows out of it and `boom-card-back` returns to it.

Every move also takes `status` (text in the header pill), `chapter` (name on the progress bar) and `sfx` (`"none"` to silence it, or a sound name from `sfx/sfx.json` to replace its sound). Each content type has a sensible default.

Timing: a move's content starts animating 0.1–0.4 s after `at`. Keep moves at least 0.8 s apart.

## Other effects
| `fx` | Options |
|---|---|
| `hook-title` | `text` (lines with `\|`), `start`, `end` (defaults to the first card-in), `y` (140) |
| `mascot` | Optional, needs your own mascot files (none are bundled). `state` (a file name in `mascot/` or `mascot/states/`, like `thinking`, `typing`, `done`; see `mascot/README.md`). A missing state is skipped with a warning. `start`, `end`, `pos`: `card` (sits on the card's top-right edge, default), `left` (top-left edge), `corner` (bottom-right, above captions), `bar` (walks along the progress bar). `size` (112) |
| `mascot-walk` | Same as `mascot` with `pos: "bar"`; use a walking state |
| `illustrate` | A hairline line figure floating in the space above the head, with no card. `figure`, `start`, `end`, `tone` (`ink`, `terra`, `crimson`), `intensity` (0–1), `moves`, `label` (italic line under it), `box` (`[x, y, width]` to place it yourself) |
| `sfx` | One sound at a moment: `name` (from `sfx/sfx.json`) or `role`, `at`, `gain` (dB), `dur` (for typing/cooking beds). Risers are placed so their **peak** lands on `at`: put `at` on the reveal |

## Sound effects
Moves and card content make their own sounds (from `sfx/sfx.json`), so most reels need no `sfx` effects at all:

| Moment | Sound |
|---|---|
| card-in, rise-card | woosh, then pop as it lands |
| card-out, rise-out, boom-card | woosh |
| boom-card-back | pop |
| card-swap | soft click |
| typing in a card | typing (WhatsApp typing) for as long as it types |
| counters, rings, installing (AI cooking) | cooking (text scroll) |
| checklist ticks / last tick | click (the meme-click) / ding |
| DM, notification | notification |
| price or ₹ value lands | cash |

Add by hand with `{"fx": "sfx", ...}` at these **sound moments** (learned from Aashish's edits; also listed in `sfx/sfx.json` → `moments`):

| Moment in the script | Sound | Where | Example |
|---|---|---|---|
| A shock line in the hook ("the world just changed") | `surprise` | on its last words | 0:02 "…hila ke rakh **diya hai**" |
| A shocking or unexpected fact | `faaah` | at the end of the fact | 0:08 "…critical bugs … **kiye**" |
| Money talk: earning, reward, dollar, paisa, kamao, price, free | `cash` | at the end of the money phrase | 0:12 "earning opportunity … **sakti hai**" |
| Someone doing a task: finding, scanning, researching, building, analysing | `cooking` with `dur` | a bed under the whole stretch | 0:13–0:18 "companies … vulnerability discover … bug bounty" |
| Curiosity before a big reveal (only when no shock/reveal sound is near) | `riser`, `riser-metal`, `build-up` | `at` on the reveal; its peak lands there | |
| Funny reveal | `funny-reveal`, `yooo` | on the reveal | |
| Wrong / warning | `error` | on the warning word | |
| Wow | `magic`, `wooow` | on the wow | |

Meme hits are cleared for every reel, client reels included, up to `sfx.meme_max` (4) per reel:

| Moment | Meme |
|---|---|
| A hard hit, a slam, "khatam" | `punch` |
| A number so big it's funny | `are-bapre` (right after the number) |
| A win: it worked, got paid, it's free | `ayeee` |
| A silly mistake, a typo | `quack` |
| It fails, crashes, gets rejected | `oof` |
| An awkward or cringe line | `caw` (in the pause after) |
| A funny twist | `funny-reveal`; `yooo` for hype |
| Any other joke that needs a button | `meme-sting` |

Screen effects add their own: `pop` (tiles, widgets), `woosh` (camera moves, word drops), `punch` on `reject-stamp` and `red-collage` slams, `error` on the `uninstall` glitch.

Rules the mixer keeps: one-shots at least 0.18 s apart, a riser is dropped if it would run into a shock or reveal sound, the voice is never lowered or covered, the final mix is levelled to −14 LUFS.

## Figures (hairline)
33 isometric line figures from `@lucasmarkes/hairline` (MIT), drawn in the cooks palette and moved by a scripted pointer, frame-exact. Use them in a card with `"show": "figure"` or alone with `illustrate`.

| Topic | Figure |
|---|---|
| coding, an AI agent, CLI | `terminal` |
| typing, prompts | `keyboard` |
| apps, UI layers, how it is built | `exploded`, `stack` |
| mobile | `phone` |
| setup, your machine | `laptop` |
| versions, git, history | `branches` |
| servers, compute, GPUs | `cabinet` |
| APIs, network, sending | `router`, `dish`, `relay` |
| security, privacy, passwords | `padlock`, `vault` |
| integrations, connectors, plugging in | `plug`, `patch` |
| search, data, finding | `loupe`, `sieve`, `query` |
| automation, pipelines, queues | `slow`, `elevator` |
| files, storage | `drawer`, `lockers`, `cabinet` |
| choosing, comparing | `riffle`, `turntable`, `basket` |
| data, charts, signals | `plot`, `terrain`, `phosphor` |
| networks, many tools around one | `hub`, `settle`, `rebuild` |
| formatting, cleanup | `format` |
| a question | `query` |

`moves`: where the "pointer" goes, as `[[time, x, y], ...]` with x/y from 0 to 1 across the figure (keys sink under it, layers open, blades slide out). Put moves on the spoken words. Without `moves` the pointer drifts slowly so the figure stays alive. `tone`: `ink` (default), `terra` or `crimson`, all on ivory.

## Icons
Chips, checklists and stat cards use **Lucide** icons (lucide.dev, 1,500+ line icons). Name one after a colon in a list item, like `Reviews:star|Clients:users`, or with an `icon` option. Common words get one automatically: Ideas→lightbulb, Reviews→star, Clients→users, Hair→scissors.

## Text in Marathi or Hindi
Cards and the hook fall back to Devanagari fonts on their own: Tiro Devanagari Marathi (serif), Mukta (sans) and Kalam (handwriting). Mixed lines like `Treatment आधी तपासा` render correctly.

## Card content (`show`)
Text options are plain strings. Lists use `|`. Time options are video seconds and are optional; without them the content paces itself to fill its window.

### `headline`
A serif line types in word by word, with an optional italic accent line below.
`text`, `accent`

### `repo-card`
The repo name types, a description and chips pop, and a price panel lands with a big number.
`name`, `visibility` (Public), `desc`, `chips` (`MIT License|Open source|11 skills`; the 2nd chip is blush), `url`, `price` (`₹0`), `price_title` (Price), `price_label` (free to use), `price_note`, `price_at` (when the price lands; put it on the word "free")

### `connect`
Logo A, then a squiggle draws to logo B, then a tick. Best in full screen.
`a`, `b` (names), `a_logo`, `b_logo` (files; without them, lettered tiles are used), `title` (optional headline above)

### `orbit-ring`
A headline plus italic accent, chips around a ring that draws clockwise and ticks each chip, the two logos in the centre, and a toggle that flips ON. Best in full screen.
`title`, `accent` (`""` hides it), `items` (`Ideas|Scripts|...`, 5–8 work best), `a`, `b`, `a_logo`, `b_logo`, `toggle` (Autopilot), `toggle_at`

### `counter-grid`
A path types, a serif title types, and a big number counts up as command chips pop into a 4-column grid.
`path`, `title`, `items` (chips; a `/name-` prefix is coloured brick), `label` (agent skills), `ticks` (video seconds when each chip pops, `\|`; put them on the spoken count), `total` (final number if more than the chips shown)

### `chat-install`
A Claude-style chat box: link chip pastes → prompt types → send → "Installing…" shimmer → ✓ done. Three steps light up along the way.
`steps` (`Paste link|Ask to install|Ready`), `placeholder`, `link`, `prompt` (install this skill), `installing`, `done`, `link_at`, `type_at`, `send_at`, `done_at`

### `dm-cta`
Link + guide cards and an italic CTA on the left. On the right, a comment types and posts, then a "New message" DM pops in.
`label` (In your DMs), `link_title`, `link_sub`, `guide`, `guide_sub`, `cta` (Comment anything.), `user` (letter for the avatar), `comment` (Link please!), `sent`, `dm_title`, `dm_text`, `dm_link`, `avatar` (image), `comment_at`, `post_at`, `dm_at`

### `stat`
One big number or word that lands (or counts), an italic accent line, and an icon tile, with an optional progress bar.
`label` (small caps line), `value` (text) or `from`/`to`/`unit` (counts up), `value_at` (put it on the spoken word), `accent`, `note`, `icon` (Lucide name; `""` hides it), `bar` (0–1), `bar_at`, `bar_label`

### `compare`
Two rows race. The short bar fills fast and the long one keeps going ("skin 1 month vs hair 2–3 years").
`title`, `a`, `a_value`, `a_n`, `a_icon`, `a_at`, `b`, `b_value`, `b_n`, `b_icon`, `b_at` (`a_n`/`b_n` set the bar lengths), `note`

### `checklist`
Rows arrive, then each one ticks on its spoken word. The card height fits the number of rows.
`title`, `items` (`Label:icon|...`), `ticks` (video seconds, `|`), `icons` (`false` hides the row icons)

### `figure`
A hairline line figure on the left, with an optional serif title, text and italic label on the right (without text, the figure is centred alone).
`figure`, `title`, `text`, `label`, `tone`, `intensity`, `moves`

### `orbit-ring` extras
`center: "Word:icon"` puts a word in the middle instead of two logos. `toggle: ""` hides the toggle.

## Screen effects
The 45 screen effects (spotlight, noise, lean-in, the-bill, split-headline...) have their own page: `references/screen-effects.md`.

## Not built yet
`score-list`, `yt-home`, `cut-list`, `comments`, `week-plan`, `spike-graph`, `outlier-grid`, `breakdown`, `blueprint`, `terminal`, `receipt-compare`, `toggle-list`, `notif-stack`, `marker-quote`, `zoom-chip`. If one is asked for, say so and offer the closest v1 content: `headline` for quotes, `counter-grid` for lists, `orbit-ring` for "everything connected", or `repo-card` for a product or price.
