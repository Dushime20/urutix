import React, { useState } from 'react';
import { 
  FaCheck, FaCreditCard, FaShieldAlt, FaClock, FaMapMarkerAlt,
  FaTruck, FaUser, FaBuilding, FaStar, FaFileAlt, FaEnvelope,
  FaPhone, FaCalendar, FaDollarSign, FaArrowLeft
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

interface BookingData {
  cargoId: string;
  truckId: string;
  bookingDate: string;
  totalCost: number;
  estimatedDeliveryDate: string;
  paymentTerms: string;
  specialInstructions?: string;
}

interface BookingConfirmationProps {
  cargoData: CargoFormData;
  selectedTruck: MatchedTruck;
  bookingData: BookingData;
  onConfirm: (bookingData: BookingData) => Promise<void>;
  onBack: () => void;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  cargoData,
  selectedTruck,
  bookingData,
  onConfirm,
  onBack
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCost = selectedTruck.estimatedCost + 
    (cargoData.requiresInsurance ? 150 : 0) + 
    (cargoData.requiresGpsMonitoring ? 75 : 0);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const finalBookingData: BookingData = {
        ...bookingData,
        totalCost,
        specialInstructions: specialInstructions || undefined,
        bookingDate: new Date().toISOString(),
        estimatedDeliveryDate: new Date(Date.now() + selectedTruck.estimatedTime * 60 * 60 * 1000).toISOString(),
        paymentTerms: paymentMethod === 'card' ? 'Immediate' : 'Net 30'
      };

      await onConfirm(finalBookingData);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Confirm Your Booking
        </h3>
        <p className="text-gray-600">
          Review all details and complete your booking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Summary */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Cargo</span>
                <span className="font-medium">{cargoData.title}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Truck</span>
                <span className="font-medium">{selectedTruck.truckNumber}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Carrier</span>
                <span className="font-medium">{selectedTruck.carrierName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Driver</span>
                <span className="font-medium">{selectedTruck.driverName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pickup Date</span>
                <span className="font-medium">{cargoData.pickupDate}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Date</span>
                <span className="font-medium">{cargoData.deliveryDate}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Est. Transit Time</span>
                <span className="font-medium">{selectedTruck.estimatedTime} hours</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Transportation</span>
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
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-semibold text-primary-600">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Instructions */}
        <div className="space-y-6">
          {/* Payment Method */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'bank')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div className="flex items-center">
                  <FaCreditCard className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="font-medium">Credit/Debit Card</span>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'bank')}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div className="flex items-center">
                  <FaBuilding className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="font-medium">Bank Transfer (Net 30)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Special Instructions</h4>
            
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add any special instructions for the driver or carrier..."
            />
          </div>

          {/* Terms & Conditions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Terms & Conditions</h4>
            
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <FaShieldAlt className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>All shipments are insured up to the declared value</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <FaClock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Delivery times are estimates and may vary due to weather or traffic</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <FaFileAlt className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Booking confirmation and tracking details will be sent via email</span>
              </div>
              
              <div className="flex items-start space-x-2">
                <FaEnvelope className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Real-time updates will be provided throughout the journey</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <FaCheck className="w-4 h-4 mr-2" />
              Confirm Booking
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation; 