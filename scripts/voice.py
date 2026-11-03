#!/usr/bin/env python3
"""Clean the speaker's voice: remove background noise with DeepFilterNet, then a light polish.

usage: python voice.py input.mp4 out.wav [--strength light|medium|strong] [--no-polish]
The cleaner is the standalone deep-filter binary from github.com/Rikorose/DeepFilterNet (MIT/Apache 2.0,
model built in, no Python packages). It downloads once into bin/ on first use (~36 MB).
The output has exactly the input's length, so lip-sync never moves. cook.py calls clean() when the plan asks.
"""
import os, pathlib, platform, shutil, stat, subprocess, sys, tempfile, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = '0.5.6'
ATTEN = {'light': 10, 'medium': 15, 'strong': 22}   # dB of noise reduction; lower keeps more room tone
# polish: cut rumble, ease boxiness, add presence, even out the level, soften harsh "s"
POLISH = ('highpass=f=80,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3200:t=q:w=1.0:g=2.5,'
          'acompressor=threshold=-20dB:ratio=3:attack=8:release=160:makeup=2,deesser=i=0.35')


def _asset():
    s, m = platform.system(), platform.machine().lower()
    if s == 'Darwin':
        return f'deep-filter-{VERSION}-' + ('aarch64-apple-darwin' if m in ('arm64', 'aarch64') else 'x86_64-apple-darwin')
    if s == 'Linux':
        return f'deep-filter-{VERSION}-' + ('aarch64-unknown-linux-gnu' if m in ('arm64', 'aarch64') else 'x86_64-unknown-linux-musl')
    if s == 'Windows':
        return f'deep-filter-{VERSION}-x86_64-pc-windows-msvc.exe'
    raise RuntimeError(f'no DeepFilterNet build for {s} {m}')


def binary():
    found = shutil.which('deep-filter')
    if found:
        return found
    b = ROOT / 'bin' / ('deep-filter.exe' if platform.system() == 'Windows' else 'deep-filter')
    if not b.exists():
        b.parent.mkdir(exist_ok=True)
        url = f'https://github.com/Rikorose/DeepFilterNet/releases/download/v{VERSION}/{_asset()}'
        print('Downloading the voice cleaner (DeepFilterNet, ~36 MB, once)...', flush=True)
        urllib.request.urlretrieve(url, b)
        b.chmod(b.stat().st_mode | stat.S_IEXEC)
    return str(b)


def _dur(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)], capture_output=True, text=True).stdout
    return float(out.strip())


def clean(video, out_wav, strength='medium', polish=True):
    """video -> cleaned 48 kHz mono wav of exactly the same length."""
    atten = ATTEN.get(str(strength), ATTEN['medium'])
    dur = _dur(video)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='voice_'))
    try:
        raw = tmp / 'voice.wav'
        # 3 dB of headroom first: phone mics often clip, and the model warns on full-scale input
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), '-vn', '-ac', '1', '-ar', '48000', '-af', 'volume=-3dB',
                        '-c:a', 'pcm_s16le', str(raw)], check=True)
        r = subprocess.run([binary(), '-D', '-a', str(atten), '-o', str(tmp / 'out'), str(raw)], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr[-800:])
        chain = (POLISH + ',' if polish else '') + f'apad,atrim=0:{dur:.3f}'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(tmp / 'out' / 'voice.wav'), '-af', chain, '-ar', '48000',
                        '-c:a', 'pcm_s16le', str(out_wav)], check=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return out_wav


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('out')
    ap.add_argument('--strength', default='medium', choices=list(ATTEN))
    ap.add_argument('--no-polish', action='store_true')
    a = ap.parse_args()
    clean(a.video, a.out, a.strength, not a.no_polish)
    print('DONE:', a.out)
