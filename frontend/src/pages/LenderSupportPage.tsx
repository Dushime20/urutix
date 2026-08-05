import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  Headphones,
  BookOpen,
  LifeBuoy,
  Phone,
  Mail,
  MessageSquare,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Video,
  FileText,
  Clock,
  GraduationCap,
  Shield,
  TrendingUp,
  ArrowRight,
  Zap,
  Send,
  Plus,
  CheckCircle2
} from 'lucide-react';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  isPopular?: boolean;
  tags: string[];
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  lastUpdate: Date;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'pdf' | 'webinar';
  category: string;
  duration?: string;
  downloadUrl?: string;
  isNew?: boolean;
}

const LenderSupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'resources' | 'tickets'>('faq');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'Getting Started',
      question: 'How do I set up my lender account?',
      answer: 'To set up your lender account: 1) Complete the registration form with your business information, 2) Upload required documentation (business license, financial statements), 3) Wait for account verification (usually 2-3 business days), 4) Set up your lending preferences and policies, 5) Fund your lending account to start offering loans.',
      isPopular: true,
      tags: ['setup', 'registration', 'verification']
    },
    {
      id: '2',
      category: 'Lending Operations',
      question: 'What are the minimum and maximum loan amounts I can offer?',
      answer: 'Loan amounts can range from $5,000 to $10,000,000 depending on your lender tier and available capital. Tier 1 lenders can offer up to $1M per loan, Tier 2 up to $5M, and Tier 3 (institutional) up to $10M. You can set your own minimums within these ranges.',
      isPopular: true,
      tags: ['loan amounts', 'limits', 'tiers']
    },
    {
      id: '3',
      category: 'Risk Management',
      question: 'How does the credit assessment system work?',
      answer: 'Our AI-powered credit assessment evaluates borrowers based on: business financials, credit history, cargo tracking records, payment history, industry risk factors, and collateral value. Each borrower receives a risk score from 1-1000, with detailed risk breakdowns to help you make informed decisions.',
      isPopular: true,
      tags: ['credit assessment', 'risk scoring', 'AI']
    },
    {
      id: '4',
      category: 'Payments & Fees',
      question: 'What fees do I pay as a lender?',
      answer: 'Lender fees include: Platform fee (1.5% of loan amount), Processing fee ($50 per loan), Late payment collection fee (2% of recovered amount), Wire transfer fees ($25 domestic, $50 international), Premium features subscription ($99/month for advanced analytics).',
      tags: ['fees', 'pricing', 'costs']
    },
    {
      id: '5',
      category: 'Compliance',
      question: 'What compliance requirements must I meet?',
      answer: 'Compliance requirements include: AML (Anti-Money Laundering) documentation, KYC (Know Your Customer) verification, SOX compliance for loans over $1M, Regular financial reporting, Risk management policies, Data protection compliance (GDPR/CCPA), and Industry-specific regulations based on cargo types.',
      tags: ['compliance', 'AML', 'KYC', 'regulations']
    },
    {
      id: '6',
      category: 'Technology',
      question: 'How do I integrate with your API?',
      answer: 'API integration steps: 1) Request API access in your dashboard, 2) Generate API keys, 3) Review API documentation, 4) Test in sandbox environment, 5) Implement webhook endpoints, 6) Go live with production keys. Full documentation available in the developer portal.',
      tags: ['API', 'integration', 'development']
    }
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: 'ST-2024-001',
      subject: 'Unable to access loan analytics dashboard',
      status: 'in-progress',
      priority: 'medium',
      createdAt: new Date(2025, 7, 10),
      lastUpdate: new Date(2025, 7, 11)
    },
    {
      id: 'ST-2024-002',
      subject: 'API rate limiting issues',
      status: 'resolved',
      priority: 'high',
      createdAt: new Date(2025, 7, 8),
      lastUpdate: new Date(2025, 7, 9)
    }
  ];

  const resources: Resource[] = [
    {
      id: '1',
      title: 'Lender Onboarding Guide',
      description: 'Complete step-by-step guide to get started as a lender on our platform',
      type: 'guide',
      category: 'Getting Started',
      isNew: true
    },
    {
      id: '2',
      title: 'Risk Assessment Best Practices',
      description: 'Advanced strategies for evaluating cargo financing risks',
      type: 'pdf',
      category: 'Risk Management',
      downloadUrl: '#'
    },
    {
      id: '3',
      title: 'API Integration Workshop',
      description: 'Live workshop on integrating with our lending API',
      type: 'webinar',
      category: 'Technology',
      duration: '45 min'
    }
  ];

  const categories = ['all', 'Getting Started', 'Lending Operations', 'Risk Management', 'Payments & Fees', 'Compliance', 'Technology'];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const ticketColumns = useMemo<Column<SupportTicket>[]>(() => [
    {
      key: 'id',
      label: 'Identification',
      sortable: true,
      render: (v) => <span className="text-xs font-black text-[#345E85]">{String(v)}</span>,
    },
    {
      key: 'subject',
      label: 'Subject Payload',
      sortable: true,
      render: (v) => <p className="text-sm font-bold text-slate-900 dark:text-white">{String(v)}</p>,
    },
    {
      key: 'status',
      label: 'Status Vector',
      sortable: true,
      render: (_v, ticket) => (
        <StatusBadge
          status={ticket.status === 'in-progress' ? 'in_progress' : ticket.status}
          label={ticket.status}
        />
      ),
    },
    {
      key: 'priority',
      label: 'Priority Tier',
      sortable: true,
      render: (_v, ticket) => (
        <StatusBadge
          status={ticket.priority === 'urgent' || ticket.priority === 'high' ? 'cancelled' : ticket.priority === 'medium' ? 'pending' : 'info'}
          label={ticket.priority}
          variant={
            ticket.priority === 'urgent' ? 'error' :
            ticket.priority === 'high' ? 'orange' :
            ticket.priority === 'medium' ? 'warning' : 'info'
          }
        />
      ),
    },
    {
      key: 'createdAt',
      label: 'Temporal Stamp',
      sortable: true,
      render: (_v, ticket) => (
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {ticket.createdAt.toLocaleDateString()}
        </p>
      ),
    },
  ], []);

  const ticketActions = useMemo<TableAction<SupportTicket>[]>(() => [
    {
      key: 'open',
      label: 'Open',
      icon: <ArrowRight size={14} />,
      onClick: () => {},
    },
  ], []);

  const renderFaqTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      {/* Featured FAQs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {faqs.filter(f => f.isPopular).map(faq => (
          <div key={faq.id} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-[#345E85] group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-3">{faq.question}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">{faq.answer}</p>
            <button
              onClick={() => {
                setExpandedFAQ(faq.id);
                document.getElementById(`faq-${faq.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[10px] font-black uppercase tracking-widest text-[#345E85] flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              Explore Logic <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Main FAQ List */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Repository</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Foundational knowledge synchronization</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat
                    ? 'bg-[#345E85] text-white shadow-lg shadow-blue-100'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredFAQs.map(faq => (
            <div
              key={faq.id}
              id={`faq-${faq.id}`}
              className={`border rounded-3xl transition-all duration-500 ${expandedFAQ === faq.id ? 'border-[#345E85] bg-blue-50/30' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:border-slate-700'
                }`}
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full px-8 py-6 text-left flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${expandedFAQ === faq.id ? 'bg-[#345E85] scale-150' : 'bg-slate-300'} transition-all`} />
                  <span className="text-sm font-bold text-slate-800">{faq.question}</span>
                </div>
                {expandedFAQ === faq.id ? <ChevronUp size={18} className="text-[#345E85]" /> : <ChevronDown size={18} className="text-slate-400" />}
              </button>
              <AnimatePresence>
                {expandedFAQ === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-14 pb-8">
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">{faq.answer}</p>
                      <div className="flex flex-wrap gap-2 mt-6">
                        {faq.tags.map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase text-slate-400 rounded-lg tracking-widest">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderContactTab = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-10"
    >
      <div className="space-y-8">
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Headphones size={120} className="text-[#345E85]" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#345E85] mb-4">Direct Linkage</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-6">Omni-Channel Support</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-10">Select your preferred communication vector for immediate personnel synchronization.</p>

          <div className="space-y-4">
            {[
              { icon: MessageSquare, label: 'Real-time Pulse (Live Chat)', detail: 'Latency: < 60s', action: 'Initialize Session' },
              { icon: Phone, label: 'Voice Authorization', detail: '+1 (555) 123-4567', action: 'Establish Link' },
              { icon: Mail, label: 'Asynchronous Data', detail: 'support@urutix.com', action: 'Transmit Packet' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-transparent hover:border-slate-100 dark:border-slate-800 hover:bg-white dark:bg-slate-900 transition-all group/item">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-300 group-hover/item:text-[#345E85] transition-colors`}>
                    <item.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{item.detail}</p>
                  </div>
                </div>
                <button className="text-[9px] font-black uppercase tracking-widest text-[#345E85] opacity-0 group-hover/item:opacity-100 transition-all">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#345E85] p-10 rounded-[40px] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <Shield size={200} />
          </div>
          <h4 className="text-xl font-black uppercase tracking-tight mb-4">SLA Commitment</h4>
          <p className="text-xs text-blue-100/80 leading-relaxed opacity-80 mb-6">UrutiX maintains a 99.9% uptime for support infrastructure with guaranteed response horizons based on ticket classification.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Critical Response</p>
              <p className="text-lg font-black">60 Minutes</p>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Standard Response</p>
              <p className="text-lg font-black">12 Hours</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="mb-10">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Support Manifest</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Formal incident report generation</p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Subject</label>
            <input
              type="text"
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all"
              placeholder="Primary identifier of support requirement..."
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Domain Category</label>
              <select className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all appearance-none cursor-pointer">
                <option>Technical Architecture</option>
                <option>Financial Settlement</option>
                <option>Policy Configuration</option>
                <option>Security/Compliance</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority Vector</label>
              <select className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all appearance-none cursor-pointer">
                <option>Low Impact</option>
                <option>Medium (Operational)</option>
                <option>High (Blocking)</option>
                <option>Urgent (System Failure)</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Specification</label>
            <textarea
              rows={5}
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-50 focus:border-[#345E85] outline-none transition-all resize-none"
              placeholder="Elaborate on the specific divergence from expected behavior..."
            ></textarea>
          </div>
          <button className="w-full py-5 bg-[#345E85] text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-100 active:scale-[0.98]">
            Transmit Support Request <Send size={16} />
          </button>
        </form>
      </div>
    </motion.div>
  );

  const renderResourcesTab = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-10"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: GraduationCap, title: 'Foundational Knowledge', count: 12 },
          { icon: BookOpen, title: 'Technical Manuals', count: 24 },
          { icon: Shield, title: 'Compliance Assets', count: 8 },
          { icon: TrendingUp, title: 'Strategic Analytics', count: 15 }
        ].map((cat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:border-[#345E85] transition-all">
            <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#345E85] transition-all">
              <cat.icon size={26} />
            </div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white mb-1">{cat.title}</h4>
            <p className="text-[10px] font-bold text-slate-400">{cat.count} Artifacts Available</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {resources.map(res => (
          <div key={res.id} className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex gap-6 items-center group">
            <div className={`h-24 w-24 rounded-3xl flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 text-slate-400 group-hover:bg-[#345E85] group-hover:text-white transition-all duration-500`}>
              {res.type === 'guide' ? <BookOpen size={32} /> : res.type === 'video' ? <Video size={32} /> : res.type === 'pdf' ? <FileText size={32} /> : <GraduationCap size={32} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#345E85] bg-blue-50 px-2 py-0.5 rounded-md">{res.category}</span>
                {res.isNew && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">New Arrival</span>}
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{res.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 pr-10">{res.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                  <Clock size={12} /> {res.duration || 'Variable Duration'}
                </span>
                <button className="h-10 w-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-[#345E85] hover:text-white transition-all group/dl">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderTicketsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm"
    >
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Liaison Logs</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Personnel incident synchronization status</p>
        </div>
        <button
          onClick={() => setActiveTab('contact')}
          className="h-12 px-6 bg-[#345E85] text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={16} /> Initiative Logic
        </button>
      </div>

      <StandardDataTable<SupportTicket>
        embedded
        columns={ticketColumns}
        data={supportTickets}
        getRowId={(row) => row.id}
        searchPlaceholder="Search tickets…"
        searchKeys={['id', 'subject', 'status', 'priority']}
        rowActions={ticketActions}
        stickyHeader
        columnVisibility
        pagination
        emptyMessage="No support tickets"
        ariaLabel="Support tickets"
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Hero */}
        <div className="bg-[#345E85] rounded-[48px] p-12 md:p-20 relative overflow-hidden shadow-2xl shadow-blue-100">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/10 to-transparent flex items-center justify-center">
            <LifeBuoy className="text-white opacity-10 scale-[5.0] animate-pulse" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">System Support Active</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                Intelligence <br /> <span className="opacity-60 font-light">Synchronization Hub</span>
              </h1>
              <p className="text-lg text-blue-100/80 font-medium max-w-2xl leading-relaxed">
                Connect with our expert personnel and synchronize your knowledge base through our multi-vector support infrastructure.
              </p>
            </div>

            <div className="relative max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Query our repository for operational logic..."
                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] py-6 pl-16 pr-8 text-white placeholder:text-white/40 focus:bg-white/20 outline-none transition-all shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap gap-2 sticky top-6 z-50">
          {[
            { id: 'faq', label: 'Intelligence Repository', icon: HelpCircle },
            { id: 'contact', label: 'Multi-Vector Support', icon: Headphones },
            { id: 'resources', label: 'Artifact Archive', icon: BookOpen },
            { id: 'tickets', label: 'Liaison Logs', icon: LifeBuoy }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 ${activeTab === tab.id
                  ? 'bg-[#345E85] text-white shadow-xl shadow-blue-100'
                  : 'bg-transparent text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[600px]">
          {activeTab === 'faq' && renderFaqTab()}
          {activeTab === 'contact' && renderContactTab()}
          {activeTab === 'resources' && renderResourcesTab()}
          {activeTab === 'tickets' && renderTicketsTab()}
        </div>

        {/* Footer Guarantee */}
        <div className="flex flex-col md:flex-row items-center justify-between p-10 bg-slate-100 rounded-[40px] border border-slate-200 dark:border-slate-700 border-dashed">
          <div className="flex items-center gap-6 mb-6 md:mb-0">
            <div className="h-16 w-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center text-[#345E85] shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#345E85]">Verified Infrastructure</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase">Operational Excellence</h4>
            </div>
          </div>
          <div className="flex gap-10">
            <div className="text-center md:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Human Satisfaction</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">99.8%</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Resolution Horizon</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">4.2h</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Network Reliability</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">365/24</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderSupportPage;
