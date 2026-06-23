import React, { useState, useEffect } from 'react';
import ModernLoader from '../../components/common/ModernLoader';
import {
  FaTruck, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaDownload,
  FaEye, FaMapMarkerAlt, FaTools, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';
import { TranslatedText } from '../../components/translated-text';
import { FaCoins } from 'react-icons/fa';
import { StatCard } from '../../components/EnliteUI';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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

  const { data: balanceData } = useQuery({
    queryKey: ['tenant-credit-balance'],
    queryFn: () => tenantApi.getCreditBalance(),
  });

  const currentBalance = balanceData?.currentBalance || 0;

  if (loading) {
    return <ModernLoader isLoading={true} type="page" showStats={true} />;
  }

  return (
    <div className="safe-bottom space-y-6">
      {/* Custom Header for Tenant Admin */}
      <div className="bg-white rounded-xl p-8 border border-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight"><TranslatedText text="Fleet Management" /></h1>
            <p className="text-slate-500 font-medium mt-1">
              <TranslatedText text="Monitor and manage your truck fleet operations" />
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] transition-all font-bold text-sm flex items-center gap-2">
              <FaPlus className="text-xs" />
              <TranslatedText text="Add Truck" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-transparent">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search trucks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5173]"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5173]"
          >
            <option value=""><TranslatedText text="All Status" /></option>
            <option value="active"><TranslatedText text="Active" /></option>
            <option value="maintenance"><TranslatedText text="Maintenance" /></option>
            <option value="inactive"><TranslatedText text="Inactive" /></option>
          </select>
          <button className="bg-[#2c5173]/10 hover:bg-[#2c5173]/20 text-[#2c5173] px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaFilter />
            <span><TranslatedText text="More Filters" /></span>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <FaDownload />
            <span><TranslatedText text="Export" /></span>
          </button>
        </div>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title={<TranslatedText text="Total Trucks" />}
          value={trucks.length}
          icon={<FaTruck size={22} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Active" />}
          value={trucks.filter(t => t.status === 'active').length}
          icon={<FaCheckCircle size={22} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Maintenance" />}
          value={trucks.filter(t => t.status === 'maintenance').length}
          icon={<FaTools size={22} />}
          color="primary"
          variant="classic"
        />
        <StatCard
          title={<TranslatedText text="Credit Balance" />}
          value={`${currentBalance.toLocaleString()} TRX`}
          icon={<FaCoins size={22} />}
          color="primary"
          variant="classic"
        />
      </div>

      {/* Truck Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTrucks.map((truck) => (
          <div key={truck.id} className="bg-white rounded-xl overflow-hidden border border-transparent transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#2c5173]/10 rounded-xl flex items-center justify-center text-[#2c5173]">
                    <FaTruck className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">{truck.plateNumber}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{truck.make} {truck.model}</p>
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
                <button className="flex-1 bg-[#2c5173] hover:bg-[#1e3850] text-white py-2 px-4 rounded-lg text-sm transition-colors flex items-center justify-center space-x-1">
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
