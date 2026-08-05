import React, { useState } from 'react';
import {
    AlertTriangle, User, ArrowRight,
    TrendingDown, RefreshCw, Send,
    X, CreditCard, PieChart, Activity,
    Calendar, History, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

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
    const { tSync } = useTranslation();
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

    const getStatusLabel = (balance: number) => {
        return balance < 500 ? tSync('Critical') : tSync('Warning');
    };

    const getTransactionIcon = (_type: string, amount: number) => {
        if (amount > 0) return <TrendingDown className="w-3 h-3 text-emerald-500 rotate-180" />;
        return <TrendingDown className="w-3 h-3 text-rose-500" />;
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header section... */}
            <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black text-rose-400 dark:text-rose-500 uppercase tracking-widest mb-1"><TranslatedText text="Alerts" /></h3>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white tracking-tight"><TranslatedText text="Low Balance Alerts" /></h4>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 rounded-full border border-rose-100 dark:border-rose-800 flex items-center space-x-2">
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                            {partners.length} <TranslatedText text="Critical" />
                        </span>
                    </div>
                    {partners.length > 0 && (
                        <button
                            onClick={onNotifyAll}
                            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Send className="w-3 h-3" />
                            <span><TranslatedText text="Notify All" /></span>
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
                                className="bg-slate-50/50 dark:bg-slate-800/30 border border-gray-100 dark:border-slate-800 rounded-[24px] p-5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all duration-300 group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 group-hover:scale-110 transition-transform duration-300">
                                        {partner.user.profile?.avatarUrl ? (
                                            <img src={partner.user.profile.avatarUrl} className="w-5 h-5 rounded-full" alt="" />
                                        ) : (
                                            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        )}
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg border flex items-center space-x-1.5 ${partner.currentBalance < 500
                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400'
                                        }`}>
                                        <TrendingDown className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {getStatusLabel(partner.currentBalance)}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h5 className="text-[14px] font-black text-slate-800 dark:text-slate-100 truncate">
                                        {partner.user.profile?.companyName ||
                                            `${partner.user.profile?.firstName} ${partner.user.profile?.lastName}` ||
                                            tSync('Partner')}
                                    </h5>
                                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                        <TranslatedText text="Partner ID" />: {partner.user.id.substring(0, 8)}
                                    </p>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1"><TranslatedText text="Available" /></span>
                                        <span className={`text-2xl font-black tracking-tight leading-none ${partner.currentBalance < 500 ? 'text-rose-500' : 'text-amber-500'}`}>
                                            {formatCurrency(partner.currentBalance)} <span className="text-xs italic lowercase">TRX</span>
                                        </span>
                                    </div>
                                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 group-hover:text-primary-600 group-hover:border-primary-100 transition-all shadow-sm">
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-[20px] flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-800">
                            <RefreshCw className="h-8 w-8 text-emerald-400 dark:text-emerald-500" />
                        </div>
                        <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight"><TranslatedText text="All Accounts Healthy" /></h5>
                        <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1 font-medium italic"><TranslatedText text="No partners below the risk threshold detected." /></p>
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
                            className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-gray-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden relative"
                        >
                            {/* Modal Header */}
                             <div className="px-10 pt-8 pb-4 bg-slate-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />
                                <div className="relative flex items-center justify-between z-10 mb-6">
                                    <div className="flex items-center space-x-5">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                            {selectedPartner.user.profile?.avatarUrl ? (
                                                <img src={selectedPartner.user.profile.avatarUrl} className="w-10 h-10 rounded-xl" alt="" />
                                            ) : (
                                                <User className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                                {selectedPartner.user.profile?.companyName || tSync('Credit Status')}
                                            </h3>
                                            <div className="flex items-center space-x-3 mt-1">
                                                <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded text-[10px] font-black uppercase tracking-wider"><TranslatedText text="Low Balance" /></span>
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{selectedPartner.user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPartner(null)}
                                        className="p-3 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-2xl transition-all shadow-sm border border-gray-100 dark:border-slate-700"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Tab Navigation */}
                                <div className="flex items-center space-x-8 relative z-10">
                                    <button
                                        onClick={() => setActiveTab('insights')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'insights' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <TranslatedText text="Overview" />
                                        {activeTab === 'insights' && (
                                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <TranslatedText text="History" />
                                        {activeTab === 'history' && (
                                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 dark:bg-primary-400 rounded-full" />
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
                                                <PieChart className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Credits" /></h4>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[24px] p-6 space-y-4">
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400"><TranslatedText text="Subscription Credits" /></span>
                                                    <span className="text-slate-800 dark:text-slate-100">{formatCurrency(selectedPartner.subscriptionCredits)} TRX</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400"><TranslatedText text="Purchased Credits" /></span>
                                                    <span className="text-slate-800 dark:text-slate-100">{formatCurrency(selectedPartner.purchasedCredits)} TRX</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-bold">
                                                    <span className="text-slate-500 dark:text-slate-400"><TranslatedText text="Bonus & Rewards" /></span>
                                                    <span className="text-emerald-500 dark:text-emerald-400">{formatCurrency(selectedPartner.bonusCredits)} TRX</span>
                                                </div>
                                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Total Available" /></span>
                                                    <span className="text-xl font-black text-rose-500 dark:text-rose-400">{formatCurrency(selectedPartner.currentBalance)} TRX</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[20px] p-4">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <CreditCard className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Lifetime Earned" /></span>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                        {formatCurrency(selectedPartner.lifetimeEarned)}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[20px] p-4">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <Activity className="w-3 h-3 text-rose-400 dark:text-rose-500" />
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Lifetime Spent" /></span>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                                                        {formatCurrency(selectedPartner.lifetimeSpent)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Insights & Timeline */}
                                        <div className="space-y-6">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Timeline" /></h4>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-1 bg-gray-100 dark:bg-slate-800 self-stretch rounded-full mt-2" />
                                                    <div>
                                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block"><TranslatedText text="Last Refresh" /></span>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                            {selectedPartner.lastRefreshDate ? new Date(selectedPartner.lastRefreshDate).toLocaleDateString() : tSync('N/A')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-1 bg-primary-200 dark:bg-primary-900 self-stretch rounded-full mt-2" />
                                                    <div>
                                                        <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest block"><TranslatedText text="Next Refresh" /></span>
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                            {selectedPartner.nextRefreshDate ? new Date(selectedPartner.nextRefreshDate).toLocaleDateString() : tSync('N/A')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-[24px] border border-primary-100 dark:border-primary-800">
                                                <h5 className="text-[12px] font-black text-primary-900 dark:text-primary-100 uppercase tracking-tight mb-2"><TranslatedText text="Recommendations" /></h5>
                                                <p className="text-[13px] text-primary-700 dark:text-primary-300 font-medium leading-relaxed">
                                                    <TranslatedText text="This partner has spent over" /> <strong>85%</strong> <TranslatedText text="of their lifetime credits. We recommend suggesting a top-up bundle before the next refresh." />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-2">
                                                <History className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Recent Activity" /></h4>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="Showing last" /> {selectedPartner.recentTransactions?.length || 0} <TranslatedText text="activities" /></span>
                                        </div>

                                        {selectedPartner.recentTransactions && selectedPartner.recentTransactions.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedPartner.recentTransactions.map((tx) => (
                                                    <div key={tx.id} className="group bg-slate-50 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-gray-100 dark:border-slate-800 dark:hover:border-slate-700 rounded-2xl p-4 transition-all duration-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className={`p-2 rounded-xl shrink-0 ${tx.amount > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'}`}>
                                                                    {getTransactionIcon(tx.type, tx.amount)}
                                                                </div>
                                                                <div>
                                                                    <h6 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight"><TranslatedText text={tx.description} /></h6>
                                                                    <div className="flex items-center space-x-3 mt-0.5">
                                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text={tx.type.replace('_', ' ')} /></span>
                                                                        <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full shrink-0" />
                                                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{new Date(tx.createdAt).toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                             <div className="text-right shrink-0 ml-4">
                                                                <div className={`text-sm font-black tracking-tight ${tx.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} TRX
                                                                </div>
                                                                <div className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest mt-0.5">
                                                                    <TranslatedText text="Bal:" /> {tx.balanceAfter.toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center">
                                                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-slate-700">
                                                    <Activity className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <h5 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><TranslatedText text="No recent history" /></h5>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                             {/* Modal Footer Actions */}
                            <div className="p-10 bg-white dark:bg-slate-900 border-t border-gray-50 dark:border-slate-800 flex items-center space-x-4">
                                <button className="flex-1 flex items-center justify-center space-x-3 px-8 py-4 bg-slate-900 dark:bg-primary-600 text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-primary-700 transition-all shadow-lg shadow-slate-200 dark:shadow-primary-900/20">
                                    <Send className="w-4 h-4" />
                                    <span><TranslatedText text="Send Reminder" /></span>
                                </button>
                                <button
                                    onClick={() => setActiveTab(activeTab === 'insights' ? 'history' : 'insights')}
                                    className="flex items-center space-x-3 px-8 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[20px] border border-gray-200 dark:border-slate-700 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                >
                                    <History className="w-4 h-4" />
                                    <span>{activeTab === 'insights' ? <TranslatedText text="View History" /> : <TranslatedText text="View Insights" />}</span>
                                </button>
                                <button className="p-4 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-[20px] border border-gray-200 dark:border-slate-700 transition-all">
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
