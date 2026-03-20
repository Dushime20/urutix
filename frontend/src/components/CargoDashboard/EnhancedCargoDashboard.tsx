import React, { useState } from "react";
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
  FaGlobe,
  FaArrowUp,
  FaCalendar,
  FaCheck,
  FaTruck,
  FaChartPie,
  FaUsers,
} from "react-icons/fa";
import MatchingInterface from "../MatchingInterface/MatchingInterface";
import FilterSelect from "@/components/common/FilterSelect";
import { enhancedMatchingApi } from "../../services/enhancedMatchingApi";
import TruckOwnerPerformance from "../TenantDashboard/TruckOwnerPerformance";
import PredictiveLogistics from "../Analytics/PredictiveLogistics";

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
  const [analyticsView, setAnalyticsView] = useState<'overview' | 'profitability' | 'performance' | 'predictive' | 'market'>('overview');

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
      case 'created': return 'bg-primary-500';
      case 'published': return 'bg-primary-500';
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
      case 'NORMAL': return 'bg-primary-500';
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
          <h2 className="text-2xl font-bold text-gray-900">Cargo Analytics</h2>
          <p className="text-gray-600 mt-1">Detailed insights into your cargo shipments</p>
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
            icon={<FaCalendar className="text-primary-500" />}
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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${analyticsView === 'overview'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setAnalyticsView('performance')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${analyticsView === 'performance'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Performance
          </button>
          <button
            onClick={() => setAnalyticsView('profitability')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${analyticsView === 'profitability'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Profitability
          </button>
          <button
            onClick={() => setAnalyticsView('predictive')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${analyticsView === 'predictive'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Predictive AI
          </button>
        </div>
      </div>

      {/* Dynamic Analytics Views */}
      {analyticsView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaBox className="w-8 h-8 text-primary-500" />
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
                <FaThermometerHalf className="w-8 h-8 text-primary-500" />
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

      {analyticsView === 'profitability' && (
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
                <FaChartLine className="w-8 h-8 text-primary-500" />
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

      {analyticsView === 'predictive' && (
        <PredictiveLogistics />
      )}

      {analyticsView === 'performance' && (
        <>
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
                  <p className="text-sm font-medium text-gray-600">Late Deliveries</p>
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
                  <FaRoute className="w-8 h-8 text-primary-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transit Time (Avg)</p>
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
          <div className="mt-8">
            <TruckOwnerPerformance />
          </div>
        </>
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
                <FaCalendar className="w-8 h-8 text-primary-500" />
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
                <FaArrowUp className="w-8 h-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Market Growth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {cargos.length > 0 ?
                    ((cargos.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length /
                      Math.max(cargos.filter(c => new Date(c.createdAt) > new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)).length, 1)) * 100).toFixed(1) : 0}%
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
            Security
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
                <FaThermometerHalf className="w-4 h-4 text-primary-500" />
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
            Dimensions
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
                <FaBox className="w-4 h-4 text-primary-500" />
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
            Financials
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
    </div>
  );
};

export default EnhancedCargoDashboard;