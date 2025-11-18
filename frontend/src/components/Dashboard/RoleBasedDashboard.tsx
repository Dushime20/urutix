import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Dashboard from '../../pages/Dashboard';
import DriverDashboard from '../../pages/DriverDashboard';

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  // Debug logging
  console.log('RoleBasedDashboard: Current user role:', user?.role);

  // Render different dashboard based on user role
  switch (user?.role) {
    case 'DRIVER':
      console.log('RoleBasedDashboard: Rendering Enhanced DriverDashboard');
      return <DriverDashboard />;
    
    case 'CARGO_OWNER':
    case 'TRUCK_OWNER':
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'LENDER':
    default:
      console.log('RoleBasedDashboard: Rendering default Dashboard');
      return <Dashboard />;
  }
};

export default RoleBasedDashboard;
