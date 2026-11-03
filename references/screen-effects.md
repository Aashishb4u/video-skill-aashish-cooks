# Screen effects (45)

The 45 effects of claude-video-effects (Vibha Ramprakash, MIT), rebuilt in the cooks look: ivory panels, ink, crimson, terracotta, Newsreader / DM Sans / DM Mono / Kalam, soft quint motion. They are code in `engine/effects.js`.

Add one like any effect: `{"fx": "spotlight", "start": 6.2, "end": 9, "text": "reward"}`. `end` is optional (each effect has a default length). Lists use `|`, like `"text": "Recon|Scan|Report"`.

**Rules that hold for all of them**
- Nothing covers the face. Floating widgets sit in the space above the head. Tiles that pass in front of the speaker fade while they cross the face.
- **behind** = drawn behind the speaker using the person cutout (MediaPipe, automatic). Without it they draw over the speaker, and the render warns.
- `images`: a folder or `a.jpg|b.jpg` list for the tiles (your reels, screenshots). Without images, tiles are palette cards with a Lucide icon and your `text` labels.
- They can run at the same time as cards and captions. Do not stack two camera effects (zoom, push, split) in the same seconds.
- Sounds land on their own (pop, woosh, click, typing, cooking, stamp, glitch). Add moment sounds as usual.

## Tiles and walls (behind)
| fx | What it does | Options |
|---|---|---|
| `noise` (`the-noise`) | Your reels pile up behind your head, one every quarter second | `images`, `text` (labels), `size` |
| `lineup` (`the-lineup`) | Numbered serif tiles fan out in an arc above the head | `text` (one per tile, up to ~7) |
| `orbit` | Tiles circle the head: behind at the top, in front at the bottom | `count` (6), `size`, `speed`, `images` |
| `carousel-spin` | A 3D carousel of tiles spins around you and slows to a stop | `count` (8), `turns`, `size`, `images` |
| `profile-wall` | A grid of your reels fills the wall; a counter pill ticks up | `count` (12), `total`, `label`, `images` |
| `headline-wall` | News strips stack behind your head, then a total pops in front | `text` (`Headline::Source\|...`), `total`, `label` |
| `match-cut` | News pages cut every 0.14 s on one word, locked in a crimson box | `text` (the word), `color` |

## Words behind you (behind)
| fx | What it does | Options |
|---|---|---|
| `backdrop-word` | A giant serif word drops in behind you | `text`, `size` (230), `font` (`bold` = Archivo Black), `color` |
| `spotlight` | The room goes dark, you stay lit, a glowing italic word sits behind | `text`, `look` (`sparkle` = gold rays + sparkles), `push` (1.12), `color` |
| `glitter-spotlight` | `spotlight` with `look: sparkle` | same |
| `cover-star` | Magazine cover: masthead behind your head, issue line, cover lines, film grade | `text` (masthead), `lines`, `right`, `issue`, `date` |
| `red-collage` | Black-and-white you, a giant crimson word behind, three lines slam in | `text`, `lines`, `tag` |
| `pastel-word` | A blush room replaces the background, a giant italic word, a profile card gets followed | `text`, `name`, `handle` |
| `led-sign` | Lights drop; a dot-matrix terracotta sign types itself out behind you | `text` (lines), `color`, `push` |
| `shortcut-rain` | Keyboard keycaps rain down behind you | `text` (keys), `count` (22) |
| `the-bill` (`bill`) | Your steps print like a receipt into the wall above your head | `text` (lines), `title`, `total` |
| `check-pills` | Grid-paper room with boards behind you; a cursor clicks crimson pills | `text` (pills), `images` |
| `apple-toggles` | A settings card tucked behind your head flips its switches on | `text` (rows), `ticks` (times), `pos: below`, `color`, `zoom` |
| `todo` (`to-do`) | A to-do card above your head ticks off, items struck through | `text` (`Item::meta\|...`), `ticks`, `title` |
| `checklist` | Like `todo`, but each step spins first, then ticks crimson | `text`, `ticks`, `title` |

