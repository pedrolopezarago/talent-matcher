"""Load profiles.parquet into Postgres. Idempotent: upsert by employee_id.

Usage: python -m scripts.ingest profiles.parquet
"""
import sys

CEFR = {"NATIVO": 7, "C2": 6, "C1": 5, "B2": 4, "B1": 3, "A2": 2, "A1": 1}
SCALARS = [
    "employee_id", "nombre", "apellidos", "nombre_completo", "email", "pais", "ciudad", "area", "rol",
    "nivel_seniority", "puesto_actual", "anios_experiencia", "anios_en_ntt", "fecha_incorporacion",
    "sector_principal", "disponibilidad", "modalidad_trabajo", "movilidad_internacional", "skills_texto", "resumen",
]
NESTED = ["skills", "metodologias", "habilidades_blandas", "estudios", "certificaciones", "experiencia", "proyectos", "idiomas"]

DDL = """
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS profiles (
  employee_id text PRIMARY KEY,
  nombre text, apellidos text, nombre_completo text, email text, pais text, ciudad text,
  area text, rol text, nivel_seniority text, puesto_actual text,
  anios_experiencia int, anios_en_ntt double precision, fecha_incorporacion text,
  sector_principal text, disponibilidad text, modalidad_trabajo text, movilidad_internacional boolean,
  skills_texto text, resumen text,
  skills jsonb, metodologias jsonb, habilidades_blandas jsonb, estudios jsonb,
  certificaciones jsonb, experiencia jsonb, proyectos jsonb, idiomas jsonb,
  lang_levels jsonb, search_text text, embedding halfvec(512)
);
CREATE INDEX IF NOT EXISTS profiles_disp_idx ON profiles (disponibilidad);
CREATE INDEX IF NOT EXISTS profiles_years_idx ON profiles (anios_experiencia);
CREATE INDEX IF NOT EXISTS profiles_pais_idx ON profiles (pais);
CREATE INDEX IF NOT EXISTS profiles_rol_idx ON profiles (rol);
"""


def cefr_rank(level) -> int:
    if not level:
        return 0
    return CEFR.get(str(level).strip().upper(), 0)


def build_lang_levels(idiomas) -> dict[str, int]:
    out: dict[str, int] = {}
    for d in idiomas or []:
        name = d.get("idioma")
        if name:
            out[name] = max(out.get(name, 0), cefr_rank(d.get("nivel")))
    return out


def build_search_text(row: dict) -> str:
    parts = [row.get("rol") or "", row.get("puesto_actual") or ""]
    parts += [s.get("skill") or "" for s in row.get("skills") or []]
    for key in ("proyectos", "experiencia"):
        for item in row.get(key) or []:
            parts += list(item.get("tecnologias") or [])
    parts += [c.get("nombre") or "" for c in row.get("certificaciones") or []]
    parts += list(row.get("metodologias") or [])
    return " | ".join(p for p in parts if p).lower()


def main(path: str) -> None:
    import pyarrow.parquet as pq
    from psycopg.types.json import Jsonb

    from backend.app.db import connect

    cols = SCALARS + NESTED + ["lang_levels", "search_text"]
    placeholders = ", ".join(["%s"] * len(cols))
    updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c != "employee_id")
    sql = f"INSERT INTO profiles ({', '.join(cols)}) VALUES ({placeholders}) ON CONFLICT (employee_id) DO UPDATE SET {updates}"

    pf = pq.ParquetFile(path)
    with connect() as conn:
        conn.execute(DDL)
        n = 0
        for batch in pf.iter_batches(batch_size=5000):
            rows = batch.to_pylist()
            values = []
            for r in rows:
                values.append(
                    [r.get(c) for c in SCALARS]
                    + [Jsonb(r.get(c) or []) for c in NESTED]
                    + [Jsonb(build_lang_levels(r.get("idiomas"))), build_search_text(r)]
                )
            with conn.cursor() as cur:
                cur.executemany(sql, values)
            conn.commit()
            n += len(rows)
            print(f"{n} rows", flush=True)
        conn.execute("ANALYZE profiles")
        conn.commit()


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "profiles.parquet")
