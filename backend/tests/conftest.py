import os

os.environ["LLM_PROVIDER"] = "fake"
os.environ["EMBED_PROVIDER"] = "none"

import pytest


def _db_up() -> bool:
    try:
        import psycopg

        from backend.app.config import settings

        with psycopg.connect(settings.database_url, connect_timeout=2) as c:
            return c.execute("select count(*) from profiles").fetchone()[0] > 0
    except Exception:
        return False


DB_UP = _db_up()
needs_db = pytest.mark.skipif(not DB_UP, reason="Postgres with profiles not available")
