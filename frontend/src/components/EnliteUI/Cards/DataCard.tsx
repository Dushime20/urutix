import React from 'react';
import { motion } from 'framer-motion';

export interface DataCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  headerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
}

const headerColorClasses = {
  primary: 'bg-[#345E85] dark:bg-blue-900/40 text-white',
  secondary: 'bg-slate-900 dark:bg-slate-950 text-white',
  success: 'bg-emerald-600 dark:bg-emerald-900/40 text-white',
  warning: 'bg-amber-500 dark:bg-amber-900/40 text-white',
  error: 'bg-rose-600 dark:bg-rose-900/40 text-white',
  info: 'bg-sky-500 dark:bg-blue-900/40 text-white',
  default: 'bg-[#fafafa] dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700',
};

export const DataCard: React.FC<DataCardProps> = ({
  title,
  children,
  actions,
  subtitle,
  icon,
  loading = false,
  className = '',
  headerColor = 'default',
}) => {
  const isGradient = headerColor !== 'default';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className={`px-6 py-4 ${headerColorClasses[headerColor]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`text-2xl ${isGradient ? 'text-white' : 'text-gray-700 dark:text-slate-300'}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className={`text-lg font-bold ${isGradient ? 'text-white' : 'text-gray-900 dark:text-slate-100'}`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-sm mt-1 ${isGradient ? 'text-white/80' : 'text-gray-600 dark:text-slate-400'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-4/6" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

export default DataCard;
