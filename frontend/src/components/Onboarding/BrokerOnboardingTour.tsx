import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRight,  
  ArrowLeft,
  Check, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  Target,
  Shield,
  FileText,
  BarChart3,
  Zap
} from 'lucide-react';
import { useBrokerOnboardingStore } from '../../stores/brokerOnboardingStore';

const BrokerOnboardingTour: React.FC = () => {
  const { progress, completeStep, completeOnboarding, skipOnboarding, shouldShowOnboarding } = useBrokerOnboardingStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (shouldShowOnboarding()) {
      // Delay showing the tour by 1 second for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding]);

  const steps = [
    {
      title: "Welcome to Your Broker Dashboard! 🎉",
      description: "You're now part of a professional logistics facilitation platform. Let's take a quick tour to help you get started with your first deal!",
      icon: Sparkles,
      color: "from-violet-500 to-purple-600",
      tip: "This tour takes only 2 minutes and will save you hours later!"
    },
    {
      title: "Understand Your Role",
      description: "As a broker, you're the middleman connecting cargo owners with reliable transporters. You earn a commission (typically 10%) for every successful match you facilitate.",
      icon: Target,
      color: "from-orange-500 to-rose-600",
      tip: "Your success = More successful matches + Higher commissions"
    },
    {
      title: "Discover Available Cargo",
      description: "Start by browsing available loads from cargo owners. Use filters to find loads that match your preferred routes, cargo types, and transporters.",
      icon: Package,
      color: "from-emerald-500 to-teal-600",
      tip: "Hot routes pay 15-20% more in commission!"
    },
    {
      title: "Smart Matching AI",
      description: "Our AI analyzes thousands of factors to recommend the best transporters for each load. Get match scores, reliability ratings, and pricing insights instantly.",
      icon: Zap,
      color: "from-violet-500 to-purple-600",
      tip: "AI-powered matches have 85% success rate vs 60% manual matches"
    },
    {
      title: "Verify & Protect",
      description: "Always verify transporter insurance, compliance, and credit before creating a match. Our automated verification system checks everything in seconds.",
      icon: Shield,
      color: "from-blue-500 to-indigo-600",
      tip: "Verified transporters reduce risk by 90%"
    },
    {
      title: "Create Professional Contracts",
      description: "Generate contracts with one click, send for e-signatures, and set up escrow accounts to secure payments. All parties are protected.",
      icon: FileText,
      color: "from-amber-500 to-orange-600",
      tip: "Contracts close deals 2x faster than handshake agreements"
    },
    {
      title: "Track Commissions",
      description: "Your dashboard automatically tracks all commissions. See pending, approved, and paid amounts in real-time. Request payouts whenever you want.",
      icon: DollarSign,
      color: "from-emerald-500 to-green-600",
      tip: "Average brokers earn $5K-15K/month after 3 months"
    },
    {
      title: "Leverage Market Intelligence",
      description: "Access real-time market rates, demand forecasts, and route analytics. Make data-driven decisions to maximize your commissions.",
      icon: BarChart3,
      color: "from-rose-500 to-pink-600",
      tip: "Brokers using intelligence features earn 30% more per deal"
    },
    {
      title: "You're All Set! 🚀",
      description: "You now have everything you need to start facilitating successful logistics deals. Your first match is just a few clicks away!",
      icon: TrendingUp,
      color: "from-violet-500 to-purple-600",
      tip: "Start with the 'Cargo Discovery' button on your dashboard"
    }
  ];

  if (!isVisible || !shouldShowOnboarding()) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const tourProgress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
      setIsVisible(false);
    } else {
      completeStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    skipOnboarding();
    setIsVisible(false);
  };

  const StepIcon = currentStepData.icon;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" onClick={handleSkip} />

      {/* Tour Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
          {/* Progress Bar */}
          <div className="h-2 bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
              style={{ width: `${tourProgress}%` }}
            />
          </div>

          {/* Header with Icon */}
          <div className={`bg-gradient-to-r ${currentStepData.color} p-8 text-white relative overflow-hidden`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <StepIcon className="w-8 h-8" />
                </div>
                <button
                  onClick={handleSkip}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-3xl font-bold mb-2">{currentStepData.title}</h2>
              <p className="text-white/90 text-lg">{currentStepData.description}</p>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Quick Tip */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500 rounded-lg p-2 flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 mb-1">💡 Pro Tip</p>
                  <p className="text-sm text-amber-800">{currentStepData.tip}</p>
                </div>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`transition-all ${
                    index === currentStep
                      ? 'w-8 h-2 bg-violet-600'
                      : index < currentStep
                      ? 'w-2 h-2 bg-emerald-500 rounded-full'
                      : 'w-2 h-2 bg-gray-300 rounded-full'
                  } rounded-full`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Skip Tour
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {isLastStep ? (
                    <>
                      Get Started <Check className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Next <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Step Counter */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default BrokerOnboardingTour;

