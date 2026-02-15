import logoUrutiX from '../../assets/logo-urutix-logistics.svg';

const DashboardFooter = () => {
  return (
    <footer className="mt-auto py-6 sm:py-8 border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          {/* Logo Section */}
          <div className="flex items-center order-1 md:order-1">
            <img src={logoUrutiX} alt="UrutiX Logistics Logo" className="h-12 w-auto object-contain" />
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 order-2 md:order-2">
            <a href="#" className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">About Us</a>
            <a href="#" className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">Features</a>
            <a href="#" className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">Pricing</a>
            <a href="#" className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">Contact</a>
            <a href="#" className="text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors">Privacy</a>
          </div>

          {/* Copyright Section */}
          <div className="text-sm text-gray-400 order-3 md:order-3">
            © 2024 UrutiX. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;

