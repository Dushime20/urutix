import React, { ReactNode } from 'react';
import TruckOwnerHeader from '../TruckOwner/TruckOwnerHeader';
import { TranslatedText } from '../translated-text';

interface TruckOwnerLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
  className?: string;
}

const TruckOwnerLayout: React.FC<TruckOwnerLayoutProps> = ({
  children,
  title,
  showSearch = true,
  className = '',
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <TruckOwnerHeader showSearch={showSearch} />
      
      <main className={`${className}`}>
        {title && (
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-6 lg:px-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                <TranslatedText text={title} />
              </h1>
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
          {children}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              © 2024 UrutiX Logistics. <TranslatedText text="All rights reserved" />.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/help" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
                <TranslatedText text="Help & Support" />
              </a>
              <a href="/privacy" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
                <TranslatedText text="Privacy Policy" />
              </a>
              <a href="/terms" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
                <TranslatedText text="Terms of Service" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TruckOwnerLayout;