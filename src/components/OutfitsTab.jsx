import { useState, useMemo, useEffect } from "react";
import { Editable, DeleteBtn, AddBtn } from "./shared.jsx";
import { uid } from "../utils/helpers.js";

const OUTFIT_TAGS = [
  { key: "casual",    label: "Casual",    activeBg: "var(--slate-bg)",   activeColor: "var(--slate-text)" },
  { key: "formal",    label: "Formal",    activeBg: "var(--accent-dim)", activeColor: "var(--accent)"     },
  { key: "outdoor",   label: "Outdoor",   activeBg: "var(--green-bg)",   activeColor: "var(--green-text)" },
  { key: "night-out", label: "Night Out", activeBg: "var(--red-bg)",     activeColor: "var(--red-text)"   },
  { key: "active",    label: "Active",    activeBg: "var(--amber-bg)",   activeColor: "var(--amber-text)" },
  { key: "beach",     label: "Beach",     activeBg: "var(--green-bg)",   activeColor: "var(--green-text)" },
];

function OutfitTagToggle({ tags, onChange }) {
  const t = tags || [];
  const toggle = (key) => t.includes(key) ? onChange(t.filter(x => x !== key)) : onChange([...t, key]);
  return (
    <div style={{ display: "inline-flex", gap: 3, flexWrap: "wrap" }}>
      {OUTFIT_TAGS.map(({ key, label, activeBg, activeColor }) => {
        const on = t.includes(key);
        return (
          <button key={key} onClick={() => toggle(key)} style={{
            background: on ? activeBg : "var(--pill-track)",
            color: on ? activeColor : "var(--muted)",
            border: on ? `1.5px solid ${activeColor}` : "1.5px solid transparent",
            borderRadius: 10, padding: "2px 8px", fontSize: 11, cursor: "pointer",
            fontWeight: on ? 600 : 400, fontFamily: "inherit", transition: "all 0.1s",
          }}>{label}</button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{children}</div>;
}

function NewOutfitDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState([]);
  const [vibe, setVibe] = useState("");
  const [notes, setNotes] = useState("");

  const inputStyle = {
    border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px",
    fontSize: 13, fontFamily: "inherit", color: "var(--fg)", background: "var(--bg)",
    outline: "none", transition: "border-color 0.15s", width: "100%", boxSizing: "border-box",
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), tags, vibe: vibe.trim(), notes: notes.trim() });
  };

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "var(--fg)" }}>New Outfit</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <FieldLabel>Name</FieldLabel>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
              placeholder="e.g. Museum Day, Date Night, Beach Afternoon"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div>
            <FieldLabel>Vibe</FieldLabel>
            <OutfitTagToggle tags={tags} onChange={setTags} />
          </div>

          <div>
            <FieldLabel>Description</FieldLabel>
            <input value={vibe} onChange={e => setVibe(e.target.value)}
              placeholder="What you're wearing, what it suits…"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div>
            <FieldLabel>Notes</FieldLabel>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Packing reminder, inspiration link…"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onCancel} style={{
              flex: 1, padding: "9px 0", background: "none", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: "var(--muted)",
            }}>Cancel</button>
            <button type="submit" disabled={!name.trim()} style={{
              flex: 1, padding: "9px 0", background: "var(--accent)", border: "none",
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: name.trim() ? "pointer" : "default",
              fontFamily: "inherit", color: "#fff", opacity: name.trim() ? 1 : 0.45, transition: "opacity 0.15s",
            }}>Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OutfitsTab({ items, setItems }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id, f, v) => setItems(items.map(i => i.id === id ? { ...i, [f]: v } : i));

  const handleAdd = ({ name, tags, vibe, notes }) => {
    setItems([{ id: uid(), name, tags, vibe, notes }, ...items]);
    setShowDialog(false);
  };

  const filteredItems = useMemo(() => items.filter(item => {
    if (filterTag && !(item.tags || []).includes(filterTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (item.name || "").toLowerCase().includes(q)
        || (item.vibe || "").toLowerCase().includes(q)
        || (item.notes || "").toLowerCase().includes(q);
    }
    return true;
  }), [items, filterTag, searchQuery]);

  // Only show tags that are used in at least one outfit
  const usedTags = useMemo(() => {
    const used = new Set(items.flatMap(i => i.tags || []));
    return OUTFIT_TAGS.filter(t => used.has(t.key));
  }, [items]);

  const pillStyle = (active) => ({
    padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: 10,
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)", transition: "all 0.1s",
  });

  return (
    <>
      {showDialog && <NewOutfitDialog onConfirm={handleAdd} onCancel={() => setShowDialog(false)} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)", pointerEvents: "none" }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search outfits…"
                style={{
                  width: "100%", boxSizing: "border-box", paddingLeft: 28, paddingRight: searchQuery ? 28 : 10,
                  paddingTop: 5, paddingBottom: 5, border: "1px solid var(--border)", borderRadius: 8,
                  background: "var(--bg)", color: "var(--fg)", fontSize: 12, fontFamily: "inherit", outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)", padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>
            <div style={{ flex: 1 }} />
            <AddBtn label="Outfit" onClick={() => setShowDialog(true)} />
          </div>

          {/* Tag filter pills */}
          {usedTags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              <button style={pillStyle(!filterTag)} onClick={() => setFilterTag("")}>All</button>
              {usedTags.map(t => (
                <button key={t.key} style={pillStyle(filterTag === t.key)} onClick={() => setFilterTag(filterTag === t.key ? "" : t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {(searchQuery || filterTag) && filteredItems.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
              No results —{" "}
              <button onClick={() => { setSearchQuery(""); setFilterTag(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 12, padding: 0, fontFamily: "inherit" }}>
                clear filters
              </button>
            </span>
          )}
        </div>

        {/* Outfit list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filteredItems.map(item => (
            <div key={item.id} style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
              {/* Row 1: name + tags + delete */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15 }}>👗</span>
                <Editable value={item.name} onChange={v => updateItem(item.id, "name", v)} placeholder="Outfit name" style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 150 }} />
                <OutfitTagToggle tags={item.tags} onChange={v => updateItem(item.id, "tags", v)} />
                <DeleteBtn onClick={() => removeItem(item.id)} />
              </div>
              {/* Row 2: description + notes */}
              <Editable value={item.vibe || ""} onChange={v => updateItem(item.id, "vibe", v)} placeholder="What you're wearing, what it suits…" style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginBottom: 6 }} />
              <Editable value={item.notes || ""} onChange={v => updateItem(item.id, "notes", v)} placeholder="Notes, inspiration link…" style={{ fontSize: 12, color: "var(--muted)" }} />
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>👗</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No outfits yet</div>
            <div style={{ fontSize: 12 }}>Add outfits here, then assign them to days in the Timeline.</div>
          </div>
        )}
      </div>
    </>
  );
}
