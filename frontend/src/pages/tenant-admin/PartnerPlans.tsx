import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCrown,
  FaRocket,
  FaTimes,
  FaSave,
  FaInfoCircle,
} from 'react-icons/fa';
import ModernLoader from '../../components/common/ModernLoader';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import CurrencySelector from '../../components/common/CurrencySelector';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerCredit: number;
  creditCostPerPartner: number; // Credits required per partner slot
  availableSlots: number; // Number of partners who can purchase this plan
  totalCredits: number; // Total credits allocated (creditCostPerPartner × availableSlots)
  creditsPerTonTruckOwner: number;
  parentSubscriptionId?: string;
  isActive: boolean;
  features: any;
  limits: any;
}

interface ParentSubscription {
  id: string;
  plan: {
    name: string;
    pricePerCredit: number;
    totalCredits: number;
    creditsPerTonTruckOwner: number;
  };
  availableCredits: number; // Credits not yet allocated to partner plans
}

const PartnerPlans: React.FC = () => {
  const queryClient = useQueryClient();
  const { format: fmtFull } = useCurrencyFormat();
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    totalCredits: '',
    availableSlots: '',
    isActive: true,
  });

  // Fetch tenant's purchased subscriptions (parent subscriptions)
  const { data: parentSubscriptions } = useQuery({
    queryKey: ['parent-subscriptions'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/my-subscriptions');
      return response.data;
    },
  });

  // Fetch partner plans created by tenant
  const { data: partnerPlans, isLoading } = useQuery({
    queryKey: ['partner-plans'],
    queryFn: async () => {
      const response = await api.get('/subscriptions/partner-plans');
      return response.data;
    },
  });

  // Create partner plan mutation
  const createPlan = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/subscriptions/partner-plans', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Partner plan created successfully!');
      queryClient.invalidateQueries({ queryKey: ['partner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['parent-subscriptions'] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create partner plan');
    },
  });

  // Update partner plan mutation
  const updatePlan = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/subscriptions/partner-plans/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Partner plan updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['partner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['parent-subscriptions'] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update partner plan');
    },
  });

  // Delete partner plan mutation
  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/subscriptions/partner-plans/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Partner plan deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['partner-plans'] });
      queryClient.invalidateQueries({ queryKey: ['parent-subscriptions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete partner plan');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      totalCredits: '',
      availableSlots: '',
      isActive: true,
    });
    setSelectedParent('');
    setEditingPlan(null);
  };

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setSelectedParent(plan.parentSubscriptionId || '');
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        totalCredits: plan.creditCostPerPartner.toString(),
        availableSlots: plan.availableSlots.toString(),
        isActive: plan.isActive,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedParent) {
      toast.error('Please select a parent subscription');
      return;
    }

    const parent = parentSubscriptions?.data?.find((s: any) => s.id === selectedParent);
    if (!parent) {
      toast.error('Invalid parent subscription');
      return;
    }

    const creditCostPerPartner = parseInt(formData.totalCredits);
    const availableSlots = parseInt(formData.availableSlots);
    const totalAllocation = creditCostPerPartner * availableSlots;

    // Validate total allocation doesn't exceed available credits
    if (totalAllocation > parent.availableCredits) {
      toast.error(`Total allocation (${totalAllocation.toLocaleString()} credits) exceeds available credits (${parent.availableCredits.toLocaleString()})`);
      return;
    }

    const planData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      parentSubscriptionId: selectedParent,
      pricePerCredit: parent.plan.pricePerCredit, // Inherited from parent
      creditCostPerPartner,
      availableSlots,
      totalCredits: totalAllocation, // Calculated: creditCostPerPartner × availableSlots
      creditsPerTonTruckOwner: parent.plan.creditsPerTonTruckOwner, // Inherited from parent
      isActive: formData.isActive,
    };

    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, data: planData });
    } else {
      createPlan.mutate(planData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this partner plan?')) {
      deletePlan.mutate(id);
    }
  };

  const plans: SubscriptionPlan[] = partnerPlans?.data || [];
  const parents: ParentSubscription[] = parentSubscriptions?.data || [];

  const selectedParentDetails = parents.find(p => p.id === selectedParent);

  const getParentInfo = (parentId?: string) => {
    return parents.find(p => p.id === parentId);
  };

  if (isLoading) {
    return <ModernLoader isLoading={true} type="cards" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-8 border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-sm">
              <FaCrown className="w-6 h-6 text-[#345E85]" />
            </div>
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Partner Management
              </h3>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Truck Owner Plans
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CurrencySelector variant="full" />
            <button
            onClick={() => handleOpenModal()}
            disabled={parents.length === 0}
            className="px-6 py-3.5 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="text-xs" />
            Create Partner Plan
          </button>
          </div>

        {/* Parent Subscriptions Summary */}
        {parents.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4">
            {parents.map((parent) => (
              <div key={parent.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[20px] p-5 border border-blue-100">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {parent.plan.name}
                </div>
                <div className="text-2xl font-black text-[#345E85] tracking-tight">
                  {parent.availableCredits?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Credits available for allocation
                </p>
              </div>
            ))}
          </div>
        )}

        {parents.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex items-start gap-4">
            <FaInfoCircle className="text-yellow-600 text-xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">No Parent Subscription</h3>
              <p className="text-sm text-yellow-800">
                You need to purchase a subscription plan first before creating partner plans for truck owners.
              </p>
              <button
                onClick={() => window.location.href = '/tenant-admin/subscription-plans'}
                className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition-all font-bold text-xs uppercase tracking-widest"
              >
                Purchase Subscription
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      {plans.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const parent = getParentInfo(plan.parentSubscriptionId);
            return (
              <div
                key={plan.id}
                className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[16px] bg-blue-50 flex items-center justify-center">
                      <FaRocket className="text-xl text-[#345E85]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {plan.slug}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    plan.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
                  {plan.description}
                </p>

                {parent && (
                  <div className="bg-blue-50/50 rounded-xl p-3 mb-4 border border-blue-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Parent: {parent.plan.name}
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold">Price per Credit:</span>
                    <span className="font-black text-[#345E85]">
                      {fmtFull(Number(plan.pricePerCredit))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold">Credits Per Partner:</span>
                    <span className="font-black text-blue-600">
                      {plan.creditCostPerPartner.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold">Available Slots:</span>
                    <span className="font-black text-purple-600">
                      {plan.availableSlots} partners
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">Total Allocation:</span>
                    <span className="font-black text-emerald-600">
                      {plan.totalCredits.toLocaleString()} credits
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-semibold">Credits/Ton:</span>
                    <span className="font-bold text-slate-700">
                      {Number(plan.creditsPerTonTruckOwner).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenModal(plan)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <FaEdit className="text-xs" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <FaTrash className="text-xs" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : parents.length > 0 ? (
        <div className="bg-white rounded-[32px] p-12 text-center border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
            <FaCrown className="text-4xl text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
            No Partner Plans Yet
          </h3>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            Create partner plans to allow truck owners to purchase credits from your allocation.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-8 py-4 bg-[#345E85] text-white rounded-2xl hover:bg-[#2a4d6d] transition-all font-black text-[11px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2"
          >
            <FaPlus />
            Create Your First Plan
          </button>
        </div>
      ) : null}

      {/* Create/Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {editingPlan ? 'Edit Partner Plan' : 'Create Partner Plan'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Parent Subscription Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Parent Subscription *
                </label>
                <select
                  required
                  value={selectedParent}
                  onChange={(e) => setSelectedParent(e.target.value)}
                  disabled={!!editingPlan}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85] disabled:opacity-50"
                >
                  <option value="">Select parent subscription</option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.plan.name} - {parent.availableCredits} credits available
                    </option>
                  ))}
                </select>
                {selectedParentDetails && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs text-blue-800">
                      <div className="font-bold mb-1">Inherited Values:</div>
                      <div>Price per Credit: {fmtFull(Number(selectedParentDetails.plan.pricePerCredit))}</div>
                      <div>Credits per Ton: {Number(selectedParentDetails.plan.creditsPerTonTruckOwner).toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    placeholder="e.g., Starter Plan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                    placeholder="e.g., starter-plan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                  placeholder="Describe what this plan offers..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Total Credits *
                </label>
                <input
                  type="number"
                  required
                  value={formData.totalCredits}
                  onChange={(e) => setFormData({ ...formData, totalCredits: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                  placeholder="1000"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Credits required per partner slot
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Available Slots *
                </label>
                <input
                  type="number"
                  required
                  value={formData.availableSlots}
                  onChange={(e) => setFormData({ ...formData, availableSlots: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#345E85] focus:border-[#345E85]"
                  placeholder="4"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Number of partners who can purchase this plan
                </p>
              </div>

              {/* Allocation Summary */}
              {formData.totalCredits && formData.availableSlots && selectedParent && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Allocation Summary</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Credits Per Partner:</span>
                      <span className="font-bold text-slate-900">{parseInt(formData.totalCredits).toLocaleString()} credits</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Available Slots:</span>
                      <span className="font-bold text-slate-900">{parseInt(formData.availableSlots)} partners</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-semibold">Total Allocation:</span>
                        <span className="font-black text-blue-600">
                          {(parseInt(formData.totalCredits) * parseInt(formData.availableSlots)).toLocaleString()} credits
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-slate-600">Available from Parent:</span>
                        <span className={`font-bold ${
                          (parseInt(formData.totalCredits) * parseInt(formData.availableSlots)) > (parentSubscriptions?.data?.find((s: any) => s.id === selectedParent)?.availableCredits || 0)
                            ? 'text-red-600'
                            : 'text-emerald-600'
                        }`}>
                          {(parentSubscriptions?.data?.find((s: any) => s.id === selectedParent)?.availableCredits || 0).toLocaleString()} credits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#345E85] border-slate-300 rounded focus:ring-[#345E85]"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">
                  Plan is active and available for purchase
                </label>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createPlan.isPending || updatePlan.isPending}
                className="px-8 py-3 text-sm font-black bg-[#345E85] hover:bg-[#2a4d6d] text-white shadow-md hover:shadow-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-2"
              >
                <FaSave />
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PartnerPlans;
