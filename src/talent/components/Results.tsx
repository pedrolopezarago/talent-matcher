import { ArrowUpRight, ChevronDown, Languages, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { Brief, Candidate, MatchResult, Requirement, RoleResult } from "@/shared/contract";
import { useContext } from "react";
import { LangContext, useT } from "../i18n";
import { Button } from "@/components/ui/button";
import { selectionKey } from "../results-state";
import { Pill } from "./ui";

export function Results({ brief, result, selected, toggleSelect, onOpen }: {
  brief: Brief; result: MatchResult; selected: string[];
  toggleSelect: (roleId: string, id: string) => void; onOpen: (c: Candidate, roleId: string) => void;
}) {
  const t = useT();
  return (
    <div className="space-y-10">
      <Kpis brief={brief} result={result} />
      <p className="-mt-6 inline-flex items-center gap-1.5 text-xs text-muted">
        <ShieldCheck size={13} />
        {t("grounding", { claims: result.grounding.claims, dropped: result.grounding.dropped })}
        {result.roles.length > 1 && <> · {t("noRepeat")}</>}
      </p>
      {result.roles.map((rr) => {
        const role = brief.roles.find((r) => r.id === rr.role_id);
        const reqs = role?.requirements ?? [];
        const shown = rr.candidates;
        return (
          <section key={rr.role_id}>
            <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line pb-3">
              <h2 className="text-xl font-semibold font-display">{role?.title ?? rr.role_id}</h2>
              <span className="text-sm tabular-nums text-muted">{shown.length}</span>
              <Funnel rr={rr} />
            </div>
            {shown.length === 0 && <p className="py-6 text-sm text-muted">{t("noMatches")}</p>}
            {shown.map((c, i) => (
              <CandidateCard
                key={c.employee_id} c={c} rank={i + 1} reqs={reqs}
                selected={selected.includes(selectionKey(rr.role_id, c.employee_id))}
                onSelect={() => toggleSelect(rr.role_id, c.employee_id)}
                onOpen={() => onOpen(c, rr.role_id)}
              />
            ))}
            {rr.reserve.length > 0 && <ReserveLane rr={rr} reqs={reqs} selected={selected} toggleSelect={toggleSelect} onOpen={(c) => onOpen(c, rr.role_id)} />}
          </section>
        );
      })}
    </div>
  );
}

function Funnel({ rr }: { rr: RoleResult }) {
  const t = useT();
  const f = rr.funnel;
  return (
    <span className="ml-auto text-xs tabular-nums text-muted" title={rr.availability_rule}>
      {f.total.toLocaleString()} {t("profiles")} → {f.after_filters.toLocaleString()} {t("available")} → {f.reviewed} {t("reviewed")} → {f.ranked} {t("ranked")}
    </span>
  );
}

export function CandidateCard({ c, rank, reqs, selected, onSelect, onOpen, muted }: {
  c: Candidate; rank: number; reqs: Requirement[]; selected?: boolean;
  onSelect?: () => void; onOpen: () => void; muted?: boolean;
}) {
  const t = useT();
  const es = useContext(LangContext) === "es";
  const reqById = Object.fromEntries(reqs.map((r) => [r.id, r]));
  const implicitMet = c.coverage.map((cv) => (cv.status !== "missing" ? reqById[cv.req_id] : undefined)).filter((r): r is Requirement => !!r && r.implicit);
  const dot = c.availability === "En banca" ? "bg-ok" : c.availability.startsWith("Roll-off") ? "bg-amber" : "bg-muted/40";
  const mainRisk = c.gaps[0] ?? c.risks[0];
  return (
    <div className={`group -mx-3 grid gap-4 rounded-xl border-b border-line px-3 py-5 transition hover:bg-brand-soft/50 md:grid-cols-[220px_1fr_180px] ${selected ? "bg-support-soft" : ""} ${muted ? "opacity-75" : ""}`}>
      <div className="min-w-0">
        <Button variant="plain" onClick={onOpen} className="h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-support-dark">
          <span className="text-xs font-normal tabular-nums text-muted">{rank}.</span> {c.name}
          <ArrowUpRight size={13} className="opacity-0 transition group-hover:opacity-60" />
        </Button>
        <p className="text-sm text-muted">{c.current_role} · {c.seniority}</p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={`size-2 rounded-full ${dot}`} />{c.availability}</p>
        {onSelect && (
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" aria-label={`${t("compare")} ${c.name}`} checked={selected ?? false} onChange={onSelect} className="accent-support" />{t("compare")}
          </label>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm leading-relaxed">
          {c.strengths.map((x) => x.replace(/[.\s]+$/, "")).join(". ")}.
          {implicitMet.length > 0 && <span className="text-muted"> {es ? "Cubre lo implícito:" : "Covers implicit needs:"} {implicitMet.map((r) => r.value).join(", ")}.</span>}
          {c.hidden.different_area && <span className="text-muted"> {t("differentArea")}.</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {c.coverage.map((cv) => {
            const r = reqById[cv.req_id];
            if (!r) return null;
            return (
              <span key={cv.req_id} className={`inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-xs text-ink ${cv.status === "missing" ? "opacity-50 line-through" : ""}`}>
                {r.type === "language" && <Languages size={11} className="text-muted" />}
                {r.value}{r.level && <span className="text-muted">{r.level}</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="md:text-right">
        <div className="text-2xl font-semibold tabular-nums font-display text-brand">{c.fit}%</div>
        <div className="text-xs tabular-nums text-muted">{c.years_experience} {t("years")} {es ? "de experiencia" : "experience"}</div>
        <p className="mt-1.5 text-xs leading-snug text-warn">{mainRisk ?? t("noRisks")}</p>
      </div>
    </div>
  );
}

function Kpis({ brief, result }: { brief: Brief; result: MatchResult }) {
  const es = useContext(LangContext) === "es";
  const picks = result.roles.flatMap((r) => {
    const hc = brief.roles.find((x) => x.id === r.role_id)?.headcount ?? 1;
    return r.candidates.slice(0, hc).map((c) => ({ c, need: hc }));
  });
  const slots = brief.roles.reduce((n, r) => n + r.headcount, 0);
  const ids = new Set(picks.map((p) => p.c.employee_id));
  const complete = picks.length >= slots && ids.size === picks.length;
  const coverage = picks.length ? Math.round(picks.reduce((s, p) => s + p.c.fit, 0) / slots) : 0;
  const all = Array.from(new Map(result.roles.flatMap((r) => r.candidates).map((c) => [c.employee_id, c])).values());
  const bench = all.filter((c) => c.availability === "En banca").length;
  const roll = all.filter((c) => c.availability.startsWith("Roll-off")).length;
  const assigned = all.length - bench - roll;
  const max = Math.max(bench, roll, assigned, 1);
  const bars = [
    { n: bench, label: es ? "En banca" : "Bench", hi: true },
    { n: roll, label: "Roll-off" },
    { n: assigned, label: es ? "Asignado" : "Assigned" },
  ];
  return (
    <div className="grid gap-8 border-y border-line py-6 sm:grid-cols-2">
      <div>
        <div className="text-sm text-muted">{es ? "Cobertura del equipo" : "Team coverage"}</div>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <span className="text-4xl font-semibold tabular-nums font-display text-brand">{coverage}%</span>
          <span className={`mb-1 rounded-full px-3 py-1 text-xs font-semibold ${complete ? "bg-support-soft text-support-dark" : "bg-brand-soft text-muted"}`}>
            {complete ? (es ? "Equipo completo sin duplicados" : "Full team, no duplicates") : (es ? `${picks.length}/${slots} puestos cubiertos` : `${picks.length}/${slots} slots filled`)}
          </span>
        </div>
      </div>
      <div className="sm:border-l sm:border-line sm:pl-8">
        <div className="text-sm text-muted">{es ? "Disponibilidad inmediata" : "Immediate availability"}</div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <span className="text-4xl font-semibold tabular-nums font-display">{bench}</span>
            <span className="ml-1.5 text-sm text-muted">{es ? "en banca" : "on bench"} · {roll} roll-off</span>
          </div>
          <div className="flex h-12 items-end gap-1.5">
            {bars.map((b) => (
              <div key={b.label} title={`${b.label}: ${b.n}`} className={`w-5 rounded-full ${b.hi ? "bg-support" : "bg-brand-soft"}`} style={{ height: `${Math.max(12, (b.n / max) * 100)}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function ReserveLane({ rr, reqs, selected, toggleSelect, onOpen }: { rr: RoleResult; reqs: Requirement[]; selected: string[]; toggleSelect: (roleId: string, id: string) => void; onOpen: (c: Candidate) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="py-4">
      <Button variant="plain" onClick={() => setOpen(!open)} aria-expanded={open} className="h-auto w-full justify-start px-0 py-1 text-left">
        <span className="font-medium">{t("reserveTitle")}</span>
        <Pill>{rr.reserve.length}</Pill>
        <ChevronDown size={16} className={`ml-auto text-muted transition ${open ? "rotate-180" : ""}`} />
      </Button>
      <p className="mt-1 text-xs text-muted">{t("reserveHint")}</p>
      {open && (
        <div className="mt-1">
          {rr.reserve.map((c, i) => (
            <CandidateCard key={c.employee_id} c={c} rank={i + 1} reqs={reqs} selected={selected.includes(selectionKey(rr.role_id, c.employee_id))} onSelect={() => toggleSelect(rr.role_id, c.employee_id)} onOpen={() => onOpen(c)} muted />
          ))}
        </div>
      )}
    </div>
  );
}
