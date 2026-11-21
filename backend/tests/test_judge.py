import json
import re

import pytest

from backend.app import llm
from backend.app.pipeline.judge import judge
from backend.tests.helpers import profile, req, role


@pytest.fixture(autouse=True)
def _clean():
    llm.fake_responses.clear()
    yield
    llm.fake_responses.clear()


R = role([req("r1-q1", value="AWS")])


def _ok(u):
    ids = sorted(set(re.findall(r"NTT\d{7}", u)))
    return {"candidates": [{"employee_id": i, "coverage": [{"req_id": "r1-q1", "status": "met", "evidence": [{"path": "skills[1]"}]}],
                            "strengths": [], "gaps": [], "risks": []} for i in ids]}


async def test_judge_batches_of_ten():
    calls = []
    llm.fake_responses["judge"] = lambda u: calls.append(u) or _ok(u)
    out, failed = await judge(R, [profile(f"NTT{i:07d}") for i in range(25)], "en")
    assert len(calls) == 3 and failed == 0 and len(out) == 25


async def test_failed_batch_counted():
    def fn(u):
        if "NTT0000000" in u:
            raise RuntimeError("boom")
        return _ok(u)

    llm.fake_responses["judge"] = fn
    out, failed = await judge(R, [profile(f"NTT{i:07d}") for i in range(20)], "en")
    assert failed == 1 and len(out) == 10


async def test_judge_drops_candidates_not_in_batch():
    llm.fake_responses["judge"] = lambda u: {"candidates": _ok(u)["candidates"] + [{"employee_id": "NTT9999999", "coverage": [], "strengths": [], "gaps": [], "risks": []}]}
    out, _ = await judge(R, [profile("NTT0000001")], "en")
    assert [o["employee_id"] for o in out] == ["NTT0000001"]