## Camera and colour
| fx | What it does | Options |
|---|---|---|
| `lean-in` | A fast punch-in on one word | `zoom` (1.45), `speed` |
| `locked-on` | Crimson brackets snap onto the face; the camera follows in | `zoom` (1.35), `text` (tag) |
| `slow-push` | A slow cinematic push while the room melts out of focus (behind) | `zoom` (1.6), `blur` (10) |
| `headline-box` | Punch-in with a two-line headline, line two in an ivory box | `text` (`line one\|line two`), `zoom` (1.2) |
| `over-the-shoulder-zoom` | Pushes into one top corner (glass line graph), then the other (bar graph) | `text` (two labels), `to` (two numbers), `zoom` (2) |
| `moody` | A colour grade | `grade`: `moody`, `bw`, `warm`, `cool`, `pop`, `film` |
| `swipe` | A before/after slider sweeps across with the new grade | `grade` (`film`) |
| `timeline` | Warm film grade, REC timecode, an editing timeline with a playhead above your head | `text`, `sub`, `tc` |
| `reject-stamp` (`stamp`) | A crimson stamp slams in with a camera shake | `text` (`REJECTED`), `angle`, `y`, `color` |
| `pause-point` (`pause`) | Freezes the frame; a Kalam label and a hand-drawn crimson arrow point at you | `text`, `label_x`, `color` |

## Frames of your video
| fx | What it does | Options |
|---|---|---|
| `reel-frame` | Your video shrinks into a reel card on cream paper (handle, icons) | `text` (handle) |
| `rabbit-hole` | The frame tunnels into itself, ivory-framed and turning | `ratio` (.72), `spin` (14), `speed` |
| `dot-reveal` | Your shot builds out of dots on ink, then snaps to the full picture | `cell` (16), `color` |
| `uninstall` | An uninstall bar runs, then the frame glitches apart | `text` |
| `place-in-grid` | You shrink into the centre of a 3x3 grid; 8 reels pop in with view counts | `views` (9 values), `images` |
| `split-headline` | You shrink into a rounded card; a paper panel above holds the headline | `text` (lines), `hl` (word to mark), `pill`, `scale` (.74) |
| `broll-split` | Same split with b-roll on top and a crimson price sticker | `images`, `text` (sticker), `label` |

## Floating widgets (above your head, in front)
| fx | What it does | Options |
|---|---|---|
| `comment-box` | A comment bar types a word, Post turns crimson, the comment pops | `text`, `user`, `handle` |
| `tap` (`follow`) | A Follow button pops and flips to Following under a tapping pointer | `x`, `y` (0–1), `color` |
| `countdown-flip` (`countdown`) | A 3-2-1 flip card | `from` (3) |
| `scribble` | Marker doodles draw themselves around you (circle, stars, arrow) | `text`, `color` |
| `glass-widgets` | Frosted widgets (views, profile, growth, pill) bob around the top | `text`, `label`, `name`, `handle`, `pill`, `look: simple` |
| `liquid-glass-graph` | A glass card where a crimson graph climbs and the number counts up | `text`, `from`, `to` (`197K`), `look: bento` (+2 tiles: `donut`, `kpi`) |
| `messages` | Message notifications pop in and stack | `text` (messages), `title`, `y` |
| `tier-list` | A tier list drops in; your item flies into S tier | `item`, `others`, `title` |
| `phone-fan` | Your reels fan out like a hand of phones under a headline | `text` (headline lines), `images` |

## Picking one in auto mode
| What is said | Effect |
|---|---|
| "So much content / everyone is posting" | `noise`, `profile-wall` |
| A ranked list or steps | `lineup`, `todo`, `checklist`, `the-bill` |
| "Everyone's talking about X" / news | `headline-wall`, `match-cut` |
| The one big word of the reel | `backdrop-word`, `spotlight`, `led-sign`, `red-collage` |
| "Look at this guy / me" | `pause-point`, `locked-on`, `scribble` |
| A strong punchline | `lean-in`, `headline-box`, `reject-stamp` |
| Growth, numbers, views | `liquid-glass-graph`, `glass-widgets`, `over-the-shoulder-zoom`, `place-in-grid` |
| Comment / follow CTA | `comment-box`, `tap` |
| Before vs after | `swipe`, `moody` |
| Settings, features turned on | `apple-toggles`, `check-pills` |
| Countdown, "3 things" | `countdown-flip` |
| Rankings, comparisons of tools | `tier-list` |
| Price or product shot | `broll-split` |
| A story beat, deep dive | `rabbit-hole`, `timeline`, `cover-star`, `slow-push` |

Use 2–4 screen effects in a 40 s reel, never on the same beat as a `boom-card`.
