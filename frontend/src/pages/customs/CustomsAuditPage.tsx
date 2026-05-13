import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, ShieldCheck, CheckCircle, XCircle, AlertTriangle, Clock, Flag, Inbox } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';

const BRAND = '#345E85';

const statusIcon: Record<string, React.ElementType> = {
  CLEARED:     CheckCircle,
  REJECTED:    XCircle,
  ON_HOLD:     Clock,
  HIGH_RISK:   Flag,
  IN_PROGRESS: ShieldCheck,
  PENDING:     AlertTriangle,
};

const statusColor: Record<string, string> = {
  CLEARED:     'text-emerald-600 bg-emerald-50',
  REJECTED:    'text-rose-600 bg-rose-50',
  ON_HOLD:     'text-purple-600 bg-purple-50',
  HIGH_RISK:   'text-red-700 bg-red-50',
  IN_PROGRESS: 'text-blue-600 bg-blue-50',
  PENDING:     'text-amber-600 bg-amber-50',
};

const CustomsAuditPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['customs-audit-log'],
    queryFn: () => customsApi.getInspections({ limit: 100 }),
    refetchInterval: 30000,
  });

  const inspections: any[] = data?.data?.data || [];

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
          <Activity size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Audit Log</h1>
          <p className="text-xs text-slate-400">Full inspection activity trail — {inspections.length} records</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-[#345E85]" />
        </div>
      ) : inspections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Inbox className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-bold">No activity yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />

          <div className="space-y-4">
            {inspections.map((ins: any) => {
              const Icon = statusIcon[ins.status] || ShieldCheck;
              const colorCls = statusColor[ins.status] || 'text-slate-500 bg-slate-50';
              return (
                <div key={ins.id} className="flex gap-4 relative">
                  {/* Icon node */}
                  <div className={cn('w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white dark:border-slate-900 shadow-sm', colorCls)}>
                    <Icon size={14} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {ins.plateNumber || ins.shipmentReference || `Inspection #${ins.id.slice(0, 8)}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ins.cargoType || 'Unknown cargo'}{' '}
                          {ins.originCountry && ins.destinationCountry && `· ${ins.originCountry} → ${ins.destinationCountry}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase', colorCls)}>
                          {ins.status?.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(ins.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-2">
                      {ins.officer?.email && (
                        <span className="text-[10px] text-slate-400">
                          Officer: <span className="font-bold text-slate-600 dark:text-slate-300">{ins.officer.email.split('@')[0]}</span>
                        </span>
                      )}
                      {ins.checkpointName && (
                        <span className="text-[10px] text-slate-400">
                          Checkpoint: <span className="font-bold text-slate-600 dark:text-slate-300">{ins.checkpointName}</span>
                        </span>
                      )}
                      {ins.riskLevel && (
                        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase', {
                          'bg-emerald-100 text-emerald-700': ins.riskLevel === 'LOW',
                          'bg-amber-100 text-amber-700': ins.riskLevel === 'MEDIUM',
                          'bg-rose-100 text-rose-700': ins.riskLevel === 'HIGH',
                          'bg-red-900 text-white': ins.riskLevel === 'CRITICAL',
                        })}>
                          Risk: {ins.riskLevel}
                        </span>
                      )}
                    </div>

                    {ins.inspectionNotes && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{ins.inspectionNotes}</p>
                    )}
                    {ins.rejectionReason && (
                      <p className="text-xs text-rose-600 mt-1 font-bold">Reason: {ins.rejectionReason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomsAuditPage;
