import React from 'react';
import { useLocation } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import Breadcrumb from '../common/Breadcrumb';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  // Don't show breadcrumbs on the main dashboard page to avoid clutter
  const isMainDashboard = location.pathname === '/dashboard' ||
    location.pathname === '/dashboard/' ||
    location.pathname === '/cargo-owner' ||
    location.pathname === '/cargo-owner/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 relative z-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 relative z-20 min-h-[400px] sm:min-h-[500px]">

          {children}
        </div>
      </main>
      <DashboardFooter />
    </div>
  );
};

export default DashboardLayout;

