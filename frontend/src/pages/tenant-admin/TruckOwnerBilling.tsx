import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { tenantApi } from '../../services/tenantApi';
import toast from 'react-hot-toast';
import {
  FaWallet,
  FaExchangeAlt,
  FaUser,
  FaBuilding,
  FaTruck,
  FaTimes,
  FaCheckCircle,
  FaShieldAlt
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import ModernLoader from '../../components/common/ModernLoader';

interface UserBalance {
    id: string;
    tenantId: string;
    userId: string;
    currentBalance: number;
    purchasedCredits: number;
    bonusCredits: number;
    user?: {
        id: string;
        email: string;
        phone?: string;
        status: string;
        createdAt: string;
        lastLoginAt?: string;
        profile?: {
            firstName: string;
            lastName: string;
            companyName?: string;
        };
        trucks?: any[];
        subscriptions?: Array<{
            id: string;
            status: string;
            currentPeriodEnd: string;
            plan?: {
                name: string;
                slug: string;
            }
        }>;
    }
}

const TruckOwnerBilling: React.FC = () => {
    const { tSync } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
    const [transferAmount, setTransferAmount] = useState(10);
    const [transferReason, setTransferReason] = useState('');

    // Fetch Master Balance
    const { data: balanceData } = useQuery({
        queryKey: ['tenant-credit-balance'],
        queryFn: () => tenantApi.getCreditBalance(),
    });

    // Fetch Truck Owner Balances
    const { data: partnerBalancesData, isLoading } = useQuery({
        queryKey: ['truck-owner-balances'],
        queryFn: async () => {
            // Updated to use the new role filter
            const response = await api.get('/credits/tenant/users/balances?role=TRUCK_OWNER');
            return response.data;
        },
    });

    const tenantBalance = balanceData?.currentBalance || 0;
    const partnerBalances: UserBalance[] = partnerBalancesData?.data || [];

    // Calculate statistics
    const totalTruckOwners = partnerBalances.length;
    const activeTruckOwners = partnerBalances.filter(b => b.user?.status === 'ACTIVE').length;
    const totalCreditsDistributed = partnerBalances.reduce((sum, b) => sum + b.currentBalance, 0);

    const transferMutation = useMutation({
        mutationFn: async ({ targetUserId, amount, reason }: { targetUserId: string; amount: number; reason: string }) => {
            const res = await api.post('/credits/tenant/transfer', { targetUserId, amount, reason });
            return res.data;
        },
        onSuccess: () => {
            toast.success(tSync('Credits sold to truck owner successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenant-credit-balance'] });
            queryClient.invalidateQueries({ queryKey: ['truck-owner-balances'] });
            setIsTransferModalOpen(false);
            setTransferAmount(10);
            setTransferReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || tSync('Transfer failed'));
        },
    });

    const handleTransfer = () => {
        if (!selectedUser) return;
        if (transferAmount > tenantBalance) {
            toast.error(tSync('Insufficient master balance'));
            return;
        }
        transferMutation.mutate({
            targetUserId: selectedUser.userId,
            amount: transferAmount,
            reason: transferReason || tSync('Credit sale from Tenant Admin'),
        });
    };

    const filteredBalances = partnerBalances.filter((b) => {
        const name = `${b.user?.profile?.firstName || ''} ${b.user?.profile?.lastName || ''}`.toLowerCase();
        const email = b.user?.email?.toLowerCase() || '';
        const company = b.user?.profile?.companyName?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || email.includes(search) || company.includes(search) || b.userId.includes(search);
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                        <FaTruck size={24} className="text-primary-600 dark:text-primary-400" />
                        <TranslatedText text="Truck Owners" />
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        <TranslatedText text="Manage your truck owners and easily transfer credits to their accounts." />
                    </p>
                </div>
            </div>

            {/* Master Balance Card */}
            {/* Master Balance Card — Urutix Navy Edition */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[40px] shadow-2xl p-8 text-white flex items-center justify-between relative overflow-hidden border border-white/5">                 <div className="relative z-10">
                    <div className="flex items-center gap-3 text-primary-400 dark:text-primary-300 mb-4">
                        <div className="p-2 bg-primary-500/10 rounded-lg backdrop-blur-md border border-primary-500/20">
                            <FaBuilding size={12} className="opacity-80" />
                        </div>
                        <span className="font-black tracking-[0.2em] uppercase text-[10px]"><TranslatedText text="Total Credits" /></span>
                    </div>
                    <div className="text-5xl font-black tracking-tighter flex items-baseline gap-4">
                        {tenantBalance.toLocaleString()} 
                        <span className="text-lg font-black text-primary-400/60 uppercase tracking-widest"><TranslatedText text="Credits" /></span>
                    </div>
                    <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 w-fit backdrop-blur-md">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-200"><TranslatedText text="System Status: Active" /></span>
                    </div>
                </div>

                <div className="hidden md:block relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500/20 to-transparent rounded-[28px] flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl -rotate-12 transition-transform hover:rotate-0 duration-700 group">
                        <FaWallet className="text-4xl text-primary-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                {/* Decorative High-Fidelity Glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>
            </div>

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsTransferModalOpen(false)} />
                    <div className="relative z-50 mx-auto max-w-md rounded-[40px] bg-white dark:bg-slate-900 p-12 shadow-2xl w-full border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                                    <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-[22px] border border-primary-100 dark:border-primary-800">
                                        <FaExchangeAlt className="text-primary-600 dark:text-primary-400 text-lg" />
                                    </div>
                                    <TranslatedText text="Send Credits" />
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2"><TranslatedText text="Transfer Details" /></p>
                             </div>
                        </div>

                        <div className="space-y-10">
                            <div className="p-8 bg-slate-50/80 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4"><TranslatedText text="Receiver" /></p>
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center font-black text-primary-600 dark:text-primary-400 border border-slate-100 dark:border-slate-800 text-xl italic">
                                        {selectedUser?.user?.profile?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-800 dark:text-white text-lg tracking-tight leading-none">{selectedUser?.user?.profile?.firstName} {selectedUser?.user?.profile?.lastName}</p>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{selectedUser?.user?.profile?.companyName || tSync('Private Operator')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2"><TranslatedText text="Amount to Sell" /></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-[28px] font-black text-3xl dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-primary-600 dark:focus:border-primary-500 transition-all outline-none tabular-nums shadow-inner"
                                            value={transferAmount}
                                            onChange={e => setTransferAmount(Number(e.target.value))}
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-400 dark:text-primary-500 uppercase tracking-widest"><TranslatedText text="Credits" /></div>
                                    </div>
                                    <div className="mt-5 flex justify-between items-center px-4 py-3 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl border border-primary-50 dark:border-primary-900/30">
                                        <span className="text-[9px] font-black text-primary-400 dark:text-primary-500 uppercase tracking-widest"><TranslatedText text="Your Balance" /></span>
                                        <span className="text-sm font-black text-primary-700 dark:text-primary-300 italic">{tenantBalance.toLocaleString()} <TranslatedText text="Credits" /></span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2"><TranslatedText text="Note (Optional)" /></label>
                                    <input
                                        type="text"
                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] text-xs font-black uppercase tracking-widest dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-primary-600 dark:focus:border-primary-500 transition-all outline-none shadow-inner"
                                        value={transferReason}
                                        onChange={e => setTransferReason(e.target.value)}
                                        placeholder={tSync("E.g. Payment for March")}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col gap-4">
                            <button
                                className="w-full py-6 bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-100 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                                onClick={handleTransfer}
                                disabled={transferMutation.isPending || transferAmount <= 0}
                            >
                                {transferMutation.isPending ? tSync('Processing...') : tSync('Confirm Transfer')}
                            </button>
                            <button
                                className="w-full py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
                                onClick={() => setIsTransferModalOpen(false)}
                            >
                                <TranslatedText text="Cancel" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Truck Owner Details Modal */}
            {isViewModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                     <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsViewModalOpen(false)} />
                    <div className="relative z-50 mx-auto max-w-4xl rounded-[40px] bg-white dark:bg-slate-900 p-0 shadow-2xl w-full border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {/* Header — Strategic Navy */}
                        <div className="bg-[#1e293b] p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-[28px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black text-primary-400 shadow-2xl">
                                        {selectedUser.user?.profile?.firstName?.[0]}{selectedUser.user?.profile?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-3">
                                            {selectedUser.user?.profile?.firstName} {selectedUser.user?.profile?.lastName}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black text-primary-200 uppercase tracking-widest border border-white/10">Owner ID: {selectedUser.userId.slice(0, 8)}</span>
                                            <span className="text-white/20">•</span>
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${selectedUser.user?.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                {selectedUser.user?.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setIsViewModalOpen(false)} className="p-4 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl transition-all border border-white/10 group">
                                    <FaTimes className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
                                </button>
                            </div>
                        </div>

                        <div className="p-12 max-h-[70vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                {/* Left Column: Connectivity & Identity */}
                                <div className="space-y-10">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                                                <FaShieldAlt className="text-primary-600 dark:text-primary-400 w-3 h-3" />
                                            </div>
                                            <TranslatedText text="Account Status" />
                                        </h4>
                                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-6">
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400"><TranslatedText text="Account Created" /></span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{new Date(selectedUser.user?.createdAt || '').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-t border-slate-50 dark:border-slate-800">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400"><TranslatedText text="Last Active" /></span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{selectedUser.user?.lastLoginAt ? new Date(selectedUser.user.lastLoginAt).toLocaleString() : tSync('Offline')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                                                <FaUser className="text-indigo-600 dark:text-indigo-400 w-3 h-3" />
                                            </div>
                                            <TranslatedText text="Contact Info" />
                                        </h4>
                                        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm p-8 space-y-8">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Email Address" /></span>
                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 break-all">{selectedUser.user?.email}</span>
                                            </div>
                                            <div className="flex flex-col pt-6 border-t border-slate-50 dark:border-slate-800">
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2"><TranslatedText text="Phone Number" /></span>
                                                <span className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedUser.user?.phone || tSync('Not Provided')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Financial Capacity */}
                                <div className="space-y-10">
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                                                <FaCheckCircle className="text-emerald-600 dark:text-emerald-400 w-3 h-3" />
                                            </div>
                                            <TranslatedText text="Plan Details" />
                                        </h4>
                                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-[32px] p-8 text-white shadow-xl shadow-primary-200 dark:shadow-none relative overflow-hidden group">
                                            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                                            <p className="text-[9px] font-black text-primary-200 dark:text-primary-300 uppercase tracking-[0.15em] mb-2"><TranslatedText text="Current Plan" /></p>
                                            <p className="text-3xl font-black mb-6 tracking-tight">
                                                <TranslatedText text={selectedUser.user?.subscriptions?.find(s => s.status === 'active')?.plan?.name || 'Standard Access'} />
                                            </p>
                                            <div className="flex items-center justify-between px-4 py-3 bg-black/10 rounded-xl border border-white/10">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary-100"><TranslatedText text="Renew Date" /></span>
                                                <span className="text-xs font-black">
                                                    {selectedUser.user?.subscriptions?.find(s => s.status === 'active')?.currentPeriodEnd
                                                        ? new Date(selectedUser.user.subscriptions.find(s => s.status === 'active')!.currentPeriodEnd).toLocaleDateString()
                                                        : tSync('Perpetual')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                            <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-lg">
                                                <FaTruck className="text-pink-600 dark:text-pink-400 w-3 h-3" />
                                            </div>
                                            <TranslatedText text="Fleet Info" />
                                        </h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all duration-500">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 group-hover:text-slate-500"><TranslatedText text="Trucks" /></p>
                                                <p className="text-3xl font-black tabular-nums dark:text-white">{selectedUser.user?.trucks?.length || 0}</p>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:bg-primary-600 dark:hover:bg-primary-500 hover:text-white transition-all duration-500">
                                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 group-hover:text-primary-200"><TranslatedText text="Balance" /></p>
                                                <p className="text-3xl font-black tabular-nums text-primary-600 dark:text-primary-400 group-hover:text-white">{selectedUser.currentBalance.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setIsViewModalOpen(false);
                                            setIsTransferModalOpen(true);
                                        }}
                                        className="w-full py-6 bg-slate-900 dark:bg-slate-800 text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.25em] flex items-center justify-center gap-4 hover:bg-primary-600 dark:hover:bg-primary-500 transition-all shadow-2xl shadow-slate-200 dark:shadow-none active:shadow-none"
                                    >
                                        <FaExchangeAlt size={14} />
                                        <TranslatedText text="Transfer Credits" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TruckOwnerBilling;
