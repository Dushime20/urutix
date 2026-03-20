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
  Activity,
  ShieldCheck,
  Share2
} from 'lucide-react';
import { TranslatedText } from '../translated-text';

interface QuickActionsProps {
  driverId: string;
  onTabChange?: (tabId: string) => void;
  onTripAction?: (action: 'start' | 'pause' | 'resume' | 'complete') => void;
  onEmergency?: (type: 'call' | 'accident') => void;
  onOpenRelay?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  onTabChange, 
  onTripAction,
  onEmergency,
  onOpenRelay
}) => {
  const primaryProtocols = [
    { id: 'start', title: 'Start Trip', icon: Play, color: 'bg-emerald-500', desc: 'Begin new trip' },
    { id: 'pause', title: 'Pause Trip', icon: Pause, color: 'bg-amber-500', desc: 'Take a break' },
    { id: 'complete', title: 'Complete Trip', icon: CheckCircle, color: 'bg-[#345E85]', desc: 'Finish current trip' },
    { id: 'navigate', title: 'Navigate', icon: Navigation, color: 'bg-indigo-500', desc: 'Get directions' }
  ];

  const intelligenceAccess = [
    { id: 'checklist', title: 'Pre-Trip Check', icon: ShieldCheck, color: 'text-primary-600' },
    { id: 'earnings', title: 'Earnings', icon: DollarSign, color: 'text-emerald-500' },
    { id: 'schedule', title: 'Schedule', icon: Calendar, color: 'text-blue-500' },
    { id: 'docs', title: 'Documents', icon: FileText, color: 'text-slate-500' },
    { id: 'msgs', title: 'Messages', icon: MessageSquare, color: 'text-pink-500' },
    { id: 'relay', title: 'Send Message', icon: Share2, color: 'text-indigo-500' },
    { id: 'hazard', title: 'Report', icon: AlertTriangle, color: 'text-rose-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Strategic Protocols - Compact & Bright */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 shadow-sm">
            <Zap size={18} />
          </div>
          <div>
            <h3 className="text-[9px] font-black text-[#345E85] uppercase tracking-[0.3em] mb-0.5">
              <TranslatedText text="Quick Actions" />
            </h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">
              <TranslatedText text="Trip Controls" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryProtocols.map((protocol) => (
            <motion.button
              key={protocol.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (protocol.id === 'navigate') {
                  onTabChange?.('tracking'); 
                } else {
                  onTripAction?.(protocol.id as any);
                }
              }}
              className="group relative overflow-hidden rounded-[1.5rem] p-5 text-left transition-all bg-white border border-slate-100 shadow-lg shadow-slate-200/40 hover:border-blue-100"
            >
              <div className="absolute -top-2 -right-2 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
                <protocol.icon size={50} className="text-[#345E85]" />
              </div>
              <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg ${protocol.color}`}>
                  <protocol.icon size={18} />
                </div>
                <h4 className="text-[11px] font-black text-[#0f172a] uppercase tracking-wider mb-1">
                  <TranslatedText text={protocol.title} />
                </h4>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                  <TranslatedText text={protocol.desc} />
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Intelligence Grid - Compact */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#345E85] shadow-sm">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">
              <TranslatedText text="Quick Access" />
            </h3>
            <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight">
              <TranslatedText text="Dashboard & Tools" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {intelligenceAccess.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05, backgroundColor: '#fff' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const tabMap: Record<string, string> = {
                  'checklist': 'checklist',
                  'earnings': 'earnings',
                  'schedule': 'trips',
                  'docs': 'documents',
                  'msgs': 'messages',
                  'hazard': 'safety',
                  'relay': 'relay'
                };
                if (item.id === 'relay') {
                   onOpenRelay?.();
                } else {
                   onTabChange?.(tabMap[item.id] || 'overview');
                }
              }}
              className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-center transition-all hover:shadow-lg hover:shadow-slate-200/40 group hover:border-blue-100"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#345E85] shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:rotate-6 transition-transform border border-blue-100">
                <item.icon size={18} />
              </div>
              <p className="text-[8px] font-black text-[#0f172a] uppercase tracking-widest leading-tight">
                <TranslatedText text={item.title} />
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Response - Compact */}
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 flex flex-col justify-between gap-6 group"
        >
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200 group-hover:animate-pulse shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-[11px] font-black text-rose-900 uppercase tracking-tight">
                        <TranslatedText text="Emergency Actions" />
                    </h3>
                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-0.5 leading-none">
                        <TranslatedText text="Immediate Assistance Required?" />
                    </p>
                </div>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => onEmergency?.('call')}
                    className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg active:scale-95 shadow-rose-900/10"
                >
                    <TranslatedText text="Emergency Call" />
                </button>
                <button 
                    onClick={() => onEmergency?.('accident')}
                    className="flex-1 py-3.5 bg-white border border-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all active:scale-95"
                >
                    <TranslatedText text="Report Accident" />
                </button>
            </div>
        </motion.div>

        {/* Audit Trail - Compact */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5">
                <Clock size={60} />
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5">
                <TranslatedText text="Recent Actions" />
            </h3>
            <div className="space-y-4">
                {[
                    { msg: 'Trip MN-ORD completed', time: '2h ago', icon: CheckCircle },
                    { msg: 'Location updated', time: '15m ago', icon: MapPin },
                    { msg: 'Message to dispatch', time: '1h ago', icon: MessageSquare }
                ].map((log, i) => (
                    <div key={i} className="flex items-center gap-3 group/log">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#345E85] shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black text-[#0f172a] uppercase tracking-tight truncate group-hover/log:translate-x-1 transition-all">{log.msg}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{log.time}</p>
                        </div>
                        <log.icon size={12} className="text-[#345E85] opacity-50" />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
