import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from '../../components/Layout/DashboardHeader';
import DashboardFooter from '../../components/Layout/DashboardFooter';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import {
  Package,
  DollarSign,
  TrendingUp,
  Clock,
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
  const { compact } = useCurrencyFormat();

  return (
    <div className="min-h-screen bg-[#FDFDFF] pb-24">
      <DashboardHeader />

      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 space-y-12 animate-fade-in">
        {/* Ultra-Compact Dashboard Header */}
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-100/60 dark:bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-[#345E85]/10 dark:bg-white/10 border border-[#345E85]/20 dark:border-white/20 flex items-center justify-center">
              <Activity size={24} className="text-[#345E85] dark:text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-none mb-1 text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-400 text-sm font-bold uppercase">
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
               <p className="text-xl font-bold leading-none text-primary-400">94%</p>
               <p className="text-xs font-bold text-slate-500 uppercase mt-0.5 dark:text-slate-400">Win Rate</p>
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
             <button key={i} onClick={() => navigate(btn.path)} className={`px-10 py-5 ${btn.color} text-white rounded-2xl text-sm font-bold uppercase shadow-xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all`}>
               <btn.icon size={16} /> {btn.label}
             </button>
           ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Net Revenue"
            value={compact(12450)}
            subtitle="commissions earned"
            icon={<DollarSign className="w-5 h-5" />}
            color="success"
            variant="premium"
            trend="15%"
            trendDirection="up"
          />
          <StatCard
            title="In Transit"
            value="8"
            subtitle="active shipments"
            icon={<Package className="w-5 h-5" />}
            color="primary"
            variant="premium"
          />
          <StatCard
            title="Pipeline"
            value={compact(3200)}
            subtitle="reserved commission"
            icon={<Clock className="w-5 h-5" />}
            color="warning"
            variant="premium"
          />
          <StatCard
            title="Win Rate"
            value="94%"
            subtitle="last 30 days"
            icon={<TrendingUp className="w-5 h-5" />}
            color="accent"
            variant="premium"
            trend="94.2%"
            trendDirection="up"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
           {/* Rapid Command */}
           <div className="space-y-8">
              <h3 className="text-sm font-bold text-slate-900 uppercase italic flex items-center gap-3 dark:text-white">
                 <div className="w-2 h-2 bg-primary-600 rounded-full"></div> Rapid Command
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { label: 'Asset Pipeline', icon: Package, desc: 'Manage assigned units', path: '/dashboard/broker/loads' },
                   { label: 'Bidding System', icon: Gavel, desc: 'Manage proposals', path: '/dashboard/broker/bidding' },
                   { label: 'Vector Analysis', icon: MapPin, desc: 'Track field assets', path: '/dashboard/broker/tracking' },
                   { label: 'Yield Records', icon: DollarSign, desc: 'Commission analytics', path: '/dashboard/broker/commissions' }
                 ].map((act, i) => (
                   <div key={i} onClick={() => navigate(act.path)} className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 dark:bg-slate-900 dark:border-slate-800">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all mb-8 shadow-sm transition-all dark:bg-slate-800/50"><act.icon size={24} /></div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2 uppercase italic dark:text-white">{act.label}</h4>
                      <p className="text-sm font-bold text-slate-400 uppercase leading-relaxed mb-8">{act.desc}</p>
                      <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase">Execute <ChevronRight size={14} className="group-hover:translate-x-2 transition-transform" /></div>
                   </div>
                 ))}
              </div>
           </div>

           {/* System Tools */}
           <div className="space-y-8">
              <h3 className="text-sm font-bold text-slate-900 uppercase italic flex items-center gap-3 dark:text-white">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full"></div> System Tools
              </h3>
              <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm space-y-6 dark:bg-slate-900 dark:border-slate-800">
                 {[
                   { label: 'Agreements', icon: FileText, desc: 'Manage load records', path: '/dashboard/broker/contracts' },
                   { label: 'Compliance', icon: Shield, desc: 'Verify safety specs', path: '/dashboard/broker/insurance' },
                   { label: 'Intelligence', icon: Sparkles, desc: 'Real-time market insights', path: '/dashboard/broker/market-intelligence' },
                   { label: 'Analysis', icon: BarChart3, desc: 'Performance mapping', path: '/dashboard/broker/analytics' }
                 ].map((tool, i) => (
                   <div key={i} onClick={() => navigate(tool.path)} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-transparent hover:bg-white hover:border-slate-100 hover:shadow-xl transition-all cursor-pointer group/t">
                      <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover/t:bg-slate-900 group-hover/t:text-white transition-all shadow-sm dark:bg-slate-900"><tool.icon size={20} /></div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 uppercase italic dark:text-white">{tool.label}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase">{tool.desc}</p>
                         </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm text-slate-200 group-hover/t:text-primary-600 transition-colors dark:bg-slate-900"><ChevronRight size={18} /></div>
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