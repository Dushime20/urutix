import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid,
  Box,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { StandardDataTable, type Column } from '../../components/EnliteUI/Tables';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../services/analyticsApi';
import DataCard from '../../components/EnliteUI/Cards/DataCard';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

// ── Formatters (non-currency) ─────────────────────────────────────────────────
const fmtPct = (v: number | null | undefined) => v == null || isNaN(v) ? '—' : `${v.toFixed(1)}%`;
const fmtNum = (v: number | null | undefined) => v == null || isNaN(v) ? '—' : v.toLocaleString('en-US');
const fmtHrs = (v: number | null | undefined) => v == null || isNaN(v) ? '—' : `${v.toFixed(1)} h`;

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const OperationalAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const { compact: fmtMoney, currency } = useCurrencyFormat();


  const { data: routeData, isLoading: routeLoading } = useQuery({
    queryKey: ['analytics', 'operational', 'routes', user?.tenantId],
    queryFn: () => analyticsApi.getRoutePerformance(),
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const { data: carrierData, isLoading: carrierLoading } = useQuery({
    queryKey: ['analytics', 'operational', 'carriers', user?.tenantId],
    queryFn: () => analyticsApi.getCarrierPerformance(),
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });

  const { data: benchmarkData, isLoading: benchmarkLoading } = useQuery({
    queryKey: ['analytics', 'operational', 'benchmarks', user?.tenantId],
    queryFn: () => analyticsApi.getIndustryBenchmarks(),
    enabled: !!user?.tenantId,
    retry: (failureCount, error: any) => error?.response?.status !== 403 && failureCount < 2,
  });


  // ── Table columns ───────────────────────────────────────────────────────────
  const routeColumns: Column[] = [
    { key: 'route',               label: 'TRANSIT ROUTE',  width: '200px' },
    { key: 'shipmentCount',       label: 'VOLUME',         width: '100px', align: 'right', render: (v) => fmtNum(v) },
    { key: 'averageCost', label: `AVG COST (${currency})`, width: '140px', align: 'right', render: (v) => fmtMoney(v) },
    { key: 'onTimeRate',          label: 'ON-TIME %',      width: '110px', align: 'right', render: (v) => fmtPct(v) },
    { key: 'averageTransitTime',  label: 'TRANSIT TIME',   width: '130px', align: 'right', render: (v) => fmtHrs(v) },
  ];

  const carrierColumns: Column[] = [
    { key: 'carrierId',       label: 'PROVIDER ID',  width: '150px' },
    { key: 'totalShipments',  label: 'SHIPMENTS',    width: '110px', align: 'right', render: (v) => fmtNum(v) },
    { key: 'onTimeRate',      label: 'ON-TIME %',    width: '110px', align: 'right', render: (v) => fmtPct(v) },
    { key: 'averageRating',   label: 'RATING',       width: '100px', align: 'right', render: (v) => v?.toFixed(1) ?? '—' },
    { key: 'reliabilityScore',label: 'TRUST INDEX',  width: '120px', align: 'right', render: (v) => v != null ? `${v}/100` : '—' },
    { key: 'recommendation',  label: 'STATUS',       width: '130px' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Detail Tabs ─────────────────────────────────────────────────────── */}
      <DataCard title="OPERATIONAL PERFORMANCE" subtitle="Routes, carriers and market comparison">
        <Box sx={{ mt: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              sx={{ '& .MuiTab-root': { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', minHeight: '48px' } }}
            >
              <Tab label="Route Performance" />
              <Tab label="Carrier Analysis" />
              <Tab label="Market Comparison" />
            </Tabs>
          </Box>

          {/* Route Performance */}
          <TabPanel value={tabValue} index={0}>
            <div className="space-y-4">
              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Route Performance Details</h5>
              <StandardDataTable
                embedded
                data={routeData || []}
                columns={routeColumns}
                loading={routeLoading}
                emptyMessage="No route data available yet"
                searchPlaceholder="Search routes..."
                stickyHeader
                columnVisibility
                pagination
              />
            </div>
          </TabPanel>

          {/* Carrier Analysis */}
          <TabPanel value={tabValue} index={1}>
            <div className="space-y-4">
              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Carrier Performance Details</h5>
              <StandardDataTable
                embedded
                data={carrierData || []}
                columns={carrierColumns}
                loading={carrierLoading}
                emptyMessage="No carrier data available yet"
                searchPlaceholder="Search carriers..."
                stickyHeader
                columnVisibility
                pagination
              />
            </div>
          </TabPanel>

          {/* Market Comparison */}
          <TabPanel value={tabValue} index={2}>
            <div className="space-y-6">
              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Market Comparison</h5>
              {benchmarkLoading ? (
                <Box display="flex" justifyContent="center" p={4}><CircularProgress size={24} /></Box>
              ) : benchmarkData ? (
                <Grid container spacing={3}>
                  {/* Your performance */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-4 tracking-widest">Your Performance</h6>
                      <div className="space-y-3">
                        {[
                          { label: 'Avg Cost',     value: fmtMoney(benchmarkData.userPerformance?.averageCost) },
                          { label: 'On-Time Rate', value: fmtPct(benchmarkData.userPerformance?.onTimeRate) },
                          { label: 'Avg Transit',  value: fmtHrs(benchmarkData.userPerformance?.averageTransitTime) },
                          { label: 'Shipments',    value: fmtNum(benchmarkData.userPerformance?.totalShipments) },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{label}</span>
                            <span className="text-[11px] font-black text-slate-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Grid>
                  {/* Market standard */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className="p-5 rounded-2xl bg-[#345E85]/5 border border-[#345E85]/10">
                      <h6 className="text-[10px] font-black text-[#345E85] uppercase mb-4 tracking-widest">Market Standard</h6>
                      <div className="space-y-3">
                        {[
                          { label: 'Avg Cost',     value: fmtMoney(benchmarkData.marketBenchmarks?.averageCost) },
                          { label: 'On-Time Rate', value: fmtPct(benchmarkData.marketBenchmarks?.onTimeRate) },
                          { label: 'Avg Transit',  value: fmtHrs(benchmarkData.marketBenchmarks?.averageTransitTime) },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-[#345E85] uppercase opacity-60">{label}</span>
                            <span className="text-[11px] font-black text-[#345E85]">{value}</span>
                          </div>
                        ))}
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
