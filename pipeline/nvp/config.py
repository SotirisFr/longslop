"""Settings come from the environment (or a .env file next to the repo root)."""

from __future__ import annotations

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VIDEO_DIR = ROOT / "video"
RUNS_DIR = ROOT / "runs"


def _load_dotenv() -> None:
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"'))


_load_dotenv()


def env(name: str, default: str | None = None, required: bool = False) -> str | None:
    v = os.environ.get(name, default)
    if required and not v:
        raise SystemExit(f"Missing {name}. Add it to .env (see .env.example).")
    return v


# Greek news RSS feeds the scout reads. Edit freely.
FEEDS = [
    "https://www.kathimerini.gr/feed/",
    "https://www.protothema.gr/rss/",
    "https://www.iefimerida.gr/rss.xml",
    "https://www.ertnews.gr/feed/",
    "https://www.in.gr/feed/",
    "https://news.google.com/rss?hl=el&gl=GR&ceid=GR:el",
]

ELEVENLABS_MODEL = env("ELEVENLABS_MODEL", "eleven_multilingual_v2")
TARGET_WORDS = int(env("TARGET_WORDS", "1500"))  # ≈ 12 minutes at the reference's ~125 wpm
