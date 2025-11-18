import React, { useState } from "react";
import {
  FaBox,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaDownload,
  FaEye,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendar,
  FaWeight,
  FaShieldAlt,
  FaThermometerHalf,
  FaExclamationTriangle,
  FaTruck,
  FaClock,
  FaLayerGroup,
  FaSync,
} from "react-icons/fa";
import FilterSelect from "@/components/common/FilterSelect";

interface Cargo {
  id: string;
  title: string;
  type: string;
  weight: number;
  value: number;
  status: 'draft' | 'published' | 'assigned' | 'in_transit' | 'delivered';
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDate: string;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  owner: string;
}

const CargoManagement: React.FC = () => {
  const [cargos] = useState<Cargo[]>([
    {
      id: '1',
      title: 'Electronics Shipment',
      type: 'FRAGILE',
      weight: 2500,
      value: 45000,
      status: 'published',
      pickupLocation: 'Kigali, Rwanda',
      deliveryLocation: 'Butare, Rwanda',
      pickupDate: '2024-08-10',
      deliveryDate: '2024-08-12',
      isHazardous: false,
      requiresRefrigeration: false,
      urgency: 'normal',
      owner: 'John Cargo'
    },
    {
      id: '2',
      title: 'Medical Supplies',
      type: 'REFRIGERATED',
      weight: 1200,
      value: 28000,
      status: 'in_transit',
      pickupLocation: 'Gisenyi, Rwanda',
      deliveryLocation: 'Kigali, Rwanda',
      pickupDate: '2024-08-09',
      deliveryDate: '2024-08-11',
      isHazardous: false,
      requiresRefrigeration: true,
      urgency: 'high',
      owner: 'Medical Corp'
    },
    {
      id: '3',
      title: 'Chemical Products',
      type: 'HAZARDOUS',
      weight: 3500,
      value: 15000,
      status: 'assigned',
      pickupLocation: 'Butare, Rwanda',
      deliveryLocation: 'Gisenyi, Rwanda',
      pickupDate: '2024-08-11',
      deliveryDate: '2024-08-13',
      isHazardous: true,
      requiresRefrigeration: false,
      urgency: 'critical',
      owner: 'Chem Industries'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string, cargo: Cargo) => {
    if (cargo.isHazardous) return <FaExclamationTriangle className="text-red-500" />;
    if (cargo.requiresRefrigeration) return <FaThermometerHalf className="text-blue-500" />;
    if (type === 'FRAGILE') return <FaShieldAlt className="text-yellow-500" />;
    return <FaBox className="text-gray-500" />;
  };

  const filteredCargos = cargos.filter(cargo => {
    const matchesSearch = cargo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || cargo.status === filterStatus;
    const matchesType = !filterType || cargo.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cargo Management</h2>
          <p className="text-gray-600">Monitor and manage all cargo shipments</p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <FaPlus />
          <span>Add Cargo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 p-6 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_repeat(3,1fr)] xl:grid-cols-[2fr_repeat(4,1fr)]">
          <div className="relative flex items-center">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cargo by title, owner or route…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-white/80 py-3 pl-11 pr-4 text-sm text-gray-700 shadow-inner transition focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <FilterSelect
            label="Status"
            icon={<FaLayerGroup className="text-purple-500" />}
            value={filterStatus}
            placeholder="All Status"
            options={[
              { value: '', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'delivered', label: 'Delivered' },
            ]}
            onChange={setFilterStatus}
          />

          <FilterSelect
            label="Cargo Type"
            icon={<FaBox className="text-blue-500" />}
            value={filterType}
            placeholder="All Types"
            options={[
              { value: '', label: 'All Types' },
              { value: 'GENERAL', label: 'General' },
              { value: 'FRAGILE', label: 'Fragile' },
              { value: 'HAZARDOUS', label: 'Hazardous' },
              { value: 'REFRIGERATED', label: 'Refrigerated' },
            ]}
            onChange={setFilterType}
          />

          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:scale-[1.01] hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1">
            <FaFilter />
            <span>Advanced Filters</span>
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterType('');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:scale-[1.01] hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-1"
            >
              <FaSync className="text-xs" />
              Reset
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/15 transition hover:scale-[1.01] hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-1">
              <FaDownload />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Cargo Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{cargos.length}</p>
              <p className="text-gray-600">Total Cargos</p>
            </div>
            <FaBox className="text-purple-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{cargos.filter(c => c.status === 'in_transit').length}</p>
              <p className="text-gray-600">In Transit</p>
            </div>
            <FaTruck className="text-green-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{cargos.filter(c => c.urgency === 'critical').length}</p>
              <p className="text-gray-600">Critical</p>
            </div>
            <FaClock className="text-red-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{cargos.filter(c => c.isHazardous).length}</p>
              <p className="text-gray-600">Hazardous</p>
            </div>
            <FaExclamationTriangle className="text-yellow-500 text-3xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">${cargos.reduce((acc, c) => acc + c.value, 0).toLocaleString()}</p>
              <p className="text-gray-600">Total Value</p>
            </div>
            <FaDollarSign className="text-blue-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Cargo Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCargos.map((cargo) => (
                <tr key={cargo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {getTypeIcon(cargo.type, cargo)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{cargo.title}</div>
                        <div className="text-sm text-gray-500">ID: {cargo.id}</div>
                        <div className="text-sm text-gray-500">Owner: {cargo.owner}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <FaMapMarkerAlt className="text-green-500 mr-2" />
                        {cargo.pickupLocation}
                      </div>
                      <div className="flex items-center">
                        <FaMapMarkerAlt className="text-red-500 mr-2" />
                        {cargo.deliveryLocation}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <FaWeight className="text-gray-400 mr-2" />
                        {cargo.weight} kg
                      </div>
                      <div className="flex items-center mb-1">
                        <FaDollarSign className="text-gray-400 mr-2" />
                        ${cargo.value.toLocaleString()}
                      </div>
                      <div className="flex space-x-1">
                        {cargo.isHazardous && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Hazardous</span>}
                        {cargo.requiresRefrigeration && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Cold</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(cargo.status)}`}>
                        {cargo.status.replace('_', ' ')}
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(cargo.urgency)}`}>
                        {cargo.urgency}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center mb-1">
                      <FaCalendar className="text-gray-400 mr-2" />
                      Pickup: {new Date(cargo.pickupDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <FaCalendar className="text-gray-400 mr-2" />
                      Delivery: {new Date(cargo.deliveryDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors">
                        <FaEye />
                      </button>
                      <button className="text-green-600 hover:text-green-900 p-1 rounded transition-colors">
                        <FaEdit />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1 rounded transition-colors">
                        <FaTrash />
                      </button>
                    </div>
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

export default CargoManagement;
