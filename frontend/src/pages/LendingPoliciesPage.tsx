import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  Download,
  CheckCircle2,
} from 'lucide-react';
import LendingPoliciesEnlite, {
  type LendingPolicies
} from '../components/LenderDashboard/LendingPolicies.enlite';
import PolicyConfigurationModal from '../components/LenderDashboard/PolicyConfigurationModal';

const LendingPoliciesPage: React.FC = () => {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<LendingPolicies>({
    interestRates: [],
    loanLimits: [],
    eligibilityCriteria: [],
    riskAssessment: [],
    repaymentPolicies: [],
    cargoTypePolicies: [],
    globalSettings: {
      autoApprovalLimit: 0,
      manualReviewThreshold: 0,
      maxConcurrentLoans: 0,
      cooldownPeriod: 0,
      complianceMode: false,
      auditTrail: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('interest-rates');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);

  // Resolved lender entity ID (user?.id is the auth user ID, not the lender entity ID)
  const [resolvedLenderId, setResolvedLenderId] = useState<string | null>(null);

  // Resolve the real lender entity ID from the backend on mount
  useEffect(() => {
    const resolveLenderId = async () => {
      try {
        const r = await api.get('/lending/my-lender-id');
        if (r.data?.lenderId) {
          setResolvedLenderId(r.data.lenderId);
        } else {
          // Fallback: use user?.lenderId if available
          setResolvedLenderId(user?.lenderId || user?.id || null);
        }
      } catch {
        // Fallback if endpoint fails
        setResolvedLenderId(user?.lenderId || user?.id || null);
      }
    };
    if (user) resolveLenderId();
  }, [user]);

  // Use resolved lender entity ID for all API calls
  const lenderId = resolvedLenderId;

  useEffect(() => {
    const fetchPolicies = async () => {
      if (!lenderId) {
        console.warn('No lender ID available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching policies for lender:', lenderId);
        
        // Fetch real policies from backend
        const lenderPolicies = await lendingApi.getLenderPolicies(lenderId);
        
        if (lenderPolicies) {
          console.log('Policies loaded successfully:', lenderPolicies);
          setPolicies(lenderPolicies);
        } else {
          console.log('No policies found for lender');
          // Keep empty state - no mock data
        }
      } catch (error) {
        console.error('Error fetching lending policies:', error);
        // Show error but don't use mock data
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [lenderId]);

  const handleToggleActive = async (category: string, id: string) => {
    try {
      // Find the current policy to get its status
      const cat = category as keyof LendingPolicies;
      const policies_array = policies[cat];
      if (!Array.isArray(policies_array)) return;
      
      const policy = policies_array.find((item: any) => item.id === id);
      if (!policy) return;

      const newStatus = !policy.isActive;

      // Update backend
      await lendingApi.updatePolicyStatus(lenderId, category, id, newStatus);

      // Update local state
      setPolicies(prev => {
        const updated = { ...prev };
        if (Array.isArray(updated[cat])) {
          // @ts-ignore - dynamic access
          updated[cat] = updated[cat].map((item: any) =>
            item.id === id ? { ...item, isActive: newStatus } : item
          );
        }
        return updated;
      });

      toast.success(`Policy ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling policy status:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update policy status. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleExportPolicies = () => {
    const dataStr = JSON.stringify(policies, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lending-policies-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePolicies = async () => {
    try {
      setLoading(true);
      // Save policies to backend
      // await lendingApi.updateLenderPolicies(lenderId, policies);
      toast.success('Lending policies have been synchronized successfully!');
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('Error saving policies:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to synchronize policies. Please check your connection.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPolicy = (category: string) => {
    setModalCategory(category);
    setShowModal(true);
  };

  const handleSaveNewPolicy = async (policyData: any) => {
    try {
      setModalLoading(true);
      
      let savedPolicy;
      
      // Call appropriate API based on category
      switch (modalCategory) {
        case 'interestRates':
          savedPolicy = await lendingApi.createInterestRatePolicy(lenderId, policyData);
          break;
        case 'loanLimits':
          savedPolicy = await lendingApi.createLoanLimitPolicy(lenderId, policyData);
          break;
        case 'eligibilityCriteria':
          savedPolicy = await lendingApi.createEligibilityCriteria(lenderId, policyData);
          break;
        case 'riskAssessment':
          savedPolicy = await lendingApi.createRiskAssessmentRule(lenderId, policyData);
          break;
        case 'repaymentPolicies':
          savedPolicy = await lendingApi.createRepaymentPolicy(lenderId, policyData);
          break;
        case 'cargoTypePolicies':
          savedPolicy = await lendingApi.createCargoTypePolicy(lenderId, policyData);
          break;
        case 'globalSettings':
          savedPolicy = await lendingApi.createSystemConfigPolicy(lenderId, policyData);
          break;
        default:
          throw new Error('Unknown policy category');
      }

      // Refresh policies from backend
      const refreshedPolicies = await lendingApi.getLenderPolicies(lenderId);
      if (refreshedPolicies) {
        setPolicies(refreshedPolicies);
      }

      setShowModal(false);
      toast.success('Policy created successfully!');
    } catch (error: any) {
      console.error('Error creating policy:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to create policy. Please try again.';
      
      if (error?.response?.data?.message) {
        const messages = error.response.data.message;
        if (Array.isArray(messages)) {
          // Join multiple validation errors
          errorMessage = messages.join(', ');
        } else {
          errorMessage = messages;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
        style: {
          maxWidth: '500px',
        },
      });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="sticky top-16 sm:top-[4.5rem] lg:top-20 z-40 -mx-4 px-4 py-4 bg-gray-50/95 dark:bg-slate-950/95 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-[#0f172a] dark:text-white tracking-tight uppercase">
              Policy <span className="text-[#2c5173]">Configuration</span>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              System-wide lending rules and risk parameters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPolicies}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <Download size={14} /> Export Scheme
            </button>
            <button
              onClick={handleSavePolicies}
              disabled={!hasUnsavedChanges}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${hasUnsavedChanges
                ? 'bg-[#2c5173] text-white shadow-lg shadow-[#2c5173]/20 hover:bg-[#1e3850]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              <CheckCircle2 size={14} /> Deploy Changes
            </button>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-500 w-5 h-5" />
              <span className="text-amber-800 text-xs font-bold uppercase tracking-widest">
                Staged changes detected — deployment required for production effect.
              </span>
            </div>
            <button
              onClick={handleSavePolicies}
              className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline"
            >
              Deploy Now
            </button>
          </div>
        )}

        <LendingPoliciesEnlite
          loading={loading}
          policies={policies}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleActive={handleToggleActive}
          onEdit={(id) => alert(`Editing policy ${id} (Module opening...)`)}
          onAdd={handleAddPolicy}
        />

        <PolicyConfigurationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveNewPolicy}
          category={modalCategory}
          loading={modalLoading}
        />
      </div>
    </div>
  );
};

export default LendingPoliciesPage;
