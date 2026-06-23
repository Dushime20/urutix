import { 
  X, 
  Truck,
  DollarSign,
  Clock,
  AlertTriangle,
  CreditCard,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import type { PendingPayment } from '../types';
import { formatCurrency, formatDueDate, getUrgencyConfig, getPaymentTypeLabel, getPaymentTypeIcon } from '../utils';
import { cn } from '@/utils/cn';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PendingPayment | null;
  onPayNow: (payment: PendingPayment) => void;
}

const PaymentDetailModal = ({ isOpen, onClose, payment, onPayNow }: PaymentDetailModalProps) => {
  if (!payment) return null;

  const urgencyConfig = getUrgencyConfig(payment.urgency);
  const typeLabel = getPaymentTypeLabel(payment.type);
  const typeIcon = getPaymentTypeIcon(payment.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white rounded-3xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
        <DialogHeader className="p-6 pb-0 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black text-slate-900">
              Payment Details
            </DialogTitle>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider",
              urgencyConfig.badge
            )}>
              <span className="text-base">{urgencyConfig.icon}</span>
              {urgencyConfig.label}
            </div>
            <span className="text-sm text-slate-500">
              Created {payment.createdAt.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Payment Overview Card */}
          <div className="bg-[#2c5173] rounded-3xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <span className="text-2xl">{typeIcon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-white/60 uppercase tracking-wider">{typeLabel}</p>
                <p className="text-lg font-black">{payment.referenceNumber}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Amount Due</p>
              <p className="text-4xl font-black">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
              Description
            </h3>
            <p className="text-slate-700 leading-relaxed">
              {payment.description}
            </p>
          </div>

          {/* Payment Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Reference</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{payment.referenceNumber}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Due Date</span>
              </div>
              <p className={cn(
                "text-sm font-bold",
                payment.urgency === 'OVERDUE' ? 'text-rose-600' : 
                payment.urgency === 'DUE_SOON' ? 'text-amber-600' : 'text-slate-900'
              )}>
                {formatDueDate(payment.dueDate)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">{payment.relatedEntity?.type || 'Entity'}</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{payment.relatedEntity?.number || 'N/A'}</p>
              {payment.relatedEntity?.name && (
                <p className="text-xs text-slate-500 mt-1">{payment.relatedEntity.name}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Currency</span>
              </div>
              <p className="text-sm font-bold text-slate-900">{payment.currency}</p>
            </div>
          </div>

          {/* Late Fee Warning */}
          {payment.lateFee && payment.lateFee > 0 && (
            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-700">Late Fee Applied</p>
                  <p className="text-sm text-rose-600">
                    An additional {formatCurrency(payment.lateFee, payment.currency)} late fee has been added to your payment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Total with Late Fee */}
          {payment.lateFee && payment.lateFee > 0 && (
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Original Amount</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(payment.amount, payment.currency)}</span>
              </div>
              <div className="flex justify-between items-center mb-2 text-rose-600">
                <span className="text-sm">Late Fee</span>
                <span className="text-sm font-bold">+{formatCurrency(payment.lateFee, payment.currency)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-base font-bold text-slate-900">Total Amount Due</span>
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(payment.amount + (payment.lateFee || 0), payment.currency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
          <div className="flex gap-3">
            <button
              onClick={() => onPayNow(payment)}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
                payment.urgency === 'OVERDUE' 
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : payment.urgency === 'DUE_SOON'
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-[#2c5173] text-white hover:bg-[#1e3850]"
              )}
            >
              <CreditCard className="w-5 h-5" />
              Pay {formatCurrency(payment.amount + (payment.lateFee || 0), payment.currency)} Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">
            Secure payment processing. Your information is encrypted.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDetailModal;
