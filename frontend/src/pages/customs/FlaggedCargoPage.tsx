import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Flag, AlertTriangle, Eye, Inbox } from 'lucide-react';
import { customsApi } from '../../services/customsApi';
import { cn } from '../../utils/cn';

const BRAND = '#345E85';

const FlaggedCargoPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: flaggedData, isLoading: flaggedLoading } = useQuery({
    queryKey: ['customs-flagged'],
    queryFn: () => customsApi.getInspections({ status: 'HIGH_RISK', limit: 50 }),
    refetchInterval: 30000,
  });

  const { data: onHoldData, isLoading: holdLoading } = useQuery({
    queryKey: ['customs-on-hold'],
    queryFn: () => customsApi.getInspections({ status: 'ON_HOLD', limit: 50 }),
    refetchInterval: 30000,
  });

  const { data: criticalData } = useQuery({
    queryKey: ['customs-critical'],
    queryFn: () => customsApi.getInspections({ riskLevel: 'CRITICAL', limit: 50 }),
    refetchInterval: 30000,
  });

  const flagged: any[] = flaggedData?.data?.data || [];
  const onHold: any[] = onHoldData?.data?.data || [];
  const critical: any[] = criticalData?.data?.data || [];

  const all = [...new Map([...flagged, ...onHold, ...critical].map(i => [i.id, i])).values()];

  const InspectionCard = ({ ins }: { ins: any }) => (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-slate-700 p-5 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/dashboard/customs/inspections/${ins.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg uppercase', {
              'bg-red-100 text-red-700': ins.status === 'HIGH_RISK',
              'bg-purple-100 text-purple-700': ins.status === 'ON_HOLD',
            })}>
              {ins.status?.replace(/_/g, ' ')}
            </span>
            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-lg uppercase', {
              'bg-emerald-100 text-emerald-700': ins.riskLevel === 'LOW',
              'bg-amber-100 text-amber-700': ins.riskLevel === 'MEDIUM',
              'bg-rose-100 text-rose-700': ins.riskLevel === 'HIGH',
              'bg-red-900 text-white': ins.riskLevel === 'CRITICAL',
            })}>
              Risk: {ins.riskLevel}
            </span>
          </div>
          <p className="text-sm font-black text-slate-900 dark:text-white">{ins.plateNumber || ins.shipmentReference || '—'}</p>
          <p className="text-xs text-slate-500 mt-0.5">{ins.cargoType || 'Unknown cargo'} · {ins.originCountry} → {ins.destinationCountry}</p>
          {ins.inspectionNotes && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ins.inspectionNotes}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/dashboard/customs/inspections/${ins.id}`); }}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-[#345E85] transition-colors"
          >
            <Eye size={13} />
          </button>
          <span className="text-[10px] text-slate-400">{new Date(ins.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      {ins.hasDangerousGoods && (
        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 rounded-xl px-3 py-1.5">
          <AlertTriangle size={12} /> Dangerous Goods Declared
        </div>
      )}
    </div>
  );

  const isLoading = flaggedLoading || holdLoading;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center">
          <Flag size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">Flagged & High-Risk Cargo</h1>
          <p className="text-xs text-slate-400">{all.length} items requiring attention</p>
        </div>
      </div>

      {/* Alert banner */}
      {all.length > 0 && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-black text-rose-800">{all.length} inspection(s) require immediate attention</p>
            <p className="text-xs text-rose-600">Review and take action on flagged and held shipments</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-200 border-t-rose-600" />
        </div>
      ) : all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Inbox className="w-12 h-12 text-slate-200" />
          <p className="text-sm font-bold">No flagged cargo</p>
          <p className="text-xs">All clear — no high-risk or held shipments</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {all.map((ins: any) => <InspectionCard key={ins.id} ins={ins} />)}
        </div>
      )}
    </div>
  );
};

export default FlaggedCargoPage;
