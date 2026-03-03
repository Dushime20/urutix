import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText, TrendingUp } from 'lucide-react';
import loanRequestService from '../../services/loanRequestService';
import toast from 'react-hot-toast';

interface Cargo {
    id: string;
    title: string;
    loadValue?: number;
    offeredPrice?: number;
    status: string;
    pickupLocation?: { name: string; address: string };
    deliveryLocation?: { name: string; address: string };
}

interface RequestFinancingModalProps {
    isOpen: boolean;
    onClose: () => void;
    cargo: Cargo;
    onSuccess?: () => void;
}

export const RequestFinancingModal: React.FC<RequestFinancingModalProps> = ({
    isOpen,
    onClose,
    cargo,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [loanAmount, setLoanAmount] = useState<number>(0);
    const [loanTerm, setLoanTerm] = useState<number>(30);
    const [purpose, setPurpose] = useState('Cargo transportation financing');

    // Calculate max loan amount (80% of cargo value)
    const cargoValue = cargo.loadValue || cargo.offeredPrice || 0;
    const maxLoanAmount = Math.floor(cargoValue * 0.8);

    // Calculate estimated interest (example: 2% per month)
    const monthlyRate = 0.02;
    const interestAmount = Math.floor(loanAmount * monthlyRate * (loanTerm / 30));
    const totalRepayment = loanAmount + interestAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (loanAmount <= 0) {
            toast.error('Please enter a valid loan amount');
            return;
        }

        if (loanAmount > maxLoanAmount) {
            toast.error(`Loan amount cannot exceed ${maxLoanAmount.toLocaleString()} (80% of cargo value)`);
            return;
        }

        setLoading(true);
        try {
            // Create loan request for cargo
            await loanRequestService.createLoanRequestForCargo(cargo.id, {
                trip_id: cargo.id, // Using cargo ID as trip ID for now
                // Additional fields can be added based on backend requirements
            });

            toast.success('Financing request submitted successfully!');

            // Wait a bit before calling onSuccess
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (onSuccess) {
                onSuccess();
            }

            setTimeout(() => {
                onClose();
            }, 200);
        } catch (error: any) {
            console.error('Failed to request financing:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to submit financing request';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-6 h-6 text-[#358c9c]" />
                            Request Financing
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Get instant funding for your cargo shipment
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Cargo Details */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Cargo Details</h3>
                        <div className="space-y-1 text-sm">
                            <p className="text-blue-800"><strong>Title:</strong> {cargo.title}</p>
                            <p className="text-blue-700">
                                <strong>Route:</strong> {cargo.pickupLocation?.name || 'N/A'} → {cargo.deliveryLocation?.name || 'N/A'}
                            </p>
                            <p className="text-blue-700">
                                <strong>Cargo Value:</strong> ${cargoValue.toLocaleString()}
                            </p>
                            <p className="text-blue-700">
                                <strong>Max Loan Amount:</strong> ${maxLoanAmount.toLocaleString()} (80% of value)
                            </p>
                        </div>
                    </div>

                    {/* Loan Request Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Loan Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loan Amount *
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max={maxLoanAmount}
                                    value={loanAmount || ''}
                                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#358c9c] focus:border-transparent"
                                    placeholder="Enter loan amount"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum: ${maxLoanAmount.toLocaleString()}
                            </p>
                        </div>

                        {/* Loan Term */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Loan Term *
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#358c9c] focus:border-transparent appearance-none"
                                >
                                    <option value={7}>7 Days</option>
                                    <option value={14}>14 Days</option>
                                    <option value={30}>30 Days (1 Month)</option>
                                    <option value={60}>60 Days (2 Months)</option>
                                    <option value={90}>90 Days (3 Months)</option>
                                </select>
                            </div>
                        </div>

                        {/* Purpose */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                <textarea
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#358c9c] focus:border-transparent"
                                    placeholder="Describe the purpose of this loan..."
                                />
                            </div>
                        </div>

                        {/* Loan Summary */}
                        {loanAmount > 0 && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-[#358c9c]/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-5 h-5 text-[#358c9c]" />
                                    <h4 className="text-sm font-semibold text-gray-900">Loan Summary</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-600">Loan Amount</p>
                                        <p className="font-semibold text-gray-900">${loanAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Interest (2%/month)</p>
                                        <p className="font-semibold text-gray-900">${interestAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Loan Term</p>
                                        <p className="font-semibold text-gray-900">{loanTerm} days</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Total Repayment</p>
                                        <p className="font-semibold text-[#2c7380]">${totalRepayment.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || loanAmount <= 0 || loanAmount > maxLoanAmount}
                                className="flex-1 px-4 py-2.5 bg-[#358c9c] text-white rounded-lg hover:bg-[#2c7380] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <DollarSign className="w-4 h-4" />
                                        Request Financing
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
