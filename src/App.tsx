import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

type TaskStatus = "Not started" | "In progress" | "Blocked" | "Done";
type ReferralSource = "MDM" | "eRS" | "Internal" | "GP";

type Task = {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  evidenceNeeded: string[];
  notes?: string;
};

type MappingIssue = {
  id: string;
  clinicCode: string;
  intendedSubspecialty: "Hepatology" | "HPB" | "Transplant" | "Oncology" | "General";
  intendedQueue: string;
  observedQueue: string;
  referralSource: ReferralSource;
  impact: "High" | "Medium" | "Low";
  suspectedCause: string;
};

type GlossaryCategory = "Pathway & Ops" | "Epic (system)" | "Liver (clinical)";
type GlossaryItem = {
  term: string;
  category: GlossaryCategory;
  meaning: string;
  notes?: string;
};

type TabKey = "Overview" | "Tasks" | "Mapping Issues";

const APP_VERSION = "v1.0.0";
const STORAGE_KEY = "liver_ptl_evidence_panel_v1";

const TASKS: Task[] = [
  {
    id: "T1",
    title:
      "Work Queue + Clinic Code Review: list all work queues, screenshots (anonymised), and clinic codes for comparison",
    owner: "Alara",
    status: "In progress",
    evidenceNeeded: ["Work queue list", "Screenshots (patient details removed)", "Clinic code list/export"],
  },
  {
    id: "T2",
    title:
      "Tracking email: re-add ticket number and associated clinic code info for clarity",
    owner: "Alara",
    status: "Not started",
    evidenceNeeded: ["Updated email example/template"],
  },
  {
    id: "T3",
    title:
      "Referral template collection: obtain GP referral template from OPAC for comparison",
    owner: "Simona",
    status: "Not started",
    evidenceNeeded: ["GP referral template copy"],
  },
  {
    id: "T4",
    title:
      "MDM process: observe how MDM nurses request referrals and assign specialty in Epic",
    owner: "Simona",
    status: "Not started",
    evidenceNeeded: ["Observation notes", "Process steps", "Screenshots (anonymised)"],
  },
  {
    id: "T5",
    title:
      "Attend MDM weekly meeting: ask questions and capture routing details",
    owner: "Alara / team",
    status: "Not started",
    evidenceNeeded: ["Questions + answers logged", "Actions captured"],
  },
  {
    id: "T6",
    title:
      "Referral pathway comparison: compare 2–3 examples across sources (MDM/eRS/internal/GP) to find why routing differs",
    owner: "Alara / team",
    status: "In progress",
    evidenceNeeded: ["Case comparison notes", "Clinic codes", "Expected vs actual queue"],
  },
  {
    id: "T7",
    title:
      "RTT mapping clarification: share clinic code spreadsheet + email context for review",
    owner: "Alara (for Simona)",
    status: "Not started",
    evidenceNeeded: ["Email forwarded", "Spreadsheet shared"],
  },
];

const SAMPLE_ISSUES: MappingIssue[] = [
  {
    id: "MI-001",
    clinicCode: "HPB001",
    intendedSubspecialty: "HPB",
    intendedQueue: "HPB Booking",
    observedQueue: "Hepatology Outpatient Booking",
    referralSource: "eRS",
    impact: "High",
    suspectedCause: "Referral option selection + clinic code mapping attracts mixed referrals",
  },
  {
    id: "MI-002",
    clinicCode: "HEP010",
    intendedSubspecialty: "Hepatology",
    intendedQueue: "Hepatology Booking",
    observedQueue: "Upper GI Booking",
    referralSource: "Internal",
    impact: "Medium",
    suspectedCause: "Legacy mapping from Epic build or specialty assignment step skipped",
  },
  {
    id: "MI-003",
    clinicCode: "HPB001",
    intendedSubspecialty: "HPB",
    intendedQueue: "HPB Booking",
    observedQueue: "HPB Booking",
    referralSource: "MDM",
    impact: "Low",
    suspectedCause: "MDM workflow explicitly selects specialty (acts as “correct routing” baseline)",
  },
];

