import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Lightbulb, Zap, Target } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector or element ID
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: string; // Button text for action
  onAction?: () => void;
  image?: string;
  tips?: string[];
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userRole: 'CARGO_OWNER' | 'CARRIER' | 'ADMIN';
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose, onComplete, userRole }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  const cargoOwnerSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: '👋 Welcome to UrutiX!',
      description: 'Your all-in-one logistics platform. Let\'s take a quick tour to help you get started.',
      position: 'center',
      tips: [
        'This tour takes about 2 minutes',
        'You can skip or restart anytime from Help menu',
        'All features have built-in tooltips'
      ]
    },
    {
      id: 'dashboard',
      title: '📊 Your Dashboard',
      description: 'This is your command center. See all your shipments, pending actions, and real-time insights at a glance.',
      target: '#dashboard-overview',
      position: 'center',
      tips: [
        'Action Required cards show what needs attention',
        'KPIs update in real-time',
        'Click any section to dive deeper'
      ]
    },
    {
      id: 'quick-action',
      title: '⚡ Quick Action Flow',
      description: 'Create a shipment and choose your shipping method in seconds. No navigation needed!',
      position: 'center',
      action: 'Try Quick Action',
      tips: [
        'Click the blue Quick Action card or FAB button',
        'Create cargo with minimal fields',
        'Choose Smart Matching for speed or Bidding for savings',
        'Get instant results without leaving dashboard'
      ]
    },
    {
      id: 'smart-matching',
      title: '🎯 Smart Matching',
      description: 'Our AI finds the best trucks for your cargo instantly. See match scores, prices, and book with one click.',
      position: 'center',
      tips: [
        'Match score shows compatibility (0-100)',
        'Higher scores = better fit',
        'Filter by price, rating, or features',
        'Compare up to 3 carriers side-by-side'
      ]
    },
    {
      id: 'bidding',
      title: '🔨 Bidding System',
      description: 'Publish your shipment and let carriers compete. Review bids, negotiate, and choose the best deal.',
      position: 'center',
      tips: [
        'Set your budget and timeline',
        'Carriers bid competitively',
        'Counter-offer or accept directly',
        'Save 10-30% on average'
      ]
    },
    {
      id: 'tracking',
      title: '📍 Live Tracking',
      description: 'Track all your shipments in real-time. See ETA, milestones, and communicate with drivers.',
      position: 'center',
      tips: [
        'Real-time GPS tracking',
        'Milestone notifications',
        'In-app driver messaging',
        'Delay alerts and route updates'
      ]
    },
    {
      id: 'help',
      title: '💡 Always Here to Help',
      description: 'Click the help icon anytime for contextual assistance. Hover over any feature for quick tooltips.',
      position: 'center',
      tips: [
        'Help button in top-right corner',
        'Hover tooltips on all features',
        'Search help center for guides',
        '24/7 chat support available'
      ]
    },
    {
      id: 'complete',
      title: '🎉 You\'re All Set!',
      description: 'Ready to start shipping? Create your first cargo or explore the dashboard.',
      position: 'center',
      action: 'Create First Cargo',
      tips: [
        'Pro tip: Use Quick Action for fastest workflow',
        'Enable notifications to stay updated',
        'Check Smart Insights for personalized recommendations'
      ]
    }
  ];

  const steps = userRole === 'CARGO_OWNER' ? cargoOwnerSteps : cargoOwnerSteps;

  useEffect(() => {
    if (!isOpen) return;

    const step = steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, isOpen, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay with spotlight effect */}
      {highlightedElement && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Tour Modal */}
      <Dialog open={isOpen} onOpenChange={handleSkip}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8 z-[101]">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-0 right-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              {/* Icon based on step */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {step.id === 'welcome' && <Lightbulb className="w-8 h-8 text-blue-600" />}
                {step.id === 'quick-action' && <Zap className="w-8 h-8 text-blue-600" />}
                {step.id === 'smart-matching' && <Target className="w-8 h-8 text-blue-600" />}
                {step.id === 'complete' && <CheckCircle className="w-8 h-8 text-green-600" />}
                {!['welcome', 'quick-action', 'smart-matching', 'complete'].includes(step.id) && (
                  <Lightbulb className="w-8 h-8 text-blue-600" />
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>
              <p className="text-gray-600 text-lg mb-6">{step.description}</p>

              {/* Tips section */}
              {step.tips && step.tips.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Quick Tips</span>
                  </div>
                  <ul className="space-y-2">
                    {step.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4">
              {/* Back button */}
              <button
                onClick={handleBack}
                disabled={isFirstStep}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {/* Skip button */}
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 underline text-sm"
                >
                  Skip Tour
                </button>
              )}

              {/* Next/Complete button */}
              <button
                onClick={step.onAction || handleNext}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                {isLastStep ? (
                  step.action || 'Complete Tour'
                ) : (
                  <>
                    {step.action || 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OnboardingTour;

