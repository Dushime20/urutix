import React, { useState } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  History,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/driverApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import { CargoInspection } from './CargoInspection';
import {
  getInspectionStatusLabel,
  getInspectionStatusStyles,
  getPreTripStatusFromLoad,
  PreTripInspectionWorkflowStatus,
} from './preTripInspection';
import { usePreTripInspectionLoads } from '../../hooks/useDriverQueries';

interface PreTripInspectionHubProps {
  driverId: string;
}

export const PreTripInspectionHub: React.FC<PreTripInspectionHubProps> = ({ driverId }) => {
  const { data: loads = [], isLoading: loading, refetch } = usePreTripInspectionLoads(driverId);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [historyLoadId, setHistoryLoadId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const openHistory = async (loadId: string) => {
    try {
      const records = await driverApi.getPreTripInspectionHistory(driverId, loadId);
      setHistory(records);
      setHistoryLoadId(loadId);
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (selectedLoadId) {
    return (
      <CargoInspection
        cargoId={selectedLoadId}
        driverId={driverId}
        onInspectionComplete={async () => {
          await refetch();
          setSelectedLoadId(null);
        }}
        onCancel={() => setSelectedLoadId(null)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
            Mission Hub
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] uppercase tracking-tight">
          Pre-Trip Inspection
        </h2>
        <p className="text-sm text-slate-400 font-medium mt-0.5">
          Mandatory cargo verification before loading and trip start
        </p>
      </div>

      <div className="grid gap-3">
        {loads.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No assigned cargo requiring inspection.</p>
          </div>
        ) : (
          loads.map((load, index) => {
            const status = getPreTripStatusFromLoad(load) as PreTripInspectionWorkflowStatus;
            const canInspect = ['PENDING', 'IN_PROGRESS', 'READY_FOR_RE_INSPECTION'].includes(status);

            return (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-[#345E85]" />
                      <h4 className="text-base font-bold text-[#0f172a]">
                        {load.title || load.cargoType || 'Cargo'}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getInspectionStatusStyles(status)}`}
                      >
                        {getInspectionStatusLabel(status)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {load.description || 'Assigned shipment awaiting pre-trip verification'}
                    </p>
                    {load.preTripInspection?.historyCount > 0 && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        {load.preTripInspection.historyCount} inspection attempt(s) on record
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openHistory(load.id)}
                      className="px-3 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-1.5"
                    >
                      <History className="w-3 h-3" /> History
                    </button>
                    {canInspect ? (
                      <button
                        onClick={() => setSelectedLoadId(load.id)}
                        className="px-4 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Search className="w-3 h-3" />
                        {status === 'READY_FOR_RE_INSPECTION' ? 'Re-Inspect' : 'Start Inspection'}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : status === 'AWAITING_RESOLUTION' ? (
                      <span className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Blocked — Awaiting Owner
                      </span>
                    ) : status === 'APPROVED' ? (
                      <span className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> Action Required
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {historyLoadId && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setHistoryLoadId(null)}
          />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-[2rem] sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Inspection Timeline
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">No inspection records yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Attempt #{record.attemptNumber}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                          record.decision === 'PASSED'
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                            : 'text-rose-600 bg-rose-50 border-rose-100'
                        }`}
                      >
                        {record.decision || record.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{record.overallNotes || 'No notes recorded'}</p>
                    <p className="text-[10px] text-slate-400 mt-2">
                      {record.completedAt
                        ? new Date(record.completedAt).toLocaleString()
                        : new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setHistoryLoadId(null)}
              className="mt-4 w-full py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
