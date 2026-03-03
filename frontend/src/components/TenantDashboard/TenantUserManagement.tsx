import React, { useState, useMemo } from 'react';
import {
    Users, UserPlus, Search,
    Truck, Box, CheckCircle,
    ArrowRight, Download,
    X, Activity, Mail, Phone
} from 'lucide-react';
import PartnerDetailView from './PartnerDetailView';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';

interface PartnerProfile {
    firstName: string;
    lastName: string;
}

interface Partner {
    id: string;
    email: string;
    role: 'TRUCK_OWNER' | 'CARGO_OWNER';
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
    profile?: PartnerProfile;
    phone?: string;
}

interface TenantUserManagementProps {
    tenantId: string;
}

const TenantUserManagement: React.FC<TenantUserManagementProps> = ({ tenantId }) => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'TRUCK_OWNER' | 'CARGO_OWNER'>('ALL');
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

    // Onboarding Form State
    const [onboardForm, setOnboardForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'TRUCK_OWNER',
        phone: ''
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['tenantUsers', tenantId],
        queryFn: () => tenantApi.getTenantUsers(tenantId),
    });

    const onboardMutation = useMutation({
        mutationFn: (data: typeof onboardForm) => tenantApi.createTenantUser(tenantId, data),
        onSuccess: () => {
            toast.success('Partner onboarded successfully');
            queryClient.invalidateQueries({ queryKey: ['tenantUsers', tenantId] });
            setIsOnboardModalOpen(false);
            setOnboardForm({ email: '', firstName: '', lastName: '', role: 'TRUCK_OWNER', phone: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to onboard partner');
        }
    });

    const filteredUsers = useMemo(() => {
        return users.filter((user: Partner) => {
            const matchesSearch =
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole =
                roleFilter === 'ALL' || user.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, roleFilter]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            truckOwners: users.filter((u: Partner) => u.role === 'TRUCK_OWNER').length,
            cargoOwners: users.filter((u: Partner) => u.role === 'CARGO_OWNER').length,
            active: users.filter((u: Partner) => u.status === 'ACTIVE').length,
        };
    }, [users]);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'TRUCK_OWNER': return <Truck className="w-4 h-4 text-indigo-500" />;
            case 'CARGO_OWNER': return <Box className="w-4 h-4 text-emerald-500" />;
            default: return <Users className="w-4 h-4 text-slate-400" />;
        }
    };

    const handleOnboardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onboardMutation.mutate(onboardForm);
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Network Entities', value: stats.total, icon: Users, color: 'indigo' },
                    { label: 'Asset Owners', value: stats.truckOwners, icon: Truck, color: 'violet' },
                    { label: 'Freight Nodes', value: stats.cargoOwners, icon: Box, color: 'emerald' },
                    { label: 'Operational Status', value: stats.active, icon: CheckCircle, color: 'sky' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-8 group hover:border-indigo-100 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 bg-${stat.color}-50 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                            </div>
                            <Activity className="w-4 h-4 text-slate-100 group-hover:text-indigo-50 transition-colors" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Hub Header */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col">
                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Central Hub</h3>
                        <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Partner Ecosystem</h4>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end">
                        <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsOnboardModalOpen(true)}
                            className="flex-1 sm:flex-none justify-center bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center text-[10px] font-black uppercase tracking-widest"
                        >
                            <UserPlus className="w-4 h-4 mr-3" />
                            Ingress New Partner
                        </button>
                    </div>
                </div>

                {/* Search & Filter Plane */}
                <div className="px-6 md:px-10 py-4 md:py-6 border-b border-slate-50 flex flex-col lg:flex-row gap-4 md:gap-6 bg-slate-50/20">
                    <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="Universal search (Entity ID, Name, Email)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 md:py-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all outline-none text-xs md:text-sm font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                        <div className="flex bg-white p-1 md:p-1.5 rounded-2xl border border-slate-100 shadow-sm min-w-max">
                            {(['ALL', 'TRUCK_OWNER', 'CARGO_OWNER'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${roleFilter === role ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {role.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ecosystem Table */}
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50/30 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                            <tr>
                                <th className="px-6 md:px-10 py-4 md:py-6">Identity Node</th>
                                <th className="px-6 md:px-10 py-4 md:py-6">Protocol / Role</th>
                                <th className="px-6 md:px-10 py-4 md:py-6">Ecosystem Access</th>
                                <th className="px-6 md:px-10 py-4 md:py-6">Sync Status</th>
                                <th className="px-6 md:px-10 py-4 md:py-6 text-right">Action Cell</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-10 py-8">
                                            <div className="h-12 bg-slate-50 rounded-2xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredUsers.map((user: Partner) => (
                                <motion.tr
                                    key={user.id}
                                    layout
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedPartner(user)}
                                >
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
                                                <span className="text-indigo-600 font-black text-sm group-hover:text-white">
                                                    {user.profile?.firstName?.[0] || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                                    {user.profile?.firstName} {user.profile?.lastName}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                    {user.id.split('-')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                                                {user.role.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <Phone className="w-3.5 h-3.5 text-slate-300" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.status === 'ACTIVE'
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            : user.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                                            {user.status}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="text-slate-400 group-hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-xl">
                                            <ArrowRight className="w-6 h-6" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Deep Analytics Slideover/Modal */}
            <AnimatePresence>
                {selectedPartner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => setSelectedPartner(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 40 }}
                            className="w-full max-w-6xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <PartnerDetailView
                                partner={selectedPartner}
                                tenantId={tenantId}
                                onClose={() => setSelectedPartner(null)}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ingress / Onboarding Modal */}
            <AnimatePresence>
                {isOnboardModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
                        onClick={() => setIsOnboardModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xl rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden border border-white/20 max-h-[95vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-indigo-600 p-6 md:p-10 text-white relative overflow-hidden flex-shrink-0">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6 md:mb-10">
                                        <div className="p-3 md:p-4 bg-white/10 rounded-2xl md:rounded-3xl border border-white/20 backdrop-blur-md">
                                            <UserPlus className="w-6 h-6 md:w-8 md:h-8" />
                                        </div>
                                        <button onClick={() => setIsOnboardModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                            <X className="w-5 h-5 md:w-6 md:h-6" />
                                        </button>
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black tracking-tight">Partner Ingress</h3>
                                    <p className="text-white/60 text-xs md:text-sm font-medium mt-2">Initializing new entity node in the ecosystem.</p>
                                </div>
                                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            </div>

                            <div className="overflow-y-auto flex-1 custom-scrollbar">
                                <form onSubmit={handleOnboardSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 bg-slate-50/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Identity</label>
                                            <input
                                                required
                                                type="text"
                                                value={onboardForm.firstName}
                                                onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })}
                                                className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                placeholder="Enter name..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Identity</label>
                                            <input
                                                required
                                                type="text"
                                                value={onboardForm.lastName}
                                                onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })}
                                                className="w-full px-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                placeholder="Enter surname..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Node Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <input
                                                required
                                                type="email"
                                                value={onboardForm.email}
                                                onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                                                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                                                placeholder="identity@ecosystem.network"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Authorization</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                            {[
                                                { id: 'TRUCK_OWNER', label: 'Asset Owner', icon: Truck },
                                                { id: 'CARGO_OWNER', label: 'Freight Node', icon: Box }
                                            ].map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setOnboardForm({ ...onboardForm, role: role.id })}
                                                    className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${onboardForm.role === role.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
                                                        }`}
                                                >
                                                    <role.icon className={`w-8 h-8 ${onboardForm.role === role.id ? 'text-indigo-600' : 'text-slate-300'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${onboardForm.role === role.id ? 'text-indigo-600' : 'text-slate-400'}`}>{role.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={onboardMutation.isPending}
                                        className="w-full py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[20px] md:rounded-[24px] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {onboardMutation.isPending ? 'Syncing...' : 'Complete Ingress'}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TenantUserManagement;
