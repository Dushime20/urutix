import React, { useState, useEffect } from 'react';
import { FaTruck, FaStar, FaMapMarkerAlt, FaClock, FaWeightHanging, FaShieldAlt, FaThermometerHalf, FaRoute, FaCheck, FaTimes, FaChartLine, FaChartBar } from 'react-icons/fa';
import { cargoOwnerAPI } from '../../services/cargoOwnerAPI';
import type { MatchedTruck, MarketInsights } from '../../services/cargoOwnerAPI';

interface CargoDetails {
  id?: string;
  title: string;
  description?: string;
  cargoType: string;
  weight: number;
  volume?: number;
  pickupLocationId?: string;
  deliveryLocationId?: string;
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  autoMatchEnabled: boolean;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  // For demo purposes, we'll add mock location data
  pickupLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryLocation?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Using the MatchedTruck interface from cargoOwnerAPI

interface SmartMatchingFlowProps {
  cargoDetails: CargoDetails;
  onComplete: (selectedTruck: MatchedTruck) => void;
}

const SmartMatchingFlow: React.FC<SmartMatchingFlowProps> = ({ cargoDetails, onComplete }) => {
  const [matchedTrucks, setMatchedTrucks] = useState<MatchedTruck[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<MatchedTruck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'comparison'>('list');
  const [compareList, setCompareList] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState({
    minScore: 0,
    maxCost: 0,
    minRating: 0,
    truckType: '',
    hasGPS: false,
    hasRefrigeration: false,
    hasHazmat: false,
  });
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'rating' | 'distance'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    findMatches();
  }, []);

  const findMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call both APIs in parallel
      const [matchesResponse, insightsResponse] = await Promise.all([
        cargoOwnerAPI.findMatches(cargoDetails.id!, {
          minRating: 0,
          maxCost: cargoDetails.loadValue * 0.3,
          requiresRefrigeration: cargoDetails.requiresRefrigeration,
          requiresHazmat: cargoDetails.isHazardous,
          isTimeCritical: cargoDetails.urgencyLevel === 'CRITICAL',
          includeDrivers: true,
          limit: 10
        }),
        cargoOwnerAPI.getMarketInsights()
      ]);

