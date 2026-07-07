import React, { useState, useMemo } from 'react';
import {
    Users, UserPlus, Search,
    Truck, Box, CheckCircle,
    ArrowRight, Download,
    X, Mail, Phone, Gavel, 
    Navigation, DollarSign,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import PartnerDetailView from './PartnerDetailView';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface PartnerProfile {
    firstName: string;
    lastName: string;
}

interface Partner {
    id: string;
    email: string;
    role: 'TRUCK_OWNER' | 'CARGO_OWNER' | 'BROKER' | 'DRIVER' | 'LENDER' | 'FLEET_MANAGER';
    status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'PENDING_VERIFICATION' | 'DEACTIVATED';
    profile?: PartnerProfile;
    phone?: string;
}

interface TenantUserManagementProps {
    tenantId: string;
}

const TenantUserManagement: React.FC<TenantUserManagementProps> = ({ tenantId }) => {
    const { tSync } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'TRUCK_OWNER' | 'CARGO_OWNER' | 'BROKER' | 'DRIVER' | 'LENDER' | 'FLEET_MANAGER'>('ALL');
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Onboarding Form State
    const [onboardForm, setOnboardForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'TRUCK_OWNER' as string,
        phone: ''
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['tenantUsers', tenantId],
        queryFn: () => tenantApi.getTenantUsers(tenantId),
    });

    const onboardMutation = useMutation({
        mutationFn: (data: typeof onboardForm) => tenantApi.createTenantUser(tenantId, data),
        onSuccess: () => {
            toast.success(tSync('Partner onboarded successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenantUsers', tenantId] });
            setIsOnboardModalOpen(false);
            setOnboardForm({ email: '', firstName: '', lastName: '', role: 'TRUCK_OWNER', phone: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || tSync('Failed to onboard partner'));
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

    // Pagination calculations
    const totalPages = Math.ceil(filteredUsers.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, pageSize]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            truckOwners: users.filter((u: Partner) => u.role === 'TRUCK_OWNER').length,
            cargoOwners: users.filter((u: Partner) => u.role === 'CARGO_OWNER').length,
            brokers: users.filter((u: Partner) => u.role === 'BROKER').length,
            drivers: users.filter((u: Partner) => u.role === 'DRIVER').length,
            lenders: users.filter((u: Partner) => u.role === 'LENDER').length,
            active: users.filter((u: Partner) => u.status === 'ACTIVE').length,
        };
    }, [users]);

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'TRUCK_OWNER': return <Truck className="w-4 h-4 text-indigo-500" />;
            case 'CARGO_OWNER': return <Box className="w-4 h-4 text-emerald-500" />;
            case 'BROKER': return <Gavel className="w-4 h-4 text-amber-500" />;
            case 'DRIVER': return <Navigation className="w-4 h-4 text-primary-500" />;
            case 'LENDER': return <DollarSign className="w-4 h-4 text-rose-500" />;
            default: return <Users className="w-4 h-4 text-slate-400" />;
        }
    };

    const handleOnboardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onboardMutation.mutate(onboardForm);
    };

    return (
        <div className="space-y-8 pb-20 w-full max-w-full overflow-x-hidden">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-4">
                {[
                    { label: 'Total Users', value: stats.total, icon: Users, borderColor: 'border-primary-100 dark:border-primary-900/30', shadowColor: 'shadow-primary-100/20 dark:shadow-primary-900/10' },
                    { label: 'Truck Owners', value: stats.truckOwners, icon: Truck, borderColor: 'border-indigo-100 dark:border-indigo-900/30', shadowColor: 'shadow-indigo-100/20 dark:shadow-indigo-900/10' },
                    { label: 'Cargo Owners', value: stats.cargoOwners, icon: Box, borderColor: 'border-emerald-100 dark:border-emerald-900/30', shadowColor: 'shadow-emerald-100/20 dark:shadow-emerald-900/10' },
                    { label: 'Active Status', value: stats.active, icon: CheckCircle, borderColor: 'border-primary-100 dark:border-primary-900/30', shadowColor: 'shadow-primary-100/20 dark:shadow-primary-900/10' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center space-x-6 transition-transform duration-300 hover:translate-x-1 cursor-default group"
                    >
                        <div className={`relative flex-shrink-0 flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-slate-900 border ${stat.borderColor} shadow-xl ${stat.shadowColor} overflow-hidden transition-all duration-500 group-hover:scale-110`}>
                            <stat.icon size={28} className="text-primary-600 dark:text-primary-400" />
                        </div>

                        <div className="flex flex-col">
                            <span className={`text-3xl font-black text-primary-600 dark:text-primary-400 tracking-tight leading-none mb-1.5`}>
                                {stat.value}
                            </span>
                            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-[0.2em]">
                                <TranslatedText text={stat.label} />
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* User Directory Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 md:px-10 py-6 md:py-10 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 italic"><TranslatedText text="Users" /></h3>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight"><TranslatedText text="User List" /></h4>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end">
                        <button className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[20px] text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsOnboardModalOpen(true)}
                            className="flex-1 sm:flex-none justify-center bg-primary-600 text-white px-8 md:px-10 py-4 rounded-[20px] hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 dark:shadow-none flex items-center text-[11px] font-black uppercase tracking-widest"
                        >
                            <UserPlus className="w-4 h-4 mr-3" />
                            <TranslatedText text="Add User" />
                        </button>
                    </div>
                </div>

                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-4 md:gap-6 bg-slate-50/20 dark:bg-slate-800/10">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                        <input
                            type="text"
                            placeholder={tSync('Search by name, email, or ID...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[20px] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-600 transition-all outline-none text-xs md:text-sm font-medium shadow-sm text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-sm min-w-max">
                            {(['ALL', 'TRUCK_OWNER', 'FLEET_MANAGER', 'CARGO_OWNER', 'BROKER', 'DRIVER', 'LENDER'] as const).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setRoleFilter(role)}
                                    className={`px-5 py-2.5 rounded-[14px] text-[9px] font-black uppercase tracking-widest transition-all ${roleFilter === role 
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-100 dark:shadow-none' 
                                        : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <TranslatedText text={role.replace('_', ' ')} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ecosystem Table */}
                <div className="flex-1 overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50/30 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left">
                            <tr>
                                <th className="px-10 py-6 italic"><TranslatedText text="User Info" /></th>
                                <th className="px-10 py-6"><TranslatedText text="Role" /></th>
                                <th className="px-10 py-6"><TranslatedText text="Contact" /></th>
                                <th className="px-10 py-6"><TranslatedText text="Status" /></th>
                                <th className="px-10 py-6 text-right"><TranslatedText text="Actions" /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-10 py-8">
                                            <div className="h-12 bg-slate-50 rounded-2xl w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-10 py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-slate-100 dark:border-slate-800">
                                            <Users className="text-slate-200 dark:text-slate-700 w-10 h-10" />
                                        </div>
                                        <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest"><TranslatedText text="No Users Found" /></h5>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">
                                            {filteredUsers.length === 0 ? <TranslatedText text="No users match your search criteria." /> : <TranslatedText text="Start by adding users to your tenant." />}
                                        </p>
                                    </td>
                                </tr>
                            ) : paginatedUsers.map((user: Partner) => (
                                <motion.tr
                                    key={user.id}
                                    layout
                                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    onClick={() => setSelectedPartner(user)}
                                >
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-[18px] flex items-center justify-center border border-primary-100 dark:border-primary-800 group-hover:bg-primary-600 group-hover:border-primary-600 transition-all duration-300">
                                                <span className="text-primary-600 dark:text-primary-400 font-black text-sm group-hover:text-white italic">
                                                    {user.profile?.firstName?.[0] || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                    {user.profile?.firstName} {user.profile?.lastName}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                                    {user.id.split('-')[0]}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                {getRoleIcon(user.role)}
                                            </div>
                                            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                                                <TranslatedText text={user.role.replace(/_/g, ' ')} />
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                <Mail className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <Phone className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.status === 'ACTIVE'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800'
                                            : user.status === 'SUSPENDED' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800' 
                                            : user.status === 'PENDING_VERIFICATION' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                                            <TranslatedText text={user.status === 'PENDING_VERIFICATION' ? 'PENDING' : user.status} />
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="text-slate-400 dark:text-slate-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors p-3 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-xl">
                                            <ArrowRight className="w-5 h-5 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!isLoading && filteredUsers.length > 0 && (
                    <div className="px-6 md:px-10 py-6 border-t border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Results Info */}
                        <div className="flex items-center gap-4">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                <TranslatedText text="Showing" /> {startIndex + 1} <TranslatedText text="to" /> {Math.min(endIndex, filteredUsers.length)} <TranslatedText text="of" /> {filteredUsers.length} <TranslatedText text="users" />
                            </p>
                            
                            {/* Page Size Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500"><TranslatedText text="Show:" /></span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 focus:border-primary-600 focus:ring-2 focus:ring-primary-500/10 outline-none"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                {/* Previous Button */}
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-100 dark:hover:border-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-100 dark:shadow-none'
                                                        : 'text-slate-400 hover:text-primary-600 dark:text-slate-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-100 dark:hover:border-primary-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
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
                            {selectedPartner && (
                                <PartnerDetailView
                                    partner={selectedPartner as any}
                                    tenantId={tenantId}
                                    onClose={() => setSelectedPartner(null)}
                                />
                            )}
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
                            className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-slate-800 max-h-[95vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                             <div className="bg-primary-600 px-6 md:px-8 py-4 text-white relative overflow-hidden flex-shrink-0">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="p-2 bg-white/10 rounded-xl border border-white/20 backdrop-blur-md">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <button onClick={() => setIsOnboardModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-black tracking-tight"><TranslatedText text="Add User" /></h3>
                                    <p className="text-white/60 text-[11px] font-medium mt-0.5"><TranslatedText text="Create a new partner account in your network." /></p>
                                </div>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            </div>

                            <div className="overflow-y-auto flex-1 custom-scrollbar rounded-t-[24px] -mt-3 bg-white dark:bg-slate-900 relative z-20">
                                <form onSubmit={handleOnboardSubmit} className="p-6 md:p-10 space-y-6 md:space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="First Name" /></label>
                                            <input
                                                required
                                                type="text"
                                                value={onboardForm.firstName}
                                                onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })}
                                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 rounded-[20px] font-bold text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-primary-600 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all shadow-inner text-slate-900 dark:text-slate-100"
                                                placeholder={tSync("Enter first name")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Last Name" /></label>
                                            <input
                                                required
                                                type="text"
                                                value={onboardForm.lastName}
                                                onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })}
                                                className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 rounded-[20px] font-bold text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-primary-600 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all shadow-inner text-slate-900 dark:text-slate-100"
                                                placeholder={tSync("Enter last name")}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Email Address" /></label>
                                        <div className="relative">
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 dark:text-slate-600" />
                                            <input
                                                required
                                                type="email"
                                                value={onboardForm.email}
                                                onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
                                                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-transparent dark:border-slate-800 rounded-[20px] font-bold text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-primary-600 focus:ring-4 focus:ring-primary-500/5 outline-none transition-all shadow-inner text-slate-900 dark:text-slate-100"
                                                placeholder="user@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1"><TranslatedText text="Account Role" /></label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                                            {[
                                                { id: 'TRUCK_OWNER', label: 'Truck Owner', icon: Truck },
                                                { id: 'FLEET_MANAGER', label: 'Fleet Manager', icon: Users },
                                                { id: 'CARGO_OWNER', label: 'Cargo Owner', icon: Box },
                                                { id: 'BROKER', label: 'Broker', icon: Gavel },
                                                { id: 'DRIVER', label: 'Driver', icon: Navigation },
                                                { id: 'LENDER', label: 'Lender', icon: DollarSign }
                                            ].map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setOnboardForm({ ...onboardForm, role: role.id })}
                                                    className={`p-6 md:p-8 rounded-[30px] border-2 transition-all flex flex-col items-center gap-4 ${onboardForm.role === role.id 
                                                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/20' 
                                                        : 'border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-inner dark:shadow-none hover:shadow-none'
                                                        }`}
                                                >
                                                    <role.icon className={`w-6 h-6 md:w-8 md:h-8 ${onboardForm.role === role.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest text-center ${onboardForm.role === role.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-600'}`}><TranslatedText text={role.label} /></span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={onboardMutation.isPending}
                                        className="w-full py-6 bg-primary-600 hover:bg-primary-700 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-100 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {onboardMutation.isPending ? tSync('Saving...') : tSync('Create Account')}
                                        <ArrowRight className="w-5 h-5" />
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
