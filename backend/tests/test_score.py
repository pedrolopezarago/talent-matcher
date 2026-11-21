from backend.app.models import Coverage, Evidence
from backend.app.pipeline.score import fit, hidden_flags
from backend.tests.helpers import profile, req, role


def cov(rid, status, value="x", path="sector_principal"):
    ev = [] if status == "missing" else [Evidence(path=path, value=value)]
    return Coverage(req_id=rid, status=status, evidence=ev)


def test_all_met_non_skill_is_100():
    r = role([req("q1", type="sector", value="Banca"), req("q2", type="certification", value="CKA", must=False)])
    assert fit(r, [cov("q1", "met"), cov("q2", "met")], profile()) == 100


def test_must_missing_caps_69():
    r = role([req("q1", type="sector", weight=3), req("q2", type="certification", weight=1)])
    assert fit(r, [cov("q1", "met"), cov("q2", "missing")], profile()) <= 69


def test_depth_factor():
    r = role([req("q1", type="skill", value="AWS")])
    p5 = profile(skills=[{"skill": "AWS", "nivel": 5, "anios": 5.0}])
    p1 = profile(skills=[{"skill": "AWS", "nivel": 1, "anios": 1.0}])
    assert fit(r, [cov("q1", "met", path="skills[0]")], p5) == 100
    assert fit(r, [cov("q1", "met", path="skills[0]")], p1) == 68


def test_nice_weighs_less():
    r = role([req("q1", type="sector", must=True), req("q2", type="certification", must=False)])
    assert fit(r, [cov("q1", "met"), cov("q2", "missing")], profile()) == 75


def test_partial_counts_half():
    r = role([req("q1", type="sector", must=False)])
    assert fit(r, [cov("q1", "partial")], profile()) == 50


def test_no_requirements_is_zero():
    assert fit(role([]), [], profile()) == 0


def test_vocab_bridge():
    r = role([req("q1", type="skill", value="container orchestration")])
    c = [cov("q1", "met", value="Kubernetes (nivel 4, 3 años)", path="skills[0]")]
    h = hidden_flags(r, c, profile(), modal_area=None)
    assert [(b.asked, b.found) for b in h.vocab_bridges] == [("container orchestration", "Kubernetes (nivel 4, 3 años)")]


def test_no_bridge_when_literal_term_present():
    r = role([req("q1", type="skill", value="AWS")])
    h = hidden_flags(r, [cov("q1", "met", value="AWS (nivel 5, 6 años)")], profile(), modal_area=None)
    assert h.vocab_bridges == []


def test_different_area_requires_coverage():
    r = role([req("q1", type="sector"), req("q2", type="certification")])
    p = profile(area="Consultoría de Negocio")
    assert hidden_flags(r, [cov("q1", "met"), cov("q2", "missing")], p, "Software Engineering").different_area is False
    assert hidden_flags(r, [cov("q1", "met"), cov("q2", "met")], p, "Software Engineering").different_area is True
    assert hidden_flags(r, [cov("q1", "met"), cov("q2", "met")], profile(area="Software Engineering"), "Software Engineering").different_area is False
