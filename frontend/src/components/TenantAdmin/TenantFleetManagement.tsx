import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FleetOverview } from '../TenantDashboard';

const TenantFleetManagement: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default-tenant';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your fleet operations, vehicles, and maintenance schedules
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Export Report
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Vehicle
            </button>
          </div>
        </div>
      </div>

      {/* Fleet Overview Component */}
      <FleetOverview tenantId={tenantId} />
    </div>
  );
};

export default TenantFleetManagement;
