import React, { useState, useEffect } from 'react';
import { FaTruck, FaBox, FaStar, FaCheck, FaTimes, FaThermometerHalf, FaShieldAlt, FaTools } from 'react-icons/fa';
import { enhancedMatchingApi, CargoAlignmentResult } from '../../services/enhancedMatchingApi';

interface TruckRecommendationsProps {
  loadId?: string;
  cargoType?: string;
  onTruckSelect?: (truckId: string) => void;
}

export const TruckRecommendations: React.FC<TruckRecommendationsProps> = ({
  loadId,
  cargoType,
  onTruckSelect,
}) => {
  const [recommendations, setRecommendations] = useState<CargoAlignmentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadId) {
      fetchRecommendations();
    }
  }, [loadId]);

  const fetchRecommendations = async () => {
    if (!loadId) return;

    setLoading(true);
    setError(null);

    try {
      const results = await enhancedMatchingApi.findEnhancedMatches({ loadId });
      setRecommendations(results);
    } catch (err) {
      setError('Failed to fetch truck recommendations');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Acceptable';
    return 'Poor';
  };

  const renderCompatibilityIndicator = (compatible: boolean, label: string) => (
    <div className="flex items-center gap-1">
      {compatible ? (
        <FaCheck className="w-3 h-3 text-green-500" />
      ) : (
        <FaTimes className="w-3 h-3 text-red-500" />
      )}
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );

  const renderScoreBreakdown = (score: any) => (
    <div className="space-y-1 text-xs">
      <div className="flex justify-between">
        <span>Basic Score:</span>
        <span className={getScoreColor(score.basicScore)}>{(score.basicScore * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between">
        <span>Cargo Alignment:</span>
        <span className={getScoreColor(score.cargoAlignmentScore)}>{(score.cargoAlignmentScore * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between">
        <span>Equipment:</span>
        <span className={getScoreColor(score.equipmentScore)}>{(score.equipmentScore * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between">
        <span>Security:</span>
        <span className={getScoreColor(score.securityScore)}>{(score.securityScore * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between">
        <span>Route:</span>
        <span className={getScoreColor(score.routeScore)}>{(score.routeScore * 100).toFixed(0)}%</span>
      </div>
      <div className="flex justify-between">
        <span>Cost:</span>
        <span className={getScoreColor(score.costScore)}>{(score.costScore * 100).toFixed(0)}%</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-red-600">
          <FaTimes className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchRecommendations}
            className="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <FaTruck className="w-8 h-8 mx-auto mb-2" />
          <p>No truck recommendations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FaStar className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-medium text-gray-900">Truck Recommendations</h3>
        <span className="text-sm text-gray-500">({recommendations.length} matches found)</span>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div
            key={recommendation.truckId}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onTruckSelect?.(recommendation.truckId)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Truck {recommendation.truckId}</h4>
                  <p className="text-sm text-gray-600">{recommendation.score.matchReason}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getScoreColor(recommendation.score.overallScore)}`}>
                  {(recommendation.score.overallScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">{getScoreLabel(recommendation.score.overallScore)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Score Breakdown */}
              <div className="bg-gray-50 rounded p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Score Breakdown</h5>
                {renderScoreBreakdown(recommendation.score)}
              </div>

              {/* Compatibility */}
              <div className="bg-gray-50 rounded p-3">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Compatibility</h5>
                <div className="space-y-1">
                  {renderCompatibilityIndicator(recommendation.compatibility.cargoTypes, 'Cargo Types')}
                  {renderCompatibilityIndicator(recommendation.compatibility.temperature, 'Temperature')}
                  {renderCompatibilityIndicator(recommendation.compatibility.dimensions, 'Dimensions')}
                  {renderCompatibilityIndicator(recommendation.compatibility.specialHandling, 'Special Handling')}
                  {renderCompatibilityIndicator(recommendation.compatibility.equipment, 'Equipment')}
                  {renderCompatibilityIndicator(recommendation.compatibility.security, 'Security')}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onTruckSelect?.(recommendation.truckId)}
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm"
              >
                Select Truck
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Recommendation Summary</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• {recommendations.filter(r => r.score.overallScore >= 0.8).length} excellent matches</p>
          <p>• {recommendations.filter(r => r.score.overallScore >= 0.6 && r.score.overallScore < 0.8).length} good matches</p>
          <p>• {recommendations.filter(r => r.score.overallScore < 0.6).length} acceptable matches</p>
          <p>• Best match score: {(Math.max(...recommendations.map(r => r.score.overallScore)) * 100).toFixed(0)}%</p>
        </div>
      </div>
    </div>
  );
};
