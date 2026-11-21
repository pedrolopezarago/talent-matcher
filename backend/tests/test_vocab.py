from backend.tests.conftest import needs_db


@needs_db
def test_vocab_counts():
    from backend.app.vocab import get_vocab

    v = get_vocab()
    assert len(v.skills) == 614
    assert len(v.roles) == 87
    assert len(v.areas) == 12
    assert len(v.sectors) == 10
    assert v.modal_area_by_role["Backend Developer Java"] == "Software Engineering"


@needs_db
def test_profile_counts():
    from backend.app.db import fetch_all

    rows = {r["disponibilidad"]: r["n"] for r in fetch_all("select disponibilidad, count(*) n from profiles group by 1")}
    assert sum(rows.values()) == 190000
    assert rows["En banca"] == 15267
