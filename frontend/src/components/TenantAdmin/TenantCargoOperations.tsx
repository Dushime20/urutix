import React from 'react';
import { FaDownload, FaPlus } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { CargoAnalytics } from '../TenantDashboard';

const TenantCargoOperations: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'default-tenant';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cargo Operations</h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage cargo shipments, routes, and delivery schedules
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <FaDownload className="w-4 h-4 mr-2" />
              Export Data
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm">
              <FaPlus className="w-4 h-4 mr-2" />
              New Shipment
            </button>
          </div>
        </div>
      </div>

      {/* Cargo Analytics Component */}
      <CargoAnalytics tenantId={tenantId} />
    </div>
  );
};

export default TenantCargoOperations;
