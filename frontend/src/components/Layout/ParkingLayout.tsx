import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';
import ModernLoader from '../common/ModernLoader';

const ALLOWED = ['PARKING_RESERVATION_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'TENANT_ADMIN'];

const ParkingLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [isLoading, user, navigate]);

  React.useEffect(() => {
    if (!isLoading && user && !ALLOWED.includes(user.role)) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return <ModernLoader isLoading={true} text="Initializing_Parking_Portal" />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default ParkingLayout;
