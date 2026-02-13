import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff,
  FaUsers, FaDollarSign, FaChartLine, FaClock,
  FaTruck, FaBox, FaStar, FaCheckCircle
} from 'react-icons/fa';
import { tenantSubscriptionApi } from '../../../services/tenantSubscriptionApi';
import type { TenantPlan, CreatePlanDto } from '../../../services/tenantSubscriptionApi';
import SubscriptionDashboardView from './SubscriptionDashboardView';
import SubscriptionPlansView from './SubscriptionPlansView';

interface TenantSubscriptionPlansTabProps {
  tenantId: string;
}

const TenantSubscriptionPlansTab: React.FC<TenantSubscriptionPlansTabProps> = ({ tenantId }) => {
  const [view, setView] = useState<'dashboard' | 'plans'>('dashboard');

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Subscription Plans Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage subscription plans for your Cargo Owners and Truck Owners
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-white border border-gray-300 rounded-lg p-1 flex">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'dashboard'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaChartLine className="inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setView('plans')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'plans'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FaBox className="inline mr-2" />
              Manage Plans
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'dashboard' ? (
        <SubscriptionDashboardView tenantId={tenantId} />
      ) : (
        <SubscriptionPlansView tenantId={tenantId} />
      )}
    </div>
  );
};

export default TenantSubscriptionPlansTab;
