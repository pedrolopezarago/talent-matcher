from backend.app.profile_view import compact_card, judge_view, render, resolve_path
from backend.tests.helpers import profile

P = profile()


def test_resolve_path_nested():
    assert resolve_path(P, "proyectos[0].tecnologias[1]") == "Kubernetes"
    assert resolve_path(P, "skills[1].skill") == "AWS"
    assert resolve_path(P, "sector_principal") == "Turismo y Ocio"


def test_resolve_path_out_of_range_is_none():
    assert resolve_path(P, "skills[99]") is None
    assert resolve_path(P, "proyectos[0].nope") is None


def test_resolve_path_garbage_is_none():
    for bad in ("]]x", "", "skills[-1]", "skills[a]", "email", "skills..skill"):
        assert resolve_path(P, bad) is None


def test_render_formats():
    assert render(P, "skills[1]") == "AWS (nivel 5, 6 años)"
    assert render(P, "skills[2]") == "Python (nivel 3, 1.5 años)"
    assert render(P, "idiomas[0]") == "Inglés C1"
    assert render(P, "certificaciones[0]") == "AWS Solutions Architect (2022)"
    assert render(P, "proyectos[0]") == "Automatización de motor de reservas (Turismo y Ocio, 2026)"
    assert render(P, "proyectos[0].cliente_sector") == "Turismo y Ocio"
    assert render(P, "experiencia[0]") == "RPA Developer @ NTT DATA (2023-06-16 – Actual)"
    assert render(P, "anios_experiencia") == "3"
    assert render(P, "skills[9]") is None


def test_views_never_leak_email():
    assert "nttdata.com" not in compact_card(P)
    assert "email" not in judge_view(P)
    assert "AWS" in compact_card(P)
