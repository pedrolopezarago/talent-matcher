"""Step 8 — team builder: one expert per team + Junior/Mid support, optimal (Hungarian) vs greedy, training plans.

Staffing practice at NTT DATA: a team has ONE expert (Senior/Lead/Principal) who leads, and the rest are
Junior/Mid people who do most of the hands-on work.

Optimal: for each role in turn, make its first slot the team's expert slot and every other slot a support
slot, then solve the assignment with scipy.optimize.linear_sum_assignment (value = fit × criticality,
nobody fills two slots). Keep the variant with the fewest off-level slots, then the highest score.
Greedy (baseline): the expert goes to the most critical role; each slot takes its role's best free candidate.
A slot with nobody at the right level is filled with another level and marked off_tier rather than left empty.
"""
import json

import numpy as np
from scipy.optimize import linear_sum_assignment

from backend.app.llm import LLMError, complete_json
from backend.app.models import (Brief, Candidate, JointCoverage, MatchResult, Requirement, Role, Swap, TeamSlot,
                                TrainingPlan, TrainingRecommendation)
from backend.app.pipeline.filters import EXPERT_LEVELS, SUPPORT_LEVELS

UNAVAILABLE = 1e6
OFF_TIER_PENALTY = 1e4  # worse than any right-level choice, better than an empty slot


def _level_ok(tier: str, seniority: str) -> bool:
    return seniority in (EXPERT_LEVELS if tier == "expert" else SUPPORT_LEVELS)


def _context(brief: Brief, match: MatchResult):
    by_role = {r.role_id: r for r in match.roles}
    slots = [(role, i) for role in brief.roles if role.id in by_role for i in range(role.headcount)]
    order = [r.id for r in brief.roles]
    cands = {(rr.role_id, c.employee_id): c for rr in by_role.values() for c in rr.candidates}
    return slots, by_role, order, cands


def _score(brief: Brief, slots, team: list[TeamSlot]) -> float:
    crit = {r.id: r.criticality for r in brief.roles}
    total_w = sum(crit[r.id] for r, _ in slots)
    if total_w == 0:
        return 0.0
    return round(sum(s.fit * crit[s.role_id] for s in team) / total_w, 1)


def _slot(role: Role, n: int, tier: str, c: Candidate) -> TeamSlot:
    return TeamSlot(role_id=role.id, slot=n, employee_id=c.employee_id, name=c.name, fit=c.fit, tier=tier,
                    seniority=c.seniority, off_tier=not _level_ok(tier, c.seniority))


def _tiers(slots, expert_role_id: str) -> list[str]:
    seen = False
    out = []
    for role, _ in slots:
        if role.id == expert_role_id and not seen:
            out.append("expert")
            seen = True
        else:
            out.append("support")
    return out


def _solve(slots, tiers: list[str], cands: dict) -> list[TeamSlot]:
    people = list(dict.fromkeys(eid for (_, eid) in cands))
    if not slots or not people:
        return []
    cost = np.full((len(slots), len(people)), UNAVAILABLE)
    for i, (role, _) in enumerate(slots):
        for j, eid in enumerate(people):
            c = cands.get((role.id, eid))
            if c is not None:
                cost[i, j] = -c.fit * role.criticality + (0 if _level_ok(tiers[i], c.seniority) else OFF_TIER_PENALTY)
    team = []
    for i, j in zip(*linear_sum_assignment(cost)):
        if cost[i, j] < UNAVAILABLE:
            role, n = slots[i]
            team.append(_slot(role, n, tiers[i], cands[(role.id, people[j])]))
    return team


def _sort(team: list[TeamSlot], order: list[str]) -> list[TeamSlot]:
    return sorted(team, key=lambda s: (order.index(s.role_id), s.slot))


