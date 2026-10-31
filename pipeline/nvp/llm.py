"""Thin wrapper around the Claude API for JSON-shaped pipeline steps."""

from __future__ import annotations

import json
from typing import TypeVar

import anthropic
from pydantic import BaseModel

MODEL = "claude-opus-5-5"

T = TypeVar("T", bound=BaseModel)

_client: anthropic.Anthropic | None = None


def client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _strict(schema: dict) -> dict:
    """Structured outputs want every object closed and every property required."""
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


def ask_json(model_cls: type[T], system: str, prompt: str, effort: str = "high", max_tokens: int = 64000) -> T:
    """One request, validated into `model_cls`. Streams so long scripts never hit HTTP timeouts."""
    schema = _strict(model_cls.model_json_schema())
    with client().beta.messages.stream(
        model=MODEL,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
        output_config={"effort": effort, "format": {"type": "json_schema", "schema": schema}},
        # A safety-classifier decline is retried on a fallback model instead of failing the run.
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
    ) as stream:
        msg = stream.get_final_message()
    if msg.stop_reason == "refusal":
        raise RuntimeError(f"Claude declined this step: {msg.stop_details}")
    if msg.stop_reason == "max_tokens":
        raise RuntimeError("Output hit max_tokens; raise the limit or shorten the input")
    text = next(b.text for b in msg.content if b.type == "text")
    return model_cls.model_validate(json.loads(text))