const GLOSSARY: GlossaryItem[] = [
  { term: "PTL", category: "Pathway & Ops", meaning: "Patient Tracking List", notes: "Operational list used to track patients along their pathway and manage waiting." },
  { term: "RTT", category: "Pathway & Ops", meaning: "Referral to Treatment", notes: "Waiting-time pathway clock from referral to start of definitive treatment (or pathway end)." },
  { term: "MDM", category: "Pathway & Ops", meaning: "Multidisciplinary Meeting", notes: "Often used interchangeably with MDT (Multidisciplinary Team)." },
  { term: "MDT", category: "Pathway & Ops", meaning: "Multidisciplinary Team", notes: "Group of professionals jointly managing complex care (common in cancer and transplant pathways)." },
  { term: "eRS", category: "Pathway & Ops", meaning: "electronic Referral Service", notes: "NHS system for referrals from primary care into secondary care services." },
  { term: "GP", category: "Pathway & Ops", meaning: "General Practitioner", notes: "Primary care clinician who often initiates referrals into hospital services." },
  { term: "OPAC", category: "Pathway & Ops", meaning: "Outpatient Appointment Centre", notes: "Local term often used for a booking / appointments hub (names vary by Trust)." },
  { term: "EPR", category: "Pathway & Ops", meaning: "Electronic Patient Record", notes: "Digital patient record used for clinical documentation, orders, scheduling, results, and workflow." },
  { term: "HPB", category: "Pathway & Ops", meaning: "Hepato Pancreato Biliary", notes: "Subspecialty covering liver (hepato), pancreas (pancreato), and bile ducts (biliary)." },
  { term: "UGI", category: "Pathway & Ops", meaning: "Upper Gastrointestinal", notes: "Upper GI services can be a misroute destination when clinic codes or referral metadata are ambiguous." },

  { term: "Epic", category: "Epic (system)", meaning: "Epic Systems (vendor name, not an acronym)", notes: "EPR platform; many Epic modules have their own names." },
  { term: "WQ", category: "Epic (system)", meaning: "Work Queue", notes: "A task list / worklist used to process referrals, scheduling, authorisations, results, and admin work." },
  { term: "Cadence", category: "Epic (system)", meaning: "Cadence (Epic scheduling module name)", notes: "Appointment scheduling, templates, and clinic sessions." },
  { term: "Clarity", category: "Epic (system)", meaning: "Clarity (Epic reporting database name)", notes: "Reporting database used for extracts, analytics, and operational reporting." },
  { term: "Caboodle", category: "Epic (system)", meaning: "Caboodle (Epic data warehouse name)", notes: "Data warehouse used for analytics and business intelligence." },
  { term: "RWB", category: "Epic (system)", meaning: "Reporting Workbench", notes: "Epic reporting tool for operational lists and worklist-style reporting." },

  { term: "HCC", category: "Liver (clinical)", meaning: "Hepato Cellular Carcinoma", notes: "Primary liver cancer; commonly tracked through cancer pathways and MDT/MDM." },
  { term: "PSC", category: "Liver (clinical)", meaning: "Primary Sclerosing Cholangitis", notes: "Inflammatory disease affecting bile ducts." },
  { term: "PBC", category: "Liver (clinical)", meaning: "Primary Biliary Cholangitis", notes: "Autoimmune cholangitis affecting intrahepatic bile ducts." },
  { term: "NAFLD", category: "Liver (clinical)", meaning: "Non Alcoholic Fatty Liver Disease", notes: "Metabolic liver disease spectrum; terminology evolving in some services." },
  { term: "NASH", category: "Liver (clinical)", meaning: "Non Alcoholic Steato Hepatitis", notes: "Inflammation (hepatitis) associated with fatty liver (steato-)." },
  { term: "MELD", category: "Liver (clinical)", meaning: "Model for End stage Liver Disease", notes: "Score used to assess severity and transplant prioritisation." },
  { term: "TIPS", category: "Liver (clinical)", meaning: "Trans jugular Intrahepatic Porto Systemic Shunt", notes: "Procedure to reduce portal hypertension." },
  { term: "LFT", category: "Liver (clinical)", meaning: "Liver Function Test", notes: "Blood tests assessing liver enzymes, bilirubin, and synthetic function markers." },
];

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "good" | "warn" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function StatusPill({ status }: { status: TaskStatus }) {
  const tone = status === "Done" ? "good" : status === "In progress" ? "warn" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

function ImpactPill({ impact }: { impact: MappingIssue["impact"] }) {
  const tone = impact === "High" ? "warn" : "neutral";
  return <Badge tone={tone}>{impact} impact</Badge>;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card stat">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
      {hint ? <div className="statHint">{hint}</div> : null}
    </div>
  );
}

