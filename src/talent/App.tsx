import { Download, RotateCcw, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Brief, Candidate, Lang, MatchResult, TeamResult } from "@/shared/contract";
import * as api from "./api";
import { ALL_AVAILABILITY, BriefInput, type HardFilters } from "./components/BriefInput";
import { CompareBar, CompareModal } from "./components/CompareModal";
import { EvidenceDrawer } from "./components/EvidenceDrawer";
import { RequirementsEditor } from "./components/RequirementsEditor";
import { Results } from "./components/Results";
import { TeamView } from "./components/TeamView";
import { Spinner } from "./components/ui";
import { LangContext, loadLang, saveLang, translate } from "./i18n";

export default function App({ isDemo = false }: { isDemo?: boolean }) {
  const [lang, setLang] = useState<Lang>("en");
  const [langReady, setLangReady] = useState(false);
  useEffect(() => { setLang(loadLang()); setLangReady(true); }, []);
  const t = (k: Parameters<typeof translate>[1], v?: Record<string, string | number>) => translate(lang, k, v);

  const [text, setText] = useState("");
  const [filters, setFilters] = useState<HardFilters>({ availability: ALL_AVAILABILITY, minYears: 0 });
  const [brief, setBrief] = useState<Brief | null>(isDemo ? api.demoData.brief() : null);
  const [result, setResult] = useState<MatchResult | null>(isDemo ? api.demoData.match() : null);
  const [team, setTeam] = useState<TeamResult | null>(null);
  const [showTeam, setShowTeam] = useState(false);
  const [loading, setLoading] = useState<"" | "parse" | "match" | "team">("");
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const [drawer, setDrawer] = useState<{ c: Candidate; roleId: string } | null>(null);
  const [compareRole, setCompareRole] = useState<string | null>(null);

  const [view, setView] = useState<"match" | "team" | "gaps">("match");
  const reqRef = useRef<HTMLDivElement>(null);
  const resRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (langReady) saveLang(lang); }, [lang, langReady]);

  const run = async <T,>(kind: typeof loading, fn: () => Promise<T>): Promise<T | undefined> => {
    setError(""); setLoading(kind);
    try { return await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); return undefined; }
    finally { setLoading(""); }
  };

  const analyse = async () => {
    const b = await run("parse", () => api.parseBrief(text, lang));
    if (!b) return;
    setBrief(b); setResult(null); setTeam(null); setShowTeam(false); setView("match"); setSelected([]);
    setTimeout(() => reqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const find = async () => {
    if (!brief) return;
    const m = await run("match", () => api.match(brief));
    if (!m) return;
    setResult(m); setTeam(null); setShowTeam(false); setView("match"); setSelected([]);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const buildTeam = async () => {
    if (!brief || !result) return;
    const tm = team ?? (await run("team", () => api.team(brief, result)));
    if (!tm) return;
    setTeam(tm); setShowTeam(true);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const goView = (k: "match" | "team" | "gaps") => {
    setView(k);
    if (k === "match") { setShowTeam(false); return; }
    void buildTeam();
  };

  const exportTeam = () => {
    if (!team || !brief) return;
    const rows = ["role,slot,name,fit", ...team.optimal.map((s) => `${brief.roles.find((r) => r.id === s.role_id)?.title ?? s.role_id},${s.slot},${s.name},${s.fit}`)];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "equipo.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const reset = () => {
    setView("match");
    setText(""); setBrief(null); setResult(null); setTeam(null); setShowTeam(false); setView("match"); setSelected([]);
    if (isDemo) window.location.assign("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const allCands = result?.roles.flatMap((r) => r.candidates.map((c) => ({ c, roleId: r.role_id }))) ?? [];
  const toggleSelect = (id: string) => {
    const roleId = allCands.find((x) => x.c.employee_id === id)?.roleId ?? null;
    // compare within one role: picking someone from another role starts a new selection
    if (compareRole !== roleId) { setCompareRole(roleId); setSelected([id]); return; }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 4 ? s : [...s, id]));
  };
  const reqsFor = (roleId: string | null) => brief?.roles.find((r) => r.id === roleId)?.requirements ?? [];
  const selectedCands = selected
    .map((id) => allCands.find((x) => x.c.employee_id === id && x.roleId === compareRole)?.c)
    .filter((c): c is Candidate => !!c);

  return (
    <LangContext.Provider value={lang}>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/75 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight">
            <UsersRound size={16} className="text-brand" /><span className="hidden truncate sm:inline">Talent Matcher</span>
          </div>
          <nav className="mx-auto flex rounded-lg bg-black/[0.05] p-1">
            {([["match", lang === "es" ? "Búsqueda" : "Search"], ["team", lang === "es" ? "Equipo" : "Team"], ["gaps", lang === "es" ? "Brechas" : "Gaps"]] as const).map(([k, label]) => (
              <button key={k} onClick={() => goView(k)} disabled={k !== "match" && !result}
                className={`rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 ${view === k ? "bg-surface text-brand shadow-soft" : "text-muted hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {team && (
              <button onClick={exportTeam} title={lang === "es" ? "Exportar equipo" : "Export team"} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink hover:bg-black/[0.05]">
                <Download size={14} /><span className="hidden md:inline">{lang === "es" ? "Exportar" : "Export"}</span>
              </button>
            )}
            {brief && (
              <button onClick={reset} title={t("newSearch")} className="grid size-7 place-items-center rounded-md text-muted hover:bg-black/[0.05] hover:text-ink"><RotateCcw size={14} /></button>
            )}
            <button onClick={() => setLang(lang === "en" ? "es" : "en")} className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-black/[0.05]">{lang === "en" ? "ES" : "EN"}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <div className="pt-4">
          <h1 className="text-4xl font-semibold tracking-tight text-ink">Internal Talent Matcher</h1>
          <p className="mt-1 text-[15px] text-muted">{t("tagline")}{api.usingMocks && <span className="ml-2 text-xs font-medium text-brand">· {t("mockNote")}</span>}</p>
        </div>
        <BriefInput text={text} setText={setText} onAnalyse={analyse} loading={loading === "parse"} filters={filters} setFilters={setFilters} showInput={!isDemo || !result} />

        {error && <div className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{error}</div>}

        {brief && (
          <div ref={reqRef} className="scroll-mt-20">
            <RequirementsEditor brief={brief} setBrief={(b) => { setBrief(b); }} onFind={find} loading={loading === "match"} />
          </div>
        )}

        {result && brief && (
          <div ref={resRef} className="scroll-mt-20 space-y-4">
            {view === "gaps" && team ? (
              <GapView brief={brief} team={team} es={lang === "es"} />
            ) : showTeam && team ? (
              <TeamView brief={brief} team={team} onBack={() => goView("match")} />
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={buildTeam} disabled={loading === "team"}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition hover:bg-brand-dark active:scale-[0.98]"
                  >
                    {loading === "team" ? <Spinner /> : <UsersRound size={16} />}
                    {loading === "team" ? t("building") : t("buildTeam")}
                  </button>
                </div>
                <Results
                  brief={brief} result={result} filters={filters} selected={selected} toggleSelect={toggleSelect}
                  onOpen={(c, roleId) => setDrawer({ c, roleId })}
                />
              </>
            )}
          </div>
        )}
      </main>

      {!showTeam && (
        <CompareBar n={selectedCands.length} onOpen={() => setComparing(true)} onClear={() => setSelected([])} />
      )}
      {comparing && selectedCands.length >= 2 && (
        <CompareModal cands={selectedCands} reqs={reqsFor(compareRole)} onClose={() => setComparing(false)} />
      )}
      {drawer && <EvidenceDrawer c={drawer.c} reqs={reqsFor(drawer.roleId)} onClose={() => setDrawer(null)} />}
    </LangContext.Provider>
  );
}

function GapView({ brief, team, es }: { brief: Brief; team: TeamResult; es: boolean }) {
  const covered = new Set(team.joint_coverage.map((j) => j.req_value));
  const reqs = Array.from(new Map(brief.roles.flatMap((r) => r.requirements).map((q) => [q.value, q])).values());
  const gaps = reqs.filter((q) => !covered.has(q.value));
  const pct = reqs.length ? Math.round(((reqs.length - gaps.length) / reqs.length) * 100) : 100;
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl bg-brand p-6 text-on-brand">
        <div className="text-sm opacity-70">{es ? "Cobertura del equipo" : "Team coverage"}</div>
        <div className="mt-2 text-5xl font-semibold tracking-tight">{pct}%</div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-on-brand/20"><div className="h-full rounded-full bg-orange" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="rounded-3xl bg-surface p-6 md:col-span-2">
        <h3 className="font-semibold">{es ? "Requisitos sin cubrir" : "Uncovered requirements"} <span className="ml-1 rounded-full bg-orange px-2 py-0.5 text-xs text-on-brand">{gaps.length}</span></h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {gaps.length === 0 && <span className="text-sm text-muted">{es ? "El equipo cubre todos los requisitos." : "The team covers every requirement."}</span>}
          {gaps.map((q) => (
            <span key={q.id} className={`rounded-full px-3 py-1.5 text-xs font-medium ${q.must ? "bg-orange text-on-brand" : "bg-brand-soft text-ink"}`}>{q.value}{q.must ? " · must" : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
