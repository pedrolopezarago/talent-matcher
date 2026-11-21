from datetime import date, timedelta

from backend.app.pipeline.filters import availability_rule, build_where
from backend.tests.helpers import brief, req, role

TODAY = date(2026, 11, 21)
BOTH = ["En banca", "Roll-off próximo (<3 meses)"]


def test_rule_immediate():
    allowed, risk, text = availability_rule(brief([role([])]), TODAY)
    assert allowed == ["En banca"] and risk is False and "En banca" in text


def test_rule_two_months():
    b = brief([role([])], start_date=(TODAY + timedelta(days=60)).isoformat())
    assert availability_rule(b, TODAY)[:2] == (BOTH, True)


def test_rule_four_months():
    b = brief([role([])], start_date=(TODAY + timedelta(days=120)).isoformat())
    assert availability_rule(b, TODAY)[:2] == (BOTH, False)


def test_rule_bad_date_treated_as_immediate():
    b = brief([role([])], start_date="next spring")
    assert availability_rule(b, TODAY)[0] == ["En banca"]


def test_where_skips_nice_language_and_location():
    r = role([req("q1", type="language", value="Inglés", level="C1", must=False),
              req("q2", type="other", value="Madrid", must=True)])
    sql, params = build_where(r, ["En banca"])
    assert "lang_levels" not in sql
    assert params["avail"] == ["En banca"]


def test_where_must_language_and_min_years():
    r = role([req("q1", type="language", value="Español", level="Nativo", must=True)], min_years=3)
    sql, params = build_where(r, ["En banca"])
    assert "lang_levels" in sql and 7 in params.values() and "Español" in params.values()
    assert params["min_years"] == 3


def test_where_language_without_level_defaults_b2():
    sql, params = build_where(role([req("q1", type="language", value="Inglés", must=True)]), ["En banca"])
    assert 4 in params.values()


def test_where_seniority_tier():
    sql, params = build_where(role([]), ["En banca"], seniorities=["Junior", "Mid"])
    assert "nivel_seniority" in sql and params["seniorities"] == ["Junior", "Mid"]
    assert "nivel_seniority" not in build_where(role([]), ["En banca"])[0]
