import React from 'react';
import { motion } from 'framer-motion';

export interface DataCardProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  headerColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';
}

const headerColorClasses = {
  primary: 'bg-gradient-to-r from-indigo-500 to-purple-600',
  secondary: 'bg-gradient-to-r from-purple-500 to-pink-600',
  success: 'bg-gradient-to-r from-green-500 to-emerald-600',
  warning: 'bg-gradient-to-r from-amber-500 to-orange-600',
  error: 'bg-gradient-to-r from-red-500 to-rose-600',
  info: 'bg-gradient-to-r from-cyan-500 to-blue-600',
  default: 'bg-gray-50 border-b border-gray-200',
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
      className={`bg-white rounded-2xl border border-slate-100 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className={`px-6 py-4 ${headerColorClasses[headerColor]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`text-2xl ${isGradient ? 'text-white' : 'text-gray-700'}`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className={`text-lg font-bold ${isGradient ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-sm mt-1 ${isGradient ? 'text-white/80' : 'text-gray-600'}`}>
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
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};

export default DataCard;
