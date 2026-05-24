import { DEFAULT_DATA, STORAGE_KEY } from "./defaults.js";

export const TRIPS_KEY = "trip-planner-trips";

function generateId() {
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createNewTrip() {
  return { ...JSON.parse(JSON.stringify(DEFAULT_DATA)), id: generateId() };
}

export function loadTripsDb() {
  try {
    const raw = localStorage.getItem(TRIPS_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate from old single-trip storage
    const old = localStorage.getItem(STORAGE_KEY);
    if (old) {
      const oldData = JSON.parse(old);
      const id = generateId();
      const trip = { ...oldData, id };
      const db = { trips: [trip], activeTripId: id };
      localStorage.setItem(TRIPS_KEY, JSON.stringify(db));
      return db;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveTripsDb(db) {
  try {
    localStorage.setItem(TRIPS_KEY, JSON.stringify(db));
  } catch {}
}
