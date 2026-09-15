import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parkingPortalHomeForRole } from '../../utils/parkingPaths';
import DashboardLayout from './DashboardLayout';
import ModernLoader from '../common/ModernLoader';

const ParkingLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [isLoading, user, navigate]);

  React.useEffect(() => {
    if (isLoading || !user) return;

    const onFees =
      location.pathname.includes('/fees') || new URLSearchParams(location.search).get('tab') === 'fees';
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'TENANT_ADMIN') {
      navigate(parkingPortalHomeForRole(user.role, onFees), { replace: true });
      return;
    }

    if (user.role !== 'PARKING_RESERVATION_MANAGER') {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, user, navigate, location.pathname, location.search]);

  if (isLoading || !user || user.role !== 'PARKING_RESERVATION_MANAGER') {
    return <ModernLoader isLoading={true} text="Initializing_Parking_Portal" />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ParkingLayout;
