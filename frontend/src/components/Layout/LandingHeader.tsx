import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  onGetStarted?: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      navigate('/auth');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6" style={{ color: '#111828' }} />
              </div>
              <span className="ml-3 text-xl font-bold" style={{ color: '#111828' }}>UrutiX</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <a href="#features" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              Features
            </a>
            <a href="#solutions" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              Solutions
            </a>
            <a href="#how-it-works" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              Testimonials
            </a>
            <button
              onClick={handleGetStarted}
              className="px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 space-y-3 border-t border-gray-200">
            <a href="#features" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              Features
            </a>
            <a href="#solutions" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              Solutions
            </a>
            <a href="#how-it-works" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              How It Works
            </a>
            <a href="#testimonials" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
              Testimonials
            </a>
            <div className="px-4 space-y-2">
              <button
                onClick={handleGetStarted}
                className="w-full px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="w-full px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingHeader;

