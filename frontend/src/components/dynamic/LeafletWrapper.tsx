import React, { Suspense, lazy } from 'react';

// Loading fallback component
export const MapLoadingFallback = () => (
  <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  </div>
);

// Dynamically import react-leaflet components
const ReactLeafletModule = lazy(() => import('react-leaflet'));

// Leaflet core can be imported normally (needed for Icon)
export { Icon } from 'leaflet';

// Import leaflet CSS (this is small, can be loaded upfront)
import 'leaflet/dist/leaflet.css';

// Wrapper components for react-leaflet with loading state
export const MapContainer: React.FC<any> = (props) => {
  const LazyMapContainer = lazy(() => 
    import('react-leaflet').then(m => ({ default: m.MapContainer }))
  );
  return (
    <Suspense fallback={<MapLoadingFallback />}>
      <LazyMapContainer {...props} />
    </Suspense>
  );
};

export const TileLayer: React.FC<any> = (props) => {
  const LazyTileLayer = lazy(() => 
    import('react-leaflet').then(m => ({ default: m.TileLayer }))
  );
  return (
    <Suspense fallback={null}>
      <LazyTileLayer {...props} />
    </Suspense>
  );
};

export const Marker: React.FC<any> = (props) => {
  const LazyMarker = lazy(() => 
    import('react-leaflet').then(m => ({ default: m.Marker }))
  );
  return (
    <Suspense fallback={null}>
      <LazyMarker {...props} />
    </Suspense>
  );
};

export const Popup: React.FC<any> = (props) => {
  const LazyPopup = lazy(() => 
    import('react-leaflet').then(m => ({ default: m.Popup }))
  );
  return (
    <Suspense fallback={null}>
      <LazyPopup {...props} />
    </Suspense>
  );
};

export const Polyline: React.FC<any> = (props) => {
  const LazyPolyline = lazy(() => 
    import('react-leaflet').then(m => ({ default: m.Polyline }))
  );
  return (
    <Suspense fallback={null}>
      <LazyPolyline {...props} />
    </Suspense>
  );
};

// Hooks need to be used differently - export them normally but they'll be lazy loaded with the component
export { useMap, useMapEvents } from 'react-leaflet';

