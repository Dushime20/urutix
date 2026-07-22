/**
 * Compliance Dashboard
 * Roles: TENANT_ADMIN → /tenant-admin/compliance
 *        ADMIN       → /admin-operational/compliance
 * Layout: DashboardLayout (via TenantAdminLayout / OperationalAdminLayout)
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck, Truck, Users,
  AlertTriangle, CheckCircle2, Clock, RefreshCw
} from 'lucide-react';
import { complianceApi } from '../../services/featuresApi';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';

const ComplianceDashboard: React.FC = () => {
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'driver' | 'truck'; id: string } | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['compliance-dashboard'],
    queryFn: complianceApi.getDashboard,
    refetchInterval: 60_000,
  });

  const { data: entityStatus, isLoading: entityLoading } = useQuery({
    queryKey: ['compliance-entity', selectedEntity?.type, selectedEntity?.id],
    queryFn: () =>
      selectedEntity?.type === 'driver'
        ? complianceApi.getDriverStatus(selectedEntity.id)
        : complianceApi.getTruckStatus(selectedEntity!.id),
    enabled: !!selectedEntity,
  });

  if (isLoading) return <ModernLoader isLoading text="Loading_Compliance" />;

  const drivers = data?.drivers ?? { total: 0, compliant: 0, nonCompliant: 0, expiringSoon: 0 };
  const trucks = data?.trucks ?? { total: 0, compliant: 0, nonCompliant: 0, expiringSoon: 0 };

  const driverCompliantPct = drivers.total > 0 ? Math.round((drivers.compliant / drivers.total) * 100) : 100;
  const truckCompliantPct = trucks.total > 0 ? Math.round((trucks.compliant / trucks.total) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            <TranslatedText text="Compliance Dashboard" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <TranslatedText text="Monitor driver and truck document compliance. Expired documents block assignments automatically." />
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          <TranslatedText text="Refresh" />
        </button>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drivers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
              <TranslatedText text="Driver Compliance" />
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Fully Compliant', value: drivers.compliant, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Expiring Soon (≤30 days)', value: drivers.expiringSoon, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Non-Compliant (Expired)', value: drivers.nonCompliant, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${bg}`}>
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={color} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <TranslatedText text={label} />
                  </span>
                </div>
                <span className={`text-sm font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              <span><TranslatedText text="Compliance Rate" /></span>
              <span>{driverCompliantPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${driverCompliantPct >= 90 ? 'bg-emerald-500' : driverCompliantPct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${driverCompliantPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Trucks */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
              <Truck size={18} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">
              <TranslatedText text="Truck Compliance" />
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Fully Compliant', value: trucks.compliant, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Expiring Soon (≤30 days)', value: trucks.expiringSoon, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Non-Compliant (Expired)', value: trucks.nonCompliant, icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl ${bg}`}>
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={color} />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <TranslatedText text={label} />
                  </span>
                </div>
                <span className={`text-sm font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              <span><TranslatedText text="Compliance Rate" /></span>
              <span>{truckCompliantPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${truckCompliantPct >= 90 ? 'bg-emerald-500' : truckCompliantPct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${truckCompliantPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wide">
            <TranslatedText text="Automated Compliance Gates" />
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            <TranslatedText text="Drivers and trucks with expired documents are automatically blocked from trip assignments. Notifications are sent at 30, 15, 7, and 1 day before expiry." />
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;
