/**
 * Date/time conversion utilities for form inputs.
 *
 * HTML `datetime-local` inputs produce strings like "2026-07-01T10:00" with
 * NO timezone information. The browser treats these as local time, but
 * `new Date("2026-07-01T10:00")` is parsed as UTC by the JS engine —
 * which is WRONG and causes timestamps to be offset by the user's UTC offset.
 *
 * All dates sent to the backend must be proper UTC ISO 8601 strings
 * (e.g. "2026-07-01T08:00:00.000Z") so the backend can compare them
 * against `new Date()` correctly.
 */

/**
 * Converts a `datetime-local` input value (local time, no timezone) to a
 * UTC ISO string. Returns an empty string if the input is empty/falsy.
 *
 * @example
 * localToUTC("2026-07-01T10:00")  // → "2026-07-01T07:00:00.000Z"  (UTC+3 browser)
 */
export function localToUTC(localDatetime: string): string {
  if (!localDatetime) return '';
  return new Date(localDatetime).toISOString();
}

/**
 * Converts a UTC ISO string (from the API/DB) back to a `datetime-local`
 * input value (local time, no timezone suffix) so the browser renders the
 * correct local time in the input.
 *
 * @example
 * utcToLocal("2026-07-01T07:00:00.000Z")  // → "2026-07-01T10:00"  (UTC+3 browser)
 */
export function utcToLocal(utcString: string): string {
  if (!utcString) return '';
  const d = new Date(utcString);
  const offset = d.getTimezoneOffset(); // minutes behind UTC (positive = west)
  const local = new Date(d.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}
