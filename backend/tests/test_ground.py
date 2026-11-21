from backend.app.pipeline.ground import ground
from backend.app.profile_view import render
from backend.tests.helpers import profile, req, role

P = profile()
R = role([req("r1-q1", value="AWS"), req("r1-q2", value="Kubernetes")])


def raw(coverage, strengths=None):
    return {"employee_id": P["employee_id"], "coverage": coverage, "strengths": strengths or [], "gaps": [], "risks": []}


def test_valid_path_rendered_by_code():
    cov, _, claims, dropped = ground(raw([{"req_id": "r1-q1", "status": "met", "evidence": [{"path": "skills[1]"}]}]), P, R)
    c = {x.req_id: x for x in cov}["r1-q1"]
    assert c.status == "met" and c.evidence[0].value == render(P, "skills[1]") == "AWS (nivel 5, 6 años)"
    assert dropped == 0 and claims >= 1


def test_bad_path_dropped_and_req_becomes_missing():
    cov, _, _, dropped = ground(raw([{"req_id": "r1-q1", "status": "met", "evidence": [{"path": "skills[99]"}]}]), P, R)
    c = {x.req_id: x for x in cov}["r1-q1"]
    assert c.status == "missing" and c.evidence == [] and dropped == 1


def test_strength_without_valid_path_removed():
    s = [{"text": "Strong AWS", "paths": ["skills[1]"]}, {"text": "Invented", "paths": ["skills[42]", "nope"]}]
    _, strengths, _, dropped = ground(raw([], s), P, R)
    assert strengths == ["Strong AWS"] and dropped == 1


def test_missing_req_filled_and_unknown_req_dropped():
    cov, _, _, dropped = ground(raw([{"req_id": "r9-q9", "status": "met", "evidence": [{"path": "skills[1]"}]}]), P, R)
    assert sorted(c.req_id for c in cov) == ["r1-q1", "r1-q2"]
    assert all(c.status == "missing" for c in cov)
    assert dropped == 1


def test_missing_status_keeps_no_evidence():
    cov, _, _, _ = ground(raw([{"req_id": "r1-q2", "status": "missing", "evidence": [{"path": "skills[0]"}]}]), P, R)
    assert {x.req_id: x for x in cov}["r1-q2"].evidence == []


def test_evidence_from_irrelevant_field_dropped():
    cov, _, _, dropped = ground(raw([{"req_id": "r1-q2", "status": "met", "evidence": [{"path": "idiomas[0]"}]}]), P, R)
    assert {x.req_id: x for x in cov}["r1-q2"].status == "missing" and dropped == 1


def test_skill_evidence_from_project_tech_kept():
    cov, _, _, _ = ground(raw([{"req_id": "r1-q2", "status": "met", "evidence": [{"path": "proyectos[0].tecnologias[1]"}]}]), P, R)
    assert {x.req_id: x for x in cov}["r1-q2"].evidence[0].value == "Kubernetes"


def test_language_evidence_must_be_language():
    r = role([req("r1-q1", type="language", value="Inglés")])
    ok, _, _, _ = ground(raw([{"req_id": "r1-q1", "status": "met", "evidence": [{"path": "idiomas[0]"}]}]), P, r)
    bad, _, _, _ = ground(raw([{"req_id": "r1-q1", "status": "met", "evidence": [{"path": "skills[0]"}]}]), P, r)
    assert ok[0].status == "met" and bad[0].status == "missing"
