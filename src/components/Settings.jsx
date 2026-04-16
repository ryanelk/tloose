import { useState, useRef, useEffect } from "react";
import { FONTS, DEFAULT_DATA } from "../data/defaults.js";

export function ThemeSlider({ value, onChange }) {
  const opts = ["light", "system", "dark"];
  const idx = opts.indexOf(value);
  const labels = ["☀︎", "Auto", "☽"];
  return (
    <div style={{ display: "flex", alignItems: "center", background: "var(--pill-track)", borderRadius: 8, padding: 2, position: "relative" }}>
      <div style={{
        position: "absolute", left: `calc(${idx * 33.33}% + 2px)`, top: 2, bottom: 2,
        width: "calc(33.33% - 2px)", background: "var(--pill-active-bg)", borderRadius: 6,
        transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)", zIndex: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }} />
      {opts.map((o, i) => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding: "4px 14px", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          border: "none", borderRadius: 6, cursor: "pointer", background: "transparent",
          color: value === o ? "var(--pill-active-fg)" : "var(--muted)", position: "relative", zIndex: 1,
          minWidth: 44, transition: "color 0.15s",
        }}>{labels[i]}</button>
      ))}
    </div>
  );
}

export function SettingsMenu({ data, setData, onDisconnect, onDownload, onClone, onDelete, guestMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        background: open ? "var(--pill-track)" : "transparent", border: "none", borderRadius: 6,
        padding: "6px 8px", cursor: "pointer", color: "var(--muted)", fontSize: 17, lineHeight: 1, transition: "all 0.15s",
      }} title="Settings">⚙</button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", background: "var(--card-bg)",
          border: "1px solid var(--border)", borderRadius: 12, padding: 16, minWidth: 220,
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)", zIndex: 100,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Typeface</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 16 }}>
            {FONTS.map(f => (
              <button key={f.id} onClick={() => setData(d => ({ ...d, font: f.id }))} style={{
                padding: "7px 10px", background: data.font === f.id ? "var(--accent-dim)" : "transparent",
                color: data.font === f.id ? "var(--accent)" : "var(--fg)",
                border: "none", borderRadius: 6, cursor: "pointer", textAlign: "left",
                fontFamily: f.stack, fontSize: 15, fontWeight: data.font === f.id ? 600 : 400, transition: "all 0.1s",
              }}>{f.name}</button>
            ))}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => { onClone(); setOpen(false); }} style={{
              width: "100%", padding: "8px 0", background: "none", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--fg)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>⧉ Clone Trip</button>
            <button onClick={() => { onDownload(); setOpen(false); }} style={{
              width: "100%", padding: "8px 0", background: "none", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--fg)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>Download Backup</button>
            <button onClick={() => {
              if (confirm("Reset all data to sample template?")) { setData(JSON.parse(JSON.stringify(DEFAULT_DATA))); }
              setOpen(false);
            }} style={{
              width: "100%", padding: "8px 0", background: "none", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--red-text)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>Reset to Template</button>
            <button onClick={() => { onDelete(); setOpen(false); }} style={{
              width: "100%", padding: "8px 0", background: "none", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--red-text)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>✕ Delete Trip</button>
            <button onClick={() => {
              const msg = guestMode ? "Return to the welcome screen? Your local data will be kept." : "Disconnect from GitHub Gist? Your local data won't be deleted.";
              if (confirm(msg)) { onDisconnect(); }
              setOpen(false);
            }} style={{
              width: "100%", padding: "8px 0", background: "none", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--muted)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>{guestMode ? "Switch to GitHub Sync" : "Disconnect Gist"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
