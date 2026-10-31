"""Step 5: ElevenLabs voiceover with per-character timestamps, turned into per-sentence timings."""

from __future__ import annotations

import base64
import json
import subprocess
from pathlib import Path

import requests

from . import config
from .script import Script

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps"
GAP_SECONDS = 0.5  # silence between sections


def _pronounce(text: str) -> str:
    """Optional respellings for names TTS gets wrong, from pronunciations.json ({"Γιαννακόπουλος": "Γιαννακόπουλος"})."""
    p = config.ROOT / "pronunciations.json"
    if p.exists():
        for k, v in json.loads(p.read_text()).items():
            text = text.replace(k, v)
    return text


def synthesize(script: Script, run_dir: Path) -> list[dict]:
    """Returns one {section, index, text, start, end} per sentence, in seconds on the final voice track."""
    key = config.env("ELEVENLABS_API_KEY", required=True)
    voice = config.env("ELEVENLABS_VOICE_ID", required=True)
    parts, timings, offset = [], [], 0.0
    for si, sec in enumerate(script.sections):
        spoken = [_pronounce(s) for s in sec.sentences]
        text = " ".join(spoken)
        r = requests.post(
            API.format(voice=voice),
            headers={"xi-api-key": key},
            json={
                "text": text,
                "model_id": config.ELEVENLABS_MODEL,
                "language_code": "el",
                "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.15, "speed": 1.0},
            },
            timeout=300,
        )
        r.raise_for_status()
        data = r.json()
        mp3 = run_dir / f"voice_{si:02d}.mp3"
        mp3.write_bytes(base64.b64decode(data["audio_base64"]))
        al = data["alignment"]
        starts, ends = al["character_start_times_seconds"], al["character_end_times_seconds"]
        pos = 0
        for s_orig, s in zip(sec.sentences, spoken):
            a, b = pos, min(pos + len(s), len(starts)) - 1
            timings.append({"section": si, "text": s_orig, "start": offset + starts[a], "end": offset + ends[b]})
            pos += len(s) + 1
        dur = ends[-1]
        parts.append((mp3, dur))
        offset += dur + GAP_SECONDS
    # Concatenate sections with short gaps into one track.
    inputs, filt = [], []
    for i, (mp3, _) in enumerate(parts):
        inputs += ["-i", str(mp3)]
        filt.append(f"[{i}:a]apad=pad_dur={GAP_SECONDS}[a{i}]")
    filt.append("".join(f"[a{i}]" for i in range(len(parts))) + f"concat=n={len(parts)}:v=0:a=1[out]")
    out = run_dir / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]", "-b:a", "192k", str(out)], check=True)
    (run_dir / "timings.json").write_text(json.dumps(timings, ensure_ascii=False, indent=2))
    return timings
