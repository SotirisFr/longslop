"""Steps 8 and 9: render the video and thumbnails with Remotion."""

from __future__ import annotations

import base64
import json
import shutil
import subprocess
from pathlib import Path

import requests

from . import config
from .script import Script


def _remotion(args: list[str]) -> None:
    cmd = ["npx", "remotion", *args]
    if chrome := config.env("REMOTION_CHROME"):
        cmd.append(f"--browser-executable={chrome}")
    subprocess.run(cmd, cwd=config.VIDEO_DIR, check=True)


def video(plan_path: Path, out: Path) -> Path:
    _remotion(["render", "NewsVideo", str(out), f"--props={plan_path}", "--crf=20"])
    return out


def _ai_image(prompt: str, dest: Path) -> bool:
    """AI background for the thumbnail via OpenAI's image API; returns False when no key is set."""
    key = config.env("OPENAI_API_KEY")
    if not key:
        return False
    r = requests.post(
        "https://api.openai.com/v1/images/generations",
        headers={"Authorization": f"Bearer {key}"},
        json={"model": config.env("IMAGE_MODEL", "gpt-image-1"), "size": "1536x1024", "n": 1,
              "prompt": prompt + ". Photorealistic, dramatic night lighting, cinematic. Subject on the right two thirds; the left third is dark empty space. No text, no logos, no letters."},
        timeout=300,
    )
    r.raise_for_status()
    dest.write_bytes(base64.b64decode(r.json()["data"][0]["b64_json"]))
    return True


def thumbnails(script: Script, run_dir: Path, run_id: str, variants: int = 3) -> list[Path]:
    pub = config.VIDEO_DIR / "public" / "runs" / run_id
    outs = []
    for i in range(variants):
        bg = pub / f"thumb_bg_{i}.png"
        if not _ai_image(script.thumbnail_scene, bg):
            photos = sorted((run_dir / "photos").glob("*.jpg"))
            if not photos:
                break
            shutil.copy(photos[min(i, len(photos) - 1)], bg)
        props = {"image": f"runs/{run_id}/{bg.name}", "line1": script.thumbnail_line1, "line2": script.thumbnail_line2}
        props_path = run_dir / f"thumb_{i}.json"
        props_path.write_text(json.dumps(props, ensure_ascii=False))
        out = run_dir / f"thumbnail_{i}.jpg"
        _remotion(["still", "Thumbnail", str(out), f"--props={props_path}", "--image-format=jpeg"])
        outs.append(out)
    return outs
