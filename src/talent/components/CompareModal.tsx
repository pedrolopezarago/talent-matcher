import { Content } from "@radix-ui/react-dialog";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { useT } from "../i18n";
import { selectionKey, type ProfileEntry } from "../results-state";
import { FitRing, StatusIcon } from "./ui";

export function CompareBar({ n, onOpen, onClear }: { n: number; onOpen: () => void; onClear: () => void }) {
  const t = useT();
  if (n < 1) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-3 rounded-lg border border-support/20 bg-surface px-4 py-3 text-sm shadow-soft">
        <span className="font-display text-lg font-semibold tabular-nums text-support-dark">{n}</span>
        <Button variant="plain" size="sm" onClick={onClear}>{t("clear")}</Button>
        <Button variant="support" className="h-auto min-h-9 py-2" onClick={onOpen} disabled={n < 2}>
          <Scale size={16} />{t("compareN", { n })}
        </Button>
      </div>
    </div>
  );
}

export function CompareModal({ entries, onClose }: { entries: ProfileEntry[]; onClose: () => void }) {
  const t = useT();
  const roles = Array.from(new Map(entries.map((entry) => [entry.roleId, entry])).values());
  const rows = roles.flatMap((entry) => entry.reqs.map((req) => ({ req, roleId: entry.roleId, roleTitle: entry.roleTitle })));
  const cell = "min-w-[180px] border-b border-line px-3 py-4 align-top text-left";
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPortal>
        <DialogOverlay className="bg-overlay backdrop-blur-[2px]" />
        <Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col gap-6 rounded-lg border border-line bg-surface p-6 shadow-soft sm:max-h-[calc(100dvh-64px)] sm:w-[calc(100%-64px)] sm:p-8">
          <div className="flex shrink-0 items-center justify-between gap-6">
            <DialogTitle className="font-display text-2xl">{t("compare")}</DialogTitle>
            <DialogClose asChild><Button variant="plain" size="icon" aria-label={t("close")}><X size={18} /></Button></DialogClose>
          </div>
          <div className="min-h-0 overflow-auto overscroll-contain">
            <div className="space-y-6 sm:hidden">
              {entries.map(({ c, roleId, roleTitle, reqs }) => (
                <section key={selectionKey(roleId, c.employee_id)} className="border-b border-line pb-6">
                  <div className="mb-3 text-xs text-muted">{roleTitle}</div>
                  <div className="flex items-start gap-3">
                    <FitRing fit={c.fit} size={48} />
                    <div className="min-w-0"><h3 className="text-lg font-semibold">{c.name}</h3><p className="mt-1 text-xs text-muted">{c.seniority} · {c.availability}</p></div>
                  </div>
                  <dl className="mt-5 space-y-4 text-sm leading-relaxed">
                    {reqs.map((req) => {
                      const cv = c.coverage.find((x) => x.req_id === req.id);
                      return <div key={req.id}>
                        <dt className="font-display font-semibold">{req.value} <span className="font-sans text-xs font-normal text-muted">· {req.must ? t("must") : t("nice")}</span></dt>
                        <dd className="mt-1 flex items-start gap-2 text-xs text-muted"><span className="mt-1 shrink-0"><StatusIcon status={cv?.status ?? "missing"} /></span>{cv?.evidence.map((e) => e.value).join(" · ") || t("noEvidence")}</dd>
                      </div>;
                    })}
                    {(["strengths", "gaps", "risks"] as const).map((k) => <div key={k}><dt className="font-display font-semibold">{t(k)}</dt><dd className="mt-1 text-xs text-muted">{c[k].join(" · ") || "—"}</dd></div>)}
                  </dl>
                </section>
              ))}
            </div>
            <table className="hidden w-full border-separate border-spacing-x-6 border-spacing-y-0 text-sm leading-relaxed sm:table">
              <thead>
                <tr>
                  <th className={`${cell} min-w-[160px] text-xs font-normal text-muted`}>{t("requirement")}</th>
                  {entries.map(({ c, roleId, roleTitle }) => (
                    <th key={selectionKey(roleId, c.employee_id)} className={cell}>
                      <div className="mb-3 text-xs font-normal text-muted">{roleTitle}</div>
                      <div className="flex items-start gap-3">
                        <FitRing fit={c.fit} size={48} />
                        <div className="min-w-0">
                          <div className="font-display text-lg font-semibold">{c.name}</div>
                          <div className="mt-1 text-xs font-normal text-muted">{c.seniority} · {c.availability}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ req, roleId, roleTitle }) => (
                  <tr key={selectionKey(roleId, req.id)}>
                    <td className={cell}>
                      {roles.length > 1 && <div className="mb-1 font-display text-sm text-ink">{roleTitle}</div>}
                      <span className={req.must ? "font-bold" : "text-muted"}>{req.value}</span>
                      <div className="mt-1 text-xs text-muted">{req.must ? t("must") : t("nice")}</div>
                    </td>
                    {entries.map(({ c, roleId: candidateRole }) => {
                      const cv = candidateRole === roleId ? c.coverage.find((x) => x.req_id === req.id) : undefined;
                      return (
                        <td key={selectionKey(candidateRole, c.employee_id)} className={cell}>
                          {candidateRole !== roleId ? <span className="text-muted">—</span> : (
                            <div className="flex items-start gap-2">
                              <span className="mt-1 shrink-0"><StatusIcon status={cv?.status ?? "missing"} /></span>
                              <span className="text-[13px] text-ink/80">{cv?.evidence.map((e) => e.value).join(" · ") || t("noEvidence")}</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {(["strengths", "gaps", "risks"] as const).map((k) => (
                  <tr key={k}>
                    <td className={`${cell} font-display font-semibold ${k === "strengths" ? "text-ok" : k === "gaps" ? "text-bad" : "text-warn"}`}>{t(k)}</td>
                    {entries.map(({ c, roleId }) => <td key={selectionKey(roleId, c.employee_id)} className={`${cell} text-[13px]`}>{c[k].join(" · ") || "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Content>
      </DialogPortal>
    </Dialog>
  );
}
