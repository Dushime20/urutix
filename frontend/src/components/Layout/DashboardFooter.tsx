import logoUrutiX from '../../assets/urutiX Logistics Logo (1).svg';

const DashboardFooter = () => {
  return (
    <footer className="mt-auto py-10 sm:py-16 border-t border-slate-100 bg-white dark:bg-slate-900 ui-page-gutter">
      <div className="ui-page-container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 md:gap-4">
          {/* Logo Section */}
          <div className="flex items-center order-1 md:order-1">
            <img src={logoUrutiX} alt="UrutiX" className="h-6 sm:h-8 md:h-12 w-auto object-contain" />
          </div>

          {/* Links Section */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 order-2 md:order-2">
            {['About', 'Features', 'Pricing', 'Contact', 'Privacy'].map(link => (
              <a key={link} href="#" className="text-[10px] font-black text-slate-400 hover:text-[#345E85] uppercase tracking-[0.2em] transition-all">{link}</a>
            ))}
          </div>

          {/* Copyright Section */}
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest order-3 md:order-3">
            © 2024 UrutiX_LOGISTICS. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;

