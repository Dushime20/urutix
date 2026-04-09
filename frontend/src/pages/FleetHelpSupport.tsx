import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Mail,
  Phone,
  MessageSquare,
  BookOpen,
  Video,
  Search,
  ChevronDown,
  ChevronUp,
  Truck,
  Users,
  Map,
  CreditCard,
  BarChart2,
  Shield,
  Play,
  Rocket,
  Lightbulb,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { HelpCenter } from '../components/FleetDashboard/HelpCenter';
import FleetOwnerOnboarding from '../components/FleetDashboard/FleetOwnerOnboarding';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FleetHelpSupport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I add a new truck to my fleet?',
      answer: 'Navigate to Truck Management > Add Truck. Fill in all required information including truck specifications, driver information, and safety equipment. Once submitted, your truck will be added to your fleet and available for trip assignments.',
      category: 'trucks'
    },
    {
      id: '2',
      question: 'How do I assign a driver to a truck?',
      answer: 'Go to My Drivers > Driver Assignments. Select the truck you want to assign a driver to, then choose an available driver from the list. You can add assignment notes and set the assignment status.',
      category: 'drivers'
    },
    {
      id: '3',
      question: 'How do I bid on cargo shipments?',
      answer: 'Visit the Bids page to see all available cargo auctions. Click on a cargo shipment to view details, then click "Place Bid" to submit your bid. You can include your proposed pickup and delivery dates, bid amount, and any additional notes.',
      category: 'bidding'
    },
    {
      id: '4',
      question: 'How do I pay my drivers before a trip?',
      answer: 'Go to Payment Management > Pay Driver (Before Trip). Select the trip you want to pay for, enter the driver\'s mobile money number, your number, and PIN. The system will process a 30% advance payment to the driver.',
      category: 'payments'
    },
    {
      id: '5',
      question: 'How do I request payment from cargo owners?',
      answer: 'After a trip is completed, go to Payment Management > Receive Payment (After Delivery). Find the completed trip and click "Request Payment". This will send a notification to the cargo owner to complete their payment.',
      category: 'payments'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'trucks', name: 'Fleet Matrix', icon: Truck },
    { id: 'drivers', name: 'Personnel', icon: Users },
    { id: 'bidding', name: 'Bidding Ops', icon: MessageSquare },
    { id: 'payments', name: 'Fin-Gate', icon: CreditCard },
    { id: 'analytics', name: 'Intelligence', icon: BarChart2 },
    { id: 'routes', name: 'Spatial Routes', icon: Map },
    { id: 'safety', name: 'Compliance', icon: Shield },
    { id: 'account', name: 'Protocol', icon: HelpCircle }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartTour = () => {
    localStorage.removeItem('fleetOwnerOnboardingCompleted');
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('fleetOwnerOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('fleetOwnerOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 md:p-10 animate-in fade-in duration-700 transition-colors">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Command Center Support Header */}
        <div className="bg-[#345E85] dark:bg-blue-950/40 rounded-[48px] p-12 md:p-16 relative overflow-hidden shadow-2xl shadow-blue-100 dark:shadow-none border border-transparent dark:border-blue-900/30">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent flex items-center justify-center">
            <Rocket className="text-white opacity-10 scale-[4.0] animate-pulse" />
          </div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">System Guidance Active</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-6">
              Fleet <span className="opacity-60 font-serif italic">Support</span> Interface
            </h1>
            <p className="text-lg text-blue-100/70 font-medium max-w-xl leading-relaxed mb-10">
              Operationalize your fleet management with our multi-vector intelligence and synchronization tools.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleStartTour}
                className="px-8 py-4 bg-white text-[#345E85] rounded-3xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 flex items-center gap-2"
              >
                <Play size={16} fill="currentColor" /> Initialize Tour
              </button>
              <button
                onClick={() => setShowHelpCenter(true)}
                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Lightbulb size={16} /> Knowledge Base
              </button>
            </div>
          </div>
        </div>

        {/* Intelligence Grids */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: BookOpen, title: 'Registry Archive', color: 'blue', desc: 'Protocol manuals' },
            { icon: Video, title: 'Visual Synapse', color: 'emerald', desc: 'Interface tutorials' },
            { icon: ShieldCheck, title: 'Compliance Grid', color: 'rose', desc: 'Safety standards' },
            { icon: TrendingUp, title: 'Performance Lab', color: 'amber', desc: 'KPI optimization' }
          ].map((grid, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md dark:shadow-none transition-all group cursor-pointer text-center">
              <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-[#345E85] dark:group-hover:text-blue-400 transition-all">
                <grid.icon size={28} />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">{grid.title}</h4>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{grid.desc}</p>
            </div>
          ))}
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Support Links</h3>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Data Hub', detail: 'support@urutix.com' },
                  { icon: Phone, label: 'Voice Link', detail: '+254 700 000 000' },
                  { icon: MessageSquare, label: 'Pulse Chat', detail: 'Real-time Linkage' }
                ].map((link, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-3xl hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all cursor-pointer">
                    <div className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm">
                      <link.icon size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#345E85] dark:text-blue-400">{link.label}</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{link.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-[#345E85] p-10 rounded-[40px] text-white shadow-xl">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-4">Urgent Vector</p>
              <h4 className="text-2xl font-black mb-6">Need Immediate Assistance?</h4>
              <p className="text-xs text-blue-100/70 leading-relaxed mb-8">Our personnel are available 24/7 for critical system divergence resolution.</p>
              <button className="w-full py-4 bg-white text-[#345E85] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all outline-none">
                Transmit SOS Signal
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">Knowledge Synchronization</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Protocol-specific intelligence repository</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Logic Query..."
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-6 text-xs font-bold outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#345E85] dark:focus:border-blue-500 text-slate-900 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-10">
              {categories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat.id ? 'bg-[#345E85] dark:bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredFAQs.map(faq => (
                <div key={faq.id} className={`border rounded-[32px] overflow-hidden transition-all ${expandedFAQ === faq.id ? 'border-[#345E85] dark:border-blue-500 shadow-lg shadow-blue-50 dark:shadow-none' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full px-8 py-6 text-left flex items-center justify-between"
                  >
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">{faq.question}</span>
                    {expandedFAQ === faq.id ? <ChevronUp size={18} className="text-[#345E85] dark:text-blue-400" /> : <ChevronDown size={18} className="text-slate-400 dark:text-slate-600" />}
                  </button>
                  <AnimatePresence>
                    {expandedFAQ === faq.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <div className="px-8 pb-8 pt-2">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-4 border-blue-100 dark:border-blue-900/50 pl-6">{faq.answer}</p>
                          <div className="flex gap-4 mt-8 pt-6 border-t border-slate-50">
                             <span className="text-[9px] font-black uppercase tracking-widest text-[#345E85] dark:text-blue-400 flex items-center gap-1.5 hover:translate-x-1 transition-transform cursor-pointer">
                              Explore Logic <ArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Footer Hub */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm transition-colors flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-6 mb-8 md:mb-0">
            <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Infrastructure Integrity</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase">System Ready</h4>
            </div>
          </div>
          <div className="flex gap-16">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Latency</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">14ms</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Uptime</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">99.9%</p>
            </div>
          </div>
        </div>

      </div>

      {/* Logic Components */}
      {showHelpCenter && (
        <HelpCenter
          onClose={() => setShowHelpCenter(false)}
          onRestartTour={() => {
            setShowOnboarding(true);
            setShowHelpCenter(false);
          }}
        />
      )}
      {showOnboarding && (
        <FleetOwnerOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
};

export default FleetHelpSupport;
