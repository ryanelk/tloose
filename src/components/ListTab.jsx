import { useState, useMemo } from "react";
import { Editable, DeleteBtn, AddBtn, Badge, PillSelect, LocationSelect, PriceSlider, TagToggle } from "./shared.jsx";
import { getLocationName, locationOptions, uid } from "../utils/helpers.js";
import { PRIORITY_OPTIONS, selectStyle } from "../data/defaults.js";

function NewItemDialog({ isFood, locations, onConfirm, onCancel }) {
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), locationId);
  };

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <h3 style={{ margin: "0 0 18px", fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: "var(--fg)" }}>
          New {isFood ? "Restaurant" : "Activity"}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") onCancel(); }}
            placeholder={isFood ? "Restaurant name" : "Activity name"}
            style={{
              border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px",
              fontSize: 14, fontFamily: "inherit", color: "var(--fg)",
              background: "var(--bg)", outline: "none", transition: "border-color 0.15s",
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
          <LocationSelect value={locationId} locations={locations} onChange={setLocationId} style={{ width: "100%", padding: "9px 12px", fontSize: 13 }} />
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

export default function ListTab({ items, setItems, type, locations }) {
  const isFood = type === "Restaurant";
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLocId, setFilterLocId] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id, f, v) => setItems(items.map(i => i.id === id ? { ...i, [f]: v } : i));

  const handleAdd = (name, locationId) => {
    setItems([{ id: uid(), name, locationId, priceLevel: 1, tags: isFood ? ["food"] : [], vibe: "", priority: "if-time", hasReservation: false, reservationDay: "", reservationTime: "", notes: "" }, ...items]);
    setShowDialog(false);
  };

  // Expand a parent location filter to include its sublocations
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

  // Group by location
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

  // Location pills — only locations/sublocations that have at least one item
  const locOpts = locationOptions(locations).filter(o =>
    items.some(i => {
      if (i.locationId === o.value) return true;
      const parent = locations.find(l => l.sublocations?.some(s => s.id === i.locationId));
      return parent?.id === o.value;
    })
  );

  const pillStyle = (active) => ({
    padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
    border: active ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: 10,
    background: active ? "var(--accent-dim)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)", transition: "all 0.1s",
  });

  return (
    <>
      {showDialog && <NewItemDialog isFood={isFood} locations={locations} onConfirm={handleAdd} onCancel={() => setShowDialog(false)} />}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Toolbar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
              <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)", pointerEvents: "none" }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${isFood ? "restaurants" : "activities"}…`}
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
            <AddBtn label={type} onClick={() => setShowDialog(true)} />
          </div>

          {/* Location filter pills */}
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
                <a href={`https://www.google.com/maps/search/${encodeURIComponent(displayName.replace(" → ", " "))}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>↗ Map</a>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{grouped[locKey].length} {isFood ? "restaurants" : "activities"}</span>
                <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {grouped[locKey].map(item => (
                  <div key={item.id} style={{ paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <Editable value={item.name} onChange={v => updateItem(item.id, "name", v)} placeholder={`${type} name`} style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 150 }} />
                      <a href={`https://www.google.com/maps/search/${encodeURIComponent(item.name + (locKey !== "_unassigned" ? " " + getLocationName(locations, locKey) : ""))}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none", fontWeight: 500, flexShrink: 0 }}>↗ Map</a>
                      {isFood && (
                        <a href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(item.name)}&find_loc=${encodeURIComponent(locKey !== "_unassigned" ? getLocationName(locations, locKey).replace(" → ", ", ") : "")}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: "#d32323", textDecoration: "none", fontWeight: 500, flexShrink: 0 }}>↗ Yelp</a>
                      )}
                      {item.hasReservation && <Badge bg="var(--green-bg)" text="var(--green-text)" label="Reserved" />}
                      <TagToggle tags={item.tags} onChange={v => updateItem(item.id, "tags", v)} type={isFood ? "food" : "activity"} />
                      <PriceSlider value={item.priceLevel} onChange={v => updateItem(item.id, "priceLevel", v)} />
                      <PillSelect value={item.priority} options={PRIORITY_OPTIONS} onChange={v => updateItem(item.id, "priority", v)} size="xs" />
                      <DeleteBtn onClick={() => removeItem(item.id)} />
                    </div>
                    <Editable value={item.vibe} onChange={v => updateItem(item.id, "vibe", v)} placeholder="Vibe / what to expect" style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginBottom: 6 }} />
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <LocationSelect value={item.locationId} locations={locations} onChange={v => updateItem(item.id, "locationId", v)} style={{ width: 200 }} />
                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)", cursor: "pointer", userSelect: "none", flexShrink: 0 }}>
                        <input type="checkbox" checked={item.hasReservation} onChange={() => updateItem(item.id, "hasReservation", !item.hasReservation)} style={{ accentColor: "var(--accent)" }} />
                        Reservation
                      </label>
                      {item.hasReservation && <>
                        <input type="date" value={item.reservationDay || ""} onChange={e => updateItem(item.id, "reservationDay", e.target.value)} style={{ ...selectStyle, fontSize: 11, width: 120 }} />
                        <Editable value={item.reservationTime || ""} onChange={v => updateItem(item.id, "reservationTime", v)} placeholder="Time" style={{ width: 80, fontSize: 12 }} />
                      </>}
                      <Editable value={item.notes} onChange={v => updateItem(item.id, "notes", v)} placeholder="Notes / links" style={{ flex: 1, minWidth: 150, fontSize: 12, color: "var(--muted)" }} />
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
