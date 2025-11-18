import React, { useState, useEffect } from 'react';
import { lendingApi } from '../services/lending/lendingApi';
import { 
  FaCog, 
  FaShieldAlt,
  FaPercent,
  FaDollarSign,
  FaUsers,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaPlus,
  FaBalanceScale,
  FaTruck,
  FaDownload,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';

interface InterestRatePolicy {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  baseRate: number;
  minRate: number;
  maxRate: number;
  adjustmentFactors: {
    creditScore: number;
    loanHistory: number;
    collateral: number;
    businessType: number;
  };
  isActive: boolean;
}

interface LoanLimitPolicy {
  id: string;
  name: string;
  businessType: 'individual' | 'sme' | 'corporation' | 'cooperative';
  minAmount: number;
  maxAmount: number;
  creditScoreRequirement: number;
  collateralRequirement: number;
  maxUtilization: number;
  isActive: boolean;
}

interface EligibilityCriteria {
  id: string;
  category: 'credit_score' | 'business_age' | 'revenue' | 'collateral' | 'guarantor' | 'documents';
  name: string;
  description: string;
  requirement: string;
  minimumValue?: number;
  maximumValue?: number;
  required: boolean;
  isActive: boolean;
}

interface RiskAssessmentRule {
  id: string;
  factor: string;
  weight: number;
  scoringCriteria: {
    excellent: { min: number; max: number; score: number };
    good: { min: number; max: number; score: number };
    fair: { min: number; max: number; score: number };
    poor: { min: number; max: number; score: number };
  };
  isActive: boolean;
}

interface RepaymentPolicy {
  id: string;
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  gracePeriod: number;
  lateFee: number;
  penaltyRate: number;
  maxExtensions: number;
  defaultThreshold: number;
  isActive: boolean;
}

interface CargoTypePolicy {
  id: string;
  cargoType: string;
  riskMultiplier: number;
  maxLoanAmount: number;
  insuranceRequired: boolean;
  specialConditions: string[];
  isActive: boolean;
}

interface LendingPolicies {
  interestRates: InterestRatePolicy[];
  loanLimits: LoanLimitPolicy[];
  eligibilityCriteria: EligibilityCriteria[];
  riskAssessment: RiskAssessmentRule[];
  repaymentPolicies: RepaymentPolicy[];
  cargoTypePolicies: CargoTypePolicy[];
  globalSettings: {
    autoApprovalLimit: number;
    manualReviewThreshold: number;
    maxConcurrentLoans: number;
    cooldownPeriod: number;
    complianceMode: boolean;
    auditTrail: boolean;
  };
}

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
  const [error, setError] = useState<string | null>(null);

  // Lender ID - would typically come from context or auth
  const lenderId = "89fa1340-429e-448f-a19d-0e987679d7cd";

  // Mock data for fallback
  const mockPolicies: LendingPolicies = {
    interestRates: [
      {
        id: 'IR-001',
        name: 'Low Risk Standard Rate',
        riskLevel: 'low',
        baseRate: 8.5,
        minRate: 7.0,
        maxRate: 10.0,
        adjustmentFactors: {
          creditScore: 0.5,
          loanHistory: 0.3,
          collateral: 0.4,
          businessType: 0.2
        },
        isActive: true
      },
      {
        id: 'IR-002',
        name: 'Medium Risk Premium Rate',
        riskLevel: 'medium',
        baseRate: 12.0,
        minRate: 10.0,
        maxRate: 15.0,
        adjustmentFactors: {
          creditScore: 0.8,
          loanHistory: 0.6,
          collateral: 0.7,
          businessType: 0.4
        },
        isActive: true
      },
      {
        id: 'IR-003',
        name: 'High Risk Premium Rate',
        riskLevel: 'high',
        baseRate: 18.0,
        minRate: 15.0,
        maxRate: 25.0,
        adjustmentFactors: {
          creditScore: 1.2,
          loanHistory: 1.0,
          collateral: 1.5,
          businessType: 0.8
        },
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
      },
      {
        id: 'LL-002',
        name: 'SME Borrower Limits',
        businessType: 'sme',
        minAmount: 100000,
        maxAmount: 2000000,
        creditScoreRequirement: 650,
        collateralRequirement: 110,
        maxUtilization: 85,
        isActive: true
      },
      {
        id: 'LL-003',
        name: 'Corporate Borrower Limits',
        businessType: 'corporation',
        minAmount: 500000,
        maxAmount: 10000000,
        creditScoreRequirement: 700,
        collateralRequirement: 100,
        maxUtilization: 90,
        isActive: true
      }
    ],
    eligibilityCriteria: [
      {
        id: 'EC-001',
        category: 'credit_score',
        name: 'Minimum Credit Score',
        description: 'Borrower must have a minimum credit score to qualify for loans',
        requirement: 'Credit score must be at least 600',
        minimumValue: 600,
        required: true,
        isActive: true
      },
      {
        id: 'EC-002',
        category: 'business_age',
        name: 'Business Operating Period',
        description: 'Business must be operational for minimum period',
        requirement: 'Business must be operational for at least 12 months',
        minimumValue: 12,
        required: true,
        isActive: true
      },
      {
        id: 'EC-003',
        category: 'documents',
        name: 'Required Documentation',
        description: 'All required documents must be verified',
        requirement: 'National ID, Business License, Bank Statements, Tax Certificate',
        required: true,
        isActive: true
      }
    ],
    riskAssessment: [
      {
        id: 'RA-001',
        factor: 'Credit Score',
        weight: 35,
        scoringCriteria: {
          excellent: { min: 750, max: 850, score: 100 },
          good: { min: 650, max: 749, score: 80 },
          fair: { min: 550, max: 649, score: 60 },
          poor: { min: 300, max: 549, score: 30 }
        },
        isActive: true
      },
      {
        id: 'RA-002',
        factor: 'Payment History',
        weight: 25,
        scoringCriteria: {
          excellent: { min: 95, max: 100, score: 100 },
          good: { min: 85, max: 94, score: 80 },
          fair: { min: 70, max: 84, score: 60 },
          poor: { min: 0, max: 69, score: 30 }
        },
        isActive: true
      },
      {
        id: 'RA-003',
        factor: 'Debt-to-Income Ratio',
        weight: 20,
        scoringCriteria: {
          excellent: { min: 0, max: 20, score: 100 },
          good: { min: 21, max: 35, score: 80 },
          fair: { min: 36, max: 50, score: 60 },
          poor: { min: 51, max: 100, score: 30 }
        },
        isActive: true
      }
    ],
    repaymentPolicies: [
      {
        id: 'RP-001',
        name: 'Standard Monthly Repayment',
        frequency: 'monthly',
        gracePeriod: 5,
        lateFee: 50000,
        penaltyRate: 2.5,
        maxExtensions: 2,
        defaultThreshold: 90,
        isActive: true
      },
      {
        id: 'RP-002',
        name: 'Weekly Short-Term Repayment',
        frequency: 'weekly',
        gracePeriod: 2,
        lateFee: 15000,
        penaltyRate: 1.5,
        maxExtensions: 1,
        defaultThreshold: 21,
        isActive: true
      }
    ],
    cargoTypePolicies: [
      {
        id: 'CT-001',
        cargoType: 'Electronics',
        riskMultiplier: 1.0,
        maxLoanAmount: 1000000,
        insuranceRequired: true,
        specialConditions: ['Temperature controlled transport', 'Theft insurance required'],
        isActive: true
      },
      {
        id: 'CT-002',
        cargoType: 'Perishable Goods',
        riskMultiplier: 1.3,
        maxLoanAmount: 800000,
        insuranceRequired: true,
        specialConditions: ['Cold chain compliance', 'Expiry date tracking', 'Quick delivery required'],
        isActive: true
      },
      {
        id: 'CT-003',
        cargoType: 'Hazardous Materials',
        riskMultiplier: 2.0,
        maxLoanAmount: 500000,
        insuranceRequired: true,
        specialConditions: ['Special handling license', 'Emergency response plan', 'Environmental compliance'],
        isActive: true
      }
    ],
    globalSettings: {
      autoApprovalLimit: 200000,
      manualReviewThreshold: 500000,
      maxConcurrentLoans: 5,
      cooldownPeriod: 30,
      complianceMode: true,
      auditTrail: true
    }
  };

  // Load lending policies on component mount
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get lender information which might contain policy data
        const lenderData = await lendingApi.getLender(lenderId);
        
        // Since the current API doesn't have detailed policy endpoints,
        // we'll create a policy structure based on available lender data
        // and enhance with mock data for missing parts
        
        // For now, we'll use mock data but this can be extended when 
        // policy-specific endpoints are available
        const enhancedPolicies: LendingPolicies = {
          interestRates: [
            {
              id: 'IR-001',
              name: `${lenderData.name} Standard Rate`,
              riskLevel: 'low',
              baseRate: 8.5, // Could come from lender policy
              minRate: 7.0,
              maxRate: 10.0,
              adjustmentFactors: {
                creditScore: 0.5,
                loanHistory: 0.3,
                collateral: 0.4,
                businessType: 0.2
              },
              isActive: lenderData.status === 'active'
            }
          ],
          loanLimits: mockPolicies.loanLimits,
          eligibilityCriteria: mockPolicies.eligibilityCriteria,
          riskAssessment: mockPolicies.riskAssessment,
          repaymentPolicies: mockPolicies.repaymentPolicies,
          cargoTypePolicies: mockPolicies.cargoTypePolicies,
          globalSettings: mockPolicies.globalSettings
        };

        setPolicies(enhancedPolicies);
      } catch (error) {
        console.error('Error fetching lending policies:', error);
        setError('Failed to load lending policies');
        
        // Fallback to mock data
        setPolicies(mockPolicies);
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [lenderId]);

  // Handler to update policies via API
  const handleUpdatePolicy = async (updatedPolicies: LendingPolicies) => {
    try {
      // Extract key policy values for the API
      const primaryRate = updatedPolicies.interestRates[0];
      const primaryLimit = updatedPolicies.loanLimits[0];
      
      if (primaryRate && primaryLimit) {
        await lendingApi.createLenderPolicy(lenderId, {
          interest_rate: primaryRate.baseRate,
          repayment_term_days: 90, // Default value, could be extracted from repaymentPolicies
          max_advance_per_trip: primaryLimit.maxAmount || 100000,
          max_exposure: updatedPolicies.globalSettings.autoApprovalLimit || 1000000,
          advance_percentage: 80 // Could be extracted from policies
        });
      }

      setPolicies(updatedPolicies);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error updating lending policies:', error);
      setError('Failed to update lending policies');
    }
  };

  const [activeTab, setActiveTab] = useState<string>('interest-rates');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleAddPolicy = () => {
    // For demo purposes, we'll just close the modal and show a success message
    // In a real implementation, this would add the new policy to the state
    setShowAddModal(null);
    setHasUnsavedChanges(true);
    
    // You could add a toast notification here
    alert('Policy added successfully! (Demo mode - changes not persisted)');
  };

  const tabs = [
    { id: 'interest-rates', name: 'Interest Rates', icon: <FaPercent className="h-4 w-4" /> },
    { id: 'loan-limits', name: 'Loan Limits', icon: <FaDollarSign className="h-4 w-4" /> },
    { id: 'eligibility', name: 'Eligibility Criteria', icon: <FaUsers className="h-4 w-4" /> },
    { id: 'risk-assessment', name: 'Risk Assessment', icon: <FaBalanceScale className="h-4 w-4" /> },
    { id: 'repayment', name: 'Repayment Policies', icon: <FaCalendarAlt className="h-4 w-4" /> },
    { id: 'cargo-types', name: 'Cargo Policies', icon: <FaTruck className="h-4 w-4" /> },
    { id: 'global-settings', name: 'Global Settings', icon: <FaCog className="h-4 w-4" /> }
  ];

  const formatCurrency = (amount: number): string => {
    return `RWF ${(amount / 1000).toLocaleString()}K`;
  };

  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'critical': return 'bg-red-200 text-red-900 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSavePolicies = async () => {
    try {
      await handleUpdatePolicy(policies);
      alert('Lending policies have been saved successfully!');
    } catch (error) {
      alert('Failed to save lending policies. Please try again.');
    }
  };

  const handleToggleActive = (category: string, id: string) => {
    setPolicies(prev => {
      const updated = { ...prev };
      switch (category) {
        case 'interestRates':
          updated.interestRates = updated.interestRates.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          );
          break;
        case 'loanLimits':
          updated.loanLimits = updated.loanLimits.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          );
          break;
        case 'eligibilityCriteria':
          updated.eligibilityCriteria = updated.eligibilityCriteria.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          );
          break;
        case 'riskAssessment':
          updated.riskAssessment = updated.riskAssessment.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          );
          break;
        case 'repaymentPolicies':
          updated.repaymentPolicies = updated.repaymentPolicies.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          );
          break;
        case 'cargoTypePolicies':
          updated.cargoTypePolicies = updated.cargoTypePolicies.map(item =>
            item.id === id ? { ...item, isActive: !item.isActive } : item
          );
          break;
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
    link.download = 'lending-policies.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderInterestRatesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Interest Rate Policies</h3>
          <p className="text-gray-600">Configure interest rates based on risk levels and borrower profiles</p>
        </div>
        <button
          onClick={() => setShowAddModal('interest-rate')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus className="h-4 w-4" />
          Add Rate Policy
        </button>
      </div>

      <div className="grid gap-6">
        {policies.interestRates.map((policy) => (
          <div key={policy.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaPercent className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{policy.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(policy.riskLevel)}`}>
                      {policy.riskLevel.toUpperCase()} RISK
                    </span>
                    <button
                      onClick={() => handleToggleActive('interestRates', policy.id)}
                      className="flex items-center gap-1"
                    >
                      {policy.isActive ? (
                        <FaToggleOn className="h-5 w-5 text-green-500" />
                      ) : (
                        <FaToggleOff className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600">
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(policy.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Base Rate</p>
                <p className="text-lg font-semibold text-gray-900">{formatPercentage(policy.baseRate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Min Rate</p>
                <p className="text-lg font-semibold text-green-600">{formatPercentage(policy.minRate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Max Rate</p>
                <p className="text-lg font-semibold text-red-600">{formatPercentage(policy.maxRate)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${policy.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {policy.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Adjustment Factors</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Credit Score</p>
                  <p className="text-sm font-medium text-gray-900">+{formatPercentage(policy.adjustmentFactors.creditScore)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Loan History</p>
                  <p className="text-sm font-medium text-gray-900">+{formatPercentage(policy.adjustmentFactors.loanHistory)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Collateral</p>
                  <p className="text-sm font-medium text-gray-900">+{formatPercentage(policy.adjustmentFactors.collateral)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Business Type</p>
                  <p className="text-sm font-medium text-gray-900">+{formatPercentage(policy.adjustmentFactors.businessType)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLoanLimitsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Loan Limit Policies</h3>
          <p className="text-gray-600">Configure lending limits based on borrower business types</p>
        </div>
        <button
          onClick={() => setShowAddModal('loan-limit')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus className="h-4 w-4" />
          Add Limit Policy
        </button>
      </div>

      <div className="grid gap-6">
        {policies.loanLimits.map((policy) => (
          <div key={policy.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{policy.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      {policy.businessType.toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleToggleActive('loanLimits', policy.id)}
                      className="flex items-center gap-1"
                    >
                      {policy.isActive ? (
                        <FaToggleOn className="h-5 w-5 text-green-500" />
                      ) : (
                        <FaToggleOff className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600">
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(policy.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Min Amount</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(policy.minAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Max Amount</p>
                <p className="text-lg font-semibold text-red-600">{formatCurrency(policy.maxAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Credit Score Req.</p>
                <p className="text-lg font-semibold text-blue-600">{policy.creditScoreRequirement}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Collateral Req.</p>
                <p className="text-lg font-semibold text-purple-600">{policy.collateralRequirement}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Max Utilization</p>
                <p className="text-lg font-semibold text-orange-600">{policy.maxUtilization}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${policy.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {policy.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEligibilityTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Eligibility Criteria</h3>
          <p className="text-gray-600">Configure borrower eligibility requirements</p>
        </div>
        <button
          onClick={() => setShowAddModal('eligibility')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus className="h-4 w-4" />
          Add Criteria
        </button>
      </div>

      <div className="grid gap-4">
        {policies.eligibilityCriteria.map((criteria) => (
          <div key={criteria.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaUsers className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-medium text-gray-900">{criteria.name}</h4>
                    {criteria.required && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                    <button
                      onClick={() => handleToggleActive('eligibilityCriteria', criteria.id)}
                      className="flex items-center gap-1"
                    >
                      {criteria.isActive ? (
                        <FaToggleOn className="h-5 w-5 text-green-500" />
                      ) : (
                        <FaToggleOff className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{criteria.description}</p>
                  <p className="text-blue-600 text-sm font-medium">{criteria.requirement}</p>
                  {criteria.minimumValue && (
                    <p className="text-gray-500 text-xs mt-1">Minimum: {criteria.minimumValue}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(criteria.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRiskAssessmentTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Risk Assessment Rules</h3>
          <p className="text-gray-600">Configure risk scoring factors and weights</p>
        </div>
        <button
          onClick={() => setShowAddModal('risk-rule')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FaPlus className="h-4 w-4" />
          Add Risk Rule
        </button>
      </div>

      <div className="grid gap-6">
        {policies.riskAssessment.map((rule) => (
          <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaBalanceScale className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{rule.factor}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-600">Weight: {rule.weight}%</span>
                    <button
                      onClick={() => handleToggleActive('riskAssessment', rule.id)}
                      className="flex items-center gap-1"
                    >
                      {rule.isActive ? (
                        <FaToggleOn className="h-5 w-5 text-green-500" />
                      ) : (
                        <FaToggleOff className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-600">
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingItem(rule.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <FaEdit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">Excellent</p>
                <p className="text-xs text-green-600">{rule.scoringCriteria.excellent.min}-{rule.scoringCriteria.excellent.max}</p>
                <p className="text-lg font-semibold text-green-700">Score: {rule.scoringCriteria.excellent.score}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-800">Good</p>
                <p className="text-xs text-blue-600">{rule.scoringCriteria.good.min}-{rule.scoringCriteria.good.max}</p>
                <p className="text-lg font-semibold text-blue-700">Score: {rule.scoringCriteria.good.score}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800">Fair</p>
                <p className="text-xs text-yellow-600">{rule.scoringCriteria.fair.min}-{rule.scoringCriteria.fair.max}</p>
                <p className="text-lg font-semibold text-yellow-700">Score: {rule.scoringCriteria.fair.score}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800">Poor</p>
                <p className="text-xs text-red-600">{rule.scoringCriteria.poor.min}-{rule.scoringCriteria.poor.max}</p>
                <p className="text-lg font-semibold text-red-700">Score: {rule.scoringCriteria.poor.score}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGlobalSettingsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Global Settings</h3>
        <p className="text-gray-600">Configure global lending parameters and system settings</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Approval Limit
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  value={policies.globalSettings.autoApprovalLimit}
                  onChange={(e) => {
                    setPolicies(prev => ({
                      ...prev,
                      globalSettings: {
                        ...prev.globalSettings,
                        autoApprovalLimit: parseInt(e.target.value)
                      }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Loans below this amount are auto-approved if criteria are met</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual Review Threshold
              </label>
              <div className="relative">
                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="number"
                  value={policies.globalSettings.manualReviewThreshold}
                  onChange={(e) => {
                    setPolicies(prev => ({
                      ...prev,
                      globalSettings: {
                        ...prev.globalSettings,
                        manualReviewThreshold: parseInt(e.target.value)
                      }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Loans above this amount require manual review</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Loans
              </label>
              <input
                type="number"
                value={policies.globalSettings.maxConcurrentLoans}
                onChange={(e) => {
                  setPolicies(prev => ({
                    ...prev,
                    globalSettings: {
                      ...prev.globalSettings,
                      maxConcurrentLoans: parseInt(e.target.value)
                    }
                  }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of active loans per borrower</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cooldown Period (days)
              </label>
              <input
                type="number"
                value={policies.globalSettings.cooldownPeriod}
                onChange={(e) => {
                  setPolicies(prev => ({
                    ...prev,
                    globalSettings: {
                      ...prev.globalSettings,
                      cooldownPeriod: parseInt(e.target.value)
                    }
                  }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Days to wait between loan applications</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Compliance Mode</label>
                  <p className="text-xs text-gray-500">Enable strict regulatory compliance</p>
                </div>
                <button
                  onClick={() => {
                    setPolicies(prev => ({
                      ...prev,
                      globalSettings: {
                        ...prev.globalSettings,
                        complianceMode: !prev.globalSettings.complianceMode
                      }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="flex items-center gap-1"
                >
                  {policies.globalSettings.complianceMode ? (
                    <FaToggleOn className="h-6 w-6 text-green-500" />
                  ) : (
                    <FaToggleOff className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Audit Trail</label>
                  <p className="text-xs text-gray-500">Log all policy changes and decisions</p>
                </div>
                <button
                  onClick={() => {
                    setPolicies(prev => ({
                      ...prev,
                      globalSettings: {
                        ...prev.globalSettings,
                        auditTrail: !prev.globalSettings.auditTrail
                      }
                    }));
                    setHasUnsavedChanges(true);
                  }}
                  className="flex items-center gap-1"
                >
                  {policies.globalSettings.auditTrail ? (
                    <FaToggleOn className="h-6 w-6 text-green-500" />
                  ) : (
                    <FaToggleOff className="h-6 w-6 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'interest-rates':
        return renderInterestRatesTab();
      case 'loan-limits':
        return renderLoanLimitsTab();
      case 'eligibility':
        return renderEligibilityTab();
      case 'risk-assessment':
        return renderRiskAssessmentTab();
      case 'repayment':
        return (
          <div className="text-center py-12">
            <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Repayment Policies</h3>
            <p className="mt-1 text-sm text-gray-500">Configure repayment terms and conditions.</p>
          </div>
        );
      case 'cargo-types':
        return (
          <div className="text-center py-12">
            <FaTruck className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Cargo Type Policies</h3>
            <p className="mt-1 text-sm text-gray-500">Configure policies specific to cargo types.</p>
          </div>
        );
      case 'global-settings':
        return renderGlobalSettingsTab();
      default:
        return renderInterestRatesTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading lending policies...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => window.location.reload()}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Lending Policies Configuration</h1>
              <p className="text-gray-600">Configure and manage your lending rules, criteria, and risk assessment policies</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                onClick={handleExportPolicies}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FaDownload className="h-4 w-4" />
                Export Policies
              </button>
              <button
                onClick={handleSavePolicies}
                disabled={!hasUnsavedChanges}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  hasUnsavedChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FaSave className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
          {hasUnsavedChanges && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-yellow-800">You have unsaved changes. Please save your changes before navigating away.</p>
              </div>
            </div>
          )}
        </div>

        {/* Policy Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Policies</p>
                <p className="text-2xl font-bold text-green-600">
                  {[
                    ...policies.interestRates,
                    ...policies.loanLimits,
                    ...policies.eligibilityCriteria,
                    ...policies.riskAssessment
                  ].filter(policy => policy.isActive).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interest Rate Range</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.min(...policies.interestRates.map(p => p.minRate))}% - {Math.max(...policies.interestRates.map(p => p.maxRate))}%
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaPercent className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto-Approval Limit</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(policies.globalSettings.autoApprovalLimit)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaDollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Mode</p>
                <p className={`text-2xl font-bold ${policies.globalSettings.complianceMode ? 'text-green-600' : 'text-red-600'}`}>
                  {policies.globalSettings.complianceMode ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                policies.globalSettings.complianceMode ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <FaShieldAlt className={`h-6 w-6 ${
                  policies.globalSettings.complianceMode ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Add Policy Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Add New {showAddModal === 'interest-rate' ? 'Interest Rate Policy' :
                          showAddModal === 'loan-limit' ? 'Loan Limit Policy' :
                          showAddModal === 'eligibility' ? 'Eligibility Criteria' :
                          showAddModal === 'risk-rule' ? 'Risk Assessment Rule' : 'Policy'}
                </h3>
                <button
                  onClick={() => setShowAddModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              {/* Add Interest Rate Policy Form */}
              {showAddModal === 'interest-rate' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddPolicy(); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Level
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Risk Level</option>
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="e.g., 12.5"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 1000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 100000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the conditions for this interest rate policy..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(null)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Policy
                    </button>
                  </div>
                </form>
              )}

              {/* Add Loan Limit Policy Form */}
              {showAddModal === 'loan-limit' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddPolicy(); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Type
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Business Type</option>
                        <option value="logistics">Logistics Company</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="retail">Retail</option>
                        <option value="construction">Construction</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Loan Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g., 500000"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Credit Score
                      </label>
                      <input
                        type="number"
                        min="300"
                        max="850"
                        placeholder="e.g., 650"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Debt-to-Income Ratio (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="e.g., 40"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Requirements
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Specify any additional requirements for this loan limit policy..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(null)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Policy
                    </button>
                  </div>
                </form>
              )}

              {/* Add Eligibility Criteria Form */}
              {showAddModal === 'eligibility' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddPolicy(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Criteria Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Minimum Business Experience"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Category</option>
                        <option value="financial">Financial</option>
                        <option value="business">Business</option>
                        <option value="personal">Personal</option>
                        <option value="collateral">Collateral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority Level
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Priority</option>
                        <option value="required">Required</option>
                        <option value="preferred">Preferred</option>
                        <option value="optional">Optional</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the eligibility criteria in detail..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Value/Threshold
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 2 years, $50,000, 700 credit score"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(null)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Criteria
                    </button>
                  </div>
                </form>
              )}

              {/* Add Risk Assessment Rule Form */}
              {showAddModal === 'risk-rule' && (
                <form onSubmit={(e) => { e.preventDefault(); handleAddPolicy(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Credit Score Risk Assessment"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Factor
                      </label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Risk Factor</option>
                        <option value="credit-score">Credit Score</option>
                        <option value="debt-ratio">Debt-to-Income Ratio</option>
                        <option value="business-age">Business Age</option>
                        <option value="revenue">Annual Revenue</option>
                        <option value="industry">Industry Type</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Weight (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        placeholder="e.g., 30"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Low Risk Threshold
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 750+"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medium Risk Threshold
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 650-749"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        High Risk Threshold
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., <650"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe how this rule affects risk assessment..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(null)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Rule
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LendingPoliciesPage;
