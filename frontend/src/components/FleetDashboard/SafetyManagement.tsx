import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  Bell,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Download,
  Car,
  Wrench,
  CheckCircle2,
  X,
  Clock,
  Calendar,
  MapPin,
  User,
  Truck,
  DollarSign,
  FileText,
  Search,
  Filter,
  ChevronRight,
  Activity,
  Zap,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  SafetyIncident, SafetyInspection, DriverSafetyScore, SafetyTraining,
  SafetyAlert, SafetyInspectionItem
} from '../../types/fleet';
import { useAuth } from '../../contexts/AuthContext';

interface SafetyManagementProps {
  fleetId?: string;
}

export const SafetyManagement: React.FC<SafetyManagementProps> = ({ fleetId }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockSafetyStats = {
    safetyScore: 92,
    incidents: 2,
    inspections: 14
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'major': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'moderate': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string; trend?: string }) => (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] -mr-4 -mt-4 group-hover:scale-110 transition-transform">
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`size-10 rounded-xl flex items-center justify-center ${color} shadow-inner`}>
            <Icon size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 mb-1.5 uppercase tracking-wider">
              <Zap size={12} />
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-indigo-50 rounded-[20px] flex items-center justify-center text-indigo-600 shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-1">Protection Layer</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Safety & Risk Control</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Plus size={14} />
            Report Incident
          </button>
          <button className="h-12 px-6 bg-[#1A1C1E] text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2">
            <Download size={14} />
            Safety Audit
          </button>
        </div>
      </div>

      {/* Safety Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Active Safety Index" value={`${mockSafetyStats.safetyScore}%`} icon={Shield} trend="High Integrity" color="bg-emerald-50 text-emerald-600" />
        <StatCard title="Total Vector Incidents" value={mockSafetyStats.incidents} icon={AlertTriangle} trend="Critical Pulse" color="bg-rose-50 text-rose-600" />
        <StatCard title="Completed Inspections" value={mockSafetyStats.inspections} icon={ClipboardCheck} trend="Live Sync" color="bg-blue-50 text-blue-600" />
      </div>

      {/* Navigation Vectors */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-[24px] border border-slate-100 shadow-sm w-fit max-w-full overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'incidents', label: 'Incident Matrix', icon: AlertTriangle },
          { id: 'inspections', label: 'Hardware Audit', icon: ClipboardCheck },
          { id: 'training', label: 'Operator Training', icon: GraduationCap },
          { id: 'scores', label: 'Performance Scores', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                ? 'bg-[#1A1C1E] text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Vector */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden"
        >
          {activeTab === 'overview' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Safety Strategic Overview</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Risk Monitoring Feed</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="size-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                        <User size={12} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">3 Operators Active</span>
                </div>
              </div>

              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Critical Alerts Feed</h4>
                  <div className="p-5 bg-rose-50/50 rounded-[28px] border border-rose-100 flex items-start gap-4">
                    <div className="size-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm flex-shrink-0">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 mb-1">Unit ABC-123: Inspection Failure</p>
                      <p className="text-xs text-rose-600 font-medium">Brake system integrity compromised. Operational lockout active.</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <Clock size={10} /> 14:32:05
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-500 px-2 py-0.5 bg-rose-100 rounded-full">Immediate Action Required</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50/50 rounded-[28px] border border-amber-100 flex items-start gap-4">
                    <div className="size-10 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 mb-1">Operator Training Latency</p>
                      <p className="text-xs text-amber-600 font-medium">John Smith: Defensive Driving Protocol refresher due in 48 hours.</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                          <Clock size={10} /> 09:15:22
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-500 px-2 py-0.5 bg-amber-100 rounded-full">Routine Vector</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1C1E] rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 p-16 opacity-[0.05] grayscale rotate-12 -mr-10 -mb-10">
                    <Shield size={160} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-8">Asset Integrity Matrix</h4>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Brake Systems Sync</span>
                          <span className="text-xs font-black">98.4%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "98.4%" }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Payload Safety Vector</span>
                          <span className="text-xs font-black">94.2%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "94.2%" }}
                            className="h-full bg-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Telemetry Hardware Lock</span>
                          <span className="text-xs font-black">100%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'overview' && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6">
                <Shield size={32} className="opacity-20" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{activeTab} Interface Protocol Active</p>
              <p className="text-sm font-medium text-slate-400 mt-2">Vector synchronization to Enlite Prime standards in progress.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};