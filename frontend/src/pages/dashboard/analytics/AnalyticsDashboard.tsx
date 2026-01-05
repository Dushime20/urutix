import React, { useState } from 'react';
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
  Zap
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
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'shipments' | 'cost' | 'efficiency'>('shipments');

  // Mock data - Replace with actual API calls
  const keyMetrics = {
    totalShipments: 156,
    avgCostPerShipment: 3240,
    onTimeDelivery: 94.5,
    costSavings: 18750,
    avgTransitTime: 3.2,
    shipmentGrowth: 23.5,
    costReduction: 12.3,
    efficiency: 88.5
  };

  const shipmentTrends = [
    { month: 'Jul', shipments: 18, cost: 58320, onTime: 92 },
    { month: 'Aug', shipments: 22, cost: 71280, onTime: 91 },
    { month: 'Sep', shipments: 25, cost: 81000, onTime: 93 },
    { month: 'Oct', shipments: 28, cost: 90720, onTime: 95 },
    { month: 'Nov', shipments: 31, cost: 100440, onTime: 94 },
    { month: 'Dec', shipments: 32, cost: 103680, onTime: 96 }
  ];

  const routePerformance = [
    { route: 'NYC-LA', shipments: 24, avgCost: 3450, onTime: 96, savings: 12 },
    { route: 'Chicago-Houston', shipments: 18, avgCost: 2100, onTime: 94, savings: 8 },
    { route: 'Miami-Boston', shipments: 15, avgCost: 4250, onTime: 92, savings: 15 },
    { route: 'Seattle-Denver', shipments: 12, avgCost: 2800, onTime: 98, savings: 10 },
    { route: 'Dallas-Atlanta', shipments: 10, avgCost: 1950, onTime: 95, savings: 6 }
  ];

  const carrierPerformance = [
    { carrier: 'Swift Transport', shipments: 35, rating: 4.8, onTime: 97, avgCost: 3200 },
    { carrier: 'FastLine Logistics', shipments: 28, rating: 4.6, onTime: 94, avgCost: 3100 },
    { carrier: 'Premier Freight', shipments: 22, rating: 4.7, onTime: 96, avgCost: 3450 },
    { carrier: 'Express Cargo', shipments: 18, rating: 4.5, onTime: 92, avgCost: 2980 },
    { carrier: 'Rapid Movers', shipments: 15, rating: 4.4, onTime: 91, avgCost: 3050 }
  ];

  const costBreakdown = [
    { category: 'Transportation', value: 72, amount: 112320, trend: 8 },
    { category: 'Insurance', value: 11, amount: 17160, trend: -3 },
    { category: 'Fees', value: 8, amount: 12480, trend: -5 },
    { category: 'Additional', value: 9, amount: 14040, trend: 12 }
  ];

  const performanceRadar = [
    { metric: 'On-Time', value: 94.5, fullMark: 100 },
    { metric: 'Cost Efficiency', value: 88, fullMark: 100 },
    { metric: 'Quality', value: 92, fullMark: 100 },
    { metric: 'Communication', value: 90, fullMark: 100 },
    { metric: 'Documentation', value: 95, fullMark: 100 },
    { metric: 'Damage Rate', value: 97, fullMark: 100 }
  ];

  const monthlyComparison = [
    { month: 'Jan', thisYear: 24, lastYear: 18 },
    { month: 'Feb', thisYear: 26, lastYear: 20 },
    { month: 'Mar', thisYear: 28, lastYear: 22 },
    { month: 'Apr', thisYear: 30, lastYear: 24 },
    { month: 'May', thisYear: 31, lastYear: 25 },
    { month: 'Jun', thisYear: 32, lastYear: 26 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
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
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                timeRange === range
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-violet-100 rounded-xl p-3">
              <Package className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <TrendingUp className="w-4 h-4" />
              +{keyMetrics.shipmentGrowth}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Total Shipments</p>
          <p className="text-3xl font-bold text-gray-900">{keyMetrics.totalShipments}</p>
          <p className="text-xs text-gray-500 mt-2">vs last {timeRange}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 rounded-xl p-3">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
              <TrendingDown className="w-4 h-4" />
              -{keyMetrics.costReduction}%
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Avg Cost/Shipment</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(keyMetrics.avgCostPerShipment)}</p>
          <p className="text-xs text-gray-500 mt-2">Cost optimized</p>
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
          <p className="text-3xl font-bold text-gray-900">{keyMetrics.onTimeDelivery}%</p>
          <p className="text-xs text-gray-500 mt-2">Industry avg: 87%</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <Zap className="w-6 h-6" />
            </div>
            <Award className="w-6 h-6 text-rose-100" />
          </div>
          <p className="text-rose-100 text-sm mb-1">Cost Savings</p>
          <p className="text-3xl font-bold">{formatCurrency(keyMetrics.costSavings)}</p>
          <p className="text-xs text-rose-100 mt-2">This {timeRange}</p>
        </div>
      </div>

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

          <div className="space-y-4">
            {costBreakdown.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
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
                      backgroundColor: COLORS[index]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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

          <div className="space-y-3">
            {routePerformance.map((route, index) => (
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
                  <p className="text-xs text-emerald-600 font-semibold">-{route.savings}% cost</p>
                </div>
              </div>
            ))}
          </div>
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

          <div className="space-y-3">
            {carrierPerformance.map((carrier, index) => (
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-violet-100 text-sm mb-2">Cost Optimization</p>
                <p className="font-semibold">Switching to NYC-LA route during off-peak could save 15% on average</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-violet-100 text-sm mb-2">Carrier Recommendation</p>
                <p className="font-semibold">Swift Transport has 97% on-time rate - consider for urgent shipments</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-violet-100 text-sm mb-2">Growth Opportunity</p>
                <p className="font-semibold">Seattle-Denver route shows 18% growth potential based on demand</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

