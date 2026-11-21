"""FastAPI entrypoint. Shapes follow shared/contract.ts. Hard filters live in SQL, never in the LLM."""
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.llm import LLMError, usage
from backend.app.db import get_profile
from backend.app.models import Brief, MatchRequest, MatchResult, ParseRequest, TeamRequest, TeamResult
from backend.app.pipeline.match import match
from backend.app.pipeline.parse import parse_brief
from backend.app.pipeline.team import build_team, explain, joint_coverage, swaps

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


@app.post("/api/match", response_model=MatchResult)
async def match_route(body: MatchRequest):
    usage.reset()
    result = await match(body.brief, body.lang)
    log.info("match: %d roles, %d LLM calls, $%.4f", len(result.roles), usage.calls, usage.usd())
    return result


@app.get("/api/profile/{employee_id}")
def profile_route(employee_id: str):
    p = get_profile(employee_id)
    if p is None:
        raise HTTPException(status_code=404, detail="profile not found")
    return p


@app.post("/api/team", response_model=TeamResult)
async def team_route(body: TeamRequest):
    usage.reset()
    optimal, greedy, so, sg = build_team(body.brief, body.match)
    sw = swaps(optimal, greedy)
    text = await explain(optimal, greedy, so, sg, sw, body.lang)
    log.info("team: optimal %.1f vs greedy %.1f, $%.4f", so, sg, usage.usd())
    return TeamResult(optimal=optimal, greedy=greedy, optimal_score=so, greedy_score=sg, swaps=sw, explanation=text,
                      joint_coverage=joint_coverage(body.brief, body.match, optimal))
