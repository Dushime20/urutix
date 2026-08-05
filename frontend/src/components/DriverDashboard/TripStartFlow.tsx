import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Truck,
  Package,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { driverApi, Trip } from '../../services/driverApi';
import { getApiErrorMessage } from '../../config/errorMessages';
import {
  VehiclePreTripChecklist,
  useVehicleChecklist,
  VEHICLE_CHECKLIST_ITEMS,
} from './VehiclePreTripChecklist';
import { CargoInspection } from './CargoInspection';
import {
  canOpenCargoInspection,
  canProceedWithLoad,
  getInspectionStatusLabel,
  getInspectionStatusStyles,
  getPreTripStatusFromLoad,
  PRE_TRIP_INSPECTION_BLOCKED_MESSAGE,
  PreTripInspectionWorkflowStatus,
  PreTripResumeStep,
  resolveResumeStep,
} from './preTripInspection';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

type FlowStep = 'loading' | 'vehicle' | 'cargo' | 'ready' | 'blocked' | 'launching';

interface TripStartFlowProps {
  trip: Trip & { loadId?: string };
  driverId: string;
  isOpen: boolean;
  onClose: () => void;
  onTripStarted: () => void;
}

const STEPS = [
  { id: 'vehicle', label: 'Vehicle Check', icon: Truck },
  { id: 'cargo', label: 'Cargo Inspection', icon: Package },
  { id: 'launch', label: 'Start Trip', icon: Rocket },
] as const;

function resumeToFlowStep(resume: PreTripResumeStep): FlowStep {
  switch (resume) {
    case 'READY_TO_START':
      return 'ready';
    case 'WAITING':
    case 'BLOCKED':
      return 'blocked';
    case 'CARGO':
      return 'cargo';
    case 'TRUCK':
    default:
      return 'vehicle';
  }
}

