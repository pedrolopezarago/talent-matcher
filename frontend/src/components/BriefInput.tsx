import { Sparkles } from "lucide-react";
import { useT } from "../i18n";
import { Card, Spinner } from "./ui";

// Drafts from shared/test-briefs.md — replace with NTT DATA's real briefs when we get them.
const EXAMPLES = [
  {
    label: "Core banking → cloud",
    text: "We are migrating a mid-size bank's core banking platform to AWS. We need a Cloud Architect with AWS and Terraform experience, two Java backend developers with microservices and Kafka, and a project manager used to working with regulated clients. Start in two months, hybrid in Madrid. Good English required.",
  },
  {
    label: "AI assistant for retail",
    text: "A retail client wants a customer-service AI assistant. We need a Senior AI Engineer with experience building RAG solutions and agents on Azure, and a frontend developer with React. Experience in the retail sector is a plus but not essential. Knowledge of LangChain is valued.",
  },
  {
    label: "Public sector cybersecurity",
    text: "A public administration needs to reinforce its security operations. We need two cybersecurity analysts with SIEM and incident response experience and a security architect. Immediate availability and at least 3 years of total experience are mandatory. ISO 27001 or CISSP certification is desirable. Spanish native level.",
  },
];

export function BriefInput({ text, setText, onAnalyse, loading }: {
  text: string; setText: (s: string) => void; onAnalyse: () => void; loading: boolean;
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
        className="mt-4 w-full resize-y rounded-xl border border-line bg-canvas/60 p-4 text-[15px] leading-relaxed outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">{t("examples")}:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setText(ex.text)}
            className="rounded-full border border-line px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            {ex.label}
          </button>
        ))}
        <button
          onClick={onAnalyse}
          disabled={!text.trim() || loading}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? <Spinner /> : <Sparkles size={16} />}
          {loading ? t("analysing") : t("analyse")}
        </button>
      </div>
    </Card>
  );
}