function toCsv(rows: Array<Record<string, string | number | boolean>>) {
  const cols = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const esc = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };
  const header = cols.map(esc).join(",");
  const body = rows.map((r) => cols.map((c) => esc(r[c] ?? "")).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatUkDateTime(d: Date) {
  // Keep it simple and consistent for UK audiences
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GlossaryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<GlossaryCategory | "All">("All");

  const categories: Array<GlossaryCategory | "All"> = ["All", "Pathway & Ops", "Epic (system)", "Liver (clinical)"];

  const items = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return GLOSSARY.filter((x) => {
      if (cat !== "All" && x.category !== cat) return false;
      if (!qq) return true;
      return (
        x.term.toLowerCase().includes(qq) ||
        x.meaning.toLowerCase().includes(qq) ||
        (x.notes ?? "").toLowerCase().includes(qq)
      );
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [q, cat]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Acronym key and glossary"
      className="modalOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card modalCard">
        <div className="modalTop">
          <div>
            <div className="modalTitle">Acronym Key & Glossary</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Search any term. Each acronym is expanded fully.
            </div>
          </div>

          <div className="modalActions">
            <button className="tab" onClick={() => {
              const rows = items.map((x) => ({
                Term: x.term,
                Category: x.category,
                Meaning: x.meaning,
                Notes: x.notes ?? "",
              }));
              downloadTextFile("liver-unit-acronym-key.csv", toCsv(rows), "text/csv;charset=utf-8");
            }}>
              Export CSV
            </button>
            <button className="tab" onClick={onClose} aria-label="Close glossary">
              Close
            </button>
          </div>
        </div>

        <div className="modalFilters">
          <div style={{ minWidth: 260, flex: 1 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              Search
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. RTT, HPB, Work Queue, Clarity, HCC"
              className="textInput"
            />
          </div>

          <div style={{ minWidth: 240 }}>
            <div className="muted" style={{ marginBottom: 6 }}>
              Category
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value as any)} style={{ width: "100%" }}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            Showing <strong>{items.length}</strong> terms
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((x) => (
              <details key={`${x.category}-${x.term}`} className="glossaryItem">
                <summary className="glossarySummary">
                  <span>
                    {x.term} <span className="muted" style={{ fontWeight: 800 }}>— {x.meaning}</span>
                  </span>
                  <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge>{x.category}</Badge>
                  </span>
                </summary>

                <div style={{ marginTop: 10, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Meaning</div>
                  <div>{x.meaning}</div>

                  {x.notes ? (
                    <>
                      <div style={{ fontWeight: 900, marginTop: 10, marginBottom: 6 }}>Notes</div>
                      <div className="muted">{x.notes}</div>
                    </>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidencePanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tickets, setTickets] = useState("");
  const [links, setLinks] = useState("");
  const [notes, setNotes] = useState("");
  const [owners, setOwners] = useState("");

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      setTickets(data.tickets ?? "");
      setLinks(data.links ?? "");
      setNotes(data.notes ?? "");
      setOwners(data.owners ?? "");
    } catch {
      // ignore
    }
  }, [open]);

  function save() {
    const payload = { tickets, links, notes, owners };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evidence panel"
      className="modalOverlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card modalCard">
        <div className="modalTop">
          <div>
            <div className="modalTitle">Evidence Panel (non-patient)</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Paste ticket numbers, meeting notes, and links to spreadsheets/Teams posts. Stored locally in this browser.
            </div>
          </div>

          <div className="modalActions">
            <button className="tab" onClick={() => {
              save();
              const exportObj = {
                tickets,
                links,
                notes,
                owners,
                exportedAt: new Date().toISOString(),
              };
              downloadTextFile("liver-unit-evidence-pack.json", JSON.stringify(exportObj, null, 2), "application/json;charset=utf-8");
            }}>
              Export JSON
            </button>
            <button className="tab" onClick={() => { save(); }}>
              Save
            </button>
            <button className="tab" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="modalFilters" style={{ marginTop: 12 }}>
          <div style={{ minWidth: 260, flex: 1 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Ticket numbers</div>
            <textarea
              className="textArea"
              value={tickets}
              onChange={(e) => setTickets(e.target.value)}
              placeholder={"e.g.\nINC 113696\nSR 123456\nCHG 98765"}
            />
          </div>

          <div style={{ minWidth: 260, flex: 1 }}>
            <div className="muted" style={{ marginBottom: 6 }}>Links</div>
            <textarea
              className="textArea"
              value={links}
              onChange={(e) => setLinks(e.target.value)}
              placeholder={"e.g.\nTeams thread link\nSharePoint spreadsheet link\nEmail thread reference"}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Named owners / contacts</div>
            <textarea
              className="textArea"
              value={owners}
              onChange={(e) => setOwners(e.target.value)}
              placeholder={"e.g.\nSimona Monea – Exceed\nAlara Bailey – Liver bookings\nMDM nurses – Suresh team"}
            />
          </div>

          <div>
            <div className="muted" style={{ marginBottom: 6 }}>Meeting notes / actions</div>
            <textarea
              className="textArea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={"Capture key decisions and what evidence is needed.\nNo patient identifiers."}
              style={{ minHeight: 140 }}
            />
          </div>

          <div className="callout">
            Tip: Use this panel during meetings to capture the “evidence pack” live. Keep it non-patient.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<TabKey>("Overview");
  const [ownerFilter, setOwnerFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  // set lastUpdated whenever the app loads (and whenever print mode toggles, etc.)
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // add/remove print mode class on body
  useEffect(() => {
    document.body.classList.toggle("printMode", printMode);
  }, [printMode]);

  const owners = useMemo(() => {
    const set = new Set(TASKS.map((t) => t.owner));
    return ["All", ...Array.from(set)];
  }, []);

  const tasksFiltered = useMemo(() => {
    return TASKS.filter((t) => {
      if (ownerFilter !== "All" && t.owner !== ownerFilter) return false;
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      return true;
    });
  }, [ownerFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = TASKS.length;
    const inProgress = TASKS.filter((t) => t.status === "In progress").length;
    const done = TASKS.filter((t) => t.status === "Done").length;
    const blocked = TASKS.filter((t) => t.status === "Blocked").length;
    return { total, inProgress, done, blocked };
  }, []);

  const mappingStats = useMemo(() => {
    const suspectedMisroutes = SAMPLE_ISSUES.filter((x) => x.observedQueue !== x.intendedQueue).length;
    const highImpact = SAMPLE_ISSUES.filter((x) => x.impact === "High" && x.observedQueue !== x.intendedQueue).length;
    const topCodes = Array.from(
      SAMPLE_ISSUES.reduce((m, x) => {
        if (x.observedQueue !== x.intendedQueue) m.set(x.clinicCode, (m.get(x.clinicCode) ?? 0) + 1);
        return m;
      }, new Map<string, number>())
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return { suspectedMisroutes, highImpact, topCodes };
  }, []);

  const riskBanner = useMemo(() => {
    if (mappingStats.highImpact <= 0) return null;
    return {
      title: "Risk: High-impact misroutes detected (sample)",
      detail: "High-impact misroutes can hide HPB cancer pathways and create safety / reporting risk. Prioritise mapping review and evidence pack.",
    };
  }, [mappingStats.highImpact]);

  const matrix = useMemo(() => {
    // Intended subspecialty rows, observed queue columns
    const rowKeys: MappingIssue["intendedSubspecialty"][] = ["Hepatology", "HPB", "Transplant", "Oncology", "General"];

    const colSet = new Set<string>();
    SAMPLE_ISSUES.forEach((x) => colSet.add(x.observedQueue));
    const colKeys = Array.from(colSet).sort((a, b) => a.localeCompare(b));

    const countsMap = new Map<string, number>();
    SAMPLE_ISSUES.forEach((x) => {
      const key = `${x.intendedSubspecialty}|||${x.observedQueue}`;
      countsMap.set(key, (countsMap.get(key) ?? 0) + 1);
    });

    return { rowKeys, colKeys, countsMap };
  }, []);

  function exportTasksCsv() {
    const rows = TASKS.map((t) => ({
      ID: t.id,
      Title: t.title,
      Owner: t.owner,
      Status: t.status,
      EvidenceNeeded: t.evidenceNeeded.join("; "),
      Notes: t.notes ?? "",
    }));
    downloadTextFile("liver-unit-tasks.csv", toCsv(rows), "text/csv;charset=utf-8");
  }

  function exportIssuesCsv() {
    const rows = SAMPLE_ISSUES.map((x) => ({
      ID: x.id,
      ClinicCode: x.clinicCode,
      IntendedSubspecialty: x.intendedSubspecialty,
      IntendedQueue: x.intendedQueue,
      ObservedQueue: x.observedQueue,
      ReferralSource: x.referralSource,
      Impact: x.impact,
      SuspectedCause: x.suspectedCause,
      Misroute: x.observedQueue !== x.intendedQueue,
    }));
    downloadTextFile("liver-unit-mapping-issues.csv", toCsv(rows), "text/csv;charset=utf-8");
  }

  function exportGlossaryCsv() {
    const rows = GLOSSARY.slice()
      .sort((a, b) => a.term.localeCompare(b.term))
      .map((x) => ({
        Term: x.term,
        Category: x.category,
        Meaning: x.meaning,
        Notes: x.notes ?? "",
      }));
    downloadTextFile("liver-unit-acronym-key.csv", toCsv(rows), "text/csv;charset=utf-8");
  }

  return (
    <div className="appShell">
      <header className="header">
        <div className="headerLeft">
          <div className="titleRow">
            <div className="title">Liver Unit PTL Routing Dashboard</div>
            <span className="headerPills">
              <span className="headerPill">{APP_VERSION}</span>
              <span className="headerPill">Last updated: {formatUkDateTime(lastUpdated)}</span>
            </span>
          </div>
          <div className="subtitle">
            Evidence-led view of routing, clinic code mapping, and follow-up actions (anonymised prototype)
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="tabs">
            {(["Overview", "Tasks", "Mapping Issues"] as TabKey[]).map((k) => (
              <button key={k} className={k === tab ? "tab active" : "tab"} onClick={() => setTab(k)}>
                {k}
              </button>
            ))}
          </div>

          <button className="tab" onClick={() => setGlossaryOpen(true)} title="Acronym Key & Glossary">
            Acronym Key
          </button>
          <button className="tab" onClick={() => setEvidenceOpen(true)} title="Evidence panel">
            Evidence
          </button>
          <button
            className={printMode ? "tab active" : "tab"}
            onClick={() => setPrintMode((v) => !v)}
            title="Toggle print-friendly mode"
          >
            Print Mode
          </button>

          <div className="exportMenu">
            <button className="tab" title="Export data">Export</button>
            <div className="exportDropdown">
              <button onClick={exportTasksCsv}>Tasks → CSV</button>
              <button onClick={exportIssuesCsv}>Mapping Issues → CSV</button>
              <button onClick={exportGlossaryCsv}>Acronym Key → CSV</button>
              <button onClick={() => window.print()}>Print / Save as PDF</button>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {riskBanner ? (
          <div className="riskBanner">
            <div className="riskTitle">⚠ {riskBanner.title}</div>
            <div className="riskDetail">{riskBanner.detail}</div>
          </div>
        ) : null}

        {tab === "Overview" ? (
          <>
            <div className="hero card">
              <div className="heroTop">
                <div>
                  <div className="heroTitle">What this dashboard is for</div>
                  <div className="heroText">
                    Make misrouting visible and actionable: compare intended vs observed work queue allocation, track fixes as sprint tasks,
                    and build an evidence pack for Epic mapping changes.
                  </div>
                </div>
                <div className="heroBadges">
                  <Badge>PTL = Patient Tracking List</Badge>
                  <Badge>HPB = Hepato Pancreato Biliary</Badge>
                  <Badge>MDM = Multidisciplinary Meeting</Badge>
                </div>
              </div>

              <div className="statsGrid">
                <StatCard label="Tasks" value={`${counts.total}`} hint={`${counts.inProgress} in progress • ${counts.done} done • ${counts.blocked} blocked`} />
                <StatCard label="Suspected misroutes (sample)" value={`${mappingStats.suspectedMisroutes}`} hint="Observed queue ≠ intended queue" />
                <StatCard label="High-impact misroutes (sample)" value={`${mappingStats.highImpact}`} hint="Prioritise for patient safety + reporting" />
                <StatCard
                  label="Top clinic codes (sample)"
                  value={mappingStats.topCodes.map(([c]) => c).join(", ") || "—"}
                  hint="Most frequently linked to misrouting in sample"
                />
              </div>
            </div>

            <div className="grid2">
              <div className="card">
                <div className="sectionTitle">Leadership summary (Liver Unit)</div>
                <ul className="bullets">
                  <li>Mixed booking queues increase manual sorting and raise safety risk (e.g., oncology + general mixed together).</li>
                  <li>Mis-assignment can hide HPB cancer patients from HPB views and downstream reporting.</li>
                  <li>Likely drivers: clinic code mapping, referral source metadata differences, and inconsistent specialty selection.</li>
                  <li>Approach: compare “correct routing” baseline (often MDM) vs “wrong routing” (often other channels) and fix build rules.</li>
                </ul>
              </div>

              <div className="card">
                <div className="sectionTitle">Next evidence pack (what to collect)</div>
                <ul className="bullets">
                  <li>Work queue list + screenshots (patient details removed)</li>
                  <li>Clinic code spreadsheet categorised by Liver subspecialty</li>
                  <li>2–3 anonymised case comparisons across referral sources</li>
                  <li>Clear statement of “intended vs observed” for each case</li>
                </ul>
                <div className="callout">This prototype uses synthetic examples. Swap in anonymised exports once available.</div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 12 }}>
              <div className="sectionTitle">Clinic code routing matrix (sample)</div>
              <div className="muted" style={{ marginBottom: 10 }}>
                Rows = intended Liver subspecialty. Columns = observed queue. Cells show count of sample items.
              </div>

              <div className="tableWrap">
                <table className="table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Intended subspecialty</th>
                      {matrix.colKeys.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.rowKeys.map((r) => (
                      <tr key={r}>
                        <td><strong>{r}</strong></td>
                        {matrix.colKeys.map((c) => {
                          const v = matrix.countsMap.get(`${r}|||${c}`) ?? 0;
                          return (
                            <td key={`${r}|||${c}`}>
                              {v > 0 ? <span className="matrixCell strong">{v}</span> : <span className="matrixCell">{v}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="callout">
                When real anonymised extracts are loaded, this matrix becomes your “exec view” for where misroutes concentrate.
              </div>
            </div>
          </>
        ) : null}

        {tab === "Tasks" ? (
          <>
            <div className="row">
              <div className="sectionTitle">Follow-up tasks</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button className="tab" onClick={exportTasksCsv}>Export Tasks CSV</button>
              </div>
            </div>

            <div className="filters">
              <div className="field">
                <label>Owner</label>
                <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                  {owners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  {(["All", "Not started", "In progress", "Blocked", "Done"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="cardsGrid" style={{ marginTop: 12 }}>
              {tasksFiltered.map((t) => (
                <div key={t.id} className="card">
                  <div className="cardTop">
                    <div className="muted">{t.id}</div>
                    <StatusPill status={t.status} />
                  </div>

                  <div className="cardTitle">{t.title}</div>
                  <div className="meta"><span className="muted">Owner:</span> <strong>{t.owner}</strong></div>

                  <div className="meta muted" style={{ marginTop: 10 }}>Evidence needed</div>
                  <div className="chips">
                    {t.evidenceNeeded.map((x, i) => (
                      <span key={i} className="chip">{x}</span>
                    ))}
                  </div>

                  {t.notes ? <div className="callout">{t.notes}</div> : null}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {tab === "Mapping Issues" ? (
          <>
            <div className="row">
              <div className="sectionTitle">Mapping issues (sample)</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button className="tab" onClick={exportIssuesCsv}>Export Issues CSV</button>
              </div>
            </div>

            <div className="card">
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Clinic code</th>
                      <th>Intended (subspecialty / queue)</th>
                      <th>Observed queue</th>
                      <th>Referral source</th>
                      <th>Impact</th>
                      <th>Suspected cause</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ISSUES.map((x) => {
                      const misroute = x.observedQueue !== x.intendedQueue;
                      return (
                        <tr key={x.id}>
                          <td className="muted">{x.id}</td>
                          <td><strong>{x.clinicCode}</strong></td>
                          <td>
                            <div><strong>{x.intendedSubspecialty}</strong></div>
                            <div className="muted">{x.intendedQueue}</div>
                          </td>
                          <td>
                            {misroute ? <span className="flag">⚠ {x.observedQueue}</span> : <span>{x.observedQueue}</span>}
                          </td>
                          <td>{x.referralSource}</td>
                          <td><ImpactPill impact={x.impact} /></td>
                          <td className="muted">{x.suspectedCause}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="callout">
                Next step: import real anonymised extracts (clinic code list + queue list) and auto-flag conflicts.
              </div>
            </div>
          </>
        ) : null}
      </main>

      <footer className="footer">
        <div className="muted">
          Prototype: no patient data. Designed for Liver Unit routing improvement work.
        </div>
      </footer>

      <GlossaryModal open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
      <EvidencePanel open={evidenceOpen} onClose={() => setEvidenceOpen(false)} />
    </div>
  );
}
