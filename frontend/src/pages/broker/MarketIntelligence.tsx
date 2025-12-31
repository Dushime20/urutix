import React, { useState } from 'react';
import { brokerAPI, type MarketIntelligence, type MarketRoute } from '../../services/brokerApi';
import { TrendingUp, DollarSign, BarChart3, Calendar, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const MarketIntelligence: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [route, setRoute] = useState<MarketRoute>({
    origin: { city: '', country: '' },
    destination: { city: '', country: '' },
    distance: 0,
  });

  const handleAnalyze = async () => {
    if (!route.origin.city || !route.destination.city || !route.distance) {
      toast.error('Please fill in all route details');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.analyzeMarketRate(route);
      setMarketData(response.data);
      toast.success('Market analysis completed');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to analyze market rates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-600 mt-1">Real-time market rate analysis and pricing insights</p>
        </div>
      </div>

      {/* Route Input */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Route Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origin City</label>
            <input
              type="text"
              value={route.origin.city}
              onChange={(e) => setRoute({ ...route, origin: { ...route.origin, city: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Nairobi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
            <input
              type="text"
              value={route.destination.city}
              onChange={(e) => setRoute({ ...route, destination: { ...route.destination, city: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Mombasa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
            <input
              type="number"
              value={route.distance}
              onChange={(e) => setRoute({ ...route, distance: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="500"
            />
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          <span>{loading ? 'Analyzing...' : 'Analyze Market Rates'}</span>
        </button>
      </div>

      {/* Market Data Display */}
      {marketData && (
        <div className="space-y-6">
          {/* Rate Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Current Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                {marketData.currentRate.toLocaleString()} KES
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Average Rate</div>
              <div className="text-2xl font-bold text-blue-600">
                {marketData.averageRate?.toLocaleString() || 'N/A'} KES
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Recommended Rate</div>
              <div className="text-2xl font-bold text-green-600">
                {marketData.recommendedRate?.toLocaleString() || 'N/A'} KES
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600">Price Trend</div>
              <div className="text-2xl font-bold text-purple-600">
                {marketData.pricingInsights?.priceTrend || 'N/A'}
              </div>
            </div>
          </div>

          {/* Rate Recommendations */}
          {marketData.rateRecommendations && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Rate Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900">Competitive Rate</div>
                  <div className="text-2xl font-bold text-green-700">
                    {marketData.rateRecommendations.competitiveRate.toLocaleString()} KES
                  </div>
                  <div className="text-xs text-green-600 mt-1">5% below median</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Premium Rate</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {marketData.rateRecommendations.premiumRate.toLocaleString()} KES
                  </div>
                  <div className="text-xs text-blue-600 mt-1">10% above average</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">Budget Rate</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {marketData.rateRecommendations.budgetRate.toLocaleString()} KES
                  </div>
                  <div className="text-xs text-gray-600 mt-1">15% below median</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">{marketData.rateRecommendations.reasoning}</p>
            </div>
          )}

          {/* Historical Trends Chart */}
          {marketData.historicalTrends && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Historical Trends</h3>
              <div className="space-y-4">
                <TrendChart data={marketData.historicalTrends.last7Days} label="Last 7 Days" />
                <TrendChart data={marketData.historicalTrends.last30Days} label="Last 30 Days" />
              </div>
            </div>
          )}

          {/* Demand Forecast */}
          {marketData.demandForecast && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Demand Forecast</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Next 7 Days</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {marketData.demandForecast.next7Days} loads
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Next 30 Days</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {marketData.demandForecast.next30Days} loads
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">Confidence Level</div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full"
                      style={{ width: `${marketData.demandForecast.confidence}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{marketData.demandForecast.confidence}% confidence</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TrendChart: React.FC<{ data: number[]; label: string }> = ({ data, label }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  return (
    <div>
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
      <div className="flex items-end space-x-1 h-32">
        {data.map((value, idx) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary-600 rounded-t"
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${value.toLocaleString()} KES`}
              />
              <div className="text-xs text-gray-500 mt-1">{idx + 1}</div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Min: {min.toLocaleString()} KES</span>
        <span>Max: {max.toLocaleString()} KES</span>
      </div>
    </div>
  );
};

export default MarketIntelligence;

