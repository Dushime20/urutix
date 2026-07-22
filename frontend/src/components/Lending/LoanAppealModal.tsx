/**
 * LoanAppealModal — Borrower appeals a hard rejection with a comment.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { lendingApi } from '../../services/lending/lendingApi';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface Props {
  loan: any;
  onClose: () => void;
  onSuccess?: () => void;
}

const LoanAppealModal: React.FC<Props> = ({ loan, onClose, onSuccess }) => {
  const { format: fmt } = useCurrencyFormat();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    if (trimmed.length < 10) {
      toast.error('Please add a comment of at least 10 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await lendingApi.appealLoanRejection(loan.id, trimmed);
      toast.success('Appeal submitted. The lender will review your comment.');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit appeal.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loan) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-[1.75rem] shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-violet-50 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black text-violet-700 uppercase tracking-widest mb-1">
              Appeal Rejection
            </p>
            <h2 className="text-xl font-black text-slate-900">Request Reconsideration</h2>
            <p className="text-sm text-slate-500 mt-1">
              Requested {fmt(loan.requested_amount)}
              {loan.lender?.name ? ` · ${loan.lender.name}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-full">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loan.rejection_reason && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">
                  Lender rejection reason
                </p>
                <p className="text-sm text-rose-900 font-semibold">{loan.rejection_reason}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <MessageSquare className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
              Explain why this decision should be reconsidered (updated cargo value, documents, revised amount, etc.).
              Your application will return to the lender for review.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Your comment / appeal
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              placeholder="Add your appeal comment…"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm focus:border-violet-400 outline-none resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">{comment.trim().length}/10 characters minimum</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit Appeal
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LoanAppealModal;
