"""Step 2 — hard filters, always in SQL (never decided by the LLM)."""
from datetime import date

from backend.app.db import fetch_one
from backend.app.models import Brief, Role
from scripts.ingest import cefr_rank

BANCA = "En banca"
ROLL_OFF = "Roll-off próximo (<3 meses)"
ASIGNADO = "Asignado"
DEFAULT_LANG_RANK = 4  # B2 when a must-have language has no stated level


def _months_until(start_date: str | None, today: date) -> float | None:
    if not start_date:
        return None
    try:
        start = date.fromisoformat(start_date[:10])
    except ValueError:
        return None
    return (start - today).days / 30.4


def availability_rule(brief: Brief, today: date) -> tuple[list[str], bool, str]:
    """(allowed availability values, roll-off is a timing risk, human-readable rule)."""
    months = None if brief.immediate else _months_until(brief.start_date, today)
    if months is None or months < 1:
        why = "Immediate start" if months is None else "Start in under a month"
        return [BANCA], False, f"{why} → only '{BANCA}'"
    if months < 3:
        return [BANCA, ROLL_OFF], True, f"Start in {months:.0f} months → '{BANCA}' + 'Roll-off próximo' (timing risk)"
    return [BANCA, ROLL_OFF], False, f"Start in {months:.0f} months → '{BANCA}' + 'Roll-off próximo'"


EXPERT_LEVELS = ["Senior", "Lead", "Principal"]
SUPPORT_LEVELS = ["Junior", "Mid"]


def build_where(role: Role, availability: list[str], seniorities: list[str] | None = None) -> tuple[str, dict]:
    clauses = ["disponibilidad = ANY(%(avail)s)"]
    params: dict = {"avail": list(availability)}
    if seniorities:
        clauses.append("nivel_seniority = ANY(%(seniorities)s)")
        params["seniorities"] = list(seniorities)
    if role.min_years:
        clauses.append("anios_experiencia >= %(min_years)s")
        params["min_years"] = role.min_years
    i = 0
    for r in role.requirements:
        if r.type == "language" and r.must:
            rank = cefr_rank(r.level) or DEFAULT_LANG_RANK
            clauses.append(f"COALESCE((lang_levels->>%(lang_{i})s)::int, 0) >= %(rank_{i})s")
            params[f"lang_{i}"] = r.value
            params[f"rank_{i}"] = rank
            i += 1
    return " AND ".join(clauses), params


def count(where: str, params: dict) -> int:
    return fetch_one(f"SELECT count(*) n FROM profiles WHERE {where}", params)["n"]


_total: int | None = None


def total_profiles() -> int:
    global _total
    if _total is None:
        _total = fetch_one("SELECT count(*) n FROM profiles")["n"]
    return _total
