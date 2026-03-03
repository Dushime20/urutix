import React from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  CheckCircle,
  Navigation,
  AlertTriangle,
  MessageSquare,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface QuickActionsProps {
  driverId: string;
}

export const QuickActions: React.FC<QuickActionsProps> = () => {
  const primaryProtocols = [
    { id: 'start', title: 'Start Trip', icon: Play, color: 'bg-emerald-500', desc: 'Begin new trip' },
    { id: 'pause', title: 'Pause Trip', icon: Pause, color: 'bg-amber-500', desc: 'Take a break' },
    { id: 'complete', title: 'Complete Trip', icon: CheckCircle, color: 'bg-[#345E85]', desc: 'Finish current trip' },
    { id: 'navigate', title: 'Navigate', icon: Navigation, color: 'bg-indigo-500', desc: 'Get directions' }
  ];

  const intelligenceAccess = [
    { id: 'earnings', title: 'Earnings', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'schedule', title: 'Schedule', icon: Calendar, color: 'text-blue-500' },
    { id: 'performance', title: 'Score', icon: Activity, color: 'text-purple-500' },
    { id: 'docs', title: 'Documents', icon: FileText, color: 'text-slate-500' },
    { id: 'msgs', title: 'Messages', icon: MessageSquare, color: 'text-pink-500' },
    { id: 'hazard', title: 'Report', icon: AlertTriangle, color: 'text-rose-500' }
  ];

  return (
    <div className="space-y-10">
      {/* Strategic Protocols */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100">
            <Zap size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Quick Actions</h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Trip Controls</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {primaryProtocols.map((protocol) => (
            <motion.button
              key={protocol.id}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-[2rem] p-8 text-left transition-all shadow-xl shadow-slate-200/40 border border-transparent hover:border-slate-100 bg-[#345E85]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
                <protocol.icon size={80} className="text-white" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-6">
                  <protocol.icon size={24} />
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">{protocol.title}</h4>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">{protocol.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Intelligence Grid */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#345E85]">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Quick Access</h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">Dashboard & Tools</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {intelligenceAccess.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05, backgroundColor: '#fff' }}
              whileTap={{ scale: 0.95 }}
              className="bg-slate-50/50 border border-slate-100 rounded-[1.5rem] p-6 text-center transition-all hover:shadow-xl hover:shadow-slate-200/40 group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#345E85] shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:rotate-12 transition-transform border border-blue-100">
                <item.icon size={20} />
              </div>
              <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">{item.title}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Emergency Response */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 group"
      >
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200 group-hover:animate-pulse">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-sm font-black text-rose-900 uppercase tracking-tight">Emergency Actions</h3>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-1">Immediate Assistance Required?</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95">
            Emergency Call
          </button>
          <button className="px-8 py-4 bg-white border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95">
            Report Accident
          </button>
        </div>
      </motion.div>

      {/* Audit Trail */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <Clock size={80} />
        </div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Recent Actions</h3>
        <div className="space-y-6">
          {[
            { msg: 'Trip MN-ORD-2024-001 completed', time: '2 hours ago', icon: CheckCircle },
            { msg: 'Location updated', time: '15 minutes ago', icon: MapPin },
            { msg: 'Message sent to dispatch', time: '1 hour ago', icon: MessageSquare }
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-4 group/log">
              <div className="w-2 h-2 rounded-full bg-[#345E85]" />
              <div className="flex-1">
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight group-hover/log:translate-x-1 transition-transform">{log.msg}</p>
                <p className="text[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{log.time}</p>
              </div>
              <log.icon size={14} className="text-[#345E85]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
