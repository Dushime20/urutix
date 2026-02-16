import React, { useState } from 'react';
import { X, FileText, DollarSign, Calendar, Loader2, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface CreateContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string;
    loadTitle: string;
    brokerId: string;
    brokerName: string;
    onSuccess: () => void;
}

const CreateContractModal: React.FC<CreateContractModalProps> = ({
    isOpen,
    onClose,
    loadId,
    loadTitle,
    brokerId,
    brokerName,
    onSuccess
}) => {
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        agreedRate: 0,
        commissionRate: 5.0,
        paymentTerms: 'Net 30 days',
        pickupDate: '',
        deliveryDate: '',
        specialInstructions: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.agreedRate || formData.agreedRate <= 0) {
            toast.error('Please enter a valid agreed rate');
            return;
        }

        try {
            setCreating(true);

            await api.post('/brokers/contracts', {
                brokerId,
                loadId,
                agreedRate: Number(formData.agreedRate),
                commissionRate: Number(formData.commissionRate),
                currencyCode: 'KES',
                paymentTerms: formData.paymentTerms,
                pickupDate: formData.pickupDate || undefined,
                deliveryDate: formData.deliveryDate || undefined,
                specialInstructions: formData.specialInstructions || undefined,
                contractType: 'BROKER_AGREEMENT'
            });

            toast.success('Contract created successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating contract:', error);
            toast.error(error.response?.data?.message || 'Failed to create contract');
        } finally {
            setCreating(false);
        }
    };

    if (!isOpen) return null;

    const commissionAmount = (formData.agreedRate * formData.commissionRate) / 100;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Create Contract</h2>
                        <p className="text-sm text-gray-600 mt-1">{loadTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">Broker: {brokerName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Financial Terms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Agreed Rate (KES) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="number"
                                        required
                                        value={formData.agreedRate}
                                        onChange={(e) => setFormData({ ...formData, agreedRate: Number(e.target.value) })}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Commission Rate (%)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    <input
                                        type="number"
                                        value={formData.commissionRate}
                                        onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="5.0"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Terms */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <select
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Net 30 days">Net 30 days</option>
                                    <option value="Net 15 days">Net 15 days</option>
                                    <option value="Net 7 days">Net 7 days</option>
                                    <option value="On Delivery">On Delivery</option>
                                    <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                                </select>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Pickup Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={formData.pickupDate}
                                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Delivery Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="date"
                                        value={formData.deliveryDate}
                                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        min={formData.pickupDate || new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Special Instructions */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                            <textarea
                                value={formData.specialInstructions}
                                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Any special terms or conditions..."
                            />
                        </div>

                        {/* Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Contract Summary</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Agreed Rate:</span>
                                    <span className="font-semibold text-gray-900">KES {formData.agreedRate.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Commission ({formData.commissionRate}%):</span>
                                    <span className="font-semibold text-gray-900">KES {commissionAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Terms:</span>
                                    <span className="font-semibold text-gray-900">{formData.paymentTerms}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating || !formData.agreedRate}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Create Contract</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateContractModal;
