#!/usr/bin/env python3
"""Find when each word is said, so captions and card beats land on the right word.
(Adapted from the MIT-licensed claude-video-effects skill by Vibha Ramprakash.)

usage: python words.py input.mp4 [--lang hi|en]  -> prints "12.34  word" lines and saves input.words.json
Hinglish: Whisper may return Devanagari or translate. Fix the words by hand in the JSON (keep the times).
Uses faster-whisper (installed into the skill's .venv on first run). On a Mac with mlx-whisper installed, that is used instead.
"""
import json, os, subprocess, sys

src = sys.argv[1]
lang = sys.argv[sys.argv.index('--lang') + 1] if '--lang' in sys.argv else None
out = os.path.splitext(src)[0] + '.words.json'
words = []
try:
    import mlx_whisper
    r = mlx_whisper.transcribe(src, path_or_hf_repo='mlx-community/whisper-large-v3-turbo', word_timestamps=True, **({'language': lang} if lang else {}))
    words = [{'w': w['word'].strip(), 's': round(w['start'], 2), 'e': round(w['end'], 2)} for seg in r['segments'] for w in seg.get('words', [])]
except ImportError:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print('Installing the transcriber (one time, about 1 minute)...', flush=True)
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'faster-whisper'], check=True)
        from faster_whisper import WhisperModel
    model = WhisperModel(os.environ.get('WHISPER_MODEL', 'small'), device='cpu', compute_type='int8')
    segs, _ = model.transcribe(src, word_timestamps=True, vad_filter=True, language=lang)
    words = [{'w': w.word.strip(), 's': round(w.start, 2), 'e': round(w.end, 2)} for s in segs for w in (s.words or [])]

json.dump(words, open(out, 'w'), indent=0)
for w in words: print(f"{w['s']:7.2f}  {w['w']}")
print(f'\nSaved {len(words)} words to {out}')
