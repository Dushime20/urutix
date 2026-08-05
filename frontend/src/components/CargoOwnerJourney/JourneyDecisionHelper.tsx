import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  HelpCircle,
  Clock,
  DollarSign,
  Target,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Zap,
  BarChart3
} from 'lucide-react';

interface DecisionFactors {
  urgency: 'immediate' | 'urgent' | 'flexible' | 'scheduled';
  budget: 'lowest' | 'competitive' | 'quality' | 'premium';
  priority: 'speed' | 'cost' | 'quality' | 'reliability';
  flexibility: 'fixed' | 'somewhat' | 'flexible' | 'very-flexible';
  experience: 'first-time' | 'occasional' | 'regular' | 'expert';
}

interface Recommendation {
  journey: 'smart-matching' | 'publish-bid';
  confidence: number;
  reasoning: string[];
  estimatedTime: string;
  estimatedCost: string;
  successRate: number;
}

interface JourneyDecisionHelperProps {
  cargoData: any;
  onRecommendation: (recommendation: Recommendation) => void;
  onClose: () => void;
}

export const JourneyDecisionHelper: React.FC<JourneyDecisionHelperProps> = ({
  cargoData,
  onRecommendation,
  onClose
}) => {
  const [step, setStep] = useState(1);
  const [factors, setFactors] = useState<Partial<DecisionFactors>>({});

  const questions = [
    {
      id: 'urgency',
      title: 'How urgent is your shipment?',
      icon: Clock,
      options: [
        { value: 'immediate', label: 'Immediate', description: 'Need pickup within 24 hours', icon: '🚨' },
        { value: 'urgent', label: 'Urgent', description: 'Need pickup within 2-3 days', icon: '⚡' },
        { value: 'flexible', label: 'Flexible', description: 'Within a week is fine', icon: '📅' },
        { value: 'scheduled', label: 'Scheduled', description: 'Planned for future date', icon: '🗓️' }
      ]
    },
    {
      id: 'budget',
      title: 'What is your budget priority?',
      icon: DollarSign,
      options: [
        { value: 'lowest', label: 'Lowest Cost', description: 'Get the best possible price', icon: '💰' },
        { value: 'competitive', label: 'Competitive', description: 'Balance cost and service', icon: '⚖️' },
        { value: 'quality', label: 'Quality First', description: 'Willing to pay for better service', icon: '⭐' },
        { value: 'premium', label: 'Premium', description: 'Best service regardless of cost', icon: '💎' }
      ]
    },
    {
      id: 'priority',
      title: 'What matters most to you?',
      icon: Target,
      options: [
        { value: 'speed', label: 'Speed', description: 'Fastest possible delivery', icon: '🚀' },
        { value: 'cost', label: 'Cost', description: 'Lowest transportation cost', icon: '💵' },
        { value: 'quality', label: 'Quality', description: 'Best handling and care', icon: '✨' },
        { value: 'reliability', label: 'Reliability', description: 'Most dependable carrier', icon: '🛡️' }
      ]
    },
    {
      id: 'flexibility',
      title: 'How flexible are you with timing?',
      icon: BarChart3,
      options: [
        { value: 'fixed', label: 'Fixed', description: 'Must stick to exact schedule', icon: '⏰' },
        { value: 'somewhat', label: 'Somewhat', description: '1-2 day window acceptable', icon: '⏱️' },
        { value: 'flexible', label: 'Flexible', description: 'Several days variance OK', icon: '🕐' },
        { value: 'very-flexible', label: 'Very Flexible', description: 'Anytime works', icon: '🔄' }
      ]
    },
    {
      id: 'experience',
      title: 'How experienced are you with shipping?',
      icon: Users,
      options: [
        { value: 'first-time', label: 'First Time', description: 'This is my first shipment', icon: '🌱' },
        { value: 'occasional', label: 'Occasional', description: 'Ship a few times per year', icon: '🌿' },
        { value: 'regular', label: 'Regular', description: 'Ship monthly or weekly', icon: '🌳' },
        { value: 'expert', label: 'Expert', description: 'Ship daily, know the process', icon: '🏆' }
      ]
    }
  ];

  const calculateRecommendation = (): Recommendation => {
    let smartMatchScore = 0;
    let bidScore = 0;
    const reasoning: string[] = [];

    // Urgency scoring
    if (factors.urgency === 'immediate' || factors.urgency === 'urgent') {
      smartMatchScore += 30;
      reasoning.push('⚡ Your urgent timeline favors Smart Matching for immediate results');
    } else {
      bidScore += 20;
      reasoning.push('📅 Your flexible timeline allows time for competitive bidding');
    }

    // Budget scoring
    if (factors.budget === 'lowest') {
      bidScore += 25;
      reasoning.push('💰 Bidding helps you find the lowest possible price');
    } else if (factors.budget === 'competitive') {
      smartMatchScore += 15;
      bidScore += 15;
    } else {
      smartMatchScore += 20;
      reasoning.push('⭐ Smart Matching provides curated quality options');
    }

    // Priority scoring
    if (factors.priority === 'speed') {
      smartMatchScore += 25;
      reasoning.push('🚀 Speed priority makes Smart Matching the best choice');
    } else if (factors.priority === 'cost') {
      bidScore += 25;
      reasoning.push('💵 Cost optimization works best with competitive bidding');
    } else {
      smartMatchScore += 15;
      reasoning.push('🛡️ Quality carriers are pre-vetted in Smart Matching');
    }

    // Flexibility scoring
    if (factors.flexibility === 'fixed' || factors.flexibility === 'somewhat') {
      smartMatchScore += 20;
      reasoning.push('⏰ Fixed schedules work better with guaranteed Smart Matching');
    } else {
      bidScore += 15;
      reasoning.push('🔄 Flexibility allows you to evaluate multiple bids');
    }

    // Experience scoring
    if (factors.experience === 'first-time' || factors.experience === 'occasional') {
      smartMatchScore += 20;
      reasoning.push('🌱 Smart Matching simplifies the process for newer users');
    } else {
      bidScore += 10;
      reasoning.push('🏆 Your experience allows you to evaluate bids effectively');
    }

    // Cargo data factors
    if (cargoData?.urgencyLevel === 'CRITICAL' || cargoData?.urgencyLevel === 'HIGH') {
      smartMatchScore += 15;
      reasoning.push('🚨 Cargo urgency level supports immediate matching');
    }

    if (cargoData?.loadValue > 50000) {
      bidScore += 10;
      reasoning.push('💎 High-value cargo benefits from competitive pricing');
    }

    const totalScore = smartMatchScore + bidScore;
    const journey: 'smart-matching' | 'publish-bid' = smartMatchScore > bidScore ? 'smart-matching' : 'publish-bid';
    const confidence = Math.round((Math.max(smartMatchScore, bidScore) / totalScore) * 100);

    return {
      journey,
      confidence,
      reasoning: reasoning.slice(0, 5),
      estimatedTime: journey === 'smart-matching' ? '2-5 minutes' : '2-24 hours',
      estimatedCost: journey === 'smart-matching' ? 'Market rate' : '5-15% below market',
      successRate: journey === 'smart-matching' ? 95 : 85
    };
  };

  const handleOptionSelect = (questionId: string, value: string) => {
    setFactors({ ...factors, [questionId]: value });
    if (step < questions.length) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleComplete = () => {
    const recommendation = calculateRecommendation();
    onRecommendation(recommendation);
  };

  const currentQuestion = questions[step - 1];
  const progress = (step / questions.length) * 100;
  const isComplete = step > questions.length;

  if (isComplete) {
    const recommendation = calculateRecommendation();
    const JourneyIcon = recommendation.journey === 'smart-matching' ? Zap : Users;

    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Your Personalized Recommendation</h2>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                <span className="text-sm font-medium">{recommendation.confidence}% Match</span>
              </div>
            </div>
            <p className="text-violet-100">Based on your answers, here's what we recommend</p>
          </div>

          <div className="p-8">
            {/* Recommendation Card */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-violet-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-violet-600 rounded-xl p-4">
                  <JourneyIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recommendation.journey === 'smart-matching' ? 'Smart Matching' : 'Publish for Bid'}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-300">
                    {recommendation.journey === 'smart-matching' 
                      ? 'AI-powered instant matching' 
                      : 'Competitive bidding from multiple carriers'}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 text-violet-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-slate-300">Time</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{recommendation.estimatedTime}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-slate-300">Cost</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{recommendation.estimatedCost}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center">
                  <Target className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-600 dark:text-slate-300">Success Rate</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{recommendation.successRate}%</p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Confidence Level</span>
                  <span className="text-sm font-bold text-violet-600">{recommendation.confidence}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${recommendation.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Reasoning */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                Why this recommendation?
              </h4>
              <div className="space-y-2">
                {recommendation.reasoning.map((reason, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
                    <span className="text-xl">{reason.split(' ')[0]}</span>
                    <p className="text-sm text-gray-700 dark:text-slate-300 flex-1">{reason.split(' ').slice(1).join(' ')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Retake Quiz
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Continue with {recommendation.journey === 'smart-matching' ? 'Smart Matching' : 'Bidding'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-3 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 font-medium transition-colors"
            >
              Choose manually instead
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  const Icon = currentQuestion.icon;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 rounded-xl p-2">
                <HelpCircle className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Journey Decision Helper</h2>
                <p className="text-sm text-gray-600 dark:text-slate-300">Answer a few questions to get personalized guidance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-slate-300">Question {step} of {questions.length}</span>
              <span className="text-violet-600 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl p-3">
                <Icon className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentQuestion.title}</h3>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
                className={`p-6 rounded-xl border-2 transition-all text-left hover:border-violet-400 hover:bg-violet-50 ${
                  factors[currentQuestion.id as keyof DecisionFactors] === option.value
                    ? 'border-violet-600 bg-violet-50'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{option.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{option.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-slate-300">{option.description}</p>
                  </div>
                  {factors[currentQuestion.id as keyof DecisionFactors] === option.value && (
                    <CheckCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 font-semibold transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
            )}
            {factors[currentQuestion.id as keyof DecisionFactors] && step === questions.length && (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                See My Recommendation
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default JourneyDecisionHelper;

