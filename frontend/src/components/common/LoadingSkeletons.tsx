import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Base Skeleton Component
interface SkeletonProps {
  className?: string;
  variant?: 'light' | 'dark';
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'light',
  animate = true 
}) => {
  const baseClasses = variant === 'light' 
    ? 'bg-slate-200 dark:bg-slate-700' 
    : 'bg-slate-300 dark:bg-slate-600';

  if (animate) {
    return (
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={cn(baseClasses, 'rounded', className)}
      />
    );
  }

  return <div className={cn(baseClasses, 'rounded', className)} />;
};

// Card Skeleton (Airbnb-style)
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-slate-200 dark:border-slate-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 5 
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4">
                <Skeleton className="h-4 w-full" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
};

// List Item Skeleton
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
  );
};

// Dashboard Skeleton (Full Page)
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={8} columns={6} />
    </div>
  );
};

// Page Skeleton (content only — no sticky title bar)
export const PageSkeleton: React.FC<{ showStats?: boolean }> = ({ showStats = true }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        )}
        
        <TableSkeleton rows={10} columns={7} />
      </div>
    </div>
  );
};

// Spinner Loader (for small inline loading)
export const SpinnerLoader: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={cn('inline-block', className)}>
      <div className={cn(
        'animate-spin rounded-full border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500',
        sizeClasses[size]
      )} />
    </div>
  );
};

// Center Loader (for full page or section)
export const CenterLoader: React.FC<{ 
  text?: string; 
  fullScreen?: boolean;
  className?: string;
}> = ({ 
  text = 'Loading...', 
  fullScreen = false,
  className 
}) => {
  return (
    <div className={cn(
      'flex items-center justify-center',
      fullScreen ? 'min-h-screen' : 'min-h-[400px]',
      className
    )}>
      <div className="text-center">
        <SpinnerLoader size="lg" className="mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{text}</p>
      </div>
    </div>
  );
};

// Grid Skeleton (for card grids)
export const GridSkeleton: React.FC<{ 
  items?: number; 
  columns?: 1 | 2 | 3 | 4;
}> = ({ 
  items = 6,
  columns = 3 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-6', gridClasses[columns])}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 5 }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <Skeleton className="h-6 w-48 mb-6" />
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

// Export all components
export default {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  TableRowSkeleton,
  StatsCardSkeleton,
  ListItemSkeleton,
  DashboardSkeleton,
  PageSkeleton,
  SpinnerLoader,
  CenterLoader,
  GridSkeleton,
  FormSkeleton,
};
