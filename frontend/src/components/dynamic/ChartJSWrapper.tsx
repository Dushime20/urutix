import React, { Suspense, lazy } from 'react';

// Lazy load react-chartjs-2 components
export const Line = lazy(() => 
  import('react-chartjs-2').then(module => ({ default: module.Line }))
);
export const Bar = lazy(() => 
  import('react-chartjs-2').then(module => ({ default: module.Bar }))
);
export const Doughnut = lazy(() => 
  import('react-chartjs-2').then(module => ({ default: module.Doughnut }))
);
export const Pie = lazy(() => 
  import('react-chartjs-2').then(module => ({ default: module.Pie }))
);
export const Radar = lazy(() => 
  import('react-chartjs-2').then(module => ({ default: module.Radar }))
);

// Chart.js core can be imported normally (it's needed for registration)
export {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';

// Loading fallback component
export const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
      <p className="text-sm text-gray-500">Loading chart...</p>
    </div>
  </div>
);

// Wrapper component for Chart.js charts with loading state
interface ChartJSWrapperProps {
  children: React.ReactNode;
}

export const ChartJSWrapper: React.FC<ChartJSWrapperProps> = ({ children }) => {
  return (
    <React.Suspense fallback={<ChartLoadingFallback />}>
      {children}
    </React.Suspense>
  );
};

