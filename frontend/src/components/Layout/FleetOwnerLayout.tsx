import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';
import { HelpCenter } from '../FleetDashboard/HelpCenter';
import FleetOwnerOnboarding from '../FleetDashboard/FleetOwnerOnboarding';
import { FloatingHelpButton } from '../FleetDashboard/FloatingHelpButton';
import ModernLoader from '../common/ModernLoader';

const FleetOwnerLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  const truckOwnerBlockedPaths = [
    '/dashboard/fleet/analytics',
    '/dashboard/fleet/reports',
    '/dashboard/fleet/communicate',
    '/dashboard/fleet/communication',
  ];

  useEffect(() => {
    if (user?.role !== 'TRUCK_OWNER') return;

    const isBlocked = truckOwnerBlockedPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(`${path}/`)
    );

    if (isBlocked) {
      navigate('/dashboard/fleet', { replace: true });
    }
  }, [user?.role, location.pathname, navigate]);

  // Check if user needs onboarding
  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem('fleetOwnerOnboardingCompleted');
      if (!hasSeenOnboarding) {
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
      }
    }
  }, [user]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        setShowHelpCenter(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('fleetOwnerOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('fleetOwnerOnboardingCompleted', 'true');
    setShowOnboarding(false);
  };

  if (isLoading || !user) {
    return <ModernLoader isLoading={true} text="Initializing_Session" />;
  }

  // Check if we're on a route that manages its own layout (like dashboard index or load board)
  const isSelfAndLayout = location.pathname === '/dashboard/fleet' ||
    location.pathname === '/dashboard/fleet/' ||
    location.pathname === '/dashboard/fleet/overview' ||
    location.pathname === '/dashboard/fleet/financial' ||
    location.pathname === '/dashboard/fleet/loan-requests' ||
    location.pathname === '/dashboard/fleet/expenses' ||
    location.pathname === '/dashboard/fleet/smart-bookings' ||
    location.pathname === '/dashboard/fleet/maintenance' ||
    location.pathname === '/dashboard/fleet/fuel' ||
    location.pathname === '/dashboard/fleet/routes' ||
    location.pathname === '/dashboard/fleet/trucks' ||
    location.pathname === '/dashboard/fleet/drivers' ||
    location.pathname === '/dashboard/fleet/assignments' ||
    location.pathname === '/dashboard/fleet/cost-analysis' ||
    location.pathname === '/dashboard/fleet/financial/cost-analysis' ||
    location.pathname === '/dashboard/fleet/financial/expenses' ||
    location.pathname === '/dashboard/fleet/financial/overview' ||
    location.pathname === '/dashboard/fleet/financial/reports' ||
    location.pathname === '/dashboard/fleet/bids' ||
    location.pathname === '/dashboard/fleet/my-bids' ||
    location.pathname === '/dashboard/fleet/bidding-analytics';

  return (
    <>
      {isSelfAndLayout ? (
        // Dashboard index route has its own layout with welcome section (includes header/footer)
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
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

      {/* Help Center Modal */}
      {showHelpCenter && (
        <HelpCenter
          onClose={() => setShowHelpCenter(false)}
          onRestartTour={() => {
            setShowOnboarding(true);
          }}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <FleetOwnerOnboarding
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Floating Help Button */}
      <FloatingHelpButton />
    </>
  );
};

export default FleetOwnerLayout;
