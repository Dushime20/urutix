import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, TrendingUp, TrendingDown, Clock, DollarSign, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import { TranslatedText } from '../translated-text';

interface RoutePerformanceProps {
  tenantId?: string;
}

const RoutePerformance: React.FC<RoutePerformanceProps> = ({ tenantId }) => {
  const { data: routeData, isLoading } = useQuery({
    queryKey: ['tenant-route-performance', tenantId],
    queryFn: () => tenantApi.getRoutePerformance(),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm p-8 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-xl w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-50 dark:bg-slate-800/50 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const routes = routeData || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm p-8 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            <TranslatedText text="Strategic Logistics" />
          </h3>
          <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            <TranslatedText text="Route Performance Intelligence" />
          </h4>
        </div>
        <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
          <TrendingUp className="text-primary-600 dark:text-primary-400 w-5 h-5" />
        </div>
      </div>

      <div className="space-y-4">
        {routes.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              <TranslatedText text="No route data available for the current period." />
            </p>
          </div>
        ) : (
          routes.map((route: any, index: number) => (
            <div
              key={route.routeHash || index}
              className="group p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700">
                    <span className="text-sm font-black text-slate-400">{index + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        {route.route}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <Users size={12} className="text-primary-500" />
                          <span>{route.shipmentCount} <TranslatedText text="Shipments" /></span>
                       </div>
                       <span className="text-slate-300 dark:text-slate-700">•</span>
                       <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <CheckCircle size={12} className={route.onTimeRate >= 90 ? "text-emerald-500" : "text-amber-500"} />
                          <span>{Math.round(route.onTimeRate)}% <TranslatedText text="On-Time" /></span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Avg. Revenue" />
                    </span>
                    <div className="flex items-baseline gap-1 text-slate-800 dark:text-white">
                      <DollarSign size={12} className="text-emerald-500" />
                      <span className="text-sm font-black tracking-tight">
                        {route.averageCost ? Number(route.averageCost).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      <TranslatedText text="Transit Time" />
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-white">
                      <Clock size={12} className="text-primary-500" />
                      <span className="text-sm font-black tracking-tight">{route.averageTransitTime}h</span>
                    </div>
                  </div>

                  <div className="hidden lg:block">
                     <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${route.onTimeRate >= 90 ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-amber-50 dark:bg-amber-900/10'}`}>
                        {route.onTimeRate >= 90 ? <TrendingUp size={12} className="text-emerald-600" /> : <TrendingDown size={12} className="text-amber-600" />}
                        <span className={`text-[10px] font-black uppercase tracking-wider ${route.onTimeRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                           {route.onTimeRate >= 90 ? 'Performing' : 'Analyzing'}
                        </span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="w-full mt-8 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-black text-slate-400 hover:text-primary-500 hover:border-primary-200 dark:hover:border-primary-900/40 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all uppercase tracking-widest">
         <TranslatedText text="View Full Network Analysis" />
      </button>
    </motion.div>
  );
};

const CheckCircle: React.FC<{ size: number, className: string }> = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default RoutePerformance;
