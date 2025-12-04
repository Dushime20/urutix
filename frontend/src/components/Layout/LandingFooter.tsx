import React from 'react';
import { Truck, Globe, Mail, MessageCircle } from 'lucide-react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Company */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold">UrutiX</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              The global platform for intelligent fleet and cargo management. 
              Empowering businesses worldwide with cutting-edge logistics technology.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Product</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Pricing</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">API Documentation</a>
              </li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Careers</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Blog</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Partners</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a href="#" className="hover:text-white transition-colors">Help Center</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Documentation</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Community</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">Status</a>
              </li>
              <li>
                <a href="mailto:support@urutix.com" className="flex items-center hover:text-white transition-colors">
                  <Mail className="w-4 h-4 mr-2" />
                  support@urutix.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} UrutiX. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;

