"""Pydantic mirror of shared/contract.ts. Keep both in sync."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

Lang = Literal["es", "en"]
RequirementType = Literal[
    "skill", "sector", "language", "certification", "methodology",
    "soft_skill", "seniority", "client_facing", "other",
]
Availability = Literal["En banca", "Roll-off próximo (<3 meses)", "Asignado"]


class Requirement(BaseModel):
    id: str
    type: RequirementType
    value: str
    level: Optional[str] = None
    must: bool
    implicit: bool
    weight: int
    source_quote: str
    synonyms: list[str] = []


class Role(BaseModel):
    id: str
    title: str
    headcount: int
    seniority: Optional[str] = None
    min_years: Optional[int] = None
    criticality: int
    review_depth: int
    requirements: list[Requirement]


class Brief(BaseModel):
    title: str
    summary: str
    sector: Optional[str] = None
    start_date: Optional[str] = None
    immediate: bool
    roles: list[Role]


class Evidence(BaseModel):
    path: str
    value: str


class Coverage(BaseModel):
    req_id: str
    status: Literal["met", "partial", "missing"]
    evidence: list[Evidence]


class VocabBridge(BaseModel):
    asked: str
    found: str


class Hidden(BaseModel):
    different_area: bool
    vocab_bridges: list[VocabBridge]


class Candidate(BaseModel):
    employee_id: str
    name: str
    current_role: str
    area: str
    seniority: str
    availability: Availability
    country: str
    city: str
    years_experience: float
    fit: float
    similarity: float
    coverage: list[Coverage]
    strengths: list[str]
    gaps: list[str]
    risks: list[str]
    hidden: Hidden


class Funnel(BaseModel):
    total: int
    after_filters: int
    reviewed: int
    ranked: int


class RoleResult(BaseModel):
    role_id: str
    availability_rule: str
    funnel: Funnel
    candidates: list[Candidate]
    reserve: list[Candidate]


class Grounding(BaseModel):
    claims: int
    dropped: int


class MatchResult(BaseModel):
    roles: list[RoleResult]
    grounding: Grounding
    retrieval: Optional[Literal["vector", "keyword"]] = None


class TeamSlot(BaseModel):
    role_id: str
    slot: int
    employee_id: str
    name: str
    fit: float


class Swap(BaseModel):
    role_id: str
    greedy: str
    optimal: str


class JointCoverage(BaseModel):
    req_value: str
    covered_by: list[str]


class TeamResult(BaseModel):
    optimal: list[TeamSlot]
    greedy: list[TeamSlot]
    optimal_score: float
    greedy_score: float
    swaps: list[Swap]
    explanation: str
    joint_coverage: list[JointCoverage]


class ParseRequest(BaseModel):
    text: str = Field(min_length=1)
    lang: Lang = "en"


class MatchRequest(BaseModel):
    brief: Brief
    lang: Lang = "en"


class TeamRequest(BaseModel):
    brief: Brief
    match: MatchResult
    lang: Lang = "en"
