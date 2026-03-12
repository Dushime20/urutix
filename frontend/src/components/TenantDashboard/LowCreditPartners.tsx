import React, { useState } from 'react';
import {
    AlertTriangle, User, ArrowRight,
    TrendingDown, RefreshCw, Send,
    X, CreditCard, PieChart, Activity,
    Calendar, History, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LowCreditPartner {
    id: string;
    currentBalance: number;
    subscriptionCredits?: number;
    purchasedCredits?: number;
    bonusCredits?: number;
    lifetimeEarned?: number;
    lifetimeSpent?: number;
    lastRefreshDate?: string;
    nextRefreshDate?: string;
    recentTransactions?: Array<{
        id: string;
        type: string;
        amount: number;
        description: string;
        createdAt: string;
        balanceAfter: number;
    }>;
    user: {
        id: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            companyName?: string;
            avatarUrl?: string;
        };
        email?: string;
    };
}

interface LowCreditPartnersProps {
    partners: LowCreditPartner[];
    onNotifyAll?: () => void;
}

const LowCreditPartners: React.FC<LowCreditPartnersProps> = ({
    partners,
    onNotifyAll
}) => {
    const [selectedPartner, setSelectedPartner] = useState<LowCreditPartner | null>(null);
    const [activeTab, setActiveTab] = useState<'insights' | 'history'>('insights');

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    const formatCurrency = (amount: number = 0) => {
        return new Intl.NumberFormat('en-US').format(amount);
    };

    const getTransactionIcon = (type: string, amount: number) => {
        if (amount > 0) return <TrendingDown className="w-3 h-3 text-emerald-500 rotate-180" />;
        return <TrendingDown className="w-3 h-3 text-rose-500" />;
    };

    return (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            {/* Header section... */}
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">Risk Intelligence</h3>
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">Low Credit Partners</h4>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="px-3 py-1 bg-rose-50 rounded-full border border-rose-100 flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">
                            {partners.length} Critical
                        </span>
                    </div>
                    {partners.length > 0 && (
                        <button
                            onClick={onNotifyAll}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                            <Send className="w-3 h-3" />
                            <span>Broadcast Alert</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                {partners.length > 0 ? (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                        {partners.map((partner) => (
                            <motion.div
                                key={partner.id}
                                variants={item}
                                onClick={() => {
                                    setSelectedPartner(partner);
                                    setActiveTab('insights');
                                }}
                                className="bg-slate-50/50 border border-gray-100 rounded-[24px] p-5 hover:bg-white hover:shadow-md transition-all duration-300 group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-white rounded-2xl border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                                        {partner.user.profile?.avatarUrl ? (
                                            <img src={partner.user.profile.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                                        ) : (
                                            <User className="w-5 h-5 text-indigo-500" />
                                        )}
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg border flex items-center space-x-1.5 ${partner.currentBalance < 500
                                        ? 'bg-rose-50 border-rose-100 text-rose-600'
                                        : 'bg-amber-50 border-amber-100 text-amber-600'
                                        }`}>
                                        <TrendingDown className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {partner.currentBalance < 500 ? 'Critical' : 'Warning'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h5 className="text-[14px] font-black text-slate-800 truncate">
                                        {partner.user.profile?.companyName ||
                                            `${partner.user.profile?.firstName} ${partner.user.profile?.lastName}` ||
                                            'Partner'}
                                    </h5>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                        Partner ID: {partner.user.id.substring(0, 8)}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Remaining</span>
                                        <span className={`text-2xl font-black tracking-tight leading-none ${partner.currentBalance < 500 ? 'text-rose-500' : 'text-amber-500'}`}>
                                            {formatCurrency(partner.currentBalance)} <span className="text-xs">TRX</span>
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-white rounded-xl border border-gray-100 text-slate-400 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <RefreshCw className="h-8 w-8 text-emerald-400" />
                        </div>
                        <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">All Accounts Healthy</h5>
                        <p className="text-[13px] text-slate-400 mt-1 font-medium italic">No partners below the risk threshold detected.</p>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedPartner && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[40px] shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden relative"
                        >
                            {/* Modal Header */}
                            <div className="px-10 pt-8 pb-4 bg-slate-50 border-b border-gray-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                                <div className="relative flex items-center justify-between z-10 mb-6">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center shadow-sm">
                                            {selectedPartner.user.profile?.avatarUrl ? (
                                                <img src={selectedPartner.user.profile.avatarUrl} className="w-10 h-10 rounded-xl" alt="" />
                                            ) : (
                                                <User className="w-8 h-8 text-indigo-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                                {selectedPartner.user.profile?.companyName || 'Credit Intelligence'}
                                            </h3>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-black uppercase tracking-wider">Low Balance</span>
                                                <span className="text-xs font-bold text-slate-400">{selectedPartner.user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPartner(null)}
                                        className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm border border-gray-100"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Tab Navigation */}
                                <div className="flex items-center space-x-8 relative z-10">
                                    <button
                                        onClick={() => setActiveTab('insights')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'insights' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Intelligence
                                        {activeTab === 'insights' && (
                                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Transaction History
                                        {activeTab === 'history' && (
                                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="p-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {activeTab === 'insights' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Left Column: Credit Breakdown */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <PieChart className="w-4 h-4 text-indigo-500" />
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Credit Breakdown</h4>
                                            </div>

                                            <div className="bg-slate-50 rounded-[24px] p-6 space-y-4">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500">Subscription Credits</span>
                                                    <span className="text-slate-800">{formatCurrency(selectedPartner.subscriptionCredits)} TRX</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500">Purchased Credits</span>
                                                    <span className="text-slate-800">{formatCurrency(selectedPartner.purchasedCredits)} TRX</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500">Bonus & Rewards</span>
                                                    <span className="text-emerald-500">{formatCurrency(selectedPartner.bonusCredits)} TRX</span>
                                                </div>
                                                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Available</span>
                                                    <span className="text-xl font-black text-rose-500">{formatCurrency(selectedPartner.currentBalance)} TRX</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 rounded-[20px] p-4">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <CreditCard className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Earned</span>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-800 tracking-tight">
                                                        {formatCurrency(selectedPartner.lifetimeEarned)}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 rounded-[20px] p-4">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Activity className="w-3 h-3 text-rose-400" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Spent</span>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-800 tracking-tight">
                                                        {formatCurrency(selectedPartner.lifetimeSpent)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Insights & Timeline */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lifecycle Timeline</h4>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-1 bg-gray-100 self-stretch rounded-full mt-2" />
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Last Refresh</span>
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {selectedPartner.lastRefreshDate ? new Date(selectedPartner.lastRefreshDate).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-1 bg-indigo-200 self-stretch rounded-full mt-2" />
                                                    <div>
                                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Cycle Renew Date</span>
                                                        <span className="text-sm font-bold text-slate-700">
                                                            {selectedPartner.nextRefreshDate ? new Date(selectedPartner.nextRefreshDate).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-indigo-50 rounded-[24px] border border-indigo-100">
                                                <h5 className="text-[12px] font-black text-indigo-900 uppercase tracking-tight mb-2">Intelligence Recommendation</h5>
                                                <p className="text-[13px] text-indigo-700 font-medium leading-relaxed">
                                                    This partner has spent over <strong>85%</strong> of their lifetime credits. We recommend suggesting a <strong>Starter Pro</strong> top-up bundle before the next refresh.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-2">
                                                <History className="w-4 h-4 text-indigo-500" />
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity Log</h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing last {selectedPartner.recentTransactions?.length || 0} activities</span>
                                        </div>

                                        {selectedPartner.recentTransactions && selectedPartner.recentTransactions.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedPartner.recentTransactions.map((tx) => (
                                                    <div key={tx.id} className="group bg-slate-50 hover:bg-white border border-transparent hover:border-gray-100 rounded-2xl p-4 transition-all duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className={`p-2 rounded-xl ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                                                    {getTransactionIcon(tx.type, tx.amount)}
                                                                </div>
                                                                <div>
                                                                    <h6 className="text-sm font-black text-slate-800 tracking-tight">{tx.description}</h6>
                                                                    <div className="flex items-center space-x-3 mt-0.5">
                                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.type.replace('_', ' ')}</span>
                                                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                                        <span className="text-[10px] font-bold text-slate-400">{new Date(tx.createdAt).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-sm font-black tracking-tight ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} TRX
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">
                                                                    Bal: {tx.balanceAfter.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                                    <Activity className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">No recent history</h5>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="p-10 bg-white border-t border-gray-50 flex items-center space-x-4">
                                <button className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                    <Send className="w-4 h-4" />
                                    <span>Suggest Top-up Now</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab(activeTab === 'insights' ? 'history' : 'insights')}
                                    className="flex items-center space-x-3 px-8 py-4 bg-white text-slate-600 rounded-[20px] border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                                >
                                    <History className="w-4 h-4" />
                                    <span>{activeTab === 'insights' ? 'View History' : 'View Insights'}</span>
                                </button>
                                <button className="p-4 bg-white text-slate-400 hover:text-indigo-600 rounded-[20px] border border-gray-200 transition-all">
                                    <ExternalLink className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LowCreditPartners;
