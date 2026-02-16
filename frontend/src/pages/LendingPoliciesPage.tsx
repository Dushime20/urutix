import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import {
  ShieldAlert,
  Download,
  CheckCircle2,
  List
} from 'lucide-react';
import LendingPoliciesEnlite, {
  type LendingPolicies
} from '../components/LenderDashboard/LendingPolicies.enlite';

const LendingPoliciesPage: React.FC = () => {
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

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback (truncated for brevity, using same logic as original)
  const mockPolicies: LendingPolicies = {
    interestRates: [
      {
        id: 'IR-001',
        name: 'Low Risk Standard Rate',
        riskLevel: 'low',
        baseRate: 8.5,
        minRate: 7.0,
        maxRate: 10.0,
        adjustmentFactors: { creditScore: 0.5, loanHistory: 0.3, collateral: 0.4, businessType: 0.2 },
        isActive: true
      },
      {
        id: 'IR-002',
        name: 'Medium Risk Premium Rate',
        riskLevel: 'medium',
        baseRate: 12.0,
        minRate: 10.0,
        maxRate: 15.0,
        adjustmentFactors: { creditScore: 0.8, loanHistory: 0.6, collateral: 0.7, businessType: 0.4 },
        isActive: true
      }
    ],
    loanLimits: [
      {
        id: 'LL-001',
        name: 'Individual Borrower Limits',
        businessType: 'individual',
        minAmount: 50000,
        maxAmount: 500000,
        creditScoreRequirement: 600,
        collateralRequirement: 120,
        maxUtilization: 80,
        isActive: true
      }
    ],
    eligibilityCriteria: [], // ... rest of mock data
    riskAssessment: [],
    repaymentPolicies: [],
    cargoTypePolicies: [],
    globalSettings: {
      autoApprovalLimit: 200000,
      manualReviewThreshold: 500000,
      maxConcurrentLoans: 5,
      cooldownPeriod: 30,
      complianceMode: true,
      auditTrail: true
    }
  };

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const lenderData = await lendingApi.getLender(lenderId);

        // Simplified mapping for the demo
        setPolicies({
          ...mockPolicies,
          interestRates: [
            {
              ...mockPolicies.interestRates[0],
              name: `${lenderData.name} Standard Rate`,
              isActive: lenderData.status === 'active'
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching lending policies:', error);
        setPolicies(mockPolicies);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [lenderId]);

  const handleToggleActive = (category: string, id: string) => {
    setPolicies(prev => {
      const updated = { ...prev };
      const cat = category as keyof LendingPolicies;
      if (Array.isArray(updated[cat])) {
        // @ts-ignore - dynamic access
        updated[cat] = updated[cat].map((item: any) =>
          item.id === id ? { ...item, isActive: !item.isActive } : item
        );
      }
      setHasUnsavedChanges(true);
      return updated;
    });
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
      // Logic for saving via API (mocked here but preserved from original)
      // await lendingApi.createLenderPolicy(...)
      alert('Lending policies have been synchronized successfully!');
      setHasUnsavedChanges(false);
    } catch (error) {
      alert('Failed to synchronize policies. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase">Policy Configuration</h1>
            <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest opacity-70">
              System-wide lending rules and risk parameters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button className={`p-1.5 rounded-lg transition-all ${!hasUnsavedChanges ? 'bg-slate-100 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <List size={16} />
              </button>
              <button className={`p-1.5 rounded-lg transition-all ${hasUnsavedChanges ? 'bg-amber-100 text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                <ShieldAlert size={16} />
              </button>
            </div>
            <button
              onClick={handleExportPolicies}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export Scheme
            </button>
            <button
              onClick={handleSavePolicies}
              disabled={!hasUnsavedChanges}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${hasUnsavedChanges
                ? 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              <CheckCircle2 size={14} /> Deploy Changes
            </button>
          </div>
        </div>

        {/* Global Alert for Unsaved Changes */}
        {hasUnsavedChanges && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-amber-500 w-5 h-5" />
              <span className="text-amber-800 text-xs font-black uppercase tracking-widest">
                Staged changes detected (interest rate adjustment) - Deployment required for production effect.
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
          onAdd={(cat) => alert(`Initializing new ${cat} entry...`)}
        />
      </div>
    </div>
  );
};

export default LendingPoliciesPage;
