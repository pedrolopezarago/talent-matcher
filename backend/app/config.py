"""Settings read from the environment (.env locally, never committed)."""
import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    llm_provider: str = "anthropic"
    llm_api_key: str = ""
    llm_base_url: str = ""
    llm_model_extract: str = "claude-sonnet-5-5"
    llm_model_screen: str = "claude-haiku-5-5"
    llm_model_judge: str = "claude-sonnet-5-5"
    llm_model_team: str = "claude-haiku-5-5"
    embed_provider: str = "none"
    embed_base_url: str = ""
    embed_api_key: str = ""
    embed_model: str = ""
    embed_dim: int = 512
    database_url: str = "postgresql://postgres:postgres@localhost:5432/talent"
    screen_max_per_role: int = 1000
    judge_top_n: int = 40
    max_llm_concurrency: int = 8
    max_usd_per_request: float = 0.75
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:5173"])


def load_settings(dotenv: bool = True) -> Settings:
    if dotenv:
        load_dotenv(ROOT / ".env", override=False)
    kwargs = {}
    for f in Settings.__dataclass_fields__.values():
        raw = os.getenv(f.name.upper())
        if raw is None or raw == "":
            continue
        if f.name == "cors_origins":
            kwargs[f.name] = [o.strip() for o in raw.split(",") if o.strip()]
        elif f.type is int:
            kwargs[f.name] = int(raw)
        elif f.type is float:
            kwargs[f.name] = float(raw)
        else:
            kwargs[f.name] = raw
    return Settings(**kwargs)


settings = load_settings()
