import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AdminLayoutProvider } from '../../contexts/AdminLayoutContext';
import DashboardLayout from './DashboardLayout';
import DashboardFooter from './DashboardFooter';
import MobileBottomNav from './MobileBottomNav';
import ModernLoader from '../common/ModernLoader';

const TenantAdminLayoutContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Ensure only tenant admins can access this layout
    if (!isLoading && user && user.role !== 'TENANT_ADMIN') {
      // Redirect non-tenant-admins to appropriate dashboard
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin-operational', { replace: true });
          break;
        case 'SUPER_ADMIN':
          navigate('/admin', { replace: true });
          break;
        case 'CARGO_OWNER':
          navigate('/dashboard/cargos', { replace: true });
          break;
        case 'TRUCK_OWNER':
          navigate('/dashboard/fleet', { replace: true });
          break;
        default:
          navigate('/dashboard', { replace: true });
          break;
      }
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== 'TENANT_ADMIN') {
    return <ModernLoader isLoading={isLoading || !user} text="Initializing_Tenant_Space" />;
  }

  // Check if we're on the index dashboard route
  const isDashboardIndex = location.pathname.startsWith('/tenant-admin') && (
    location.pathname === '/tenant-admin' || 
    location.pathname === '/tenant-admin/' ||
    location.pathname === '/tenant-admin/financial' ||
    location.pathname === '/tenant-admin/purchase-credits' ||
    location.pathname === '/tenant-admin/billing' ||
    location.pathname === '/tenant-admin/subscription-plans' ||
    location.pathname === '/tenant-admin/communication' ||
    location.pathname === '/tenant-admin/fleet' ||
    location.pathname === '/tenant-admin/cargo' ||
    location.pathname === '/tenant-admin/drivers' ||
    location.pathname === '/tenant-admin/trips' ||
    location.pathname === '/tenant-admin/users' ||
    location.pathname === '/tenant-admin/truck-owners' ||
    location.pathname === '/tenant-admin/lenders' ||
    location.pathname === '/tenant-admin/settings' ||
    location.pathname === '/tenant-admin/profile'
  );

  return (
    <>
      {isDashboardIndex ? (
        // Dashboard index route has its own layout with welcome section (includes header/footer)
        <div className="min-h-screen bg-gray-50 flex flex-col pb-20 lg:pb-0">
          <main className="flex-1 relative z-0">
            <Outlet />
          </main>
          <MobileBottomNav />
          <DashboardFooter />
        </div>
      ) : (
        // All other routes use the shared DashboardLayout (includes header/footer)
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      )}
    </>
  );
};

const TenantAdminLayout: React.FC = () => {
  return (
    <AdminLayoutProvider>
      <TenantAdminLayoutContent />
    </AdminLayoutProvider>
  );
};

export default TenantAdminLayout;
