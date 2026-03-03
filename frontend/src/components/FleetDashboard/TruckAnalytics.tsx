import React from 'react';
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
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TruckAnalyticsProps {
  trucks: any[];
}

export const TruckAnalytics: React.FC<TruckAnalyticsProps> = ({ trucks }) => {
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
        frozen: 0, // -40 to -10
        chilled: 0, // -10 to 5
        ambient: 0, // 5 to 25
        heated: 0, // 25+
      },
    };

    trucks.forEach(truck => {
      if (truck.cargoCapabilities) {
        // Cargo type coverage
        truck.cargoCapabilities.supportedCargoTypes?.forEach((type: string) => {
          if (stats.cargoTypeCoverage[type as keyof typeof stats.cargoTypeCoverage] !== undefined) {
            stats.cargoTypeCoverage[type as keyof typeof stats.cargoTypeCoverage]++;
          }
        });

        // Special handling capabilities
        if (truck.cargoCapabilities.maxFragileHandling) stats.specialHandling.fragile++;
        if (truck.cargoCapabilities.maxHazardousHandling) stats.specialHandling.hazardous++;
        if (truck.cargoCapabilities.maxRefrigeratedHandling) stats.specialHandling.refrigerated++;
        if (truck.cargoCapabilities.maxLiquidHandling) stats.specialHandling.liquid++;
        if (truck.cargoCapabilities.maxOversizedHandling) stats.specialHandling.oversized++;
        if (truck.cargoCapabilities.maxValuableHandling) stats.specialHandling.valuable++;

        // Temperature range analysis
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

  const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: number; icon: any; color: string; trend?: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className={`bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group`}
    >
      <div className={`absolute top-0 right-0 p-10 opacity-[0.03] -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-500`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`size-10 rounded-xl flex items-center justify-center ${color} shadow-inner`}>
            <Icon size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 mb-1.5 uppercase tracking-wider">
              <TrendingUp size={12} />
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ProgressBar = ({ label, value, total, color, icon: Icon }: { label: string; value: number; total: number; color: string; icon?: any }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className="text-slate-400" />}
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-900">{value}</span>
            <span className="text-[10px] font-bold text-slate-400">/ {total}</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${color} shadow-sm relative`}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-blue-50 rounded-[20px] flex items-center justify-center text-[#345E85] shadow-inner">
            <BarChart3 size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#345E85] mb-1">Fleet Overview</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Capabilities</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
            <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5 uppercase tracking-wider">
              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <button className="h-12 px-6 bg-[#1A1C1E] text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
            <Cpu size={14} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Primary Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Trucks"
          value={stats.totalTrucks}
          icon={Truck}
          color="bg-blue-50 text-blue-600"
          trend="+12% Usage"
        />
        <StatCard
          title="GPS Enabled"
          value={stats.securityFeatures.gps}
          icon={ShieldCheck}
          color="bg-emerald-50 text-emerald-600"
          trend="92% Coverage"
        />
        <StatCard
          title="Refrigerated"
          value={stats.specialHandling.refrigerated}
          icon={Thermometer}
          color="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          title="Hazardous Certs"
          value={stats.specialHandling.hazardous}
          icon={Box}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Coverage Analysis Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cargo Specialization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8 col-span-2"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="size-10 bg-indigo-50 rounded-[14px] flex items-center justify-center text-indigo-600 shadow-inner">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Cargo Capabilities</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Distribution of cargo types</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <ProgressBar label="General Cargo" value={stats.cargoTypeCoverage.GENERAL} total={stats.totalTrucks} color="bg-blue-500" icon={Box} />
            <ProgressBar label="Fragile Goods" value={stats.cargoTypeCoverage.FRAGILE} total={stats.totalTrucks} color="bg-amber-500" icon={Activity} />
            <ProgressBar label="Hazardous" value={stats.cargoTypeCoverage.HAZARDOUS} total={stats.totalTrucks} color="bg-rose-500" icon={AlertCircle} />
            <ProgressBar label="Refrigerated" value={stats.cargoTypeCoverage.REFRIGERATED} total={stats.totalTrucks} color="bg-cyan-500" icon={Thermometer} />
            <ProgressBar label="Liquid Loads" value={stats.cargoTypeCoverage.LIQUID} total={stats.totalTrucks} color="bg-emerald-500" icon={Fuel} />
            <ProgressBar label="Oversized Cargo" value={stats.cargoTypeCoverage.OVERSIZED} total={stats.totalTrucks} color="bg-purple-500" icon={TrendingUp} />
          </div>
        </motion.div>

        {/* Security & Hardware */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#1A1C1E] rounded-[40px] shadow-2xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-16 opacity-[0.05] grayscale -mr-8 -mt-8">
            <ShieldCheck size={140} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="size-10 bg-white/10 rounded-[14px] flex items-center justify-center text-white shadow-inner">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">Fleet Security</h3>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-0.5">Hardware & Tracking Status</p>
              </div>
            </div>

            <div className="space-y-8 mt-10">
              <ProgressBar label="GPS Tracking" value={stats.securityFeatures.gps} total={stats.totalTrucks} color="bg-white" />
              <ProgressBar label="Data Feed" value={stats.securityFeatures.tracking} total={stats.totalTrucks} color="bg-blue-400" />
              <ProgressBar label="Temperature Alerts" value={stats.securityFeatures.temperatureMonitoring} total={stats.totalTrucks} color="bg-rose-400" />
              <ProgressBar label="Cargo Monitoring" value={stats.securityFeatures.cargoMonitoring} total={stats.totalTrucks} color="bg-emerald-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Equipment & Thermal Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loading Equipment */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-10 bg-slate-50 rounded-[14px] flex items-center justify-center text-slate-600 shadow-inner">
              <Wrench size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Loading Equipment</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Onboard Tools & Hardware</p>
            </div>
          </div>

          <div className="space-y-6">
            <ProgressBar label="Forklift Available" value={stats.equipmentCoverage.forklift} total={stats.totalTrucks} color="bg-slate-700" />
            <ProgressBar label="Crane Available" value={stats.equipmentCoverage.crane} total={stats.totalTrucks} color="bg-slate-700" />
            <ProgressBar label="Tail Lift Available" value={stats.equipmentCoverage.tailLift} total={stats.totalTrucks} color="bg-slate-700" />
          </div>
        </div>

        {/* Thermal Layers */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-10 bg-cyan-50 rounded-[14px] flex items-center justify-center text-cyan-600 shadow-inner">
              <Thermometer size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Temperature Zones</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Cold Chain Capabilities</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50/50 p-4 rounded-[24px] text-center border border-slate-50 group hover:bg-blue-600 hover:text-white transition-all cursor-default">
              <div className="text-2xl font-black mb-1">{stats.temperatureRanges.frozen}</div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Frozen Zone</div>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-[24px] text-center border border-slate-50 group hover:bg-cyan-500 hover:text-white transition-all cursor-default">
              <div className="text-2xl font-black mb-1">{stats.temperatureRanges.chilled}</div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Chilled Zone</div>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-[24px] text-center border border-slate-50 group hover:bg-emerald-500 hover:text-white transition-all cursor-default">
              <div className="text-2xl font-black mb-1">{stats.temperatureRanges.ambient}</div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Ambient Zone</div>
            </div>
            <div className="bg-slate-50/50 p-4 rounded-[24px] text-center border border-slate-50 group hover:bg-rose-500 hover:text-white transition-all cursor-default">
              <div className="text-2xl font-black mb-1">{stats.temperatureRanges.heated}</div>
              <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Heated Zone</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Intelligence Feed */}
      <div className="bg-gradient-to-br from-[#1A1C1E] to-[#2D3135] rounded-[40px] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 p-16 opacity-[0.05] grayscale rotate-12 -mr-10 -mb-10">
          <TrendingUp size={160} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="size-10 bg-white/10 rounded-[14px] flex items-center justify-center text-white shadow-inner">
              <Cpu size={20} />
            </div>
            <h3 className="text-lg font-black tracking-tight">Fleet Suggestions</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.cargoTypeCoverage.HAZARDOUS < stats.totalTrucks * 0.3 && (
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                <AlertCircle className="text-rose-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-rose-400 mb-1">Low Hazardous Capacity</h4>
                  <p className="text-xs font-medium text-white/60 leading-relaxed">Hazardous transport certification is below 30% of total units. Consider asset upgrading for more markets.</p>
                </div>
              </div>
            )}
            {stats.cargoTypeCoverage.REFRIGERATED < stats.totalTrucks * 0.4 && (
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                <Thermometer className="text-cyan-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-cyan-400 mb-1">Low Cold Capacity</h4>
                  <p className="text-xs font-medium text-white/60 leading-relaxed">Refrigerated units are limited. Increasing cold-chain units will improve contract acquisition for perishable cargo.</p>
                </div>
              </div>
            )}
            {stats.securityFeatures.gps < stats.totalTrucks * 0.8 && (
              <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                <Navigation className="text-blue-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-1">Missing GPS Trackers</h4>
                  <p className="text-xs font-medium text-white/60 leading-relaxed">GPS tracking is missing on several units. Full-fleet tracking is recommended for insurance compliance.</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group">
              <Zap className="text-emerald-400 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-1">Fleet Strength</h4>
                <p className="text-xs font-medium text-white/60 leading-relaxed">Current fleet configuration is great for general cargo logistics. Keep maintaining this balance.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
