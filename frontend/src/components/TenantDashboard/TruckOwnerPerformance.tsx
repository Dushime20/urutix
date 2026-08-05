import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, Award, CheckCircle, DollarSign, Star, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import { TranslatedText } from '../translated-text';

interface TruckOwnerPerformanceProps {
  tenantId?: string;
}

const TruckOwnerPerformance: React.FC<TruckOwnerPerformanceProps> = ({ tenantId }) => {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['tenant-truck-owner-performance', tenantId],
    queryFn: () => tenantApi.getTruckOwnerPerformance(tenantId || 'default-tenant'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm p-8 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-xl w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-50 dark:bg-slate-800/50 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  const partners = performanceData || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm p-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
            <TranslatedText text="Partner Ecosystem" />
          </h3>
          <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
            <TranslatedText text="Top Performing Truck Owners" />
          </h4>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
          <Award className="text-amber-500 w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Truck className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              <TranslatedText text="No partner performance data available." />
            </p>
          </div>
        ) : (
          partners.map((partner: any, index: number) => (
            <motion.div
              key={partner.email || index}
              whileHover={{ y: -5 }}
              className="relative p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-[24px] border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Rank Badge */}
              <div className="absolute top-0 right-0 mt-4 mr-4">
                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    index === 0 ? 'bg-amber-100 text-amber-600' : 
                    index === 1 ? 'bg-slate-200 text-slate-600 dark:text-slate-300' : 
                    'bg-orange-50 text-orange-600'
                 }`}>
                    #{index + 1}
                 </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-600">
                  <Briefcase size={24} className="text-primary-500" />
                </div>
                <div className="pr-8">
                  <h5 className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[140px]">
                    {partner.companyName || partner.email.split('@')[0]}
                  </h5>
                  <p className="text-[10px] font-bold text-slate-400 truncate max-w-[140px]">
                    {partner.email}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-50 dark:border-slate-700">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      <TranslatedText text="Success Rate" />
                   </span>
                   <div className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span className="text-sm font-black text-slate-800 dark:text-white">
                         {partner.totalTrips > 0 ? Math.round((partner.completedTrips / partner.totalTrips) * 100) : 0}%
                      </span>
                   </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-50 dark:border-slate-700">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      <TranslatedText text="Trips" />
                   </span>
                   <div className="flex items-center gap-1.5">
                      <Truck size={12} className="text-primary-500" />
                      <span className="text-sm font-black text-slate-800 dark:text-white">
                         {partner.totalTrips}
                      </span>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                 <div className="flex items-baseline gap-1">
                    <DollarSign size={12} className="text-emerald-500" />
                    <span className="text-base font-black text-slate-800 dark:text-white">
                       {Number(partner.totalRevenue).toLocaleString()}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">RWF</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                       {partner.averageRating > 0 ? partner.averageRating.toFixed(1) : '5.0'}
                    </span>
                 </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-center">
                 <button className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:text-primary-600 transition-colors">
                    <TranslatedText text="Partner Details" />
                 </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default TruckOwnerPerformance;
