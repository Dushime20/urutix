import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState } from 'react';
import { brokerAPI, type MarketIntelligence, type MarketRoute } from '../../services/brokerApi';
import { TrendingUp, DollarSign, BarChart3, Loader2, Search, Award } from 'lucide-react';
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1440px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Intelligence Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Market Prices</h1>
            <p className="text-slate-400 text-sm font-bold uppercase uppercase">Real-time pricing trends</p>
          </div>
        </div>

        <div className="relative z-10 hidden md:flex items-center gap-6 mr-4">
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-white uppercase italic">KES</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Currency</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold leading-none text-emerald-500">Live</p>
            <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Status</p>
          </div>
        </div>
      </div>

      {/* Route Analysis Terminal */}
      <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-10 text-slate-50 font-bold text-6xl uppercase italic -rotate-12 pointer-events-none select-none opacity-5 group-hover:opacity-10 transition-opacity">
          Route Calibration
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
            <h2 className="text-sm font-bold text-slate-900 uppercase">Route Details</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">From</label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  value={route.origin.city}
                  onChange={(e) => setRoute({ ...route, origin: { ...route.origin, city: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 focus:ring-0 transition-all outline-none"
                  placeholder="Origin City"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">To</label>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  value={route.destination.city}
                  onChange={(e) => setRoute({ ...route, destination: { ...route.destination, city: e.target.value } })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 focus:ring-0 transition-all outline-none"
                  placeholder="Destination City"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Distance (KM)</label>
              <div className="relative group/input">
                <input
                  type="number"
                  value={route.distance || ''}
                  onChange={(e) => setRoute({ ...route, distance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 text-sm font-bold tracking-tight text-slate-900 focus:bg-white focus:border-primary-600 focus:ring-0 transition-all outline-none"
                  placeholder="KM"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-slate-900 text-white rounded-2xl h-[60px] text-sm font-bold uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 hover:bg-primary-600 transition-all active:translate-y-0 flex items-center justify-center gap-4"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                <span>Search Prices</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Display System */}
      {marketData && (
        <div className="space-y-12 animate-slide-up">
          {/* High-Impact Stat System */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Current Price', value: `${marketData.currentRate.toLocaleString()} KES`, sub: 'Real-time Data', icon: DollarSign },
              { label: 'Average Price', value: `${marketData.averageRate?.toLocaleString() || 'N/A'} KES`, sub: 'Industry Average', icon: BarChart3 },
              { label: 'Suggested Price', value: `${marketData.recommendedRate?.toLocaleString() || 'N/A'} KES`, sub: 'Recommended', icon: Award },
              { label: 'Trend', value: marketData.pricingInsights?.priceTrend || 'STABLE', sub: 'Market Status', icon: TrendingUp },
            ].map((stat, i) => (
              <div key={i} className="group relative bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-primary-50 transition-colors"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all mb-6">
                    <stat.icon size={20} />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase mb-2">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase">{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Rate Tactical Mapping */}
          {marketData.rateRecommendations && (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-sm space-y-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Pricing Options
                </h3>
                <p className="text-sm font-bold text-slate-400 uppercase border border-slate-100 px-4 py-2 rounded-xl">Price Suggestions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { label: 'Low Price', value: marketData.rateRecommendations.competitiveRate, meta: '5% Below Average', desc: 'Price to win more loads', accent: 'emerald' },
                  { label: 'High Price', value: marketData.rateRecommendations.premiumRate, meta: '10% Above Average', desc: 'High-value priority loads', accent: 'indigo' },
                  { label: 'Discount Price', value: marketData.rateRecommendations.budgetRate, meta: '15% Below Average', desc: 'Aggressive pricing', accent: 'slate' },
                ].map((rec, idx) => (
                  <div key={idx} className="group p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-2xl transition-all duration-500">
                    <div className={`w-8 h-1 rounded-full ${rec.accent === 'emerald' ? 'bg-emerald-500' : rec.accent === 'indigo' ? 'bg-indigo-500' : 'bg-slate-400'} mb-6 group-hover:w-16 transition-all`}></div>
                    <p className="text-sm font-bold text-slate-400 uppercase mb-1">{rec.label}</p>
                    <h4 className="text-4xl font-bold text-slate-900 mb-2">{rec.value.toLocaleString()} <span className="text-xs italic uppercase text-slate-300">KES</span></h4>
                    <p className="text-sm font-bold text-primary-600 uppercase mb-6">{rec.meta}</p>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">{rec.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="p-10 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/20 rounded-full -mr-16 -mt-16 blur-xl"></div>
                <div className="relative z-10">
                  <p className="text-sm font-bold text-primary-400 uppercase tracking-[0.2em] mb-4">Why these prices?</p>
                  <p className="text-slate-300 font-medium leading-relaxed italic border-l-2 border-primary-600 pl-8">
                    "{marketData.rateRecommendations.reasoning}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Historical Evolution Stream */}
          {marketData.historicalTrends && (
            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div> Price Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <TrendChart data={marketData.historicalTrends.last7Days} label="DELTA_WEEKLY_INDEX" accent="primary" />
                <TrendChart data={marketData.historicalTrends.last30Days} label="DELTA_MONTHLY_INDEX" accent="indigo" />
              </div>
            </div>
          )}

          {/* Demand Projection System */}
          {marketData.demandForecast && (
            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Predictive Delivery Projection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                  <p className="text-sm font-bold text-slate-400 uppercase mb-8">Short-term Lift (7D)</p>
                  <p className="text-4xl font-bold text-slate-900">{marketData.demandForecast.next7Days} <span className="text-sm uppercase text-slate-300">Records</span></p>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                  <p className="text-sm font-bold text-slate-400 uppercase mb-8">Terminal Run (30D)</p>
                  <p className="text-4xl font-bold text-slate-900">{marketData.demandForecast.next30Days} <span className="text-sm uppercase text-slate-300">Records</span></p>
                </div>
                <div className="md:col-span-2 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-400 uppercase">Confidence Index</p>
                    <span className="text-xl font-bold text-primary-600">{marketData.demandForecast.confidence}%</span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full border border-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 rounded-full transition-all duration-1000"
                      style={{ width: `${marketData.demandForecast.confidence}%` }}
                    ></div>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Projection confirmed via cross-validation.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TrendChart: React.FC<{ data: number[]; label: string; accent: 'primary' | 'indigo' }> = ({ data, label, accent }) => {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);

  return (
    <div className="group/chart space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <p className="text-xs font-bold text-slate-300 uppercase">Yield Flow</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Low:</span>
            <span className="text-sm font-bold text-slate-900 ml-2">{min.toLocaleString()}</span>
          </div>
          <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase">Peak:</span>
            <span className="text-sm font-bold text-slate-900 ml-2">{max.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="flex items-end space-x-2 h-48 group">
        {data.map((value, idx) => {
          const height = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={idx} className="flex-1 group/bar relative">
              <div
                className={`w-full ${accent === 'primary' ? 'bg-primary-500' : 'bg-indigo-500'} rounded-t-xl group-hover/bar:bg-slate-900 transition-all duration-500 cursor-pointer shadow-sm`}
                style={{ height: `${height}%`, minHeight: '8px' }}
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl pointer-events-none uppercase z-10">
                  {value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center text-xs font-bold text-slate-200 uppercase pt-4 border-t border-slate-50">
        <span>Min</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-slate-100"></div>
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
          <div className="w-1 h-1 rounded-full bg-slate-100"></div>
        </div>
        <span>Max</span>
      </div>
    </div>
  );
};

export default MarketIntelligence;
