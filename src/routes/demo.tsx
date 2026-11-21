import { createFileRoute } from "@tanstack/react-router";
import capturedCSS from "../styles/pages/demo.css?raw";

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [{ title: "TalentIn — Demo" }] }),
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-support-soft text-support-dark"} aria-pressed="true">En banca</button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-support-soft text-support-dark"} aria-pressed="true">Roll-off &lt;3m</button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x68over:\x62g-brand-soft h-9 rounded-md px-2.5 py-1 text-xs font-medium transition \x62g-support-soft text-support-dark"} aria-pressed="true">Asignado</button>
              <div>
                <span role="combobox" aria-autocomplete="list" aria-expanded="false" aria-owns="bb-customSelect-vTWHH-panel" aria-activedescendant="bb-customSelect-vTWHH-selectedOption" tabIndex={0}>
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
                <div id="bb-customSelect-vTWHH-panel" role="listbox">
                  <div role="option" id="bb-customSelect-vTWHH-selectedOption">Any</div>
                  <div role="option">1+ years</div>
                  <div role="option">2+ years</div>
                  <div role="option">3+ years</div>
                  <div role="option">5+ years</div>
                  <div role="option">8+ years</div>
                  <div role="option">10+ years</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={"\x73croll-mt-20"}>
          <ImportedSectionRequirementsTheAIFound />
        </div>
        <div className={"\x73croll-mt-20 \x73pace-y-4"}>
          <div className="flex justify-end">
            <button className={"justify-center whitespace-normal cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 \x62g-support text-on-brand \x73hadow-md \x73hadow-support/\x330 \x68over:\x62g-support-dark font-semibold h-9 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm \x61ctive:\x73cale-[\x30.\x398]"}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 21a8 8 0 0 0-16 0" /><circle cx="10" cy="8" r="5" /><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" /></svg>Create team</button>
          </div>
          <div className={"\x73pace-y-10"}>
            <div className={"grid gap-8 \x62order-y \x62order-line py-6 sm:grid-cols-2"}>
              <div>
                <div className="text-sm text-muted">Team coverage</div>
                <div className="mt-2 flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-semibold tabular-nums font-display text-brand">90%</span>
                  <span className={"mb-1 rounded-full px-3 py-1 text-xs font-semibold \x62g-brand/\x310 text-brand-dark"}>Full team, no duplicates</span>
                </div>
              </div>
              <div className={"\x73m:\x62order-l \x73m:\x62order-line sm:pl-8"}>
                <div className="text-sm text-muted">Immediate availability</div>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <span className="text-4xl font-semibold tabular-nums font-display">4</span>
                    <span className="ml-1.5 text-sm text-muted">on bench · 2 roll-off</span>
                  </div>
                  <div className="flex h-12 items-end gap-1.5">
                    <div className="w-5 rounded-full bg-brand" style={{ height: "100%" }} title="Bench: 4" />
                    <div className={"w-5 rounded-full \x62g-brand-soft"} style={{ height: "50%" }} title="Roll-off: 2" />
                    <div className={"w-5 rounded-full \x62g-brand-soft"} style={{ height: "12%" }} title="Assigned: 0" />
                  </div>
                </div>
              </div>
            </div>
            <p className="-mt-6 inline-flex items-center gap-1.5 text-xs text-muted"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>142 claims checked against profiles · 3 unsupported claims removed · Each person appears in one role only.</p>
            <ImportedSectionCloudArchitect />
            <ImportedSectionJavaBackendDeveloper />
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
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent \x68over:\x62g-brand-soft h-9 rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 text-muted hover:text-ink"}>Team</button>
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent \x68over:\x62g-brand-soft h-9 rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-40 sm:px-4 text-muted hover:text-ink"}>Gaps</button>
        </nav>
        <div className="flex items-center gap-1">
          <button className={"items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent px-4 py-2 grid size-7 place-items-center rounded-md text-muted \x68over:\x62g-brand-soft hover:text-ink"} title="New search">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button className={"inline-flex items-center justify-center gap-2 whitespace-normal cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent h-9 rounded-md px-2 py-1 text-xs font-semibold text-muted \x68over:\x62g-brand-soft"}>ES</button>
        </div>
      </div>
    </header>
  );
}

