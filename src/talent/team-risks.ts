import type { Brief, Candidate, Coverage, MatchResult, TeamResult, TeamSlot } from "@/shared/contract";

export type TeamRiskKind =
  | "coverageMissing"
  | "coveragePartial"
  | "singlePoint"
  | "availability"
  | "dedication"
  | "seniority"
  | "experience"
  | "leadership";

export interface TeamRisk {
  id: string;
  kind: TeamRiskKind;
  severity: "critical" | "warning";
  subject: string;
  roleTitle: string;
  person?: string;
  expected?: string;
  actual?: string;
  startDate?: string;
  coverage?: { name: string; status: Exclude<Coverage["status"], "met"> }[];
}

const seniorityRank: Record<string, number> = {
  Trainee: 0,
  Junior: 1,
  Mid: 2,
  Senior: 3,
  Lead: 4,
  Principal: 5,
};

const rank = (seniority: string) => seniorityRank[seniority] ?? -1;
const partTimePattern = /part[- ]time|partial dedication|dedicaci[oó]n parcial|media jornada|\b(?:[1-9]?\d)%\s*(?:dedication|dedicaci[oó]n)/i;

// Presentation-only analysis: the selected team and the matching response are never mutated.
export function analyseTeamRisks(brief: Brief, match: MatchResult, team: TeamResult): TeamRisk[] {
  const risks: TeamRisk[] = [];

  for (const role of brief.roles) {
    const roleResult = match.roles.find((r) => r.role_id === role.id);
    const profiles = new Map<string, Candidate>(
      [...(roleResult?.candidates ?? []), ...(roleResult?.reserve ?? [])].map((c) => [c.employee_id, c]),
    );
    const members: { slot: TeamSlot; candidate: Candidate | undefined }[] = team.optimal
      .filter((slot) => slot.role_id === role.id)
      .map((slot) => ({ slot, candidate: profiles.get(slot.employee_id) }));

    for (const requirement of role.requirements) {
      const coverage: { name: string; status: Coverage["status"] }[] = members.map(({ slot, candidate }) => ({
        name: slot.name,
        status: candidate?.coverage.find((item) => item.req_id === requirement.id)?.status ?? "missing",
      }));
      const met = coverage.filter((item) => item.status === "met");
      const gaps: { name: string; status: "partial" | "missing" }[] = coverage.flatMap((item) =>
        item.status === "met" ? [] : [{ name: item.name, status: item.status }],
      );

      if (met.length === 0) {
        const partial = coverage.some((item) => item.status === "partial");
        risks.push({
          id: `${role.id}-${requirement.id}-coverage`,
          kind: partial ? "coveragePartial" : "coverageMissing",
          severity: requirement.must ? "critical" : "warning",
          subject: requirement.value,
          roleTitle: role.title,
          coverage: gaps,
        });
      } else if (met.length === 1) {
        const sole = met[0];
        if (sole) {
          risks.push({
            id: `${role.id}-${requirement.id}-single-point`,
            kind: "singlePoint",
            severity: "warning",
            subject: requirement.value,
            roleTitle: role.title,
            person: sole.name,
          });
        }
      }
    }

    for (const { slot, candidate } of members) {
      if (candidate?.availability === "Asignado" || candidate?.availability.startsWith("Roll-off")) {
        risks.push({
          id: `${role.id}-${slot.slot}-availability`,
          kind: "availability",
          severity: candidate.availability === "Asignado" ? "critical" : "warning",
          subject: slot.name,
          roleTitle: role.title,
          person: slot.name,
          actual: candidate.availability,
          ...(brief.start_date ? { startDate: brief.start_date } : {}),
        });
      }

      if (candidate?.risks.some((risk) => partTimePattern.test(risk))) {
        risks.push({
          id: `${role.id}-${slot.slot}-dedication`,
          kind: "dedication",
          severity: "warning",
          subject: slot.name,
          roleTitle: role.title,
          person: slot.name,
        });
      }

      const actualSeniority = candidate?.seniority ?? slot.seniority ?? "Unknown";
      if (role.seniority && (slot.off_tier || rank(actualSeniority) < rank(role.seniority))) {
        risks.push({
          id: `${role.id}-${slot.slot}-seniority`,
          kind: "seniority",
          severity: role.criticality >= 4 ? "critical" : "warning",
          subject: slot.name,
          roleTitle: role.title,
          person: slot.name,
          expected: role.seniority,
          actual: actualSeniority,
        });
      }

      if (candidate && role.min_years !== undefined && candidate.years_experience < role.min_years) {
        risks.push({
          id: `${role.id}-${slot.slot}-experience`,
          kind: "experience",
          severity: "critical",
          subject: slot.name,
          roleTitle: role.title,
          person: slot.name,
          expected: String(role.min_years),
          actual: String(candidate.years_experience),
        });
      }
    }

    if (role.criticality >= 4 && !members.some(({ slot, candidate }) => rank(candidate?.seniority ?? slot.seniority ?? "") >= rank("Senior"))) {
      risks.push({
        id: `${role.id}-leadership`,
        kind: "leadership",
        severity: "critical",
        subject: role.title,
        roleTitle: role.title,
      });
    }
  }

  return risks.sort((a, b) => Number(b.severity === "critical") - Number(a.severity === "critical"));
}
