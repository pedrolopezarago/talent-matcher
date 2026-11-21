from backend.app.models import Brief, Requirement, Role


def req(id, type="skill", value="Python", must=True, level=None, weight=1, synonyms=None):
    return Requirement(id=id, type=type, value=value, level=level, must=must, implicit=False, weight=weight,
                       source_quote=value, synonyms=synonyms or [])


def role(reqs, id="r1", title="Backend Developer Java", min_years=None, headcount=1, criticality=3, review_depth=100):
    return Role(id=id, title=title, headcount=headcount, min_years=min_years, criticality=criticality,
                review_depth=review_depth, requirements=reqs)


def brief(roles, start_date=None):
    return Brief(title="t", summary="s", start_date=start_date, immediate=start_date is None, roles=roles)


def profile(employee_id="NTT0000001", **over):
    p = {
        "employee_id": employee_id, "nombre_completo": "Antony da Luz", "email": "antony.da@nttdata.com",
        "pais": "Brasil", "ciudad": "São Paulo", "area": "Automatización y RPA", "rol": "RPA Developer",
        "nivel_seniority": "Mid", "puesto_actual": "RPA Developer", "anios_experiencia": 3, "anios_en_ntt": 3.4,
        "sector_principal": "Turismo y Ocio", "disponibilidad": "En banca", "modalidad_trabajo": "Híbrido",
        "movilidad_internacional": False, "resumen": "RPA developer.",
        "skills": [{"skill": "UiPath", "nivel": 2, "anios": 3.0}, {"skill": "AWS", "nivel": 5, "anios": 6.0},
                   {"skill": "Python", "nivel": 3, "anios": 1.5}],
        "metodologias": ["ITIL"], "habilidades_blandas": ["Autonomía"],
        "estudios": [{"nivel": "Grado", "titulo": "Grado en Ingeniería Industrial", "institucion": "FEI", "anio_inicio": 2019, "anio_fin": 2023}],
        "certificaciones": [{"nombre": "AWS Solutions Architect", "anio": 2022}],
        "experiencia": [{"empresa": "NTT DATA", "puesto": "RPA Developer", "inicio": "2023-06-16", "fin": "Actual",
                         "ubicacion": "São Paulo", "tecnologias": ["UiPath", "Orchestrator"], "es_ntt": True}],
        "proyectos": [{"nombre": "Automatización de motor de reservas", "cliente_sector": "Turismo y Ocio", "anio": 2026,
                       "rol": "RPA Developer", "tecnologias": ["RPA", "Kubernetes"]}],
        "idiomas": [{"idioma": "Inglés", "nivel": "C1"}, {"idioma": "Portugués", "nivel": "Nativo"}],
    }
    p.update(over)
    return p
