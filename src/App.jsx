import { useState, useEffect, useCallback, useRef } from "react";
import OverviewTab from "./components/Overview.jsx";
import TimelineTab from "./components/Timeline.jsx";
import ListTab from "./components/ListTab.jsx";
import StaysTab from "./components/StaysTab.jsx";
import BudgetTab from "./components/Budget.jsx";
import { ThemeSlider, SettingsMenu } from "./components/Settings.jsx";
import GistSetup from "./components/GistSetup.jsx";
import { FONTS, TIMEZONES, DEFAULT_DATA, selectStyle } from "./data/defaults.js";
import { loadTripsDb, saveTripsDb, createNewTrip } from "./data/tripsDb.js";
import { getCredentials, saveCredentials, clearCredentials, loadFromGist, saveToGist, createGist, setPending, clearPending, hasPending, isGuestMode, setGuestMode, clearGuestMode } from "./data/gistStorage.js";
import { syncTimelineDays, syncDerivedStubs } from "./utils/helpers.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "food", label: "Food" },
  { id: "activities", label: "Activities" },
  { id: "stays", label: "Stays" },
  { id: "budget", label: "Budget" },
];

// ─── Theme Hook ───
function useTheme(pref) {
  const [resolved, setResolved] = useState("light");
  useEffect(() => {
    if (pref !== "system") { setResolved(pref); return; }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolved(mq.matches ? "dark" : "light");
    const h = (e) => setResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [pref]);
  return resolved;
}

function migrateTrip(s) {
  if (!s) return null;
  if (!s.font && s.fontId) { s.font = s.fontId; delete s.fontId; }
  if (!s.font) s.font = "literata";
  if (!s.timezone) s.timezone = "PST";
  if (!s.locations) s.locations = [];
  if (!s.overview) s.overview = DEFAULT_DATA.overview;
  if (!s.overview.transports) {
    if (s.overview.flights) {
      s.overview.transports = s.overview.flights.map(f => ({
        id: f.id, type: "flight", route: f.route || "", date: f.date || "",
        startTime: "", endTime: "", airline: f.airline || "", notes: f.notes || "",
        budgeted: 0, actual: 0,
      }));
      delete s.overview.flights;
    } else {
      s.overview.transports = [];
    }
  }
  if (!s.overview.stays) s.overview.stays = [];
  if (!s.overview.deadlines) s.overview.deadlines = [];
  s.overview.stays = s.overview.stays.map(st => ({
    ...st, locationId: st.locationId || "", startDate: st.startDate || "",
    endDate: st.endDate || "", budgeted: st.budgeted ?? 0, actual: st.actual ?? 0,
  }));
  if (!s.timeline) s.timeline = [];
  s.timeline = s.timeline.map(d => ({
    ...d,
    subtitle: d.subtitle || "",
    locationIds: d.locationIds || [],
    events: (d.events || []).map(e => ({ ...e, linkedItemId: e.linkedItemId || "" })),
  }));
  if (s.startDate && s.endDate) {
    s.timeline = syncTimelineDays(s.timeline, s.startDate, s.endDate);
  }
  if (!s.food) s.food = DEFAULT_DATA.food;
  if (!s.activities) s.activities = DEFAULT_DATA.activities;
  if (!s.stayOptions) s.stayOptions = [];
  const migrateItem = (item) => {
    const migrated = { ...item };
    if (migrated.reservationDay === undefined) { migrated.reservationDay = ""; migrated.reservationTime = ""; delete migrated.reservationDate; }
    if (migrated.priceLevel === undefined) {
      const p = (migrated.price || "").length;
      migrated.priceLevel = p >= 1 && p <= 4 ? p : 1;
      delete migrated.price;
    }
    if (!migrated.tags) migrated.tags = [];
    return migrated;
  };
  s.food = s.food.map(migrateItem);
  s.activities = s.activities.map(migrateItem);
  if (!s.budget) s.budget = DEFAULT_DATA.budget;
  if (s.budget.categories) {
    s.budget.categories = s.budget.categories.filter(c => c.group !== "Transportation" && c.group !== "Stays");
  }
  return syncDerivedStubs(s);
}

function applyMigrations(raw) {
  if (!raw?.trips) return null;
  raw.trips = raw.trips.map(migrateTrip);
  if (!raw.activeTripId || !raw.trips.find(t => t.id === raw.activeTripId)) {
    raw.activeTripId = raw.trips[0].id;
  }
  return raw;
}

export default function TripPlanner() {
  const [credentials, setCredentials] = useState(() => getCredentials());
  const [guestMode, setGuestModeState] = useState(() => isGuestMode());
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState("overview");
  const [splitPanel, setSplitPanel] = useState(null); // null | "overview" | "food" | "activities"
  const [splitSearch, setSplitSearch] = useState("");
  const [splitLocFilter, setSplitLocFilter] = useState("");

  // Called by Timeline to open (or toggle) the split panel, optionally pre-seeding the search/filter
  const handleOpenSplit = useCallback((panel, search = "", locFilter = "") => {
    setSplitPanel(panel);
    setSplitSearch(search);
    setSplitLocFilter(locFilter);
  }, []);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const [syncError, setSyncError] = useState("");
  const [conflictData, setConflictData] = useState(null); // { gist, local } when unsynced changes detected
  const saveTimer = useRef(null);
  const credentialsRef = useRef(credentials);

  useEffect(() => { credentialsRef.current = credentials; }, [credentials]);

  // Initial load on mount
  useEffect(() => {
    // Guest mode: load from localStorage only
    if (isGuestMode()) {
      const cached = loadTripsDb();
      if (cached?.trips?.length > 0) {
        setDb(applyMigrations(cached) || cached);
      } else {
        const trip = migrateTrip(createNewTrip());
        setDb({ trips: [trip], activeTripId: trip.id });
      }
      setLoading(false);
      return;
    }
    const creds = getCredentials();
    if (!creds) { setLoading(false); return; }
    loadFromGist(creds.token, creds.gistId)
      .then(raw => {
        const migrated = applyMigrations(raw);
        if (!migrated) throw new Error("Invalid data format in gist");
        // If there are unsynced local changes, let the user decide which version to keep
        if (hasPending()) {
          const cached = loadTripsDb();
          const local = cached?.trips?.length > 0 ? (applyMigrations(cached) || cached) : null;
          if (local) {
            setConflictData({ gist: migrated, local });
            return;
          }
        }
        clearPending();
        setDb(migrated);
        saveTripsDb(migrated);
      })
      .catch(err => {
        console.error("[Trip Planner] Failed to load from gist:", err.message);
        // fall back to local cache
        const cached = loadTripsDb();
        if (cached?.trips?.length > 0) {
          setDb(applyMigrations(cached) || cached);
        } else {
          const trip = migrateTrip(createNewTrip());
          setDb({ trips: [trip], activeTripId: trip.id });
        }
        setSyncStatus("error");
        setSyncError(err.message);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doGistSave = useCallback(async (nextDb) => {
    const creds = credentialsRef.current;
    if (!creds) return;
    setSyncStatus("saving");
    try {
      await saveToGist(creds.token, creds.gistId, nextDb);
      clearPending();
      setSyncStatus("saved");
      setSyncError("");
      setTimeout(() => setSyncStatus(s => s === "saved" ? "idle" : s), 2000);
    } catch (err) {
      console.error("[Trip Planner] Failed to save to gist:", err.message);
      setSyncStatus("error");
      setSyncError(err.message);
    }
  }, []);

  const setD = useCallback((updater) => {
    setDb(prev => {
      const next = {
        ...prev,
        trips: prev.trips.map(t => {
          if (t.id !== prev.activeTripId) return t;
          const updated = typeof updater === "function" ? updater(t) : updater;
          return syncDerivedStubs({ ...updated, id: t.id });
        }),
      };
      saveTripsDb(next); // local cache
      if (!isGuestMode()) {
        setPending();
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doGistSave(next), 5 * 60 * 1000);
      }
      return next;
    });
  }, [doGistSave]);

  const switchTrip = useCallback((id) => {
    setDb(prev => {
      const next = { ...prev, activeTripId: id };
      saveTripsDb(next);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doGistSave(next), 5 * 60 * 1000);
      return next;
    });
    setTab("overview");
  }, [doGistSave]);

  const addTrip = useCallback(() => {
    const trip = migrateTrip(createNewTrip());
    setDb(prev => {
      const next = { trips: [...prev.trips, trip], activeTripId: trip.id };
      saveTripsDb(next);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doGistSave(next), 5 * 60 * 1000);
      return next;
    });
    setTab("overview");
  }, [doGistSave]);

  const cloneTrip = useCallback(() => {
    setDb(prev => {
      const src = prev.trips.find(t => t.id === prev.activeTripId);
      if (!src) return prev;
      const clone = { ...JSON.parse(JSON.stringify(src)), id: `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, tripName: `Copy of ${src.tripName || "Untitled Trip"}` };
      const next = { trips: [...prev.trips, clone], activeTripId: clone.id };
      saveTripsDb(next);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doGistSave(next), 5 * 60 * 1000);
      return next;
    });
    setTab("overview");
  }, [doGistSave]);

  const deleteTrip = useCallback(() => {
    setDb(prev => {
      if (prev.trips.length === 1) { alert("You can't delete your only trip."); return prev; }
      if (!confirm(`Delete "${prev.trips.find(t => t.id === prev.activeTripId)?.tripName || "this trip"}"? This cannot be undone.`)) return prev;
      const trips = prev.trips.filter(t => t.id !== prev.activeTripId);
      const next = { trips, activeTripId: trips[0].id };
      saveTripsDb(next);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doGistSave(next), 5 * 60 * 1000);
      return next;
    });
    setTab("overview");
  }, [doGistSave]);

  const handleConnect = useCallback(({ token, gistId, db: initialDb }) => {
    saveCredentials(token, gistId);
    const newCreds = { token, gistId };
    credentialsRef.current = newCreds;
    setCredentials(newCreds);
    if (initialDb) {
      // new gist: data already created, skip fetch
      const migrated = applyMigrations(initialDb) || initialDb;
      setDb(migrated);
      saveTripsDb(migrated);
      setLoading(false);
    } else {
      // existing gist: fetch its data
      setLoading(true);
      loadFromGist(token, gistId)
        .then(raw => {
          const migrated = applyMigrations(raw);
          if (!migrated) throw new Error("Invalid data");
          setDb(migrated);
          saveTripsDb(migrated);
        })
        .catch(() => {
          const trip = migrateTrip(createNewTrip());
          setDb({ trips: [trip], activeTripId: trip.id });
          setSyncStatus("error");
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const handleDownload = useCallback(() => {
    const json = JSON.stringify(db, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [db]);

  const handleGuest = useCallback(() => {
    setGuestMode();
    setGuestModeState(true);
    const cached = loadTripsDb();
    if (cached?.trips?.length > 0) {
      setDb(applyMigrations(cached) || cached);
    } else {
      const trip = migrateTrip(createNewTrip());
      setDb({ trips: [trip], activeTripId: trip.id });
    }
    setLoading(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    clearCredentials();
    clearGuestMode();
    setCredentials(null);
    setGuestModeState(false);
    setDb(null);
    setLoading(false);
    setSyncStatus("idle");
  }, []);

  const data = db?.trips.find(t => t.id === db.activeTripId) ?? null;
  const theme = useTheme(data?.theme || "system");
  const font = FONTS.find(f => f.id === data?.font) || FONTS[3];

  useEffect(() => {
    document.title = data?.tripName ? `${data.tripName} — tloose` : "tloose";
  }, [data?.tripName]);

  // ─── Screens ───
  if (!credentials && !guestMode) {
    return (
      <GistSetup
        onConnect={handleConnect}
        onGuest={handleGuest}
        getInitialDb={() => {
          const trip = migrateTrip(createNewTrip());
          return { trips: [trip], activeTripId: trip.id };
        }}
      />
    );
  }

  if (loading || (!conflictData && !db)) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui", color: "#999" }}>
        Loading…
      </div>
    );
  }

  if (conflictData) {
    const resolve = (choice) => {
      const chosen = choice === "local" ? conflictData.local : conflictData.gist;
      clearPending();
      setDb(chosen);
      saveTripsDb(chosen);
      if (choice === "local") {
        // push local version to gist
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doGistSave(chosen), 500);
      }
      setConflictData(null);
    };
    const btnBase = { border: "1px solid #e8e6e0", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui", transition: "opacity 0.15s" };
    return (
      <div style={{ minHeight: "100vh", background: "#faf9f6", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", padding: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #e8e6e0", borderRadius: 16, padding: "36px 40px", maxWidth: 420, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#999", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>✈ Trip Planner</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px", letterSpacing: -0.4, color: "#1a1a1a" }}>Unsynced local changes</h2>
          <p style={{ fontSize: 14, color: "#666", margin: "0 0 24px", lineHeight: 1.55 }}>
            Your last session had changes that didn't sync to GitHub. Choose which version to keep — the other will be discarded.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => resolve("local")} style={{ ...btnBase, background: "#4a6ee0", color: "#fff", borderColor: "#4a6ee0" }}>
              Keep local version
              <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>{conflictData.local.trips.length} trip{conflictData.local.trips.length !== 1 ? "s" : ""} · saved on this device</div>
            </button>
            <button onClick={() => resolve("gist")} style={{ ...btnBase, background: "#fff", color: "#1a1a1a" }}>
              Load from GitHub Gist
              <div style={{ fontSize: 11, fontWeight: 400, color: "#999", marginTop: 2 }}>{conflictData.gist.trips.length} trip{conflictData.gist.trips.length !== 1 ? "s" : ""} · last synced version</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const vars = theme === "dark" ? {
    "--bg": "#0e0e12", "--fg": "#d8d8dc", "--muted": "#606068", "--card-bg": "#16161c", "--border": "#232328", "--border-subtle": "#1c1c22",
    "--input-bg": "transparent", "--accent": "#7b9cf5", "--accent-dim": "rgba(123,156,245,0.08)",
    "--red-bg": "rgba(248,113,113,0.1)", "--red-text": "#f87171", "--amber-bg": "rgba(251,191,36,0.08)", "--amber-text": "#fbbf24",
    "--green-bg": "rgba(74,222,128,0.08)", "--green-text": "#4ade80", "--slate-bg": "rgba(156,163,175,0.06)", "--slate-text": "#78787f",
    "--pill-track": "#1a1a22", "--pill-active-bg": "#26262e", "--pill-active-fg": "#d8d8dc",
  } : {
    "--bg": "#faf9f6", "--fg": "#1a1a1a", "--muted": "#999", "--card-bg": "#fff", "--border": "#e8e6e0", "--border-subtle": "#f0eee8",
    "--input-bg": "transparent", "--accent": "#4a6ee0", "--accent-dim": "rgba(74,110,224,0.05)",
    "--red-bg": "#fef2f2", "--red-text": "#dc2626", "--amber-bg": "#fffbeb", "--amber-text": "#b45309",
    "--green-bg": "#f0fdf4", "--green-text": "#16a34a", "--slate-bg": "#f7f6f3", "--slate-text": "#aaa",
    "--pill-track": "#efede8", "--pill-active-bg": "#fff", "--pill-active-fg": "#1a1a1a",
  };

  const isSplit = tab === "timeline" && splitPanel !== null;
  const handleTabChange = (id) => {
    setTab(id);
    if (id !== "timeline") setSplitPanel(null);
  };

  const splitPanelLabel = splitPanel === "overview" ? "Overview" : splitPanel === "food" ? "Food" : splitPanel === "activities" ? "Activities" : "";

  return (
    <div style={{ ...vars, background: "var(--bg)", color: "var(--fg)", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font.stack }}>
      <link href={font.href} rel="stylesheet" />
      {/* ─── Header ─── */}
      <div style={{ padding: "16px clamp(12px, 4vw, 28px) 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, flexShrink: 0 }}>
        {/* Left: branding + trip selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 1.5, textTransform: "uppercase" }}>✈ tloose</span>
          <div style={{ width: 1, height: 14, background: "var(--border)" }} />
          <select
            value={db.activeTripId}
            onChange={e => switchTrip(e.target.value)}
            style={{ ...selectStyle, fontSize: 12, maxWidth: 200 }}
          >
            {db.trips.map(t => (
              <option key={t.id} value={t.id}>{t.tripName || "Untitled Trip"}</option>
            ))}
          </select>
          <button onClick={addTrip} style={{ ...selectStyle, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "var(--accent)", borderColor: "var(--accent)", background: "var(--accent-dim)", cursor: "pointer" }}>+ New</button>
        </div>
        {/* Right: sync status + controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {!guestMode && (
            syncStatus === "error"
              ? <button onClick={() => doGistSave(db)} title={syncError || "Unknown error"} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 11, color: "var(--red-text)", fontFamily: "inherit" }}>Sync error — retry</button>
              : syncStatus === "saving" ? <span style={{ fontSize: 11, color: "var(--muted)" }}>Syncing…</span>
              : syncStatus === "saved" ? <span style={{ fontSize: 11, color: "var(--green-text)" }}>Saved ✓</span>
              : <button onClick={() => doGistSave(db)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 11, color: "var(--muted)", fontFamily: "inherit" }}>↑ Sync</button>
          )}
          <select value={data.timezone} onChange={e => setD(d => ({ ...d, timezone: e.target.value }))} style={{ ...selectStyle, fontSize: 11 }}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          <ThemeSlider value={data.theme} onChange={v => setD(d => ({ ...d, theme: v }))} />
          <SettingsMenu data={data} setData={setD} onDisconnect={handleDisconnect} onDownload={handleDownload} onClone={cloneTrip} onDelete={deleteTrip} guestMode={guestMode} />
        </div>
      </div>
      {/* ─── Tabs ─── */}
      <div style={{ display: "flex", gap: "clamp(16px, 5vw, 28px)", padding: "24px clamp(12px, 4vw, 28px) 0", overflowX: "auto", WebkitOverflowScrolling: "touch", flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
            padding: "4px 0 14px", background: "transparent", border: "none",
            borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
            color: tab === t.id ? "var(--fg)" : "var(--muted)",
            fontSize: 14, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: -0.2, transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ height: 1, background: "var(--border)", margin: "0 clamp(12px, 4vw, 28px)", flexShrink: 0 }} />

      {/* ─── Content ─── */}
      {isSplit ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          {/* Left: Timeline */}
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "clamp(20px, 5vw, 32px) clamp(12px, 3vw, 24px) 80px" }}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
              <TimelineTab data={data} setData={setD} onOpenSplit={handleOpenSplit} splitPanel={splitPanel} />
            </div>
          </div>
          {/* Divider */}
          <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
          {/* Right: Split panel */}
          <div style={{ width: "clamp(300px, 44%, 520px)", flexShrink: 0, display: "flex", flexDirection: "column", minHeight: 0 }}>
            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--fg)", letterSpacing: -0.2 }}>{splitPanelLabel}</span>
              <button onClick={() => setSplitPanel(null)} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--muted)",
                padding: "2px 6px", borderRadius: 4, lineHeight: 1, fontFamily: "inherit",
                transition: "color 0.1s",
              }} title="Close panel" onMouseEnter={e => e.target.style.color = "var(--fg)"} onMouseLeave={e => e.target.style.color = "var(--muted)"}>×</button>
            </div>
            {/* Panel content */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "clamp(20px, 5vw, 28px) clamp(12px, 3vw, 24px) 80px" }}>
              <div style={{ maxWidth: 480, margin: "0 auto" }}>
                {splitPanel === "overview" && <OverviewTab data={data} setData={setD} tz={data.timezone} />}
                {splitPanel === "food" && <ListTab items={data.food} setItems={v => setD(d => ({ ...d, food: v }))} type="Restaurant" locations={data.locations} initialSearch={splitSearch} initialLocFilter={splitLocFilter} />}
                {splitPanel === "activities" && <ListTab items={data.activities} setItems={v => setD(d => ({ ...d, activities: v }))} type="Activity" locations={data.locations} initialSearch={splitSearch} initialLocFilter={splitLocFilter} />}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(20px, 5vw, 32px) clamp(12px, 4vw, 28px) 80px" }}>
            {tab === "overview" && <OverviewTab data={data} setData={setD} tz={data.timezone} />}
            {tab === "timeline" && <TimelineTab data={data} setData={setD} onOpenSplit={handleOpenSplit} splitPanel={splitPanel} />}
            {tab === "food" && <ListTab items={data.food} setItems={v => setD(d => ({ ...d, food: v }))} type="Restaurant" locations={data.locations} />}
            {tab === "activities" && <ListTab items={data.activities} setItems={v => setD(d => ({ ...d, activities: v }))} type="Activity" locations={data.locations} />}
            {tab === "stays" && <StaysTab items={data.stayOptions} setItems={v => setD(d => ({ ...d, stayOptions: v }))} locations={data.locations} />}
            {tab === "budget" && <BudgetTab data={data} setData={setD} />}
          </div>
        </div>
      )}
    </div>
  );
}
