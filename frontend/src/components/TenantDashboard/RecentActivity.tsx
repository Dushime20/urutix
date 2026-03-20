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
}

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  maxItems = 10,
  onTrackEvent
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
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800';
      case 'error':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800';
      case 'info':
        return 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = "w-4 h-4 text-[#1e40af] dark:text-primary-400";
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
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1"><TranslatedText text="History" /></h3>
          <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Recent Updates" /></h4>
        </div>
        <div className="px-3 py-1 bg-gray-50 dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {displayedActivities.length} <TranslatedText text="Operations" />
          </span>
        </div>
      </div>

      <div className="px-2 py-4">
        {displayedActivities.length > 0 ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-gray-50 dark:divide-slate-800"
          >
            {displayedActivities.map((activity) => (
              <motion.div
                key={activity.id}
                variants={item}
                className="px-6 py-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all duration-300 rounded-[20px] my-1 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                    {getTypeIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          <TranslatedText text={activity.action} />
                        </span>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">•</span>
                        <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                          <TranslatedText text={activity.type} />
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-slate-300 dark:text-slate-600">
                        {getStatusIcon(activity.status)}
                        <span className="text-[11px] font-bold uppercase tracking-wider">{tSync(activity.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                      <TranslatedText text={activity.description} />
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${getStatusColor(activity.status)}`}>
                        <TranslatedText text={activity.status} />
                      </span>
                      <button 
                        onClick={() => onTrackEvent?.(activity)}
                        className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center hover:opacity-70 transition-opacity"
                        aria-label={tSync('View details for activity')}
                      >
                        <TranslatedText text="View Details" />
                        <ArrowRight className="ml-1.5 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="px-8 py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
              <Clock className="h-8 w-8 text-slate-200 dark:text-slate-700" />
            </div>
            <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight"><TranslatedText text="No activity found" /></h5>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1 font-medium italic"><TranslatedText text="There is no recent activity to show right now." /></p>
          </div>
        )}
      </div>

      {activities.length > maxItems && (
        <div className="px-8 py-5 bg-gray-50/50 dark:bg-slate-800/50 border-t border-gray-50 dark:border-slate-800 flex justify-center">
          <button className="text-xs font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">
            <TranslatedText text="View All History" /> ({activities.length} <TranslatedText text="entries" />)
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;

