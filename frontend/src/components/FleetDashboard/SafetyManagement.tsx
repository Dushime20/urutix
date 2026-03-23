import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  ClipboardCheck,
  GraduationCap,
  BarChart3,
  Plus,
  Download,
  Clock,
  User,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { FleetInspections } from './FleetInspections';
import { safetyApi } from '../../services/safetyApi';
import { useQuery } from '@tanstack/react-query';

interface SafetyManagementProps {
  fleetId?: string;
}

export const SafetyManagement: React.FC<SafetyManagementProps> = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: inspectionsData } = useQuery({
    queryKey: ['safety-stats'],
    queryFn: () => safetyApi.getInspections()
  });

  const inspectionsList = (inspectionsData as any)?.data?.inspections || [];
  const passedCount = inspectionsList.filter((i: any) => i.status === 'passed').length;
  const failedCount = inspectionsList.filter((i: any) => i.status === 'failed').length;

  const safetyScore = inspectionsList.length > 0 
    ? Math.round((passedCount / inspectionsList.length) * 100) 
    : 100;

  const safetyStats = {
    safetyScore: safetyScore,
    incidents: failedCount,
    inspections: inspectionsList.length
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
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-primary-50 rounded-[20px] flex items-center justify-center text-primary-500 shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">Safety Control</h2>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Safety</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-12 px-6 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
            <Plus size={14} />
            Report Incident
          </button>
          <button
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 font-medium">
            <Download size={14} />
            Safety Audit
          </button>
        </div>
      </div>

      {/* Safety Stat Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 place-items-center bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <CircularStatsCard
          title="Safety Score"
          value={`${safetyStats.safetyScore}%`}
          icon={Shield}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
        <CircularStatsCard
          title="Safety Incidents"
          value={safetyStats.incidents}
          icon={AlertTriangle}
          colorClass="bg-rose-50 text-rose-600"
          secondaryColor="text-rose-600"
        />
        <CircularStatsCard
          title="Inspections Done"
          value={safetyStats.inspections}
          icon={ClipboardCheck}
          colorClass="bg-primary-50 text-primary-500"
          secondaryColor="text-primary-500"
        />
      </div>

      {/* Navigation Vectors */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-[24px] border border-slate-100 shadow-sm w-fit max-w-full overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
          { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
          { id: 'training', label: 'Training', icon: GraduationCap },
          { id: 'scores', label: 'Driver Scores', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-11 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
              ? 'text-primary-500 border-b-2 border-primary-500 bg-white shadow-sm'
              : 'text-slate-400 hover:text-primary-500 hover:bg-white/50'
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
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Safety Overview</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Safety Updates</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="size-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                        <User size={12} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">3 Operators Active</span>
                </div>
              </div>

              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recent Alerts</h4>
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
                        <span className="text-[10px] font-black uppercase text-amber-500 px-2 py-0.5 bg-amber-100 rounded-full">Coming Up</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1C1E] rounded-[32px] p-8 text-white relative overflow-hidden">
                  <div className="absolute bottom-0 right-0 p-16 opacity-[0.05] grayscale rotate-12 -mr-10 -mb-10">
                    <Shield size={160} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-white/40 mb-8">System Health</h4>
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Brake Status</span>
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
                          <span className="text-[10px] font-black uppercase text-white/60">Cargo Safety</span>
                          <span className="text-xs font-black">94.2%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "94.2%" }}
                            className="h-full bg-primary-500"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-3">
                          <span className="text-[10px] font-black uppercase text-white/60">Hardware Status</span>
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

          {activeTab === 'inspections' && (
            <div className="p-8">
               <FleetInspections />
            </div>
          )}

          {(activeTab !== 'overview' && activeTab !== 'inspections') && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="size-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-200 mb-6">
                <Shield size={32} className="opacity-20" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{activeTab} loading</p>
              <p className="text-sm font-medium text-slate-400 mt-2">Loading information...</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};