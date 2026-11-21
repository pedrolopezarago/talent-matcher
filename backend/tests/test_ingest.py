from scripts.ingest import build_lang_levels, build_search_text, cefr_rank


def test_cefr_rank():
    assert cefr_rank("Nativo") == 7
    assert cefr_rank("c1") == 5
    assert cefr_rank("A1") == 1
    assert cefr_rank("??") == 0
    assert cefr_rank(None) == 0


def test_build_lang_levels_keeps_best_level():
    langs = [{"idioma": "Inglés", "nivel": "B2"}, {"idioma": "Inglés", "nivel": "C1"}, {"idioma": "Español", "nivel": "Nativo"}]
    assert build_lang_levels(langs) == {"Inglés": 5, "Español": 7}


def test_build_search_text_lowercases_and_includes_techs():
    row = {
        "rol": "Data Engineer", "puesto_actual": "Senior Data Engineer",
        "skills": [{"skill": "Kubernetes", "nivel": 3, "anios": 2.0}],
        "proyectos": [{"tecnologias": ["Kafka"]}],
        "experiencia": [{"tecnologias": ["Terraform"]}],
        "certificaciones": [{"nombre": "CKA", "anio": 2022}],
        "metodologias": ["Scrum"],
    }
    text = build_search_text(row)
    for term in ("data engineer", "kubernetes", "kafka", "terraform", "cka", "scrum"):
        assert term in text
