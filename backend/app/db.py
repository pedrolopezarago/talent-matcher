"""Postgres access. Rows come back as dicts."""
import atexit
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from backend.app.config import settings

_pool: ConnectionPool | None = None


def connect() -> psycopg.Connection:
    """A standalone connection (scripts)."""
    return psycopg.connect(settings.database_url, row_factory=dict_row)


def _get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(settings.database_url, min_size=1, max_size=10,
                               kwargs={"row_factory": dict_row}, open=True)
        atexit.register(close_pool)
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def conn():
    with _get_pool().connection() as c:
        yield c


def fetch_all(sql: str, params=None) -> list[dict]:
    with conn() as c:
        return c.execute(sql, params).fetchall()


def fetch_one(sql: str, params=None) -> dict | None:
    with conn() as c:
        return c.execute(sql, params).fetchone()




def get_profile(employee_id: str) -> dict | None:
    row = fetch_one("SELECT * FROM profiles WHERE employee_id = %s", (employee_id,))
    if row:
        row.pop("embedding", None)
        row.pop("search_text", None)
    return row


def get_profiles(ids: list[str]) -> dict[str, dict]:
    if not ids:
        return {}
    rows = fetch_all("SELECT * FROM profiles WHERE employee_id = ANY(%s)", (ids,))
    out = {}
    for r in rows:
        r.pop("embedding", None)
        r.pop("search_text", None)
        out[r["employee_id"]] = r
    return out
