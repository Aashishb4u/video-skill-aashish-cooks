#!/usr/bin/env bash
# One-time setup for aashish-cooks. Safe to run again: it prints READY when everything is in place.
# (Structure adapted from the MIT-licensed claude-video-effects skill by Vibha Ramprakash.)
set -e
cd "$(dirname "$0")/.."

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "NEED_FFMPEG: install ffmpeg first (Mac: brew install ffmpeg, Windows: winget install ffmpeg)"; exit 1
fi
if [ -x .venv/bin/python ] && [ -f .venv/.chromium_ok ] && .venv/bin/python -c "import playwright, cv2, PIL, numpy, mediapipe" 2>/dev/null; then echo READY; exit 0; fi

PY=""
for v in python3.12 python3.11 python3.13 python3.10 python3; do
  if command -v "$v" >/dev/null 2>&1 && "$v" -c 'import sys; sys.exit(0 if sys.version_info[:2] >= (3, 10) else 1)' 2>/dev/null; then PY="$v"; break; fi
done

if [ -n "$PY" ]; then
  [ -x .venv/bin/python ] || "$PY" -m venv .venv
  .venv/bin/python -m pip install -q --upgrade pip
  .venv/bin/python -m pip install -q -r requirements.txt
elif command -v uv >/dev/null 2>&1; then
  uv venv -q -p 3.12 .venv
  uv pip install -q -p .venv/bin/python -r requirements.txt
else
  echo "NEED_PYTHON: install Python 3.10 or newer (python.org/downloads), then run this again"; exit 1
fi

echo "Installing the headless browser that draws the cards (one time, about 150 MB)..."
.venv/bin/python -m playwright install chromium && touch .venv/.chromium_ok
.venv/bin/python -c "import playwright, cv2, PIL, numpy, mediapipe; print('READY')"
