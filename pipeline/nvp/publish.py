"""Step 10: upload as private to YouTube, and notify the owner at each gate."""

from __future__ import annotations

from pathlib import Path

import requests

from . import config
from .script import Script

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]


def notify(text: str, files: list[Path] | None = None) -> None:
    """Telegram if configured, otherwise print. Keeps the human gates on your phone."""
    token, chat = config.env("TELEGRAM_BOT_TOKEN"), config.env("TELEGRAM_CHAT_ID")
    if not (token and chat):
        print(text)
        return
    requests.post(f"https://api.telegram.org/bot{token}/sendMessage", data={"chat_id": chat, "text": text}, timeout=30)
    for f in files or []:
        with open(f, "rb") as fh:
            requests.post(f"https://api.telegram.org/bot{token}/sendDocument", data={"chat_id": chat}, files={"document": fh}, timeout=120)


def _youtube():
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build

    token = config.ROOT / "youtube_token.json"
    creds = Credentials.from_authorized_user_file(str(token), SCOPES) if token.exists() else None
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            secrets = config.env("YOUTUBE_CLIENT_SECRETS", str(config.ROOT / "client_secret.json"))
            creds = InstalledAppFlow.from_client_secrets_file(secrets, SCOPES).run_local_server(port=0)
        token.write_text(creds.to_json())
    return build("youtube", "v3", credentials=creds)


def upload_private(video: Path, thumbnail: Path | None, script: Script) -> str:
    from googleapiclient.http import MediaFileUpload

    yt = _youtube()
    body = {
        "snippet": {"title": script.title[:100], "description": script.description, "defaultLanguage": "el",
                    "defaultAudioLanguage": "el", "categoryId": "25"},  # News & Politics
        "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": False, "containsSyntheticMedia": True},
    }
    req = yt.videos().insert(part="snippet,status", body=body, media_body=MediaFileUpload(str(video), chunksize=-1, resumable=True))
    resp = None
    while resp is None:
        _, resp = req.next_chunk()
    vid = resp["id"]
    if thumbnail:
        yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(thumbnail))).execute()
    return vid


def make_public(video_id: str) -> None:
    _youtube().videos().update(part="status", body={"id": video_id, "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False, "containsSyntheticMedia": True}}).execute()
