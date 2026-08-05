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
  Truck,
  Loader2,
  Rocket,
} from 'lucide-react';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { driverApi } from '../../services/driverApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import { CargoInspection } from './CargoInspection';
import {
  VehiclePreTripChecklist,
  useVehicleChecklist,
  VEHICLE_CHECKLIST_ITEMS,
} from './VehiclePreTripChecklist';
import {
  canOpenCargoInspection,
  getInspectionActionLabel,
  getInspectionStatusLabel,
  getInspectionStatusStyles,
  getPreTripStatusFromLoad,
  PreTripInspectionWorkflowStatus,
  resolveResumeStep,
} from './preTripInspection';
import { usePreTripInspectionLoads } from '../../hooks/useDriverQueries';

interface PreTripInspectionHubProps {
  driverId: string;
}

type HubView =
  | { mode: 'list' }
  | { mode: 'truck'; loadId: string }
  | { mode: 'cargo'; loadId: string }
  | { mode: 'history'; loadId: string };

export const PreTripInspectionHub: React.FC<PreTripInspectionHubProps> = ({ driverId }) => {
  const { tSync: t } = useTranslation();
  const { data: loads = [], isLoading: loading, refetch } = usePreTripInspectionLoads(driverId);
  const [view, setView] = useState<HubView>({ mode: 'list' });
  const [history, setHistory] = useState<any[]>([]);
  const [persistingTruck, setPersistingTruck] = useState(false);
  const { checkedItems, toggle, allRequiredChecked, reset } = useVehicleChecklist();

  const openHistory = async (loadId: string) => {
    try {
      const records = await driverApi.getPreTripInspectionHistory(driverId, loadId);
      setHistory(records);
      setView({ mode: 'history', loadId });
    } catch (error: any) {
      toast.error(t(getApiErrorMessage(error)));
    }
  };

  const openWorkflow = (load: any) => {
    const status = getPreTripStatusFromLoad(load) as PreTripInspectionWorkflowStatus;
    const resume =
      load?.preTripInspection?.resumeStep ||
      resolveResumeStep(status, {
        truckCompleted: Boolean(load?.preTripInspection?.truckInspectionCompleted),
        currentAttempt: load?.preTripInspection?.currentAttempt,
      });

    if (status === 'APPROVED') {
      toast.success(t('Inspection already approved. Open My Assignments → Start Trip.'));
      return;
    }

    if (status === 'AWAITING_CARGO_OWNER_APPROVAL' || status === 'AWAITING_RESOLUTION' || status === 'FAILED') {
      openHistory(load.id);
      return;
    }

    reset();
    if (resume === 'CARGO' || canOpenCargoInspection(status)) {
      setView({ mode: 'cargo', loadId: load.id });
    } else {
      setView({ mode: 'truck', loadId: load.id });
    }
  };

  const handleTruckComplete = async (loadId: string) => {
    if (!allRequiredChecked) return;
    setPersistingTruck(true);
    try {
      await driverApi.completeTruckPreTripInspection(driverId, loadId, {
        checklist: VEHICLE_CHECKLIST_ITEMS.map((item) => ({
          id: item.id,
          label: item.label,
          verified: checkedItems.has(item.id),
          notes: item.description,
        })),
      });
      toast.success(t('Truck inspection completed. Continue to cargo inspection.'));
      await refetch();
      setView({ mode: 'cargo', loadId });
    } catch (error: any) {
      toast.error(t(getApiErrorMessage(error)));
    } finally {
      setPersistingTruck(false);
    }
  };

  if (view.mode === 'truck') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Truck className="w-5 h-5 text-[#345E85]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">
              <TranslatedText text="Step 1 — Truck Inspection" />
            </h2>
            <p className="text-xs text-slate-500">
              <TranslatedText text="Complete vehicle checks once. They will not be repeated after approval or for cargo re-inspection." />
            </p>
          </div>
        </div>
        <VehiclePreTripChecklist checkedItems={checkedItems} onToggle={toggle} />
        <div className="flex gap-3">
          <button
            onClick={() => {
              reset();
              setView({ mode: 'list' });
            }}
            className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <TranslatedText text="Back" />
          </button>
          <button
            onClick={() => handleTruckComplete(view.loadId)}
            disabled={!allRequiredChecked || persistingTruck}
            className="flex-[2] h-12 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {persistingTruck ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <TranslatedText text="Continue to Cargo Inspection" />
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (view.mode === 'cargo') {
    return (
      <CargoInspection
        cargoId={view.loadId}
        driverId={driverId}
        onInspectionComplete={async () => {
          await refetch();
          setView({ mode: 'list' });
        }}
        onCancel={() => setView({ mode: 'list' })}
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
            <TranslatedText text="Mission Hub" />
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#0f172a] uppercase tracking-tight">
          <TranslatedText text="Pre-Trip Inspection" />
        </h2>
        <p className="text-sm text-slate-400 font-medium mt-0.5">
          <TranslatedText text="Multi-step truck + cargo verification. Progress is remembered — approved inspections skip to Start Trip." />
        </p>
      </div>

      <div className="grid gap-3">
        {loads.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">
              <TranslatedText text="No assigned cargo requiring inspection." />
            </p>
          </div>
        ) : (
          loads.map((load, index) => {
            const status = getPreTripStatusFromLoad(load) as PreTripInspectionWorkflowStatus;
            const attempt = load.preTripInspection?.currentAttempt ?? 1;
            const truckDone = Boolean(load.preTripInspection?.truckInspectionCompleted);
            const actionLabel = getInspectionActionLabel(status);
            const showPrimaryAction = ![
              // Approved is handled with Start Trip hint button
            ].includes(status);

            return (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm"
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
                        <TranslatedText
                          text={getInspectionStatusLabel(status, { currentAttempt: attempt })}
                        />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {load.description || (
                        <TranslatedText text="Assigned shipment awaiting pre-trip verification" />
                      )}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {truckDone && (
                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          <TranslatedText text="Truck Inspection Completed" />
                        </p>
                      )}
                      {load.preTripInspection?.historyCount > 0 && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                          <History className="w-3 h-3" />
                          {load.preTripInspection.historyCount}{' '}
                          <TranslatedText text="inspection attempt(s) on record" />
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openHistory(load.id)}
                      className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-1.5"
                    >
                      <History className="w-3 h-3" /> <TranslatedText text="History" />
                    </button>

                    {status === 'APPROVED' ? (
                      <span className="px-4 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Rocket className="w-3 h-3" /> <TranslatedText text="Ready to Start Trip" />
                      </span>
                    ) : status === 'AWAITING_RESOLUTION' || status === 'FAILED' ? (
                      <span className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> <TranslatedText text="Awaiting Resolution" />
                      </span>
                    ) : status === 'AWAITING_CARGO_OWNER_APPROVAL' ? (
                      <button
                        onClick={() => openHistory(load.id)}
                        className="px-4 py-2.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-violet-100"
                      >
                        <Clock className="w-3 h-3" /> <TranslatedText text="View Submitted Inspection" />
                      </button>
                    ) : showPrimaryAction ? (
                      <button
                        onClick={() => openWorkflow(load)}
                        className="px-4 py-2.5 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md"
                      >
                        <Search className="w-3 h-3" />
                        <TranslatedText text={actionLabel} />
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3" /> <TranslatedText text="Action Required" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {view.mode === 'history' && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setView({ mode: 'list' })}
          />
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> <TranslatedText text="Inspection Timeline" />
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">
                <TranslatedText text="No inspection records yet." />
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <TranslatedText text="Attempt #" />
                        {record.attemptNumber}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                          record.decision === 'PASSED'
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                            : 'text-rose-600 bg-rose-50 border-rose-100'
                        }`}
                      >
                        <TranslatedText text={record.decision || record.status} />
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {record.overallNotes || <TranslatedText text="No notes recorded" />}
                    </p>
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
              onClick={() => setView({ mode: 'list' })}
              className="mt-4 w-full py-3 bg-slate-100 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              <TranslatedText text="Close" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
