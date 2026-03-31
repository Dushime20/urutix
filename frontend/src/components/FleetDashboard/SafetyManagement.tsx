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
        <div className="relative w-40 h-40 rounded-full bg-white dark:bg-gray-900 border-[8px] border-gray-50 dark:border-gray-800 flex flex-col items-center justify-center transition-all duration-500 hover:border-gray-100 dark:hover:border-gray-700">
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

          <div className={cn("p-2 rounded-2xl mb-2 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-white dark:group-hover:bg-gray-700 group-hover:text-inherit transition-all duration-500", colorClass)}>
            <Icon size={18} />
          </div>

          <div className="flex flex-col items-center px-4 w-full overflow-hidden">
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:scale-110 transition-transform duration-500 truncate w-full text-center">
              {value}
            </span>
          </div>

          <div className="absolute inset-4 rounded-full border border-dashed border-gray-100 dark:border-gray-800 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
        </div>

        <div className="mt-4 text-center px-2">
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1">
            {title}
          </p>
        </div>
      </div>
    );
  };

  const IncidentsContainer = () => {
    const { data: incidentsData, isLoading } = useQuery({
      queryKey: ['safety-incidents'],
      queryFn: () => safetyApi.getIncidents()
    });

    const incidents = (incidentsData as any)?.data?.incidents || [];

    if (isLoading) {
      return (
        <div className="p-20 text-center flex flex-col items-center">
          <Activity className="animate-pulse text-primary-500 mb-4" size={32} />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Incidents...</p>
        </div>
      );
    }

    if (incidents.length === 0) {
      return (
        <div className="p-20 text-center flex flex-col items-center">
          <Shield className="text-slate-200 dark:text-slate-800 mb-6" size={48} />
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">No Incidents Reported</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">The fleet is currently operating within safe parameters.</p>
        </div>
      );
    }

    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Reported Incidents</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Audit Trail & Resolution Tracking</p>
          </div>
        </div>

        <div className="space-y-4">
          {incidents.map((incident: any) => (
            <div key={incident.id} className="p-6 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-300 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110",
                    incident.severity === 'critical' || incident.severity === 'major' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500" : "bg-primary-50 dark:bg-primary-950/30 text-primary-500"
                  )}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{incident.type.replace('_', ' ')}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                        incident.severity === 'critical' ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" :
                        incident.severity === 'major' ? "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400" :
                        "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                      )}>{incident.severity}</span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">{incident.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 line-clamp-2 max-w-2xl">{incident.description}</p>
                    <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest tracking-loose">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(incident.date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1.5"><Activity size={12} /> {incident.location}</span>
                      <span className="flex items-center gap-1.5"><User size={12} /> {incident.driverName || 'Unknown Driver'}</span>
                    </div>
                  </div>
                </div>
                <button className="h-10 px-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0f172a] dark:text-white hover:bg-[#0f172a] dark:hover:bg-slate-700 hover:text-white hover:border-[#0f172a] dark:hover:border-slate-600 transition-all shadow-sm">
                  Review Incident
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Matrix */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-gray-900 p-8 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center gap-5">
          <div className="size-14 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors duration-200">
            <Shield size={28} />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-500 mb-1">Safety Control</h2>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Fleet Safety</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 place-items-center bg-white dark:bg-gray-900 p-10 rounded-[3rem] border border-slate-100 dark:border-gray-800 shadow-sm transition-colors duration-200">
        <CircularStatsCard
          title="Safety Score"
          value={`${safetyStats.safetyScore}%`}
          icon={Shield}
          colorClass="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
          secondaryColor="text-emerald-600 dark:text-emerald-400"
        />
        <CircularStatsCard
          title="Safety Incidents"
          value={safetyStats.incidents}
          icon={AlertTriangle}
          colorClass="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
          secondaryColor="text-rose-600 dark:text-rose-400"
        />
        <CircularStatsCard
          title="Inspections Done"
          value={safetyStats.inspections}
          icon={ClipboardCheck}
          colorClass="bg-primary-50 dark:bg-primary-950/30 text-primary-500 dark:text-primary-400"
          secondaryColor="text-primary-500 dark:text-primary-400"
        />
      </div>

      {/* Navigation Vectors */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800 rounded-[24px] border border-slate-100 dark:border-gray-700 shadow-sm w-fit max-w-full overflow-x-auto transition-colors duration-200">
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
              ? 'text-primary-500 border-b-2 border-primary-500 bg-white dark:bg-gray-900 shadow-sm'
              : 'text-slate-400 dark:text-slate-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-gray-700'
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
          className="bg-white dark:bg-gray-900 rounded-[40px] border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-200"
        >
          {activeTab === 'overview' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Safety Overview</h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time Safety Updates</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-500">
                        <User size={12} />
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">3 Operators Active</span>
                </div>
              </div>

              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Recent Alerts</h4>
                  <div className="p-5 bg-rose-50/50 dark:bg-rose-950/20 rounded-[28px] border border-rose-100 dark:border-rose-900/30 flex items-start gap-4">
                    <div className="size-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-rose-500 shadow-sm flex-shrink-0 border border-transparent dark:border-gray-700">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Unit ABC-123: Inspection Failure</p>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Brake system integrity compromised. Operational lockout active.</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Clock size={10} /> 14:32:05
                        </span>
                        <span className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/50 rounded-full">Immediate Action Required</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50/50 dark:bg-amber-950/20 rounded-[28px] border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
                    <div className="size-10 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm flex-shrink-0 border border-transparent dark:border-gray-700">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Operator Training Latency</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">John Smith: Defensive Driving Protocol refresher due in 48 hours.</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Clock size={10} /> 09:15:22
                        </span>
                        <span className="text-[10px] font-black uppercase text-amber-500 dark:text-amber-400 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded-full">Coming Up</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1C1E] dark:bg-gray-800 rounded-[32px] p-8 text-white relative overflow-hidden transition-colors duration-200">
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

          {activeTab === 'incidents' && (
            <IncidentsContainer />
          )}

          {(activeTab !== 'overview' && activeTab !== 'inspections') && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-6">
                <Shield size={32} className="opacity-20" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{activeTab} loading</p>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mt-2">Loading information...</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};