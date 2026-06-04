import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import OperationalAdminHeader from './OperationalAdminHeader';
import MobileBottomNav from './MobileBottomNav';
import DashboardFooter from './DashboardFooter';
import ModernLoader from '../common/ModernLoader';

const AdminOperationalLayoutContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only ADMIN role can access admin operational dashboard
    if (!isLoading && user) {
      if (user.role !== 'ADMIN') {
        console.warn('Access denied: Only ADMIN can access admin operational dashboard');
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'SUPER_ADMIN':
            navigate('/admin', { replace: true });
            break;
          case 'TENANT_ADMIN':
            navigate('/tenant-admin', { replace: true });
            break;
          case 'CARGO_OWNER':
            navigate('/dashboard', { replace: true });
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
    } else if (!isLoading && !user) {
      // Not authenticated, redirect to login
      navigate('/auth', { replace: true, state: { from: location } });
    }
  }, [user, isLoading, navigate, location]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <ModernLoader isLoading={true} text="Verifying_Credentials" />;
  }

  // Only render admin operational content if user is ADMIN
  if (!user || user.role !== 'ADMIN') {
    return null;
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

const AdminOperationalLayout: React.FC = () => {
  return <AdminOperationalLayoutContent />;
};

export default AdminOperationalLayout;
