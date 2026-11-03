#!/usr/bin/env python3
"""Render an aashish-cooks plan onto a talking-head video.

usage:
  python cook.py --plan plan.json input.mp4 output.mp4             full render (keeps the original audio)
  python cook.py --plan plan.json input.mp4 check.png --still 3.5,9  check frames -> check_3.5.png, check_9.png
options:
  --width 1080   output width (1080 = 1080x1920, 2160 = 4K, slower)
  --fps 30       output frame rate (default: the video's, capped at 30)
  --workers 4    browser pages rendering in parallel
  --words FILE   word timings (default: <input>.words.json next to the video)
  --no-sfx       leave the sound as it is (no sound effects)
  --clean-voice [light|medium|strong]   remove background noise (DeepFilterNet) and polish the voice
                 (same as "voice": {"clean": true} in the plan; ask the user first)

The cards, captions and mascot are HTML pages in ../engine, rendered frame by frame in headless Chromium.
"""
import argparse, asyncio, base64, json, os, pathlib, shutil, subprocess, sys, tempfile, time
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import track as TRACK, sfx as SFX, voice as VOICE
os.environ.setdefault('GLOG_minloglevel', '2'); os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL', '3')

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG_EXT = ('.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif')


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"command failed: {' '.join(map(str, cmd[:6]))} ...\n{r.stderr[-1500:]}")
    return r.stdout


def probe(path):
    info = json.loads(run(['ffprobe', '-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', str(path)]))
    v = next(s for s in info['streams'] if s['codec_type'] == 'video')
    num, den = (v.get('avg_frame_rate') or v['r_frame_rate']).split('/')
    fps = float(num) / float(den) if float(den) else 30.0
    dur = float(info['format'].get('duration') or v.get('duration') or 0)
    has_audio = any(s['codec_type'] == 'audio' for s in info['streams'])
    return int(v['width']), int(v['height']), fps, dur, has_audio


def resolve_files(obj, base):
    """Turn image paths inside the plan (logos, icons, thumbnails) into file:// URLs; an "images" folder becomes its files."""
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k == 'images' and isinstance(v, str) and '|' not in v:
                d = pathlib.Path(os.path.expanduser(v)); d = d if d.is_absolute() else base / d
                if d.is_dir():
                    files = sorted(p for p in d.iterdir() if p.suffix.lower() in IMG_EXT and not p.name.startswith('.'))
                    out[k] = '|'.join(p.resolve().as_uri() for p in files); continue
            out[k] = resolve_files(v, base)
        return out
    if isinstance(obj, list):
        return [resolve_files(v, base) for v in obj]
    if isinstance(obj, str) and obj.lower().endswith(IMG_EXT) and '|' not in obj:
        p = pathlib.Path(os.path.expanduser(obj))
        if not p.is_absolute():
            p = base / p
        if p.exists():
            return p.resolve().as_uri()
    if isinstance(obj, str) and '|' in obj and any(s.strip().lower().endswith(IMG_EXT) for s in obj.split('|')):
        return '|'.join(resolve_files(s.strip(), base) for s in obj.split('|'))
    return obj


def mascot_assets(plan, plan_dir, tmp):
    states = {e.get('state', 'idle') for e in plan.get('effects', []) if e.get('fx') in ('mascot', 'mascot-walk')}
    out = {}
    if not states:
        return out
    roots = [plan_dir / 'mascot', ROOT / 'mascot']
    exts = ('.svg', '.gif', '.webp', '.png')  # SVG first: crisp and frame-exact
    for st in states:
        f = None
        for d in [r / sub for r in roots for sub in ('', 'states')]:
            for ext in exts:
                if (d / (st + ext)).exists():
                    f = d / (st + ext); break
            if f: break
        if not f:  # scattered packs: search any subfolder, shallowest match wins
            hits = [p for r in roots if r.exists() for ext in exts for p in r.rglob(st + ext)]
            f = min(hits, key=lambda p: (len(p.parts), exts.index(p.suffix))) if hits else None
        if not f:
            continue
        if f.suffix == '.svg':
            out[st] = {'type': 'svg', 'text': f.read_text(encoding='utf-8', errors='ignore')}
        elif f.suffix in ('.gif', '.webp'):
            from PIL import Image, ImageSequence
            im = Image.open(f)
            frames, durs = [], []
            md = tmp / 'mascot'; md.mkdir(exist_ok=True)
            for i, fr in enumerate(ImageSequence.Iterator(im)):
                p = md / f'{st}_{i:03d}.png'
                fr.convert('RGBA').save(p)
                frames.append(p.as_uri()); durs.append(max(20, fr.info.get('duration', 100) or 100))
            out[st] = {'type': 'frames', 'frames': frames, 'durs': durs}
        else:
            out[st] = {'type': 'img', 'url': f.resolve().as_uri()}
    return out


