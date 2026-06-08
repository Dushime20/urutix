import { DashboardSkeleton } from '../../components/common/LoadingSkeletons';
import React, { useState } from 'react';
import { brokerAPI, type TransporterPerformance } from '../../services/brokerApi';
import { BarChart3, TrendingUp, TrendingDown, CheckCircle2, Search, Award, Activity, Zap, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const PerformanceAnalytics: React.FC = () => {
  const [performance, setPerformance] = useState<TransporterPerformance | null>(null);
  const [allPerformances, setAllPerformances] = useState<TransporterPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransporter, setSelectedTransporter] = useState('');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const handleGetPerformance = async () => {
    if (!selectedTransporter) {
      toast.error('Ref ID required');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.getTransporterPerformance(selectedTransporter);
      setPerformance(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast('No data found. Calculate performance?');
      } else {
        toast.error(err.response?.data?.message || 'Failed to fetch performance');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalculatePerformance = async () => {
    if (!selectedTransporter) {
      toast.error('Ref ID required');
      return;
    }

    setLoading(true);
    try {
      const response = await brokerAPI.calculatePerformance(selectedTransporter);
      setPerformance(response.data);
      toast.success('Performance calculated');
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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-24">
      {/* Ultra-Compact Analytics Header */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none mb-1">Analytics</h1>
            <p className="text-slate-400 text-sm font-bold uppercase">System Audit</p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-12 mr-4">
           <div className="text-center hidden md:block">
             <p className="text-xl font-bold leading-none text-emerald-400">Operational</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">Status</p>
           </div>
           <button onClick={handleGetAllPerformances} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-sm font-bold uppercase hover:bg-white hover:text-slate-900 transition-all flex items-center gap-3">
             <Activity size={14} /> Global View
           </button>
        </div>
      </div>

      {/* Control Terminal */}
      {viewMode === 'single' && (
        <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm relative group overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8 items-end">
            <div className="flex-1 space-y-3">
              <label className="text-sm font-bold text-slate-400 uppercase ml-4">Authorized Ref ID</label>
              <div className="relative">
                <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Carrier Reference..."
                  value={selectedTransporter}
                  onChange={(e) => setSelectedTransporter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 text-sm font-bold uppercase text-slate-900 transition-all focus:bg-white focus:border-primary-600 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleGetPerformance} className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3">
                <Search size={16} /> Sync
              </button>
              <button onClick={handleCalculatePerformance} className="px-10 py-5 bg-primary-600 text-white rounded-2xl text-sm font-bold uppercase shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3">
                <Zap size={16} /> Compute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail System */}
      {viewMode === 'single' && performance && (
        <div className="space-y-12 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Reliability', value: `${performance.reliabilityScore.toFixed(1)}%`, score: performance.reliabilityScore },
              { label: 'On-Time', value: `${performance.onTimeDeliveryRate.toFixed(1)}%`, score: performance.onTimeDeliveryRate },
              { label: 'Damages', value: `${performance.damageRate.toFixed(1)}%`, score: 100 - performance.damageRate },
              { label: 'Success Prob.', value: `${performance.predictiveMatchSuccess.toFixed(1)}%`, score: performance.predictiveMatchSuccess },
            ].map((stat, i) => (
              <div key={i} className="group relative bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-2xl overflow-hidden">
                <div className="relative z-10">
                  <p className="text-sm font-bold text-slate-400 uppercase mb-2">{stat.label}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">{stat.value}</h3>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${stat.score >= 80 ? 'bg-emerald-500' : stat.score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${stat.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-sm space-y-10">
              <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-900 rounded-full"></div> Reliability Core
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Loads</p>
                  <p className="text-3xl font-bold text-slate-900">{performance.reliabilityMetrics.totalLoads}</p>
                </div>
                <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Contract Score</p>
                  <p className="text-3xl font-bold text-slate-900">{performance.reliabilityMetrics.communicationScore}/100</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-sm space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Timing Data
                  </h3>
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${performance.onTimeTracking.trend === 'IMPROVING' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {performance.onTimeTracking.trend} Efficiency
                  </div>
               </div>
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Precision Percentage</p>
                    <p className="text-4xl font-bold text-slate-900">{performance.onTimeTracking.onTimePercentage.toFixed(1)}%</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                    <CheckCircle2 size={32} />
                  </div>
               </div>
            </div>
          </div>
          
          {performance.historicalTrends && (
            <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm space-y-12">
               <h3 className="text-sm font-bold text-slate-900 uppercase flex items-center gap-3">
                 <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div> Historical Flow
               </h3>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                 <TrendChart data={performance.historicalTrends.reliabilityTrend} label="RELIABILITY_STREAM" accent="primary" />
                 <TrendChart data={performance.historicalTrends.onTimeTrend} label="PRECISION_STREAM" accent="emerald" />
                 <TrendChart data={performance.historicalTrends.damageTrend} label="COMPROMISE_STREAM" accent="rose" />
               </div>
            </div>
          )}
        </div>
      )}

      {/* Global View (Table View) */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up">
          <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Global Repository</h3>
            <div className="px-4 py-2 bg-white rounded-full text-xs font-bold text-slate-400 uppercase border border-slate-100 shadow-sm">
              Units: {allPerformances.length}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white">
                  {['Reference', 'Reliability', 'On-Time', 'Damages', 'Success Probability', 'Details'].map((header) => (
                    <th key={header} className="px-10 py-8 text-left text-xs font-bold text-slate-400 uppercase border-b border-slate-50">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allPerformances.map((perf) => (
                  <tr key={perf.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer" onClick={() => { setSelectedTransporter(perf.transporterId); setPerformance(perf); setViewMode('single'); }}>
                    <td className="px-10 py-10">
                      <p className="text-sm font-bold text-slate-900 uppercase italic">#{perf.transporterId.slice(0, 8)}</p>
                    </td>
                    <td className="px-10 py-10">
                      <p className="text-lg font-bold text-slate-900">{perf.reliabilityScore.toFixed(1)}%</p>
                    </td>
                    <td className="px-10 py-10 text-sm font-bold text-slate-900">{perf.onTimeDeliveryRate.toFixed(1)}%</td>
                    <td className="px-10 py-10 text-sm font-bold text-rose-500">{perf.damageRate.toFixed(1)}%</td>
                    <td className="px-10 py-10">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase">
                        {perf.predictiveMatchSuccess.toFixed(1)}% PROB
                      </span>
                    </td>
                    <td className="px-10 py-10">
                      <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><ArrowRight size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const TrendChart: React.FC<{ data: number[]; label: string; accent: 'primary' | 'emerald' | 'rose' }> = ({ data, label, accent }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const colorMap = { primary: 'bg-primary-500', emerald: 'bg-emerald-500', rose: 'bg-rose-500' };

  return (
    <div className="space-y-6">
      <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
      <div className="h-24 flex items-end gap-1.5">
        {data.slice(-10).map((value, idx) => (
          <div key={idx} className="flex-1 relative group/bar">
            <div className={`w-full ${colorMap[accent]} rounded-t-lg transition-all cursor-pointer opacity-40 group-hover/bar:opacity-100`} style={{ height: `${max > 0 ? (value / max) * 100 : 0}%`, minHeight: '4px' }}>
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded uppercase z-10">{value.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
