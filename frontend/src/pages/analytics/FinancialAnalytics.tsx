import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { StandardDataTable, type Column } from '../../components/EnliteUI/Tables';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi, type CostFilters } from '../../services/analyticsApi';
import { CostTrendsChart } from '../../components/Analytics/CostTrendsChart';
import { ProfitabilityChart } from '../../components/Analytics/ProfitabilityChart';
import { useTranslation } from '../../hooks/useTranslation';
import DataCard from '../../components/EnliteUI/Cards/DataCard';

// ── Currency helpers ──────────────────────────────────────────────────────────
// Default symbol is $ — change here to update the entire page at once
const CURRENCY_SYMBOL = '$';

/**
 * Format a numeric (or string-numeric) value as a currency string.
 * Falls back to "$0" when the value is null / undefined / NaN.
 */
const fmtMoney = (
  value: number | string | null | undefined,
  decimals = 0,
): string => {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/** Safe percentage formatter — returns "0%" on bad input */
const fmtPct = (value: number | null | undefined, decimals = 1): string => {
  if (value == null || isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
};

/** Safe integer formatter — returns "0" on bad input */
const fmtCount = (value: number | null | undefined): string => {
  if (value == null || isNaN(value)) return '0';
  return value.toLocaleString('en-US');
};
// ─────────────────────────────────────────────────────────────────────────────

const FinancialAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { tSync } = useTranslation();

  const [filters, setFilters] = useState<CostFilters>({
    timeRange: 'last_30_days',
    groupBy: 'week',
  });

  // ── Data fetching ───────────────────────────────────────────────────────────
  const {
    data: costTrends,
    isLoading: trendsLoading,
    error: trendsError,
  } = useQuery({
    queryKey: ['analytics', 'cost-trends', user?.tenantId, filters],
    queryFn: () => analyticsApi.getCostTrends(filters),
    enabled: !!user?.tenantId,
  });

  const {
    data: profitability,
    isLoading: profitabilityLoading,
  } = useQuery({
    queryKey: ['analytics', 'profitability', user?.tenantId, filters],
    queryFn: () => analyticsApi.getShipmentProfitability(filters),
    enabled: !!user?.tenantId,
  });

  const {
    data: financialSummary,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ['analytics', 'financial-summary', user?.tenantId, filters],
    queryFn: () => analyticsApi.getFinancialSummary(filters),
    enabled: !!user?.tenantId,
  });

  const handleFilterChange = (field: keyof CostFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // ── Error state ─────────────────────────────────────────────────────────────
  if (trendsError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load analytics data: {(trendsError as any)?.message ?? 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  // ── Table columns ───────────────────────────────────────────────────────────
  const categoryColumns: Column[] = [
    {
      key: 'category',
      label: 'CATEGORY NAME',
      width: '250px',
      render: (value: any) => value ?? '—',
    },
    {
      key: 'amount',
      label: `TOTAL AMOUNT (${CURRENCY_SYMBOL})`,
      width: '160px',
      align: 'right',
      render: (value: any) => fmtMoney(value),
    },
    {
      key: 'percentage',
      label: 'SHARE %',
      width: '120px',
      align: 'right',
      render: (value: any) => fmtPct(value),
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
            <TrendingUpIcon sx={{ fontSize: 18 }} className="text-[#345E85]" />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Data Filters</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Adjust timeframes and grouping</p>
          </div>
        </div>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Time Range
              </InputLabel>
              <Select
                value={filters.timeRange || 'last_30_days'}
                label="Time Range"
                onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
              >
                <MenuItem value="last_7_days">Last 7 Days</MenuItem>
                <MenuItem value="last_30_days">Last 30 Days</MenuItem>
                <MenuItem value="last_90_days">Last 90 Days</MenuItem>
                <MenuItem value="last_6_months">Last 6 Months</MenuItem>
                <MenuItem value="last_year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                Group By
              </InputLabel>
              <Select
                value={filters.groupBy || 'week'}
                label="Group By"
                onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                sx={{ borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="quarter">Quarter</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </div>

      {/* ── Charts ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <DataCard title="COST TRENDS" subtitle="Spending over time">
            {trendsLoading ? (
              <Box display="flex" justifyContent="center" p={8}>
                <CircularProgress size={32} thickness={5} />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <CostTrendsChart
                  data={costTrends?.trends || []}
                  currencySymbol={CURRENCY_SYMBOL}
                />
              </Box>
            )}
          </DataCard>
        </div>

        <div className="lg:col-span-1">
          <DataCard title="PROFITABILITY" subtitle="Profit analysis by shipment">
            {profitabilityLoading ? (
              <Box display="flex" justifyContent="center" p={8}>
                <CircularProgress size={32} thickness={5} />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <ProfitabilityChart data={profitability} />
              </Box>
            )}
          </DataCard>
        </div>
      </div>

      {/* ── Spending Categories ───────────────────────────────────────────────── */}
      {financialSummary?.topCategories && financialSummary.topCategories.length > 0 && (
        <DataCard
          title="EXPENDITURE CATEGORIES"
          subtitle={`Money spent by category (${CURRENCY_SYMBOL})`}
        >
          <div className="mt-4">
            <StandardDataTable
              embedded
              data={financialSummary.topCategories}
              columns={categoryColumns}
              loading={summaryLoading}
              emptyMessage="No spending data available for this selection"
              searchPlaceholder="Search categories..."
              stickyHeader
              columnVisibility
              pagination
            />
          </div>
        </DataCard>
      )}

      {/* Empty state when no data at all */}
      {!trendsLoading && !summaryLoading && !costTrends && !financialSummary && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUpIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 2 }} />
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            No financial data available for the selected period
          </p>
          <p className="text-xs text-slate-300 mt-1">
            Try adjusting the time range filter above
          </p>
        </div>
      )}
    </div>
  );
};

export default FinancialAnalytics;
