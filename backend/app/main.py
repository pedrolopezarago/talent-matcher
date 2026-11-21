"""FastAPI entrypoint. STUB: endpoints return the frontend mocks until the real pipeline lands.
Pipeline steps are in .plans/ai-talent-matcher-spec.md §5 — keep filters in code, never in the LLM."""
import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

MOCKS = Path(__file__).resolve().parents[2] / "src" / "talent" / "mocks"

app = FastAPI(title="AI Talent Matcher")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def _mock(name: str):
    return json.loads((MOCKS / f"{name}.json").read_text())


@app.get("/api/health")
def health():
    return {"ok": True, "mode": "mock"}


@app.post("/api/brief/parse")
def parse_brief(body: dict):
    return _mock("brief")  # TODO step 1: LLM structured extraction


@app.post("/api/match")
def match(body: dict):
    return _mock("match")  # TODO steps 2–7: filters → pgvector → judge → ground → score → hidden flags


@app.post("/api/team")
def team(body: dict):
    return _mock("team")  # TODO step 8: linear_sum_assignment vs greedy


@app.get("/api/profile/{employee_id}")
def profile(employee_id: str):
    return {"employee_id": employee_id, "mock": True}  # TODO: SELECT from profiles
