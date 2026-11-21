"""Step 4 — screening: a cheap LLM pass reads up to ~1,000 compact cards per role and scores them 0-10."""
import asyncio
import logging

from backend.app.llm import LLMError, complete_json
from backend.app.models import Role
from backend.app.profile_view import compact_card

log = logging.getLogger(__name__)
BATCH = 50

SCHEMA = {"type": "object", "properties": {"items": {"type": "array", "items": {
    "type": "object",
    "properties": {"employee_id": {"type": "string"}, "score": {"type": "number"}, "reason": {"type": "string"}},
}}}}

SYSTEM = """You screen NTT DATA employees for a project role. Score every candidate 0-10 for how well they fit the role's requirements.
- 10 = clearly covers all must requirements with depth; 0 = unrelated.
- Must requirements matter most. Nice-to-have requirements only break ties.
- Value skills shown in projects or experience technologies over skills only listed; value higher skill levels.
- Synonyms count: different words for the same capability are a match.
Return one item per candidate, with a reason under 15 words."""


def role_block(role: Role) -> str:
    lines = [f"Role: {role.title}" + (f" ({role.seniority})" if role.seniority else "")
             + (f", min {role.min_years} years" if role.min_years else "")]
    for r in role.requirements:
        tag = "MUST" if r.must else "nice"
        extra = f" [{r.level}]" if r.level else ""
        syn = f" (also: {', '.join(r.synonyms)})" if r.synonyms else ""
        lines.append(f"- {tag} {r.type}: {r.value}{extra}{syn}")
    return "\n".join(lines)


async def screen(role: Role, profiles: list[dict], top_n: int) -> tuple[list[str], int]:
    """Return (top_n employee_ids by LLM score desc, number of failed batches)."""
    system = SYSTEM + "\n\n" + role_block(role)
    batches = [profiles[i:i + BATCH] for i in range(0, len(profiles), BATCH)]
    scores: dict[str, float] = {}
    order = {p["employee_id"]: i for i, p in enumerate(profiles)}
    failed = 0

    async def run(batch):
        nonlocal failed
        ids = {p["employee_id"] for p in batch}
        user = "Candidates:\n" + "\n".join(compact_card(p) for p in batch)
        try:
            out = await complete_json("screen", system, user, SCHEMA, max_tokens=16000, budgeted=True)
        except LLMError as e:
            log.warning("screen batch failed: %s", e)
            failed += 1
            return
        for it in out.get("items") or []:
            eid = it.get("employee_id")
            if eid in ids:
                try:
                    scores[eid] = float(it.get("score"))
                except (TypeError, ValueError):
                    continue

    await asyncio.gather(*(run(b) for b in batches))
    if batches and not scores and failed == len(batches):
        raise LLMError(f"all {failed} screening batches failed")
    if failed:
        log.warning("screen: %d/%d batches failed or skipped by the cost cap", failed, len(batches))
    # Ties keep retrieval order (the keyword/vector rank).
    ranked = sorted(scores, key=lambda e: (-scores[e], order[e]))
    return ranked[:top_n], failed
