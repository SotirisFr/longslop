"""Step 7: fetch one stock clip per footage beat (Magnific free stock, then Pexels, then Pixabay) and place press photos."""

from __future__ import annotations

import datetime as dt
import json
import shutil
from pathlib import Path

import requests

from . import config
from .beats import BeatPlan, VisualType


MAGNIFIC_API = "https://api.magnific.com/v1"
# Stock downloads are free on Premium/Premium+/Pro but capped at 100 a day; stay safely under it.
MAGNIFIC_DAILY_CAP = int(config.env("MAGNIFIC_DAILY_CAP", "90"))


def _magnific_ledger() -> tuple[Path, dict]:
    p = config.RUNS_DIR / "magnific_usage.json"
    data = json.loads(p.read_text()) if p.exists() else {}
    return p, data


def _magnific(query: str) -> str | None:
    """Stock video search + download ONLY. Never call Magnific AI or any endpoint that spends credits.

    Endpoint paths follow the Freepik/Magnific stock API; confirm them against docs.magnific.com on first run.
    Any limit, payment or credit response disables Magnific for the rest of the day and we fall back to Pexels.
    """
    key = config.env("MAGNIFIC_API_KEY")  # may instead be injected by a network-secret proxy
    if not key and not config.env("MAGNIFIC_VIA_PROXY"):
        return None
    ledger_path, ledger = _magnific_ledger()
    today = dt.date.today().isoformat()
    used = ledger.get(today, 0)
    if used >= MAGNIFIC_DAILY_CAP or ledger.get(f"{today}:stopped"):
        return None
    headers = {"Accept-Language": "en-US", **({"x-magnific-api-key": key, "x-freepik-api-key": key} if key else {})}
    r = requests.get(f"{MAGNIFIC_API}/videos", headers=headers, params={"term": query, "order": "relevance", "limit": 5}, timeout=30)
    if not r.ok:
        return None
    for item in r.json().get("data", []):
        # Skip anything that is not plain stock (AI-generated or premium-credit items).
        if item.get("is_ai_generated") or item.get("credits") or item.get("price"):
            continue
        d = requests.get(f"{MAGNIFIC_API}/videos/{item['id']}/download", headers=headers, timeout=60)
        if d.status_code in (402, 403, 429) or (not d.ok and "credit" in d.text.lower()[:500]):
            ledger[f"{today}:stopped"] = True
            ledger_path.write_text(json.dumps(ledger))
            return None
        if not d.ok:
            continue
        url = (d.json().get("data") or {}).get("url")
        if url:
            ledger[today] = used + 1
            ledger_path.write_text(json.dumps(ledger))
            return url
    return None


def _pexels(query: str) -> str | None:
    key = config.env("PEXELS_API_KEY")  # may instead be injected by a network-secret proxy
    if not key and not config.env("PEXELS_VIA_PROXY"):
        return None
    r = requests.get("https://api.pexels.com/videos/search", headers={"Authorization": key} if key else {},
                     params={"query": query, "orientation": "landscape", "per_page": 5}, timeout=30)
    if not r.ok:
        return None
    for v in r.json().get("videos", []):
        files = [f for f in v["video_files"] if (f.get("width") or 0) >= 1280 and f.get("file_type") == "video/mp4"]
        if files and v.get("duration", 0) >= 4:
            return min(files, key=lambda f: abs(f["width"] - 1920))["link"]
    return None


def _pixabay(query: str) -> str | None:
    key = config.env("PIXABAY_API_KEY")
    if not key:
        return None
    r = requests.get("https://pixabay.com/api/videos/", params={"key": key, "q": query, "per_page": 5}, timeout=30)
    if not r.ok:
        return None
    for hit in r.json().get("hits", []):
        v = hit["videos"].get("large") or hit["videos"].get("medium")
        if v and v.get("url"):
            return v["url"]
    return None


def fetch(beat_plan: BeatPlan, pack: dict, run_dir: Path, run_id: str) -> dict[int, dict]:
    """Returns sentence_index -> {src, kind, credit}; files land in video/public/runs/<run_id>/."""
    pub = config.VIDEO_DIR / "public" / "runs" / run_id
    pub.mkdir(parents=True, exist_ok=True)
    shutil.copy(run_dir / "voice.mp3", pub / "voice.mp3")
    articles = {a["id"]: a for a in pack["articles"]}
    assets, cache = {}, {}
    for b in beat_plan.beats:
        if b.visual_type == VisualType.pressPhoto and b.photo_id in articles and articles[b.photo_id].get("photo"):
            a = articles[b.photo_id]
            name = f"photo_{b.photo_id:02d}.jpg"
            shutil.copy(run_dir / a["photo"], pub / name)
            assets[b.sentence_index] = {"src": f"runs/{run_id}/{name}", "kind": "image", "credit": f"ΦΩΤΟ: {a['outlet']}"}
        elif b.visual_type == VisualType.footage and b.stock_query:
            if b.stock_query not in cache:
                url = _magnific(b.stock_query) or _pexels(b.stock_query) or _pixabay(b.stock_query)
                name = f"clip_{len(cache):03d}.mp4"
                if url:
                    with requests.get(url, stream=True, timeout=120) as r:
                        r.raise_for_status()
                        with open(pub / name, "wb") as f:
                            shutil.copyfileobj(r.raw, f)
                    cache[b.stock_query] = name
                else:
                    cache[b.stock_query] = None
            if cache[b.stock_query]:
                assets[b.sentence_index] = {"src": f"runs/{run_id}/{cache[b.stock_query]}", "kind": "video"}
    return assets