def build_team(brief: Brief, match: MatchResult) -> tuple[list[TeamSlot], list[TeamSlot], float, float]:
    slots, by_role, order, cands = _context(brief, match)
    if not slots:
        return [], [], 0.0, 0.0

    # Optimal: try the expert in each role, keep the best variant.
    best, best_key = [], None
    roles_in_slots = {r.id: r for r, _ in slots}
    for role in roles_in_slots.values():
        team = _solve(slots, _tiers(slots, role.id), cands)
        key = (sum(s.off_tier for s in team), -len(team), -_score(brief, slots, team), -role.criticality)
        if best_key is None or key < best_key:
            best, best_key = team, key
    optimal = _sort(best, order)

    # Greedy: expert in the most critical role; slots filled in criticality order with the best free candidate.
    expert_role = sorted(roles_in_slots.values(), key=lambda r: (-r.criticality, order.index(r.id)))[0]
    tiers = _tiers(slots, expert_role.id)
    greedy: list[TeamSlot] = []
    used: set[str] = set()
    for idx in sorted(range(len(slots)), key=lambda k: (-slots[k][0].criticality, order.index(slots[k][0].id), slots[k][1])):
        role, n = slots[idx]
        free = sorted((c for c in by_role[role.id].candidates if c.employee_id not in used), key=lambda c: -c.fit)
        pick = next((c for c in free if _level_ok(tiers[idx], c.seniority)), None) or (free[0] if free else None)
        if pick:
            used.add(pick.employee_id)
            greedy.append(_slot(role, n, tiers[idx], pick))
    greedy = _sort(greedy, order)

    return optimal, greedy, _score(brief, slots, optimal), _score(brief, slots, greedy)


def swaps(optimal: list[TeamSlot], greedy: list[TeamSlot]) -> list[Swap]:
    out = []
    for role_id in dict.fromkeys(s.role_id for s in optimal + greedy):
        o = {s.employee_id: s.name for s in optimal if s.role_id == role_id}
        g = {s.employee_id: s.name for s in greedy if s.role_id == role_id}
        only_g = [g[e] for e in g if e not in o]
        only_o = [o[e] for e in o if e not in g]
        for a, b in zip(only_g, only_o):
            out.append(Swap(role_id=role_id, greedy=a, optimal=b))
    return out


def _status(c: Candidate, req_id: str) -> str:
    return next((cv.status for cv in c.coverage if cv.req_id == req_id), "missing")


def joint_coverage(brief: Brief, match: MatchResult, team: list[TeamSlot]) -> list[JointCoverage]:
    _, _, _, cands = _context(brief, match)
    covered: dict[str, list[str]] = {}
    for role in brief.roles:
        members = [cands[(role.id, s.employee_id)] for s in team if s.role_id == role.id and (role.id, s.employee_id) in cands]
        for req in role.requirements:
            if not req.must:
                continue
            names = covered.setdefault(req.value, [])
            for c in members:
                if _status(c, req.id) in ("met", "partial") and c.name not in names:
                    names.append(c.name)
    return [JointCoverage(req_value=k, covered_by=v) for k, v in covered.items()]


# ---------- explanation ----------

EXPLAIN_SCHEMA = {"type": "object", "properties": {"explanation": {"type": "string"}}}
EXPLAIN_SYSTEM = ("Explain in ONE sentence (max 40 words) why the optimal team beats the greedy one, using only the numbers given. "
                  "Both teams have one expert (Senior+) and Junior/Mid support. Greedy puts the expert in the most critical role and fills "
                  "each slot with its best free person; optimal chooses where the expert adds most for the whole team. Write in {lang_name}.")


def _lang_name(lang: str) -> str:
    return "Spanish" if lang == "es" else "English"


async def explain(optimal: list[TeamSlot], greedy: list[TeamSlot], optimal_score: float, greedy_score: float,
                  swap_list: list[Swap], lang: str) -> str:
    def team_txt(t):
        return "; ".join(f"{s.role_id}#{s.slot} [{s.tier}]: {s.name} ({s.seniority}, fit {s.fit:g})" for s in t)

    if not swap_list:
        return (f"El equipo óptimo coincide con el greedy ({optimal_score} puntos)." if lang == "es"
                else f"The optimal team matches the greedy one ({optimal_score} points).")
    user = (f"Optimal ({optimal_score}): {team_txt(optimal)}\nGreedy ({greedy_score}): {team_txt(greedy)}\n"
            f"Swaps: {'; '.join(f'{s.role_id}: {s.greedy} → {s.optimal}' for s in swap_list)}")
    try:
        out = await complete_json("team", EXPLAIN_SYSTEM.format(lang_name=_lang_name(lang)), user, EXPLAIN_SCHEMA, max_tokens=2000)
        text = (out.get("explanation") or "").strip()
        if text:
            return text
    except LLMError:
        pass
    s = swap_list[0]
    if lang == "es":
        return f"El equipo óptimo suma {optimal_score} frente a {greedy_score} del greedy: en {s.role_id}, {s.optimal} sustituye a {s.greedy} porque el experto rinde más en otro rol."
    return f"Optimal team scores {optimal_score} vs {greedy_score} for greedy: in {s.role_id}, {s.optimal} replaces {s.greedy} because the expert adds more elsewhere."


