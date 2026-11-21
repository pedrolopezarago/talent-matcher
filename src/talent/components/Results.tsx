import { ArrowRight, ArrowUpRight, ChevronDown, Filter, Languages, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import type { Brief, Candidate, MatchResult, Requirement, RoleResult } from "@/shared/contract";
import { useContext } from "react";
import { LangContext, useT } from "../i18n";
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
      <Kpis brief={brief} result={result} pass={pass} />
      <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
        {result.roles.map((r) => {
          const ro = brief.roles.find((x) => x.id === r.role_id);
          const on = r.role_id === rr.role_id;
          return (
            <button
              key={r.role_id}
              onClick={() => setActive(r.role_id)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${on ? "bg-brand text-on-brand" : "bg-surface text-muted hover:text-ink"}`}
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

      <div className="grid gap-4 lg:grid-cols-2">
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
  const es = useContext(LangContext) === "es";
  const reqById = Object.fromEntries(reqs.map((r) => [r.id, r]));
  const implicitMet = c.coverage.map((cv) => reqById[cv.req_id]).filter((r): r is Requirement => !!r && r.implicit && c.coverage.some((cv) => cv.req_id === r.id && cv.status !== "missing"));
  const avShort = c.availability.replace("Roll-off próximo (<3 meses)", "Roll-off <3 meses");
  return (
    <Card className={`flex flex-col p-6 transition ${selected ? "ring-2 ring-orange" : ""} ${muted ? "opacity-80" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-muted">#{rank}</div>
          <button onClick={onOpen} className="text-left text-lg font-semibold leading-tight tracking-tight hover:underline">{c.name}</button>
          <p className="mt-0.5 text-sm text-muted">{c.current_role} · {c.seniority}</p>
        </div>
        <button onClick={onOpen} aria-label={t("evidence")} className="grid size-9 shrink-0 place-items-center rounded-full bg-canvas transition hover:bg-brand hover:text-on-brand">
          <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-orange px-3 py-1 text-xs font-semibold text-on-brand">{c.fit}% match</span>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${c.availability === "En banca" ? "bg-brand text-on-brand" : "bg-canvas text-ink"}`}>{avShort}</span>
        {c.hidden.different_area && <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-1 text-xs font-medium"><Sparkles size={11} />{t("differentArea")}</span>}
        {onSelect && (
          <label className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={selected} onChange={onSelect} className="accent-orange" />
            {t("compare")}
          </label>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-canvas p-4">
          <div className="text-3xl font-semibold tabular-nums tracking-tight">{c.years_experience}</div>
          <div className="text-xs text-muted">{es ? "años de experiencia" : "years experience"}</div>
        </div>
        <div className="rounded-2xl bg-canvas p-4" title={es ? "Dato no disponible en el perfil" : "Not in the profile data"}>
          <div className="text-3xl font-semibold tabular-nums tracking-tight text-muted">—</div>
          <div className="text-xs text-muted">{es ? "años en la empresa" : "years at company"}</div>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">{t("whyFits")}</div>
        <p className="mt-1.5 text-sm leading-relaxed">
          {c.strengths.map((x) => x.replace(/[.\s]+$/, "")).join(". ")}.
          {implicitMet.length > 0 && <span className="text-muted"> {es ? "Cubre requisitos implícitos:" : "Covers implicit needs:"} {implicitMet.map((r) => r.value).join(", ")}.</span>}
        </p>
        {c.hidden.vocab_bridges.length > 0 && (
          <p className="mt-1 text-xs text-muted">{c.hidden.vocab_bridges.map((b) => `${b.asked} → ${b.found}`).join(" · ")}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.coverage.map((cv) => {
            const r = reqById[cv.req_id];
            if (!r) return null;
            return (
              <span key={cv.req_id} className="inline-flex items-center gap-1 rounded-full bg-canvas px-3 py-1 text-xs">
                <StatusIcon status={cv.status} size={12} />
                {r.type === "language" && <Languages size={11} className="text-muted" />}
                <span className={r.must ? "font-semibold" : ""}>{r.value}</span>
                {r.level && <span className="text-muted">{r.level}</span>}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-5">
        <div className="rounded-2xl bg-orange/10 p-4 text-sm text-warn">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide">{t("risksGaps")}</div>
          {c.gaps.length + c.risks.length === 0 ? <p className="opacity-80">{t("noRisks")}</p> : (
            <ul className="space-y-0.5 leading-relaxed">
              {[...c.gaps, ...c.risks].map((x) => <li key={x} className="flex gap-1.5"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />{x}</li>)}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

function Kpis({ brief, result, pass }: { brief: Brief; result: MatchResult; pass: (c: Candidate) => boolean }) {
  const es = useContext(LangContext) === "es";
  const picks = result.roles.flatMap((r) => {
    const hc = brief.roles.find((x) => x.id === r.role_id)?.headcount ?? 1;
    return r.candidates.filter(pass).slice(0, hc).map((c) => ({ c, need: hc }));
  });
  const slots = brief.roles.reduce((n, r) => n + r.headcount, 0);
  const ids = new Set(picks.map((p) => p.c.employee_id));
  const complete = picks.length >= slots && ids.size === picks.length;
  const coverage = picks.length ? Math.round(picks.reduce((s, p) => s + p.c.fit, 0) / slots) : 0;
  const all = Array.from(new Map(result.roles.flatMap((r) => r.candidates).filter(pass).map((c) => [c.employee_id, c])).values());
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
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="p-6">
        <div className="text-sm text-muted">{es ? "Cobertura del equipo" : "Team coverage"}</div>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <span className="text-4xl font-semibold tabular-nums tracking-tight">{coverage}%</span>
          <span className={`mb-1 rounded-full px-3 py-1 text-xs font-semibold ${complete ? "bg-orange text-on-brand" : "bg-orange/10 text-warn"}`}>
            {complete ? (es ? "Equipo completo sin duplicados" : "Full team, no duplicates") : (es ? `${picks.length}/${slots} puestos cubiertos` : `${picks.length}/${slots} slots filled`)}
          </span>
        </div>
      </Card>
      <Card className="p-6">
        <div className="text-sm text-muted">{es ? "Disponibilidad inmediata" : "Immediate availability"}</div>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <span className="text-4xl font-semibold tabular-nums tracking-tight">{bench}</span>
            <span className="ml-1.5 text-sm text-muted">{es ? "en banca" : "on bench"} · {roll} roll-off</span>
          </div>
          <div className="flex h-12 items-end gap-1.5">
            {bars.map((b) => (
              <div key={b.label} title={`${b.label}: ${b.n}`} className={`w-5 rounded-full ${b.hi ? "bg-orange" : "bg-brand-soft"}`} style={{ height: `${Math.max(12, (b.n / max) * 100)}%` }} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}


function ReserveLane({ rr, reqs, onOpen }: { rr: RoleResult; reqs: Requirement[]; onOpen: (c: Candidate) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand-soft p-6">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 text-left">
        <span className="font-medium">{t("reserveTitle")}</span>
        <Pill>{rr.reserve.length}</Pill>
        <ChevronDown size={16} className={`ml-auto text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      <p className="mt-1 text-xs text-muted">{t("reserveHint")}</p>
      {open && (
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {rr.reserve.map((c, i) => (
            <CandidateCard key={c.employee_id} c={c} rank={i + 1} reqs={reqs} onOpen={() => onOpen(c)} muted />
          ))}
        </div>
      )}
    </div>
  );
}
