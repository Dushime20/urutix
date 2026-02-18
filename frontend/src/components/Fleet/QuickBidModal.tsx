import React, { useState } from 'react';
import { X, DollarSign, Calendar, Percent, AlertCircle, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { biddingAPI, type BidData } from '../../services/biddingApi';
import { cn } from '../../utils/cn';

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

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shadow-sm">
                <DollarSign className="text-[#345E85]" size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quick Bid</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Submit your bid for this cargo</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-colors text-slate-400 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[calc(85vh-180px)] overflow-y-auto">
          {/* Cargo Info */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cargo Title</p>
                <p className="text-lg font-black text-slate-900">{cargo.title}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Cargo Owner</p>
                  <p className="text-sm font-bold text-slate-700">{cargo.cargoOwnerName || 'N/A'}</p>
                  {cargo.cargoOwnerCompany && (
                    <p className="text-xs font-medium text-slate-500">{cargo.cargoOwnerCompany}</p>
                  )}
                </div>
                {cargo.offeredPrice && (
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Reserve Price</p>
                    <p className="text-lg font-black text-[#345E85]">
                      {formatCurrency(cargo.offeredPrice, cargo.currencyCode)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bid Amount */}
          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
              Bid Amount ({cargo.currencyCode || 'USD'}) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter your bid amount"
                required
                min="0"
                step="0.01"
                disabled={isSubmitting}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:border-[#345E85] focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            {cargo.offeredPrice && (
              <p className="text-xs font-medium text-slate-500 mt-2 ml-1">
                Reserve price: {formatCurrency(cargo.offeredPrice, cargo.currencyCode)}
              </p>
            )}
          </div>

          {/* Advance Payment */}
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={requireAdvancePayment}
                onChange={(e) => {
                  setRequireAdvancePayment(e.target.checked);
                  if (!e.target.checked) {
                    setAdvancePaymentPercentage('');
                  }
                }}
                disabled={isSubmitting}
                className="w-5 h-5 rounded border-2 border-slate-300 text-[#345E85] focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
              />
              <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                Require advance payment
              </span>
            </label>

            {requireAdvancePayment && (
              <div className="ml-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
                  Advance Payment % *
                </label>
                <div className="relative">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    value={advancePaymentPercentage}
                    onChange={(e) => setAdvancePaymentPercentage(e.target.value)}
                    placeholder="Enter percentage (0-100)"
                    required={requireAdvancePayment}
                    min="0"
                    max="100"
                    step="1"
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:border-[#345E85] focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs font-medium text-slate-500 mt-2 ml-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Percentage to be paid upfront
                </p>
              </div>
            )}
          </div>

          {/* Schedule Delivery */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} />
              Delivery Schedule
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Pickup Date *
                </label>
                <input
                  type="datetime-local"
                  value={proposedPickupDate}
                  onChange={(e) => setProposedPickupDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-[#345E85] focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Delivery Date *
                </label>
                <input
                  type="datetime-local"
                  value={proposedDeliveryDate}
                  onChange={(e) => setProposedDeliveryDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-[#345E85] focus:ring-4 focus:ring-blue-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes (Optional) */}
          <div>
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider mb-3">
              Additional Notes (Optional)
            </label>
            <textarea
              value={bidNotes}
              onChange={(e) => setBidNotes(e.target.value)}
              placeholder="Add any additional information about your bid..."
              rows={3}
              disabled={isSubmitting}
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:border-[#345E85] focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "px-8 py-3 bg-[#345E85] text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2",
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-[#2a4d6d] active:scale-95"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Submitting...
              </>
            ) : (
              <>
                <DollarSign size={18} />
                Submit Bid
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickBidModal;
