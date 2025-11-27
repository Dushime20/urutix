import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FaDollarSign, 
  FaGasPump, 
  FaRoute, 
  FaUser, 
  FaTools,
  FaChartLine,
  FaCalculator
} from 'react-icons/fa';
import { tripsAPI } from '../../services/api';

interface TripCostAnalysisProps {
  tripId?: string;
  onTripSelect?: (tripId: string) => void;
}

interface CostBreakdown {
  fuelCost: number;
  tollsCost: number;
  driverWages: number;
  maintenanceCost: number;
  insuranceCost: number;
  otherExpenses: number;
  totalCost: number;
}

interface ProfitabilityAnalysis {
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  breakEvenRevenue: number;
  recommendedBid: number;
}

const TripCostAnalysis: React.FC<TripCostAnalysisProps> = ({ tripId, onTripSelect }) => {
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(tripId);
  const [costInputs, setCostInputs] = useState<CostBreakdown>({
    fuelCost: 0,
    tollsCost: 0,
    driverWages: 0,
    maintenanceCost: 0,
    insuranceCost: 0,
    otherExpenses: 0,
    totalCost: 0,
  });

  // Fetch trips for selection
  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'all'],
    queryFn: () => tripsAPI.getAll({ status: 'PLANNED,IN_PROGRESS' }),
    enabled: !selectedTripId,
  });

  // Fetch selected trip details
  const { data: tripData, isLoading } = useQuery({
    queryKey: ['trip', selectedTripId],
    queryFn: () => tripsAPI.getById(selectedTripId!),
    enabled: !!selectedTripId,
  });

  const trip = tripData?.data?.trip || tripData?.trip;

  // Calculate costs based on trip data
  React.useEffect(() => {
    if (trip) {
      const distance = trip.totalDistance || 0; // km
      const fuelEfficiency = trip.fuelEfficiency || 25; // L/100km
      const fuelPricePerLiter = 1.2; // USD per liter (can be made configurable)
      
      const fuelCost = (distance / 100) * fuelEfficiency * fuelPricePerLiter;
      const tollsCost = trip.tollsCost || (distance * 0.05); // $0.05 per km estimate
      const driverWages = (distance / 100) * 50; // $50 per 100km estimate
      const maintenanceCost = (distance / 1000) * 10; // $10 per 1000km
      const insuranceCost = trip.agreedPrice * 0.02; // 2% of trip value
      const otherExpenses = trip.otherExpenses || 0;

      setCostInputs({
        fuelCost: Math.round(fuelCost * 100) / 100,
        tollsCost: Math.round(tollsCost * 100) / 100,
        driverWages: Math.round(driverWages * 100) / 100,
        maintenanceCost: Math.round(maintenanceCost * 100) / 100,
        insuranceCost: Math.round(insuranceCost * 100) / 100,
        otherExpenses: Math.round(otherExpenses * 100) / 100,
        totalCost: 0, // Will be calculated
      });
    }
  }, [trip]);

  // Calculate total cost
  const totalCost = React.useMemo(() => {
    return Object.values(costInputs).reduce((sum, cost) => {
      return sum + (typeof cost === 'number' && cost !== costInputs.totalCost ? cost : 0);
    }, 0);
  }, [costInputs]);

  // Calculate profitability
  const profitability: ProfitabilityAnalysis = React.useMemo(() => {
    const revenue = trip?.agreedPrice || 0;
    const profit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const breakEvenRevenue = totalCost;
    const recommendedBid = totalCost * 1.15; // 15% margin

    return {
      revenue,
      totalCost,
      profit,
      profitMargin: Math.round(profitMargin * 10) / 10,
      breakEvenRevenue: Math.round(breakEvenRevenue * 100) / 100,
      recommendedBid: Math.round(recommendedBid * 100) / 100,
    };
  }, [trip, totalCost]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCostChange = (field: keyof CostBreakdown, value: number) => {
    setCostInputs(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!selectedTripId && !tripId) {
    return (
      <div className="bg-white rounded-md border border-gray-200 p-4">
        <div className="text-center py-8">
          <FaCalculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">Select a trip to analyze costs</p>
          <select
            onChange={(e) => {
              const id = e.target.value;
              setSelectedTripId(id);
              onTripSelect?.(id);
            }}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="">Select a trip...</option>
            {tripsData?.data?.trips?.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.tripNumber} - {t.load?.title || 'Untitled Load'}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trip Selection */}
      {!tripId && (
        <div className="bg-white rounded-md border border-gray-200 p-3">
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Select Trip
          </label>
          <select
            value={selectedTripId || ''}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedTripId(id);
              onTripSelect?.(id);
            }}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
          >
            <option value="">Select a trip...</option>
            {tripsData?.data?.trips?.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.tripNumber} - {t.load?.title || 'Untitled Load'}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-2">Loading trip data...</p>
        </div>
      ) : trip ? (
        <>
          {/* Trip Info */}
          <div className="bg-white rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {trip.tripNumber}
              </h3>
              <span className="text-xs text-gray-500">
                {trip.load?.title || 'Untitled Load'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Distance:</span>{' '}
                <span className="font-medium text-gray-900">
                  {trip.totalDistance?.toFixed(0) || 'N/A'} km
                </span>
              </div>
              <div>
                <span className="text-gray-500">Agreed Price:</span>{' '}
                <span className="font-medium text-gray-900">
                  {formatCurrency(trip.agreedPrice || 0, trip.currencyCode || 'USD')}
                </span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-white rounded-md border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Cost Breakdown</h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaGasPump className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">Fuel Cost</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={costInputs.fuelCost}
                  onChange={(e) => handleCostChange('fuelCost', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaRoute className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">Tolls</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={costInputs.tollsCost}
                  onChange={(e) => handleCostChange('tollsCost', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaUser className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">Driver Wages</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={costInputs.driverWages}
                  onChange={(e) => handleCostChange('driverWages', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaTools className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">Maintenance</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={costInputs.maintenanceCost}
                  onChange={(e) => handleCostChange('maintenanceCost', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">Insurance</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={costInputs.insuranceCost}
                  onChange={(e) => handleCostChange('insuranceCost', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaDollarSign className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs text-gray-600">Other Expenses</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={costInputs.otherExpenses}
                  onChange={(e) => handleCostChange('otherExpenses', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-right"
                />
              </div>
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">Total Cost</span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(totalCost, trip.currencyCode || 'USD')}
                </span>
              </div>
            </div>
          </div>

          {/* Profitability Analysis */}
          <div className="bg-white rounded-md border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Profitability Analysis</h3>
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-md p-2">
                  <p className="text-[10px] text-gray-500 mb-0.5">Revenue</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(profitability.revenue, trip.currencyCode || 'USD')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-2">
                  <p className="text-[10px] text-gray-500 mb-0.5">Total Cost</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(profitability.totalCost, trip.currencyCode || 'USD')}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-2">
                <p className="text-[10px] text-gray-500 mb-0.5">Profit</p>
                <p className={`text-base font-bold ${
                  profitability.profit >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}>
                  {formatCurrency(profitability.profit, trip.currencyCode || 'USD')}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Profit Margin</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        profitability.profitMargin >= 20 ? 'bg-gray-600' :
                        profitability.profitMargin >= 10 ? 'bg-gray-500' :
                        profitability.profitMargin >= 0 ? 'bg-gray-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, profitability.profitMargin))}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${
                    profitability.profitMargin >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {profitability.profitMargin}%
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Break-Even Revenue</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(profitability.breakEvenRevenue, trip.currencyCode || 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Recommended Bid (15% margin)</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(profitability.recommendedBid, trip.currencyCode || 'USD')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 p-8 text-center">
          <FaCalculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Trip not found</p>
        </div>
      )}
    </div>
  );
};

export default TripCostAnalysis;

