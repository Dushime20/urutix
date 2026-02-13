import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FaTimes } from 'react-icons/fa';
import { tenantSubscriptionApi } from '../../../services/tenantSubscriptionApi';
import type { TenantPlan, CreatePlanDto } from '../../../services/tenantSubscriptionApi';

interface PlanFormModalProps {
  plan: TenantPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PlanFormModal: React.FC<PlanFormModalProps> = ({ plan, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreatePlanDto>({
    name: '',
    description: '',
    targetUser: 'BOTH',
    price: 0,
    currency: 'RWF',
    duration: 'MONTHLY',
    maxShipments: undefined,
    maxTrucks: undefined,
    maxDrivers: undefined,
    maxTransactions: undefined,
    advancedAnalytics: false,
    prioritySupport: false,
    apiAccess: false,
    displayOrder: 0,
    isPopular: false,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        description: plan.description,
        targetUser: plan.targetUser,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        maxShipments: plan.maxShipments,
        maxTrucks: plan.maxTrucks,
        maxDrivers: plan.maxDrivers,
        maxTransactions: plan.maxTransactions,
        advancedAnalytics: plan.advancedAnalytics,
        prioritySupport: plan.prioritySupport,
        apiAccess: plan.apiAccess,
        displayOrder: plan.displayOrder,
        isPopular: plan.isPopular,
      });
    }
  }, [plan]);

  const mutation = useMutation({
    mutationFn: (data: CreatePlanDto) =>
      plan
        ? tenantSubscriptionApi.updatePlan(plan.id, data)
        : tenantSubscriptionApi.createPlan(data),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">
              {plan ? 'Edit Plan' : 'Create New Plan'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Users</label>
                <select
                  value={formData.targetUser}
                  onChange={(e) => setFormData({ ...formData, targetUser: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="CARGO_OWNER">Cargo Owners</option>
                  <option value="TRUCK_OWNER">Truck Owners</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Shipments</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxShipments || ''}
                  onChange={(e) => setFormData({ ...formData, maxShipments: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Trucks</label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxTrucks || ''}
                  onChange={(e) => setFormData({ ...formData, maxTrucks: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Unlimited"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.advancedAnalytics}
                      onChange={(e) => setFormData({ ...formData, advancedAnalytics: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Advanced Analytics</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.prioritySupport}
                      onChange={(e) => setFormData({ ...formData, prioritySupport: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Priority Support</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Mark as Popular</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlanFormModal;
