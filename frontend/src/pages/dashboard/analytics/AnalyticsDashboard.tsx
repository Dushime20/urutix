import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { analyticsApi } from '../../../services/analyticsApi';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  DollarSign,
  Clock,
  MapPin,
  Target,
  Award,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Zap,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_6_months'>('last_30_days');
  const [selectedMetric, setSelectedMetric] = useState<'shipments' | 'cost' | 'efficiency'>('shipments');

  // Fetch real data from backend
  const { data: costTrends, isLoading: trendsLoading, error: trendsError } = useQuery({
    queryKey: ['analytics', 'cost-trends', user?.tenantId, timeRange],
    queryFn: async () => {
      console.log('📊 [Cost Trends] Fetching with params:', { timeRange, groupBy: 'week', tenantId: user?.tenantId });
      const result = await analyticsApi.getCostTrends({ timeRange, groupBy: 'week' });
      console.log('📊 [Cost Trends] Response:', result);
      return result;
    },
    enabled: !!user?.tenantId
  });

  const { data: financialSummary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['analytics', 'financial-summary', user?.tenantId, timeRange],
    queryFn: async () => {
      console.log('📊 [Financial Summary] Fetching with params:', { timeRange, tenantId: user?.tenantId });
      const result = await analyticsApi.getFinancialSummary({ timeRange });
      console.log('📊 [Financial Summary] Response:', result);
      return result;
    },
    enabled: !!user?.tenantId
  });

  const { data: operationalPerformance, isLoading: performanceLoading, error: performanceError } = useQuery({
    queryKey: ['analytics', 'operational-performance', user?.tenantId],
    queryFn: async () => {
      console.log('📊 [Operational Performance] Fetching for tenantId:', user?.tenantId);
      const result = await analyticsApi.getOperationalPerformance();
      console.log('📊 [Operational Performance] Response:', result);
      return result;
    },
    enabled: !!user?.tenantId
  });

  const { data: routePerformance, isLoading: routesLoading, error: routesError } = useQuery({
    queryKey: ['analytics', 'route-performance', user?.tenantId],
    queryFn: async () => {
      console.log('📊 [Route Performance] Fetching for tenantId:', user?.tenantId);
      const result = await analyticsApi.getRoutePerformance();
      console.log('📊 [Route Performance] Response:', result);
      return result;
    },
    enabled: !!user?.tenantId
  });

  const { data: carrierPerformance, isLoading: carriersLoading, error: carriersError } = useQuery({
    queryKey: ['analytics', 'carrier-performance', user?.tenantId],
    queryFn: async () => {
      console.log('📊 [Carrier Performance] Fetching for tenantId:', user?.tenantId);
      const result = await analyticsApi.getCarrierPerformance();
      console.log('📊 [Carrier Performance] Response:', result);
      return result;
    },
    enabled: !!user?.tenantId
  });

  const { data: aiInsights, isLoading: insightsLoading, error: insightsError } = useQuery({
    queryKey: ['analytics', 'ai-insights', user?.tenantId],
    queryFn: async () => {
      console.log('📊 [AI Insights] Fetching for tenantId:', user?.tenantId);
      const result = await analyticsApi.getComprehensiveAIInsights();
      console.log('📊 [AI Insights] Response:', result);
      return result;
    },
    enabled: !!user?.tenantId
  });

  // Log errors
  React.useEffect(() => {
    if (trendsError) console.error('❌ [Cost Trends] Error:', trendsError);
    if (summaryError) console.error('❌ [Financial Summary] Error:', summaryError);
    if (performanceError) console.error('❌ [Operational Performance] Error:', performanceError);
    if (routesError) console.error('❌ [Route Performance] Error:', routesError);
    if (carriersError) console.error('❌ [Carrier Performance] Error:', carriersError);
    if (insightsError) console.error('❌ [AI Insights] Error:', insightsError);
  }, [trendsError, summaryError, performanceError, routesError, carriersError, insightsError]);

  // Debug logging
  React.useEffect(() => {
    console.log('📊 ========== ANALYTICS DASHBOARD DATA ==========');
    console.log('📊 User Info:', { tenantId: user?.tenantId, userId: user?.id, role: user?.role });
    console.log('📊 Time Range:', timeRange);
    console.log('📊 Loading States:', {
      trendsLoading,
      summaryLoading,
      performanceLoading,
      routesLoading,
      carriersLoading,
      insightsLoading,
    });
    console.log('📊 Errors:', {
      trendsError,
      summaryError,
      performanceError,
      routesError,
      carriersError,
      insightsError,
    });
    console.log('📊 Raw Data:', {
      costTrends,
      financialSummary,
      operationalPerformance,
      routePerformance: routePerformance?.length || 0,
      carrierPerformance: carrierPerformance?.length || 0,
      aiInsights,
    });
    console.log('📊 ===============================================');
  }, [
    user,
    timeRange,
    costTrends,
    financialSummary,
    operationalPerformance,
    routePerformance,
    carrierPerformance,
    aiInsights,
    trendsLoading,
    summaryLoading,
    performanceLoading,
    routesLoading,
    carriersLoading,
    insightsLoading,
    trendsError,
    summaryError,
    performanceError,
    routesError,
    carriersError,
    insightsError,
  ]);

  const isLoading = trendsLoading || summaryLoading || performanceLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

  // Calculate KPIs from real data
  const keyMetrics = {
    totalShipments: financialSummary?.totalShipments || operationalPerformance?.totalShipments || 0,
    avgCostPerShipment: financialSummary?.averageCostPerShipment || 0,
    onTimeDelivery: operationalPerformance?.onTimeRate || 0,
    costSavings: Math.abs(financialSummary?.spendingChange?.amount || 0),
    shipmentGrowth: Math.abs(costTrends?.costChangePercentage || 0),
    costReduction: Math.abs(financialSummary?.spendingChange?.percentage || 0),
    efficiency: operationalPerformance?.efficiencyScore || 0,
  };

  // Transform cost trends data for charts
  const shipmentTrends = costTrends?.trends?.map(trend => ({
    month: new Date(trend.date).toLocaleDateString('en-US', { month: 'short' }),
    shipments: trend.shipmentCount,
    cost: trend.totalCost,
  })) || [];

  // Mock year-over-year comparison (would need additional API endpoint)
  const monthlyComparison = [
    { month: 'Jan', lastYear: 45, thisYear: 52 },
    { month: 'Feb', lastYear: 52, thisYear: 61 },
    { month: 'Mar', lastYear: 48, thisYear: 58 },
    { month: 'Apr', lastYear: 61, thisYear: 73 },
    { month: 'May', lastYear: 55, thisYear: 69 },
    { month: 'Jun', lastYear: 67, thisYear: 81 },
  ];

  // Transform operational performance for radar chart
  const performanceRadar = [
    { metric: 'On-Time', value: operationalPerformance?.onTimeRate || 0 },
    { metric: 'Cost Efficiency', value: operationalPerformance?.efficiencyScore || 0 },
    { metric: 'Quality', value: operationalPerformance ? (100 - (operationalPerformance.damageRate || 0)) : 0 },
    { metric: 'Carrier Network', value: operationalPerformance?.activeCarriers ? Math.min(100, operationalPerformance.activeCarriers * 10) : 0 },
    { metric: 'Route Coverage', value: operationalPerformance?.activeRoutes ? Math.min(100, operationalPerformance.activeRoutes * 5) : 0 },
  ];

  // Transform financial summary for cost breakdown
  const costBreakdown = financialSummary?.topCategories?.map((cat, index) => ({
    category: cat.category,
    amount: cat.amount,
    value: cat.percentage,
    trend: index % 2 === 0 ? -5 : 3, // Mock trend data
  })) || [];

  // Transform route performance data
  const topRoutes = routePerformance?.slice(0, 5).map(route => ({
    route: route.route,
    shipments: route.shipmentCount,
    onTime: Math.round(route.onTimeRate * 100),
    avgCost: route.averageCost,
    savings: 5, // Mock savings percentage
  })) || [];

  // Transform carrier performance data
  const topCarriers = carrierPerformance?.slice(0, 5).map(carrier => ({
    carrier: `Carrier ${carrier.carrierId.slice(0, 8)}`,
    rating: carrier.averageRating.toFixed(1),
    onTime: Math.round(carrier.onTimeRate * 100),
    avgCost: carrier.averageCost,
    shipments: carrier.totalShipments,
  })) || [];

  // Transform AI insights
  const aiInsightsList = [
    {
      title: 'Cost Optimization',
      description: aiInsights?.costPredictions?.reason || 'Analyzing cost patterns...',
    },
    {
      title: 'Route Recommendations',
      description: aiInsights?.routeOptimizations?.[0]?.recommendations?.[0] || 'Evaluating route efficiency...',
    },
    {
      title: 'Risk Alerts',
      description: aiInsights?.riskAlerts?.[0]?.message || 'Monitoring for potential issues...',
    },
  ];

  // Log transformed data for debugging
  React.useEffect(() => {
    console.log('📊 ========== TRANSFORMED DATA FOR UI ==========');
    console.log('📊 Key Metrics:', keyMetrics);
    console.log('📊 Shipment Trends (Chart Data):', shipmentTrends);
    console.log('📊 Performance Radar:', performanceRadar);
    console.log('📊 Cost Breakdown:', costBreakdown);
    console.log('📊 Top Routes:', topRoutes);
    console.log('📊 Top Carriers:', topCarriers);
    console.log('📊 AI Insights List:', aiInsightsList);
    console.log('📊 ===============================================');
  }, [keyMetrics, shipmentTrends, performanceRadar, costBreakdown, topRoutes, topCarriers, aiInsightsList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
            <p className="text-gray-600">Performance metrics, trends, and optimization opportunities</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 font-semibold transition-all flex items-center gap-2 shadow-lg">
              <Download className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mt-4">
          {[
            { value: 'last_7_days', label: '7 Days' },
            { value: 'last_30_days', label: '30 Days' },
            { value: 'last_90_days', label: '90 Days' },
            { value: 'last_6_months', label: '6 Months' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                timeRange === range.value
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm animate-pulse">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-violet-100 rounded-xl p-3">
                <Package className="w-6 h-6 text-violet-600" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                +{keyMetrics.shipmentGrowth.toFixed(1)}%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Shipments</p>
            <p className="text-3xl font-bold text-gray-900">{keyMetrics.totalShipments}</p>
            <p className="text-xs text-gray-500 mt-2">vs previous period</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-emerald-100 rounded-xl p-3">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                {keyMetrics.costReduction > 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4" />
                    -{keyMetrics.costReduction.toFixed(1)}%
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    +{Math.abs(keyMetrics.costReduction).toFixed(1)}%
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Avg Cost/Shipment</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(keyMetrics.avgCostPerShipment)}</p>
            <p className="text-xs text-gray-500 mt-2">Cost tracking</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-xl p-3">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
                <TrendingUp className="w-4 h-4" />
                +2.5%
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">On-Time Delivery</p>
            <p className="text-3xl font-bold text-gray-900">{keyMetrics.onTimeDelivery.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-2">Industry avg: 87%</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Zap className="w-6 h-6" />
              </div>
              <Award className="w-6 h-6 text-rose-100" />
            </div>
            <p className="text-rose-100 text-sm mb-1">Cost Change</p>
            <p className="text-3xl font-bold">{formatCurrency(keyMetrics.costSavings)}</p>
            <p className="text-xs text-rose-100 mt-2">This period</p>
          </div>
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Shipment & Cost Trends */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Shipment & Cost Trends</h3>
              <p className="text-sm text-gray-600">Monthly performance overview</p>
            </div>
            <BarChart3 className="w-6 h-6 text-violet-600" />
          </div>

          {trendsLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
          ) : shipmentTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={shipmentTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis yAxisId="left" stroke="#8B5CF6" />
                <YAxis yAxisId="right" orientation="right" stroke="#EC4899" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #E5E7EB', 
                    borderRadius: '12px',
                    padding: '12px'
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="shipments" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', r: 5 }}
                  name="Shipments"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#EC4899" 
                  strokeWidth={3}
                  dot={{ fill: '#EC4899', r: 5 }}
                  name="Total Cost ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
              <BarChart3 className="w-16 h-16 mb-2" />
              <p>No trend data available</p>
            </div>
          )}
        </div>

        {/* Year-over-Year Comparison */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Year-over-Year Growth</h3>
              <p className="text-sm text-gray-600">Comparing shipment volumes</p>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '2px solid #E5E7EB', 
                  borderRadius: '12px',
                  padding: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="lastYear" fill="#D1D5DB" name="2025" radius={[8, 8, 0, 0]} />
              <Bar dataKey="thisYear" fill="#8B5CF6" name="2026" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Radar & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Radar */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Overall Performance</h3>
              <p className="text-sm text-gray-600">Multi-dimensional analysis</p>
            </div>
            <div className="bg-violet-100 rounded-xl px-3 py-1">
              <span className="text-violet-600 font-bold text-sm">{keyMetrics.efficiency}% Efficiency</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceRadar}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" stroke="#6B7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
              <Radar 
                name="Performance" 
                dataKey="value" 
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown with Trends */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cost Analysis</h3>
              <p className="text-sm text-gray-600">Breakdown with trends</p>
            </div>
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>

          {summaryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : costBreakdown.length > 0 ? (
            <div className="space-y-4">
              {costBreakdown.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold text-gray-900">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.amount)}
                      </span>
                      <div className={`flex items-center gap-1 text-sm font-semibold ${
                        item.trend < 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {item.trend < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <TrendingUp className="w-4 h-4" />
                        )}
                        {Math.abs(item.trend)}%
                      </div>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{ 
                        width: `${item.value}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <DollarSign className="w-16 h-16 mb-2" />
              <p>No cost breakdown available</p>
            </div>
          )}
        </div>
      </div>

      {/* Route & Carrier Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Routes */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Top Routes</h3>
              <p className="text-sm text-gray-600">Best performing corridors</p>
            </div>
            <MapPin className="w-6 h-6 text-violet-600" />
          </div>

          {routesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : topRoutes.length > 0 ? (
            <div className="space-y-3">
              {topRoutes.map((route, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-900">{route.route}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{route.shipments} shipments</span>
                      <span>•</span>
                      <span>{route.onTime}% on-time</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(route.avgCost)}</p>
                    <p className="text-xs text-gray-500">avg cost</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No route data available</p>
            </div>
          )}
        </div>

        {/* Top Carriers */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Top Carriers</h3>
              <p className="text-sm text-gray-600">Highest rated transporters</p>
            </div>
            <Truck className="w-6 h-6 text-emerald-600" />
          </div>

          {carriersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : topCarriers.length > 0 ? (
            <div className="space-y-3">
              {topCarriers.map((carrier, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{carrier.carrier}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {carrier.rating}
                        </span>
                        <span>•</span>
                        <span>{carrier.onTime}% on-time</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(carrier.avgCost)}</p>
                    <p className="text-xs text-gray-500">{carrier.shipments} trips</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No carrier data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="mt-8 bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-3">AI-Powered Insights</h3>
            {insightsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/20 rounded"></div>
                  </div>
                ))}
              </div>
            ) : aiInsights ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {aiInsightsList.map((insight, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <p className="text-violet-100 text-sm mb-2">{insight.title}</p>
                    <p className="font-semibold">{insight.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-violet-100">No insights available yet. More data needed for AI analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

