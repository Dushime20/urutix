import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  Schedule as ScheduleIcon,
  Business as CarrierIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { EnhancedTable, type Column } from '../../components/EnliteUI/Tables/EnhancedTable';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../services/analyticsApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`operational-tabpanel-${index}`}
      aria-labelledby={`operational-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

import DataCard from '../../components/EnliteUI/Cards/DataCard';

export const OperationalAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  // Fetch operational analytics data
  const { data: performanceData, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['analytics', 'operational', 'performance', user?.tenantId],
    queryFn: () => analyticsApi.getOperationalPerformance(),
    enabled: !!user?.tenantId
  });

  const { data: routeData, isLoading: routeLoading } = useQuery({
    queryKey: ['analytics', 'operational', 'routes', user?.tenantId],
    queryFn: () => analyticsApi.getRoutePerformance(),
    enabled: !!user?.tenantId
  });

  const { data: carrierData, isLoading: carrierLoading } = useQuery({
    queryKey: ['analytics', 'operational', 'carriers', user?.tenantId],
    queryFn: () => analyticsApi.getCarrierPerformance(),
    enabled: !!user?.tenantId
  });

  const { data: benchmarkData, isLoading: benchmarkLoading } = useQuery({
    queryKey: ['analytics', 'operational', 'benchmarks', user?.tenantId],
    queryFn: () => analyticsApi.getIndustryBenchmarks(),
    enabled: !!user?.tenantId
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (performanceError) {
    return (
      <div className="p-6">
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          Failed to load operational analytics: {(performanceError as any).message}
        </Alert>
      </div>
    );
  }

  // Route performance table columns
  const routeColumns: Column[] = [
    { key: 'route', label: 'TRANSIT ROUTE', width: '200px' },
    { key: 'shipmentCount', label: 'VOLUME', width: '100px', align: 'right' },
    { key: 'averageCost', label: 'AVG COST', width: '120px', align: 'right', render: (value: number) => `₦${value?.toLocaleString()}` },
    { key: 'onTimeRate', label: 'O.T.P %', width: '100px', align: 'right', render: (value: number) => `${value?.toFixed(1)}%` },
    { key: 'averageTransitTime', label: 'TIME (HRS)', width: '140px', align: 'right', render: (value: number) => value?.toFixed(1) },
  ];

  // Carrier performance table columns
  const carrierColumns: Column[] = [
    { key: 'carrierId', label: 'PROVIDER ID', width: '150px' },
    { key: 'totalShipments', label: 'FLOW', width: '100px', align: 'right' },
    { key: 'onTimeRate', label: 'O.T.P %', width: '100px', align: 'right', render: (value: number) => `${value?.toFixed(1)}%` },
    { key: 'averageRating', label: 'RATING', width: '100px', align: 'right', render: (value: number) => value?.toFixed(1) },
    { key: 'reliabilityScore', label: 'TRUST INDEX', width: '100px', align: 'right', render: (value: number) => `${value}/100` },
    { key: 'recommendation', label: 'STATUS', width: '120px' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Performance Summary Matrix */}
      {performanceLoading ? (
        <Grid container spacing={3}>
           {[1,2,3,4].map(i => (
             <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
               <div className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse" />
             </Grid>
           ))}
        </Grid>
      ) : performanceData && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="TOTAL SHIPMENTS"
              value={performanceData.totalShipments}
              subtitle="TOTAL COMPLETED"
              icon={<ShippingIcon />}
              color="primary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="ON-TIME RATE"
              value={`${performanceData.onTimeRate?.toFixed(1) || 0}%`}
              subtitle="ON-TIME PERFORMANCE"
              icon={<ScheduleIcon />}
              color="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="CARRIERS"
              value={performanceData.activeCarriers}
              subtitle="ACTIVE PROVIDERS"
              icon={<CarrierIcon />}
              color="secondary"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="EFFICIENCY"
              value={`${performanceData.efficiencyScore?.toFixed(0) || 0}/100`}
              subtitle="OVERALL RATING"
              icon={<TrendingUpIcon />}
              color="warning"
            />
          </Grid>
        </Grid>
      )}

      {/* Operational Performance Details */}
      <DataCard
        title="OPERATIONAL PERFORMANCE"
        subtitle="View details for routes and carriers"
      >
        <Box sx={{ mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'slate.100', mb: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              sx={{
                '& .MuiTab-root': {
                  fontSize: '9px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  minHeight: '48px',
                  color: 'slate.400'
                }
              }}
            >
              <Tab label="Route performance" />
              <Tab label="Carrier analysis" />
              <Tab label="Market comparison" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Route Performance Details</h5>
              </div>
              <EnhancedTable
                data={routeData || []}
                columns={routeColumns}
                loading={routeLoading}
                emptyMessage="No route data available in current cycle"
              />
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <div className="space-y-4">
               <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Carrier Performance Details</h5>
              <EnhancedTable
                data={carrierData || []}
                columns={carrierColumns}
                loading={carrierLoading}
                emptyMessage="No provider data available in current cycle"
              />
            </div>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <div className="space-y-6">
              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Market Comparison</h5>
              {benchmarkLoading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress size={24} />
                </Box>
              ) : benchmarkData ? (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-4 tracking-widest">Internal Performance</h6>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Avg Cost</span>
                          <span className="text-[11px] font-black text-slate-900">₦{benchmarkData.userPerformance?.averageCost?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">On-time arrival</span>
                          <span className="text-[11px] font-black text-slate-900">{benchmarkData.userPerformance?.onTimeRate?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Average time</span>
                          <span className="text-[11px] font-black text-slate-900">{benchmarkData.userPerformance?.averageTransitTime?.toFixed(1) || 0} H</span>
                        </div>
                      </div>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="p-5 rounded-2xl bg-[#345E85]/5 border border-[#345E85]/10">
                      <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-4 tracking-widest">Market Standard</h6>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[#345E85] uppercase opacity-60">Avg Cost</span>
                          <span className="text-[11px] font-black text-[#345E85]">₦{benchmarkData.marketBenchmarks?.averageCost?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[#345E85] uppercase opacity-60">On-time arrival</span>
                          <span className="text-[11px] font-black text-[#345E85]">{benchmarkData.marketBenchmarks?.onTimeRate?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-[#345E85] uppercase opacity-60">Average time</span>
                          <span className="text-[11px] font-black text-[#345E85]">{benchmarkData.marketBenchmarks?.averageTransitTime?.toFixed(1) || 0} H</span>
                        </div>
                      </div>
                    </div>
                  </Grid>
                </Grid>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Not enough data for market comparison yet. Continue operations to see how you compare.
                  </p>
                </div>
              )}
            </div>
          </TabPanel>
        </Box>
      </DataCard>
    </div>
  );
};

export default OperationalAnalytics;