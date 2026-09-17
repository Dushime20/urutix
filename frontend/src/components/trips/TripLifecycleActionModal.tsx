import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { tripsAPI } from '../../services/api';
import { CANCEL_REASONS, COMPLETE_CIRCUMSTANCES } from '../../utils/overdueTrip';
import { getApiErrorMessage } from '../../config/errorMessages';
import { cn } from '../../utils/cn';

export type TripLifecycleAction = 'complete' | 'cancel';

interface TripLifecycleActionModalProps {
  isOpen: boolean;
  action: TripLifecycleAction;
  tripId: string;
  tripNumber?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const TripLifecycleActionModal: React.FC<TripLifecycleActionModalProps> = ({
  isOpen,
  action,
  tripId,
  tripNumber,
  onClose,
  onSubmitted,
}) => {
  const isComplete = action === 'complete';
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const options = isComplete ? COMPLETE_CIRCUMSTANCES : CANCEL_REASONS;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!reason) {
      next.reason = isComplete ? 'Select how this trip was completed' : 'Select the circumstance that stopped this trip';
    }
    if (reason === 'Other' && !description.trim()) {
      next.description = 'Please describe what happened';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    setReason('');
    setDescription('');
    setErrors({});
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isComplete) {
        await tripsAPI.complete(tripId, {
          circumstance: reason,
          notes: description.trim() || undefined,
        });
        toast.success('Trip marked as completed');
      } else {
        await tripsAPI.cancel(tripId, {
          cancelReason: reason,
          cancelDescription: description.trim() || undefined,
        });
        toast.success('Trip stopped');
      }
      reset();
      onSubmitted?.();
      onClose();
    } catch (error: any) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[13000] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center',
                isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
              )}
            >
              {isComplete ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {isComplete ? 'Complete trip' : 'Stop trip'}
              </p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {isComplete ? 'Mark trip complete' : 'Stop trip'}
                {tripNumber ? ` · ${tripNumber}` : ''}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isComplete
              ? 'Use this when cargo has been delivered. Driver ePOD is still the preferred proof of delivery.'
              : 'Choose the event or circumstance during shipping that requires this trip to stop. The truck and driver will be released.'}
          </p>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              {isComplete ? 'Completion circumstance' : 'Stop reason'}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
                errors.reason ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <option value="">Select a circumstance</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.reason && <p className="mt-1 text-xs text-rose-600">{errors.reason}</p>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              Additional details{reason === 'Other' ? ' *' : ''}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
                errors.description ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
              placeholder={
                isComplete
                  ? 'Optional notes for cargo owner or finance'
                  : 'Describe what happened during shipping'
              }
            />
            {errors.description && <p className="mt-1 text-xs text-rose-600">{errors.description}</p>}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              'flex-1 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60',
              isComplete ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700',
            )}
          >
            {submitting
              ? isComplete
                ? 'Completing...'
                : 'Stopping...'
              : isComplete
                ? 'Complete trip'
                : 'Stop trip'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TripLifecycleActionModal;
