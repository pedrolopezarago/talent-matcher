import { createFileRoute } from "@tanstack/react-router";
import capturedCSS from "../styles/pages/index.css?raw";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "TalentIn — Find the right team" }] }),
  staticData: { importedDocument: { html: { "lang": "en" }, body: {  } } },
  component: Index,
});

function Index() {
  return (
    <>
      <style>{capturedCSS}</style>
      <ImportedHeader />
      <main className={"mx-auto max-w-5xl \x73pace-y-8 px-4 py-6 pb-28 sm:px-6 sm:py-8"}>
        <div className="pt-4">
          <h1 className="text-4xl font-semibold text-ink">TalentIn</h1>
          <p className="mt-1 text-[15px] text-muted">Internal mobility: find the right people already on the team.<span className="ml-2 text-xs font-medium text-brand">· Demo data (seeded)</span></p>
        </div>
        <div className={"\x73pace-y-4"}>
          <textarea className={"w-full resize-y rounded-2xl \x62order \x62order-line \x62g-brand-soft p-4 text-[15px] leading-relaxed \x6futline-none transition \x70laceholder:\x74ext-muted \x66ocus:\x62g-surface \x66ocus:\x72ing-4 \x66ocus:\x72ing-ink/\x310"} placeholder="We are migrating a bank's core platform to AWS. We need a cloud architect…" rows={5} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-brand-soft text-ink \x68over:\x62g-support-soft"}>Core Banking Migration</button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-brand-soft text-ink \x68over:\x62g-support-soft"}>AI Assistant Retail</button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-brand-soft text-ink \x68over:\x62g-support-soft"}>Cybersecurity Public Sector</button>
            </div>
            <span className={"hidden h-4 w-px bg-line \x6dd:\x62lock"} />
            <div className="flex flex-wrap items-center gap-1.5">
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-support-soft text-support-dark"} aria-pressed="true">En banca</button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-support-soft text-support-dark"} aria-pressed="true">Roll-off &lt;3m</button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-support-soft text-support-dark"} aria-pressed="true">Asignado</button>
              <div>
                <span role="combobox" aria-autocomplete="list" aria-expanded="false" aria-owns="bb-customSelect-lPyH0-panel" aria-activedescendant="bb-customSelect-lPyH0-selectedOption" tabIndex={0}>
                  <span>Any</span>
                </span>
                <select className={"rounded-md \x62g-brand-soft px-2 py-1 text-xs font-medium \x6futline-none"} aria-label="Minimum years of experience" tabIndex={-1} defaultValue="0">
                  <option value="0">Any</option>
                  <option value="1">1+ years</option>
                  <option value="2">2+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="8">8+ years</option>
                  <option value="10">10+ years</option>
                </select>
                <div id="bb-customSelect-lPyH0-panel" role="listbox">
                  <div role="option" id="bb-customSelect-lPyH0-selectedOption">Any</div>
                  <div role="option">1+ years</div>
                  <div role="option">2+ years</div>
                  <div role="option">3+ years</div>
                  <div role="option">5+ years</div>
                  <div role="option">8+ years</div>
                  <div role="option">10+ years</div>
                </div>
              </div>
            </div>
            <button className={"justify-center whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 ml-auto inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand transition \x68over:\x62g-brand-dark \x61ctive:\x73cale-[\x30.\x398] \x64isabled:\x63ursor-not-allowed disabled:opacity-40"} disabled><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>Find talent</button>
          </div>
        </div>
      </main>
    </>
  );
}

function ImportedHeader() {
  return (
    <header className={"sticky top-0 z-20 \x62order-b \x62order-line \x62g-surface/\x375 \x62ackdrop-blur-xl"}>
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 font-display text-sm font-semibold">
          <svg className="text-brand" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 21a8 8 0 0 0-16 0" />
            <circle cx="10" cy="8" r="5" />
            <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
          </svg>
          <span className={"hidden truncate \x73m:\x69nline"}>TalentIn</span>
        </div>
        <nav className={"mx-auto flex rounded-lg \x62g-brand-soft p-1"}>
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 \x62g-surface text-ink \x73hadow-soft"}>Search</button>
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent \x68over:\x62g-brand-soft h-9 rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 text-muted hover:text-ink"} disabled>Team</button>
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent \x68over:\x62g-brand-soft h-9 rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 text-muted hover:text-ink"} disabled>Gaps</button>
        </nav>
        <div className="flex items-center gap-1">
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent h-9 rounded-md px-2 py-1 text-xs font-semibold text-muted \x68over:\x62g-brand-soft"}>ES</button>
        </div>
      </div>
    </header>
  );
}
