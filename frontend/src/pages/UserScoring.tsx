import React, { useState, useEffect } from 'react';
import { FaChartLine, FaShieldAlt, FaCreditCard, FaHandshake, FaTruck, FaComments, FaStar } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface UserScore {
  id: string;
  userId: string;
  category: 'financial_health' | 'transaction_history' | 'payment_behavior' | 'cargo_quality' | 'communication_score' | 'reliability_score' | 'overall_credit_score';
  score: number;
  normalizedScore: number;
  algorithm: 'financial_analysis' | 'behavioral_pattern' | 'risk_assessment' | 'comprehensive';
  factors: Record<string, any>;
  explanation: string;
  isActive: boolean;
  createdAt: string;
}

const UserScoring: React.FC = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserScores();
    }
  }, [user?.id]);

  const loadUserScores = async () => {
    try {
      const response = await api.get(`/scoring/user/${user?.id}/scores/active`);
      // Handle different response structures
      const scoresArray = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data?.scores)
        ? response.data.scores
        : [];
      setScores(scoresArray);
    } catch (error: any) {
      console.error('Error loading scores:', error);
      // If unauthorized, set empty array
      if (error?.response?.status === 401) {
        console.warn('Unauthorized when fetching scores. Returning empty list.');
      }
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllScores = async () => {
    setCalculating(true);
    try {
      const response = await api.post(`/scoring/user/${user?.id}/calculate/all`);

      if (response.status === 200 || response.status === 201) {
        // Reload scores after calculation
        await loadUserScores();
      }
    } catch (error: any) {
      console.error('Error calculating scores:', error);
      if (error?.response?.status === 401) {
        console.warn('Unauthorized when calculating scores.');
      }
    } finally {
      setCalculating(false);
    }
  };

  const getScoreIcon = (category: string) => {
    switch (category) {
      case 'financial_health':
        return <FaCreditCard className="text-green-500" />;
      case 'transaction_history':
        return <FaChartLine className="text-blue-500" />;
      case 'payment_behavior':
        return <FaHandshake className="text-purple-500" />;
      case 'cargo_quality':
        return <FaTruck className="text-orange-500" />;
      case 'communication_score':
        return <FaComments className="text-indigo-500" />;
      case 'reliability_score':
        return <FaShieldAlt className="text-red-500" />;
      case 'overall_credit_score':
        return <FaStar className="text-yellow-500" />;
      default:
        return <FaChartLine className="text-gray-500" />;
    }
  };

  const getScoreLabel = (category: string) => {
    switch (category) {
      case 'financial_health':
        return 'Financial Health';
      case 'transaction_history':
        return 'Transaction History';
      case 'payment_behavior':
        return 'Payment Behavior';
      case 'cargo_quality':
        return 'Cargo Quality';
      case 'communication_score':
        return 'Communication';
      case 'reliability_score':
        return 'Reliability';
      case 'overall_credit_score':
        return 'Overall Credit Score';
      default:
        return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-yellow-600';
    if (score >= 400) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 800) return 'A+';
    if (score >= 750) return 'A';
    if (score >= 700) return 'A-';
    if (score >= 650) return 'B+';
    if (score >= 600) return 'B';
    if (score >= 550) return 'B-';
    if (score >= 500) return 'C+';
    if (score >= 450) return 'C';
    if (score >= 400) return 'C-';
    return 'D';
  };

  const getAlgorithmLabel = (algorithm: string) => {
    switch (algorithm) {
      case 'financial_analysis':
        return 'Financial Analysis';
      case 'behavioral_pattern':
        return 'Behavioral Pattern';
      case 'risk_assessment':
        return 'Risk Assessment';
      case 'comprehensive':
        return 'Comprehensive';
      default:
        return algorithm.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Credit Scoring</h1>
            <p className="text-gray-600">Comprehensive credit analysis powered by artificial intelligence</p>
          </div>
          <button
            onClick={calculateAllScores}
            disabled={calculating}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {calculating ? 'Calculating...' : 'Recalculate Scores'}
          </button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {scores.map((score) => (
          <div key={score.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              {getScoreIcon(score.category)}
              <h3 className="ml-2 text-lg font-semibold">{getScoreLabel(score.category)}</h3>
            </div>
            
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${getScoreColor(score.normalizedScore)} mb-2`}>
                {score.normalizedScore.toFixed(0)}
              </div>
              <div className="text-2xl font-semibold text-gray-600 mb-1">
                {getScoreGrade(score.normalizedScore)}
              </div>
              <div className="text-sm text-gray-500">
                Raw Score: {score.score.toFixed(0)}/1000
              </div>
            </div>

            <div className="text-xs text-gray-600 mb-3">
              Algorithm: {getAlgorithmLabel(score.algorithm)}
            </div>

            <div className="text-sm text-gray-700">
              {score.explanation}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Score Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Detailed Score Analysis</h2>
        </div>
        <div className="p-6">
          {scores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scores available. Click "Recalculate Scores" to generate AI analysis.</p>
          ) : (
            <div className="space-y-6">
              {scores.map((score) => (
                <div key={score.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    {getScoreIcon(score.category)}
                    <h3 className="ml-2 text-lg font-semibold">{getScoreLabel(score.category)}</h3>
                    <span className="ml-auto text-sm text-gray-500">
                      {new Date(score.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Score Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Normalized Score:</span>
                          <span className={`font-semibold ${getScoreColor(score.normalizedScore)}`}>
                            {score.normalizedScore.toFixed(1)}/100
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Raw Score:</span>
                          <span className="font-semibold">{score.score.toFixed(0)}/1000</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Grade:</span>
                          <span className="font-semibold">{getScoreGrade(score.normalizedScore)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Algorithm:</span>
                          <span className="font-semibold">{getAlgorithmLabel(score.algorithm)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Key Factors</h4>
                      <div className="space-y-2 text-sm">
                        {Object.entries(score.factors).slice(0, 5).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                            </span>
                            <span className="font-semibold">
                              {typeof value === 'number' ? value.toFixed(2) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-2">AI Explanation</h4>
                    <p className="text-sm text-gray-700">{score.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserScoring; 