# tloose — Database Architecture

## Current Architecture

tloose uses a two-layer persistence model: **localStorage** as the primary store and **GitHub Gist** as a cloud sync layer. There is no backend server.

```
Browser
  └── localStorage (trip-planner-trips)   ← always written on every change
        ↕ debounced sync (5 min)
  └── GitHub Gist API (single JSON file)  ← optional, requires PAT token
```

### Storage Keys

| Key | Purpose |
|-----|---------|
| `trip-planner-trips` | Full DB blob — all trips + `activeTripId` |
| `trip-planner-gist-credentials` | `{ token, gistId }` — GitHub PAT + Gist ID |
| `trip-planner-pending-sync` | Flag — unsynced local changes exist |
| `trip-planner-guest-mode` | Flag — user opted out of GitHub sync |

---

## Data Model

The entire database is one JSON document (the `db` object):

```json
{
  "activeTripId": "trip_1234567890_abc12",
  "trips": [ <Trip>, <Trip>, ... ]
}
```

### Trip

Each trip is a self-contained document. All sub-entities are embedded arrays — there are no foreign collections.

```json
{
  "id": "trip_1234567890_abc12",
  "tripName": "Summer Trip 2025",
  "startDate": "2025-08-12",
  "endDate": "2025-08-25",
  "theme": "system",
  "font": "literata",
  "timezone": "PST",
  "locations": [ <Location> ],
  "overview": {
    "transports": [ <Transport> ],
    "stays":      [ <Stay> ],
    "deadlines":  [ <Deadline> ]
  },
  "timeline": [ <Day> ],
  "food":       [ <FoodItem> ],
  "activities": [ <ActivityItem> ],
  "budget": {
    "totalBudget": 4500,
    "categories": [ <BudgetCategory> ]
  }
}
```

### Location

```json
{
  "id": "loc1",
  "name": "Mexico City",
  "sublocations": [
    { "id": "sub1", "name": "Roma Norte" },
    { "id": "sub2", "name": "Coyoacán" }
  ]
}
```

Sublocations are embedded directly in their parent. Location IDs are referenced by foreign key in food items, activities, stays, and timeline days.

### Transport

```json
{
  "id": "t1",
  "type": "flight",
  "route": "LAX → MLM",
  "date": "2025-08-12",
  "startTime": "3:03 PM",
  "endTime": "7:33 PM",
  "airline": "Volaris",
  "notes": "Personal item + carry-on < 44 lb",
  "budgeted": 700,
  "actual": 0
}
```

`type` is one of: `flight`, `bus`, `train`, `car`, `ferry`.

### Stay

```json
{
  "id": "s1",
  "locationId": "loc1",
  "name": "Hotel via Hotwire",
  "startDate": "2025-08-20",
  "endDate": "2025-08-25",
  "budgeted": 850,
  "actual": 0
}
```

### Deadline

```json
{
  "id": "d1",
  "text": "Book Mexico City hotel",
  "date": "2025-07-20",
  "done": true
}
```

### Day (Timeline)

```json
{
  "id": "tl1",
  "date": "2025-08-12",
  "label": "Tue 8/12",
  "subtitle": "Arrival Day",
  "locationIds": ["loc1"],
  "events": [ <Event> ]
}
```

Days are auto-generated from the trip's `startDate`/`endDate` range. Events within a day are ordered by their position in the `events` array (user drag-and-drop order).

### Event

```json
{
  "id": "e1",
  "text": "Late night dinner",
  "type": "potential",
  "linkedItemId": "r2"
}
```

Events may be manual (`text` field only) or linked to a food/activity item via `linkedItemId`. Transport and stay events are **derived stubs** — they are inserted automatically into `events` from `overview.transports` and `overview.stays` and carry a `_derived` field:

```json
{
  "id": "dt-t1",
  "_derived": "transport",
  "sourceId": "t1"
}
```

| `_derived` value | Source |
|-----------------|--------|
| `"transport"` | `overview.transports[sourceId]` |
| `"stay_in"` | `overview.stays[sourceId]` — check-in day |
| `"stay_out"` | `overview.stays[sourceId]` — check-out day |

`type` is one of: `potential`, `high-priority`, `confirmed`.

### Food / Activity Item

Both share the same shape:

```json
{
  "id": "r1",
  "name": "Esquina Común",
  "locationId": "sub2",
  "priceLevel": 4,
  "tags": ["food", "michelin"],
  "vibe": "One Michelin star, need to DM on IG to reserve",
  "priority": "must-visit",
  "hasReservation": true,
  "reservationDay": "2025-08-23",
  "reservationTime": "4:00 PM",
  "notes": "Cheaper than other starred places"
}
```

Food `tags`: `food`, `drinks`, `bib-gourmand`, `michelin`  
Activity `tags`: `shop`, `attraction`, `nature`, `monument`  
`priority`: `must-visit`, `high-priority`, `if-time`

### Budget

```json
{
  "totalBudget": 4500,
  "categories": [
    {
      "id": "b1",
      "group": "Food",
      "items": [
        { "id": "bi1", "name": "Restaurants", "budgeted": 800, "actual": 0, "notes": "" }
      ]
    }
  ]
}
```

Budget categories are user-defined. Transportation and Stays costs are derived from `overview.transports` and `overview.stays` (their `budgeted`/`actual` fields) and not stored in `budget.categories`.

---

## Adapting to Self-Hosted MongoDB

The embedded document structure maps cleanly to MongoDB. The main design decision is **how much to flatten** — MongoDB performs best when you read whole documents at once, which matches tloose's current access pattern (always load the full trip).

