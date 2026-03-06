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

const PartnerBillingManager: React.FC = () => {
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

    const transferMutation = useMutation({
        mutationFn: async ({ targetUserId, amount, reason }: { targetUserId: string; amount: number; reason: string }) => {
            const res = await api.post('/credits/tenant/transfer', { targetUserId, amount, reason });
            return res.data;
        },
        onSuccess: () => {
            toast.success('Credits transferred successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant-credit-balance'] });
            queryClient.invalidateQueries({ queryKey: ['partner-balances'] });
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
            reason: transferReason || 'Credit allocation from Tenant',
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
                    <h1 className="text-2xl font-bold text-gray-900">Partner Billing</h1>
                    <p className="text-gray-600 mt-1">
                        Manage your master credit balance and allocate credits to your fleet partners.
                    </p>
                </div>
            </div>

            {/* Master Balance Card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white flex items-center justify-between">
                <div>
                    <div className="flex items-center space-x-2 text-blue-100 mb-2">
                        <FaBuilding />
                        <span className="font-medium tracking-wider uppercase text-sm">Tenant Master Balance</span>
                    </div>
                    <div className="text-4xl font-extrabold">{tenantBalance.toLocaleString()} <span className="text-lg font-medium opacity-80">Credits</span></div>
                </div>
                <div className="hidden md:block">
                    <FaWallet className="text-6xl opacity-20" />
                </div>
            </div>

            {/* Partner List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-gray-800">Partner Accounts</h2>
                        <div className="relative w-full sm:w-64">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by User ID..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading partners...</div>
                ) : filteredBalances.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaUser className="text-gray-400 text-2xl" />
                        </div>
                        <p>No partner accounts found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Balance</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredBalances.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {item.user?.profile?.firstName?.[0]}{item.user?.profile?.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">
                                                        {item.user?.profile?.firstName} {item.user?.profile?.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{item.user?.profile?.companyName || item.user?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800">{item.currentBalance.toLocaleString()}</span>
                                            <span className="text-gray-500 text-xs ml-1">credits</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(item);
                                                    setIsTransferModalOpen(true);
                                                }}
                                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md transition-colors text-sm font-medium"
                                            >
                                                <FaExchangeAlt className="text-xs" />
                                                <span>Allocate</span>
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
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => setIsTransferModalOpen(false)} />
                    <div className="relative z-50 mx-auto max-w-sm rounded-xl bg-white p-6 shadow-2xl w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FaExchangeAlt className="text-blue-500" />
                            Allocate Credits
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm">
                                Allocating to partner:<br />
                                <span className="font-bold">{selectedUser?.user?.profile?.firstName} {selectedUser?.user?.profile?.lastName}</span>
                                <div className="text-xs opacity-70">{selectedUser?.user?.profile?.companyName || selectedUser?.user?.email}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    value={transferAmount}
                                    onChange={e => setTransferAmount(Number(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-1">Tenant Balance: {tenantBalance}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    value={transferReason}
                                    onChange={e => setTransferReason(e.target.value)}
                                    placeholder="E.g. Monthly allocation limit"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                                onClick={() => setIsTransferModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md font-medium disabled:opacity-50"
                                onClick={handleTransfer}
                                disabled={transferMutation.isPending || transferAmount <= 0}
                            >
                                {transferMutation.isPending ? 'Processing...' : 'Allocate Credits'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerBillingManager;
