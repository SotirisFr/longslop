"""JSON-shaped pipeline steps run through the Claude Code CLI (`claude -p`), so they use your Claude login, not an API key."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from typing import TypeVar

from pydantic import BaseModel

from . import config

MODEL = config.env("CLAUDE_MODEL", "opus")

T = TypeVar("T", bound=BaseModel)


def _strict(schema: dict) -> dict:
    """Close every object and require every property, so the output always matches the pydantic model."""
    if isinstance(schema, dict):
        if schema.get("type") == "object" and "properties" in schema:
            schema["additionalProperties"] = False
            schema["required"] = list(schema["properties"])
        for v in schema.values():
            _strict(v)
    elif isinstance(schema, list):
        for v in schema:
            _strict(v)
    return schema


def ask_json(model_cls: type[T], system: str, prompt: str, effort: str = "high", timeout: int = 1800) -> T:
    """One headless Claude run with no tools, validated into `model_cls`."""
    exe = shutil.which("claude")
    if not exe:
        raise SystemExit("The `claude` CLI is not installed or not on PATH. Install Claude Code and run `claude` once to sign in.")
    schema = json.dumps(_strict(model_cls.model_json_schema()), ensure_ascii=False)
    cmd = [
        exe, "-p",
        "--model", MODEL,
        "--effort", effort,
        "--system-prompt", system,
        "--json-schema", schema,
        "--output-format", "json",
        "--tools", "",
        "--no-session-persistence",
    ]
    # Run from an empty directory so no project CLAUDE.md or settings leak into the prompt.
    with tempfile.TemporaryDirectory() as cwd:
        proc = subprocess.run(cmd, input=prompt, capture_output=True, text=True, cwd=cwd, timeout=timeout)
    if proc.returncode != 0:
        raise RuntimeError(f"claude exited with {proc.returncode}: {proc.stderr.strip()[:2000]}")
    out = json.loads(proc.stdout)
    if out.get("is_error") or out.get("subtype") != "success":
        raise RuntimeError(f"claude run failed: {out.get('subtype')} {str(out.get('result'))[:2000]}")
    data = out.get("structured_output")
    if data is None:
        data = json.loads(out["result"])
    return model_cls.model_validate(data)
