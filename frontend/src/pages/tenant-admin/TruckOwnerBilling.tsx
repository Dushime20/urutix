import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { tenantApi } from '../../services/tenantApi';
import toast from 'react-hot-toast';
import {
    FaWallet,
    FaExchangeAlt,
    FaSearch,
    FaUser,
    FaBuilding,
    FaTruck,
} from 'react-icons/fa';

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

const TruckOwnerBilling: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
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

    const transferMutation = useMutation({
        mutationFn: async ({ targetUserId, amount, reason }: { targetUserId: string; amount: number; reason: string }) => {
            const res = await api.post('/credits/tenant/transfer', { targetUserId, amount, reason });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Credits sold to truck owner successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant-credit-balance'] });
            queryClient.invalidateQueries({ queryKey: ['truck-owner-balances'] });
            setIsTransferModalOpen(false);
            setTransferAmount(10);
            setTransferReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Transfer failed');
        },
    });

    const handleTransfer = () => {
        if (!selectedUser) return;
        if (transferAmount > tenantBalance) {
            toast.error('Insufficient master balance');
            return;
        }
        transferMutation.mutate({
            targetUserId: selectedUser.userId,
            amount: transferAmount,
            reason: transferReason || 'Credit sale from Tenant Admin',
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
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FaTruck className="text-blue-600" />
                        Truck Owners & Credits
                    </h1>
                    <p className="text-gray-600 mt-1">
                        View your truck owners and sell them credits from your master balance.
                    </p>
                </div>
            </div>

            {/* Master Balance Card */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl shadow-xl p-8 text-white flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center space-x-2 text-blue-100 mb-3">
                        <FaBuilding className="text-sm opacity-80" />
                        <span className="font-bold tracking-widest uppercase text-xs">Available for Sale</span>
                    </div>
                    <div className="text-5xl font-black">{tenantBalance.toLocaleString()} <span className="text-xl font-bold opacity-60 ml-1">TRX CREDITS</span></div>
                    <div className="mt-4 flex items-center gap-2 text-blue-100/70 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Ready for allocation to truck owners
                    </div>
                </div>
                <div className="hidden md:block relative z-10">
                    <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <FaWallet className="text-4xl" />
                    </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>

            {/* Partner List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-lg font-black text-gray-800 tracking-tight">Active Truck Owners</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Registered Partners</p>
                        </div>
                        <div className="relative w-full sm:w-80">
                            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Search owners, emails or companies..."
                                className="w-full pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Scanning Network...</p>
                    </div>
                ) : filteredBalances.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-100">
                            <FaUser className="text-gray-200 text-3xl" />
                        </div>
                        <h4 className="text-lg font-black text-gray-800">No Truck Owners Found</h4>
                        <p className="text-gray-400 text-sm mt-2">There are no registered truck owners in your scope yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity Node</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Capacity</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Cell</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredBalances.map((item) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                    {item.user?.profile?.firstName?.[0]}{item.user?.profile?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {item.user?.profile?.firstName} {item.user?.profile?.lastName}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.user?.profile?.companyName || item.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-gray-800 group-hover:text-blue-600 transition-colors tabular-nums">{item.currentBalance.toLocaleString()}</span>
                                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">CR</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(item);
                                                    setIsTransferModalOpen(true);
                                                }}
                                                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 transition-all text-[10px] font-black uppercase tracking-widest"
                                            >
                                                <FaExchangeAlt />
                                                <span>Sell Credits</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsTransferModalOpen(false)} />
                    <div className="relative z-50 mx-auto max-w-md rounded-3xl bg-white p-10 shadow-2xl w-full border border-slate-100">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 rounded-2xl">
                                        <FaExchangeAlt className="text-blue-600 text-sm" />
                                    </div>
                                    Credit Sale
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction Node Initialized</p>
                            </div>
                            <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                                <FaSearch className="w-4 h-4 text-gray-300" /> {/* Placeholder for X since icons are limited */}
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Partner</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-blue-600 border border-slate-100">
                                        {selectedUser?.user?.profile?.firstName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">{selectedUser?.user?.profile?.firstName} {selectedUser?.user?.profile?.lastName}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedUser?.user?.profile?.companyName || selectedUser?.user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Sale Amount</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-xl focus:bg-white focus:border-blue-600 transition-all outline-none tabular-nums"
                                            value={transferAmount}
                                            onChange={e => setTransferAmount(Number(e.target.value))}
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">CREDITS</div>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center px-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Budget</span>
                                        <span className="text-xs font-black text-slate-900">{tenantBalance.toLocaleString()} CR</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Memo / Reference</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600 transition-all outline-none"
                                        value={transferReason}
                                        onChange={e => setTransferReason(e.target.value)}
                                        placeholder="E.g. Batch purchase #1024"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <button
                                className="w-full py-5 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
                                onClick={handleTransfer}
                                disabled={transferMutation.isPending || transferAmount <= 0}
                            >
                                {transferMutation.isPending ? 'Syncing Chain...' : 'Confirm Sale & Transfer'}
                            </button>
                            <button
                                className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                onClick={() => setIsTransferModalOpen(false)}
                            >
                                Abort Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TruckOwnerBilling;
