import React, { useState, useEffect } from 'react';
import { 
  FaBox, FaMapMarkerAlt, FaTruck, FaCheck, FaArrowRight, FaArrowLeft,
  FaCalendar, FaDollarSign, FaClock, FaUser, FaFileAlt, FaShieldAlt,
  FaThermometerHalf, FaRulerCombined, FaCogs, FaCameraRetro, FaLocationArrow,
  FaTimes, FaExclamationTriangle
} from 'react-icons/fa';
import EnhancedCargoForm from '../../pages/dashboard/cargos/create/components/form';
import TruckMatchingResults from './TruckMatchingResults';
import BookingConfirmation from './BookingConfirmation';
import CargoSummary from './CargoSummary';
import type { CargoFormData as BaseCargoFormData } from '@/types/cargo';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

// Temporary local interfaces to bypass module resolution issues
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

interface CargoStepperProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (bookingData: { cargoData: CargoFormData; bookingData: BookingData }) => Promise<void>;
}

const CargoStepper: React.FC<CargoStepperProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { confirm, DialogComponent } = useConfirmDialog();
  const [currentStep, setCurrentStep] = useState(1);
  const [cargoData, setCargoData] = useState<CargoFormData | null>(null);
  const [matchedTrucks, setMatchedTrucks] = useState<MatchedTruck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<MatchedTruck | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Cargo Details',
      description: 'Enter comprehensive cargo information',
      icon: FaBox,
      status: 'current' as const
    },
    {
      id: 2,
      title: 'Smart Matching',
      description: 'AI-powered truck matching',
      icon: FaTruck,
      status: 'upcoming' as const
    },
    {
      id: 3,
      title: 'Select Truck',
      description: 'Choose your preferred truck',
      icon: FaUser,
      status: 'upcoming' as const
    },
    {
      id: 4,
      title: 'Booking Confirmation',
      description: 'Review and confirm booking',
      icon: FaCheck,
      status: 'upcoming' as const
    }
  ];

  // Update step status based on current step
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'upcoming';
  };

  // Handle cargo form submission
  const handleCargoSubmit = async (data: CargoFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Save cargo data
      setCargoData(data);
      
      // Simulate AI matching process
      await simulateMatching(data);
      
      // Move to next step
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Failed to process cargo data');
    } finally {
      setLoading(false);
    }
  };

  // Simulate AI matching process
  const simulateMatching = async (cargoData: CargoFormData) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock matched trucks
    const mockTrucks: MatchedTruck[] = [
      {
        id: 'truck-1',
        truckNumber: 'TRK-001',
        driverName: 'John Smith',
        carrierName: 'Reliable Transport Co.',
        rating: 4.8,
        distance: 25.5,
        estimatedCost: 1250.00,
        estimatedTime: 3.5,
        availableDate: '2024-01-15',
        features: ['GPS', 'Refrigeration', 'Side Rails', 'Tarp'],
        capacity: { weight: 15000, volume: 80 },
        insurance: { coverage: 1000000, type: 'Comprehensive' },
        certifications: ['HAZMAT', 'Temperature Control'],
        score: 95
      },
      {
        id: 'truck-2',
        truckNumber: 'TRK-002',
        driverName: 'Sarah Johnson',
        carrierName: 'Swift Logistics',
        rating: 4.6,
        distance: 32.1,
        estimatedCost: 1100.00,
        estimatedTime: 4.2,
        availableDate: '2024-01-16',
        features: ['GPS', 'Lift Gate', 'Temperature Monitoring'],
        capacity: { weight: 12000, volume: 65 },
        insurance: { coverage: 800000, type: 'Standard' },
        certifications: ['Temperature Control'],
        score: 88
      },
      {
        id: 'truck-3',
        truckNumber: 'TRK-003',
        driverName: 'Mike Wilson',
        carrierName: 'Premium Haulers',
        rating: 4.9,
        distance: 28.7,
        estimatedCost: 1400.00,
        estimatedTime: 3.8,
        availableDate: '2024-01-15',
        features: ['GPS', 'Security System', 'Real-time Tracking'],
        capacity: { weight: 18000, volume: 95 },
        insurance: { coverage: 1500000, type: 'Premium' },
        certifications: ['HAZMAT', 'Security', 'Temperature Control'],
        score: 92
      }
    ];

    setMatchedTrucks(mockTrucks);
  };

  // Handle truck selection
  const handleTruckSelect = (truck: MatchedTruck) => {
    setSelectedTruck(truck);
    setCurrentStep(3);
  };

  // Handle booking confirmation
  const handleBookingConfirm = async (bookingData: BookingData) => {
    setLoading(true);
    setError(null);

    try {
      // Process booking with both cargo and booking data
      await onComplete({ cargoData: cargoData!, bookingData });
      setBookingData(bookingData);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  // Reset stepper
  const handleReset = () => {
    setCurrentStep(1);
    setCargoData(null);
    setMatchedTrucks([]);
    setSelectedTruck(null);
    setBookingData(null);
    setError(null);
  };

  // Handle close with confirmation
  const handleClose = async () => {
    if (currentStep > 1) {
      const confirmed = await confirm({
        title: "Cancel Cargo Creation",
        message: "Are you sure you want to cancel? All progress will be lost.",
        confirmText: "Yes, Cancel",
        cancelText: "Continue",
        variant: "warning",
      });
      if (confirmed) {
        handleReset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Cargo Booking Flow
            </h2>
            <p className="text-gray-600 mt-1">Complete your cargo booking in 4 simple steps</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                      ${status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : status === 'current'
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-primary-50 border-primary-200 text-primary-600'
                      }
                    `}>
                      {status === 'completed' ? (
                        <FaCheck className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className={`text-sm font-medium ${
                        status === 'completed' ? 'text-green-600' :
                        status === 'current' ? 'text-primary-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {step.description}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <FaExclamationTriangle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Cargo Details */}
          {currentStep === 1 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 1: Enter Cargo Details
                </h3>
                <p className="text-gray-600">
                  Provide comprehensive information about your cargo for optimal truck matching.
                </p>
              </div>
              <EnhancedCargoForm
                isOpen={true}
                onClose={onClose}
                onSubmit={handleCargoSubmit}
                mode="create"
              />
            </div>
          )}

          {/* Step 2: Smart Matching */}
          {currentStep === 2 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 2: AI-Powered Matching
                </h3>
                <p className="text-gray-600">
                  Our intelligent system is finding the best trucks for your cargo.
                </p>
              </div>
              <TruckMatchingResults
                matchedTrucks={matchedTrucks}
                onTruckSelect={handleTruckSelect}
                loading={loading}
              />
            </div>
          )}

          {/* Step 3: Select Truck */}
          {currentStep === 3 && selectedTruck && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 3: Review Selected Truck
                </h3>
                <p className="text-gray-600">
                  Review the selected truck details and proceed to booking.
                </p>
              </div>
              <CargoSummary
                cargoData={cargoData!}
                selectedTruck={selectedTruck}
                onConfirm={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            </div>
          )}

          {/* Step 4: Booking Confirmation */}
          {currentStep === 4 && selectedTruck && bookingData && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 4: Booking Confirmation
                </h3>
                <p className="text-gray-600">
                  Review and confirm your booking details.
                </p>
              </div>
              <BookingConfirmation
                cargoData={cargoData!}
                selectedTruck={selectedTruck}
                bookingData={bookingData}
                onConfirm={handleBookingConfirm}
                onBack={() => setCurrentStep(3)}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Start Over
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
            >
              Cancel
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
            )}
            
            {loading && (
              <div className="flex items-center text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                Processing...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

export default CargoStepper; 