import React from 'react';
import { motion } from 'framer-motion';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
  variant?: 'classic' | 'modern';
}

const colorClasses = {
  primary: {
    bg: 'bg-blue-50',
    icon: 'text-[#345E85]', // Primary Brand Blue
    border: 'border-[#345E85]',
    accent: 'text-blue-900',
    circle: 'border-blue-100',
  },
  secondary: {
    bg: 'bg-slate-50',
    icon: 'text-slate-600',
    border: 'border-slate-400',
    accent: 'text-slate-900',
    circle: 'border-slate-100',
  },
  success: {
    bg: 'bg-blue-50',
    icon: 'text-[#2D5173]', // Deeper Blue
    border: 'border-[#2D5173]',
    accent: 'text-blue-900',
    circle: 'border-blue-100',
  },
  warning: {
    bg: 'bg-blue-50',
    icon: 'text-[#5F8FB3]', // Muted Blue
    border: 'border-[#5F8FB3]',
    accent: 'text-blue-900',
    circle: 'border-blue-100',
  },
  error: {
    bg: 'bg-blue-50',
    icon: 'text-[#87ABC6]', // Lighter Blue
    border: 'border-[#87ABC6]',
    accent: 'text-blue-900',
    circle: 'border-blue-100',
  },
  info: {
    bg: 'bg-indigo-50',
    icon: 'text-[#2563eb]', // Vibrant Blue
    border: 'border-[#2563eb]',
    accent: 'text-indigo-900',
    circle: 'border-indigo-100',
  },
  accent: {
    bg: 'bg-blue-50',
    icon: 'text-[#182A3D]', // Navy Blue
    border: 'border-[#182A3D]',
    accent: 'text-blue-900',
    circle: 'border-blue-100',
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

  if (variant === 'modern') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        onClick={onClick}
        className={`
          flex items-center gap-4 bg-white p-4 rounded-xl
          ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
          transition-all duration-300
        `}
      >
        {/* Circular Icon Container */}
        <div className={`
          relative flex items-center justify-center
          w-16 h-16 rounded-full border-2 p-1
          ${colors.border}
        `}>
          <div className="flex items-center justify-center w-full h-full rounded-full bg-white shadow-inner">
            <div className={`${colors.icon} text-2xl`}>
              {icon}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col">
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-16 bg-gray-100 animate-pulse rounded" />
              <div className="h-4 w-24 bg-gray-50 animate-pulse rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${colors.icon}`}>
                  {value}
                </span>
                {trend && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTrendColor()}`}>
                    {getTrendIcon()}{trend}
                  </span>
                )}
              </div>
              <span className="text-slate-500 text-sm font-medium tracking-tight">
                {title}
              </span>
              {subtitle && (
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
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
        bg-white rounded-2xl border border-slate-100
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
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-none">
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
