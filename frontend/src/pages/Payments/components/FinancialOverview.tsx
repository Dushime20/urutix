import React from 'react';
import type { FinancialSummary } from '../types';

interface FinancialOverviewProps {
  summary: FinancialSummary;
  isLoading?: boolean;
}

/** KPI strip removed — keep component for call-site compatibility. */
const FinancialOverview: React.FC<FinancialOverviewProps> = () => null;

export default FinancialOverview;
