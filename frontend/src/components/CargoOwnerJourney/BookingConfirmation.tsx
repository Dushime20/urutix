import React from 'react';
import {
    CheckCircle,
    LayoutDashboard,
    Plus,
    FileText,
    Truck,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookingConfirmationProps {
    bookingData?: any;
    onReset?: () => void;
    cargoDetails?: any;
    selectedTruck?: any;
    bidData?: any;
    onComplete?: (bookingResult: any) => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ bookingData, onReset, cargoDetails, selectedTruck, bidData, onComplete }) => {
    const [confirmedState, setConfirmedState] = React.useState<any>(null);
    const finalData = bookingData || confirmedState;
    const navigate = useNavigate();

    if (!finalData) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-lg w-full">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Confirm Your Booking</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden mb-8 text-left p-6">
                        <p className="mb-4">You are about to book the cargo <strong>{cargoDetails?.title}</strong>.</p>
                        {selectedTruck && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-800">Selected Carrier:</h4>
                                <p>{selectedTruck.truckOwner?.name} - {selectedTruck.truck?.make}</p>
                                <p className="text-gray-600 dark:text-slate-300 font-medium mt-1">Estimated Cost: ${selectedTruck.estimatedCost}</p>
                            </div>
                        )}
                        {bidData && (
                            <div className="mb-4">
                                <h4 className="font-semibold text-gray-800">Selected Bid:</h4>
                                <p>{bidData.truckOwner?.name}</p>
                                <p className="text-gray-600 dark:text-slate-300 font-medium mt-1">Bid Amount: ${bidData.bidAmount}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => {
                                const result = {
                                    id: `BKG-${Math.floor(Math.random() * 10000)}`,
                                    status: 'Confirmed',
                                    type: selectedTruck ? 'Direct Booking' : 'Bid Awarded',
                                    loadId: cargoDetails?.id,
                                };
                                setConfirmedState(result);
                                if (onComplete) onComplete(result);
                            }}
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-lg w-full">
                {/* Success Animation/Icon */}
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-pulse">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                    Booking Successful!
                </h2>
                <p className="text-lg text-gray-600 dark:text-slate-300 mb-8">
                    Your cargo has been successfully registered on the platform.
                </p>

                {/* Receipt Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden mb-8 text-left">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-100" />
                            Booking Reference
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                            <span className="text-gray-500 text-sm">Load ID</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">{bookingData?.loadId || bookingData?.id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-3">
                            <span className="text-gray-500 text-sm">Status</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {bookingData?.status || 'Created'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Type</span>
                            <span className="text-gray-900 dark:text-white">{bookingData?.type === 'broker-assigned' ? 'Broker Managed' : 'Direct Booking'}</span>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 text-sm text-gray-500 italic">
                        A confirmation email has been sent to your inbox.
                    </div>
                </div>

                {/* Next Steps */}
                <div className="text-left mb-8">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">What Happens Next?</h4>
                    <div className="space-y-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <ShieldCheck className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-3">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Verification</h5>
                                <p className="text-sm text-gray-500">Our team checks your cargo details for compliance.</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <Truck className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-3">
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">Matching</h5>
                                <p className="text-sm text-gray-500">We start looking for the best carriers or brokers for your route.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate('/dashboard/cargos')}
                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all"
                    >
                        <LayoutDashboard className="w-5 h-5 mr-2" />
                        Go to Dashboard
                    </button>

                    <button
                        onClick={onReset}
                        className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Another
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingConfirmation;
