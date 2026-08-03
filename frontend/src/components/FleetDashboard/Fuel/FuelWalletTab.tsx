import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { DollarSign, Plus } from 'lucide-react';
import { AddToWalletModal } from './AddToWalletModal';
import { StandardDataTable, StatusBadge, type Column } from '../../EnliteUI/Tables';

export const FuelWalletTab: React.FC = () => {
    const [wallet, setWallet] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        setLoading(true);

        // Load my-wallet
        try {
            const response = await fuelApi.getMyWallet();
            console.log('🔍 getMyWallet response:', response);

            if (response && response.id) {
                setWallet(response);

                try {
                    const txs = await fuelApi.getWalletTransactions(response.id);
                    setTransactions(txs.transactions || []);
                } catch (txErr: any) {
                    console.error('Failed to load transactions', txErr.message);
                }
            } else {
                console.warn('⚠️ Wallet response has no ID:', response);
            }
        } catch (error: any) {
            console.error('❌ Failed to load wallet:', error.response?.data || error.message);
        }

        setLoading(false);
    };

    const handleAddSuccess = () => {
        loadWalletData();
        setShowAddModal(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <svg className="animate-spin h-12 w-12 text-primary-500 dark:text-blue-400 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* Header with Add to Wallet Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2.5 px-6 py-4 bg-primary-500 dark:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-primary-600 dark:hover:bg-blue-700 active:scale-95 transition-all group shadow-lg shadow-blue-500/10"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    Add to Wallet
                </button>
            </div>

            {/* Wallet Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 transition-colors group hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Balance</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">${wallet ? Number(wallet.balance).toFixed(0) : '0'}</p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 transition-colors group hover:border-emerald-100 dark:hover:border-emerald-900 transition-all">
                    <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2">Credits</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 transition-colors">${wallet ? Number(wallet.totalCredits).toFixed(0) : '0'}</p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 transition-colors group hover:border-rose-100 dark:hover:border-rose-900 transition-all">
                    <p className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-2">Spent</p>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-500 transition-colors">${wallet ? Number(wallet.totalDebits).toFixed(0) : '0'}</p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 transition-colors group hover:border-blue-100 dark:hover:border-blue-900 transition-all">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Status</p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 transition-colors font-black">{wallet?.status || 'NEW'}</p>
                </div>
            </div>

            {/* Transaction History */}
            <StandardDataTable
                title="Transaction History"
                icon={<DollarSign className="w-5 h-5" />}
                headerColor="primary"
                columns={[
                    {
                        key: 'createdAt',
                        label: 'Date',
                        sortable: true,
                        render: (v: string) => (
                            <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                                {new Date(v).toLocaleDateString()}
                            </span>
                        ),
                    },
                    {
                        key: 'type',
                        label: 'Type',
                        sortable: true,
                        render: (type: string) => (
                            <StatusBadge
                                label={type}
                                variant={type === 'CREDIT' ? 'success' : 'error'}
                            />
                        ),
                    },
                    {
                        key: 'amount',
                        label: 'Amount',
                        sortable: true,
                        render: (amount: number) => (
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                ${Number(amount).toFixed(2)}
                            </span>
                        ),
                    },
                    {
                        key: 'metadata',
                        label: 'Station',
                        render: (metadata: any) => (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                                {metadata?.petrolStation || '—'}
                            </span>
                        ),
                    },
                    {
                        key: 'description',
                        label: 'Description',
                        render: (desc: string) => (
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {desc}
                            </span>
                        ),
                    },
                ] as Column<any>[]}
                data={transactions}
                getRowId={(row) => row.id}
                searchable
                searchPlaceholder="Search transactions…"
                searchKeys={['type', 'description']}
                pagination
                pageSize={10}
                columnVisibility
                stickyHeader
                striped
                hoverable
                onRefresh={loadWalletData}
                emptyMessage="No transactions — add credit to get started"
                ariaLabel="Wallet transactions"
            />

            {/* Add to Wallet Modal */}
            <AddToWalletModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                walletId={wallet?.id}
                onSuccess={handleAddSuccess}
            />
        </div>
    );
};
