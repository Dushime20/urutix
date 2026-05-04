import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import {
  PageSkeleton,
  DashboardSkeleton,
  TableSkeleton,
  CardSkeleton,
  ListItemSkeleton,
  StatsCardSkeleton,
  FormSkeleton,
  GridSkeleton,
  CenterLoader,
} from './LoadingSkeletons';

// ============================================================================
// UNIFIED LOADING COMPONENT - Uses Airbnb-style Skeleton Loading
// This is the ONLY loading component to be used across the entire application
// ============================================================================

interface ModernLoaderProps {
  isLoading: boolean;
  type?: 'page' | 'dashboard' | 'table' | 'cards' | 'list' | 'form' | 'section' | 'stats';
  // Optional props for customization
  rows?: number;
  columns?: number;
  items?: number;
  fields?: number;
  showStats?: boolean;
  containerRelative?: boolean;
  className?: string;
  text?: string; // For backward compatibility (not used in skeleton)
}

const ModernLoader: React.FC<ModernLoaderProps> = ({
  isLoading,
  type = 'section',
  rows,
  columns,
  items,
  fields,
  showStats,
  containerRelative = false,
  className,
}) => {
  if (!isLoading) return null;

  // Render appropriate skeleton based on type
  const renderSkeleton = () => {
    switch (type) {
      case 'page':
        return <PageSkeleton showStats={showStats} />;
      
      case 'dashboard':
        return <DashboardSkeleton />;
      
      case 'table':
        return <TableSkeleton rows={rows} columns={columns} />;
      
      case 'cards':
        return <GridSkeleton items={items} columns={columns as 1 | 2 | 3 | 4} />;
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: items || 8 }).map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        );
      
      case 'form':
        return <FormSkeleton fields={fields} />;
      
      case 'stats':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        );
      
      case 'section':
      default:
        return <CenterLoader className={className} />;
    }
  };

  // For containerRelative, wrap in a positioned container
  if (containerRelative) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn('absolute inset-0 bg-white dark:bg-slate-900 rounded-[inherit] overflow-auto', className)}
        >
          {renderSkeleton()}
        </motion.div>
      </AnimatePresence>
    );
  }

  // For full-screen loading
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('min-h-screen bg-slate-50 dark:bg-slate-900', className)}
      >
        {renderSkeleton()}
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernLoader;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*

// 1. Full Page Loading (with stats and table)
<ModernLoader isLoading={isLoading} type="page" showStats={true} />

// 2. Dashboard Loading (stats + charts + table)
<ModernLoader isLoading={isLoading} type="dashboard" />

// 3. Table Loading
<ModernLoader isLoading={isLoading} type="table" rows={10} columns={7} />

// 4. Card Grid Loading
<ModernLoader isLoading={isLoading} type="cards" items={6} columns={3} />

// 5. List Loading
<ModernLoader isLoading={isLoading} type="list" items={8} />

// 6. Form Loading
<ModernLoader isLoading={isLoading} type="form" fields={5} />

// 7. Stats Cards Loading
<ModernLoader isLoading={isLoading} type="stats" />

// 8. Section Loading (default - for small sections)
<ModernLoader isLoading={isLoading} type="section" />

// 9. Container Relative (for modals, cards, etc.)
<ModernLoader isLoading={isLoading} type="section" containerRelative={true} />

*/
