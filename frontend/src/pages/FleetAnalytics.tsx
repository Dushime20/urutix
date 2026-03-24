import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fleetApi, type TCOAnalysis } from '../services/fleetApi';
import TCOCharts from '../components/FleetDashboard/Analytics/TCOCharts';
import { Loader2, Zap, Fuel, DollarSign, CheckCircle, Filter, ArrowRight, Brain, Shield, AlertTriangle, TrendingUp, BarChart3, Activity, Clock } from 'lucide-react';
import { cn } from '../utils/cn';


const FleetAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tcoData, setTcoData] = useState<TCOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const PredictiveMaintenanceContainer = () => {
    const { data: maintenanceData, isLoading: logsLoading } = useQuery({
      queryKey: ['fleet-maintenance-all'],
      queryFn: () => fleetApi.getFleetMaintenance()
    });

    const logs = (maintenanceData as any)?.data?.logs || [];
    
    // Simulate AI Health Analysis
    const criticalIssues = logs.filter((l: any) => l.status === 'FAULT_REPORT').length;
    const pendingServices = logs.filter((l: any) => l.status === 'scheduled').length;
    const healthScore = Math.max(70, 100 - (criticalIssues * 15) - (pendingServices * 2));

    if (logsLoading) {
      return (
        <div className="p-20 text-center flex flex-col items-center">
          <Brain className="animate-pulse text-blue-600 mb-4" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Engine Initializing...</p>
        </div>
      );
    }

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* AI Insight Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 p-10 bg-[#0f172a] rounded-[3rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity duration-1000 rotate-12">
                   <Brain size={240} className="text-blue-400" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/30">
                         <Zap size={18} />
                      </div>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Neural Insight Engine</span>
                   </div>
                   <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4 leading-none">Fleet Health <br />Projection</h2>
                   <p className="text-slate-400 text-sm font-medium max-w-md leading-relaxed">
                      Our AI models are analyzing {logs.length} historical service records and real-time fault reports to predict potential mechanical failures before they impact your operations.
                   </p>
                   
                   <div className="mt-10 flex flex-wrap gap-8 items-center border-t border-white/5 pt-10">
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fleet Integrity</span>
                          <span className="text-3xl font-black text-white">{healthScore}%</span>
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Failure Risks</span>
                          <span className="text-3xl font-black text-rose-500">{criticalIssues}</span>
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confidence</span>
                          <span className="text-3xl font-black text-blue-400">92%</span>
                       </div>
                   </div>
                </div>
            </div>

            <div className="p-8 bg-white border border-slate-100 rounded-[3rem] flex flex-col justify-between shadow-sm">
                <div>
                   <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-wider mb-2">Priority Alerts</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Immediate Attention Required</p>
                   
                   <div className="space-y-4">
                      {logs.slice(0, 3).map((log: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                           <div className={cn(
                             "size-8 rounded-xl flex items-center justify-center",
                             log.status === 'FAULT_REPORT' ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                           )}>
                              <AlertTriangle size={14} />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{log.truck?.plateNumber || 'UNIT-402'}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{log.taskName}</p>
                           </div>
                           <ArrowRight size={14} className="text-slate-300" />
                        </div>
                      ))}
                   </div>
                </div>
                <button className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-[#0f172a] hover:text-white transition-all">
                   Deploy Full Diagnostics
                </button>
            </div>
        </div>

        {/* Predictive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {[
              { label: 'Battery Lifespan', val: '84%', icon: Zap, status: 'Stable' },
              { label: 'Brake Integrity', val: '12%', icon: AlertTriangle, status: 'Critical' },
              { label: 'Engine Efficiency', val: '91%', icon: Activity, status: 'Optimal' },
              { label: 'Tire Wear (Avg)', val: '62%', icon: BarChart3, status: 'Scheduled' }
           ].map((stat, i) => (
              <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group">
                 <div className="flex items-center justify-between mb-4">
                    <div className="size-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                       <stat.icon size={18} />
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      stat.status === 'Critical' ? "text-rose-500" : "text-emerald-500"
                    )}>{stat.status}</span>
                 </div>
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                 <p className="text-2xl font-black text-[#0f172a] tracking-tight">{stat.val}</p>
              </div>
           ))}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (activeTab === 'tco') {
      loadTCOData();
    }
  }, [activeTab]);

  const loadTCOData = async () => {
    setLoading(true);
    try {
      const data = await fleetApi.getTCOAnalysis();
      setTcoData(data);
    } catch (error) {
      console.error('Failed to load TCO data', error);
    } finally {
      setLoading(false);
    }
  };

  const CircularStatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => {
    return (
      <div className="flex flex-col items-center group">
        <div className="relative w-40 h-40 rounded-full bg-white border-[8px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
          <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="452"
              strokeDashoffset="350"
              className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[200]", secondaryColor)}
            />
          </svg>

          <div className={cn("p-2 rounded-2xl mb-2 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
            <Icon size={18} />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-[#0f172a] tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {value}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center px-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-600 transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f8fafc] text-[#0f172a] font-sans">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          {/* Page Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">Analytics</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Overview</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center justify-center rounded-xl h-10 px-6 bg-white border border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm">
                <span>Export Report</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex border-b border-slate-100 px-2 gap-8 overflow-x-auto no-scrollbar">
              {['overview', 'fuel', 'tco', 'maintenance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 px-2 transition-all whitespace-nowrap ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest">{tab === 'tco' ? 'Costs' : `${tab.charAt(0).toUpperCase() + tab.slice(1)} ${tab === 'fuel' ? 'Stats' : tab === 'maintenance' ? 'Logs' : ''}`}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'tco' ? (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : tcoData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex flex-col gap-1">
                  <h2 className="text-xl font-black text-[#0f172a] uppercase tracking-tight">Costs</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expense summary</p>
                </div>
                <TCOCharts data={tcoData} />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-widest">Failed to load data</div>
            )
          ) : activeTab === 'maintenance' ? (
            <PredictiveMaintenanceContainer />
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <CircularStatsCard
                  title="Available"
                  value="94.2%"
                  icon={Zap}
                  colorClass="bg-blue-50 text-blue-600"
                  secondaryColor="text-blue-600"
                />
                <CircularStatsCard
                  title="Efficiency"
                  value="18.5 MPG"
                  icon={Fuel}
                  colorClass="bg-emerald-50 text-emerald-600"
                  secondaryColor="text-emerald-600"
                />
                <CircularStatsCard
                  title="Spend"
                  value="$42,850"
                  icon={DollarSign}
                  colorClass="bg-amber-50 text-amber-600"
                  secondaryColor="text-amber-600"
                />
                <CircularStatsCard
                  title="Compliance"
                  value="98%"
                  icon={CheckCircle}
                  colorClass="bg-primary-50 text-primary-500"
                  secondaryColor="text-primary-500"
                />
              </div>

              {/* Main Content Row: Charts & Calendar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Fuel & TCO Trend */}
                <div className="lg:col-span-2 flex flex-col gap-4 rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Fuel & Costs</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational breakdown</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#0f172a] tracking-tight">$124,500</p>
                      <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">On Budget</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-8 py-4">
                    <div className="relative h-[200px] w-full">
                      {/* SVG Chart */}
                      <svg viewBox="-3 0 478 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="paint0_linear" x1="236" y1="1" x2="236" y2="149" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#3b82f6" stopOpacity="0.1"></stop>
                            <stop offset="1" stopColor="#3b82f6" stopOpacity="0"></stop>
                          </linearGradient>
                        </defs>
                        <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
                        <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#3b82f6" strokeLinecap="round" strokeWidth="3"></path>
                      </svg>
                    </div>
                    <div className="flex justify-around border-t border-slate-50 pt-4">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => (
                        <p key={month} className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{month}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Maintenance Calendar Widget */}
                <div className="flex flex-col gap-4 rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Schedule</h3>
                    <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-700">View All</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-300 uppercase mb-2">
                    <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {/* Simplified calendar grid */}
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-slate-50 text-slate-300">24</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-slate-50 text-slate-300">25</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600">26</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-slate-50 text-slate-300">27</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-blue-50 border border-blue-100 text-blue-600">28</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-slate-50 text-slate-300">29</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-slate-50 text-slate-300">30</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-black text-[#0f172a] bg-slate-100">1</div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600">2</div>
                    {[3, 4, 5, 6, 7].map(d => (
                      <div key={d} className="h-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 hover:bg-slate-50 transition-colors">{d}</div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 group">
                      <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#0f172a] uppercase tracking-wide">F-150 Service</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit 402 • Oct 26</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 group">
                      <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-[#0f172a] uppercase tracking-wide">Tire Rotation</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit 911 • Oct 28</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Repairs Feed & Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* Breakdown & Repair Feed */}
                <div className="flex flex-col gap-4 rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Issues</h3>
                    <button className="text-slate-400 hover:text-blue-600 flex items-center gap-2 transition-colors">
                      <Filter className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-slate-50">
                        <tr>
                          <th className="pb-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Vehicle</th>
                          <th className="pb-4 text-[9px] font-black text-slate-300 uppercase tracking-widest">Description</th>
                          <th className="pb-4 text-[9px] font-black text-slate-300 uppercase tracking-widest text-center">Status</th>
                          <th className="pb-4 text-[9px] font-black text-slate-300 uppercase tracking-widest text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#0f172a] uppercase tracking-tight">Truck #882</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mack Anthem</span>
                            </div>
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Cooling Fault</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100">Critical</span>
                          </td>
                          <td className="py-4 text-right text-xs font-black text-[#0f172a]">$2,450</td>
                        </tr>
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#0f172a] uppercase tracking-tight">Van #104</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mercedes</span>
                            </div>
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Brake Pads</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100">Service</span>
                          </td>
                          <td className="py-4 text-right text-xs font-black text-[#0f172a]">$840</td>
                        </tr>
                        <tr className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-[#0f172a] uppercase tracking-tight">Unit #221</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tesla M3</span>
                            </div>
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-500 uppercase tracking-wide">Sys Update</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Resolved</span>
                          </td>
                          <td className="py-4 text-right text-xs font-black text-[#0f172a]">$0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cost Distribution by Vehicle Type */}
                <div className="flex flex-col gap-4 rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm">
                  <div className="flex flex-col gap-1 mb-2">
                    <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Spending</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category analysis</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-1">
                    <div className="flex flex-col gap-4">
                      {[
                        { label: 'Heavy Duty', pct: '52%', color: 'bg-slate-900' },
                        { label: 'Vans / Sprinters', pct: '28%', color: 'bg-blue-600' },
                        { label: 'Light Duty', pct: '12%', color: 'bg-emerald-500' },
                        { label: 'Electric (EV)', pct: '8%', color: 'bg-amber-500' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                          <div className="flex-1 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.label}</span>
                            <span className="text-xs font-black text-[#0f172a]">{item.pct}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center scale-110">
                      {/* Donut visualization */}
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#0f172a" strokeDasharray="163.36 251.32" strokeWidth="12" className="opacity-90"></circle>
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#2563eb" strokeDasharray="87.96 251.32" strokeDashoffset="-163.36" strokeWidth="12"></circle>
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#10b981" strokeDasharray="37.7 251.32" strokeDashoffset="-251.32" strokeWidth="12"></circle>
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f59e0b" strokeDasharray="25.13 251.32" strokeDashoffset="-289.02" strokeWidth="12"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-xl font-black text-[#0f172a] tracking-tight">$124k</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Total</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default FleetAnalytics;
