import React, { useState, useEffect } from 'react';
import { fleetApi, type TCOAnalysis } from '../services/fleetApi';
import TCOCharts from '../components/FleetDashboard/Analytics/TCOCharts';
import { Loader2, Zap, TrendingUp, TrendingDown, Fuel, DollarSign, CheckCircle } from 'lucide-react';
import { FleetHeader } from '../components/FleetDashboard/FleetHeader';
import StatCard from '../components/EnliteUI/Cards/StatCard';


const FleetAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tcoData, setTcoData] = useState<TCOAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#f6f6f8] text-[#0d121b] font-sans">
      {/* Header Section */}
      <FleetHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#0d121b] text-4xl font-black leading-tight tracking-tight">Fleet Health & Cost Analytics</h1>
              <p className="text-[#4c669a] text-base font-normal">Real-time fleet performance and financial insights across 142 vehicles</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-lg h-10 px-4 bg-white border border-[#cfd7e7] text-[#0d121b] text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>Last 30 Days</span>
              </button>
              <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-[#e7ebf3] text-[#0d121b] text-sm font-bold hover:bg-[#d0d7e6] transition-colors">
                <span className="truncate">Export Data</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-[#cfd7e7] px-2 gap-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 px-2 transition-colors ${activeTab === 'overview' ? 'border-[#135bec] text-[#0d121b]' : 'border-transparent text-[#4c669a] hover:text-[#135bec] hover:bg-slate-50'}`}
              >
                <p className="text-sm font-bold tracking-tight">Overview</p>
              </button>
              <button
                onClick={() => setActiveTab('fuel')}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 px-2 transition-colors ${activeTab === 'fuel' ? 'border-[#135bec] text-[#0d121b]' : 'border-transparent text-[#4c669a] hover:text-[#135bec] hover:bg-slate-50'}`}
              >
                <p className="text-sm font-bold tracking-tight">Fuel Analysis</p>
              </button>
              <button
                onClick={() => setActiveTab('tco')}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 px-2 transition-colors ${activeTab === 'tco' ? 'border-[#135bec] text-[#0d121b]' : 'border-transparent text-[#4c669a] hover:text-[#135bec] hover:bg-slate-50'}`}
              >
                <p className="text-sm font-bold tracking-tight">TCO Breakdown</p>
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-4 px-2 transition-colors ${activeTab === 'maintenance' ? 'border-[#135bec] text-[#0d121b]' : 'border-transparent text-[#4c669a] hover:text-[#135bec] hover:bg-slate-50'}`}
              >
                <p className="text-sm font-bold tracking-tight">Maintenance Logs</p>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'tco' ? (
            loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : tcoData ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-6 flex items-baseline gap-4">
                  <h2 className="text-2xl font-black text-slate-800">Total Cost of Ownership</h2>
                  <p className="text-slate-500 font-medium">Cost per Mile Analysis & Expense Breakdown</p>
                </div>
                <TCOCharts data={tcoData} />
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">Failed to load data</div>
            )
          ) : (
            /* Stats Grid (Overview) */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Fleet Availability"
                  value="94.2%"
                  icon={<Zap />}
                  color="primary"
                  trend="1.2%"
                  trendDirection="up"
                  subtitle="System Uptime"
                />
                <StatCard
                  title="Fuel Efficiency"
                  value="18.5 MPG"
                  icon={<Fuel />}
                  color="primary"
                  trend="0.5%"
                  trendDirection="down" // Down means worse efficiency usually, or less consumption? Context implies 18.5 is good if industry avg is 16.2. If arrow is downward relative to previous, let's keep it. Original had arrow_downward red.
                  subtitle="Vs. Industry Avg: 16.2 MPG"
                />
                <StatCard
                  title="Monthly Fuel Spend"
                  value="$42,850"
                  icon={<DollarSign />}
                  color="primary" // Warning for spend often makes sense, or success if under budget.
                  trend="2.1%"
                  trendDirection="up" // Upward spend is usually bad (red in original)
                  subtitle="Projected: $45,000"
                />
                <StatCard
                  title="Maintenance Compliance"
                  value="98%"
                  icon={<CheckCircle />}
                  color="primary"
                  trend="+0.8%"
                  trendDirection="up"
                  subtitle="Scheduled tasks"
                />
              </div>

              {/* Main Content Row: Charts & Calendar */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Fuel & TCO Trend */}
                <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl bg-white border border-[#cfd7e7] p-6 shadow-none">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-[#0d121b] text-lg font-bold">Fuel & TCO Trend</h3>
                      <p className="text-[#4c669a] text-sm font-normal">Comparing monthly fuel costs against total operational expenses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#0d121b] tracking-tight text-2xl font-bold">$124,500 Total</p>
                      <p className="text-[#07883b] text-xs font-bold uppercase tracking-wider">On Budget</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-8 py-4">
                    <div className="relative h-[200px] w-full">
                      {/* SVG Chart - Using the path from provided template */}
                      <svg viewBox="-3 0 478 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="paint0_linear" x1="236" y1="1" x2="236" y2="149" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#135bec" stopOpacity="0.2"></stop>
                            <stop offset="1" stopColor="#135bec" stopOpacity="0"></stop>
                          </linearGradient>
                        </defs>
                        <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H326.769H0V109Z" fill="url(#paint0_linear)"></path>
                        <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#135bec" strokeLinecap="round" strokeWidth="3"></path>
                      </svg>
                    </div>
                    <div className="flex justify-around border-t border-gray-100 pt-4">
                      <p className="text-[#4c669a] text-xs font-bold uppercase">Jan</p>
                      <p className="text-[#4c669a] text-xs font-bold uppercase">Feb</p>
                      <p className="text-[#4c669a] text-xs font-bold uppercase">Mar</p>
                      <p className="text-[#4c669a] text-xs font-bold uppercase">Apr</p>
                      <p className="text-[#4c669a] text-xs font-bold uppercase">May</p>
                      <p className="text-[#4c669a] text-xs font-bold uppercase">Jun</p>
                    </div>
                  </div>
                </div>

                {/* Maintenance Calendar Widget */}
                <div className="flex flex-col gap-4 rounded-xl bg-white border border-[#cfd7e7] p-6 shadow-none">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-[#0d121b] text-lg font-bold">Upcoming Service</h3>
                    <button className="text-[#135bec] text-sm font-bold hover:underline">View Full</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#4c669a] uppercase mb-2">
                    <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Simplified calendar grid */}
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-gray-50 text-slate-400">24</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-gray-50 text-slate-400">25</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-orange-100 border border-orange-200 text-orange-800 font-bold shadow-sm">26</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-gray-50 text-slate-400">27</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-blue-100 border border-blue-200 text-blue-700 font-bold shadow-sm">28</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-gray-50 text-slate-400">29</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-gray-50 text-slate-400">30</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs font-bold text-[#0d121b]">1</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs bg-teal-50 border border-teal-100 text-teal-700 font-bold">2</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs text-slate-600">3</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs text-slate-600">4</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs text-slate-600">5</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs text-slate-600">6</div>
                    <div className="h-10 rounded-lg flex items-center justify-center text-xs text-slate-600">7</div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                      <div className="w-1.5 h-8 bg-[#f97316] rounded-full shadow-sm"></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#0d121b]">F-150 Service (Oil)</p>
                        <p className="text-xs text-[#4c669a]">Oct 26 • Unit 402</p>
                      </div>
                      <span className="material-symbols-outlined text-[#4c669a]">chevron_right</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                      <div className="w-1.5 h-8 bg-[#135bec] rounded-full shadow-sm"></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#0d121b]">EV Tire Rotation</p>
                        <p className="text-xs text-[#4c669a]">Oct 28 • Unit 911</p>
                      </div>
                      <span className="material-symbols-outlined text-[#4c669a]">chevron_right</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Repairs Feed & Donut */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                {/* Breakdown & Repair Feed */}
                <div className="flex flex-col gap-4 rounded-xl bg-white border border-[#cfd7e7] p-6 shadow-none">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[#0d121b] text-lg font-bold">Recent Breakdowns & Repairs</h3>
                    <button className="text-[#4c669a] text-sm font-medium hover:text-[#135bec] flex items-center gap-1 transition-colors">
                      <span className="material-symbols-outlined text-sm">filter_list</span> Filter
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="py-3 text-xs font-bold text-[#4c669a] uppercase">Vehicle</th>
                          <th className="py-3 text-xs font-bold text-[#4c669a] uppercase">Issue</th>
                          <th className="py-3 text-xs font-bold text-[#4c669a] uppercase text-center">Status</th>
                          <th className="py-3 text-xs font-bold text-[#4c669a] uppercase text-right">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#0d121b]">Truck #882</span>
                              <span className="text-xs text-[#4c669a]">Mack Anthem 2022</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-[#4c669a] font-medium">Engine Cooling Fault</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wide">High Priority</span>
                          </td>
                          <td className="py-4 text-right text-sm font-bold text-[#0d121b]">$2,450.00</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#0d121b]">Van #104</span>
                              <span className="text-xs text-[#4c669a]">Mercedes Sprinter</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-[#4c669a] font-medium">Brake Pad Replacement</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wide">In Repair</span>
                          </td>
                          <td className="py-4 text-right text-sm font-bold text-[#0d121b]">$840.50</td>
                        </tr>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-[#0d121b]">Unit #221</span>
                              <span className="text-xs text-[#4c669a]">Tesla Model 3</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-[#4c669a] font-medium">System Update Fail</td>
                          <td className="py-4 text-center">
                            <span className="px-2 py-1 rounded bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-wide">Fixed</span>
                          </td>
                          <td className="py-4 text-right text-sm font-bold text-[#0d121b]">$0.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Cost Distribution by Vehicle Type */}
                <div className="flex flex-col gap-4 rounded-xl bg-white border border-[#cfd7e7] p-6 shadow-none">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[#0d121b] text-lg font-bold">Cost Distribution</h3>
                    <p className="text-[#4c669a] text-sm font-normal">By Vehicle Category (Current Quarter)</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center flex-1">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#0d121b]"></div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm text-[#4c669a] font-medium">Heavy Duty</span>
                          <span className="text-sm font-bold">52%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#135bec]"></div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm text-[#4c669a] font-medium">Vans / Sprinters</span>
                          <span className="text-sm font-bold">28%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#0d9488]"></div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm text-[#4c669a] font-medium">Light Duty</span>
                          <span className="text-sm font-bold">12%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-[#f97316]"></div>
                        <div className="flex-1 flex justify-between">
                          <span className="text-sm text-[#4c669a] font-medium">Electric (EV)</span>
                          <span className="text-sm font-bold">8%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {/* Donut visualization using SVG */}
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          {/* Heavy Duty (52) */}
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#0d121b" strokeDasharray="163.36 251.32" strokeWidth="20"></circle>
                          {/* Vans (28) */}
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#135bec" strokeDasharray="87.96 251.32" strokeDashoffset="-163.36" strokeWidth="20"></circle>
                          {/* Light (12) */}
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#0d9488" strokeDasharray="37.7 251.32" strokeDashoffset="-251.32" strokeWidth="20"></circle>
                          {/* EV (8) */}
                          <circle cx="50" cy="50" fill="transparent" r="40" stroke="#f97316" strokeDasharray="25.13 251.32" strokeDashoffset="-289.02" strokeWidth="20"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-black text-[#0d121b]">$124k</span>
                          <span className="text-[10px] uppercase font-bold text-[#4c669a]">Total Spend</span>
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
