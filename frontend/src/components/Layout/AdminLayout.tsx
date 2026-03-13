import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayoutProvider } from '../../contexts/AdminLayoutContext';
import DashboardLayout from './DashboardLayout';

const AdminLayoutContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Both ADMIN and SUPER_ADMIN roles can access admin dashboard
    if (!isLoading && user) {
      if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        console.warn('Access denied: Only ADMIN and SUPER_ADMIN can access admin dashboard');
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Only render admin content if user is ADMIN or SUPER_ADMIN
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return null;
  }

  return (
    // Admin layout is now fully handled by individual pages using AdminPageLayout
    // We just provide the router context here
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 relative z-0">
        <Outlet />
      </main>
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