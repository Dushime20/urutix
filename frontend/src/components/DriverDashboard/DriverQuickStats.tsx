import React from 'react';
import { Truck, DollarSign, Star, Clock, Activity, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface Stat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  colorClass: string;
  secondaryColor: string;
}

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

const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="flex flex-col items-center group cursor-pointer"
  >
    <div className="relative w-40 h-40 rounded-full bg-white border-[6px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-200/50">
      {/* Animated Orbiting Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
        <circle
          cx="80"
          cy="80"
          r="74"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="465"
          strokeDashoffset="400"
          className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
        />
      </svg>

      <div className={cn("p-3 rounded-2xl mb-1 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex flex-col items-center">
        <span className="text-2xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500">
          {value}
        </span>
      </div>
    </div>

    <div className="mt-5 text-center px-4">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] group-hover:text-[#345E85] transition-colors duration-300">
        {title}
      </p>
    </div>
  </motion.div>
);

export const DriverQuickStats: React.FC<DriverQuickStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 place-items-center">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="w-40 h-40 rounded-full bg-white border-[6px] border-slate-50 animate-pulse flex flex-col items-center justify-center">
            <div className="w-10 h-10 bg-slate-50 rounded-xl mb-2" />
            <div className="w-16 h-6 bg-slate-50 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  const statCards: Stat[] = [
    {
      label: 'Trips',
      value: stats.totalTrips || 0,
      icon: Truck,
      colorClass: "bg-blue-50 text-[#345E85]",
      secondaryColor: "text-[#345E85]"
    },
    {
      label: 'Earnings',
      value: `$${Math.round(stats.totalEarnings || 0).toLocaleString()}`,
      icon: DollarSign,
      colorClass: "bg-blue-50 text-[#345E85]", // Updated to match Trips
      secondaryColor: "text-[#345E85]"
    },
    {
      label: 'Rating',
      value: (stats.rating || 0).toFixed(1),
      icon: Star,
      colorClass: "bg-blue-50 text-[#345E85]", // Updated to match Trips
      secondaryColor: "text-[#345E85]"
    },
    {
      label: 'Completion',
      value: `${stats.completionRate || 0}%`,
      icon: CheckCircle,
      colorClass: "bg-blue-50 text-[#345E85]", // Updated to match Trips
      secondaryColor: "text-[#345E85]"
    },
    {
      label: 'Active',
      value: stats.activeTrips || 0,
      icon: Activity,
      colorClass: "bg-blue-50 text-[#345E85]", // Updated to match Trips
      secondaryColor: "text-[#345E85]"
    },
    {
      label: 'Hours',
      value: `${stats.hoursWorked || 0}H`,
      icon: Clock,
      colorClass: "bg-blue-50 text-[#345E85]", // Updated to match Trips
      secondaryColor: "text-[#345E85]"
    }
  ];

  return (
    <div className="bg-slate-50/50 p-6 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-inner mb-8 md:mb-12 overflow-x-auto">
      <div className="flex lg:grid lg:grid-cols-6 gap-6 md:gap-10 min-w-max lg:min-w-0 px-4 lg:px-0">
        {statCards.map((stat, index) => (
          <div key={stat.label} className="w-32 md:w-auto">
            <CircularStatsCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              colorClass={stat.colorClass}
              secondaryColor={stat.secondaryColor}
              delay={index * 0.1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

