import { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import type { PendingPayment } from '../types';
import { formatCurrency } from '../utils';
import api from '@/services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PendingPayment | null;
  onPaymentSuccess: () => void;
}

type PaymentMethod = 'card' | 'mobile_money';
type MobileProvider = 'mtn' | 'airtel' | 'mpesa';

interface PaymentFormData {
  method: PaymentMethod;
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  phoneNumber: string;
  mobileProvider: MobileProvider;
}

const PaymentModal = ({ isOpen, onClose, payment, onPaymentSuccess }: PaymentModalProps) => {
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [isMobileMoneyPending, setIsMobileMoneyPending] = useState(false);
  const [formData, setFormData] = useState<PaymentFormData>({
    method: 'card',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    phoneNumber: '',
    mobileProvider: 'mtn',
  });

  if (!payment) return null;

  const totalAmount = payment.amount + (payment.lateFee || 0);

  const handleConfirm = async () => {
    if (formData.method === 'card') {
      if (!formData.cardNumber || !formData.cardName || !formData.expiryDate || !formData.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    } else {
      if (!formData.phoneNumber) {
        toast.error('Please enter your phone number');
        return;
      }
    }

    setStep('processing');

    try {
      let response: any;

      if (formData.method === 'mobile_money') {
        response = await api.post(`/payments/mobile-money/initiate`, {
          tripId: payment.relatedEntity?.id,
          amount: totalAmount,
          currency: payment.currency,
          phoneNumber: formData.phoneNumber,
          paymentType: 'trip_payment',
          description: payment.description,
          referenceNumber: payment.referenceNumber,
          metadata: { provider: formData.mobileProvider },
        });
      } else {
        response = await api.post(`/payments/${payment.id}/process`);
      }

      if (response.data.success) {
        const pending = formData.method === 'mobile_money' &&
          response.data.data?.payment?.status === 'processing';
        setIsMobileMoneyPending(pending);

        setStep('success');
        toast.success(
          pending
            ? 'Mobile money request sent! Check your phone to confirm.'
            : 'Payment processed successfully!'
        );
        onPaymentSuccess();
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStep('error');
      toast.error(
        error.response?.data?.message || error.message || 'Payment processing failed. Please try again.'
      );
    }
  };

  const handleRetry = () => {
    setStep('form');
    setFormData(prev => ({ ...prev, cardNumber: '', cardName: '', expiryDate: '', cvv: '', phoneNumber: '' }));
  };

  const handleClose = () => {
    setStep('form');
    setIsMobileMoneyPending(false);
    setFormData({ method: 'card', cardNumber: '', cardName: '', expiryDate: '', cvv: '', phoneNumber: '', mobileProvider: 'mtn' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white rounded-3xl max-h-[90vh] flex flex-col">

        {/* ── Processing state ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-[#2c5173]/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#2c5173] animate-spin" />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-[#2c5173]/20 border-t-[#2c5173] animate-spin" style={{ animationDuration: '1.5s' }} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Processing Payment</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs">
              Please wait while we securely process your payment of{' '}
              <span className="font-bold text-slate-700">{formatCurrency(totalAmount, payment.currency)}</span>
            </p>
          </div>
        )}

        {/* ── Success state ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
              {isMobileMoneyPending ? 'Request Sent!' : 'Payment Successful!'}
            </h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mb-8">
              {isMobileMoneyPending
                ? <>A payment prompt of <span className="font-bold text-slate-700">{formatCurrency(totalAmount, payment.currency)}</span> has been sent to your phone. Please approve it to complete the payment.</>
                : <>Your payment of <span className="font-bold text-slate-700">{formatCurrency(totalAmount, payment.currency)}</span> has been processed successfully.</>
              }
            </p>
            <button
              onClick={handleClose}
              className="px-8 py-4 bg-[#2c5173] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#1e3850] transition-all shadow-lg shadow-[#2c5173]/20"
            >
              Done
            </button>
          </div>
        )}

        {/* ── Error state ── */}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Payment Failed</h3>
            <p className="text-sm text-slate-500 text-center max-w-xs mb-8">
              We couldn't process your payment. Please try again or use a different method.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="px-8 py-4 bg-[#2c5173] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#1e3850] transition-all shadow-lg shadow-[#2c5173]/20"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Main form state ── */}
        {step === 'form' && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete Your Payment</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {payment.description || payment.referenceNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* Order Summary */}
              <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-100">
                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-5">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Reference:</span>
                    <span className="text-sm font-black text-blue-900">{payment.referenceNumber}</span>
                  </div>
                  {payment.relatedEntity && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-800/60 uppercase">{payment.relatedEntity.type}:</span>
                      <span className="text-sm font-black text-blue-900">{payment.relatedEntity.number}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-800/60 uppercase">Due Date:</span>
                    <span className="text-sm font-black text-blue-900">
                      {payment.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {(payment.lateFee ?? 0) > 0 && (
                    <div className="flex items-center justify-between text-rose-600">
                      <span className="text-xs font-bold uppercase">Late Fee:</span>
                      <span className="text-sm font-black">+{formatCurrency(payment.lateFee!, payment.currency)}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t-2 border-dashed border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-blue-900 uppercase">Total Amount:</span>
                      <span className="text-3xl font-black text-[#2c5173]">
                        {formatCurrency(totalAmount, payment.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, method: 'card' }))}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      formData.method === 'card'
                        ? 'border-[#2c5173] bg-[#2c5173]/5'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">💳</div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Credit Card</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, method: 'mobile_money' }))}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      formData.method === 'mobile_money'
                        ? 'border-[#2c5173] bg-[#2c5173]/5'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">📱</div>
                      <div className="text-xs font-black text-slate-900 uppercase tracking-widest">Mobile Money</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Card Form */}
              {formData.method === 'card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength={19}
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, '');
                        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                        setFormData(prev => ({ ...prev, cardNumber: formatted }));
                      }}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.cardName}
                      onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={formData.expiryDate}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, '');
                          if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
                          setFormData(prev => ({ ...prev, expiryDate: value }));
                        }}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="CVV"
                        maxLength={4}
                        value={formData.cvv}
                        onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Money Form */}
              {formData.method === 'mobile_money' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Mobile Provider
                    </label>
                    <select
                      value={formData.mobileProvider}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobileProvider: e.target.value as MobileProvider }))}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all appearance-none"
                    >
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="airtel">Airtel Money</option>
                      <option value="mpesa">M-Pesa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+250 7XX XXX XXX"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      You will receive a prompt on your phone to confirm the payment.
                    </p>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-4 bg-emerald-50 rounded-2xl p-5 border-2 border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-black text-emerald-900 mb-1 uppercase tracking-tight">
                    Secure Payment Protocol
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700 leading-relaxed">
                    Your payment information is encrypted and secure. We never store your sensitive card details or PIN codes.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t-2 border-slate-100 bg-slate-50 flex justify-between items-center gap-4 shrink-0">
              <button
                onClick={handleClose}
                className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 rounded-xl transition-all"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-8 py-4 text-xs font-black bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-[#2c5173]/20"
              >
                Confirm Payment · {formatCurrency(totalAmount, payment.currency)}
              </button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
