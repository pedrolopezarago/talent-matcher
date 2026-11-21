import copy

import pytest
from fastapi.testclient import TestClient

from backend.app import llm
from backend.app.pipeline import parse
from backend.app.vocab import Vocab

VOCAB = Vocab(areas=["Data & AI"], roles=["AI Engineer"], sectors=["Retail"], skills=["Azure", "RAG", "React", "LangChain"],
              modal_area_by_role={})

RAW = {
    "title": "AI assistant for retail", "summary": "Customer-service assistant", "sector": "Retail",
    "start_date": None,
    "roles": [{
        "title": "AI Engineer", "headcount": 1, "seniority": "Senior", "min_years": None, "criticality": 5,
        "review_depth": 300,
        "requirements": [
            {"type": "skill", "value": "RAG", "level": None, "must": True, "implicit": False, "weight": 3,
             "source_quote": "building RAG solutions", "synonyms": ["LangChain"]},
            {"type": "sector", "value": "Retail", "level": None, "must": False, "implicit": False, "weight": 1,
             "source_quote": "retail is a plus", "synonyms": []},
        ],
    }],
}


@pytest.fixture(autouse=True)
def _setup(monkeypatch):
    monkeypatch.setattr(parse, "get_vocab", lambda: VOCAB)
    llm.fake_responses.clear()
    yield
    llm.fake_responses.clear()


def _with(**role_changes):
    raw = copy.deepcopy(RAW)
    raw["roles"][0].update(role_changes)
    return raw


async def test_review_depth_clamped():
    llm.fake_responses["extract"] = lambda u: _with(review_depth=20)
    assert (await parse.parse_brief("x", "en")).roles[0].review_depth == 100
    llm.fake_responses["extract"] = lambda u: _with(review_depth=5000)
    assert (await parse.parse_brief("x", "en")).roles[0].review_depth == 1000


async def test_no_date_means_immediate():
    llm.fake_responses["extract"] = lambda u: copy.deepcopy(RAW)
    b = await parse.parse_brief("x", "en")
    assert b.immediate is True
    assert b.roles[0].id == "r1"
    assert [r.id for r in b.roles[0].requirements] == ["r1-q1", "r1-q2"]


async def test_weights_and_criticality_clamped():
    raw = _with(criticality=9)
    raw["roles"][0]["requirements"][0]["weight"] = 7
    llm.fake_responses["extract"] = lambda u: raw
    b = await parse.parse_brief("x", "en")
    assert b.roles[0].criticality == 5
    assert b.roles[0].requirements[0].weight == 3


def test_route_rejects_empty_roles_and_empty_text():
    from backend.app.main import app

    client = TestClient(app)
    llm.fake_responses["extract"] = lambda u: {**copy.deepcopy(RAW), "roles": []}
    assert client.post("/api/brief/parse", json={"text": "hello", "lang": "en"}).status_code == 422
    assert client.post("/api/brief/parse", json={"text": "", "lang": "en"}).status_code == 422


def test_route_llm_failure_is_502():
    from backend.app.main import app

    def boom(u):
        raise RuntimeError("down")

    llm.fake_responses["extract"] = boom
    r = TestClient(app).post("/api/brief/parse", json={"text": "hello"})
    assert r.status_code == 502


async def test_location_requirements_removed():
    raw = copy.deepcopy(RAW)
    reqs = raw["roles"][0]["requirements"]
    reqs.append({"type": "other", "value": "Hybrid work in Madrid", "level": None, "must": True, "implicit": False,
                 "weight": 2, "source_quote": "hybrid in Madrid", "synonyms": []})
    reqs.append({"type": "other", "value": "Trabajo presencial", "level": None, "must": True, "implicit": False,
                 "weight": 1, "source_quote": "presencial", "synonyms": []})
    llm.fake_responses["extract"] = lambda u: raw
    b = await parse.parse_brief("x", "en")
    assert [r.value for r in b.roles[0].requirements] == ["RAG", "Retail"]
    assert [r.id for r in b.roles[0].requirements] == ["r1-q1", "r1-q2"]
