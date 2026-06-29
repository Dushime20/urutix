import React, { useState, useEffect } from 'react';
import {
    X, User, DollarSign, TrendingUp, Mail,
    ArrowRight, ArrowLeft, CheckCircle, FileText, Calendar,
    Clock, MapPin, Truck
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
    cargoPickupDate?: string;
    cargoDeliveryDate?: string;
    onSuccess?: () => void;
}

// Helper: convert an ISO date string or Date to yyyy-MM-dd for internal state
const toDateInputValue = (value?: string | Date): string => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

// Helper: format date for display — e.g. "Mon, 14 Jul 2025"
const formatDisplayDate = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper: days between today and a yyyy-MM-dd string
const daysFromNow = (iso: string): number | null => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

export const BrokerAssignmentWizard: React.FC<BrokerAssignmentWizardProps> = ({
    isOpen,
    onClose,
    loadId,
    loadTitle,
    loadValue = 0,
    cargoPickupDate,
    cargoDeliveryDate,
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
            // Reset terms, seeding dates from cargo data
            setContractTerms(prev => ({
                ...prev,
                agreedRate: loadValue || 0,
                pickupDate: toDateInputValue(cargoPickupDate),
                deliveryDate: toDateInputValue(cargoDeliveryDate),
            }));
        } else {
            console.log('❌ Modal is NOT open, skipping fetchBrokers()');
        }
    }, [isOpen, loadValue, cargoPickupDate, cargoDeliveryDate]);

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
                        <div className="space-y-5">

                            {/* ── Cargo Schedule Card (read-only, display only) ── */}
                            <div className="rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-primary-100/60 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-600">
                                    <Truck className="w-3.5 h-3.5 text-white" />
                                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Cargo Schedule</span>
                                    <span className="ml-auto text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">Auto-filled from cargo</span>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-primary-100">
                                    {/* Pickup */}
                                    <div className="p-4 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-primary-500">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-semibold uppercase tracking-wider">Pickup Date</span>
                                        </div>
                                        {contractTerms.pickupDate ? (
                                            <>
                                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                                    {formatDisplayDate(contractTerms.pickupDate)}
                                                </p>
                                                {(() => {
                                                    const days = daysFromNow(contractTerms.pickupDate);
                                                    if (days === null) return null;
                                                    const label = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : days < 0 ? `${Math.abs(days)}d ago` : `In ${days} days`;
                                                    const color = days < 0 ? 'text-red-500' : days <= 3 ? 'text-amber-500' : 'text-emerald-600';
                                                    return (
                                                        <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
                                                            <Clock className="w-3 h-3" />
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Not set</p>
                                        )}
                                    </div>
                                    {/* Delivery */}
                                    <div className="p-4 flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-primary-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-semibold uppercase tracking-wider">Delivery Date</span>
                                        </div>
                                        {contractTerms.deliveryDate ? (
                                            <>
                                                <p className="text-sm font-bold text-gray-800 leading-tight">
                                                    {formatDisplayDate(contractTerms.deliveryDate)}
                                                </p>
                                                {contractTerms.pickupDate && contractTerms.deliveryDate && (() => {
                                                    const pickup = new Date(contractTerms.pickupDate);
                                                    const delivery = new Date(contractTerms.deliveryDate);
                                                    const span = Math.ceil((delivery.getTime() - pickup.getTime()) / 86_400_000);
                                                    if (span <= 0) return null;
                                                    return (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-primary-500">
                                                            <Clock className="w-3 h-3" />
                                                            {span} day{span !== 1 ? 's' : ''} transit
                                                        </span>
                                                    );
                                                })()}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Not set</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Financial Terms ── */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5" /> Agreed Rate
                                    </p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                                        <input
                                            type="number"
                                            value={contractTerms.agreedRate}
                                            onChange={(e) => setContractTerms({ ...contractTerms, agreedRate: Number(e.target.value) })}
                                            className="w-full pl-7 pr-3 py-2 text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                                        />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5" /> Commission Rate
                                    </p>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                            value={contractTerms.commissionRate}
                                            onChange={(e) => setContractTerms({ ...contractTerms, commissionRate: Number(e.target.value) })}
                                            className="w-full pl-3 pr-8 py-2 text-sm font-semibold text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">%</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Payment Terms ── */}
                            <div className="rounded-xl border border-gray-200 p-4 bg-white">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" /> Payment Terms
                                </p>
                                <input
                                    type="text"
                                    value={contractTerms.paymentTerms}
                                    onChange={(e) => setContractTerms({ ...contractTerms, paymentTerms: e.target.value })}
                                    className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50"
                                    placeholder="e.g. Net 30 days"
                                />
                            </div>

                            {/* ── Special Instructions ── */}
                            <div className="rounded-xl border border-gray-200 p-4 bg-white">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Special Instructions</p>
                                <textarea
                                    rows={3}
                                    value={contractTerms.specialInstructions}
                                    onChange={(e) => setContractTerms({ ...contractTerms, specialInstructions: e.target.value })}
                                    className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 resize-none"
                                    placeholder="Any specific requirements or notes for the broker..."
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
