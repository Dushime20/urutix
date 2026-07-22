import React, { useMemo } from 'react';
import {
  BarChart3,
  Truck,
  Box,
  ShieldCheck,
  Wrench,
  Navigation,
  Thermometer,
  Zap,
  Activity,
  Layers,
  TrendingUp,
  AlertCircle,
  Fuel,
  Cpu,
  DollarSign,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
interface TruckAnalyticsProps {
  trucks: any[];
  analytics?: any;
  fuelStats?: any;
  tcoData?: any;
}

export const TruckAnalytics: React.FC<TruckAnalyticsProps> = ({ trucks, analytics, fuelStats, tcoData }) => {
  const { format: formatCurrency } = useCurrencyFormat();
  const calculateCargoAlignmentStats = () => {
    const stats = {
      totalTrucks: trucks.length,
      cargoTypeCoverage: {
        GENERAL: 0,
        FRAGILE: 0,
        HAZARDOUS: 0,
        REFRIGERATED: 0,
        LIQUID: 0,
        OVERSIZED: 0,
        VALUABLE: 0,
      },
      specialHandling: {
        fragile: 0,
        hazardous: 0,
        refrigerated: 0,
        liquid: 0,
        oversized: 0,
        valuable: 0,
      },
      equipmentCoverage: {
        forklift: 0,
        crane: 0,
        tailLift: 0,
        sideLift: 0,
      },
      securityFeatures: {
        gps: 0,
        tracking: 0,
        temperatureMonitoring: 0,
        cargoMonitoring: 0,
      },
      temperatureRanges: {
        frozen: 0,
        chilled: 0,
        ambient: 0,
        heated: 0,
      },
    };

    trucks.forEach(truck => {
      if (truck.cargoCapabilities) {
        truck.cargoCapabilities.supportedCargoTypes?.forEach((type: string) => {
          if (stats.cargoTypeCoverage[type as keyof typeof stats.cargoTypeCoverage] !== undefined) {
            stats.cargoTypeCoverage[type as keyof typeof stats.cargoTypeCoverage]++;
          }
        });

        if (truck.cargoCapabilities.maxFragileHandling) stats.specialHandling.fragile++;
        if (truck.cargoCapabilities.maxHazardousHandling) stats.specialHandling.hazardous++;
        if (truck.cargoCapabilities.maxRefrigeratedHandling) stats.specialHandling.refrigerated++;
        if (truck.cargoCapabilities.maxLiquidHandling) stats.specialHandling.liquid++;
        if (truck.cargoCapabilities.maxOversizedHandling) stats.specialHandling.oversized++;
        if (truck.cargoCapabilities.maxValuableHandling) stats.specialHandling.valuable++;

        if (truck.cargoCapabilities.temperatureRange) {
          const { min, max } = truck.cargoCapabilities.temperatureRange;
          if (min <= -10 && max <= -10) stats.temperatureRanges.frozen++;
          else if (min <= 5 && max <= 5) stats.temperatureRanges.chilled++;
          else if (min <= 25 && max <= 25) stats.temperatureRanges.ambient++;
          else if (min >= 25) stats.temperatureRanges.heated++;
        }
      }

      if (truck.loadingCapabilities) {
        if (truck.loadingCapabilities.hasForklift) stats.equipmentCoverage.forklift++;
        if (truck.loadingCapabilities.hasCrane) stats.equipmentCoverage.crane++;
        if (truck.loadingCapabilities.hasTailLift) stats.equipmentCoverage.tailLift++;
        if (truck.loadingCapabilities.hasSideLift) stats.equipmentCoverage.sideLift++;
      }

      if (truck.securityFeatures) {
        if (truck.securityFeatures.hasGps) stats.securityFeatures.gps++;
        if (truck.securityFeatures.hasTracking) stats.securityFeatures.tracking++;
        if (truck.securityFeatures.hasTemperatureAlerts) stats.securityFeatures.temperatureMonitoring++;
        if (truck.securityFeatures.hasCargoMonitoring) stats.securityFeatures.cargoMonitoring++;
      }
    });

    return stats;
  };

  const stats = calculateCargoAlignmentStats();

  // formatCurrency provided by useCurrencyFormat hook

  // Trend Data for Charts - Derived from props
  const trendData = useMemo(() => {
    if (fuelStats?.dailyTrend) {
      return fuelStats.dailyTrend.map((d: any) => ({
        name: d.name,
        earnings: d.revenue || 0, // Fallback if revenue is not in fuelStats
        costs: d.cost || 0
      }));
    }
    if (analytics?.revenueTrend) {
       return analytics.revenueTrend.map((d: any) => ({
         name: d.date || d.name,
         earnings: d.revenue || 0,
         costs: d.expense || 0
       }));
    }
    return [];
  }, [fuelStats, analytics]);

  const tcoPieData = useMemo(() => {
    if (tcoData?.breakdown) {
      return [
        { name: 'Fuel', value: tcoData.breakdown.fuel || 0, color: '#3b82f6' },
        { name: 'Maintenance', value: tcoData.breakdown.maintenance || 0, color: '#fbbf24' },
        { name: 'Driver Labor', value: tcoData.breakdown.labor || 0, color: '#10b981' },
        { name: 'Insurance & Fees', value: tcoData.breakdown.fixed || 0, color: '#f43f5e' },
      ].filter(item => item.value > 0);
    }
    return [];
  }, [tcoData]);

  const ProgressBar = ({ label, value, total, color, icon: Icon }: { label: string; value: number; total: number; color: string; icon?: any }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-slate-400 dark:text-slate-500" />}
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-900 dark:text-white">{value}</span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">/ {total}</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-full h-1.5 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className={`h-full rounded-full ${color} relative`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
          </motion.div>
        </div>
      </div>
    );
  };

  const InsightCard = ({ title, desc, icon: Icon, color }: { title: string; desc: string; icon: any; color: string }) => (
    <div className="flex items-start gap-4 p-5 bg-white/5 dark:bg-slate-800/40 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/10 dark:hover:bg-slate-800/60 transition-all group cursor-default">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform`}>
        <Icon size={18} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <h4 className={`text-[11px] font-black uppercase tracking-widest mb-1 ${color.replace('bg-', 'text-')}`}>{title}</h4>
        <p className="text-xs font-medium text-white/70 dark:text-slate-300 leading-relaxed">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900/40 dark:to-indigo-900/40 p-10 rounded-3xl border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-20 opacity-[0.05] grayscale rotate-12 -mr-10 -mt-10">
          <Activity size={240} />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white">
                <BarChart3 size={24} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-100/60">Executive Intelligence</h2>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Fleet Capabilities & Analytics</h1>
            <p className="text-blue-100/70 font-medium max-w-xl text-lg">
              Comprehensive operational overview and strategic performance metrics for your transport infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex flex-col">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">System Health</span>
              <span className="text-emerald-400 font-black flex items-center gap-2 uppercase tracking-wider text-sm">
                <div className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Live Monitoring
              </span>
            </div>
            <button className="h-14 px-8 bg-white text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 flex items-center gap-3">
              <Cpu size={16} />
              Recompute Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Financial Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 lg:col-span-2 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Revenue vs Operating Costs</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Weekly Profitability Analysis</p>
              </div>
            </div>
            {trendData.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-indigo-200 dark:bg-indigo-800" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Costs</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-[300px] w-full flex items-center justify-center">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '12px', 
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: '800'
                    }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorEarnings)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="costs" 
                    stroke="#e2e8f0" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    fill="transparent" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2">
                <BarChart3 className="mx-auto text-slate-200 dark:text-slate-800" size={48} />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Insufficient performance data for trend analysis</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Cost Composition (TCO) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-3xl p-8 text-white border border-slate-800 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl text-white shadow-inner">
                <DollarSign size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">TCO Breakdown</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Total Cost of Ownership</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              {tcoPieData.length > 0 ? (
                <>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tcoPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {tcoPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                      <span className="text-2xl font-black">{tcoData?.totalExpenses ? formatCurrency(tcoData.totalExpenses) : '---'}</span>
                    </div>
                  </div>

                  <div className="w-full space-y-3 mt-6">
                    {tcoPieData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.name}</span>
                        </div>
                        <span className="text-xs font-black">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="size-24 rounded-full border-4 border-dashed border-slate-800 mx-auto flex items-center justify-center">
                    <DollarSign className="text-slate-700" size={32} />
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No cost distribution data available</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Capabilities Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cargo Specialization */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Operational Portfolio</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Asset Specialization Matrix</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <ProgressBar label="General Logistics" value={stats.cargoTypeCoverage.GENERAL} total={stats.totalTrucks} color="bg-blue-500" icon={Box} />
            <ProgressBar label="Cold Chain" value={stats.cargoTypeCoverage.REFRIGERATED} total={stats.totalTrucks} color="bg-cyan-500" icon={Thermometer} />
            <ProgressBar label="Fragile Handling" value={stats.cargoTypeCoverage.FRAGILE} total={stats.totalTrucks} color="bg-amber-500" icon={Activity} />
            <ProgressBar label="Hazardous Material" value={stats.cargoTypeCoverage.HAZARDOUS} total={stats.totalTrucks} color="bg-rose-500" icon={AlertCircle} />
            <ProgressBar label="Liquid Logistics" value={stats.cargoTypeCoverage.LIQUID} total={stats.totalTrucks} color="bg-emerald-500" icon={Fuel} />
            <ProgressBar label="Oversized Cargo" value={stats.cargoTypeCoverage.OVERSIZED} total={stats.totalTrucks} color="bg-purple-500" icon={TrendingUp} />
          </div>
        </div>

        {/* Thermal Infrastructure */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl text-cyan-600 dark:text-cyan-400">
              <Thermometer size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Thermal Control Grid</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Temperature-Regulated Capacity</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Frozen Zone', val: stats.temperatureRanges.frozen, sub: '-40°C to -10°C', color: 'blue' },
              { label: 'Chilled Zone', val: stats.temperatureRanges.chilled, sub: '-10°C to 5°C', color: 'cyan' },
              { label: 'Ambient Zone', val: stats.temperatureRanges.ambient, sub: '5°C to 25°C', color: 'emerald' },
              { label: 'Heated Zone', val: stats.temperatureRanges.heated, sub: '25°C+', color: 'rose' }
            ].map(zone => (
              <div key={zone.label} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-400 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">{zone.val}</span>
                  <div className={`size-1.5 rounded-full bg-${zone.color}-500 animate-pulse`} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">{zone.label}</p>
                <p className="text-[9px] font-bold text-slate-400/60 mt-1">{zone.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Intelligence */}
      <div className="bg-gradient-to-br from-slate-900 to-black rounded-[40px] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 p-20 opacity-[0.03] grayscale rotate-12 -mr-16 -mb-16">
          <TrendingUp size={240} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-5 mb-10">
            <div className="p-4 bg-white/10 rounded-2xl text-white backdrop-blur-md border border-white/10 shadow-xl">
              <Zap size={24} className="text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight">Predictive Intelligence Feed</h3>
              <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mt-1">Strategic Optimization Recommendations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightCard 
              title="Capacity Expansion"
              desc={stats.cargoTypeCoverage.HAZARDOUS < stats.totalTrucks * 0.3 
                ? "Hazardous transport certification is below 30%. Consider asset upgrading for high-margin specialized markets."
                : "Your hazardous transport capacity is well-positioned for market demands."}
              icon={AlertCircle}
              color="bg-rose-500"
            />
            <InsightCard 
              title="Asset Optimization"
              desc={analytics?.utilizationRate < 70
                ? "Current fleet utilization is sub-optimal. Review route assignments and reduce idle time in the Eastern sector."
                : "Excellent utilization rate. Maintaining current assignment density is recommended."}
              icon={TrendingUp}
              color="bg-blue-500"
            />
            <InsightCard 
              title="Compliance Alert"
              desc={stats.securityFeatures.gps < stats.totalTrucks * 0.9
                ? "Security hardware gap detected on several units. Full GPS integration is critical for Tier-1 insurance compliance."
                : "Hardware compliance is at peak levels. Security standards are fully met."}
              icon={ShieldCheck}
              color="bg-emerald-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
