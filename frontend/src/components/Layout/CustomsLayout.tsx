import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';
import ModernLoader from '../common/ModernLoader';

const CustomsLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [isLoading, user, navigate]);

  React.useEffect(() => {
    if (!isLoading && user && user.role !== 'CUSTOMS_OFFICER' &&
        user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return <ModernLoader isLoading={true} text="Initializing_Customs_Portal" />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default CustomsLayout;
