import os

os.environ["LLM_PROVIDER"] = "fake"
os.environ["EMBED_PROVIDER"] = "none"
# Pin knobs so the local .env (loaded with override=False) cannot change test results.
os.environ["SCREEN_MAX_PER_ROLE"] = "1000"
os.environ["JUDGE_TOP_N"] = "40"
os.environ["MAX_USD_PER_REQUEST"] = "0.75"

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
