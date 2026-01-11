import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { CargoOwnerLayoutProvider } from '../../contexts/CargoOwnerLayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';

const CargoOwnerLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hideHeader, setHideHeader] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  // Redirect brokers
  useEffect(() => {
    if (!isLoading && user && user.role === 'BROKER') {
      navigate('/dashboard/broker', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) return null;

  // Check if we're on the customized dashboard routes
  const isDashboardIndex = location.pathname === '/dashboard' ||
    location.pathname === '/dashboard/' ||
    location.pathname === '/cargo-owner' ||
    location.pathname === '/cargo-owner/' ||
    location.pathname.startsWith('/dashboard/cargos') ||
    location.pathname.startsWith('/cargo-owner/cargos');

  return (
    <CargoOwnerLayoutProvider
      value={{
        sidebarCollapsed: false,
        toggleSidebar: () => { }, // No-op since sidebar is gone
        setSidebarCollapsed: () => { },
        hideHeader,
        setHideHeader,
      }}
    >
      {isDashboardIndex ? (
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
    </CargoOwnerLayoutProvider>
  );
};

export default CargoOwnerLayout;