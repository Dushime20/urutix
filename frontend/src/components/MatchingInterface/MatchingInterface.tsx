import React, { useState, useEffect } from 'react';
import { FaTruck, FaBox, FaRoute, FaChartLine, FaClock, FaDollarSign, FaStar, FaExclamationTriangle, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import type { Load, Truck, Driver, MatchResult } from '../../types';

interface MatchingInterfaceProps {
  loadId: string;
  onMatchSelect?: (match: MatchResult) => void;
  showAdvancedFeatures?: boolean;
}

const MatchingInterface: React.FC<MatchingInterfaceProps> = ({
  loadId,
  onMatchSelect,
  showAdvancedFeatures = true,
}) => {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [filters, setFilters] = useState({
    minScore: 0.5,
    maxDistance: 1000,
    maxCost: 5000,
    truckType: '',
    includeHazardous: true,
    includeRefrigerated: true,
  });
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'time' | 'distance'>('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'detailed'>('grid');

  useEffect(() => {
    if (loadId) {
      fetchMatches();
    }
  }, [loadId, filters]);

  const fetchMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This would call your actual API
      const response = await fetch(`/api/matching/enhanced/${loadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          includeMarketContext: showAdvancedFeatures,
          includeEnvironmentalImpact: showAdvancedFeatures,
          includeRiskAnalysis: showAdvancedFeatures,
          includeSuccessProbability: showAdvancedFeatures,
          ...filters,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      // For demo purposes, show sample data
      setMatches(generateSampleMatches());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleMatches = (): MatchResult[] => {
    return [
      {
        truckId: 'truck-1',
        driverId: 'driver-1',
        overallScore: 0.92,
        capacityScore: 0.95,
        proximityScore: 0.88,
        performanceScore: 0.90,
        routeScore: 0.85,
        fuelScore: 0.92,
        timeScore: 0.89,
        priceScore: 0.78,
        estimatedCost: 1250,
        estimatedTime: 8.5,
        distance: 425,
        truck: {
          id: 'truck-1',
          plateNumber: 'ABC-123',
          make: 'Freightliner',
          model: 'Cascadia',
          truckType: 'FLATBED',
          capacityWeight: 20000,
          year: 2020,
          fuelEfficiency: 8.5,
          status: 'AVAILABLE',
        } as Truck,
        driver: {
          id: 'driver-1',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          phone: '+1-555-0123',
          licenseNumber: 'DL123456',
          status: 'ACTIVE',
          availabilityStatus: 'AVAILABLE',
          rating: 4.8,
          safetyScore: 95,
          totalTrips: 150,
          totalDistance: 45000,
          totalEarnings: 125000,
          hoursWorkedThisWeek: 45,
          hoursWorkedThisMonth: 180,
          consecutiveDrivingHours: 8,
          onTimeDeliveryRate: 0.95,
          yearsOfExperience: 8,
          driverRating: 4.8,
          endorsements: ['HAZMAT', 'TWIC'],
        } as Driver,
        marketContext: {
          currentDemand: 0.75,
          priceTrend: 'rising',
          regionalFactors: ['High demand in Northeast', 'Fuel price increase'],
        },
        environmentalImpact: {
          carbonFootprint: 1250,
          fuelEfficiency: 8.5,
          routeOptimization: 0.85,
        },
        riskAssessment: {
          overallRisk: 0.15,
          riskFactors: ['Weather conditions'],
          mitigationStrategies: ['Monitor weather updates', 'Have backup routes'],
        },
        successProbability: 0.89,
      },
      {
        truckId: 'truck-2',
        driverId: 'driver-2',
        overallScore: 0.85,
        capacityScore: 0.88,
        proximityScore: 0.92,
        performanceScore: 0.82,
        routeScore: 0.78,
        fuelScore: 0.85,
        timeScore: 0.90,
        priceScore: 0.85,
        estimatedCost: 1100,
        estimatedTime: 7.5,
        distance: 380,
        truck: {
          id: 'truck-2',
          plateNumber: 'XYZ-789',
          make: 'Kenworth',
          model: 'T680',
          truckType: 'REEFER',
          capacityWeight: 18000,
          year: 2019,
          fuelEfficiency: 7.8,
          status: 'AVAILABLE',
        } as Truck,
        driver: {
          id: 'driver-2',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@example.com',
          phone: '+1-555-0456',
          licenseNumber: 'DL789012',
          status: 'ACTIVE',
          availabilityStatus: 'AVAILABLE',
          rating: 4.6,
          safetyScore: 92,
          totalTrips: 120,
          totalDistance: 38000,
          totalEarnings: 98000,
          hoursWorkedThisWeek: 42,
          hoursWorkedThisMonth: 165,
          consecutiveDrivingHours: 7,
          onTimeDeliveryRate: 0.92,
          yearsOfExperience: 5,
          driverRating: 4.6,
          endorsements: ['REEFER', 'TWIC'],
        } as Driver,
        marketContext: {
          currentDemand: 0.75,
          priceTrend: 'rising',
          regionalFactors: ['High demand in Northeast', 'Fuel price increase'],
        },
        environmentalImpact: {
          carbonFootprint: 1350,
          fuelEfficiency: 7.8,
          routeOptimization: 0.78,
        },
        riskAssessment: {
          overallRisk: 0.22,
          riskFactors: ['Older vehicle', 'Medium experience driver'],
          mitigationStrategies: ['Pre-trip inspection', 'Additional supervision'],
        },
        successProbability: 0.82,
      },
    ];
  };

  const handleMatchSelect = (match: MatchResult) => {
    setSelectedMatch(match);
    onMatchSelect?.(match);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <FaCheckCircle className="text-green-500" />;
    if (score >= 0.6) return <FaStar className="text-yellow-500" />;
    return <FaExclamationTriangle className="text-red-500" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <FaChartLine className="text-red-500" />;
      case 'falling':
        return <FaChartLine className="text-green-500" />;
      default:
        return <FaChartLine className="text-gray-500" />;
    }
  };

  const sortMatches = (matchesToSort: MatchResult[]) => {
    return [...matchesToSort].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overallScore - a.overallScore;
        case 'cost':
          return a.estimatedCost - b.estimatedCost;
        case 'time':
          return a.estimatedTime - b.estimatedTime;
        case 'distance':
          return a.distance - b.distance;
        default:
          return 0;
      }
    });
  };

  const filteredAndSortedMatches = sortMatches(
    matches.filter(match => 
      match.overallScore >= filters.minScore &&
      match.distance <= filters.maxDistance &&
      match.estimatedCost <= filters.maxCost &&
      (filters.truckType === '' || match.truck.truckType === filters.truckType)
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cargo-Truck Matching</h2>
          <p className="text-gray-600">Found {filteredAndSortedMatches.length} compatible matches</p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="grid">Grid View</option>
            <option value="list">List View</option>
            <option value="detailed">Detailed View</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="score">Sort by Score</option>
            <option value="cost">Sort by Cost</option>
            <option value="time">Sort by Time</option>
            <option value="distance">Sort by Distance</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Score
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filters.minScore}
              onChange={(e) => setFilters(prev => ({ ...prev, minScore: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <span className="text-sm text-gray-600">{filters.minScore}</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Distance (km)
            </label>
            <input
              type="number"
              value={filters.maxDistance}
              onChange={(e) => setFilters(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Cost ($)
            </label>
            <input
              type="number"
              value={filters.maxCost}
              onChange={(e) => setFilters(prev => ({ ...prev, maxCost: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Truck Type
            </label>
            <select
              value={filters.truckType}
              onChange={(e) => setFilters(prev => ({ ...prev, truckType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="FLATBED">Flatbed</option>
              <option value="REEFER">Reefer</option>
              <option value="BOX">Box Truck</option>
              <option value="TANKER">Tanker</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Display */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedMatches.map((match) => (
            <MatchCard
              key={match.truckId}
              match={match}
              onSelect={handleMatchSelect}
              showAdvanced={showAdvancedFeatures}
            />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredAndSortedMatches.map((match) => (
            <MatchListItem
              key={match.truckId}
              match={match}
              onSelect={handleMatchSelect}
              showAdvanced={showAdvancedFeatures}
            />
          ))}
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {filteredAndSortedMatches.map((match) => (
            <DetailedMatchView
              key={match.truckId}
              match={match}
              onSelect={handleMatchSelect}
              showAdvanced={showAdvancedFeatures}
            />
          ))}
        </div>
      )}

      {/* No Matches */}
      {filteredAndSortedMatches.length === 0 && (
        <div className="text-center py-12">
          <FaBox className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or expanding your search criteria.
          </p>
        </div>
      )}

      {/* Selected Match Details */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Match Details - {selectedMatch.truck.plateNumber}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold">Truck Information</h4>
                    <p>Type: {selectedMatch.truck.truckType}</p>
                    <p>Capacity: {selectedMatch.truck.capacityWeight} kg</p>
                    <p>Year: {selectedMatch.truck.year}</p>
                    <p>Fuel Efficiency: {selectedMatch.truck.fuelEfficiency} mpg</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Driver Information</h4>
                    <p>Name: {selectedMatch.driver.firstName} {selectedMatch.driver.lastName}</p>
                    <p>Experience: {selectedMatch.driver.yearsOfExperience} years</p>
                    <p>Rating: {selectedMatch.driver.rating}/5</p>
                    <p>Endorsements: {selectedMatch.driver.endorsements.join(', ')}</p>
                  </div>
                </div>
                
                {showAdvancedFeatures && selectedMatch.marketContext && (
                  <div>
                    <h4 className="font-semibold">Market Context</h4>
                    <p>Demand: {(selectedMatch.marketContext.currentDemand * 100).toFixed(0)}%</p>
                    <p>Price Trend: {selectedMatch.marketContext.priceTrend}</p>
                    <p>Factors: {selectedMatch.marketContext.regionalFactors.join(', ')}</p>
                  </div>
                )}
                
                {showAdvancedFeatures && selectedMatch.riskAssessment && (
                  <div>
                    <h4 className="font-semibold">Risk Assessment</h4>
                    <p>Overall Risk: {(selectedMatch.riskAssessment.overallRisk * 100).toFixed(0)}%</p>
                    <p>Risk Factors: {selectedMatch.riskAssessment.riskFactors.join(', ')}</p>
                    <p>Mitigation: {selectedMatch.riskAssessment.mitigationStrategies.join(', ')}</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedMatch(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      onMatchSelect?.(selectedMatch);
                      setSelectedMatch(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Select This Match
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Match Card Component
const MatchCard: React.FC<{
  match: MatchResult;
  onSelect: (match: MatchResult) => void;
  showAdvanced: boolean;
}> = ({ match, onSelect, showAdvanced }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <FaTruck className="text-blue-600 text-xl" />
        <div>
                          <h3 className="font-semibold text-gray-900">{match.truck.plateNumber}</h3>
                <p className="text-sm text-gray-600">{match.truck.truckType}</p>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold ${getScoreColor(match.overallScore)}`}>
          {(match.overallScore * 100).toFixed(0)}%
        </div>
        <div className="text-sm text-gray-600">Match Score</div>
      </div>
    </div>

    <div className="space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Driver</span>
        <span className="text-sm font-medium">{match.driver.firstName} {match.driver.lastName}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Distance</span>
        <span className="text-sm font-medium">{match.distance} km</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Time</span>
        <span className="text-sm font-medium">{match.estimatedTime}h</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Cost</span>
        <span className="text-sm font-medium">${match.estimatedCost}</span>
      </div>
    </div>

    {showAdvanced && match.successProbability && (
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Success Probability</span>
          <span className="text-sm font-bold text-blue-900">
            {(match.successProbability * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    )}

    <button
      onClick={() => onSelect(match)}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
    >
      View Details
    </button>
  </div>
);

// Match List Item Component
const MatchListItem: React.FC<{
  match: MatchResult;
  onSelect: (match: MatchResult) => void;
  showAdvanced: boolean;
}> = ({ match, onSelect, showAdvanced }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <FaTruck className="text-blue-600 text-xl" />
        <div>
          <h3 className="font-semibold text-gray-900">{match.truck.plateNumber}</h3>
          <p className="text-sm text-gray-600">{match.truck.truckType} • {match.driver.firstName} {match.driver.lastName}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="text-center">
          <div className={`text-lg font-bold ${getScoreColor(match.overallScore)}`}>
            {(match.overallScore * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{match.distance} km</div>
          <div className="text-xs text-gray-600">Distance</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">${match.estimatedCost}</div>
          <div className="text-xs text-gray-600">Cost</div>
        </div>
        
        <button
          onClick={() => onSelect(match)}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
        >
          Details
        </button>
      </div>
    </div>
  </div>
);

// Detailed Match View Component
const DetailedMatchView: React.FC<{
  match: MatchResult;
  onSelect: (match: MatchResult) => void;
  showAdvanced: boolean;
}> = ({ match, onSelect, showAdvanced }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Info */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FaTruck className="text-blue-600 text-2xl" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{match.truck.plateNumber}</h3>
              <p className="text-gray-600">{match.truck.truckType}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(match.overallScore)}`}>
              {(match.overallScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Overall Match Score</div>
          </div>
        </div>

        {/* Scoring Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ScoreCard label="Capacity" score={match.capacityScore} icon={<FaBox />} />
          <ScoreCard label="Proximity" score={match.proximityScore} icon={<FaRoute />} />
          <ScoreCard label="Performance" score={match.performanceScore} icon={<FaStar />} />
          <ScoreCard label="Route" score={match.routeScore} icon={<FaRoute />} />
          <ScoreCard label="Fuel" score={match.fuelScore} icon={<FaChartLine />} />
          <ScoreCard label="Time" score={match.timeScore} icon={<FaClock />} />
          <ScoreCard label="Price" score={match.priceScore} icon={<FaDollarSign />} />
        </div>

        {/* Key Metrics */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Cost</span>
            <span className="font-medium text-gray-900">${match.estimatedCost}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Estimated Time</span>
            <span className="font-medium text-gray-900">{match.estimatedTime}h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Distance</span>
            <span className="font-medium text-gray-900">{match.distance} km</span>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Driver Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Driver Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Name:</span>
              <span className="text-sm font-medium">{match.driver.firstName} {match.driver.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Experience:</span>
                              <span className="text-sm font-medium">{match.driver.yearsOfExperience} years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Rating:</span>
              <span className="text-sm font-medium">{match.driver.rating}/5</span>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        {showAdvanced && match.marketContext && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Market Context</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Demand:</span>
                <span className="text-sm font-medium text-blue-900">
                  {(match.marketContext.currentDemand * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Price Trend:</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(match.marketContext.priceTrend)}
                  <span className="text-sm font-medium text-blue-900 capitalize">
                    {match.marketContext.priceTrend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAdvanced && match.riskAssessment && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-3">Risk Assessment</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-yellow-700">Overall Risk:</span>
                <span className="text-sm font-medium text-yellow-900">
                  {(match.riskAssessment.overallRisk * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onSelect(match)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Select This Match
        </button>
      </div>
    </div>
  </div>
);

// Score Card Component
const ScoreCard: React.FC<{
  label: string;
  score: number;
  icon: React.ReactNode;
}> = ({ label, score, icon }) => (
  <div className="text-center p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center justify-center mb-2 text-gray-600">
      {icon}
    </div>
    <div className={`text-lg font-bold ${getScoreColor(score)}`}>
      {(score * 100).toFixed(0)}%
    </div>
    <div className="text-xs text-gray-600">{label}</div>
  </div>
);


export default MatchingInterface;
