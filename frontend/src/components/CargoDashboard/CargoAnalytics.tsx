import React, { useState, useEffect } from 'react';
import { FaChartLine, FaExclamationTriangle, FaCheckCircle, FaClock, FaDollarSign, FaRoute, FaThermometerHalf, FaShieldAlt } from 'react-icons/fa';
import type { Cargo } from '../../types/cargo';

interface CargoAnalyticsProps {
  cargos: Cargo[];
}

interface AnalyticsInsights {
  totalCargos: number;
  publishedCargos: number;
  draftCargos: number;
  averageLoadValue: number;
  averageOfferedPrice: number;
  cargoTypeDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  urgencyDistribution: Record<string, number>;
  routeAnalysis: {
    popularRoutes: Array<{ route: string; count: number }>;
    averageDistance: number;
  };
  pricingInsights: {
    priceToValueRatio: number;
    marketCompetitiveness: number;
    pricingGaps: Array<{ cargoType: string; avgPrice: number; avgValue: number; gap: number }>;
  };
  specialRequirements: {
    hazardousCount: number;
    refrigeratedCount: number;
    fragileCount: number;
    valuableCount: number;
  };
  improvementOpportunities: Array<{
    category: string;
    issue: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendation: string;
  }>;
}

const CargoAnalytics: React.FC<CargoAnalyticsProps> = ({ cargos }) => {
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);

  useEffect(() => {
    if (cargos.length > 0) {
      const analytics = analyzeCargoData(cargos);
      setInsights(analytics);
    }
  }, [cargos]);

  const analyzeCargoData = (cargos: Cargo[]): AnalyticsInsights => {
    const totalCargos = cargos.length;
    const publishedCargos = cargos.filter(c => c.status === 'PUBLISHED').length;
    const draftCargos = cargos.filter(c => c.status === 'DRAFT').length;
    
    const averageLoadValue = cargos.reduce((sum, c) => sum + (c.loadValue || 0), 0) / totalCargos;
    const averageOfferedPrice = cargos.reduce((sum, c) => sum + (c.offeredPrice || 0), 0) / totalCargos;
    
    // Cargo type distribution
    const cargoTypeDistribution = cargos.reduce((acc, cargo) => {
      acc[cargo.cargoType] = (acc[cargo.cargoType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Status distribution
    const statusDistribution = cargos.reduce((acc, cargo) => {
      acc[cargo.status] = (acc[cargo.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Urgency distribution
    const urgencyDistribution = cargos.reduce((acc, cargo) => {
      acc[cargo.urgencyLevel] = (acc[cargo.urgencyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Route analysis
    const routes = cargos.map(cargo => {
      const pickup = cargo.pickupLocation?.name || 'Unknown';
      const delivery = cargo.deliveryLocation?.name || 'Unknown';
      return `${pickup} → ${delivery}`;
    });
    
    const routeCounts = routes.reduce((acc, route) => {
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularRoutes = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Pricing analysis
    const pricingGaps = Object.entries(cargoTypeDistribution).map(([type, count]) => {
      const typeCargos = cargos.filter(c => c.cargoType === type);
      const avgPrice = typeCargos.reduce((sum, c) => sum + (c.offeredPrice || 0), 0) / typeCargos.length;
      const avgValue = typeCargos.reduce((sum, c) => sum + (c.loadValue || 0), 0) / typeCargos.length;
      return {
        cargoType: type,
        avgPrice,
        avgValue,
        gap: avgValue - avgPrice
      };
    });
    
    // Special requirements
    const specialRequirements = {
      hazardousCount: cargos.filter(c => c.isHazardous).length,
      refrigeratedCount: cargos.filter(c => c.requiresRefrigeration).length,
      fragileCount: cargos.filter(c => c.isFragile).length,
      valuableCount: cargos.filter(c => c.cargoType === 'VALUABLE').length
    };
    
    // Improvement opportunities
    const improvementOpportunities = [];
    
    if (draftCargos > publishedCargos) {
      improvementOpportunities.push({
        category: 'Publishing',
        issue: 'High number of draft cargos',
        impact: 'HIGH' as const,
        recommendation: 'Encourage cargo owners to publish their drafts. Consider automated reminders.'
      });
    }
    
    if (averageOfferedPrice < averageLoadValue * 0.8) {
      improvementOpportunities.push({
        category: 'Pricing',
        issue: 'Offered prices significantly below load values',
        impact: 'HIGH' as const,
        recommendation: 'Review pricing strategy. Consider market rate analysis and value-based pricing.'
      });
    }
    
    if (specialRequirements.hazardousCount > 0 && specialRequirements.hazardousCount < totalCargos * 0.1) {
      improvementOpportunities.push({
        category: 'Special Handling',
        issue: 'Limited hazardous cargo handling',
        impact: 'MEDIUM' as const,
        recommendation: 'Expand hazardous cargo capabilities to capture more market share.'
      });
    }
    
    if (cargos.filter(c => c.urgencyLevel === 'CRITICAL').length === 0) {
      improvementOpportunities.push({
        category: 'Urgency Management',
        issue: 'No critical urgency cargos',
        impact: 'LOW' as const,
        recommendation: 'Consider offering premium pricing for urgent deliveries.'
      });
    }
    
    return {
      totalCargos,
      publishedCargos,
      draftCargos,
      averageLoadValue,
      averageOfferedPrice,
      cargoTypeDistribution,
      statusDistribution,
      urgencyDistribution,
      routeAnalysis: {
        popularRoutes,
        averageDistance: 0 // Would need distance calculation
      },
      pricingInsights: {
        priceToValueRatio: averageOfferedPrice / averageLoadValue,
        marketCompetitiveness: 0.75, // Placeholder
        pricingGaps
      },
      specialRequirements,
      improvementOpportunities
    };
  };

  if (!insights) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <FaChartLine className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Cargo Analytics & Insights</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FaChartLine className="w-4 h-4" />
            <span>Real-time Analysis</span>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Cargos</p>
                <p className="text-2xl font-bold text-blue-900">{insights.totalCargos}</p>
              </div>
              <FaChartLine className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-2xl font-bold text-green-900">{insights.publishedCargos}</p>
                <p className="text-xs text-green-600">
                  {((insights.publishedCargos / insights.totalCargos) * 100).toFixed(1)}%
                </p>
              </div>
              <FaCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Draft</p>
                <p className="text-2xl font-bold text-yellow-900">{insights.draftCargos}</p>
                <p className="text-xs text-yellow-600">
                  {((insights.draftCargos / insights.totalCargos) * 100).toFixed(1)}%
                </p>
              </div>
              <FaClock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Avg Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${insights.averageLoadValue.toLocaleString()}
                </p>
              </div>
              <FaDollarSign className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Opportunities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Opportunities</h3>
        <div className="space-y-4">
          {insights.improvementOpportunities.map((opportunity, index) => (
            <div key={index} className={`border-l-4 p-4 rounded-r-lg ${
              opportunity.impact === 'HIGH' ? 'border-red-500 bg-red-50' :
              opportunity.impact === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <FaExclamationTriangle className={`w-4 h-4 ${
                      opportunity.impact === 'HIGH' ? 'text-red-500' :
                      opportunity.impact === 'MEDIUM' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <span className="font-medium text-gray-900">{opportunity.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opportunity.impact === 'HIGH' ? 'bg-red-100 text-red-800' :
                      opportunity.impact === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {opportunity.impact} IMPACT
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{opportunity.issue}</p>
                  <p className="text-sm text-gray-600">{opportunity.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cargo Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cargo Type Distribution</h3>
          <div className="space-y-3">
            {Object.entries(insights.cargoTypeDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-gray-700">{type}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(count / insights.totalCargos) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Requirements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Requirements</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <FaShieldAlt className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">Hazardous</p>
              <p className="text-2xl font-bold text-red-900">{insights.specialRequirements.hazardousCount}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FaThermometerHalf className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-700">Refrigerated</p>
              <p className="text-2xl font-bold text-blue-900">{insights.specialRequirements.refrigeratedCount}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <FaExclamationTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-700">Fragile</p>
              <p className="text-2xl font-bold text-yellow-900">{insights.specialRequirements.fragileCount}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <FaDollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-700">Valuable</p>
              <p className="text-2xl font-bold text-purple-900">{insights.specialRequirements.valuableCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Routes</h3>
        <div className="space-y-3">
          {insights.routeAnalysis.popularRoutes.map((route, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FaRoute className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{route.route}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{route.count} cargos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CargoAnalytics; 