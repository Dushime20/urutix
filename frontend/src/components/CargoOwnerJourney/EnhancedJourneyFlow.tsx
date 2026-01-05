import React, { useState, useEffect } from 'react';
import { FaTruck, FaGavel, FaCheck, FaRocket, FaHandshake, FaMapMarkerAlt, FaWeightHanging, FaCalendarAlt } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import EnhancedCargoForm from '../../pages/dashboard/cargos/create/components/form';
import TruckSelectionModal from '../../pages/dashboard/cargos/create/components/form/TruckSelectionModal';
import SmartMatchingFlow from './SmartMatchingFlow';
import PublishForBidFlow from './PublishForBidFlow';
import { useAuth } from '../../contexts/AuthContext';
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

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

const EnhancedJourneyFlow: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<'cargo-form' | 'journey-selection' | 'smart-matching' | 'publish-bid' | 'booking'>('cargo-form');
  const [cargoData, setCargoData] = useState<CargoFormData | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<'smart-matching' | 'publish-bid' | null>(null);
  const [matchedTrucks, setMatchedTrucks] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [bidData, setBidData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCargoForm, setShowCargoForm] = useState(true);
  const [showTruckSelection, setShowTruckSelection] = useState(false);

  // Handle cargo data passed from state
  useEffect(() => {
    console.log('Location state:', location.state);
    if (location.state?.cargoData) {
      console.log('Setting cargo data:', location.state.cargoData);
      setCargoData(location.state.cargoData);
      setShowCargoForm(false);
      
      if (location.state.selectedJourney) {
        console.log('Setting selected journey:', location.state.selectedJourney);
        setSelectedJourney(location.state.selectedJourney);
        setCurrentStep(location.state.selectedJourney);
      } else {
        setCurrentStep('journey-selection');
      }
    }
  }, [location.state]);

  const journeySteps: JourneyStep[] = [
    {
      id: 'cargo-form',
      title: 'Enter Cargo Details',
      description: 'Provide comprehensive shipment information',
      completed: !!cargoData,
      current: currentStep === 'cargo-form'
    },
    {
      id: 'journey-selection',
      title: 'Choose Journey',
      description: 'Select Smart Matching or Publish for Bid',
      completed: !!selectedJourney,
      current: currentStep === 'journey-selection'
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

  const handleCargoFormSubmit = async (data: CargoFormData) => {
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
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const savedCargo = await response.json();
        setCargoData({ ...data, id: savedCargo.id });
        setShowCargoForm(false);
        setCurrentStep('journey-selection');
      } else {
        throw new Error('Failed to save cargo details');
      }
    } catch (error) {
      setError('Failed to save cargo details. Please try again.');
      console.error('Cargo form error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJourneySelection = (journey: 'smart-matching' | 'publish-bid') => {
    setSelectedJourney(journey);
    setCurrentStep(journey);
    
    if (journey === 'smart-matching') {
      // Trigger smart matching immediately
      triggerSmartMatching();
    }
  };

  const triggerSmartMatching = async () => {
    setLoading(true);
    try {
      // Call matching API with cargo data
      const response = await fetch('/api/matching/find-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          loadId: cargoData?.id,
          cargoData: cargoData
        })
      });

      if (response.ok) {
        const matches = await response.json();
        setMatchedTrucks(matches);
        setShowTruckSelection(true);
      } else {
        throw new Error('Failed to find matches');
      }
    } catch (error) {
      setError('Failed to find truck matches. Please try again.');
      console.error('Smart matching error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTruckSelected = (truck: any) => {
    setSelectedTruck(truck);
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

  const [showComparison, setShowComparison] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardScores, setWizardScores] = useState({ smart: 0, bid: 0 });

  const renderComparisonModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Journey Comparison</h2>
            <button onClick={() => setShowComparison(false)} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border rounded-xl overflow-hidden">
            {/* Header Column */}
            <div className="bg-gray-50 p-4 border-b md:border-b-0 md:border-r">
              <div className="h-16 md:block hidden"></div>
              <div className="space-y-4 font-medium text-gray-700 mt-4">
                <div className="h-10 flex items-center">Speed</div>
                <div className="h-10 flex items-center">Cost</div>
                <div className="h-10 flex items-center">Control</div>
                <div className="h-10 flex items-center">Effort</div>
                <div className="h-10 flex items-center">Certainty</div>
              </div>
            </div>

            {/* Smart Matching Column */}
            <div className="p-4 border-b md:border-b-0 md:border-r bg-blue-50/30">
              <div className="h-16 flex flex-col items-center justify-center mb-4">
                <FaRocket className="text-blue-600 w-6 h-6 mb-1" />
                <h3 className="font-bold text-blue-900">Smart Matching</h3>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-10 flex items-center justify-center text-sm"><span className="bg-green-100 text-green-800 px-2 py-1 rounded">Fast (Instant)</span></div>
                <div className="h-10 flex items-center justify-center text-sm">Market Rate</div>
                <div className="h-10 flex items-center justify-center text-sm">Automated</div>
                <div className="h-10 flex items-center justify-center text-sm">Low</div>
                <div className="h-10 flex items-center justify-center text-sm">High</div>
              </div>
              <button 
                onClick={() => { setShowComparison(false); handleJourneySelection('smart-matching'); }}
                className="w-full mt-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Select Smart Matching
              </button>
            </div>

            {/* Bidding Column */}
            <div className="p-4 bg-green-50/30">
              <div className="h-16 flex flex-col items-center justify-center mb-4">
                <FaGavel className="text-green-600 w-6 h-6 mb-1" />
                <h3 className="font-bold text-green-900">Publish for Bid</h3>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-10 flex items-center justify-center text-sm">Slower (Days)</div>
                <div className="h-10 flex items-center justify-center text-sm"><span className="bg-green-100 text-green-800 px-2 py-1 rounded">Potential Savings</span></div>
                <div className="h-10 flex items-center justify-center text-sm">Manual Selection</div>
                <div className="h-10 flex items-center justify-center text-sm">Medium</div>
                <div className="h-10 flex items-center justify-center text-sm">Variable</div>
              </div>
              <button 
                onClick={() => { setShowComparison(false); handleJourneySelection('publish-bid'); }}
                className="w-full mt-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Select Bidding
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWizardModal = () => {
    const questions = [
      {
        text: "How urgent is this shipment?",
        options: [
          { label: "Critical - Need it moved now", score: { smart: 2, bid: 0 } },
          { label: "Flexible - Can wait a few days", score: { smart: 0, bid: 2 } }
        ]
      },
      {
        text: "What is your budget priority?",
        options: [
          { label: "Price is everything - I want the lowest possible rate", score: { smart: 0, bid: 2 } },
          { label: "Reliability - I'll pay market rate for guaranteed service", score: { smart: 2, bid: 0 } }
        ]
      },
      {
        text: "Do you want to negotiate?",
        options: [
          { label: "Yes, I like to haggle", score: { smart: 0, bid: 2 } },
          { label: "No, just give me a fair price", score: { smart: 2, bid: 0 } }
        ]
      }
    ];

    const currentQuestion = questions[wizardStep];
    const isFinished = wizardStep >= questions.length;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Journey Helper</h2>
            <button onClick={() => { setShowWizard(false); setWizardStep(0); setWizardScores({ smart: 0, bid: 0 }); }} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {!isFinished ? (
            <div>
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Question {wizardStep + 1} of {questions.length}</div>
                <h3 className="text-lg font-medium text-gray-900">{currentQuestion.text}</h3>
              </div>
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setWizardScores(prev => ({
                        smart: prev.smart + option.score.smart,
                        bid: prev.bid + option.score.bid
                      }));
                      setWizardStep(prev => prev + 1);
                    }}
                    className="w-full text-left p-4 rounded-lg border hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <FaStar className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Recommendation</h3>
                <p className="text-gray-600">
                  Based on your answers, we recommend:
                </p>
                <div className="mt-4 text-2xl font-bold text-indigo-600">
                  {wizardScores.smart >= wizardScores.bid ? "Smart Matching" : "Publish for Bid"}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWizard(false);
                  handleJourneySelection(wizardScores.smart >= wizardScores.bid ? 'smart-matching' : 'publish-bid');
                  setWizardStep(0);
                  setWizardScores({ smart: 0, bid: 0 });
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Proceed with {wizardScores.smart >= wizardScores.bid ? "Smart Matching" : "Bidding"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderJourneySelection = () => (
    <div className="journey-selection">
      {showComparison && renderComparisonModal()}
      {showWizard && renderWizardModal()}
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Choose Your Journey</h2>
          <p className="text-gray-600">
            Select the best fulfillment method for your shipment.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium text-sm transition-colors"
          >
            <FaStar className="w-4 h-4" />
            Help Me Choose
          </button>
          <button 
            onClick={() => setShowComparison(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors"
          >
            <FaCheck className="w-4 h-4" />
            Compare
          </button>
        </div>
      </div>


      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Option A: Smart Matching */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-colors duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-full p-3 mr-4">
                <FaRocket className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Smart Matching</h3>
                <p className="text-sm text-gray-600">Fast, automated matching</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Instant truck matching based on your requirements</span>
              </div>
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>AI-powered recommendations</span>
              </div>
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Quick booking process</span>
              </div>
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Best for urgent shipments</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">AI Recommendation</h4>
              <p className="text-sm text-blue-800">
                Based on your {cargoData?.urgencyLevel?.toLowerCase()} priority and {cargoData?.cargoType} cargo type, 
                Smart Matching is recommended for faster processing.
              </p>
            </div>

            <button
              onClick={() => handleJourneySelection('smart-matching')}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Choose Smart Matching'}
            </button>
          </div>
        </div>

        {/* Option B: Publish for Bid */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-full p-3 mr-4">
                <FaGavel className="text-green-600" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Publish for Bid</h3>
                <p className="text-sm text-gray-600">Competitive pricing, flexible selection</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Multiple truck owner bids</span>
              </div>
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Competitive pricing options</span>
              </div>
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Detailed truck profiles and reviews</span>
              </div>
              <div className="flex items-center text-sm">
                <FaCheck className="text-green-500 mr-2" />
                <span>Best for cost optimization</span>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-green-900 mb-2">Bidding Process</h4>
              <p className="text-sm text-green-800">
                Set bid period, review offers from multiple truck owners, and select the best option for your needs.
              </p>
            </div>

            <button
              onClick={() => handleJourneySelection('publish-bid')}
              disabled={loading}
              className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Choose Publish for Bid'}
            </button>
          </div>
        </div>
      </div>

      {/* Cargo Summary */}
      {cargoData && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Cargo Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Title:</span> {cargoData.title}
            </div>
            <div>
              <span className="font-medium">Type:</span> {cargoData.cargoType}
            </div>
            <div>
              <span className="font-medium">Weight:</span> {cargoData.weight} kg
            </div>
            <div>
              <span className="font-medium">Value:</span> ${cargoData.loadValue?.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Urgency:</span> {cargoData.urgencyLevel}
            </div>
            <div>
              <span className="font-medium">Special:</span> {cargoData.isFragile ? 'Fragile' : ''} {cargoData.isHazardous ? 'Hazmat' : ''} {cargoData.requiresRefrigeration ? 'Refrigerated' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBookingConfirmation = () => {
    console.log('Booking confirmation - selectedTruck:', selectedTruck);
    console.log('Booking confirmation - bidData:', bidData);
    
    return (
    <div className="booking-confirmation">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Booking Confirmation</h2>
        <p className="text-gray-600">
          Review and confirm your booking details.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Summary</h3>
        
        {!selectedTruck && !bidData && (
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    No booking details available. Please complete the matching or bidding process first.
                  </h3>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {selectedTruck && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Selected Truck</h4>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Driver:</strong> {selectedTruck.driver?.name || selectedTruck.driverName}</div>
                <div><strong>Truck Type:</strong> {selectedTruck.truck?.type || selectedTruck.truckType}</div>
                <div><strong>Capacity:</strong> {selectedTruck.truck?.capacity || selectedTruck.capacity} kg</div>
                <div><strong>Rating:</strong> {selectedTruck.driver?.rating || selectedTruck.rating} ⭐</div>
                <div><strong>Match Score:</strong> {selectedTruck.matchScore}%</div>
                <div><strong>Estimated Cost:</strong> ${selectedTruck.estimatedCost?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {bidData && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Bid Details</h4>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Bid Amount:</strong> ${bidData.selectedBid?.bidAmount || bidData.bidAmount}</div>
                <div><strong>Bidder:</strong> {bidData.selectedBid?.truckOwner?.name || bidData.bidderName}</div>
                <div><strong>Driver:</strong> {bidData.selectedBid?.driverInfo?.name || bidData.driverName}</div>
                <div><strong>Experience:</strong> {bidData.selectedBid?.driverInfo?.experience || bidData.experience} years</div>
                <div><strong>Truck Type:</strong> {bidData.selectedBid?.truckSpecifications?.truckType || bidData.truckType}</div>
                <div><strong>Capacity:</strong> {bidData.selectedBid?.truckSpecifications?.capacity || bidData.capacity} kg</div>
                <div><strong>Estimated Time:</strong> {bidData.selectedBid?.estimatedTime || bidData.estimatedTime} hours</div>
                <div><strong>Distance:</strong> {bidData.selectedBid?.distance || bidData.distance} miles</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setCurrentStep('journey-selection')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
          <button
            onClick={() => handleBookingComplete({ success: true })}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Please log in to access the enhanced journey.
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
           {currentStep === 'cargo-form' && (
            <EnhancedCargoForm
              isOpen={showCargoForm}
              onClose={() => setShowCargoForm(false)}
              onSubmit={handleCargoFormSubmit}
              mode="create"
              showTruckSelection={false}
            />
          )}

          {currentStep === 'journey-selection' && renderJourneySelection()}

                     {currentStep === 'smart-matching' && cargoData && (
             <SmartMatchingFlow 
               cargoDetails={cargoData}
               onComplete={handleTruckSelected}
             />
           )}

           {currentStep === 'publish-bid' && cargoData && (
             <PublishForBidFlow 
               cargoDetails={cargoData}
               onComplete={handlePublishBidComplete}
             />
           )}

          {currentStep === 'booking' && renderBookingConfirmation()}
        </div>

        {/* Truck Selection Modal */}
        {showTruckSelection && matchedTrucks.length > 0 && (
          <TruckSelectionModal
            isOpen={showTruckSelection}
            onClose={() => setShowTruckSelection(false)}
            matchedTrucks={matchedTrucks}
            onTruckSelected={handleTruckSelected}
            cargoData={cargoData}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedJourneyFlow; 