import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertTriangle, Wallet, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface EnhancedRepayButtonProps {
  loanId: string;
  amount: number;
  onRepaymentSuccess?: () => void;
}

interface WalletBalance {
  available: number;
  currency: string;
}

const EnhancedRepayButton: React.FC<EnhancedRepayButtonProps> = ({ 
  loanId, 
  amount,
  onRepaymentSuccess 
}) => {
  const [repaying, setRepaying] = useState(false);
  const [repaid, setRepaid] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch wallet balance when confirmation dialog opens
  useEffect(() => {
    if (showConfirmDialog && !walletBalance) {
      fetchWalletBalance();
    }
  }, [showConfirmDialog]);

  const fetchWalletBalance = async () => {
    setLoadingBalance(true);
    try {
      // Try multiple endpoints for wallet balance
      let response;
      try {
        response = await api.get('/payments/wallet/balance');
      } catch {
        response = await api.get('/financial/wallet/balance');
      }
      
      const balance = response.data?.balance || response.data?.data?.balance || response.data;
      setWalletBalance({
        available: balance?.available || balance?.amount || 0,
        currency: balance?.currency || 'USD'
      });
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
      toast.error('Could not fetch wallet balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleRepayClick = () => {
    if (repaid) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmRepay = async () => {
    if (repaid) return;

    // Check if wallet has sufficient balance
    if (walletBalance && walletBalance.available < amount) {
      toast.error('Insufficient wallet balance for repayment');
      return;
    }

    setRepaying(true);
    setShowConfirmDialog(false);

    try {
      await api.post(`/lending/repayments/${loanId}`, { 
        final_payment_amount: amount 
      });
      
      setRepaid(true);
      toast.success('Loan repaid successfully!', {
        icon: '✅',
        duration: 4000,
      });
      
      // Call success callback if provided
      onRepaymentSuccess?.();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Repayment failed. Please try again.';
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setRepaying(false);
    }
  };

  if (repaid) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
        <CheckCircle size={12} /> Repaid
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleRepayClick}
        disabled={repaying}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5"
      >
        {repaying ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <DollarSign size={12} />
            Repay
          </>
        )}
      </button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <DollarSign size={20} />
                Confirm Repayment
              </h3>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Amount to Repay */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  Repayment Amount
                </p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">
                  ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Wallet Balance */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-blue-600 dark:text-blue-400" />
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                      Wallet Balance
                    </p>
                  </div>
                  {loadingBalance ? (
                    <Loader2 size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
                  ) : walletBalance ? (
                    <p className="text-lg font-black text-blue-900 dark:text-blue-300">
                      ${walletBalance.available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600 dark:text-blue-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Insufficient Balance Warning */}
              {walletBalance && walletBalance.available < amount && (
                <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-4 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-300">
                      Insufficient Balance
                    </p>
                    <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                      You need ${(amount - walletBalance.available).toLocaleString('en-US', { minimumFractionDigits: 2 })} more to complete this repayment.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmation Message */}
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Are you sure you want to repay this loan? This action cannot be undone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRepay}
                disabled={walletBalance ? walletBalance.available < amount : false}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <DollarSign size={14} />
                Confirm Repayment
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnhancedRepayButton;
