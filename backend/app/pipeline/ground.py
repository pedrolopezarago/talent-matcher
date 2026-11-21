"""Step 6 — grounding, in code. Every evidence path is resolved against the stored profile and its value
rendered here; paths that don't resolve are dropped. A requirement with no surviving evidence is missing.
A strength with no valid path is removed. This is the anti-hallucination guarantee."""
from backend.app.models import Coverage, Evidence, Role
from backend.app.profile_view import render


def ground(raw: dict, profile: dict, role: Role) -> tuple[list[Coverage], list[str], int, int]:
    """Return (coverage for every role requirement, verified strengths, claims checked, claims dropped)."""
    claims = dropped = 0
    by_req: dict[str, Coverage] = {}
    valid_ids = {r.id for r in role.requirements}

    for c in raw.get("coverage") or []:
        rid, status = c.get("req_id"), c.get("status")
        if rid not in valid_ids or rid in by_req or status not in ("met", "partial", "missing"):
            claims += 1
            dropped += 1
            continue
        evidence: list[Evidence] = []
        if status != "missing":
            for ev in c.get("evidence") or []:
                claims += 1
                path = (ev or {}).get("path")
                value = render(profile, path) if isinstance(path, str) else None
                if value is None:
                    dropped += 1
                    continue
                if all(e.path != path for e in evidence):
                    evidence.append(Evidence(path=path, value=value))
            if not evidence:
                status = "missing"
        by_req[rid] = Coverage(req_id=rid, status=status, evidence=evidence)

    coverage = [by_req.get(r.id) or Coverage(req_id=r.id, status="missing", evidence=[]) for r in role.requirements]

    strengths: list[str] = []
    for s in raw.get("strengths") or []:
        claims += 1
        text = (s or {}).get("text")
        paths = (s or {}).get("paths") or []
        if text and any(render(profile, p) is not None for p in paths if isinstance(p, str)):
            strengths.append(text)
        else:
            dropped += 1
    return coverage, strengths, claims, dropped
