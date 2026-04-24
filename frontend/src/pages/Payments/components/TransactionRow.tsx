import React from 'react';
import { Eye, Download } from 'lucide-react';
import type { CompletedTransaction } from '../types';
import { formatCurrency, formatDate, getPaymentTypeIcon, getPaymentTypeLabel } from '../utils';
import { cn } from '@/utils/cn';

interface TransactionRowProps {
  transaction: CompletedTransaction;
  onViewDetails: (transactionId: string) => void;
  onDownloadReceipt: (transactionId: string) => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onViewDetails,
  onDownloadReceipt,
}) => {
  const typeIcon = getPaymentTypeIcon(transaction.type);
  const typeLabel = getPaymentTypeLabel(transaction.type);

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      {/* Date */}
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-900">
            {formatDate(transaction.paidDate)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {new Date(transaction.paidDate).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcon}</span>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {typeLabel}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {transaction.referenceNumber}
            </div>
          </div>
        </div>
      </td>

      {/* Description */}
      <td className="px-4 py-4">
        <div className="max-w-xs">
          <p className="text-xs font-medium text-slate-700 truncate">
            {transaction.description}
          </p>
          {transaction.trip && (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Trip: {transaction.trip.tripNumber}
            </p>
          )}
        </div>
      </td>

      {/* Amount */}
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="text-sm font-black text-slate-900">
            {formatCurrency(transaction.amount, transaction.currency)}
          </div>
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {transaction.currency}
          </div>
        </div>
      </td>

      {/* Payment Method */}
      <td className="px-4 py-4">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
          "bg-slate-100 text-slate-700"
        )}>
          {transaction.paymentMethod}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-[0.1em]",
          "bg-emerald-50 text-emerald-600 border-emerald-100"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          COMPLETED
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewDetails(transaction.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => onDownloadReceipt(transaction.id)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white border border-slate-100 shadow-sm text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
            title="Download Receipt"
          >
            <Download size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TransactionRow;
