"""Step 1 — free-text brief → structured Brief (one LLM call, then code-side clamping)."""
import json

from backend.app.config import settings
from backend.app.llm import complete_json
from backend.app.models import Brief
from backend.app.vocab import get_vocab

REQ_TYPES = ["skill", "sector", "language", "certification", "methodology", "soft_skill", "seniority", "client_facing", "other"]
NULL_STR = {"type": ["string", "null"]}

SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string"},
        "summary": {"type": "string"},
        "sector": NULL_STR,
        "start_date": {"type": ["string", "null"], "description": "ISO date, or null if the brief gives none"},
        "roles": {"type": "array", "items": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "headcount": {"type": "integer"},
                "seniority": {"type": ["string", "null"], "enum": ["Trainee", "Junior", "Mid", "Senior", "Lead", "Principal", None]},
                "min_years": {"type": ["integer", "null"]},
                "criticality": {"type": "integer", "description": "1-5"},
                "review_depth": {"type": "integer", "description": "100-1000; more when the profile is scarce"},
                "requirements": {"type": "array", "items": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": REQ_TYPES},
                        "value": {"type": "string"},
                        "level": NULL_STR,
                        "must": {"type": "boolean"},
                        "implicit": {"type": "boolean"},
                        "weight": {"type": "integer", "description": "1-3"},
                        "source_quote": {"type": "string"},
                        "synonyms": {"type": "array", "items": {"type": "string"}},
                    },
                }},
            },
        }},
    },
}

SYSTEM = """You turn a staffing request for NTT DATA into structured roles and requirements.

Rules:
- Create exactly the roles the brief asks for, with their headcount. Add a Project Manager only if the brief asks for one.
- Map every requirement value onto the vocabulary below when a match exists (skills, sectors, roles), keeping the vocabulary spelling.
  Languages use Spanish names as in the data (Inglés, Español, Francés...) and CEFR levels (A1-C2 or Nativo) in `level`.
- `synonyms`: up to 6 related skills FROM THE VOCABULARY that would show the same capability (e.g. "container orchestration" → Kubernetes, OpenShift).
  They are how we find people who describe the same skill with other words.
- must=false for anything described as desirable, a plus, valued, not essential, nice to have ("deseable", "valorable", "se valora", "no imprescindible").
- Implicit requirements (not literally asked but clearly needed, e.g. banking experience for a core banking project) get implicit=true and must=false unless the brief says otherwise.
- `source_quote`: the exact phrase from the brief each requirement comes from.
- weight 1-3 (importance), criticality 1-5 (how much the project fails without this role).
- min_years only if the brief states a minimum of years. start_date only if the brief gives a date or a delay (convert "in two months" to an ISO date from today = {today}); otherwise null.
- review_depth: how many candidates to screen for the role, 100-1000; higher for scarce or very specific profiles.
- Write title and summary in {lang_name}.

Vocabulary
Roles: {roles}
Areas: {areas}
Sectors: {sectors}
Skills: {skills}"""


def _clamp(v, lo, hi):
    return max(lo, min(hi, int(v)))


async def parse_brief(text: str, lang: str, today: str | None = None) -> Brief:
    from datetime import date

    v = get_vocab()
    system = SYSTEM.format(
        today=today or date.today().isoformat(),
        lang_name="Spanish" if lang == "es" else "English",
        roles=", ".join(v.roles), areas=", ".join(v.areas), sectors=", ".join(v.sectors), skills=", ".join(v.skills),
    )
    raw = await complete_json("extract", system, text, SCHEMA, max_tokens=8000)

    roles = raw.get("roles") or []
    if not roles:
        raise ValueError("The brief produced no roles")
    for i, role in enumerate(roles, start=1):
        role["id"] = f"r{i}"
        role["headcount"] = max(1, int(role.get("headcount") or 1))
        role["criticality"] = _clamp(role.get("criticality") or 3, 1, 5)
        role["review_depth"] = _clamp(role.get("review_depth") or 300, 100, settings.screen_max_per_role)
        for j, req in enumerate(role.get("requirements") or [], start=1):
            req["id"] = f"r{i}-q{j}"
            req["weight"] = _clamp(req.get("weight") or 1, 1, 3)
            req["synonyms"] = req.get("synonyms") or []
    raw["immediate"] = not raw.get("start_date")
    return Brief.model_validate(raw)


def brief_json(brief: Brief) -> str:
    return json.dumps(brief.model_dump(), ensure_ascii=False)
