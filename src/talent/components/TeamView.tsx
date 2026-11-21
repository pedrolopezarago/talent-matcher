import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Award, BookOpen, Briefcase, GraduationCap, Repeat, UsersRound } from "lucide-react";
import type { Brief, TeamResult, TrainingRecommendation } from "@/shared/contract";
import { useT } from "../i18n";
import { Card, FitRing, fitColor } from "./ui";

export function TeamView({ brief, team, onBack }: { brief: Brief; team: TeamResult; onBack: () => void }) {
  const t = useT();
  const title = (id: string) => brief.roles.find((r) => r.id === id)?.title ?? id;
  const nameOf = (id: string) => team.optimal.find((s) => s.employee_id === id)?.name ?? team.greedy.find((s) => s.employee_id === id)?.name ?? id;
  const swappedIn = new Set(team.swaps.map((s) => s.optimal));

  return (
    <div className="space-y-4">
      <Button variant="plain" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> {t("backToResults")}
      </Button>

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
                <div className="text-xs text-muted">{title(s.role_id)}{(brief.roles.find((r) => r.id === s.role_id)?.headcount ?? 1) > 1 ? ` · ${t("slot")} ${s.slot}` : ""}</div>
                <div className="font-display font-semibold">{s.name}</div>
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

      {team.training && team.training.length > 0 && (
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 font-semibold"><GraduationCap size={18} className="text-brand" />{t("formationTitle")}</h3>
              <p className="mt-1 text-sm text-muted">{t("formationHint")}</p>
            </div>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">{team.training.length}</span>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {team.training.map((plan) => (
              <section key={`${plan.role_id}-${plan.employee_id}`} className="rounded-2xl border border-line bg-surface p-4">
                <div className="font-display font-semibold">{plan.name}</div>
                <div className="mt-0.5 text-xs text-muted">{title(plan.role_id)}</div>
                <ul className="mt-4 space-y-3">
                  {plan.recommendations.map((rec) => (
                    <li key={`${rec.requirement}-${rec.training}`} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-dark"><TrainingIcon kind={rec.kind} /></span>
                      <div>
                        <div className="text-xs font-medium text-brand-dark">{rec.requirement}</div>
                        <p className="mt-0.5 text-sm leading-relaxed">{rec.training}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function TrainingIcon({ kind }: { kind: TrainingRecommendation["kind"] }) {
  if (kind === "certification") return <Award size={16} />;
  if (kind === "mentoring") return <UsersRound size={16} />;
  if (kind === "project") return <Briefcase size={16} />;
  return <BookOpen size={16} />;
}

function ScoreBar({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-48 shrink-0 text-sm ${strong ? "font-semibold" : "text-muted"}`}>{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-canvas">
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${value}%`, background: strong ? fitColor(value) : "var(--color-line)" }} />
      </div>
      <span className={`w-12 font-display text-right tabular-nums ${strong ? "font-semibold" : "text-muted"}`}>{value}%</span>
    </div>
  );
}
