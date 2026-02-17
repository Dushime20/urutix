import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Mail,
  Phone,
  Package,
  Trash2,
  UserPlus,
  Shield,
  Clock,
  CheckCircle,
  X,
  ExternalLink,
  Filter,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import type { Receiver, CreateReceiverDto } from '../../types/receiver';
import { cn } from '@/utils/cn';

const StatsCard = ({ title, value, icon: Icon, colorClass, secondaryColor }: any) => (
  <div className="flex flex-col items-center group">
    <div className="relative w-48 h-48 rounded-full bg-white border-[12px] border-slate-50 flex flex-col items-center justify-center transition-all duration-500 hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
      {/* Decorative outer ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.05]">
        <circle
          cx="96"
          cy="96"
          r="88"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray="553"
          strokeDashoffset="440"
          className={cn("opacity-10 transition-all duration-1000 group-hover:stroke-dashoffset-[300]", secondaryColor)}
        />
      </svg>

      <div className={cn("p-3 rounded-2xl mb-2 bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-inherit transition-all duration-500 shadow-sm", colorClass)}>
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex flex-col items-center">
        <span className="text-4xl font-black text-[#0f172a] tracking-tighter group-hover:scale-110 transition-transform duration-500">
          {value}
        </span>
      </div>

      {/* Aesthetic inner ring */}
      <div className="absolute inset-4 rounded-full border border-dashed border-slate-100 opacity-50 group-hover:rotate-90 transition-transform duration-1000" />
    </div>

    <div className="mt-6 text-center">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-[#345E85] transition-colors duration-300">
        {title}
      </p>
    </div>
  </div>
);

const ReceiversPage: React.FC = () => {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  const [cargos, setCargos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<CreateReceiverDto>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

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

  const filteredReceivers = receivers.filter(r =>
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${r.profile?.firstName} ${r.profile?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-50 border-t-[#345E85] animate-spin"></div>
          <div className="absolute inset-4 rounded-full border-4 border-slate-50 border-b-[#345E85] animate-spin-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-[#345E85]" />
          </div>
        </div>
        <p className="mt-6 text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
          Loading Receivers...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-8 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#345E85]" />
            </div>
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tight">Receivers</h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xl">
            Manage the people and businesses receiving your cargo shipments
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all transform hover:-translate-y-1"
        >
          <Plus className="w-4 h-4" />
          Add New Receiver
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 place-items-center">
        <StatsCard
          title="Total Receivers"
          value={receivers.length}
          icon={Users}
          colorClass="bg-blue-50 text-[#345E85]"
          secondaryColor="text-[#345E85]"
        />
        <StatsCard
          title="Active Receivers"
          value={receivers.filter(r => r.status === 'ACTIVE').length}
          icon={CheckCircle}
          colorClass="bg-emerald-50 text-emerald-600"
          secondaryColor="text-emerald-600"
        />
        <StatsCard
          title="Pending Invites"
          value={receivers.filter(r => r.status !== 'ACTIVE').length}
          icon={Clock}
          colorClass="bg-amber-50 text-amber-600"
          secondaryColor="text-amber-600"
        />
        <StatsCard
          title="Cargos Assigned"
          value="0"
          icon={Package}
          colorClass="bg-purple-50 text-purple-600"
          secondaryColor="text-purple-600"
        />
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="SEARCH BY NAME OR EMAIL..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 rounded-xl transition-all">
              <Filter className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-slate-100 mx-2" />
            <button
              className="px-6 py-2 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
              onClick={loadReceivers}
            >
              Refresh List
            </button>
          </div>
        </div>

        {/* Receivers Grid */}
        {filteredReceivers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm border-dashed">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">No Receivers Found</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              Expand your logistics network by registering your first receiver endpoint
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReceivers.map((receiver) => (
              <div
                key={receiver.id}
                className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-xl font-black text-[#345E85] group-hover:bg-[#345E85] group-hover:text-white transition-all">
                    {receiver.profile?.firstName?.[0] || receiver.email[0].toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenAssignModal(receiver)}
                      className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-xl transition-all"
                      title="Assign Assets"
                    >
                      <Package className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReceiver(receiver.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Terminate Access"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight group-hover:text-[#345E85] transition-colors">
                      {receiver.profile ? `${receiver.profile.firstName} ${receiver.profile.lastName}` : 'System Endpoint'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest border",
                        receiver.status === 'ACTIVE'
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {receiver.status}
                      </span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">•</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Added {new Date(receiver.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold truncate uppercase tracking-widest">{receiver.email}</span>
                    </div>
                    {receiver.phone && (
                      <div className="flex items-center gap-3 text-slate-500">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{receiver.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                        LG
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-[#345E85] flex items-center justify-center text-[8px] font-black text-white">
                      +2
                    </div>
                  </div>
                  <button className="text-[10px] font-black text-[#345E85] uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                    View Profile
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals Container */}
      <div className="fixed z-[9999]">
        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Add Receiver</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Invite a new contact to receive your cargo</p>
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleCreateReceiver} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="e.g. John"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="e.g. Vance"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="john.doe@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="+234..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-8 py-4 bg-[#345E85] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all"
                    >
                      Add Receiver
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                      <Package className="w-7 h-7 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Assign Cargo</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Select cargo to assign to {selectedReceiver.profile?.firstName || 'this receiver'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {cargos.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No cargo available to assign</p>
                    </div>
                  ) : (
                    cargos.map((cargo) => (
                      <div
                        key={cargo.id}
                        className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md hover:border-purple-100 transition-all"
                      >
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{cargo.title || 'Untitled Cargo'}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-2">{cargo.reference || cargo.id.substring(0, 8)}</span>
                            <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">{cargo.status}</span>
                          </div>
                          {cargo.receiver && (
                            <p className="text-[9px] font-bold text-slate-400 mt-1 italic">
                              Assigned to: {cargo.receiver.profile?.firstName} {cargo.receiver.profile?.lastName}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {cargo.receiverId === selectedReceiver.id ? (
                            <button
                              onClick={() => handleUnassignCargo(cargo.id)}
                              className="px-6 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all"
                            >
                              Unassign
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignCargo(cargo.id)}
                              disabled={!!cargo.receiverId && cargo.receiverId !== selectedReceiver.id}
                              className={cn(
                                "px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border",
                                cargo.receiverId
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white"
                              )}
                            >
                              {cargo.receiverId ? 'Already Assigned' : 'Assign'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all"
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


