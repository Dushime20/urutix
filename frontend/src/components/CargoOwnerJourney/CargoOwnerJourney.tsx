import React, { useState, useEffect } from 'react';
import { FaTruck, FaGavel, FaCheck, FaClock, FaMapMarkerAlt, FaWeightHanging, FaCalendarAlt, FaFileUpload, FaComments, FaStar, FaShieldAlt } from 'react-icons/fa';
import { biddingAPI } from '../../services/biddingApi';
import CargoDetailsForm from './CargoDetailsForm';
import JourneySelectionModal from './JourneySelectionModal';
import SmartMatchingFlow from './SmartMatchingFlow';
import PublishForBidFlow from './PublishForBidFlow';
import BookingConfirmation from './BookingConfirmation';

interface CargoDetails {
  id?: string;
  title: string;
  description: string;
  cargoType: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  pickupLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  pickupDate: string;
  deliveryDate: string;
  specialRequirements: string[];
  photos: File[];
  insuranceRequired: boolean;
  isHazmat: boolean;
  isFragile: boolean;
  isRefrigerated: boolean;
  estimatedValue: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const CargoOwnerJourney: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'details' | 'selection' | 'smart-matching' | 'publish-bid' | 'booking'>('details');
  const [cargoDetails, setCargoDetails] = useState<CargoDetails | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<'smart-matching' | 'publish-bid' | null>(null);
  const [matchedTrucks, setMatchedTrucks] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [bidData, setBidData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const journeySteps: JourneyStep[] = [
    {
      id: 'details',
      title: 'Enter Cargo Details',
      description: 'Provide shipment information and requirements',
      completed: !!cargoDetails,
      current: currentStep === 'details'
    },
    {
      id: 'selection',
      title: 'Choose Journey',
      description: 'Select Smart Matching or Publish for Bid',
      completed: !!selectedJourney,
      current: currentStep === 'selection'
    },
    {
      id: 'process',
      title: 'Process Cargo',
      description: selectedJourney === 'smart-matching' ? 'AI-Powered Matching' : 'Bid Management',
      completed: currentStep === 'booking',
      current: currentStep === 'smart-matching' || currentStep === 'publish-bid'
    },
    {
      id: 'booking',
      title: 'Booking Confirmation',
      description: 'Finalize booking and payment',
      completed: !!bookingData,
      current: currentStep === 'booking'
    }
  ];

  const handleCargoDetailsSubmit = async (details: CargoDetails) => {
    setLoading(true);
    setError(null);
    
    try {
      // Save cargo details to backend
      const response = await fetch('/api/loads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(details)
      });

      if (response.ok) {
        const savedCargo = await response.json();
        setCargoDetails({ ...details, id: savedCargo.id });
        setCurrentStep('selection');
      } else {
        throw new Error('Failed to save cargo details');
      }
    } catch (error) {
      setError('Failed to save cargo details. Please try again.');
      console.error('Cargo details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJourneySelection = (journey: 'smart-matching' | 'publish-bid') => {
    setSelectedJourney(journey);
    setCurrentStep(journey);
  };

  const handleSmartMatchingComplete = (selectedTruckData: any) => {
    setSelectedTruck(selectedTruckData);
    setCurrentStep('booking');
  };

  const handlePublishBidComplete = (bidResult: any) => {
    setBidData(bidResult);
    setCurrentStep('booking');
  };

  const handleBookingComplete = (bookingResult: any) => {
    setBookingData(bookingResult);
    // Journey completed
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {journeySteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step.completed 
                ? 'bg-green-500 border-green-500 text-white' 
                : step.current 
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-gray-200 border-gray-300 text-gray-500'
            }`}>
              {step.completed ? (
                <FaCheck className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${
                step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
              }`}>
                {step.title}
              </h3>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < journeySteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                step.completed ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'details':
        return (
          <CargoDetailsForm 
            onSubmit={handleCargoDetailsSubmit}
            loading={loading}
            error={error}
          />
        );
      
      case 'selection':
        return (
          <JourneySelectionModal 
            isOpen={true}
            onClose={() => setCurrentStep('details')}
            onJourneySelected={handleJourneySelection}
          />
        );
      
      case 'smart-matching':
        return (
          <SmartMatchingFlow 
            cargoDetails={cargoDetails!}
            onComplete={handleSmartMatchingComplete}
          />
        );
      
      case 'publish-bid':
        return (
          <PublishForBidFlow 
            cargoDetails={cargoDetails!}
            onComplete={handlePublishBidComplete}
          />
        );
      
      case 'booking':
        return (
          <BookingConfirmation 
            cargoDetails={cargoDetails!}
            selectedTruck={selectedTruck}
            bidData={bidData}
            onComplete={handleBookingComplete}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaTruck className="text-blue-500 mr-3" size={24} />
            <h1 className="text-3xl font-bold text-gray-900">Cargo Owner Journey</h1>
          </div>
          <p className="text-gray-600">
            Complete your shipment from start to finish with our streamlined process
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {renderCurrentStep()}
        </div>

        {/* Progress Summary */}
        {cargoDetails && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Journey Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center">
                <FaCheck className="text-green-500 mr-2" />
                <span>Cargo Details: {cargoDetails.title}</span>
              </div>
              {selectedJourney && (
                <div className="flex items-center">
                  <FaCheck className="text-green-500 mr-2" />
                  <span>Journey Selected: {selectedJourney === 'smart-matching' ? 'Smart Matching' : 'Publish for Bid'}</span>
                </div>
              )}
              {bookingData && (
                <div className="flex items-center">
                  <FaCheck className="text-green-500 mr-2" />
                  <span>Booking Complete</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CargoOwnerJourney; 