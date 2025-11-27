import React, { useState } from 'react';
import {
  FaQuestionCircle,
  FaEnvelope,
  FaPhone,
  FaComments,
  FaBook,
  FaVideo,
  FaFileAlt,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaBox,
  FaList,
  FaChartBar,
  FaMapMarkedAlt,
  FaCreditCard,
  FaBell,
  FaStar
} from 'react-icons/fa';
import logoUrutiX from '@/assets/logo-urutix.svg';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const CargoHelpSupport: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create a new cargo shipment?',
      answer: 'Navigate to Cargo Management > Create Cargo. Fill in all required information including pickup and delivery locations, cargo details, weight, dimensions, and special requirements. You can save drafts and publish when ready.',
      category: 'cargo'
    },
    {
      id: '2',
      question: 'How do I publish my cargo for bidding?',
      answer: 'After creating your cargo, you can choose to publish it for bidding. Go to Cargo Management, select your cargo, and click "Publish for Bid". Truck owners will then be able to view and bid on your shipment.',
      category: 'bidding'
    },
    {
      id: '3',
      question: 'How do I track my cargo shipment?',
      answer: 'Visit Maps & Tracking to see real-time location updates of your cargo. You can view the route, estimated arrival time, and current status of your shipment. Notifications will be sent for important updates.',
      category: 'tracking'
    },
    {
      id: '4',
      question: 'How do I make payments for cargo shipments?',
      answer: 'Go to Financial Management to view all your payment obligations. When a trip is completed, you will receive a payment notification. Click on it to complete payment via mobile money or other available payment methods.',
      category: 'payments'
    },
    {
      id: '5',
      question: 'How do I view analytics and reports?',
      answer: 'Visit Analytics & Reports to access comprehensive insights about your cargo operations. You can view shipment statistics, cost analysis, delivery performance, and generate PDF reports for your records.',
      category: 'analytics'
    },
    {
      id: '6',
      question: 'How do I manage my documents?',
      answer: 'Go to Document Management to upload, view, and manage all your shipping documents including invoices, receipts, insurance papers, and compliance certificates. Documents are organized by type and trip.',
      category: 'documents'
    },
    {
      id: '7',
      question: 'How do I receive notifications?',
      answer: 'Visit Notifications to see all your alerts and updates. You can customize notification preferences, mark items as read, and filter by type. Important notifications will also appear in your dashboard.',
      category: 'notifications'
    },
    {
      id: '8',
      question: 'How do I improve my reputation and earn rewards?',
      answer: 'Go to Reputation & Rewards to view your rating, see your reward points, and check your credit score. Maintain timely payments, provide accurate cargo information, and rate drivers fairly to improve your reputation.',
      category: 'reputation'
    },
    {
      id: '9',
      question: 'How do I update my account information?',
      answer: 'Navigate to Account & Settings to update your profile information, company details, contact information, and account preferences. You can also manage notification settings and security options.',
      category: 'account'
    },
    {
      id: '10',
      question: 'What should I do if there is a problem with my shipment?',
      answer: 'Contact support immediately through Help & Support. You can also use the dispute resolution feature if there are issues with delivery, payment, or service quality. Our team will assist you in resolving the matter.',
      category: 'support'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: FaQuestionCircle },
    { id: 'cargo', name: 'Cargo Management', icon: FaBox },
    { id: 'bidding', name: 'Bidding & Auctions', icon: FaComments },
    { id: 'tracking', name: 'Tracking & Maps', icon: FaMapMarkedAlt },
    { id: 'payments', name: 'Payments', icon: FaCreditCard },
    { id: 'analytics', name: 'Analytics & Reports', icon: FaChartBar },
    { id: 'documents', name: 'Documents', icon: FaFileAlt },
    { id: 'notifications', name: 'Notifications', icon: FaBell },
    { id: 'reputation', name: 'Reputation & Rewards', icon: FaStar },
    { id: 'account', name: 'Account & Settings', icon: FaQuestionCircle },
    { id: 'support', name: 'Support', icon: FaQuestionCircle }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Background Logo */}
      <img 
        src={logoUrutiX} 
        alt="UrutiX Logo Background" 
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0" 
        style={{objectPosition: 'center'}} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <FaQuestionCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions and get the help you need to manage your cargo shipments effectively
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help topics, questions, or keywords..."
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-medium">{category.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Contact */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <FaEnvelope className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">Get help via email</p>
            <a
              href="mailto:support@urutix.com"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              support@urutix.com
            </a>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <FaPhone className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
            <p className="text-gray-600 mb-4">Call us for immediate assistance</p>
            <a
              href="tel:+254700000000"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              +254 700 000 000
            </a>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <FaComments className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat with our support team</p>
            <button className="text-primary-600 hover:text-primary-700 font-medium">
              Start Chat
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <span className="text-gray-600">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'}
            </span>
          </div>

          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search or category filter</p>
              </div>
            ) : (
              filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    {expandedFAQ === faq.id ? (
                      <FaChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <FaChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaBook className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentation</h3>
                <p className="text-gray-600 mb-3">
                  Comprehensive guides and documentation for all features
                </p>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  View Docs →
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaVideo className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutorials</h3>
                <p className="text-gray-600 mb-3">
                  Step-by-step video guides to help you get started
                </p>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Watch Videos →
                </a>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaFileAlt className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Base</h3>
                <p className="text-gray-600 mb-3">
                  Browse our extensive knowledge base for detailed articles
                </p>
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Browse Articles →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CargoHelpSupport;

