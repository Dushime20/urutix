import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaLightbulb, FaBox, FaRoute, FaTruck, FaClock, FaDollarSign, FaCheck } from 'react-icons/fa';

interface AISuggestion {
  id: string;
  type: 'packaging' | 'route' | 'truck' | 'timing' | 'cost';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  estimatedSavings?: number;
  estimatedTime?: number;
}

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggestionsReceived: (suggestions: any) => void;
}

const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({
  isOpen,
  onClose,
  onSuggestionsReceived
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock AI suggestions - in real implementation, these would come from backend
  const mockSuggestions: AISuggestion[] = [
    {
      id: 'packaging-1',
      type: 'packaging',
      title: 'Anti-Static Packaging',
      description: 'Based on your cargo type (electronics), we recommend anti-static packaging to prevent damage from static electricity.',
      confidence: 95,
      impact: 'high',
      implementation: 'Use anti-static bubble wrap and conductive packaging materials',
      estimatedSavings: 500
    },
    {
      id: 'route-1',
      type: 'route',
      title: 'Optimized Route via I-95',
      description: 'Route optimization suggests using I-95 instead of local roads, reducing transit time by 2 hours.',
      confidence: 88,
      impact: 'medium',
      implementation: 'Update pickup/delivery times to accommodate faster route',
      estimatedTime: 120
    },
    {
      id: 'truck-1',
      type: 'truck',
      title: 'Refrigerated Box Truck',
      description: 'For your cargo value and fragility, a refrigerated box truck with GPS tracking is recommended.',
      confidence: 92,
      impact: 'high',
      implementation: 'Specify refrigerated box truck in truck requirements',
      estimatedSavings: 300
    },
    {
      id: 'timing-1',
      type: 'timing',
      title: 'Off-Peak Pickup',
      description: 'Schedule pickup between 2-4 PM to avoid traffic congestion and reduce loading time.',
      confidence: 75,
      impact: 'medium',
      implementation: 'Adjust pickup time to 2:30 PM',
      estimatedTime: 45
    },
    {
      id: 'cost-1',
      type: 'cost',
      title: 'Bulk Insurance Discount',
      description: 'You qualify for bulk insurance discount based on your shipping history and cargo value.',
      confidence: 85,
      impact: 'medium',
      implementation: 'Apply bulk insurance rate to this shipment',
      estimatedSavings: 200
    }
  ];

  useEffect(() => {
    if (isOpen) {
      generateSuggestions();
    }
  }, [isOpen]);

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would be an API call
      // const response = await fetch('/api/ai/suggestions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      //   },
      //   body: JSON.stringify({
      //     cargoType: 'ELECTRONICS',
      //     weight: 500,
      //     value: 15000,
      //     urgency: 'HIGH'
      //   })
      // });
      
      // const data = await response.json();
      // setSuggestions(data.suggestions);
      
      setSuggestions(mockSuggestions);
    } catch (error: any) {
      setError('Failed to generate AI suggestions. Please try again.');
      console.error('AI suggestions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionToggle = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId)
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const handleApplySuggestions = () => {
    const selectedSuggestionsData = suggestions.filter(s => selectedSuggestions.includes(s.id));
    onSuggestionsReceived({
      suggestions: selectedSuggestionsData,
      appliedCount: selectedSuggestions.length
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'packaging': return FaBox;
      case 'route': return FaRoute;
      case 'truck': return FaTruck;
      case 'timing': return FaClock;
      case 'cost': return FaDollarSign;
      default: return FaLightbulb;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 80) return 'text-blue-600';
    if (confidence >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Suggestions</h2>
              <p className="text-gray-600 mt-1">Get smart recommendations for your cargo</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Analyzing your cargo and generating smart suggestions...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {suggestions.map(suggestion => {
                  const Icon = getTypeIcon(suggestion.type);
                  const isSelected = selectedSuggestions.includes(suggestion.id);
                  
                  return (
                    <div
                      key={suggestion.id}
                      className={`border-2 rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSuggestionToggle(suggestion.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded-full p-2 mr-3">
                            <Icon className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{suggestion.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(suggestion.impact)}`}>
                                {suggestion.impact.toUpperCase()} IMPACT
                              </span>
                              <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {suggestion.confidence}% confidence
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {isSelected && (
                            <FaCheck className="text-blue-600 mr-2" />
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{suggestion.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Implementation:</span>
                          <p className="text-gray-600 mt-1">{suggestion.implementation}</p>
                        </div>
                        
                        {suggestion.estimatedSavings && (
                          <div className="flex items-center text-sm">
                            <FaDollarSign className="text-green-500 mr-1" />
                            <span className="text-green-600 font-medium">
                              Estimated savings: ${suggestion.estimatedSavings}
                            </span>
                          </div>
                        )}
                        
                        {suggestion.estimatedTime && (
                          <div className="flex items-center text-sm">
                            <FaClock className="text-blue-500 mr-1" />
                            <span className="text-blue-600 font-medium">
                              Time saved: {suggestion.estimatedTime} minutes
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Selected Suggestions Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Selected:</span>
                    <span className="font-medium ml-2">{selectedSuggestions.length} of {suggestions.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Savings:</span>
                    <span className="font-medium text-green-600 ml-2">
                      ${suggestions
                        .filter(s => selectedSuggestions.includes(s.id) && s.estimatedSavings)
                        .reduce((sum, s) => sum + (s.estimatedSavings || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Time Saved:</span>
                    <span className="font-medium text-blue-600 ml-2">
                      {suggestions
                        .filter(s => selectedSuggestions.includes(s.id) && s.estimatedTime)
                        .reduce((sum, s) => sum + (s.estimatedTime || 0), 0)} minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplySuggestions}
                  disabled={selectedSuggestions.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <FaLightbulb className="w-4 h-4 mr-2" />
                  Apply Selected Suggestions ({selectedSuggestions.length})
                </button>
              </div>
            </>
          )}

          {/* AI Benefits */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How AI Suggestions Help</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Optimize packaging for better protection and cost efficiency</li>
              <li>• Find the fastest and most cost-effective routes</li>
              <li>• Match with the most suitable truck types and features</li>
              <li>• Reduce transit time and improve delivery reliability</li>
              <li>• Lower costs through bulk discounts and optimized planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AISuggestionsModal; 