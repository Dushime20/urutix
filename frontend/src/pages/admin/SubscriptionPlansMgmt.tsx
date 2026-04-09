import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search,
  Plus,
  Edit2,
  Trash2,
  Activity,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';

// --- Interfaces ---
interface PlanFeatures {
  maxTrucks?: number;
  maxUsers?: number;
  maxDrivers?: number;
  maxLoadsPerMonth?: number;
  aiMatching?: boolean;
  advancedAnalytics?: boolean;
  brokerManagement?: boolean;
  apiAccess?: boolean;
  prioritySupport?: boolean;
  [key: string]: any;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  includedCredits: number;
  features: PlanFeatures;
  isActive: boolean;
  displayOrder: number;
}

const DEFAULT_FEATURES: PlanFeatures = {
  maxTrucks: 1,
  maxUsers: 1,
  maxDrivers: 1,
  maxLoadsPerMonth: 10,
  aiMatching: false,
  advancedAnalytics: false,
  brokerManagement: false,
  apiAccess: false,
  prioritySupport: false
};

const SubscriptionPlansMgmt: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>({ features: DEFAULT_FEATURES });
  const [featuresInput, setFeaturesInput] = useState<string>(JSON.stringify(DEFAULT_FEATURES, null, 2));

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/subscription-plans');
      if (response.data && response.data.data) {
        setPlans(response.data.data);
      } else {
        setPlans([]);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setIsEditMode(true);
      setCurrentPlan(plan);
      setFeaturesInput(JSON.stringify(plan.features || {}, null, 2));
    } else {
      setIsEditMode(false);
      setCurrentPlan({
        name: '',
        slug: '',
        description: '',
        priceMonthly: 0,
        priceYearly: 0,
        includedCredits: 0,
        isActive: true,
        displayOrder: 0,
        features: DEFAULT_FEATURES
      });
      setFeaturesInput(JSON.stringify(DEFAULT_FEATURES, null, 2));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPlan({});
  };

  const savePlan = async () => {
    try {
      let parsedFeatures = {};
      try {
        parsedFeatures = JSON.parse(featuresInput);
      } catch (e) {
        toast.error('Invalid JSON in features field');
        return;
      }

      const payload = {
        ...currentPlan,
        features: parsedFeatures
      };

      if (isEditMode && currentPlan.id) {
        await api.patch(`/admin/subscription-plans/${currentPlan.id}`, payload);
        toast.success('Subscription plan updated successfully');
      } else {
        await api.post('/admin/subscription-plans', payload);
        toast.success('Subscription plan created successfully');
      }
      handleCloseModal();
      fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save subscription plan');
    }
  };

  const deletePlan = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the "${name}" plan? Active subscriptions using it may be affected.`)) {
      try {
        await api.delete(`/admin/subscription-plans/${id}`);
        toast.success('Subscription plan deleted/deactivated successfully');
        fetchPlans();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete subscription plan');
      }
    }
  };

  const filteredPlans = plans.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminPageLayout
      title={<TranslatedText text="Subscription Plans Management" />}
      description={<TranslatedText text="Create and configure subscription tiers for your platform users." />}
      actions={
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <TranslatedText text="Back" />
        </button>
      }
    >
      <div className="space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="relative group flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search plans by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-slate-200"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No plans found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Create a new subscription plan to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden relative">
              {/* Status Indicator Bar */}
              <div className={`h-1.5 w-full ${plan.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-1 group-hover:text-indigo-600 transition-colors">
                      {plan.name}
                    </h3>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                      {plan.slug}
                    </span>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button 
                      onClick={() => handleOpenModal(plan)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deletePlan(plan.id, plan.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">${plan.priceMonthly}</span>
                    <span className="text-sm font-semibold text-slate-500">/mo</span>
                  </div>
                  {plan.priceYearly && (
                    <span className="text-sm text-slate-500">
                      or ${plan.priceYearly}/yr (${Math.round(plan.priceYearly/12)}/mo)
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[40px]">
                  {plan.description || 'No description provided.'}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 mt-2 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Included Credits:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      {plan.includedCredits}
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">Credits</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Max Users:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{plan.features?.maxUsers || 'Unlimited'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Max Trucks:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{plan.features?.maxTrucks || 'Unlimited'}</span>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Display Order:</span>
                      <span>#{plan.displayOrder || 0}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Plan Name</label>
                  <input
                    type="text"
                    value={currentPlan.name || ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})}
                    placeholder="e.g. Starter"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Plan Slug</label>
                  <input
                    type="text"
                    value={currentPlan.slug || ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, slug: e.target.value})}
                    placeholder="e.g. starter"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={currentPlan.description || ''}
                  onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Monthly Price ($)</label>
                  <input
                    type="number"
                    value={currentPlan.priceMonthly ?? ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, priceMonthly: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Yearly Price ($)</label>
                  <input
                    type="number"
                    value={currentPlan.priceYearly ?? ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, priceYearly: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Included Credits</label>
                  <input
                    type="number"
                    value={currentPlan.includedCredits ?? ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, includedCredits: parseInt(e.target.value)})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={currentPlan.isActive ?? true}
                    onChange={(e) => setCurrentPlan({...currentPlan, isActive: e.target.checked})}
                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-900 dark:text-white mb-0 cursor-pointer">
                    Plan is Active (visible to users)
                  </label>
                </div>
                <div className="space-y-1.5 flex items-center justify-end gap-3">
                     <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Display Order</label>
                    <input
                      type="number"
                      value={currentPlan.displayOrder ?? 0}
                      onChange={(e) => setCurrentPlan({...currentPlan, displayOrder: parseInt(e.target.value)})}
                      className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                    />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                   <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Features (JSON)</label>
                   <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Format strictly</span>
                </div>
                <textarea
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 text-emerald-400 resize-none"
                />
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                className="px-6 py-2.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg rounded-xl transition-all active:scale-95"
              >
                {isEditMode ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </AdminPageLayout>
  );
};

export default SubscriptionPlansMgmt;
