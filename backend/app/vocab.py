"""Data vocabulary given to the LLM so requirements map onto words that exist in the data."""
from dataclasses import dataclass
from functools import lru_cache

from backend.app.db import fetch_all


@dataclass(frozen=True)
class Vocab:
    areas: list[str]
    roles: list[str]
    sectors: list[str]
    skills: list[str]
    modal_area_by_role: dict[str, str]


@lru_cache(maxsize=1)
def get_vocab() -> Vocab:
    areas = [r["v"] for r in fetch_all("SELECT DISTINCT area v FROM profiles ORDER BY 1")]
    roles = [r["v"] for r in fetch_all("SELECT DISTINCT rol v FROM profiles ORDER BY 1")]
    sectors = [r["v"] for r in fetch_all(
        "SELECT DISTINCT v FROM (SELECT sector_principal v FROM profiles "
        "UNION SELECT p->>'cliente_sector' FROM profiles, jsonb_array_elements(proyectos) p) s "
        "WHERE v IS NOT NULL ORDER BY 1")]
    skills = [r["v"] for r in fetch_all(
        "SELECT DISTINCT s->>'skill' v FROM profiles, jsonb_array_elements(skills) s ORDER BY 1")]
    modal = {r["rol"]: r["area"] for r in fetch_all(
        "SELECT rol, mode() WITHIN GROUP (ORDER BY area) area FROM profiles GROUP BY rol")}
    return Vocab(areas, roles, sectors, skills, modal)
