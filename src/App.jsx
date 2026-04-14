import { useState, useEffect, useCallback, useRef } from "react";
import OverviewTab from "./components/Overview.jsx";
import TimelineTab from "./components/Timeline.jsx";
import ListTab from "./components/ListTab.jsx";
import BudgetTab from "./components/Budget.jsx";
import { ThemeSlider, SettingsMenu } from "./components/Settings.jsx";
import { STORAGE_KEY, FONTS, TIMEZONES, DEFAULT_DATA, selectStyle } from "./data/defaults.js";
import { syncTimelineDays } from "./utils/helpers.js";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "food", label: "Food" },
  { id: "activities", label: "Activities" },
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

// ─── Storage ───
async function loadData() {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function TripPlanner() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  useEffect(() => {
    loadData().then(s => {
      if (s) {
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
        // Migrate timeline days: add subtitle, locationIds, migrate events
        s.timeline = s.timeline.map(d => ({
          ...d,
          subtitle: d.subtitle || "",
          locationIds: d.locationIds || [],
          events: (d.events || []).map(e => ({ ...e, linkedItemId: e.linkedItemId || "" })),
        }));
        // Auto-generate timeline days from date range if empty or dates changed
        if (s.startDate && s.endDate) {
          s.timeline = syncTimelineDays(s.timeline, s.startDate, s.endDate);
        }
        if (!s.food) s.food = DEFAULT_DATA.food;
        if (!s.activities) s.activities = DEFAULT_DATA.activities;
        // Migrate food/activities: reservationDate → reservationDay + reservationTime, add priceLevel/tags
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
      }
      setData(s || JSON.parse(JSON.stringify(DEFAULT_DATA)));
      setLoading(false);
    });
  }, []);

  const setD = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveData(next), 500);
      return next;
    });
  }, []);

  const theme = useTheme(data?.theme || "system");
  const font = FONTS.find(f => f.id === data?.font) || FONTS[3];

  if (loading || !data) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui", color: "#999" }}>Loading…</div>;

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

  return (
    <div style={{ ...vars, background: "var(--bg)", color: "var(--fg)", minHeight: "100vh", fontFamily: font.stack }}>
      <link href={font.href} rel="stylesheet" />
      <div style={{ padding: "16px clamp(12px, 4vw, 28px) 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: 1.5, textTransform: "uppercase" }}>✈ Trip Planner</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={data.timezone} onChange={e => setD(d => ({ ...d, timezone: e.target.value }))} style={{ ...selectStyle, fontSize: 11 }}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
          <ThemeSlider value={data.theme} onChange={v => setD(d => ({ ...d, theme: v }))} />
          <SettingsMenu data={data} setData={setD} saveData={saveData} />
        </div>
      </div>
      <div style={{ display: "flex", gap: "clamp(16px, 5vw, 28px)", padding: "24px clamp(12px, 4vw, 28px) 0", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "4px 0 14px", background: "transparent", border: "none",
            borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
            color: tab === t.id ? "var(--fg)" : "var(--muted)",
            fontSize: 14, fontWeight: tab === t.id ? 700 : 400, cursor: "pointer", fontFamily: "inherit",
            letterSpacing: -0.2, transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ height: 1, background: "var(--border)", margin: "0 clamp(12px, 4vw, 28px)" }} />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "clamp(20px, 5vw, 32px) clamp(12px, 4vw, 28px) 80px" }}>
        {tab === "overview" && <OverviewTab data={data} setData={setD} tz={data.timezone} />}
        {tab === "timeline" && <TimelineTab data={data} setData={setD} />}
        {tab === "food" && <ListTab items={data.food} setItems={v => setD(d => ({ ...d, food: v }))} type="Restaurant" locations={data.locations} />}
        {tab === "activities" && <ListTab items={data.activities} setItems={v => setD(d => ({ ...d, activities: v }))} type="Activity" locations={data.locations} />}
        {tab === "budget" && <BudgetTab data={data} setData={setD} />}
      </div>
    </div>
  );
}
