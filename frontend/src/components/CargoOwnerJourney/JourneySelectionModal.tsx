import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTruck, FaGavel, FaRocket, FaCheck, FaClock, FaDollarSign } from 'react-icons/fa';
import { HelpCircle, BarChart3 } from 'lucide-react';
import JourneyDecisionHelper from './JourneyDecisionHelper';
import JourneyComparison from './JourneyComparison';

interface JourneySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJourneySelected: (journey: 'smart-matching' | 'publish-bid') => void;
  cargoData: any;
  loading?: boolean;
}

const JourneySelectionModal: React.FC<JourneySelectionModalProps> = ({
  isOpen,
  onClose,
  onJourneySelected,
  cargoData,
  loading = false
}) => {
  const [showDecisionHelper, setShowDecisionHelper] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  if (!isOpen) return null;

  const getRecommendation = () => {
    if (!cargoData) return 'smart-matching';
    
    if (cargoData.urgencyLevel === 'CRITICAL' || cargoData.urgencyLevel === 'HIGH') {
      return 'smart-matching';
    }
    if (cargoData.loadValue > 10000) {
      return 'publish-bid';
    }
    return 'smart-matching';
  };

  const recommendation = getRecommendation();

  // Show Decision Helper if requested
  if (showDecisionHelper) {
    return (
      <JourneyDecisionHelper
        cargoData={cargoData}
        onRecommendation={(rec) => {
          setShowDecisionHelper(false);
          onJourneySelected(rec.journey);
        }}
        onClose={() => setShowDecisionHelper(false)}
      />
    );
  }

  // Show Comparison if requested
  if (showComparison) {
    return (
      <JourneyComparison
        cargoData={cargoData}
        onSelect={(journey) => {
          setShowComparison(false);
          onJourneySelected(journey);
        }}
        onClose={() => setShowComparison(false)}
      />
    );
  }

    return createPortal(
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Journey</h2>
                <p className="text-gray-600 mt-1">Select the best approach for your shipment</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Journey Options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Smart Matching */}
              <div className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
                recommendation === 'smart-matching' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                {recommendation === 'smart-matching' && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                
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
                    <span>Instant truck matching</span>
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

                <button
                  onClick={() => onJourneySelected('smart-matching')}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Choose Smart Matching'}
                </button>
              </div>

              {/* Publish for Bid */}
              <div className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
                recommendation === 'publish-bid' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}>
                {recommendation === 'publish-bid' && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Recommended
                  </div>
                )}
                
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
                    <span>Detailed truck profiles</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaCheck className="text-green-500 mr-2" />
                    <span>Best for cost optimization</span>
                  </div>
                </div>

                <button
                  onClick={() => onJourneySelected('publish-bid')}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Choose Publish for Bid'}
                </button>
              </div>
            </div>

            {/* Helper Tools */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={() => setShowDecisionHelper(true)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold transition-all shadow-lg flex items-center justify-center gap-3 group"
              >
                <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Need Help Deciding?</span>
              </button>
              <button
                onClick={() => setShowComparison(true)}
                className="flex-1 px-6 py-4 border-2 border-violet-600 text-violet-600 rounded-xl hover:bg-violet-50 font-semibold transition-all flex items-center justify-center gap-3 group"
              >
                <BarChart3 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Compare Options</span>
              </button>
            </div>

            {/* Cargo Summary */}
            {cargoData && (
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Your Cargo Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center">
                    <FaTruck className="text-blue-500 mr-2" />
                    <span><strong>Title:</strong> {cargoData.title}</span>
                  </div>
                  <div className="flex items-center">
                    <FaClock className="text-blue-500 mr-2" />
                    <span><strong>Urgency:</strong> {cargoData.urgencyLevel}</span>
                  </div>
                  <div className="flex items-center">
                    <FaDollarSign className="text-blue-500 mr-2" />
                    <span><strong>Value:</strong> ${cargoData.loadValue?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    );
};

export default JourneySelectionModal; 