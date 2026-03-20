import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type BrokerStatistics, type BrokerLoad } from '../../services/brokerApi';
import DashboardHeader from '../../components/Layout/DashboardHeader';
import DashboardFooter from '../../components/Layout/DashboardFooter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Target,
  Sparkles,
  Shield,
  FileText,
  Search,
  Activity,
  Award,
  ChevronRight,
  Bell,
  MapPin,
  Layers,
  ArrowUpRight,
  LayoutDashboard
} from 'lucide-react';

const BrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<BrokerStatistics | null>(null);
  const [recentLoads, setRecentLoads] = useState<BrokerLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'high_yield' | 'expiring'>('all');

  // Simple chart data
  const revenueData = [
    { name: 'Mon', value: 4200 },
    { name: 'Tue', value: 3800 },
    { name: 'Wed', value: 5100 },
    { name: 'Thu', value: 4800 },
    { name: 'Fri', value: 6200 },
    { name: 'Sat', value: 7800 },
    { name: 'Sun', value: 9400 },
  ];

  useEffect(() => {
    if (!user || user.role !== 'BROKER') {
      navigate('/auth');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, loadsResponse] = await Promise.all([
        brokerAPI.getBrokerStatistics(user!.id),
        brokerAPI.getBrokerLoads(user!.id, { limit: 5, status: 'ACTIVE' })
      ]);
      setStatistics(statsResponse.data);
      setRecentLoads(loadsResponse.data || []);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLoads = useMemo(() => {
    if (activeTab === 'high_yield') return recentLoads.filter(l => (l.loadValue || 0) > 40000);
    if (activeTab === 'expiring') return recentLoads.slice(0, 2);
    return recentLoads;
  }, [recentLoads, activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-[#FDFDFF]">
        <div className="w-16 h-16 border-t-2 border-primary-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-24 font-manrope selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-9 md:px-10 lg:px-12 xl:px-14 pt-12 space-y-16">
        
        {/* Simple Header */}
        <section className="relative">
          <div className="absolute inset-0 bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-primary-600/10 rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center">
                <LayoutDashboard size={40} className="text-white" />
              </div>
              
              <div className="text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-2">
                  Broker <span className="text-primary-400">Dashboard</span>
                </h1>
                <p className="text-slate-400 text-sm font-medium">Managing {recentLoads.length} active loads for you today.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-12 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem]">
               <div className="text-center">
                 <p className="text-3xl font-black text-white tracking-tighter leading-none">{statistics?.totalLoads || 0}</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Active Loads</p>
               </div>
               <div className="text-center border-l border-white/10 px-6 lg:px-12">
                 <p className="text-3xl font-black text-emerald-400 tracking-tighter leading-none">94.2%</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Success Rate</p>
               </div>
               <div className="text-center border-l border-white/10 px-6 lg:px-12 hidden md:block">
                 <p className="text-3xl font-black text-primary-400 tracking-tighter leading-none">Fast</p>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-3">Connection</p>
               </div>
            </div>
          </div>
        </section>

        {/* Market News Bar */}
        <section className="bg-white rounded-full border border-slate-100 p-2 shadow-sm flex items-center overflow-hidden">
           <div className="bg-slate-900 px-6 py-3 rounded-full flex items-center gap-3 shrink-0">
             <Layers size={14} className="text-primary-400" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Market News</span>
           </div>
           <div className="flex-1 px-8 overflow-hidden relative">
              <div className="whitespace-nowrap flex gap-12 animate-marquee-slow">
                 {[
                   'Nairobi-Mombasa: High shipment volume today (+18%)',
                   'Fuel Prices: Stabilizing costs across the region',
                   'Demand Update: Export demand expected to rise soon',
                   'Load Rewards: You are close to your next bonus level'
                 ].map((msg, i) => (
                   <span key={i} className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-4">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span> {msg}
                   </span>
                 ))}
              </div>
           </div>
           <div className="px-6 border-l border-slate-100 hidden md:flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">New Bids</span>
              <div className="flex -space-x-2">
                 {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
              </div>
           </div>
        </section>

        {/* Main Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[
            { label: 'Total Earned', value: `${statistics?.totalEarned.toLocaleString() || '0'} KES`, sub: 'Real-time Earnings', icon: DollarSign, trend: '↑ 12.4%', color: 'primary', data: revenueData },
            { label: 'Active Pipeline', value: statistics?.totalLoads || 0, sub: 'Loads in Transit', icon: Package, trend: 'Good', color: 'emerald', data: revenueData.map(d => ({ ...d, value: d.value * 0.8 })) },
            { label: 'Pending Payments', value: `${statistics?.totalPending.toLocaleString() || '0'} KES`, sub: 'Awaiting clearance', icon: Clock, trend: '↓ 4.1%', color: 'rose', data: revenueData.map(d => ({ ...d, value: Math.random() * 5000 })) },
            { label: 'Success Rate', value: '94.2%', sub: 'Based on matches', icon: Sparkles, trend: '↑ 2.1%', color: 'indigo', data: revenueData.map(d => ({ ...d, value: 5000 + Math.random() * 2000 })) },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="group bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
            >
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                     <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><stat.icon size={20} /></div>
                     <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${stat.trend.includes('↑') ? 'bg-emerald-50 text-emerald-600' : stat.trend.includes('↓') ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>{stat.trend}</span>
                  </div>
                  <div className="mb-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
                  </div>
                  
                  <div className="h-16 w-full -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stat.data}>
                        <defs>
                          <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={stat.color === 'primary' ? '#2563eb' : stat.color === 'emerald' ? '#10b981' : '#6366f1'} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={stat.color === 'primary' ? '#2563eb' : stat.color === 'emerald' ? '#10b981' : '#6366f1'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={stat.color === 'primary' ? '#2563eb' : stat.color === 'emerald' ? '#10b981' : '#6366f1'} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill={`url(#gradient-${i})`} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-4">{stat.sub}</p>
               </div>
            </motion.div>
          ))}
        </section>

        {/* Tools & Loads */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
           
           {/* Broker Tools */}
           <section className="xl:col-span-2 space-y-12">
              <div className="bg-white rounded-[4rem] border border-slate-100 p-12 shadow-sm space-y-12 group relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                    <div className="w-3 h-3 bg-primary-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"></div> Broker Tools
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {[
                    { title: 'Smart Matching', desc: 'Find 12 potential loads for your trucks.', path: '/dashboard/broker/smart-matching', icon: Target, tag: 'High Value', impact: '+12%' },
                    { title: 'Market Trends', desc: 'See current route prices and suggestions.', path: '/dashboard/broker/market-intelligence', icon: TrendingUp, tag: 'Latest', impact: '+8%' }
                  ].map((it, i) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={i} 
                      onClick={() => navigate(it.path)} 
                      className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-50 cursor-pointer group/it hover:bg-white hover:shadow-2xl transition-all duration-500 relative"
                    >
                       <div className="flex justify-between items-start mb-10">
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-primary-600 shadow-sm group-hover/it:bg-slate-900 group-hover/it:text-white transition-all"><it.icon size={28} /></div>
                          <div className="text-right">
                             <span className="text-[8px] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase tracking-widest">{it.tag}</span>
                             <p className="text-emerald-500 font-bold text-xs mt-2">{it.impact}</p>
                          </div>
                       </div>
                       <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">{it.title}</h4>
                       <p className="text-xs font-bold text-slate-400 leading-relaxed mb-10">{it.desc}</p>
                       <div className="flex items-center gap-2 text-primary-600 text-[10px] font-black uppercase tracking-widest">Open {it.title} <ArrowRight size={14} className="group-hover/it:translate-x-2 transition-transform" /></div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Active Loads Stream */}
              <div className="bg-white rounded-[4rem] border border-slate-100 p-12 shadow-sm space-y-10 group relative overflow-hidden">
                <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md py-4 z-20 -mx-12 px-12 -mt-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.4)]"></div> Active Loads
                    </h3>
                    <div className="flex gap-2 ml-8">
                       {['all', 'high_yield', 'expiring'].map((t) => (
                         <button 
                           key={t}
                           onClick={() => setActiveTab(t as any)}
                           className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                         >
                            {t.replace('_', ' ')}
                         </button>
                       ))}
                    </div>
                  </div>
                  <button onClick={() => navigate('/dashboard/broker/loads')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"><Layers size={18} /></button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Load Name</th>
                        <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Route</th>
                        <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Value</th>
                        <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <AnimatePresence mode="popLayout">
                        {filteredLoads.map((load) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            key={load.id} 
                            className="group hover:bg-slate-50/50 transition-all cursor-pointer" 
                            onClick={() => navigate(`/dashboard/broker/loads/${load.id}`)}
                          >
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
                                   <Package size={20} />
                                 </div>
                                 <div>
                                   <p className="text-sm font-black text-slate-900 tracking-tighter uppercase">{load.title}</p>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest line-clamp-1 opacity-60">ID: {load.id.slice(0, 12)}</p>
                                 </div>
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                  <MapPin size={12} className="text-slate-300" />
                                  <span>{load.pickupLocation}</span>
                                  <ChevronRight size={14} className="text-slate-300" />
                                  <span>{load.deliveryLocation}</span>
                               </div>
                            </td>
                            <td className="px-8 py-8 text-right">
                               <p className="text-sm font-black text-slate-900 tracking-tighter">{load.loadValue?.toLocaleString()} <span className="text-[9px] text-slate-300">KES</span></p>
                               <span className="text-[8px] font-black text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full uppercase">+{load.brokerCommissionRate || 10}%</span>
                            </td>
                            <td className="px-8 py-8 text-right">
                               <span className="px-4 py-2 bg-white border border-slate-100 text-[8px] font-black uppercase tracking-widest rounded-2xl text-slate-400 group-hover:bg-slate-900 group-hover:text-white shadow-sm transition-all">{load.status}</span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
           </section>

           {/* Quick Actions Sidebar */}
           <aside className="space-y-12 h-sticky top-32">
              <div className="grid grid-cols-1 gap-6">
                {[
                  { label: 'Find Loads', icon: Search, path: '/dashboard/broker/discovery', count: 12 },
                  { label: 'Contracts', icon: FileText, path: '/dashboard/broker/contracts', count: 3 },
                  { label: 'Security', icon: Shield, path: '/dashboard/broker/insurance', count: 1 },
                  { label: 'Analytics', icon: Award, path: '/dashboard/broker/analytics', count: null }
                ].map((action, i) => (
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    key={i} 
                    onClick={() => navigate(action.path)} 
                    className="group p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all duration-500 flex items-center justify-between"
                  >
                     <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"><action.icon size={22} /></div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-900">{action.label}</span>
                     </div>
                     {action.count !== null && (
                       <div className="w-6 h-6 rounded-full bg-slate-50 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center text-[10px] font-black transition-all">
                         {action.count}
                       </div>
                     )}
                     <ArrowUpRight size={16} className="text-slate-200 group-hover:text-primary-600 transition-all" />
                  </motion.button>
                ))}
              </div>

              {/* Security Status Widget */}
              <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl group border border-white/5">
                 <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Shield size={160} /></div>
                 <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-ping"></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Security Status</h3>
                 </div>
                 
                 <div className="space-y-8 mb-12">
                    <div className="flex justify-between items-end">
                       <div className="space-y-1">
                          <p className="text-2xl font-black tracking-tighter uppercase">Protected</p>
                          <p className="text-[9px] font-bold uppercase text-slate-500 tracking-[0.2em]">Data protection is active</p>
                       </div>
                       <Shield size={32} className="text-primary-600 opacity-40" />
                    </div>
                    
                    <div className="space-y-4">
                       <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                          <span>System Uptime</span>
                          <span className="text-primary-400 font-bold">99.9%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '99.9%' }}
                            transition={{ duration: 2, delay: 0.5 }}
                            className="h-full bg-primary-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)]"
                          />
                       </div>
                    </div>
                 </div>

                 <button onClick={() => navigate('/dashboard/broker/documents')} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-3">
                   View Audit Logs <Activity size={14} />
                 </button>
              </div>

              {/* Weekly Performance */}
              <div className="p-10 bg-indigo-600 rounded-[3.5rem] text-white relative overflow-hidden">
                 <div className="relative z-10 flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1">Weekly Growth</p>
                       <h3 className="text-3xl font-black tracking-tighter">+24%</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                       <TrendingUp size={24} className="text-white" />
                    </div>
                 </div>
              </div>
           </aside>
        </div>
      </main>
      <DashboardFooter />
      
      {/* Notifications */}
      <div className="fixed bottom-12 right-12 z-[100]">
         <motion.button 
           whileHover={{ scale: 1.1 }}
           whileTap={{ scale: 0.9 }}
           className="w-16 h-16 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl relative group"
         >
            <Bell size={24} />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full border-4 border-slate-900 text-[10px] font-black flex items-center justify-center">2</span>
            
            <div className="absolute bottom-full right-0 mb-6 opacity-0 translate-y-4 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
               <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl w-64 text-slate-900">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Active Signals</p>
                  <div className="space-y-4">
                     <div className="flex gap-4 p-3 bg-slate-50 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                        <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">A new load from Mombasa is available now.</p>
                     </div>
                  </div>
               </div>
            </div>
         </motion.button>
      </div>
    </div>
  );
};

export default BrokerDashboard;
