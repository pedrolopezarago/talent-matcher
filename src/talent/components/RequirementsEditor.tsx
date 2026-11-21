import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Search, Sparkle, Users, X } from "lucide-react";
import { useState } from "react";
import type { Brief, Requirement, Role } from "@/shared/contract";
import { useT } from "../i18n";
import { Card, Pill, Spinner } from "./ui";

export function RequirementsEditor({ brief, setBrief, onFind, loading }: {
  brief: Brief; setBrief: (b: Brief) => void; onFind: () => void; loading: boolean;
}) {
  const t = useT();
  const updateRole = (id: string, fn: (r: Role) => Role) =>
    setBrief({ ...brief, roles: brief.roles.map((r) => (r.id === id ? fn(r) : r)) });

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("requirementsTitle")}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t("requirementsHint")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap pr-4 text-sm text-muted">
          <CalendarDays size={16} className="shrink-0" />
          {brief.immediate || !brief.start_date ? t("immediate") : `${t("start")}: ${displayStart(brief.start_date)}`}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {brief.roles.map((role) => (
          <RoleCard key={role.id} role={role} update={(fn) => updateRole(role.id, fn)} />
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="plain"
          onClick={onFind}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-surface transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? <Spinner /> : <Search size={16} />}
          {loading ? t("matching") : t("findCandidates")}
        </Button>
      </div>
    </Card>
  );
}

function RoleCard({ role, update }: { role: Role; update: (fn: (r: Role) => Role) => void }) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const setReqs = (fn: (q: Requirement[]) => Requirement[]) => update((r) => ({ ...r, requirements: fn(r.requirements) }));

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setReqs((qs) => [...qs, {
      id: `${role.id}-u${Date.now()}`, type: "skill", value: v, must: false, implicit: false,
      weight: 1, source_quote: "", synonyms: [],
    }]);
    setDraft("");
  };

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{role.title}</h3>
        <Pill><Users size={12} />{role.headcount} {t("headcount")}</Pill>
        {role.seniority && <Pill>{role.seniority}</Pill>}
        {role.min_years != null && <Pill tone="brand">≥ {role.min_years} {t("minYears")}</Pill>}
        <span className="ml-auto text-xs text-muted" title={t("criticality")}>
          {t("criticality")} {"●".repeat(role.criticality)}<span className="text-line">{"●".repeat(5 - role.criticality)}</span>
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {role.requirements.map((q) => (
          <span
            key={q.id}
            title={q.source_quote ? `“${q.source_quote}”${q.implicit ? ` · ${t("implicit")}` : ""}` : undefined}
            className={`group inline-flex items-center gap-1 rounded-full border text-xs font-medium transition ${
              q.must ? "border-brand/30 bg-brand/10 text-ink" : "border-line bg-surface text-ink"
            }`}
          >
            <Button variant="plain"
              onClick={() => setReqs((qs) => qs.map((x) => (x.id === q.id ? { ...x, must: !x.must } : x)))}
              className="h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink hover:bg-transparent"
            >
              {q.implicit && <Sparkle size={11} className="shrink-0" />}
              {q.value}{q.level ? ` ${q.level}` : ""}
              <span className={`ml-1 text-[10px] ${q.must ? "font-semibold text-brand-dark" : "text-muted"}`}>
                {q.must ? t("must") : t("nice")}
              </span>
            </Button>
            <Button variant="plain"
              onClick={() => setReqs((qs) => qs.filter((x) => x.id !== q.id))}
              className="rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 hover:bg-transparent hover:opacity-100"
              aria-label="remove"
            >
              <X size={12} />
            </Button>
          </span>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="inline-flex items-center rounded-full border border-dashed border-line pl-2 focus-within:border-ink">
          <Plus size={12} className="text-muted" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("addPlaceholder")}
            className="w-28 bg-transparent px-1.5 py-1 text-xs outline-none"
          />
        </form>
      </div>
    </div>
  );
}

/** Display-only: shows the brief's start month/day in the current year when the stored year is in the past. */
function displayStart(raw: string): string {
  const now = new Date();
  const m = /^(\d{4})(-\d{2}(?:-\d{2})?)?/.exec(raw);
  if (!m) return raw;
  const year = Number(m[1]);
  return year < now.getFullYear() ? `${now.getFullYear()}${m[2] ?? ""}` : raw;
}
