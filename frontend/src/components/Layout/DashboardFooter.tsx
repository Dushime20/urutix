import { Truck } from 'lucide-react';

const DashboardFooter = () => {
  return (
    <footer className="mt-8 sm:mt-12 py-6 sm:py-8 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#345E85' }}>
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">UrutiX</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-xs sm:text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation py-1">About Us</a>
            <a href="#" className="hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation py-1">Features</a>
            <a href="#" className="hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation py-1">Pricing</a>
            <a href="#" className="hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation py-1">Contact</a>
            <a href="#" className="hover:text-blue-600 active:text-blue-700 transition-colors touch-manipulation py-1">Privacy Policy</a>
          </div>

          <div className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()} UrutiX. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;

