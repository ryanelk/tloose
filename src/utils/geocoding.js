// Geocoding service using Nominatim API (OpenStreetMap)
// Rate limited to 1 request per second as per Nominatim usage policy

const NOMINATIM_API = "https://nominatim.openstreetmap.org/search";
const REQUEST_DELAY = 1100; // 1.1 second delay between requests
const MAX_RETRIES = 2;

let requestQueue = [];
let isProcessing = false;

/**
 * Geocode a single item by name
 * @param {string} name - The name to geocode (e.g., "Museo Frida Kahlo")
 * @returns {Promise<{lat: number, lng: number} | null>} - Coordinates or null if failed
 */
export async function geocodeItem(name) {
  if (!name || name.trim() === "") {
    return null;
  }

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
      request.resolve(result);
    } catch (error) {
      // Retry logic
      if (request.retries < MAX_RETRIES) {
        request.retries++;
        requestQueue.unshift(request); // Put back at front of queue
      } else {
        console.error(`Geocoding failed for "${request.name}" after ${MAX_RETRIES} retries:`, error);
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
