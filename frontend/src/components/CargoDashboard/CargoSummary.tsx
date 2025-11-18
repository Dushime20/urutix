import React from 'react';
import { 
  FaBox, FaTruck, FaMapMarkerAlt, FaCalendar, FaDollarSign, 
  FaClock, FaUser, FaBuilding, FaShieldAlt, FaStar, FaCheck,
  FaThermometerHalf, FaRulerCombined, FaLocationArrow, FaBoxes, FaArrowLeft
} from 'react-icons/fa';
import type { CargoFormData as BaseCargoFormData } from '@/types/cargo';

type CargoFormData = BaseCargoFormData & {
  locations?: Array<{
    type: 'PICKUP' | 'DELIVERY';
    locationData: {
      name: string;
      address: string;
      coordinates: {
        latitude: number;
        longitude: number;
      };
      contactInfo?: {
        contactPerson?: string;
        contactPhone?: string;
        contactEmail?: string;
      };
      operatingHours?: Record<string, any>;
      specialInstructions?: string;
      accessInstructions?: string;
    };
    scheduledDate: string;
    estimatedTime: number;
    requirements?: {
      requiresForklift?: boolean;
      requiresCrane?: boolean;
      requiresLoadingDock?: boolean;
      hazmatCertified?: boolean;
      temperatureControlled?: boolean;
      securityClearance?: string;
    };
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  }>;
};

interface MatchedTruck {
  id: string;
  truckNumber: string;
  driverName: string;
  carrierName: string;
  rating: number;
  distance: number;
  estimatedCost: number;
  estimatedTime: number;
  availableDate: string;
  features: string[];
  capacity: {
    weight: number;
    volume: number;
  };
  insurance: {
    coverage: number;
    type: string;
  };
  certifications: string[];
  score: number;
}

interface CargoSummaryProps {
  cargoData: CargoFormData;
  selectedTruck: MatchedTruck;
  onConfirm: () => void;
  onBack: () => void;
}

const CargoSummary: React.FC<CargoSummaryProps> = ({
  cargoData,
  selectedTruck,
  onConfirm,
  onBack
}) => {
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'NORMAL': return 'text-blue-600 bg-blue-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCargoTypeColor = (type: string) => {
    switch (type) {
      case 'HAZARDOUS': return 'text-red-600 bg-red-100';
      case 'FRAGILE': return 'text-orange-600 bg-orange-100';
      case 'REFRIGERATED': return 'text-blue-600 bg-blue-100';
      case 'VALUABLE': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Booking Summary
          </h3>
          <p className="text-gray-600">
            Review your cargo details and selected truck before confirming
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Match Score:</span>
          <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
            {selectedTruck.score}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cargo Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FaBox className="w-5 h-5 text-primary-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-900">Cargo Details</h4>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">{cargoData.title}</h5>
              <p className="text-sm text-gray-600">{cargoData.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCargoTypeColor(cargoData.cargoType)}`}>
                  {cargoData.cargoType}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Urgency</span>
                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(cargoData.urgencyLevel || 'NORMAL')}`}>
                  {cargoData.urgencyLevel || 'NORMAL'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Weight</span>
                <p className="font-medium">{cargoData.weight} kg</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Volume</span>
                <p className="font-medium">{cargoData.volume || 'N/A'} m³</p>
              </div>
            </div>

            {cargoData.length && cargoData.width && cargoData.height && (
              <div>
                <span className="text-sm text-gray-500">Dimensions</span>
                <p className="font-medium">{cargoData.length} × {cargoData.width} × {cargoData.height} m</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Pickup Date</span>
                <p className="font-medium">{cargoData.pickupDate}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Delivery Date</span>
                <p className="font-medium">{cargoData.deliveryDate}</p>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Load Value</span>
              <p className="font-medium">${cargoData.loadValue.toLocaleString()}</p>
            </div>

            {/* Special Requirements */}
            {(cargoData.isFragile || cargoData.isHazardous || cargoData.requiresRefrigeration) && (
              <div>
                <span className="text-sm text-gray-500">Special Requirements</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {cargoData.isFragile && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      Fragile
                    </span>
                  )}
                  {cargoData.isHazardous && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Hazardous
                    </span>
                  )}
                  {cargoData.requiresRefrigeration && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Refrigerated
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Truck */}
        <div className="bg-primary-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FaTruck className="w-5 h-5 text-primary-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-900">Selected Truck</h4>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="font-medium text-gray-900">{selectedTruck.truckNumber}</h5>
              <p className="text-sm text-gray-600">{selectedTruck.carrierName}</p>
            </div>

            <div className="flex items-center space-x-2">
              <FaUser className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{selectedTruck.driverName}</span>
              <div className="flex items-center ml-2">
                {getRatingStars(selectedTruck.rating)}
                <span className="text-sm text-gray-600 ml-1">({selectedTruck.rating})</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Capacity</span>
                <p className="font-medium">{selectedTruck.capacity.weight.toLocaleString()} kg</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Volume</span>
                <p className="font-medium">{selectedTruck.capacity.volume} m³</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Distance</span>
                <p className="font-medium">{selectedTruck.distance} km</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Est. Time</span>
                <p className="font-medium">{selectedTruck.estimatedTime} hours</p>
              </div>
            </div>

            <div>
              <span className="text-sm text-gray-500">Insurance Coverage</span>
              <p className="font-medium">${(selectedTruck.insurance.coverage / 1000000).toFixed(1)}M</p>
            </div>

            {/* Features */}
            <div>
              <span className="text-sm text-gray-500">Features</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedTruck.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {selectedTruck.certifications.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">Certifications</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTruck.certifications.map((cert) => (
                    <span
                      key={cert}
                      className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Transportation Cost</span>
            <span className="font-medium">${selectedTruck.estimatedCost.toFixed(2)}</span>
          </div>
          
          {cargoData.requiresInsurance && (
            <div className="flex justify-between">
              <span className="text-gray-600">Insurance</span>
              <span className="font-medium">$150.00</span>
            </div>
          )}
          
          {cargoData.requiresGpsMonitoring && (
            <div className="flex justify-between">
              <span className="text-gray-600">GPS Tracking</span>
              <span className="font-medium">$75.00</span>
            </div>
          )}
          
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Cost</span>
              <span className="text-lg font-semibold text-primary-600">
                ${(selectedTruck.estimatedCost + (cargoData.requiresInsurance ? 150 : 0) + (cargoData.requiresGpsMonitoring ? 75 : 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </button>
        
        <button
          onClick={onConfirm}
          className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <FaCheck className="w-4 h-4 mr-2" />
          Confirm Booking
        </button>
      </div>
    </div>
  );
};

export default CargoSummary; 