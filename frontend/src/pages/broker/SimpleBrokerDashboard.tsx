import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from '../../components/Layout/DashboardHeader';
import DashboardFooter from '../../components/Layout/DashboardFooter';
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowRight,
  Shield,
  FileText,
  BarChart3,
  MapPin,
  Gavel,
  Activity,
  Zap,
  ChevronRight,
  Target,
  Sparkles
} from 'lucide-react';

const SimpleBrokerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-24 font-manrope">
      <DashboardHeader />

      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 space-y-12 animate-fade-in">
        {/* Ultra-Compact Dashboard Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl flex items-center justify-between group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
              <Activity size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none mb-1">Dashboard</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
                  const firstName = (user?.firstName && user.firstName.trim()) || 'BROKER';
                  return `${greeting}, ${firstName}`;
                })()}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-12 mr-4 text-right">
             <div className="text-center hidden md:block">
               <p className="text-xl font-black tracking-tighter leading-none text-primary-400">94%</p>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Win Rate</p>
             </div>
             <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/10 hover:scale-110 transition-all">
                <Zap size={18} className="text-white" />
             </div>
          </div>
        </div>

        {/* Primary Command Center */}
        <div className="flex flex-wrap gap-4">
           {[
             { label: 'Asset Pipeline', icon: Package, path: '/dashboard/broker/loads', color: 'bg-slate-900' },
             { label: 'Bidding', icon: Gavel, path: '/dashboard/broker/bidding', color: 'bg-primary-600' },
             { label: 'Vector Analysis', icon: MapPin, path: '/dashboard/broker/tracking', color: 'bg-indigo-600' },
           ].map((btn, i) => (
             <button key={i} onClick={() => navigate(btn.path)} className={`px-10 py-5 ${btn.color} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all`}>
               <btn.icon size={16} /> {btn.label}
             </button>
           ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {[
             { label: 'Net Revenue', value: '$12,450', trend: '↑ 15%', icon: DollarSign },
             { label: 'Transit', value: '8', trend: 'ACTIVE', icon: Package },
             { label: 'Pipeline', value: '$3,200', trend: 'RESERVE', icon: Clock },
             { label: 'Win Rate', value: '94%', trend: '94.2%', icon: TrendingUp }
           ].map((stat, i) => (
             <div key={i} className="group bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm transition-all hover:shadow-2xl overflow-hidden relative">
                <div className="relative z-10">
                   <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all mb-8 shadow-sm"><stat.icon size={20} /></div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{stat.value}</h3>
                   <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-2 block">{stat.trend}</span>
                </div>
             </div>
           ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
           {/* Rapid Command */}
           <div className="space-y-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-3">
                 <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Rapid Command
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { label: 'Asset Pipeline', icon: Package, desc: 'Manage assigned units', path: '/dashboard/broker/loads' },
                   { label: 'Bidding System', icon: Gavel, desc: 'Manage proposals', path: '/dashboard/broker/bidding' },
                   { label: 'Vector Analysis', icon: MapPin, desc: 'Track field assets', path: '/dashboard/broker/tracking' },
                   { label: 'Yield Records', icon: DollarSign, desc: 'Commission analytics', path: '/dashboard/broker/commissions' }
                 ].map((act, i) => (
                   <div key={i} onClick={() => navigate(act.path)} className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all mb-8 shadow-sm transition-all"><act.icon size={24} /></div>
                      <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">{act.label}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">{act.desc}</p>
                      <div className="flex items-center gap-2 text-primary-600 text-[9px] font-black uppercase tracking-widest">Execute <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" /></div>
                   </div>
                 ))}
              </div>
           </div>

           {/* System Tools */}
           <div className="space-y-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest italic flex items-center gap-3">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> System Tools
              </h3>
              <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-6">
                 {[
                   { label: 'Agreements', icon: FileText, desc: 'Manage load records', path: '/dashboard/broker/contracts' },
                   { label: 'Compliance', icon: Shield, desc: 'Verify safety specs', path: '/dashboard/broker/insurance' },
                   { label: 'Intelligence', icon: Sparkles, desc: 'Real-time market insights', path: '/dashboard/broker/market-intelligence' },
                   { label: 'Analysis', icon: BarChart3, desc: 'Performance mapping', path: '/dashboard/broker/analytics' }
                 ].map((tool, i) => (
                   <div key={i} onClick={() => navigate(tool.path)} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl transition-all cursor-pointer group/t">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover/t:bg-slate-900 group-hover/t:text-white transition-all shadow-sm"><tool.icon size={20} /></div>
                         <div>
                            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">{tool.label}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{tool.desc}</p>
                         </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm text-slate-200 group-hover/t:text-primary-600 transition-colors"><ChevronRight size={18} /></div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
};

export default SimpleBrokerDashboard;