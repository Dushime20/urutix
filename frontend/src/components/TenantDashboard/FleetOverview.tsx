import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck, User, Wrench as Tools,
  AlertTriangle, Clock,
  Filter, Search, Plus, Eye, Edit, Trash2,
  Activity,
  Settings as SettingsIcon, ShieldCheck, Zap,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { Line, Doughnut } from 'react-chartjs-2';
import { fleetApi } from '../../services/fleetApi';
import AddTruckModal from './AddTruckModal';
import toast from 'react-hot-toast';

interface FleetOverviewProps {
  tenantId?: string;
}

const FleetOverview: React.FC<FleetOverviewProps> = ({ tenantId }) => {
  const { tSync } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddTruckModalOpen, setIsAddTruckModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  // Fetch trucks data
  const { 
    data: trucks = [], 
    isLoading: trucksLoading, 
    error: trucksError 
  } = useQuery({
    queryKey: ['trucks', tenantId, selectedFilter, searchTerm],
    queryFn: () => fleetApi.getTrucks({
      search: searchTerm || undefined,
      status: selectedFilter !== 'all' ? selectedFilter : undefined,
    }),
    enabled: !!tenantId,
    staleTime: 30000, // 30 seconds
  });

  // Fetch drivers data
  const { 
    data: drivers = [], 
    isLoading: driversLoading, 
    error: driversError 
  } = useQuery({
    queryKey: ['drivers', tenantId],
    queryFn: () => fleetApi.getDrivers(),
    enabled: !!tenantId,
    staleTime: 30000, // 30 seconds
  });

  // Delete truck mutation
  const deleteTruckMutation = useMutation({
    mutationFn: (truckId: string) => fleetApi.deleteTruck(truckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] });
      toast.success(tSync('Truck deleted successfully'));
    },
    onError: (error: any) => {
      toast.error(error.message || tSync('Failed to delete truck'));
    },
  });

  // Calculate fleet summary from real data
  const fleetSummary = useMemo(() => {
    const activeTrucks = trucks.filter((truck: any) => truck.status === 'AVAILABLE').length;
    const maintenanceTrucks = trucks.filter((truck: any) => truck.status === 'MAINTENANCE').length;
    const inactiveTrucks = trucks.filter((truck: any) => truck.status === 'OUT_OF_SERVICE').length;
    const activeDrivers = drivers.filter((driver: any) => driver.status === 'ACTIVE').length;
    
    return {
      totalTrucks: trucks.length,
      activeTrucks,
      maintenanceTrucks,
      inactiveTrucks,
      totalDrivers: drivers.length,
      activeDrivers,
      availableDrivers: drivers.filter((driver: any) => !driver.currentTruckId).length,
      onDutyDrivers: drivers.filter((driver: any) => driver.currentTruckId).length,
    };
  }, [trucks, drivers]);

  // Calculate utilization (mock calculation for now)
  const utilization = useMemo(() => {
    const totalTrucks = trucks.length;
    const activeTrucks = fleetSummary.activeTrucks;
    const currentUtilization = totalTrucks > 0 ? Math.round((activeTrucks / totalTrucks) * 100) : 0;
    
    return {
      current: currentUtilization,
      weekly: [78, 82, 75, 88, 91, 85, currentUtilization],
      monthly: [82, 79, 85, 88, 90, 87, 89, 91, 88, 86, 89, currentUtilization],
    };
  }, [trucks, fleetSummary.activeTrucks]);

  // Transform trucks data for display
  const displayTrucks = useMemo(() => {
    return trucks.map((truck: any) => ({
      id: truck.id,
      plate: truck.plateNumber,
      status: truck.status.toLowerCase(),
      owner: truck.owner ? 
        `${truck.owner.profile?.firstName || ''} ${truck.owner.profile?.lastName || ''}`.trim() || 
        truck.owner.email || 'Unknown Owner' : 
        'No Owner',
      driver: truck.currentDriver ? 
        `${truck.currentDriver.firstName || ''} ${truck.currentDriver.lastName || ''}`.trim() || 
        truck.currentDriver.email || 'Unknown Driver' : 
        'Unassigned',
      location: truck.currentAddress || truck.currentLocation?.address || 'Unknown',
      utilization: Math.floor(Math.random() * 100), // Mock utilization for now
      lastMaintenance: truck.updatedAt,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      vin: truck.vin,
    }));
  }, [trucks]);

  const filteredTrucks = useMemo(() => {
    let filtered = displayTrucks;

    if (selectedFilter !== 'all') {
      const statusMap: Record<string, string> = {
        'active': 'available',
        'maintenance': 'maintenance',
        'inactive': 'out_of_service',
      };
      filtered = filtered.filter((truck: any) => truck.status === statusMap[selectedFilter]);
    }

    if (searchTerm) {
      filtered = filtered.filter((truck: any) =>
        truck.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [displayTrucks, selectedFilter, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  const totalPages = Math.ceil(filteredTrucks.length / itemsPerPage);
  const paginatedTrucks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTrucks.slice(start, start + itemsPerPage);
  }, [filteredTrucks, currentPage]);

  const handleDeleteTruck = (truckId: string) => {
    if (window.confirm(tSync('Are you sure you want to delete this truck?'))) {
      deleteTruckMutation.mutate(truckId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'maintenance': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'out_of_service': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'in_transit': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Zap className="w-3 h-3" />;
      case 'maintenance': return <Tools className="w-3 h-3" />;
      case 'out_of_service': return <AlertTriangle className="w-3 h-3" />;
      case 'in_transit': return <Activity className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return tSync('Active');
      case 'maintenance': return tSync('Maintenance');
      case 'out_of_service': return tSync('Inactive');
      case 'in_transit': return tSync('In Transit');
      default: return tSync(status);
    }
  };

  // Show loading state
  if (trucksLoading || driversLoading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm p-6">
              <div className="animate-pulse">
                <div className="flex items-center">
                  <div className="p-3 bg-gray-200 dark:bg-slate-800 rounded-xl w-12 h-12"></div>
                  <div className="ml-4 flex-1">
                    <div className="h-3 bg-gray-200 dark:bg-slate-800 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-slate-600 dark:text-slate-400"><TranslatedText text="Loading fleet data..." /></p>
        </div>
      </div>
    );
  }

  // Show error state
  if (trucksError || driversError) {
    return (
      <div className="space-y-10">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2"><TranslatedText text="Failed to load fleet data" /></h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {trucksError?.message || driversError?.message || tSync('An error occurred while loading fleet data')}
          </p>
          <button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['trucks'] });
              queryClient.invalidateQueries({ queryKey: ['drivers'] });
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <TranslatedText text="Try Again" />
          </button>
        </div>
      </div>
    );
  }

  const utilizationChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Fleet Utilization (%)',
        data: utilization.weekly,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const statusChartData = {
    labels: ['Active', 'Maintenance', 'Inactive'],
    datasets: [
      {
        data: [fleetSummary.activeTrucks, fleetSummary.maintenanceTrucks, fleetSummary.inactiveTrucks],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        hoverOffset: 4,
        borderWidth: 0,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 10, weight: 'bold' as any }, usePointStyle: true, padding: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)', drawBorder: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Summary Cards — Screenshot-driven Refinement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10 py-6">
        {[
          { 
            label: tSync('Total Trucks'), 
            value: fleetSummary.totalTrucks, 
            icon: Truck,
            color: 'text-primary-600 dark:text-primary-400',
            borderColor: 'border-primary-100 dark:border-primary-900',
            shadow: 'shadow-primary-100/50 dark:shadow-primary-900/10'
          },
          { 
            label: tSync('Available Trucks'), 
            value: fleetSummary.activeTrucks, 
            icon: Zap,
            color: 'text-primary-600 dark:text-primary-400',
            borderColor: 'border-primary-100 dark:border-primary-900',
            shadow: 'shadow-primary-100/50 dark:shadow-primary-900/10'
          },
          { 
            label: tSync('Total Drivers'), 
            value: fleetSummary.totalDrivers, 
            icon: User,
            color: 'text-primary-600 dark:text-primary-400',
            borderColor: 'border-primary-100 dark:border-primary-900',
            shadow: 'shadow-primary-100/50 dark:shadow-primary-900/10'
          },
          { 
            label: tSync('Fleet Usage'), 
            value: `${utilization.current}%`, 
            icon: Activity,
            color: 'text-primary-600 dark:text-primary-400',
            borderColor: 'border-primary-100 dark:border-primary-900',
            shadow: 'shadow-primary-100/50 dark:shadow-primary-900/10'
          }
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-6 group cursor-default"
          >
             <div className={`w-20 h-20 rounded-full bg-white dark:bg-slate-800 border ${stat.borderColor} flex items-center justify-center flex-shrink-0 shadow-xl ${stat.shadow} transition-transform duration-500 group-hover:scale-110`}>
                <stat.icon size={28} className="text-primary-600 dark:text-primary-400" />
             </div>
             
             <div className="flex flex-col">
                <p className={`text-3xl font-black ${stat.color} leading-none mb-1.5 tracking-tight`}>
                  {stat.value}
                </p>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                  {stat.label}
                </p>
             </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row — Enhanced Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Utilization Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 hover:shadow-xl transition-all duration-500">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Activity" /></h3>
              <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Truck Usage Trend" /></h4>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-primary-600 hover:text-white transition-all"><TranslatedText text="Week" /></button>
              <button className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"><TranslatedText text="Month" /></button>
            </div>
          </div>
          <div className="h-72">
            <Line data={utilizationChartData} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  suggestedMax: 100
                }
              }
            }} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm p-10 hover:shadow-xl transition-all duration-500 flex flex-col">
          <div className="mb-10">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1"><TranslatedText text="Status" /></h3>
            <h4 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Fleet Distribution" /></h4>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <div className="h-64 w-full">
              <Doughnut data={statusChartData} options={{
                ...chartOptions,
                cutout: '82%',
                plugins: {
                  ...chartOptions.plugins,
                  legend: { display: false }
                }
              }} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-black text-slate-800 dark:text-white leading-none">{fleetSummary.totalTrucks}</p>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1"><TranslatedText text="Total Trucks" /></p>
            </div>
          </div>
          
          <div className="mt-10 space-y-4">
             {[
               { label: tSync('Operational'), count: fleetSummary.activeTrucks, color: 'bg-emerald-500' },
               { label: tSync('Maintenance'), count: fleetSummary.maintenanceTrucks, color: 'bg-amber-500' },
               { label: tSync('Inactive / Suspended'), count: fleetSummary.inactiveTrucks, color: 'bg-rose-500' },
             ].map((item, id) => (
               <div key={id} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                   <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</span>
                 </div>
                 <span className="text-sm font-black text-slate-800 dark:text-white">{item.count}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Asset Repository — Enlite Prime Style Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="px-10 py-8 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 relative">
          <div>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 italic"><TranslatedText text="Your Fleet" /></h3>
            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Truck List" /></h4>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-primary-600 dark:bg-primary-700 text-white rounded-[20px] transition-all shadow-xl shadow-primary-100 dark:shadow-slate-950/20 flex items-center gap-3 text-xs font-black uppercase tracking-widest group"
            onClick={() => setIsAddTruckModalOpen(true)}
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <TranslatedText text="Provision Truck" />
          </motion.button>
        </div>

        <div className="px-10 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row items-center gap-6">
          <div className="relative group flex-1 w-full">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-300 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder={tSync('Search assets, plates, owners, or drivers...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 shadow-sm transition-all dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full lg:w-56">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 shadow-sm appearance-none"
              >
                <option value="all">{tSync('Global Fleet')}</option>
                <option value="active">{tSync('Operational Only')}</option>
                <option value="maintenance">{tSync('Maintenance')}</option>
                <option value="inactive">{tSync('Suspended')}</option>
              </select>
            </div>
            
            <button className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] text-slate-400 hover:text-primary-600 shadow-sm transition-all hover:shadow-md">
              <SettingsIcon size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-50">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/10">
                <th className="pl-10 pr-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Truck Details" /></th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Owner" /></th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Driver" /></th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center"><TranslatedText text="Status" /></th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Usage" /></th>
                <th className="px-6 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Maintenance" /></th>
                <th className="pl-6 pr-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest"><TranslatedText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-50 dark:divide-slate-800/50">
              {paginatedTrucks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-10 py-24 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[32px] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-700 rotate-12">
                        <Truck className="w-12 h-12 text-slate-200 dark:text-slate-700 -rotate-12" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2"><TranslatedText text="No Trucks Found" /></h3>
                      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto mb-10 font-medium">
                        <TranslatedText text="You haven't added any trucks to your fleet yet." />
                      </p>
                      <button 
                        className="bg-primary-600 text-white px-8 py-4 rounded-[20px] hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 dark:shadow-slate-950/20 text-[11px] font-black uppercase tracking-[0.2em]"
                        onClick={() => setIsAddTruckModalOpen(true)}
                      >
                        <TranslatedText text="Add First Truck" />
                      </button>
                    </motion.div>
                  </td>
                </tr>
              ) : (
                paginatedTrucks.map((truck: any, idx: number) => (
                  <motion.tr 
                    key={truck.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/10 transition-all duration-300 border-b border-gray-50 dark:border-slate-800/50"
                  >
                    <td className="pl-10 pr-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                          <Truck size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">{truck.plate}</span>
                          <span className="text-[10px] font-black text-primary-500 dark:text-primary-400 uppercase tracking-widest leading-none mt-1">{truck.id}</span>
                          {truck.make && (
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tight">{truck.make} {truck.model}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400">
                           {truck.owner.charAt(0)}
                         </div>
                         <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{truck.owner}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{truck.driver}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(truck.status)} dark:bg-slate-900/50`}>
                        {getStatusIcon(truck.status)}
                        <span className="ml-2">{getStatusLabel(truck.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                           <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none"><TranslatedText text="Usage" /> (%)</span>
                           <span className="text-[10px] font-black text-slate-800 dark:text-white italic">{truck.utilization}%</span>
                        </div>
                        <div className="w-28 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${truck.utilization}%` }}
                            transition={{ duration: 1 }}
                            className="bg-primary-600 dark:bg-primary-500 h-full rounded-full shadow-[0_0_8px_rgba(52,94,133,0.5)]"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 tracking-tight">{new Date(truck.lastMaintenance).toLocaleDateString()}</span>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5"><TranslatedText text="Checked" /></span>
                      </div>
                    </td>
                    <td className="pl-6 pr-10 py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:shadow-primary-50 rounded-xl transition-all duration-300">
                          <Eye size={16} />
                        </button>
                        <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:shadow-amber-50 rounded-xl transition-all duration-300">
                          <Edit size={16} />
                        </button>
                        <button 
                          className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg hover:shadow-red-50 rounded-xl transition-all duration-300"
                          onClick={() => handleDeleteTruck(truck.id)}
                          disabled={deleteTruckMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — Enlite Prime Style */}
        {totalPages > 1 && (
          <div className="px-10 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Page" /></span>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-8 rounded-lg bg-primary-600 dark:bg-primary-700 text-white flex items-center justify-center text-[11px] font-black shadow-lg shadow-primary-100 dark:shadow-slate-950/20">
                  {currentPage}
                </span>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase"><TranslatedText text="of" /></span>
                <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[11px] font-black">
                  {totalPages}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:hover:text-slate-400 shadow-sm transition-all hover:shadow-md group"
              >
                <ChevronLeft size={18} className="group-active:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 disabled:opacity-30 disabled:hover:text-slate-400 shadow-sm transition-all hover:shadow-md group"
              >
                <ChevronRight size={18} className="group-active:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Truck Modal */}
      <AddTruckModal 
        isOpen={isAddTruckModalOpen}
        onClose={() => setIsAddTruckModalOpen(false)}
      />
    </div>
  );
};

export default FleetOverview;
