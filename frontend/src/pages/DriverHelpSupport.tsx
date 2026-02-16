import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HelpCircle,
    Mail,
    Phone,
    MessageSquare,
    Search,
    ChevronDown,
    ChevronUp,
    MapPin,
    Route,
    Truck,
    DollarSign,
    Shield,
    FileText,
    Star,
    ArrowRight,
    Zap,
    Settings,
    ShieldCheck,
    ThumbsUp,
    ThumbsDown,
    Clock
} from 'lucide-react';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

const DriverHelpSupport: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

    const faqs: FAQItem[] = [
        {
            id: '1',
            question: 'How do I start a new trip?',
            answer: 'Navigate to "My Trips" and find your active assignment. Click on the "Start Trip" button. Ensure you have performed your pre-trip inspection and linked your truck in the system.',
            category: 'trips'
        },
        {
            id: '2',
            question: 'How do I update cargo status during transit?',
            answer: 'While on an active trip, use the "Cargo Management" tab. You can update the status of each parcel (Pick up, In Transit, Delivered) and upload proof of delivery photos.',
            category: 'cargo'
        },
        {
            id: '3',
            question: 'How do I view my earnings and withdrawals?',
            answer: 'Visit the "Earnings" dashboard to see your completed trips and pending payments. You can request withdrawals to your mobile money account directly from the earnings interface.',
            category: 'earnings'
        },
        {
            id: '4',
            question: 'What do I do in case of an emergency or breakdown?',
            answer: 'Use the "SOS" button on your dashboard or contact support immediately through the "Voice Link". Report your location and the nature of the emergency for rapid assistance.',
            category: 'safety'
        },
        {
            id: '5',
            question: 'How do I manage my documents and licenses?',
            answer: 'Go to your "Profile" and select "Documents". Here you can upload and update your driver\'s license, permits, and other certifications required for compliance.',
            category: 'account'
        }
    ];

    const categories = [
        { id: 'all', name: 'All Topics', icon: HelpCircle },
        { id: 'trips', name: 'Trip Ops', icon: Route },
        { id: 'cargo', name: 'Cargo Logic', icon: Settings },
        { id: 'earnings', name: 'Fin-Flow', icon: DollarSign },
        { id: 'safety', name: 'Safety Net', icon: Shield },
        { id: 'account', name: 'Protocol', icon: Settings },
        { id: 'documents', name: 'Registry', icon: FileText },
        { id: 'reputation', name: 'Authority', icon: Star }
    ];

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10 animate-in fade-in duration-700">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Driver-Centric Header */}
                <div className="relative bg-white rounded-[40px] border border-slate-100 p-12 overflow-hidden shadow-sm group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-[2] group-hover:rotate-12 transition-transform duration-1000">
                        <Truck size={180} className="text-[#345E85]" />
                    </div>

                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#345E85] shadow-inner">
                                <HelpCircle size={28} />
                            </div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Personnel Assistance Paradigm</h2>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-6">
                            Driver <span className="text-[#345E85]">Support</span> Hub
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                            Your operational command center for system guidance, safety protocols, and real-time synchronization.
                        </p>

                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Query the repository for trip logic..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-6 pl-16 pr-8 text-slate-900 font-bold placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                {/* Support Vectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: Mail, label: 'Data Hub', detail: 'support@urutix.com', action: 'Send Message' },
                        { icon: Phone, label: 'Voice Link', detail: '+254 700 000 000', action: 'Call Support' },
                        { icon: MessageSquare, label: 'Pulse Chat', detail: 'Real-time Assistant', action: 'Initialize Chat' }
                    ].map((vector, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#345E85] group-hover:text-white transition-all`}>
                                    <vector.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{vector.label}</p>
                                    <p className="text-sm font-bold text-slate-900">{vector.detail}</p>
                                </div>
                            </div>
                            <button className="text-[10px] font-black uppercase tracking-widest text-[#345E85] flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                {vector.action} <ArrowRight size={12} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Categories Matrix */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Operational Domain Filtering</h3>
                        <span className="h-0.5 flex-1 mx-6 bg-slate-200" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all ${selectedCategory === cat.id
                                    ? 'bg-[#345E85] text-white border-transparent shadow-xl shadow-blue-100 scale-105'
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                                    }`}
                            >
                                <cat.icon size={20} className="mb-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Intelligence Repository */}
                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Driver Knowledge Base</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Foundational knowledge synchronization</p>
                        </div>
                        <Zap className="text-[#345E85] animate-pulse" />
                    </div>

                    <div className="space-y-4">
                        {filteredFAQs.map(faq => (
                            <div
                                key={faq.id}
                                className={`border rounded-3xl transition-all duration-300 ${expandedFAQ === faq.id ? 'border-[#345E85] bg-blue-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                                    }`}
                            >
                                <button
                                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                    className="w-full px-8 py-6 text-left flex items-center justify-between"
                                >
                                    <span className="text-sm font-bold text-slate-800">{faq.question}</span>
                                    {expandedFAQ === faq.id ? <ChevronUp size={18} className="text-[#345E85]" /> : <ChevronDown size={18} className="text-slate-400" />}
                                </button>
                                <AnimatePresence>
                                    {expandedFAQ === faq.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-8 pt-2">
                                                <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-[#345E85] pl-6">{faq.answer}</p>
                                                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-50">
                                                    <button className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                                                        Efficient Logic <ThumbsUp size={12} />
                                                    </button>
                                                    <button className="text-[9px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                                                        Inaccurate Logic <ThumbsDown size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Global Resources */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: MapPin, title: 'Spatial Guide', desc: 'Master the navigation and route optimization systems.' },
                        { icon: ShieldCheck, title: 'Safety Protocol', desc: 'Compliance standards and emergency response procedures.' },
                        { icon: Clock, title: 'Timing Logic', desc: 'Optimize your trip schedules and delivery horizons.' }
                    ].map((res, idx) => (
                        <div key={idx} className="bg-[#345E85] p-8 rounded-[40px] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                <res.icon size={100} />
                            </div>
                            <res.icon size={32} className="mb-6 opacity-80" />
                            <h4 className="text-lg font-black uppercase tracking-tight mb-3 font-serif">{res.title}</h4>
                            <p className="text-xs text-blue-100/70 leading-relaxed mb-6 font-medium">{res.desc}</p>
                            <button className="text-[10px] font-black uppercase tracking-widest text-white border-b-2 border-white/20 pb-1 hover:border-white transition-all">
                                Access Archive
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DriverHelpSupport;