function ImportedSectionRequirementsTheAIFound() {
  return (
    <section className={"\x62order-t \x62order-line !px-0 p-5 sm:p-6"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Requirements the AI found</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">Click a chip to switch must ↔ nice to have. Musts weigh 3×; nice-to-haves never filter anyone out.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap pr-4 text-sm text-muted"><svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" /></svg>Start: 2027-01-20</div>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className={"rounded-2xl \x62order \x62order-line p-4"}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Cloud Architect</h3>
            <span className={"inline-flex items-center gap-1 rounded-full \x62order px-2 py-0.5 text-xs font-medium \x62g-muted/\x310 text-ink \x62order-line"}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg>1 people</span>
            <span className={"inline-flex items-center gap-1 rounded-full \x62order px-2 py-0.5 text-xs font-medium \x62g-muted/\x310 text-ink \x62order-line"}>Senior</span>
            <span className="ml-auto text-xs text-muted" title="Criticality">Criticality ●●●●●<span className="text-line" /></span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-brand/\x330 \x62g-brand/\x310 text-ink"} title="“AWS”">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}>AWS<span className="ml-1 text-[10px] font-semibold text-brand-dark">Must</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-brand/\x330 \x62g-brand/\x310 text-ink"} title="“Terraform experience”">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}>Terraform<span className="ml-1 text-[10px] font-semibold text-brand-dark">Must</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-line \x62g-surface text-ink"} title="“core banking platform” · Inferred from the brief">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}><svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /></svg>Banca y Finanzas<span className="ml-1 text-[10px] text-muted">Nice to have</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-brand/\x330 \x62g-brand/\x310 text-ink"} title="“Good English required”">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}>Inglés B2<span className="ml-1 text-[10px] font-semibold text-brand-dark">Must</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <form className={"inline-flex items-center rounded-full \x62order \x62order-dashed \x62order-line pl-2 \x66ocus-within:\x62order-ink"}>
              <svg className="text-muted" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              <input className={"w-28 bg-transparent px-1.5 py-1 text-xs \x6futline-none"} placeholder="e.g. Kubernetes" defaultValue="" />
            </form>
          </div>
        </div>
        <div className={"rounded-2xl \x62order \x62order-line p-4"}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Java backend developer</h3>
            <span className={"inline-flex items-center gap-1 rounded-full \x62order px-2 py-0.5 text-xs font-medium \x62g-muted/\x310 text-ink \x62order-line"}><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg>2 people</span>
            <span className={"inline-flex items-center gap-1 rounded-full \x62order px-2 py-0.5 text-xs font-medium \x62g-muted/\x310 text-ink \x62order-line"}>Mid</span>
            <span className="ml-auto text-xs text-muted" title="Criticality">Criticality ●●●<span className="text-line">●●</span></span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-brand/\x330 \x62g-brand/\x310 text-ink"} title="“Java backend developers”">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}>Java<span className="ml-1 text-[10px] font-semibold text-brand-dark">Must</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-brand/\x330 \x62g-brand/\x310 text-ink"} title="“microservices”">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}>Microservicios<span className="ml-1 text-[10px] font-semibold text-brand-dark">Must</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <span className={"group inline-flex items-center gap-1 rounded-full \x62order text-xs font-medium transition \x62order-line \x62g-surface text-ink"} title="“and Kafka”">
              <button className={"inline-flex items-center justify-center whitespace-normal font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 px-4 h-auto gap-1 rounded-full bg-transparent py-1 pl-3 pr-0 text-xs text-ink \x68over:\x62g-transparent"}>Kafka<span className="ml-1 text-[10px] text-muted">Nice to have</span></button>
              <button className={"inline-flex items-center justify-center gap-2 whitespace-normal text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 rounded-full bg-transparent p-1 pr-2 text-ink opacity-70 \x68over:\x62g-transparent hover:opacity-100"} aria-label="remove">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </span>
            <form className={"inline-flex items-center rounded-full \x62order \x62order-dashed \x62order-line pl-2 \x66ocus-within:\x62order-ink"}>
              <svg className="text-muted" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              <input className={"w-28 bg-transparent px-1.5 py-1 text-xs \x6futline-none"} placeholder="e.g. Kubernetes" defaultValue="" />
            </form>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button className={"justify-center whitespace-normal cursor-pointer \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 h-9 inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition \x68over:\x62g-brand-dark \x61ctive:\x73cale-[\x30.\x398] disabled:opacity-50"}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>Find candidates</button>
      </div>
    </section>
  );
}

