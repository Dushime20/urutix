import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Box,
  Tabs,
  Tab,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { TranslatedText } from '../../components/translated-text';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Language as GeoIcon,
  Settings as HealthIcon,
  ShoppingCart as CargoIcon,
  LocalShipping as FleetIcon,
  Dashboard as OverviewIcon,
  Update as RealTimeIcon,
  AttachMoney as MoneyIcon,
  People as UsersIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Bolt as PerformanceIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { StatCard, DataCard } from '../../components/EnliteUI';
import { adminAPI } from '../../services/adminApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      <AnimatePresence mode="wait">
        {value === index && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ py: 3 }}>
              {children}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const AnalyticsManagement: React.FC = () => {
  const { theme } = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [timeRange, setTimeRange] = useState('7d');
  const [isRealTime, setIsRealTime] = useState(false);
  const [loading, setLoading] = useState(false);

  // Real data state
  const [overviewData, setOverviewData] = useState<any>(null);
  const [cargoData, setCargoData] = useState<any>(null);
  const [fleetData, setFleetData] = useState<any>(null);
  const [systemData, setSystemData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchAll = async () => {
    try {
      setDataLoading(true);
      const [ov, ca, fl, sy] = await Promise.all([
        adminAPI.getAnalyticsOverview().catch(() => null),
        adminAPI.getCargoAnalytics().catch(() => null),
        adminAPI.getFleetAnalytics().catch(() => null),
        adminAPI.getSystemVitals().catch(() => null),
      ]);
      setOverviewData(ov?.data?.data || ov?.data);
      setCargoData(ca?.data?.data || ca?.data);
      setFleetData(fl?.data?.data || fl?.data);
      setSystemData(sy?.data?.data || sy?.data);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Real-time polling
  useEffect(() => {
    if (!isRealTime) return;
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [isRealTime]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  };

  // Build radar data from real system vitals
  const platformHealthData = {
    labels: ['Memory', 'DB Health', 'Trip Success', 'Cargo Success', 'Fleet Util', 'Uptime'],
    datasets: [{
      label: 'Performance Index',
      data: [
        systemData ? Math.max(0, 100 - (systemData.system?.memoryPercent || 0)) : 0,
        systemData?.database?.status === 'connected' ? 100 : 0,
        overviewData?.stats?.matchingEfficiency || 0,
        cargoData?.stats?.bookingSuccessRate || 0,
        fleetData?.stats?.utilizationRate || 0,
        systemData ? Math.min(100, Math.round((systemData.system?.uptime || 0) / 3600)) : 0,
      ],
      backgroundColor: 'rgba(52, 94, 133, 0.2)',
      borderColor: '#345E85',
      borderWidth: 2,
      pointBackgroundColor: '#345E85',
    }]
  };

  return (
    <AdminPageLayout
      title={<TranslatedText text="Analytics Command Center" />}
      description={<TranslatedText text="Live platform intelligence, user demographics, and operational health matrix" />}
      actions={
        <div className="flex items-center gap-3">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              sx={{ 
                borderRadius: '16px', 
                fontSize: '11px', 
                fontWeight: '900', 
                backgroundColor: theme === 'dark' ? '#1e293b' : 'white',
                color: theme === 'dark' ? 'white' : 'inherit',
                border: theme === 'dark' ? '1px solid #334155' : '1px solid #f1f5f9',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '& .MuiSvgIcon-root': { color: theme === 'dark' ? '#94a3b8' : 'inherit' },
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <MenuItem value="24h"><TranslatedText text="LATEST 24H" /></MenuItem>
              <MenuItem value="7d"><TranslatedText text="PAST WEEK" /></MenuItem>
              <MenuItem value="30d"><TranslatedText text="PAST MONTH" /></MenuItem>
              <MenuItem value="90d"><TranslatedText text="QUARTERLY" /></MenuItem>
            </Select>
          </FormControl>
          
          <button
            onClick={() => setIsRealTime(!isRealTime)}
            className={`py-2.5 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-3 shadow-sm ${
              isRealTime 
                ? 'bg-emerald-500 text-white shadow-emerald-200 ring-4 ring-emerald-50' 
                : 'bg-white border border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isRealTime ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
            {isRealTime ? <TranslatedText text="LIVE SYNC ACTIVE" /> : <TranslatedText text="ACTIVATE LIVE SYNC" />}
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="py-2.5 px-6 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-[#1e3a5f] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50"
          >
            {loading ? <CircularProgress size={14} thickness={6} sx={{ color: 'white' }} /> : <OverviewIcon sx={{ fontSize: 16 }} />}
            <TranslatedText text="RE-CALIBRATE" />
          </button>
        </div>
      }
    >
      <Box sx={{ mb: 4, position: 'relative' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-flexContainer': { gap: 1 },
            '& .MuiTab-root': {
              fontSize: '10px',
              fontWeight: '900',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              minHeight: '56px',
              color: 'slate.400',
              px: 4,
              borderRadius: '16px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&.Mui-selected': {
                color: '#345E85',
                backgroundColor: 'rgba(52, 94, 133, 0.05)',
              },
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.02)',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#345E85',
              height: 3,
              borderRadius: '3px',
              bottom: 8
            }
          }}
        >
          <Tab icon={<OverviewIcon sx={{ mb: 0, fontSize: 18, mr: 1 }} />} iconPosition="start" label={<TranslatedText text="Global Overview" />} />
          <Tab icon={<CargoIcon sx={{ mb: 0, fontSize: 18, mr: 1 }} />} iconPosition="start" label={<TranslatedText text="Cargo Ecosystem" />} />
          <Tab icon={<FleetIcon sx={{ mb: 0, fontSize: 18, mr: 1 }} />} iconPosition="start" label={<TranslatedText text="Fleet Logistics" />} />
          <Tab icon={<HealthIcon sx={{ mb: 0, fontSize: 18, mr: 1 }} />} iconPosition="start" label={<TranslatedText text="System Vitals" />} />
        </Tabs>
      </Box>

      {/* Global Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <div className="space-y-10">
          {dataLoading ? (
            <div className="flex items-center justify-center h-40 gap-3">
              <CircularProgress size={28} sx={{ color: '#345E85' }} />
              <span className="text-slate-500 font-bold text-sm">Loading analytics...</span>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={<TranslatedText text="AGGREGATE REVENUE" />}
              value={`$${((overviewData?.stats?.totalRevenue || 0) / 1000).toFixed(1)}k`}
              subtitle={<TranslatedText text="GROSS REVENUE STREAM" />}
              icon={<MoneyIcon />}
              trend={`${overviewData?.stats?.totalTrips || 0} trips`}
              trendDirection="up"
              color="primary"
            />
            <StatCard
              title={<TranslatedText text="ACTIVE NETWORK" />}
              value={(overviewData?.stats?.totalUsers || 0).toLocaleString()}
              subtitle={<TranslatedText text="TOTAL REGISTERED USERS" />}
              icon={<UsersIcon />}
              trend={`${overviewData?.stats?.totalTrucks || 0} trucks`}
              trendDirection="up"
              color="info"
            />
            <StatCard
              title={<TranslatedText text="PLATFORM VELOCITY" />}
              value={`${overviewData?.stats?.matchingEfficiency || 0}%`}
              subtitle={<TranslatedText text="TRIP SUCCESS RATE" />}
              icon={<PerformanceIcon />}
              trend={`${overviewData?.stats?.completedTrips || 0} completed`}
              trendDirection="up"
              color="success"
            />
            <StatCard
              title={<TranslatedText text="ACTIVE TRIPS" />}
              value={(overviewData?.stats?.activeTrips || 0).toString()}
              subtitle={<TranslatedText text="TRIPS IN PROGRESS" />}
              icon={<SecurityIcon />}
              trend={`${overviewData?.stats?.totalLoads || 0} loads`}
              trendDirection="up"
              color="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DataCard title={<TranslatedText text="WEEKLY TRIP ACTIVITY" />} subtitle={<TranslatedText text="Trip count per week (last 8 weeks)" />} icon={<TimelineIcon />}>
                <div className="h-[360px] pt-4">
                  <Line
                    data={{
                      labels: overviewData?.weeklyTripCounts?.map((w: any) => w.label) || [],
                      datasets: [
                        {
                          label: 'TRIPS',
                          data: overviewData?.weeklyTripCounts?.map((w: any) => w.count) || [],
                          borderColor: '#345E85',
                          backgroundColor: 'rgba(52, 94, 133, 0.05)',
                          fill: true,
                          tension: 0.4,
                          borderWidth: 4,
                          pointRadius: 4,
                          pointBackgroundColor: '#fff',
                          pointBorderWidth: 2,
                        },
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'top', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true, padding: 20 } } },
                      scales: {
                        y: { grid: { color: 'rgba(226, 232, 240, 0.2)' }, border: { display: false }, ticks: { font: { weight: 'bold', size: 9 }, color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { font: { weight: 'bold', size: 9 }, color: '#64748b' } }
                      }
                    }}
                  />
                </div>
              </DataCard>
            </div>

            <div className="lg:col-span-1">
              <DataCard title={<TranslatedText text="PLATFORM VITALS" />} subtitle={<TranslatedText text="Real performance health index" />} icon={<HealthIcon />}>
                <div className="h-[360px] flex items-center justify-center pt-4">
                  <Radar
                    data={platformHealthData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { display: false },
                          grid: { color: 'rgba(226, 232, 240, 0.2)' },
                          angleLines: { color: 'rgba(226, 232, 240, 0.2)' },
                          pointLabels: { font: { weight: 'bold', size: 8 }, color: '#64748b' }
                        }
                      },
                      plugins: { legend: { display: false } }
                    }}
                  />
                </div>
              </DataCard>
            </div>
          </div>
          </>
          )}
        </div>
      </TabPanel>

      {/* Cargo Ecosystem Tab */}
      <TabPanel value={tabValue} index={1}>
        <div className="space-y-10">
          {dataLoading ? (
            <div className="flex items-center justify-center h-40 gap-3">
              <CircularProgress size={28} sx={{ color: '#345E85' }} />
              <span className="text-slate-500 font-bold text-sm">Loading cargo analytics...</span>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-blue-50 text-[#345E85] rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CargoIcon />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL LOADS</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{cargoData?.stats?.totalLoads || 0}</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400">BOOKING SUCCESS</span>
                        <span className="text-emerald-500">{cargoData?.stats?.bookingSuccessRate || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${cargoData?.stats?.bookingSuccessRate || 0}%` }} transition={{ duration: 1 }} className="h-full bg-emerald-500" />
                    </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UsersIcon />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACTIVE LOADS</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">{cargoData?.stats?.activeLoads || 0}</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400">COMPLETED</span>
                        <span className="text-indigo-500">{cargoData?.stats?.completedLoads || 0}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: cargoData?.stats?.totalLoads ? `${(cargoData.stats.completedLoads / cargoData.stats.totalLoads) * 100}%` : '0%' }} transition={{ duration: 1 }} className="h-full bg-indigo-500" />
                    </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MoneyIcon />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AVG LOAD VALUE</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-1">${(cargoData?.stats?.avgLoadValue || 0).toFixed(0)}</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400">CANCELLED</span>
                        <span className="text-red-500">{cargoData?.stats?.cancelledLoads || 0}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: cargoData?.stats?.totalLoads ? `${(cargoData.stats.cancelledLoads / cargoData.stats.totalLoads) * 100}%` : '0%' }} transition={{ duration: 1 }} className="h-full bg-red-400" />
                    </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DataCard title={<TranslatedText text="CARGO TYPE DISTRIBUTION" />} subtitle={<TranslatedText text="Load distribution by cargo category" />} icon={<PieChartIcon />}>
                <div className="h-[380px] flex items-center justify-center p-8">
                   <PolarArea
                        data={{
                            labels: cargoData?.cargoTypeBreakdown?.map((c: any) => c.label) || [],
                            datasets: [{
                                data: cargoData?.cargoTypeBreakdown?.map((c: any) => c.count) || [],
                                backgroundColor: [
                                    'rgba(52, 94, 133, 0.7)', 'rgba(16, 185, 129, 0.7)',
                                    'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)',
                                    'rgba(139, 92, 246, 0.7)', 'rgba(100, 116, 139, 0.7)',
                                    'rgba(20, 184, 166, 0.7)', 'rgba(249, 115, 22, 0.7)',
                                ],
                                borderWidth: 0
                            }]
                        }}
                        options={{
                            responsive: true, maintainAspectRatio: false,
                            plugins: { legend: { position: 'right', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true, padding: 20 } } },
                            scales: { r: { ticks: { display: false }, grid: { color: 'rgba(226, 232, 240, 0.2)' } } }
                        }}
                   />
                </div>
            </DataCard>

            <DataCard title={<TranslatedText text="MONTHLY LOAD ACTIVITY" />} subtitle={<TranslatedText text="Loads posted and completed per month" />} icon={<BarChartIcon />}>
                <div className="h-[380px] pt-4">
                  <Bar
                    data={{
                        labels: cargoData?.monthlyLoads?.map((m: any) => m.label) || [],
                        datasets: [
                            { label: 'LOADS', data: cargoData?.monthlyLoads?.map((m: any) => m.count) || [], backgroundColor: '#345E85', borderRadius: 12 },
                            { label: 'REVENUE ($)', data: cargoData?.monthlyLoads?.map((m: any) => m.revenue) || [], backgroundColor: '#10b981', borderRadius: 12 }
                        ]
                    }}
                    options={{
                        responsive: true, maintainAspectRatio: false,
                        plugins: { legend: { position: 'top', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true } } },
                        scales: { y: { grid: { display: true, color: 'rgba(226, 232, 240, 0.2)' }, border: { display: false } }, x: { grid: { display: false } } }
                    }}
                  />
                </div>
            </DataCard>
          </div>
          </>
          )}
        </div>
      </TabPanel>

      {/* Fleet Logistics Tab */}
      <TabPanel value={tabValue} index={2}>
        <div className="space-y-10">
          {dataLoading ? (
            <div className="flex items-center justify-center h-40 gap-3">
              <CircularProgress size={28} sx={{ color: '#345E85' }} />
              <span className="text-slate-500 font-bold text-sm">Loading fleet analytics...</span>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'TOTAL TRUCKS', value: fleetData?.stats?.totalTrucks || 0, color: 'bg-blue-50 text-[#345E85]', bar: 100 },
              { label: 'AVAILABLE', value: fleetData?.stats?.availableTrucks || 0, color: 'bg-emerald-50 text-emerald-600', bar: fleetData?.stats?.totalTrucks ? (fleetData.stats.availableTrucks / fleetData.stats.totalTrucks) * 100 : 0 },
              { label: 'IN TRANSIT', value: fleetData?.stats?.inTransitTrucks || 0, color: 'bg-indigo-50 text-indigo-600', bar: fleetData?.stats?.totalTrucks ? (fleetData.stats.inTransitTrucks / fleetData.stats.totalTrucks) * 100 : 0 },
              { label: 'MAINTENANCE', value: fleetData?.stats?.maintenanceTrucks || 0, color: 'bg-amber-50 text-amber-600', bar: fleetData?.stats?.totalTrucks ? (fleetData.stats.maintenanceTrucks / fleetData.stats.totalTrucks) * 100 : 0 },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                  <FleetIcon />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{item.value}</h3>
                <div className="mt-3 h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.bar}%` }} transition={{ duration: 1 }} className="h-full bg-current opacity-40" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DataCard title="TRUCK TYPE BREAKDOWN" subtitle="Fleet composition by vehicle type" icon={<PieChartIcon />}>
              <div className="h-[360px] flex items-center justify-center p-8">
                <Doughnut
                  data={{
                    labels: fleetData?.truckTypeBreakdown?.map((t: any) => t.label) || [],
                    datasets: [{
                      data: fleetData?.truckTypeBreakdown?.map((t: any) => t.count) || [],
                      backgroundColor: ['#345E85','#10b981','#f59e0b','#ef4444','#8b5cf6','#64748b','#14b8a6','#f97316'],
                      borderWidth: 0,
                    }]
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false, cutout: '65%',
                    plugins: { legend: { position: 'right', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true } } }
                  }}
                />
              </div>
            </DataCard>

            <DataCard title="MONTHLY TRIP REVENUE" subtitle="Trips completed and revenue per month" icon={<BarChartIcon />}>
              <div className="h-[360px] pt-4">
                <Bar
                  data={{
                    labels: fleetData?.monthlyTrips?.map((m: any) => m.label) || [],
                    datasets: [
                      { label: 'TRIPS', data: fleetData?.monthlyTrips?.map((m: any) => m.count) || [], backgroundColor: '#345E85', borderRadius: 10 },
                      { label: 'REVENUE ($)', data: fleetData?.monthlyTrips?.map((m: any) => m.revenue) || [], backgroundColor: '#10b981', borderRadius: 10 },
                    ]
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true } } },
                    scales: { y: { grid: { color: 'rgba(226,232,240,0.2)' }, border: { display: false } }, x: { grid: { display: false } } }
                  }}
                />
              </div>
            </DataCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">FLEET UTILIZATION RATE</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{fleetData?.stats?.utilizationRate || 0}%</span>
                <span className="text-sm font-bold text-slate-400">of fleet active</span>
              </div>
              <div className="mt-4 h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${fleetData?.stats?.utilizationRate || 0}%` }} transition={{ duration: 1.2 }} className="h-full bg-[#345E85] rounded-full" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TRIP SUCCESS RATE</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{fleetData?.stats?.tripSuccessRate || 0}%</span>
                <span className="text-sm font-bold text-slate-400">of {fleetData?.stats?.totalTrips || 0} trips</span>
              </div>
              <div className="mt-4 h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${fleetData?.stats?.tripSuccessRate || 0}%` }} transition={{ duration: 1.2 }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      </TabPanel>

      {/* System Vitals Tab */}
      <TabPanel value={tabValue} index={3}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                            <SecurityIcon />
                        </div>
                        <div>
                            <h4 className="text-lg font-black tracking-tight">
                              {systemData?.security?.threatLevel === 'LOW' ? 'PROTECTED' : 'ALERT'}
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase">
                              THREAT: {systemData?.security?.threatLevel || '—'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[
                          { label: 'SSL ENCRYPTION', value: systemData?.security?.sslActive ? 'ACTIVE' : 'INACTIVE', pct: systemData?.security?.sslActive ? 100 : 0, color: 'bg-emerald-400' },
                          { label: 'NODE HARMONY', value: `${systemData?.security?.nodeHarmony || 0}%`, pct: systemData?.security?.nodeHarmony || 0, color: 'bg-blue-400' },
                          { label: 'MEMORY USAGE', value: `${systemData?.system?.memoryPercent || 0}%`, pct: systemData?.system?.memoryPercent || 0, color: 'bg-amber-400' },
                        ].map((item, i) => (
                          <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[9px] font-black uppercase text-slate-400">{item.label}</span>
                              <span className="text-[10px] font-black text-emerald-400">{item.value}</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                    </div>
                </div>

                <div className="bg-[#345E85] rounded-[2.5rem] p-8 text-white shadow-xl">
                   <div className="flex items-center gap-4 mb-4">
                        <RealTimeIcon className="text-white/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">LIVE PULSE</h4>
                   </div>
                   <div className="text-4xl font-black mb-2 flex items-baseline gap-2">
                       {systemData?.database?.status === 'connected' ? '99.9%' : 'DEGRADED'}
                       <span className="text-sm font-black text-emerald-400">
                         {systemData?.database?.status === 'connected' ? 'UP' : 'DOWN'}
                       </span>
                   </div>
                   <p className="text-[9px] font-bold text-white/40 uppercase">
                     UPTIME: {systemData?.system?.uptimeFormatted || '—'}
                   </p>
                   <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                     <div className="bg-white/10 rounded-xl p-3">
                       <p className="text-lg font-black">{systemData?.platform?.totalUsers || 0}</p>
                       <p className="text-[8px] font-black text-white/50 uppercase">USERS</p>
                     </div>
                     <div className="bg-white/10 rounded-xl p-3">
                       <p className="text-lg font-black">{systemData?.platform?.totalTenants || 0}</p>
                       <p className="text-[8px] font-black text-white/50 uppercase">TENANTS</p>
                     </div>
                   </div>
                </div>
            </div>

            <div className="lg:col-span-3 space-y-8">
                <DataCard title="PLATFORM RECORD COUNTS" subtitle="Total records across all database tables" icon={<GeoIcon />}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
                      {[
                        { label: 'USERS', value: systemData?.platform?.totalUsers || 0, color: '#345E85' },
                        { label: 'TRIPS', value: systemData?.platform?.totalTrips || 0, color: '#10b981' },
                        { label: 'LOADS', value: systemData?.platform?.totalLoads || 0, color: '#f59e0b' },
                        { label: 'TRUCKS', value: systemData?.platform?.totalTrucks || 0, color: '#8b5cf6' },
                      ].map((item, i) => (
                        <div key={i} className="text-center p-4 bg-slate-50 rounded-2xl">
                          <p className="text-3xl font-black" style={{ color: item.color }}>{item.value}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                </DataCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DataCard title="MEMORY USAGE" subtitle="Heap memory utilization" icon={<PerformanceIcon />}>
                      <div className="h-[220px] mt-4 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-32 h-32">
                          <Doughnut
                            data={{
                              labels: ['USED', 'FREE'],
                              datasets: [{
                                data: [
                                  systemData?.system?.memoryUsedMB || 0,
                                  Math.max(0, (systemData?.system?.memoryTotalMB || 0) - (systemData?.system?.memoryUsedMB || 0)),
                                ],
                                backgroundColor: ['#345E85', '#f1f5f9'],
                                borderWidth: 0,
                              }]
                            }}
                            options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false } } }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-black text-slate-900">{systemData?.system?.memoryPercent || 0}%</span>
                          </div>
                        </div>
                        <div className="flex gap-6 text-center">
                          <div>
                            <p className="text-xs font-black text-[#345E85]">{systemData?.system?.memoryUsedMB || 0}MB</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase">USED</p>
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-400">{systemData?.system?.memoryTotalMB || 0}MB</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase">TOTAL</p>
                          </div>
                        </div>
                      </div>
                    </DataCard>

                    <DataCard title="DATABASE STATUS" subtitle="Connection and record health" icon={<SecurityIcon />}>
                      <div className="h-[220px] flex flex-col justify-center gap-3 px-4">
                        {[
                          { label: 'DB CONNECTION', value: systemData?.database?.status === 'connected' ? 'CONNECTED' : 'ERROR', ok: systemData?.database?.status === 'connected' },
                          { label: 'NODE VERSION', value: systemData?.system?.nodeVersion || '—', ok: true },
                          { label: 'TOTAL RECORDS', value: (systemData?.database?.totalRecords || 0).toLocaleString(), ok: true },
                          { label: 'UPTIME', value: systemData?.system?.uptimeFormatted || '—', ok: true },
                          { label: 'MEMORY', value: `${systemData?.system?.memoryUsedMB || 0}/${systemData?.system?.memoryTotalMB || 0}MB`, ok: true },
                        ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                            <span className={`text-[10px] font-black ${item.ok ? 'text-emerald-600' : 'text-red-500'}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </DataCard>
                </div>
            </div>
        </div>
      </TabPanel>
    </AdminPageLayout>
  );
};

export default AnalyticsManagement;
