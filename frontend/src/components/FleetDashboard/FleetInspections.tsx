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
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

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
      <StandardDataTable
        title="Inspection Reports"
        icon={<FileText className="w-5 h-5" />}
        headerColor="primary"
        columns={[
          {
            key: 'type',
            label: 'Report Type',
            sortable: true,
            render: (type: string, inspection: any) => (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  type === 'pre_trip' ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400' :
                  type === 'cargo' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' :
                  'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                }`}>
                  {type === 'pre_trip' ? <ShieldCheck size={20} /> :
                   type === 'cargo' ? <Package size={20} /> :
                   <ShieldAlert size={20} />}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                    {type === 'pre_trip' ? 'Pre-Trip Inspection' :
                     type === 'cargo' ? 'Cargo Loading Report' :
                     'Post-Trip Debrief'}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {inspection.isCargo
                      ? `Load: ${inspection.cargoTitle?.substring(0, 15)}...`
                      : `ID: ${String(inspection.id).split('-')[0]}`}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'truckPlate',
            label: 'Vehicle & Driver',
            sortable: true,
            render: (_: any, inspection: any) => (
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
            ),
          },
          {
            key: 'inspectionDate',
            label: 'Date & Time',
            sortable: true,
            render: (date: string) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                  <Calendar size={14} className="text-slate-400" />
                  {format(new Date(date), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  <Clock size={12} className="text-slate-400" />
                  {format(new Date(date), 'HH:mm')}
                </div>
              </div>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (status: string) => (
              <StatusBadge
                label={status}
                status={status === 'passed' ? 'completed' : status === 'failed' ? 'rejected' : 'pending'}
                icon={getStatusIcon(status)}
              />
            ),
          },
          {
            key: 'inspector',
            label: 'Inspector',
            render: (inspector: string) => (
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">
                  {inspector || 'System'}
                </div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Digital Signature</div>
              </div>
            ),
          },
        ] as Column<any>[]}
        data={filteredInspections}
        loading={isLoading}
        getRowId={(row) => row.id}
        searchable={false}
        pagination
        pageSize={10}
        columnVisibility
        stickyHeader
        striped
        hoverable
        emptyMessage="No inspection reports found — reports submitted by drivers will appear here"
        rowActions={[
          {
            key: 'open',
            label: 'Open Report',
            icon: <ExternalLink size={14} />,
            onClick: handleActionClick,
          },
        ] as TableAction<any>[]}
        ariaLabel="Fleet inspections"
      />

      <CargoInspectionReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inspection={selectedCargoInspection}
      />
    </div>
  );
};

export default FleetInspections;
