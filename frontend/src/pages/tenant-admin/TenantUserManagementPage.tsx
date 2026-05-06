import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TenantUserManagement from '../../components/TenantDashboard/TenantUserManagement';
import ModernLoader from '../../components/common/ModernLoader';

const TenantUserManagementPage: React.FC = () => {
    const { user } = useAuth();

    if (!user?.tenantId) {
        return <ModernLoader isLoading={true} type="page" />;
    }

    return <TenantUserManagement tenantId={user.tenantId} />;
};

export default TenantUserManagementPage;