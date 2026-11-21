import { RotateCcw, UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Brief, Candidate, Lang, MatchResult, TeamResult } from "@/shared/contract";
import * as api from "./api";
import { ALL_AVAILABILITY, BriefInput, EXAMPLES, type HardFilters } from "./components/BriefInput";
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
    setBrief(b); setResult(null); setTeam(null); setShowTeam(false); setSelected([]);
    setTimeout(() => reqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const find = async () => {
    if (!brief) return;
    const m = await run("match", () => api.match(brief));
    if (!m) return;
    setResult(m); setTeam(null); setShowTeam(false); setSelected([]);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const buildTeam = async () => {
    if (!brief || !result) return;
    const tm = team ?? (await run("team", () => api.team(brief, result)));
    if (!tm) return;
    setTeam(tm); setShowTeam(true);
    setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const reset = () => {
    setText(""); setBrief(null); setResult(null); setTeam(null); setShowTeam(false); setSelected([]);
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
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="grid size-8 place-items-center rounded-lg bg-brand text-on-brand"><UsersRound size={18} /></div>
          <div className="min-w-0">
            <div className="font-bold leading-tight tracking-tight">Internal Talent Matcher</div>
            <div className="hidden truncate text-xs text-muted sm:block">{t("tagline")}</div>
          </div>
          {api.usingMocks && <span className="hidden rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-medium text-warn sm:inline">{t("mockNote")}</span>}
          <div className="ml-auto flex items-center gap-2">
            {brief && (
              <button onClick={reset} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-canvas hover:text-ink">
                <RotateCcw size={14} /><span className="hidden sm:inline">{t("newSearch")}</span>
              </button>
            )}
            <div className="flex rounded-lg border border-line p-0.5 text-xs font-semibold">
              {(["en", "es"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} className={`rounded-md px-2 py-1 ${lang === l ? "bg-brand text-on-brand" : "text-muted"}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-sage-line bg-sage/50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2.5 sm:px-6">
          <span className="shrink-0 text-xs font-medium text-muted">{t("examples")}:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => { setText(ex.text); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="shrink-0 rounded-full border border-sage-line bg-surface px-3 py-1 text-xs font-medium text-ink transition hover:border-brand hover:text-brand-dark"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-28 sm:px-6 sm:py-8">
        {!isDemo || !result ? (
          <BriefInput text={text} setText={setText} onAnalyse={analyse} loading={loading === "parse"} filters={filters} setFilters={setFilters} />
        ) : null}

        {error && <div className="rounded-xl bg-bad-soft px-4 py-3 text-sm text-bad">{error}</div>}

        {brief && (
          <div ref={reqRef} className="scroll-mt-20">
            <RequirementsEditor brief={brief} setBrief={(b) => { setBrief(b); }} onFind={find} loading={loading === "match"} />
          </div>
        )}

        {result && brief && (
          <div ref={resRef} className="scroll-mt-20 space-y-4">
            {showTeam && team ? (
              <TeamView brief={brief} team={team} onBack={() => setShowTeam(false)} />
            ) : (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={buildTeam} disabled={loading === "team"}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand py-2.5 pl-3.5 pr-4 text-sm font-semibold text-on-brand transition-[scale,background-color] duration-150 ease-out hover:bg-brand-dark enabled:active:scale-[0.96]"
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
