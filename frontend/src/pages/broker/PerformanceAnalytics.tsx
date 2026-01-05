import React, { useState } from 'react';
import { brokerAPI, type TransporterPerformance } from '../../services/brokerApi';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle2, XCircle, Loader2, Search, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const PerformanceAnalytics: React.FC = () => {
  const [performance, setPerformance] = useState<TransporterPerformance | null>(null);
  const [allPerformances, setAllPerformances] = useState<TransporterPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const handleGetPerformance = async () => {
    if (!selectedTransporter) {
      toast.error('Please enter a Transporter ID');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.getTransporterPerformance(selectedTransporter);
      setPerformance(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.info('No performance data found. Calculate performance?');
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch performance');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePerformance = async () => {
    if (!selectedTransporter) {
      toast.error('Please enter a Transporter ID');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.calculatePerformance(selectedTransporter);
      setPerformance(response.data);
      toast.success('Performance calculated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to calculate performance');
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllPerformances = async () => {
    setLoading(true);
    try {
      const response = await brokerAPI.getPerformanceRecords();
      setAllPerformances(Array.isArray(response.data) ? response.data : []);
      setViewMode('all');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch performance records');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-1">Transporter reliability metrics and performance tracking</p>
        </div>
        <button
          onClick={handleGetAllPerformances}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          View All
        </button>
      </div>

      {/* Transporter Selection */}
      {viewMode === 'single' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Transporter ID</label>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter Transporter ID"
              value={selectedTransporter}
              onChange={(e) => setSelectedTransporter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleGetPerformance}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span>Get Performance</span>
            </button>
            <button
              onClick={handleCalculatePerformance}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
              <span>Calculate</span>
            </button>
          </div>
        </div>
      )}

      {/* Single Performance View */}
      {viewMode === 'single' && performance && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Reliability Score</div>
              <div className={`text-2xl font-bold ${getScoreColor(performance.reliabilityScore).split(' ')[0]}`}>
                {performance.reliabilityScore.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">On-Time Delivery</div>
              <div className={`text-2xl font-bold ${getScoreColor(performance.onTimeDeliveryRate).split(' ')[0]}`}>
                {performance.onTimeDeliveryRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Damage Rate</div>
              <div className={`text-2xl font-bold ${performance.damageRate < 5 ? 'text-green-600' : 'text-red-600'}`}>
                {performance.damageRate.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Match Success</div>
              <div className={`text-2xl font-bold ${getScoreColor(performance.predictiveMatchSuccess).split(' ')[0]}`}>
                {performance.predictiveMatchSuccess.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Reliability Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Reliability Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Loads</div>
                <div className="text-xl font-bold">{performance.reliabilityMetrics.totalLoads}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Completed</div>
                <div className="text-xl font-bold text-green-600">
                  {performance.reliabilityMetrics.completedLoads}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Completion Rate</div>
                <div className="text-xl font-bold">
                  {performance.reliabilityMetrics.completionRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Communication</div>
                <div className="text-xl font-bold">
                  {performance.reliabilityMetrics.communicationScore}%
                </div>
              </div>
            </div>
          </div>

          {/* On-Time Tracking */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">On-Time Delivery Tracking</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Total Deliveries</div>
                <div className="text-xl font-bold">{performance.onTimeTracking.totalDeliveries}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">On-Time</div>
                <div className="text-xl font-bold text-green-600">
                  {performance.onTimeTracking.onTimeDeliveries}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">On-Time Rate</div>
                <div className="text-xl font-bold">
                  {performance.onTimeTracking.onTimePercentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Trend</div>
                <div className="flex items-center space-x-1">
                  {performance.onTimeTracking.trend === 'IMPROVING' ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : performance.onTimeTracking.trend === 'DECLINING' ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <div className="w-5 h-5" />
                  )}
                  <span className="text-xl font-bold">{performance.onTimeTracking.trend}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historical Trends */}
          {performance.historicalTrends && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Historical Trends</h3>
              <div className="space-y-4">
                <TrendChart
                  data={performance.historicalTrends.reliabilityTrend}
                  label="Reliability Trend"
                  color="blue"
                />
                <TrendChart
                  data={performance.historicalTrends.onTimeTrend}
                  label="On-Time Trend"
                  color="green"
                />
                <TrendChart
                  data={performance.historicalTrends.damageTrend}
                  label="Damage Trend"
                  color="red"
                />
              </div>
            </div>
          )}

          {/* Comparative Analysis */}
          {performance.comparativeAnalysis && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Comparative Analysis</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Industry Average</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reliability</span>
                      <span className="font-semibold">{performance.comparativeAnalysis.industryAverage.reliability}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">On-Time</span>
                      <span className="font-semibold">{performance.comparativeAnalysis.industryAverage.onTime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Damage</span>
                      <span className="font-semibold">{performance.comparativeAnalysis.industryAverage.damage}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Percentile Rank</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reliability</span>
                      <span className="font-semibold">{performance.comparativeAnalysis.percentileRank.reliability}th</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">On-Time</span>
                      <span className="font-semibold">{performance.comparativeAnalysis.percentileRank.onTime}th</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Damage</span>
                      <span className="font-semibold">{performance.comparativeAnalysis.percentileRank.damage}th</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Performances View */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reliability</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On-Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Damage Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match Success</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allPerformances.map((perf) => (
                <tr key={perf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {perf.transporterId.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(perf.reliabilityScore)}`}>
                      {perf.reliabilityScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(perf.onTimeDeliveryRate)}`}>
                      {perf.onTimeDeliveryRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {perf.damageRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(perf.predictiveMatchSuccess)}`}>
                      {perf.predictiveMatchSuccess.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => {
                        setSelectedTransporter(perf.transporterId);
                        setPerformance(perf);
                        setViewMode('single');
                      }}
                      className="text-primary-600 hover:text-primary-900 text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TrendChart: React.FC<{ data: number[]; label: string; color: string }> = ({ data, label, color }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const colorClass = color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : 'bg-red-600';

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
      <div className="flex items-end space-x-1 h-24">
        {data.map((value, idx) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full ${colorClass} rounded-t`}
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${value.toFixed(1)}`}
              />
              <div className="text-xs text-gray-500 mt-1">{idx + 1}</div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Min: {min.toFixed(1)}</span>
        <span>Max: {max.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;

