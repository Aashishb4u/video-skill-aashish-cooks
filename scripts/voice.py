#!/usr/bin/env python3
"""Clean the speaker's voice to a studio sound: WPE dereverb (echo/room out), DeepFilterNet (noise out),
then a warm, clear polish (mud cut, warmth, presence, air, compression, de-ess, tail expander) at a fixed -16 LUFS.

usage: python voice.py input.mp4 out.wav [--strength light|medium|strong] [--no-polish]
The cleaner is the standalone deep-filter binary from github.com/Rikorose/DeepFilterNet (MIT/Apache 2.0,
model built in, no Python packages). It downloads once into bin/ on first use (~36 MB).
The output has exactly the input's length, so lip-sync never moves. cook.py runs clean() on every render unless the plan says "voice": false.
"""
import os, pathlib, platform, shutil, stat, subprocess, sys, tempfile, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
VERSION = '0.5.6'
ATTEN = {'light': 10, 'medium': 15, 'strong': 22}   # dB of noise reduction; lower keeps more room tone
# polish ("studio", tuned on Aashish's 23 Nov reel): rumble and mud out, warmth, presence, air, even level,
# softer "s", then a gentle expander that hides leftover room tail between words. Gain is set statically after it:
# a dynamic loudnorm here would pump the quiet tails back up (the old chain left echo 26 dB under the voice, this one 39 dB).
POLISH = ('highpass=f=75:poles=2,equalizer=f=320:t=q:w=1.1:g=-3,lowshelf=f=140:g=1.8,'
          'equalizer=f=3300:t=q:w=1.1:g=2.2,highshelf=f=9500:g=2,'
          'acompressor=threshold=-21dB:ratio=3:attack=5:release=110:makeup=2:knee=4,deesser=i=0.4:m=0.5:f=0.5,'
          'agate=threshold=0.02:ratio=2.5:range=0.18:attack=2:release=120:knee=3,alimiter=limit=0.89:attack=3:release=60')
TARGET_LUFS = -16


def dereverb(wav_in, wav_out, taps=16):
    """WPE dereverberation (nara_wpe, MIT): removes the late room echo, keeps the direct voice. Same length."""
    try:
        from nara_wpe.wpe import wpe
        from nara_wpe.utils import stft, istft
    except ImportError:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'nara_wpe'], check=True)
        from nara_wpe.wpe import wpe
        from nara_wpe.utils import stft, istft
    import numpy as np, soundfile as sf
    x, sr = sf.read(str(wav_in), dtype='float64')
    if x.ndim > 1:
        x = x.mean(axis=1)
    Y = stft(x[None], size=1024, shift=256).transpose(2, 0, 1)
    Z = wpe(Y, taps=taps, delay=2, iterations=5, statistics_mode='full').transpose(1, 2, 0)
    y = istft(Z, size=1024, shift=256)[0][:len(x)]
    y = np.pad(y, (0, len(x) - len(y)))
    sf.write(str(wav_out), y / max(1e-9, np.abs(y).max()) * 0.5, sr)   # peak -6 dB: the polish thresholds are tuned to this level


def _gain_to(wav, lufs):
    """static gain to the target loudness (no dynamic levelling, so quiet tails stay quiet)."""
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', str(wav), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    i = float(r.split('Summary:', 1)[1].split('I:', 1)[1].split('LUFS')[0])
    return f'volume={lufs - i:.2f}dB,alimiter=limit=0.89:attack=3:release=60:level=disabled'



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


def clean(video, out_wav, strength='strong', polish=True, echo=True):
    """video -> cleaned 48 kHz mono wav of exactly the same length. echo=True runs the WPE dereverb first."""
    atten = ATTEN.get(str(strength), ATTEN['medium'])
    dur = _dur(video)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='voice_'))
    try:
        raw = tmp / 'voice.wav'
        # 3 dB of headroom first: phone mics often clip, and the model warns on full-scale input
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), '-vn', '-ac', '1', '-ar', '48000', '-af', 'volume=-3dB',
                        '-c:a', 'pcm_s16le', str(raw)], check=True)
        if echo:
            dereverb(raw, tmp / 'dry.wav')
            subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(tmp / 'dry.wav'), '-c:a', 'pcm_s16le', str(raw)], check=True)
        r = subprocess.run([binary(), '-D', '-a', str(atten), '-o', str(tmp / 'out'), str(raw)], capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr[-800:])
        chain = (POLISH + ',' if polish else '') + f'apad,atrim=0:{dur:.3f}'
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(tmp / 'out' / 'voice.wav'), '-af', chain, '-ar', '48000',
                        '-c:a', 'pcm_s16le', str(tmp / 'polished.wav')], check=True)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(tmp / 'polished.wav'), '-af', _gain_to(tmp / 'polished.wav', TARGET_LUFS),
                        '-ar', '48000', '-c:a', 'pcm_s16le', str(out_wav)], check=True)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return out_wav


if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('out')
    ap.add_argument('--strength', default='strong', choices=list(ATTEN))
    ap.add_argument('--no-polish', action='store_true')
    ap.add_argument('--keep-echo', action='store_true', help='skip the WPE dereverb')
    a = ap.parse_args()
    clean(a.video, a.out, a.strength, not a.no_polish, not a.keep_echo)
    print('DONE:', a.out)
