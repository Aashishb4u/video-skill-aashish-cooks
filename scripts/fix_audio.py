#!/usr/bin/env python3
"""Fix only the audio of a video. The picture is copied bit for bit: no effects, captions, cards or sounds.

usage: python fix_audio.py input.mp4 [output.mp4] [--strength light|medium|strong] [--no-polish]
Default output: <input>_audiofix.mp4 next to the input.

Steps: DeepFilterNet removes background noise (voice.py), the light polish evens the voice,
the result is levelled to -14 LUFS (sfx.mix, the same mix the full render uses), and the
video stream is copied unchanged (-c:v copy). The length never changes, so lip-sync stays exact.
"""
import argparse, pathlib, shutil, subprocess, sys, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import sfx as SFX, voice as VOICE


def has_audio(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a', '-show_entries', 'stream=index',
                          '-of', 'csv=p=0', str(path)], capture_output=True, text=True).stdout
    return bool(out.strip())


def vcodec(path):
    return subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name',
                           '-of', 'csv=p=0', str(path)], capture_output=True, text=True).stdout.strip()


def fix(video, out, strength='medium', polish=True):
    video, out = pathlib.Path(video), pathlib.Path(out)
    if not has_audio(video):
        raise SystemExit('NO_AUDIO: this video has no sound track to fix.')
    dur = VOICE._dur(video)
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='audiofix_'))
    try:
        print(f'Cleaning the voice ({strength})...', flush=True)
        voice = VOICE.clean(video, tmp / 'voice.wav', strength, polish)
        print('Levelling to -14 LUFS...', flush=True)
        audio = tmp / 'voice.m4a'
        SFX.mix(video, [], dur, audio, {}, has_voice=True, voice=voice)
        print('Putting the clean audio back (video copied unchanged)...', flush=True)
        tag = ['-tag:v', 'hvc1'] if vcodec(video) == 'hevc' else []   # Apple players need hvc1 for HEVC
        r = subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(video), '-i', str(audio),
                            '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'copy'] + tag +
                           ['-map_metadata', '0', '-movflags', '+faststart', '-shortest', str(out)],
                           capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr[-1500:])
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print('DONE:', out)
    return out


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('out', nargs='?')
    ap.add_argument('--strength', default='medium', choices=list(VOICE.ATTEN))
    ap.add_argument('--no-polish', action='store_true')
    a = ap.parse_args()
    v = pathlib.Path(a.video)
    fix(v, a.out or v.with_name(v.stem + '_audiofix.mp4'), a.strength, not a.no_polish)
