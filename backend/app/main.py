"""FastAPI entrypoint. Shapes follow shared/contract.ts. Hard filters live in SQL, never in the LLM."""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.llm import LLMError, usage
from backend.app.models import Brief, ParseRequest
from backend.app.pipeline.parse import parse_brief

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("api")

app = FastAPI(title="AI Talent Matcher")
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])


def _retrieval_mode() -> str:
    return "vector" if settings.embed_provider != "none" else "keyword"


@app.get("/api/health")
def health():
    return {"ok": True, "llm": settings.llm_provider, "retrieval": _retrieval_mode()}


@app.post("/api/brief/parse", response_model=Brief)
async def parse_route(body: ParseRequest):
    usage.reset()
    try:
        brief = await parse_brief(body.text, body.lang)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    except LLMError as e:
        raise HTTPException(status_code=502, detail=f"LLM failed: {e}") from e
    log.info("parse: %d roles, $%.4f", len(brief.roles), usage.usd())
    return brief
