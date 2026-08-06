import React from 'react';
import {
  CheckCircle, AlertTriangle, Info, Clock,
  ArrowRight, Package, Shield, CreditCard, User, Truck, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface Activity {
  id: number;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
}

interface RecentActivityProps {
  activities: Activity[];
  maxItems?: number;
  onTrackEvent?: (activity: Activity) => void;
  className?: string;
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  maxItems = 10,
  onTrackEvent,
  className = '',
}) => {
  const { tSync } = useTranslation();
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'info':
        return <Info className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800';
      case 'error':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800';
      case 'info':
        return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border-primary-100 dark:border-primary-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = 'w-4 h-4 text-primary-700 dark:text-primary-400';
    switch (type) {
      case 'shipment':
        return <Package className={iconClass} />;
      case 'maintenance':
        return <Truck className={iconClass} />;
      case 'payment':
        return <CreditCard className={iconClass} />;
      case 'dispute':
        return <Shield className={iconClass} />;
      case 'driver':
        return <User className={iconClass} />;
      case 'fleet':
        return <Truck className={iconClass} />;
      default:
        return <ClipboardList className={iconClass} />;
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -8 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
            <TranslatedText text="Activity" />
          </p>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            <TranslatedText text="Recent updates" />
          </h3>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {displayedActivities.length} <TranslatedText text="items" />
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {displayedActivities.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100 dark:divide-slate-800"
          >
            {displayedActivities.map((activity) => (
              <motion.div
                key={activity.id}
                variants={item}
                className="px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 shrink-0">
                    {getTypeIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        <TranslatedText text={activity.action} />
                      </p>
                      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0">
                        {getStatusIcon(activity.status)}
                        <span className="text-[11px] font-medium">{tSync(activity.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      <TranslatedText text={activity.description} />
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusColor(activity.status)}`}>
                        <TranslatedText text={activity.status} />
                      </span>
                      <button
                        onClick={() => onTrackEvent?.(activity)}
                        className="text-[11px] font-medium text-primary-600 dark:text-primary-400 inline-flex items-center hover:opacity-70 transition-opacity"
                        aria-label={tSync('View details for activity')}
                      >
                        <TranslatedText text="Details" />
                        <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-100 dark:border-slate-700">
              <Clock className="h-5 w-5 text-slate-300 dark:text-slate-600" />
            </div>
            <h5 className="text-sm font-semibold text-slate-800 dark:text-white">
              <TranslatedText text="No activity found" />
            </h5>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              <TranslatedText text="There is no recent activity to show right now." />
            </p>
          </div>
        )}
      </div>

      {activities.length > maxItems && (
        <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-center shrink-0">
          <button className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:opacity-70 transition-opacity">
            <TranslatedText text="View all" /> ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
