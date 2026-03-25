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
  isLoading?: boolean;
}

const DashboardStatCard = ({ title, value, icon: Icon, delay = 0, isAward = false, percentage = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-[#345E85]/30 hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100/50 group-hover:bg-[#345E85] group-hover:text-white transition-all shadow-sm">
          <Icon size={18} />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#345E85] transition-colors">
          <TranslatedText text={title} />
        </p>
      </div>
      {isAward && (
        <div className="bg-amber-100 p-1.5 rounded-xl border border-amber-200">
           <Award className="w-3 h-3 text-amber-600" />
        </div>
      )}
    </div>

    <div className="flex items-end justify-between gap-4">
      <div>
        <h4 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight group-hover:scale-105 transition-transform origin-left">
          {value}
        </h4>
        <div className="flex items-center gap-1.5 mt-2">
           <TrendingUp size={12} className="text-emerald-500" />
           <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">12.5% <span className="text-slate-400 font-medium">up</span></p>
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
                className="text-slate-50"
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
                className="text-[#345E85] transition-all duration-1000"
                strokeLinecap="round"
             />
          </svg>
      </div>
    </div>
  </motion.div>
);

export const DriverQuickStats: React.FC<DriverQuickStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100 animate-pulse" />
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
      value: '22%',
      icon: Activity,
      percentage: 22,
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
      <div className="mt-12 pt-8 border-t border-slate-100/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 shadow-sm">
                <Clock size={18} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Progress</p>
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">4.5 / 11.0 Hours Driven</p>
             </div>
          </div>
          <div className="flex-1 w-full max-w-md">
             <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full w-[41%]" />
             </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-black uppercase tracking-widest">Safe to Drive</span>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Break in 3.5H</span>
          </div>
        </div>
      </div>
    </div>
  );
};
