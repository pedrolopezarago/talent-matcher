"""Step 8 — team builder: optimal assignment (Hungarian algorithm) vs a greedy baseline.

Slots = roles × headcount. Value of putting candidate c in a slot of role r = fit(c, r) × criticality(r).
scipy.optimize.linear_sum_assignment finds the assignment with the highest total value where nobody
fills two slots. Greedy fills the most critical role first with its best free candidate, which can
"spend" a person who was irreplaceable elsewhere — the swap explanation shows that.
"""
import numpy as np
from scipy.optimize import linear_sum_assignment

from backend.app.llm import LLMError, complete_json
from backend.app.models import Brief, JointCoverage, MatchResult, Swap, TeamSlot

UNAVAILABLE = 1e6


def _slots(brief: Brief, match: MatchResult):
    by_role = {r.role_id: r for r in match.roles}
    slots = []
    for role in brief.roles:
        if role.id in by_role:
            slots += [(role, i) for i in range(role.headcount)]
    return slots, by_role


def _score(brief: Brief, slots, team: list[TeamSlot]) -> float:
    crit = {r.id: r.criticality for r in brief.roles}
    total_w = sum(crit[r.id] for r, _ in slots)
    if total_w == 0:
        return 0.0
    return round(sum(s.fit * crit[s.role_id] for s in team) / total_w, 1)


def build_team(brief: Brief, match: MatchResult) -> tuple[list[TeamSlot], list[TeamSlot], float, float]:
    slots, by_role = _slots(brief, match)
    people: list[str] = []
    names: dict[str, str] = {}
    for rr in by_role.values():
        for c in rr.candidates:
            if c.employee_id not in names:
                people.append(c.employee_id)
                names[c.employee_id] = c.name
    fits = {(rr.role_id, c.employee_id): c.fit for rr in by_role.values() for c in rr.candidates}

    optimal: list[TeamSlot] = []
    if slots and people:
        cost = np.full((len(slots), len(people)), UNAVAILABLE)
        for i, (role, _) in enumerate(slots):
            for j, eid in enumerate(people):
                if (role.id, eid) in fits:
                    cost[i, j] = -fits[(role.id, eid)] * role.criticality
        rows, cols = linear_sum_assignment(cost)
        for i, j in zip(rows, cols):
            if cost[i, j] >= UNAVAILABLE:
                continue
            role, n = slots[i]
            eid = people[j]
            optimal.append(TeamSlot(role_id=role.id, slot=n, employee_id=eid, name=names[eid], fit=fits[(role.id, eid)]))
        optimal.sort(key=lambda s: ([r.id for r in brief.roles].index(s.role_id), s.slot))

    greedy: list[TeamSlot] = []
    used: set[str] = set()
    for role, n in sorted(slots, key=lambda s: (-s[0].criticality, [r.id for r in brief.roles].index(s[0].id), s[1])):
        best = next((c for c in sorted(by_role[role.id].candidates, key=lambda c: -c.fit) if c.employee_id not in used), None)
        if best:
            used.add(best.employee_id)
            greedy.append(TeamSlot(role_id=role.id, slot=n, employee_id=best.employee_id, name=best.name, fit=best.fit))
    greedy.sort(key=lambda s: ([r.id for r in brief.roles].index(s.role_id), s.slot))

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


def joint_coverage(brief: Brief, match: MatchResult, team: list[TeamSlot]) -> list[JointCoverage]:
    cands = {(rr.role_id, c.employee_id): c for rr in match.roles for c in rr.candidates}
    covered: dict[str, list[str]] = {}
    for role in brief.roles:
        members = [cands[(role.id, s.employee_id)] for s in team if s.role_id == role.id and (role.id, s.employee_id) in cands]
        for req in role.requirements:
            if not req.must:
                continue
            names = covered.setdefault(req.value, [])
            for c in members:
                status = next((cv.status for cv in c.coverage if cv.req_id == req.id), "missing")
                if status in ("met", "partial") and c.name not in names:
                    names.append(c.name)
    return [JointCoverage(req_value=k, covered_by=v) for k, v in covered.items()]


SCHEMA = {"type": "object", "properties": {"explanation": {"type": "string"}}}
SYSTEM = ("Explain in ONE sentence (max 40 words) why the optimal team beats the greedy one, using only the numbers given. "
          "Greedy fills the most critical role first with its best person; optimal maximises the whole team. Write in {lang_name}.")


async def explain(optimal: list[TeamSlot], greedy: list[TeamSlot], optimal_score: float, greedy_score: float,
                  swap_list: list[Swap], lang: str) -> str:
    def team_txt(t):
        return "; ".join(f"{s.role_id}#{s.slot}: {s.name} (fit {s.fit:g})" for s in t)

    if not swap_list:
        return (f"El equipo óptimo coincide con el greedy ({optimal_score} puntos)." if lang == "es"
                else f"The optimal team matches the greedy one ({optimal_score} points).")
    user = (f"Optimal ({optimal_score}): {team_txt(optimal)}\nGreedy ({greedy_score}): {team_txt(greedy)}\n"
            f"Swaps: {'; '.join(f'{s.role_id}: {s.greedy} → {s.optimal}' for s in swap_list)}")
    try:
        out = await complete_json("team", SYSTEM.format(lang_name="Spanish" if lang == "es" else "English"), user, SCHEMA, max_tokens=400)
        text = (out.get("explanation") or "").strip()
        if text:
            return text
    except LLMError:
        pass
    s = swap_list[0]
    if lang == "es":
        return f"El equipo óptimo suma {optimal_score} frente a {greedy_score} del greedy: en {s.role_id}, {s.optimal} sustituye a {s.greedy} para no gastar a alguien más valioso en otro rol."
    return f"Optimal team scores {optimal_score} vs {greedy_score} for greedy: in {s.role_id}, {s.optimal} replaces {s.greedy} so a scarcer person stays where they add most."
