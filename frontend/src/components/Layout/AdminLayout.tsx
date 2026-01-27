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
    if (!isLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) return null;

  // Check if we're on a route that manages its own layout (like the redesigned dashboard & users page)
  const isCustomLayout = location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/admin/users' ||
    location.pathname === '/admin/monitoring' ||
    location.pathname === '/admin/activity-logs' ||
    location.pathname === '/admin/enhanced-permissions' ||
    location.pathname === '/admin/advanced-settings';

  return (
    <>
      {isCustomLayout ? (
        // Dashboard index route has its own layout with welcome section (includes header/footer)
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <main className="flex-1 relative z-0">
            <Outlet />
          </main>
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

const AdminLayout: React.FC = () => {
  return (
    <AdminLayoutProvider>
      <AdminLayoutContent />
    </AdminLayoutProvider>
  );
};

export default AdminLayout; 