export const STORAGE_KEY = "trip-planner-data";

export const FONTS = [
  { id: "dm-sans", name: "DM Sans", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap", stack: "'DM Sans', sans-serif" },
  { id: "fraunces", name: "Fraunces", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap", stack: "'Fraunces', serif" },
  { id: "instrument-serif", name: "Instrument Serif", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap", stack: "'Instrument Serif', serif" },
  { id: "literata", name: "Literata", href: "https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400;7..72,500;7..72,600;7..72,700&display=swap", stack: "'Literata', serif" },
  { id: "sora", name: "Sora", href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&display=swap", stack: "'Sora', sans-serif" },
  { id: "space-mono", name: "Space Mono", href: "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap", stack: "'Space Mono', monospace" },
];

export const TIMEZONES = ["PST","MST","CST","EST","UTC","CET","JST","AEST","HST","AKST","AST","IST","CST (China)","KST","NZST"];

export const TRANSPORT_TYPES = [
  { value: "flight", label: "Flight" },
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
  { value: "car", label: "Car" },
  { value: "ferry", label: "Ferry" },
];

export const PRIORITY_COLORS = {
  "must-visit": { bg: "var(--red-bg)", text: "var(--red-text)", label: "Must" },
  "high-priority": { bg: "var(--amber-bg)", text: "var(--amber-text)", label: "High" },
  "if-time": { bg: "var(--slate-bg)", text: "var(--slate-text)", label: "Maybe" }
};

export const EVENT_TYPES = {
  confirmed: { bg: "var(--green-bg)", text: "var(--green-text)" },
  "high-priority": { bg: "var(--amber-bg)", text: "var(--amber-text)" },
  potential: { bg: "var(--slate-bg)", text: "var(--slate-text)" }
};

export const PRIORITY_OPTIONS = [
  { value: "must-visit", label: "Must" },
  { value: "high-priority", label: "High" },
  { value: "if-time", label: "Maybe" }
];

export const EVENT_TYPE_OPTIONS = [
  { value: "confirmed", label: "Set" },
  { value: "high-priority", label: "High" },
  { value: "potential", label: "Maybe" }
];

export const CATEGORY_OPTIONS = [
  { value: "travel", label: "🚌" },
  { value: "food", label: "🍽" },
  { value: "activity", label: "📍" }
];

export const SOURCE_ICONS = { transport: "✈", food: "🍽", activity: "📍" };
export const SOURCE_COLORS = { transport: "var(--accent)", food: "var(--amber-text)", activity: "var(--green-text)" };

export const selectStyle = {
  background: "var(--pill-track)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  padding: "3px 8px",
  color: "var(--fg)",
  fontSize: 12,
  fontFamily: "inherit",
  cursor: "pointer",
  outline: "none"
};

export const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 14,
  fontSize: 13,
  fontWeight: 700,
  color: "var(--fg)",
  letterSpacing: -0.2
};

export const DEFAULT_DATA = {
  tripName: "Summer Trip 2025",
  startDate: "2025-08-12",
  endDate: "2025-08-25",
  theme: "system",
  font: "literata",
  timezone: "PST",
  locations: [
    { id: "loc1", name: "Morelia", sublocations: [{ id: "sub1", name: "Pátzcuaro" }] },
    { id: "loc2", name: "Mexico City", sublocations: [
      { id: "sub2", name: "Roma Norte" },
      { id: "sub3", name: "Coyoacán" },
      { id: "sub4", name: "Centro" },
      { id: "sub5", name: "Xochimilco" },
    ]},
  ],
  overview: {
    transports: [
      { id: "t1", type: "flight", route: "LAX → MLM", date: "2025-08-12", startTime: "3:03 PM", endTime: "7:33 PM", airline: "Volaris", notes: "Personal item + carry-on < 44 lb", budgeted: 700, actual: 0 },
      { id: "t2", type: "bus", route: "Morelia → Mexico City (Poniente)", date: "2025-08-20", startTime: "9:00 AM", endTime: "1:00 PM", airline: "ETN", notes: "", budgeted: 250, actual: 0 },
    ],
    deadlines: [
      { id: "d1", text: "Purchase return flight tickets", date: "2025-07-15", done: false },
      { id: "d2", text: "Book Mexico City hotel", date: "2025-07-20", done: true },
    ],
    stays: [
      { id: "s1", locationId: "loc1", name: "Staying with family (Maca)", startDate: "2025-08-12", endDate: "2025-08-19", budgeted: 0, actual: 0 },
      { id: "s2", locationId: "loc2", name: "Hotel via Hotwire", startDate: "2025-08-20", endDate: "2025-08-25", budgeted: 850, actual: 0 },
    ],
  },
  timeline: [
    { id: "tl1", date: "2025-08-12", label: "Tue 8/12", subtitle: "Arrival Day", locationIds: ["loc1"], events: [
      { id: "e2", time: "9:00 PM", text: "Late night dinner", type: "potential", category: "food" },
    ]},
    { id: "tl2", date: "2025-08-21", label: "Thu 8/21", subtitle: "South CDMX Day", locationIds: ["sub3", "loc2"], events: [
      { id: "e4", time: "1:00 PM", text: "Lunch in Coyoacán", type: "potential", category: "food" },
    ]},
  ],
  food: [
    { id: "r1", name: "Esquina Común", locationId: "sub2", priceLevel: 4, tags: ["food"], vibe: "One Michelin star, need to DM on IG to reserve", priority: "must-visit", hasReservation: true, reservationDay: "2025-08-23", reservationTime: "4:00 PM", notes: "Cheaper than other starred places" },
    { id: "r2", name: "Voraz", locationId: "sub2", priceLevel: 2, tags: ["food", "drinks"], vibe: "Experimental Mexican, Bib Gourmand", priority: "must-visit", hasReservation: false, reservationDay: "", reservationTime: "", notes: "" },
    { id: "r3", name: "Tacos Charly", locationId: "sub4", priceLevel: 1, tags: ["food"], vibe: "Suadero tacos, Bib Gourmand", priority: "if-time", hasReservation: false, reservationDay: "", reservationTime: "", notes: "" },
  ],
  activities: [
    { id: "a1", name: "Museo Frida Kahlo", locationId: "sub3", priceLevel: 1, tags: [], vibe: "Iconic museum, book in advance", priority: "must-visit", hasReservation: true, reservationDay: "2025-08-21", reservationTime: "10:45 AM", notes: "museofridakahlo.org.mx" },
    { id: "a2", name: "Xochimilco", locationId: "sub5", priceLevel: 2, tags: [], vibe: "Floating gardens, Evan's fav part of his trip", priority: "must-visit", hasReservation: false, reservationDay: "", reservationTime: "", notes: "Consider the private ecotour" },
    { id: "a3", name: "Teotihuacán", locationId: "loc2", priceLevel: 2, tags: [], vibe: "Pyramids, can't climb them anymore", priority: "high-priority", hasReservation: false, reservationDay: "", reservationTime: "", notes: "Full day trip" },
  ],
  budget: {
    totalBudget: 4500,
    categories: [
      { id: "b3", group: "Food", items: [
        { id: "bi5", name: "Restaurants", budgeted: 800, actual: 0, notes: "" },
        { id: "bi6", name: "Snacks & Street Food", budgeted: 180, actual: 0, notes: "" },
      ]},
      { id: "b4", group: "Activities", items: [
        { id: "bi7", name: "Museums & Tickets", budgeted: 100, actual: 0, notes: "" },
      ]},
      { id: "b5", group: "Souvenirs", items: [
        { id: "bi8", name: "Shopping & Gifts", budgeted: 700, actual: 0, notes: "" },
      ]},
    ],
  },
};
