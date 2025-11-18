import React, { useState } from 'react';
import { 
  FaTruck, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaDownload,
  FaEye, FaMapMarkerAlt, FaGasPump, FaTools, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

interface Truck {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  driver: string;
  lastMaintenance: string;
  fuelLevel: number;
  mileage: number;
}

const FleetManagement: React.FC = () => {
  const [trucks] = useState<Truck[]>([
    {
      id: '1',
      plateNumber: 'TRK-001',
      make: 'Mercedes',
      model: 'Actros',
      year: 2022,
      capacity: 25000,
      status: 'active',
      location: 'Kigali, Rwanda',
      driver: 'Mike Driver',
      lastMaintenance: '2024-07-15',
      fuelLevel: 85,
      mileage: 45678
    },
    {
      id: '2',
      plateNumber: 'TRK-002',
      make: 'Volvo',
      model: 'FH16',
      year: 2021,
      capacity: 30000,
      status: 'maintenance',
      location: 'Butare, Rwanda',
      driver: 'John Smith',
      lastMaintenance: '2024-08-01',
      fuelLevel: 45,
      mileage: 52340
    },
    {
      id: '3',
      plateNumber: 'TRK-003',
      make: 'Scania',
      model: 'R500',
      year: 2023,
      capacity: 28000,
      status: 'active',
      location: 'Gisenyi, Rwanda',
      driver: 'Sarah Wilson',
      lastMaintenance: '2024-06-20',
      fuelLevel: 92,
      mileage: 23456
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FaCheckCircle className="text-green-500" />;
      case 'maintenance': return <FaTools className="text-yellow-500" />;
      case 'inactive': return <FaExclamationTriangle className="text-red-500" />;
      default: return <FaCheckCircle className="text-gray-500" />;
    }
  };

  const getFuelLevelColor = (level: number) => {
    if (level > 60) return 'bg-green-500';
    if (level > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.driver.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || truck.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fleet Management</h2>
          <p className="text-gray-600">Monitor and manage your truck fleet</p>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <FaPlus />
          <span>Add Truck</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search trucks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaFilter />
            <span>More Filters</span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaDownload />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{trucks.length}</p>
              <p className="text-gray-600">Total Trucks</p>
            </div>
            <FaTruck className="text-blue-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{trucks.filter(t => t.status === 'active').length}</p>
              <p className="text-gray-600">Active</p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{trucks.filter(t => t.status === 'maintenance').length}</p>
              <p className="text-gray-600">Maintenance</p>
            </div>
            <FaTools className="text-yellow-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{Math.round(trucks.reduce((acc, t) => acc + t.fuelLevel, 0) / trucks.length)}%</p>
              <p className="text-gray-600">Avg Fuel Level</p>
            </div>
            <FaGasPump className="text-purple-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Truck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrucks.map((truck) => (
          <div key={truck.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <FaTruck className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{truck.plateNumber}</h3>
                    <p className="text-sm text-gray-500">{truck.make} {truck.model}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(truck.status)}
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(truck.status)}`}>
                    {truck.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{truck.capacity.toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-medium">{truck.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mileage:</span>
                  <span className="font-medium">{truck.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fuel Level:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div 
                        className={`h-2 rounded-full ${getFuelLevelColor(truck.fuelLevel)}`}
                        style={{ width: `${truck.fuelLevel}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{truck.fuelLevel}%</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-medium">{truck.driver}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-1" />
                  <span>{truck.location}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1">
                  <FaEye />
                  <span>View</span>
                </button>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1">
                  <FaEdit />
                  <span>Edit</span>
                </button>
                <button className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-3 rounded-lg text-sm transition-colors">
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FleetManagement;
