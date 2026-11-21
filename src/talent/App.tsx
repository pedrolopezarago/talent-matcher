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
import { Button } from "@/components/ui/button";
import { profileEntries, selectionKey, toggleSelection, visibleResults } from "./results-state";
import { Spinner } from "./components/ui";
import { LangContext, loadLang, saveLang, translate } from "./i18n";
import logoTalentIn from "@/assets/talentin_wordmark.png.asset.json";

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

  const shownResult = brief && result ? visibleResults(brief, result, filters) : null;
  const allCands = brief && shownResult ? profileEntries(brief, shownResult) : [];
  const toggleSelect = (roleId: string, id: string) => {
    setSelected((s) => toggleSelection(s, selectionKey(roleId, id)));
  };
  const reqsFor = (roleId: string | null) => brief?.roles.find((r) => r.id === roleId)?.requirements ?? [];
  const selectedEntries = allCands.filter(({ c, roleId }) => selected.includes(selectionKey(roleId, c.employee_id)));
  const visibleKeys = JSON.stringify(allCands.map(({ c, roleId }) => selectionKey(roleId, c.employee_id)));
  useEffect(() => {
    const keys: string[] = JSON.parse(visibleKeys);
    setSelected((s) => {
      const next = s.filter((key) => keys.includes(key));
      return next.length === s.length ? s : next;
    });
  }, [visibleKeys]);

  return (
    <LangContext.Provider value={lang}>
      <header className="sticky top-0 z-20 border-b border-line bg-surface/75 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 font-display text-sm font-semibold">
            <UsersRound size={16} className="text-brand" /><span className="hidden truncate sm:inline">TalentIn</span>
          </div>
          <nav className="mx-auto flex rounded-lg bg-brand-soft p-1">
            {([["match", lang === "es" ? "Búsqueda" : "Search"], ["team", lang === "es" ? "Equipo" : "Team"], ["gaps", lang === "es" ? "Brechas" : "Gaps"]] as const).map(([k, label]) => (
              <Button variant="plain" key={k} onClick={() => goView(k)} disabled={k !== "match" && !result}
                className={`rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 ${view === k ? "bg-surface text-ink shadow-soft" : "text-muted hover:text-ink"}`}>
                {label}
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            {team && (
              <Button variant="plain" onClick={exportTeam} title={lang === "es" ? "Exportar equipo" : "Export team"} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink hover:bg-brand-soft">
                <Download size={14} /><span className="hidden md:inline">{lang === "es" ? "Exportar" : "Export"}</span>
              </Button>
            )}
            {brief && (
              <Button variant="plain" onClick={reset} title={t("newSearch")} className="grid size-7 place-items-center rounded-md text-muted hover:bg-brand-soft hover:text-ink"><RotateCcw size={14} /></Button>
            )}
            <Button variant="plain" onClick={() => setLang(lang === "en" ? "es" : "en")} className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-brand-soft">{lang === "en" ? "ES" : "EN"}</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <div className="pt-4">
          <h1><img src={logoTalentIn.url} alt="TalentIn" className="h-auto w-72 max-w-full sm:w-80" /></h1>
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
                  <Button variant="team"
                    onClick={buildTeam} disabled={loading === "team"}
                    className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm active:scale-[0.98]"
                  >
                    {loading === "team" ? <Spinner /> : <UsersRound size={16} />}
                    {loading === "team" ? t("building") : t("buildTeam")}
                  </Button>
                </div>
                <Results
                  brief={brief} result={shownResult ?? result} selected={selected} toggleSelect={toggleSelect}
                  onOpen={(c, roleId) => setDrawer({ c, roleId })}
                />
              </>
            )}
          </div>
        )}
      </main>

      {!showTeam && (
        <CompareBar n={selectedEntries.length} onOpen={() => setComparing(true)} onClear={() => setSelected([])} />
      )}
      {comparing && selectedEntries.length >= 2 && (
        <CompareModal entries={selectedEntries} onClose={() => setComparing(false)} />
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
      <div className="border-y border-line p-6 text-ink">
        <div className="text-sm opacity-70">{es ? "Cobertura del equipo" : "Team coverage"}</div>
        <div className="mt-2 font-display text-5xl font-semibold text-brand">{pct}%</div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-soft"><div className="h-full rounded-full bg-orange" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="rounded-3xl bg-surface p-6 md:col-span-2">
        <h3 className="font-semibold">{es ? "Requisitos sin cubrir" : "Uncovered requirements"} <span className="ml-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs text-brand-dark">{gaps.length}</span></h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {gaps.length === 0 && <span className="text-sm text-muted">{es ? "El equipo cubre todos los requisitos." : "The team covers every requirement."}</span>}
          {gaps.map((q) => (
            <span key={q.id} className={`rounded-full px-3 py-1.5 text-xs font-medium ${q.must ? "bg-brand/10 text-brand-dark" : "bg-brand-soft text-ink"}`}>{q.value}{q.must ? " · must" : ""}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
