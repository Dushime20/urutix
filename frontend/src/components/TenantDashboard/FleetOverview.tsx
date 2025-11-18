import React, { useState, useMemo } from 'react';
import { 
  FaTruck, FaUser, FaRoute, FaTools, FaCheckCircle, 
  FaExclamationTriangle, FaClock, FaMapMarkerAlt,
  FaFilter, FaSearch, FaPlus, FaEye
} from 'react-icons/fa';
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
      case 'active': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="w-4 h-4" />;
      case 'maintenance': return <FaTools className="w-4 h-4" />;
      case 'inactive': return <FaExclamationTriangle className="w-4 h-4" />;
      default: return <FaClock className="w-4 h-4" />;
    }
  };

  const utilizationChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Fleet Utilization (%)',
        data: fleetData.utilization.weekly,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ]
  };

  const statusChartData = {
    labels: ['Active', 'Maintenance', 'Inactive'],
    datasets: [
      {
        data: [fleetData.summary.activeTrucks, fleetData.summary.maintenanceTrucks, fleetData.summary.inactiveTrucks],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 12 } }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FaTruck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Trucks</p>
              <p className="text-2xl font-bold text-gray-900">{fleetData.summary.totalTrucks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <FaCheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Trucks</p>
              <p className="text-2xl font-bold text-gray-900">{fleetData.summary.activeTrucks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FaUser className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Drivers</p>
              <p className="text-2xl font-bold text-gray-900">{fleetData.summary.totalDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-50 rounded-lg">
              <FaRoute className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{fleetData.utilization.current}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Utilization Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Utilization Trend</h3>
          <div className="h-64">
            <Line data={utilizationChartData} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Truck Status Distribution</h3>
          <div className="h-64">
            <Doughnut data={statusChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Trucks Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Fleet Trucks</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
              <FaPlus className="w-4 h-4 mr-2" />
              Add Truck
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search trucks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Maintenance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTrucks.map((truck) => (
                <tr key={truck.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{truck.id}</div>
                      <div className="text-sm text-gray-500">{truck.plate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{truck.driver}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{truck.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                      {getStatusIcon(truck.status)}
                      <span className="ml-1.5 capitalize">{truck.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${truck.utilization}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900">{truck.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(truck.lastMaintenance).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <FaEye className="w-4 h-4" />
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
