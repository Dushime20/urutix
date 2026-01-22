import React, { useState, useEffect } from "react";
import {
  FaBox,
  FaThermometerHalf,
  FaExclamationTriangle,
  FaClock,
  FaRoute,
  FaShieldAlt,
  FaLocationArrow,
  FaBoxes,
  FaRulerCombined,
  FaDollarSign,
  FaChartLine,
  FaChartBar,
  FaChartPie,
  FaFilter,
  FaSearch,
  FaTruck,
  FaUsers,
  FaCheck,
  FaCalendar,
  FaGlobe,
  FaTrendingUp,
} from "react-icons/fa";
import MatchingInterface from "../MatchingInterface/MatchingInterface";
import FilterSelect from "@/components/common/FilterSelect";
import { enhancedMatchingApi } from "../../services/enhancedMatchingApi";
// import { Cargo } from '../../types/cargo';

// Temporary local interface to bypass module resolution issue
interface Cargo {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupLocation?: { name: string; address: string };
  deliveryLocation?: { name: string; address: string };
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
  loadingInstructions?: string;
  unloadingInstructions?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  length?: number;
  width?: number;
  height?: number;
  stackableHeight?: number;
  isStackable?: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  requiresHumidityControl?: boolean;
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  loadingTimeEstimate?: number;
  unloadingTimeEstimate?: number;
  hazmatClass?: string;
  hazmatNumber?: string;
  urgencyLevel?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isTimeCritical?: boolean;
  maxTransitTime?: number;
  packagingType?: string;
  numberOfPieces?: number;
  numberOfPallets?: number;
  requiresGpsMonitoring?: boolean;
  requiresTemperatureMonitoring?: boolean;
  insuranceValue?: number;
  requiresLowClearanceRoute?: boolean;
  maxClearanceHeight?: number;
  requiresEscortVehicle?: boolean;
  specialHandlingInstructions?: string;
  emergencyContactInfo?: string;
  truckRequirements?: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };
  carrierPreferences?: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };
  costPreferences?: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;
}

interface EnhancedCargoDashboardProps {
  cargos: Cargo[];
  loading?: boolean;
}

