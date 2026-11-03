# Your own mascot (optional)

No mascot is bundled. The skill works fully without one: Claude plans no mascot moments when this folder has no images.

To add your own character, put one image per state in this folder (or in `mascot/states/`). The file name is the state name:

```
mascot/thinking.svg
mascot/typing.gif
mascot/done.png
```

SVG, GIF, WebP and PNG all work. Animated SVG stays sharpest and is synced to the video frame by frame. Keep every file the same size and framing so the character does not jump between states.

States auto mode looks for, by moment:

| Moment | State names |
|---|---|
| Hello, the hook | `greeting` |
| Explaining something | `thinking` |
| Typing or writing (chat-install) | `typing`, `writing` |
| Running, installing, searching | `running-commands`, `searching-web` |
| A tick, a win | `done` |
| Something failed | `error` |
| A pause (card-out) | `asleep` |
| The call to action | `waiting-for-you`, `idle` |
| Walking along the progress bar | `walking` (with `mascot-walk`) |

Any other name works too if you ask for it: `{"fx": "mascot", "state": "wave", "start": 2, "end": 4}`. A state with no file is skipped and the render prints a warning.

Use only artwork you own or have the right to use.
