import React, { useState } from 'react';
import {
    X, User, Truck, Box, TrendingUp,
    ShieldCheck, Calendar, MapPin, Mail,
    Phone, CreditCard, ChevronRight, Activity,
    History, Award, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartnerBillingDetails } from './PartnerBillingDetails';

import { tenantApi } from '../../services/tenantApi';
import { toast } from 'react-hot-toast';

interface PartnerProfile {
    firstName: string;
    lastName: string;
}

interface Partner {
    id: string;
    email: string;
    role: 'TRUCK_OWNER' | 'CARGO_OWNER' | 'BROKER' | 'DRIVER' | 'LENDER';
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
    const [activeTab, setActiveTab] = useState<'overview' | 'billing' | 'fleet' | 'performance'>('overview');

    // Mock additional partner data that might not be in the initial user object
    const partnerExt = {
        rating: 4.8,
        joinDate: 'Oct 2023',
        totalLoads: 142,
        onTimeRate: 97.5,
        fleetSize: partner.role === 'TRUCK_OWNER' ? 4 : 0,
        kycStatus: 'VERIFIED',
        location: 'Kigali, Rwanda'
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'billing', label: 'Financials', icon: CreditCard },
        ...(partner.role === 'TRUCK_OWNER' ? [{ id: 'fleet', label: 'My Fleet', icon: Truck }] : []),
        { id: 'performance', label: 'Performance', icon: TrendingUp }
    ];

    return (
        <div className="bg-[#F9FAFB] rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[80vh] w-full max-w-5xl text-[#1F2937] antialiased">
            {/* Top Navigation / Header */}
            <div className="px-6 md:px-10 py-6 md:py-8 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-0">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-100 flex-shrink-0">
                        <span className="text-white font-black text-lg md:text-xl">{partner.profile?.firstName?.[0] || partner.email?.[0]}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 md:mb-1">Partner Profile</h3>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 truncate">{partner.profile?.firstName} {partner.profile?.lastName}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className={`px-2.5 md:px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${partnerExt.kycStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                        {partnerExt.kycStatus === 'VERIFIED' ? <ShieldCheck className="w-3 h-3 inline mr-1 -mt-0.5" /> : <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />}
                        KYC {partnerExt.kycStatus}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            {/* Sub-navigation */}
            <div className="px-6 md:px-10 bg-white border-b border-slate-100 flex gap-6 md:gap-8 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as 'overview' | 'billing' | 'fleet' | 'performance')}
                        className={`py-4 md:py-5 text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5 inline mr-2 -mt-0.5" />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="partnerTabIndicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full"
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
                            {/* Key Performance Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                {[
                                    { label: 'On-Time Delivery', value: `${partnerExt.onTimeRate}%`, icon: Award, color: 'primary' },
                                    { label: 'Partner Rating', value: `${partnerExt.rating}/5.0`, icon: Activity, color: 'amber' },
                                    { label: 'Total Loads', value: partnerExt.totalLoads, icon: Box, color: 'emerald' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm flex md:block items-center md:items-start gap-4 md:gap-0">
                                        <div className={`w-10 h-10 rounded-xl bg-${stat.color === 'primary' ? 'primary-50' : stat.color + '-50'} flex items-center justify-center mb-0 md:mb-4 flex-shrink-0`}>
                                            <stat.icon className={`w-5 h-5 text-${stat.color === 'primary' ? 'primary-600' : stat.color + '-600'}`} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">{stat.label}</p>
                                            <p className="text-lg md:text-xl font-black text-slate-900">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Info & Metadata */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                    <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 md:mb-6">Contact Information</h4>
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 md:p-3 bg-slate-50 rounded-xl flex-shrink-0">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                                <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{partner.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 md:p-3 bg-slate-50 rounded-xl flex-shrink-0">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                                <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{partner.phone || 'Not Configured'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 md:p-3 bg-slate-50 rounded-xl flex-shrink-0">
                                                <MapPin className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Location</p>
                                                <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{partnerExt.location}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 md:p-3 bg-slate-50 rounded-xl flex-shrink-0">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                                                <p className="text-xs md:text-sm font-bold text-slate-800 truncate">{partnerExt.joinDate}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary-600 p-6 md:p-8 rounded-[32px] text-white shadow-xl shadow-primary-100 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <h4 className="text-[9px] md:text-[10px] font-black text-white/60 uppercase tracking-widest mb-4 md:mb-6">Quick Actions</h4>
                                        <div className="space-y-3 md:space-y-4">
                                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-3.5 md:p-4 rounded-2xl flex items-center justify-between transition-all group/btn">
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">View Activity Logs</span>
                                                <History className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                            <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-3.5 md:p-4 rounded-2xl flex items-center justify-between transition-all group/btn">
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Update Profile</span>
                                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                            
                                            <div className="pt-4 border-t border-white/10 mt-2">
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Manage User Access</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {[
                                                        { id: 'ACTIVE', label: 'Approve & Activate', color: 'emerald', desc: 'Allows full access' },
                                                        { id: 'PENDING_VERIFICATION', label: 'Wait for Verification', color: 'amber', desc: 'Needs documents check' },
                                                        { id: 'SUSPENDED', label: 'Suspend Account', color: 'rose', desc: 'Temporary block access' },
                                                        { id: 'DEACTIVATED', label: 'Disable Account', color: 'slate', desc: 'Permanent removal' }
                                                    ].map((s) => (
                                                        <button
                                                            key={s.id}
                                                            onClick={async () => {
                                                                try {
                                                                    const confirmChange = window.confirm(`Change status to ${s.label}?`);
                                                                    if (!confirmChange) return;
                                                                    
                                                                    await tenantApi.updateTenantUser(partner.id, { status: s.id as any });
                                                                    toast.success(`Account is now ${s.label}`);
                                                                    window.location.reload(); 
                                                                } catch (err) {
                                                                    toast.error('Could not update status');
                                                                }
                                                            }}
                                                            className={`p-4 rounded-2xl border transition-all flex flex-col items-start gap-1 group/status ${
                                                                partner.status === s.id 
                                                                    ? 'bg-white text-primary-600 border-white shadow-xl scale-[1.02]' 
                                                                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                               <div className={`w-2 h-2 rounded-full bg-${s.color}-400 ${s.id === 'ACTIVE' && partner.status === 'ACTIVE' ? 'animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : ''}`} />
                                                               <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                                            </div>
                                                            <span className={`text-[8px] font-medium opacity-60 group-hover/status:opacity-100 ${partner.status === s.id ? 'text-primary-400' : 'text-white'}`}>
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
                            className="space-y-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 tracking-tight">Registered Trucks</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking 4 total assets</p>
                                </div>
                                <button className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Add Truck</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-white p-5 md:p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 md:gap-6">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <Truck className="w-6 h-6 md:w-8 md:h-8 text-primary-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-xs md:text-sm font-black text-slate-900 tracking-tight truncate">V-TRK-2940-00{i}</p>
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex-shrink-0 ml-2">Live</span>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-0.5 md:mt-1 uppercase tracking-widest truncate">Scania R450 · Heavy Duty</p>
                                            <div className="mt-2 md:mt-3 flex items-center gap-3 md:gap-4 overflow-hidden">
                                                <div className="flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[9px] font-black text-slate-500 whitespace-nowrap">
                                                    <Activity className="w-3 h-3" /> 84% Health
                                                </div>
                                                <div className="flex items-center gap-1 md:gap-1.5 text-[8px] md:text-[9px] font-black text-slate-500 whitespace-nowrap">
                                                    <MapPin className="w-3 h-3" /> Kigali
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                            <div className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-100 shadow-sm text-center py-16 md:py-20">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                                    <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-primary-600" />
                                </div>
                                <h4 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-2">Performance History</h4>
                                <p className="text-xs md:text-sm text-slate-400 font-medium max-w-sm mx-auto mb-6 md:mb-8">Access historical performance data, delivery efficiency ratings, and on-time statistics.</p>
                                <button className="bg-primary-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-100">View Detailed Report</button>
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
