
import React from 'react';
import { FaBuilding, FaClock, FaWarehouse, FaParking, FaGasPump, FaExclamationTriangle } from 'react-icons/fa';
import type { LocationIntelligence } from '@/services/enhancedCargoApi';

interface LocationIntelligenceCardProps {
    intelligence: LocationIntelligence | null;
    loading?: boolean;
}

const LocationIntelligenceCard: React.FC<LocationIntelligenceCardProps> = ({ intelligence, loading }) => {
    if (!intelligence && !loading) return null;

    if (loading) {
        return (
            <div className="mt-2 p-3 border border-blue-100 rounded-lg bg-blue-50/50 animate-pulse">
                <div className="h-4 bg-blue-200 rounded w-1/2 mb-3"></div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-8 bg-blue-100 rounded"></div>
                    <div className="h-8 bg-blue-100 rounded"></div>
                </div>
            </div>
        );
    }

    if (!intelligence) return null;

    const isHighSecurity = intelligence.securityLevel === 'HIGH' || intelligence.securityLevel === 'MAXIMUM';
    const hasParking = intelligence.parkingAvailable;

    return (
        <div className="mt-3 bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden animate-fadeIn">
            <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex justify-between items-center">
                <h4 className="text-xs font-bold text-blue-900 flex items-center">
                    <FaBuilding className="mr-1.5 text-blue-600" />
                    Facility Intelligence: {intelligence.category}
                </h4>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isHighSecurity ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {intelligence.securityLevel} Security
                </span>
            </div>

            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                    <div className="text-gray-500 mb-0.5 flex items-center"><FaClock className="mr-1" /> Hours</div>
                    <div className="font-medium text-gray-900">
                        {intelligence.businessHours.open} - {intelligence.businessHours.close}
                    </div>
                </div>

                <div>
                    <div className="text-gray-500 mb-0.5 flex items-center"><FaWarehouse className="mr-1" /> Docks</div>
                    <div className="font-medium text-gray-900">{intelligence.loadingDockCount} available</div>
                </div>

                <div>
                    <div className="text-gray-500 mb-0.5 flex items-center"><FaParking className="mr-1" /> Parking</div>
                    <div className="font-medium text-gray-900">{hasParking ? 'Available' : 'Limited/None'}</div>
                </div>

                <div>
                    <div className="text-gray-500 mb-0.5 flex items-center"><FaGasPump className="mr-1" /> Services</div>
                    <div className="font-medium text-gray-900">Fuel: {intelligence.fuelStationsNearby} nearby</div>
                </div>
            </div>

            {/* Warnings & Alerts */}
            {(intelligence.maxTruckHeight > 0 || intelligence.specialInstructions) && (
                <div className="px-3 pb-3 space-y-2">
                    {intelligence.maxTruckHeight > 0 && intelligence.maxTruckHeight < 4.5 && (
                        <div className="text-xs text-orange-800 bg-orange-50 p-2 rounded border border-orange-100 flex items-start">
                            <FaExclamationTriangle className="mr-1.5 mt-0.5 flex-shrink-0 text-orange-500" />
                            <span><strong>Height Restriction:</strong> Max clearance {intelligence.maxTruckHeight}m</span>
                        </div>
                    )}

                    {intelligence.specialInstructions && (
                        <div className="text-xs text-blue-800 bg-blue-50/50 p-2 rounded border border-blue-100">
                            <span className="font-semibold block mb-0.5">Special Instructions:</span>
                            {intelligence.specialInstructions}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationIntelligenceCard;
