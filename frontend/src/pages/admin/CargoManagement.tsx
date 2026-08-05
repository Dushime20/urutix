import React, { useState, useEffect, useMemo } from "react";
import ModernLoader from '../../components/common/ModernLoader';
import {
  FaBox,
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaMapMarkerAlt,
  FaDollarSign,
  FaCalendar,
  FaWeight,
  FaShieldAlt,
  FaThermometerHalf,
  FaExclamationTriangle,
} from "react-icons/fa";
import { TranslatedText } from '../../components/translated-text';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../../components/EnliteUI/Tables';

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

const urgencyVariant = (urgency: string) => {
  switch (urgency) {
    case 'low': return 'success' as const;
    case 'normal': return 'primary' as const;
    case 'high': return 'warning' as const;
    case 'critical': return 'error' as const;
    default: return 'neutral' as const;
  }
};

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

  const getTypeIcon = (type: string, cargo: Cargo) => {
    if (cargo.isHazardous) return <FaExclamationTriangle className="text-red-500" />;
    if (cargo.requiresRefrigeration) return <FaThermometerHalf className="text-blue-500" />;
    if (type === 'FRAGILE') return <FaShieldAlt className="text-yellow-500" />;
    return <FaBox className="text-gray-500" />;
  };

  const columns: Column<Cargo>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Cargo',
      alwaysVisible: true,
      render: (_v, cargo) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold">
            {getTypeIcon(cargo.type, cargo)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">{cargo.title}</div>
            <div className="text-sm text-gray-500">ID: {cargo.id}</div>
            <div className="text-sm text-gray-500">Owner: {cargo.owner}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'pickupLocation',
      label: 'Route',
      render: (_v, cargo) => (
        <div className="text-sm text-gray-900 dark:text-white">
          <div className="flex items-center mb-1">
            <FaMapMarkerAlt className="text-green-500 mr-2" />
            {cargo.pickupLocation}
          </div>
          <div className="flex items-center">
            <FaMapMarkerAlt className="text-red-500 mr-2" />
            {cargo.deliveryLocation}
          </div>
        </div>
      ),
    },
    {
      key: 'weight',
      label: 'Details',
      render: (_v, cargo) => (
        <div className="text-sm text-gray-900 dark:text-white">
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
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, cargo) => (
        <div className="space-y-1">
          <StatusBadge status={cargo.status} label={cargo.status.replace('_', ' ')} />
          <StatusBadge variant={urgencyVariant(cargo.urgency)} label={cargo.urgency} />
        </div>
      ),
    },
    {
      key: 'pickupDate',
      label: 'Timeline',
      render: (_v, cargo) => (
        <div className="text-sm text-gray-900 dark:text-white">
          <div className="flex items-center mb-1">
            <FaCalendar className="text-gray-400 mr-2" />
            Pickup: {new Date(cargo.pickupDate).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <FaCalendar className="text-gray-400 mr-2" />
            Delivery: {new Date(cargo.deliveryDate).toLocaleDateString()}
          </div>
        </div>
      ),
    },
  ], []);

  const rowActions: TableAction<Cargo>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <FaEdit className="w-3.5 h-3.5" />,
      onClick: () => {},
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <FaTrash className="w-3.5 h-3.5" />,
      variant: 'danger',
      onClick: () => {},
    },
  ], []);

  if (loading) {
    return <ModernLoader isLoading={true} type="page" showStats={true} />;
  }

  return (
    <div className="safe-bottom space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight"><TranslatedText text="Cargo Management" /></h1>
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

      <StandardDataTable
        title="Cargo Shipments"
        subtitle="Search, filter, and manage cargo"
        icon={<FaBox className="w-5 h-5" />}
        headerColor="primary"
        columns={columns}
        data={cargos}
        getRowId={(row) => row.id}
        searchPlaceholder="Search cargo by title, owner or route…"
        searchKeys={['title', 'owner', 'pickupLocation', 'deliveryLocation', 'type', 'status']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'in_transit', label: 'In Transit' },
              { value: 'delivered', label: 'Delivered' },
            ],
          },
          {
            key: 'type',
            label: 'Cargo Type',
            options: [
              { value: 'GENERAL', label: 'General' },
              { value: 'FRAGILE', label: 'Fragile' },
              { value: 'HAZARDOUS', label: 'Hazardous' },
              { value: 'REFRIGERATED', label: 'Refrigerated' },
            ],
          },
        ]}
        rowActions={rowActions}
        emptyMessage="No cargo match your current filters"
        ariaLabel="Cargo management"
      />
    </div>
  );
};

export default CargoManagement;
