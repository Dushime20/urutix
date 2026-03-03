import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import api from '../../services/api';

interface PricingRule {
  id: string;
  ruleName: string;
  ruleType: 'weight' | 'distance' | 'time' | 'flat';
  unit: string;
  creditCost: number;
  planId?: string;
  tenantId?: string;
  minValue?: number;
  maxValue?: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface RuleFormData {
  ruleName: string;
  ruleType: 'weight' | 'distance' | 'time' | 'flat';
  unit: string;
  creditCost: number;
  minValue?: number;
  maxValue?: number;
  isActive: boolean;
  priority: number;
}

const CreditPricingRules: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    ruleName: '',
    ruleType: 'weight',
    unit: 'ton',
    creditCost: 5,
    isActive: true,
    priority: 0,
  });

  // Fetch pricing rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['pricing-rules'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/pricing-rules');
      return response.data.data || response.data; // Handle both wrapped and unwrapped responses
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: RuleFormData) => {
      const response = await api.post('/subscriptions/pricing-rules', data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Pricing rule created successfully');
      setIsCreating(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create pricing rule');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RuleFormData> }) => {
      const response = await api.patch(`/subscriptions/pricing-rules/${id}`, data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Pricing rule updated successfully');
      setEditingId(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update pricing rule');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/subscriptions/pricing-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Pricing rule deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete pricing rule');
    },
  });

  const resetForm = () => {
    setFormData({
      ruleName: '',
      ruleType: 'weight',
      unit: 'ton',
      creditCost: 5,
      isActive: true,
      priority: 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (rule: PricingRule) => {
    setEditingId(rule.id);
    setFormData({
      ruleName: rule.ruleName,
      ruleType: rule.ruleType,
      unit: rule.unit,
      creditCost: rule.creditCost,
      minValue: rule.minValue,
      maxValue: rule.maxValue,
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      weight: 'Weight-based',
      distance: 'Distance-based',
      time: 'Time-based',
      flat: 'Flat Rate',
    };
    return labels[type] || type;
  };

  return (
    <AdminPageLayout title="Credit Pricing Rules">
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FaInfoCircle className="text-blue-500 mt-1 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Business Rules Configuration</p>
            <p>
              Configure how credits are consumed based on cargo weight, distance, time, or flat rates.
              Example: 1 ton = 5 USD worth of credits.
            </p>
          </div>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Pricing Rule' : 'Create New Pricing Rule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={formData.ruleName}
                    onChange={(e) => setFormData({ ...formData, ruleName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Standard Weight Pricing"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Type
                  </label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="weight">Weight-based</option>
                    <option value="distance">Distance-based</option>
                    <option value="time">Time-based</option>
                    <option value="flat">Flat Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., ton, km, hour"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Cost (per unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.creditCost}
                    onChange={(e) => setFormData({ ...formData, creditCost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Value (optional, for tiered pricing)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.minValue || ''}
                    onChange={(e) => setFormData({ ...formData, minValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Leave empty for no minimum"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Value (optional, for tiered pricing)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.maxValue || ''}
                    onChange={(e) => setFormData({ ...formData, maxValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Leave empty for no maximum"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher priority rules apply first</p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <FaSave />
                  {editingId ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <FaTimes />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Button */}
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <FaPlus />
            Create New Rule
          </button>
        )}

        {/* Rules List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Loading pricing rules...
                    </td>
                  </tr>
                ) : rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      No pricing rules found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  rules.map((rule: PricingRule) => (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rule.ruleName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{getRuleTypeLabel(rule.ruleType)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {rule.creditCost} credits / {rule.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {rule.minValue || rule.maxValue ? (
                            <>
                              {rule.minValue ? `${rule.minValue}+` : ''}
                              {rule.minValue && rule.maxValue ? ' - ' : ''}
                              {rule.maxValue ? `${rule.maxValue}` : ''}
                            </>
                          ) : (
                            'All values'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{rule.priority}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(rule)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default CreditPricingRules;
