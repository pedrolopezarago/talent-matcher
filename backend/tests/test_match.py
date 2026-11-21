import re
from datetime import date

import pytest
from fastapi.testclient import TestClient

from backend.app import llm
from backend.app.models import MatchResult
from backend.tests.conftest import needs_db
from backend.tests.helpers import brief, req, role


def _screen(u):
    return {"items": [{"employee_id": i, "score": int(i[-2:]) % 10, "reason": "x"} for i in re.findall(r"NTT\d{7}", u)]}


def _judge(u):
    ids = sorted(set(re.findall(r'"employee_id": "(NTT\d{7})"', u)))
    req_ids = sorted(set(re.findall(r"(r\d+-q\d+)=", u)))
    return {"candidates": [{"employee_id": i,
                            "coverage": [{"req_id": rid, "status": "met", "evidence": [{"path": "skills[0]"}]} for rid in req_ids],
                            "strengths": [{"text": "Solid", "paths": ["skills[0]"]}], "gaps": [], "risks": []} for i in ids]}


@pytest.fixture(autouse=True)
def _fake():
    llm.fake_responses.clear()
    llm.fake_responses["screen"] = _screen
    llm.fake_responses["judge"] = _judge
    yield
    llm.fake_responses.clear()


BRIEF1 = brief([
    role([req("r1-q1", value="AWS", weight=3, synonyms=["EC2"]), req("r1-q2", value="Terraform"),
          req("r1-q3", type="sector", value="Banca y Finanzas", must=False)], id="r1", title="Cloud Architect", criticality=5),
    role([req("r2-q1", value="Java", weight=3), req("r2-q2", value="Kafka")], id="r2", title="Backend Developer Java", headcount=2),
], start_date="2027-01-20")


@needs_db
async def test_match_shape_and_funnel():
    from backend.app.pipeline.match import match

    res = await match(BRIEF1, "en", today=date(2026, 11, 21))
    MatchResult.model_validate(res.model_dump())
    assert res.retrieval == "keyword" and len(res.roles) == 2
    for rr in res.roles:
        f = rr.funnel
        assert f.total == 190000 and f.after_filters >= f.reviewed >= f.ranked > 0
        fits = [c.fit for c in rr.candidates]
        assert fits == sorted(fits, reverse=True)
        assert all(c.availability != "Asignado" for c in rr.candidates)
        assert 0 < len(rr.reserve) <= 5 and all(c.availability == "Asignado" for c in rr.reserve)
        assert "Roll-off" in rr.availability_rule
    java = {c.seniority for c in res.roles[1].candidates}
    assert java & {"Junior", "Mid"} and java & {"Senior", "Lead", "Principal"}  # both tiers reach judging
    roll = [c for rr in res.roles for c in rr.candidates if c.availability.startswith("Roll-off")]
    assert all(any("oll-off" in r for r in c.risks) for c in roll)
    assert res.grounding.claims > 0


@needs_db
async def test_zero_after_filters_no_llm():
    from backend.app.pipeline.match import match

    called = []
    llm.fake_responses["screen"] = lambda u: called.append(u) or _screen(u)
    llm.fake_responses["judge"] = lambda u: called.append(u) or _judge(u)
    b = brief([role([req("r1-q1", type="language", value="Español", level="Nativo")], min_years=60)])
    res = await match(b, "en", today=date(2026, 11, 21))
    rr = res.roles[0]
    assert rr.funnel.after_filters == 0 and rr.candidates == [] and rr.reserve == [] and called == []


@needs_db
def test_profile_endpoint():
    from backend.app.main import app

    c = TestClient(app)
    assert c.get("/api/profile/NOPE").status_code == 404
    body = c.get("/api/profile/NTT0000001").json()
    assert body["employee_id"] == "NTT0000001" and "embedding" not in body


@needs_db
def test_match_route():
    from backend.app.main import app

    r = TestClient(app).post("/api/match", json={"brief": BRIEF1.model_dump(), "lang": "es"})
    assert r.status_code == 200
    assert r.json()["retrieval"] == "keyword"


@needs_db
async def test_reserve_shown_even_when_nobody_available():
    from backend.app.pipeline.match import match

    b = brief([role([req("r1-q1", type="language", value="Gallego", level="Nativo")], min_years=30)])
    res = await match(b, "en", today=date(2026, 11, 21))
    rr = res.roles[0]
    assert rr.funnel.after_filters == 0 and rr.candidates == []
    assert 0 < len(rr.reserve) <= 5 and all(c.availability == "Asignado" for c in rr.reserve)


@needs_db
def test_match_route_502_when_llm_down():
    from backend.app.main import app

    def boom(u):
        raise RuntimeError("down")

    llm.fake_responses["screen"] = boom
    llm.fake_responses["judge"] = boom
    r = TestClient(app).post("/api/match", json={"brief": BRIEF1.model_dump()})
    assert r.status_code == 502
