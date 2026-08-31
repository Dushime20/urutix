import React, { useMemo, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { driverApi } from '../../services/driverApi';
import { DELAY_REASONS } from '../../utils/overdueTrip';
import { getApiErrorMessage } from '../../config/errorMessages';
import { cn } from '../../utils/cn';

interface ReportTripDelayModalProps {
  isOpen: boolean;
  tripId: string;
  tripNumber?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const ReportTripDelayModal: React.FC<ReportTripDelayModalProps> = ({
  isOpen,
  tripId,
  tripNumber,
  onClose,
  onSubmitted,
}) => {
  const { tSync: t } = useTranslation();
  const [delayReason, setDelayReason] = useState('');
  const [delayDescription, setDelayDescription] = useState('');
  const [newEstimatedArrival, setNewEstimatedArrival] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const minEta = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!delayReason) next.delayReason = t('Delay reason is required');
    if (delayReason === 'Other' && !delayDescription.trim()) {
      next.delayDescription = t('Please provide an explanation when the delay reason is Other');
    }
    if (!newEstimatedArrival) next.newEstimatedArrival = t('New estimated arrival is required');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const eta = new Date(newEstimatedArrival);
      await driverApi.reportDelay(tripId, {
        delayReason,
        delayDescription: delayDescription.trim() || undefined,
        newEstimatedArrival: eta.toISOString(),
      });
      toast.success(t('Delay reported successfully'));
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
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <TranslatedText text="Delay Report" />
              </p>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                <TranslatedText text="Report Delay" />
                {tripNumber ? ` · #${tripNumber}` : ''}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 flex items-center justify-center"
            aria-label={t('Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              <TranslatedText text="Delay reason" />
            </label>
            <select
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
                errors.delayReason ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <option value="">{t('Select a reason')}</option>
              {DELAY_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {errors.delayReason && (
              <p className="mt-1 text-xs text-rose-600">{errors.delayReason}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              <TranslatedText text="Additional explanation" />
              {delayReason === 'Other' ? ' *' : ''}
            </label>
            <textarea
              value={delayDescription}
              onChange={(e) => setDelayDescription(e.target.value)}
              rows={4}
              maxLength={2000}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
                errors.delayDescription ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
              placeholder={t('Describe what caused the delay')}
            />
            {errors.delayDescription && (
              <p className="mt-1 text-xs text-rose-600">{errors.delayDescription}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
              <TranslatedText text="New Estimated Arrival" />
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                value={newEstimatedArrival}
                min={minEta}
                onChange={(e) => setNewEstimatedArrival(e.target.value)}
                className={cn(
                  'w-full pl-11 pr-4 py-3 rounded-xl border text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100',
                  errors.newEstimatedArrival ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
                )}
              />
            </div>
            {errors.newEstimatedArrival && (
              <p className="mt-1 text-xs text-rose-600">{errors.newEstimatedArrival}</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500"
          >
            <TranslatedText text="Cancel" />
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-60"
          >
            {submitting ? t('Submitting...') : t('Submit Delay Report')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportTripDelayModal;
