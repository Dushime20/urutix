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
} from './VehiclePreTripChecklist';
import { CargoInspection } from './CargoInspection';
import {
  canProceedWithLoad,
  getInspectionStatusLabel,
  getInspectionStatusStyles,
  getPreTripStatusFromLoad,
  PRE_TRIP_INSPECTION_BLOCKED_MESSAGE,
  PreTripInspectionWorkflowStatus,
} from './preTripInspection';

type FlowStep = 'vehicle' | 'cargo' | 'blocked' | 'launching';

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
  { id: 'launch', label: 'Launch Trip', icon: Rocket },
] as const;

export const TripStartFlow: React.FC<TripStartFlowProps> = ({
  trip,
  driverId,
  isOpen,
  onClose,
  onTripStarted,
}) => {
  const loadId = trip.loadId;
  const [step, setStep] = useState<FlowStep>('vehicle');
  const [inspectionStatus, setInspectionStatus] = useState<PreTripInspectionWorkflowStatus>('PENDING');
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const { checkedItems, toggle, allRequiredChecked, reset } = useVehicleChecklist();

  useEffect(() => {
    if (!isOpen) {
      setStep('vehicle');
      setShowInspectionForm(false);
      reset();
    }
  }, [isOpen, reset]);

  const fetchInspectionStatus = async (): Promise<PreTripInspectionWorkflowStatus> => {
    if (!loadId) return 'PENDING';
    setInspectionLoading(true);
    try {
      const form = await driverApi.getPreTripInspectionForm(driverId, loadId);
      const status = (form.workflowStatus ||
        getPreTripStatusFromLoad(form.cargo)) as PreTripInspectionWorkflowStatus;
      setInspectionStatus(status);
      return status;
    } catch {
      const loads = await driverApi.getPreTripInspectionLoads(driverId);
      const match = loads.find((l: any) => l.id === loadId);
      const status = getPreTripStatusFromLoad(match || {}) as PreTripInspectionWorkflowStatus;
      setInspectionStatus(status);
      return status;
    } finally {
      setInspectionLoading(false);
    }
  };

  const launchTrip = async () => {
    setStep('launching');
    try {
      await driverApi.startTrip(trip.id);
      toast.success('Trip started successfully!');
      onTripStarted();
      onClose();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
      setStep('cargo');
    }
  };

  const handleVehicleComplete = async () => {
    if (!allRequiredChecked) return;

    if (!loadId) {
      toast.error('No cargo linked to this trip. Contact dispatch.');
      return;
    }

    setStep('cargo');
    const status = await fetchInspectionStatus();

    if (status === 'AWAITING_RESOLUTION' || status === 'FAILED') {
      setStep('blocked');
      return;
    }

    if (canProceedWithLoad(status)) {
      await launchTrip();
      return;
    }

    setShowInspectionForm(true);
  };

  const handleInspectionComplete = async () => {
    setShowInspectionForm(false);
    const status = await fetchInspectionStatus();

    if (canProceedWithLoad(status)) {
      await launchTrip();
    } else if (status === 'AWAITING_RESOLUTION') {
      setStep('blocked');
    } else {
      toast.error('Inspection submitted. Resolve any issues before starting the trip.');
    }
  };

  if (!isOpen) return null;

  const currentStepIndex =
    step === 'vehicle' ? 0 : step === 'launching' ? 2 : 1;

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
        className="relative w-full sm:max-w-2xl max-h-[96vh] flex flex-col bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#0f172a] px-6 sm:px-8 py-6 shrink-0">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                Trip Launch Protocol
              </p>
              <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                {trip.origin.city} → {trip.destination.city}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                ORD-{trip.tripNumber}
              </p>
            </div>
            {step !== 'launching' && (
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentStepIndex;
              const isDone = idx < currentStepIndex;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-all ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isActive
                            ? 'bg-[#345E85] border-[#345E85] text-white'
                            : 'bg-transparent border-slate-600 text-slate-500'
                      }`}
                    >
                      {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider hidden sm:block truncate ${
                        isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded-full min-w-[12px] ${isDone ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 'vehicle' && (
              <motion.div key="vehicle" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-[#345E85]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Vehicle Pre-Trip Checklist</h4>
                    <p className="text-xs text-slate-500">Verify your truck is road-ready before cargo inspection.</p>
                  </div>
                </div>
                <VehiclePreTripChecklist checkedItems={checkedItems} onToggle={toggle} />
              </motion.div>
            )}

            {step === 'cargo' && !showInspectionForm && (
              <motion.div key="cargo-status" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                {inspectionLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 text-[#345E85] animate-spin" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Checking cargo inspection status...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <Package className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cargo Pre-Trip Inspection</h4>
                        <p className="text-xs text-slate-500">{trip.cargo.description}</p>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border ${getInspectionStatusStyles(inspectionStatus)}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest">Current Status</span>
                        <span className="text-xs font-black uppercase">{getInspectionStatusLabel(inspectionStatus)}</span>
                      </div>
                    </div>

                    {inspectionStatus === 'READY_FOR_RE_INSPECTION' && (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-xs font-medium text-blue-800">
                          Issues have been resolved by the cargo owner. Please perform a re-inspection to verify corrections before launching.
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setShowInspectionForm(true)}
                      className="w-full py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-lg"
                    >
                      {inspectionStatus === 'READY_FOR_RE_INSPECTION' ? 'Begin Re-Inspection' : 'Begin Cargo Inspection'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'cargo' && showInspectionForm && loadId && (
              <motion.div key="cargo-form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <CargoInspection
                  cargoId={loadId}
                  driverId={driverId}
                  embedded
                  onInspectionComplete={handleInspectionComplete}
                  onCancel={() => setShowInspectionForm(false)}
                />
              </motion.div>
            )}

            {step === 'blocked' && (
              <motion.div key="blocked" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Trip Launch Blocked</h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto mb-4">{PRE_TRIP_INSPECTION_BLOCKED_MESSAGE}</p>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-black uppercase ${getInspectionStatusStyles(inspectionStatus)}`}>
                  <Clock className="w-4 h-4" />
                  {getInspectionStatusLabel(inspectionStatus)}
                </div>
              </motion.div>
            )}

            {step === 'launching' && (
              <motion.div key="launching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="w-10 h-10 text-[#345E85] animate-spin" />
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Launching Trip...</p>
                <p className="text-xs text-slate-500">All pre-trip checks passed. Starting navigation.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step === 'vehicle' && (
          <div className="shrink-0 p-6 sm:p-8 border-t border-slate-100 bg-slate-50/80 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleVehicleComplete}
              disabled={!allRequiredChecked}
              className="flex-[2] h-12 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              Continue to Cargo Inspection
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'blocked' && (
          <div className="shrink-0 p-6 sm:p-8 border-t border-slate-100 bg-slate-50/80">
            <button
              onClick={onClose}
              className="w-full h-12 bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
