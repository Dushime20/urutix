/**
 * Safely turn API location values into a display string.
 * Loads/trips often return either a plain string or
 * `{ lat, lng, city, address, country }` (and similar shapes).
 * Rendering the object directly throws React error #31.
 */
export function formatLocation(loc: unknown, fallback = ''): string {
  if (loc == null || loc === '') return fallback;
  if (typeof loc === 'string') return loc;
  if (typeof loc === 'number' || typeof loc === 'boolean') return String(loc);
  if (typeof loc === 'object') {
    const o = loc as Record<string, unknown>;
    const city = typeof o.city === 'string' ? o.city.trim() : '';
    const address = typeof o.address === 'string' ? o.address.trim() : '';
    const name = typeof o.name === 'string' ? o.name.trim() : '';
    const country = typeof o.country === 'string' ? o.country.trim() : '';
    const state = typeof o.state === 'string' ? o.state.trim() : '';

    if (city && country) return `${city}, ${country}`;
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (address) return address;
    if (name) return name;
    if (country) return country;
  }
  return fallback;
}
