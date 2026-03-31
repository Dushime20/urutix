import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Calendar, 
  Truck as TruckIcon, 
  User as UserIcon,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { safetyApi } from '../../services/safetyApi';
import { format } from 'date-fns';
import { Package } from 'lucide-react';
import { CargoInspectionReportModal } from './CargoInspectionReportModal';

export const FleetInspections: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCargoInspection, setSelectedCargoInspection] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: safetyData, isLoading: safetyLoading } = useQuery({
    queryKey: ['fleet-safety-inspections', statusFilter, typeFilter],
    queryFn: () => safetyApi.getInspections({
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter
    })
  });

  const { data: cargoData, isLoading: cargoLoading } = useQuery({
    queryKey: ['fleet-cargo-inspections'],
    queryFn: () => safetyApi.getCargoInspections()
  });

  const isLoading = safetyLoading || cargoLoading;

  const safetyInspections = Array.isArray((safetyData as any)?.data?.inspections) 
    ? (safetyData as any).data.inspections 
    : Array.isArray((safetyData as any)?.data)
    ? (safetyData as any).data
    : [];
  
  // Transform cargo loads into inspection objects if they have inspection metadata
  const rawCargoData = (cargoData as any)?.data?.data || (cargoData as any)?.data;
  const cargoInspections = (Array.isArray(rawCargoData) ? rawCargoData : [])
    .filter((load: any) => load?.metadata?.inspectionStatus === 'COMPLETED')
    .map((load: any) => ({
      id: `cargo-${load.id}`,
      type: 'cargo',
      inspectionDate: load.metadata?.inspectionCompletedAt || load.updatedAt,
      status: load.metadata?.inspectionResult?.status?.toLowerCase() || 'passed',
      inspector: load.metadata?.inspectionResult?.inspector || 'Driver',
      truckPlate: load.assignedTruck?.plateNumber || load.assignedTruck?.licensePlate || 'N/A',
      driverName: load.assignedDriver?.profile ? `${load.assignedDriver.profile.firstName} ${load.assignedDriver.profile.lastName}` : 'N/A',
      cargoTitle: load.title,
      isCargo: true,
      originalResult: load.metadata?.inspectionResult
    }));

  const allInspections = [...safetyInspections, ...cargoInspections];

  const filteredInspections = allInspections
    .filter((inspection: any) => {
      const matchesType = typeFilter === 'all' || inspection.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
      const matchesSearch = 
        inspection.truckPlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.inspector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inspection.cargoTitle?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesType && matchesStatus && matchesSearch;
    })
    .sort((a: any, b: any) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
      case 'failed': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30';
      case 'conditional': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
      default: return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 size={14} />;
      case 'failed': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleActionClick = (inspection: any) => {
    if (inspection.isCargo) {
      setSelectedCargoInspection(inspection);
      setIsModalOpen(true);
    } else {
      // Future handler for safety reports
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Search & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Search by truck plate, driver or inspector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none uppercase tracking-widest"
            >
              <option value="all">All Statuses</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <FileText size={16} className="text-slate-400" />
            <select 
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-600 dark:text-slate-300 focus:outline-none uppercase tracking-widest"
            >
              <option value="all">All Types</option>
              <option value="pre_trip">Pre-Trip</option>
              <option value="post_trip">Post-Trip</option>
              <option value="cargo">Cargo Loading</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Report Type</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle & Driver</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date & Time</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inspector</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-8 py-6">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredInspections.length > 0 ? (
                filteredInspections.map((inspection: any) => (
                  <tr key={inspection.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          inspection.type === 'pre_trip' ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' : 
                          inspection.type === 'cargo' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' :
                          'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                        }`}>
                          {inspection.type === 'pre_trip' ? <ShieldCheck size={20} /> : 
                           inspection.type === 'cargo' ? <Package size={20} /> : 
                           <ShieldAlert size={20} />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                            {inspection.type === 'pre_trip' ? 'Pre-Trip Inspection' : 
                             inspection.type === 'cargo' ? 'Cargo Loading Report' : 
                             'Post-Trip Debrief'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {inspection.isCargo ? `Load: ${inspection.cargoTitle?.substring(0, 15)}...` : `ID: ${inspection.id.split('-')[0]}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-black text-[#0f172a] dark:text-white uppercase tracking-tight">
                          <TruckIcon size={14} className="text-slate-400" />
                          {inspection.truckPlate || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <UserIcon size={12} className="text-slate-400" />
                          {inspection.driverName || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                          <Calendar size={14} className="text-slate-400" />
                          {format(new Date(inspection.inspectionDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                          <Clock size={12} className="text-slate-400" />
                          {format(new Date(inspection.inspectionDate), 'HH:mm')}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${getStatusColor(inspection.status)}`}>
                        {getStatusIcon(inspection.status)}
                        {inspection.status}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">
                        {inspection.inspector || 'System'}
                      </div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Digital Signature</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleActionClick(inspection)}
                        className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200">
                        <FileText size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Inspection Reports Found</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">Reports submitted by drivers will appear here.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CargoInspectionReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inspection={selectedCargoInspection}
      />
    </div>
  );
};

export default FleetInspections;