function ImportedSectionCloudArchitect() {
  return (
    <section>
      <div className={"flex flex-wrap items-baseline gap-x-3 \x62order-b \x62order-line pb-3"}>
        <h2 className="text-xl font-semibold font-display">Cloud Architect</h2>
        <span className="text-sm tabular-nums text-muted">3</span>
        <span className="ml-auto text-xs tabular-nums text-muted" title="Start in 2 months → 'En banca' + 'Roll-off próximo'">190,000 profiles → 3,412 available → 80 reviewed by AI → 4 ranked</span>
      </div>
      <div className={"group -mx-3 grid gap-4 rounded-xl \x62order-b \x62order-line px-3 py-5 transition \x68over:\x62g-brand-soft/\x350 md:grid-cols-[220px_1fr_180px]"}>
        <div className="min-w-0">
          <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-brand"}><span className="text-xs font-normal tabular-nums text-muted">1.</span> Lucía Ferrer Gil<svg className={"opacity-0 transition \x67roup-hover:\x6fpacity-60"} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          <p className="text-sm text-muted">Solutions Architect · Senior</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={"size-2 rounded-full \x62g-ok"} />En banca</p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input className={"\x61ccent-support"} aria-label="Compare Lucía Ferrer Gil" type="checkbox" />Compare</label>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">7 years of AWS at level 5. Led a banking cloud migration (2025).<span className="text-muted"> Covers implicit needs: Banca y Finanzas.</span></p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>AWS</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Terraform</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Banca y Finanzas</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}><svg className="text-muted" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>Inglés<span className="text-muted">B2</span></span>
          </div>
        </div>
        <div className={"\x6dd:\x74ext-right"}>
          <div className="text-2xl font-semibold tabular-nums font-display text-brand">91%</div>
          <div className="text-xs tabular-nums text-muted">11 years experience</div>
          <p className="mt-1.5 text-xs leading-snug text-warn">No AWS certification listed</p>
        </div>
      </div>
      <div className={"group -mx-3 grid gap-4 rounded-xl \x62order-b \x62order-line px-3 py-5 transition \x68over:\x62g-brand-soft/\x350 md:grid-cols-[220px_1fr_180px]"}>
        <div className="min-w-0">
          <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-brand"}><span className="text-xs font-normal tabular-nums text-muted">2.</span> Marco Bianchi<svg className={"opacity-0 transition \x67roup-hover:\x6fpacity-60"} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          <p className="text-sm text-muted">DevOps Engineer · Lead</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={"size-2 rounded-full \x62g-amber"} />Roll-off próximo (&lt;3 meses)</p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input className={"\x61ccent-support"} aria-label="Compare Marco Bianchi" type="checkbox" />Compare</label>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">Architected hospital platform on AWS. Lead seniority.<span className="text-muted"> Different area.</span></p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>AWS</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Terraform</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink opacity-50 line-through"}>Banca y Finanzas</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}><svg className="text-muted" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>Inglés<span className="text-muted">B2</span></span>
          </div>
        </div>
        <div className={"\x6dd:\x74ext-right"}>
          <div className="text-2xl font-semibold tabular-nums font-display text-brand">84%</div>
          <div className="text-xs tabular-nums text-muted">9 years experience</div>
          <p className="mt-1.5 text-xs leading-snug text-warn">No banking sector evidence</p>
        </div>
      </div>
      <div className={"group -mx-3 grid gap-4 rounded-xl \x62order-b \x62order-line px-3 py-5 transition \x68over:\x62g-brand-soft/\x350 md:grid-cols-[220px_1fr_180px]"}>
        <div className="min-w-0">
          <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-brand"}><span className="text-xs font-normal tabular-nums text-muted">3.</span> Rahul Mehta<svg className={"opacity-0 transition \x67roup-hover:\x6fpacity-60"} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          <p className="text-sm text-muted">Cloud Engineer · Mid</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={"size-2 rounded-full \x62g-ok"} />En banca</p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input className={"\x61ccent-support"} aria-label="Compare Rahul Mehta" type="checkbox" />Compare</label>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">Banking sector background. AWS certified (2024).<span className="text-muted"> Covers implicit needs: Banca y Finanzas.</span></p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>AWS</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink opacity-50 line-through"}>Terraform</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Banca y Finanzas</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}><svg className="text-muted" xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>Inglés<span className="text-muted">B2</span></span>
          </div>
        </div>
        <div className={"\x6dd:\x74ext-right"}>
          <div className="text-2xl font-semibold tabular-nums font-display text-brand">68%</div>
          <div className="text-xs tabular-nums text-muted">5 years experience</div>
          <p className="mt-1.5 text-xs leading-snug text-warn">No Terraform evidence (must)</p>
        </div>
      </div>
      <div className="py-4">
        <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md text-sm font-medium cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto w-full justify-start px-0 py-1 text-left"} aria-expanded="false">
          <span className="font-medium">Strong fits currently assigned</span>
          <span className={"inline-flex items-center gap-1 rounded-full \x62order px-2 py-0.5 text-xs font-medium \x62g-muted/\x310 text-ink \x62order-line"}>1</span>
          <svg className="ml-auto text-muted transition" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <p className="mt-1 text-xs text-muted">Not in the ranking: they would need to be released from their project.</p>
      </div>
    </section>
  );
}

