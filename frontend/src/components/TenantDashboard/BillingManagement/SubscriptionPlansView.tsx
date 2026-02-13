import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSpinner } from 'react-icons/fa';
import { tenantSubscriptionApi } from '../../../services/tenantSubscriptionApi';
import type { TenantPlan, CreatePlanDto } from '../../../services/tenantSubscriptionApi';
import PlanFormModal from './PlanFormModal';

interface SubscriptionPlansViewProps {
  tenantId: string;
}

const SubscriptionPlansView: React.FC<SubscriptionPlansViewProps> = ({ tenantId }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TenantPlan | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['tenant-plans', tenantId],
    queryFn: () => tenantSubscriptionApi.getPlans(true),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (planId: string) => tenantSubscriptionApi.togglePlanStatus(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-plans'] });
      setSuccess('Plan status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => setError('Failed to update plan status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (planId: string) => tenantSubscriptionApi.deletePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-plans'] });
      setSuccess('Plan deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    },
    onError: () => setError('Failed to delete plan'),
  });

  const handleEdit = (plan: TenantPlan) => {
    setEditingPlan(plan);
    setShowModal(true);
  };

  const handleDelete = async (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deleteMutation.mutate(planId);
    }
  };

  const getDurationLabel = (duration: string) => {
    const labels = { MONTHLY: 'Monthly', QUARTERLY: 'Quarterly', YEARLY: 'Yearly' };
    return labels[duration as keyof typeof labels] || duration;
  };

  const getTargetUserLabel = (target: string) => {
    const labels = { CARGO_OWNER: 'Cargo Owners', TRUCK_OWNER: 'Truck Owners', BOTH: 'Both' };
    return labels[target as keyof typeof labels] || target;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <FaSpinner className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Your Subscription Plans</h4>
          <p className="text-sm text-gray-500">Create and manage plans for your users</p>
        </div>
        <button
          onClick={() => {
            setEditingPlan(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FaPlus />
          <span>Create Plan</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
          <button onClick={() => setSuccess('')} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h5 className="text-lg font-bold text-gray-900">{plan.name}</h5>
                <span
                  className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                    plan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              {plan.isPopular && (
                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
                  Popular
                </span>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
              {plan.description || 'No description'}
            </p>

            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                {plan.price.toLocaleString()} <span className="text-sm text-gray-500">{plan.currency}</span>
              </div>
              <div className="text-sm text-gray-500">per {getDurationLabel(plan.duration)}</div>
            </div>

            <div className="mb-4">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                {getTargetUserLabel(plan.targetUser)}
              </span>
            </div>

            <div className="space-y-2 mb-4 text-sm text-gray-700">
              {plan.maxShipments && <div>• Max Shipments: {plan.maxShipments}</div>}
              {plan.maxTrucks && <div>• Max Trucks: {plan.maxTrucks}</div>}
              {plan.maxDrivers && <div>• Max Drivers: {plan.maxDrivers}</div>}
              {plan.advancedAnalytics && <div>• Advanced Analytics</div>}
              {plan.prioritySupport && <div>• Priority Support</div>}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => toggleStatusMutation.mutate(plan.id)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title={plan.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              >
                {plan.status === 'ACTIVE' ? <FaToggleOn className="text-xl text-green-600" /> : <FaToggleOff className="text-xl" />}
              </button>
              <button
                onClick={() => handleEdit(plan)}
                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                title="Edit"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No subscription plans yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Your First Plan
          </button>
        </div>
      )}

      {/* Plan Form Modal */}
      {showModal && (
        <PlanFormModal
          plan={editingPlan}
          onClose={() => {
            setShowModal(false);
            setEditingPlan(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingPlan(null);
            queryClient.invalidateQueries({ queryKey: ['tenant-plans'] });
            setSuccess(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionPlansView;
