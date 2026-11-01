"""Command line for the pipeline. Two human gates: approve the script, then publish.

  python -m nvp scout                 # pitch today's top 3 stories
  python -m nvp make 1                # build pitch #1 up to the script gate
  python -m nvp make --url URL ...    # or start from your own article links
  python -m nvp approve RUN_ID        # after reading script.md: voice, visuals, render, private upload
  python -m nvp publish RUN_ID [N]    # switch to public, optionally with thumbnail N
  python -m nvp auto                  # scout + make the top pitch (for a daily cron)
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from pathlib import Path

from . import beats, config, footage, publish, render, script, scout, sources


def _run_dir(run_id: str) -> Path:
    return config.RUNS_DIR / run_id


def _state(run_id: str, **update) -> dict:
    p = _run_dir(run_id) / "state.json"
    s = json.loads(p.read_text()) if p.exists() else {}
    s.update(update)
    p.write_text(json.dumps(s, ensure_ascii=False, indent=2))
    return s


def cmd_scout(_: argparse.Namespace) -> None:
    pitches = scout.scout()
    config.RUNS_DIR.mkdir(exist_ok=True)
    (config.RUNS_DIR / "pitches.json").write_text(pitches.model_dump_json(indent=2))
    lines = [f"{p.rank}. {p.title_el} ({p.score}/100)\n   {p.pitch_el}" for p in pitches.pitches]
    publish.notify("Today's story pitches. Reply with: python -m nvp make <number>\n\n" + "\n".join(lines))


def cmd_make(a: argparse.Namespace) -> str:
    if a.sources:
        urls, query, title = [], "", a.slug or "story"
    elif a.url:
        urls, query, title = a.url, a.query or "", a.query or "story"
    else:
        p = json.loads((config.RUNS_DIR / "pitches.json").read_text())["pitches"][a.pitch - 1]
        urls, query, title = p["article_urls"], p["search_query"], p["named_subject"]
    slug = re.sub(r"[^\w]+", "-", title.lower()).strip("-")[:40]
    run_id = f"{dt.date.today():%Y%m%d}-{slug}"
    rd = _run_dir(run_id)
    if a.sources:
        # A hand-made source pack (same shape as sources.json), for when article sites can't be fetched.
        rd.mkdir(parents=True, exist_ok=True)
        pack = json.loads(Path(a.sources).read_text())
        (rd / "sources.json").write_text(json.dumps(pack, ensure_ascii=False, indent=2))
    else:
        pack = sources.build(urls, query, rd)
    brief = Path(a.brief).read_text() if a.brief else None
    s, check = script.write(pack, rd, title=a.title, brief=brief)
    flagged = sum(not c.supported for c in check.claims)
    _state(run_id, step="script_ready", flagged=flagged)
    publish.notify(
        f"Script ready: {s.title}\n{flagged} sentence(s) flagged by the fact-check.\n"
        f"Read runs/{run_id}/script.md, edit runs/{run_id}/script.json if needed, then: python -m nvp approve {run_id}",
        [rd / "script.md"],
    )
    return run_id


def cmd_approve(a: argparse.Namespace) -> None:
    run_id, rd = a.run_id, _run_dir(a.run_id)
    s = script.load(rd)
    pack = json.loads((rd / "sources.json").read_text())
    timings = voice_or_cached(s, rd)
    bp = beats.plan(s, timings, pack)
    (rd / "beats.json").write_text(bp.model_dump_json(indent=2))
    assets = footage.fetch(bp, pack, rd, run_id)
    plan_path = beats.save(beats.to_remotion(s, timings, bp, assets, run_id), rd)
    out = render.video(plan_path, rd / "video.mp4")
    thumbs = render.thumbnails(s, rd, run_id)
    vid = None
    if not a.no_upload:
        vid = publish.upload_private(out, thumbs[0] if thumbs else None, s)
    _state(run_id, step="uploaded_private" if vid else "rendered", video_id=vid)
    publish.notify(
        f"Rendered: {s.title}\n" + (f"Private on YouTube: https://youtu.be/{vid}\n" if vid else f"File: {out}\n")
        + f"Pick a thumbnail (0-{len(thumbs) - 1}) and run: python -m nvp publish {run_id} <n>",
        thumbs,
    )


def voice_or_cached(s: script.Script, rd: Path) -> list[dict]:
    from . import voice

    t = rd / "timings.json"
    return json.loads(t.read_text()) if t.exists() and (rd / "voice.mp3").exists() else voice.synthesize(s, rd)


def cmd_publish(a: argparse.Namespace) -> None:
    st = _state(a.run_id)
    if not st.get("video_id"):
        raise SystemExit("No uploaded video for this run yet.")
    if a.thumbnail is not None:
        from googleapiclient.http import MediaFileUpload

        publish._youtube().thumbnails().set(videoId=st["video_id"], media_body=MediaFileUpload(str(_run_dir(a.run_id) / f"thumbnail_{a.thumbnail}.jpg"))).execute()
    publish.make_public(st["video_id"])
    _state(a.run_id, step="public")
    publish.notify(f"Live: https://youtu.be/{st['video_id']}")


def cmd_auto(_: argparse.Namespace) -> None:
    cmd_scout(_)
    cmd_make(argparse.Namespace(url=None, query=None, pitch=1))


def main() -> None:
    ap = argparse.ArgumentParser(prog="nvp", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(required=True)
    sub.add_parser("scout").set_defaults(fn=cmd_scout)
    m = sub.add_parser("make")
    m.add_argument("pitch", type=int, nargs="?", default=1)
    m.add_argument("--url", action="append")
    m.add_argument("--query")
    m.add_argument("--title", help="fixed YouTube title")
    m.add_argument("--brief", help="file with a custom section structure for the script")
    m.add_argument("--sources", help="ready-made sources.json instead of fetching articles")
    m.add_argument("--slug", help="run name when using --sources")
    m.set_defaults(fn=cmd_make)
    ap_ = sub.add_parser("approve")
    ap_.add_argument("run_id")
    ap_.add_argument("--no-upload", action="store_true")
    ap_.set_defaults(fn=cmd_approve)
    p = sub.add_parser("publish")
    p.add_argument("run_id")
    p.add_argument("thumbnail", type=int, nargs="?")
    p.set_defaults(fn=cmd_publish)
    sub.add_parser("auto").set_defaults(fn=cmd_auto)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
