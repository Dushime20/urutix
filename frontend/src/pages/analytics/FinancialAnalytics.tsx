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
  LocalShipping as ShippingIcon,
  Inventory as InventoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { EnhancedTable, type Column } from '../../components/EnliteUI/Tables/EnhancedTable';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi, type CostFilters } from '../../services/analyticsApi';
import { CostTrendsChart } from '../../components/Analytics/CostTrendsChart';
import { ProfitabilityChart } from '../../components/Analytics/ProfitabilityChart';

import DataCard from '../../components/EnliteUI/Cards/DataCard';

const FinancialAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CostFilters>({
    timeRange: 'last_30_days',
    groupBy: 'week',
  });

  // Fetch financial analytics data
  const { 
    data: costTrends, 
    isLoading: trendsLoading, 
    error: trendsError 
  } = useQuery({
    queryKey: ['analytics', 'cost-trends', user?.tenantId, filters],
    queryFn: () => analyticsApi.getCostTrends(filters),
    enabled: !!user?.tenantId
  });

  const { 
    data: profitability, 
    isLoading: profitabilityLoading 
  } = useQuery({
    queryKey: ['analytics', 'profitability', user?.tenantId, filters],
    queryFn: () => analyticsApi.getShipmentProfitability(filters),
    enabled: !!user?.tenantId
  });

  const { 
    data: financialSummary, 
    isLoading: summaryLoading 
  } = useQuery({
    queryKey: ['analytics', 'financial-summary', user?.tenantId, filters],
    queryFn: () => analyticsApi.getFinancialSummary(filters),
    enabled: !!user?.tenantId
  });

  const handleFilterChange = (field: keyof CostFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (trendsError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load analytics data: {(trendsError as any).message}
        </Alert>
      </Box>
    );
  }

  // Categories table columns
  const categoryColumns: Column[] = [
    { key: 'category', label: 'CATEGORY NAME', width: '250px' },
    { key: 'amount', label: 'TOTAL AMOUNT', width: '150px', align: 'right', render: (value: number) => `₦${value?.toLocaleString()}` },
    { key: 'percentage', label: 'SHARE %', width: '150px', align: 'right', render: (value: number) => `${value?.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Filters Hub */}
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
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Time Range</InputLabel>
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
              <InputLabel sx={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Group By</InputLabel>
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

      {/* Summary Matrix */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="TOTAL COST"
            value={costTrends?.totalCost ? `₦${costTrends.totalCost.toLocaleString()}` : '-'}
            subtitle="TOTAL SPENT"
            trend={costTrends?.costChangePercentage?.toString() || '0'}
            trendDirection={(costTrends?.costChangePercentage ?? 0) > 0 ? 'up' : (costTrends?.costChangePercentage ?? 0) < 0 ? 'down' : 'neutral'}
            icon={<TrendingUpIcon />}
            loading={trendsLoading}
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="AVERAGE UNIT"
            value={costTrends?.averageCostPerShipment ? `₦${costTrends.averageCostPerShipment.toFixed(2)}` : '-'}
            subtitle="COST PER SHIPMENT"
            icon={<ShippingIcon />}
            loading={trendsLoading}
            color="secondary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="VOLUME LOG"
            value={costTrends?.totalShipments?.toString() || '-'}
            subtitle="TOTAL SHIPMENT COUNT"
            icon={<InventoryIcon />}
            loading={trendsLoading}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="EFFICIENCY"
            value={financialSummary?.efficiency?.overallEfficiency ? 
              `${financialSummary.efficiency.overallEfficiency}%` : '-'}
            subtitle="FINANCIAL EFFICIENCY"
            icon={<SpeedIcon />}
            loading={summaryLoading}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <DataCard
            title="COST TRENDS"
            subtitle="Spending over time"
          >
            {trendsLoading ? (
              <Box display="flex" justifyContent="center" p={8}>
                <CircularProgress size={32} thickness={5} />
              </Box>
            ) : (
              <Box sx={{ mt: 2 }}>
                <CostTrendsChart data={costTrends?.trends || []} />
              </Box>
            )}
          </DataCard>
        </div>
        
        <div className="lg:col-span-1">
          <DataCard
            title="PROFITABILITY"
            subtitle="Profit analysis by shipment"
          >
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

      {/* Spending Categories */}
      {financialSummary?.topCategories && (
        <DataCard
          title="EXPENDITURE CATEGORIES"
          subtitle="Money spent by category"
        >
          <div className="mt-4">
            <EnhancedTable
              data={financialSummary.topCategories}
              columns={categoryColumns}
              loading={summaryLoading}
              emptyMessage="No spending data available for this selection"
            />
          </div>
        </DataCard>
      )}
    </div>
  );
};

export default FinancialAnalytics;