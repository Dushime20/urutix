import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FleetOverview } from '../TenantDashboard';
import { Users } from 'lucide-react';

const TenantFleetManagement: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default-tenant';

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
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
            <button
              onClick={() => window.location.href = '/tenant-admin/truck-owners'}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-bold text-sm flex items-center gap-2 border border-indigo-100 shadow-sm"
            >
              <Users className="w-4 h-4" />
              Owner Credits
            </button>
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
