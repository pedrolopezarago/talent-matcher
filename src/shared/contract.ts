// API contract — source of truth for frontend (TS) and backend (Pydantic mirror in backend/app/models.py).
// Change only after telling the other builder. See .plans/ai-talent-matcher-spec.md §7.

export type Lang = "es" | "en";

export type RequirementType =
  | "skill" | "sector" | "language" | "certification" | "methodology"
  | "soft_skill" | "seniority" | "client_facing" | "other";

export interface Requirement {
  id: string;               // "r1-q3"
  type: RequirementType;
  value: string;            // normalised to data vocabulary, e.g. "Kubernetes", "Banca y Finanzas", "Inglés"
  level?: string;           // e.g. "C1" for languages, "Senior" for seniority
  must: boolean;            // false for "not essential" / "deseable" / "valorable" — never a filter
  implicit: boolean;        // inferred, not literally asked (e.g. banking for core banking)
  weight: number;           // 1–3
  source_quote: string;     // phrase from the brief it came from
  synonyms: string[];       // related skills from the vocabulary
}

export interface Role {
  id: string;               // "r1"
  title: string;
  headcount: number;
  seniority?: string;       // Trainee | Junior | Mid | Senior | Lead | Principal
  min_years?: number;       // hard filter in code when present
  criticality: number;      // 1–5, used by the team optimiser
  review_depth: number;     // K chosen by the LLM, clamped 20–150 by code
  requirements: Requirement[];
}

export interface Brief {
  title: string;
  summary: string;
  sector?: string;
  start_date?: string;      // ISO date; absent → assume immediate start (UI says so)
  immediate: boolean;
  roles: Role[];
}

export type Availability = "En banca" | "Roll-off próximo (<3 meses)" | "Asignado";

export interface Evidence { path: string; value: string } // path into the profile, e.g. "proyectos[2].tecnologias[1]"

export interface Coverage {
  req_id: string;
  status: "met" | "partial" | "missing";
  evidence: Evidence[];
}

export interface Candidate {
  employee_id: string;
  name: string;
  current_role: string;
  area: string;
  seniority: string;
  availability: Availability;
  country: string;
  city: string;
  years_experience: number;
  fit: number;              // 0–100, computed in code
  similarity: number;       // 0–1 vector similarity
  coverage: Coverage[];
  strengths: string[];
  gaps: string[];
  risks: string[];
  hidden: {
    different_area: boolean;
    vocab_bridges: { asked: string; found: string }[];
  };
}

export interface Funnel { total: number; after_filters: number; reviewed: number; ranked: number }

export interface RoleResult {
  role_id: string;
  availability_rule: string; // human-readable, e.g. "Immediate start → only 'En banca'"
  funnel: Funnel;
  candidates: Candidate[];
  reserve: Candidate[];      // strong fits currently 'Asignado'
}

export interface MatchResult {
  roles: RoleResult[];
  grounding: { claims: number; dropped: number };
}

export interface TeamSlot { role_id: string; slot: number; employee_id: string; name: string; fit: number }

export interface TeamResult {
  optimal: TeamSlot[];
  greedy: TeamSlot[];
  optimal_score: number;
  greedy_score: number;
  swaps: { role_id: string; greedy: string; optimal: string }[];
  explanation: string;
  joint_coverage: { req_value: string; covered_by: string[] }[];
}

// Endpoints
// POST /api/brief/parse  {text, lang}   → Brief
// POST /api/match        {brief}        → MatchResult
// POST /api/team         {brief, match} → TeamResult
// GET  /api/profile/:id                 → raw profile (all parquet fields)
// GET  /api/health
