import json
import re

import pytest

from backend.app import llm
from backend.app.pipeline.screen import screen
from backend.tests.helpers import profile, req, role


@pytest.fixture(autouse=True)
def _clean():
    llm.fake_responses.clear()
    llm.usage.reset()
    yield
    llm.fake_responses.clear()


def _ids_in(user):
    return re.findall(r"NTT\d{7}", user)


PROFILES = [profile(f"NTT{i:07d}") for i in range(120)]
R = role([req("q1", value="AWS")])


async def test_screen_top_n():
    llm.fake_responses["screen"] = lambda u: {"items": [{"employee_id": i, "score": int(i[3:]) % 11, "reason": "x"} for i in _ids_in(u)]}
    ids, failed = await screen(R, PROFILES, top_n=40)
    assert failed == 0 and len(ids) == 40 and len(set(ids)) == 40
    assert all(int(i[3:]) % 11 >= 7 for i in ids[:10])


async def test_screen_ignores_unknown_ids():
    llm.fake_responses["screen"] = lambda u: {"items": [{"employee_id": "NTT9999999", "score": 10, "reason": "x"}]
                                             + [{"employee_id": i, "score": 1, "reason": "x"} for i in _ids_in(u)]}
    ids, _ = await screen(R, PROFILES[:10], top_n=5)
    assert "NTT9999999" not in ids and len(ids) == 5


async def test_screen_failed_batch_counted():
    def fn(u):
        ids = _ids_in(u)
        if "NTT0000000" in ids:
            raise RuntimeError("boom")
        return {"items": [{"employee_id": i, "score": 5, "reason": "x"} for i in ids]}

    llm.fake_responses["screen"] = fn
    ids, failed = await screen(R, PROFILES, top_n=200)
    assert failed == 1
    assert "NTT0000000" not in ids and len(ids) == 70
