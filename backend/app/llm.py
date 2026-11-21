"""Provider-agnostic LLM access. The only file that knows about LLM providers.

complete_json(task, system, user, schema) -> dict
  task picks the model (LLM_MODEL_<TASK>); provider picks the SDK (LLM_PROVIDER):
  - anthropic:      Anthropic SDK, structured outputs (output_config.format)
  - openai_compat:  any OpenAI-compatible endpoint (OpenRouter, Azure OpenAI), response_format json_schema
  - fake:           canned responses registered in `fake_responses` (tests, zero cost)
"""
import asyncio
import copy
import json
import logging
import threading
from typing import Any, Callable, Literal

from backend.app.config import settings

log = logging.getLogger(__name__)

Task = Literal["extract", "screen", "judge", "team"]

# USD per million tokens (input, output). Source: Anthropic pricing table, Nov 2026.
PRICES = {
    "claude-haiku-5-5": (0.10, 0.50),
    "claude-sonnet-5-5": (2.00, 10.00),
    "claude-opus-5-5": (4.00, 20.00),
}
# Effort per task (Anthropic only): screening is a cheap pass, judging needs care.
EFFORT = {"extract": "medium", "screen": "low", "judge": "medium", "team": "low"}

fake_responses: dict[str, Callable[[str], Any]] = {}


class LLMError(Exception):
    pass


class BudgetExceeded(LLMError):
    """MAX_USD_PER_REQUEST reached; the call was not made."""


class UsageTally:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self.calls = 0
            self.input_tokens = 0
            self.output_tokens = 0
            self._usd = 0.0

    def add(self, model: str, input_tokens: int, output_tokens: int) -> None:
        pin, pout = PRICES.get(model, (0.0, 0.0))
        with self._lock:
            self.calls += 1
            self.input_tokens += input_tokens
            self.output_tokens += output_tokens
            self._usd += input_tokens / 1e6 * pin + output_tokens / 1e6 * pout

    def usd(self) -> float:
        return self._usd


usage = UsageTally()

_semaphore: asyncio.Semaphore | None = None
_clients: dict[str, Any] = {}


def _sem() -> asyncio.Semaphore:
    global _semaphore
    if _semaphore is None:
        _semaphore = asyncio.Semaphore(settings.max_llm_concurrency)
    return _semaphore


def strict_schema(schema: dict) -> dict:
    """Every object gets additionalProperties=false and all its properties required
    (what structured outputs expect). Nullable type arrays (["string","null"]) become the documented
    anyOf form."""
    s = copy.deepcopy(schema)

    def walk(node):
        if isinstance(node, dict):
            t = node.get("type")
            if isinstance(t, list) and "null" in t:
                base = [x for x in t if x != "null"][0]
                inner = {"type": base}
                if "enum" in node:
                    inner["enum"] = [v for v in node.pop("enum") if v is not None]
                node.pop("type")
                node["anyOf"] = [inner, {"type": "null"}]
            if node.get("type") == "object" and "properties" in node:
                node["additionalProperties"] = False
                node["required"] = list(node["properties"].keys())
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(s)
    return s


def _model(task: Task) -> str:
    return getattr(settings, f"llm_model_{task}")


async def _call_anthropic(task: Task, system: str, user: str, schema: dict, max_tokens: int) -> Any:
    from anthropic import AsyncAnthropic

    client = _clients.get("anthropic")
    if client is None:
        client = _clients["anthropic"] = AsyncAnthropic(api_key=settings.llm_api_key or None)
    model = _model(task)
    extra = {}
    # Screening is a simple scoring pass: no reasoning needed. Haiku 5.5 accepts disabled thinking at effort <= high
    # (Sonnet/Opus 5.5 reject it, so it is only sent to Haiku).
    if task == "screen" and model.startswith("claude-haiku"):
        extra["thinking"] = {"type": "disabled"}
    resp = await client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": user}],
        output_config={"effort": EFFORT[task], "format": {"type": "json_schema", "schema": strict_schema(schema)}},
        **extra,
    )
    u = resp.usage
    usage.add(model, (u.input_tokens or 0) + (u.cache_read_input_tokens or 0) + (u.cache_creation_input_tokens or 0),
              u.output_tokens or 0)
    if resp.stop_reason in ("refusal", "max_tokens"):
        raise LLMError(f"stop_reason={resp.stop_reason}")
    text = next((b.text for b in resp.content if b.type == "text"), None)
    if text is None:
        raise LLMError("no text block")
    return json.loads(text)


async def _call_openai_compat(task: Task, system: str, user: str, schema: dict, max_tokens: int) -> Any:
    from openai import AsyncOpenAI

    client = _clients.get("openai")
    if client is None:
        client = _clients["openai"] = AsyncOpenAI(base_url=settings.llm_base_url or None, api_key=settings.llm_api_key)
    model = _model(task)
    resp = await client.chat.completions.create(
        model=model,
        max_tokens=max_tokens,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        response_format={"type": "json_schema", "json_schema": {"name": task, "schema": strict_schema(schema), "strict": True}},
    )
    if resp.usage:
        usage.add(model, resp.usage.prompt_tokens or 0, resp.usage.completion_tokens or 0)
    return json.loads(resp.choices[0].message.content or "")


async def _call_fake(task: Task, system: str, user: str, schema: dict, max_tokens: int) -> Any:
    fn = fake_responses.get(task)
    if fn is None:
        raise LLMError(f"no fake response registered for task {task!r}")
    out = fn(user)
    if asyncio.iscoroutine(out):
        out = await out
    return out


_PROVIDERS = {"anthropic": _call_anthropic, "openai_compat": _call_openai_compat, "fake": _call_fake}


async def complete_json(task: Task, system: str, user: str, schema: dict, max_tokens: int = 4096,
                        budgeted: bool = False) -> dict:
    """One structured-output call. Retries once on any failure, then raises LLMError.
    budgeted=True: refuse (BudgetExceeded) if the request has already spent MAX_USD_PER_REQUEST. The check
    runs after the concurrency slot is acquired, i.e. when the call would really start."""
    provider = _PROVIDERS.get(settings.llm_provider)
    if provider is None:
        raise LLMError(f"unknown LLM_PROVIDER {settings.llm_provider!r}")
    last: Exception | None = None
    for _ in range(2):
        try:
            async with _sem():
                if budgeted and usage.usd() > settings.max_usd_per_request:
                    raise BudgetExceeded(f"cost cap ${settings.max_usd_per_request} reached")
                out = await provider(task, system, user, schema, max_tokens)
            if isinstance(out, dict):
                return out
            last = LLMError(f"output is {type(out).__name__}, not an object")
        except BudgetExceeded:
            raise
        except Exception as e:  # noqa: BLE001 — any provider failure is retried once, then surfaced
            last = e
        log.warning("llm %s attempt failed: %s", task, last)
    raise LLMError(str(last)) from last