function ImportedSectionJavaBackendDeveloper() {
  return (
    <section>
      <div className={"flex flex-wrap items-baseline gap-x-3 \x62order-b \x62order-line pb-3"}>
        <h2 className="text-xl font-semibold font-display">Java backend developer</h2>
        <span className="text-sm tabular-nums text-muted">3</span>
        <span className="ml-auto text-xs tabular-nums text-muted" title="Start in 2 months → 'En banca' + 'Roll-off próximo'">190,000 profiles → 5,120 available → 40 reviewed by AI → 3 ranked</span>
      </div>
      <div className={"group -mx-3 grid gap-4 rounded-xl \x62order-b \x62order-line px-3 py-5 transition \x68over:\x62g-brand-soft/\x350 md:grid-cols-[220px_1fr_180px]"}>
        <div className="min-w-0">
          <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-brand"}><span className="text-xs font-normal tabular-nums text-muted">1.</span> Elena Navarro Pons<svg className={"opacity-0 transition \x67roup-hover:\x6fpacity-60"} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          <p className="text-sm text-muted">Full Stack Developer · Senior</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={"size-2 rounded-full \x62g-ok"} />En banca</p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input className={"\x61ccent-support"} aria-label="Compare Elena Navarro Pons" type="checkbox" />Compare</label>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">8 years of Java at level 5. Microservices in production.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Java</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Microservicios</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Kafka</span>
          </div>
        </div>
        <div className={"\x6dd:\x74ext-right"}>
          <div className="text-2xl font-semibold tabular-nums font-display text-brand">90%</div>
          <div className="text-xs tabular-nums text-muted">8 years experience</div>
          <p className="mt-1.5 text-xs leading-snug text-warn">Level 2 in Kafka despite 3 years of use</p>
        </div>
      </div>
      <div className={"group -mx-3 grid gap-4 rounded-xl \x62order-b \x62order-line px-3 py-5 transition \x68over:\x62g-brand-soft/\x350 md:grid-cols-[220px_1fr_180px]"}>
        <div className="min-w-0">
          <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-brand"}><span className="text-xs font-normal tabular-nums text-muted">2.</span> Javier Ortega Ruiz<svg className={"opacity-0 transition \x67roup-hover:\x6fpacity-60"} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          <p className="text-sm text-muted">Backend Developer · Mid</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={"size-2 rounded-full \x62g-ok"} />En banca</p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input className={"\x61ccent-support"} aria-label="Compare Javier Ortega Ruiz" type="checkbox" />Compare</label>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">5 years of Java. Microservices in a banking project.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Java</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Microservicios</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink opacity-50 line-through"}>Kafka</span>
          </div>
        </div>
        <div className={"\x6dd:\x74ext-right"}>
          <div className="text-2xl font-semibold tabular-nums font-display text-brand">88%</div>
          <div className="text-xs tabular-nums text-muted">5 years experience</div>
          <p className="mt-1.5 text-xs leading-snug text-warn">No Kafka evidence (nice-to-have)</p>
        </div>
      </div>
      <div className={"group -mx-3 grid gap-4 rounded-xl \x62order-b \x62order-line px-3 py-5 transition \x68over:\x62g-brand-soft/\x350 md:grid-cols-[220px_1fr_180px]"}>
        <div className="min-w-0">
          <button className={"inline-flex items-center gap-2 whitespace-normal rounded-md cursor-pointer transition-colors \x66ocus-visible:\x6futline-none \x66ocus-visible:\x72ing-1 \x66ocus-visible:\x72ing-ring \x64isabled:\x70ointer-events-none disabled:opacity-50 \x64isabled:\x63ursor-not-allowed [&\x5fsvg]:\x70ointer-events-none [&\x5fsvg]:\x73ize-4 [&\x5fsvg]:\x73hrink-0 bg-transparent text-ink \x68over:\x62g-brand-soft h-auto max-w-full justify-start p-0 text-left font-display text-lg font-semibold hover:text-brand"}><span className="text-xs font-normal tabular-nums text-muted">3.</span> Sofía Delgado Marín<svg className={"opacity-0 transition \x67roup-hover:\x6fpacity-60"} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg></button>
          <p className="text-sm text-muted">Data Engineer · Mid</p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted"><span className={"size-2 rounded-full \x62g-amber"} />Roll-off próximo (&lt;3 meses)</p>
          <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted"><input className={"\x61ccent-support"} aria-label="Compare Sofía Delgado Marín" type="checkbox" />Compare</label>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-relaxed">Strong Kafka (level 4). Event-driven projects.<span className="text-muted"> Different area.</span></p>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Java</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Microservicios</span>
            <span className={"inline-flex items-center gap-1 rounded-md \x62g-brand-soft px-2 py-0.5 text-xs text-ink"}>Kafka</span>
          </div>
        </div>
        <div className={"\x6dd:\x74ext-right"}>
          <div className="text-2xl font-semibold tabular-nums font-display text-brand">72%</div>
          <div className="text-xs tabular-nums text-muted">4 years experience</div>
          <p className="mt-1.5 text-xs leading-snug text-warn">Java only at level 2</p>
        </div>
      </div>
    </section>
  );
}
