"""Step 5 — judging: the LLM reads full (compact JSON) profiles and decides coverage per requirement,
citing evidence by PATH only. Values are rendered by code in ground.py."""
import asyncio
import json
import logging

from backend.app.llm import LLMError, complete_json
from backend.app.models import Role
from backend.app.pipeline.screen import role_block
from backend.app.profile_view import judge_view

log = logging.getLogger(__name__)
BATCH = 10

SCHEMA = {"type": "object", "properties": {"candidates": {"type": "array", "items": {
    "type": "object",
    "properties": {
        "employee_id": {"type": "string"},
        "coverage": {"type": "array", "items": {"type": "object", "properties": {
            "req_id": {"type": "string"},
            "status": {"type": "string", "enum": ["met", "partial", "missing"]},
            "evidence": {"type": "array", "items": {"type": "object", "properties": {"path": {"type": "string"}}}},
        }}},
        "strengths": {"type": "array", "items": {"type": "object", "properties": {
            "text": {"type": "string"}, "paths": {"type": "array", "items": {"type": "string"}}}}},
        "gaps": {"type": "array", "items": {"type": "string"}},
        "risks": {"type": "array", "items": {"type": "string"}},
    },
}}}}

SYSTEM = """You assess NTT DATA employees against a project role, requirement by requirement.

For every candidate and EVERY requirement (by req_id) decide:
- met: clear evidence in the profile; partial: related or shallow evidence; missing: no evidence.
- evidence: paths into the candidate JSON that prove it, e.g. "skills[2]", "proyectos[0].tecnologias[1]", "proyectos[1].cliente_sector",
  "idiomas[0]", "certificaciones[0]", "experiencia[0]". Cite paths only; never write values. Only cite paths that exist.
- Different words for the same capability count (e.g. "container orchestration" ← Kubernetes) — that is the point of this tool.
- Skills used in projects or experience (with technologies and years) are stronger evidence than a skill only listed.

Also per candidate:
- strengths: up to 3, each a short phrase with the paths that back it. A strength with no path will be deleted.
- gaps: up to 3 short phrases (what is missing or weak vs. the requirements).
- risks: up to 3 short phrases. Flag "level 1-2 despite 3+ years" on a required skill, experience only in an old project (5+ years ago).
  Never flag location, city or country: everyone can work remotely.
Write strengths, gaps and risks in {lang_name}. Keep each under 12 words."""


async def judge(role: Role, profiles: list[dict], lang: str) -> tuple[list[dict], int]:
    """Return (raw judgements, number of failed batches)."""
    system = SYSTEM.format(lang_name="Spanish" if lang == "es" else "English") + "\n\n" + role_block(role) + "\nreq_ids: " + \
        ", ".join(f"{r.id}={r.value}" for r in role.requirements)
    batches = [profiles[i:i + BATCH] for i in range(0, len(profiles), BATCH)]
    out: list[dict] = []
    failed = 0

    async def run(batch):
        nonlocal failed
        ids = {p["employee_id"] for p in batch}
        user = "Candidates (JSON):\n" + "\n".join(json.dumps(judge_view(p), ensure_ascii=False, default=str) for p in batch)
        try:
            res = await complete_json("judge", system, user, SCHEMA, max_tokens=16000, budgeted=True)
        except LLMError as e:
            log.warning("judge batch failed: %s", e)
            failed += 1
            return
        seen = set()
        for c in res.get("candidates") or []:
            eid = c.get("employee_id")
            if eid in ids and eid not in seen:
                seen.add(eid)
                out.append(c)

    await asyncio.gather(*(run(b) for b in batches))
    if batches and not out and failed == len(batches):
        raise LLMError(f"all {failed} judging batches failed")
    if failed:
        log.warning("judge: %d/%d batches failed or skipped by the cost cap", failed, len(batches))
    return out, failed
