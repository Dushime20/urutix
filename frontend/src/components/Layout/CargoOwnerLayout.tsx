import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import { CargoOwnerLayoutProvider } from '../../contexts/CargoOwnerLayoutContext';
import ModernLoader from '../common/ModernLoader';

const CargoOwnerLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { state: { from: location } });
    } else if (!isLoading && user && !['CARGO_OWNER', 'CARGO_RECEIVER', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMS_OFFICER'].includes(user.role)) {
      // Redirect to their own dashboard if they hit this by mistake
      if (user.role === 'TRUCK_OWNER' || user.role === 'CARRIER') {
        navigate('/dashboard/fleet');
      } else if (user.role === 'DRIVER') {
        navigate('/dashboard/driver');
      } else if (user.role === 'TENANT_ADMIN') {
        navigate('/tenant-admin');
      } else if (user.role === 'LENDER') {
        navigate('/lender');
      } else if (user.role === 'BROKER') {
        navigate('/dashboard/broker');
      }
    }
  }, [user, isLoading, navigate, location]);

  const providerValue = {
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar: () => setSidebarCollapsed(!sidebarCollapsed),
    hideHeader,
    setHideHeader
  };

  if (isLoading || !user) {
    return <ModernLoader isLoading={true} text="Initializing_Session" />;
  }

  return (
    <CargoOwnerLayoutProvider value={providerValue}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative transition-colors duration-300">
        {!hideHeader && <DashboardHeader />}
        
        <main className="flex-1 flex flex-col">
          <div className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 py-2 md:py-4 lg:px-6 w-full overflow-x-hidden">
            <Outlet />
          </div>
          {!hideHeader && <DashboardFooter />}
          {/* Mobile Spacer for Bottom Nav */}
          <div className="h-28 lg:hidden" />
        </main>
        
        <MobileBottomNav />
      </div>
    </CargoOwnerLayoutProvider>
  );
};

export default CargoOwnerLayout;