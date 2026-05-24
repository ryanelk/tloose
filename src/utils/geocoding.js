// Geocoding service using Nominatim API (OpenStreetMap)
// Rate limited to 1 request per second as per Nominatim usage policy
// Using 3 second delay for conservative rate limiting

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const REQUEST_DELAY = 3000; // 3 second delay between requests (conservative)
const MAX_RETRIES = 2;
const GEOCODE_CACHE_KEY = "trip-planner-geocode-cache";

let requestQueue = [];
let isProcessing = false;
let geocodeCache = null;

/**
 * Load geocoding cache from localStorage
 * @returns {Map<string, {lat: number, lng: number}>}
 */
function loadCache() {
  if (geocodeCache) return geocodeCache;

  try {
    const cached = localStorage.getItem(GEOCODE_CACHE_KEY);
    if (cached) {
      const obj = JSON.parse(cached);
      geocodeCache = new Map(Object.entries(obj));
    } else {
      geocodeCache = new Map();
    }
  } catch {
    geocodeCache = new Map();
  }
  return geocodeCache;
}

/**
 * Save geocoding cache to localStorage
 */
function saveCache() {
  try {
    const obj = Object.fromEntries(geocodeCache);
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error("Failed to save geocode cache:", error);
  }
}

/**
 * Geocode a single item by name
 * @param {string} name - The name to geocode (e.g., "Museo Frida Kahlo")
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if failed
 */
export async function geocodeItem(name) {
  if (!name || name.trim() === "") {
    return null;
  }

  // Check cache first
  const cache = loadCache();
  const cacheKey = name.trim().toLowerCase();

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    // Return a copy to avoid mutations
    return cached ? { ...cached } : null;
  }

  // Not in cache, queue for API request
  return new Promise((resolve) => {
    requestQueue.push({ name, resolve, retries: 0 });
    processQueue();
  });
}

/**
 * Geocode multiple items with progress callback
 * @param {Array} items - Array of items with {id, name} properties
 * @param {Function} onProgress - Callback called with (completed, total, item)
 * @returns {Promise<Map>} - Map of item IDs to geocoding results
 */
export async function geocodeMultiple(items, onProgress) {
  const results = new Map();
  let completed = 0;
  const total = items.length;

  for (const item of items) {
    const result = await geocodeItem(item.name);
    results.set(item.id, result);
    completed++;

    if (onProgress) {
      onProgress(completed, total, item);
    }
  }

  return results;
}

/**
 * Process the request queue with rate limiting
 */
async function processQueue() {
  if (isProcessing || requestQueue.length === 0) {
    return;
  }

  isProcessing = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();

    try {
      const result = await fetchGeocode(request.name);

      // Save result to cache (both successful and failed lookups)
      const cache = loadCache();
      const cacheKey = request.name.trim().toLowerCase();
      cache.set(cacheKey, result);
      geocodeCache = cache;
      saveCache();

      request.resolve(result);
    } catch (error) {
      // Retry logic
      if (request.retries < MAX_RETRIES) {
        request.retries++;
        requestQueue.unshift(request); // Put back at front of queue
      } else {
        console.error(`Geocoding failed for "${request.name}" after ${MAX_RETRIES} retries:`, error);

        // Cache the failure to avoid repeated attempts
        const cache = loadCache();
        const cacheKey = request.name.trim().toLowerCase();
        cache.set(cacheKey, null);
        geocodeCache = cache;
        saveCache();

        request.resolve(null);
      }
    }

    // Wait before processing next request (rate limiting)
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }

  isProcessing = false;
}

/**
 * Fetch geocoding data from Nominatim API
 * @param {string} name - The name to geocode
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
async function fetchGeocode(name) {
  const url = `${NOMINATIM_API}?q=${encodeURIComponent(name)}&format=json&limit=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TripPlanner/1.0'
    }
  });

  if (!response.ok) {
    if (response.status === 429) {
      // Rate limit exceeded - throw error to retry
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    // No results found
    return null;
  }

  const result = data[0];
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon)
  };
}

/**
 * Clear the request queue (useful for testing or canceling operations)
 */
export function clearQueue() {
  requestQueue = [];
  isProcessing = false;
}

/**
 * Clear the geocoding cache (useful for testing or forcing re-geocoding)
 */
export function clearCache() {
  geocodeCache = new Map();
  try {
    localStorage.removeItem(GEOCODE_CACHE_KEY);
  } catch (error) {
    console.error("Failed to clear geocode cache:", error);
  }
}
