import { Editable, DeleteBtn, AddBtn, Badge, PillSelect, LocationSelect, PriceSlider, TagToggle } from "./shared.jsx";
import { getLocationName, uid } from "../utils/helpers.js";
import { PRIORITY_OPTIONS, selectStyle } from "../data/defaults.js";

export default function ListTab({ items, setItems, type, locations }) {
  const isFood = type === "Restaurant";
  const grouped = {};
  items.forEach(item => { const key = item.locationId || "_unassigned"; if (!grouped[key]) grouped[key] = []; grouped[key].push(item); });
  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "_unassigned") return 1; if (b === "_unassigned") return -1;
    return getLocationName(locations, a).localeCompare(getLocationName(locations, b));
  });
  const addItem = () => setItems([...items, { id: uid(), name: "", locationId: "", priceLevel: 1, tags: isFood ? ["food"] : [], vibe: "", priority: "if-time", hasReservation: false, reservationDay: "", reservationTime: "", notes: "" }]);
  const removeItem = (id) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id, f, v) => setItems(items.map(i => i.id === id ? { ...i, [f]: v } : i));

  return <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <AddBtn label={type} onClick={addItem} />
    </div>
    {sortedKeys.map(locKey => {
      const displayName = locKey === "_unassigned" ? "Unassigned" : getLocationName(locations, locKey);
      return <div key={locKey}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1.2 }}>{displayName}</span>
          <a href={`https://www.google.com/maps/search/${encodeURIComponent(displayName.replace(" → ", " "))}`} target="_blank" rel="noopener" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}>↗ Map</a>
          <div style={{ flex: 1, height: 1, background: "var(--border-subtle)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {grouped[locKey].map(item => (
            <div key={item.id} style={{ paddingBottom: 20, borderBottom: "1px solid var(--border-subtle)" }}>
              {/* Row 1: Name, Reserved badge, Tags, Price, Priority, Delete */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <Editable value={item.name} onChange={v => updateItem(item.id, "name", v)} placeholder={`${type} name`} style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 150 }} />
                {item.hasReservation && <Badge bg="var(--green-bg)" text="var(--green-text)" label="Reserved" />}
                {isFood && <TagToggle tags={item.tags} onChange={v => updateItem(item.id, "tags", v)} />}
                <PriceSlider value={item.priceLevel} onChange={v => updateItem(item.id, "priceLevel", v)} />
                <PillSelect value={item.priority} options={PRIORITY_OPTIONS} onChange={v => updateItem(item.id, "priority", v)} size="xs" />
                <DeleteBtn onClick={() => removeItem(item.id)} />
              </div>
              {/* Row 2: Vibe */}
              <Editable value={item.vibe} onChange={v => updateItem(item.id, "vibe", v)} placeholder="Vibe / what to expect" style={{ fontSize: 13, fontStyle: "italic", color: "var(--muted)", marginBottom: 6 }} />
              {/* Row 3: Location, Reservation, Notes */}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <LocationSelect value={item.locationId} locations={locations} onChange={v => updateItem(item.id, "locationId", v)} style={{ width: 160 }} />
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
      </div>;
    })}
  </div>;
}
