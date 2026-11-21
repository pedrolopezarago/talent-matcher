"""How profiles are shown to the LLM, and how evidence paths are resolved and rendered by code.

The LLM only ever cites a `path` (e.g. "skills[1]", "proyectos[0].tecnologias[2]"). The display value
is produced here from the stored profile, so it can never be invented. Formats: docs/data-schema.md.
"""
import re
from typing import Any

JUDGE_KEYS = [
    "employee_id", "rol", "puesto_actual", "area", "nivel_seniority", "anios_experiencia", "anios_en_ntt",
    "sector_principal", "pais", "ciudad", "modalidad_trabajo", "movilidad_internacional", "disponibilidad",
    "skills", "proyectos", "experiencia", "certificaciones", "idiomas", "metodologias", "habilidades_blandas",
    "estudios", "resumen",
]
_ALLOWED_ROOTS = set(JUDGE_KEYS) - {"employee_id"}
_TOKEN = re.compile(r"([A-Za-z_]+)((?:\[\d+\])*)")


def _num(x) -> str:
    if isinstance(x, float) and x.is_integer():
        return str(int(x))
    return str(x)


def resolve_path(p: dict, path: str) -> Any | None:
    """Follow a dotted/indexed path. Returns None on anything malformed or missing; never raises."""
    if not path or not isinstance(path, str):
        return None
    parts = path.split(".")
    if not parts or parts[0].split("[")[0] not in _ALLOWED_ROOTS:
        return None
    cur: Any = p
    for part in parts:
        m = _TOKEN.fullmatch(part)
        if not m:
            return None
        key, idx = m.group(1), m.group(2)
        if not isinstance(cur, dict) or key not in cur:
            return None
        cur = cur[key]
        for i in re.findall(r"\[(\d+)\]", idx):
            if not isinstance(cur, list) or int(i) >= len(cur):
                return None
            cur = cur[int(i)]
    return cur


def _fmt_item(root: str, v: dict) -> str | None:
    if root == "skills":
        return f"{v.get('skill')} (nivel {v.get('nivel')}, {_num(v.get('anios'))} años)"
    if root == "idiomas":
        return f"{v.get('idioma')} {v.get('nivel')}"
    if root == "certificaciones":
        return f"{v.get('nombre')} ({v.get('anio')})"
    if root == "proyectos":
        return f"{v.get('nombre')} ({v.get('cliente_sector')}, {v.get('anio')})"
    if root == "experiencia":
        return f"{v.get('puesto')} @ {v.get('empresa')} ({v.get('inicio')} – {v.get('fin')})"
    if root == "estudios":
        return f"{v.get('titulo')} ({v.get('institucion')}, {v.get('anio_fin')})"
    return None


def render(p: dict, path: str) -> str | None:
    v = resolve_path(p, path)
    if v is None:
        return None
    if isinstance(v, dict):
        return _fmt_item(path.split(".")[0].split("[")[0], v)
    if isinstance(v, list):
        return None
    if isinstance(v, bool):
        return "sí" if v else "no"
    return _num(v)


def compact_card(p: dict) -> str:
    """~150 tokens: what the screening pass needs to score a candidate."""
    skills = sorted(p.get("skills") or [], key=lambda s: (-(s.get("nivel") or 0), -(s.get("anios") or 0)))[:10]
    techs = []
    for item in (p.get("proyectos") or []) + (p.get("experiencia") or []):
        for t in item.get("tecnologias") or []:
            if t not in techs:
                techs.append(t)
    sectors = sorted({pr.get("cliente_sector") for pr in p.get("proyectos") or [] if pr.get("cliente_sector")})
    return (
        f"{p['employee_id']} | {p.get('rol')} ({p.get('nivel_seniority')}, {p.get('anios_experiencia')}y) | {p.get('area')}\n"
        f"  skills: {', '.join(f'{s.get('skill')}:{s.get('nivel')}' for s in skills)}\n"
        f"  project/experience tech: {', '.join(techs[:15])}\n"
        f"  sectors: {', '.join(sectors) or p.get('sector_principal')} | certs: {', '.join(c.get('nombre') for c in p.get('certificaciones') or []) or '-'}"
        f" | langs: {', '.join(f'{i.get('idioma')} {i.get('nivel')}' for i in p.get('idiomas') or [])}"
    )


def judge_view(p: dict) -> dict:
    """Profile restricted to judgeable fields, keys exactly as stored so paths resolve."""
    return {k: p.get(k) for k in JUDGE_KEYS if k in p}
