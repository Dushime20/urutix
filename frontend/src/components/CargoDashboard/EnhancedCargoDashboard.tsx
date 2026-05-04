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
import { cn } from "@/utils/cn";
import ModernLoader from "../common/ModernLoader";
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
    return <ModernLoader isLoading={true} type="dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Header - Enlite Prime Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#345E85] flex items-center justify-center shadow-lg shadow-blue-900/20">
            <FaChartLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Cargo Analytics</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Neural_Insights & Protocol_Data</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <FilterSelect
            label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Time_Scope</span>}
            value={selectedTimeRange}
            placeholder="Select range"
            options={[
              { value: "7d", label: "7 DAYS" },
              { value: "30d", label: "30 DAYS" },
              { value: "90d", label: "90 DAYS" },
              { value: "1y", label: "1 YEAR" },
            ]}
            onChange={(value) => setSelectedTimeRange(value || "7d")}
            icon={<FaCalendar className="text-slate-400" />}
            className="w-full sm:min-w-[140px]"
            selectClassName="rounded-xl border-slate-100 bg-slate-50/50 py-2.5 font-bold text-[11px]"
          />
          <FilterSelect
            label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Payload_Category</span>}
            value={selectedCargoType}
            placeholder="ALL TYPES"
            options={[
              { value: "GENERAL", label: "GENERAL" },
              { value: "HAZARDOUS", label: "HAZARDOUS" },
              { value: "REFRIGERATED", label: "REFRIGERATED" },
              { value: "FRAGILE", label: "FRAGILE" },
            ]}
            onChange={setSelectedCargoType}
            icon={<FaBox className="text-slate-400" />}
            className="w-full sm:min-w-[140px]"
            selectClassName="rounded-xl border-slate-100 bg-slate-50/50 py-2.5 font-bold text-[11px]"
          />
        </div>
      </div>

      {/* Analytics View Selector - Prime Hub */}
      <div className="relative group">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar py-2 px-1 -mx-1">
          {[
            { id: 'overview', label: 'Overview', icon: FaChartPie },
            { id: 'performance', label: 'Performance', icon: FaChartBar },
            { id: 'profitability', label: 'Profitability', icon: FaDollarSign },
            { id: 'predictive', label: 'Predictive', icon: FaGlobe },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAnalyticsView(tab.id as any)}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 whitespace-nowrap active:scale-95",
                analyticsView === tab.id
                  ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10'
                  : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
              )}
            >
              {analyticsView === tab.id && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>

      {/* Dynamic Analytics Views */}
      {analyticsView === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                <FaBox className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total_Payload</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{totalCargos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                <FaExclamationTriangle className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hazardous_Scan</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{hazardousCargos}</p>
                <p className="text-[8px] font-bold text-rose-400 uppercase tracking-widest mt-0.5">
                  {totalCargos > 0 ? ((hazardousCargos / totalCargos) * 100).toFixed(1) : 0}% Protocol_Share
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                <FaThermometerHalf className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thermal_Critical</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{refrigeratedCargos}</p>
                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                  {totalCargos > 0 ? ((refrigeratedCargos / totalCargos) * 100).toFixed(1) : 0}% Volume_Ratio
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                <FaClock className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time_Critical</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{timeCriticalCargos}</p>
                <p className="text-[8px] font-bold text-orange-400 uppercase tracking-widest mt-0.5">
                  {totalCargos > 0 ? ((timeCriticalCargos / totalCargos) * 100).toFixed(1) : 0}% Active_Demand
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analyticsView === 'profitability' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <FaDollarSign className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capital_Flow</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">${profitMetrics.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#345E85]/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white transition-all duration-300">
                <FaChartLine className="w-5 h-5" />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol_Margin</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{profitMetrics.profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative sm:col-span-2">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#345E85]/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between h-full">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-purple-500">
                  <FaChartBar className="w-5 h-5" />
                </div>
                <div className="ml-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency_Score</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">8.4<span className="text-xs text-slate-400">/10</span></p>
                </div>
              </div>
              <div className="hidden sm:block h-full w-40 bg-slate-50/50 rounded-2xl border border-slate-100 p-3">
                 <div className="h-full w-full rounded-xl bg-[#345E85]/10 flex items-end gap-1 px-2">
                    <div className="h-3/4 w-full bg-[#345E85] rounded-t-lg" />
                    <div className="h-1/2 w-full bg-slate-300 rounded-t-lg" />
                    <div className="h-[90%] w-full bg-[#345E85]/40 rounded-t-lg" />
                 </div>
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