import { useState, useRef, useEffect } from "react";
import { locationOptions, getLocationName } from "../utils/helpers.js";
import { selectStyle } from "../data/defaults.js";

export function PillSelect({ value, options, onChange, size = "sm" }) {
  const pad = size === "xs" ? "2px 7px" : "3px 10px";
  const fs = size === "xs" ? 10 : 11;
  return (
    <div style={{ display: "inline-flex", gap: 2, background: "var(--pill-track)", borderRadius: 6, padding: 2 }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          padding: pad, fontSize: fs, fontWeight: 600, fontFamily: "inherit",
          border: "none", borderRadius: 5, cursor: "pointer", transition: "all 0.15s",
          background: value === o.value ? "var(--pill-active-bg)" : "transparent",
          color: value === o.value ? "var(--pill-active-fg)" : "var(--muted)",
          letterSpacing: 0.2,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

export function Editable({ value, onChange, placeholder, style, type = "text" }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
    background: "transparent", border: "none", borderBottom: "1.5px solid transparent",
    padding: "4px 0", color: "var(--fg)", fontSize: 13, fontFamily: "inherit", width: "100%",
    boxSizing: "border-box", outline: "none", transition: "border-color 0.15s", ...style,
  }} onFocus={e => e.target.style.borderBottomColor = "var(--accent)"}
     onBlur={e => e.target.style.borderBottomColor = "transparent"} />;
}

export function DeleteBtn({ onClick }) {
  return <button onClick={onClick} style={{ background: "none", border: "none", color: "var(--red-text)", cursor: "pointer", padding: "2px 4px", fontSize: 14, lineHeight: 1, opacity: 0.45, transition: "opacity 0.1s" }} onMouseEnter={e => e.target.style.opacity = 1} onMouseLeave={e => e.target.style.opacity = 0.45}>×</button>;
}

export function AddBtn({ onClick, label }) {
  return <button onClick={onClick} style={{
    background: "none", color: "var(--accent)", border: "1px dashed var(--border)",
    borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "inherit", transition: "all 0.15s", letterSpacing: 0.2,
  }} onMouseEnter={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.background = "var(--accent-dim)"; }}
     onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "none"; }}>+ {label}</button>;
}

