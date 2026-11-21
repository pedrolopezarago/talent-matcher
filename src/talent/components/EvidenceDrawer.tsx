import { Quote, X } from "lucide-react";
import { useEffect } from "react";
import type { Candidate, Requirement } from "@/shared/contract";
import { useT } from "../i18n";
import { availabilityTone, FitRing, Pill, StatusIcon } from "./ui";

export function EvidenceDrawer({ c, reqs, onClose }: { c: Candidate; reqs: Requirement[]; onClose: () => void }) {
  const t = useT();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const statusLabel = { met: t("met"), partial: t("partial"), missing: t("missing") };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-brand/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="relative h-full w-full max-w-lg overflow-y-auto overscroll-contain bg-surface shadow-2xl motion-safe:animate-[slide_220ms_cubic-bezier(0.2,0,0,1)_both] motion-reduce:animate-[fade_220ms_ease-out_both]">
        <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-surface/95 px-6 py-4 backdrop-blur">
          <FitRing fit={c.fit} size={48} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{c.name}</h3>
            <p className="truncate text-sm text-muted">{c.current_role} · {c.area}</p>
          </div>
          <button onClick={onClose} aria-label={t("close")} className="rounded-lg p-1.5 text-muted hover:bg-canvas"><X size={18} /></button>
        </div>

        <div className="space-y-6 px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <Pill tone={availabilityTone(c.availability)}>{c.availability}</Pill>
            <Pill>{c.seniority}</Pill>
            <Pill>{c.years_experience} {t("years")}</Pill>
            <Pill>{c.city}, {c.country}</Pill>
            <Pill>{c.employee_id}</Pill>
          </div>

          <section>
            <h4 className="text-sm font-semibold">{t("evidence")}</h4>
            <div className="mt-2 space-y-2">
              {c.coverage.map((cv) => {
                const r = reqs.find((x) => x.id === cv.req_id);
                return (
                  <div key={cv.req_id} className="rounded-xl border border-line p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <StatusIcon status={cv.status} />
                      <span className="font-medium">{r?.value ?? cv.req_id}</span>
                      {r && <span className="text-xs text-muted">{r.must ? t("must") : t("nice")}</span>}
                      <span className="ml-auto text-xs text-muted">{statusLabel[cv.status]}</span>
                    </div>
                    {cv.evidence.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {cv.evidence.map((e) => (
                          <li key={e.path} className="flex items-start gap-2 rounded-lg bg-brand-soft/60 px-2.5 py-1.5 text-[13px]">
                            <Quote size={12} className="mt-0.5 shrink-0 text-brand" />
                            <span className="flex-1">{e.value}</span>
                            <code className="shrink-0 text-[11px] text-muted">{e.path}</code>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 text-[13px] text-muted">{t("noEvidence")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {[["strengths", c.strengths, "text-ok"], ["gaps", c.gaps, "text-bad"], ["risks", c.risks, "text-warn"]].map(([k, items, color]) =>
            (items as string[]).length ? (
              <section key={k as string}>
                <h4 className={`text-sm font-semibold ${color}`}>{t(k as "strengths")}</h4>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{(items as string[]).map((s) => <li key={s}>{s}</li>)}</ul>
              </section>
            ) : null,
          )}
        </div>
      </aside>
    </div>
  );
}
