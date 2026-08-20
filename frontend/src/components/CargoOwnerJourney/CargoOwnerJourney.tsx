import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTruck } from 'react-icons/fa';
import CargoDetailsForm from './CargoDetailsForm';
import JourneySelectionModal from './JourneySelectionModal';
import SmartMatchingFlow from './SmartMatchingFlow';
import PublishForBidFlow from './PublishForBidFlow';
import BookingConfirmation from './BookingConfirmation';

import { AssignBrokerModal } from '../CargoDashboard/AssignBrokerModal';
import { cargoOwnerAPI } from '../../services/cargoApi';
import { createLocation } from '../../services/locationApi';

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
  // Additional fields required by SmartMatchingFlow
  loadValue: number;
  currencyCode: string;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  autoMatchEnabled: boolean;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const CargoOwnerJourney: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<'details' | 'selection' | 'smart-matching' | 'publish-bid' | 'assign-broker' | 'book-space' | 'booking'>('details');
  const [cargoDetails, setCargoDetails] = useState<CargoDetails | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<'smart-matching' | 'publish-bid' | 'assign-broker' | 'book-space' | null>(null);
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
      description: 'Select Smart Matching, Assign Broker, or Publish for Bid',
      completed: !!selectedJourney,
      current: currentStep === 'selection'
    },
    {
      id: 'process',
      title: 'Process Cargo',
      description: selectedJourney === 'smart-matching' ? 'AI-Powered Matching' : selectedJourney === 'assign-broker' ? 'Broker Assignment' : 'Bid Management',
      completed: currentStep === 'booking',
      current: currentStep === 'smart-matching' || currentStep === 'publish-bid' || currentStep === 'assign-broker'
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
      // 1. Create Pickup Location
      const pickupLocationPayload = {
        name: `Pickup - ${details.title}`,
        address: details.pickupLocation.address,
        city: details.pickupLocation.city,
        state: details.pickupLocation.state,
        postalCode: details.pickupLocation.zipCode,
        country: 'Rwanda', // Default
        latitude: details.pickupLocation.coordinates?.lat || 0,
        longitude: details.pickupLocation.coordinates?.lng || 0,
        type: 'PICKUP'
      };
      const pickupResponse = await createLocation(pickupLocationPayload);
      const pickupLocationId = pickupResponse.id;

      // 2. Create Delivery Location
      const deliveryLocationPayload = {
        name: `Delivery - ${details.title}`,
        address: details.deliveryLocation.address,
        city: details.deliveryLocation.city,
        state: details.deliveryLocation.state,
        postalCode: details.deliveryLocation.zipCode,
        country: 'Rwanda', // Default
        latitude: details.deliveryLocation.coordinates?.lat || 0,
        longitude: details.deliveryLocation.coordinates?.lng || 0,
        type: 'DELIVERY'
      };
      const deliveryResponse = await createLocation(deliveryLocationPayload);
      const deliveryLocationId = deliveryResponse.id;

      // Calculate volume (L * W * H)
      const volume = details.dimensions.length * details.dimensions.width * details.dimensions.height;

      // Map cargo type to backend enum
      const cargoTypeMap: Record<string, string> = {
        'General Freight': 'GENERAL',
        'Food & Beverage': 'FOOD',
        'Electronics': 'ELECTRONICS',
        'Hazardous Materials': 'CHEMICALS',
        'Automotive': 'AUTOMOTIVE',
        'Machinery': 'MACHINERY',
        'Textiles': 'TEXTILES',
        'Pharmaceuticals': 'CHEMICALS',
        'Oversized Load': 'MACHINERY',
        'Refrigerated': 'FOOD',
        'Furniture': 'GENERAL',
        'Other': 'GENERAL'
      };

      // Create a payload that maps fields to what backend/components expect
      const enhancedDetails = {
        ...details,
        cargoType: cargoTypeMap[details.cargoType] || 'GENERAL',
        volume,
        loadValue: details.estimatedValue,
        currencyCode: 'USD',

        pickupLocationId: pickupLocationId,
        deliveryLocationId: deliveryLocationId,

        isHazardous: details.isHazmat,
        requiresRefrigeration: details.isRefrigerated,
        autoMatchEnabled: true,
        urgencyLevel: (details.urgency === 'MEDIUM' ? 'NORMAL' : details.urgency) as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
      };

      // Save cargo details to backend using the service
      const response = await cargoOwnerAPI.createLoad(enhancedDetails);

      if (response && response.data && (response.data.id || response.data.data?.id)) {
        const savedCargo = response.data.data || response.data;
        setCargoDetails({ ...enhancedDetails, id: savedCargo.id, specialRequirements: details.specialRequirements });
        setCurrentStep('selection');
      } else {
        throw new Error('Failed to save cargo details');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save cargo details. Please check your inputs and try again.');
      console.error('Cargo details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJourneySelection = (journey: 'smart-matching' | 'publish-bid' | 'assign-broker' | 'book-space') => {
    if (journey === 'book-space') {
      const qs = new URLSearchParams({
        loadId: cargoDetails?.id || '',
        weightKg: String(cargoDetails?.weight || ''),
        title: cargoDetails?.title || '',
      });
      navigate(`/dashboard/available-space?${qs.toString()}`);
      return;
    }
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

  const handleBrokerAssignmentComplete = () => {
    // Refresh or update state if needed, then move to booking logic or dashboard
    // For now, let's assume successful assignment moves to a confirmation state or dashboard
    // Since 'booking' step might expect specific data, we might need to adjust or just skip to a success message.
    // For consistency with other flows, let's set a placeholder booking data
    setBookingData({ type: 'broker-assigned', loadId: cargoDetails?.id });
    setCurrentStep('booking');
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {journeySteps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step.completed
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
              <h3 className={`text-sm font-medium ${step.current ? 'text-blue-600' : step.completed ? 'text-green-600' : 'text-gray-500'
                }`}>
                {step.title}
              </h3>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
            {index < journeySteps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${step.completed ? 'bg-green-500' : 'bg-gray-300'
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
            onSubmit={handleCargoDetailsSubmit as any}
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
            cargoData={cargoDetails}
          />
        );

      case 'smart-matching':
        return (
          <SmartMatchingFlow
            cargoDetails={{
              ...cargoDetails!,
              specialRequirements: cargoDetails!.specialRequirements.join(', ')
            }}
            onComplete={handleSmartMatchingComplete}
          />
        );

      case 'publish-bid':
        return (
          <PublishForBidFlow
            cargoDetails={{
              ...cargoDetails!,
              specialRequirements: cargoDetails!.specialRequirements.join(', ')
            }}
            onComplete={handlePublishBidComplete}
          />
        );

      case 'assign-broker':
        return (
          <AssignBrokerModal
            isOpen={true}
            onClose={() => setCurrentStep('selection')}
            loadId={cargoDetails?.id || ''}
            loadTitle={cargoDetails?.title}
            loadValue={cargoDetails?.loadValue}
            targetPrice={(cargoDetails as any)?.offeredPrice || (cargoDetails as any)?.targetPrice}
            onSuccess={handleBrokerAssignmentComplete}
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FaTruck className="text-blue-500 mr-3" size={24} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cargo Owner Journey</h1>
          </div>
          <p className="text-gray-600 dark:text-slate-300">
            Complete your shipment from start to finish with our streamlined process
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Current Step Content */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
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