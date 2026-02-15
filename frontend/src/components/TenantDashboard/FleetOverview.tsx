import React, { useState, useMemo } from 'react';
import {
  Truck, User, Route, Wrench as Tools, CheckCircle,
  AlertTriangle, Clock, MapPin as FaMapMarkerAlt,
  Filter, Search, Plus, Eye
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';

interface FleetOverviewProps {
  tenantId?: string;
}

const FleetOverview: React.FC<FleetOverviewProps> = ({ tenantId }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock fleet data - in real app, this would come from API
  const fleetData = useMemo(() => ({
    summary: {
      totalTrucks: 25,
      activeTrucks: 23,
      maintenanceTrucks: 1,
      inactiveTrucks: 1,
      totalDrivers: 28,
      activeDrivers: 25,
      availableDrivers: 18,
      onDutyDrivers: 7,
    },
    utilization: {
      current: 87.3,
      weekly: [78, 82, 75, 88, 91, 85, 87],
      monthly: [82, 79, 85, 88, 90, 87, 89, 91, 88, 86, 89, 92],
    },
    trucks: [
      { id: 'T-001', plate: 'RAB 123A', status: 'active', driver: 'John Doe', location: 'Kigali', utilization: 92, lastMaintenance: '2024-01-15' },
      { id: 'T-002', plate: 'RAB 124B', status: 'active', driver: 'Jane Smith', location: 'Huye', utilization: 88, lastMaintenance: '2024-01-20' },
      { id: 'T-003', plate: 'RAB 125C', status: 'maintenance', driver: 'Mike Johnson', location: 'Maintenance', utilization: 0, lastMaintenance: '2024-01-25' },
      { id: 'T-004', plate: 'RAB 126D', status: 'active', driver: 'Sarah Wilson', location: 'Musanze', utilization: 95, lastMaintenance: '2024-01-10' },
      { id: 'T-005', plate: 'RAB 127E', status: 'active', driver: 'David Brown', location: 'Kigali', utilization: 76, lastMaintenance: '2024-01-18' },
    ],
    drivers: [
      { id: 'D-001', name: 'John Doe', status: 'active', license: 'Class A', experience: '5 years', rating: 4.8, currentTruck: 'T-001' },
      { id: 'D-002', name: 'Jane Smith', status: 'active', license: 'Class A', experience: '3 years', rating: 4.6, currentTruck: 'T-002' },
      { id: 'D-003', name: 'Mike Johnson', status: 'maintenance', license: 'Class A', experience: '7 years', rating: 4.9, currentTruck: 'T-003' },
      { id: 'D-004', name: 'Sarah Wilson', status: 'active', license: 'Class B', experience: '2 years', rating: 4.4, currentTruck: 'T-004' },
      { id: 'D-005', name: 'David Brown', status: 'active', license: 'Class A', experience: '4 years', rating: 4.7, currentTruck: 'T-005' },
    ]
  }), []);

  const filteredTrucks = useMemo(() => {
    let filtered = fleetData.trucks;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(truck => truck.status === selectedFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(truck =>
        truck.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        truck.driver.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [fleetData.trucks, selectedFilter, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'maintenance': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'inactive': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'maintenance': return <Tools className="w-3 h-3" />;
      case 'inactive': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const utilizationChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Fleet Utilization (%)',
        data: fleetData.utilization.weekly,
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
        data: [fleetData.summary.activeTrucks, fleetData.summary.maintenanceTrucks, fleetData.summary.inactiveTrucks],
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Trucks', value: fleetData.summary.totalTrucks, icon: Truck, color: 'indigo' },
          { label: 'Active Trucks', value: fleetData.summary.activeTrucks, icon: CheckCircle, color: 'emerald' },
          { label: 'Total Drivers', value: fleetData.summary.totalDrivers, icon: User, color: 'violet' },
          { label: 'Utilization', value: `${fleetData.utilization.current}% `, icon: Route, color: 'amber' }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
            <div className="flex items-center">
              <div className={`p - 3 bg - ${stat.color} -50 rounded - xl`}>
                <stat.icon className={`w - 6 h - 6 text - ${stat.color} -600`} />
              </div>
              <div className="ml-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Utilization Trend */}
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Performance Trend</h3>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">Weekly Utilization</h4>
          </div>
          <div className="h-64">
            <Line data={utilizationChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8">
          <div className="mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Inventory status</h3>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">Truck Distribution</h4>
          </div>
          <div className="h-64">
            <Doughnut data={statusChartData} options={{
              ...chartOptions,
              cutout: '75%',
            }} />
          </div>
        </div>
      </div>

      {/* Trucks Table */}
      <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Asset Repository</h3>
              <h4 className="text-xl font-black text-slate-800 tracking-tight">Fleet Trucks</h4>
            </div>
            <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center text-sm font-black uppercase tracking-widest">
              <Plus className="w-4 h-4 mr-2" />
              Add Truck
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-8 py-5 border-b border-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Query assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium text-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-xs font-black uppercase tracking-widest text-slate-500 appearance-none pointer-events-auto"
                >
                  <option value="all">Global Filter</option>
                  <option value="active">Active Only</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-50">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Truck Metadata</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Geolocation</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Log</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredTrucks.map((truck) => (
                <tr key={truck.id} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{truck.id}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{truck.plate}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-600">{truck.driver}</span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 text-indigo-400 mr-2" />
                      <span className="text-sm font-medium text-slate-600">{truck.location}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`inline - flex items - center px - 2.5 py - 1 rounded - full text - [10px] font - black uppercase tracking - widest border ${getStatusColor(truck.status)} `}>
                      {getStatusIcon(truck.status)}
                      <span className="ml-1.5">{truck.status}</span>
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${truck.utilization}% ` }}
                        ></div>
                      </div>
                      <span className="text-xs font-black text-slate-800">{truck.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-400">
                    {new Date(truck.lastMaintenance).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ml-1">
                      <Plus className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FleetOverview;
