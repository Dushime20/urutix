import React, { useState } from "react";
import {
  FaTruck,
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaShieldAlt,
  FaThermometerHalf,
  FaLocationArrow,
  FaCheck,
  FaTimes,
  FaUser,
  FaBuilding,
  FaRoute,
  FaCog,
  FaSortAmountDown,
} from "react-icons/fa";
import FilterSelect from "@/components/common/FilterSelect";

interface MatchedTruck {
  id: string;
  truckNumber: string;
  driverName: string;
  carrierName: string;
  rating: number;
  distance: number;
  estimatedCost: number;
  estimatedTime: number;
  availableDate: string;
  features: string[];
  capacity: {
    weight: number;
    volume: number;
  };
  insurance: {
    coverage: number;
    type: string;
  };
  certifications: string[];
  score: number;
}

interface TruckMatchingResultsProps {
  matchedTrucks: MatchedTruck[];
  onTruckSelect: (truck: MatchedTruck) => void;
  loading?: boolean;
}

const TruckMatchingResults: React.FC<TruckMatchingResultsProps> = ({
  matchedTrucks,
  onTruckSelect,
  loading = false
}) => {
  const [selectedTruckId, setSelectedTruckId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'cost' | 'distance' | 'rating'>('score');

  const sortedTrucks = [...matchedTrucks].sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'cost':
        return a.estimatedCost - b.estimatedCost;
      case 'distance':
        return a.distance - b.distance;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const handleTruckSelect = (truck: MatchedTruck) => {
    setSelectedTruckId(truck.id);
    onTruckSelect(truck);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI Matching in Progress
        </h3>
        <p className="text-gray-600 text-center max-w-md">
          Our intelligent system is analyzing your cargo requirements and finding the best available trucks...
        </p>
        <div className="mt-6 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <FaCog className="w-4 h-4 mr-2 animate-spin" />
            Analyzing cargo specifications
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <FaTruck className="w-4 h-4 mr-2" />
            Searching available trucks
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <FaStar className="w-4 h-4 mr-2" />
            Calculating match scores
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Matched Trucks ({matchedTrucks.length})
          </h3>
          <p className="text-gray-600">
            AI-powered matching based on your cargo requirements
          </p>
        </div>
        
        <FilterSelect
          label="Sort by"
          value={sortBy}
          onChange={(value) => setSortBy((value as typeof sortBy) || "score")}
          placeholder="Sort by"
          options={[
            { value: "score", label: "Match Score" },
            { value: "cost", label: "Price" },
            { value: "distance", label: "Distance" },
            { value: "rating", label: "Rating" },
          ]}
          icon={<FaSortAmountDown className="text-primary-500" />}
          selectClassName="py-2 text-sm"
          className="w-48"
          aria-label="Sort trucks by"
        />
      </div>

      {/* Matching Results */}
      <div className="grid gap-4">
        {sortedTrucks.map((truck) => (
          <div
            key={truck.id}
            className={`border rounded-lg p-6 transition-all cursor-pointer hover:shadow-md ${
              selectedTruckId === truck.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
            onClick={() => handleTruckSelect(truck)}
          >
            <div className="flex items-start justify-between">
              {/* Truck Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FaTruck className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {truck.truckNumber}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {truck.carrierName}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(truck.score)}`}>
                    {truck.score}% Match
                  </div>
                </div>

                {/* Driver Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaUser className="w-4 h-4 mr-2" />
                    {truck.driverName}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FaBuilding className="w-4 h-4 mr-2" />
                    {truck.carrierName}
                  </div>
                  <div className="flex items-center">
                    {getRatingStars(truck.rating)}
                    <span className="text-sm text-gray-600 ml-1">({truck.rating})</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center text-sm">
                    <FaDollarSign className="w-4 h-4 mr-2 text-green-600" />
                    <span className="font-medium">${truck.estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaClock className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="font-medium">{truck.estimatedTime}h</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaMapMarkerAlt className="w-4 h-4 mr-2 text-purple-600" />
                    <span className="font-medium">{truck.distance}km</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <FaShieldAlt className="w-4 h-4 mr-2 text-orange-600" />
                    <span className="font-medium">${(truck.insurance.coverage / 1000000).toFixed(1)}M</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {truck.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              <div className="ml-4">
                {selectedTruckId === truck.id ? (
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <FaCheck className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {matchedTrucks.length === 0 && !loading && (
        <div className="text-center py-12">
          <FaTruck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Matches Found
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find any trucks that match your requirements. Try adjusting your cargo specifications or check back later.
          </p>
        </div>
      )}
    </div>
  );
};

export default TruckMatchingResults; 