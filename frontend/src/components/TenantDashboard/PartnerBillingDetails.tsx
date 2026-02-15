import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2,
    X,
    Search,
    Filter,
    Zap,
    Wallet,
    MoreHorizontal,
    Download,
    Eye,
    Shield,
    Plus,
    Minus,
    History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface PartnerBillingDetailsProps {
    tenantId: string;
    userId: string;
    userName: string;
    onClose: () => void;
    embedded?: boolean;
}

export const PartnerBillingDetails: React.FC<PartnerBillingDetailsProps> = ({
    tenantId,
    userId,
    userName,
    onClose,
    embedded = false,
}) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'overview' | 'credits' | 'history'>('overview');
    const [adjustAmount, setAdjustAmount] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

    // Enlite Prime Theme Colors
    const colors = {
        primary: '#3F51B5', // Indigo
        primaryLight: '#E8EAF6',
        secondary: '#F50057', // Pink
        secondaryLight: '#FCE4EC',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
        success: '#4CAF50',
        successLight: '#E8F5E9',
        error: '#F44336',
        errorLight: '#FFEBEE',
        warning: '#FF9800',
        warningLight: '#FFF3E0',
        info: '#2196F3',
        infoLight: '#E3F2FD'
    };

    // Fetch billing summary
    const { data: summary, isLoading: isSummaryLoading } = useQuery({
        queryKey: ['partner-billing', tenantId, userId],
        queryFn: () => tenantApi.getPartnerBillingSummary(tenantId, userId),
    });

    // Credit History
    const { data: history } = useQuery({
        queryKey: ['partner-credits-history', tenantId, userId],
        queryFn: () => tenantApi.getPartnerCreditHistory(tenantId, userId),
    });

    // Available Plans
    const { data: plansData } = useQuery({
        queryKey: ['subscription-plans'],
        queryFn: () => tenantApi.getSubscriptionPlans(),
    });

    // Adjust Credits Mutation
    const adjustCreditsMutation = useMutation({
        mutationFn: (data: { amount: number; reason: string; adminId: string }) =>
            tenantApi.adjustPartnerCredits(tenantId, userId, data),
        onSuccess: () => {
            toast.success('Credits adjusted successfully');
            queryClient.invalidateQueries({ queryKey: ['partner-billing', tenantId, userId] });
            queryClient.invalidateQueries({ queryKey: ['partner-credits-history', tenantId, userId] });
            setAdjustAmount(0);
            setAdjustReason('');
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Failed to adjust credits');
        },
    });

    // Update Subscription Mutation
    const updateSubscriptionMutation = useMutation({
        mutationFn: (data: { planId: string; billingCycle: string }) =>
            tenantApi.updatePartnerSubscription(tenantId, userId, data),
        onSuccess: () => {
            toast.success('Subscription updated successfully');
            queryClient.invalidateQueries({ queryKey: ['partner-billing', tenantId, userId] });
            setIsPlanModalOpen(false);
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Failed to update subscription');
        },
    });

    const handleAdjustCredits = (type: 'add' | 'remove') => {
        if (adjustAmount <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }
        if (!adjustReason) {
            toast.error('Please provide a reason');
            return;
        }

        adjustCreditsMutation.mutate({
            amount: type === 'add' ? adjustAmount : -adjustAmount,
            reason: adjustReason,
            adminId: 'system',
        });
    };

    const handleUpdatePlan = (planId: string, billingCycle: string) => {
        updateSubscriptionMutation.mutate({ planId, billingCycle });
    };

    if (isSummaryLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50/50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Loading billing data...</p>
                </div>
            </div>
        );
    }

    const billingData = summary?.data || {};
    const balance = billingData.balance || {};
    const subscription = billingData.subscription || null;
    const historyItems = history?.data?.items || [];

    const filteredHistory = historyItems.filter((tx: { description: string; amount: number }) =>
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.amount.toString().includes(searchQuery)
    );

    const getStatusChip = (status: string) => {
        const theme = status.toLowerCase() === 'active' || status.toLowerCase() === 'paid'
            ? { bg: colors.successLight, text: colors.success }
            : status.toLowerCase() === 'pending'
                ? { bg: colors.warningLight, text: colors.warning }
                : { bg: colors.errorLight, text: colors.error };

        return (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: theme.bg, color: theme.text }}>
                {status}
            </span>
        );
    };

    return (
        <div className={`${embedded ? '' : 'bg-[#F9FAFB] rounded-[24px] shadow-2xl border border-slate-200 h-full max-h-[95vh]'} overflow-hidden flex flex-col text-[#1F2937] antialiased`}>
            {/* Minimal Header */}
            {!embedded && (
                <div className="px-6 md:px-10 py-6 md:py-8 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Partner Billing</h2>
                        <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                            Review and manage billing for <span className="text-indigo-600 font-semibold">{userName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-95"
                        >
                            <X className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sub-Header with Balance Indicator */}
            <div className="px-6 md:px-10 py-2 md:py-4 bg-white border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-4 md:gap-8 overflow-x-auto w-full md:w-auto no-scrollbar">
                    {(['overview', 'credits', 'history'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 text-xs md:text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100/50 w-full md:w-auto justify-between md:justify-start">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Available Balance</span>
                    <span className="text-base md:text-lg font-black text-indigo-700 tabular-nums">{(balance.currentBalance || 0).toLocaleString()} <span className="text-xs font-bold text-indigo-400 ml-0.5">CR</span></span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar overflow-x-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            {/* Main Info Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Credit Overview Card */}
                                <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between overflow-hidden relative group">
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6 md:mb-10">
                                            <div>
                                                <h3 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Account Summary</h3>
                                                <p className="text-2xl md:text-4xl font-black text-slate-900">{(balance.currentBalance || 0).toLocaleString()} <span className="text-sm md:text-lg text-slate-400 font-bold ml-1">Credits</span></p>
                                            </div>
                                            <div className="p-3 md:p-4 bg-indigo-50 rounded-[18px]">
                                                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 pt-6 md:pt-8 border-t border-slate-50">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription</p>
                                                <p className="text-xl md:text-2xl font-black text-slate-800 tabular-nums">{balance.subscriptionCredits || 0}</p>
                                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (balance.subscriptionCredits / balance.currentBalance) * 100 || 0)}%` }}
                                                        className="h-full bg-indigo-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purchased</p>
                                                <p className="text-xl md:text-2xl font-black text-slate-800 tabular-nums">{balance.purchasedCredits || 0}</p>
                                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (balance.purchasedCredits / balance.currentBalance) * 100 || 0)}%` }}
                                                        className="h-full bg-emerald-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bonus</p>
                                                <p className="text-xl md:text-2xl font-black text-slate-800 tabular-nums">{balance.bonusCredits || 0}</p>
                                                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(100, (balance.bonusCredits / balance.currentBalance) * 100 || 0)}%` }}
                                                        className="h-full bg-amber-500 rounded-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-50/50 transition-colors duration-700"></div>
                                </div>

                                {/* Plan Summary Card */}
                                <div className="lg:col-span-4 bg-white p-6 md:p-10 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 md:p-4 bg-emerald-50 rounded-[18px]">
                                                <Shield className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
                                            </div>
                                            {getStatusChip(subscription?.status || 'Inactive')}
                                        </div>
                                        <div>
                                            <h3 className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Service Tier</h3>
                                            <p className="text-xl md:text-2xl font-black text-slate-800">{subscription ? subscription.plan?.name : 'Free Tier'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsPlanModalOpen(true)}
                                        className="mt-6 md:mt-10 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[16px] text-sm font-bold transition-all shadow-lg shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        Manage Subscription
                                    </button>
                                </div>
                            </div>

                            {/* Details Table Card */}
                            <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                                <div className="px-6 md:px-10 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] md:text-sm font-black text-slate-900 uppercase tracking-wider">Billing Specifics</h3>
                                    <button className="text-[10px] md:text-xs font-bold text-indigo-600 hover:underline">Download PDF</button>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-slate-100">
                                    {[
                                        { label: 'Renewal Date', value: subscription?.currentPeriodEnd ? format(new Date(subscription.currentPeriodEnd), 'MMM dd, yyyy') : '--' },
                                        { label: 'Billing Cycle', value: subscription?.billingCycle || 'N/A' },
                                        { label: 'Next Payment', value: subscription?.nextPaymentDate ? format(new Date(subscription.nextPaymentDate), 'MMM dd') : '--' },
                                        { label: 'Auto-Renew', value: subscription?.autoRenew ? 'Active' : 'Disabled' }
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 md:p-8">
                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{item.label}</p>
                                            <p className="text-sm md:text-lg font-bold text-slate-800 capitalize leading-tight">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'credits' && (
                        <motion.div
                            key="credits"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-xl mx-auto py-10"
                        >
                            <div className="bg-white p-6 md:p-12 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-100">
                                <div className="text-center mb-8 md:mb-10">
                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-50 rounded-[22px] flex items-center justify-center mx-auto mb-6">
                                        <Zap className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Adjust Credits</h3>
                                    <p className="text-sm text-slate-500 font-medium">Add or remove credits from this partner's account.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Credit Amount</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={adjustAmount || ''}
                                                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                                                className="w-full px-5 md:px-6 py-3.5 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-base md:text-lg focus:bg-white focus:border-indigo-600 transition-all outline-none"
                                                placeholder="0"
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400">CREDITS</div>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Reason / Reference</label>
                                        <input
                                            type="text"
                                            value={adjustReason}
                                            onChange={(e) => setAdjustReason(e.target.value)}
                                            className="w-full px-5 md:px-6 py-3.5 md:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-sm focus:bg-white focus:border-indigo-600 transition-all outline-none"
                                            placeholder="e.g. Service extension bonus"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                        <button
                                            onClick={() => handleAdjustCredits('add')}
                                            disabled={adjustCreditsMutation.isPending}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" /> Grant
                                        </button>
                                        <button
                                            onClick={() => handleAdjustCredits('remove')}
                                            disabled={adjustCreditsMutation.isPending}
                                            className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                        >
                                            <Minus className="w-4 h-4" /> Deduct
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Toolbar */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by description or amount..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-6 py-3.5 bg-white border border-slate-200 rounded-[14px] text-sm font-medium focus:border-indigo-600 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-5 py-3.5 bg-white border border-slate-200 rounded-[14px] flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Filter className="w-4 h-4" /> Filter
                                    </button>
                                    <button className="p-3.5 bg-white border border-slate-200 rounded-[14px] text-slate-600 hover:bg-slate-50">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Table-style Layout */}
                            <div className="bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 border-b border-slate-100">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredHistory.length > 0 ? (
                                            filteredHistory.map((tx: { id: string; amount: number; description: string; createdAt: string; type: string }) => (
                                                <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2.5 rounded-lg ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                {tx.amount > 0 ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-900">{tx.description}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{format(new Date(tx.createdAt), 'MMM dd, yyyy · HH:mm')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-black uppercase tracking-widest">
                                                            {tx.type.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <p className={`text-base font-black tabular-nums ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-100">
                                                        <HistoryIcon className="w-8 h-8 text-slate-200" />
                                                    </div>
                                                    <h4 className="text-lg font-bold text-slate-900">No transactions found</h4>
                                                    <p className="text-sm text-slate-400">History items will appear here after the first transaction.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Plan Management Modal - Refined */}
            <AnimatePresence>
                {isPlanModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 md:p-20"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-full"
                        >
                            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Modify Service Tier</h3>
                                    <p className="text-sm text-slate-500 font-medium">Select a plan to update features and credit allocations.</p>
                                </div>
                                <button
                                    onClick={() => setIsPlanModalOpen(false)}
                                    className="p-3 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {plansData?.data?.map((plan: { id: string; name: string; description: string; includedCredits: number; features: Record<string, boolean>; priceMonthly: number }) => (
                                    <div
                                        key={plan.id}
                                        className={`relative p-8 rounded-[24px] border-2 transition-all flex flex-col justify-between group ${subscription?.planId === plan.id
                                            ? 'border-indigo-600 bg-indigo-50/20'
                                            : 'border-slate-100 hover:border-slate-200'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                                                {subscription?.planId === plan.id && (
                                                    <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed line-clamp-2">{plan.description}</p>

                                            <div className="space-y-4 mb-10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                                                        <Plus className="w-3 h-3 text-indigo-600" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{(plan.includedCredits || 0).toLocaleString()} Base Credits</span>
                                                </div>
                                                {(Object.entries(plan.features || {}) as [string, boolean][]).map(([key, value]) => (
                                                    value && (
                                                        <div key={key} className="flex items-center gap-3">
                                                            <div className="w-6 h-6 bg-indigo-50 rounded-full flex items-center justify-center">
                                                                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100">
                                            <div className="flex items-baseline gap-1 mb-6">
                                                <span className="text-3xl font-black text-slate-900">${plan.priceMonthly}</span>
                                                <span className="text-xs font-bold text-slate-400">/mo</span>
                                            </div>
                                            <button
                                                disabled={subscription?.planId === plan.id || updateSubscriptionMutation.isPending}
                                                onClick={() => handleUpdatePlan(plan.id, 'monthly')}
                                                className={`w-full py-4 rounded-[16px] font-black text-sm transition-all ${subscription?.planId === plan.id
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                                                    }`}
                                            >
                                                {subscription?.planId === plan.id ? 'Current Plan' : 'Activate Plan'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94A3B8;
                }
            `}</style>
        </div>
    );
};
