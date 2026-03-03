import { useState } from 'react';
import { X, DollarSign, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickLoanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuickLoanModal: React.FC<QuickLoanModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState(5000);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const maxLimit = 12500; // From available credit

    const handleConfirm = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setStep(2); // Success state
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {step === 1 ? (
                    <>
                        <div className="p-6 pb-0 flex justify-between items-center">
                            <h2 className="text-lg font-black text-slate-900">Request Cash Advance</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Amount Slider/Input */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Amount Requested</p>
                                <div className="flex items-center justify-center text-4xl font-black text-slate-900 mb-4">
                                    <span className="text-2xl text-slate-400 mr-1">$</span>
                                    {amount.toLocaleString()}
                                </div>
                                <input
                                    type="range"
                                    min="1000"
                                    max={maxLimit}
                                    step="500"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                                    <span>$1,000</span>
                                    <span>${maxLimit.toLocaleString()} Max</span>
                                </div>
                            </div>

                            {/* Terms Summary */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Processing Fee (2%)</span>
                                    <span className="font-bold text-slate-900">${(amount * 0.02).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Repayment Period</span>
                                    <span className="font-bold text-slate-900">30 Days</span>
                                </div>
                                <div className="flex justify-between text-sm pt-3 border-t border-slate-100">
                                    <span className="font-bold text-slate-900">Total Repayment</span>
                                    <span className="font-bold text-indigo-600">${(amount * 1.02).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="flex gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-xs font-medium">
                                <AlertCircle size={16} className="shrink-0" />
                                <p>Funds will be deposited to your wallet immediately upon approval.</p>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>Confirm Request <ChevronRight size={18} /></>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    /* Success State */
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="size-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Request Approved!</h3>
                        <p className="text-slate-500 mb-8">
                            <span className="font-bold text-slate-900">${amount.toLocaleString()}</span> has been added to your wallet available balance.
                        </p>
                        <button onClick={onClose} className="py-3 px-8 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors w-full">
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickLoanModal;
