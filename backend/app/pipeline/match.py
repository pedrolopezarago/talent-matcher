"""Steps 2-7 orchestrated per role: filters → retrieval → screening → judging → grounding → score."""
import asyncio
import logging
from datetime import date

from backend.app.config import settings
from backend.app.db import get_profiles
from backend.app.models import Brief, Candidate, Funnel, Grounding, MatchResult, Role, RoleResult
from backend.app.pipeline.filters import ASIGNADO, ROLL_OFF, availability_rule, build_where, count, total_profiles
from backend.app.pipeline.ground import ground
from backend.app.pipeline.judge import judge
from backend.app.pipeline.retrieve import keyword_retrieve
from backend.app.pipeline.score import fit, hidden_flags
from backend.app.pipeline.screen import screen
from backend.app.vocab import get_vocab

log = logging.getLogger(__name__)
RESERVE_SIZE = 5
ROLL_OFF_RISK = {"en": "Roll-off within 3 months: confirm release date", "es": "Roll-off en menos de 3 meses: confirmar fecha de liberación"}


def _modal_area(title: str) -> str | None:
    modal = get_vocab().modal_area_by_role
    if title in modal:
        return modal[title]
    low = title.lower()
    return next((a for r, a in modal.items() if r.lower() == low), None)


async def _assess(role: Role, profiles: list[dict], sims: dict[str, float], lang: str, roll_off_risk: bool,
                  modal_area: str | None) -> tuple[list[Candidate], int, int]:
    raws, _failed = await judge(role, profiles, lang)
    by_id = {p["employee_id"]: p for p in profiles}
    out: list[Candidate] = []
    claims = dropped = 0
    for raw in raws:
        p = by_id[raw["employee_id"]]
        coverage, strengths, c, d = ground(raw, p, role)
        claims += c
        dropped += d
        risks = [r for r in raw.get("risks") or [] if isinstance(r, str)]
        if roll_off_risk and p.get("disponibilidad") == ROLL_OFF:
            risks.insert(0, ROLL_OFF_RISK.get(lang, ROLL_OFF_RISK["en"]))
        out.append(Candidate(
            employee_id=p["employee_id"], name=p.get("nombre_completo") or "", current_role=p.get("puesto_actual") or "",
            area=p.get("area") or "", seniority=p.get("nivel_seniority") or "", availability=p["disponibilidad"],
            country=p.get("pais") or "", city=p.get("ciudad") or "", years_experience=p.get("anios_experiencia") or 0,
            fit=fit(role, coverage, p), similarity=sims.get(p["employee_id"], 0.0), coverage=coverage,
            strengths=strengths, gaps=[g for g in raw.get("gaps") or [] if isinstance(g, str)], risks=risks,
            hidden=hidden_flags(role, coverage, p, modal_area),
        ))
    out.sort(key=lambda c: (-c.fit, -c.similarity))
    return out, claims, dropped


async def _match_role(role: Role, allowed: list[str], roll_off_risk: bool, rule: str, lang: str) -> tuple[RoleResult, int, int]:
    where, params = build_where(role, allowed)
    total = await asyncio.to_thread(total_profiles)
    after = await asyncio.to_thread(count, where, params)
    empty = RoleResult(role_id=role.id, availability_rule=rule,
                       funnel=Funnel(total=total, after_filters=after, reviewed=0, ranked=0), candidates=[], reserve=[])
    if after == 0:
        return empty, 0, 0

    depth = max(100, min(role.review_depth, settings.screen_max_per_role))
    hits = await asyncio.to_thread(keyword_retrieve, role, where, params, depth)
    # Reserve lane: same role, people currently assigned (would need release).
    r_where, r_params = build_where(role, [ASIGNADO])
    reserve_hits = await asyncio.to_thread(keyword_retrieve, role, r_where, r_params, RESERVE_SIZE)
    sims = dict(hits) | dict(reserve_hits)
    profiles = await asyncio.to_thread(get_profiles, [i for i, _ in hits] + [i for i, _ in reserve_hits])
    pool = [profiles[i] for i, _ in hits if i in profiles]
    if not pool:
        empty.funnel.reviewed = 0
        return empty, 0, 0

    top_ids, failed = await screen(role, pool, settings.judge_top_n)
    if failed:
        log.warning("role %s: %d screening batches failed", role.id, failed)
    modal = _modal_area(role.title)
    shortlisted = [profiles[i] for i in top_ids]
    reserve_profiles = [profiles[i] for i, _ in reserve_hits if i in profiles]
    (cands, c1, d1), (reserve, c2, d2) = await asyncio.gather(
        _assess(role, shortlisted, sims, lang, roll_off_risk, modal),
        _assess(role, reserve_profiles, sims, lang, False, modal),
    )
    rr = RoleResult(role_id=role.id, availability_rule=rule,
                    funnel=Funnel(total=total, after_filters=after, reviewed=len(pool), ranked=len(cands)),
                    candidates=cands, reserve=reserve)
    return rr, c1 + c2, d1 + d2


async def match(brief: Brief, lang: str = "en", today: date | None = None) -> MatchResult:
    allowed, roll_off_risk, rule = availability_rule(brief, today or date.today())
    results = await asyncio.gather(*(_match_role(r, allowed, roll_off_risk, rule, lang) for r in brief.roles))
    return MatchResult(
        roles=[r for r, _, _ in results],
        grounding=Grounding(claims=sum(c for _, c, _ in results), dropped=sum(d for _, _, d in results)),
        retrieval="keyword",
    )
