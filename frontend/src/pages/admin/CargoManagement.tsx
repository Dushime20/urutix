import React, { useState, useEffect } from "react";
import ModernLoader from '../../components/common/ModernLoader';
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
  FaLayerGroup,
  FaSync,
} from "react-icons/fa";
import FilterSelect from "@/components/common/FilterSelect";
import { TranslatedText } from '../../components/translated-text';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

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

  if (loading) {
    return <ModernLoader isLoading={true} type="page" showStats={true} />;
  }

  return (
    <div className="safe-bottom space-y-6">
      {/* Custom Header for Tenant Admin */}
      <div className="bg-white rounded-[24px] p-8 border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight"><TranslatedText text="Cargo Management" /></h1>
            <p className="text-slate-500 font-medium mt-1">
              <TranslatedText text="Monitor and manage all cargo shipments and logistics" />
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-6 py-3 bg-[#2c5173] text-white rounded-xl hover:bg-[#1e3850] transition-all font-bold text-sm flex items-center gap-2">
              <FaPlus className="text-xs" />
              <TranslatedText text="Add Cargo" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_repeat(3,1fr)] xl:grid-cols-[2fr_repeat(4,1fr)]">
          <div className="relative flex items-center">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cargo by title, owner or route…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 transition focus:border-[#2c5173] focus:outline-none focus:ring-2 focus:ring-[#2c5173]/20"
            />
          </div>

          <FilterSelect
            label="Status"
            icon={<FaLayerGroup className="text-[#2c5173]" />}
            value={filterStatus}
            placeholder="All Status"
            options={[
              { value: '', label: "All Status" },
              { value: 'draft', label: "Draft" },
              { value: 'published', label: "Published" },
              { value: 'assigned', label: "Assigned" },
              { value: 'in_transit', label: "In Transit" },
              { value: 'delivered', label: "Delivered" },
            ]}
            onChange={setFilterStatus}
          />

          <FilterSelect
            label="Cargo Type"
            icon={<FaBox className="text-[#2c5173]" />}
            value={filterType}
            placeholder="All Types"
            options={[
              { value: '', label: "All Types" },
              { value: 'GENERAL', label: "General" },
              { value: 'FRAGILE', label: "Fragile" },
              { value: 'HAZARDOUS', label: "Hazardous" },
              { value: 'REFRIGERATED', label: "Refrigerated" },
            ]}
            onChange={setFilterType}
          />

          <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 focus:outline-none">
            <FaFilter />
            <span><TranslatedText text="Advanced Filters" /></span>
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
              <TranslatedText text="Reset" />
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none">
              <FaDownload />
              <TranslatedText text="Export" />
            </button>
          </div>
        </div>
      </div>

      {/* Cargo Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Cargo" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Route" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Details" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Status" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Timeline" /></th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest"><TranslatedText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCargos.map((cargo) => (
                <tr key={cargo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-150 rounded-full flex items-center justify-center text-slate-700 font-semibold">
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
