// ─── Time Helpers ───
export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1]), min = parseInt(m[2]);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export function minutesToTimeStr(mins) {
  if (mins == null || mins < 0) return "";
  let h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function calcDuration(startTime, endTime) {
  const s = parseTimeToMinutes(startTime), e = parseTimeToMinutes(endTime);
  if (s == null || e == null) return "";
  let diff = e - s;
  if (diff < 0) diff += 1440;
  const h = Math.floor(diff / 60), m = diff % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function calcRecommendedArrival(startTime, type) {
  const s = parseTimeToMinutes(startTime);
  if (s == null) return "";
  const offset = type === "flight" ? 120 : 60;
  let arrival = s - offset;
  if (arrival < 0) arrival += 1440;
  return minutesToTimeStr(arrival);
}

// ─── Location Helpers ───
export function locationOptions(locations) {
  const opts = [];
  (locations || []).forEach(loc => {
    opts.push({ value: loc.id, label: loc.name });
    (loc.sublocations || []).forEach(sub => {
      opts.push({ value: sub.id, label: `${loc.name} → ${sub.name}` });
    });
  });
  return opts;
}

export function getLocationName(locations, id) {
  if (!id) return "Unassigned";
  for (const loc of (locations || [])) {
    if (loc.id === id) return loc.name;
    for (const sub of (loc.sublocations || [])) {
      if (sub.id === id) return `${loc.name} → ${sub.name}`;
    }
  }
  return "Unassigned";
}

// ─── Date Helpers ───
export function formatDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return `${days[d.getDay()]} ${d.getMonth()+1}/${d.getDate()}`;
}

export function generateDateRange(startDate, endDate) {
  if (!startDate || !endDate) return [];
  const dates = [];
  const s = new Date(startDate + "T00:00:00");
  const e = new Date(endDate + "T00:00:00");
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function syncTimelineDays(oldTimeline, startDate, endDate) {
  const dates = generateDateRange(startDate, endDate);
  const byDate = {};
  (oldTimeline || []).forEach(d => { if (d.date) byDate[d.date] = d; });
  return dates.map(date => {
    if (byDate[date]) return byDate[date];
    return { id: uid(), date, label: formatDayLabel(date), subtitle: "", locationIds: [], events: [] };
  });
}

// ─── Derived Events ───
export function getDerivedEvents(date, data) {
  const events = [];
  if (!date) return events;
  (data.overview.transports || []).forEach(t => {
    if (t.date === date) {
      events.push({ id: "dt-" + t.id, time: t.startTime || "", text: `${t.type.charAt(0).toUpperCase() + t.type.slice(1)}: ${t.route}`, source: "transport", category: "travel" });
      if (t.endTime) {
        events.push({ id: "dt-arr-" + t.id, time: t.endTime || "", text: `Arrive (${t.route.split("→").pop()?.trim() || ""})`, source: "transport", category: "travel" });
      }
    }
  });
  (data.food || []).forEach(item => {
    if (item.hasReservation && item.reservationDay === date) {
      events.push({ id: "df-" + item.id, time: item.reservationTime || "", text: item.name, source: "food", category: "food", priority: item.priority });
    }
  });
  (data.activities || []).forEach(item => {
    if (item.hasReservation && item.reservationDay === date) {
      events.push({ id: "da-" + item.id, time: item.reservationTime || "", text: item.name, source: "activity", category: "activity", priority: item.priority });
    }
  });
  events.sort((a, b) => (parseTimeToMinutes(a.time) || 0) - (parseTimeToMinutes(b.time) || 0));
  return events;
}

// ─── Misc ───
export const uid = () => Math.random().toString(36).slice(2, 9);
