import React, { useState, useEffect } from "react";
import {
  FaTruck,
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaDollarSign,
  FaCheck,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { matchingAPI } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { useCurrencyFormat } from "@/hooks/useCurrencyFormat";
import type { TruckMatch } from "../../types/truck";
import type { CargoFormData } from "../../types/cargo";
import { checkTruckCompatibility, type CargoTruckCompatibility } from "@/services/enhancedCargoApi";
import TruckCompatibilityAlert from "./TruckCompatibilityAlert";

interface TruckSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadId: string;
  onTruckSelected: (truckMatch: TruckMatch) => void;
  cargoData?: CargoFormData;
}

const TruckSelectionModal: React.FC<TruckSelectionModalProps> = ({
  isOpen,
  onClose,
  loadId,
  onTruckSelected,
  cargoData,
}) => {
  const { format: fmtCurrency } = useCurrencyFormat();
  const [matches, setMatches] = useState<TruckMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("WEIGHTED_SCORE");
  const [selectedTruck, setSelectedTruck] = useState<TruckMatch | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [compatibilityCheck, setCompatibilityCheck] = useState<CargoTruckCompatibility | null>(null);
  const [checkingCompatibility, setCheckingCompatibility] = useState(false);

  useEffect(() => {
    if (isOpen && loadId) {
      findMatches();
    }
  }, [isOpen, loadId, selectedAlgorithm]);

  useEffect(() => {
    const runCompatibilityCheck = async () => {
      if (selectedTruck && loadId) {
        setCheckingCompatibility(true);
        try {
          const result = await checkTruckCompatibility(loadId, selectedTruck);
          setCompatibilityCheck(result);
        } catch (err) {
          console.error("Failed to check compatibility:", err);
          // Fallback or ignore
        } finally {
          setCheckingCompatibility(false);
        }
      } else {
        setCompatibilityCheck(null);
      }
    };

    runCompatibilityCheck();
  }, [selectedTruck, loadId]);

  const findMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const matchRequest = {
        loadId,
        algorithm: selectedAlgorithm,
        minRating: 0.7, // Minimum 70% rating
        limit: 10, // Top 10 matches
        includeDrivers: true,
        requiresRefrigeration: cargoData?.requiresRefrigeration || false,
        requiresHazmat: cargoData?.isHazardous || false,
        isTimeCritical: cargoData?.isTimeCritical || false,
        maxPrice: cargoData?.offeredPrice || 10000,
      };

      const response = await matchingAPI.findMatches(matchRequest);
      setMatches(response.data || []);
    } catch (err: any) {
      console.error("Error finding matches:", err);
      setError(err.response?.data?.message || "Failed to find truck matches");
    } finally {
      setLoading(false);
    }
  };

  const handleTruckSelect = (truck: TruckMatch) => {
    setSelectedTruck(truck);
  };

  const handleConfirmSelection = () => {
    if (selectedTruck) {
      onTruckSelected(selectedTruck);
      onClose();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.8) return "bg-green-100";
    if (score >= 0.6) return "bg-yellow-100";
    return "bg-red-100";
  };

  const formatCurrency = (amount: number) => fmtCurrency(amount);

  const formatDistance = (km: number) => {
    return `${km.toFixed(1)} km`;
  };

  const formatTime = (hours: number) => {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${remainingHours}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-7xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Select Truck for Your Cargo
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              {matches.length} trucks matched • Algorithm: {selectedAlgorithm}
            </DialogDescription>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedAlgorithm}
              onValueChange={setSelectedAlgorithm}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEIGHTED_SCORE">Weighted Score</SelectItem>
                <SelectItem value="HUNGARIAN">Hungarian Algorithm</SelectItem>
                <SelectItem value="GENETIC">Genetic Algorithm</SelectItem>
                <SelectItem value="TOPSIS">TOPSIS</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Truck List */}
          <div className="w-2/3 border-r border-gray-200 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">
                    Finding optimal truck matches...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                  <Button
                    variant="link"
                    onClick={findMatches}
                    className="mt-2 text-red-600 hover:text-red-800 p-0 h-auto"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            ) : matches.length === 0 ? (
              <div className="p-6 text-center">
                <FaTruck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Matches Found
                </h3>
                <p className="text-gray-600">
                  No trucks match your cargo requirements. Try adjusting your
                  criteria.
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {matches.map((truck) => (
                  <div
                    key={truck.truckId}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedTruck?.truckId === truck.truckId
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                      }`}
                    onClick={() => handleTruckSelect(truck)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <FaTruck className="w-5 h-5 text-primary-500" />
                            <span className="font-semibold text-gray-900">
                              {truck.truckMake} {truck.truckModel}
                            </span>
                            <span className="text-sm text-gray-500">
                              ({truck.plateNumber})
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FaStar className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium">
                              {truck.truckRating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {formatDistance(truck.distanceKm)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaClock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {truck.estimatedTransitTime
                                ? formatTime(truck.estimatedTransitTime)
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FaDollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              {formatCurrency(truck.estimatedCost)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBackground(
                                truck.overallScore
                              )} ${getScoreColor(truck.overallScore)}`}
                            >
                              {(truck.overallScore * 100).toFixed(0)}% Match
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          {truck.hasRefrigeration && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              Refrigerated
                            </span>
                          )}
                          {truck.hasLiftGate && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Lift Gate
                            </span>
                          )}
                          {truck.hasHazmatPermit && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              Hazmat
                            </span>
                          )}
                          {truck.driverName && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Driver: {truck.driverName}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600">
                          {truck.matchReason}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDetails(
                              showDetails === truck.truckId
                                ? null
                                : truck.truckId
                            );
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <FaInfoCircle className="w-4 h-4" />
                        </Button>
                        {selectedTruck?.truckId === truck.truckId && (
                          <FaCheck className="w-5 h-5 text-primary-500" />
                        )}
                      </div>
                    </div>

                    {/* Detailed Information */}
                    {showDetails === truck.truckId && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Truck Details
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                Capacity: {truck.capacityWeight}kg /{" "}
                                {truck.capacityVolume}m³
                              </div>
                              <div>Type: {truck.truckType || "Standard"}</div>
                              <div>Fuel: {truck.fuelType || "Diesel"}</div>
                              {truck.truckAge && (
                                <div>Age: {truck.truckAge} years</div>
                              )}
                              {truck.mileage && (
                                <div>
                                  Mileage: {truck.mileage.toLocaleString()} km
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Cost Breakdown
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div>
                                Base Cost: {formatCurrency(truck.estimatedCost)}
                              </div>
                              {truck.fuelCost && (
                                <div>
                                  Fuel: {formatCurrency(truck.fuelCost)}
                                </div>
                              )}
                              {truck.laborCost && (
                                <div>
                                  Labor: {formatCurrency(truck.laborCost)}
                                </div>
                              )}
                              {truck.insuranceCost && (
                                <div>
                                  Insurance:{" "}
                                  {formatCurrency(truck.insuranceCost)}
                                </div>
                              )}
                              {truck.tollsCost && (
                                <div>
                                  Tolls: {formatCurrency(truck.tollsCost)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                              Performance
                            </h4>
                            <div className="space-y-1 text-sm">
                              {truck.successProbability && (
                                <div>
                                  Success Rate:{" "}
                                  {(truck.successProbability * 100).toFixed(1)}%
                                </div>
                              )}
                              {truck.confidence && (
                                <div>
                                  Confidence:{" "}
                                  {(truck.confidence * 100).toFixed(1)}%
                                </div>
                              )}
                              {truck.ecoScore && (
                                <div>
                                  Eco Score: {(truck.ecoScore * 100).toFixed(1)}
                                  %
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selection Panel */}
          <div className="w-1/3 p-6 bg-gray-50">
            {selectedTruck ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      {selectedTruck.truckMake} {selectedTruck.truckModel}
                    </h4>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBackground(
                        selectedTruck.overallScore
                      )} ${getScoreColor(selectedTruck.overallScore)}`}
                    >
                      {(selectedTruck.overallScore * 100).toFixed(0)}% Match
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance:</span>
                      <span className="font-medium">
                        {formatDistance(selectedTruck.distanceKm)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transit Time:</span>
                      <span className="font-medium">
                        {selectedTruck.estimatedTransitTime
                          ? formatTime(selectedTruck.estimatedTransitTime)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-medium text-lg text-primary-600">
                        {formatCurrency(selectedTruck.estimatedCost)}
                      </span>
                    </div>
                    {selectedTruck.profitMargin && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit Margin:</span>
                        <span
                          className={`font-medium ${selectedTruck.profitMargin > 0
                            ? "text-green-600"
                            : "text-red-600"
                            }`}
                        >
                          {formatCurrency(selectedTruck.profitMargin)}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedTruck.driverName && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-1">
                        Driver
                      </h5>
                      <div className="text-sm text-gray-600">
                        <div>{selectedTruck.driverName}</div>
                        {selectedTruck.driverRating && (
                          <div className="flex items-center space-x-1">
                            <FaStar className="w-3 h-3 text-yellow-400" />
                            <span>
                              {selectedTruck.driverRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      {selectedTruck.matchReason}
                    </p>
                  </div>
                </div>

                <Button onClick={handleConfirmSelection} className="w-full">
                  Book This Truck
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <FaTruck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select a truck from the list to see details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog >
  );
};

export default TruckSelectionModal;
