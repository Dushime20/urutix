import React, { useState, useEffect } from 'react';
import { fuelApi } from '../../../services/fuelApi';
import { DollarSign, Plus } from 'lucide-react';
import { AddToWalletModal } from './AddToWalletModal';

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
                    <svg className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Loading wallet...</p>
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
                    className="flex items-center gap-2.5 px-6 py-4 bg-primary-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-primary-600 active:scale-95 transition-all group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    Add to Wallet
                </button>
            </div>

            {/* Wallet Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-[20px] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Balance</p>
                    <p className="text-2xl font-black text-slate-900">${wallet ? Number(wallet.balance).toFixed(0) : '0'}</p>
                </div>
                <div className="p-6 bg-white rounded-[20px] border border-slate-100">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Credits</p>
                    <p className="text-2xl font-black text-emerald-600">${wallet ? Number(wallet.totalCredits).toFixed(0) : '0'}</p>
                </div>
                <div className="p-6 bg-white rounded-[20px] border border-slate-100">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Spent</p>
                    <p className="text-2xl font-black text-rose-600">${wallet ? Number(wallet.totalDebits).toFixed(0) : '0'}</p>
                </div>
                <div className="p-6 bg-white rounded-[20px] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                    <p className="text-2xl font-black text-primary-500">{wallet?.status || 'NEW'}</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Station</th>
                                <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(tx => (
                                <tr key={tx.id} className="border-b border-slate-50/50 hover:bg-slate-50/30 transition-colors">
                                    <td className="p-4 text-xs font-bold text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${tx.type === 'CREDIT'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-black text-slate-900">${Number(tx.amount).toFixed(2)}</td>
                                    <td className="p-4 text-xs font-bold text-slate-500">
                                        {tx.metadata?.petrolStation || '—'}
                                    </td>
                                    <td className="p-4 text-xs font-medium text-slate-400">{tx.description}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                                                <DollarSign size={28} />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No transactions</p>
                                            <p className="text-xs text-slate-400">Add credit to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
