import pytest

from backend.app import llm
from backend.app.models import Candidate, Coverage, Evidence, Funnel, Grounding, Hidden, MatchResult, RoleResult
from backend.app.pipeline.team import build_team, explain, joint_coverage, swaps, training_plans, training_targets
from backend.tests.helpers import brief, req, role


def cand(eid, fit, seniority="Junior", met=(), partial=()):
    cov = [Coverage(req_id=r, status="met", evidence=[Evidence(path="skills[0]", value="x")]) for r in met]
    cov += [Coverage(req_id=r, status="partial", evidence=[Evidence(path="skills[0]", value="x")]) for r in partial]
    return Candidate(employee_id=eid, name=f"N{eid}", current_role="", area="", seniority=seniority, availability="En banca",
                     country="", city="", years_experience=1, fit=fit, similarity=0.5, coverage=cov, strengths=[],
                     gaps=[], risks=[], hidden=Hidden(different_area=False, vocab_bridges=[]))


def rr(rid, cands):
    return RoleResult(role_id=rid, availability_rule="", funnel=Funnel(total=1, after_filters=1, reviewed=1, ranked=1),
                      candidates=cands, reserve=[])


def m(*roles):
    return MatchResult(roles=list(roles), grounding=Grounding(claims=0, dropped=0))


B = brief([role([req("a-q1", value="AWS")], id="A", criticality=5),
           role([req("b-q1", value="Java"), req("b-q2", value="Kafka", must=False)], id="B", criticality=3, headcount=2)])
POOL = m(rr("A", [cand("E1", 90, "Senior"), cand("J1", 70, "Junior")]),
         rr("B", [cand("E2", 95, "Lead"), cand("M1", 80, "Mid"), cand("J2", 60, "Junior")]))


def experts(team):
    return [s for s in team if s.tier == "expert"]


def test_exactly_one_expert_per_team():
    opt, greedy, _, _ = build_team(B, POOL)
    for team in (opt, greedy):
        assert len(team) == 3 and len(experts(team)) == 1
        assert all(s.seniority in ("Junior", "Mid") for s in team if s.tier == "support")
        assert not any(s.off_tier for s in team)


def test_optimal_places_expert_where_it_adds_most():
    opt, greedy, so, sg = build_team(B, POOL)
    assert experts(opt)[0].role_id == "B" and experts(opt)[0].employee_id == "E2"
    assert experts(greedy)[0].role_id == "A" and experts(greedy)[0].employee_id == "E1"
    assert so > sg


def test_no_person_twice():
    opt, greedy, _, _ = build_team(B, POOL)
    for team in (opt, greedy):
        ids = [s.employee_id for s in team]
        assert len(ids) == len(set(ids))


def test_off_tier_fallback_when_no_junior():
    b = brief([role([req("a-q1")], id="A", headcount=2)])
    opt, greedy, _, _ = build_team(b, m(rr("A", [cand("E1", 90, "Senior"), cand("E2", 85, "Principal")])))
    for team in (opt, greedy):
        assert len(team) == 2 and len(experts(team)) == 1
        assert [s.off_tier for s in team if s.tier == "support"] == [True]


def test_fewer_candidates_than_slots():
    b = brief([role([req("a-q1")], id="A", headcount=2)])
    opt, greedy, so, _ = build_team(b, m(rr("A", [cand("X", 80, "Junior")])))
    assert len(opt) == 1 and len(greedy) == 1 and so == 40.0


def test_role_missing_from_match_is_skipped():
    opt, _, _, _ = build_team(B, m(rr("A", [cand("X", 80, "Senior")])))
    assert [s.role_id for s in opt] == ["A"]


def test_joint_coverage():
    match = m(rr("A", [cand("Y", 85, "Senior", met=["a-q1"])]), rr("B", [cand("X", 88, "Mid")]))
    opt, _, _, _ = build_team(B, match)
    jc = {j.req_value: j.covered_by for j in joint_coverage(B, match, opt)}
    assert jc["AWS"] == ["NY"] and jc["Java"] == []


def test_training_targets_only_members_with_unmet_musts():
    match = m(rr("A", [cand("E1", 95, "Senior", met=["a-q1"])]),
              rr("B", [cand("M1", 70, "Mid", partial=["b-q1"]), cand("J2", 50, "Junior")]))
    opt, _, _, _ = build_team(B, match)
    targets = {t[0].employee_id: [r.value for r in t[1]] for t in training_targets(B, match, opt)}
    assert "E1" not in targets
    assert targets == {"M1": ["Java"], "J2": ["Java"]}  # nice-to-have Kafka never triggers training


async def test_training_plans_from_llm_filtered_to_unmet():
    match = m(rr("A", [cand("E1", 95, "Senior", met=["a-q1"])]), rr("B", [cand("M1", 70, "Mid", partial=["b-q1"])]))
    opt, _, _, _ = build_team(B, match)
    llm.fake_responses["team"] = lambda u: {"plans": [
        {"employee_id": "M1", "recommendations": [
            {"requirement": "Java", "training": "Oracle Certified Professional: Java SE 17 Developer", "kind": "certification"},
            {"requirement": "AWS", "training": "should be dropped", "kind": "course"}]},
        {"employee_id": "E1", "recommendations": [{"requirement": "AWS", "training": "dropped", "kind": "course"}]}]}
    plans = await training_plans(B, match, opt, "en")
    llm.fake_responses.clear()
    assert [p.employee_id for p in plans] == ["M1"]
    assert [(r.requirement, r.kind) for r in plans[0].recommendations] == [("Java", "certification")]
    assert plans[0].gaps == ["Java"]


async def test_training_plans_fallback_when_llm_fails():
    def boom(u):
        raise RuntimeError("down")

    match = m(rr("A", [cand("E1", 95, "Senior", met=["a-q1"])]), rr("B", [cand("M1", 70, "Mid")]))
    opt, _, _, _ = build_team(B, match)
    llm.fake_responses["team"] = boom
    plans = await training_plans(B, match, opt, "es")
    llm.fake_responses.clear()
    assert len(plans) == 1 and plans[0].recommendations[0].requirement == "Java"
    assert "Java" in plans[0].recommendations[0].training


async def test_explain_fallback():
    def boom(u):
        raise RuntimeError("down")

    llm.fake_responses["team"] = boom
    opt, greedy, so, sg = build_team(B, POOL)
    text = await explain(opt, greedy, so, sg, swaps(opt, greedy), "en")
    assert str(so) in text and str(sg) in text
    llm.fake_responses.clear()


def test_team_route_validates():
    from fastapi.testclient import TestClient

    from backend.app.main import app

    llm.fake_responses["team"] = lambda u: {"explanation": "Because.", "plans": []}
    r = TestClient(app).post("/api/team", json={"brief": B.model_dump(), "match": POOL.model_dump()})
    llm.fake_responses.clear()
    assert r.status_code == 200
    body = r.json()
    assert body["explanation"] == "Because." and body["swaps"] and body["optimal_score"] > body["greedy_score"]
    assert sum(1 for s in body["optimal"] if s["tier"] == "expert") == 1
    assert isinstance(body["training"], list)
