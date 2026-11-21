import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from backend.app.config import load_settings
from backend.app.models import Brief, MatchResult, ParseRequest, TeamResult

MOCKS = Path(__file__).resolve().parents[2] / "src" / "talent" / "mocks"


def _load(name):
    return json.loads((MOCKS / f"{name}.json").read_text())


def test_mocks_validate():
    Brief.model_validate(_load("brief"))
    MatchResult.model_validate(_load("match"))
    TeamResult.model_validate(_load("team"))


def test_parse_request_rejects_empty_text():
    with pytest.raises(ValidationError):
        ParseRequest(text="")


def test_settings_defaults(monkeypatch):
    for k in ("SCREEN_MAX_PER_ROLE", "JUDGE_TOP_N"):
        monkeypatch.delenv(k, raising=False)
    s = load_settings(dotenv=False)
    assert s.screen_max_per_role == 1000
    assert s.judge_top_n == 40
    assert s.llm_provider == "fake"
