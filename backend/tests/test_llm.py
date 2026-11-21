import pytest

from backend.app import llm


@pytest.fixture(autouse=True)
def _clean():
    llm.fake_responses.clear()
    llm.usage.reset()
    yield
    llm.fake_responses.clear()


async def test_fake_provider_returns_registered():
    llm.fake_responses["screen"] = lambda user: {"items": []}
    assert await llm.complete_json("screen", "s", "u", {}) == {"items": []}


async def test_invalid_output_retries_then_raises():
    calls = []

    def bad(user):
        calls.append(user)
        return "not a dict"

    llm.fake_responses["judge"] = bad
    with pytest.raises(llm.LLMError):
        await llm.complete_json("judge", "s", "u", {})
    assert len(calls) == 2


async def test_exception_in_provider_becomes_llm_error():
    def boom(user):
        raise RuntimeError("down")

    llm.fake_responses["team"] = boom
    with pytest.raises(llm.LLMError):
        await llm.complete_json("team", "s", "u", {})


def test_usage_usd():
    llm.usage.add("claude-haiku-5-5", 1_000_000, 0)
    assert llm.usage.usd() == pytest.approx(0.10)
    llm.usage.add("claude-sonnet-5-5", 0, 1_000_000)
    assert llm.usage.usd() == pytest.approx(10.10)


def test_strict_schema_adds_required_and_no_extra():
    s = llm.strict_schema({"type": "object", "properties": {"a": {"type": "object", "properties": {"b": {"type": "string"}}}}})
    assert s["additionalProperties"] is False and s["required"] == ["a"]
    assert s["properties"]["a"]["additionalProperties"] is False


def test_strict_schema_nullable_becomes_anyof():
    s = llm.strict_schema({"type": "object", "properties": {
        "a": {"type": ["string", "null"], "description": "d"},
        "b": {"type": ["string", "null"], "enum": ["X", "Y", None]},
    }})
    assert s["properties"]["a"] == {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "d"}
    assert s["properties"]["b"] == {"anyOf": [{"type": "string", "enum": ["X", "Y"]}, {"type": "null"}]}
