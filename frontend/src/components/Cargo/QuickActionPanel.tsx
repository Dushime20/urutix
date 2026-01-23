import { useState } from 'react';
import { X, Package, Zap, Target, Gavel, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Plus } from 'lucide-react';
import QuickCreateModal from './QuickCreateModal';
import toast from 'react-hot-toast';

interface QuickActionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 'create' | 'journey' | 'processing' | 'complete';
type JourneyType = 'smart-matching' | 'bidding' | null;

const QuickActionPanel: React.FC<QuickActionPanelProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState<Step>('create');
  const [selectedJourney, setSelectedJourney] = useState<JourneyType>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [createdCargoId, setCreatedCargoId] = useState<string | null>(null);

  const handleCargoCreated = (cargoId?: string) => {
    setCreatedCargoId(cargoId || 'temp-id');
    setShowQuickCreate(false);
    setCurrentStep('journey');
  };

  const handleJourneySelect = (type: JourneyType) => {
    setSelectedJourney(type);
  };

  const handleProceed = () => {
    if (!selectedJourney) {
      toast.error('Please select a journey type');
      return;
    }

    setCurrentStep('processing');

    // Simulate processing
    setTimeout(() => {
      setCurrentStep('complete');
      toast.success(selectedJourney === 'smart-matching' ? 'Finding smart matches...' : 'Publishing for bidding...');
    }, 1500);
  };

  const handleViewResults = () => {
    if (onComplete) onComplete();
    onClose();
    // Reset state
    setTimeout(() => {
      setCurrentStep('create');
      setSelectedJourney(null);
      setCreatedCargoId(null);
    }, 300);
  };

  const handleReset = () => {
    setCurrentStep('create');
    setSelectedJourney(null);
    setCreatedCargoId(null);
    setShowQuickCreate(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[600px] bg-white shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Quick Post Cargo</h2>
              <p className="text-sm text-indigo-100">Fast track your shipment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {[
              { id: 'create', label: 'Create Cargo', icon: Package },
              { id: 'journey', label: 'Select Journey', icon: Target },
              { id: 'complete', label: 'Complete', icon: CheckCircle2 },
            ].map((step, index) => {
              const Icon = step.icon;
              const isCurrent = currentStep === step.id;
              const isPast = ['create', 'journey', 'processing', 'complete'].indexOf(currentStep) > 
                           ['create', 'journey', 'processing', 'complete'].indexOf(step.id);
              const isActive = isCurrent || isPast;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isPast ? 'bg-green-500' : isActive ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}>
                      {isPast ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className={`text-xs mt-1.5 font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`h-1 flex-1 mx-2 mb-6 rounded transition-all ${
                      isPast || (currentStep === 'complete' && index === 1) ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Step 1: Create Cargo */}
          {currentStep === 'create' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-10 h-10 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create Your Cargo</h3>
                <p className="text-gray-600 mb-6">
                  Let's start by adding your cargo details. It only takes a minute!
                </p>
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Create Cargo
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Quick & Easy</h4>
                    <p className="text-sm text-blue-700">
                      Fill in the essential details and we'll help you find the best shipping solution.
                      You can always add more information later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Journey */}
          {currentStep === 'journey' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Your Journey</h3>
                <p className="text-gray-600">
                  How would you like to proceed with this shipment?
                </p>
              </div>

              <div className="space-y-3">
                {/* Smart Matching Option */}
                <button
                  onClick={() => handleJourneySelect('smart-matching')}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    selectedJourney === 'smart-matching'
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedJourney === 'smart-matching' ? 'bg-indigo-600' : 'bg-indigo-100'
                    }`}>
                      <Target className={`w-6 h-6 ${
                        selectedJourney === 'smart-matching' ? 'text-white' : 'text-indigo-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">Smart Matching</h4>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Recommended
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Let our AI find the best carriers for you instantly
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                          ⚡ Instant matches
                        </span>
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                          🎯 Best price guarantee
                        </span>
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                          ✓ Verified carriers
                        </span>
                      </div>
                    </div>
                    {selectedJourney === 'smart-matching' && (
                      <CheckCircle2 className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Bidding Option */}
                <button
                  onClick={() => handleJourneySelect('bidding')}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    selectedJourney === 'bidding'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedJourney === 'bidding' ? 'bg-purple-600' : 'bg-purple-100'
                    }`}>
                      <Gavel className={`w-6 h-6 ${
                        selectedJourney === 'bidding' ? 'text-white' : 'text-purple-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">Open for Bidding</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Receive competitive bids from multiple carriers
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                          💰 Best offers
                        </span>
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                          🔍 Compare options
                        </span>
                        <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                          ⏱️ You control timing
                        </span>
                      </div>
                    </div>
                    {selectedJourney === 'bidding' && (
                      <CheckCircle2 className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              </div>

              {selectedJourney && (
                <div className={`p-4 rounded-lg border ${
                  selectedJourney === 'smart-matching' 
                    ? 'bg-indigo-50 border-indigo-200' 
                    : 'bg-purple-50 border-purple-200'
                }`}>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {selectedJourney === 'smart-matching' ? 'What happens next?' : 'What happens next?'}
                  </p>
                  <p className="text-sm text-gray-700">
                    {selectedJourney === 'smart-matching' 
                      ? 'We\'ll analyze your cargo and instantly show you the best carrier matches with pricing and ratings.'
                      : 'Your cargo will be published to our network of carriers who can submit competitive bids for your review.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing...</h3>
              <p className="text-gray-600">
                {selectedJourney === 'smart-matching' 
                  ? 'Finding the best matches for your cargo...'
                  : 'Publishing your cargo to carriers...'
                }
              </p>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Set! 🎉</h3>
              <p className="text-gray-600 mb-6">
                {selectedJourney === 'smart-matching' 
                  ? 'We found great matches for your cargo. Review them now!'
                  : 'Your cargo is live! Carriers can now submit their bids.'
                }
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cargo ID:</span>
                    <p className="font-medium text-gray-900">{createdCargoId}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium text-green-600">Active</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleViewResults}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  {selectedJourney === 'smart-matching' ? 'View Matches' : 'View Bids'}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Post Another Cargo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {currentStep === 'journey' && (
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('create')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleProceed}
                disabled={!selectedJourney}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Proceed
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Create Modal */}
      <QuickCreateModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onSuccess={handleCargoCreated}
      />
    </>
  );
};

export default QuickActionPanel;

