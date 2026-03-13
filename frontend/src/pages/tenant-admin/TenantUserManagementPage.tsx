import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TenantUserManagement from '../../components/TenantDashboard/TenantUserManagement';

const TenantUserManagementPage: React.FC = () => {
    const { user } = useAuth();

    if (!user?.tenantId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading tenant information...</p>
                </div>
            </div>
        );
    }

    return <TenantUserManagement tenantId={user.tenantId} />;
};

export default TenantUserManagementPage;