### Recommended Collection Layout

Use **two collections**: one for users (auth) and one for trips.

```
users
  _id, email, passwordHash, createdAt

trips
  _id (= current trip.id)
  userId          ← owner reference
  tripName, startDate, endDate, theme, font, timezone
  locations       ← embedded array (small, always read together)
  overview        ← embedded subdocument
  timeline        ← embedded array of days, each with embedded events
  food            ← embedded array
  activities      ← embedded array
  budget          ← embedded subdocument
  updatedAt       ← for conflict detection
```

Because tloose always reads and writes a full trip at a time, keeping everything embedded in one document is appropriate and avoids joins entirely.

### Schema (Mongoose example)

```js
// models/Trip.js
const eventSchema = new Schema({
  _id: false,
  id: String,
  text: String,
  type: { type: String, enum: ["potential", "high-priority", "confirmed"], default: "potential" },
  linkedItemId: String,
  _derived: String,      // "transport" | "stay_in" | "stay_out" | undefined
  sourceId: String,
}, { _id: false });

const daySchema = new Schema({
  id: String,
  date: String,
  label: String,
  subtitle: String,
  locationIds: [String],
  events: [eventSchema],
}, { _id: false });

const itemSchema = new Schema({
  id: String,
  name: String,
  locationId: String,
  priceLevel: Number,
  tags: [String],
  vibe: String,
  priority: { type: String, enum: ["must-visit", "high-priority", "if-time"] },
  hasReservation: Boolean,
  reservationDay: String,
  reservationTime: String,
  notes: String,
}, { _id: false });

const tripSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tripName: String,
  startDate: String,
  endDate: String,
  theme: String,
  font: String,
  timezone: String,
  locations: [{ id: String, name: String, sublocations: [{ id: String, name: String }] }],
  overview: {
    transports: [{ id: String, type: String, route: String, date: String, startTime: String, endTime: String, airline: String, notes: String, budgeted: Number, actual: Number }],
    stays:      [{ id: String, locationId: String, name: String, startDate: String, endDate: String, budgeted: Number, actual: Number }],
    deadlines:  [{ id: String, text: String, date: String, done: Boolean }],
  },
  timeline: [daySchema],
  food:       [itemSchema],
  activities: [itemSchema],
  budget: {
    totalBudget: Number,
    categories: [{
      id: String, group: String,
      items: [{ id: String, name: String, budgeted: Number, actual: Number, notes: String }],
    }],
  },
  updatedAt: { type: Date, default: Date.now },
});
```

### API Endpoints to Replace Gist

Replace `gistStorage.js` with a small REST API. The surface area is intentionally minimal — the same load/save/create pattern as the Gist layer.

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/auth/login` | Returns JWT |
| `GET` | `/trips` | List all trips for the authenticated user (`_id, tripName, updatedAt` only) |
| `GET` | `/trips/:id` | Load full trip document |
| `PUT` | `/trips/:id` | Replace full trip document (upsert) |
| `POST` | `/trips` | Create new trip |
| `DELETE` | `/trips/:id` | Delete trip |

The `PUT /trips/:id` route should mirror how `saveToGist` works — a full document replace, not a partial update. This keeps the client-side logic unchanged.

### Client-Side Swap

`gistStorage.js` exports `loadFromGist`, `saveToGist`, and `createGist`. Replacing the backing store means swapping those three functions while keeping all signatures identical:

```js
// mongoStorage.js  (drop-in replacement for gistStorage.js)
const API = "https://your-server/api";

export async function loadFromGist(token, tripId) {
  const res = await fetch(`${API}/trips/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
}

export async function saveToGist(token, tripId, db) {
  const res = await fetch(`${API}/trips/${tripId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(db),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
}

export async function createGist(token, db) {
  const res = await fetch(`${API}/trips`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(db),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  const trip = await res.json();
  return trip.id;
}
```

No changes needed in `App.jsx` — `credentials.gistId` becomes `credentials.tripId`, and the auth token comes from your own login flow instead of a GitHub PAT.

### Conflict Detection

The current Gist-based model uses a simple pending flag. With MongoDB you can add `updatedAt` to detect conflicts server-side:

```js
// Server-side PUT handler (Express example)
app.put("/trips/:id", auth, async (req, res) => {
  const { clientUpdatedAt, ...tripData } = req.body;
  const existing = await Trip.findOne({ id: req.params.id, userId: req.user.id });

  if (existing && clientUpdatedAt && existing.updatedAt > new Date(clientUpdatedAt)) {
    return res.status(409).json({ conflict: true, serverUpdatedAt: existing.updatedAt });
  }

  await Trip.findOneAndUpdate(
    { id: req.params.id, userId: req.user.id },
    { ...tripData, updatedAt: new Date() },
    { upsert: true }
  );
  res.json({ ok: true });
});
```

### Indexes

```js
// Minimal index set for this access pattern
db.trips.createIndex({ userId: 1 });           // list trips by user
db.trips.createIndex({ id: 1 }, { unique: true }); // point lookups by trip ID
db.trips.createIndex({ userId: 1, updatedAt: -1 }); // list sorted by recency
```

---

## Migration Path

1. Stand up MongoDB + a minimal Express/Fastify server with the five routes above
2. Add a login screen to `GistSetup.jsx` that issues a JWT instead of asking for a GitHub PAT
3. Rename `gistStorage.js` → `mongoStorage.js`, swap the three fetch functions
4. Export existing Gist data using the "Download Backup" button and import via `POST /trips`
5. The rest of the app (`App.jsx`, `setD`, conflict UI, guest mode) requires no changes
