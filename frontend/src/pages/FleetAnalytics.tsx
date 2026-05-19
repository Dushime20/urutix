import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fleetApi, type TCOAnalysis } from '../services/fleetApi';
import { fuelApi } from '../services/fuelApi';
import TCOCharts from '../components/FleetDashboard/Analytics/TCOCharts';
import { Loader2, Zap, Fuel, DollarSign, CheckCircle, Filter, ArrowRight, Brain, AlertTriangle, BarChart3, Activity, Droplets, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { CircularStatCard } from '@/components/EnliteUI/Cards/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const FleetAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tcoData, setTcoData] = useState<TCOAnalysis | null>(null);
  const [tcoLoading, setTcoLoading] = useState(false);
  const [fuelStats, setFuelStats] = useState<any>(null);
  const [fuelLoading, setFuelLoading] = useState(false);

  // Real fleet analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['fleet-analytics'],
    queryFn: () => fleetApi.fetchAnalytics(),
  });

  const PredictiveMaintenanceContainer = () => {
    const { data: maintenanceData, isLoading: logsLoading } = useQuery({
      queryKey: ['fleet-maintenance-all'],
      queryFn: () => fleetApi.getFleetMaintenance()
    });

    const logs = (maintenanceData as any)?.data?.logs || [];
    const criticalIssues = logs.filter((l: any) => l.status === 'FAULT_REPORT').length;
    const pendingServices = logs.filter((l: any) => l.status === 'scheduled').length;
    const healthScore = Math.max(70, 100 - (criticalIssues * 15) - (pendingServices * 2));

    if (logsLoading) {
      return (
        <div className="p-20 text-center flex flex-col items-center">
          <Brain className="animate-pulse text-blue-600 mb-4" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading maintenance data...</p>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 p-10 bg-[#0f172a] rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12">
              <Brain size={240} className="text-blue-400" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                  <Zap size={18} />
                </div>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Fleet Health Analysis</span>
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4 leading-none">Fleet Health <br />Overview</h2>
              <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                Analyzing {logs.length} service records and real-time fault reports across your fleet.
              </p>
              <div className="mt-10 flex flex-wrap gap-8 items-center border-t border-white/5 pt-10">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fleet Integrity</span>
                  <span className="text-3xl font-black text-white">{healthScore}%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fault Reports</span>
                  <span className="text-3xl font-black text-rose-500">{criticalIssues}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pending Services</span>
                  <span className="text-3xl font-black text-amber-400">{pendingServices}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-wider mb-2">Priority Alerts</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Immediate Attention Required</p>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No alerts</p>
                ) : logs.slice(0, 3).map((log: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className={cn(
                      "size-8 rounded-xl flex items-center justify-center",
                      log.status === 'FAULT_REPORT' ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500" : "bg-blue-50 dark:bg-blue-950/20 text-blue-500"
                    )}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tight">{log.truck?.plateNumber || log.truckId}</p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">{log.taskName}</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 dark:text-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real maintenance log table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Maintenance Logs</h3>
            <Filter className="w-4 h-4 text-slate-400" />
          </div>
          {logs.length === 0 ? (
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-8">No maintenance records found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-slate-50 dark:border-slate-800">
                  <tr>
                    <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Vehicle</th>
                    <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Task</th>
                    <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-center">Status</th>
                    <th className="pb-4 text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {logs.slice(0, 8).map((log: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-tight">{log.truck?.plateNumber || log.truckId}</span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{log.truck?.make || ''}</span>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{log.taskName}</td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                          log.status === 'FAULT_REPORT' ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                          log.status === 'completed' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                          "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                        )}>{log.status}</span>
                      </td>
                      <td className="py-4 text-right text-xs font-black text-[#0f172a] dark:text-white">
                        {log.cost ? `$${Number(log.cost).toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (activeTab === 'tco') loadTCOData();
    if (activeTab === 'fuel') loadFuelData();
  }, [activeTab]);

  const loadTCOData = async () => {
    setTcoLoading(true);
    try {
      const data = await fleetApi.getTCOAnalysis();
      setTcoData(data);
    } catch (error) {
      console.error('Failed to load TCO data', error);
    } finally {
      setTcoLoading(false);
    }
  };

  const loadFuelData = async () => {
    setFuelLoading(true);
    try {
      const data = await fuelApi.getFuelStatistics();
      setFuelStats(data);
    } catch (error) {
      console.error('Failed to load fuel stats', error);
    } finally {
      setFuelLoading(false);
    }
  };

  const FuelStatsTab = () => {
    if (fuelLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 place-items-center bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <CircularStatCard
            title="Total Spend"
            value={`$${Number(fuelStats?.totalSpend || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            colorClass="bg-blue-50 text-blue-600"
            secondaryColor="text-blue-600"
          />
          <CircularStatCard
            title="Fuel Volume"
            value={`${Number(fuelStats?.totalVolume || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} Gal`}
            icon={Droplets}
            colorClass="bg-emerald-50 text-emerald-600"
            secondaryColor="text-emerald-600"
          />
          <CircularStatCard
            title="Avg. MPG"
            value={`${Number(fuelStats?.fleetEfficiency || 0).toFixed(1)} MPG`}
            icon={TrendingUp}
            colorClass="bg-amber-50 text-amber-600"
            secondaryColor="text-amber-600"
          />
          <CircularStatCard
            title="Fraud Alerts"
            value={fuelStats?.fraudAlerts || 0}
            icon={AlertTriangle}
            colorClass="bg-rose-50 text-rose-600"
            secondaryColor="text-rose-600"
          />
        </div>

        {/* Daily trend chart + truck performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Daily Fuel Cost</h3>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Last 30 days</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              {fuelStats?.dailyTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={fuelStats.dailyTrend}>
                    <defs>
                      <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#345E85" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#345E85" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 800, fill: '#64748B' }} dy={10}
                      interval="preserveStartEnd" />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', fontSize: '10px', fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="cost" stroke="#345E85" strokeWidth={4} fillOpacity={1} fill="url(#fuelGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  No fuel data yet
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1A1C1E] p-8 rounded-[40px] border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6 relative z-10">
              <div className="size-14 bg-white/10 rounded-[22px] flex items-center justify-center text-emerald-400">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight uppercase leading-tight">
                Truck <br /><span className="text-emerald-400">Performance</span>
              </h3>
              <div className="space-y-4 pt-4">
                {fuelStats?.truckEfficiency?.length > 0 ? fuelStats.truckEfficiency.map((item: any, idx: number) => (
                  <div key={item.plate} className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                      <span>{item.plate}</span>
                      <span className="text-white">{item.mpg} MPG</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.mpg / 12) * 100, 100)}%` }}
                        transition={{ delay: idx * 0.1, duration: 1 }}
                        className={`h-full rounded-full ${item.mpg > 6 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      />
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30 pt-4">
                    No odometer data available
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OverviewTab = () => {
    if (analyticsLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      );
    }

    const utilization = analyticsData?.utilizationRate ?? null;
    const avgRating = analyticsData?.averageRating ?? null;
    const totalRevenue = analyticsData?.totalRevenue ?? null;
    const activeTrips = analyticsData?.activeTrips ?? null;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 place-items-center bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <CircularStatCard
            title="Utilization"
            value={utilization !== null ? `${Math.round(utilization)}%` : '—'}
            icon={Zap}
            colorClass="bg-blue-50 text-blue-600"
            secondaryColor="text-blue-600"
          />
          <CircularStatCard
            title="Avg Rating"
            value={avgRating !== null ? avgRating.toFixed(1) : '—'}
            icon={Activity}
            colorClass="bg-emerald-50 text-emerald-600"
            secondaryColor="text-emerald-600"
          />
          <CircularStatCard
            title="Revenue"
            value={totalRevenue !== null ? `$${(totalRevenue / 1000).toFixed(1)}k` : '—'}
            icon={DollarSign}
            colorClass="bg-amber-50 text-amber-600"
            secondaryColor="text-amber-600"
          />
          <CircularStatCard
            title="Active Trips"
            value={activeTrips !== null ? activeTrips : '—'}
            icon={CheckCircle}
            colorClass="bg-primary-50 text-primary-500"
            secondaryColor="text-primary-500"
          />
        </div>

        {analyticsData && Object.keys(analyticsData).length === 0 && (
          <div className="text-center py-12 text-slate-400 text-[10px] font-black uppercase tracking-widest">
            No analytics data available yet
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] dark:bg-slate-950 text-[#0f172a] dark:text-white font-sans transition-colors duration-200">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">Analytics</h1>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Overview</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex border-b border-slate-100 dark:border-slate-800 px-2 gap-8 overflow-x-auto no-scrollbar">
              {['overview', 'fuel', 'tco', 'maintenance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 px-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {tab === 'tco' ? 'Costs' : tab === 'fuel' ? 'Fuel Stats' : tab === 'maintenance' ? 'Maintenance' : 'Overview'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'tco' ? (
            tcoLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : tcoData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TCOCharts data={tcoData} />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">Failed to load cost data</div>
            )
          ) : activeTab === 'maintenance' ? (
            <PredictiveMaintenanceContainer />
          ) : activeTab === 'fuel' ? (
            <FuelStatsTab />
          ) : (
            <OverviewTab />
          )}
        </div>
      </main>
    </div>
  );
};

export default FleetAnalytics;
