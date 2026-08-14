import React from 'react';
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import PageContainer from './PageContainer';
import { useCargoOwnerLayout } from '../../contexts/CargoOwnerLayoutContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const layout = useCargoOwnerLayout();
  const hideHeader = layout?.hideHeader;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col relative">
      {!hideHeader && <DashboardHeader />}
      <main className="flex-1 relative z-0 pb-20 lg:pb-0">
        <PageContainer className="py-8 relative z-20 min-h-[400px] sm:min-h-[500px]">
          {children}
        </PageContainer>
      </main>
      <MobileBottomNav />
      <DashboardFooter />
    </div>
  );
};

export default DashboardLayout;

