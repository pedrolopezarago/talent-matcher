import type { Brief, Lang, MatchResult, TeamResult } from "../../shared/contract";
import briefMock from "./mocks/brief.json";
import matchMock from "./mocks/match.json";
import teamMock from "./mocks/team.json";

const API = import.meta.env.VITE_API_URL as string | undefined;
export const usingMocks = !API;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(x: T): T => structuredClone(x);

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export async function parseBrief(text: string, lang: Lang): Promise<Brief> {
  if (usingMocks) { await wait(900); return clone(briefMock as Brief); }
  return post("/api/brief/parse", { text, lang });
}

export async function match(brief: Brief): Promise<MatchResult> {
  if (usingMocks) { await wait(1400); return clone(matchMock as MatchResult); }
  return post("/api/match", { brief });
}

export async function team(brief: Brief, m: MatchResult): Promise<TeamResult> {
  if (usingMocks) { await wait(900); return clone(teamMock as TeamResult); }
  return post("/api/team", { brief, match: m });
}

export const demoData = {
  brief: () => clone(briefMock as Brief),
  match: () => clone(matchMock as MatchResult),
};
