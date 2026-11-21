"""Step 7 — fit score and hidden-talent flags, in code."""
import re

from backend.app.models import Coverage, Hidden, Role, VocabBridge
from backend.app.profile_view import resolve_path

CREDIT = {"met": 1.0, "partial": 0.5, "missing": 0.0}
MUST_MISSING_CAP = 69
BRIDGE_TYPES = {"skill", "certification", "methodology"}


def _skill_for(req, cov: Coverage, profile: dict) -> dict | None:
    """The profile skill backing a skill requirement: the one cited in evidence, else a name match."""
    for e in cov.evidence:
        if re.fullmatch(r"skills\[\d+\]", e.path):
            s = resolve_path(profile, e.path)
            if isinstance(s, dict):
                return s
    names = {t.lower() for t in [req.value, *req.synonyms]}
    for s in profile.get("skills") or []:
        if (s.get("skill") or "").lower() in names:
            return s
    return None


def _depth(skill: dict | None) -> float:
    if not skill:
        return 1.0
    level = min(max(skill.get("nivel") or 0, 0), 5) / 5
    years = min(skill.get("anios") or 0, 5) / 5
    return 0.6 + 0.4 * (level + years) / 2


def fit(role: Role, coverage: list[Coverage], profile: dict) -> int:
    by_req = {c.req_id: c for c in coverage}
    num = den = 0.0
    must_missing = False
    for r in role.requirements:
        c = by_req.get(r.id)
        status = c.status if c else "missing"
        w = r.weight * (3 if r.must else 1)
        credit = CREDIT[status]
        if r.type == "skill" and c and status != "missing":
            credit *= _depth(_skill_for(r, c, profile))
        num += credit * w
        den += w
        must_missing |= r.must and status == "missing"
    if den == 0:
        return 0
    score = round(100 * num / den)
    return min(score, MUST_MISSING_CAP) if must_missing else score


def must_coverage(role: Role, coverage: list[Coverage]) -> float:
    by_req = {c.req_id: c.status for c in coverage}
    musts = [r for r in role.requirements if r.must]
    if not musts:
        return 1.0
    return sum(CREDIT[by_req.get(r.id, "missing")] for r in musts) / len(musts)


def hidden_flags(role: Role, coverage: list[Coverage], profile: dict, modal_area: str | None) -> Hidden:
    different = bool(modal_area) and profile.get("area") != modal_area and must_coverage(role, coverage) >= 0.7
    bridges: list[VocabBridge] = []
    by_req = {c.req_id: c for c in coverage}
    for r in role.requirements:
        c = by_req.get(r.id)
        # Bridges are about skills described with other words; other requirement types don't qualify.
        if r.type not in BRIDGE_TYPES or not c or c.status != "met" or not c.evidence:
            continue
        term = r.value.lower()
        if not any(term in e.value.lower() for e in c.evidence):
            bridges.append(VocabBridge(asked=r.value, found=c.evidence[0].value))
    return Hidden(different_area=different, vocab_bridges=bridges)
