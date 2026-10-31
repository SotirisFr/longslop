"""Step 1: find today's best story candidates from Greek news feeds."""

from __future__ import annotations

import time

import feedparser
from pydantic import BaseModel

from . import config
from .llm import ask_json


class Pitch(BaseModel):
    rank: int
    title_el: str
    pitch_el: str  # one line: why it works as a 12-minute explainer
    named_subject: str
    big_number: str
    search_query: str  # Greek query used to gather more coverage
    article_urls: list[str]
    score: int  # 0-100


class Pitches(BaseModel):
    pitches: list[Pitch]


SYSTEM = """You pick stories for a Greek faceless YouTube channel that explains scandals, frauds and crimes in 12-minute videos.
A good story has: a named person, company or brand; a big number (money, arrests, companies); an official step (arrest, raid, indictment, court);
a mechanism that can be explained in stages; and is under 72 hours old. Avoid stories that are only allegations by anonymous sources,
stories about minors, and ongoing tragedies with victims' families. Score 0-100."""


def fetch_headlines(max_age_hours: int = 72) -> list[dict]:
    cutoff = time.time() - max_age_hours * 3600
    items = []
    for url in config.FEEDS:
        feed = feedparser.parse(url)
        for e in feed.entries[:60]:
            ts = time.mktime(e.published_parsed) if getattr(e, "published_parsed", None) else time.time()
            if ts < cutoff:
                continue
            items.append({"title": e.get("title", ""), "summary": e.get("summary", "")[:300], "url": e.get("link", ""), "source": feed.feed.get("title", url)})
    return items


def scout(top: int = 3) -> Pitches:
    items = fetch_headlines()
    listing = "\n".join(f"- [{i['source']}] {i['title']} | {i['summary']} | {i['url']}" for i in items[:400])
    prompt = f"Here are the last 72 hours of Greek headlines. Group duplicates into stories and return the top {top} stories for the channel.\n\n{listing}"
    return ask_json(Pitches, SYSTEM, prompt, effort="low")
