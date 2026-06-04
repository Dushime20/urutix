import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayoutProvider } from '../../contexts/AdminLayoutContext';
import OperationalAdminHeader from './OperationalAdminHeader';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import ModernLoader from '../common/ModernLoader';

const OperationalAdminLayoutContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (!isLoading && user && user.role !== 'ADMIN') {
      switch (user.role) {
        case 'SUPER_ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'TENANT_ADMIN':
          navigate('/tenant-admin', { replace: true });
          break;
        case 'CARGO_OWNER':
          navigate('/dashboard/cargos', { replace: true });
          break;
        case 'TRUCK_OWNER':
          navigate('/dashboard/fleet', { replace: true });
          break;
        case 'DRIVER':
          navigate('/dashboard/driver', { replace: true });
          break;
        case 'BROKER':
          navigate('/dashboard/broker', { replace: true });
          break;
        case 'LENDER':
          navigate('/lender', { replace: true });
          break;
        default:
          navigate('/auth', { replace: true });
      }
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== 'ADMIN') {
    return <ModernLoader isLoading={isLoading || !user} text="Initializing_Admin_Space" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col relative">
      <OperationalAdminHeader />
      <main className="flex-1 relative z-0 pb-20 lg:pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 relative z-20 min-h-[400px] sm:min-h-[500px]">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      <DashboardFooter />
    </div>
  );
};

const OperationalAdminLayout: React.FC = () => {
  return (
    <AdminLayoutProvider>
      <OperationalAdminLayoutContent />
    </AdminLayoutProvider>
  );
};

export default OperationalAdminLayout;
