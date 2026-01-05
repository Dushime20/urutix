import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';

const DriverLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) return null;

  // Check if we're on the index dashboard route
  const isDashboardIndex = location.pathname === '/dashboard/driver' || 
                           location.pathname === '/dashboard/driver/';

  return (
    <>
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
    </>
  );
};

export default DriverLayout;

