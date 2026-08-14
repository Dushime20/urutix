import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Award, CheckCircle, DollarSign, Star, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import { TranslatedText } from '../translated-text';

interface TruckOwnerPerformanceProps {
  tenantId?: string;
  compact?: boolean;
}

const TruckOwnerPerformance: React.FC<TruckOwnerPerformanceProps> = ({
  tenantId,
  compact = false,
}) => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['tenant-truck-owner-performance', tenantId],
    queryFn: () => tenantApi.getTruckOwnerPerformance(tenantId || 'default-tenant'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 animate-pulse">
        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-44 mb-4" />
        <div className={compact ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl w-full ${compact ? 'h-16' : 'h-40'}`} />
          ))}
        </div>
      </div>
    );
  }

  const partners = (performanceData || []).slice(0, compact ? 5 : 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
            <TranslatedText text="Partners" />
          </p>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            <TranslatedText text="Top truck owners" />
          </h3>
        </div>
        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100/60 dark:border-primary-900/40">
          <Award className="text-primary-600 dark:text-primary-400 w-4 h-4" />
        </div>
      </div>

      <div className={compact ? 'p-3 space-y-2' : 'p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'}>
        {partners.length === 0 ? (
          <div className={`${compact ? '' : 'col-span-full'} py-10 text-center`}>
            <Truck className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <TranslatedText text="No partner performance data available." />
            </p>
          </div>
        ) : compact ? (
          partners.map((partner: any, index: number) => {
            const successRate =
              partner.totalTrips > 0
                ? Math.round((partner.completedTrips / partner.totalTrips) * 100)
                : 0;
            return (
              <div
                key={partner.email || index}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
                    index === 0
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {partner.companyName || partner.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {successRate}% · {partner.totalTrips} <TranslatedText text="trips" />
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {Number(partner.totalRevenue || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-0.5 text-[11px] text-slate-500">
                    <Star size={10} className="text-primary-400 fill-primary-400" />
                    {partner.averageRating > 0 ? partner.averageRating.toFixed(1) : '5.0'}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          partners.map((partner: any, index: number) => (
            <motion.div
              key={partner.email || index}
              whileHover={{ y: -2 }}
              className="relative p-4 bg-slate-50/70 dark:bg-slate-800/30 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
            >
              <div className="absolute top-3 right-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold ${
                    index === 0
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  #{index + 1}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4 pr-8">
                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-600">
                  <Briefcase size={18} className="text-primary-500" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {partner.companyName || partner.email.split('@')[0]}
                  </h5>
                  <p className="text-[11px] text-slate-400 truncate">{partner.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    <TranslatedText text="Success Rate" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-primary-500" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      {partner.totalTrips > 0
                        ? Math.round((partner.completedTrips / partner.totalTrips) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                    <TranslatedText text="Trips" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Truck size={12} className="text-primary-500" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-white">
                      {partner.totalTrips}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-baseline gap-1">
                  <DollarSign size={12} className="text-primary-500" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
                    {Number(partner.totalRevenue).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-primary-400 fill-primary-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {partner.averageRating > 0 ? partner.averageRating.toFixed(1) : '5.0'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TruckOwnerPerformance;
