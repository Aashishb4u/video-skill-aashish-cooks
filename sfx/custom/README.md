# Your own sounds

Drop audio files here (mp3, wav, m4a, aiff, ogg, flac). Each one is ready at once under its file name:
`boing.mp3` becomes the sound `boing`. Ask Claude to use it, for example "put boing at 4.2s",
or put it in the plan as `{"fx": "sfx", "name": "boing", "at": 4.2}`.

Optional: a `custom.json` here sets volume and behaviour per sound:

```json
{
  "boing": {"gain": -4, "role": "funny-reveal", "meme": true}
}
```

- `gain`: dB added to the file (negative is quieter).
- `role`: when it plays. Leave it out for a plain sound you place by time.
- `meme`: `true` counts it towards the meme limit per reel (`sfx.meme_max`, default 4).

Tell Claude where a sound belongs and why, and it adds the rule to `sfx/sfx.json` so later reels use it too.
Use only sounds you have the right to use.
