"""Sound effects for aashish-cooks: turn the engine's cues and the plan's sfx effects into one mixed soundtrack.

The voice is never touched. Sounds sit under it, no two one-shots within 0.18 s, at most sfx.meme_max meme
sounds (default 4; the owner has permission for them, client reels included), risers placed so their peak lands on the cue, then the whole
mix is levelled to -14 LUFS (Instagram).
"""
import json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
BEDS = ('type', 'cook')        # sounds that run for a stretch (typing, AI cooking)
PRIORITY = {'move': 0, 'pop': 1, 'reveal': 1, 'shock': 1, 'funny-reveal': 1, 'meme': 1, 'curiosity': 1, 'wow': 2, 'money': 2,
            'notify': 2, 'done': 3, 'warn': 3, 'tick': 4}


def _dur(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)], capture_output=True, text=True).stdout
    try: return float(out.strip())
    except ValueError: return 0.0


def _peak(path):
    """Seconds into the file where it is loudest (for risers)."""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(path), '-af', 'asetnsamples=2205,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level',
                          '-f', 'null', '-'], capture_output=True, text=True).stderr
    lv = []
    for ln in out.splitlines():
        if 'RMS_level=' in ln:
            try: lv.append(float(ln.split('=')[1]))
            except ValueError: lv.append(-200)
    if not lv: return 0.0
    sr = 44100
    return lv.index(max(lv)) * 2205 / sr


def load_catalog(sfx_dir):
    p = sfx_dir / 'sfx.json'
    if not p.exists():
        return None
    cat = json.loads(p.read_text())
    for name, s in cat['sounds'].items():
        s['path'] = sfx_dir / s['file']
        s['ok'] = s['path'].exists()
        if s['ok']:
            s['len'] = _dur(s['path'])
            if s.get('peak') == 'auto': s['peak'] = _peak(s['path'])
    return cat


AUDIO_EXT = ('.mp3', '.wav', '.m4a', '.aiff', '.aif', '.ogg', '.flac')


def _prep(s, base):
    s['path'] = base / s['file']
    s['ok'] = s['path'].exists()
    if s['ok']:
        s['len'] = _dur(s['path'])
        if s.get('peak') == 'auto': s['peak'] = _peak(s['path'])
    return s


def load_all(sfx_dir, plan_sfx_dir=None):
    """Built-in catalog + the user's own sounds.
    - sfx/custom/: every audio file is ready under its file name (boing.mp3 -> "boing"), role "custom", gain 0.
      sfx/custom/custom.json may set per-sound fields: {"boing": {"gain": -4, "role": "funny-reveal", "meme": true}}.
    - <plan folder>/sfx/sfx.json: its sounds, auto rules and moments are added on top (same names replace).
    Nothing is removed from the built-in catalog."""
    cat = load_catalog(sfx_dir)
    if cat is None:
        return None
    custom = sfx_dir / 'custom'
    if custom.is_dir():
        extra = {}
        cj = custom / 'custom.json'
        if cj.exists():
            try:
                extra = json.loads(cj.read_text())
            except ValueError:
                print('SFX: sfx/custom/custom.json is not valid JSON; using defaults', flush=True)
        for f in sorted(custom.iterdir()):
            if f.suffix.lower() in AUDIO_EXT and not f.name.startswith('.'):
                s = {'file': f.name, 'role': 'custom', 'gain': 0}
                s.update(extra.get(f.stem, {}) if isinstance(extra.get(f.stem), dict) else {})
                s['file'] = f.name
                cat['sounds'][f.stem] = _prep(s, custom)
    if plan_sfx_dir and plan_sfx_dir.resolve() != sfx_dir.resolve() and (plan_sfx_dir / 'sfx.json').exists():
        try:
            more = json.loads((plan_sfx_dir / 'sfx.json').read_text())
        except ValueError:
            print(f'SFX: {plan_sfx_dir / "sfx.json"} is not valid JSON; ignored', flush=True)
            more = {}
        for name, s in (more.get('sounds') or {}).items():
            cat['sounds'][name] = _prep(dict(s), plan_sfx_dir)
        cat['auto'].update(more.get('auto') or {})
        if isinstance(more.get('moments'), dict) and isinstance(cat.get('moments'), dict):
            cat['moments'].update(more['moments'])
    return cat


