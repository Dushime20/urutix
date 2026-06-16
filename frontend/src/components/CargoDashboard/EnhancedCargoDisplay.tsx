import React, { useState } from 'react';

import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import type { 
  EnhancedCargoData 
} from '../../services/enhancedCargoApi';

interface EnhancedCargoDisplayProps {
  cargoData: EnhancedCargoData;
  showIntelligence?: boolean;
}

const EnhancedCargoDisplay: React.FC<EnhancedCargoDisplayProps> = ({ 
  cargoData, 
  showIntelligence = true 
}) => {
  const { compactIn: formatCurrency } = useCurrencyFormat();
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'analytics'>('overview');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // formatCurrency provided by useCurrencyFormat hook above

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500'; // Default color for undefined status
    
    switch (status.toUpperCase()) {
      case 'DRAFT':
        return 'bg-gray-500';
      case 'PUBLISHED':
        return 'bg-blue-500';
      case 'IN_TRANSIT':
        return 'bg-yellow-500';
      case 'DELIVERED':
        return 'bg-green-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Defensive checks for cargoData
  if (!cargoData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <p>No cargo data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{cargoData.title || 'Untitled Cargo'}</h1>
          <p className="text-gray-600 mt-1">{cargoData.description || 'No description available'}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cargoData.status)}`}>
            {cargoData.status || 'DRAFT'}
          </span>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(cargoData.loadValue, cargoData.currency)}
            </div>
            <div className="text-sm text-gray-500">Load Value</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        {showIntelligence && (
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'intelligence' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Intelligence
          </button>
        )}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'analytics' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-500">Cargo Type</div>
                <div className="font-medium">{cargoData.cargoType || 'GENERAL'}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-500">Weight</div>
                <div className="font-medium">{cargoData.weight || 0} kg</div>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <div className="text-sm text-gray-500">Volume</div>
                <div className="font-medium">{cargoData.volume || 0} m³</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intelligence Tab */}
      {activeTab === 'intelligence' && showIntelligence && (
        <div className="space-y-6">
          {cargoData.enrichedLocations && cargoData.enrichedLocations.length > 0 ? (
            cargoData.enrichedLocations.map((location, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {index === 0 ? 'Pickup' : 'Delivery'} Location Intelligence
                  </h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {location.category}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Location Details */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-3">Location Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">{location.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium">{location.fullAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">City:</span>
                          <span className="font-medium">{location.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">State:</span>
                          <span className="font-medium">{location.state}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-3">Operational Intelligence</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Business Hours:</span>
                          <span className="font-medium">
                            {location.businessHours?.open || 'N/A'} - {location.businessHours?.close || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Access Type:</span>
                          <span className="font-medium">{location.accessType || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Security Level:</span>
                          <span className="font-medium">{location.securityLevel || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Loading Docks:</span>
                          <span className="font-medium">{location.loadingDockCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Route Optimization */}
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-3">Route Optimization</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Traffic Pattern:</span>
                          <span className="font-medium">{location.trafficPattern || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Best Access Time:</span>
                          <span className="font-medium">{location.bestAccessTime || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Parking Available:</span>
                          <span className={location.parkingAvailable ? 'text-green-600' : 'text-red-600'}>
                            {location.parkingAvailable ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fuel Stations:</span>
                          <span className="font-medium">{location.fuelStationsNearby || 0} nearby</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rest Areas:</span>
                          <span className="font-medium">{location.restAreasNearby || 0} nearby</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h3 className="font-semibold text-gray-900 mb-3">Truck Specifications</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Height:</span>
                          <span className="font-medium">{location.maxTruckHeight || 0}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Weight:</span>
                          <span className="font-medium">{(location.maxTruckWeight || 0).toLocaleString()}kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {location.specialInstructions && (
                  <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-2">Special Instructions</h4>
                    <p className="text-yellow-700">{location.specialInstructions}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-center text-gray-500">
                <p>No Location Intelligence</p>
                <p className="text-sm mt-2">Enhanced location data will be displayed here when available.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Route Analysis */}
          {cargoData.routeAnalysis && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{cargoData.routeAnalysis?.totalDistance || 0} km</div>
                    <div className="text-sm text-gray-500">Total Distance</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{cargoData.routeAnalysis?.estimatedDuration || 0} hours</div>
                    <div className="text-sm text-gray-500">Estimated Duration</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{cargoData.routeAnalysis?.routeType || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Route Type</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          {cargoData.performanceMetrics && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{cargoData.performanceMetrics?.routeEfficiencyScore || 0}/100</div>
                    <div className="text-sm text-gray-500">Route Efficiency</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{cargoData.performanceMetrics?.accessibilityScore || 0}/100</div>
                    <div className="text-sm text-gray-500">Accessibility</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{cargoData.performanceMetrics?.riskScore || 0}/100</div>
                    <div className="text-sm text-gray-500">Risk Score</div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{cargoData.performanceMetrics?.costEfficiency || 0}/100</div>
                    <div className="text-sm text-gray-500">Cost Efficiency</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Recommendations */}
          {cargoData.smartRecommendations && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Smart Recommendations</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Optimization Suggestions */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-3">Optimization Suggestions</h3>
                  <ul className="space-y-2">
                    {(cargoData.smartRecommendations?.optimizationSuggestions || []).map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Intelligence Alerts */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-3">Intelligence Alerts</h3>
                  <div className="space-y-2">
                    {(cargoData.smartRecommendations?.intelligenceAlerts || []).map((alert, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        alert.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                        alert.type === 'success' ? 'bg-green-50 border border-green-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        <div className="flex items-start">
                          <span className={`mr-2 mt-1 ${
                            alert.type === 'warning' ? 'text-yellow-600' :
                            alert.type === 'success' ? 'text-green-600' :
                            'text-blue-600'
                          }`}>
                            {alert.type === 'warning' ? '⚠️' :
                             alert.type === 'success' ? '✅' :
                             'ℹ️'}
                          </span>
                          <span className={`text-sm ${
                            alert.type === 'warning' ? 'text-yellow-700' :
                            alert.type === 'success' ? 'text-green-700' :
                            'text-blue-700'
                          }`}>
                            {alert.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback message if no analytics data */}
          {!cargoData.routeAnalysis && !cargoData.performanceMetrics && !cargoData.smartRecommendations && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h2>
              <p className="text-gray-600">Route analysis and performance metrics will be displayed here when available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCargoDisplay; 