import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardHeader from './DashboardHeader';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import { CargoOwnerLayoutProvider } from '../../contexts/CargoOwnerLayoutContext';

const CargoOwnerLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { state: { from: location } });
    } else if (!isLoading && user && !['CARGO_OWNER', 'CARGO_RECEIVER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-4 border-slate-100 rounded-2xl"></div>
          <div className="absolute inset-0 border-4 border-[#345E85] rounded-2xl border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Loading_Protocol</p>
      </div>
    );
  }

  return (
    <CargoOwnerLayoutProvider value={providerValue}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col relative">
        {!hideHeader && <DashboardHeader />}
        
        <main className="flex-1 pb-32 lg:pb-12">
          <div className="max-w-7xl mx-auto px-1.5 sm:px-4 py-4 md:py-8 lg:px-6">
            <Outlet />
          </div>
        </main>
        
        <MobileBottomNav />
        <DashboardFooter />
      </div>
    </CargoOwnerLayoutProvider>
  );
};

export default CargoOwnerLayout;