# News video pipeline

Automated Greek scandal-explainer videos in the style of the reference channel: fast cuts (a new visual every ~3.6 s),
about 55% code-rendered motion graphics and 45% stock footage and press photos, an ElevenLabs voice and a quiet music bed.

Your involvement per video: approve the fact-checked script, then pick a thumbnail and publish.

## How it runs

```
scout ─▶ you pick ─▶ sources ─▶ script + fact-check ─▶ YOU APPROVE ─▶ voice ─▶ beat plan ─▶ footage ─▶ render ─▶ thumbnails ─▶ private upload ─▶ YOU PUBLISH
```

| Step | Module | Service |
| --- | --- | --- |
| Story pitches from Greek RSS | `pipeline/nvp/scout.py` | Claude |
| Articles, lead photos, outlet credits | `pipeline/nvp/sources.py` | Google News RSS, trafilatura |
| Script (~1,500 words) and fact-check against sources | `pipeline/nvp/script.py` | Claude |
| Voice with per-character timestamps | `pipeline/nvp/voice.py` | ElevenLabs |
| One visual per sentence | `pipeline/nvp/beats.py` | Claude |
| Stock clips and press photos | `pipeline/nvp/footage.py` | Magnific (free stock downloads only, capped per day), Pexels, Pixabay |
| Video and thumbnails | `pipeline/nvp/render.py` + `video/` | Remotion, OpenAI images (optional) |
| Private upload, publish, phone notifications | `pipeline/nvp/publish.py` | YouTube Data API, Telegram |

## Setup

1. Node 20+, Python 3.11+, ffmpeg.
2. `cd video && npm install`
3. `pip install -r pipeline/requirements.txt`
4. `cp .env.example .env` and fill in the keys.
5. YouTube: in Google Cloud Console enable "YouTube Data API v3", create an OAuth client of type Desktop app, save it as `client_secret.json`. The first upload opens a browser to sign in once.
6. Optional: drop a dark ambient loop at `video/public/music/bed.mp3`, and `sfx/whoosh.mp3` / `sfx/stamp.mp3`. They are used when present.
7. Optional: `pronunciations.json` with respellings for names the voice gets wrong.

## Use

```
cd pipeline
python -m nvp scout                  # top 3 pitches (to Telegram if configured)
python -m nvp make 1                 # sources + script + fact-check, then stops
# read runs/<run>/script.md, edit runs/<run>/script.json if needed
python -m nvp approve <run>          # voice, visuals, render, thumbnails, private upload
python -m nvp publish <run> 1        # thumbnail 1, go public
```

For a daily run, schedule `python -m nvp auto` (scout + make the top pitch) with cron or a GitHub Action.

## Graphics

`video/src/templates/index.tsx` holds the template library: ChapterCard, BigNumber, Statement, PaperCard, BulletCards, Timeline,
BarChart, MapScene (Greece and neighbours), People, CompanySwap, PhotoFrame, Footage, SubjectCard, IconScene, plus the
Kicker, Stamp, LowerThird and Credit overlays. `npx remotion studio` in `video/` previews `src/data/demo-plan.json`.

## Rules baked into the prompts

Only facts from the sources, every allegation attributed, presumption of innocence stated, no guilt implied on silhouettes or stamps.
The upload sets YouTube's altered-or-synthetic-content flag. Press photos carry the outlet credit; check you are comfortable with that use.
