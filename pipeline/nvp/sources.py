"""Step 2: build the source pack: article texts plus each article's lead photo and outlet credit."""

from __future__ import annotations

import json
import re
import urllib.parse
from pathlib import Path

import feedparser
import requests
import trafilatura

UA = {"User-Agent": "Mozilla/5.0 (news-video-pipeline)"}


def google_news(query: str, n: int = 10) -> list[str]:
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": query, "hl": "el", "gl": "GR", "ceid": "GR:el"})
    return [e.link for e in feedparser.parse(url).entries[:n]]


def _og_image(html: str) -> str | None:
    m = re.search(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', html)
    return m.group(1) if m else None


def build(urls: list[str], query: str, run_dir: Path, max_articles: int = 10) -> dict:
    run_dir.mkdir(parents=True, exist_ok=True)
    photos = run_dir / "photos"
    photos.mkdir(exist_ok=True)
    seen, articles = set(), []
    for url in list(dict.fromkeys(urls + (google_news(query) if query else []))):
        if len(articles) >= max_articles:
            break
        try:
            r = requests.get(url, headers=UA, timeout=20)
            r.raise_for_status()
        except requests.RequestException:
            continue
        text = trafilatura.extract(r.text, include_comments=False) or ""
        if len(text) < 600 or text[:200] in seen:
            continue
        seen.add(text[:200])
        host = urllib.parse.urlparse(r.url).hostname or ""
        outlet = host.removeprefix("www.").upper()
        photo = None
        if img := _og_image(r.text):
            try:
                data = requests.get(urllib.parse.urljoin(r.url, img), headers=UA, timeout=20).content
                photo = f"photos/{len(articles):02d}.jpg"
                (run_dir / photo).write_bytes(data)
            except requests.RequestException:
                photo = None
        articles.append({"id": len(articles), "url": r.url, "outlet": outlet, "text": text[:12000], "photo": photo})
    pack = {"query": query, "articles": articles}
    (run_dir / "sources.json").write_text(json.dumps(pack, ensure_ascii=False, indent=2))
    return pack
