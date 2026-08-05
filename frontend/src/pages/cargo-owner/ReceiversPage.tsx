import React, { useState, useEffect } from 'react';
import {
  Plus,
  Mail,
  Phone,
  Package,
  Trash2,
  Shield,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import type { Receiver, CreateReceiverDto } from '../../types/receiver';
import { cn } from '@/utils/cn';
import { useCargoOwnerLayout } from '../../contexts/CargoOwnerLayoutContext';
import ModernLoader from '../../components/common/ModernLoader';
import {
  StandardDataTable,
  StatusBadge,
  type Column,
  type TableAction,
} from '../../components/EnliteUI/Tables';

const ReceiversPage: React.FC = () => {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  const [cargos, setCargos] = useState<any[]>([]);
  const [formData, setFormData] = useState<CreateReceiverDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const layout = useCargoOwnerLayout();
  const setHideHeader = layout?.setHideHeader;

  useEffect(() => {
    if (setHideHeader) {
      setHideHeader(showCreateModal || showAssignModal);
    }
    return () => {
      if (setHideHeader) setHideHeader(false);
    };
  }, [showCreateModal, showAssignModal, setHideHeader]);

  useEffect(() => {
    loadReceivers();
  }, []);

  const loadReceivers = async () => {
    try {
      setLoading(true);
      const data = await receiverService.getReceivers();
      setReceivers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to synchronise receivers');
      setReceivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceiver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast.loading('Adding receiver...', { id: 'create-receiver' });
      await receiverService.createReceiver(formData);
      toast.success('Receiver added successfully', { id: 'create-receiver' });
      setShowCreateModal(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '' });
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add receiver', { id: 'create-receiver' });
    }
  };

  const handleDeleteReceiver = async (receiverId: string) => {
    if (!window.confirm('Are you sure you want to remove this receiver?')) {
      return;
    }

    try {
      toast.loading('Removing receiver...', { id: 'delete-receiver' });
      await receiverService.deleteReceiver(receiverId);
      toast.success('Receiver removed', { id: 'delete-receiver' });
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Decommissioning failure', { id: 'delete-receiver' });
    }
  };

  const handleOpenAssignModal = async (receiver: Receiver) => {
    setSelectedReceiver(receiver);
    try {
      const data = await receiverService.getCargosForAssignment();
      setCargos(data);
      setShowAssignModal(true);
    } catch (error: any) {
      toast.error('Failed to load cargo');
    }
  };

  const handleAssignCargo = async (cargoId: string) => {
    if (!selectedReceiver) return;

    try {
      toast.loading('Assigning cargo...', { id: 'assign-cargo' });
      await receiverService.assignCargoToReceiver(cargoId, selectedReceiver.id);
      toast.success('Cargo assigned successfully', { id: 'assign-cargo' });
      setShowAssignModal(false);
      setSelectedReceiver(null);
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign cargo', { id: 'assign-cargo' });
    }
  };

  const handleUnassignCargo = async (cargoId: string) => {
    if (!window.confirm('Unassign this cargo?')) {
      return;
    }

    try {
      toast.loading('Unassigning cargo...', { id: 'unassign-cargo' });
      await receiverService.unassignCargoFromReceiver(cargoId);
      toast.success('Cargo unassigned', { id: 'unassign-cargo' });
      loadReceivers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unassign cargo', { id: 'unassign-cargo' });
    }
  };

  const getReceiverName = (receiver: Receiver) =>
    receiver.profile
      ? `${receiver.profile.firstName} ${receiver.profile.lastName}`
      : 'Receiver';

  const handleExport = () => {
    if (receivers.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Status', 'Role', 'Added'];
    const rows = receivers.map((r) => [
      getReceiverName(r),
      r.email,
      r.phone || r.profile?.phone || '',
      r.status,
      r.role,
      r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receivers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns: Column<Receiver>[] = [
    {
      key: 'profile.firstName',
      label: 'RECEIVER IDENTITY',
      sortable: true,
      render: (_: unknown, receiver: Receiver) => {
        const name = getReceiverName(receiver);
        const initial = (receiver.profile?.firstName?.[0] || receiver.email[0] || 'R').toUpperCase();
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs',
                receiver.status === 'ACTIVE' ? 'bg-[#345E85]' : 'bg-amber-500'
              )}
            >
              {initial}
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-[11px]">
                {name}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                {receiver.role?.replace(/_/g, ' ') || 'Cargo Receiver'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'email',
      label: 'CONTACT CHANNEL',
      sortable: true,
      render: (_: unknown, receiver: Receiver) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <Mail size={12} className="text-slate-400 shrink-0" />
            <span className="text-[11px] font-bold truncate max-w-[220px]">{receiver.email}</span>
          </div>
          {(receiver.phone || receiver.profile?.phone) && (
            <div className="flex items-center gap-2 text-slate-500">
              <Phone size={12} className="text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {receiver.phone || receiver.profile?.phone}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS & RATING',
      sortable: true,
      render: (status: string) => (
        <StatusBadge label={status || '—'} status={status} />
      ),
    },
    {
      key: 'createdAt',
      label: 'ONBOARDED',
      sortable: true,
      render: (_: unknown, receiver: Receiver) => (
        <div className="flex flex-col">
          <span className="font-black text-slate-900 dark:text-white text-[11px]">
            {receiver.createdAt ? new Date(receiver.createdAt).toLocaleDateString() : 'N/A'}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
            <Clock size={10} />
            Member since
          </span>
        </div>
      ),
    },
  ];

  const rowActions: TableAction<Receiver>[] = [
    {
      key: 'assign',
      label: 'Assign Cargo',
      icon: <Package size={14} />,
      onClick: (receiver) => handleOpenAssignModal(receiver),
    },
    {
      key: 'email',
      label: 'Contact',
      icon: <Mail size={14} />,
      onClick: (receiver) => {
        if (receiver.email) {
          window.location.href = `mailto:${receiver.email}`;
        }
      },
      disabled: (receiver) => !receiver.email,
    },
    {
      key: 'delete',
      label: 'Remove Receiver',
      icon: <Trash2 size={14} />,
      variant: 'danger',
      divider: true,
      onClick: (receiver) => handleDeleteReceiver(receiver.id),
    },
  ];

  if (loading && receivers.length === 0) {
    return <ModernLoader isLoading={true} text="Synchronizing_Receivers" />;
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-8 md:p-12 space-y-8 sm:space-y-12 overflow-x-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-[#345E85]" />
            </div>
            <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
              Cargo <span className="text-[#345E85]">Receivers</span>
            </h1>
          </div>
          <p className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest sm:tracking-[0.2em] max-w-xl">
            Manage people who will receive your cargo deliveries
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-[#345E85] text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          Add Receiver
        </button>
      </div>

      {/* Table */}
      <div className="space-y-8 animate-in fade-in duration-500">
        <StandardDataTable
          title="Receiver Management Console"
          headerColor="primary"
          columns={columns}
          data={receivers}
          loading={loading}
          getRowId={(row) => row.id}
          searchable
          searchPlaceholder="Search receivers…"
          searchKeys={['email', 'phone', 'status', 'profile.firstName', 'profile.lastName']}
          pagination
          pageSize={10}
          columnVisibility
          stickyHeader
          striped
          hoverable
          emptyMessage="No receivers found. Add your first cargo receiver to start managing deliveries."
          onExport={handleExport}
          exportLabel="Export Receivers"
          onRefresh={loadReceivers}
          rowActions={rowActions}
          ariaLabel="Receiver Management Console"
        />
      </div>

      {/* Modals Container */}
      <div className="fixed z-[9999]">
        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
              <div className="p-6 sm:p-12 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Add New Receiver</h2>
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Create a cargo receiver who will accept deliveries</p>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
                    <X className="w-6 h-6 text-slate-300" />
                  </button>
                </div>

                <form onSubmit={handleCreateReceiver} className="space-y-5 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                        placeholder="e.g. Victor"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                        placeholder="e.g. Okafor"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-14 pr-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                        placeholder="receiver@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-14 pr-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                        placeholder="+234 800 000 0000"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-8 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/50 text-slate-400 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-8 py-3.5 sm:py-4 bg-[#345E85] text-white rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-slate-800 transition-all active:scale-95"
                    >
                      Create Receiver
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedReceiver && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-top-8 duration-500">
              <div className="p-6 sm:p-12 space-y-8 max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Assign Cargo</h2>
                      <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-relaxed">
                        Assign cargo deliveries to {selectedReceiver.profile?.firstName || 'this receiver'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-90">
                    <X className="w-6 h-6 text-slate-300" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {cargos.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-100 dark:border-slate-800 shadow-inner">
                      <Package className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Available Cargo</p>
                    </div>
                  ) : (
                    cargos.map((cargo) => (
                      <div
                        key={cargo.id}
                        className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl sm:rounded-[1.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:bg-white dark:bg-slate-900 hover:shadow-xl hover:border-indigo-100 transition-all duration-300"
                      >
                        <div className="space-y-1.5">
                          <h3 className="text-xs sm:text-sm font-black text-[#0f172a] uppercase tracking-tight leading-none">{cargo.title || 'NULL_PAYLOAD'}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200 dark:border-slate-700 pr-2">{cargo.reference || cargo.id.substring(0, 8)}</span>
                            <span className="text-[8px] sm:text-[9px] font-black text-indigo-500 uppercase tracking-widest">{cargo.status}</span>
                          </div>
                          {cargo.receiver && (
                            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 mt-1.5 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-indigo-200" />
                              Assigned to: {cargo.receiver.profile?.firstName} {cargo.receiver.profile?.lastName}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {cargo.receiverId === selectedReceiver.id ? (
                            <button
                              onClick={() => handleUnassignCargo(cargo.id)}
                              className="px-5 sm:px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-red-900/10 transition-all active:scale-95"
                            >
                              Unassign
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignCargo(cargo.id)}
                              disabled={!!cargo.receiverId && cargo.receiverId !== selectedReceiver.id}
                              className={cn(
                                'px-5 sm:px-6 py-2.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95',
                                cargo.receiverId
                                  ? 'bg-slate-100 text-slate-300 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                                  : 'bg-white dark:bg-slate-900 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-indigo-900/10 whitespace-nowrap'
                              )}
                            >
                              {cargo.receiverId ? 'Assigned' : 'Assign Here'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-full py-4 bg-[#0f172a] text-white rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-95 border-b-4 border-slate-700"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiversPage;
