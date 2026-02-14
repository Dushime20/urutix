import React from 'react';
import { motion } from 'framer-motion';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

const colorClasses = {
  primary: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    border: 'border-indigo-500',
    gradient: 'from-indigo-500 to-purple-600',
  },
  secondary: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-500',
    gradient: 'from-purple-500 to-pink-600',
  },
  success: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-500',
    gradient: 'from-green-500 to-emerald-600',
  },
  warning: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-500',
    gradient: 'from-amber-500 to-orange-600',
  },
  error: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-500',
    gradient: 'from-red-500 to-rose-600',
  },
  info: {
    bg: 'bg-cyan-50',
    icon: 'text-cyan-600',
    border: 'border-cyan-500',
    gradient: 'from-cyan-500 to-blue-600',
  },
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
}) => {
  const colors = colorClasses[color];

  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-green-600 bg-green-50';
    if (trendDirection === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return '↑';
    if (trendDirection === 'down') return '↓';
    return '→';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-white rounded-2xl border border-slate-100
        border-l-4 ${colors.border}
        p-6 transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Gradient background decoration */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -mr-16 -mt-16`} />

      <div className="relative z-10">
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
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getTrendColor()}`}
            >
              <span>{getTrendIcon()}</span>
              <span>{trend}</span>
            </motion.div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-gray-600 text-sm font-medium mb-2 uppercase tracking-wide">
          {title}
        </h3>

        {/* Value */}
        {loading ? (
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        ) : (
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-gray-900 mb-1"
          >
            {value}
          </motion.p>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">
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
