# Making a new line figure

The reels are mostly about AI and tech. When a beat needs a picture that no existing figure shows (Twitter, an AI agent, a chatbot, a GPU, an API call, a prompt, a dataset...), draw a new figure for it. Read the script, decide what the beat is about, and build the figure for that idea. Do not settle for a figure that is only close.

Figures always go **inside the card**: `{"fx": "card-swap", "at": 8.2, "show": "figure", "figure": "ai-agent", "title": "...", "text": "...", "label": "..."}`. Use a floating `illustrate` only when the user asks for one.

## 1. Check the library first
- **Our figures:** `figures/*.js`. Each file's first lines say what it shows and its `aliases` (other names it answers to).
- **Hairline's 33:** the table in `plan-format.md` (terminal, keyboard, padlock, plug, hub, plot...).

Use one if it says what the beat says. Otherwise draw a new one.

## 2. Plan the picture in one sentence
"An upright feed of posts; a new post pops out and its heart turns crimson." Pick:
- **2 to 5 parts.** Plates (cards, screens, chips, buttons, bubbles), small icons drawn as lines on them, dots.
- **One clear motion** tied to the idea: a pulse travels, a post drops in, keys sink, a toggle flips, a bubble types, a bar fills. It loops every 1.5 to 4 s, so any moment of the beat looks alive.
- **What the pointer does:** the part under it lifts or lights up. The pointer follows `moves`, so the beat can point at the right part on the right word.

Draw the **meaning, never a logo or a company's character**. Twitter is a feed with a heart, not the bird or the X mark. A Claude bot is an original friendly bot, not Anthropic's logo or mascot. If the user wants a real logo, it goes in `logos/` and shows in the card header.

## 3. Write `figures/<name>.js`
Use a short lowercase name with dashes. Copy the shape of `figures/social-feed.js`:

```js
// <name>: what it shows and what moves. When to use it.
CF.add('<name>', {
  label: 'a short description',
  aliases: ['other', 'names', 'people', 'might', 'say'],
  box: [[x0, y0, z0], [x1, y1, z1]],          // the space the figure uses; it is fitted to the card
  make(K) {
    // build parts once, back to front: later parts draw on top
    const base = K.plate(K.rr(0, 0, 100, 60, 8), 1.4);        // a rounded plate, lying flat
    const dot = K.dot(3, 'accent');
    return (t, p) => {                       // runs every 1/120 s: t = seconds, p = pointer [u, v] or null
      base.at(0, 4).lit(base.hit(p));        // bottom and top height; outline goes dark under the pointer
      dot.at(50, 30, 4 + 2 * K.pulse(t, 1.5) * K.amt);
    };
  },
});
```

### The kit (`K`)
| Part | Make | Update every tick |
|---|---|---|
| Plate (the solid hairline look) | `K.plate(ring, bevel, parent, axis)` | `.at(h0, h1, du, dv)`, `.lit(on)`, `.fade(a)`, `.hide(h)`, `.hit(p)` |
| Flat outline on a plane | `K.face(ring, cls, parent, axis)` | `.at(h, du, dv)`, `.cls(c)`; set `.ring` to change its shape |
| Line through 3D points | `K.line(cls, parent)` | `.set(points, closed)`, `.partial(points, share)` draws on |
| Dot on a flat plane | `K.dot(r, cls, parent)` | `.at(x, y, z, scale)` |
| Group (to fade parts together) | `K.g()` | `g.style.opacity` |

- **Rings:** `K.rr(u0, v0, u1, v1, radius)` rounded rectangle, `K.circle(cx, cy, r)`, `K.shape([[u, v], ...])` any outline.
- **Axis:** `'z'` lies flat (default), `'x'` stands up facing front-right (u runs left to right, v up; good for screens and phones), `'y'` stands up facing front-left. For a line on an upright face, build its points with `K.on(axis, u, v, h)`.
- **Classes:** `sil` outline, `hi` dark ink (active), `lo` light, `nf` no fill, `dash` dotted, `ink` filled ink, `soft` filled light, `pl` filled plate white, `accent` filled crimson. Tone (`ink`, `terra`, `crimson`) colours them from the plan.
- **Motion helpers:** `K.win(t, start, dur)` gives 0 to 1 progress, `K.ease(x)`, `K.out(x)`, `K.pulse(t, period, width)`, `K.follow(key, target, rate)` smooths a value, `K.near(p, x, y, z, r)` gives pointer closeness, `K.amt` is the plan's `intensity`.

### Rules
- Time comes only from `t`. Never use `Date`, `setTimeout` or random numbers: every frame must be exact, so the same plan always renders the same reel.
- Keep the camera (`az` 45, `k` 0.5). Every figure then sits in the same world as hairline's.
- Use thin lines and plate-white fills. Use one accent (`accent` or `hi`) for the thing that matters. No text inside figures: text lines are drawn as lines, and words go in the card's `title`, `text` and `label`.
- Read clearly at phone size. If a part is smaller than a fingertip in the check frame, make it bigger or drop it.

## 4. Check it, then keep it
1. Render check frames of the card at 3 or more moments of the beat (start, middle, end): `cook.py --plan <plan> <video> check.png --still a,b,c`.
2. Look at every frame. Is it readable? Does it say the idea without the title? Is the motion visible? Fix and render again.
3. Keep the file in the skill's `figures/` folder so later reels can use it. A figure made for one reel only can go in a `figures/` folder next to that reel's plan.
4. Tell the user in one line: "I drew a new figure, `<name>`, for <beat>."
