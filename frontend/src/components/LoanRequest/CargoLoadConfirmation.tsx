import React, { useState } from 'react';
import { 
  FaTruck, 
  FaCheckCircle, 
  FaBox, 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaInfoCircle,
  FaMoneyBillWave,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import { loanRequestService } from '../../services/loanRequestService';
import type { LoanRequest } from '../../types/loanRequest';

interface CargoDetails {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocation?: {
    name: string;
    address: string;
  };
  deliveryLocation?: {
    name: string;
    address: string;
  };
  pickupDate: string;
  deliveryDate: string;
  status: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  contactInfo?: {
    contactPerson?: string;
    contactPhone?: string;
  };
}

interface TripDetails {
  id: string;
  driverName: string;
  driverPhone: string;
  truckPlateNumber: string;
  estimatedDuration: string;
  route: string;
}

interface CargoLoadConfirmationProps {
  cargo: CargoDetails;
  trip: TripDetails;
  onConfirmLoaded: (loanRequest?: LoanRequest) => void;
  onCancel: () => void;
}

const CargoLoadConfirmation: React.FC<CargoLoadConfirmationProps> = ({
  cargo,
  trip,
  onConfirmLoaded,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loanRequest, setLoanRequest] = useState<LoanRequest | null>(null);
  const [showLoanDetails, setShowLoanDetails] = useState(false);

  const handleConfirmLoaded = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create loan request for the loaded cargo
      const newLoanRequest = await loanRequestService.createLoanRequestForCargo(cargo.id, {
        trip_id: trip.id
      });

      setLoanRequest(newLoanRequest);
      setShowLoanDetails(true);
      
      // Call the parent callback with the loan request
      onConfirmLoaded(newLoanRequest);
    } catch (err: any) {
      console.error('Error creating loan request:', err);
      setError(err.response?.data?.message || 'Failed to create loan request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showLoanDetails && loanRequest) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                <FaCheckCircle className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Cargo Loaded Successfully!</h2>
                <p className="text-gray-600">Loan request created automatically</p>
              </div>
            </div>

            {/* Loan Request Details */}
            <div className="bg-primary-50 rounded-xl p-6 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaMoneyBillWave className="text-primary-600 text-xl" />
                <h3 className="text-lg font-semibold text-gray-800">Loan Request Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Loan ID</label>
                  <p className="text-gray-800 font-mono text-sm">{loanRequest.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested Amount</label>
                  <p className="text-xl font-bold text-primary-600">
                    RWF {loanRequest.requested_amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    loanRequest.status === 'pending' ? 'bg-warning-100 text-warning-800' :
                    loanRequest.status === 'approved' ? 'bg-success-100 text-success-800' :
                    loanRequest.status === 'disbursed' ? 'bg-secondary-100 text-secondary-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {loanRequest.status.charAt(0).toUpperCase() + loanRequest.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-gray-800">{new Date(loanRequest.created_at).toLocaleString()}</p>
                </div>
              </div>

              {loanRequest.approved_amount && (
                <div className="mt-4 p-4 bg-success-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-success-600" />
                    <span className="font-semibold text-success-800">Loan Approved!</span>
                  </div>
                  <p className="text-success-700 mt-1">
                    Approved Amount: RWF {loanRequest.approved_amount.toLocaleString()}
                  </p>
                  {loanRequest.interest_amount && (
                    <p className="text-success-700">
                      Interest: RWF {loanRequest.interest_amount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Lender Review</p>
                    <p className="text-sm text-gray-600">Our lending partners will review your request automatically</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Fund Disbursement</p>
                    <p className="text-sm text-gray-600">Approved funds will be disbursed to your account</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Trip Completion</p>
                    <p className="text-sm text-gray-600">Complete your delivery and receive payment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={() => onConfirmLoaded(loanRequest)}
                className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-200"
              >
                Continue to Dashboard
              </button>
              <button
                onClick={() => setShowLoanDetails(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                View Details Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <FaTruck className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Confirm Cargo Loading</h2>
              <p className="text-gray-600">Review details and confirm your cargo has been loaded</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <FaExclamationTriangle className="text-error-600" />
                <span className="font-semibold text-error-800">Error</span>
              </div>
              <p className="text-error-700 mt-1">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cargo Details */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaBox className="text-primary-600 text-xl" />
                <h3 className="text-lg font-semibold text-gray-800">Cargo Details</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <p className="text-gray-800 font-semibold">{cargo.title}</p>
                </div>
                
                {cargo.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-800">{cargo.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Weight</label>
                    <p className="text-gray-800">{cargo.weight} kg</p>
                  </div>
                  {cargo.volume && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Volume</label>
                      <p className="text-gray-800">{cargo.volume} m³</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Cargo Type</label>
                  <p className="text-gray-800 capitalize">{cargo.cargoType.toLowerCase()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Load Value</label>
                  <p className="text-xl font-bold text-primary-600">
                    {cargo.currencyCode} {cargo.loadValue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Trip & Driver Details */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <FaUser className="text-secondary-600 text-xl" />
                <h3 className="text-lg font-semibold text-gray-800">Trip & Driver Details</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Driver</label>
                  <p className="text-gray-800 font-semibold">{trip.driverName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact</label>
                  <div className="flex items-center space-x-2">
                    <FaPhone className="text-gray-400" />
                    <p className="text-gray-800">{trip.driverPhone}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Truck Plate</label>
                  <p className="text-gray-800 font-mono">{trip.truckPlateNumber}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Estimated Duration</label>
                  <p className="text-gray-800">{trip.estimatedDuration}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Route</label>
                  <p className="text-gray-800">{trip.route}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="mt-6 bg-secondary-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaMapMarkerAlt className="text-secondary-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">Route Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Pickup Location</label>
                <p className="text-gray-800 font-semibold">{cargo.pickupLocation?.name}</p>
                <p className="text-sm text-gray-600">{cargo.pickupLocation?.address}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <FaCalendarAlt className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-600">
                    {new Date(cargo.pickupDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Delivery Location</label>
                <p className="text-gray-800 font-semibold">{cargo.deliveryLocation?.name}</p>
                <p className="text-sm text-gray-600">{cargo.deliveryLocation?.address}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <FaCalendarAlt className="text-gray-400 text-sm" />
                  <span className="text-sm text-gray-600">
                    {new Date(cargo.deliveryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Information */}
          <div className="mt-6 bg-warning-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaInfoCircle className="text-warning-600 text-xl" />
              <h3 className="text-lg font-semibold text-gray-800">Trip Advance Information</h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-700">
                When you confirm that your cargo has been loaded, we'll automatically create a trip advance request for you.
              </p>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaDollarSign className="text-primary-600" />
                  <span className="font-semibold text-gray-800">Benefits of Trip Advance:</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 ml-6">
                  <li>• Get funds before trip completion</li>
                  <li>• Cover fuel and operational costs</li>
                  <li>• Automatic processing with partner lenders</li>
                  <li>• Competitive interest rates</li>
                  <li>• Seamless repayment upon delivery</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 mt-8">
            <button
              onClick={handleConfirmLoaded}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-success-500 to-success-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-success-600 hover:to-success-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Confirming Loading...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  <span>Confirm Cargo is Loaded</span>
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CargoLoadConfirmation;
