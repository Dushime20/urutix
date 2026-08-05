import React from 'react';
import { 
  Truck, 
  FileText, 
  Calendar, 
  Activity, 
  Wrench, 
  Zap,
  Navigation,
  Gauge,
  History,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MaintenanceHealth } from './MaintenanceHealth';
import { TranslatedText } from '../translated-text';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/driverApi';
import { MaintenanceTicketModal } from './MaintenanceTicketModal';

interface MyTruckProps {
  driverId: string;
  truckData?: any;
}

export const MyTruck: React.FC<MyTruckProps> = ({ driverId, truckData }) => {
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = React.useState(false);

  const { data: driverProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => driverApi.getDriverProfile(driverId),
    enabled: !!driverId && !truckData,
  });

  const assignedTruckId = truckData?.id || driverProfile?.currentTruckId;

  const { data: fetchedTruck, isLoading: truckLoading } = useQuery({
    queryKey: ['assigned-truck', assignedTruckId],
    queryFn: () => driverApi.getAssignedTruck(assignedTruckId!),
    enabled: !!assignedTruckId && !truckData,
  });

  const truck = truckData || fetchedTruck;

  const { data: maintenanceData } = useQuery({
    queryKey: ['truck-maintenance', truck?.id],
    queryFn: () => driverApi.getMaintenanceHistory(truck!.id),
    enabled: !!truck?.id,
  });

  const isLoading = !truckData && (profileLoading || truckLoading);

  const serviceHistory = maintenanceData?.logs || [];

  const truckHistory = maintenanceData?.history || [];

  const specs = truck ? [
    { label: 'Payload Capacity', value: truck.payloadCapacity || (truck.capacityWeight ? `${truck.capacityWeight} kg` : 'N/A'), icon: Zap, color: 'text-blue-500' },
    { label: 'Fuel Type', value: truck.fuelEconomy || truck.fuelType || 'N/A', icon: Gauge, color: 'text-emerald-500' },
    { label: 'Year', value: truck.enginePower || (truck.year ? String(truck.year) : 'N/A'), icon: Activity, color: 'text-rose-500' },
    { label: 'Status', value: truck.trackingStatus || truck.status || 'N/A', icon: Navigation, color: 'text-blue-500' },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-20">
      
      {/* Loading state */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 animate-pulse">
            <Truck size={40} className="text-slate-200" />
          </div>
          <div className="h-4 w-40 bg-slate-100 rounded-lg animate-pulse mb-2" />
          <div className="h-3 w-56 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      )}

      {/* No truck assigned state */}
      {!truck && !isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
            <Truck size={40} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight mb-2">No Truck Assigned</h3>
          <p className="text-sm text-slate-400">You have not been assigned a truck yet. Contact your fleet manager.</p>
        </div>
      )}

      {/* 🚛 Compact Hero Section: Truck Profile */}
      {truck && (
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/30 relative overflow-hidden group">
        
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full lg:w-[280px] shrink-0"
          >
             <div className="aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-[#345E85]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Truck size={80} className="text-slate-300 group-hover:text-[#345E85] group-hover:scale-110 transition-all duration-700 ease-out" />
                
                <div className="mt-4 flex flex-col items-center z-10">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Assigned Unit</span>
                    <span className="text-xl font-black text-[#0f172a] tracking-widest">{truck.id}</span>
                </div>

                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="px-3 py-1 bg-[#345E85] text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-md shadow-[#345E85]/10">
                        <TranslatedText text="Active" />
                    </div>
                </div>
             </div>
          </motion.div>
          
          <div className="flex-1 text-center lg:text-left">
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#345E85] text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-100/50">
                      Standard Issue
                  </span>
                  <span className="text-slate-300 opacity-50">•</span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{truck.plateNumber}</p>
              </div>
              <h1 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter mb-6 leading-none">
                {truck.make ? `${truck.make} ${truck.model}` : truck.model}
              </h1>
            </motion.div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
               {specs.map((spec, idx) => (
                 <motion.div 
                    key={spec.label} 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 hover:bg-white dark:bg-slate-900 hover:shadow-lg hover:shadow-slate-200/40 transition-all cursor-default text-center lg:text-left"
                 >
                    <spec.icon size={16} className={`${spec.color} mb-2 lg:mx-0 mx-auto`} />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">
                        <TranslatedText text={spec.label} />
                    </p>
                    <p className="text-xs font-black text-[#0f172a] tracking-tight uppercase">{spec.value}</p>
                 </motion.div>
               ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {truck && (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* 🛠️ Diagnostics Sidebar */}
        <div className="xl:col-span-4 space-y-10">
          <MaintenanceHealth />
          
          {/* ⚠️ Stylized Fault Reporting (Lighter) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
                    <ShieldAlert size={28} className="group-hover:animate-pulse" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-[#0f172a] uppercase tracking-tight leading-none">
                        <TranslatedText text="Fault Reporting" />
                   </h3>
                   <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1 inline-block">Fleet Priority Response</span>
                </div>
            </div>
            
            <p className="text-xs text-slate-500 font-medium mb-10 leading-relaxed italic border-l-3 border-rose-100 pl-5">
                "Hear a weird noise? Lights flickering? Report immediately to maintenance for a priority evaluation."
            </p>
            
            <button 
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="w-full py-5 bg-[#345E85] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 shadow-xl shadow-blue-900/10 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
                <Wrench size={18} />
                <TranslatedText text="Open Maintenance Ticket" />
            </button>
          </motion.div>
        </div>

        {/* 📄 Main Content */}
        <div className="xl:col-span-8 space-y-10">
           {/* 🛡️ Compliance Center (Lighter) */}
           <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-12 border-b border-slate-50 pb-8">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-[#345E85] border border-slate-100 dark:border-slate-800 shadow-inner">
                             <FileText size={26} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Verification</p>
                            <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">
                                <TranslatedText text="Compliance & Permits" />
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(truck.complianceDocs || []).map((doc: any) => (
                        <div key={doc.label} className="group p-6 bg-slate-50/50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:bg-white dark:bg-slate-900 hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500">
                            <div className="flex items-start justify-between mb-6 text-xl">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 ${doc.warning ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    <FileText size={22} />
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${doc.warning ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                    {doc.status}
                                </div>
                            </div>
                            <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight mb-1">{doc.label}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 italic flex items-center gap-2">
                                <Calendar size={12} />
                                <TranslatedText text="Expires" />: {doc.expiry}
                            </p>
                            <button className="w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[#345E85] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                                <TranslatedText text="View Digital Copy" />
                            </button>
                        </div>
                    ))}
                    {(!truck.complianceDocs || truck.complianceDocs.length === 0) && (
                        <div className="col-span-2 text-center py-8 text-slate-400 text-sm">No compliance documents found.</div>
                    )}
                </div>
           </div>

           {/* 📅 History Timeline (Neutral) */}
           <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-5 mb-12">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shadow-sm">
                        <History size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Worklogs</p>
                        <h3 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">
                            <TranslatedText text="Service History" />
                        </h3>
                    </div>
                </div>

                <div className="space-y-6 relative ml-6">
                    <div className="absolute left-[20px] top-6 bottom-6 w-[2px] bg-slate-100" />
                    
                    {serviceHistory.length > 0 ? serviceHistory.map((service: any) => (
                        <div key={service.id} className="relative flex items-start gap-10 group">
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center z-10 group-hover:bg-[#345E85] group-hover:border-[#345E85] transition-all duration-300 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-white dark:bg-slate-900 transition-all duration-300" />
                            </div>

                            <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 group-hover:bg-white dark:bg-slate-900 group-hover:shadow-2xl group-hover:shadow-slate-200/40 transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{service.serviceDate?.split('T')[0] || service.date}</p>
                                            <span className="text-slate-300">•</span>
                                            <h4 className="text-sm font-black text-[#0f172a] uppercase tracking-tight">{service.taskName || service.type}</h4>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Completed at {service.providerName || service.shop}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-slate-400 text-sm">No service history available.</div>
                    )}
                </div>
           </div>
        </div>
      </div>
      )}

      {truck && (
      <>
      {/* 🚀 Legacy Assignment Matrix (Bright & Professional) */}
      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-50/30 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 relative z-10">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-[#345E85] border border-blue-100 shadow-sm">
                    <History size={30} />
                </div>
                <div>
                    <p className="text-[10px] font-black text-[#345E85] uppercase tracking-[0.4em] mb-1">
                        <TranslatedText text="Mission Logs" />
                    </p>
                    <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter">
                        <TranslatedText text="Truck Assignment History" />
                    </h3>
                </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-[10px] font-bold">
                <div className="px-3 border-r border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 uppercase tracking-widest mr-2">Tenure:</span>
                    <span className="text-[#0f172a] font-black italic">{maintenanceData?.tenureDays ? `${maintenanceData.tenureDays} Days` : 'N/A'}</span>
                </div>
                <div className="px-4">
                    <span className="text-slate-400 uppercase tracking-widest mr-2">Vehicles:</span>
                    <span className="text-[#345E85] font-black italic">{truckHistory.length > 0 ? `${truckHistory.length} Units` : 'N/A'}</span>
                </div>
            </div>
        </div>

        <div className="space-y-4 relative">
            {/* 🛤️ Visual Rail (Neutral) */}
            <div className="absolute left-[27.5px] top-6 bottom-6 w-[1.5px] bg-slate-100 hidden md:block" />

            {truckHistory.length > 0 ? truckHistory.map((history: any, idx: number) => (
                <motion.div 
                    key={history.id}
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-5 rounded-[2rem] border transition-all duration-300 group ${
                        history.current 
                        ? 'bg-[#345E85] border-[#345E85] shadow-lg shadow-[#345E85]/20' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                    <div className="flex flex-col xl:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5 flex-1 w-full">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-all duration-300 ${
                                history.current 
                                ? 'bg-white dark:bg-slate-900 text-[#345E85] border-white' 
                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 border-slate-100 dark:border-slate-800 group-hover:bg-white dark:bg-slate-900 group-hover:text-[#345E85] group-hover:border-blue-100'
                            }`}>
                                <Truck size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h4 className={`text-base font-black uppercase tracking-tight ${history.current ? 'text-white' : 'text-[#0f172a]'}`}>
                                        {history.model}
                                    </h4>
                                    {history.current && (
                                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[8px] font-black uppercase tracking-widest border border-white/20">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-3 items-center text-[10px]">
                                    <span className={`font-black tracking-widest ${history.current ? 'text-blue-100' : 'text-blue-600'}`}>
                                        {history.plate}
                                    </span>
                                    <span className={`text-slate-300 ${history.current ? 'text-white/30' : ''}`}>•</span>
                                    <span className={`font-medium uppercase tracking-widest italic ${history.current ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {history.period}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full xl:w-auto shrink-0">
                            <div className={`px-5 py-3 rounded-xl border flex flex-col justify-center min-w-[100px] ${
                                history.current ? 'bg-white/10 border-white/10' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 shadow-inner'
                            }`}>
                                <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${history.current ? 'text-blue-100' : 'text-slate-500'}`}>Missions</p>
                                <p className={`text-lg font-black italic tracking-tighter leading-none ${history.current ? 'text-white' : 'text-[#0f172a]'}`}>{history.missions}</p>
                            </div>
                            <div className={`px-5 py-3 rounded-xl border flex flex-col justify-center min-w-[100px] ${
                                history.current ? 'bg-white/10 border-white/10' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 shadow-inner'
                            }`}>
                                <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${history.current ? 'text-blue-100' : 'text-slate-500'}`}>Distance</p>
                                <p className={`text-lg font-black italic tracking-tighter leading-none ${history.current ? 'text-white' : 'text-[#0f172a]'}`}>{history.distance}</p>
                            </div>
                            <div className={`hidden lg:flex items-center justify-center w-12 h-12 rounded-xl border transition-all cursor-pointer ${
                                history.current 
                                ? 'bg-white dark:bg-slate-900 text-[#345E85] border-white shadow-md' 
                                : 'bg-white dark:bg-slate-900 text-[#345E85] border-slate-100 dark:border-slate-800 shadow-sm group-hover:bg-[#345E85] group-hover:text-white'
                            }`}>
                                <ArrowUpRight size={18} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )) : (
                <div className="text-center py-8 text-slate-400 text-sm">No truck assignment history available.</div>
            )}
        </div>
      </div>

      <MaintenanceTicketModal 
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        truckId={truck?.id}
        truckPlate={truck?.plateNumber}
      />
      </>
      )}
    </div>
  );
};
