#!/usr/bin/env python3
"""Quick look at a talking-head video before planning: length, where the head sits, and which layouts fit.

usage: python analyze.py input.mp4
Stage pixels are 720x1280 (the video fitted to 9:16).
- rise-card lives between y 115 and the top of the head (needs 220px or more).
- card-in (top layout) covers y 148-508; "layout": "below" puts it at y 790-1160.
- captions end at y 1088 (15% margin for Instagram's name/caption area); the chin should stay above ~1000.
"""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import track as TRACK


def main():
    import cv2
    src = sys.argv[1]
    cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0); cap.release()
    dur = n / fps if n else 0
    tr = TRACK.head_track(src, use_mask=True)
    tops = [v for v in tr['top'] if v is not None]; chins = [v for v in tr['chin'] if v is not None]
    print(f'duration: {dur:.2f}s  fps: {fps:.2f}')
    if not tops:
        print('no face found: check frames by eye before rendering'); return
    hi, low_chin = min(tops), max(chins)
    zone = hi - 24 - 115
    print(f'head top (hair): highest {hi:.0f}   chin: lowest {low_chin:.0f}')
    print(f'rise-card space above the head: {zone:.0f}px ' + ('-> OK' if zone >= 220 else '-> too small (needs 220): shoot with more empty space on top, or use card-in / boom-card'))
    print('card-in (top layout): ' + ('OK' if hi >= 500 else ('overlaps the hair only (fine, like the reference): check frames' if hi >= 400 else f'would cover the face (head top {hi:.0f}): use rise-card, "layout": "below", or boom-card')))
    print('"layout": "below": ' + ('OK' if low_chin <= 780 else f'card would cover the chin ({low_chin:.0f} > 780)'))
    print('captions: ' + ('clear of the face' if low_chin <= 1000 else f'chin reaches {low_chin:.0f}: captions will shrink there (keep the chin above ~1000)'))
    json.dump({'duration': dur, **tr}, open(pathlib.Path(src).with_suffix('.track.json'), 'w'))


if __name__ == '__main__':
    main()
