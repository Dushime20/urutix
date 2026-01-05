import React, { useState } from 'react';
import {
  Zap,
  Users,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Shield,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Award,
  Sparkles,
  X
} from 'lucide-react';

interface JourneyOption {
  id: 'smart-matching' | 'publish-bid';
  name: string;
  tagline: string;
  icon: typeof Zap;
  color: string;
  gradient: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  metrics: {
    avgTime: string;
    costSavings: string;
    successRate: string;
    effort: string;
  };
  process: string[];
}

interface JourneyComparisonProps {
  cargoData: any;
  onSelect: (journey: 'smart-matching' | 'publish-bid') => void;
  onClose: () => void;
}

export const JourneyComparison: React.FC<JourneyComparisonProps> = ({
  cargoData,
  onSelect,
  onClose
}) => {
  const [selectedJourney, setSelectedJourney] = useState<'smart-matching' | 'publish-bid' | null>(null);
  const [compareMode, setCompareMode] = useState<'side-by-side' | 'detailed'>('side-by-side');

  const journeys: JourneyOption[] = [
    {
      id: 'smart-matching',
      name: 'Smart Matching',
      tagline: 'AI-Powered, Instant Results',
      icon: Zap,
      color: 'violet',
      gradient: 'from-violet-600 to-purple-600',
      pros: [
        'Instant matching with pre-vetted carriers',
        'AI-optimized pricing and routes',
        'Minimal effort required',
        'Guaranteed availability',
        'Fast booking process (2-5 minutes)',
        'Curated quality carriers only'
      ],
      cons: [
        'Less price flexibility',
        'Single recommended option',
        'Market rate pricing',
        'No direct negotiation'
      ],
      bestFor: [
        'Urgent shipments needing immediate action',
        'First-time users wanting simplicity',
        'High-value cargo requiring reliability',
        'Fixed schedules with no time for bidding',
        'Users who value convenience over cost'
      ],
      metrics: {
        avgTime: '2-5 minutes',
        costSavings: '0-5%',
        successRate: '95%',
        effort: 'Very Low'
      },
      process: [
        'AI analyzes your cargo requirements',
        'Matches with best available carriers',
        'View recommended option with pricing',
        'Accept and book instantly',
        'Carrier confirmed immediately'
      ]
    },
    {
      id: 'publish-bid',
      name: 'Publish for Bid',
      tagline: 'Competitive Pricing, More Control',
      icon: Users,
      color: 'emerald',
      gradient: 'from-emerald-600 to-teal-600',
      pros: [
        'Competitive pricing from multiple carriers',
        'Direct negotiation opportunity',
        'More carrier options to choose from',
        'Potential for significant savings (5-15%)',
        'Full control over selection',
        'Market insights from bids'
      ],
      cons: [
        'Takes longer (2-24 hours)',
        'Requires active management',
        'Not guaranteed to receive bids',
        'More effort to evaluate options',
        'May need to negotiate'
      ],
      bestFor: [
        'Flexible timelines allowing bid period',
        'Budget-conscious shipments',
        'Lower urgency loads',
        'Experienced shippers comfortable evaluating',
        'Users wanting maximum cost savings'
      ],
      metrics: {
        avgTime: '2-24 hours',
        costSavings: '5-15%',
        successRate: '85%',
        effort: 'Moderate'
      },
      process: [
        'Create and publish your load',
        'Carriers submit competitive bids',
        'Review and compare all offers',
        'Negotiate if desired',
        'Select best bid and confirm',
        'Booking confirmed after acceptance'
      ]
    }
  ];

  const getRecommendation = (): 'smart-matching' | 'publish-bid' => {
    if (cargoData?.urgencyLevel === 'CRITICAL' || cargoData?.urgencyLevel === 'HIGH') {
      return 'smart-matching';
    }
    if (cargoData?.loadValue > 50000) {
      return 'publish-bid';
    }
    return 'smart-matching';
  };

  const recommended = getRecommendation();

  const renderSideBySide = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {journeys.map((journey) => {
        const Icon = journey.icon;
        const isRecommended = journey.id === recommended;
        const isSelected = journey.id === selectedJourney;

        return (
          <div
            key={journey.id}
            className={`relative rounded-2xl border-2 transition-all ${
              isSelected
                ? 'border-' + journey.color + '-600 shadow-xl scale-105'
                : isRecommended
                ? 'border-' + journey.color + '-400 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            {isRecommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className={`bg-gradient-to-r ${journey.gradient} text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-lg`}>
                  <Sparkles className="w-3 h-3" />
                  RECOMMENDED FOR YOU
                </div>
              </div>
            )}

            {/* Header */}
            <div className={`bg-gradient-to-r ${journey.gradient} p-6 rounded-t-2xl text-white`}>
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{journey.name}</h3>
                  <p className="text-sm opacity-90">{journey.tagline}</p>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50">
              <div className="text-center">
                <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Avg Time</p>
                <p className="text-sm font-bold text-gray-900">{journey.metrics.avgTime}</p>
              </div>
              <div className="text-center">
                <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Savings</p>
                <p className="text-sm font-bold text-gray-900">{journey.metrics.costSavings}</p>
              </div>
              <div className="text-center">
                <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Success</p>
                <p className="text-sm font-bold text-gray-900">{journey.metrics.successRate}</p>
              </div>
              <div className="text-center">
                <BarChart3 className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Effort</p>
                <p className="text-sm font-bold text-gray-900">{journey.metrics.effort}</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Pros */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Advantages
                </h4>
                <ul className="space-y-1.5">
                  {journey.pros.slice(0, 4).map((pro, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Considerations
                </h4>
                <ul className="space-y-1.5">
                  {journey.cons.slice(0, 3).map((con, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">!</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Best For */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  Best For
                </h4>
                <ul className="space-y-1.5">
                  {journey.bestFor.slice(0, 3).map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">★</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action */}
            <div className="p-6 pt-0">
              <button
                onClick={() => {
                  setSelectedJourney(journey.id);
                  setTimeout(() => onSelect(journey.id), 300);
                }}
                className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                  isSelected
                    ? `bg-gradient-to-r ${journey.gradient} text-white`
                    : `border-2 border-${journey.color}-600 text-${journey.color}-600 hover:bg-${journey.color}-50`
                }`}
              >
                {isSelected ? 'Selected' : 'Choose ' + journey.name}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Feature Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-semibold text-gray-700">Feature</th>
                <th className="text-center p-3 font-semibold text-violet-600">Smart Matching</th>
                <th className="text-center p-3 font-semibold text-emerald-600">Publish for Bid</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Average Time to Book', smart: '2-5 minutes', bid: '2-24 hours' },
                { feature: 'Number of Options', smart: '1 curated', bid: 'Multiple bids' },
                { feature: 'Cost Savings Potential', smart: '0-5%', bid: '5-15%' },
                { feature: 'Effort Required', smart: 'Very Low', bid: 'Moderate' },
                { feature: 'Success Rate', smart: '95%', bid: '85%' },
                { feature: 'Price Negotiation', smart: 'No', bid: 'Yes' },
                { feature: 'Carrier Vetting', smart: 'Pre-vetted', bid: 'You evaluate' },
                { feature: 'Best for Urgent Loads', smart: 'Yes', bid: 'No' }
              ].map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{row.feature}</td>
                  <td className="p-3 text-center text-gray-700">{row.smart}</td>
                  <td className="p-3 text-center text-gray-700">{row.bid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {journeys.map((journey) => {
          const Icon = journey.icon;
          return (
            <div key={journey.id} className="bg-white rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className={`bg-gradient-to-r ${journey.gradient} rounded-xl p-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-gray-900">{journey.name} Process</h4>
              </div>
              <ol className="space-y-3">
                {journey.process.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${journey.gradient} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Compare Your Options</h2>
              <p className="text-gray-600 mt-1">Choose the journey that best fits your needs</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setCompareMode('side-by-side')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                compareMode === 'side-by-side'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setCompareMode('detailed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                compareMode === 'detailed'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Detailed Comparison
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {compareMode === 'side-by-side' ? renderSideBySide() : renderDetailed()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-xl p-3">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Not sure which to choose?</p>
              <p className="text-sm text-gray-600">Try our Decision Helper for a personalized recommendation</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg">
              Get Recommendation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneyComparison;

