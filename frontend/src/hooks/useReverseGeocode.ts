import { useState, useEffect } from 'react';
import { reverseGeocode, formatCoords } from '../utils/geocoding';

interface UseReverseGeocodeResult {
  /** Human-readable place name (or coordinate fallback) */
  label: string;
  /** True while the Nominatim request is in flight */
  loading: boolean;
}

/**
 * Hook that reverse-geocodes a lat/lng pair into a place name.
 *
 * If `lat` or `lng` is undefined/null the hook returns an empty string immediately.
 * Results are cached globally so repeated renders for the same coordinates
 * never fire duplicate network requests.
 *
 * @example
 * const { label, loading } = useReverseGeocode(-17.4240, 40.0781);
 * // label → "Quelimane, Zambézia Province, Mozambique"
 */
export function useReverseGeocode(
  lat: number | null | undefined,
  lng: number | null | undefined,
): UseReverseGeocodeResult {
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat == null || lng == null) {
      setLabel('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    reverseGeocode(lat, lng).then(result => {
      if (!cancelled) {
        setLabel(result);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [lat, lng]);

  return { label, loading };
}

/**
 * Hook that resolves an address string that may be raw coordinates
 * like "-17.4240, 40.0781" into a real place name.
 *
 * If the string doesn't look like coordinates it's returned as-is.
 */
export function useResolvedAddress(address: string | undefined): UseReverseGeocodeResult {
  const coords = parseCoordinateString(address);
  const geo = useReverseGeocode(coords?.lat, coords?.lng);

  if (!address) return { label: '', loading: false };
  if (!coords) return { label: address, loading: false };
  return geo;
}

// ── helpers ───────────────────────────────────────────────────────────────────

/** Parses strings like "-17.4240, 40.0781" or "-17.4240,40.0781" */
function parseCoordinateString(s: string | undefined): { lat: number; lng: number } | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
