import { useState } from 'react';
import { X, Zap, Gavel, CheckCircle2, Clock, DollarSign, TrendingUp, Info, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui';

interface JourneySelectionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectJourney: (journey: 'matching' | 'bidding') => void;
  cargoData?: {
    cargoType?: string;
    loadValue?: number;
    urgencyLevel?: string;
    isTimeCritical?: boolean;
  };
}

const JourneySelectionGuide: React.FC<JourneySelectionGuideProps> = ({
  isOpen,
  onClose,
  onSelectJourney,
  cargoData,
}) => {
  const [selectedJourney, setSelectedJourney] = useState<'matching' | 'bidding' | null>(null);

  // Determine recommended journey based on cargo characteristics
  const getRecommendation = () => {
    if (!cargoData) return null;

    const { cargoType, loadValue, urgencyLevel, isTimeCritical } = cargoData;
    
    // High value or time-critical cargo → Bidding (more control)
    if (isTimeCritical || urgencyLevel === 'CRITICAL' || (loadValue && loadValue > 10000)) {
      return 'bidding';
    }
    
    // Standard cargo → Smart Matching (faster)
    return 'matching';
  };

  const recommendation = getRecommendation();

  const journeys = [
    {
      id: 'matching' as const,
      name: 'Smart Matching',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      description: 'AI-powered automatic matching with transporters',
      pros: [
        'Fast matching (usually within hours)',
        'Best price optimization',
        'AI selects optimal transporters',
        'Less manual work required',
        'Ideal for standard shipments',
      ],
      cons: [
        'Less control over selection',
        'May take longer for specialized cargo',
      ],
      bestFor: [
        'Standard cargo types',
        'Non-urgent shipments',
        'Cost optimization priority',
        'Regular shipping routes',
      ],
      estimatedTime: '2-6 hours',
      successRate: '92%',
    },
    {
      id: 'bidding' as const,
      name: 'Auction/Bidding',
      icon: Gavel,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      description: 'Publish cargo and receive competitive bids from transporters',
      pros: [
        'Full control over selection',
        'Competitive pricing through bidding',
        'Review transporter profiles',
        'Negotiate terms directly',
        'Ideal for specialized cargo',
      ],
      cons: [
        'Takes longer (1-3 days)',
        'Requires manual review',
        'More time investment',
      ],
      bestFor: [
        'High-value cargo',
        'Time-critical shipments',
        'Specialized requirements',
        'Custom routes',
      ],
      estimatedTime: '1-3 days',
      successRate: '88%',
    },
  ];

  const handleSelect = (journey: 'matching' | 'bidding') => {
    setSelectedJourney(journey);
  };

  const handleConfirm = () => {
    if (selectedJourney) {
      onSelectJourney(selectedJourney);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            Choose Your Journey Path
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Recommendation Banner */}
          {recommendation && (
            <div className={`${journeys.find(j => j.id === recommendation)?.bgColor} border-2 ${journeys.find(j => j.id === recommendation)?.borderColor} rounded-xl p-4 flex items-start gap-3`}>
              <CheckCircle2 className={`w-6 h-6 ${journeys.find(j => j.id === recommendation)?.textColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Recommended for You: {journeys.find(j => j.id === recommendation)?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Based on your cargo characteristics, we recommend this journey for the best results.
                </p>
              </div>
            </div>
          )}

          {/* Journey Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {journeys.map((journey) => {
              const Icon = journey.icon;
              const isSelected = selectedJourney === journey.id;
              const isRecommended = recommendation === journey.id;

              return (
                <div
                  key={journey.id}
                  onClick={() => handleSelect(journey.id)}
                  className={`relative border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all ${
                    isSelected
                      ? `${journey.borderColor} ${journey.bgColor} shadow-lg scale-[1.02]`
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${journey.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{journey.name}</h3>
                    <p className="text-sm text-gray-600">{journey.description}</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-lg p-2 border border-gray-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs text-gray-500">Time</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{journey.estimatedTime}</span>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs text-gray-500">Success Rate</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{journey.successRate}</span>
                    </div>
                  </div>

                  {/* Pros */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Advantages:</h4>
                    <ul className="space-y-1.5">
                      {journey.pros.map((pro, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Best For:</h4>
                    <div className="flex flex-wrap gap-2">
                      {journey.bestFor.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedJourney}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
            >
              Continue with {selectedJourney ? journeys.find(j => j.id === selectedJourney)?.name : 'Selection'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JourneySelectionGuide;

