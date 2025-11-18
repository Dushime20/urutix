import React, { useState } from 'react';
import { 
  FaQuestionCircle,
  FaHeadset,
  FaBook,
  FaLifeRing,
  FaPhone,
  FaEnvelope,
  FaComments,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaExternalLinkAlt,
  FaDownload,
  FaVideo,
  FaFileAlt,
  FaClock,
  FaGraduationCap,
  FaTools,
  FaShieldAlt,
  FaChartLine,
  FaStar,
  FaThumbsUp,
  FaThumbsDown
} from 'react-icons/fa';

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
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: '',
    priority: 'medium',
    description: ''
  });
  const [showTicketForm, setShowTicketForm] = useState(false);

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
    },
    {
      id: '7',
      category: 'Lending Operations',
      question: 'How long does loan approval take?',
      answer: 'Loan approval times vary: Automated pre-approved loans (under $50K): Instant to 2 hours, Standard review loans: 4-24 hours, Complex loans requiring manual review: 1-3 business days, Large institutional loans (over $1M): 3-7 business days.',
      tags: ['approval time', 'processing', 'timeline']
    },
    {
      id: '8',
      category: 'Risk Management',
      question: 'What happens if a borrower defaults?',
      answer: 'Default recovery process: 1) Automated payment reminders, 2) Collection agency engagement, 3) Asset seizure if collateralized, 4) Insurance claim filing, 5) Legal proceedings if necessary. Our recovery team handles 90% of the process, with 73% average recovery rate.',
      tags: ['default', 'recovery', 'collections']
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
    },
    {
      id: 'ST-2024-003',
      subject: 'Question about compliance reporting',
      status: 'closed',
      priority: 'low',
      createdAt: new Date(2025, 7, 5),
      lastUpdate: new Date(2025, 7, 6)
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
      downloadUrl: '/resources/risk-assessment-guide.pdf'
    },
    {
      id: '3',
      title: 'API Integration Workshop',
      description: 'Live workshop on integrating with our lending API',
      type: 'webinar',
      category: 'Technology',
      duration: '45 min'
    },
    {
      id: '4',
      title: 'Compliance Requirements Overview',
      description: 'Understanding regulatory requirements for cargo lenders',
      type: 'video',
      category: 'Compliance',
      duration: '25 min'
    },
    {
      id: '5',
      title: 'Portfolio Management Strategies',
      description: 'Optimize your lending portfolio for maximum returns',
      type: 'guide',
      category: 'Operations',
      isNew: true
    }
  ];

  const categories = [
    'all',
    'Getting Started',
    'Lending Operations',
    'Risk Management',
    'Payments & Fees',
    'Compliance',
    'Technology'
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
                         faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide': return <FaBook className="h-5 w-5 text-blue-600" />;
      case 'video': return <FaVideo className="h-5 w-5 text-red-600" />;
      case 'pdf': return <FaFileAlt className="h-5 w-5 text-green-600" />;
      case 'webinar': return <FaGraduationCap className="h-5 w-5 text-purple-600" />;
      default: return <FaFileAlt className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle ticket submission
    console.log('Ticket submitted:', newTicket);
    setShowTicketForm(false);
    setNewTicket({ subject: '', category: '', priority: 'medium', description: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <FaLifeRing className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support Center</h1>
            <p className="text-lg text-gray-600 mb-6">
              Get the help you need to succeed with our lending platform
            </p>
            
            {/* Quick Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search for answers, guides, or resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaHeadset className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                <p className="text-sm text-gray-600">Available 24/7</p>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1">
                  Start Chat →
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaPhone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Phone Support</h3>
                <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                <p className="text-xs text-gray-500 mt-1">Mon-Fri 8AM-6PM EST</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaEnvelope className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Email Support</h3>
                <p className="text-sm text-gray-600">lender.support@platform.com</p>
                <p className="text-xs text-gray-500 mt-1">Response within 4 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'faq', label: 'FAQs', icon: FaQuestionCircle },
                { id: 'contact', label: 'Contact Support', icon: FaHeadset },
                { id: 'resources', label: 'Resources', icon: FaBook },
                { id: 'tickets', label: 'My Tickets', icon: FaLifeRing }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div className="space-y-6">
                {/* Popular FAQs */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaStar className="h-5 w-5 text-yellow-500" />
                    Popular Questions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {faqs.filter(faq => faq.isPopular).map((faq) => (
                      <div key={faq.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300">
                        <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{faq.answer}</p>
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                        >
                          Read more →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category === 'all' ? 'All Categories' : category}
                    </button>
                  ))}
                </div>

                {/* FAQ List */}
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{faq.question}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {faq.category}
                            </span>
                            {faq.isPopular && (
                              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded flex items-center gap-1">
                                <FaStar className="h-3 w-3" />
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                        {expandedFAQ === faq.id ? (
                          <FaChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <FaChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4">
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-gray-700 mb-4">{faq.answer}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                {faq.tags.map((tag, index) => (
                                  <span key={index} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">Was this helpful?</span>
                                <button className="text-green-600 hover:text-green-800">
                                  <FaThumbsUp className="h-4 w-4" />
                                </button>
                                <button className="text-red-600 hover:text-red-800">
                                  <FaThumbsDown className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Support Tab */}
            {activeTab === 'contact' && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Our Support Team</h2>
                  <p className="text-gray-600">Choose the best way to reach us for your specific need</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Support Options */}
                  <div className="space-y-6">
                    <div className="p-6 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <FaComments className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Live Chat</h3>
                          <p className="text-sm text-gray-600">Get instant help from our support team</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Online now
                        </div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                          Start Chat
                        </button>
                      </div>
                    </div>

                    <div className="p-6 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FaPhone className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Phone Support</h3>
                          <p className="text-sm text-gray-600">Speak directly with a support specialist</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">US/Canada:</span>
                          <span className="font-medium">+1 (555) 123-4567</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">International:</span>
                          <span className="font-medium">+1 (555) 123-4568</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hours:</span>
                          <span className="font-medium">Mon-Fri 8AM-6PM EST</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <FaEnvelope className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Email Support</h3>
                          <p className="text-sm text-gray-600">Send us a detailed message</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">General Support:</span>
                          <span className="font-medium">support@platform.com</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technical Issues:</span>
                          <span className="font-medium">tech@platform.com</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Response Time:</span>
                          <span className="font-medium">Within 4 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Support Ticket Form */}
                  <div className="p-6 border border-gray-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit a Support Ticket</h3>
                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                        <input
                          type="text"
                          required
                          value={newTicket.subject}
                          onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Brief description of your issue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          required
                          value={newTicket.category}
                          onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a category</option>
                          <option value="technical">Technical Issue</option>
                          <option value="account">Account & Billing</option>
                          <option value="lending">Lending Operations</option>
                          <option value="compliance">Compliance</option>
                          <option value="api">API Integration</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          required
                          rows={4}
                          value={newTicket.description}
                          onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Please provide detailed information about your issue..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                      >
                        Submit Ticket
                      </button>
                    </form>
                  </div>
                </div>

                {/* Response Time Expectations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <FaClock className="h-5 w-5" />
                    Response Time Expectations
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-red-700">Urgent</div>
                      <div className="text-red-600">Within 1 hour</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-700">High</div>
                      <div className="text-orange-600">Within 4 hours</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-yellow-700">Medium</div>
                      <div className="text-yellow-600">Within 24 hours</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-blue-700">Low</div>
                      <div className="text-blue-600">Within 48 hours</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Learning Resources</h2>
                  <p className="text-gray-600">Guides, tutorials, and documentation to help you succeed</p>
                </div>

                {/* Resource Categories */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[
                    { icon: FaGraduationCap, title: 'Getting Started', count: 8, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
                    { icon: FaTools, title: 'Technical Guides', count: 12, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
                    { icon: FaShieldAlt, title: 'Compliance', count: 6, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
                    { icon: FaChartLine, title: 'Best Practices', count: 10, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' }
                  ].map((category, index) => (
                    <div key={index} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className={`p-3 ${category.bgColor} rounded-lg inline-block mb-4`}>
                        <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.count} resources</p>
                    </div>
                  ))}
                </div>

                {/* Resource List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {resources.map((resource) => (
                    <div key={resource.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getResourceIcon(resource.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                            {resource.isNew && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="capitalize">{resource.type}</span>
                              {resource.duration && (
                                <span className="flex items-center gap-1">
                                  <FaClock className="h-3 w-3" />
                                  {resource.duration}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {resource.downloadUrl && (
                                <button className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 text-sm">
                                  <FaDownload className="h-3 w-3" />
                                  Download
                                </button>
                              )}
                              <button className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 text-sm">
                                <FaExternalLinkAlt className="h-3 w-3" />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">My Support Tickets</h2>
                  <button
                    onClick={() => setShowTicketForm(!showTicketForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create New Ticket
                  </button>
                </div>

                {/* Ticket List */}
                <div className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(ticket.status)}`}>
                              {ticket.status.toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Ticket #{ticket.id}</span>
                            <span>Created: {ticket.createdAt.toLocaleDateString()}</span>
                            <span>Last update: {ticket.lastUpdate.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {supportTickets.length === 0 && (
                  <div className="text-center py-12">
                    <FaLifeRing className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
                    <p className="text-gray-600 mb-4">You haven't created any support tickets yet.</p>
                    <button
                      onClick={() => setShowTicketForm(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Your First Ticket
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderSupportPage;
