import React from 'react';

interface PerformanceMetricsProps {
  tenantId?: string;
  className?: string;
}

/** Non-overview performance view — KPI/stat cards removed (use overview QuickStats). */
const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  className = '',
}) => {
  return <div className={className} />;
};

export default PerformanceMetrics;