def plan_sounds(cues, plan, cat, duration):
    """Cues from the engine + manual {"fx": "sfx"} effects -> a list of placed sounds, with warnings."""
    warn, out = [], []
    cfg = plan.get('sfx', {}) if isinstance(plan.get('sfx'), dict) else {}
    if plan.get('sfx') is False or cfg.get('on') is False:
        return [], warn
    auto, S = cat['auto'], cat['sounds']
    kind_map = {'in': 'card-in', 'rise': 'rise-card', 'out': 'card-out', 'boom': 'boom-card', 'back': 'boom-back', 'swap': 'card-swap'}
    # moves the plan silenced with "sfx": "none", or gave a specific sound
    over = {}
    for e in plan.get('effects', []):
        if e.get('fx') != 'sfx' and 'sfx' in e and 'at' in e:
            over[round(float(e['at']), 2)] = e['sfx']
    mute = set(cfg.get('mute', []))   # cue kinds to keep silent, e.g. ["money"] when a price is not about money
    if cfg.get('auto', True):
        for c in cues:
            k = kind_map.get(c['kind'], c['kind']); at = float(c['at'])
            if c['kind'] in mute or k in mute: continue
            ov = over.get(round(at, 2)) if c['kind'] in kind_map else None
            if ov == 'none': continue
            if ov:
                out.append({'name': ov, 'at': at, 'gain': 0}); continue
            rule = auto.get(k)
            if rule is None: continue
            if isinstance(rule, str):
                item = {'name': rule, 'at': at, 'gain': 0}
                if k in BEDS: item['dur'] = max(.5, min(float(c.get('dur') or 1.0), 6.0))
                out.append(item)
            else:
                for r in rule:
                    out.append({'name': r[0], 'at': at + r[1], 'gain': r[2] if len(r) > 2 else 0})
    for e in plan.get('effects', []):
        if e.get('fx') != 'sfx': continue
        name = e.get('name') or e.get('sound')
        if not name and e.get('role'):
            name = next((n for n, s in S.items() if s.get('role') == e['role']), None)
        if not name or name not in S:
            warn.append(f'sfx "{name}" is not in sfx/sfx.json'); continue
        out.append({'name': name, 'at': float(e.get('at', 0)), 'gain': float(e.get('gain', 0)), 'manual': True,
                    'dur': float(e['dur']) if 'dur' in e else None})
    # resolve, drop missing, place risers by their peak
    placed = []
    for o in out:
        s = S.get(o['name'])
        if not s or not s.get('ok'):
            warn.append(f'sound "{o["name"]}" missing in sfx/'); continue
        o['s'] = s
        if s.get('peak') and o.get('manual'):
            o['at'] -= float(s['peak'])
        placed.append(o)
    # a riser never runs into a shock or reveal: the reveal sound already carries that moment
    hits = [o for o in placed if o.get('manual') and o['s']['role'] in ('reveal', 'shock', 'funny-reveal')]
    for o in [o for o in placed if o['s']['role'] == 'curiosity']:
        end = o['at'] + float(o['s'].get('peak') or o['s'].get('len', 2))
        if any(o['at'] - .1 < h['at'] < end - .25 for h in hits):
            warn.append(f'riser "{o["name"]}" dropped: it would run into a reveal/shock sound'); placed.remove(o)
    memes = [o for o in placed if o['s'].get('meme') and o.get('manual')]   # effect hits (a stamp's punch) do not count
    cap = int(cfg.get('meme_max', 4))
    for o in memes[cap:]:
        warn.append(f'meme sound "{o["name"]}" at {o["at"]:.2f}s dropped: max {cap} per reel (sfx.meme_max)'); placed.remove(o)
    # spacing: one-shots at least 0.18 s apart (higher priority wins); beds never overlap each other
    placed.sort(key=lambda o: o['at'])
    keep, last_bed = [], None
    for o in placed:
        if o['s']['role'] in BEDS:
            if last_bed and last_bed['at'] + last_bed['dur'] > o['at']:
                last_bed['dur'] = max(.2, o['at'] - last_bed['at'])
            keep.append(o); last_bed = o; continue
        clash = [k for k in keep if k['s']['role'] not in BEDS and abs(k['at'] - o['at']) < .18]
        if clash:
            k = clash[0]
            if PRIORITY.get(o['s']['role'], 5) < PRIORITY.get(k['s']['role'], 5) or o.get('manual'):
                keep.remove(k); keep.append(o)
            continue
        keep.append(o)
    vol = float(cfg.get('volume', 0))
    for o in keep:
        o['gain'] = o['gain'] + float(o['s'].get('gain', 0)) + vol
        o['at'] = max(0.0, min(o['at'], duration - .05))
    return sorted(keep, key=lambda o: o['at']), warn


def mix(video, sounds, duration, out_audio, plan, has_voice=True, voice=None):
    """Voice (the video's audio, or a cleaned voice file) + placed sounds (+ optional music under the voice)
    -> out_audio (m4a), levelled to -14 LUFS."""
    cfg = plan.get('sfx', {}) if isinstance(plan.get('sfx'), dict) else {}
    ins, fl, labels = ['-i', str(voice or video)], [], []
    has_voice = has_voice or bool(voice)
    if has_voice:
        fl.append('[0:a]aresample=48000,aformat=channel_layouts=stereo[voice]')
    else:
        fl.append(f'anullsrc=r=48000:cl=stereo,atrim=0:{duration:.3f}[voice]')
    n = 1
    for i, o in enumerate(sounds):
        s = o['s']
        if s.get('loop') and o.get('dur'):
            ins += ['-stream_loop', '-1']
        ins += ['-i', str(s['path'])]
        length = o.get('dur') or min(float(s.get('max', 99)), s.get('len', 1.0))
        fade = min(.12, length / 3)
        ms = int(round(o['at'] * 1000))
        fl.append(f'[{n}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{length:.3f},asetpts=PTS-STARTPTS,'
                  f'afade=t=out:st={max(0, length - fade):.3f}:d={fade:.3f},volume={o["gain"]:.1f}dB,adelay={ms}|{ms}[s{i}]')
        labels.append(f'[s{i}]'); n += 1
    music = cfg.get('music')
    if music and pathlib.Path(music).exists():
        ins += ['-stream_loop', '-1', '-i', str(music)]
        fl.append(f'[{n}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{duration:.3f},volume={float(cfg.get("music_gain", -20)):.1f}dB[m0]')
        fl.append('[voice]asplit=2[voice][vkey]')
        fl.append('[m0][vkey]sidechaincompress=threshold=0.02:ratio=8:attack=15:release=350[music]')
        labels.append('[music]'); n += 1
    mix_in = '[voice]' + ''.join(labels)
    fl.append(f'{mix_in}amix=inputs={1 + len(labels)}:normalize=0:dropout_transition=0,atrim=0:{duration:.3f},'
              f'loudnorm=I=-14:TP=-1.5:LRA=11[out]')
    cmd = ['ffmpeg', '-y', '-v', 'error'] + ins + ['-filter_complex', ';'.join(fl), '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', str(out_audio)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr[-1500:])
