"""Step 6: assign one visual per sentence, then attach timings to make the Remotion plan."""

from __future__ import annotations

import json
from enum import Enum
from pathlib import Path

from pydantic import BaseModel

from . import config
from .llm import ask_json
from .script import Script


class VisualType(str, Enum):
    footage = "footage"
    pressPhoto = "pressPhoto"
    bigNumber = "bigNumber"
    statement = "statement"
    paperCard = "paperCard"
    bulletCards = "bulletCards"
    timeline = "timeline"
    barChart = "barChart"
    map = "map"
    people = "people"
    companySwap = "companySwap"
    icon = "icon"


class BeatSpec(BaseModel):
    sentence_index: int
    visual_type: VisualType
    params_json: str  # template parameters as a JSON object (see catalogue); "{}" for footage/pressPhoto
    stock_query: str  # English Pexels query for footage, else ""
    photo_id: int  # source article id whose photo to use for pressPhoto, else -1
    kicker: str  # small source line, e.g. "ΣΥΜΦΩΝΑ ΜΕ ΤΗΝ ΕΛ.ΑΣ.", or ""
    stamp: str  # 1-4 word stamp, or ""
    lower_third_title: str  # for footage/pressPhoto only, or ""
    lower_third_subtitle: str


class BeatPlan(BaseModel):
    beats: list[BeatSpec]


CATALOGUE = """Templates and their params_json (all text in Greek capitals unless noted):
- bigNumber: {"value": "59" | "100.000.000 €" | "500 – 700 €" | "2016", "caption": "..."}  for any striking number or date.
- statement: {"lines": [{"text": "...", "color": "white|yellow|red"}], "note": "small line", "red": true|false}  for a rhetorical question or punchline.
- paperCard: {"title": "...", "lines": [...]} or {"title": "...", "questions": [...]} or {"title": "...", "field": {"label": "ΔΙΑΧΕΙΡΙΣΤΗΣ:", "value": "..."}, "badge": "500 € / ΜΗΝΑ"}  for documents, contracts, checklists.
- bulletCards: {"items": ["...", "...", "..."]}  max 3 short items, e.g. the defence's claims.
- timeline: {"from": 2016, "to": 2026, "tag": {"label": "...", "year": 2021}, "chips": [{"label": "ΕΤ. Α", "year": 2016, "color": "grey|green|red"}]}
- barChart: {"labels": [...], "series": [{"name": "...", "color": "red|yellow|white", "values": [...]}]}  only with real figures from the sources.
- map: {"pins": [{"label": "ΕΛΛΑΔΑ", "lon": 21.4, "lat": 39.9}], "route": [0, 1], "tag": "..."}  places in or near Greece.
- people: {"people": [{"label": "...", "sublabel": "...", "unknown": true|false}]}  1-3 anonymous silhouettes for roles (front men, accountants, a mystery boss).
- companySwap: {"from": "ΕΤΑΙΡΕΙΑ Α", "to": "ΕΤΑΙΡΕΙΑ Β", "debts": 3, "label": "..."}  a business moving from one company to another.
- icon: {"icon": "shop|passport|scales|magnifier|phoneOff|document|person|border", "label": "...", "tag": "..."}
- footage: stock clip from stock_query (English, concrete and visual: "police car lights night", "hands counting euro banknotes", "aerial athens night").
- pressPhoto: the lead photo of source photo_id, shown full screen with a credit; use for the real people, places and arrests.
Section starts get a red chapter card automatically; do not plan those."""

SYSTEM = f"""You are the visual editor of a Greek explainer channel. Every sentence gets exactly one visual, and the visual illustrates that sentence literally.
Target mix: about 55% graphics templates and 45% footage or press photos; never more than two footage beats in a row; use a pressPhoto whenever a real
named person, place or arrest is first mentioned and a photo exists. Add a kicker whenever the sentence attributes a claim. Use stamps sparingly (1 in 8 beats)
for verdict-like words ("ΕΚΤΙΜΗΣΗ", "ΔΕΝ ΕΧΕΙ ΑΠΟΔΕΙΧΘΕΙ"). Lower thirds go on footage/pressPhoto beats that introduce a place, date or group.
Never put a real person's name on a silhouette or stamp that implies guilt.

{CATALOGUE}"""


def plan(script: Script, timings: list[dict], pack: dict) -> BeatPlan:
    photos = "\n".join(f"photo_id={a['id']} outlet={a['outlet']}" for a in pack["articles"] if a.get("photo")) or "(none)"
    sentences = "\n".join(f"{i}. [{script.sections[t['section']].heading}] {t['text']}" for i, t in enumerate(timings))
    return ask_json(BeatPlan, SYSTEM, f"Available press photos:\n{photos}\n\nSentences:\n{sentences}", effort="high")


def to_remotion(script: Script, timings: list[dict], beat_plan: BeatPlan, assets: dict[int, dict], run_id: str) -> dict:
    """Merge specs, timings and fetched assets into the VideoPlan the Remotion composition reads."""
    by_idx = {b.sentence_index: b for b in beat_plan.beats}
    beats, last_section = [], -1
    for i, t in enumerate(timings):
        if t["section"] != last_section:
            last_section = t["section"]
            # Chapter card in the 0.5 s section gap plus the first 1.5 s of the section.
            beats.append({"id": f"c{t['section']:02d}", "start": max(0.0, t["start"] - 0.5), "end": t["start"] + 1.5,
                          "visual": {"type": "chapter", "title": script.sections[t["section"]].heading}})
            if t["section"] == 0:
                beats.pop()  # the cold open starts straight on a visual
        spec = by_idx.get(i)
        start = max(t["start"], beats[-1]["end"]) if beats and beats[-1]["id"].startswith("c") else t["start"]
        beat: dict = {"id": f"b{i:03d}", "start": start, "end": t["end"], "text": t["text"]}
        a = assets.get(i)
        if spec is None or a is None and spec.visual_type in (VisualType.footage, VisualType.pressPhoto):
            beat["visual"] = {"type": "statement", "lines": [{"text": t["text"][:60]}]}
        elif spec.visual_type in (VisualType.footage, VisualType.pressPhoto):
            beat["visual"] = {"type": "footage", "src": a["src"], "kind": a["kind"]}
            if a.get("credit"):
                beat["credit"] = a["credit"]
        else:
            try:
                params = json.loads(spec.params_json or "{}")
            except json.JSONDecodeError:
                params = {}
            beat["visual"] = {"type": spec.visual_type.value, **params}
        if spec:
            if spec.kicker:
                beat["kicker"] = spec.kicker
            if spec.stamp:
                beat["stamp"] = {"text": spec.stamp, "color": "red", "at": 0.6}
            if spec.lower_third_title and beat["visual"]["type"] == "footage":
                beat["lowerThird"] = {"title": spec.lower_third_title, "subtitle": spec.lower_third_subtitle or None}
        beats.append(beat)
    public = config.VIDEO_DIR / "public"
    has = lambda f: f if (public / f).exists() else None  # noqa: E731 - music and SFX are optional drop-ins
    return {"title": script.title, "voice": f"runs/{run_id}/voice.mp3", "music": has("music/bed.mp3"), "musicVolume": 0.12,
            "sfx": {"chapter": has("sfx/whoosh.mp3"), "stamp": has("sfx/stamp.mp3")}, "beats": beats}


def save(plan_json: dict, run_dir: Path) -> Path:
    p = run_dir / "plan.json"
    p.write_text(json.dumps(plan_json, ensure_ascii=False, indent=2))
    return p
