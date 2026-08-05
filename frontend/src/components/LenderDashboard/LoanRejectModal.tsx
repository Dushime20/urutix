/**
 * LoanRejectModal — Lender hard-rejects a pending (or unaccepted) application with a reason.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { lendingApi } from '../../services/lending/lendingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Props {
  loan: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_REASONS = [
  'Insufficient collateral / cargo value',
  'Credit risk above policy threshold',
  'Incomplete or unverified KYC documentation',
  'Requested amount exceeds available facility',
  'Does not meet lending policy eligibility',
];

const LoanRejectModal: React.FC<Props> = ({ loan, onClose, onSuccess }) => {
  const { format: fmt } = useCurrencyFormat();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReject = async () => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      toast.error('Please provide a clear rejection reason (min 5 characters).');
      return;
    }
    setSubmitting(true);
    try {
      await lendingApi.rejectLoanRequest(loan.id, trimmed);
      toast.success('Application rejected. Cargo owner has been notified and may appeal.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject loan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loan) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[1.75rem] shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-rose-50 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">
              Reject Application
            </p>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Confirm Rejection</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {loan.borrower_name || 'Borrower'} · {fmt(loan.requested_amount)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-semibold leading-relaxed">
              The cargo owner will be notified with your reason and can appeal or add a comment for reconsideration.
            </p>
          </div>

          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Quick reasons
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESET_REASONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                    reason === preset
                      ? 'bg-rose-100 border-rose-200 text-rose-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Rejection reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explain why this application is rejected…"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:border-rose-400 outline-none resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Reject &amp; Notify Borrower
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LoanRejectModal;