# ---------- training plans ----------

KINDS = ["certification", "course", "mentoring", "project"]
TRAINING_SCHEMA = {"type": "object", "properties": {"plans": {"type": "array", "items": {"type": "object", "properties": {
    "employee_id": {"type": "string"},
    "recommendations": {"type": "array", "items": {"type": "object", "properties": {
        "requirement": {"type": "string"},
        "training": {"type": "string"},
        "kind": {"type": "string", "enum": KINDS},
    }}},
}}}}}
TRAINING_SYSTEM = """You plan targeted upskilling for NTT DATA employees placed on a project team without fully meeting some MUST requirements.
For each person and EACH listed gap, recommend ONE specific training: a named certification (e.g. "AWS Certified Solutions Architect – Associate"),
a concrete course topic, mentoring by the team's expert on a named skill, or a hands-on project task. Prefer what builds on skills the person already has.
Keep each recommendation under 15 words. Write the training text in {lang_name}. Only cover the gaps listed."""


def training_targets(brief: Brief, match: MatchResult, team: list[TeamSlot]) -> list[tuple[TeamSlot, list[Requirement], Candidate]]:
    """Team members with at least one MUST requirement not fully met, with those requirements."""
    _, _, _, cands = _context(brief, match)
    roles = {r.id: r for r in brief.roles}
    out = []
    for s in team:
        c = cands.get((s.role_id, s.employee_id))
        if c is None:
            continue
        unmet = [r for r in roles[s.role_id].requirements if r.must and _status(c, r.id) != "met"]
        if unmet:
            out.append((s, unmet, c))
    return out


def _fallback(req: Requirement, lang: str) -> TrainingRecommendation:
    text = f"Formación práctica en {req.value}" if lang == "es" else f"Hands-on training in {req.value}"
    return TrainingRecommendation(requirement=req.value, training=text, kind="course")


async def training_plans(brief: Brief, match: MatchResult, team: list[TeamSlot], lang: str) -> list[TrainingPlan]:
    targets = training_targets(brief, match, team)
    if not targets:
        return []
    payload = []
    for s, unmet, c in targets:
        have = sorted({e.value for cv in c.coverage for e in cv.evidence})[:8]
        payload.append({"employee_id": s.employee_id, "role": next(r.title for r in brief.roles if r.id == s.role_id),
                        "seniority": c.seniority, "gaps": [r.value for r in unmet], "already_has": have})
    llm_recs: dict[str, dict[str, TrainingRecommendation]] = {}
    try:
        out = await complete_json("team", TRAINING_SYSTEM.format(lang_name=_lang_name(lang)),
                                  json.dumps(payload, ensure_ascii=False), TRAINING_SCHEMA, max_tokens=4000)
        for p in out.get("plans") or []:
            for r in p.get("recommendations") or []:
                if r.get("training") and r.get("kind") in KINDS:
                    llm_recs.setdefault(p.get("employee_id"), {})[(r.get("requirement") or "").lower()] = TrainingRecommendation(
                        requirement=r["requirement"], training=r["training"], kind=r["kind"])
    except LLMError:
        pass
    plans = []
    for s, unmet, _ in targets:
        mine = llm_recs.get(s.employee_id, {})
        recs = [mine.get(r.value.lower()) or _fallback(r, lang) for r in unmet]
        plans.append(TrainingPlan(employee_id=s.employee_id, name=s.name, role_id=s.role_id,
                                  gaps=[r.value for r in unmet], recommendations=recs))
    return plans
