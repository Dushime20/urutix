import React from 'react';
import { useReverseGeocode } from '../../hooks/useReverseGeocode';

interface LocationLabelProps {
  /**
   * Pre-resolved address string. If empty/absent AND coordinates are provided,
   * the component will reverse-geocode them via Nominatim.
   */
  address?: string;
  /** Latitude — used for reverse geocoding when `address` is absent */
  lat?: number | null;
  /** Longitude — used for reverse geocoding when `address` is absent */
  lng?: number | null;
  /** Fallback text when neither address nor coordinates are available */
  fallback?: string;
  /** Extra CSS classes applied to the outer element */
  className?: string;
  /** Tailwind classes for the loading skeleton (default: subtle pulse) */
  skeletonClassName?: string;
}

/**
 * Renders a location name, automatically reverse-geocoding lat/lng to a real
 * place name when only coordinates are available.
 *
 * Usage:
 * ```tsx
 * <LocationLabel
 *   address={getPickupAddress(load)}   // may be ''
 *   lat={getPickupCoords(load)?.lat}
 *   lng={getPickupCoords(load)?.lng}
 *   fallback="Not Specified"
 *   className="text-sm font-medium text-slate-900"
 * />
 * ```
 */
const LocationLabel: React.FC<LocationLabelProps> = ({
  address,
  lat,
  lng,
  fallback = 'Not Specified',
  className = '',
  skeletonClassName = 'h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse inline-block',
}) => {
  // Only geocode if there's no usable address but we have coordinates
  const needsGeocode = !address && lat != null && lng != null;
  const { label, loading } = useReverseGeocode(
    needsGeocode ? lat : null,
    needsGeocode ? lng : null,
  );

  if (address) {
    return <span className={className}>{address}</span>;
  }

  if (loading) {
    return <span className={skeletonClassName} aria-label="Loading location…" />;
  }

  return (
    <span className={className}>
      {label || fallback}
    </span>
  );
};

export default LocationLabel;
