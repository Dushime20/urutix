import { useState } from 'react';
import { 
  CreditCard, 
  X, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Truck,
  Package,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import type { PendingPayment } from '../types';
import { formatCurrency } from '../utils';
import api from '@/services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PendingPayment | null;
  onPaymentSuccess: () => void;
}

interface PaymentFormData {
  method: 'mpesa' | 'airtel_money' | 'bank_transfer' | 'credit_card' | 'paypal';
  phoneNumber?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

const PaymentModal = ({ isOpen, onClose, payment, onPaymentSuccess }: PaymentModalProps) => {
  const [step, setStep] = useState<'details' | 'method' | 'processing' | 'success' | 'error'>('details');
  const [formData, setFormData] = useState<PaymentFormData>({
    method: 'mpesa',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (!payment) return null;

  const handleMethodSelect = (method: PaymentFormData['method']) => {
    setFormData(prev => ({ ...prev, method }));
    setStep('processing');
    processPayment(method);
  };

  const processPayment = async (method: string) => {
    setIsProcessing(true);
    
    try {
      // Call payment API
      const response = await api.post(`/payments/process`, {
        paymentId: payment.id,
        method,
        amount: payment.amount,
        currency: payment.currency,
      });

      if (response.data.success) {
        setStep('success');
        toast.success('Payment processed successfully!');
        onPaymentSuccess();
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStep('error');
      toast.error(error.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep('details');
    setFormData({ method: 'mpesa' });
  };

  const renderContent = () => {
    switch (step) {
      case 'details':
        return (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                Payment Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Reference</span>
                  <span className="text-sm font-bold text-slate-900">{payment.referenceNumber}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Description</span>
                  <span className="text-sm font-medium text-slate-900 text-right max-w-[200px]">
                    {payment.description}
                  </span>
                </div>

                {payment.relatedEntity && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{payment.relatedEntity.type}</span>
                    <span className="text-sm font-bold text-slate-900">{payment.relatedEntity.number}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Due Date</span>
                  <span className="text-sm font-medium text-slate-900">
                    {payment.dueDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total Amount</span>
                    <span className="text-2xl font-black text-[#345E85]">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Select Payment Method */}
            <div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
                Select Payment Method
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'mpesa', name: 'M-Pesa', icon: '📱', color: 'bg-green-50 border-green-200 hover:border-green-400' },
                  { id: 'airtel_money', name: 'Airtel Money', icon: '📱', color: 'bg-red-50 border-red-200 hover:border-red-400' },
                  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦', color: 'bg-blue-50 border-blue-200 hover:border-blue-400' },
                  { id: 'credit_card', name: 'Credit Card', icon: '💳', color: 'bg-purple-50 border-purple-200 hover:border-purple-400' },
                  { id: 'paypal', name: 'PayPal', icon: '💰', color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id as PaymentFormData['method'])}
                    disabled={isProcessing}
                    className={`p-4 rounded-2xl border-2 transition-all hover:shadow-md flex flex-col items-center gap-2 ${method.color}`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-xs font-bold text-slate-700">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[#345E85]/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#345E85] animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#345E85]/20 border-t-[#345E85] animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Processing Payment</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              Please wait while we process your payment of {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
              Your payment of {formatCurrency(payment.amount, payment.currency)} has been processed successfully.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#345E85] text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Payment Failed</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mb-6">
              We couldn't process your payment. Please try again or use a different payment method.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-6 py-3 bg-[#345E85] text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-white rounded-3xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black text-slate-900">
              {step === 'details' && 'Make Payment'}
              {step === 'processing' && 'Processing...'}
              {step === 'success' && 'Success!'}
              {step === 'error' && 'Payment Failed'}
            </DialogTitle>
            {step !== 'processing' && step !== 'success' && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 pt-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
