import { Editable, DeleteBtn, AddBtn, LocationSelect } from "./shared.jsx";
import { calcDuration, calcRecommendedArrival, uid, syncTimelineDays, generateDateRange } from "../utils/helpers.js";
import { TRANSPORT_TYPES, selectStyle, sectionHeaderStyle } from "../data/defaults.js";

function LocationsSection({ locations, setLocations }) {
  const addLoc = () => setLocations([...locations, { id: uid(), name: "", sublocations: [] }]);
  const rmLoc = (id) => setLocations(locations.filter(l => l.id !== id));
  const updLoc = (id, name) => setLocations(locations.map(l => l.id === id ? { ...l, name } : l));
  const addSub = (locId) => setLocations(locations.map(l => l.id === locId ? { ...l, sublocations: [...l.sublocations, { id: uid(), name: "" }] } : l));
  const rmSub = (locId, subId) => setLocations(locations.map(l => l.id === locId ? { ...l, sublocations: l.sublocations.filter(s => s.id !== subId) } : l));
  const updSub = (locId, subId, name) => setLocations(locations.map(l => l.id === locId ? { ...l, sublocations: l.sublocations.map(s => s.id === subId ? { ...s, name } : s) } : l));

  return <div>
    <div style={sectionHeaderStyle}><span>Locations</span><AddBtn label="Location" onClick={addLoc} /></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {locations.map(loc => (
        <div key={loc.id}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <Editable value={loc.name} onChange={v => updLoc(loc.id, v)} placeholder="City / Region" style={{ fontWeight: 600, fontSize: 14, width: 180 }} />
            <AddBtn label="Sub Location" onClick={() => addSub(loc.id)} />
            <DeleteBtn onClick={() => rmLoc(loc.id)} />
          </div>
          {loc.sublocations.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", paddingLeft: 12, marginBottom: 4 }}>
              {loc.sublocations.map(sub => (
                <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--pill-track)", borderRadius: 12, padding: "2px 4px 2px 8px" }}>
                  <Editable value={sub.name} onChange={v => updSub(loc.id, sub.id, v)} placeholder="Area" style={{ fontSize: 11, width: 90, padding: "2px 0" }} />
                  <DeleteBtn onClick={() => rmSub(loc.id, sub.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>;
}

function TransportRow({ t, onChange, onDelete, tz }) {
  const duration = calcDuration(t.startTime, t.endTime);
  const recArrival = calcRecommendedArrival(t.startTime, t.type);
  const upd = (f, v) => onChange({ ...t, [f]: v });

  return <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
      <select value={t.type} onChange={e => upd("type", e.target.value)} style={{ ...selectStyle, width: 80 }}>
        {TRANSPORT_TYPES.map(tt => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
      </select>
      <Editable value={t.route} onChange={v => upd("route", v)} placeholder="LAX → MLM" style={{ flex: 1, minWidth: 140, fontWeight: 600 }} />
      <Editable value={t.airline} onChange={v => upd("airline", v)} placeholder="Carrier" style={{ width: 80, fontSize: 12 }} />
      <DeleteBtn onClick={onDelete} />
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 2, flexWrap: "wrap" }}>
      <input type="date" value={t.date} onChange={e => upd("date", e.target.value)} style={{ ...selectStyle, fontSize: 12, width: 140 }} />
      <Editable value={t.startTime} onChange={v => upd("startTime", v)} placeholder="3:03 PM" style={{ width: 100, fontSize: 13 }} />
      <span style={{ color: "var(--muted)", fontSize: 11 }}>→</span>
      <Editable value={t.endTime} onChange={v => upd("endTime", v)} placeholder="7:33 PM" style={{ width: 100, fontSize: 13 }} />
      {duration && <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{duration}</span>}
      {tz && <span style={{ fontSize: 10, color: "var(--muted)", opacity: 0.6 }}>{tz}</span>}
    </div>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, paddingLeft: 2, flexWrap: "wrap" }}>
      {recArrival && <span style={{ fontSize: 11, background: "var(--amber-bg)", color: "var(--amber-text)", padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>Arrive by {recArrival}</span>}
      <Editable value={t.notes} onChange={v => upd("notes", v)} placeholder="Notes" style={{ flex: 1, minWidth: 200, fontSize: 12, color: "var(--muted)" }} />
    </div>
  </div>;
}

export default function OverviewTab({ data, setData, tz }) {
  const { tripName, startDate, endDate, overview, locations } = data;
  const update = (path, val) => {
    setData(d => { const n = JSON.parse(JSON.stringify(d)); const k = path.split("."); let o = n; for (let i = 0; i < k.length - 1; i++) o = o[k[i]]; o[k[k.length - 1]] = val; return n; });
  };
  const start = startDate ? new Date(startDate + "T00:00:00") : null;
  const end = endDate ? new Date(endDate + "T00:00:00") : null;
  const days = start && end ? Math.ceil((end - start) / 86400000) + 1 : null;
  const calcNights = (sd, ed) => {
    if (!sd || !ed) return null;
    const diff = Math.ceil((new Date(ed + "T00:00:00") - new Date(sd + "T00:00:00")) / 86400000);
    return diff > 0 ? diff : null;
  };

  const handleDateChange = (field, newVal) => {
    const newStart = field === "startDate" ? newVal : startDate;
    const newEnd = field === "endDate" ? newVal : endDate;
    if (newStart && newEnd) {
      const newDates = new Set(generateDateRange(newStart, newEnd));
      const daysWithContent = data.timeline.filter(d => d.date && !newDates.has(d.date) && (d.events.length > 0 || d.subtitle));
      if (daysWithContent.length > 0) {
        if (!confirm(`This will remove ${daysWithContent.length} day(s) that have events or content. Continue?`)) return;
      }
    }
    setData(d => {
      const n = JSON.parse(JSON.stringify(d));
      n[field] = newVal;
      if (n.startDate && n.endDate) {
        n.timeline = syncTimelineDays(n.timeline, n.startDate, n.endDate);
      }
      return n;
    });
  };

  return <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
    <div>
      <Editable value={tripName} onChange={v => update("tripName", v)} placeholder="Trip Name" style={{ fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 700, letterSpacing: -0.5, padding: 0, marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 20, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4 }}>Start</span>
          <input type="date" value={startDate} onChange={e => handleDateChange("startDate", e.target.value)} style={{ ...selectStyle, fontSize: 13 }} />
        </div>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4 }}>End</span>
          <input type="date" value={endDate} onChange={e => handleDateChange("endDate", e.target.value)} style={{ ...selectStyle, fontSize: 13 }} />
        </div>
        {days && <span style={{ fontSize: 13, color: "var(--muted)", paddingBottom: 4 }}>{days} days</span>}
      </div>
    </div>

    <LocationsSection locations={locations} setLocations={v => update("locations", v)} />

    <div>
      <div style={sectionHeaderStyle}><span>Transport</span><AddBtn label="Transport" onClick={() => update("overview.transports", [...overview.transports, { id: uid(), type: "flight", route: "", date: "", startTime: "", endTime: "", airline: "", notes: "", budgeted: 0, actual: 0 }])} /></div>
      {overview.transports.map((t, i) => (
        <TransportRow key={t.id} t={t} tz={tz}
          onChange={nt => { const arr = [...overview.transports]; arr[i] = nt; update("overview.transports", arr); }}
          onDelete={() => update("overview.transports", overview.transports.filter(x => x.id !== t.id))} />
      ))}
    </div>

    <div>
      <div style={sectionHeaderStyle}><span>Stays</span><AddBtn label="Stay" onClick={() => update("overview.stays", [...overview.stays, { id: uid(), locationId: "", name: "", startDate: "", endDate: "", budgeted: 0, actual: 0 }])} /></div>
      {overview.stays.map((s, i) => {
        const nights = calcNights(s.startDate, s.endDate);
        return <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", paddingBottom: 10, borderBottom: "1px solid var(--border-subtle)", marginBottom: 4, flexWrap: "wrap" }}>
          <LocationSelect value={s.locationId} locations={locations} onChange={v => { const arr = [...overview.stays]; arr[i] = { ...s, locationId: v }; update("overview.stays", arr); }} style={{ width: 160 }} />
          <Editable value={s.name} onChange={v => { const arr = [...overview.stays]; arr[i] = { ...s, name: v }; update("overview.stays", arr); }} placeholder="Name" style={{ flex: 1, minWidth: 140 }} />
          <input type="date" value={s.startDate} onChange={e => { const arr = [...overview.stays]; arr[i] = { ...s, startDate: e.target.value }; update("overview.stays", arr); }} style={{ ...selectStyle, fontSize: 12 }} />
          <span style={{ color: "var(--muted)", fontSize: 11 }}>→</span>
          <input type="date" value={s.endDate} onChange={e => { const arr = [...overview.stays]; arr[i] = { ...s, endDate: e.target.value }; update("overview.stays", arr); }} style={{ ...selectStyle, fontSize: 12 }} />
          {nights && <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>{nights}n</span>}
          <DeleteBtn onClick={() => update("overview.stays", overview.stays.filter(x => x.id !== s.id))} />
        </div>;
      })}
    </div>

    <div>
      <div style={sectionHeaderStyle}><span>Key Deadlines</span><AddBtn label="Task" onClick={() => update("overview.deadlines", [...overview.deadlines, { id: uid(), text: "", date: "", done: false }])} /></div>
      {overview.deadlines.map((d, i) => (
        <div key={d.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
          <input type="checkbox" checked={d.done} onChange={() => { const a = [...overview.deadlines]; a[i] = { ...d, done: !d.done }; update("overview.deadlines", a); }} style={{ accentColor: "var(--accent)", marginTop: 1 }} />
          <Editable value={d.text} onChange={v => { const a = [...overview.deadlines]; a[i] = { ...d, text: v }; update("overview.deadlines", a); }} placeholder="Task" style={{ flex: 1, opacity: d.done ? 0.35 : 1, textDecoration: d.done ? "line-through" : "none" }} />
          <input type="date" value={d.date} onChange={e => { const a = [...overview.deadlines]; a[i] = { ...d, date: e.target.value }; update("overview.deadlines", a); }} style={{ ...selectStyle, fontSize: 12 }} />
          <DeleteBtn onClick={() => update("overview.deadlines", overview.deadlines.filter(x => x.id !== d.id))} />
        </div>
      ))}
    </div>
  </div>;
}
