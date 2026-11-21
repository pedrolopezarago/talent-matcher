import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, ArrowRight, Award, BookOpen, Briefcase, GraduationCap, Info, Lightbulb, Repeat, ShieldAlert, ShieldCheck, UsersRound } from "lucide-react";
import type { Brief, MatchResult, TeamResult, TrainingRecommendation } from "@/shared/contract";
import { useT } from "../i18n";
import { analyseTeamRisks, type TeamRisk } from "../team-risks";
import { Card, FitRing, fitColor } from "./ui";

type Translator = ReturnType<typeof useT>;

export function TeamView({ brief, match, team, onBack }: { brief: Brief; match: MatchResult; team: TeamResult; onBack: () => void }) {
  const t = useT();
  const title = (id: string) => brief.roles.find((r) => r.id === id)?.title ?? id;
  const nameOf = (id: string) => team.optimal.find((s) => s.employee_id === id)?.name ?? team.greedy.find((s) => s.employee_id === id)?.name ?? id;
  const swappedIn = new Set(team.swaps.map((s) => s.optimal));
  const risks = analyseTeamRisks(brief, match, team);
  const hasCriticalRisks = risks.some((risk) => risk.severity === "critical");

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

      <section aria-labelledby="team-risk-title" className="rounded-2xl border border-line bg-surface/80 p-5 backdrop-blur-md sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="team-risk-title" className="flex items-center gap-2 font-semibold">
              {hasCriticalRisks ? <ShieldAlert size={19} className="text-brand" /> : <ShieldCheck size={19} className="text-ok" />}
              {t("teamRisksTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted">{t("teamRisksHint")}</p>
          </div>
          {risks.length > 0 && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">{risks.length}</span>}
        </div>

        {!hasCriticalRisks && (
          <div className="mt-5 rounded-xl border border-ok/20 bg-ok-soft p-4">
            <div className="flex items-center gap-2 font-display font-semibold text-ok"><ShieldCheck size={18} />{t("noCriticalRisks")}</div>
            <p className="mt-1 text-sm text-muted">{t("noCriticalRisksHint")}</p>
          </div>
        )}

        {risks.length > 0 && (
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {risks.map((risk) => {
              const critical = risk.severity === "critical";
              const reinforcement = ["coverageMissing", "coveragePartial", "singlePoint", "leadership"].includes(risk.kind);
              const action = t(reinforcement ? "suggestReinforcement" : "adjustRole");
              return (
                <li key={risk.id} className={`flex flex-col rounded-xl border p-4 ${critical ? "border-brand/25 bg-brand/10" : "border-hidden/20 bg-hidden-soft/30"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${critical ? "bg-brand/10 text-brand-dark" : "bg-surface/70 text-hidden"}`}>
                      {critical ? <AlertTriangle size={16} /> : <Info size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${critical ? "border-brand/25 bg-brand/10 text-brand-dark" : "border-hidden/20 bg-surface/60 text-hidden"}`}>
                        {t(critical ? "criticalLabel" : "warningLabel")}
                      </span>
                      <h4 className="mt-2 font-display font-semibold">{riskTitle(risk, t)}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{riskDescription(risk, t)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-1 flex-col justify-end rounded-xl bg-surface/70 p-3">
                    <div className="flex items-start gap-2 text-sm text-muted">
                      <Lightbulb size={15} className="mt-0.5 shrink-0 text-support-dark" />
                      <span>{riskRecommendation(risk, t)}</span>
                    </div>
                    <Button
                      variant="plain"
                      onClick={onBack}
                      aria-label={`${action}: ${risk.subject}`}
                      className="mt-2 inline-flex h-auto items-center gap-1 self-start px-0 py-1 text-xs font-semibold text-support-dark hover:bg-transparent hover:text-support"
                    >
                      {action}<ArrowRight size={13} />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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

function riskTitle(risk: TeamRisk, t: Translator) {
  switch (risk.kind) {
    case "coverageMissing": return t("coverageMissingTitle", { requirement: risk.subject });
    case "coveragePartial": return t("coveragePartialTitle", { requirement: risk.subject });
    case "singlePoint": return t("singlePointTitle", { requirement: risk.subject });
    case "availability": return t("availabilityRiskTitle", { person: risk.subject });
    case "dedication": return t("dedicationRiskTitle", { person: risk.subject });
    case "seniority": return t("seniorityRiskTitle", { person: risk.subject });
    case "experience": return t("experienceRiskTitle", { person: risk.subject });
    case "leadership": return t("leadershipRiskTitle", { role: risk.roleTitle });
  }
}

function riskDescription(risk: TeamRisk, t: Translator) {
  const coverage = risk.coverage?.map((item) => `${item.name}: ${t(item.status === "partial" ? "partial" : "missing")}`).join(" · ") ?? "";
  const start = risk.startDate || t("immediate");
  switch (risk.kind) {
    case "coverageMissing": return t("coverageMissingDesc", { role: risk.roleTitle, people: coverage });
    case "coveragePartial": return t("coveragePartialDesc", { role: risk.roleTitle, people: coverage });
    case "singlePoint": return t("singlePointDesc", { person: risk.person ?? "", role: risk.roleTitle });
    case "availability": return t(risk.actual === "Asignado" ? "availabilityAssignedDesc" : "availabilityRolloffDesc", { person: risk.subject, start });
    case "dedication": return t("dedicationRiskDesc", { person: risk.subject });
    case "seniority": return t("seniorityRiskDesc", { person: risk.subject, actual: risk.actual ?? "", role: risk.roleTitle, expected: risk.expected ?? "" });
    case "experience": return t("experienceRiskDesc", { person: risk.subject, actual: risk.actual ?? "", expected: risk.expected ?? "" });
    case "leadership": return t("leadershipRiskDesc", { role: risk.roleTitle });
  }
}

function riskRecommendation(risk: TeamRisk, t: Translator) {
  switch (risk.kind) {
    case "coverageMissing":
    case "coveragePartial": return t("recommendReinforcement");
    case "singlePoint": return t("recommendCrossTraining");
    case "availability": return t("recommendAvailability");
    case "dedication": return t("recommendDedication");
    case "seniority":
    case "experience": return t("recommendRoleAdjustment");
    case "leadership": return t("recommendLeadership");
  }
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
