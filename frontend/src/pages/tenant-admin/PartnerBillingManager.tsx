import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    FaWallet,
    FaExchangeAlt,
    FaSearch,
    FaUser,
    FaBuilding,
    FaHistory,
    FaArrowRight,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedText } from '../../components/translated-text';
import { useTranslation } from '../../hooks/useTranslation';
import { StatCard } from '../../components/EnliteUI/Cards/StatCard';

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
        profile?: {
            firstName: string;
            lastName: string;
            companyName?: string;
        }
    }
}

const PartnerBillingManager: React.FC = () => {
    const { tSync } = useTranslation();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserBalance | null>(null);
    const [transferAmount, setTransferAmount] = useState(10);
    const [transferReason, setTransferReason] = useState('');

    // Fetch Master Balance
    const { data: tenantBalanceData } = useQuery({
        queryKey: ['tenant-credit-balance'],
        queryFn: async () => {
            const response = await api.get('/credits/balance');
            return response.data;
        },
    });

    // Fetch Partner Balances
    const { data: partnerBalancesData, isLoading } = useQuery({
        queryKey: ['partner-balances'],
        queryFn: async () => {
            const response = await api.get('/credits/tenant/users/balances');
            return response.data;
        },
    });

    const tenantBalance = tenantBalanceData?.data?.currentBalance || 0;
    const partnerBalances: UserBalance[] = partnerBalancesData?.data || [];

    // Calculate statistics
    const totalPartners = partnerBalances.length;
    const totalCreditsHeldByPartners = partnerBalances.reduce((sum, b) => sum + b.currentBalance, 0);

    const transferMutation = useMutation({
        mutationFn: async ({ targetUserId, amount, reason }: { targetUserId: string; amount: number; reason: string }) => {
            const res = await api.post('/credits/tenant/transfer', { targetUserId, amount, reason });
            return res.data;
        },
        onSuccess: () => {
            toast.success(tSync('Credits transferred successfully'));
            queryClient.invalidateQueries({ queryKey: ['tenant-credit-balance'] });
            queryClient.invalidateQueries({ queryKey: ['partner-balances'] });
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
            reason: transferReason || tSync('Credit allocation from Tenant'),
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
        <div className="space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 rounded-[32px] shadow-sm p-8 border border-slate-100 dark:border-slate-800">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                        <FaWallet size={24} className="text-primary-600 dark:text-primary-400" />
                        <TranslatedText text="Partner Billing" />
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                        <TranslatedText text="Manage your master credit balance and efficiently allocate resources to your network partners." />
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800/50">
                        <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-primary-600 dark:bg-primary-400 rounded-full animate-pulse"></div>
                             <TranslatedText text="System Active" />
                        </span>
                    </div>
                </div>
            </div>

            {/* Master Balance Card — Premium Edition */}
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-[40px] shadow-2xl p-10 text-white flex flex-col md:flex-row items-center justify-between relative overflow-hidden border border-white/5">
                <div className="relative z-10 w-full md:w-auto">
                    <div className="flex items-center gap-3 text-primary-400 mb-4">
                        <div className="p-2.5 bg-primary-500/10 rounded-xl backdrop-blur-md border border-white/10">
                            <FaBuilding size={14} className="opacity-80" />
                        </div>
                        <span className="font-black tracking-[0.2em] uppercase text-[10px]"><TranslatedText text="Tenant Master Balance" /></span>
                    </div>
                    <div className="text-6xl font-black tracking-tighter flex items-baseline gap-4 mb-4">
                        {tenantBalance.toLocaleString()} 
                        <span className="text-xl font-black text-primary-400/60 uppercase tracking-widest"><TranslatedText text="Credits" /></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 italic">
                        <TranslatedText text="Available for allocation to any fleet partner or truck owner." />
                    </div>
                </div>

                <div className="hidden lg:block relative z-10">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-500/20 to-transparent rounded-[32px] flex items-center justify-center backdrop-blur-md border border-white/10 shadow-3xl -rotate-12 transition-transform hover:rotate-0 duration-700 group">
                        <FaWallet className="text-5xl text-primary-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600/10 rounded-full -mr-48 -mt-48 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none"></div>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title={<TranslatedText text="Total Partners" />}
                    value={totalPartners}
                    icon={<FaUser size={20} />}
                    color="primary"
                    variant="premium"
                />
                <StatCard
                    title={<TranslatedText text="Distributed Credits" />}
                    value={totalCreditsHeldByPartners.toLocaleString()}
                    icon={<FaExchangeAlt size={20} />}
                    color="success"
                    variant="premium"
                />
                <StatCard
                    title={<TranslatedText text="Pending Allocations" />}
                    value="0"
                    icon={<FaHistory size={20} />}
                    color="warning"
                    variant="premium"
                />
            </div>

            {/* Partner List Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-10 py-10 border-b border-gray-50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1 italic"><TranslatedText text="Financial Oversight" /></h2>
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Partner Accounts" /></h3>
                    </div>
                    <div className="relative w-full md:w-96 group">
                        <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder={tSync("Search by name, email, or company...")}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-[24px] focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-sm font-medium shadow-sm dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-32 text-center">
                        <div className="w-16 h-16 border-4 border-primary-50 dark:border-primary-900/20 border-t-primary-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]"><TranslatedText text="Retrieving Accounts" />...</p>
                    </div>
                ) : filteredBalances.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-100 dark:border-slate-800">
                            <FaSearch className="text-slate-200 dark:text-slate-700 text-3xl" />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 dark:text-white"><TranslatedText text="No Partners Found" /></h4>
                        <p className="text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium italic max-w-xs mx-auto"><TranslatedText text="We couldn't find any partner accounts matching your current search parameters." /></p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Partner Identity" /></th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Financial Health" /></th>
                                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Account Type" /></th>
                                    <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Operations" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredBalances.map((item) => (
                                    <tr key={item.id} className="hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center space-x-6">
                                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 text-lg shadow-sm">
                                                    {item.user?.profile?.firstName?.[0]}{item.user?.profile?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors tracking-tight text-lg">
                                                        {item.user?.profile?.firstName} {item.user?.profile?.lastName}
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                                                        {item.user?.profile?.companyName || item.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-baseline gap-2 px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-900 group-hover:border-primary-100 transition-all w-fit tabular-nums">
                                                <span className="text-2xl font-black text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{item.currentBalance.toLocaleString()}</span>
                                                <span className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest"><TranslatedText text="Credits" /></span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]"><TranslatedText text="Partner Account" /></span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(item);
                                                    setIsTransferModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white hover:bg-primary-600 dark:hover:bg-primary-500 rounded-[22px] shadow-xl shadow-slate-100 dark:shadow-none transition-all text-[10px] font-black uppercase tracking-[0.2em] group/btn hover:-translate-y-0.5"
                                            >
                                                <FaExchangeAlt size={12} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                                <span><TranslatedText text="Allocate" /></span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Allocation Modal */}
            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" 
                            aria-hidden="true" 
                            onClick={() => setIsTransferModalOpen(false)} 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative z-50 mx-auto max-w-md rounded-[40px] bg-white dark:bg-slate-900 p-12 shadow-3xl w-full border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-4">
                                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-[22px] border border-primary-100 dark:border-primary-800">
                                            <FaExchangeAlt className="text-primary-600 dark:text-primary-400 text-lg" />
                                        </div>
                                        <TranslatedText text="Allocate" />
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2"><TranslatedText text="Credit Distribution" /></p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div className="p-8 bg-slate-50/80 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4"><TranslatedText text="Recipient Partner" /></p>
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center font-black text-primary-600 dark:text-primary-400 border border-slate-100 dark:border-slate-800 text-xl italic group-hover:scale-110 transition-transform">
                                            {selectedUser?.user?.profile?.firstName?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white text-lg tracking-tight leading-none">{selectedUser?.user?.profile?.firstName} {selectedUser?.user?.profile?.lastName}</p>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">{selectedUser?.user?.profile?.companyName || tSync('Strategic Partner')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2"><TranslatedText text="Allocation Amount" /></label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full px-8 py-7 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[28px] font-black text-4xl dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-primary-600 dark:focus:border-primary-500 transition-all outline-none tabular-nums shadow-inner"
                                                value={transferAmount}
                                                onChange={e => setTransferAmount(Number(e.target.value))}
                                            />
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary-400 dark:text-primary-500 uppercase tracking-widest"><TranslatedText text="Credits" /></div>
                                        </div>
                                        <div className="mt-5 flex justify-between items-center px-5 py-4 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl border border-primary-50 dark:border-primary-900/20">
                                            <span className="text-[9px] font-black text-primary-400 dark:text-primary-500 uppercase tracking-widest"><TranslatedText text="Your Capacity" /></span>
                                            <span className="text-sm font-black text-primary-700 dark:text-primary-300 italic">{tenantBalance.toLocaleString()} <TranslatedText text="Credits" /></span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 ml-2"><TranslatedText text="Reference (Optional)" /></label>
                                        <input
                                            type="text"
                                            className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[24px] text-xs font-black uppercase tracking-widest dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-primary-600 dark:focus:border-primary-500 transition-all outline-none shadow-inner"
                                            value={transferReason}
                                            onChange={e => setTransferReason(e.target.value)}
                                            placeholder={tSync("E.g. Monthly allocation limit")}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col gap-4">
                                <button
                                    className="w-full py-6 bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary-100 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50 overflow-hidden relative group"
                                    onClick={handleTransfer}
                                    disabled={transferMutation.isPending || transferAmount <= 0}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        {transferMutation.isPending ? tSync('Allocating...') : (
                                            <>
                                                <TranslatedText text="Confirm Allocation" />
                                                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </div>
                                    {transferMutation.isPending && (
                                        <div className="absolute inset-0 bg-primary-700/50 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </button>
                                <button
                                    className="w-full py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    onClick={() => setIsTransferModalOpen(false)}
                                >
                                    <TranslatedText text="Cancel" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PartnerBillingManager;
