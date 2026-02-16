import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  X,
  Search,
  Book,
  Video,
  MessageSquare,
  ChevronRight,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface HelpCenterProps {
  onClose?: () => void;
  onRestartTour?: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onClose, onRestartTour }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Foundation Ops',
      label: 'Getting Started',
      icon: Book,
      articles: [
        { id: 'add-truck', title: 'Asset Synchronization', content: 'Protocol for registering a new transport asset into the active fleet registry.' },
        { id: 'add-driver', title: 'Personnel Integration', content: 'Assign qualified personnel to synchronized transport assets.' },
        { id: 'upload-documents', title: 'Registry Upload', content: 'Digitalize and manage operational documentation (Insurance, Permits).' },
        { id: 'schedule-maintenance', title: 'Health Cycles', content: 'Initialize proactive maintenance scheduling and lifespan tracking.' },
      ]
    },
    {
      id: 'trucks',
      title: 'Asset Logistics',
      label: 'Truck Management',
      icon: ShieldCheck,
      articles: [
        { id: 'edit-truck', title: 'Asset Modification', content: 'Update technical specifications and operational status of fleet units.' },
        { id: 'truck-records', title: 'Intelligence Archive', content: 'Access comprehensive asset lifespan history and maintenance logs.' },
        { id: 'truck-status', title: 'Vector Status', content: 'Transition asset operational states (Available, Syncing, Stasis).' },
      ]
    },
    {
      id: 'notifications',
      title: 'Alert Matrix',
      label: 'Notifications',
      icon: MessageSquare,
      articles: [
        { id: 'view-notifications', title: 'Pulse Monitoring', content: 'Review system-generated alerts for maintenance and compliance thresholds.' },
        { id: 'notification-settings', title: 'Alert Preferences', content: 'Configure synchronization triggers and communication channels.' },
      ]
    },
    {
      id: 'analytics',
      title: 'Data Intelligence',
      label: 'Analytics',
      icon: Award,
      articles: [
        { id: 'view-analytics', title: 'Metric Analysis', content: 'Interpret operational performance data and efficiency scores.' },
        { id: 'generate-reports', title: 'Intelligence Export', content: 'Compile and export comprehensive data reports for strategic review.' },
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex items-center justify-center z-[10001] animate-in fade-in duration-300 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#F8FAFC] rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20"
      >
        {/* Intelligence Header */}
        <div className="p-8 md:p-10 pb-10 bg-white border-b border-slate-50 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-10 opacity-5 scale-[2] pointer-events-none">
            <HelpCircle size={120} className="text-[#345E85]" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#345E85] shadow-inner">
                  <HelpCircle size={20} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#345E85]">Knowledge Repository</h2>
              </div>
              <h1 className="text-3xl md:text-3xl font-black text-slate-900 tracking-tight leading-[1.2] mb-2">
                Help & <span className="text-[#345E85]">Support</span> Command
              </h1>
            </div>

            <button
              onClick={onClose}
              className="h-12 w-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all border border-transparent hover:border-slate-100"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Precision Search */}
        <div className="px-8 md:px-10 py-6 bg-blue-50/30 border-b border-slate-100 shrink-0">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#345E85] transition-colors" />
            <input
              type="text"
              placeholder="Query the operational database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[28px] focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all shadow-sm font-bold text-slate-900 placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Component Matrix */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 pt-6 space-y-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200">
              <Zap size={40} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Operational Match Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCategories.map((category) => {
                const IconComponent = category.icon;
                const isExpanded = activeCategory === category.id;

                return (
                  <div
                    key={category.id}
                    className={`bg-white rounded-[32px] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#345E85] shadow-lg shadow-blue-50' : 'border-slate-100 hover:border-slate-300 hover:shadow-sm'
                      }`}
                  >
                    <button
                      onClick={() => setActiveCategory(isExpanded ? null : category.id)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-[#345E85] text-white' : 'bg-slate-50 text-slate-400'
                          }`}>
                          <IconComponent size={22} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-[#345E85]">Domain Mapping</p>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">{category.title}</h3>
                        </div>
                      </div>
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-blue-50 text-[#345E85] rotate-180' : 'bg-slate-50 text-slate-300'
                        }`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="bg-blue-50/20 border-t border-slate-50"
                        >
                          <div className="p-4 space-y-2">
                            {category.articles.map((article) => (
                              <div
                                key={article.id}
                                className="p-6 bg-white rounded-2xl border border-slate-50 hover:border-[#345E85] hover:shadow-sm transition-all cursor-pointer group"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-black text-slate-800 tracking-tight leading-none group-hover:text-[#345E85]">{article.title}</h4>
                                  <div className="h-2 w-2 rounded-full bg-blue-300 group-hover:scale-150 transition-transform" />
                                </div>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{article.content}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Vectors Footer */}
        <div className="p-8 md:p-10 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seeking Synchronization?</div>
            <a
              href="/dashboard/fleet/support"
              className="text-[10px] font-black uppercase tracking-widest text-[#345E85] bg-blue-50 px-4 py-2 rounded-lg hover:bg-[#345E85] hover:text-white transition-all"
            >
              Contact Support Vector
            </a>
          </div>

          <div className="flex items-center gap-4">
            {onRestartTour && (
              <button
                onClick={() => {
                  localStorage.removeItem('fleetOwnerOnboardingCompleted');
                  onRestartTour();
                  onClose?.();
                }}
                className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 active:scale-95 transition-all text-center"
              >
                Restart Onboarding
              </button>
            )}
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#345E85] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 active:scale-95 transition-all"
            >
              Terminate Session
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
