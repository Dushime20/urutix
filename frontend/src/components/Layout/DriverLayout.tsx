import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';

const DriverLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <main className="flex-1 pb-20 lg:pb-0">
        <Outlet />
      </main>
      
      <MobileBottomNav />
      <DashboardFooter />
    </div>
  );
};

export default DriverLayout;