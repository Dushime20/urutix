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
import { FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminPageLayout from '../../components/Admin/AdminPageLayout';
import { TranslatedText } from '../../components/translated-text';
import ModernLoader from '../../components/common/ModernLoader';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

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
  pricePerCredit?: number;
  totalCredits?: number;
  creditsPerTonTenant?: number;  // Credits consumed per ton for Tenant Admin
  creditsPerTonTruckOwner?: number;  // Credits consumed per ton for Truck Owner
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
  const { format: fmtFull } = useCurrencyFormat();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>({ features: DEFAULT_FEATURES });
  const [features, setFeatures] = useState<PlanFeatures>(DEFAULT_FEATURES);

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
      setFeatures(plan.features || DEFAULT_FEATURES);
    } else {
      setIsEditMode(false);
      setCurrentPlan({
        name: '',
        slug: '',
        description: '',
        pricePerCredit: 0.15,
        totalCredits: -1,
        creditsPerTonTenant: 2,
        creditsPerTonTruckOwner: 5,
        isActive: true,
        displayOrder: 0,
        features: DEFAULT_FEATURES
      });
      setFeatures(DEFAULT_FEATURES);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentPlan({});
  };

  const savePlan = async () => {
    try {
      const payload = {
        ...currentPlan,
        features: features
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
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <TranslatedText text="Back" />
        </button>
      }
    >
      <div className="space-y-6">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="relative group flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#2c5173] transition-colors" />
            <input
              type="text"
              placeholder="Search plans by name or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#2c5173]/20 focus:bg-white dark:focus:bg-slate-900 transition-all dark:text-slate-200"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-lg text-sm font-semibold transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>

      {/* Grid */}
      {loading ? (
        <div className="py-10">
          <ModernLoader isLoading={true} type="cards" cardsCount={3} />
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
            <div key={plan.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all overflow-hidden relative">
              {/* Status Indicator Bar */}
              <div className={`h-1.5 w-full ${plan.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} />
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white pb-1 group-hover:text-[#2c5173] transition-colors">
                      {plan.name}
                    </h3>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">
                      {plan.slug}
                    </span>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <button 
                      onClick={() => handleOpenModal(plan)}
                      className="p-1.5 text-slate-400 hover:text-[#2c5173] hover:bg-slate-100 dark:hover:bg-slate-900/30 rounded-lg transition-colors"
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
                  <div className="text-center py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Credit Economics</div>
                    <div className="text-2xl font-black text-[#2c5173] dark:text-blue-400">{fmtFull(plan.pricePerCredit || 0.15)}</div>
                    <div className="text-xs text-slate-500">per credit</div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[40px]">
                  {plan.description || 'No description provided.'}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 mt-2 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Price per Credit:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmtFull(plan.pricePerCredit || 0.15)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Max Credits:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {plan.totalCredits === -1 ? 'Unlimited' : (plan.totalCredits || 0).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Credit per Ton</div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Tenant Admin:</span>
                      <span className="font-bold text-[#2c5173] dark:text-blue-400">{plan.creditsPerTonTenant || 2} credits/ton</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Truck Owner:</span>
                      <span className="font-bold text-[#2c5173] dark:text-indigo-400">{plan.creditsPerTonTruckOwner || 5} credits/ton</span>
                    </div>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Plan Slug</label>
                  <input
                    type="text"
                    value={currentPlan.slug || ''}
                    onChange={(e) => setCurrentPlan({...currentPlan, slug: e.target.value})}
                    placeholder="e.g. starter"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={currentPlan.description || ''}
                  onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})}
                  rows={2}
                  placeholder="Brief description of this subscription plan"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white resize-none"
                />
              </div>

              {/* Credit Purchase Configuration */}
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <FaCreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Credit Purchase Settings</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Define how tenants purchase credits from system admin</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Price per Credit</label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentPlan.pricePerCredit ?? ''}
                      onChange={(e) => setCurrentPlan({...currentPlan, pricePerCredit: parseFloat(e.target.value)})}
                      placeholder="0.15"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white"
                    />
                    <p className="text-xs text-slate-500">What tenant pays per credit</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Max Credits Available</label>
                    <input
                      type="number"
                      value={currentPlan.totalCredits ?? ''}
                      onChange={(e) => setCurrentPlan({...currentPlan, totalCredits: parseInt(e.target.value)})}
                      placeholder="-1 for unlimited"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white"
                    />
                    <p className="text-xs text-slate-500">-1 for unlimited credits</p>
                  </div>
                </div>
              </div>

              {/* Credit Consumption Configuration */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FaCreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Credit Consumption Rules</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Define how credits are consumed based on cargo weight (tons)</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Credits per Ton (Tenant Admin)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentPlan.creditsPerTonTenant ?? ''}
                      onChange={(e) => setCurrentPlan({...currentPlan, creditsPerTonTenant: parseFloat(e.target.value)})}
                      placeholder="2"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white"
                    />
                    <p className="text-xs text-slate-500">Credits deducted per ton for tenant</p>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Credits per Ton (Truck Owner)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={currentPlan.creditsPerTonTruckOwner ?? ''}
                      onChange={(e) => setCurrentPlan({...currentPlan, creditsPerTonTruckOwner: parseFloat(e.target.value)})}
                      placeholder="5"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white"
                    />
                    <p className="text-xs text-slate-500">Credits deducted per ton for truck owner</p>
                  </div>
                </div>

                {/* Example Calculation */}
                {currentPlan.creditsPerTonTenant && currentPlan.creditsPerTonTruckOwner && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-blue-700 space-y-2">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Example: 10 Ton Cargo</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Tenant Admin Cost:</span>
                      <span className="font-black text-[#2c5173] dark:text-blue-400">
                        {(currentPlan.creditsPerTonTenant * 10).toFixed(1)} credits
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Truck Owner Cost:</span>
                      <span className="font-black text-[#2c5173] dark:text-indigo-400">
                        {(currentPlan.creditsPerTonTruckOwner * 10).toFixed(1)} credits
                      </span>
                    </div>
                    {currentPlan.pricePerCredit && (
                      <div className="pt-2 border-t border-blue-100 dark:border-blue-800">
                        <div className="flex items-center justify-between text-sm">
                           <span className="text-slate-600 dark:text-slate-400">Tenant's Cost:</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            {fmtFull(currentPlan.creditsPerTonTenant * 10 * currentPlan.pricePerCredit)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={currentPlan.isActive ?? true}
                    onChange={(e) => setCurrentPlan({...currentPlan, isActive: e.target.checked})}
                    className="w-5 h-5 rounded text-[#2c5173] focus:ring-[#2c5173]"
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
                      className="w-20 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-[#2c5173] focus:border-[#2c5173] dark:text-white"
                    />
                </div>
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
                className="px-6 py-2.5 text-sm font-bold bg-[#2c5173] hover:bg-[#1e3850] text-white rounded-xl transition-all active:scale-95"
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
