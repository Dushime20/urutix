import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';

const DashboardFooter = () => {
  return (
    <footer className="mt-auto py-8 sm:py-12 border-t border-gray-100 bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 px-4 md:px-8 lg:px-12 xl:px-20">
      <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          {/* Logo Section */}
          <div className="flex items-center order-1 md:order-1">
            <img src={logoUrutiX} alt="UritiX Logistics Logo" className="h-10 sm:h-12 md:h-16 w-auto object-contain max-w-none" />
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 order-2 md:order-2">
            <a href="#" className="text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">About Us</a>
            <a href="#" className="text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Features</a>
            <a href="#" className="text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Pricing</a>
            <a href="#" className="text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Contact</a>
            <a href="#" className="text-sm text-gray-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">Privacy</a>
          </div>

          {/* Copyright Section */}
          <div className="text-sm text-gray-400 dark:text-slate-500 order-3 md:order-3">
            © 2024 UrutiX. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;

