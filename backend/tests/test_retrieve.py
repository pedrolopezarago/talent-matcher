import time

from backend.tests.conftest import needs_db
from backend.tests.helpers import req, role


@needs_db
def test_filtered_count_le_total():
    from backend.app.pipeline.filters import build_where, count, total_profiles

    where, params = build_where(role([], min_years=5), ["En banca"])
    n = count(where, params)
    assert 0 < n < 15267 < total_profiles() == 190000


@needs_db
def test_keyword_retrieve_orders_desc_and_respects_filter():
    from backend.app.db import get_profiles
    from backend.app.pipeline.filters import build_where
    from backend.app.pipeline.retrieve import keyword_retrieve

    r = role([req("q1", value="Java", weight=3), req("q2", value="Kafka", synonyms=["RabbitMQ"]),
              req("q3", type="sector", value="Banca", must=False)])
    where, params = build_where(r, ["En banca", "Roll-off próximo (<3 meses)"])
    t = time.time()
    hits = keyword_retrieve(r, where, params, limit=1000)
    elapsed = time.time() - t
    assert 0 < len(hits) <= 1000
    scores = [s for _, s in hits]
    assert scores == sorted(scores, reverse=True) and 0 < scores[0] <= 1
    profiles = get_profiles([i for i, _ in hits[:50]])
    assert all(p["disponibilidad"] != "Asignado" for p in profiles.values())
    top = profiles[hits[0][0]]
    assert "java" in top["skills_texto"].lower()
    assert elapsed < 5
