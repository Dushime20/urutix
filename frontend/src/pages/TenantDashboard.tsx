import React from 'react';
import TenantDashboard from '../components/TenantDashboard/TenantDashboard';
import { useAuth } from '../contexts/AuthContext';

interface TenantDashboardPageProps {
  defaultView?: 'overview' | 'fleet' | 'cargo' | 'financial' | 'operations' | 'users' | 'truck-owners' | 'trips' | 'settings' | 'bidding' | 'purchase-credits' | 'billing' | 'subscription-plans' | 'communicate' | 'drivers' | 'profile' | 'lenders' | 'kyc';
}

const TenantDashboardPage: React.FC<TenantDashboardPageProps> = ({ defaultView = 'overview' }) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default-tenant';

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950">
      <TenantDashboard tenantId={tenantId} defaultView={defaultView} />
    </div>
  );
};

export default TenantDashboardPage;
