import { useState, useMemo, useEffect } from "react";
import { Editable, DeleteBtn, AddBtn, LocationSelect } from "./shared.jsx";
import { getLocationName, locationOptions, uid } from "../utils/helpers.js";
import { selectStyle } from "../data/defaults.js";

function FieldLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{children}</div>;
}

function TypeToggle({ value, onChange }) {
  const opts = [{ v: "hotel", label: "Hotel" }, { v: "airbnb", label: "Airbnb" }];
  return (
    <div style={{ display: "inline-flex", gap: 3 }}>
      {opts.map(({ v, label }) => {
        const on = value === v;
        return (
          <button key={v} onClick={() => onChange(on ? "" : v)} style={{
            background: on ? "var(--accent-dim)" : "var(--pill-track)",
            color: on ? "var(--accent)" : "var(--muted)",
            border: on ? "1.5px solid var(--accent)" : "1.5px solid transparent",
            borderRadius: 10, padding: "2px 9px", fontSize: 11, cursor: "pointer",
            fontWeight: on ? 600 : 400, fontFamily: "inherit", transition: "all 0.1s",
          }}>{label}</button>
        );
      })}
    </div>
  );
}

function PricePerDay({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <span style={{ fontSize: 12, color: "var(--muted)" }}>$</span>
      <input
        type="number"
        value={value || ""}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        min={0}
        style={{
          width: 64, background: "transparent", border: "none",
          borderBottom: "1.5px solid transparent", padding: "4px 0", fontSize: 13,
          color: "var(--fg)", fontFamily: "inherit", outline: "none", textAlign: "right",
          MozAppearance: "textfield",
        }}
        onFocus={e => e.target.style.borderBottomColor = "var(--accent)"}
        onBlur={e => e.target.style.borderBottomColor = "transparent"}
      />
      <span style={{ fontSize: 11, color: "var(--muted)" }}>/night</span>
    </div>
  );
}

function NewStayDialog({ locations, onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [type, setType] = useState("");
  const [pricePerDay, setPricePerDay] = useState(0);
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
    onConfirm({ name: name.trim(), locationId, type, pricePerDay, vibe: vibe.trim(), notes: notes.trim() });
  };

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "var(--fg)" }}>New Stay Option</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <FieldLabel>Name</FieldLabel>
            <input autoFocus value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
              placeholder="Hotel name or Airbnb listing"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Location</FieldLabel>
              <LocationSelect value={locationId} locations={locations} onChange={setLocationId} style={{ width: "100%", padding: "8px 12px", fontSize: 13 }} />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <div style={{ paddingTop: 6 }}>
                <TypeToggle value={type} onChange={setType} />
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Price per night</FieldLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>$</span>
              <input
                type="number" value={pricePerDay || ""} onChange={e => setPricePerDay(parseFloat(e.target.value) || 0)}
                placeholder="0" min={0}
                style={{ ...inputStyle, width: 100 }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>/ night</span>
            </div>
          </div>

          <div>
            <FieldLabel>Vibe / description</FieldLabel>
            <input value={vibe} onChange={e => setVibe(e.target.value)} placeholder="e.g. boutique hotel, city views, quiet street…"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div>
            <FieldLabel>Notes / booking link</FieldLabel>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="URL, confirmation #, etc."
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

export default function StaysTab({ items, setItems, locations, initialSearch = "", initialLocFilter = "" }) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [filterLocId, setFilterLocId] = useState(initialLocFilter);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => { setSearchQuery(initialSearch); }, [initialSearch]);
  useEffect(() => { setFilterLocId(initialLocFilter); }, [initialLocFilter]);

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id, f, v) => setItems(items.map(i => i.id === id ? { ...i, [f]: v } : i));

  const handleAdd = ({ name, locationId, type, pricePerDay, vibe, notes }) => {
    setItems([{ id: uid(), name, locationId, type, pricePerDay, vibe, notes }, ...items]);
    setShowDialog(false);
  };

  const matchingLocIds = useMemo(() => {
    if (!filterLocId) return null;
    const loc = locations.find(l => l.id === filterLocId);
    return loc ? [filterLocId, ...(loc.sublocations || []).map(s => s.id)] : [filterLocId];
  }, [filterLocId, locations]);

  const filteredItems = useMemo(() => items.filter(item => {
    if (matchingLocIds && !matchingLocIds.includes(item.locationId || "")) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (item.name || "").toLowerCase().includes(q)
        || (item.vibe || "").toLowerCase().includes(q)
        || (item.notes || "").toLowerCase().includes(q);
    }
    return true;
  }), [items, matchingLocIds, searchQuery]);

  const grouped = {};
  filteredItems.forEach(item => {
    const key = item.locationId || "_unassigned";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "_unassigned") return 1; if (b === "_unassigned") return -1;
    return getLocationName(locations, a).localeCompare(getLocationName(locations, b));
  });

  const locOpts = locationOptions(locations).filter(o => items.some(i => i.locationId === o.value));

  const pillStyle = (active) => ({
    padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: 10,
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)", transition: "all 0.1s",
  });

  return (
    <>
      {showDialog && <NewStayDialog locations={locations} onConfirm={handleAdd} onCancel={() => setShowDialog(false)} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)", pointerEvents: "none" }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search stays…"
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
            <AddBtn label="Stay" onClick={() => setShowDialog(true)} />
          </div>

          {locOpts.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              <button style={pillStyle(!filterLocId)} onClick={() => setFilterLocId("")}>All</button>
              {locOpts.map(o => (
                <button key={o.value} style={pillStyle(filterLocId === o.value)} onClick={() => setFilterLocId(filterLocId === o.value ? "" : o.value)}>
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {(searchQuery || filterLocId) && filteredItems.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
              No results —{" "}
              <button onClick={() => { setSearchQuery(""); setFilterLocId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 12, padding: 0, fontFamily: "inherit" }}>
                clear filters
              </button>
            </span>
          )}
        </div>

        {/* Item groups */}
        {sortedKeys.map(locKey => {
          const displayName = locKey === "_unassigned" ? "Unassigned" : getLocationName(locations, locKey);
          return (
            <div key={locKey}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.2 }}>{displayName}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{grouped[locKey].length} option{grouped[locKey].length !== 1 ? "s" : ""}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {grouped[locKey].map(item => (
                  <div key={item.id} style={{ paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
                    {/* Row 1: name + type + price + delete */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                      <Editable value={item.name} onChange={v => updateItem(item.id, "name", v)} placeholder="Stay name" style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 150 }} />
                      <TypeToggle value={item.type} onChange={v => updateItem(item.id, "type", v)} />
                      <PricePerDay value={item.pricePerDay} onChange={v => updateItem(item.id, "pricePerDay", v)} />
                      <DeleteBtn onClick={() => removeItem(item.id)} />
                    </div>
                    {/* Row 2: vibe */}
                    <Editable value={item.vibe || ""} onChange={v => updateItem(item.id, "vibe", v)} placeholder="Vibe / description" style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginBottom: 8 }} />
                    {/* Row 3: location + notes */}
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <LocationSelect value={item.locationId} locations={locations} onChange={v => updateItem(item.id, "locationId", v)} style={{ width: 200 }} />
                      <Editable value={item.notes || ""} onChange={v => updateItem(item.id, "notes", v)} placeholder="Notes / booking link" style={{ flex: 1, minWidth: 150, fontSize: 12, color: "var(--muted)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
