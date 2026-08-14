import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Truck,
  Box,
  ArrowRight,
  Download,
  X,
  Mail,
  Phone,
  Gavel,
  Navigation,
  DollarSign,
  Unlock,
  Ban,
} from 'lucide-react';
import PartnerDetailView from './PartnerDetailView';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../contexts/AuthContext';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../EnliteUI/Tables';

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
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();

    // Always scope to the authenticated user's tenantId — never trust the prop alone
    const scopedTenantId = authUser?.tenantId ?? tenantId;

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'TRUCK_OWNER' | 'CARGO_OWNER' | 'BROKER' | 'DRIVER' | 'LENDER' | 'FLEET_MANAGER'>('ALL');
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

    // Onboarding Form State
    const [onboardForm, setOnboardForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'TRUCK_OWNER' as string,
        phone: ''
    });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['tenantUsers', scopedTenantId],
        queryFn: () => tenantApi.getTenantUsers(scopedTenantId),
        enabled: !!scopedTenantId,
    });

    const onboardMutation = useMutation({
        mutationFn: (data: typeof onboardForm) => tenantApi.createTenantUser(scopedTenantId, data),
        onSuccess: () => {
            toast.success(tSync('Partner onboarded successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenantUsers', scopedTenantId] });
            setIsOnboardModalOpen(false);
            setOnboardForm({ email: '', firstName: '', lastName: '', role: 'TRUCK_OWNER', phone: '' });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || tSync('Failed to onboard partner'));
        }
    });

    const enableUserMutation = useMutation({
        mutationFn: (userId: string) => tenantApi.updateTenantUser(userId, { status: 'ACTIVE' }),
        onSuccess: () => {
            toast.success(tSync('User enabled successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenantUsers', scopedTenantId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || tSync('Failed to enable user'));
        },
    });

    const disableUserMutation = useMutation({
        mutationFn: (userId: string) => tenantApi.updateTenantUser(userId, { status: 'DEACTIVATED' }),
        onSuccess: () => {
            toast.success(tSync('User disabled successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenantUsers', scopedTenantId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || tSync('Failed to disable user'));
        },
    });

    const roleFilteredUsers = useMemo(() => {
        return users.filter((user: Partner) => roleFilter === 'ALL' || user.role === roleFilter);
    }, [users, roleFilter]);

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

    const columns: Column<Partner>[] = useMemo(() => [
        {
            key: 'email',
            label: 'User Info',
            alwaysVisible: true,
            render: (_v, user) => (
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-[18px] flex items-center justify-center border border-primary-100 dark:border-primary-800">
                        <span className="text-primary-600 dark:text-primary-400 ui-table-body">
                            {user.profile?.firstName?.[0] || 'U'}
                        </span>
                    </div>
                    <div>
                        <p className="ui-table-body">
                            {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="ui-label mb-0 mt-1">
                            {user.id.split('-')[0]}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (_v, user) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        {getRoleIcon(user.role)}
                    </div>
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        <TranslatedText text={user.role.replace(/_/g, ' ')} />
                    </span>
                </div>
            ),
        },
        {
            key: 'phone',
            label: 'Contact',
            render: (_v, user) => (
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
            ),
        },
        {
            key: 'status',
            label: 'Status',
            render: (_v, user) => (
                <StatusBadge
                    status={user.status}
                    label={user.status === 'PENDING_VERIFICATION' ? 'PENDING' : user.status}
                />
            ),
        },
    ], []);

    const rowActions: TableAction<Partner>[] = useMemo(() => [
        {
            key: 'view',
            label: 'View',
            icon: <ArrowRight className="w-3.5 h-3.5" />,
            onClick: (user) => setSelectedPartner(user),
        },
        {
            key: 'enable',
            label: 'Enable',
            icon: <Unlock className="w-3.5 h-3.5" />,
            variant: 'success',
            // Show for disabled/suspended users; never for self or other tenant admins
            hidden: (user) =>
                user.id === authUser?.id ||
                (user as any).role === 'TENANT_ADMIN' ||
                (user.status !== 'SUSPENDED' && user.status !== 'DEACTIVATED'),
            onClick: (user) => {
                if (!window.confirm(tSync('Enable this user account?'))) return;
                enableUserMutation.mutate(user.id);
            },
        },
        {
            key: 'disable',
            label: 'Disable',
            icon: <Ban className="w-3.5 h-3.5" />,
            variant: 'warning',
            // Hide for already disabled/suspended users, self, and tenant admins
            hidden: (user) =>
                user.id === authUser?.id ||
                (user as any).role === 'TENANT_ADMIN' ||
                user.status === 'SUSPENDED' ||
                user.status === 'DEACTIVATED',
            onClick: (user) => {
                if (!window.confirm(tSync('Disable this user account? They will no longer be able to sign in.'))) return;
                disableUserMutation.mutate(user.id);
            },
        },
    ], [authUser?.id, enableUserMutation, disableUserMutation, tSync]);

    const handleOnboardSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onboardMutation.mutate(onboardForm);
    };

    return (
        <div className="space-y-8 pb-20 w-full max-w-full overflow-x-hidden">

            {/* User Directory Header */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 md:px-10 py-6 md:py-10 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="text-center sm:text-left">
                        <h3 className="ui-label mb-1"><TranslatedText text="Users" /></h3>
                        <h4 className="ui-page-title"><TranslatedText text="User List" /></h4>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-center sm:justify-end">
                        <button className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[20px] text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsOnboardModalOpen(true)}
                            className="flex-1 sm:flex-none justify-center bg-primary-600 text-white px-8 md:px-10 py-4 rounded-[20px] hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 dark:shadow-none flex items-center ui-button"
                        >
                            <UserPlus className="w-4 h-4 mr-3" />
                            <TranslatedText text="Add User" />
                        </button>
                    </div>
                </div>

                <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row gap-4 md:gap-6 bg-slate-50/20 dark:bg-slate-800/10">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 lg:pb-0 w-full">
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

                <div className="px-4 md:px-6 py-4">
                    <StandardDataTable
                        embedded
                        columns={columns}
                        data={roleFilteredUsers}
                        loading={isLoading}
                        getRowId={(row) => row.id}
                        searchPlaceholder={tSync('Search by name, email, or ID...')}
                        searchKeys={['email', 'phone', 'status', 'role']}
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        rowActions={rowActions}
                        onRowClick={(user) => setSelectedPartner(user)}
                        emptyMessage={tSync('No Users Found')}
                        ariaLabel="Tenant users"
                    />
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
                            {selectedPartner && (
                                <PartnerDetailView
                                    partner={selectedPartner as any}
                                    tenantId={scopedTenantId}
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
                             <div className="bg-primary-600 px-6 py-3 text-white relative overflow-hidden flex-shrink-0">
                                <div className="relative z-10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-1.5 bg-white/10 rounded-lg border border-white/20 shrink-0">
                                            <UserPlus className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black tracking-tight leading-none"><TranslatedText text="Add User" /></h3>
                                            <p className="text-white/60 text-[10px] font-medium mt-0.5 truncate"><TranslatedText text="Create a new partner account in your network." /></p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsOnboardModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 custom-scrollbar bg-white dark:bg-slate-900 relative z-20">
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
