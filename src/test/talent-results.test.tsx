import { fireEvent, render, screen, cleanup, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import type { Brief, MatchResult } from "@/shared/contract";
import briefJson from "@/talent/mocks/brief.json";
import matchJson from "@/talent/mocks/match.json";
import { ALL_AVAILABILITY } from "@/talent/components/BriefInput";
import { Results } from "@/talent/components/Results";
import { CompareModal } from "@/talent/components/CompareModal";
import { profileEntries, selectionKey, toggleSelection, visibleResults } from "@/talent/results-state";

afterEach(cleanup);
const brief = briefJson as Brief;
const result = matchJson as MatchResult;
const filters = { availability: ALL_AVAILABILITY, minYears: 0 };

describe("Role-scoped selections", () => {
  it("selects multiple candidates in the second and later roles without clearing another role", () => {
    const first = selectionKey("r1", "person-1");
    const second = selectionKey("r2", "person-1");
    const third = selectionKey("r2", "person-2");
    const fourth = selectionKey("r3", "person-3");
    let selected: string[] = [];
    for (const key of [first, second, third, fourth]) selected = toggleSelection(selected, key);
    expect(selected).toEqual([first, second, third, fourth]);
    expect(toggleSelection(selected, second)).toEqual([first, third, fourth]);
  });
});

describe("All-role display projection", () => {
  it("shows eligible people in every brief role without repeating a person or mutating data", () => {
    const original = JSON.stringify(result);
    const shown = visibleResults(brief, result, filters);
    expect(shown.roles.map((r) => r.role_id)).toEqual(["r1", "r2"]);
    expect(shown.roles.every((r) => r.candidates.length > 0)).toBe(true);
    const ids = profileEntries(brief, shown).map(({ c }) => c.employee_id);
    expect(ids.length).toBe(7);
    expect(new Set(ids).size).toBe(ids.length);
    expect(JSON.stringify(result)).toBe(original);
  });

  it("keeps a constrained second role populated when the first role shares its only candidate", () => {
    const shared = result.roles[0]?.candidates[0];
    const alternative = result.roles[0]?.candidates[1];
    const rr = result.roles[0];
    if (!shared || !alternative || !rr) throw new Error("Missing test profiles");
    const b: Brief = { ...brief, roles: brief.roles.map((r) => ({ ...r, headcount: 1 })) };
    const m: MatchResult = { ...result, roles: [
      { ...rr, role_id: "r1", candidates: [shared, alternative], reserve: [] },
      { ...rr, role_id: "r2", candidates: [shared], reserve: [] },
    ] };
    const shown = visibleResults(b, m, filters);
    expect(shown.roles[0]?.candidates.map((c) => c.employee_id)).toEqual([alternative.employee_id]);
    expect(shown.roles[1]?.candidates.map((c) => c.employee_id)).toEqual([shared.employee_id]);
  });

  it("applies strict availability to both ranking and suggestions in every role", () => {
    const shown = visibleResults(brief, result, { availability: ["En banca"], minYears: 0 });
    const entries = profileEntries(brief, shown);
    expect(entries.length).toBe(4);
    expect(entries.every(({ c }) => c.availability === "En banca")).toBe(true);
    expect(shown.roles[0]?.reserve).toEqual([]);
  });

  it("applies minimum experience to every role and its suggested candidates", () => {
    const shown = visibleResults(brief, result, { availability: ALL_AVAILABILITY, minYears: 8 });
    const entries = profileEntries(brief, shown);
    expect(entries.length).toBe(4);
    expect(entries.every(({ c }) => c.years_experience >= 8)).toBe(true);
    expect(entries.some(({ c }) => c.name === "Javier Ortega Ruiz")).toBe(false);
  });

  it("respects stricter experience requirements defined by a role", () => {
    const b: Brief = { ...brief, roles: brief.roles.map((r) => r.id === "r2" ? { ...r, min_years: 9 } : r) };
    const shown = visibleResults(b, result, filters);
    expect(shown.roles.find((r) => r.role_id === "r2")?.candidates).toEqual([]);
    expect(shown.roles.find((r) => r.role_id === "r1")?.candidates.length).toBeGreaterThan(0);
  });

  it("renders and compares suggested profiles in the second role alongside ranked profiles", () => {
    const reserve = result.roles[0]?.reserve[0];
    const rr = result.roles[1];
    if (!reserve || !rr) throw new Error("Missing test profiles");
    const suggestion = { ...reserve, employee_id: "second-role-suggestion", name: "Second role suggestion" };
    const m: MatchResult = { ...result, roles: result.roles.map((r) => r.role_id === "r2" ? { ...r, reserve: [suggestion] } : r) };
    const shown = visibleResults(brief, m, filters);
    function Harness() {
      const [selected, setSelected] = useState<string[]>([]);
      return <><Results brief={brief} result={shown} selected={selected}
        toggleSelect={(role, id) => setSelected((s) => toggleSelection(s, selectionKey(role, id)))} onOpen={() => {}} />
        <output aria-label="selected profiles">{selected.length}</output></>;
    }
    render(<Harness />);
    const toggles = screen.getAllByRole("button", { expanded: false });
    const secondToggle = toggles[1];
    if (!secondToggle) throw new Error("Second role suggestions not rendered");
    fireEvent.click(secondToggle);
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare Second role suggestion" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare Javier Ortega Ruiz" }));
    expect(screen.getByLabelText("selected profiles")).toHaveTextContent("2");
    expect(screen.getByRole("checkbox", { name: "Compare Second role suggestion" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Compare Javier Ortega Ruiz" })).toBeChecked();
    cleanup();
    const entries = profileEntries(brief, shown).filter(({ c }) => [suggestion.employee_id, "NTT0000303"].includes(c.employee_id));
    render(<CompareModal entries={entries} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText("Second role suggestion").length).toBeGreaterThan(0);
    expect(within(dialog).getAllByText("Javier Ortega Ruiz").length).toBeGreaterThan(0);
  });
});