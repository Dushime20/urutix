import React, { useState, useEffect } from 'react';
import { FaTruck, FaUsers, FaChartBar, FaCheckCircle, FaTimes, FaArrowRight, FaArrowLeft, FaLightbulb, FaQuestionCircle } from 'react-icons/fa';

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
          <p className="text-gray-600">
            This is your command center for managing your entire fleet. Let's take a quick tour to get you started.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FaLightbulb className="text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 mb-1">Quick Tip</p>
                <p className="text-sm text-blue-800">
                  You can always access help by clicking the <FaQuestionCircle className="inline mx-1" /> icon or pressing <kbd className="px-2 py-1 bg-white rounded border border-blue-300 text-xs">?</kbd> key.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      icon: FaTruck,
      color: 'blue'
    },
    {
      title: 'Manage Your Trucks',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            The <strong>Truck Management</strong> section is where you'll add, view, and manage all your vehicles.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Add Trucks:</strong> Click "Add Truck" to register new vehicles</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>View Details:</strong> Click any truck to see full records, documents, and history</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Track Status:</strong> Monitor availability, maintenance, and compliance</span>
            </li>
          </ul>
        </div>
      ),
      icon: FaTruck,
      color: 'blue'
    },
    {
      title: 'Manage Your Drivers',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Keep track of your drivers and assign them to trucks for trips.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Add Drivers:</strong> Register drivers with their licenses and qualifications</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Assign to Trucks:</strong> Link drivers to specific vehicles</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Track Performance:</strong> Monitor driver ratings and history</span>
            </li>
          </ul>
        </div>
      ),
      icon: FaUsers,
      color: 'green'
    },
    {
      title: 'Monitor Analytics & Reports',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Get insights into your fleet's performance and generate reports.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>View Analytics:</strong> See utilization rates, revenue, and trends</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Generate Reports:</strong> Export PDF reports for your records</span>
            </li>
            <li className="flex items-start gap-2">
              <FaCheckCircle className="text-green-600 mt-1 flex-shrink-0" />
              <span><strong>Track Alerts:</strong> Get notified about maintenance, inspections, and insurance</span>
            </li>
          </ul>
        </div>
      ),
      icon: FaChartBar,
      color: 'purple'
    },
    {
      title: 'You\'re All Set! 🎉',
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            You're ready to start managing your fleet! Here are some quick actions to get started:
          </p>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-gray-900 mb-3">Recommended First Steps:</p>
            <ol className="space-y-2 text-gray-700 list-decimal list-inside">
              <li>Add your first truck using the "Add Truck" button</li>
              <li>Upload truck documents (registration, insurance, etc.)</li>
              <li>Add your drivers and assign them to trucks</li>
              <li>Explore the Analytics section to see your dashboard</li>
            </ol>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>💡 Tip:</strong> Need help? Click the <FaQuestionCircle className="inline mx-1" /> icon anytime or visit Help & Support in the sidebar.
            </p>
          </div>
        </div>
      ),
      icon: FaCheckCircle,
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
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${colorClasses[steps[currentStep].color as keyof typeof colorClasses]}`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Skip Tour"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-primary-600 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {steps[currentStep].content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FaArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary-600 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <FaArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetOwnerOnboarding;

