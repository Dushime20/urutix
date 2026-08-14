import React from 'react';
import { motion } from 'framer-motion';

export interface StatCardProps {
  title: React.ReactNode;
  value: number | string;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'accent' | 'purple' | 'pink' | 'emerald';
  subtitle?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  variant?: 'classic' | 'modern' | 'premium' | 'circular';
  colorClass?: string;
  secondaryColor?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-blue-50/30 dark:bg-blue-900/20',
    icon: 'text-[#2c5173] dark:text-blue-400', // Primary Brand Blue
    border: 'border-[#2c5173] dark:border-blue-500',
    accent: 'text-[#2c5173] dark:text-blue-400',
    circle: 'border-[#2c5173] dark:border-blue-500',
  },
  secondary: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    icon: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-400 dark:border-slate-600',
    accent: 'text-slate-900 dark:text-slate-100',
    circle: 'border-slate-100 dark:border-slate-700',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    border: 'border-green-600 dark:border-green-500',
    accent: 'text-green-900 dark:text-green-300',
    circle: 'border-green-100 dark:border-green-900',
  },
  warning: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    icon: 'text-orange-500 dark:text-orange-400',
    border: 'border-orange-500 dark:border-orange-400',
    accent: 'text-orange-900 dark:text-orange-300',
    circle: 'border-orange-100 dark:border-orange-900',
  },
  error: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'text-rose-500 dark:text-rose-400',
    border: 'border-rose-500 dark:border-rose-400',
    accent: 'text-rose-900 dark:text-rose-300',
    circle: 'border-rose-100 dark:border-rose-900',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-500 dark:text-blue-400',
    border: 'border-blue-500 dark:border-blue-400',
    accent: 'text-blue-900 dark:text-blue-300',
    circle: 'border-blue-100 dark:border-blue-900',
  },
  accent: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-600 dark:border-indigo-400',
    accent: 'text-indigo-900 dark:text-indigo-300',
    circle: 'border-indigo-100 dark:border-indigo-900',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-600 dark:border-purple-400',
    accent: 'text-purple-900 dark:text-purple-300',
    circle: 'border-purple-100 dark:border-purple-900',
  },
  pink: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-600 dark:border-rose-400',
    accent: 'text-rose-900 dark:text-rose-300',
    circle: 'border-rose-100 dark:border-rose-900',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-600 dark:border-emerald-400',
    accent: 'text-emerald-900 dark:text-emerald-300',
    circle: 'border-emerald-100 dark:border-emerald-900',
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendDirection = 'neutral',
  color = 'primary',
  subtitle,
  loading = false,
  onClick,
  variant = 'modern',
  colorClass,
  secondaryColor,
}) => {
  const colors = colorClasses[color];

  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    if (trendDirection === 'down') return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    return 'text-gray-600 bg-gray-50 dark:text-slate-400 dark:bg-slate-800';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '↑';
    if (trendDirection === 'down') return '↓';
    return '→';
  };

  if (variant === 'circular') {
    const iconCls = colorClass ?? `${colors.bg} ${colors.icon}`;
    const arcCls  = secondaryColor ?? colors.icon;
    return (
      <div className="flex flex-col items-center group" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
        <div className="relative w-40 h-40 rounded-full bg-white dark:bg-slate-900 border-[8px] border-slate-50 dark:border-slate-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-gray-100 dark:hover:border-gray-700 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50">
          <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
            <circle
              cx="80" cy="80" r="72"
              fill="none" stroke="currentColor"
              strokeWidth="3" strokeDasharray="452" strokeDashoffset="350"
              className={`opacity-10 transition-all duration-1000 ${arcCls}`}
            />
          </svg>
          {loading ? (
            <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-current animate-spin opacity-40" />
          ) : (
            <>
              <div className={`p-2 rounded-2xl mb-2 transition-all duration-500 ${iconCls} group-hover:bg-white dark:group-hover:bg-slate-700`}>
                {icon}
              </div>
              <div className="flex flex-col items-center px-4 w-full overflow-hidden">
                <span className="text-2xl font-black text-[#0f172a] dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
                  {value}
                </span>
              </div>
            </>
          )}
          <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 dark:border-slate-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>
        <div className="mt-4 text-center px-2">
          <p className="ui-badge text-slate-400 dark:text-slate-500 group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'premium') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        onClick={onClick}
        className={`
          relative group overflow-hidden bg-white dark:bg-slate-900 rounded-[24px] p-5 
          border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl 
          transition-all duration-500 ${onClick ? 'cursor-pointer' : ''}
        `}
      >
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-[16px] ${colors.bg} backdrop-blur-md border border-white/50 dark:border-white/5 group-hover:scale-105 transition-transform duration-500`}>
              <div className={`text-xl ${colors.icon}`}>
                {icon}
              </div>
            </div>
            {trend && (
              <div className={`px-2 py-1 rounded-full ui-badge flex items-center gap-1 shadow-sm ${getTrendColor()}`}>
                <span>{getTrendIcon()}</span>
                <span>{trend}</span>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <h3 className="ui-label mb-0 text-slate-400">
              {title}
            </h3>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black text-slate-900 dark:text-white tracking-tight`}>
                {value}
              </span>
            </div>
            {subtitle && (
              <p className="ui-caption font-bold text-slate-400 mt-1 uppercase tracking-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 ${colors.bg}`} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
    );
  }

  if (variant === 'modern') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        onClick={onClick}
        className={`
          flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800
          ${onClick ? 'cursor-pointer' : ''}
          transition-all duration-300
        `}
      >
        {/* Circular Icon Container */}
        <div className={`
          relative flex items-center justify-center
          w-16 h-16 rounded-full border p-1
          ${colors.border}
        `}>
          <div className="flex items-center justify-center w-full h-full rounded-full bg-white dark:bg-slate-900">
            <div className={`${colors.icon} text-2xl`}>
              {icon}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-16 bg-gray-100 dark:bg-slate-800 animate-pulse rounded" />
              <div className="h-4 w-24 bg-gray-50 dark:bg-slate-800/50 animate-pulse rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${colors.icon}`}>
                  {value}
                </span>
                {trend && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrendColor()}`}>
                    {getTrendIcon()}{trend}
                  </span>
                )}
              </div>
              <span className="text-slate-500 ui-body-small tracking-tight">
                {title}
              </span>
              {subtitle && (
                <span className="ui-label mb-0 mt-0.5">
                  {subtitle}
                </span>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800
        border-l-4 ${colors.border}
        p-6 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Background decoration: Large icon with low opacity following Super Admin pattern */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 group-hover:opacity-[0.05]">
        <div className="text-[100px] leading-none transform translate-x-8 -translate-y-4">
          {icon}
        </div>
      </div>

      <div className="relative z-[1]">
        {/* Header with icon and trend */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 ${colors.bg} rounded-xl`}>
            <div className={`text-2xl ${colors.icon}`}>
              {icon}
            </div>
          </div>

          {trend && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className={`px-3 py-1 rounded-full ui-badge flex items-center gap-1 ${getTrendColor()}`}
            >
              <span>{getTrendIcon()}</span>
              <span>{trend}</span>
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h3 className="ui-label text-gray-600 dark:text-slate-400">
          {title}
        </h3>

        {/* Value */}
        {loading ? (
          <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight"
          >
            {value}
          </motion.p>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="ui-label mb-0 mt-2 leading-none">
            {subtitle}
          </p>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 hover:opacity-10 transition-opacity duration-300" />
    </motion.div>
  );
};

export default StatCard;

/**
 * Drop-in replacement for the local CircularStatsCard / StatsCard used across
 * DriversList, TrucksList, SafetyManagement, FleetAnalytics, FuelPage,
 * TripManagement, TruckOwnerProfilePage, UnifiedDriverManagement,
 * Routes, Tracking, and any other page that had its own copy.
 */
export const CircularStatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass?: string;
  secondaryColor?: string;
  loading?: boolean;
  onClick?: () => void;
}> = ({ title, value, icon: Icon, colorClass, secondaryColor, loading, onClick }) => (
  <StatCard
    title={title}
    value={value}
    icon={<Icon size={18} />}
    variant="circular"
    colorClass={colorClass}
    secondaryColor={secondaryColor}
    loading={loading}
    onClick={onClick}
  />
);