export function Badge({ bg, text, label }) {
  return <span style={{ background: bg, color: text, padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>;
}

export function LocationSelect({ value, locations, onChange, style }) {
  const opts = locationOptions(locations);
  return <select value={value || ""} onChange={e => onChange(e.target.value)} style={{ ...selectStyle, ...style }}>
    <option value="">— Location —</option>
    {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}

export function PriceSlider({ value, onChange }) {
  const level = value || 1;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
    {[1,2,3,4].map(n => (
      <button key={n} onClick={() => onChange(n)} style={{
        background: "none", border: "none", cursor: "pointer", padding: "2px 1px",
        fontSize: 13, color: n <= level ? "var(--fg)" : "var(--border)",
        fontWeight: n <= level ? 700 : 400, transition: "color 0.1s", fontFamily: "inherit",
      }}>$</button>
    ))}
  </div>;
}

export function TagToggle({ tags, onChange }) {
  const t = tags || [];
  const toggle = (tag) => {
    if (t.includes(tag)) onChange(t.filter(x => x !== tag));
    else onChange([...t, tag]);
  };
  return <div style={{ display: "inline-flex", gap: 3 }}>
    <button onClick={() => toggle("food")} style={{
      background: t.includes("food") ? "var(--amber-bg)" : "var(--pill-track)",
      color: t.includes("food") ? "var(--amber-text)" : "var(--muted)",
      border: "none", borderRadius: 10, padding: "2px 6px", fontSize: 12, cursor: "pointer", transition: "all 0.1s",
    }} title="Food">🍽</button>
    <button onClick={() => toggle("drinks")} style={{
      background: t.includes("drinks") ? "var(--green-bg)" : "var(--pill-track)",
      color: t.includes("drinks") ? "var(--green-text)" : "var(--muted)",
      border: "none", borderRadius: 10, padding: "2px 6px", fontSize: 12, cursor: "pointer", transition: "all 0.1s",
    }} title="Drinks">🍹</button>
  </div>;
}

export function MultiLocationSelect({ value, locations, onChange }) {
  const opts = locationOptions(locations);
  const selected = value || [];
  const addLoc = (locId) => { if (locId && !selected.includes(locId)) onChange([...selected, locId]); };
  const rmLoc = (locId) => onChange(selected.filter(id => id !== locId));
  return <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
    {selected.map(id => (
      <span key={id} style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "var(--pill-track)", borderRadius: 10, padding: "1px 4px 1px 8px", fontSize: 11, color: "var(--fg)" }}>
        {getLocationName(locations, id)}
        <button onClick={() => rmLoc(id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, padding: "0 2px", lineHeight: 1 }}>×</button>
      </span>
    ))}
    <select value="" onChange={e => addLoc(e.target.value)} style={{ ...selectStyle, fontSize: 11, width: selected.length > 0 ? 30 : 140, padding: "2px 4px", opacity: selected.length > 0 ? 0.5 : 1 }}>
      <option value="">{selected.length > 0 ? "+" : "— Locations —"}</option>
      {opts.filter(o => !selected.includes(o.value)).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>;
}

export function ItemSearchSelect({ value, food, activities, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const allItems = [
    ...(food || []).map(i => ({ ...i, _type: "food" })),
    ...(activities || []).map(i => ({ ...i, _type: "activity" })),
  ];
  const linked = value ? allItems.find(i => i.id === value) : null;
  const filtered = query.length > 0 ? allItems.filter(i => i.name.toLowerCase().includes(query.toLowerCase())) : allItems;

  if (linked) {
    return <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 12 }}>{linked._type === "food" ? "🍽" : "📍"}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{linked.name}</span>
      <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 11, padding: "0 4px" }}>×</button>
    </div>;
  }

  return <div ref={ref} style={{ position: "relative", flex: 1 }}>
    <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
      placeholder="Search food / activity…" style={{
        background: "transparent", border: "none", borderBottom: "1.5px solid transparent",
        padding: "4px 0", color: "var(--fg)", fontSize: 12, fontFamily: "inherit", width: "100%",
        boxSizing: "border-box", outline: "none",
      }} onFocusCapture={e => e.target.style.borderBottomColor = "var(--accent)"} onBlurCapture={e => e.target.style.borderBottomColor = "transparent"} />
    {open && filtered.length > 0 && (
      <div style={{
        position: "absolute", top: "100%", left: 0, right: 0, background: "var(--card-bg)",
        border: "1px solid var(--border)", borderRadius: 8, maxHeight: 180, overflowY: "auto",
        zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
      }}>
        {filtered.slice(0, 15).map(item => (
          <button key={item.id} onClick={() => { onChange(item.id); setQuery(""); setOpen(false); }} style={{
            display: "flex", gap: 6, alignItems: "center", width: "100%", padding: "6px 10px",
            background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
            fontSize: 12, color: "var(--fg)", fontFamily: "inherit",
          }} onMouseEnter={e => e.target.style.background = "var(--pill-track)"} onMouseLeave={e => e.target.style.background = "transparent"}>
            <span>{item._type === "food" ? "🍽" : "📍"}</span>
            <span style={{ fontWeight: 500 }}>{item.name}</span>
            <span style={{ color: "var(--muted)", fontSize: 11 }}>{"$".repeat(item.priceLevel || 1)}</span>
          </button>
        ))}
      </div>
    )}
  </div>;
}

export function ReorderBtns({ index, total, onMove }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 0, flexShrink: 0 }}>
    <button onClick={() => onMove(index, index - 1)} disabled={index === 0} style={{
      background: "none", border: "none", color: index === 0 ? "var(--border)" : "var(--muted)", cursor: index === 0 ? "default" : "pointer",
      fontSize: 10, padding: 0, lineHeight: 1,
    }}>▲</button>
    <button onClick={() => onMove(index, index + 1)} disabled={index >= total - 1} style={{
      background: "none", border: "none", color: index >= total - 1 ? "var(--border)" : "var(--muted)", cursor: index >= total - 1 ? "default" : "pointer",
      fontSize: 10, padding: 0, lineHeight: 1,
    }}>▼</button>
  </div>;
}
