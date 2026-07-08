import React, { useState } from 'react';
import {
    X, User, Truck, Box, TrendingUp,
    ShieldCheck, Calendar, MapPin, Mail,
    Phone, CreditCard, ChevronRight, Activity,
    History, Award, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tenantApi } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../hooks/useTranslation';
import { TranslatedText } from '../translated-text';
import { PartnerBillingDetails } from './PartnerBillingDetails';

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

interface PartnerDetailViewProps {
    partner: Partner;
    tenantId: string;
    onClose: () => void;
}

const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({ partner, tenantId, onClose }) => {
    const { tSync } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'fleet' | 'performance'>('overview');

    // Partner data sourced from actual user object — no hardcoded fallbacks
    const partnerExt = {
        kycStatus: (partner as any).kycStatus || 'PENDING',
        location: (partner as any).profile?.city || (partner as any).profile?.country || '',
        joinDate: (partner as any).createdAt
            ? new Date((partner as any).createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
            : '',
    };

    const tabs = [
        { id: 'overview', label: tSync('Overview'), icon: User },
        { id: 'billing', label: tSync('Financials'), icon: CreditCard },
        ...(partner.role === 'TRUCK_OWNER' ? [{ id: 'fleet', label: tSync('My Fleet'), icon: Truck }] : []),
        { id: 'performance', label: tSync('Performance'), icon: TrendingUp }
    ];

    return (
        <div className="bg-[#F9FAFB] dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[80vh] w-full max-w-5xl text-[#1F2937] dark:text-slate-100 antialiased">
            {/* Top Navigation / Header */}
            <div className="px-6 md:px-10 py-6 md:py-8 bg-white dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-100 dark:shadow-none flex-shrink-0">
                        <span className="text-white font-black text-lg md:text-xl">{partner.profile?.firstName?.[0] || partner.email?.[0]}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-0.5 md:mb-1 italic"><TranslatedText text="Partner Profile" /></h3>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate uppercase italic">{partner.profile?.firstName} {partner.profile?.lastName}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className={`px-2.5 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border italic ${partnerExt.kycStatus === 'VERIFIED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50'
                        }`}>
                        {partnerExt.kycStatus === 'VERIFIED' ? <ShieldCheck className="w-3 h-3 inline mr-1" /> : <AlertCircle className="w-3 h-3 inline mr-1" />}
                        KYC {tSync(partnerExt.kycStatus)}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-95"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            {/* Sub-navigation */}
            <div className="px-6 md:px-10 bg-white dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex gap-6 md:gap-8 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'billing' | 'fleet' | 'performance')}
                        className={`py-4 md:py-5 text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap italic ${activeTab === tab.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5 inline mr-2 -mt-0.5" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="partnerTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            {/* Info & Metadata */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-800/50 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 md:mb-8 italic"><TranslatedText text="Contact Information" /></h4>
                                    <div className="space-y-6 md:space-y-8">
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                                                <Mail className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic"><TranslatedText text="Email Address" /></p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{partner.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                                                <Phone className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic"><TranslatedText text="Phone Number" /></p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{partner.phone || tSync('Not Configured')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                                                <MapPin className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic"><TranslatedText text="Base Location" /></p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{tSync(partnerExt.location)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5">
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl flex-shrink-0">
                                                <Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic"><TranslatedText text="Member Since" /></p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{tSync(partnerExt.joinDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary-600 p-6 md:p-8 rounded-[40px] text-white shadow-xl shadow-primary-100 dark:shadow-none relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h4 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-4 md:mb-8 italic"><TranslatedText text="Quick Actions" /></h4>
                                        <div className="space-y-4">
                                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group/btn">
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest italic"><TranslatedText text="View Activity Logs" /></span>
                                                <History className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group/btn">
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest italic"><TranslatedText text="Update Profile" /></span>
                                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                            
                                            <div className="pt-6 border-t border-white/10 mt-4">
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4 italic"><TranslatedText text="Manage User Access" /></p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[
                                                        { id: 'ACTIVE', label: tSync('Approve & Activate'), color: 'emerald', desc: tSync('Allows full access') },
                                                        { id: 'PENDING_VERIFICATION', label: tSync('Wait for Verification'), color: 'amber', desc: tSync('Needs documents check') },
                                                        { id: 'SUSPENDED', label: tSync('Suspend Account'), color: 'rose', desc: tSync('Temporary block access') },
                                                        { id: 'DEACTIVATED', label: tSync('Disable Account'), color: 'slate', desc: tSync('Permanent removal') }
                                                    ].map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={async () => {
                                                                try {
                                                                    const confirmChange = window.confirm(tSync('Change status to') + ` ${s.label}?`);
                                                                    if (!confirmChange) return;
                                                                    
                                                                    await tenantApi.updateTenantUser(partner.id, { status: s.id as any });
                                                                    toast.success(tSync('Account is now') + ` ${s.label}`);
                                                                    window.location.reload(); 
                                                                } catch (err) {
                                                                    toast.error(tSync('Could not update status'));
                                                                }
                                                            }}
                                                            className={`p-4 rounded-[20px] border transition-all flex flex-col items-start gap-1 group/status ${
                                                                partner.status === s.id 
                                                                    ? 'bg-white text-primary-600 border-white shadow-xl scale-[1.02]' 
                                                                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                               <div className={`w-2 h-2 rounded-full bg-${s.color}-400 ${s.id === 'ACTIVE' && partner.status === 'ACTIVE' ? 'animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : ''}`} />
                                                               <span className="text-[9px] font-black uppercase tracking-tight leading-tight">{s.label}</span>
                                                            </div>
                                                            <span className={`text-[7px] font-black uppercase tracking-widest opacity-60 group-hover/status:opacity-100 ${partner.status === s.id ? 'text-primary-400' : 'text-white'}`}>
                                                               {s.desc}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'billing' && (
                        <motion.div
                            key="billing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full"
                        >
                            <PartnerBillingDetails
                                tenantId={tenantId}
                                userId={partner.id}
                                userName={`${partner.profile?.firstName} ${partner.profile?.lastName}`}
                                onClose={() => setActiveTab('overview')}
                                embedded={true}
                            />
                        </motion.div>
                    )}

                     {activeTab === 'fleet' && (
                        <motion.div
                            key="fleet"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="space-y-8"
                        >
                            <div className="bg-white dark:bg-slate-800/50 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Truck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">
                                    <TranslatedText text="Fleet details not available" />
                                </h4>
                                <p className="text-sm text-slate-400 dark:text-slate-500">
                                    <TranslatedText text="Truck data for this partner is managed in the Fleet module." />
                                </p>
                            </div>
                        </motion.div>
                    )}


                     {activeTab === 'performance' && (
                        <motion.div
                            key="performance"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="bg-white dark:bg-slate-800/50 p-6 md:p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm text-center py-20 md:py-28">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-10 shadow-lg shadow-primary-100 dark:shadow-none">
                                    <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-primary-600 dark:text-primary-400" />
                                </div>
                                <h4 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4"><TranslatedText text="Performance History" /></h4>
                                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto mb-8 md:mb-12 italic"><TranslatedText text="Access historical performance data, delivery efficiency ratings, and on-time statistics." /></p>
                                <button className="bg-primary-600 text-white px-8 md:px-12 py-3.5 md:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-100 dark:shadow-none hover:bg-primary-700 active:scale-95 transition-all"><TranslatedText text="View Detailed Report" /></button>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

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

export default PartnerDetailView;
