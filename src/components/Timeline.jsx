import { useRef, useState } from "react";
import { Editable, DeleteBtn, AddBtn, Badge, PillSelect, MultiLocationSelect, ItemSearchSelect } from "./shared.jsx";
import { getDerivedEvents, uid } from "../utils/helpers.js";
import { EVENT_TYPES, EVENT_TYPE_OPTIONS, SOURCE_ICONS, SOURCE_COLORS } from "../data/defaults.js";

export default function TimelineTab({ data, setData }) {
  const { timeline, locations, food, activities } = data;
  const set = (tl) => setData(d => ({ ...d, timeline: tl }));
  const dragRef = useRef(null); // { dayId, fromIdx }
  const [dragOver, setDragOver] = useState(null); // { dayId, idx }

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

  return <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
    {timeline.map(day => {
      const derived = getDerivedEvents(day.date, data);
      const allEmpty = derived.length === 0 && day.events.length === 0;
      return <div key={day.id}>
        {/* Day header */}
        <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{day.label}</span>
          <Editable value={day.subtitle || ""} onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, subtitle: v } : d))} placeholder="Theme (e.g. Museum Day)" style={{ width: 200, fontSize: 13, color: "var(--muted)", fontStyle: "italic" }} />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{day.date}</span>
          <div style={{ flex: 1 }} />
        </div>
        {/* Location chips */}
        <div style={{ marginBottom: 8, paddingLeft: 2 }}>
          <MultiLocationSelect value={day.locationIds || []} locations={locations} onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, locationIds: v } : d))} />
        </div>

        <div style={{ borderLeft: "2px solid var(--border)", marginLeft: 8, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 5 }}>
          {/* Derived events (read-only, with times) */}
          {derived.map(ev => (
            <div key={ev.id} style={{ display: "flex", gap: 8, alignItems: "center", opacity: 0.85, padding: "2px 0" }}>
              <span style={{ fontSize: 12, width: 16, textAlign: "center", flexShrink: 0 }}>{SOURCE_ICONS[ev.source] || "•"}</span>
              <span style={{ width: 65, fontSize: 11, color: "var(--muted)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{ev.time}</span>
              <span style={{ fontSize: 13, color: SOURCE_COLORS[ev.source] || "var(--fg)", fontWeight: 500 }}>{ev.text}</span>
              <Badge bg="var(--slate-bg)" text="var(--slate-text)" label={ev.source} />
            </div>
          ))}

          {derived.length > 0 && day.events.length > 0 && (
            <div style={{ height: 1, background: "var(--border-subtle)", margin: "3px 0" }} />
          )}

          {/* Freeform events (reorderable via drag, with item search, no time field) */}
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
                  onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, events: d.events.map(e => e.id === ev.id ? { ...e, linkedItemId: v } : e) } : d))} />
              </div>
              <PillSelect value={ev.type} options={EVENT_TYPE_OPTIONS} onChange={v => set(timeline.map(d => d.id === day.id ? { ...d, events: d.events.map(e => e.id === ev.id ? { ...e, type: v } : e) } : d))} size="xs" />
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
  </div>;
}
