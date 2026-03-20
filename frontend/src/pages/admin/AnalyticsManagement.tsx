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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Real-time data effect
  useEffect(() => {
    if (isRealTime) {
      // Logic for real-time data fetching would go here
    }
  }, [isRealTime]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1200);
  };

  // Performance Radar Data
  const platformHealthData = {
    labels: ['Latency', 'Throughput', 'Success Rate', 'Security', 'User Growth', 'Scaling'],
    datasets: [{
      label: 'Performance Index',
      data: [95, 88, 98, 96, 92, 85],
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={<TranslatedText text="AGGREGATE REVENUE" />}
              value="₦184.2M"
              subtitle={<TranslatedText text="GROSS REVENUE STREAM" />}
              icon={<MoneyIcon />}
              trend="+12.4%"
              trendDirection="up"
              color="primary"
            />
            <StatCard
              title={<TranslatedText text="ACTIVE NETWORK" />}
              value="12,840"
              subtitle={<TranslatedText text="TOTAL REACHABLE NODES" />}
              icon={<UsersIcon />}
              trend="+4.2%"
              trendDirection="up"
              color="info"
            />
            <StatCard
              title={<TranslatedText text="PLATFORM VELOCITY" />}
              value="94.2%"
              subtitle={<TranslatedText text="MATCHING EFFICIENCY" />}
              icon={<PerformanceIcon />}
              trend="+2.1%"
              trendDirection="up"
              color="success"
            />
            <StatCard
              title={<TranslatedText text="CRITICAL ALERTS" />}
              value="0"
              subtitle={<TranslatedText text="SYSTEM BLOCKERS" />}
              icon={<SecurityIcon />}
              trend={<TranslatedText text="SAFE" />}
              trendDirection="up"
              color="warning"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <DataCard title={<TranslatedText text="FINANCIAL TRAJECTORY" />} subtitle={<TranslatedText text="Revenue vs Target performance index" />} icon={<TimelineIcon />}>
                <div className="h-[360px] pt-4">
                  <Line
                    data={{
                      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
                      datasets: [
                        {
                          label: 'ACTUAL REVENUE',
                          data: [45, 52, 48, 65, 78, 72, 85, 94],
                          borderColor: '#345E85',
                          backgroundColor: 'rgba(52, 94, 133, 0.05)',
                          fill: true,
                          tension: 0.4,
                          borderWidth: 4,
                          pointRadius: 4,
                          pointBackgroundColor: '#fff',
                          pointBorderWidth: 2,
                        },
                        {
                          label: 'TARGET BASELINE',
                          data: [40, 45, 50, 55, 60, 65, 70, 75],
                          borderColor: '#cbd5e1',
                          borderDash: [5, 5],
                          borderWidth: 2,
                          fill: false,
                          pointRadius: 0,
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { 
                        legend: { position: 'top', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true, padding: 20 } } 
                      },
                      scales: { 
                        y: { 
                          grid: { color: 'rgba(226, 232, 240, 0.2)' }, 
                          border: { display: false }, 
                          ticks: { font: { weight: 'bold', size: 9 }, color: '#64748b' } 
                        },
                        x: { 
                          grid: { display: false }, 
                          ticks: { font: { weight: 'bold', size: 9 }, color: '#64748b' } 
                        }
                      }
                    }}
                  />
                </div>
              </DataCard>
            </div>

            <div className="lg:col-span-1">
              <DataCard title={<TranslatedText text="PLATFORM VITALS" />} subtitle={<TranslatedText text="Operational health distribution" />} icon={<HealthIcon />}>
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
        </div>
      </TabPanel>

      {/* Cargo Ecosystem Tab */}
      <TabPanel value={tabValue} index={1}>
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-[#345E85] dark:text-blue-400 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CargoIcon />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="ECOSYSTEM VALUATION" /></p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">₦42.5M</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400 dark:text-slate-500"><TranslatedText text="BOOKING SUCCESS" /></span>
                        <span className="text-emerald-500">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '92%' }}
                            transition={{ duration: 1 }}
                            className="h-full bg-emerald-500" 
                        />
                    </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UsersIcon />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="CARGO OWNERS" /></p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">1,240</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400 dark:text-slate-500"><TranslatedText text="RETENTION RATE" /></span>
                        <span className="text-indigo-500">84%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '84%' }}
                            transition={{ duration: 1 }}
                            className="h-full bg-indigo-500" 
                        />
                    </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-slate-950/40 transition-all duration-500 group">
                <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-[1.25rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RealTimeIcon />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="MATCHING SPEED" /></p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">1.4 HR</h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-slate-400 dark:text-slate-500"><TranslatedText text="SYSTEM OPTIMIZATION" /></span>
                        <span className="text-amber-500"><TranslatedText text="OPTIMAL" /></span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1 }}
                            className="h-full bg-amber-500" 
                        />
                    </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DataCard title={<TranslatedText text="CARGO DISTRIBUTION" />} subtitle={<TranslatedText text="Load distribution by industry category" />} icon={<PieChartIcon />}>
                <div className="h-[380px] flex items-center justify-center p-12">
                   <PolarArea
                        data={{
                            labels: ['ELECTRONICS', 'AGRICULTURE', 'PHARMA', 'CONSTRUCTION', 'FMCG', 'TEXTILES'],
                            datasets: [{
                                data: [85, 92, 74, 65, 88, 55],
                                backgroundColor: [
                                    'rgba(52, 94, 133, 0.7)',
                                    'rgba(16, 185, 129, 0.7)',
                                    'rgba(245, 158, 11, 0.7)',
                                    'rgba(239, 68, 68, 0.7)',
                                    'rgba(139, 92, 246, 0.7)',
                                    'rgba(100, 116, 139, 0.7)'
                                ],
                                borderWidth: 0
                            }]
                        }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                             plugins: { 
                                 legend: { position: 'right', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true, padding: 20 } } 
                             },
                             scales: { r: { ticks: { display: false }, grid: { color: 'rgba(226, 232, 240, 0.2)' } } }
                        }}
                   />
                </div>
            </DataCard>

            <DataCard title={<TranslatedText text="CARGO DEMAND" />} subtitle={<TranslatedText text="Aggregated monthly cargo manifestations" />} icon={<BarChartIcon />}>
                <div className="h-[380px] pt-4">
                  <Bar
                    data={{
                        labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN'],
                        datasets: [
                            { label: 'POSTED LOADS', data: [420, 580, 510, 690, 840, 920], backgroundColor: '#345E85', borderRadius: 12 },
                            { label: 'COMPLETED TRIPS', data: [380, 510, 480, 620, 780, 890], backgroundColor: '#10b981', borderRadius: 12 }
                        ]
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                         plugins: { legend: { position: 'top', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true } } },
                         scales: { 
                             y: { grid: { display: true, color: 'rgba(226, 232, 240, 0.2)' }, border: { display: false } }, 
                             x: { grid: { display: false } } 
                         }
                    }}
                  />
                </div>
            </DataCard>
          </div>
        </div>
      </TabPanel>

      {/* System Vitals Tab */}
      <TabPanel value={tabValue} index={3}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-sm">
                            <SecurityIcon /> 
                        </div>
                        <div>
                            <h4 className="text-lg font-black tracking-tight"><TranslatedText text="PROTECTED" /></h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase"><TranslatedText text="THREAT LEVEL: LOW" /></p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black uppercase text-slate-400"><TranslatedText text="SSL ENCRYPTION" /></span>
                                <span className="text-[10px] font-black text-emerald-400"><TranslatedText text="ACTIVE" /></span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 w-full" />
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-black uppercase text-slate-400"><TranslatedText text="NODE HARMONY" /></span>
                                <span className="text-[10px] font-black text-blue-400">99.2%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-[99.2%]" />
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        <TranslatedText text="RUN SECURITY AUDIT" />
                    </button>
                </div>

                <div className="bg-[#345E85] rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/10">
                   <div className="flex items-center gap-4 mb-4">
                        <RealTimeIcon className="text-white/40" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60"><TranslatedText text="LIVE PULSE" /></h4>
                   </div>
                   <div className="text-4xl font-black mb-2 flex items-baseline gap-2">
                       99.9%
                       <span className="text-sm font-black text-emerald-400"><TranslatedText text="UP" /></span>
                   </div>
                   <p className="text-[9px] font-bold text-white/40 uppercase"><TranslatedText text="ALL SYSTEMS CATEGORICALLY STABLE" /></p>
                </div>
            </div>

            <div className="lg:col-span-3">
                <DataCard title={<TranslatedText text="NETWORK TOPOLOGY" />} subtitle={<TranslatedText text="Real-time geo-distribution and user density" />} icon={<GeoIcon />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-6">
                        <div className="space-y-6">
                            {[
                                { name: 'KIGALI METROPOLITAN', value: 45, load: 'HIGH', trend: 'UP' },
                                { name: 'EASTERN HUB', value: 28, load: 'BALANCED', trend: 'STABLE' },
                                { name: 'WESTERN CORRIDOR', value: 18, load: 'LOW', trend: 'UP' },
                                { name: 'SOUTHERN GATEWAY', value: 9, load: 'LOW', trend: 'DOWN' }
                            ].map((region, i) => (
                                <div key={i} className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${region.value > 30 ? 'bg-[#345E85]' : 'bg-slate-300 dark:bg-slate-700'} group-hover:scale-150 transition-transform`} />
                                            <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">{region.name}</span>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{region.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${region.value}%` }} 
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className={`h-full ${region.value > 30 ? 'bg-[#345E85]' : 'bg-indigo-300 dark:bg-indigo-500'}`} 
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase">
                                        <span>LOAD: {region.load}</span>
                                        <span>TREND: {region.trend}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-700">
                             <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-[#345E85] dark:text-blue-400 mb-4">
                                <GeoIcon />
                             </div>
                             <h5 className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.15em]"><TranslatedText text="Geo-Sync Map Pending" /></h5>
                             <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-2 max-w-[140px]"><TranslatedText text="Initialize Map Modules for precise spatial visualization" /></p>
                             <button className="mt-6 px-6 py-3 bg-[#345E85] dark:bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"><TranslatedText text="LOAD ASSETS" /></button>
                        </div>
                    </div>
                </DataCard>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <DataCard title={<TranslatedText text="API LATENCY MATRIX" />} subtitle={<TranslatedText text="Average response intervals per second" />} icon={<PerformanceIcon />}>
                         <div className="h-[200px] mt-4">
                             <Line 
                                data={{
                                    labels: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s'],
                                    datasets: [{
                                        data: [42, 38, 45, 82, 43, 39, 41, 40, 38, 44],
                                        borderColor: '#345E85',
                                        backgroundColor: 'transparent',
                                        borderWidth: 2,
                                        pointRadius: 0,
                                        tension: 0.2,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { 
                                        y: { display: false, min: 0, max: 100 },
                                        x: { display: false }
                                    }
                                }}
                             />
                             <div className="flex justify-between items-center mt-2">
                                <div className="text-center">
                                    <p className="text-xs font-black text-[#345E85]">42ms</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase"><TranslatedText text="LOW" /></p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-red-500">82ms</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase"><TranslatedText text="PEAK" /></p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-emerald-500">22ms</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase"><TranslatedText text="FLOOR" /></p>
                                </div>
                             </div>
                         </div>
                    </DataCard>

                    <DataCard title={<TranslatedText text="VERSION CLUSTER" />} subtitle={<TranslatedText text="Distribution of active app versions" />} icon={<SecurityIcon />}>
                        <div className="h-[200px] flex items-center justify-center">
                             <Doughnut 
                                data={{
                                    labels: ['V2.4 (LATEST)', 'V2.3', 'V2.2'],
                                    datasets: [{
                                        data: [85, 12, 3],
                                        backgroundColor: ['#345E85', '#64748b', '#cbd5e1'],
                                        borderWidth: 0,
                                    }]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    cutout: '80%',
                                    plugins: { legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 9 }, usePointStyle: true } } }
                                }}
                             />
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