def extract_frames(video, outdir, W, H, fps, times=None):
    vf = f'scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}'
    if times is not None:
        paths = []
        for i, t in enumerate(times):
            p = outdir / f's_{i:03d}.jpg'
            run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.3f}', '-i', str(video), '-frames:v', '1', '-vf', vf, '-q:v', '2', str(p)])
            paths.append(p)
        return paths
    run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), '-vf', f'fps={fps},{vf}', '-q:v', '2', str(outdir / 'f_%05d.jpg')])
    return sorted(outdir.glob('f_*.jpg'))


async def render(data, jobs, scale, workers):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=['--allow-file-access-from-files', '--disable-web-security'])
        pages, warnings, cues = [], None, None
        for _ in range(max(1, min(workers, len(jobs)))):
            pg = await browser.new_page(viewport={'width': 720, 'height': 1280}, device_scale_factor=scale)
            await pg.goto((ROOT / 'engine' / 'index.html').as_uri())
            w = await pg.evaluate('d => COOK.load(d)', data)
            if warnings is None:
                warnings = w; cues = await pg.evaluate('COOK.cues')
            pages.append(pg)
        for w in warnings or []:
            print('WARNING:', w, flush=True)
        done, total, t0 = [0], len(jobs), time.time()

        async def work(pg, chunk):
            for t, src, mask, out in chunk:
                if mask:  # CSS masks must be same-origin: inline them as data URLs
                    mask = 'data:image/png;base64,' + base64.b64encode(pathlib.Path(mask).read_bytes()).decode()
                await pg.evaluate('a => COOK.frame(a[0], a[1], a[2])', [t, src, mask])
                await pg.screenshot(path=str(out), type='jpeg', quality=93)
                done[0] += 1
                if done[0] % 90 == 0 or done[0] == total:
                    el = time.time() - t0
                    print(f'  rendered {done[0]}/{total} frames ({el:.0f}s, ~{el / done[0] * (total - done[0]):.0f}s left)', flush=True)

        n = len(pages)
        await asyncio.gather(*[work(pages[k], jobs[k::n]) for k in range(n)])
        await browser.close()
        return warnings, cues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--plan', required=True)
    ap.add_argument('video')
    ap.add_argument('out')
    ap.add_argument('--still', help='comma-separated seconds: render check frames instead of a video')
    ap.add_argument('--width', type=int, default=1080)
    ap.add_argument('--fps', type=float)
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--words')
    ap.add_argument('--no-sfx', action='store_true')
    ap.add_argument('--clean-voice', nargs='?', const='medium', choices=['light', 'medium', 'strong'])
    a = ap.parse_args()

    video = pathlib.Path(a.video).expanduser().resolve()
    plan_path = pathlib.Path(a.plan).expanduser().resolve()
    plan = json.loads(plan_path.read_text())
    _, _, src_fps, dur, has_audio = probe(video)
    fps = a.fps or min(30.0, round(src_fps, 3))
    W = a.width - a.width % 2
    H = int(round(W * 16 / 9)) // 2 * 2

    words_path = pathlib.Path(a.words).expanduser() if a.words else None
    if not words_path:
        cfg = plan.get('captions') or {}
        if isinstance(cfg, dict) and cfg.get('words'):
            words_path = (plan_path.parent / cfg['words']).resolve()
        else:
            words_path = video.with_suffix('.words.json')
    words = json.loads(words_path.read_text()) if words_path and words_path.exists() else []
    words = [{'w': w.get('w') or w.get('word', ''), 's': float(w.get('s', w.get('start', 0))), 'e': float(w.get('e', w.get('end', 0)))} for w in words]

    tmp = pathlib.Path(tempfile.mkdtemp(prefix='cook_'))
    try:
        windows = TRACK.person_windows(plan, dur)
        print('Tracking the speaker...', flush=True)
        track = TRACK.head_track(video, use_mask=True)
        # freeze-frame effects: grab the frame at their start
        freeze = {}
        for k, e in enumerate(e for e in plan.get('effects', []) if e.get('fx') in TRACK.FREEZE_FX):
            s0, _ = TRACK.fx_window(e)
            fd = tmp / f'freeze{k}'; fd.mkdir()
            freeze[f"{round(s0, 2):g}"] = extract_frames(video, fd, W, H, fps, [s0])[0].as_uri()
        data = {'plan': resolve_files(plan, plan_path.parent), 'duration': dur, 'words': words, 'track': track, 'hasMasks': bool(windows),
                'assets': {'mascot': mascot_assets(plan, plan_path.parent, tmp), 'freeze': freeze}}
        scale = W / 720
        out = pathlib.Path(a.out).expanduser().resolve()
        if a.still:
            times = [float(x) for x in a.still.split(',') if x.strip()]
            srcs = extract_frames(video, tmp, W, H, fps, times)
            masks, mw = TRACK.person_masks(srcs, times, windows, tmp / 'masks', video_mode=False) if windows else ({}, None)
            if mw: print('WARNING:', mw)
            jobs = [(t, s.as_uri(), masks.get(i), out.with_name(f'{out.stem}_{t:g}.jpg')) for i, (t, s) in enumerate(zip(times, srcs))]
            asyncio.run(render(data, jobs, scale, a.workers))
            for _, _, _, o in jobs:
                print('check frame:', o)
            return
        print(f'Extracting frames ({W}x{H} @ {fps:g} fps)...', flush=True)
        srcs = extract_frames(video, tmp, W, H, fps)
        od = tmp / 'out'; od.mkdir()
        times = [i / fps for i in range(len(srcs))]
        masks = {}
        if windows:
            print('Cutting out the speaker for rise-cards...', flush=True)
            masks, mw = TRACK.person_masks(srcs, times, windows, tmp / 'masks')
            if mw: print('WARNING:', mw)
        jobs = [(times[i], s.as_uri(), masks.get(i), od / f'o_{i:05d}.jpg') for i, s in enumerate(srcs)]
        print(f'Rendering {len(jobs)} frames...', flush=True)
        _, cues = asyncio.run(render(data, jobs, scale, a.workers))
        audio, voice = None, None
        vcfg = plan.get('voice') if isinstance(plan.get('voice'), dict) else ({'clean': True} if plan.get('voice') is True else {})
        if has_audio and (a.clean_voice or vcfg.get('clean')):
            print('Cleaning the voice (background noise out, light polish)...', flush=True)
            voice = VOICE.clean(video, tmp / 'voice.wav', a.clean_voice or vcfg.get('strength', 'medium'), vcfg.get('polish', True))
        cat = None if a.no_sfx else SFX.load_all(ROOT / 'sfx', plan_path.parent / 'sfx')
        if cat:
            sounds, sw = SFX.plan_sounds(cues or [], plan, cat, dur)
            for w in sw: print('SFX:', w)
            if sounds:
                print(f'Mixing {len(sounds)} sound effects...', flush=True)
                for o in sounds: print(f'  {o["at"]:6.2f}s  {o["name"]}' + (f' ({o["dur"]:.1f}s)' if o.get('dur') else ''))
                audio = tmp / 'mix.m4a'
                SFX.mix(video, sounds, dur, audio, plan, has_voice=has_audio, voice=voice)
        if voice and not audio:  # clean voice, no sound effects: level it on its own
            audio = tmp / 'mix.m4a'
            SFX.mix(video, [], dur, audio, plan, has_voice=True, voice=voice)
        print('Encoding...', flush=True)
        cmd = ['ffmpeg', '-y', '-v', 'error', '-framerate', f'{fps:g}', '-i', str(od / 'o_%05d.jpg')]
        if audio:
            cmd += ['-i', str(audio), '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'copy', '-shortest']
        elif has_audio:
            cmd += ['-i', str(video), '-map', '0:v:0', '-map', '1:a:0', '-c:a', 'aac', '-b:a', '192k', '-shortest']
        cmd += ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out)]
        run(cmd)
        print('DONE:', out)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
