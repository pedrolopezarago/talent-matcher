import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Brief, MatchResult, TeamResult } from "@/shared/contract";
import briefJson from "@/talent/mocks/brief.json";
import matchJson from "@/talent/mocks/match.json";
import teamJson from "@/talent/mocks/team.json";
import { TeamView } from "@/talent/components/TeamView";
import { analyseTeamRisks } from "@/talent/team-risks";

const brief = briefJson as Brief;
const match = matchJson as MatchResult;
const team = teamJson as TeamResult;

afterEach(cleanup);

describe("Team weakness and risk analysis", () => {
  it("flags a must-have that nobody meets fully and preserves partial and missing evidence", () => {
    const risks = analyseTeamRisks(brief, match, team);
    const kafka = risks.find((risk) => risk.subject === "Kafka" && risk.kind === "coveragePartial");
    expect(kafka).toMatchObject({ severity: "critical", roleTitle: "Java backend developer" });
    expect(kafka?.coverage).toEqual([
      { name: "Elena Navarro Pons", status: "partial" },
      { name: "Javier Ortega Ruiz", status: "missing" },
    ]);
  });

  it("downgrades an uncovered nice-to-have to a minor warning", () => {
    const niceBrief: Brief = {
      ...brief,
      roles: brief.roles.map((role) => role.id === "r2" ? {
        ...role,
        requirements: role.requirements.map((requirement) => requirement.value === "Kafka" ? { ...requirement, must: false } : requirement),
      } : role),
    };
    const kafka = analyseTeamRisks(niceBrief, match, team).find((risk) => risk.subject === "Kafka" && risk.kind === "coveragePartial");
    expect(kafka?.severity).toBe("warning");
  });

  it("detects a requirement that depends on one person", () => {
    const risk = analyseTeamRisks(brief, match, team).find((item) => item.kind === "singlePoint" && item.subject === "AWS");
    expect(risk).toMatchObject({ severity: "warning", person: "Lucía Ferrer Gil" });
  });

  it("warns about a roll-off and treats an assigned person as critical", () => {
    const rollOffTeam: TeamResult = {
      ...team,
      optimal: team.optimal.map((slot) => slot.employee_id === "NTT0000303" ? { ...slot, employee_id: "NTT0000707", name: "Sofía Delgado Marín" } : slot),
    };
    const rollOff = analyseTeamRisks(brief, match, rollOffTeam).find((risk) => risk.kind === "availability");
    expect(rollOff).toMatchObject({ severity: "warning", person: "Sofía Delgado Marín", startDate: "2027-01-20" });

    const assigned = match.roles[0]?.reserve[0];
    if (!assigned) throw new Error("Missing assigned test profile");
    const assignedMatch: MatchResult = {
      ...match,
      roles: match.roles.map((role) => role.role_id === "r1" ? { ...role, candidates: [assigned], reserve: [] } : role),
    };
    const assignedTeam: TeamResult = {
      ...team,
      optimal: team.optimal.map((slot) => slot.role_id === "r1" ? { ...slot, employee_id: assigned.employee_id, name: assigned.name } : slot),
    };
    const risk = analyseTeamRisks(brief, assignedMatch, assignedTeam).find((item) => item.kind === "availability");
    expect(risk).toMatchObject({ severity: "critical", person: "Carmen Vidal Soler" });
  });

  it("detects seniority and minimum-experience mismatches", () => {
    const stricterBrief: Brief = {
      ...brief,
      roles: brief.roles.map((role) => role.id === "r2" ? { ...role, seniority: "Senior", min_years: 6 } : role),
    };
    const risks = analyseTeamRisks(stricterBrief, match, team);
    expect(risks.find((risk) => risk.kind === "seniority" && risk.person === "Javier Ortega Ruiz")).toMatchObject({ expected: "Senior", actual: "Mid" });
    expect(risks.find((risk) => risk.kind === "experience" && risk.person === "Javier Ortega Ruiz")).toMatchObject({ expected: "6", actual: "5", severity: "critical" });
  });

  it("returns a clean state when requirements, availability and seniority are covered", () => {
    const architectRole = brief.roles[0];
    const lucia = match.roles[0]?.candidates.find((candidate) => candidate.employee_id === "NTT0000101");
    const elena = match.roles[0]?.candidates.find((candidate) => candidate.employee_id === "NTT0000404");
    if (!architectRole || !lucia || !elena) throw new Error("Missing clean-team fixtures");
    const cleanBrief: Brief = {
      ...brief,
      roles: [{ ...architectRole, headcount: 2, requirements: architectRole.requirements.filter((requirement) => ["AWS", "Terraform"].includes(requirement.value)) }],
    };
    const cleanMatch: MatchResult = { ...match, roles: [{ ...match.roles[0]!, candidates: [lucia, elena], reserve: [] }] };
    const cleanTeam: TeamResult = {
      ...team,
      optimal: [
        { role_id: "r1", slot: 1, employee_id: lucia.employee_id, name: lucia.name, fit: lucia.fit },
        { role_id: "r1", slot: 2, employee_id: elena.employee_id, name: elena.name, fit: elena.fit },
      ],
    };
    expect(analyseTeamRisks(cleanBrief, cleanMatch, cleanTeam)).toEqual([]);
    render(<TeamView brief={cleanBrief} match={cleanMatch} team={cleanTeam} onBack={() => {}} />);
    expect(screen.getByText("No critical gaps detected")).toBeInTheDocument();
  });

  it("returns to candidates from a risk recommendation without changing the team", () => {
    const onBack = vi.fn();
    render(<TeamView brief={brief} match={match} team={team} onBack={onBack} />);
    expect(screen.getByRole("heading", { name: "Team weaknesses & risk analysis" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Suggest reinforcement: Kafka" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(team.optimal.map((slot) => slot.employee_id)).toEqual(["NTT0000101", "NTT0000404", "NTT0000303"]);
  });
});
