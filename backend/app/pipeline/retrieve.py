"""Step 3 — retrieval. Keyword mode (default, no embeddings): weighted overlap scored in SQL.

Each requirement counts once if its value or any LLM-provided synonym appears in the profile's
search_text (role + skills + project/experience technologies + certs + methodologies).
must = 3 × weight, nice = 1 × weight. Skill requirements add 0.1 × best matching skill level.
Sector requirements match sector_principal or any project's cliente_sector. Languages are not
scored here (must-have languages are already hard filters).
"""
from backend.app.db import fetch_all
from backend.app.models import Role

KEYWORD_TYPES = {"skill", "certification", "methodology", "other", "soft_skill"}


def _terms(r) -> list[str]:
    seen = []
    for t in [r.value, *r.synonyms]:
        t = (t or "").strip().lower()
        if len(t) >= 2 and t not in seen:
            seen.append(t)
    return seen


def keyword_retrieve(role: Role, where: str, params: dict, limit: int) -> list[tuple[str, float]]:
    parts, max_score, p = [], 0.0, dict(params)
    for i, r in enumerate(role.requirements):
        w = r.weight * (3 if r.must else 1)
        terms = _terms(r)
        if not terms:
            continue
        if r.type in KEYWORD_TYPES:
            p[f"kw_{i}"] = [f"%{t}%" for t in terms]
            parts.append(f"(CASE WHEN search_text LIKE ANY(%(kw_{i})s) THEN {w} ELSE 0 END)")
            max_score += w
            if r.type == "skill":
                p[f"sk_{i}"] = terms
                parts.append(
                    f"COALESCE((SELECT max((s->>'nivel')::int) FROM jsonb_array_elements(skills) s "
                    f"WHERE lower(s->>'skill') = ANY(%(sk_{i})s)), 0) * 0.1")
                max_score += 0.5
        elif r.type == "sector":
            p[f"sec_{i}"] = [f"%{t}%" for t in terms]
            parts.append(
                f"(CASE WHEN lower(sector_principal) LIKE ANY(%(sec_{i})s) OR EXISTS (SELECT 1 FROM jsonb_array_elements(proyectos) pr "
                f"WHERE lower(pr->>'cliente_sector') LIKE ANY(%(sec_{i})s)) THEN {w} ELSE 0 END)")
            max_score += w
    # Same role title is a useful prior, worth one nice requirement.
    p["title"] = f"%{role.title.lower()}%"
    parts.append("(CASE WHEN lower(rol) LIKE %(title)s OR lower(puesto_actual) LIKE %(title)s THEN 2 ELSE 0 END)")
    max_score += 2
    p["limit"] = limit
    sql = (f"SELECT employee_id, ({' + '.join(parts)}) AS score FROM profiles WHERE {where} "
           f"ORDER BY score DESC, anios_experiencia DESC, employee_id LIMIT %(limit)s")
    rows = fetch_all(sql, p)
    return [(r["employee_id"], round(float(r["score"]) / max_score, 4)) for r in rows if r["score"] > 0]
