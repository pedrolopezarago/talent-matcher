import { ArrowRight, ChevronDown, Filter, Languages, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import type { Brief, Candidate, MatchResult, Requirement, RoleResult } from "@/shared/contract";
import { useT } from "../i18n";
import type { HardFilters } from "./BriefInput";
import { availabilityTone, Card, FitRing, Pill, StatusIcon } from "./ui";

export function Results({ brief, result, filters, selected, toggleSelect, onOpen }: {
  brief: Brief; result: MatchResult; filters: HardFilters; selected: string[];
  toggleSelect: (id: string) => void; onOpen: (c: Candidate, roleId: string) => void;
}) {
  const t = useT();
  const [active, setActive] = useState(result.roles[0]?.role_id);
  const rr = result.roles.find((r) => r.role_id === active) ?? result.roles[0];
  if (!rr) return null;
  const role = brief.roles.find((r) => r.id === rr.role_id);
  const reqs = role?.requirements ?? [];
  const pass = (c: Candidate) => filters.availability.includes(c.availability) && c.years_experience >= filters.minYears;
  const shown = rr.candidates.filter(pass);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        {result.roles.map((r) => {
          const ro = brief.roles.find((x) => x.id === r.role_id);
          const on = r.role_id === rr.role_id;
          return (
            <button
              key={r.role_id}
              onClick={() => setActive(r.role_id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${on ? "bg-brand text-on-brand" : "bg-surface text-ink border border-line hover:border-ink/30"}`}
            >
              {ro?.title ?? r.role_id}
              <span className={`ml-2 text-xs ${on ? "text-on-brand/80" : "text-muted"}`}>{r.candidates.filter(pass).length}</span>
            </button>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} className="text-ok" />
          {t("grounding", { claims: result.grounding.claims, dropped: result.grounding.dropped })}
        </span>
      </div>

      {result.roles.length > 1 && <p className="-mt-2 text-xs text-muted">{t("noRepeat")}</p>}

      <Funnel rr={rr} />

      <div className="space-y-3">
        {shown.length === 0 && <Card className="p-6 text-center text-sm text-muted">{t("noMatches")}</Card>}
        {shown.map((c, i) => (
          <CandidateCard
            key={c.employee_id} c={c} rank={i + 1} reqs={reqs}
            selected={selected.includes(c.employee_id)}
            onSelect={() => toggleSelect(c.employee_id)}
            onOpen={() => onOpen(c, rr.role_id)}
          />
        ))}
      </div>

      {rr.reserve.length > 0 && <ReserveLane rr={rr} reqs={reqs} onOpen={(c) => onOpen(c, rr.role_id)} />}
    </div>
  );
}

function Funnel({ rr }: { rr: RoleResult }) {
  const t = useT();
  const f = rr.funnel;
  const steps = [
    { n: f.total, label: t("profiles"), icon: Users },
    { n: f.after_filters, label: t("available"), icon: Filter },
    { n: f.reviewed, label: t("reviewed"), icon: Sparkles },
    { n: f.ranked, label: t("ranked"), icon: ArrowRight },
  ];
  return (
    <Card className="px-5 py-4">
      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 sm:flex-1">
            <s.icon size={16} className={i === 2 ? "text-brand" : "text-muted"} />
            <div>
              <div className="text-lg font-semibold tabular-nums leading-tight">{s.n.toLocaleString()}</div>
              <div className="text-xs text-muted">{s.label}</div>
            </div>
            {i < steps.length - 1 && <ArrowRight size={14} className="ml-auto hidden text-line sm:block" />}
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{rr.availability_rule}</p>
    </Card>
  );
}

export function CandidateCard({ c, rank, reqs, selected, onSelect, onOpen, muted }: {
  c: Candidate; rank: number; reqs: Requirement[]; selected?: boolean;
  onSelect?: () => void; onOpen: () => void; muted?: boolean;
}) {
  const t = useT();
  const reqById = Object.fromEntries(reqs.map((r) => [r.id, r]));
  return (
    <Card className={`group p-4 transition hover:border-brand/40 hover:shadow-md sm:p-5 ${selected ? "ring-2 ring-brand" : ""} ${muted ? "opacity-80" : ""}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <FitRing fit={c.fit} />
          <span className="text-[11px] text-muted">#{rank}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onOpen} className="text-left font-semibold hover:text-brand">{c.name}</button>
            <Pill tone={availabilityTone(c.availability)}>{c.availability}</Pill>
            {c.hidden.different_area && <Pill tone="hidden"><Sparkles size={11} />{t("differentArea")}</Pill>}
            {onSelect && (
              <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={selected} onChange={onSelect} className="accent-brand" />
                {t("compare")}
              </label>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
            <span>{c.current_role} · {c.area} · {c.seniority}</span>
            <span className="font-medium text-ink">{t("experience")}: {c.years_experience} {t("years")}</span>
            <span className="inline-flex items-center gap-0.5"><MapPin size={12} />{c.city}, {c.country}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.coverage.map((cv) => {
              const r = reqById[cv.req_id];
              if (!r) return null;
              return (
                <span key={cv.req_id} className="inline-flex items-center gap-1 rounded-md bg-cream px-2 py-0.5 text-xs text-ink">
                  <StatusIcon status={cv.status} size={12} />
                  {r.type === "language" && <Languages size={11} className="text-muted" />}
                  <span className={r.must ? "font-semibold" : ""}>{r.value}{r.level ? ` · ${r.level}` : ""}</span>
                </span>
              );
            })}
          </div>

          {c.hidden.vocab_bridges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {c.hidden.vocab_bridges.map((b) => (
                <Pill key={b.asked + b.found} tone="hidden">
                  {b.asked} <span className="opacity-60">→ {t("foundAs")}</span> {b.found}
                </Pill>
              ))}
            </div>
          )}

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-sage-line bg-sage/40 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ok">{t("whyFits")}</div>
              <ul className="space-y-0.5 leading-relaxed">{c.strengths.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="rounded-lg border border-orange/60 bg-bad-soft p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-bad">{t("risksGaps")}</div>
              {c.gaps.length + c.risks.length === 0 ? <p className="text-muted">{t("noRisks")}</p> : (
                <ul className="space-y-0.5 leading-relaxed">
                  {c.gaps.map((x) => <li key={"g" + x} className="flex gap-1.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />{x}</li>)}
                  {c.risks.map((x) => <li key={"r" + x} className="flex gap-1.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-peach" />{x}</li>)}
                </ul>
              )}
            </div>
          </div>

          <button onClick={onOpen} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand opacity-80 hover:opacity-100">
            {t("evidence")} <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}


function ReserveLane({ rr, reqs, onOpen }: { rr: RoleResult; reqs: Requirement[]; onOpen: (c: Candidate) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-line p-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 text-left">
        <span className="font-medium">{t("reserveTitle")}</span>
        <Pill>{rr.reserve.length}</Pill>
        <ChevronDown size={16} className={`ml-auto text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      <p className="mt-1 text-xs text-muted">{t("reserveHint")}</p>
      {open && (
        <div className="mt-3 space-y-3">
          {rr.reserve.map((c, i) => (
            <CandidateCard key={c.employee_id} c={c} rank={i + 1} reqs={reqs} onOpen={() => onOpen(c)} muted />
          ))}
        </div>
      )}
    </div>
  );
}
