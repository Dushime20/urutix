import { Truck, DollarSign, Star, Clock, Activity, CheckCircle, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';

interface DriverQuickStatsProps {
  stats: {
    totalTrips?: number;
    totalEarnings?: number;
    rating?: number;
    completionRate?: number;
    activeTrips?: number;
    hoursWorked?: number;
  };
  hos?: {
    hoursWorkedThisWeek: number;
    maxHoursPerShift: number;
    consecutiveDrivingHours: number;
    fatiguePercent: number;
    status: string;
    breakInHours: number | null;
  } | null;
  isLoading?: boolean;
}

const DashboardStatCard = ({ title, value, icon: Icon, delay = 0, isAward = false, percentage = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 group hover:border-[#2b5271]/30 dark:hover:border-slate-700 transition-all duration-500 flex flex-col justify-between relative overflow-hidden"
  >
    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] dark:text-[#2b5271] border border-blue-100/50 dark:border-slate-700 group-hover:bg-[#2b5271] dark:group-hover:bg-[#2b5271] group-hover:text-white transition-all">
          <Icon size={18} />
        </div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-[#2b5271] dark:group-hover:text-[#2b5271] transition-colors">
          <TranslatedText text={title} />
        </p>
      </div>
      {isAward && (
        <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-xl border border-amber-200 dark:border-amber-800/50">
           <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        </div>
      )}
    </div>

    <div className="flex items-end justify-between gap-4 relative z-10">
      <div>
        <h4 className="text-2xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight group-hover:scale-105 transition-transform origin-left">
          {value}
        </h4>
        <div className="flex items-center gap-1.5 mt-2">
           <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
           <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Live Data</p>
        </div>
      </div>
      
      {/* Mini Sparkline / Circular Progress */}
      <div className="w-12 h-12 relative shrink-0">
          <svg className="w-full h-full -rotate-90">
             <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-50 dark:text-slate-800"
             />
             <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * (percentage / 100))}
                className="text-[#2b5271] dark:text-[#2b5271] transition-all duration-1000"
                strokeLinecap="round"
             />
          </svg>
      </div>
    </div>
  </motion.div>
);

export const DriverQuickStats: React.FC<DriverQuickStatsProps> = ({ stats, hos, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards: any[] = [
    {
      label: 'Trips',
      value: stats.totalTrips || 0,
      icon: Truck,
      percentage: 100,
    },
    {
      label: 'Earnings',
      value: `$${Math.round(stats.totalEarnings || 0).toLocaleString()}`,
      icon: DollarSign,
      percentage: 75,
    },
    {
      label: 'Rating',
      value: (stats.rating || 0).toFixed(1),
      icon: Star,
      percentage: (stats.rating || 0) * 20,
    },
    {
      label: 'Completion',
      value: `${stats.completionRate || 0}%`,
      icon: CheckCircle,
      percentage: stats.completionRate || 0,
    },
    {
      label: 'Active',
      value: stats.activeTrips || 0,
      icon: Activity,
      percentage: (stats.activeTrips || 0) > 0 ? 100 : 0,
    },
    {
      label: 'Hours',
      value: `${stats.hoursWorked || 0}H`,
      icon: Clock,
      percentage: ((stats.hoursWorked || 0) / 40) * 100,
    },
    {
      label: 'Fatigue',
      value: hos ? `${hos.fatiguePercent}%` : '—',
      icon: Activity,
      percentage: hos?.fatiguePercent ?? 0,
    }
  ];

  return (
    <div className="mb-4 md:mb-12">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 md:gap-5 px-1.5 lg:px-0">
        {statCards.map((stat, index) => (
          <DashboardStatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            icon={stat.icon}
            percentage={stat.percentage}
            delay={index * 0.1}
            isAward={stat.label === 'Rating' && parseFloat(String(stat.value)) >= 4.5}
          />
        ))}
      </div>

      {/* HOS Quick Glance */}
      <div className="mt-12 pt-8 border-t border-slate-100/50 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-[#2b5271] dark:text-[#2b5271] border border-blue-100 dark:border-slate-700">
                <Clock size={18} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Shift Progress</p>
                <p className="text-sm font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                  {hos ? `${hos.consecutiveDrivingHours} / ${hos.maxHoursPerShift} Hours Driven` : '— / — Hours Driven'}
                </p>
             </div>
          </div>
          <div className="flex-1 w-full max-w-md">
             <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#2b5271] dark:bg-[#2b5271] h-full transition-all duration-700"
                  style={{ width: hos ? `${Math.min(100, (hos.consecutiveDrivingHours / hos.maxHoursPerShift) * 100)}%` : '0%' }}
                />
             </div>
          </div>
          <div className="flex items-center gap-3">
             <span className={`px-3 py-1 border rounded-lg text-[10px] font-black uppercase tracking-widest ${
               hos?.status === 'Rest Required' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800' :
               hos?.status === 'Caution' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
               'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
             }`}>
               {hos?.status ?? '—'}
             </span>
             {hos?.breakInHours != null && (
               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                 Break in {hos.breakInHours}H
               </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
