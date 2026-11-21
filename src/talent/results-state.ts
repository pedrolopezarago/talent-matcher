import type { Brief, Candidate, MatchResult, Requirement } from "@/shared/contract";
import type { HardFilters } from "./components/BriefInput";

export type ProfileEntry = { c: Candidate; roleId: string; roleTitle: string; reqs: Requirement[] };

export const selectionKey = (roleId: string, employeeId: string) => JSON.stringify([roleId, employeeId]);

export function toggleSelection(selected: string[], key: string): string[] {
  return selected.includes(key) ? selected.filter((id) => id !== key) : [...selected, key];
}

// A presentation-only projection: never mutate the response or send this to the team API.
export function visibleResults(brief: Brief, result: MatchResult, filters: HardFilters): MatchResult {
  const roles = brief.roles.map((role) => {
    const rr = result.roles.find((r) => r.role_id === role.id);
    const pass = (c: Candidate) => filters.availability.includes(c.availability)
      && c.years_experience >= Math.max(filters.minYears, role.min_years ?? 0);
    const candidates = (rr?.candidates ?? []).filter(pass);
    const rankedIds = new Set(candidates.map((c) => c.employee_id));
    return {
      role_id: role.id,
      availability_rule: rr?.availability_rule ?? "",
      funnel: rr?.funnel ?? { total: 0, after_filters: 0, reviewed: 0, ranked: 0 },
      candidates,
      reserve: (rr?.reserve ?? []).filter((c) => pass(c) && !rankedIds.has(c.employee_id)),
    };
  });
  const options = roles.map((r) => [...r.candidates, ...r.reserve]);
  const slots = roles.flatMap((r, roleIndex) => Array.from(
    { length: brief.roles.find((role) => role.id === r.role_id)?.headcount ?? 1 }, () => roleIndex,
  ));
  const assigned = new Map<string, number>();
  // Augmenting paths protect constrained later roles instead of letting the first role take everybody.
  const claim = (slot: number, visited: Set<string>): boolean => {
    const roleIndex = slots[slot];
    if (roleIndex === undefined) return false;
    for (const c of options[roleIndex] ?? []) {
      if (visited.has(c.employee_id)) continue;
      visited.add(c.employee_id);
      const previous = assigned.get(c.employee_id);
      if (previous === undefined || claim(previous, visited)) {
        assigned.set(c.employee_id, slot);
        return true;
      }
    }
    return false;
  };
  slots.forEach((_, slot) => claim(slot, new Set()));
  const owners = new Map<string, number>();
  assigned.forEach((slot, id) => {
    const roleIndex = slots[slot];
    if (roleIndex !== undefined) owners.set(id, roleIndex);
  });
  // Retain every remaining eligible person, favouring ranked entries and then match score.
  const remaining = roles.flatMap((r, roleIndex) => [
    ...r.candidates.map((c) => ({ c, roleIndex, ranked: true })),
    ...r.reserve.map((c) => ({ c, roleIndex, ranked: false })),
  ]).sort((a, b) => Number(b.ranked) - Number(a.ranked) || b.c.fit - a.c.fit);
  remaining.forEach(({ c, roleIndex }) => {
    if (!owners.has(c.employee_id)) owners.set(c.employee_id, roleIndex);
  });
  return { ...result, roles: roles.map((r, index) => {
    const seen = new Set<string>();
    const own = (c: Candidate) => {
      if (owners.get(c.employee_id) !== index || seen.has(c.employee_id)) return false;
      seen.add(c.employee_id);
      return true;
    };
    return { ...r, candidates: r.candidates.filter(own), reserve: r.reserve.filter(own) };
  }) };
}

export function profileEntries(brief: Brief, result: MatchResult): ProfileEntry[] {
  return result.roles.flatMap((r) => {
    const role = brief.roles.find((role) => role.id === r.role_id);
    return [...r.candidates, ...r.reserve].map((c) => ({
      c, roleId: r.role_id, roleTitle: role?.title ?? r.role_id, reqs: role?.requirements ?? [],
    }));
  });
}