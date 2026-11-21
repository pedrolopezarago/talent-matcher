import { Search } from "lucide-react";
import type { Availability } from "@/shared/contract";
import { useT } from "../i18n";
import { Card, Spinner } from "./ui";

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
const avTone: Record<Availability, string> = {
  "En banca": "bg-sage border-sage-line",
  "Roll-off próximo (<3 meses)": "bg-peach border-peach",
  "Asignado": "bg-muted/10 border-line",
};

export function BriefInput({ text, setText, onAnalyse, loading }: {
  text: string; setText: (s: string) => void; onAnalyse: () => void; loading: boolean;
}) {
  const t = useT();
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">{t("briefTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{t("briefHint")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex.label} onClick={() => setText(ex.text)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${text === ex.text ? "bg-brand text-on-brand" : "bg-canvas text-muted hover:text-ink"}`}>
            {ex.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("briefPlaceholder")}
        rows={5}
        className="mt-4 w-full resize-y rounded-2xl bg-canvas p-4 text-[15px] leading-relaxed outline-none transition focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/10"
      />
      <div className="mt-4 flex">
        <button
          onClick={onAnalyse}
          disabled={!text.trim() || loading}
          className="ml-auto inline-flex items-center gap-2.5 rounded-full bg-brand py-2 pl-2 pr-5 text-sm font-semibold text-on-brand transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Spinner /> : <span className="grid size-6 place-items-center rounded-full bg-orange"><Search size={13} /></span>}
          {loading ? t("analysing") : t("findTalent")}
        </button>
      </div>
    </Card>
  );
}
