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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4 print:bg-white print:p-0">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:rounded-none">
        {/* Header - Hidden when printing */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <FaFileInvoice className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Payment Receipt</h2>
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
        <div id="receipt-content" className="p-8 print:p-12 bg-white">
          {/* Receipt Header */}
          <div className="mb-8 pb-6 border-b-2 border-gray-400">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">PAYMENT RECEIPT</h1>
                <p className="text-base text-gray-700 font-medium">Receipt Number: <span className="font-mono">{receipt.receiptNumber}</span></p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="inline-block px-4 py-2 bg-green-600 text-white text-sm font-bold rounded">PAID</span>
                </div>
                <p className="text-sm text-gray-700">Date: {formatDate(receipt.paymentDate)}</p>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">From</h3>
              <div className="border-l-4 border-gray-400 pl-4">
                <p className="font-bold text-gray-900 text-lg mb-1">
                  {receipt.truckOwner.company || receipt.truckOwner.name}
                </p>
                {receipt.truckOwner.company && (
                  <p className="text-sm text-gray-700 mb-1">{receipt.truckOwner.name}</p>
                )}
                {receipt.truckOwner.email && (
                  <p className="text-sm text-gray-600">{receipt.truckOwner.email}</p>
                )}
                {receipt.truckOwner.phone && (
                  <p className="text-sm text-gray-600">{receipt.truckOwner.phone}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 tracking-wider">To</h3>
              <div className="border-l-4 border-gray-400 pl-4">
                <p className="font-bold text-gray-900 text-lg">
                  {receipt.cargo.cargoOwner}
                </p>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 tracking-wider border-b border-gray-300 pb-2">Trip Information</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Truck Details</p>
                  <p className="text-base font-semibold text-gray-900">
                    {receipt.plateNumber} - {receipt.make} {receipt.model}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Driver</p>
                  <p className="text-base font-semibold text-gray-900">
                    {receipt.driver.firstName} {receipt.driver.lastName}
                  </p>
                  {receipt.driver.phone && (
                    <p className="text-sm text-gray-600 mt-1">{receipt.driver.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Cargo Description</p>
                  <p className="text-base font-semibold text-gray-900">{receipt.cargo.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Route</p>
                  <p className="text-base font-semibold text-gray-900">
                    {receipt.cargo.origin} to {receipt.cargo.destination}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Trip Start Date</p>
                  <p className="text-base font-semibold text-gray-900">
                    {formatDate(receipt.tripStartDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 tracking-wider border-b border-gray-300 pb-2">Payment Details</h3>
            <div className="bg-gray-50 border-2 border-gray-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 uppercase mb-2">Amount Paid</p>
                  <p className="text-5xl font-bold text-gray-900">
                    {formatCurrency(receipt.amount, receipt.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 uppercase mb-2">Payment Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDate(receipt.paymentDate)}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-300 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm font-semibold text-gray-900">Bank Transfer / Mobile Money</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t-2 border-gray-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Receipt Generated</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(receipt.generatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Reference Number</p>
                <p className="text-sm font-mono font-semibold text-gray-900">{receipt.receiptNumber}</p>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-300">
              <p className="text-xs text-gray-600 text-center leading-relaxed">
                This is an official receipt for payment received. This document serves as proof of payment for the transportation services rendered. 
                Please retain this receipt for your records and accounting purposes.
              </p>
              <p className="text-xs text-gray-500 text-center mt-3">
                For inquiries, please contact the truck owner using the information provided above.
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