const EnhancedCargoDashboard: React.FC<EnhancedCargoDashboardProps> = ({
  cargos,
  loading = false
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");
  const [selectedCargoType, setSelectedCargoType] = useState("");
  const [showMatchingInterface, setShowMatchingInterface] = useState(false);
  const [selectedCargoForMatching, setSelectedCargoForMatching] = useState('');
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'profit' | 'performance' | 'market'>('overview');

  // Calculate analytics
  const totalCargos = cargos.length;
  const publishedCargos = cargos.filter(c => c.status === 'published').length;
  const createdCargos = cargos.filter(c => c.status === 'created').length;
  const inTransitCargos = cargos.filter(c => c.status === 'IN_TRANSIT').length;
  const deliveredCargos = cargos.filter(c => c.status === 'delivered').length;
  
  // Enhanced analytics
  const hazardousCargos = cargos.filter(c => c.isHazardous).length;
  const refrigeratedCargos = cargos.filter(c => c.requiresRefrigeration).length;
  const timeCriticalCargos = cargos.filter(c => c.isTimeCritical).length;
  const gpsMonitoredCargos = cargos.filter(c => c.requiresGpsMonitoring).length;
  
  // Urgency distribution
  const urgencyDistribution = {
    CRITICAL: cargos.filter(c => c.urgencyLevel === 'CRITICAL').length,
    HIGH: cargos.filter(c => c.urgencyLevel === 'HIGH').length,
    NORMAL: cargos.filter(c => c.urgencyLevel === 'NORMAL').length,
    LOW: cargos.filter(c => c.urgencyLevel === 'LOW').length,
  };

  // Cargo type distribution
  const cargoTypeDistribution = cargos.reduce((acc, cargo) => {
    acc[cargo.cargoType] = (acc[cargo.cargoType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Average values
  const avgWeight = cargos.length > 0 
    ? cargos.reduce((sum, c) => sum + (c.weight || 0), 0) / cargos.length 
    : 0;
  const avgValue = cargos.length > 0 
    ? cargos.reduce((sum, c) => sum + (c.loadValue || 0), 0) / cargos.length 
    : 0;

  // Advanced Analytics
  const profitMetrics = {
    totalRevenue: cargos.reduce((sum, c) => sum + (c.loadValue || 0), 0),
    totalCost: cargos.reduce((sum, c) => sum + ((c.offeredPrice || 0) * 0.7), 0), // Estimate 70% of offered price as cost
    profitMargin: cargos.length > 0 ? 
      ((cargos.reduce((sum, c) => sum + (c.loadValue || 0), 0) - 
        cargos.reduce((sum, c) => sum + ((c.offeredPrice || 0) * 0.7), 0)) / 
        cargos.reduce((sum, c) => sum + (c.loadValue || 0), 0)) * 100 : 0
  };

  // Performance Metrics
  const performanceMetrics = {
    onTimeDelivery: cargos.filter(c => c.status === 'delivered').length,
    delayedDeliveries: cargos.filter(c => c.status === 'IN_TRANSIT' && 
      new Date(c.deliveryDate) < new Date()).length,
    averageTransitTime: cargos.filter(c => c.status === 'delivered').length > 0 ?
      cargos.filter(c => c.status === 'delivered').reduce((sum, c) => {
        const transitTime = new Date(c.deliveryDate).getTime() - new Date(c.pickupDate).getTime();
        return sum + (transitTime / (1000 * 60 * 60 * 24)); // Convert to days
      }, 0) / cargos.filter(c => c.status === 'delivered').length : 0
  };

  // Market Intelligence
  const marketInsights = {
    highDemandRoutes: cargos.reduce((acc, cargo) => {
      const route = `${cargo.pickupLocation?.name || 'Unknown'} → ${cargo.deliveryLocation?.name || 'Unknown'}`;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    seasonalTrends: cargos.reduce((acc, cargo) => {
      const month = new Date(cargo.createdAt).getMonth();
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<number, number>)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'created': return 'bg-blue-500';
      case 'published': return 'bg-blue-500';
      case 'assigned': return 'bg-yellow-500';
      case 'IN_TRANSIT': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'NORMAL': return 'bg-blue-500';
      case 'LOW': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
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
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Cargo Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into your cargo operations</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect
            label="Time Range"
            value={selectedTimeRange}
            placeholder="Select range"
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "90d", label: "Last 90 days" },
              { value: "1y", label: "Last year" },
            ]}
            onChange={(value) => setSelectedTimeRange(value || "7d")}
            icon={<FaCalendar className="text-blue-500" />}
            className="min-w-[180px]"
          />
          <FilterSelect
            label="Cargo Type"
            value={selectedCargoType}
            placeholder="All cargo types"
            options={[
              { value: "GENERAL", label: "General" },
              { value: "HAZARDOUS", label: "Hazardous" },
              { value: "REFRIGERATED", label: "Refrigerated" },
              { value: "FRAGILE", label: "Fragile" },
            ]}
            onChange={setSelectedCargoType}
            icon={<FaBox className="text-purple-500" />}
            className="min-w-[180px]"
          />
        </div>
      </div>

      {/* Analytics View Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAnalyticsView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              analyticsView === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setAnalyticsView('profit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              analyticsView === 'profit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Profit Analysis
          </button>
          <button
            onClick={() => setAnalyticsView('performance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              analyticsView === 'performance'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setAnalyticsView('market')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              analyticsView === 'market'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Market Insights
          </button>
        </div>
      </div>

      {/* Dynamic Analytics Views */}
      {analyticsView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBox className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cargo</p>
                <p className="text-2xl font-bold text-gray-900">{totalCargos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hazardous Cargo</p>
                <p className="text-2xl font-bold text-gray-900">{hazardousCargos}</p>
                <p className="text-xs text-gray-500">
                  {totalCargos > 0 ? ((hazardousCargos / totalCargos) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaThermometerHalf className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Refrigerated</p>
                <p className="text-2xl font-bold text-gray-900">{refrigeratedCargos}</p>
                <p className="text-xs text-gray-500">
                  {totalCargos > 0 ? ((refrigeratedCargos / totalCargos) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="w-8 h-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Time Critical</p>
                <p className="text-2xl font-bold text-gray-900">{timeCriticalCargos}</p>
                <p className="text-xs text-gray-500">
                  {totalCargos > 0 ? ((timeCriticalCargos / totalCargos) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analyticsView === 'profit' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaDollarSign className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${profitMetrics.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaDollarSign className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-gray-900">${profitMetrics.totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaChartLine className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">{profitMetrics.profitMargin.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">
                  {profitMetrics.profitMargin > 20 ? 'Excellent' : profitMetrics.profitMargin > 10 ? 'Good' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBox className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Cargo Value</p>
                <p className="text-2xl font-bold text-gray-900">${avgValue.toFixed(0)}</p>
                <p className="text-xs text-gray-500">
                  Per shipment
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analyticsView === 'performance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCheck className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                <p className="text-2xl font-bold text-gray-900">{performanceMetrics.onTimeDelivery}</p>
                <p className="text-xs text-gray-500">
                  {performanceMetrics.onTimeDelivery > 0 ? 
                    ((performanceMetrics.onTimeDelivery / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) * 100).toFixed(1) : 0}% success rate
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaClock className="w-8 h-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delayed Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{performanceMetrics.delayedDeliveries}</p>
                <p className="text-xs text-gray-500">
                  {performanceMetrics.delayedDeliveries > 0 ? 'Needs attention' : 'All on time'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaRoute className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Transit Time</p>
                <p className="text-2xl font-bold text-gray-900">{performanceMetrics.averageTransitTime.toFixed(1)}</p>
                <p className="text-xs text-gray-500">
                  Days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTruck className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Shipments</p>
                <p className="text-2xl font-bold text-gray-900">{inTransitCargos}</p>
                <p className="text-xs text-gray-500">
                  Currently in transit
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analyticsView === 'market' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaChartBar className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Demand Routes</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(marketInsights.highDemandRoutes).length}</p>
                <p className="text-xs text-gray-500">
                  Popular corridors
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCalendar className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Peak Season</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.entries(marketInsights.seasonalTrends).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  Month with highest demand
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaGlobe className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Regions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set([...cargos.map(c => c.pickupLocation?.name), ...cargos.map(c => c.deliveryLocation?.name)].filter(Boolean)).size}
                </p>
                <p className="text-xs text-gray-500">
                  Unique locations
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaTrendingUp className="w-8 h-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Market Growth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cargos.length > 0 ? 
                    ((cargos.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length / 
                     cargos.filter(c => new Date(c.createdAt) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)).length) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500">
                  Month-over-month growth
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaChartPie className="w-5 h-5 mr-2" />
            Cargo Status Distribution
          </h3>
          <div className="space-y-3">
            {[
              { status: 'draft', count: cargos.filter(c => c.status === 'draft').length, label: 'Draft' },
        { status: 'created', count: createdCargos, label: 'Created' },
        { status: 'published', count: publishedCargos, label: 'Published' },
              { status: 'assigned', count: cargos.filter(c => c.status === 'assigned').length, label: 'Assigned' },
              { status: 'IN_TRANSIT', count: inTransitCargos, label: 'In Transit' },
              { status: 'delivered', count: deliveredCargos, label: 'Delivered' },
              { status: 'cancelled', count: cargos.filter(c => c.status === 'cancelled').length, label: 'Cancelled' },
            ].map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`}></div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">
                    ({totalCargos > 0 ? ((item.count / totalCargos) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaChartBar className="w-5 h-5 mr-2" />
            Urgency Level Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(urgencyDistribution).map(([urgency, count]) => (
              <div key={urgency} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getUrgencyColor(urgency)}`}></div>
                  <span className="text-sm text-gray-700">{urgency}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                  <span className="text-xs text-gray-500">
                    ({totalCargos > 0 ? ((count / totalCargos) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Features Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaShieldAlt className="w-5 h-5 mr-2" />
            Security & Monitoring
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaLocationArrow className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">GPS Monitoring</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{gpsMonitoredCargos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaThermometerHalf className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Temperature Monitoring</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {cargos.filter(c => c.requiresTemperatureMonitoring).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaRoute className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700">Low Clearance Route</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {cargos.filter(c => c.requiresLowClearanceRoute).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaRulerCombined className="w-5 h-5 mr-2" />
            Dimensional Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaBoxes className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-gray-700">Stackable Cargo</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {cargos.filter(c => c.isStackable).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaBox className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">Fragile Cargo</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {cargos.filter(c => c.isFragile).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaTruck className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">Forklift Required</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {cargos.filter(c => c.requiresForklift).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaDollarSign className="w-5 h-5 mr-2" />
            Financial Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Average Weight</span>
              <span className="text-sm font-medium text-gray-900">{avgWeight.toFixed(0)} kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Average Value</span>
              <span className="text-sm font-medium text-gray-900">${avgValue.toFixed(0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Total Value</span>
              <span className="text-sm font-medium text-gray-900">
                ${cargos.reduce((sum, c) => sum + (c.loadValue || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cargo Type Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaChartLine className="w-5 h-5 mr-2" />
          Cargo Type Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(cargoTypeDistribution).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{type}</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-gray-900">{count}</span>
                <span className="text-xs text-gray-500">
                  ({totalCargos > 0 ? ((count / totalCargos) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Profit Insights */}
      {analyticsView === 'profit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="w-5 h-5 mr-2" />
              Profit Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Total Revenue</span>
                <span className="text-lg font-bold text-green-600">${profitMetrics.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Total Cost</span>
                <span className="text-lg font-bold text-red-600">${profitMetrics.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Net Profit</span>
                <span className="text-lg font-bold text-blue-600">
                  ${(profitMetrics.totalRevenue - profitMetrics.totalCost).toLocaleString()}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Profit Margin</span>
                  <span className={`font-medium ${
                    profitMetrics.profitMargin > 20 ? 'text-green-600' : 
                    profitMetrics.profitMargin > 10 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {profitMetrics.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {profitMetrics.profitMargin > 20 ? 'Excellent profitability' : 
                   profitMetrics.profitMargin > 10 ? 'Good profitability' : 'Consider cost optimization'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaDollarSign className="w-5 h-5 mr-2" />
              Revenue Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Average Cargo Value</span>
                <span className="text-lg font-bold text-purple-600">${avgValue.toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Total Shipments</span>
                <span className="text-lg font-bold text-gray-900">{totalCargos}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Revenue Insights:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• {avgValue > 1000 ? 'High-value' : avgValue > 500 ? 'Medium-value' : 'Low-value'} cargo focus</li>
                    <li>• {totalCargos > 0 ? `${(profitMetrics.totalRevenue / totalCargos).toFixed(0)} average revenue per shipment` : 'No shipments'}</li>
                    <li>• {profitMetrics.profitMargin > 15 ? 'Strong pricing strategy' : 'Consider price optimization'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {analyticsView === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartPie className="w-5 h-5 mr-2" />
              Delivery Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">On-Time Deliveries</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{performanceMetrics.onTimeDelivery}</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {performanceMetrics.onTimeDelivery > 0 ? 
                      ((performanceMetrics.onTimeDelivery / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Delayed Deliveries</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{performanceMetrics.delayedDeliveries}</span>
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                    {performanceMetrics.delayedDeliveries > 0 ? 
                      ((performanceMetrics.delayedDeliveries / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Performance Rating</span>
                  <span className={`font-medium ${
                    (performanceMetrics.onTimeDelivery / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) > 0.9 ? 'text-green-600' :
                    (performanceMetrics.onTimeDelivery / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) > 0.8 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {performanceMetrics.onTimeDelivery > 0 ? 
                      (performanceMetrics.onTimeDelivery / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) > 0.9 ? 'Excellent' :
                      (performanceMetrics.onTimeDelivery / (performanceMetrics.onTimeDelivery + performanceMetrics.delayedDeliveries)) > 0.8 ? 'Good' : 'Needs Improvement'
                    : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaRoute className="w-5 h-5 mr-2" />
              Transit Time Analysis
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Average Transit Time</span>
                <span className="text-lg font-bold text-gray-900">{performanceMetrics.averageTransitTime.toFixed(1)} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Active Shipments</span>
                <span className="text-lg font-bold text-blue-600">{inTransitCargos}</span>
              </div>
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Transit Time Insights:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• {performanceMetrics.averageTransitTime < 3 ? 'Fast' : performanceMetrics.averageTransitTime < 7 ? 'Standard' : 'Extended'} delivery times</li>
                    <li>• {inTransitCargos > 0 ? `${inTransitCargos} shipments currently in transit` : 'No active shipments'}</li>
                    <li>• {performanceMetrics.averageTransitTime > 0 ? 'Consider route optimization' : 'No delivery data available'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Insights Charts */}
      {analyticsView === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartBar className="w-5 h-5 mr-2" />
              High Demand Routes
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(marketInsights.highDemandRoutes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([route, count]) => (
                  <div key={route} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1">{route}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / Math.max(...Object.values(marketInsights.highDemandRoutes))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-[3rem]">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FaChartLine className="w-5 h-5 mr-2" />
              Seasonal Trends
            </h3>
            <div className="space-y-3">
              {Object.entries(marketInsights.seasonalTrends)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([month, count]) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const monthName = monthNames[Number(month)];
                  const maxCount = Math.max(...Object.values(marketInsights.seasonalTrends));
                  return (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 w-12">{monthName}</span>
                      <div className="flex items-center space-x-2 flex-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 min-w-[3rem]">{count}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Matching Interface Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaUsers className="w-5 h-5 mr-2" />
              Cargo-Truck Matching
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Find optimal truck matches for your cargo with AI-powered recommendations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMatchingInterface(!showMatchingInterface)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showMatchingInterface ? 'Hide Matching' : 'Show Matching'}
            </button>
          </div>
        </div>

        {showMatchingInterface && (
          <div className="border-t pt-6">
            {cargos.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">Select Cargo:</label>
                  <select
                    value={selectedCargoForMatching}
                    onChange={(e) => setSelectedCargoForMatching(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a cargo...</option>
                    {cargos
                      .filter(cargo => ['created', 'published'].includes(cargo.status))
                      .map(cargo => (
                        <option key={cargo.id} value={cargo.id}>
                          {cargo.title} - {cargo.cargoType} ({cargo.weight}kg)
                        </option>
                      ))}
                  </select>
                </div>

                {selectedCargoForMatching && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <MatchingInterface
                      loadId={selectedCargoForMatching}
                      onMatchSelect={async (match) => {
                        try {
                          await enhancedMatchingApi.requestMatch(selectedCargoForMatching, match.truckId);
                          alert('Request sent to Truck Owner! Wait for acceptance.');
                        } catch (error) {
                          console.error('Error requesting match:', error);
                          alert('Failed to send request. Please try again.');
                        }
                      }}
                      showAdvancedFeatures={true}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaBox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No cargo available for matching</p>
                <p className="text-sm">Create some cargo first to use the matching system</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCargoDashboard; 