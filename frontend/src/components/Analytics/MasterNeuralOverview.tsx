import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ShieldAlert, 
  Activity, 
  Globe2, 
  TrendingUp, 
  Box, 
  Maximize2,
  Target,
  Database,
  Layers,
  ArrowUpRight,
  Fingerprint,
  Zap
} from 'lucide-react';
import { analyticsApi } from '../../services/analyticsApi';
import { socketService } from '../../services/socketService';
import { cn } from '@/utils/cn';

const MasterNeuralOverview: React.FC = () => {
  const { user } = useAuth();
  const [pulse, setPulse] = useState(98.4);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real data from backend
  const { data: operationalPerformance } = useQuery({
    queryKey: ['analytics', 'operational-performance', user?.tenantId],
    queryFn: async () => {
      console.log('🧠 [Neural Overview] Fetching operational performance');
      const result = await analyticsApi.getOperationalPerformance();
      console.log('🧠 [Neural Overview] Operational Performance:', result);
      return result;
    },
    enabled: !!user?.tenantId,
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  const { data: financialSummary } = useQuery({
    queryKey: ['analytics', 'financial-summary', user?.tenantId],
    queryFn: async () => {
      console.log('🧠 [Neural Overview] Fetching financial summary');
      const result = await analyticsApi.getFinancialSummary({ timeRange: 'last_30_days' });
      console.log('🧠 [Neural Overview] Financial Summary:', result);
      return result;
    },
    enabled: !!user?.tenantId,
    refetchInterval: 15000
  });

  const { data: aiInsights } = useQuery({
    queryKey: ['analytics', 'ai-insights', user?.tenantId],
    queryFn: async () => {
      console.log('🧠 [Neural Overview] Fetching AI insights');
      const result = await analyticsApi.getComprehensiveAIInsights();
      console.log('🧠 [Neural Overview] AI Insights:', result);
      return result;
    },
    enabled: !!user?.tenantId,
    refetchInterval: 15000
  });

  // Calculate real stats from backend data
  const globalStats = {
    activeThreats: aiInsights?.riskAlerts?.length || 0,
    underUtilization: operationalPerformance?.totalShipments || 0,
    costSavings: Math.abs(financialSummary?.spendingChange?.amount || 0),
    networkEfficiency: operationalPerformance?.efficiencyScore || 0,
    planetaryReach: `${(operationalPerformance?.onTimeRate || 0).toFixed(1)}%`,
    neuralLatency: '14ms'
  };

  // Update pulse based on real efficiency score
  useEffect(() => {
    if (operationalPerformance?.efficiencyScore) {
      setPulse(operationalPerformance.efficiencyScore);
    }
  }, [operationalPerformance]);

  // Convert AI insights to anomalies
  useEffect(() => {
    if (aiInsights) {
      const newAnomalies: any[] = [];
      
      // Add risk alerts as anomalies
      if (aiInsights.riskAlerts && aiInsights.riskAlerts.length > 0) {
        aiInsights.riskAlerts.forEach((alert: any) => {
          newAnomalies.push({
            id: `risk-${Date.now()}-${Math.random()}`,
            type: alert.type?.toUpperCase() || 'RISK_ALERT',
            message: alert.message,
            severity: alert.severity?.toUpperCase() || 'MEDIUM',
            riskScore: Math.round(alert.confidence * 100) || 85,
            timestamp: new Date().toISOString()
          });
        });
      }

      // Add route optimizations as anomalies
      if (aiInsights.routeOptimizations && aiInsights.routeOptimizations.length > 0) {
        aiInsights.routeOptimizations.slice(0, 3).forEach((opt: any) => {
          newAnomalies.push({
            id: `route-${Date.now()}-${Math.random()}`,
            type: 'ROUTE_OPTIMIZATION',
            message: opt.issue || 'Route optimization opportunity detected',
            severity: 'MEDIUM',
            riskScore: Math.round(opt.confidence * 100) || 75,
            timestamp: new Date().toISOString()
          });
        });
      }

      // Add cost predictions as anomalies
      if (aiInsights.costPredictions) {
        newAnomalies.push({
          id: `cost-${Date.now()}`,
          type: 'COST_PREDICTION',
          message: aiInsights.costPredictions.reason || 'Cost trend analysis available',
          severity: aiInsights.costPredictions.trend === 'increasing' ? 'HIGH' : 'LOW',
          riskScore: Math.round(aiInsights.costPredictions.confidence * 100) || 80,
          timestamp: new Date().toISOString()
        });
      }

      if (newAnomalies.length > 0) {
        setAnomalies(newAnomalies);
      }
    }
  }, [aiInsights]);

  const fetchData = async () => {
    try {
      // Add log entry for data refresh
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        event: "DATA_SYNC",
        message: `Analytics data synchronized. ${operationalPerformance?.totalShipments || 0} shipments tracked.`,
        confidence: (95 + Math.random() * 4.9).toFixed(2)
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    } catch (e) {
      console.error('🧠 [Neural Overview] Error:', e);
    }
  };

  useEffect(() => {
    fetchData();

    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
      
      socketService.on('suspicious_activity', (data: any) => {
         setAnomalies(prev => [data, ...prev].slice(0, 10));
         setLogs(prev => [{
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            event: "SECURITY_INTERCEPT",
            message: data.message,
            confidence: "99.9"
         }, ...prev].slice(0, 50));
      });
      
      socketService.on('safety_alert', (data: any) => {
         setAnomalies(prev => [{
           type: 'SAFETY',
           message: `Neural Guardian: Intervention triggered for ${data.metadata?.tripNumber}`,
           severity: 'HIGH',
           timestamp: new Date().toISOString()
         }, ...prev].slice(0, 10));
      });
    }

    return () => {
      socketService.off('suspicious_activity');
      socketService.off('safety_alert');
    };
  }, [operationalPerformance]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-indigo-950 p-4 md:p-8 font-sans relative overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Light Prime Background System */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(59,130,246,0.05),_transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-[1800px] mx-auto space-y-10 relative z-10">
        
        {/* LIGHT PRIME HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 pb-10 border-b border-slate-200">
           <div className="space-y-4">
              <div className="flex items-center gap-6">
                 <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                       <Fingerprint className="text-blue-600 w-8 h-8" />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                       <span className="text-[11px] font-black tracking-[0.4em] text-blue-600 uppercase">Neural Matrix: Online</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                       NEURAL WAR ROOM <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-2xl text-xl font-black">PRIME LIGHT</span>
                    </h1>
                 </div>
              </div>
           </div>

           <div className="flex flex-wrap items-center gap-6 md:gap-14 bg-white/50 backdrop-blur-sm border border-white/50 p-6 rounded-[2.5rem] shadow-sm">
              <div className="flex flex-col items-end border-r border-slate-200 pr-14 last:border-0 last:pr-0">
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Global Precision</span>
                 <div className="flex items-baseline gap-3">
                    <motion.span 
                      key={pulse}
                      className="text-5xl font-black text-slate-900 tracking-tighter"
                    >
                      {pulse.toFixed(1)}%
                    </motion.span>
                    <span className="text-[10px] font-black text-emerald-600">OPTIMAL</span>
                 </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-6">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                       <Layers className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 font-black uppercase">Cluster Alpha</p>
                       <p className="text-sm font-black text-slate-900">VERIFIED</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                       <Activity className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-[10px] text-slate-400 font-black uppercase">Network Sink</p>
                       <p className="text-sm font-black text-blue-600">{globalStats.neuralLatency}</p>
                    </div>
                 </div>
              </div>
           </div>
        </header>

        {/* TACTICAL GRID */}
        <div className="grid grid-cols-12 gap-8">
           
           {/* LEFT COLUMN: LIVE INTEL & LOGS */}
           <div className="col-span-12 lg:col-span-4 space-y-8">
              
              {/* TACTICAL FEED */}
              <section className="space-y-6">
                 <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                       <ShieldAlert className="text-rose-600 w-5 h-5" />
                       <h2 className="text-[11px] font-black text-slate-900 tracking-[0.2em] uppercase">Tactical Intelligence Hub</h2>
                    </div>
                    <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-3 py-1 rounded-full animate-pulse border border-rose-100">THREAT DETECTED</span>
                 </div>
                 
                 <div className="space-y-4 max-h-[520px] overflow-y-auto pr-3 custom-scrollbar scroll-smooth">
                    <AnimatePresence mode="popLayout">
                       {anomalies.map((anomaly, idx) => (
                          <motion.div 
                            key={anomaly.id || idx}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "relative bg-white border border-slate-100 rounded-[2rem] p-6 group hover:border-blue-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] transition-all cursor-pointer overflow-hidden",
                              anomaly.severity === 'HIGH' && "bg-gradient-to-br from-white to-rose-50/20 border-rose-100"
                            )}
                          >
                             <div className="flex justify-between items-start mb-4">
                                <span className={cn(
                                  "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter",
                                  anomaly.severity === 'HIGH' ? "bg-rose-100 text-rose-700" : "bg-blue-50 text-blue-700"
                                )}>
                                   {anomaly.type || 'NEURAL_EVENT'}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">{new Date().toLocaleTimeString()}</span>
                             </div>
                             <h3 className="text-base font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                                {anomaly.message || "Autonomous path deviation detected in South-East Sector."}
                             </h3>
                             <div className="mt-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div>
                                      <p className="text-2xl font-black text-slate-900">{anomaly.riskScore || '94'}<span className="text-xs text-blue-600 font-black">%</span></p>
                                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">Neural Conf.</p>
                                   </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all text-slate-500 shadow-sm">
                                   <ArrowUpRight size={18} />
                                </div>
                             </div>
                          </motion.div>
                       ))}
                    </AnimatePresence>
                 </div>
              </section>

              {/* NEURAL COMMAND LOG */}
              <section className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/10 h-[360px] flex flex-col">
                 <div className="p-5 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-black tracking-widest text-white/50 uppercase">
                       <Database className="w-4 h-4" /> Orchestrator Output Log
                    </div>
                    <div className="flex gap-1.5">
                       <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    </div>
                 </div>
                 <div className="flex-1 p-6 font-mono text-[10px] overflow-y-auto space-y-4 custom-scrollbar-dark" ref={logContainerRef}>
                    {logs.map((log, i) => (
                       <div key={log.id || i} className="flex gap-4 group">
                          <span className="text-white/20 font-bold shrink-0">{log.timestamp}</span>
                          <div className="space-y-1">
                             <div className="flex items-center gap-3">
                                <span className="text-blue-400 font-black">[{log.event}]</span>
                                <span className="text-[9px] text-white/40 border border-white/10 px-1.5 rounded">CON: {log.confidence}</span>
                             </div>
                             <p className="text-white/80 group-hover:text-white transition-colors leading-relaxed">{log.message}</p>
                          </div>
                       </div>
                    ))}
                 </div>
                 <div className="p-4 bg-white/5 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 bg-black/40 rounded-2xl border border-white/10 focus-within:border-blue-500/50 transition-all">
                       <span className="text-blue-500 font-black">❱</span>
                       <input 
                         type="text" 
                         placeholder="Override Neural Directives..." 
                         className="bg-transparent border-none outline-none text-[10px] font-black text-white w-full placeholder:text-white/20 uppercase"
                       />
                    </div>
                 </div>
              </section>
           </div>

           {/* CENTER & RIGHT COLUMN: GLOBAL STATE & ANALYTICS */}
           <div className="col-span-12 lg:col-span-8 space-y-8">
              
              {/* TOP STRATEGIC CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-5 hover:shadow-[0_25px_50px_-15px_rgba(0,0,0,0.06)] transition-all group">
                    <div className="flex justify-between">
                       <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          <TrendingUp className="text-emerald-600" />
                       </div>
                       <ArrowUpRight className="text-slate-200 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <div>
                       <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">Cost Change (30d)</p>
                       <p className="text-4xl font-black text-slate-900 tracking-tighter">${globalStats.costSavings.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "px-2.5 py-1 rounded-full text-[10px] font-black",
                         (financialSummary?.spendingChange?.percentage || 0) < 0 
                           ? "bg-emerald-50 text-emerald-600" 
                           : "bg-rose-50 text-rose-600"
                       )}>
                         {(financialSummary?.spendingChange?.percentage || 0) < 0 ? '▼' : '▲'} {Math.abs(financialSummary?.spendingChange?.percentage || 0).toFixed(1)}%
                       </span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">vs Previous Period</span>
                    </div>
                 </div>

                 <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-5 hover:shadow-[0_25px_50px_-15px_rgba(0,0,0,0.06)] transition-all group">
                    <div className="flex justify-between">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <Box className="text-blue-600" />
                       </div>
                       <ArrowUpRight className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div>
                       <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Shipments</p>
                       <p className="text-4xl font-black text-slate-900 tracking-tighter">{globalStats.underUtilization}</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${Math.min(100, (operationalPerformance?.onTimeRate || 0))}%` }} 
                         className="h-full bg-blue-600" 
                       />
                    </div>
                 </div>

                 <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-5 hover:shadow-[0_25px_50px_-15px_rgba(0,0,0,0.06)] transition-all group">
                    <div className="flex justify-between">
                       <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                          <Globe2 className="text-indigo-600" />
                       </div>
                       <ArrowUpRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div>
                       <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">On-Time Delivery</p>
                       <p className="text-4xl font-black text-slate-900 tracking-tighter">{globalStats.planetaryReach}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      Efficiency Score: {globalStats.networkEfficiency.toFixed(1)}%
                    </p>
                 </div>
              </div>

              {/* PLANETARY VISUALIZATION HUB */}
              <div className="bg-white border border-slate-100 rounded-[3rem] h-full min-h-[580px] relative overflow-hidden group shadow-sm">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_rgba(59,130,246,0.08),_transparent_70%)] pointer-events-none" />
                 
                 {/* The Core Visualization (Light Version) */}
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                       <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-[520px] h-[520px] rounded-full bg-blue-50/30 border border-blue-100 animate-pulse" 
                       />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
                            className="w-[480px] h-[480px] rounded-full border border-dashed border-slate-200"
                          />
                          <Globe2 className="w-72 h-72 text-slate-100 absolute group-hover:text-blue-50 group-hover:scale-110 transition-all duration-1000" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.4)] z-20" />
                       </div>
                    </div>
                 </div>

                 {/* HUD Overlays - LIGHT */}
                 <div className="absolute top-12 left-12 space-y-10 z-20">
                    <div>
                       <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-slate-900 rounded-2xl">
                             <Target className="text-blue-400 w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-black text-slate-950 tracking-[0.1em] uppercase">Tactical Node Scan</h4>
                       </div>
                       <div className="flex flex-col gap-6">
                          <div className="p-6 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-lg shadow-slate-200/20 min-w-[200px]">
                             <p className="text-[10px] text-slate-400 font-black uppercase mb-1">On-Time Rate</p>
                             <p className="text-3xl font-black text-slate-950 tracking-tighter">
                               {(operationalPerformance?.onTimeRate || 0).toFixed(1)}%
                             </p>
                             <div className="h-1 w-full bg-blue-50 rounded-full mt-3 overflow-hidden">
                                <div 
                                  className="h-full bg-blue-600" 
                                  style={{ width: `${Math.min(100, operationalPerformance?.onTimeRate || 0)}%` }}
                                />
                             </div>
                          </div>
                          <div className="p-6 bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-lg shadow-slate-200/20 min-w-[200px]">
                             <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Efficiency Score</p>
                             <p className="text-3xl font-black text-emerald-600 tracking-tighter">
                               {(operationalPerformance?.efficiencyScore || 0).toFixed(1)}%
                             </p>
                             <div className="h-1 w-full bg-emerald-50 rounded-full mt-3 overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-600" 
                                  style={{ width: `${Math.min(100, operationalPerformance?.efficiencyScore || 0)}%` }}
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-12 right-12 flex flex-col gap-6 z-20 items-end">
                    <button className="px-8 py-5 bg-slate-950 text-white rounded-[1.5rem] text-[11px] font-black shadow-2xl shadow-slate-900/20 hover:bg-blue-700 transition-all uppercase tracking-[0.2em] flex items-center gap-4 group/btn">
                       Expand Planetary Analytics <Maximize2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <div className="flex items-center gap-4">
                       <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">Autonomous Sync</span>
                       <div className="w-14 h-7 bg-blue-600 rounded-full relative p-1.5 cursor-pointer">
                          <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-md" />
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-12 left-12 z-20">
                    <div className="bg-slate-50/50 border border-slate-100 backdrop-blur-md px-6 py-4 rounded-3xl">
                       <div className="flex items-center gap-4 mb-2">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full animate-pulse",
                            (aiInsights?.riskAlerts?.length || 0) > 2 ? "bg-rose-500" : 
                            (aiInsights?.riskAlerts?.length || 0) > 0 ? "bg-amber-500" : "bg-emerald-500"
                          )} />
                          <span className="text-[10px] font-black text-slate-900 tracking-widest uppercase">
                            Risk Alerts: {aiInsights?.riskAlerts?.length || 0} Active
                          </span>
                       </div>
                       <div className="flex gap-2 h-2 items-end">
                          {Array.from({ length: 9 }).map((_, i) => {
                            const height = 30 + Math.random() * 70;
                            const isHigh = height > 70;
                            return (
                              <div 
                                key={i} 
                                className={`w-3.5 rounded-full ${isHigh ? 'bg-rose-500' : 'bg-blue-600/30'}`} 
                                style={{ height: `${height}%` }} 
                              />
                            );
                          })}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MasterNeuralOverview;
