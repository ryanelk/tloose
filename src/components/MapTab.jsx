import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { geocodeMultiple } from "../utils/geocoding.js";
import { getLocationName } from "../utils/helpers.js";
import { Badge } from "./shared.jsx";
import { PRIORITY_OPTIONS } from "../data/defaults.js";

const MAP_POSITION_KEY = "trip-planner-map-position";

// Component to handle map position persistence
function MapPositionHandler({ onPositionChange }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onPositionChange({ center: [center.lat, center.lng], zoom });
    },
  });
  return null;
}

export default function MapTab({ data, setData, setTab, setHighlightedItemId }) {
  const [geocoding, setGeocoding] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapPosition, setMapPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(MAP_POSITION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const mapRef = useRef(null);
  const hasAutoGeocoded = useRef(false); // Prevent duplicate auto-geocoding

  // Load Leaflet CSS
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    setLeafletLoaded(true);

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  // Combine food and activities
  const allItems = [
    ...(data.food || []).map(i => ({ ...i, type: 'food' })),
    ...(data.activities || []).map(i => ({ ...i, type: 'activity' }))
  ];

  // Items that need geocoding (name changed or never geocoded)
  const needsGeocoding = allItems.filter(item =>
    item.name &&
    item.name.trim() !== "" &&
    (item.name !== item.geocodedName || (!item.lat && !item.geocodeError))
  );

  // Items with valid coordinates
  const mappedItems = allItems.filter(item =>
    item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng)
  );

  // Items that failed to geocode
  const errorItems = allItems.filter(item => item.geocodeError && item.name);

  // Auto-geocode items on mount (only once to prevent duplicate API calls)
  useEffect(() => {
    if (needsGeocoding.length > 0 && !geocoding && !hasAutoGeocoded.current) {
      hasAutoGeocoded.current = true;
      console.log(`[MapTab] Auto-geocoding ${needsGeocoding.length} items`);
      handleGeocode(needsGeocoding);
    }
  }, []);

  const handleGeocode = async (items) => {
    setGeocoding(true);
    setProgress({ completed: 0, total: items.length });

    // Add location context to each item for better geocoding accuracy
    const itemsWithLocation = items.map(item => {
      let location = "";
      if (item.locationId) {
        // Convert "Mexico City → Condesa" to "Condesa, Mexico City" for better geocoding
        const locName = getLocationName(data.locations, item.locationId);
        location = locName.replace(" → ", ", ");
      }
      return {
        ...item,
        location
      };
    });

    const results = await geocodeMultiple(
      itemsWithLocation,
      (completed, total, item) => {
        setProgress({ completed, total });
      }
    );

    // Update data with geocoding results
    setData(prevData => {
      const newData = { ...prevData };

      // Update food items
      newData.food = newData.food.map(item => {
        const result = results.get(item.id);
        if (result !== undefined) {
          if (result) {
            return {
              ...item,
              lat: result.lat,
              lng: result.lng,
              geocodedName: item.name,
              geocodeError: false,
              geocodeTimestamp: new Date().toISOString()
            };
          } else {
            return {
              ...item,
              lat: null,
              lng: null,
              geocodedName: item.name,
              geocodeError: true,
              geocodeTimestamp: new Date().toISOString()
            };
          }
        }
        return item;
      });

      // Update activity items
      newData.activities = newData.activities.map(item => {
        const result = results.get(item.id);
        if (result !== undefined) {
          if (result) {
            return {
              ...item,
              lat: result.lat,
              lng: result.lng,
              geocodedName: item.name,
              geocodeError: false,
              geocodeTimestamp: new Date().toISOString()
            };
          } else {
            return {
              ...item,
              lat: null,
              lng: null,
              geocodedName: item.name,
              geocodeError: true,
              geocodeTimestamp: new Date().toISOString()
            };
          }
        }
        return item;
      });

      return newData;
    });

    setGeocoding(false);
  };

  const handleRetry = (item) => {
    handleGeocode([item]);
  };

  const handleRetryAll = () => {
    handleGeocode(errorItems);
  };

  const handlePositionChange = (position) => {
    setMapPosition(position);
    localStorage.setItem(MAP_POSITION_KEY, JSON.stringify(position));
  };

  // Create custom marker icons
  const createIcon = (type) => {
    const isFood = type === 'food';
    const emoji = isFood ? '🍽' : '📍';
    const color = isFood ? '#b45309' : '#16a34a';

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ">${emoji}</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // Calculate map bounds
  const getBounds = () => {
    if (mappedItems.length === 0) return null;
    return mappedItems.map(item => [item.lat, item.lng]);
  };

  const bounds = getBounds();
  const defaultCenter = bounds && bounds.length > 0
    ? [
        bounds.reduce((sum, b) => sum + b[0], 0) / bounds.length,
        bounds.reduce((sum, b) => sum + b[1], 0) / bounds.length
      ]
    : [19.4326, -99.1332]; // Default to Mexico City

  // Use saved position if available, otherwise calculate from bounds
  const center = mapPosition?.center || defaultCenter;
  const zoom = mapPosition?.zoom || (bounds?.length === 1 ? 13 : 11);

  if (!leafletLoaded) {
    return <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>Loading map...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Geocoding Progress Banner */}
      {geocoding && (
        <div style={{
          background: "var(--card-bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8
        }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>
            Finding locations on map... ({progress.completed} of {progress.total})
          </div>
          <div style={{
            height: 4,
            background: "var(--pill-track)",
            borderRadius: 2,
            overflow: "hidden"
          }}>
            <div style={{
              height: "100%",
              background: "var(--accent)",
              width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
              transition: "width 0.3s"
            }} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Map Container */}
        <div style={{
          flex: "1 1 600px",
          minHeight: 500,
          height: "calc(100vh - 300px)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
          position: "relative"
        }}>
          {mappedItems.length === 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--muted)",
              padding: 40,
              textAlign: "center"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No locations to display</div>
              <div style={{ fontSize: 13 }}>
                {allItems.length === 0
                  ? "Add food or activities to see them on the map"
                  : geocoding
                  ? "Finding locations..."
                  : "Unable to find locations for your items"}
              </div>
            </div>
          ) : (
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <MapPositionHandler onPositionChange={handlePositionChange} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mappedItems.map(item => (
                <Marker
                  key={item.id}
                  position={[item.lat, item.lng]}
                  icon={createIcon(item.type)}
                >
                  <Popup>
                    <div style={{ minWidth: 200, maxWidth: 280 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "#000" }}>
                        {item.name}
                      </div>

                      {item.locationId && (
                        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                          {getLocationName(data.locations, item.locationId)}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                        <Badge
                          bg={PRIORITY_OPTIONS.find(p => p.value === item.priority)?.color || "var(--slate-bg)"}
                          text={PRIORITY_OPTIONS.find(p => p.value === item.priority)?.textColor || "var(--slate-text)"}
                          label={PRIORITY_OPTIONS.find(p => p.value === item.priority)?.label || item.priority}
                        />
                        <span style={{ fontSize: 13, color: "#000" }}>
                          {"$".repeat(item.priceLevel || 1)}
                        </span>
                        {item.type === 'food' && item.tags && (
                          <span style={{ fontSize: 13 }}>
                            {item.tags.includes('food') && '🍽'}
                            {item.tags.includes('drinks') && '🍹'}
                          </span>
                        )}
                      </div>

                      {item.vibe && (
                        <div style={{ fontSize: 12, fontStyle: "italic", color: "#666", marginBottom: 8 }}>
                          {item.vibe}
                        </div>
                      )}

                      {item.hasReservation && (
                        <div style={{ fontSize: 11, color: "#16a34a", marginBottom: 8, fontWeight: 500 }}>
                          Reserved: {item.reservationDay} {item.reservationTime}
                        </div>
                      )}

                      {item.notes && (
                        <div style={{ fontSize: 12, color: "#444", marginBottom: 8, padding: "8px", background: "#f9f9f9", borderRadius: 4, borderLeft: "3px solid #4a6ee0" }}>
                          {item.notes}
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            padding: "6px 12px",
                            background: "#4285F4",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: "none",
                            textAlign: "center",
                            cursor: "pointer"
                          }}
                        >
                          Google Maps
                        </a>
                        {item.type === 'food' && (
                          <a
                            href={`https://www.yelp.com/search?find_desc=${encodeURIComponent(item.name)}&find_loc=${encodeURIComponent(
                              item.locationId ? getLocationName(data.locations, item.locationId).replace(" → ", ", ") : ""
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flex: 1,
                              padding: "6px 12px",
                              background: "#d32323",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: "none",
                              textAlign: "center",
                              cursor: "pointer"
                            }}
                          >
                            Yelp
                          </a>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          flex: "0 0 280px",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          {/* Error Items */}
          {errorItems.length > 0 && (
            <div style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--amber-text)",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <span>⚠</span>
                <span>Unable to Find Locations ({errorItems.length})</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {errorItems.map(item => (
                  <div key={item.id} style={{
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    paddingBottom: 8,
                    borderBottom: "1px solid var(--border-subtle)"
                  }}>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </span>
                    <button
                      onClick={() => handleRetry(item)}
                      disabled={geocoding}
                      style={{
                        padding: "2px 8px",
                        background: "var(--accent-dim)",
                        color: "var(--accent)",
                        border: "1px solid var(--accent)",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: geocoding ? "not-allowed" : "pointer",
                        opacity: geocoding ? 0.5 : 1
                      }}
                    >
                      Retry
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleRetryAll}
                disabled={geocoding}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "6px 12px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: geocoding ? "not-allowed" : "pointer",
                  opacity: geocoding ? 0.5 : 1
                }}
              >
                Retry All
              </button>
            </div>
          )}

          {/* Stats */}
          <div style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 12 }}>
              Map Statistics
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total items:</span>
                <span style={{ fontWeight: 600 }}>{allItems.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>On map:</span>
                <span style={{ fontWeight: 600, color: "var(--green-text)" }}>{mappedItems.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Failed:</span>
                <span style={{ fontWeight: 600, color: "var(--amber-text)" }}>{errorItems.length}</span>
              </div>
              {needsGeocoding.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Pending:</span>
                  <span style={{ fontWeight: 600, color: "var(--muted)" }}>{needsGeocoding.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
