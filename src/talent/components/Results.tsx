import { ArrowRight, ChevronDown, Filter, Languages, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import type { Brief, Candidate, MatchResult, Requirement, RoleResult } from "@/shared/contract";
import { useT } from "../i18n";
import { availabilityTone, Card, FitRing, Pill, StatusIcon } from "./ui";

export function Results({ brief, result, selected, toggleSelect, onOpen }: {
  brief: Brief; result: MatchResult; selected: string[];
  toggleSelect: (id: string) => void; onOpen: (c: Candidate, roleId: string) => void;
}) {
  const t = useT();
  const [active, setActive] = useState(result.roles[0]?.role_id);
  const rr = result.roles.find((r) => r.role_id === active) ?? result.roles[0];
  if (!rr) return null;
  const role = brief.roles.find((r) => r.id === rr.role_id);
  const reqs = role?.requirements ?? [];

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
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${on ? "bg-ink text-white" : "bg-white text-ink border border-line hover:border-ink/30"}`}
            >
              {ro?.title ?? r.role_id}
              <span className={`ml-2 text-xs ${on ? "text-white/60" : "text-muted"}`}>{r.candidates.length}</span>
            </button>
          );
        })}
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} className="text-ok" />
          {t("grounding", { claims: result.grounding.claims, dropped: result.grounding.dropped })}
        </span>
      </div>

      <Funnel rr={rr} />

      <div className="space-y-3">
        {rr.candidates.map((c, i) => (
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
            <span>{c.current_role} · {c.area} · {c.seniority} · {c.years_experience} {t("years")}</span>
            <span className="inline-flex items-center gap-0.5"><MapPin size={12} />{c.city}, {c.country}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.coverage.map((cv) => {
              const r = reqById[cv.req_id];
              if (!r) return null;
              return (
                <span key={cv.req_id} className="inline-flex items-center gap-1 rounded-md bg-canvas px-2 py-0.5 text-xs">
                  <StatusIcon status={cv.status} size={12} />
                  {r.type === "language" && <Languages size={11} className="text-muted" />}
                  <span className={r.must ? "font-medium" : "text-muted"}>{r.value}</span>
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

          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <List title={t("strengths")} items={c.strengths} color="text-ok" />
            <List title={t("gaps")} items={c.gaps} color="text-bad" />
            <List title={t("risks")} items={c.risks} color="text-warn" />
          </div>

          <button onClick={onOpen} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand opacity-80 hover:opacity-100">
            {t("evidence")} <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </Card>
  );
}

function List({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items.length) return <div />;
  return (
    <div>
      <div className={`text-xs font-semibold ${color}`}>{title}</div>
      <ul className="mt-0.5 space-y-0.5 text-[13px] leading-snug text-ink/80">
        {items.map((s) => <li key={s}>{s}</li>)}
      </ul>
    </div>
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
