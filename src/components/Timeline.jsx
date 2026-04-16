import { useRef, useState, useMemo } from "react";
import { Editable, DeleteBtn, AddBtn, Badge, MultiLocationSelect, ItemSearchSelect } from "./shared.jsx";
import { getDerivedEvents, locationOptions, uid } from "../utils/helpers.js";
import { EVENT_TYPES, SOURCE_ICONS, SOURCE_COLORS } from "../data/defaults.js";

const SPLIT_PANELS = [
  { id: "overview",    label: "Overview" },
  { id: "food",        label: "Food" },
  { id: "activities",  label: "Activities" },
];

const SOURCE_TO_PANEL = { transport: "overview", food: "food", activity: "activities" };

export default function TimelineTab({ data, setData, onOpenSplit, splitPanel }) {
  const { timeline, locations, food, activities } = data;
  const set = (tl) => setData(d => ({ ...d, timeline: tl }));
  const dragRef = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const [filterLocId, setFilterLocId] = useState("");

  const handleDerivedClick = (source) => {
    if (!onOpenSplit) return;
    const panel = SOURCE_TO_PANEL[source];
    if (panel) onOpenSplit(p => p === panel ? null : panel);
  };

  const handleLinkedItemClick = (itemId) => {
    if (!onOpenSplit || !itemId) return;
    const isFoodItem = food.some(f => f.id === itemId);
    onOpenSplit(p => {
      const panel = isFoodItem ? "food" : "activities";
      return p === panel ? null : panel;
    });
  };

  const moveEvent = (dayId, fromIdx, toIdx) => {
    if (toIdx < 0) return;
    set(timeline.map(d => {
      if (d.id !== dayId) return d;
      const evs = [...d.events];
      if (toIdx >= evs.length) return d;
      const [item] = evs.splice(fromIdx, 1);
      evs.splice(toIdx, 0, item);
      return { ...d, events: evs };
    }));
  };

  // Expand parent location to include sublocations
  const matchingLocIds = useMemo(() => {
    if (!filterLocId) return null;
    const loc = locations.find(l => l.id === filterLocId);
    return loc ? [filterLocId, ...(loc.sublocations || []).map(s => s.id)] : [filterLocId];
  }, [filterLocId, locations]);

  const visibleTimeline = useMemo(() => {
    if (!matchingLocIds) return timeline;
    return timeline.filter(day =>
      (day.locationIds || []).some(id => matchingLocIds.includes(id))
    );
  }, [timeline, matchingLocIds]);

  // Location pills — only locations used in timeline
  const usedLocIds = new Set(timeline.flatMap(d => d.locationIds || []));
  const locOpts = locationOptions(locations).filter(o => usedLocIds.has(o.value));

  const pillStyle = (active) => ({
    padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: 10,
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)", transition: "all 0.1s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Split panel quick-access + location filter */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {onOpenSplit && (
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginRight: 4 }}>
            {SPLIT_PANELS.map(p => {
              const active = splitPanel === p.id;
              return (
                <button key={p.id} onClick={() => onOpenSplit(cur => cur === p.id ? null : p.id)} style={{
                  padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  border: active ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: 10,
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "var(--accent)" : "var(--muted)", transition: "all 0.1s",
                }}>{p.label}</button>
              );
            })}
            {locOpts.length > 0 && <div style={{ width: 1, height: 14, background: "var(--border)", margin: "0 2px" }} />}
          </div>
        )}
        {locOpts.length > 0 && (
          <>
            <button style={pillStyle(!filterLocId)} onClick={() => setFilterLocId("")}>All</button>
            {locOpts.map(o => (
              <button key={o.value} style={pillStyle(filterLocId === o.value)} onClick={() => setFilterLocId(filterLocId === o.value ? "" : o.value)}>
                {o.label}
              </button>
            ))}
          </>
        )}
      </div>

      {visibleTimeline.map(day => {
        const derived = getDerivedEvents(day.date, data);
        const allEmpty = derived.length === 0 && day.events.length === 0;
        return <div key={day.id}>
          <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{day.label}</span>
            <Editable value={day.subtitle || ""} onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, subtitle: v } : d))} placeholder="Theme (e.g. Museum Day)" style={{ width: 200, fontSize: 13, color: "var(--muted)", fontStyle: "italic" }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{day.date}</span>
            <div style={{ flex: 1 }} />
          </div>
          <div style={{ marginBottom: 8, paddingLeft: 2 }}>
            <MultiLocationSelect value={day.locationIds || []} locations={locations} onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, locationIds: v } : d))} />
          </div>

          <div style={{ borderLeft: "2px solid var(--border)", marginLeft: 8, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
            {derived.map(ev => (
              <div key={ev.id} style={{ display: "flex", gap: 8, alignItems: "center", opacity: 0.85, padding: "2px 0" }}>
                <span style={{ fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{SOURCE_ICONS[ev.source] || "•"}</span>
                <span style={{ width: 65, fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{ev.time}</span>
                {onOpenSplit ? (
                  <button onClick={() => handleDerivedClick(ev.source)} style={{
                    background: "none", border: "none", padding: 0, cursor: "pointer",
                    fontSize: 13, color: SOURCE_COLORS[ev.source] || "var(--fg)", fontWeight: 500,
                    fontFamily: "inherit", textAlign: "left",
                    textDecoration: splitPanel === SOURCE_TO_PANEL[ev.source] ? "underline" : "none",
                    textDecorationColor: "var(--border)",
                  }}>{ev.text}</button>
                ) : (
                  <span style={{ fontSize: 13, color: SOURCE_COLORS[ev.source] || "var(--fg)", fontWeight: 500 }}>{ev.text}</span>
                )}
                <Badge bg="var(--slate-bg)" text="var(--slate-text)" label={ev.source} />
              </div>
            ))}

            {derived.length > 0 && day.events.length > 0 && (
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "3px 0" }} />
            )}

            {day.events.map((ev, idx) => {
              const et = EVENT_TYPES[ev.type] || EVENT_TYPES.potential;
              const isTarget = dragOver?.dayId === day.id && dragOver?.idx === idx;
              return <div
                key={ev.id}
                draggable
                onDragStart={() => { dragRef.current = { dayId: day.id, fromIdx: idx }; }}
                onDragOver={e => { e.preventDefault(); setDragOver({ dayId: day.id, idx }); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => {
                  e.preventDefault();
                  if (dragRef.current?.dayId === day.id) moveEvent(day.id, dragRef.current.fromIdx, idx);
                  dragRef.current = null;
                  setDragOver(null);
                }}
                onDragEnd={() => { dragRef.current = null; setDragOver(null); }}
                style={{
                  display: "flex", gap: 6, alignItems: "center", padding: "2px 0", flexWrap: "wrap",
                  borderTop: isTarget ? "2px solid var(--accent)" : "2px solid transparent",
                  borderRadius: 4, cursor: "default",
                }}
              >
                <span style={{ cursor: "grab", color: "var(--muted)", fontSize: 13, flexShrink: 0, padding: "0 1px", lineHeight: 1, opacity: 0.5, userSelect: "none" }}>⠿</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: et.text, flexShrink: 0 }} />
                <Editable value={ev.text} onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, events: d.events.map(e => e.id === ev.id ? { ...e, text: v } : e) } : d))} placeholder="Event name" style={{ minWidth: 120, flex: "1 1 140px", fontSize: 13 }} />
                <div style={{ flex: "1 1 200px", minWidth: 150 }}>
                  <ItemSearchSelect value={ev.linkedItemId || ""} food={food} activities={activities}
                    onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, events: d.events.map(e => e.id === ev.id ? { ...e, linkedItemId: v } : e) } : d))}
                    onInspect={onOpenSplit ? handleLinkedItemClick : null} />
                </div>
                <DeleteBtn onClick={() => set(timeline.map(d => d.id === day.id ? { ...d, events: d.events.filter(e => e.id !== ev.id) } : d))} />
              </div>;
            })}

            {allEmpty && <div style={{ fontSize: 12, color: "var(--muted)", padding: "4px 0", fontStyle: "italic" }}>No events yet</div>}
          </div>
          <div style={{ marginTop: 5, paddingLeft: 26 }}>
            <AddBtn label="Event" onClick={() => set(timeline.map(d => d.id === day.id ? { ...d, events: [...d.events, { id: uid(), text: "", linkedItemId: "", type: "potential" }] } : d))} />
          </div>
        </div>;
      })}
    </div>
  );
}
