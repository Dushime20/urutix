import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { brokerAPI, type MatchRecommendation } from '../../services/brokerApi';
import { Brain, TrendingUp, Package, Route, Loader2, Sparkles, Zap, Target, Shield, Star, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SmartMatching: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState(searchParams.get('loadId') || '');
  const [selectedRecommendation, setSelectedRecommendation] = useState<MatchRecommendation | null>(null);

  useEffect(() => {
    const loadId = searchParams.get('loadId');
    if (loadId) {
      setSelectedLoadId(loadId);
      setTimeout(() => {
        handleGenerateRecommendations(loadId);
      }, 500);
    }
  }, [searchParams]);

  const handleGenerateRecommendations = async (loadId?: string) => {
    const idToUse = loadId || selectedLoadId;
    if (!idToUse) {
      toast.error('Load ID Required');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.generateRecommendations(idToUse);
      setRecommendations(response.data || []);
      if (response.data && response.data.length > 0) {
        toast.success(`Search Complete: ${response.data.length} matches found.`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await brokerAPI.acceptRecommendation(recommendationId);
      toast.success('Recommendation Accepted');
      if (selectedLoadId) {
        const response = await brokerAPI.getRecommendations(selectedLoadId);
        setRecommendations(response.data || []);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const getRecommendationTypeIcon = (type: string) => {
    switch (type) {
      case 'AI_POWERED': return <Brain className="w-5 h-5" />;
      case 'ROUTE_OPTIMIZED': return <Route className="w-5 h-5" />;
      case 'BUNDLING_OPPORTUNITY': return <Package className="w-5 h-5" />;
      case 'BACKHAUL_IDENTIFIED': return <TrendingUp className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-t-4 border-primary-600 animate-spin"></div>
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600 w-10 h-10 animate-pulse" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Finding Best Matches...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Smart Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <Target size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Quick Matching</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{recommendations.length} Active Matches</p>
          </div>
        </div>
        
        <div className="relative z-10 hidden md:flex items-center gap-4">
          <input
            type="text"
            placeholder="Load ID..."
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold placeholder:text-slate-600 focus:ring-2 focus:ring-primary-500/50 transition-all outline-none w-48 shadow-2xl backdrop-blur-md"
          />
          <button
            onClick={() => handleGenerateRecommendations()}
            disabled={loading || !selectedLoadId}
            className="bg-primary-600 hover:bg-primary-500 text-white font-black uppercase tracking-widest px-8 py-2.5 rounded-xl shadow-xl shadow-primary-900/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 text-[10px]"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
            {loading ? 'Searching...' : 'Find Matches'}
          </button>
        </div>
      </div>

      {/* Recommendations Infrastructure */}
      {!loading && recommendations.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Match Score', desc: '98.4% success rate in matching cargo with the best truck.', icon: <Target className="text-primary-600" /> },
            { title: 'Max Profits', desc: 'Identify more ways to save money and increase your earnings.', icon: <TrendingUp className="text-primary-600" /> },
            { title: 'Safe Delivery', desc: 'Reliability screening across all registered carriers.', icon: <Shield className="text-primary-600" /> }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary-600 group-hover:text-white transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3">{feature.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          <div className="flex items-end justify-between px-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Best Matches</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Found {recommendations.length} Matches</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {recommendations.map((rec, index) => (
              <div key={rec.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col lg:flex-row hover:shadow-2xl transition-all duration-500 group">
                <div className={`lg:w-80 p-10 flex flex-col justify-between items-center text-center ${index === 0 ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-900'}`}>
                  <div>
                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 ${index === 0 ? 'bg-white/20 backdrop-blur-md' : 'bg-white shadow-lg'}`}>
                      {index === 0 ? <Star size={32} /> : getRecommendationTypeIcon(rec.recommendationType)}
                    </div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${index === 0 ? 'text-primary-200' : 'text-slate-400'}`}>
                      {index === 0 ? 'Best Match' : rec.recommendationType.replace('_', ' ')}
                    </p>
                    <h4 className="text-2xl font-black tracking-tight mb-8">Match #{rec.id.slice(0, 6)}</h4>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-5xl font-black tracking-tighter">{rec.matchScore}%</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-60`}>Match Score</p>
                  </div>
                </div>

                <div className="flex-1 p-10 lg:p-12">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-slate-50">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Distance Score</p>
                      <p className="text-xl font-black text-slate-900">{rec.matchingFactors.distanceScore}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Capacity</p>
                      <p className="text-xl font-black text-slate-900">{rec.matchingFactors.capacityUtilization}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reliability</p>
                      <p className="text-xl font-black text-slate-900">{rec.matchingFactors.reliabilityScore}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Savings</p>
                      <p className="text-xl font-black text-primary-600">{rec.routeOptimization?.fuelSavings.toFixed(1)} km</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 mb-10">
                    {rec.bundlingOpportunity && (
                      <div className="flex-1 bg-emerald-50 rounded-3xl p-6 border border-emerald-100/50">
                        <div className="flex items-center gap-3 mb-2 text-emerald-700">
                          <Package size={18} className="font-black" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Bundle Opportunity</span>
                        </div>
                        <p className="text-sm font-bold text-emerald-800 leading-snug">
                          {rec.bundlingOpportunity.bundledLoadIds.length} loads merging • Savings: {rec.bundlingOpportunity.totalSavings.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {rec.backhaulOpportunity && (
                      <div className="flex-1 bg-primary-50 rounded-3xl p-6 border border-primary-100/50">
                        <div className="flex items-center gap-3 mb-2 text-primary-700">
                          <TrendingUp size={18} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Backhaul Opportunity</span>
                        </div>
                        <p className="text-sm font-bold text-primary-800 leading-snug">
                          Reverse route found • Revenue: {rec.backhaulOpportunity.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-6 pt-4">
                    <div className="hidden md:block">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Match Info</p>
                      <p className="text-xs font-bold text-slate-400 mt-1 line-clamp-1">{rec.aiInsights?.recommendations[0] || 'Optimized parameters identified for this load.'}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button 
                        onClick={() => setSelectedRecommendation(rec)}
                        className="px-8 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                      >
                        Details
                      </button>
                      {rec.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleAcceptRecommendation(rec.id)}
                          className="px-10 py-4 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:scale-105 active:scale-95 transition-all"
                        >
                          Accept
                        </button>
                      ) : (
                        <div className="px-10 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={14} /> Active
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRecommendation && (
        <RecommendationDetailsModal
          recommendation={selectedRecommendation}
          onClose={() => setSelectedRecommendation(null)}
          onAccept={handleAcceptRecommendation}
        />
      )}
    </div>
  );
};

const RecommendationDetailsModal: React.FC<{
  recommendation: MatchRecommendation;
  onClose: () => void;
  onAccept: (id: string) => void;
}> = ({ recommendation, onClose, onAccept }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-[3.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-12 border-b border-white/5 flex items-center justify-between bg-slate-900 text-white shadow-2xl">
          <div>
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-[0.4em] mb-2 block">Analysis</span>
            <h2 className="text-3xl font-black text-white tracking-tighter">Match Details</h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl shadow-sm text-white hover:text-red-400 transition-colors border border-white/10">
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-12">
          {/* Key Stats Block */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Match Score</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{recommendation.matchScore}%</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Confidence</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{recommendation.confidenceLevel}%</p>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Success Rate</p>
              <p className="text-3xl font-black text-emerald-700 tracking-tighter">{recommendation.aiInsights.predictedSuccessRate.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <p className="text-xl font-black text-slate-700 uppercase tracking-widest mt-1">{recommendation.status}</p>
            </div>
          </div>

          {/* Route Details */}
          {recommendation.routeOptimization && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Route size={18} className="text-primary-600" /> Route Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-slate-100 p-6 rounded-3xl bg-slate-50/30">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Optimized Distance</p>
                  <p className="text-xl font-bold text-slate-900">{recommendation.routeOptimization.optimizedDistance.toFixed(2)} km</p>
                </div>
                <div className="border border-slate-100 p-6 rounded-3xl bg-slate-50/30">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Estimate</p>
                  <p className="text-xl font-bold text-slate-900">{Math.round(recommendation.routeOptimization.estimatedTime / 60)} Hours</p>
                </div>
                <div className="border border-emerald-100 p-6 rounded-3xl bg-emerald-50/20">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Savings</p>
                  <p className="text-xl font-black text-emerald-700">{recommendation.routeOptimization.fuelSavings.toFixed(2)} km</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Brain size={18} className="text-primary-600" /> Recommendations
              </h3>
              <div className="space-y-3">
                {recommendation.aiInsights.recommendations.map((insight, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <Shield size={18} className="text-rose-500" /> Risk Factors
              </h3>
              <div className="space-y-3">
                {recommendation.aiInsights.riskFactors.length > 0 ? recommendation.aiInsights.riskFactors.map((risk, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-rose-50 rounded-2xl border border-rose-100/50">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></div>
                    <p className="text-sm font-bold text-rose-700 leading-relaxed">{risk}</p>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center p-12 bg-emerald-50 rounded-3xl border border-emerald-100/30 text-emerald-600">
                    <CheckCircle2 size={32} className="mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Minimal Risk Detected</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-primary-400">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Stability Check</p>
              <p className="text-xs font-bold text-white">Verified Secure</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-8 py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">Close</button>
            {recommendation.status === 'PENDING' && (
              <button 
                onClick={() => onAccept(recommendation.id)}
                className="px-10 py-4 bg-primary-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary-900/40 hover:scale-105 active:scale-95 transition-all"
              >
                Accept Strategy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatching;
