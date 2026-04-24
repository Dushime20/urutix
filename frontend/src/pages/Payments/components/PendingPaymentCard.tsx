import React from 'react';
import { CreditCard, Eye, Clock } from 'lucide-react';
import type { PendingPayment } from '../types';
import { 
  formatCurrency, 
  formatDueDate, 
  getPaymentTypeLabel, 
  getPaymentTypeIcon,
  getUrgencyConfig 
} from '../utils';
import { cn } from '@/utils/cn';

interface PendingPaymentCardProps {
  payment: PendingPayment;
  onPayNow: (paymentId: string) => void;
  onViewDetails: (paymentId: string) => void;
  onRequestExtension?: (paymentId: string) => void;
}

const PendingPaymentCard: React.FC<PendingPaymentCardProps> = ({
  payment,
  onPayNow,
  onViewDetails,
  onRequestExtension,
}) => {
  const urgencyConfig = getUrgencyConfig(payment.urgency);
  const typeIcon = getPaymentTypeIcon(payment.type);
  const typeLabel = getPaymentTypeLabel(payment.type);
  const dueText = formatDueDate(payment.dueDate);

  return (
    <div
      className={cn(
        "rounded-3xl border-2 p-6 transition-all hover:shadow-xl hover:scale-[1.02] duration-300 relative overflow-hidden",
        urgencyConfig.bg,
        urgencyConfig.border
      )}
    >
      {/* Urgency Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.1em]",
          urgencyConfig.badge
        )}>
          <span className="text-base">{urgencyConfig.icon}</span>
          {urgencyConfig.label}
        </div>

        {/* Pulse indicator for overdue */}
        {payment.urgency === 'OVERDUE' && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
        )}
      </div>

      {/* Payment Type */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{typeIcon}</span>
        <div>
          <h3 className={cn(
            "text-sm font-black uppercase tracking-tight",
            urgencyConfig.text
          )}>
            {typeLabel}
          </h3>
          <p className={cn(
            "text-[10px] font-bold uppercase tracking-widest opacity-60",
            urgencyConfig.text
          )}>
            {payment.referenceNumber}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className={cn(
        "text-sm font-medium mb-4",
        urgencyConfig.text,
        "opacity-80"
      )}>
        {payment.description}
      </p>

      {/* Related Entity */}
      {payment.relatedEntity && (
        <div className={cn(
          "text-xs font-bold mb-4 px-3 py-2 rounded-xl",
          urgencyConfig.bg === 'bg-rose-50' ? 'bg-rose-100/50' :
          urgencyConfig.bg === 'bg-amber-50' ? 'bg-amber-100/50' :
          'bg-slate-100/50'
        )}>
          <span className={cn("opacity-60", urgencyConfig.text)}>
            {payment.relatedEntity.type}:
          </span>{' '}
          <span className={cn("font-black", urgencyConfig.text)}>
            {payment.relatedEntity.number}
          </span>
          {payment.relatedEntity.name && (
            <span className={cn("opacity-80", urgencyConfig.text)}>
              {' '}• {payment.relatedEntity.name}
            </span>
          )}
        </div>
      )}

      {/* Amount Section */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest opacity-60",
            urgencyConfig.text
          )}>
            Amount Due
          </span>
          <span className={cn(
            "text-3xl font-black",
            urgencyConfig.text
          )}>
            {formatCurrency(payment.amount, payment.currency)}
          </span>
        </div>

        {payment.lateFee && payment.lateFee > 0 && (
          <div className="flex items-baseline justify-between text-rose-600">
            <span className="text-[9px] font-black uppercase tracking-widest">
              Late Fee
            </span>
            <span className="text-lg font-black">
              +{formatCurrency(payment.lateFee, payment.currency)}
            </span>
          </div>
        )}
      </div>

      {/* Due Date */}
      <div className={cn(
        "flex items-center gap-2 mb-6 px-3 py-2 rounded-xl",
        urgencyConfig.bg === 'bg-rose-50' ? 'bg-rose-100/50' :
        urgencyConfig.bg === 'bg-amber-50' ? 'bg-amber-100/50' :
        'bg-slate-100/50'
      )}>
        <Clock className={cn("w-4 h-4", urgencyConfig.text, "opacity-60")} />
        <span className={cn(
          "text-xs font-bold",
          urgencyConfig.text
        )}>
          {dueText}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => onPayNow(payment.id)}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wide transition-all shadow-lg hover:shadow-xl hover:scale-105",
            payment.urgency === 'OVERDUE' 
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : payment.urgency === 'DUE_SOON'
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-slate-700 text-white hover:bg-slate-800"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Pay Now
        </button>

        <button
          onClick={() => onViewDetails(payment.id)}
          className={cn(
            "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all border-2",
            urgencyConfig.border,
            urgencyConfig.text,
            "bg-white hover:bg-opacity-50"
          )}
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline">Details</span>
        </button>
      </div>

      {/* Request Extension (for overdue) */}
      {payment.urgency === 'OVERDUE' && onRequestExtension && (
        <button
          onClick={() => onRequestExtension(payment.id)}
          className="w-full mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 underline"
        >
          Request Payment Extension
        </button>
      )}
    </div>
  );
};

export default PendingPaymentCard;
