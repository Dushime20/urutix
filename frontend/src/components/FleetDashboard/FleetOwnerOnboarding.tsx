import React, { useState } from 'react';
import { 
  Truck, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Lightbulb, 
  HelpCircle 
} from 'lucide-react';

interface FleetOwnerOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
}

const FleetOwnerOnboarding: React.FC<FleetOwnerOnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to Your Fleet Dashboard! 🚛',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-400 font-medium">
            This is your command center for managing your entire fleet. Let's take a quick tour to get you started.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <Lightbulb className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <p className="font-black text-blue-900 dark:text-blue-100 mb-1 uppercase text-[10px] tracking-widest">Quick Tip</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  You can always access help by clicking the <HelpCircle className="inline mx-1" /> icon or pressing <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-blue-300 dark:border-blue-700 text-xs text-blue-600 dark:text-blue-400">?</kbd> key.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: Truck,
      color: 'blue'
    },
    {
      title: 'Manage Your Trucks',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
            The <strong>Truck Management</strong> section is where you'll add, view, and manage all your vehicles.
          </p>
          <ul className="space-y-3 text-gray-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Add Trucks:</strong> Click "Add Truck" to register new vehicles</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">View Details:</strong> Click any truck to see full records, documents, and history</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Track Status:</strong> Monitor availability, maintenance, and compliance</span>
            </li>
          </ul>
        </div>
      ),
      icon: Truck,
      color: 'blue'
    },
    {
      title: 'Manage Your Drivers',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
            Keep track of your drivers and assign them to trucks for trips.
          </p>
          <ul className="space-y-3 text-gray-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Add Drivers:</strong> Register drivers with their licenses and qualifications</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Assign to Trucks:</strong> Link drivers to specific vehicles</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Track Performance:</strong> Monitor driver ratings and history</span>
            </li>
          </ul>
        </div>
      ),
      icon: Users,
      color: 'green'
    },
    {
      title: 'Monitor Analytics & Reports',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
            Get insights into your fleet's performance and generate reports.
          </p>
          <ul className="space-y-3 text-gray-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">View Analytics:</strong> See utilization rates, revenue, and trends</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Generate Reports:</strong> Export PDF reports for your records</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-emerald-500 mt-1 flex-shrink-0" />
              <span className="text-sm"><strong className="text-gray-900 dark:text-white">Track Alerts:</strong> Get notified about maintenance, inspections, and insurance</span>
            </li>
          </ul>
        </div>
      ),
      icon: BarChart3,
      color: 'purple'
    },
    {
      title: 'You\'re All Set! 🎉',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-slate-400 font-medium leading-relaxed">
            You're ready to start managing your fleet! Here are some quick actions to get started:
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-6">
            <p className="font-black text-gray-900 dark:text-white mb-4 uppercase text-[10px] tracking-widest">Recommended Protocol:</p>
            <ol className="space-y-3 text-gray-700 dark:text-slate-300 list-decimal list-inside text-sm">
              <li>Add your first truck using the "Add Truck" button</li>
              <li>Upload truck documents (registration, insurance, etc.)</li>
              <li>Add your drivers and assign them to trucks</li>
              <li>Explore the Analytics section to see your dashboard</li>
            </ol>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-6">
            <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
              <strong className="text-amber-900 dark:text-amber-300">💡 Tip:</strong> Need help? Click the <HelpCircle className="inline mx-1" /> icon anytime or visit Help & Support in the orientation menu.
            </p>
          </div>
        </div>
      ),
      icon: CheckCircle2,
      color: 'green'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const IconComponent = steps[currentStep].icon;
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-900/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl shadow-sm ${colorClasses[steps[currentStep].color as keyof typeof colorClasses]}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">{steps[currentStep].title}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 mt-2">
                Phase {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="h-10 w-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white dark:hover:text-white transition-all"
            title="Skip Tour"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 dark:bg-slate-800 shrink-0">
          <div
            className="h-full bg-primary-600 dark:bg-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 shrink-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
              currentStep === 0
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 shadow-sm'
            }`}
          >
            <ArrowLeft className="w-3 h-3" />
            Previous Session
          </button>

          <div className="hidden sm:flex items-center gap-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-500 ${
                  index === currentStep ? 'bg-primary-600 dark:bg-blue-500 w-8' : 'bg-gray-200 dark:bg-slate-800 w-2'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="px-8 py-3 bg-primary-600 dark:bg-blue-600 text-white rounded-xl hover:bg-primary-700 dark:hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200 dark:shadow-none"
          >
            {currentStep === steps.length - 1 ? 'Start Mission' : 'Next Phase'}
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetOwnerOnboarding;

