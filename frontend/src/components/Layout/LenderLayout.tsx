import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';
import ModernLoader from '../common/ModernLoader';

const LenderLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation(); // Unused

  // Redirect to auth if not logged in or not a lender
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'LENDER')) {
      navigate('/auth');
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== 'LENDER') {
    return <ModernLoader isLoading={isLoading || !user} text="Initializing_Session" />;
  }
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
};

export default LenderLayout;
