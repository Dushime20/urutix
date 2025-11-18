import React from 'react';
import TenantDashboard from '../components/TenantDashboard/TenantDashboard';
import { useAuth } from '../contexts/AuthContext';

const TenantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default-tenant';

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantDashboard tenantId={tenantId} />
    </div>
  );
};

export default TenantDashboardPage;
