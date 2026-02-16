import React, { useState, useEffect } from 'react';
import {
    X, User, DollarSign, TrendingUp, Mail,
    ArrowRight, ArrowLeft, CheckCircle, FileText, Calendar
} from 'lucide-react';
import { brokerAPI } from '../../services/brokerApi';
import toast from 'react-hot-toast';

interface Broker {
    id: string;
    email: string;
    defaultCommissionRate?: number;
    totalCommissionEarned?: number;
    profile?: {
        firstName?: string;
        lastName?: string;
        companyName?: string;
    };
}

interface BrokerAssignmentWizardProps {
    isOpen: boolean;
    onClose: () => void;
    loadId: string;
    loadTitle?: string;
    loadValue?: number;
    onSuccess?: () => void;
}

export const BrokerAssignmentWizard: React.FC<BrokerAssignmentWizardProps> = ({
    isOpen,
    onClose,
    loadId,
    loadTitle,
    loadValue = 0,
    onSuccess,
}) => {
    // Steps: 1 = Select Broker, 2 = Contract Terms
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Step 1 State: Browsing Brokers
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);

    // Step 2 State: Contract Details
    const [contractTerms, setContractTerms] = useState({
        agreedRate: loadValue || 0,
        commissionRate: 5.0,
        paymentTerms: 'Net 30 days',
        specialInstructions: '',
        pickupDate: '',
        deliveryDate: ''
    });

    // Fetch brokers on mount
    useEffect(() => {
        console.log('🔵 BrokerAssignmentWizard useEffect triggered', { isOpen, loadValue });
        if (isOpen) {
            console.log('✅ Modal is open, calling fetchBrokers()');
            fetchBrokers();
            setStep(1); // Reset to step 1
            setSelectedBroker(null);
            // Reset terms but keep loadValue if available
            setContractTerms(prev => ({ ...prev, agreedRate: loadValue || 0 }));
        } else {
            console.log('❌ Modal is NOT open, skipping fetchBrokers()');
        }
    }, [isOpen, loadValue]);

    // Update commission when broker is selected
    useEffect(() => {
        if (selectedBroker?.defaultCommissionRate) {
            setContractTerms(prev => ({
                ...prev,
                commissionRate: selectedBroker.defaultCommissionRate!
            }));
        }
    }, [selectedBroker]);

    const fetchBrokers = async () => {
        setLoading(true);
        try {
            console.log('🔄 Fetching brokers list...');
            const response = await brokerAPI.getBrokers();
            console.log('✅ Brokers API response:', response);

            const brokersData = response.data || response || [];
            const brokersList = Array.isArray(brokersData) ? brokersData : [];

            console.log(`📋 Found ${brokersList.length} broker(s)`);
            setBrokers(brokersList);

            if (brokersList.length === 0) {
                console.warn('⚠️ No brokers available in the system');
            } else {
                brokersList.forEach((broker: any, index: number) => {
                    console.log(`  ${index + 1}. ${broker.email} - ${broker.profile?.companyName || broker.profile?.firstName || 'Unnamed'}`);
                });
            }
        } catch (error: any) {
            console.error('❌ Failed to fetch brokers:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
            });

            const errorMessage = error.response?.status === 401
                ? 'Authentication required. Please log in again.'
                : error.response?.status === 403
                    ? 'You do not have permission to view brokers.'
                    : error.response?.data?.message || 'Failed to load brokers list. Please try again.';

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && selectedBroker) {
            setStep(2);
        }
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        }
    };

    const handleSubmit = async () => {
        if (!selectedBroker) return;

        setSubmitting(true);
        try {
            // 1. Assign Broker
            console.log('🔄 Step 1: Assigning broker...');
            await brokerAPI.assignBrokerToLoad(loadId, {
                brokerId: selectedBroker.id,
                commissionRate: contractTerms.commissionRate
            });



            toast.success('Broker assigned and contract sent!');

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('❌ Failed to process assignment:', error);
            toast.error(error.response?.data?.message || 'Failed to assign broker and create contract');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredBrokers = brokers.filter(broker => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        const name = `${broker.profile?.firstName || ''} ${broker.profile?.lastName || ''}`.trim().toLowerCase();
        const email = broker.email.toLowerCase();
        const company = broker.profile?.companyName?.toLowerCase() || '';
        return name.includes(search) || email.includes(search) || company.includes(search);
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 1 ? 'Select Broker' : 'Contract Terms'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {step === 1
                                ? 'Choose a broker to assign to this load'
                                : `Define terms for ${selectedBroker?.profile?.companyName || 'the selected broker'}`}
                            {loadTitle && <span className="block font-medium text-blue-600 mt-0.5">{loadTitle}</span>}
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full">
                        <span className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-green-500'}`} />
                        <span className="text-xs font-medium text-gray-600">Step {step} of 2</span>
                    </div>

                    <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 1 ? (
                        /* STEP 1: SELECT BROKER */
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Search brokers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                autoFocus
                            />

                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : filteredBrokers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    {searchTerm ? (
                                        <>
                                            <p className="font-medium text-gray-700">No brokers found matching "{searchTerm}"</p>
                                            <p className="text-sm mt-2">Try adjusting your search terms</p>
                                        </>
                                    ) : brokers.length === 0 ? (
                                        <>
                                            <p className="font-medium text-gray-700">No brokers available</p>
                                            <p className="text-sm mt-2">Please contact your administrator to create broker accounts</p>
                                        </>
                                    ) : (
                                        <p>No brokers found</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredBrokers.map((broker) => (
                                        <div
                                            key={broker.id}
                                            onClick={() => setSelectedBroker(broker)}
                                            className={`group p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${selectedBroker?.id === broker.id
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-start space-x-3">
                                                    <div className={`p-2 rounded-lg ${selectedBroker?.id === broker.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-blue-500'}`}>
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {broker.profile?.companyName ||
                                                                (broker.profile?.firstName ? `${broker.profile.firstName} ${broker.profile.lastName}` : 'Unnamed Broker')}
                                                        </h3>
                                                        <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
                                                            <span className="flex items-center">
                                                                <Mail className="w-3 h-3 mr-1" />
                                                                {broker.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedBroker?.id === broker.id && (
                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* STEP 2: CONTRACT TERMS */
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Agreed Rate</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            value={contractTerms.agreedRate}
                                            onChange={(e) => setContractTerms({ ...contractTerms, agreedRate: Number(e.target.value) })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Commission (%)</label>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={contractTerms.commissionRate}
                                            onChange={(e) => setContractTerms({ ...contractTerms, commissionRate: Number(e.target.value) })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                                <input
                                    type="text"
                                    value={contractTerms.paymentTerms}
                                    onChange={(e) => setContractTerms({ ...contractTerms, paymentTerms: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Net 30 days"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={contractTerms.pickupDate}
                                            onChange={(e) => setContractTerms({ ...contractTerms, pickupDate: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <input
                                            type="date"
                                            value={contractTerms.deliveryDate}
                                            onChange={(e) => setContractTerms({ ...contractTerms, deliveryDate: e.target.value })}
                                            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
                                <textarea
                                    rows={3}
                                    value={contractTerms.specialInstructions}
                                    onChange={(e) => setContractTerms({ ...contractTerms, specialInstructions: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Any specific requirements..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                    {step === 2 ? (
                        <button
                            onClick={handleBack}
                            disabled={submitting}
                            className="flex items-center text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Brokers
                        </button>
                    ) : (
                        <div /> // Spacer
                    )}

                    {step === 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!selectedBroker}
                            className="flex items-center bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                        >
                            Next: Contract Terms
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex items-center bg-green-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Sending Contract...
                                </>
                            ) : (
                                <>
                                    Assign & Send Contract
                                    <FileText className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
