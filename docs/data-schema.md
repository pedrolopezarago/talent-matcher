# Data schema — `profiles.parquet`

190,000 rows (synthetic NTT DATA profiles). Inspected with `python scripts/inspect_parquet.py profiles.parquet`.

## Scalar columns
`employee_id` (e.g. `NTT0000001`), `nombre`, `apellidos`, `nombre_completo`, `email`, `pais`, `ciudad`, `area` (12), `rol` (87), `nivel_seniority` (Trainee 1.4k · Junior 31k · Mid 61k · Senior 49k · Lead 29k · Principal 19k), `puesto_actual`, `anios_experiencia` (int), `anios_en_ntt` (float), `fecha_incorporacion` (ISO), `sector_principal` (10), `disponibilidad`, `modalidad_trabajo`, `movilidad_internacional` (bool), `skills_texto` (comma-joined skill names), `resumen`.

`disponibilidad`: `Asignado` 155,997 · `Roll-off próximo (<3 meses)` 18,736 · `En banca` 15,267.

## Nested columns (stored as `jsonb`) and evidence display format
Evidence paths use these exact keys. `render()` in `backend/app/profile_view.py` produces the display value.

| Path | Item shape | Display value |
|---|---|---|
| `skills[i]` | `{skill, nivel 1–5, anios float}` (614 distinct skills, ~7.5 per person) | `"AWS (nivel 5, 6 años)"` (años without `.0`) |
| `skills[i].skill` | string | `"AWS"` |
| `proyectos[i]` | `{nombre, cliente_sector, anio, rol, tecnologias[]}` (~2 per person) | `"Automatización de motor de reservas (Turismo y Ocio, 2026)"` |
| `proyectos[i].cliente_sector` / `.nombre` / `.rol` | string | as is |
| `proyectos[i].tecnologias[j]` | string | as is |
| `experiencia[i]` | `{empresa, puesto, inicio, fin ("Actual"), ubicacion, tecnologias[], es_ntt}` | `"RPA Developer @ NTT DATA (2023-06-16 – Actual)"` |
| `experiencia[i].tecnologias[j]` / `.puesto` / `.empresa` | string | as is |
| `idiomas[i]` | `{idioma, nivel}`; levels Nativo, C2, C1, B2, B1, A2 (no A1 seen) | `"Inglés C1"` |
| `certificaciones[i]` | `{nombre, anio}` | `"AWS Solutions Architect (2022)"` |
| `estudios[i]` | `{nivel, titulo, institucion, anio_inicio, anio_fin}` | `"Grado en Ingeniería Industrial (FEI, 2023)"` |
| `metodologias[i]`, `habilidades_blandas[i]` | string | as is |
| scalar keys (`sector_principal`, `rol`, `area`, `nivel_seniority`, `anios_experiencia`, `puesto_actual`) | scalar | `str(value)` |

## Mapping from the spec's names
The spec's names match the data: `disponibilidad`, `anios_experiencia`, `rol`, `area`, `skills`, `proyectos`, `idiomas`, `certificaciones`. Seniority is `nivel_seniority`; current position `puesto_actual`; name `nombre_completo`; country `pais`; city `ciudad`.

## Derived columns (added at ingest)
- `lang_levels jsonb` — `{"Inglés": 5, ...}` with Nativo 7, C2 6, C1 5, B2 4, B1 3, A2 2, A1 1.
- `search_text text` — lowercased: rol, puesto_actual, skill names, project + experience technologies, certification names, metodologias.
- `embedding halfvec(512)` — NULL until an embedding job runs.

`email` is personal data: stored but never sent to the LLM.
