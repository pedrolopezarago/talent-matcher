import { Check, CircleDashed, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Coverage } from "@/shared/contract";

export function fitColor(fit: number) {
  if (fit >= 85) return "var(--color-ok)";
  if (fit >= 70) return "var(--color-brand)";
  return "var(--color-warn)";
}

export function FitRing({ fit, size = 56 }: { fit: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={fitColor(fit)} strokeWidth={5}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - fit / 100)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-semibold tabular-nums">{fit}%</span>
    </div>
  );
}

const tones = {
  neutral: "bg-canvas text-muted border-line",
  brand: "bg-brand-soft text-brand-dark border-transparent",
  ok: "bg-ok-soft text-ok border-transparent",
  warn: "bg-warn-soft text-warn border-transparent",
  bad: "bg-bad-soft text-bad border-transparent",
  hidden: "bg-hidden-soft text-hidden border-transparent",
};

export function Pill({ tone = "neutral", children, title }: { tone?: keyof typeof tones; children: ReactNode; title?: string }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function StatusIcon({ status, size = 14 }: { status: Coverage["status"]; size?: number }) {
  if (status === "met") return <Check size={size} className="text-ok" strokeWidth={3} />;
  if (status === "partial") return <CircleDashed size={size} className="text-warn" strokeWidth={2.5} />;
  return <X size={size} className="text-bad" strokeWidth={3} />;
}

export function availabilityTone(a: string): keyof typeof tones {
  if (a === "En banca") return "ok";
  if (a.startsWith("Roll-off")) return "warn";
  return "neutral";
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,27,45,0.04)] ${className}`}>{children}</div>;
}

export function Spinner() {
  return <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;
}
