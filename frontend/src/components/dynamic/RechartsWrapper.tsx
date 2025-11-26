import React, { Suspense, lazy } from 'react';

// Loading fallback component
export const ChartLoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
      <p className="text-sm text-gray-500">Loading chart...</p>
    </div>
  </div>
);

// Dynamically import recharts - load the entire library lazily
const RechartsModule = lazy(() => import('recharts'));

// Re-export all recharts components through a wrapper
export const RechartsComponents = {
  LineChart: lazy(() => import('recharts').then(m => ({ default: m.LineChart }))),
  BarChart: lazy(() => import('recharts').then(m => ({ default: m.BarChart }))),
  PieChart: lazy(() => import('recharts').then(m => ({ default: m.PieChart }))),
  AreaChart: lazy(() => import('recharts').then(m => ({ default: m.AreaChart }))),
  RadarChart: lazy(() => import('recharts').then(m => ({ default: m.RadarChart }))),
};

// Export smaller components normally (they're part of the main bundle)
export { 
  Line, 
  Bar, 
  Pie, 
  Area,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Wrapper components for large chart components
export const LineChart: React.FC<any> = (props) => {
  const LazyLineChart = RechartsComponents.LineChart;
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyLineChart {...props} />
    </Suspense>
  );
};

export const BarChart: React.FC<any> = (props) => {
  const LazyBarChart = RechartsComponents.BarChart;
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyBarChart {...props} />
    </Suspense>
  );
};

export const PieChart: React.FC<any> = (props) => {
  const LazyPieChart = RechartsComponents.PieChart;
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyPieChart {...props} />
    </Suspense>
  );
};

export const AreaChart: React.FC<any> = (props) => {
  const LazyAreaChart = RechartsComponents.AreaChart;
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyAreaChart {...props} />
    </Suspense>
  );
};

export const RadarChart: React.FC<any> = (props) => {
  const LazyRadarChart = RechartsComponents.RadarChart;
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyRadarChart {...props} />
    </Suspense>
  );
};

