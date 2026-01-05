import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type MatchRecommendation } from '../../services/brokerApi';
import { Brain, TrendingUp, Package, Route, DollarSign, CheckCircle2, XCircle, Loader2, Sparkles, Zap, Target, ArrowLeft, Shield, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const SmartMatching: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState(searchParams.get('loadId') || '');
  const [selectedRecommendation, setSelectedRecommendation] = useState<MatchRecommendation | null>(null);

  // Auto-load recommendations if loadId is in URL
  useEffect(() => {
    const loadId = searchParams.get('loadId');
    if (loadId) {
      setSelectedLoadId(loadId);
      // Auto-generate recommendations
      setTimeout(() => {
        handleGenerateRecommendations(loadId);
      }, 500);
    }
  }, [searchParams]);

  const handleGenerateRecommendations = async (loadId?: string) => {
    const idToUse = loadId || selectedLoadId;
    if (!idToUse) {
      toast.error('Please enter a Load ID');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.generateRecommendations(idToUse);
      setRecommendations(response.data || []);
      if (response.data && response.data.length > 0) {
        toast.success(`🎯 Found ${response.data.length} perfect matches!`);
      } else {
        toast.info('No matches found. Try adjusting the criteria.');
      }
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
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              {searchParams.get('loadId') && (
                <button
                  onClick={() => navigate('/dashboard/broker/discovery')}
                  className="flex items-center gap-2 text-violet-100 hover:text-white mb-3 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Discovery
                </button>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">🤖 Smart Matching AI</h1>
                  <p className="text-violet-100 text-lg">
                    AI-powered transporter recommendations in seconds
                  </p>
                </div>
              </div>
            </div>
            {recommendations.length > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-center">
                <p className="text-sm text-violet-100 mb-1">Matches Found</p>
                <p className="text-4xl font-bold">{recommendations.length}</p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
      </div>

      {/* Load Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-violet-600" />
          <label className="text-lg font-semibold text-gray-900">Select Load to Match</label>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter Load ID or select from Discovery page"
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
          />
          <button
            onClick={() => handleGenerateRecommendations()}
            disabled={loading || !selectedLoadId}
            className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Finding Matches...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Find Transporters</span>
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          💡 Our AI analyzes route optimization, capacity, reliability, and pricing to find the best matches
        </p>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-20">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-violet-600" />
            <Brain className="w-8 h-8 text-violet-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-gray-600 mt-6 text-lg">AI is analyzing transporters...</p>
          <p className="text-gray-500 text-sm mt-2">Finding the perfect matches for your load</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <div className="bg-gradient-to-r from-violet-100 to-purple-100 rounded-full p-6 w-fit mx-auto mb-4">
            <Brain className="w-16 h-16 text-violet-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to find the perfect match?</h3>
          <p className="text-gray-600 mb-6">
            Enter a Load ID above and let our AI find the best transporters
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg">
              <Target className="w-6 h-6 text-violet-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">95% Match Accuracy</p>
              <p className="text-xs text-gray-600">AI-powered precision</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
              <Zap className="w-6 h-6 text-emerald-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">Instant Results</p>
              <p className="text-xs text-gray-600">Matches in seconds</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
              <Shield className="w-6 h-6 text-amber-600 mb-2" />
              <p className="text-sm font-semibold text-gray-900">Verified Only</p>
              <p className="text-xs text-gray-600">Pre-screened transporters</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">🎯 AI Recommendations</h2>
            <p className="text-sm text-gray-600">
              Sorted by match quality • <span className="text-violet-600 font-semibold">{recommendations.length} matches</span>
            </p>
          </div>

          <div className="space-y-6">
            {recommendations.map((rec, index) => (
              <div key={rec.id} className="bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-violet-400 hover:shadow-2xl transition-all overflow-hidden">
                {/* Card Header with Score */}
                <div className={`p-4 ${
                  rec.matchScore >= 80 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                    : rec.matchScore >= 60
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : 'bg-gradient-to-r from-rose-500 to-pink-600'
                } text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                        {index === 0 && <Star className="w-5 h-5" />}
                        {index > 0 && getRecommendationTypeIcon(rec.recommendationType)}
                      </div>
                      <div>
                        <p className="text-sm text-white/80">
                          {index === 0 ? '⭐ Best Match' : `Match #${index + 1}`} • {rec.recommendationType.replace('_', ' ')}
                        </p>
                        <p className="text-lg font-bold">Transporter {rec.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{rec.matchScore}%</p>
                      <p className="text-xs text-white/80">Match Score</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Key Metrics */}
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
            </div>
          ))}
        </div>
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

