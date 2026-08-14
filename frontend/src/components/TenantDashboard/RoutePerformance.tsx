import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, TrendingUp, TrendingDown, Clock, DollarSign, Users, CheckCircle } from 'lucide-react';
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const routes = routeData || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
            <TranslatedText text="Network" />
          </p>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            <TranslatedText text="Route performance" />
          </h3>
        </div>
        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100/60 dark:border-primary-900/40">
          <TrendingUp className="text-primary-600 dark:text-primary-400 w-4 h-4" />
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        {routes.length === 0 ? (
          <div className="py-10 text-center">
            <MapPin className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <TranslatedText text="No route data available for the current period." />
            </p>
          </div>
        ) : (
          routes.slice(0, 5).map((route: any, index: number) => (
            <div
              key={route.routeHash || index}
              className="group p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/30 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/60 transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shrink-0">
                    <span className="text-xs font-semibold text-slate-500">{index + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                      {route.route}
                    </p>
                    <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <Users size={11} className="text-primary-500" />
                        {route.shipmentCount} <TranslatedText text="Shipments" />
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                        <CheckCircle size={11} className={route.onTimeRate >= 90 ? 'text-primary-500' : 'text-amber-500'} />
                        {Math.round(route.onTimeRate)}% <TranslatedText text="On-Time" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-5 pl-11 sm:pl-0">
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      <TranslatedText text="Avg. Revenue" />
                    </p>
                    <div className="flex items-center gap-0.5 text-slate-800 dark:text-white">
                      <DollarSign size={12} className="text-primary-500" />
                      <span className="text-sm font-semibold">
                        {route.averageCost ? Number(route.averageCost).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                      <TranslatedText text="Transit" />
                    </p>
                    <div className="flex items-center gap-1 text-slate-800 dark:text-white">
                      <Clock size={12} className="text-primary-500" />
                      <span className="text-sm font-semibold">{route.averageTransitTime}h</span>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <div
                      className={`px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 ${
                        route.onTimeRate >= 90
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {route.onTimeRate >= 90 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      <span className="text-[10px] font-semibold">
                        {route.onTimeRate >= 90 ? 'Strong' : 'Watch'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RoutePerformance;