export const TripStartFlow: React.FC<TripStartFlowProps> = ({
  trip,
  driverId,
  isOpen,
  onClose,
  onTripStarted,
}) => {
  const { tSync: t } = useTranslation();
  const loadId = trip.loadId;
  const [step, setStep] = useState<FlowStep>('loading');
  const [inspectionStatus, setInspectionStatus] =
    useState<PreTripInspectionWorkflowStatus>('PENDING');
  const [resumeStep, setResumeStep] = useState<PreTripResumeStep>('TRUCK');
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [persistingTruck, setPersistingTruck] = useState(false);
  const { checkedItems, toggle, allRequiredChecked, reset } = useVehicleChecklist();

  const fetchInspectionStatus = async (): Promise<{
    status: PreTripInspectionWorkflowStatus;
    resume: PreTripResumeStep;
    attempt: number;
  }> => {
    if (!loadId) {
      return { status: 'PENDING', resume: 'TRUCK', attempt: 1 };
    }
    setInspectionLoading(true);
    try {
      const form = await driverApi.getPreTripInspectionForm(driverId, loadId);
      const status = (form.workflowStatus ||
        getPreTripStatusFromLoad(form.cargo)) as PreTripInspectionWorkflowStatus;
      const attempt = form.cargo?.metadata?.preTripInspection?.currentAttempt || 1;
      const resume =
        (form.resumeStep as PreTripResumeStep) ||
        resolveResumeStep(status, {
          truckCompleted: Boolean(form.truckInspectionCompleted),
          currentAttempt: attempt,
        });
      setInspectionStatus(status);
      setResumeStep(resume);
      setCurrentAttempt(attempt);
      return { status, resume, attempt };
    } catch {
      const loads = await driverApi.getPreTripInspectionLoads(driverId);
      const match = loads.find((l: any) => l.id === loadId);
      const status = getPreTripStatusFromLoad(match || {}) as PreTripInspectionWorkflowStatus;
      const attempt = match?.preTripInspection?.currentAttempt || 1;
      const resume =
        (match?.preTripInspection?.resumeStep as PreTripResumeStep) ||
        resolveResumeStep(status, {
          truckCompleted: Boolean(match?.preTripInspection?.truckInspectionCompleted),
          currentAttempt: attempt,
        });
      setInspectionStatus(status);
      setResumeStep(resume);
      setCurrentAttempt(attempt);
      return { status, resume, attempt };
    } finally {
      setInspectionLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setStep('loading');
      setShowInspectionForm(false);
      reset();
      return;
    }

    let cancelled = false;
    (async () => {
      const { resume, status } = await fetchInspectionStatus();
      if (cancelled) return;

      const next = resumeToFlowStep(resume);
      setStep(next);

      // Re-inspection: open cargo form immediately (truck already done).
      if (
        next === 'cargo' &&
        (status === 'READY_FOR_RE_INSPECTION' || status === 'IN_PROGRESS')
      ) {
        // Show status panel first; user taps Re-Inspect / Continue.
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loadId, driverId]);

  const launchTrip = async () => {
    setStep('launching');
    try {
      await driverApi.startTrip(trip.id);
      toast.success(t('Trip started successfully!'));
      onTripStarted();
      onClose();
    } catch (error: any) {
      toast.error(t(getApiErrorMessage(error)));
      setStep('ready');
    }
  };

  const handleVehicleComplete = async () => {
    if (!allRequiredChecked || !loadId) {
      if (!loadId) toast.error(t('No cargo linked to this trip. Contact dispatch.'));
      return;
    }

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

      setInspectionStatus('TRUCK_INSPECTION_COMPLETED');
      setResumeStep('CARGO');
      setStep('cargo');
      toast.success(t('Truck inspection completed. Continue to cargo inspection.'));
    } catch (error: any) {
      toast.error(t(getApiErrorMessage(error)));
    } finally {
      setPersistingTruck(false);
    }
  };

  const handleInspectionComplete = async () => {
    setShowInspectionForm(false);
    const { status, resume } = await fetchInspectionStatus();
    setStep(resumeToFlowStep(resume));

    if (canProceedWithLoad(status)) {
      toast.success(t('Inspection approved. You may start the trip.'));
    } else if (status === 'AWAITING_RESOLUTION' || status === 'FAILED') {
      toast.error(t('Issues reported. Waiting for cargo owner or broker to resolve them.'));
    } else if (status === 'AWAITING_CARGO_OWNER_APPROVAL') {
      toast.success(
        t('Inspection submitted. Waiting for Cargo Owner or Broker approval before you can start.'),
      );
    }
  };

  if (!isOpen) return null;

  const currentStepIndex =
    step === 'vehicle' || step === 'loading'
      ? 0
      : step === 'ready' || step === 'launching'
        ? 2
        : 1;

  const truckDone =
    resumeStep !== 'TRUCK' ||
    step === 'cargo' ||
    step === 'ready' ||
    step === 'blocked' ||
    step === 'launching';

  const cargoDone =
    step === 'ready' ||
    step === 'launching' ||
    inspectionStatus === 'APPROVED' ||
    inspectionStatus === 'AWAITING_CARGO_OWNER_APPROVAL';

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
        onClick={step === 'launching' ? undefined : onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        className="relative w-full sm:max-w-2xl max-h-[96vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-transparent px-6 sm:px-8 py-6 shrink-0">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[9px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
                <TranslatedText text="Trip Launch Protocol" />
              </p>
              <h3 className="text-lg sm:text-xl font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                {trip.origin.city} → {trip.destination.city}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                ORD-{trip.tripNumber}
              </p>
            </div>
            {step !== 'launching' && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentStepIndex;
              const isDone =
                (idx === 0 && truckDone && !isActive) ||
                (idx === 1 && cargoDone && currentStepIndex === 2) ||
                (idx < currentStepIndex);
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isActive
                            ? 'bg-[#345E85] border-[#345E85] text-white'
                            : 'bg-transparent border-slate-300 text-slate-400 dark:border-slate-600 dark:text-slate-500'
                      }`}
                    >
                      {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider hidden sm:block truncate ${
                        isActive
                          ? 'text-[#0f172a] dark:text-white'
                          : isDone
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      <TranslatedText text={s.label} />
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full min-w-[12px] ${
                        isDone || idx < currentStepIndex
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {(step === 'loading' || (inspectionLoading && step !== 'vehicle')) && step !== 'launching' && !showInspectionForm && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <Loader2 className="w-8 h-8 text-[#345E85] animate-spin" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <TranslatedText text="Resuming inspection workflow..." />
                </p>
              </motion.div>
            )}

            {step === 'vehicle' && (
              <motion.div
                key="vehicle"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-[#345E85]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      <TranslatedText text="Vehicle Pre-Trip Checklist" />
                    </h4>
                    <p className="text-xs text-slate-500">
                      <TranslatedText text="Verify your truck is road-ready before cargo inspection." />
                    </p>
                  </div>
                </div>
                <VehiclePreTripChecklist checkedItems={checkedItems} onToggle={toggle} />
              </motion.div>
            )}

            {step === 'cargo' && !showInspectionForm && !inspectionLoading && (
              <motion.div
                key="cargo-status"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        <TranslatedText text="Cargo Pre-Trip Inspection" />
                      </h4>
                      <p className="text-xs text-slate-500">{trip.cargo.description}</p>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl border ${getInspectionStatusStyles(inspectionStatus)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        <TranslatedText text="Current Status" />
                      </span>
                      <span className="text-xs font-black uppercase text-right">
                        <TranslatedText
                          text={getInspectionStatusLabel(inspectionStatus, {
                            currentAttempt,
                          })}
                        />
                      </span>
                    </div>
                  </div>

                  {truckDone && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-xs font-medium text-emerald-800">
                        <TranslatedText text="Truck inspection completed — you will not be asked to repeat it." />
                      </p>
                    </div>
                  )}

                  {inspectionStatus === 'READY_FOR_RE_INSPECTION' && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                      <p className="text-xs font-medium text-blue-800">
                        <TranslatedText text="Issues have been resolved. Re-inspect cargo only — truck inspection is skipped." />
                      </p>
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const { status } = await fetchInspectionStatus();
                      if (!canOpenCargoInspection(status) && status !== 'PENDING') {
                        if (status === 'AWAITING_RESOLUTION' || status === 'FAILED') {
                          setStep('blocked');
                        } else if (canProceedWithLoad(status)) {
                          setStep('ready');
                        } else {
                          toast.error(t('This shipment is not available for inspection right now.'));
                        }
                        return;
                      }
                      setShowInspectionForm(true);
                    }}
                    className="w-full py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
                  >
                    {inspectionStatus === 'READY_FOR_RE_INSPECTION' ? (
                      <TranslatedText text="Re-Inspect Cargo" />
                    ) : (
                      <TranslatedText text="Continue Cargo Inspection" />
                    )}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'cargo' && showInspectionForm && loadId && (
              <motion.div
                key="cargo-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <CargoInspection
                  cargoId={loadId}
                  driverId={driverId}
                  embedded
                  onInspectionComplete={handleInspectionComplete}
                  onCancel={() => setShowInspectionForm(false)}
                />
              </motion.div>
            )}

            {step === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                  <TranslatedText text="Ready to Start Trip" />
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
                  <TranslatedText text="Inspection is approved. Truck and cargo checks are complete — no further inspection is required." />
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase ${getInspectionStatusStyles('APPROVED')}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <TranslatedText text="Inspection Approved" />
                </div>
              </motion.div>
            )}

            {step === 'blocked' && (
              <motion.div
                key="blocked"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                  <TranslatedText
                    text={
                      inspectionStatus === 'AWAITING_CARGO_OWNER_APPROVAL'
                        ? 'Waiting for Approval'
                        : 'Trip Launch Blocked'
                    }
                  />
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-4">
                  <TranslatedText
                    text={
                      inspectionStatus === 'AWAITING_CARGO_OWNER_APPROVAL'
                        ? 'Your inspection was submitted. The Cargo Owner or Broker must give a green light before you can start.'
                        : PRE_TRIP_INSPECTION_BLOCKED_MESSAGE
                    }
                  />
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase ${getInspectionStatusStyles(inspectionStatus)}`}
                >
                  <Clock className="w-4 h-4" />
                  <TranslatedText
                    text={getInspectionStatusLabel(inspectionStatus, { currentAttempt })}
                  />
                </div>
              </motion.div>
            )}

            {step === 'launching' && (
              <motion.div
                key="launching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <Loader2 className="w-10 h-10 text-[#345E85] animate-spin" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">
                  <TranslatedText text="Launching Trip..." />
                </p>
                <p className="text-xs text-slate-500">
                  <TranslatedText text="All pre-trip checks passed. Starting navigation." />
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step === 'vehicle' && (
          <div className="shrink-0 p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white dark:bg-slate-900 transition-all"
            >
              <TranslatedText text="Cancel" />
            </button>
            <button
              onClick={handleVehicleComplete}
              disabled={!allRequiredChecked || persistingTruck}
              className="flex-[2] h-12 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
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
        )}

        {step === 'ready' && (
          <div className="shrink-0 p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white dark:bg-slate-900 transition-all"
            >
              <TranslatedText text="Close" />
            </button>
            <button
              onClick={launchTrip}
              className="flex-[2] h-12 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Rocket className="w-4 h-4" />
              <TranslatedText text="Start Trip" />
            </button>
          </div>
        )}

        {step === 'blocked' && (
          <div className="shrink-0 p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80">
            <button
              onClick={onClose}
              className="w-full h-12 bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
            >
              <TranslatedText text="Close" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
