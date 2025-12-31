import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type MatchRecommendation } from '../../services/brokerApi';
import { Brain, TrendingUp, Package, Route, DollarSign, CheckCircle2, XCircle, Loader2, Sparkles, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const SmartMatching: React.FC = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<MatchRecommendation | null>(null);

  const handleGenerateRecommendations = async () => {
    if (!selectedLoadId) {
      toast.error('Please enter a Load ID');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.generateRecommendations(selectedLoadId);
      setRecommendations(response.data || []);
      toast.success(`Generated ${response.data?.length || 0} recommendations`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await brokerAPI.acceptRecommendation(recommendationId);
      toast.success('Recommendation accepted');
      if (selectedLoadId) {
        const response = await brokerAPI.getRecommendations(selectedLoadId);
        setRecommendations(response.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to accept recommendation');
    }
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'AI_POWERED':
        return <Brain className="w-5 h-5 text-purple-600" />;
      case 'ROUTE_OPTIMIZED':
        return <Route className="w-5 h-5 text-blue-600" />;
      case 'BUNDLING_OPPORTUNITY':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'BACKHAUL_IDENTIFIED':
        return <TrendingUp className="w-5 h-5 text-orange-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Load Matching</h1>
          <p className="text-gray-600 mt-1">AI-powered transporter recommendations and route optimization</p>
        </div>
      </div>

      {/* Load Selection */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Load ID</label>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter Load ID"
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleGenerateRecommendations}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Recommendations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-600">Enter a Load ID and generate AI-powered recommendations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getRecommendationTypeIcon(rec.recommendationType)}
                    <span className="text-sm font-medium text-gray-900">
                      {rec.recommendationType.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(rec.matchScore)}`}>
                      Score: {rec.matchScore}%
                    </span>
                    <span className="text-xs text-gray-500">
                      Confidence: {rec.confidenceLevel}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {rec.matchingFactors.distanceScore && (
                      <div>
                        <div className="text-sm text-gray-600">Distance Score</div>
                        <div className="text-lg font-semibold">{rec.matchingFactors.distanceScore}%</div>
                      </div>
                    )}
                    {rec.matchingFactors.capacityUtilization && (
                      <div>
                        <div className="text-sm text-gray-600">Capacity</div>
                        <div className="text-lg font-semibold">{rec.matchingFactors.capacityUtilization}%</div>
                      </div>
                    )}
                    {rec.matchingFactors.reliabilityScore && (
                      <div>
                        <div className="text-sm text-gray-600">Reliability</div>
                        <div className="text-lg font-semibold">{rec.matchingFactors.reliabilityScore}%</div>
                      </div>
                    )}
                    {rec.routeOptimization && (
                      <div>
                        <div className="text-sm text-gray-600">Fuel Savings</div>
                        <div className="text-lg font-semibold text-green-600">
                          {rec.routeOptimization.fuelSavings.toFixed(2)} km
                        </div>
                      </div>
                    )}
                  </div>

                  {rec.bundlingOpportunity && (
                    <div className="mb-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <Package className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Bundling Opportunity</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {rec.bundlingOpportunity.bundledLoadIds.length} loads can be bundled. 
                        Savings: {rec.bundlingOpportunity.totalSavings.toLocaleString()} KES
                      </p>
                    </div>
                  )}

                  {rec.backhaulOpportunity && (
                    <div className="mb-3 p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">Backhaul Opportunity</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Return trip available. Total revenue: {rec.backhaulOpportunity.totalRevenue.toLocaleString()} KES
                      </p>
                    </div>
                  )}

                  {rec.aiInsights && rec.aiInsights.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-1">AI Recommendations:</div>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {rec.aiInsights.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col space-y-2">
                  {rec.status === 'PENDING' && (
                    <button
                      onClick={() => handleAcceptRecommendation(rec.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                  )}
                  {rec.status === 'ACCEPTED' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      Accepted
                    </span>
                  )}
                  <button
                    onClick={() => setSelectedRecommendation(rec)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation Details Modal */}
      {selectedRecommendation && (
        <RecommendationDetailsModal
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onAccept={handleAcceptRecommendation}
        />
      )}
    </div>
  );
};

const RecommendationDetailsModal: React.FC<{
  recommendation: MatchRecommendation;
  onClose: () => void;
  onAccept: (id: string) => void;
}> = ({ recommendation, onClose, onAccept }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Recommendation Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Match Score</label>
              <p className="text-2xl font-bold text-gray-900">{recommendation.matchScore}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Confidence Level</label>
              <p className="text-2xl font-bold text-gray-900">{recommendation.confidenceLevel}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Predicted Success Rate</label>
              <p className="text-lg font-semibold text-gray-900">
                {recommendation.aiInsights.predictedSuccessRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg font-semibold text-gray-900">{recommendation.status}</p>
            </div>
          </div>

          {recommendation.routeOptimization && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Route Optimization</label>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Optimized Distance</div>
                  <div className="text-lg font-semibold">{recommendation.routeOptimization.optimizedDistance.toFixed(2)} km</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimated Time</div>
                  <div className="text-lg font-semibold">{Math.round(recommendation.routeOptimization.estimatedTime / 60)} hours</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Fuel Savings</div>
                  <div className="text-lg font-semibold text-green-600">
                    {recommendation.routeOptimization.fuelSavings.toFixed(2)} km
                  </div>
                </div>
              </div>
            </div>
          )}

          {recommendation.aiInsights.riskFactors.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Risk Factors</label>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {recommendation.aiInsights.riskFactors.map((factor, idx) => (
                  <li key={idx}>{factor}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            {recommendation.status === 'PENDING' && (
              <button
                onClick={() => onAccept(recommendation.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Accept Recommendation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatching;

