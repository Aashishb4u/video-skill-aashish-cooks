"""Where the speaker is: a head/chin track for card fitting and caption safety, and person cutouts for rise-card.

head_track(video)  -> {"fps": 10, "top": [...], "chin": [...]}  stage pixels (720x1280), per 0.1 s
person_masks(...)  -> {frame_index: file_uri}  soft alpha masks of the person, for frames where a rise-card shows
Uses the YuNet face model and the MediaPipe selfie segmenter in ../models (MIT / Apache 2.0).
"""
import pathlib, subprocess
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
TW, TH = 360, 640  # tracking resolution (half the 720x1280 stage)


def _segmenter(video_mode):
    try:
        import mediapipe as mp
        from mediapipe.tasks.python import vision
        from mediapipe.tasks.python.core.base_options import BaseOptions
    except Exception:
        return None, None
    mode = vision.RunningMode.VIDEO if video_mode else vision.RunningMode.IMAGE
    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=BaseOptions(model_asset_path=str(ROOT / 'models' / 'selfie_segmenter.tflite')),
        running_mode=mode, output_confidence_masks=True, output_category_mask=False))
    return seg, mp


def _guided(I, p, r=8, eps=2e-3):
    import cv2
    box = lambda x: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
    mI, mp_ = box(I), box(p); a = (box(I * p) - mI * mp_) / (box(I * I) - mI * mI + eps); b = mp_ - a * mI
    return np.clip(box(a) * I + box(b), 0, 1)


def _mask(seg, mp, rgb, ts=None):
    img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb))
    res = seg.segment_for_video(img, ts) if ts is not None else seg.segment(img)
    m = res.confidence_masks[-1].numpy_view().astype(np.float32)
    return m.reshape(m.shape[0], m.shape[1])


def head_track(video, fps=10, use_mask=True):
    import cv2
    vf = f'fps={fps},scale={TW}:{TH}:force_original_aspect_ratio=increase,crop={TW}:{TH}'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', str(video), '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    det = cv2.FaceDetectorYN.create(str(ROOT / 'models' / 'yunet.onnx'), '', (TW, TH), 0.6, 0.3, 20)
    seg, mp = _segmenter(False) if use_mask else (None, None)
    top, chin, cxs, cys, fws, n = [], [], [], [], [], TW * TH * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        fr = np.frombuffer(buf, np.uint8).reshape(TH, TW, 3)
        _, faces = det.detect(fr)
        t = c = fcx = fcy = fw = None
        if faces is not None and len(faces):
            f = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = [float(v) for v in f[:4]]
            c = (y + h) * 2
            fcx, fcy, fw = (x + w / 2) * 2, (y + h / 2) * 2, w * 2
            t = (y - 0.6 * h) * 2  # estimate of the hair line when there is no mask
            if seg is not None:
                m = _mask(seg, mp, cv2.cvtColor(fr, cv2.COLOR_BGR2RGB))
                x0, x1 = int(max(0, x - .3 * w)), int(min(TW, x + 1.3 * w))
                rows = np.where(m[:, x0:x1].mean(1) > .35)[0]
                if len(rows):
                    t = float(rows[0]) * 2
        top.append(t); chin.append(c); cxs.append(fcx); cys.append(fcy); fws.append(fw)
    p.wait()
    if seg is not None: seg.close()
    def fill(a):  # fill gaps with neighbours, then a short median to calm jitter
        a = list(a); last = None
        for i, v in enumerate(a):
            if v is None: a[i] = last
            else: last = v
        nxt = None
        for i in range(len(a) - 1, -1, -1):
            if a[i] is None: a[i] = nxt
            else: nxt = a[i]
        if not a or a[0] is None:
            return [None] * len(a)
        arr = np.array(a, float)
        out = [float(np.median(arr[max(0, i - 2):i + 3])) for i in range(len(arr))]
        return [round(v, 1) for v in out]
    return {'fps': fps, 'top': fill(top), 'chin': fill(chin), 'cx': fill(cxs), 'cy': fill(cys), 'fw': fill(fws)}


# screen effects that draw behind the speaker (they need the person cutout), and ones that freeze the frame
MASK_FX = {'noise', 'the-noise', 'lineup', 'the-lineup', 'orbit', 'backdrop-word', 'spotlight', 'glitter-spotlight', 'the-bill', 'bill',
           'shortcut-rain', 'rain', 'cover-star', 'cover', 'red-collage', 'pastel-word', 'check-pills', 'profile-wall', 'headline-wall',
           'carousel-spin', 'match-cut', 'apple-toggles', 'led-sign', 'slow-push'}
FREEZE_FX = {'pause-point', 'pause'}


def fx_window(e, default=3.0):
    s = float(e.get('start', e.get('at', 0)))
    return s, float(e.get('end', s + float(e.get('dur', default))))


def person_windows(plan, duration):
    """Rise-card windows plus every behind-the-speaker effect, padded."""
    out = rise_windows(plan, duration)
    for e in plan.get('effects', []):
        if e.get('fx') in MASK_FX:
            s, en = fx_window(e)
            out.append((s - .1, en + .8))
    return out


def rise_windows(plan, duration):
    """Times where a rise-card (or a boom that grew out of one) is on screen, padded for its entry and exit."""
    evs = sorted([e for e in plan.get('effects', []) if e.get('fx') in ('rise-card', 'rise-out', 'card-out', 'card-in')],
                 key=lambda e: float(e.get('at', e.get('start', 0))))
    out, start = [], None
    for e in evs:
        t = float(e.get('at', e.get('start', 0)))
        if e['fx'] == 'rise-card':
            start = t
        elif start is not None and e['fx'] in ('rise-out', 'card-out'):
            out.append((start - .05, t + .7)); start = None
    if start is not None:
        out.append((start - .05, duration))
    return out


def person_masks(frame_paths, times, windows, outdir, video_mode=True):
    """Soft person masks (PNG alpha) for the frames inside `windows`. frame_paths/times are in render order."""
    import cv2
    seg, mp = _segmenter(video_mode)
    if seg is None:
        return {}, 'MediaPipe is not installed, so rise-cards cannot go behind the person (run setup.sh)'
    outdir.mkdir(parents=True, exist_ok=True)
    res, prev, prev_i = {}, None, None
    for i, (fp, t) in enumerate(zip(frame_paths, times)):
        if not any(a <= t <= b for a, b in windows):
            continue
        bgr = cv2.imread(str(fp))
        small = cv2.resize(bgr, (540, 960), interpolation=cv2.INTER_AREA)
        rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
        m = _mask(seg, mp, rgb, int(round(t * 1000)) if video_mode else None)
        if m.shape != (960, 540):
            m = cv2.resize(m, (540, 960))
        m = _guided(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255, m)
        m = np.clip((m - .5) * 1.7 + .5, 0, 1)
        if video_mode and prev is not None and prev_i == i - 1:
            m = .65 * m + .35 * prev  # calm frame-to-frame flicker on hair edges
        prev, prev_i = m, i
        a = (cv2.GaussianBlur(m, (0, 0), 1.2) * 255).astype(np.uint8)
        rgba = np.dstack([np.full_like(a, 255)] * 3 + [a])
        p = outdir / f'm_{i:05d}.png'
        cv2.imwrite(str(p), rgba)
        res[i] = str(p)
    seg.close()
    return res, None
