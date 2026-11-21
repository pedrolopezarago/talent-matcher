import { X } from "lucide-react";
import type { Candidate, Requirement } from "../../../shared/contract";
import { useT } from "../i18n";
import { FitRing, StatusIcon } from "./ui";

export function CompareBar({ n, onOpen, onClear }: { n: number; onOpen: () => void; onClear: () => void }) {
  const t = useT();
  if (n < 1) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-2.5 text-sm text-white shadow-xl">
        <span>{n} / 4</span>
        <button onClick={onClear} className="text-white/60 hover:text-white">{t("clear")}</button>
        <button
          onClick={onOpen} disabled={n < 2}
          className="rounded-xl bg-brand px-3 py-1.5 font-semibold transition hover:bg-brand-dark disabled:opacity-40"
        >
          {t("compareN", { n })}
        </button>
      </div>
    </div>
  );
}

export function CompareModal({ cands, reqs, onClose }: { cands: Candidate[]; reqs: Requirement[]; onClose: () => void }) {
  const t = useT();
  const cell = "border-b border-line px-3 py-2.5 align-top";
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center border-b border-line bg-white px-5 py-3">
          <h3 className="font-semibold">{t("compare")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="ml-auto rounded-lg p-1.5 text-muted hover:bg-canvas"><X size={18} /></button>
        </div>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr>
              <th className={`${cell} w-44 text-left text-xs font-medium text-muted`}>{t("requirement")}</th>
              {cands.map((c) => (
                <th key={c.employee_id} className={`${cell} text-left`}>
                  <div className="flex items-center gap-3">
                    <FitRing fit={c.fit} size={44} />
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs font-normal text-muted">{c.seniority} · {c.availability}</div>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reqs.map((r) => (
              <tr key={r.id}>
                <td className={cell}>
                  <span className={r.must ? "font-medium" : "text-muted"}>{r.value}</span>
                  <span className="ml-1 text-[11px] text-muted">{r.must ? t("must") : t("nice")}</span>
                </td>
                {cands.map((c) => {
                  const cv = c.coverage.find((x) => x.req_id === r.id);
                  return (
                    <td key={c.employee_id} className={cell}>
                      <div className="flex items-start gap-1.5">
                        <StatusIcon status={cv?.status ?? "missing"} />
                        <span className="text-[13px] text-ink/80">{cv?.evidence[0]?.value ?? "—"}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {(["strengths", "gaps", "risks"] as const).map((k) => (
              <tr key={k}>
                <td className={`${cell} text-xs font-semibold ${k === "strengths" ? "text-ok" : k === "gaps" ? "text-bad" : "text-warn"}`}>{t(k)}</td>
                {cands.map((c) => (
                  <td key={c.employee_id} className={`${cell} text-[13px]`}>
                    {c[k].length ? c[k].join(" · ") : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