      if (matchesResponse.data) {
        const body = matchesResponse.data;
        const trucks = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.matches)
              ? body.matches
              : [];
        setMatchedTrucks(trucks);
      } else {
        setError('No matches found');
      }

      if (insightsResponse.data) {
        setMarketInsights(insightsResponse.data);
      }
    } catch (error) {
      console.error('Matching error:', error);
      setError('Failed to find matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed demo data - using real API data

  const handleSelectTruck = (truck: MatchedTruck) => {
    setSelectedTruck(truck);
  };

  const handleConfirmSelection = () => {
    if (selectedTruck) {
      onComplete(selectedTruck);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-blue-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Filter and sort trucks
  const filteredTrucks = matchedTrucks
    .filter(truck => {
      if (filters.minScore && truck.score < filters.minScore) return false;
      if (filters.maxCost && truck.estimatedCost > filters.maxCost) return false;
      if (filters.minRating && truck.driver.rating < filters.minRating) return false;
      if (filters.truckType && truck.truck.truckType !== filters.truckType) return false;
      if (filters.hasGPS && !truck.truck.hasGpsTracking) return false;
      if (filters.hasRefrigeration && !truck.truck.hasRefrigeration) return false;
      if (filters.hasHazmat && !truck.truck.hasHazmatPermit) return false;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'cost':
          comparison = a.estimatedCost - b.estimatedCost;
          break;
        case 'rating':
          comparison = a.driver.rating - b.driver.rating;
          break;
        case 'distance':
          comparison = a.distance - b.distance;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleCompare = (truckId: string) => {
    setCompareList(prev => {
      if (prev.includes(truckId)) {
        return prev.filter(id => id !== truckId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, truckId];
    });
  };

  const renderFilters = () => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Filters & Sort</h3>
        <button
          onClick={() => setFilters({ minScore: 0, maxCost: 0, minRating: 0, truckType: '', hasGPS: false, hasRefrigeration: false, hasHazmat: false })}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Match Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.minScore || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, minScore: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Cost ($)</label>
          <input
            type="number"
            min="0"
            value={filters.maxCost || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, maxCost: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="No limit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
          <select
            value={filters.minRating}
            onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="0">Any</option>
            <option value="3">3+ ★</option>
            <option value="4">4+ ★</option>
            <option value="4.5">4.5+ ★</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="score">Match Score</option>
              <option value="cost">Cost</option>
              <option value="rating">Rating</option>
              <option value="distance">Distance</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-4">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={filters.hasGPS}
            onChange={(e) => setFilters(prev => ({ ...prev, hasGPS: e.target.checked }))}
            className="mr-2"
          />
          GPS Tracking
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={filters.hasRefrigeration}
            onChange={(e) => setFilters(prev => ({ ...prev, hasRefrigeration: e.target.checked }))}
            className="mr-2"
          />
          Refrigeration
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={filters.hasHazmat}
            onChange={(e) => setFilters(prev => ({ ...prev, hasHazmat: e.target.checked }))}
            className="mr-2"
          />
          Hazmat Certified
        </label>
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Owner / Truck</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Match Score</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Cost</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Distance</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Rating</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Features</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filteredTrucks.map(truck => (
            <tr key={truck.id} className={selectedTruck?.id === truck.id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{truck.truckOwner.name}</div>
                <div className="text-xs text-gray-500">{truck.truck.make} {truck.truck.model}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(truck.score)} ${getScoreColor(truck.score)}`}>
                  {truck.score}%
                </span>
              </td>
              <td className="px-4 py-3 font-medium">${truck.estimatedCost.toLocaleString()}</td>
              <td className="px-4 py-3">{truck.distance} mi</td>
              <td className="px-4 py-3">{truck.estimatedTime}h</td>
              <td className="px-4 py-3">{truck.driver.rating} ★</td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {truck.truck.hasGpsTracking && <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">GPS</span>}
                  {truck.truck.hasRefrigeration && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Fridge</span>}
                  {truck.truck.hasHazmatPermit && <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded">Hazmat</span>}
                </div>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleSelectTruck(truck)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Select
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderComparisonView = () => {
    const compareItems = filteredTrucks.filter(t => compareList.includes(t.id));
    if (compareItems.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Select up to 3 trucks to compare (check boxes in list view)</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700 w-40">Criteria</th>
              {compareItems.map(truck => (
                <th key={truck.id} className="px-4 py-3 text-center font-medium text-gray-700">
                  <div>{truck.truckOwner.name}</div>
                  <div className="text-xs text-gray-500 font-normal">{truck.truck.make} {truck.truck.model}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr><td className="px-4 py-3 font-medium">Match Score</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(t.score)} ${getScoreColor(t.score)}`}>{t.score}%</span></td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Cost</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center font-semibold">${t.estimatedCost.toLocaleString()}</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Distance</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.distance} miles</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Est. Time</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.estimatedTime} hrs</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Driver Rating</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.driver.rating} ★</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Experience</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.driver.experience} years</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">GPS Tracking</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.truck.hasGpsTracking ? <FaCheck className="inline text-green-500" /> : <FaTimes className="inline text-red-500" />}</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Refrigeration</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.truck.hasRefrigeration ? <FaCheck className="inline text-green-500" /> : <FaTimes className="inline text-red-500" />}</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Hazmat</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">{t.truck.hasHazmatPermit ? <FaCheck className="inline text-green-500" /> : <FaTimes className="inline text-red-500" />}</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium">Insurance</td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center">${t.truck.insuranceCoverage.toLocaleString()}</td>)}</tr>
            <tr><td className="px-4 py-3 font-medium"></td>{compareItems.map(t => <td key={t.id} className="px-4 py-3 text-center"><button onClick={() => handleSelectTruck(t)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Select</button></td>)}</tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-3 text-gray-600">Finding optimal matches...</p>
      </div>
    );
  }

  return (
    <div className="smart-matching-flow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          <FaTruck className="inline mr-2 text-blue-500" />
          AI-Powered Smart Matching
        </h2>
        <p className="text-gray-600">
          We've found {matchedTrucks.length} optimal matches for your cargo using advanced algorithms.
        </p>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Market Insights Dashboard */}
      {marketInsights && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaChartLine className="mr-2 text-blue-600" />
            Market Intelligence
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded p-3">
              <div className="text-sm text-blue-700 font-medium mb-1">Avg Cost/Mile</div>
              <div className="text-2xl font-bold text-blue-900">
                ${marketInsights.averageCostPerMile.toFixed(2)}
              </div>
            </div>
            <div className="bg-green-50 rounded p-3">
              <div className="text-sm text-green-700 font-medium mb-1">Optimal Price</div>
              <div className="text-2xl font-bold text-green-900">
                ${marketInsights.recommendedPricing.optimalPrice.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">
                Range: ${marketInsights.recommendedPricing.minPrice} - ${marketInsights.recommendedPricing.maxPrice}
              </div>
            </div>
            <div className="bg-purple-50 rounded p-3">
              <div className="text-sm text-purple-700 font-medium mb-1">Market Demand</div>
              <div className="flex items-center">
                <FaChartBar className="mr-1 text-purple-600" />
                <span className="text-lg font-bold text-purple-900">{marketInsights.marketDemand}</span>
              </div>
            </div>
            <div className="bg-amber-50 rounded p-3">
              <div className="text-sm text-amber-700 font-medium mb-1">Supply Level</div>
              <div className="flex items-center">
                <FaTruck className="mr-1 text-amber-600" />
                <span className="text-lg font-bold text-amber-900">{marketInsights.supplyLevel}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cargo Summary */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Cargo Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <FaWeightHanging className="text-blue-500 mr-2" />
            <span>{cargoDetails.weight} kg - {cargoDetails.cargoType}</span>
          </div>
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-blue-500 mr-2" />
            <span>
              {cargoDetails.pickupLocation?.city || 'Pickup Location'} → {cargoDetails.deliveryLocation?.city || 'Delivery Location'}
            </span>
          </div>
          <div className="flex items-center">
            <FaClock className="text-blue-500 mr-2" />
            <span>Pickup: {new Date(cargoDetails.pickupDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('comparison')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'comparison' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'}`}
          >
            Compare ({compareList.length}/3)
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredTrucks.length} of {matchedTrucks.length} matches
        </div>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Content based on view mode */}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'comparison' && renderComparisonView()}

      {/* Matched Trucks - List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredTrucks.map((truck) => (
            <div
              key={truck.id}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${selectedTruck?.id === truck.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
                }`}
              onClick={() => handleSelectTruck(truck)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={compareList.includes(truck.id)}
                        onChange={() => toggleCompare(truck.id)}
                        className="mt-1"
                        disabled={!compareList.includes(truck.id) && compareList.length >= 3}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {truck.truckOwner.name}
                        </h3>
                        <p className="text-sm text-gray-600">{truck.truck.make} {truck.truck.model} ({truck.truck.truckType})</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(truck.score)} ${getScoreColor(truck.score)}`}>
                        <FaStar className="mr-1" />
                        {truck.score}% Match
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${truck.estimatedCost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="text-gray-400 mr-2" />
                      <span className="text-sm">{truck.distance} miles</span>
                    </div>
                    <div className="flex items-center">
                      <FaClock className="text-gray-400 mr-2" />
                      <span className="text-sm">{truck.estimatedTime} hours</span>
                    </div>
                    <div className="flex items-center">
                      <FaStar className="text-gray-400 mr-2" />
                      <span className="text-sm">{truck.driver.rating} ★ Driver</span>
                    </div>
                    <div className="flex items-center">
                      <FaShieldAlt className="text-gray-400 mr-2" />
                      <span className="text-sm">Risk: {Math.round(truck.riskScore * 100)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FaCheck className="text-green-500 mr-1" />
                      <span>Available Now</span>
                    </div>
                    {truck.truck.hasRefrigeration && (
                      <div className="flex items-center">
                        <FaThermometerHalf className="text-blue-500 mr-1" />
                        <span>Refrigerated</span>
                      </div>
                    )}
                    {truck.truck.hasHazmatPermit && (
                      <div className="flex items-center">
                        <FaShieldAlt className="text-orange-500 mr-1" />
                        <span>Hazmat Certified</span>
                      </div>
                    )}
                    {truck.truck.hasGpsTracking && (
                      <div className="flex items-center">
                        <FaRoute className="text-purple-500 mr-1" />
                        <span>GPS Tracking</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  {selectedTruck?.id === truck.id ? (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <FaCheck className="text-white text-sm" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                  )}
                </div>
              </div>

              {/* Detailed View */}
              {showDetails === truck.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Driver Details</h4>
                      <p className="text-sm text-gray-600">{truck.driver.firstName} {truck.driver.lastName}</p>
                      <p className="text-sm text-gray-600">{truck.driver.experience} years experience</p>
                      <p className="text-sm text-gray-600">Rating: {truck.driver.rating} ★</p>
                      <p className="text-sm text-gray-600">Endorsements: {truck.driver.endorsements.join(', ')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Truck Details</h4>
                      <p className="text-sm text-gray-600">{truck.truck.make} {truck.truck.model} ({truck.truck.year})</p>
                      <p className="text-sm text-gray-600">Capacity: {truck.truck.capacityWeight} kg</p>
                      <p className="text-sm text-gray-600">Type: {truck.truck.truckType}</p>
                      <p className="text-sm text-gray-600">Insurance: ${truck.truck.insuranceCoverage.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(showDetails === truck.id ? null : truck.id);
                }}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showDetails === truck.id ? 'Hide Details' : 'View Details'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleConfirmSelection}
          disabled={!selectedTruck}
          className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${selectedTruck
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-gray-300 cursor-not-allowed'
            }`}
        >
          Confirm Selection
        </button>
      </div>
    </div>
  );
};

export default SmartMatchingFlow; 