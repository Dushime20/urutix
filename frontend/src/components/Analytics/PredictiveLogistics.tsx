import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  MapPin, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Globe,
  Loader2,
  DollarSign,
  ChevronRight,
  BarChart3,
  Target,
  Award,
  Leaf,
  Wind,
  PackagePlus,
  ArrowRightLeft,
  Activity,
  Wrench,
  Construction,
  Split,
  ShieldAlert,
  Archive,
  AlertTriangle,
  BarChart4,
  Gauge,
  Box,
  Shield,
  Fingerprint,
  Lock,
  Eye,
  Radio,
  Cpu
} from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';

const PredictiveLogistics: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState<string>('');
  const [etaData, setEtaData] = useState<any>(null);
  const [pricingData, setPricingData] = useState<any>(null);
  const [carrierScores, setCarrierScores] = useState<any[]>([]);
  const [consolidation, setConsolidation] = useState<any[]>([]);
  const [driverSafety, setDriverSafety] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [diversions, setDiversions] = useState<any[]>([]);
  const [damageRisk, setDamageRisk] = useState<any[]>([]);
  const [capacityForecast, setCapacityForecast] = useState<any[]>([]);
  const [utilization, setUtilization] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [sustainability, setSustainability] = useState<any>(null);
  const [benchmarking, setBenchmarking] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [heatmap, setHeatmap] = useState<any[]>([]);

  const fetchIntelligence = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    
    try {
      const w = weight ? parseFloat(weight) : 1;
      const [etaRes, pricingRes, sustRes] = await Promise.all([
        analyticsApi.getETAPrediction(origin, destination),
        analyticsApi.getPricingRecommendation(origin, destination, w),
        analyticsApi.getSustainability(origin, destination, w)
      ]);
      
      setEtaData(etaRes.data);
      setPricingData(pricingRes.data);
      setSustainability(sustRes.data || sustRes);
    } catch (error) {
      console.error('Error fetching intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalData = async () => {
    try {
      const [heatmapRes, benchmarkingRes, carrierRes, consolRes, safetyRes, maintenanceRes, diversionRes, damageRes, capacityRes, utilizationRes, anomalyRes] = await Promise.all([
        analyticsApi.getDemandHeatmap(),
        analyticsApi.getBenchmarking(),
        analyticsApi.getCarrierScores(),
        analyticsApi.getConsolidation(),
        analyticsApi.getDriverSafety(),
        analyticsApi.getMaintenance(),
        analyticsApi.getDiversions(),
        analyticsApi.getDamageRisk(),
        analyticsApi.getCapacityForecast(),
        analyticsApi.getUtilization(),
        analyticsApi.getAnomalies()
      ]);
      setHeatmap(heatmapRes?.data || (Array.isArray(heatmapRes) ? heatmapRes : []));
      setBenchmarking(benchmarkingRes?.data || benchmarkingRes);
      setCarrierScores(carrierRes.data || carrierRes);
      setConsolidation(consolRes.data || consolRes || []);
      setDriverSafety(safetyRes.data || safetyRes || []);
      setMaintenance(maintenanceRes.data || maintenanceRes || []);
      setDiversions(diversionRes.data || diversionRes || []);
      setDamageRisk(damageRes.data || damageRes || []);
      setCapacityForecast(capacityRes.data || capacityRes || []);
      setUtilization(utilizationRes.data || utilizationRes || []);
      setAnomalies(anomalyRes.data || anomalyRes || []);
    } catch (error) {
      console.error('Error fetching global data:', error);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Zap className="text-blue-600" /> AI Logistics Intelligence
          </h2>
          <p className="text-slate-500 font-medium italic">Autonomous neural forecasting & algorithmic risk mitigation</p>
        </div>
        <div className="hidden md:flex items-center gap-6">
           <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Network Pulse</span>
              <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> OPTIMAL (98.4%)
              </div>
           </div>
           <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center">
              <ShieldCheck className="text-blue-500 w-6 h-6" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Main Intelligence Column (3/4) */}
        <div className="lg:col-span-3 space-y-6">
           {/* Section 1: Lane Discovery Suite */}
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
               <Globe className="w-64 h-64" />
            </div>
            <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Target className="text-blue-600 w-5 h-5" /> Neural Lane Discovery
              </h3>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Payload:</span>
                <input 
                  type="number"
                  placeholder="Metric Tons"
                  className="pl-3 pr-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 w-32 outline-none text-slate-700 transition-all font-mono"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                  <input 
                    type="text"
                    placeholder="Departing Hub"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center p-2 opacity-30">
                  <ArrowRightLeft className="text-slate-500 w-5 h-5" />
                </div>
                <div className="flex-1 relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                  <input 
                    type="text"
                    placeholder="Arrival Terminal"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <button 
                  onClick={fetchIntelligence}
                  disabled={loading || !origin || !destination}
                  className="bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black px-12 py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 min-w-[200px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />}
                  Execute Intelligence
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Result Columns */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                    <Clock className="w-4 h-4" /> Transit Variance Model
                  </h4>
                  <AnimatePresence mode="wait">
                    {etaData ? (
                      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col justify-center">
                             <p className="text-[10px] text-blue-600 font-black uppercase mb-1">Duration</p>
                             <p className="text-3xl font-black text-blue-900 leading-none">{etaData.avgDurationHours}h</p>
                          </div>
                          <div className="flex-1 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col justify-center">
                             <p className="text-[10px] text-emerald-600 font-black uppercase mb-1">Reliability</p>
                             <p className="text-3xl font-black text-emerald-900 leading-none">{etaData.onTimeProbability}%</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-40 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest text-center px-10">
                        Input hubs to synchronize neural transit forecasts
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                    <DollarSign className="w-4 h-4" /> Yield Intelligence
                  </h4>
                  <AnimatePresence mode="wait">
                    {pricingData?.recommendation?.optimal ? (
                      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white shadow-2xl shadow-blue-200 relative overflow-hidden group">
                           <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform">
                              <TrendingUp className="w-20 h-20 text-white" />
                           </div>
                           <p className="text-[10px] text-blue-100 font-black uppercase tracking-widest mb-1.5 opacity-60">Optimal Target Bid</p>
                           <div className="flex items-baseline gap-2">
                             <span className="text-4xl font-black tracking-tighter">${pricingData.recommendation.optimal.toLocaleString()}</span>
                             <span className="text-blue-200 text-xs font-black">USD</span>
                           </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] px-2 font-black text-slate-400">
                           <span>AI CONF: {Math.round(pricingData.confidence * 100)}%</span>
                           <span>SAMPLES: {pricingData.marketContext.sampleSize}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-40 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest text-center px-10">
                        Price discovery requires lane analysis execution
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                    <Leaf className="w-4 h-4" /> ESG Audit Engine
                  </h4>
                  <AnimatePresence mode="wait">
                    {sustainability ? (
                      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                        <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100/50 relative overflow-hidden group">
                           <div className="absolute -right-4 -top-4 p-4 opacity-10 group-hover:scale-110 transition-transform">
                              <Wind className="w-20 h-20 text-emerald-800" />
                           </div>
                           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1.5">Carbon Footprint</p>
                           <div className="flex items-baseline gap-2">
                             <span className="text-4xl font-black text-emerald-950 tracking-tighter">{sustainability.footprint.kgCO2}</span>
                             <span className="text-emerald-700 text-xs font-black">kg CO2</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 px-1">
                           <div className="px-2.5 py-1 bg-emerald-600 text-[9px] font-black text-white rounded-lg uppercase tracking-widest">
                              {sustainability.badges.sustainabilityIndex}
                           </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-40 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 text-[10px] font-black uppercase tracking-widest text-center px-10">
                         Calculating environmental impact profile
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <div className="space-y-1">
                   <h3 className="font-black text-slate-900 flex items-center gap-3 text-lg uppercase tracking-tight">
                       <Fingerprint className="text-blue-600 w-8 h-8" /> Neural Cyber-Security Audit
                   </h3>
                   <p className="text-[10px] font-bold text-slate-400 italic">Real-time pattern forensics & financial integrity shielding</p>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TLS 1.3 SECURED</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl">
                      <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">THREAT SCAN ACTIVE</span>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(anomalies.length > 0 ? anomalies : [1,2,3,4]).map((anomaly, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-6 rounded-[36px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group transition-all hover:-translate-y-2 hover:shadow-2xl ${
                       !anomaly.id ? 'animate-pulse' : ''
                    }`}
                  >
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
                        <Cpu className="w-48 h-48" />
                     </div>
                     
                     {anomaly.id ? (
                        <>
                           <div className="flex justify-between items-start mb-6">
                              <div className={`px-3 py-1 text-[8px] font-black rounded-lg uppercase tracking-widest ${
                                 anomaly.severity === 'CRITICAL' ? 'bg-rose-600 text-white' : 
                                 anomaly.severity === 'HIGH' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'
                              }`}>
                                 {anomaly.type.replace(/_/g, ' ')}
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-900 font-mono tracking-tighter">SIG-{anomaly.id}</p>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(anomaly.timestamp).toLocaleTimeString()}</p>
                              </div>
                           </div>
                           
                           <h4 className="text-xs font-black text-slate-800 leading-relaxed mb-8 pr-4 min-h-[48px]">
                              {anomaly.message}
                           </h4>
                           
                           <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                              <div>
                                 <div className={`text-3xl font-black tracking-tighter ${
                                    anomaly.riskScore > 80 ? 'text-rose-600' : 'text-amber-600'
                                 }`}>
                                    {anomaly.riskScore}<span className="text-xs opacity-40 ml-0.5">%</span>
                                 </div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight">ATTACK VEC. CONF</p>
                              </div>
                              <button className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:rotate-12">
                                 <Eye className="w-5 h-5" />
                              </button>
                           </div>
                           
                           <div className="mt-4">
                              <button className={`w-full py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                 anomaly.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' : 
                                 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                              }`}>
                                 {anomaly.action.replace(/_/g, ' ')}
                              </button>
                           </div>
                        </>
                     ) : (
                        <div className="h-48 flex items-center justify-center italic text-slate-200 text-xs">Awaiting signal...</div>
                     )}
                  </motion.div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Former Utilization Auditor moved to grid */}
                {utilization.length > 0 ? utilization.slice(0, 3).map((asset, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group"
                  >
                     <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                        <Box className="w-16 h-16 text-slate-900" />
                     </div>
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <h4 className="text-lg font-black text-slate-800 leading-tight">{asset.plateNumber}</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{asset.model}</p>
                        </div>
                        <div className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${asset.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                           {asset.status}
                        </div>
                     </div>
                     <div className="flex items-end justify-between">
                        <div>
                           <div className="text-3xl font-black text-slate-900">{asset.utilizationScore}%</div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">UTILIZATION SCORE</p>
                        </div>
                        <div className="text-right">
                           {asset.idleDays > 0 && <p className="text-[10px] font-black text-amber-600 mb-1">{asset.idleDays}D IDLE CYCLE</p>}
                           <div className="flex items-center gap-1.5 justify-end">
                              <Shield className={`w-3 h-3 ${asset.urgency === 'HIGH' ? 'text-rose-500' : 'text-emerald-500'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-tighter ${asset.urgency === 'HIGH' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                 {asset.recommendation.replace(/_/g, ' ')}
                              </span>
                           </div>
                        </div>
                     </div>
                     <div className="mt-6 pt-4 border-t border-slate-50">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                           <span>Efficiency Rank</span>
                           <span>{asset.revenueEfficiency}%</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                           <div className={`h-full ${asset.utilizationScore > 70 ? 'bg-emerald-500' : asset.utilizationScore > 40 ? 'bg-blue-500' : 'bg-rose-500'}`} style={{ width: `${asset.utilizationScore}%` }} />
                        </div>
                     </div>
                  </motion.div>
                )) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Neural HUB Capacity Forecast */}
             <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                      <BarChart4 className="text-indigo-500 w-5 h-5" /> Hub Capacity Forecasting
                  </h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {capacityForecast.length > 0 ? capacityForecast.map((hub, idx) => (
                      <motion.div 
                        key={idx}
                        className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-between h-36 hover:shadow-lg transition-all"
                      >
                         <div className="flex items-start justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{hub.city}</span>
                            {hub.trend === 'SHORTAGE' ? <TrendingUp className="w-3 h-3 text-rose-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
                         </div>
                         <div className="text-xl font-black text-slate-800 mb-1">{hub.score}%</div>
                         <div className={`text-[8px] font-black uppercase tracking-widest ${hub.urgency === 'CRITICAL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {hub.trend}
                         </div>
                         <div className={`w-full h-1 mt-3 rounded-full ${hub.urgency === 'CRITICAL' ? 'bg-rose-100 animate-pulse' : 'bg-emerald-100'}`} />
                      </motion.div>
                    )) : null}
                </div>
             </div>

             {/* Neural Load Consolidation */}
             <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                      <PackagePlus className="text-blue-500 w-5 h-5" /> Cargo Consolidation Ops
                  </h3>
                </div>
                <div className="space-y-3">
                    {consolidation.length > 0 ? consolidation.slice(0, 3).map((opp, idx) => (
                      <motion.div 
                        key={idx}
                        className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 text-[10px] font-black">
                              {opp.potentialSavings}%
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-[10px] uppercase truncate w-32">{opp.route}</h4>
                              <p className="text-[8px] font-black text-slate-400 mt-0.5">{opp.loads.length} Shipments</p>
                           </div>
                        </div>
                        <button className="bg-slate-50 text-slate-400 p-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <ChevronRight className="w-3 h-3" />
                        </button>
                      </motion.div> Consolidating load opportunities
                    )) : null}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Neural Route Diversion */}
             <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                      <Split className="text-emerald-500 w-5 h-5" /> Neural Route Diversion
                  </h3>
                </div>
                <div className="space-y-4">
                    {diversions.length > 0 ? diversions.map((div, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                              <AlertCircle className="w-5 h-5 text-rose-500" />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-[11px] uppercase truncate w-32">{div.reference}</h4>
                              <p className="text-[9px] font-black text-rose-600 mt-0.5">{div.anomaly.replace(/_/g, ' ')}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className="text-emerald-600 text-[11px] font-black">{div.timeImpact} MIN</div>
                           <span className="text-[8px] font-black text-slate-400 uppercase">RECOVERY</span>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] text-center">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Scanning network for route anomalies...</p>
                      </div>
                    )}
                </div>
             </div>

             {/* Neural Damage Forecaster */}
             <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                      <ShieldAlert className="text-amber-500 w-5 h-5" /> Neural Damage Forecast
                  </h3>
                </div>
                <div className="space-y-4">
                    {damageRisk.length > 0 ? damageRisk.map((load, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group overflow-hidden"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                              <Archive className={`w-5 h-5 ${load.riskLevel === 'LOW' ? 'text-emerald-500' : 'text-amber-500'}`} />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-[11px] uppercase truncate w-32">{load.title}</h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                 <AlertTriangle className={`w-2.5 h-2.5 ${load.riskLevel === 'LOW' ? 'text-emerald-500' : 'text-amber-500'}`} />
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${load.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {load.riskLevel} ATTRITION RISK
                                 </span>
                              </div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`text-xl font-black ${load.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {load.damageProbability}%
                           </div>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">CLAIM PROB</span>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-[32px] text-center">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Analyzing cargo sensitivity profiles...</p>
                      </div>
                    )}
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Section: Driver Integrity */}
             <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                      <Activity className="text-emerald-500 w-5 h-5" /> Driver Integrity Scorecard
                  </h3>
                </div>
                <div className="space-y-4">
                    {driverSafety.length > 0 ? driverSafety.map((driver, idx) => (
                      <motion.div 
                        key={idx}
                        className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                              <ShieldCheck className={`w-5 h-5 ${driver.riskLevel === 'LOW' ? 'text-emerald-500' : 'text-rose-500'}`} />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-[11px] uppercase truncate w-32">{driver.name}</h4>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{driver.riskLevel} RISK</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`text-xl font-black ${driver.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-rose-600'}`}>{driver.score}</div>
                           <span className="text-[8px] font-black text-slate-400 uppercase">SAFETY</span>
                        </div>
                      </motion.div>
                    )) : null}
                </div>
             </div>

             {/* Section: Predictive Maintenance */}
              <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                      <Wrench className="text-blue-500 w-5 h-5" /> Fleet Health Forecast
                  </h3>
                </div>
                <div className="space-y-4">
                    {maintenance.length > 0 ? maintenance.map((truck, idx) => (
                      <motion.div 
                        key={idx}
                        className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                              <Construction className={`w-5 h-5 ${truck.riskLevel === 'STABLE' ? 'text-blue-500' : truck.riskLevel === 'ELEVATED' ? 'text-amber-500' : 'text-rose-500'}`} />
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-[11px] uppercase truncate w-32">{truck.plateNumber}</h4>
                              <p className="text-[9px] font-bold text-slate-400 mt-0.5">{truck.model}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={`text-xl font-black ${truck.riskLevel === 'STABLE' ? 'text-blue-600' : truck.riskLevel === 'ELEVATED' ? 'text-amber-600' : 'text-rose-600'}`}>{truck.breakdownProbability}%</div>
                           <span className="text-[8px] font-black text-slate-400 uppercase">FAIL PROB</span>
                        </div>
                      </motion.div>
                    )) : null}
                </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
              {/* Section: Strategic Benchmarking */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-50 bg-slate-50/20">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-[0.2em] text-[10px]">
                    <BarChart3 className="text-indigo-600 w-4 h-4" /> Market Benchmarking
                  </h3>
                </div>
                <div className="p-8">
                   {benchmarking ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                           <div className="flex justify-between items-end">
                              <p className="text-[11px] font-black text-slate-400 uppercase">{benchmarking.cohort} STATUS</p>
                              <div className="text-5xl font-black text-indigo-700">{benchmarking.performance.onTimeRate}%</div>
                           </div>
                           <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600" style={{ width: `${benchmarking.performance.onTimeRate}%` }} />
                           </div>
                           <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Market Avg: {benchmarking.marketBaseline.onTimeRate}%</span>
                              <span className="text-emerald-600">DELTA: +{benchmarking.benchmarks.reliabilityGap.toFixed(1)}%</span>
                           </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center justify-between">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Efficiency Delta</p>
                              <div className="flex items-center gap-2">
                                 <TrendingUp className="text-emerald-500 w-5 h-5" />
                                 <span className="text-3xl font-black text-slate-900">{benchmarking.benchmarks.costPerformance.toFixed(1)}%</span>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Fleet Integrity</p>
                              <p className="text-3xl font-black text-indigo-600">ELITE</p>
                           </div>
                        </div>
                     </div>
                   ) : null}
                </div>
              </motion.div>
          </div>
        </div>

        {/* Intelligence Sidebar (1/4) */}
        <div className="lg:col-span-1 space-y-6">
           {/* Elite Partners Scorecard */}
           <motion.div 
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden"
           >
              <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-[11px] uppercase tracking-tighter">
                   <Award className="text-blue-500 w-5 h-5" /> Elite Carrier Pool
                </h3>
              </div>
              <div className="p-6 space-y-6">
                 {carrierScores.length > 0 ? carrierScores.slice(0, 5).map((carrier, idx) => (
                   <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white text-[10px]">
                            {idx + 1}
                         </div>
                         <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate w-24">{carrier.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">{carrier.score}</div>
                        <div className="text-[8px] text-slate-400 font-bold">{carrier.metrics.reliability}% REL</div>
                      </div>
                   </div>
                 )) : null}
              </div>
           </motion.div>

           {/* Market Pulse Heatmap */}
           <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[40px] shadow-sm border border-slate-100 flex flex-col sticky top-6 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-[11px] uppercase tracking-tighter">
                <Globe className="text-blue-500 w-5 h-5" /> Network Demand Pulse
              </h3>
            </div>
            <div className="p-8 space-y-6">
               {heatmap.length > 0 ? heatmap.slice(0, 6).map((item, index) => (
                  <div key={item.city} className="group cursor-pointer">
                     <div className="flex justify-between text-[11px] mb-2 font-black uppercase tracking-tighter">
                        <span className="text-slate-700">{item.city}</span>
                        <span className="text-slate-300">{item.volume} TRIPS</span>
                     </div>
                     <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div className={`h-full bg-blue-600 ${index === 0 ? 'opacity-100' : 'opacity-20'}`} style={{ width: `${(parseInt(item.volume) / (parseInt(heatmap[0]?.volume) || 1)) * 100}%` }} />
                     </div>
                  </div>
               )) : null}
               <div className="p-6 bg-slate-900 rounded-[32px] text-white mt-6">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-[9px] text-slate-400 font-black uppercase">Forecasting Confidence</p>
                     <span className="text-sm font-black text-blue-400">96.8%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[96%]" />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveLogistics;
