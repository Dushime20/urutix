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
  FaShieldAlt,
  FaPlayCircle,
  FaRocket,
  FaLightbulb,
  FaArrowRight
} from 'react-icons/fa';
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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 px-4 py-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
            <FaQuestionCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Help & Support</h1>
            <p className="text-xs text-gray-600 mt-0.5">Find answers to common questions and get the help you need to manage your fleet effectively</p>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="mb-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md border border-blue-700 p-4 text-white mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FaRocket className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white mb-2">New to the Platform?</h2>
              <p className="text-xs text-white/90 mb-3">
                Take our interactive tour to learn how to use the system. We'll guide you through adding trucks, managing drivers, tracking maintenance, and more.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartTour}
                  className="px-3 py-1.5 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-xs flex items-center gap-1.5 shadow-md"
                >
                  <FaPlayCircle className="w-3.5 h-3.5" />
                  Start Interactive Tour
                </button>
                <button
                  onClick={() => setShowHelpCenter(true)}
                  className="px-3 py-1.5 bg-white/10 text-white border border-white/30 rounded-lg hover:bg-white/20 transition-colors font-medium text-xs flex items-center gap-1.5"
                >
                  <FaLightbulb className="w-3.5 h-3.5" />
                  Browse Help Articles
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Help Cards */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div
              onClick={() => setShowHelpCenter(true)}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaBook className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold">Help Center</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Browse our comprehensive help articles organized by topic. Find step-by-step guides for all features.
              </p>
              <div className="flex items-center text-blue-600 font-medium text-xs">
                <span>Open Help Center</span>
                <FaArrowRight className="w-3 h-3 ml-1.5" />
              </div>
            </div>

            <div
              onClick={handleStartTour}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaPlayCircle className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-sm font-semibold">Interactive Tour</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Take a guided tour of the platform. Learn how to add trucks, manage drivers, and use all features.
              </p>
              <div className="flex items-center text-blue-600 font-medium text-xs">
                <span>Start Tour</span>
                <FaArrowRight className="w-3 h-3 ml-1.5" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-500 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaQuestionCircle className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold">FAQs</h3>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                Find quick answers to the most frequently asked questions about using the platform.
              </p>
              <div className="flex items-center text-blue-600 font-medium text-xs">
                <span>View FAQs Below</span>
                <FaArrowRight className="w-3 h-3 ml-1.5" />
              </div>
            </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-2xl mx-auto">
          <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for help topics, questions, or keywords..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-2.5 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mx-auto mb-1.5" />
                  <div className="text-xs font-medium">{category.name}</div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Quick Contact */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mb-2">
              <FaEnvelope className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Email Support</h3>
            <p className="text-xs text-gray-600 mb-2">Get help via email</p>
            <a
              href="mailto:support@urutix.com"
              className="text-blue-600 hover:text-blue-700 font-medium text-xs"
            >
              support@urutix.com
            </a>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mb-2">
              <FaPhone className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Phone Support</h3>
            <p className="text-xs text-gray-600 mb-2">Call us for immediate assistance</p>
            <a
              href="tel:+254700000000"
              className="text-blue-600 hover:text-blue-700 font-medium text-xs"
            >
              +254 700 000 000
            </a>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mb-2">
              <FaComments className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Live Chat</h3>
            <p className="text-xs text-gray-600 mb-2">Chat with our support team</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-xs transition-colors">
              Start Chat
            </button>
          </div>
      </div>

      {/* FAQs */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Frequently Asked Questions
            </h2>
            <span className="text-xs text-gray-600">
              {filteredFAQs.length} {filteredFAQs.length === 1 ? 'question' : 'questions'}
            </span>
          </div>

          <div className="space-y-2">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <FaQuestionCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold mb-1">No results found</h3>
                <p className="text-xs text-gray-600">Try adjusting your search or category filter</p>
              </div>
            ) : (
              filteredFAQs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-900 pr-3">
                      {faq.question}
                    </span>
                    {expandedFAQ === faq.id ? (
                      <FaChevronUp className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <FaChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFAQ === faq.id && (
                    <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50">
                      <p className="text-xs text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      {/* Resources */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Additional Resources</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="flex items-start space-x-2.5">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaBook className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-1">Documentation</h3>
              <p className="text-xs text-gray-600 mb-1.5">
                Comprehensive guides and documentation for all features
              </p>
              <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                View Docs →
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaVideo className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-1">Video Tutorials</h3>
              <p className="text-xs text-gray-600 mb-1.5">
                Step-by-step video guides to help you get started
              </p>
              <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Watch Videos →
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-2.5">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFileAlt className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold mb-1">Knowledge Base</h3>
              <p className="text-xs text-gray-600 mb-1.5">
                Browse our extensive knowledge base for detailed articles
              </p>
              <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Browse Articles →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Help Center Modal */}
      {showHelpCenter && (
        <HelpCenter
          onClose={() => setShowHelpCenter(false)}
          onRestartTour={() => {
            setShowOnboarding(true);
            setShowHelpCenter(false);
          }}
        />
      )}

      {/* Onboarding Modal */}
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

