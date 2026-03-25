import React from 'react';
import { FaFileInvoice, FaDownload, FaPrint, FaTimes, FaCheckCircle } from 'react-icons/fa';

export interface Receipt {
  id: string;
  receiptNumber: string;
  tripId: string;
  truckId: string;
  plateNumber: string;
  make: string;
  model: string;
  driver: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  cargo: {
    title: string;
    origin: string;
    destination: string;
    cargoOwner: string;
  };
  amount: number;
  currency: string;
  paymentDate: string;
  tripStartDate: string;
  generatedAt: string;
  truckOwner: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  status: 'sent' | 'pending';
}

interface ReceiptModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
  onDownload,
  onPrint,
}) => {
  if (!isOpen || !receipt) return null;

  const formatCurrency = (amount: number, currency: string = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download as PDF (would need jsPDF or similar)
      const receiptContent = document.getElementById('receipt-content');
      if (receiptContent) {
        // For now, just trigger print which can be saved as PDF
        window.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-gray-950/90 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 print:bg-white print:p-0 transition-all duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl dark:shadow-none max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800 print:border-none print:shadow-none print:max-h-none print:rounded-none transform transition-all duration-200">
        {/* Header - Hidden when printing */}
        <div className="sticky top-0 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 p-6 flex items-center justify-between print:hidden transition-colors z-10">
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-lg bg-blue-600 dark:bg-blue-900/40 flex items-center justify-center transition-colors">
              <FaFileInvoice className="w-5 h-5 text-white dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">Payment Receipt</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaDownload className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <FaPrint className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div id="receipt-content" className="p-10 print:p-12 bg-white dark:bg-gray-900 transition-colors">
          {/* Receipt Header */}
          <div className="mb-10 pb-8 border-b-2 border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter transition-colors">PAYMENT RECEIPT</h1>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest transition-colors">
                  Receipt Number: <span className="font-mono text-blue-600 dark:text-blue-400">{receipt.receiptNumber}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="mb-3">
                  <span className="inline-block px-5 py-2 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-md transition-colors">PAID</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Date: {formatDate(receipt.paymentDate)}</p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-[0.2em] transition-colors">Issued By</h3>
              <div className="border-l-[3px] border-blue-600 dark:border-blue-500 pl-5 transition-colors">
                <p className="font-bold text-gray-900 dark:text-white text-xl mb-1 transition-colors">
                  {receipt.truckOwner?.company || receipt.truckOwner?.name}
                </p>
                {receipt.truckOwner?.company && (
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 transition-colors">{receipt.truckOwner?.name}</p>
                )}
                <div className="space-y-0.5">
                  {receipt.truckOwner?.email && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 transition-colors">{receipt.truckOwner?.email}</p>}
                  {receipt.truckOwner?.phone && <p className="text-xs font-medium text-gray-400 dark:text-gray-500 transition-colors">{receipt.truckOwner?.phone}</p>}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-4 tracking-[0.2em] transition-colors">Issued To</h3>
              <div className="border-l-[3px] border-gray-200 dark:border-gray-700 pl-5 transition-colors">
                <p className="font-bold text-gray-900 dark:text-white text-xl transition-colors">
                  {receipt.cargo?.cargoOwner}
                </p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="mb-12">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-5 tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 pb-3 transition-colors">Trip Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-1">
              {[
                { label: 'Asset Details', value: `${receipt.plateNumber} \u2022 ${receipt.make} ${receipt.model}` },
                { label: 'Certified Driver', value: `${receipt.driver?.firstName} ${receipt.driver?.lastName}` },
                { label: 'Cargo Payload', value: receipt.cargo?.title },
                { label: 'Assigned Route', value: `${receipt.cargo?.origin} \u2192 ${receipt.cargo?.destination}` },
                { label: 'Execution Date', value: formatDate(receipt.tripStartDate) }
              ].map((item, i) => (
                <div key={i}>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mb-12">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-5 tracking-[0.2em] border-b border-gray-100 dark:border-gray-800 pb-3 transition-colors">Financial Details</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 p-8 rounded-lg transition-colors">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 transition-colors">Net Amount Paid</p>
                  <p className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter transition-colors">
                    {formatCurrency(receipt.amount, receipt.currency)}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 transition-colors">Full Fulfillment Date</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                    {formatDate(receipt.paymentDate)}
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-100 dark:border-gray-700/50 mt-8 flex justify-between items-center transition-colors">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Payment Indexing</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white transition-colors">E-Transfer Verified</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t-2 border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">Receipt Digitization</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white transition-colors">{formatDate(receipt.generatedAt)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 transition-colors">Audit Ref Index</p>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 transition-colors uppercase tracking-widest">{receipt.receiptNumber}</p>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 transition-colors">
              <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 text-center leading-relaxed tracking-wide">
                This document serves as an official electronic verification of fulfillment. Data integrity is maintained through our fleet analytics core. 
                Please preserve this registry entry for tax compliance and institutional auditing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

