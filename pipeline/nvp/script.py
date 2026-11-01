"""Step 3: write the Greek narration, then fact-check it against the source pack."""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import BaseModel

from . import config
from .llm import ask_json


class Section(BaseModel):
    heading: str  # becomes a red chapter card, 1-3 words, e.g. "Η ΠΑΓΙΔΑ"
    sentences: list[str]


class Script(BaseModel):
    title: str  # YouTube title
    thumbnail_line1: str  # 1-2 words
    thumbnail_line2: str  # 1-3 words, on the red bar
    thumbnail_scene: str  # English prompt for the AI thumbnail image
    description: str  # hook question + 2-sentence summary with official figures + 5 hashtags
    sections: list[Section]


class Claim(BaseModel):
    sentence: str
    supported: bool
    source_ids: list[int]
    problem: str  # empty when supported


class FactCheck(BaseModel):
    claims: list[Claim]


SYSTEM = f"""You write narration for a Greek faceless explainer channel about scandals and crimes, in natural spoken Greek.
Length: about {config.TARGET_WORDS} words. Short sentences (8-20 words); each sentence will get its own visual.
Structure, as sections:
1. Cold open: a "Πώς γίνεται..." question, the most striking official fact, who is at the centre, and a promise of what we will explain.
2. Who: the person or company and how it grew.
3. The mechanism, in numbered stages ("Πρώτο στάδιο...", "Δεύτερο στάδιο...").
4. The investigation and the arrest, with official figures and dates.
5. The defence's position, stated fairly.
6. Presumption of innocence ("Μέχρι να αποφανθεί η δικαιοσύνη...") and the wider question.
7. Close: ask viewers for their opinion in the comments and to subscribe.
Rules: use ONLY facts from the sources. Attribute every allegation ("σύμφωνα με την ΕΛ.ΑΣ.", "κατά δημοσιεύματα", "σύμφωνα με πληροφορίες").
Never state guilt. Never invent names, numbers, dates or quotes. Every 60-90 seconds end a sentence on a small open question to keep viewers watching.
Section headings are 1-3 word dramatic labels in capitals."""

CHECK = """You are a strict fact-checker for a Greek news video. For each factual sentence in the script, say whether the numbered sources support it,
which source ids, and what is wrong if not (unsupported number, name, date, or an allegation stated as fact). Skip pure rhetoric and questions."""


def _sources_block(pack: dict) -> str:
    return "\n\n".join(f"<source id={a['id']} outlet={a['outlet']}>\n{a['text']}\n</source>" for a in pack["articles"])


def write(pack: dict, run_dir: Path, title: str | None = None, brief: str | None = None) -> tuple[Script, FactCheck]:
    """`brief` replaces the default crime-story structure (e.g. for a political series); `title` is kept verbatim."""
    src = _sources_block(pack)
    system = SYSTEM
    if brief:
        system = SYSTEM.split("Structure, as sections:")[0] + brief + "\nRules:" + SYSTEM.split("Rules:", 1)[1]
    ask = "Write the video script."
    if title:
        ask += f" The YouTube title is fixed: {title}"
    script = ask_json(Script, system, f"Sources:\n{src}\n\n{ask}", effort="high")
    if title:
        script.title = title
    flat = "\n".join(s for sec in script.sections for s in sec.sentences)
    check = ask_json(FactCheck, CHECK, f"Sources:\n{src}\n\nScript:\n{flat}", effort="high")
    (run_dir / "script.json").write_text(script.model_dump_json(indent=2))
    (run_dir / "factcheck.json").write_text(check.model_dump_json(indent=2))
    flagged = [c for c in check.claims if not c.supported]
    md = [f"# {script.title}\n"]
    for sec in script.sections:
        md.append(f"## {sec.heading}\n")
        md.extend(sec.sentences)
        md.append("")
    md.append("\n## Fact-check flags\n")
    md.extend(f"- **{c.sentence}**: {c.problem}" for c in flagged)
    if not flagged:
        md.append("None.")
    (run_dir / "script.md").write_text("\n".join(md))
    return script, check


def load(run_dir: Path) -> Script:
    return Script.model_validate(json.loads((run_dir / "script.json").read_text()))
