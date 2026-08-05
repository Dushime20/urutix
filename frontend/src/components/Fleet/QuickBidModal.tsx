import React, { useState } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { biddingAPI, type BidData } from '../../services/biddingApi';

import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
interface CargoBid {
  id: string;
  title: string;
  cargoOwnerName?: string;
  cargoOwnerCompany?: string;
  offeredPrice?: number;
  currencyCode?: string;
  pickupDate: string;
  deliveryDate: string;
}

interface QuickBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargo: CargoBid | null;
  onBidSubmitted?: () => void;
}

const QuickBidModal: React.FC<QuickBidModalProps> = ({
  isOpen,
  onClose,
  cargo,
  onBidSubmitted,
}) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [requireAdvancePayment, setRequireAdvancePayment] = useState<boolean>(false);
  const [advancePaymentPercentage, setAdvancePaymentPercentage] = useState<string>('');
  const [proposedPickupDate, setProposedPickupDate] = useState<string>('');
  const [proposedDeliveryDate, setProposedDeliveryDate] = useState<string>('');
  const [bidNotes, setBidNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize dates when cargo changes
  React.useEffect(() => {
    if (cargo) {
      // Set default dates from cargo
      const pickupDate = new Date(cargo.pickupDate);
      const deliveryDate = new Date(cargo.deliveryDate);

      setProposedPickupDate(pickupDate.toISOString().slice(0, 16));
      setProposedDeliveryDate(deliveryDate.toISOString().slice(0, 16));
    }
  }, [cargo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cargo) return;

    // Validation
    const bidAmountNum = parseFloat(bidAmount);
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    if (!proposedPickupDate || !proposedDeliveryDate) {
      toast.error('Please select both pickup and delivery dates');
      return;
    }

    const pickupDateTime = new Date(proposedPickupDate);
    const deliveryDateTime = new Date(proposedDeliveryDate);

    if (deliveryDateTime <= pickupDateTime) {
      toast.error('Delivery date must be after pickup date');
      return;
    }

    if (requireAdvancePayment) {
      const advancePercentNum = parseFloat(advancePaymentPercentage);
      if (isNaN(advancePercentNum) || advancePercentNum < 0 || advancePercentNum > 100) {
        toast.error('Advance payment percentage must be between 0 and 100');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const bidData: BidData = {
        loadId: cargo.id,
        bidAmount: bidAmountNum,
        bidCurrency: cargo.currencyCode || 'USD',
        proposedPickupDate: pickupDateTime.toISOString(),
        proposedDeliveryDate: deliveryDateTime.toISOString(),
        requireAdvancePayment,
        advancePaymentPercentage: requireAdvancePayment ? parseFloat(advancePaymentPercentage) : 0,
        bidNotes: bidNotes.trim() || undefined,
      };

      await biddingAPI.submitBid(bidData);

      toast.success('Bid submitted successfully!');

      // Reset form
      setBidAmount('');
      setRequireAdvancePayment(false);
      setAdvancePaymentPercentage('');
      setBidNotes('');

      // Notify parent and close
      if (onBidSubmitted) {
        onBidSubmitted();
      }
      onClose();
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit bid';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !cargo) return null;

  // formatCurrency provided by useCurrencyFormat hook

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-gray-100 dark:border-slate-800 relative">
          <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Quick Bid</h2>
          <div className="mt-2 space-y-1">
            <p className="text-lg font-medium text-gray-600 dark:text-slate-300">{cargo?.title}</p>
            <p className="text-sm text-gray-400 font-medium italic">
              Cargo Owner: {cargo?.cargoOwnerName || 'Unknown'} {cargo?.cargoOwnerCompany ? `(${cargo?.cargoOwnerCompany})` : ''}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-8 right-10 w-10 h-10 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Wrap for Enter key support */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Content */}
          <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Bid Amount Input */}
            <div className="space-y-3">
              <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Bid Amount ({cargo?.currencyCode || 'USD'}) *</label>
              <div className="relative group">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full h-16 px-6 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-2xl text-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#345E85] transition-all disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
              <div className="text-sm font-medium text-gray-400">
                Reserve price: {cargo?.offeredPrice ? formatCurrency(cargo.offeredPrice, cargo.currencyCode) : '$0.00'}
              </div>
            </div>

            {/* Advance Payment Section */}
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={requireAdvancePayment}
                    onChange={(e) => {
                      setRequireAdvancePayment(e.target.checked);
                      if (!e.target.checked) setAdvancePaymentPercentage('');
                    }}
                    disabled={isSubmitting}
                    className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer disabled:opacity-50"
                  />
                  <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-base font-bold text-gray-700 dark:text-slate-300">Require advance payment before trip</span>
              </label>

              {requireAdvancePayment && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                  <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Advance Payment % (Optional)</label>
                  <input
                    type="number"
                    value={advancePaymentPercentage}
                    onChange={(e) => setAdvancePaymentPercentage(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-14 px-6 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                    placeholder="e.g., 70"
                  />
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">
                    Percentage of transportation fee to be paid upfront.
                  </p>
                </div>
              )}
            </div>

            {/* Schedule Delivery Box */}
            <div className="bg-[#f0f9ff]/80 p-8 rounded-[1.5rem] border border-blue-100 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl shadow-sm flex items-center justify-center text-[#0369a1]">
                  <Clock size={18} />
                </div>
                <h4 className="text-lg font-extrabold text-[#0369a1]">Delivery Schedule</h4>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Pickup Date *</label>
                  <input
                    type="datetime-local"
                    value={proposedPickupDate}
                    onChange={(e) => setProposedPickupDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-14 px-4 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-400 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-slate-300">Delivery Date *</label>
                  <input
                    type="datetime-local"
                    value={proposedDeliveryDate}
                    onChange={(e) => setProposedDeliveryDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full h-14 px-4 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-blue-400 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Additional Notes Box */}
            <div className="space-y-3">
              <label className="block text-base font-bold text-gray-700 dark:text-slate-300">Additional Notes (Optional)</label>
              <textarea
                value={bidNotes}
                onChange={(e) => setBidNotes(e.target.value)}
                disabled={isSubmitting}
                className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#345E85] transition-all min-h-[120px] resize-none disabled:opacity-50"
                placeholder="Add any additional notes about your bid..."
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-10 pt-0 flex flex-col gap-4">
            <div className="flex items-center justify-end gap-4 w-full">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-10 py-4 bg-gray-100 text-gray-700 dark:text-slate-300 rounded-xl text-base font-bold hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!bidAmount || !proposedPickupDate || !proposedDeliveryDate || isSubmitting}
                className="px-10 py-4 bg-[#345E85] text-white rounded-xl text-base font-bold hover:bg-[#2a4d6d] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Submitting
                  </>
                ) : (
                  'Submit Bid'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default QuickBidModal;
