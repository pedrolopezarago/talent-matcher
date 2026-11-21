import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import type { Availability } from "@/shared/contract";
import { useT } from "../i18n";
import { Spinner } from "./ui";

// Drafts from shared/test-briefs.md — replace with NTT DATA's real briefs when we get them.
export const EXAMPLES = [
  {
    label: "Core Banking Migration",
    text: "We are migrating a mid-size bank's core banking platform to AWS. We need a Cloud Architect with AWS and Terraform experience, two Java backend developers with microservices and Kafka, and a project manager used to working with regulated clients. Start in two months, hybrid in Madrid. Good English required.",
  },
  {
    label: "AI Assistant Retail",
    text: "A retail client wants a customer-service AI assistant. We need a Senior AI Engineer with experience building RAG solutions and agents on Azure, and a frontend developer with React. Experience in the retail sector is a plus but not essential. Knowledge of LangChain is valued.",
  },
  {
    label: "Cybersecurity Public Sector",
    text: "A public administration needs to reinforce its security operations. We need two cybersecurity analysts with SIEM and incident response experience and a security architect. Immediate availability and at least 3 years of total experience are mandatory. ISO 27001 or CISSP certification is desirable. Spanish native level.",
  },
];

export type HardFilters = { availability: Availability[]; minYears: number };
export const ALL_AVAILABILITY: Availability[] = ["En banca", "Roll-off próximo (<3 meses)", "Asignado"];

export function BriefInput({ text, setText, onAnalyse, loading, filters, setFilters, showInput = true }: {
  text: string; setText: (s: string) => void; onAnalyse: () => void; loading: boolean;
  filters: HardFilters; setFilters: (f: HardFilters) => void; showInput?: boolean;
}) {
  const t = useT();
  const pill = (on: boolean) => `rounded-md px-2.5 py-1 text-xs font-medium transition ${on ? "bg-support-soft text-support-dark" : "bg-brand-soft text-ink hover:bg-support-soft"}`;
  return (
    <div className="space-y-4">
      {showInput && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("briefPlaceholder")}
          rows={5}
          className="w-full resize-y rounded-2xl border border-line bg-brand-soft p-4 text-[15px] leading-relaxed outline-none transition placeholder:text-muted focus:bg-surface focus:ring-4 focus:ring-ink/10"
        />
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {showInput && (
          <div className="flex flex-wrap items-center gap-1.5">
            {EXAMPLES.map((ex) => (
              <Button variant="plain" key={ex.label} onClick={() => setText(ex.text)} className={pill(text === ex.text)}>{ex.label}</Button>
            ))}
          </div>
        )}
        {showInput && <span className="hidden h-4 w-px bg-line md:block" />}
        <div className="flex flex-wrap items-center gap-1.5">
          {ALL_AVAILABILITY.map((a) => {
            const on = filters.availability.includes(a);
            return (
              <Button variant="plain" key={a} aria-pressed={on} className={pill(on)}
                onClick={() => setFilters({ ...filters, availability: on ? filters.availability.filter((x) => x !== a) : [...filters.availability, a] })}>
                {a.replace("Roll-off próximo (<3 meses)", "Roll-off <3m")}
              </Button>
            );
          })}
          <select value={filters.minYears} onChange={(e) => setFilters({ ...filters, minYears: Number(e.target.value) })}
            aria-label={t("minYearsLabel")} className={`rounded-md ${filters.minYears ? "bg-support-soft text-support-dark" : "bg-brand-soft"} px-2 py-1 text-xs font-medium outline-none`}>
            {[0, 1, 2, 3, 5, 8, 10].map((n) => <option key={n} value={n}>{n === 0 ? t("anyYears") : `${n}+ ${t("years")}`}</option>)}
          </select>
        </div>
        {showInput && (
          <Button variant="plain"
            onClick={onAnalyse}
            disabled={!text.trim() || loading}
            className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? <Spinner /> : <Search size={15} />}
            {loading ? t("analysing") : t("findTalent")}
          </Button>
        )}
      </div>
    </div>
  );
}
