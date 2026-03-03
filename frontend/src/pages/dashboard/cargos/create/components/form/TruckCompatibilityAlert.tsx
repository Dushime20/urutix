
import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';
import type { CargoTruckCompatibility } from '@/services/enhancedCargoApi';

interface TruckCompatibilityAlertProps {
    compatibility: CargoTruckCompatibility | null;
    loading?: boolean;
}

const TruckCompatibilityAlert: React.FC<TruckCompatibilityAlertProps> = ({ compatibility, loading }) => {
    if (!compatibility && !loading) return null;

    if (loading) {
        return (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg animate-pulse flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="w-48 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
        );
    }

    if (!compatibility) return null;

    const isCompatible = compatibility.routeCompatible &&
        compatibility.heightCompatible &&
        compatibility.weightCompatible &&
        compatibility.accessCompatible;

    return (
        <div className={`mt-4 p-4 rounded-lg border flex flex-col sm:flex-row gap-4 ${isCompatible ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
            }`}>
            <div className="flex-shrink-0">
                {isCompatible ? (
                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                        <FaCheckCircle className="w-6 h-6" />
                    </div>
                ) : (
                    <div className="p-2 bg-orange-100 rounded-full text-orange-600">
                        <FaExclamationTriangle className="w-6 h-6" />
                    </div>
                )}
            </div>

            <div className="flex-1">
                <h4 className={`text-sm font-bold flex items-center mb-1 ${isCompatible ? 'text-green-900' : 'text-orange-900'
                    }`}>
                    {isCompatible ? 'Truck Compatible' : 'Compatibility Issues Detected'}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${isCompatible ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                        Score: {compatibility.compatibilityScore}%
                    </span>
                </h4>

                <p className={`text-sm mb-3 ${isCompatible ? 'text-green-700' : 'text-orange-800'}`}>
                    {isCompatible
                        ? 'Selected truck meets all requirements for this cargo and route.'
                        : 'The selected truck may rely on route restrictions or cargo requirements.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center ${compatibility.heightCompatible ? 'text-green-700' : 'text-red-600 font-bold'}`}>
                        {compatibility.heightCompatible ? <FaCheckCircle className="mr-1.5" /> : <FaTimesCircle className="mr-1.5" />}
                        Height Clearance
                    </div>
                    <div className={`flex items-center ${compatibility.weightCompatible ? 'text-green-700' : 'text-red-600 font-bold'}`}>
                        {compatibility.weightCompatible ? <FaCheckCircle className="mr-1.5" /> : <FaTimesCircle className="mr-1.5" />}
                        Weight Capacity
                    </div>
                    <div className={`flex items-center ${compatibility.routeCompatible ? 'text-green-700' : 'text-red-600 font-bold'}`}>
                        {compatibility.routeCompatible ? <FaCheckCircle className="mr-1.5" /> : <FaTimesCircle className="mr-1.5" />}
                        Route Restrictions
                    </div>
                    <div className={`flex items-center ${compatibility.accessCompatible ? 'text-green-700' : 'text-red-600 font-bold'}`}>
                        {compatibility.accessCompatible ? <FaCheckCircle className="mr-1.5" /> : <FaTimesCircle className="mr-1.5" />}
                        Location Access
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TruckCompatibilityAlert;
