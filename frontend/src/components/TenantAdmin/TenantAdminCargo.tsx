import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { loadsAPI } from '../../services/load';
import EnhancedCargoForm from '../../pages/dashboard/cargos/create/components/form';
import type { ICargoBody } from '../../pages/dashboard/cargos/create/types/cargo';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import {
  FaBox,
  FaPlus,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaWeight,
  FaCube,
  FaDollarSign,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaSync,
  FaCalendarAlt,
  FaTruck,
  FaUser
} from 'react-icons/fa';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

interface CargoLoad {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  status: string;
  cargoOwnerId?: string;
  cargoOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
  pickupDate?: string;
  deliveryDate?: string;
  offeredPrice?: number;
  loadValue?: number;
  currencyCode?: string;
  urgencyLevel?: string;
  pickupLocation?: {
    name?: string;
    address?: string;
  };
  deliveryLocation?: {
    name?: string;
    address?: string;
  };
  locations?: any[];
  origin?: any;
  destination?: any;
  createdAt: string;
  updatedAt: string;
}

interface CargoStats {
  totalLoads: number;
  activeLoads: number;
  pendingLoads: number;
  completedLoads: number;
  totalWeight: number;
  totalValue: number;
}

const TenantAdminCargo: React.FC = () => {
  const queryClient = useQueryClient();
  const { confirm, DialogComponent } = useConfirmDialog();

  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<CargoLoad | null>(null);
  const [editingCargo, setEditingCargo] = useState<CargoLoad | null>(null);

  // Form state for simple edit modal (keeping for backward compatibility)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    weight: 0,
    volume: 0,
    cargoType: 'GENERAL',
    status: 'DRAFT',
    urgencyLevel: 'NORMAL',
    offeredPrice: 0,
    loadValue: 0,
    currencyCode: 'USD',
  });

  // Enhanced form state
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);
  const [editingCargoData, setEditingCargoData] = useState<CargoLoad | null>(null);

  // Fetch cargo loads
  const {
    data: cargoData,
    isLoading: cargoLoading,
    error: cargoError,
    refetch: refetchCargo,
  } = useQuery({
    queryKey: ['tenant-cargo'],
    queryFn: async () => {
      try {
        const response = await loadsAPI.getAll({});
        // Handle different response structures
        const data = response?.data || response;
        if (data?.items && Array.isArray(data.items)) {
          return data.items;
        }
        if (data?.loads && Array.isArray(data.loads)) {
          return data.loads;
        }
        if (Array.isArray(data)) {
          return data;
        }
        return [];
      } catch (error: any) {
        console.error('Error fetching cargo:', error);
        toast.error('Failed to load cargo');
        return [];
      }
    },
  });

  const cargoLoads: CargoLoad[] = Array.isArray(cargoData) ? cargoData : [];

  // Create cargo mutation
  const createMutation = useMutation({
    mutationFn: async (cargoData: any) => {
      return await loadsAPI.create(cargoData);
    },
    onSuccess: () => {
      toast.success('Cargo load created successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-cargo'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create cargo load');
    },
  });

  // Update cargo mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await loadsAPI.update(id, data);
    },
    onSuccess: () => {
      toast.success('Cargo load updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-cargo'] });
      setShowEditModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update cargo load');
    },
  });

  // Delete cargo mutation
  const deleteMutation = useMutation({
    mutationFn: async (cargoId: string) => {
      return await loadsAPI.delete(cargoId);
    },
    onSuccess: () => {
      toast.success('Cargo load deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tenant-cargo'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete cargo load');
    },
  });

  // Calculate statistics
  const stats: CargoStats = useMemo(() => {
    const totalLoads = cargoLoads.length;
    const activeLoads = cargoLoads.filter(
      (c) => c.status?.toUpperCase() === 'ACTIVE' || c.status?.toUpperCase() === 'IN_TRANSIT',
    ).length;
    const pendingLoads = cargoLoads.filter(
      (c) => c.status?.toUpperCase() === 'PENDING' || c.status?.toUpperCase() === 'DRAFT',
    ).length;
    const completedLoads = cargoLoads.filter(
      (c) => c.status?.toUpperCase() === 'COMPLETED' || c.status?.toUpperCase() === 'DELIVERED',
    ).length;
    const totalWeight = cargoLoads.reduce((sum, c) => {
      const weight = typeof c.weight === 'number' ? c.weight : Number(c.weight) || 0;
      return sum + weight;
    }, 0);
    const totalValue = cargoLoads.reduce((sum, c) => {
      const value = typeof c.loadValue === 'number' ? c.loadValue : Number(c.loadValue) || 0;
      return sum + value;
    }, 0);

    return {
      totalLoads,
      activeLoads,
      pendingLoads,
      completedLoads,
      totalWeight,
      totalValue,
    };
  }, [cargoLoads]);

  // Filter and sort cargo — handled by StandardDataTable

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      weight: 0,
      volume: 0,
      cargoType: 'GENERAL',
      status: 'DRAFT',
      urgencyLevel: 'NORMAL',
      offeredPrice: 0,
      loadValue: 0,
      currencyCode: 'USD',
    });
    setEditingCargo(null);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingCargoData(null);
    setShowEnhancedForm(true);
  };

  const openEditModal = (cargo: CargoLoad) => {
    setEditingCargo(cargo);
    setEditingCargoData(cargo);
    setFormData({
      title: cargo.title || '',
      description: cargo.description || '',
      weight: typeof cargo.weight === 'number' ? cargo.weight : Number(cargo.weight) || 0,
      volume: typeof cargo.volume === 'number' ? cargo.volume : Number(cargo.volume) || 0,
      cargoType: (cargo.cargoType || 'GENERAL').toUpperCase(),
      status: (cargo.status || 'DRAFT').toUpperCase(),
      urgencyLevel: (cargo.urgencyLevel || 'NORMAL').toUpperCase(),
      offeredPrice: typeof cargo.offeredPrice === 'number' ? cargo.offeredPrice : Number(cargo.offeredPrice) || 0,
      loadValue: typeof cargo.loadValue === 'number' ? cargo.loadValue : Number(cargo.loadValue) || 0,
      currencyCode: cargo.currencyCode || 'USD',
    });
    setShowEnhancedForm(true);
  };

  const openDetailsModal = (cargo: CargoLoad) => {
    setSelectedCargo(cargo);
    setShowDetailsModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: formData.title,
      description: formData.description,
      weight: Number(formData.weight),
      volume: Number(formData.volume),
      cargoType: formData.cargoType,
      status: formData.status,
      urgencyLevel: formData.urgencyLevel,
      offeredPrice: Number(formData.offeredPrice),
      loadValue: Number(formData.loadValue),
      currencyCode: formData.currencyCode,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCargo) return;
    updateMutation.mutate({
      id: editingCargo.id,
      data: {
        title: formData.title,
        description: formData.description,
        weight: Number(formData.weight),
        volume: Number(formData.volume),
        cargoType: formData.cargoType,
        status: formData.status,
        urgencyLevel: formData.urgencyLevel,
        offeredPrice: Number(formData.offeredPrice),
        loadValue: Number(formData.loadValue),
        currencyCode: formData.currencyCode,
      },
    });
  };

  // Handle enhanced form submission
  const handleEnhancedFormSubmit = async (cargoData: ICargoBody) => {
    try {
      if (editingCargoData) {
        // Update existing cargo
        await loadsAPI.update(editingCargoData.id, cargoData);
        toast.success('Cargo load updated successfully');
      } else {
        // Create new cargo
        await loadsAPI.create(cargoData);
        toast.success('Cargo load created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['tenant-cargo'] });
      setShowEnhancedForm(false);
      setEditingCargoData(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save cargo load');
      throw error;
    }
  };

  // Handle draft save
  const handleSaveDraft = async (cargoData: any) => {
    try {
      await loadsAPI.saveDraft(cargoData);
      toast.success('Draft saved successfully');
    } catch (error: any) {
      toast.error('Failed to save draft');
    }
  };

  const handleDelete = async (cargo: CargoLoad) => {
    const confirmed = await confirm({
      title: "Delete Cargo",
      message: `Are you sure you want to delete cargo "${cargo.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) return;
    deleteMutation.mutate(cargo.id);
  };

  const getStatusColor = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'IN_TRANSIT') return 'bg-blue-100 text-blue-800';
    if (s === 'COMPLETED' || s === 'DELIVERED') return 'bg-green-100 text-green-800';
    if (s === 'PENDING' || s === 'DRAFT') return 'bg-yellow-100 text-yellow-800';
    if (s === 'CANCELLED') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACTIVE' || s === 'IN_TRANSIT') return <FaTruck className="w-4 h-4" />;
    if (s === 'COMPLETED' || s === 'DELIVERED') return <FaCheckCircle className="w-4 h-4" />;
    if (s === 'PENDING' || s === 'DRAFT') return <FaClock className="w-4 h-4" />;
    if (s === 'CANCELLED') return <FaTimesCircle className="w-4 h-4" />;
    return <FaBox className="w-4 h-4" />;
  };

  const getUrgencyColor = (urgency?: string) => {
    const u = (urgency || '').toUpperCase();
    if (u === 'CRITICAL') return 'bg-red-100 text-red-800';
    if (u === 'HIGH') return 'bg-orange-100 text-orange-800';
    if (u === 'NORMAL') return 'bg-blue-100 text-blue-800';
    if (u === 'LOW') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getUrgencyVariant = (urgency?: string) => {
    const u = (urgency || '').toUpperCase();
    if (u === 'CRITICAL') return 'error' as const;
    if (u === 'HIGH') return 'orange' as const;
    if (u === 'NORMAL') return 'info' as const;
    if (u === 'LOW') return 'neutral' as const;
    return 'neutral' as const;
  };

  const columns: Column<CargoLoad>[] = useMemo(() => [
    {
      key: 'title',
      label: 'Cargo Title',
      alwaysVisible: true,
      render: (_v, cargo) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-slate-100">{cargo.title}</div>
          {cargo.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">{cargo.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'cargoType',
      label: 'Type',
      render: (_v, cargo) => (
        <span className="text-sm text-gray-700 dark:text-slate-300">{cargo.cargoType || 'GENERAL'}</span>
      ),
    },
    {
      key: 'weight',
      label: 'Weight',
      render: (_v, cargo) => (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
          <FaWeight className="w-4 h-4 text-gray-400" />
          {typeof cargo.weight === 'number' ? `${cargo.weight} kg` : `${Number(cargo.weight) || 0} kg`}
        </div>
      ),
    },
    {
      key: 'loadValue',
      label: 'Value',
      render: (_v, cargo) => (
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
          <FaDollarSign className="w-4 h-4 text-gray-400" />
          {cargo.currencyCode || 'USD'}{' '}
          {typeof cargo.loadValue === 'number'
            ? cargo.loadValue.toFixed(2)
            : (Number(cargo.loadValue) || 0).toFixed(2)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_v, cargo) => (
        <StatusBadge
          status={cargo.status}
          label={(cargo.status || 'DRAFT').replace(/_/g, ' ')}
        />
      ),
    },
    {
      key: 'urgencyLevel',
      label: 'Urgency',
      render: (_v, cargo) => (
        <StatusBadge
          variant={getUrgencyVariant(cargo.urgencyLevel)}
          label={(cargo.urgencyLevel || 'NORMAL').toUpperCase()}
        />
      ),
    },
    {
      key: 'cargoOwner',
      label: 'Owner',
      sortable: false,
      render: (_v, cargo) => (
        <span className="text-sm text-gray-700 dark:text-slate-300">
          {cargo.cargoOwner?.profile?.companyName || cargo.cargoOwner?.email || 'N/A'}
        </span>
      ),
    },
  ], []);

  const rowActions: TableAction<CargoLoad>[] = useMemo(() => [
    {
      key: 'view',
      label: 'View Details',
      icon: <FaEye className="w-3.5 h-3.5" />,
      onClick: (cargo) => openDetailsModal(cargo),
    },
    {
      key: 'edit',
      label: 'Edit Cargo',
      icon: <FaEdit className="w-3.5 h-3.5" />,
      onClick: (cargo) => openEditModal(cargo),
    },
    {
      key: 'delete',
      label: 'Delete Cargo',
      icon: <FaTrash className="w-3.5 h-3.5" />,
      variant: 'danger',
      divider: true,
      onClick: (cargo) => handleDelete(cargo),
    },
  ], []);

  if (cargoLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="ui-page-title flex items-center gap-3">
              <FaBox className="text-blue-600 flex-shrink-0" />
              Cargo Management
            </h1>
            <p className="ui-body-small mt-2">Manage and monitor cargo loads in your tenant</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => refetchCargo()}
              className="px-3 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm"
            >
              <FaSync className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={openCreateModal}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
            >
              <FaPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Cargo</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

      </div>

      {/* Cargo Table */}
      <StandardDataTable
        title="Cargo Loads"
        subtitle="Search, filter, and manage tenant cargo"
        icon={<FaBox className="w-5 h-5" />}
        headerColor="primary"
        columns={columns}
        data={cargoLoads}
        loading={cargoLoading}
        error={cargoError ? 'Failed to load cargo' : null}
        onRetry={() => refetchCargo()}
        getRowId={(row) => row.id}
        searchPlaceholder="Search cargo..."
        searchKeys={['title', 'description', 'cargoType', 'status']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'cargoType',
            label: 'Type',
            options: [
              { value: 'GENERAL', label: 'General' },
              { value: 'FRAGILE', label: 'Fragile' },
              { value: 'HAZARDOUS', label: 'Hazardous' },
              { value: 'REFRIGERATED', label: 'Refrigerated' },
              { value: 'OVERSIZED', label: 'Oversized' },
            ],
          },
        ]}
        defaultSortKey="createdAt"
        defaultSortDirection="desc"
        rowActions={rowActions}
        onRefresh={() => refetchCargo()}
        emptyMessage="No cargo loads match your current filters"
        ariaLabel="Tenant cargo loads"
      />

      {/* Enhanced Cargo Form Modal */}
      {showEnhancedForm && (
        <EnhancedCargoForm
          mode={editingCargoData ? 'edit' : 'create'}
          isOpen={showEnhancedForm}
          onClose={() => {
            setShowEnhancedForm(false);
            setEditingCargoData(null);
            resetForm();
          }}
          onSubmit={handleEnhancedFormSubmit}
          onSaveDraft={handleSaveDraft}
          initialData={editingCargoData ? {
            ...editingCargoData,
            loadType: (editingCargoData as any).loadType || 'FTL',
            equipmentType: (editingCargoData as any).equipmentType || 'DRY_VAN',
            visibility: (editingCargoData as any).visibility || 'public',
            unitsRequired: (editingCargoData as any).unitsRequired || 1,
            paymentTerms: (editingCargoData as any).paymentTerms || 'Net30',
            isFragile: (editingCargoData as any).isFragile || false,
            isHazardous: (editingCargoData as any).isHazardous || false,
            requiresRefrigeration: (editingCargoData as any).requiresRefrigeration || false,
            autoMatchEnabled: (editingCargoData as any).autoMatchEnabled !== false,
            pickupLocation: editingCargoData.pickupLocation || editingCargoData.origin,
            deliveryLocation: editingCargoData.deliveryLocation || editingCargoData.destination,
          } : undefined}
        />
      )}

      {/* Create Cargo Modal (Simple - keeping for backward compatibility) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaPlus className="text-blue-600" />
                Create New Cargo Load
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Electronics Shipment"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cargo description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.1}
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.volume}
                    onChange={(e) =>
                      setFormData({ ...formData, volume: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Cargo Type *
                  </label>
                  <select
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GENERAL">General</option>
                    <option value="FRAGILE">Fragile</option>
                    <option value="HAZARDOUS">Hazardous</option>
                    <option value="REFRIGERATED">Refrigerated</option>
                    <option value="OVERSIZED">Oversized</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Urgency Level *
                  </label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Offered Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.offeredPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, offeredPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Load Value
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.loadValue}
                    onChange={(e) =>
                      setFormData({ ...formData, loadValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currencyCode}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="RWF">RWF</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-4 h-4" />
                      Create Cargo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cargo Modal */}
      {showEditModal && editingCargo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaEdit className="text-blue-600" />
                Edit Cargo Load
              </h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={0.1}
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Volume (m³)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.volume}
                    onChange={(e) =>
                      setFormData({ ...formData, volume: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Cargo Type *
                  </label>
                  <select
                    value={formData.cargoType}
                    onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GENERAL">General</option>
                    <option value="FRAGILE">Fragile</option>
                    <option value="HAZARDOUS">Hazardous</option>
                    <option value="REFRIGERATED">Refrigerated</option>
                    <option value="OVERSIZED">Oversized</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Urgency Level *
                  </label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Offered Price
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.offeredPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, offeredPrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Load Value
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.loadValue}
                    onChange={(e) =>
                      setFormData({ ...formData, loadValue: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currencyCode}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="RWF">RWF</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <FaEdit className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cargo Details Modal */}
      {showDetailsModal && selectedCargo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FaBox className="text-blue-600" />
                Cargo Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-slate-300 transition-colors"
              >
                <FaTimesCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCargo.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      selectedCargo.status,
                    )}`}
                  >
                    {getStatusIcon(selectedCargo.status)}
                    {(selectedCargo.status || 'DRAFT').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cargo Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedCargo.cargoType || 'GENERAL'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Urgency Level</label>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(
                      selectedCargo.urgencyLevel,
                    )}`}
                  >
                    {(selectedCargo.urgencyLevel || 'NORMAL').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaWeight className="w-4 h-4 text-gray-400" />
                    {typeof selectedCargo.weight === 'number'
                      ? `${selectedCargo.weight} kg`
                      : `${Number(selectedCargo.weight) || 0} kg`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Volume</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaCube className="w-4 h-4 text-gray-400" />
                    {typeof selectedCargo.volume === 'number'
                      ? `${selectedCargo.volume} m³`
                      : selectedCargo.volume
                        ? `${Number(selectedCargo.volume)} m³`
                        : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Load Value</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaDollarSign className="w-4 h-4 text-gray-400" />
                    {selectedCargo.currencyCode || 'USD'}{' '}
                    {typeof selectedCargo.loadValue === 'number'
                      ? selectedCargo.loadValue.toFixed(2)
                      : (Number(selectedCargo.loadValue) || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Offered Price</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaDollarSign className="w-4 h-4 text-gray-400" />
                    {selectedCargo.currencyCode || 'USD'}{' '}
                    {typeof selectedCargo.offeredPrice === 'number'
                      ? selectedCargo.offeredPrice.toFixed(2)
                      : selectedCargo.offeredPrice
                        ? Number(selectedCargo.offeredPrice).toFixed(2)
                        : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cargo Owner</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2">
                    <FaUser className="w-4 h-4 text-gray-400" />
                    {selectedCargo.cargoOwner?.profile?.companyName ||
                      selectedCargo.cargoOwner?.email ||
                      'N/A'}
                  </p>
                </div>
                {selectedCargo.pickupDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pickup Date</label>
                    <p className="text-gray-900 dark:text-white flex items-center gap-2">
                      <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                      {new Date(selectedCargo.pickupDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {selectedCargo.deliveryDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Delivery Date</label>
                    <p className="text-gray-900 dark:text-white flex items-center gap-2">
                      <FaCalendarAlt className="w-4 h-4 text-gray-400" />
                      {new Date(selectedCargo.deliveryDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
              {selectedCargo.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 dark:text-white mt-1">{selectedCargo.description}</p>
                </div>
              )}
              {(selectedCargo.pickupLocation || selectedCargo.origin) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Pickup Location</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                    <FaMapMarkerAlt className="w-4 h-4 text-green-500" />
                    {selectedCargo.pickupLocation?.name ||
                      selectedCargo.pickupLocation?.address ||
                      selectedCargo.origin?.name ||
                      selectedCargo.origin?.address ||
                      'N/A'}
                  </p>
                </div>
              )}
              {(selectedCargo.deliveryLocation || selectedCargo.destination) && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Delivery Location</label>
                  <p className="text-gray-900 dark:text-white flex items-center gap-2 mt-1">
                    <FaMapMarkerAlt className="w-4 h-4 text-red-500" />
                    {selectedCargo.deliveryLocation?.name ||
                      selectedCargo.deliveryLocation?.address ||
                      selectedCargo.destination?.name ||
                      selectedCargo.destination?.address ||
                      'N/A'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

export default TenantAdminCargo;

