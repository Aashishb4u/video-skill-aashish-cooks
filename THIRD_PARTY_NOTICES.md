# Credits and third-party notices

Aashish Cooks is built by Aashish Bhagwat, with Claude (Anthropic). It stands on the work of the people and projects below. Thank you all.

Each part keeps its own licence. The skill's own code is MIT (see `LICENSE`).

## Code and design

| Part | Author | Licence | Where |
|---|---|---|---|
| claude-video-effects: the 45 screen effects were rebuilt from it in the cooks style; parts of `scripts/setup.sh` and `scripts/words.py` are adapted from it | Vibha Ramprakash | MIT | https://github.com/Vibha-Ramprakash/claude-video-effects |
| hairline: the 33 animated line figures (`engine/hairline.js`), and the projection and plate math adapted in `engine/cooks-figures.js` for our own figures in `figures/` | Lucas Marques | MIT, see `engine/LICENSE-hairline.txt` | https://www.npmjs.com/package/@lucasmarkes/hairline |
| Lucide icons (`engine/lucide.js`) | Lucide contributors | ISC, see `engine/LICENSE-lucide.txt` | https://lucide.dev |

## Models

| Part | Author | Licence | Where |
|---|---|---|---|
| YuNet face detector (`models/yunet.onnx`) | OpenCV Zoo | MIT | https://github.com/opencv/opencv_zoo |
| Selfie Segmenter (`models/selfie_segmenter.tflite`) | Google, MediaPipe | Apache 2.0, see `models/NOTICE.md` | https://ai.google.dev/edge/mediapipe |
| DeepFilterNet voice cleaner (downloaded into `bin/` on first use, not bundled) | Hendrik Schröter (Rikorose) | MIT / Apache 2.0 | https://github.com/Rikorose/DeepFilterNet |

## Fonts (SIL Open Font License 1.1, see `fonts/OFL-*.txt`)

| Font | Copyright |
|---|---|
| Newsreader | The Newsreader Project Authors (Production Type) |
| DM Sans | The DM Sans Project Authors |
| DM Mono | The DM Mono Project Authors |
| Kalam | Indian Type Foundry |
| Caveat | The Caveat Project Authors |
| Caveat Brush | Google Inc. |
| Instrument Serif | The Instrument Serif Project Authors |
| Tiro Devanagari Marathi | The Indigo Project Authors (Tiro Typeworks) |
| Mukta | Girish Dalvi, Ek Type |
| Archivo Black | The Archivo Black Project Authors (Omnibus-Type) |

## Software the skill installs and runs

Installed by `scripts/setup.sh`, not bundled: Playwright and Chromium (Apache 2.0 / BSD), OpenCV (Apache 2.0), NumPy (BSD), Pillow (MIT-CMU), faster-whisper (MIT), MediaPipe (Apache 2.0). ffmpeg (LGPL/GPL) is used from your system.

## Sounds

The sound effects in `sfx/`, including the meme sounds, are included with the permission obtained by Aashish Bhagwat. They are not covered by the MIT licence. Sounds you add in `sfx/custom/` are yours: use only sounds you have the right to use.

## Not included

- No mascot artwork is bundled. Add your own in `mascot/` (see `mascot/README.md`).
- No brand logos are bundled. Add your own in a `logos/` folder next to your plan.
