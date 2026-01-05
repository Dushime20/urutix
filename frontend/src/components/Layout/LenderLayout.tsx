import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';

const LenderLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to auth if not logged in or not a lender
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'LENDER')) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== 'LENDER') return null;

  // Check if we're on the index dashboard route
  const isDashboardIndex = location.pathname === '/lender' || 
                           location.pathname === '/lender/';

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

export default LenderLayout;
