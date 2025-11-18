import React, { useState, useEffect } from 'react';
import { FaTruck, FaStar, FaMapMarkerAlt, FaClock, FaWeightHanging, FaShieldAlt, FaThermometerHalf, FaRoute, FaCheck, FaTimes, FaCog } from 'react-icons/fa';
import { cargoOwnerAPI } from '../../services/cargoApi';
import type { MatchedTruck } from '../../services/cargoApi';

interface CargoDetails {
  id?: string;
  title: string;
  description?: string;
  cargoType: string;
  weight: number;
  volume?: number;
  pickupLocationId?: string;
  deliveryLocationId?: string;
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  autoMatchEnabled: boolean;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  // For demo purposes, we'll add mock location data
  pickupLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Using the MatchedTruck interface from cargoOwnerAPI

interface SmartMatchingFlowProps {
  cargoDetails: CargoDetails;
  onComplete: (selectedTruck: MatchedTruck) => void;
}

const SmartMatchingFlow: React.FC<SmartMatchingFlowProps> = ({ cargoDetails, onComplete }) => {
  const [matchedTrucks, setMatchedTrucks] = useState<MatchedTruck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<MatchedTruck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    findMatches();
  }, []);

  const findMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the real matching API
      const response = await cargoOwnerAPI.findMatches(cargoDetails.id!, {
        maxDistance: 500,
        minRating: 4.0,
        maxCost: cargoDetails.loadValue * 0.3,
        requiresRefrigeration: cargoDetails.requiresRefrigeration,
        requiresHazmat: cargoDetails.isHazardous,
        isTimeCritical: cargoDetails.urgencyLevel === 'CRITICAL',
        includeDrivers: true,
        limit: 10
      });

      if (response.data) {
        setMatchedTrucks(response.data);
      } else {
        setError('No matches found');
      }
    } catch (error) {
      console.error('Matching error:', error);
      setError('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed demo data - using real API data

  const handleSelectTruck = (truck: MatchedTruck) => {
    setSelectedTruck(truck);
  };

  const handleConfirmSelection = () => {
    if (selectedTruck) {
      onComplete(selectedTruck);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-blue-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Finding optimal matches...</p>
      </div>
    );
  }

  return (
    <div className="smart-matching-flow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <FaTruck className="inline mr-2 text-blue-500" />
          AI-Powered Smart Matching
        </h2>
        <p className="text-gray-600">
          We've found {matchedTrucks.length} optimal matches for your cargo using advanced algorithms.
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Cargo Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <FaWeightHanging className="text-blue-500 mr-2" />
            <span>{cargoDetails.weight} lbs - {cargoDetails.cargoType}</span>
          </div>
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-blue-500 mr-2" />
            <span>
              {cargoDetails.pickupLocation?.city || 'Pickup Location'} → {cargoDetails.deliveryLocation?.city || 'Delivery Location'}
            </span>
          </div>
          <div className="flex items-center">
            <FaClock className="text-blue-500 mr-2" />
            <span>Pickup: {new Date(cargoDetails.pickupDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Matched Trucks */}
      <div className="space-y-4">
        {matchedTrucks.map((truck) => (
          <div
            key={truck.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all ${
              selectedTruck?.id === truck.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => handleSelectTruck(truck)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {truck.truckOwner.name}
                    </h3>
                    <p className="text-sm text-gray-600">{truck.truck.make} {truck.truck.model} ({truck.truck.truckType})</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(truck.score)} ${getScoreColor(truck.score)}`}>
                      <FaStar className="mr-1" />
                      {truck.score}% Match
                    </div>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ${truck.estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-gray-400 mr-2" />
                    <span className="text-sm">{truck.distance} miles</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-gray-400 mr-2" />
                    <span className="text-sm">{truck.estimatedTime} hours</span>
                  </div>
                  <div className="flex items-center">
                    <FaStar className="text-gray-400 mr-2" />
                    <span className="text-sm">{truck.driver.rating} ★ Driver</span>
                  </div>
                  <div className="flex items-center">
                    <FaShieldAlt className="text-gray-400 mr-2" />
                    <span className="text-sm">Risk: {Math.round(truck.riskScore * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <FaCheck className="text-green-500 mr-1" />
                    <span>Available Now</span>
                  </div>
                  {truck.truck.hasRefrigeration && (
                    <div className="flex items-center">
                      <FaThermometerHalf className="text-blue-500 mr-1" />
                      <span>Refrigerated</span>
                    </div>
                  )}
                  {truck.truck.hasHazmatPermit && (
                    <div className="flex items-center">
                      <FaShieldAlt className="text-orange-500 mr-1" />
                      <span>Hazmat Certified</span>
                    </div>
                  )}
                  {truck.truck.hasGpsTracking && (
                    <div className="flex items-center">
                      <FaRoute className="text-purple-500 mr-1" />
                      <span>GPS Tracking</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-4">
                {selectedTruck?.id === truck.id ? (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-sm" />
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>
            </div>

            {/* Detailed View */}
            {showDetails === truck.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Driver Details</h4>
                    <p className="text-sm text-gray-600">{truck.driver.firstName} {truck.driver.lastName}</p>
                    <p className="text-sm text-gray-600">{truck.driver.experience} years experience</p>
                    <p className="text-sm text-gray-600">Rating: {truck.driver.rating} ★</p>
                    <p className="text-sm text-gray-600">Endorsements: {truck.driver.endorsements.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Truck Details</h4>
                    <p className="text-sm text-gray-600">{truck.truck.make} {truck.truck.model} ({truck.truck.year})</p>
                    <p className="text-sm text-gray-600">Capacity: {truck.truck.capacityWeight} lbs</p>
                    <p className="text-sm text-gray-600">Type: {truck.truck.truckType}</p>
                    <p className="text-sm text-gray-600">Insurance: ${truck.truck.insuranceCoverage.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(showDetails === truck.id ? null : truck.id);
              }}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDetails === truck.id ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleConfirmSelection}
          disabled={!selectedTruck}
          className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
            selectedTruck
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};

export default SmartMatchingFlow; 