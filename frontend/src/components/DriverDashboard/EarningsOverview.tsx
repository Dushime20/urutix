import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface EarningsOverviewProps {
  driverId: string;
}

interface EarningsData {
  period: string;
  trips: number;
  distance: number;
  hours: number;
  earnings: number;
  bonuses: number;
  deductions: number;
  netEarnings: number;
}

export const EarningsOverview: React.FC<EarningsOverviewProps> = ({ driverId }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showDetails, setShowDetails] = useState(false);

  const { data: earnings, isLoading } = useQuery({
    queryKey: ['driver-earnings', driverId, period],
    queryFn: () => driverApi.getEarnings(driverId, period),
    enabled: !!driverId,
  });

  // Mock data for demonstration
  const mockEarnings: EarningsData[] = [
    { period: 'Week 1', trips: 5, distance: 1200, hours: 45, earnings: 850, bonuses: 100, deductions: 50, netEarnings: 900 },
    { period: 'Week 2', trips: 6, distance: 1400, hours: 52, earnings: 950, bonuses: 120, deductions: 30, netEarnings: 1040 },
    { period: 'Week 3', trips: 4, distance: 1000, hours: 38, earnings: 750, bonuses: 80, deductions: 40, netEarnings: 790 },
    { period: 'Week 4', trips: 7, distance: 1600, hours: 58, earnings: 1100, bonuses: 150, deductions: 60, netEarnings: 1190 }
  ];

  const currentData = earnings || mockEarnings;
  const totalEarnings = currentData.reduce((sum, item) => sum + item.netEarnings, 0);
  const totalTrips = currentData.reduce((sum, item) => sum + item.trips, 0);
  const totalDistance = currentData.reduce((sum, item) => sum + item.distance, 0);
  const totalHours = currentData.reduce((sum, item) => sum + item.hours, 0);
  const averagePerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;
  const averagePerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
  const averagePerKm = totalDistance > 0 ? totalEarnings / totalDistance : 0;

  // Calculate trends
  const previousPeriodTotal = useMemo(() => totalEarnings * 0.88, [totalEarnings]);
  const earningsTrend = useMemo(() => {
    if (previousPeriodTotal === 0) return 0;
    return ((totalEarnings - previousPeriodTotal) / previousPeriodTotal) * 100;
  }, [totalEarnings, previousPeriodTotal]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          padding: 20,
          font: { family: "'Inter', sans-serif", size: 11, weight: 600 },
          color: '#64748b'
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#f8fafc',
        bodyColor: '#f8fafc',
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        titleFont: { family: "'Inter', sans-serif", size: 13, weight: 700 },
        bodyFont: { family: "'Inter', sans-serif", size: 12, weight: 500 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 10 },
          color: '#94a3b8',
          padding: 10,
          callback: (value: any) => formatCurrency(value),
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: "'Inter', sans-serif", size: 10 },
          color: '#94a3b8',
          padding: 10,
        },
        border: { display: false },
      },
    },
  };

  const earningsChartData = useMemo(() => ({
    labels: currentData.map(item => item.period),
    datasets: [
      {
        label: 'Net Earnings',
        data: currentData.map(item => item.netEarnings),
        borderColor: '#345E85',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(52, 94, 133, 0.2)');
          gradient.addColorStop(1, 'rgba(52, 94, 133, 0)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#345E85',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Bonuses',
        data: currentData.map(item => item.bonuses),
        borderColor: '#10b981',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }), [currentData]);

  const breakdownChartData = useMemo(() => ({
    labels: currentData.map(item => item.period),
    datasets: [
      {
        label: 'Base',
        data: currentData.map(item => item.earnings),
        backgroundColor: '#345E85',
        borderRadius: 6,
        barThickness: 12,
      },
      {
        label: 'Bonus',
        data: currentData.map(item => item.bonuses),
        backgroundColor: '#10b981',
        borderRadius: 6,
        barThickness: 12,
      },
      {
        label: 'Deductions',
        data: currentData.map(item => -item.deductions),
        backgroundColor: '#ef4444',
        borderRadius: 6,
        barThickness: 12,
      },
    ],
  }), [currentData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-emerald-100">
              Financials
            </span>
          </div>
          <h2 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight">
            Earnings Report
          </h2>
          <p className="text-slate-400 font-medium mt-1">
            Analyze your income streams and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="h-10 pl-4 pr-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#345E85] appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>

          <button className="h-10 px-4 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/10">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* AI Earnings Engine - Compact & Bright */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40"
      >
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row items-center gap-8 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-[9px] font-black text-[#345E85] uppercase tracking-[0.3em] mb-0.5">AI Engine</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Intelligence Projection</p>
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tighter mb-3">
              Monthly Projection: <span className="text-emerald-500 italic">{formatCurrency(totalEarnings * 1.45)}</span>
            </h2>
            <p className="text-slate-500 text-[11px] font-medium max-w-xl leading-relaxed italic border-l-2 border-slate-100 pl-4">
              "Your current <span className="text-[#345E85] font-black">12% growth streak</span> puts you on track to exceed your monthly average by $450."
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full xl:w-auto shrink-0">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center min-w-[180px] shadow-inner">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Target to Goal</p>
                <div className="flex items-center justify-between">
                    <p className="text-xl font-black text-[#0f172a] italic">{formatCurrency(5000)}</p>
                    <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                        <TrendingUp size={10} />
                        <span>82%</span>
                    </div>
                </div>
             </div>
             <div className="p-4 bg-[#345E85] rounded-2xl border border-[#345E85] flex flex-col justify-center min-w-[200px] group transition-all hover:bg-[#2a4b6d] cursor-pointer shadow-lg shadow-[#345E85]/20">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest">Recommendation</p>
                  <ArrowRight size={12} className="text-white opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight">Pick up 2 High-Yield Missions</p>
                <p className="text-[9px] font-bold text-blue-100 italic mt-2 pt-2 border-t border-white/10 uppercase tracking-widest">Unlock +$380</p>
             </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 overflow-x-auto pb-1 scrollbar-none">
           {[
             { label: 'Pace vs Avg', val: '+18.5%', color: 'text-emerald-600' },
             { label: 'Predicted Bonus', val: '$520.00', color: 'text-[#345E85]' },
             { label: 'Market Demand', val: 'High (1.2x)', color: 'text-amber-600' },
             { label: 'Net Payout', val: formatCurrency(totalEarnings * 1.55), color: 'text-[#0f172a]' }
           ].map((stat) => (
             <div key={stat.label} className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-slate-50/50 rounded-lg border border-slate-100/50">
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}:</span>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", stat.color)}>{stat.val}</span>
             </div>
           ))}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <CreditCard className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(totalEarnings)}
              </h3>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${earningsTrend >= 0 ? 'bg-blue-50 text-[#345E85]' : 'bg-rose-50 text-rose-600'}`}>
                {earningsTrend >= 0 ? '+' : ''}{Math.abs(earningsTrend).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Total Revenue</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gross Yield</p>
          </div>
        </motion.div>

        {/* Total Trips - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Briefcase className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{totalTrips}</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Active
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Total Trips</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Completed Jobs</p>
          </div>
        </motion.div>

        {/* Total Hours - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Zap className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">{totalHours}h</h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Optimal
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Total Hours</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Utilization</p>
          </div>
        </motion.div>

        {/* Avg Per Trip - Blue Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-lg hover:border-blue-100 transition-all cursor-default"
        >
          <div className="w-14 h-14 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
            <Target className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(averagePerTrip)}
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wide bg-blue-50 text-[#345E85]">
                Avg
              </span>
            </div>
            <p className="text-sm font-bold text-slate-600">Per Trip</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Performance</p>
          </div>
        </motion.div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800">Income Trend</h3>
              <p className="text-slate-400 text-sm font-medium">Net earnings vs potential bonuses</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-[#345E85]" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Net</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Bonus</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <Line data={earningsChartData} options={chartOptions} />
          </div>
        </div>
        {/* Distribution Chart */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800">Revenue Breakdown</h3>
              <p className="text-slate-400 text-sm font-medium">Composition of total income</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <BarChart3 className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="h-64 w-full">
            <Bar data={breakdownChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Incentive Roadmap - Compact & Bright */}
      <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-50/30 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                 <Trophy size={18} />
              </div>
              <div>
                 <h3 className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-0.5">Incentive Roadmap</h3>
                 <p className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Active Performance Goals</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                 { title: 'Distance Milestone', target: '5,000 km', current: '3,840 km', progress: 76, reward: '$250', color: 'bg-emerald-500' },
                 { title: 'Optimal Fuel Usage', target: '95% Efficiency', current: '92%', progress: 92, reward: '$100', color: 'bg-[#345E85]' },
                 { title: 'Safe Transit Streak', target: '10 Trips', current: '8 Trips', progress: 80, reward: '$150', color: 'bg-rose-500' }
              ].map((goal, idx) => (
                 <div key={idx} className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all cursor-default">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{goal.title}</p>
                          <h4 className="text-base font-black text-[#0f172a]">{goal.reward} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Bonus</span></h4>
                       </div>
                       <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                          Live
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-end text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          <span>Current Progress</span>
                          <span className="text-[#345E85]">{goal.progress}%</span>
                       </div>
                       <div className="h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${goal.progress}%` }}
                             transition={{ duration: 1, ease: "easeOut" }}
                             className={cn("h-full rounded-full", goal.color)} 
                          />
                       </div>
                       <div className="flex justify-between text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-2 px-0.5">
                          <span className="italic">{goal.current}</span>
                          <span className="text-slate-300">Target: {goal.target}</span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary List */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#345E85]" />
              Financial Summary
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Base Pay - Blue Theme */}
            <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-blue-100 transition-all cursor-default">
              <div className="w-10 h-10 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
                <DollarSign className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-xl font-black text-slate-800 block leading-none">
                  {formatCurrency(currentData.reduce((sum, i) => sum + i.earnings, 0))}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1 block">Base Pay</span>
              </div>
            </div>

            {/* Bonuses - Blue Theme */}
            <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-blue-100 transition-all cursor-default">
              <div className="w-10 h-10 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
                <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-xl font-black text-emerald-600 block leading-none">
                  +{formatCurrency(currentData.reduce((sum, i) => sum + i.bonuses, 0))}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#345E85] mt-1 block">Bonuses</span>
              </div>
            </div>

            {/* Deductions - Blue Theme */}
            <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md hover:border-blue-100 transition-all cursor-default">
              <div className="w-10 h-10 rounded-full border-[1.5px] border-blue-100 flex items-center justify-center flex-shrink-0 bg-blue-50 group-hover:bg-[#345E85] group-hover:text-white transition-colors text-[#345E85]">
                <TrendingDown className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-xl font-black text-rose-600 block leading-none">
                  -{formatCurrency(currentData.reduce((sum, i) => sum + i.deductions, 0))}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#345E85] mt-1 block">Deductions</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full py-4 rounded-xl border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              {showDetails ? 'Hide' : 'View'} Detailed Ledger
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Efficiency Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-[#345E85]" />
              Efficiency
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-500">Hourly Rate</span>
                <span className="text-base font-black text-slate-800">{formatCurrency(averagePerHour)}/hr</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-500">Per Mile</span>
                <span className="text-base font-black text-slate-800">{formatCurrency(averagePerKm)}/km</span>
              </div>
            </div>
          </div>
          <div className="mt-8 p-4 bg-gradient-to-br from-[#345E85] to-slate-900 rounded-2xl text-white">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Target Reached</span>
            </div>
            <p className="text-sm font-medium text-slate-300">
              You are performing <span className="text-white font-bold">12% better</span> than last period.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-lg shadow-slate-200/50 mt-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-800">Ledger Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="text-left pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Period</th>
                      <th className="text-right pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Trips</th>
                      <th className="text-right pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Hours</th>
                      <th className="text-right pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Base</th>
                      <th className="text-right pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Bonus</th>
                      <th className="text-right pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Ded.</th>
                      <th className="text-right pb-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Net Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {currentData.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-sm font-bold text-slate-700">{item.period}</td>
                        <td className="py-4 text-right text-sm font-medium text-slate-500">{item.trips}</td>
                        <td className="py-4 text-right text-sm font-medium text-slate-500">{item.hours}h</td>
                        <td className="py-4 text-right text-sm font-bold text-slate-700">{formatCurrency(item.earnings)}</td>
                        <td className="py-4 text-right text-sm font-bold text-emerald-600">+{formatCurrency(item.bonuses)}</td>
                        <td className="py-4 text-right text-sm font-bold text-rose-600">-{formatCurrency(item.deductions)}</td>
                        <td className="py-4 text-right text-sm font-black text-slate-900 group-hover:text-[#345E85] transition-colors">{formatCurrency(item.netEarnings)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
