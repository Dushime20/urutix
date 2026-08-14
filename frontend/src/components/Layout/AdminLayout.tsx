import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayoutProvider } from '../../contexts/AdminLayoutContext';
import MobileBottomNav from './MobileBottomNav';
import ModernLoader from '../common/ModernLoader';

const AdminLayoutContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only SUPER_ADMIN role can access admin dashboard
    if (!isLoading && user) {
      if (user.role !== 'SUPER_ADMIN') {
        console.warn('Access denied: Only SUPER_ADMIN can access admin dashboard');
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'ADMIN':
            navigate('/admin-operational', { replace: true });
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
          case 'PARKING_RESERVATION_MANAGER':
            navigate('/dashboard/parking/reservations', { replace: true });
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

  // Only render admin content if user is SUPER_ADMIN
  if (!user || user.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    // Admin layout is now fully handled by individual pages using AdminPageLayout
    // We just provide the router context here
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col pb-20 lg:pb-0 relative">
      <main className="flex-1 relative z-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

const AdminLayout: React.FC = () => {
  return (
    <AdminLayoutProvider>
      <AdminLayoutContent />
    </AdminLayoutProvider>
  );
};

export default AdminLayout; 