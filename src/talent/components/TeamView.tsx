import { ArrowLeft, ArrowRight, Repeat } from "lucide-react";
import type { Brief, TeamResult } from "@/shared/contract";
import { useT } from "../i18n";
import { Card, FitRing, fitColor } from "./ui";

export function TeamView({ brief, team, onBack }: { brief: Brief; team: TeamResult; onBack: () => void }) {
  const t = useT();
  const title = (id: string) => brief.roles.find((r) => r.id === id)?.title ?? id;
  const nameOf = (id: string) => team.optimal.find((s) => s.employee_id === id)?.name ?? team.greedy.find((s) => s.employee_id === id)?.name ?? id;
  const swappedIn = new Set(team.swaps.map((s) => s.optimal));

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("backToResults")}
      </button>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">{t("teamTitle")}</h2>
        <div className="mt-4 space-y-3">
          <ScoreBar label={t("optimal")} value={team.optimal_score} strong />
          <ScoreBar label={t("greedy")} value={team.greedy_score} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {team.optimal.map((s) => (
            <div key={`${s.role_id}-${s.slot}`} className={`flex items-center gap-3 rounded-2xl border p-3 ${swappedIn.has(s.name) ? "border-hidden/40 bg-hidden-soft/40" : "border-line"}`}>
              <FitRing fit={s.fit} size={48} />
              <div className="min-w-0">
                <div className="text-xs text-muted">{title(s.role_id)}{brief.roles.find((r) => r.id === s.role_id)?.headcount! > 1 ? ` · ${t("slot")} ${s.slot}` : ""}</div>
                <div className="truncate font-semibold">{s.name}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {team.swaps.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-semibold"><Repeat size={16} className="text-hidden" />{t("swaps")}</h3>
          <ul className="mt-3 space-y-2">
            {team.swaps.map((s) => (
              <li key={s.role_id + s.greedy} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-40 text-muted">{title(s.role_id)}</span>
                <span className="line-through decoration-bad/60">{s.greedy}</span>
                <ArrowRight size={14} className="text-muted" />
                <span className="font-semibold">{s.optimal}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-2xl bg-canvas p-3 text-sm leading-relaxed">{team.explanation}</p>
        </Card>
      )}

      <Card className="p-5 sm:p-6">
        <h3 className="font-semibold">{t("jointCoverage")}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {team.joint_coverage.map((j) => (
            <span key={j.req_value} title={j.covered_by.map(nameOf).join(", ")} className="rounded-full bg-ok-soft px-3 py-1 text-xs font-medium text-ok">
              {j.req_value} <span className="opacity-60">· {j.covered_by.map((id) => nameOf(id).split(" ")[0]).join(", ")}</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ScoreBar({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-48 shrink-0 text-sm ${strong ? "font-semibold" : "text-muted"}`}>{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, background: strong ? fitColor(value) : "var(--color-line)" }} />
      </div>
      <span className={`w-12 text-right tabular-nums ${strong ? "font-semibold" : "text-muted"}`}>{value}%</span>
    </div>
  );
}
