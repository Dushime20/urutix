/**
 * Reverse geocoding utility using OpenStreetMap Nominatim.
 * Converts latitude/longitude coordinates into a human-readable place name.
 *
 * Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
 *   - Max 1 request per second — enforced via the request queue below.
 *   - Provide a valid User-Agent (set in request headers).
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'Urutix-Platform/1.0 (contact@urutix.com)';

// ── In-memory cache ───────────────────────────────────────────────────────────
// Key: "lat,lng" rounded to 4 decimal places (~11 m precision, plenty for display)
const cache = new Map<string, string>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

// ── Request queue (1 req/sec rate-limit) ─────────────────────────────────────
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    await new Promise(r => setTimeout(r, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
  return fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
  });
}

// ── Core reverse-geocode function ─────────────────────────────────────────────
/**
 * Returns a human-readable place name for the given coordinates.
 * Result is cached for the lifetime of the page.
 *
 * Falls back to a formatted coordinate string on any error.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = cacheKey(lat, lng);

  if (cache.has(key)) {
    return cache.get(key)!;
  }

  try {
    const url = `${NOMINATIM_BASE}?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await rateLimitedFetch(url);

    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

    const data = await res.json();

    const addr = data.address || {};
    // Build a compact "City, Country" or best available label
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      '';
    const state = addr.state || addr.region || '';
    const country = addr.country || '';

    let label = '';
    if (city && country) {
      label = state && state !== city ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
    } else if (data.display_name) {
      // Trim the verbose Nominatim display_name to first 3 comma-parts
      label = data.display_name.split(',').slice(0, 3).join(',').trim();
    } else {
      label = formatCoords(lat, lng);
    }

    cache.set(key, label);
    return label;
  } catch (err) {
    console.warn(`[geocoding] reverseGeocode(${lat}, ${lng}) failed:`, err);
    const fallback = formatCoords(lat, lng);
    cache.set(key, fallback); // cache the fallback so we don't retry forever
    return fallback;
  }
}

/** Formats raw coordinates as a readable fallback, e.g. "17.4240°S, 40.0781°E" */
export function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}
