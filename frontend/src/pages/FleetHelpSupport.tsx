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
  FaTruck,
  FaUsers,
  FaRoute,
  FaCreditCard,
  FaChartBar,
  FaShieldAlt
} from 'react-icons/fa';

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
    },
    {
      id: '6',
      question: 'How do I track my fleet\'s performance?',
      answer: 'Visit the Analytics page to view comprehensive fleet metrics including utilization rates, revenue trends, driver performance, and maintenance status. You can also generate PDF reports for detailed analysis.',
      category: 'analytics'
    },
    {
      id: '7',
      question: 'How do I plan routes for my trucks?',
      answer: 'Go to Route Planning to create and manage routes. You can plan optimal routes, assign routes to trucks, test routes, and view route analytics. The system helps optimize fuel consumption and delivery times.',
      category: 'routes'
    },
    {
      id: '8',
      question: 'What safety records do I need to maintain?',
      answer: 'Visit Safety Records to manage safety compliance documents, track inspections, view safety incidents, and ensure all trucks meet regulatory requirements. Keep records of insurance, licenses, and safety certifications.',
      category: 'safety'
    },
    {
      id: '9',
      question: 'How do I manage driver ratings and rewards?',
      answer: 'Go to My Drivers > Driver Ratings to view and manage driver performance ratings. Visit Rewards to see driver reward programs, and Credit Scoring to view driver credit scores and eligibility.',
      category: 'drivers'
    },
    {
      id: '10',
      question: 'How do I update my account information?',
      answer: 'Navigate to Account & Settings to update your profile information, company details, contact information, and account preferences. You can also manage notification settings and security options.',
      category: 'account'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Topics', icon: FaQuestionCircle },
    { id: 'trucks', name: 'Truck Management', icon: FaTruck },
    { id: 'drivers', name: 'Driver Management', icon: FaUsers },
    { id: 'bidding', name: 'Bidding & Auctions', icon: FaComments },
    { id: 'payments', name: 'Payments', icon: FaCreditCard },
    { id: 'analytics', name: 'Analytics & Reports', icon: FaChartBar },
    { id: 'routes', name: 'Route Planning', icon: FaRoute },
    { id: 'safety', name: 'Safety & Compliance', icon: FaShieldAlt },
    { id: 'account', name: 'Account & Settings', icon: FaQuestionCircle }
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <FaQuestionCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help & Support</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions and get the help you need to manage your fleet effectively
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

export default FleetHelpSupport;

