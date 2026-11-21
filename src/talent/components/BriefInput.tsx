import { Search } from "lucide-react";
import type { Availability } from "@/shared/contract";
import { useT } from "../i18n";
import { Card, Spinner } from "./ui";

// Drafts from shared/test-briefs.md — replace with NTT DATA's real briefs when we get them.
export const EXAMPLES = [
  {
    label: "Migración Core Bancario",
    text: "We are migrating a mid-size bank's core banking platform to AWS. We need a Cloud Architect with AWS and Terraform experience, two Java backend developers with microservices and Kafka, and a project manager used to working with regulated clients. Start in two months, hybrid in Madrid. Good English required.",
  },
  {
    label: "Asistente IA Retail",
    text: "A retail client wants a customer-service AI assistant. We need a Senior AI Engineer with experience building RAG solutions and agents on Azure, and a frontend developer with React. Experience in the retail sector is a plus but not essential. Knowledge of LangChain is valued.",
  },
  {
    label: "Ciberseguridad Sector Público",
    text: "A public administration needs to reinforce its security operations. We need two cybersecurity analysts with SIEM and incident response experience and a security architect. Immediate availability and at least 3 years of total experience are mandatory. ISO 27001 or CISSP certification is desirable. Spanish native level.",
  },
];

export type HardFilters = { availability: Availability[]; minYears: number };
export const ALL_AVAILABILITY: Availability[] = ["En banca", "Roll-off próximo (<3 meses)", "Asignado"];
const avTone: Record<Availability, string> = {
  "En banca": "bg-sage border-sage-line",
  "Roll-off próximo (<3 meses)": "bg-peach border-peach",
  "Asignado": "bg-muted/10 border-line",
};

export function BriefInput({ text, setText, onAnalyse, loading, filters, setFilters }: {
  text: string; setText: (s: string) => void; onAnalyse: () => void; loading: boolean;
  filters: HardFilters; setFilters: (f: HardFilters) => void;
}) {
  const t = useT();
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{t("briefTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{t("briefHint")}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("briefPlaceholder")}
        rows={5}
        className="mt-4 w-full resize-y rounded-xl border border-line bg-canvas p-4 text-[15px] leading-relaxed outline-none transition focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10"
      />
      <div className="mt-5 rounded-xl border border-sage-line bg-sage/60 p-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="text-sm font-semibold">{t("filtersTitle")}</h3>
          <span className="text-xs text-muted">{t("filtersHint")}</span>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <div className="mb-1.5 text-xs font-medium text-muted">{t("availabilityLabel")}</div>
            <div className="flex flex-wrap gap-2">
              {ALL_AVAILABILITY.map((a) => {
                const on = filters.availability.includes(a);
                return (
                  <button
                    key={a} aria-pressed={on}
                    onClick={() => setFilters({ ...filters, availability: on ? filters.availability.filter((x) => x !== a) : [...filters.availability, a] })}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${on ? `${avTone[a]} text-ink` : "border-sage-line bg-surface text-muted hover:text-ink"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block">
            <div className="mb-1.5 text-xs font-medium text-muted">{t("minYearsLabel")}</div>
            <select
              value={filters.minYears}
              onChange={(e) => setFilters({ ...filters, minYears: Number(e.target.value) })}
              className="w-full rounded-lg border border-sage-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand md:w-44"
            >
              {[0, 1, 2, 3, 5, 8, 10].map((n) => <option key={n} value={n}>{n === 0 ? t("anyYears") : `${n}+`}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="mt-4 flex">
        <button
          onClick={onAnalyse}
          disabled={!text.trim() || loading}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Spinner /> : <Search size={16} />}
          {loading ? t("analysing") : t("findTalent")}
        </button>
      </div>
    </Card>
  );
}
