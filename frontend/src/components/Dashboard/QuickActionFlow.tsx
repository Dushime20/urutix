import { useState } from 'react';
import { X, Package, Zap, TrendingUp, Gavel, ArrowRight, CheckCircle, Clock, DollarSign, Users } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui';
import QuickCreateModal from '@/components/Cargo/QuickCreateModal';
import toast from 'react-hot-toast';
import { loadsAPI } from '@/services/load';
import { useNavigate } from 'react-router-dom';

interface QuickActionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type FlowStep = 'create' | 'choose-journey' | 'processing' | 'complete';

const QuickActionFlow: React.FC<QuickActionFlowProps> = ({ isOpen, onClose, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<FlowStep>('create');
  const [createdCargoId, setCreatedCargoId] = useState<string | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<'smart' | 'bid' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCargoCreated = (cargoId: string) => {
    setCreatedCargoId(cargoId);
    setCurrentStep('choose-journey');
  };

  const handleJourneySelection = async (journey: 'smart' | 'bid') => {
    setSelectedJourney(journey);
    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      if (journey === 'smart') {
        // Initiate smart matching
        await loadsAPI.initiateSmartMatching(createdCargoId!);
        setTimeout(() => {
          setCurrentStep('complete');
          setIsProcessing(false);
        }, 2000);
      } else {
        // Initiate bidding
        await loadsAPI.publishForBidding(createdCargoId!);
        setTimeout(() => {
          setCurrentStep('complete');
          setIsProcessing(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to initiate journey:', error);
      toast.error('Failed to start journey. Please try again.');
      setCurrentStep('choose-journey');
      setIsProcessing(false);
    }
  };

  const handleViewResults = () => {
    if (selectedJourney === 'smart') {
      navigate(`/dashboard/cargo/${createdCargoId}/smart-matching`);
    } else {
      navigate(`/dashboard/cargo/${createdCargoId}/bidding`);
    }
    onClose();
    resetFlow();
  };

  const handleStayOnDashboard = () => {
    onClose();
    resetFlow();
    if (onComplete) onComplete();
  };

  const resetFlow = () => {
    setCurrentStep('create');
    setCreatedCargoId(null);
    setSelectedJourney(null);
    setIsProcessing(false);
  };

  if (!isOpen) return null;

  // Step 1: Quick Create Form
  if (currentStep === 'create') {
    return (
      <QuickCreateModal
        isOpen={isOpen}
        onClose={() => {
          onClose();
          resetFlow();
        }}
        onSuccess={handleCargoCreated}
      />
    );
  }

  // Step 2: Journey Selection
  if (currentStep === 'choose-journey') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            <button
              onClick={() => {
                onClose();
                resetFlow();
              }}
              className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Cargo Created Successfully!</h2>
              <p className="text-gray-600">Now, how would you like to find a truck for your shipment?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Smart Matching Option */}
              <button
                onClick={() => handleJourneySelection('smart')}
                className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-6 transition-all hover:shadow-lg text-left"
              >
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Matching</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    AI-powered algorithm finds the best trucks instantly
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Instant matches in seconds</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>AI-scored compatibility</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Book immediately</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-blue-200">
                  <div>
                    <p className="text-xs text-gray-500">Best for</p>
                    <p className="text-sm font-semibold text-gray-900">Urgent shipments</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </button>

              {/* Bidding Option */}
              <button
                onClick={() => handleJourneySelection('bid')}
                className="group relative bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-400 rounded-xl p-6 transition-all hover:shadow-lg text-left"
              >
                <div className="absolute top-4 right-4 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                  <Gavel className="w-4 h-4 text-amber-600" />
                </div>

                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Publish for Bidding</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Let carriers compete for your shipment
                  </p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Get competitive pricing</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Multiple carrier options</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Review & choose best bid</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-amber-200">
                  <div>
                    <p className="text-xs text-gray-500">Best for</p>
                    <p className="text-sm font-semibold text-gray-900">Cost optimization</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center group-hover:bg-amber-700 transition-colors">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  onClose();
                  resetFlow();
                }}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                I'll decide later
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 3: Processing
  if (currentStep === 'processing') {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="w-full max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              {selectedJourney === 'smart' ? (
                <TrendingUp className="w-8 h-8 text-blue-600" />
              ) : (
                <Gavel className="w-8 h-8 text-amber-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedJourney === 'smart' ? 'Finding Best Matches...' : 'Publishing for Bidding...'}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedJourney === 'smart' 
                ? 'Our AI is analyzing available trucks and calculating match scores'
                : 'Your shipment is being published to our carrier network'}
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 4: Complete with Results Preview
  if (currentStep === 'complete') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            <button
              onClick={handleStayOnDashboard}
              className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedJourney === 'smart' ? 'Matches Found!' : 'Published Successfully!'}
              </h2>
              <p className="text-gray-600">
                {selectedJourney === 'smart'
                  ? 'We found several great matches for your shipment'
                  : 'Your shipment is now live and carriers can start bidding'}
              </p>
            </div>

            {/* Results Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedJourney === 'smart' ? 'Quick Preview' : 'Bidding Status'}
              </h3>

              {selectedJourney === 'smart' ? (
                <div className="space-y-3">
                  {/* Mock match preview */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {95 - (i - 1) * 5}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Carrier #{i}</p>
                            <p className="text-xs text-gray-500">5.0 ★ • 250+ deliveries</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">${1200 + i * 50}</p>
                          <p className="text-xs text-gray-500">2-3 days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">24h</p>
                    <p className="text-xs text-gray-500">Time Remaining</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">127</p>
                    <p className="text-xs text-gray-500">Carriers Viewing</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <Gavel className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-xs text-gray-500">Bids Received</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleViewResults}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {selectedJourney === 'smart' ? 'View All Matches' : 'View All Bids'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleStayOnDashboard}
                className="flex-1 px-6 py-3 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-semibold"
              >
                Stay on Dashboard
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              You'll receive notifications as new {selectedJourney === 'smart' ? 'matches' : 'bids'} arrive
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default QuickActionFlow;

