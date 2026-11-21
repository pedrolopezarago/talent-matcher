import pytest

from backend.app import llm
from backend.app.models import Candidate, Coverage, Evidence, Funnel, Grounding, Hidden, MatchResult, RoleResult
from backend.app.pipeline.team import build_team, explain, joint_coverage, swaps
from backend.tests.helpers import brief, req, role


def cand(eid, fit, met=()):
    cov = [Coverage(req_id=r, status="met", evidence=[Evidence(path="skills[0]", value="x")]) for r in met]
    return Candidate(employee_id=eid, name=f"N{eid}", current_role="", area="", seniority="", availability="En banca",
                     country="", city="", years_experience=1, fit=fit, similarity=0.5, coverage=cov, strengths=[],
                     gaps=[], risks=[], hidden=Hidden(different_area=False, vocab_bridges=[]))


def rr(rid, cands):
    return RoleResult(role_id=rid, availability_rule="", funnel=Funnel(total=1, after_filters=1, reviewed=1, ranked=1),
                      candidates=cands, reserve=[])


def m(*roles):
    return MatchResult(roles=list(roles), grounding=Grounding(claims=0, dropped=0))


B = brief([role([req("a-q1")], id="A", criticality=5), role([req("b-q1")], id="B", criticality=3)])
CLASSIC = m(rr("A", [cand("X", 90), cand("Y", 85)]), rr("B", [cand("X", 88), cand("Z", 40)]))


def test_optimal_beats_greedy_classic_case():
    opt, greedy, so, sg = build_team(B, CLASSIC)
    assert {s.role_id: s.employee_id for s in greedy} == {"A": "X", "B": "Z"}
    assert {s.role_id: s.employee_id for s in opt} == {"A": "Y", "B": "X"}
    assert so > sg


def test_no_person_twice():
    opt, greedy, _, _ = build_team(B, CLASSIC)
    for team in (opt, greedy):
        ids = [s.employee_id for s in team]
        assert len(ids) == len(set(ids))


def test_fewer_candidates_than_slots():
    b = brief([role([req("a-q1")], id="A", headcount=2)])
    opt, greedy, so, _ = build_team(b, m(rr("A", [cand("X", 80)])))
    assert len(opt) == 1 and len(greedy) == 1 and so == 40.0


def test_role_missing_from_match_is_skipped():
    opt, _, _, _ = build_team(B, m(rr("A", [cand("X", 80)])))
    assert [s.role_id for s in opt] == ["A"]


def test_joint_coverage():
    match = m(rr("A", [cand("Y", 85, met=["a-q1"])]), rr("B", [cand("X", 88)]))
    opt, _, _, _ = build_team(B, match)
    jc = {j.req_value: j.covered_by for j in joint_coverage(B, match, opt)}
    assert jc["Python"] == ["NY"]


async def test_explain_fallback():
    def boom(u):
        raise RuntimeError("down")

    llm.fake_responses["team"] = boom
    opt, greedy, so, sg = build_team(B, CLASSIC)
    text = await explain(opt, greedy, so, sg, swaps(opt, greedy), "en")
    assert str(so) in text and str(sg) in text
    llm.fake_responses.clear()


def test_team_route_validates():
    from fastapi.testclient import TestClient

    from backend.app.main import app

    llm.fake_responses["team"] = lambda u: {"explanation": "Because."}
    r = TestClient(app).post("/api/team", json={"brief": B.model_dump(), "match": CLASSIC.model_dump()})
    llm.fake_responses.clear()
    assert r.status_code == 200
    body = r.json()
    assert body["explanation"] == "Because." and body["swaps"] and body["optimal_score"] > body["greedy_score"]
