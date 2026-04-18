import React from 'react';
import {
    Percent,
    DollarSign,
    Users,
    Scale,
    Calendar,
    Truck,
    Settings,
    Plus,
    Edit,
    ToggleLeft,
    ToggleRight,
    Shield,
    TrendingUp,
    AlertTriangle
} from 'lucide-react';
import StatCard from '../EnliteUI/Cards/StatCard';
import DataCard from '../EnliteUI/Cards/DataCard';
import EnhancedTable from '../EnliteUI/Tables/EnhancedTable';

// Reuse interfaces from the original page
export interface InterestRatePolicy {
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

export interface LoanLimitPolicy {
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

export interface EligibilityCriteria {
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

export interface RiskAssessmentRule {
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

export interface RepaymentPolicy {
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

export interface CargoTypePolicy {
    id: string;
    cargoType: string;
    riskLevel: string;
    riskMultiplier: number;
    maxLoanAmount: number;
    insuranceRequired: boolean;
    specialConditions: string[];
    isActive: boolean;
}

export interface LendingPolicies {
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

interface LendingPoliciesEnliteProps {
    loading: boolean;
    policies: LendingPolicies;
    activeTab: string;
    onTabChange: (tabId: string) => void;
    onToggleActive: (category: string, id: string) => void;
    onEdit: (id: string) => void;
    onAdd: (category: string) => void;
}

const LendingPoliciesEnlite: React.FC<LendingPoliciesEnliteProps> = ({
    loading,
    policies,
    activeTab,
    onTabChange,
    onToggleActive,
    onEdit,
    onAdd
}) => {
    const tabs = [
        { id: 'interest-rates', label: 'INTEREST RATES', icon: <Percent size={14} />, category: 'interestRates' },
        { id: 'loan-limits', label: 'LOAN LIMITS', icon: <DollarSign size={14} />, category: 'loanLimits' },
        { id: 'eligibility', label: 'ELIGIBILITY', icon: <Users size={14} />, category: 'eligibilityCriteria' },
        { id: 'risk-assessment', label: 'RISK RULES', icon: <Scale size={14} />, category: 'riskAssessment' },
        { id: 'repayment', label: 'REPAYMENT', icon: <Calendar size={14} />, category: 'repaymentPolicies' },
        { id: 'cargo-types', label: 'CARGO POLICIES', icon: <Truck size={14} />, category: 'cargoTypePolicies' },
        { id: 'global-settings', label: 'SYSTEM CONFIG', icon: <Settings size={14} />, category: 'globalSettings' }
    ];

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'critical': return 'bg-slate-900 text-white border-slate-700';
            default: return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const currentTabInfo = tabs.find(t => t.id === activeTab);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'interest-rates':
                const irColumns = [
                    {
                        key: 'name',
                        label: 'POLICY NAME',
                        render: (_: any, p: InterestRatePolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-[11px]">{p.name}</span>
                                <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black border w-fit uppercase ${getRiskColor(p.riskLevel)}`}>
                                    {p.riskLevel} RISK
                                </span>
                            </div>
                        )
                    },
                    {
                        key: 'rates',
                        label: 'RATE STRUCTURE',
                        render: (_: any, p: InterestRatePolicy) => (
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Base</p>
                                    <p className="text-[11px] font-black text-[#345E85]">{p.baseRate}%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Range</p>
                                    <p className="text-[11px] font-bold text-slate-600">{p.minRate}% - {p.maxRate}%</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'factors',
                        label: 'ADJUSTMENTS',
                        render: (_: any, p: InterestRatePolicy) => (
                            <div className="flex gap-3">
                                <div title="Credit Score Factor">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">CS</p>
                                    <p className="text-[10px] font-bold">+{p.adjustmentFactors.creditScore}%</p>
                                </div>
                                <div title="Collateral Factor">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">COL</p>
                                    <p className="text-[10px] font-bold">+{p.adjustmentFactors.collateral}%</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        label: 'STATUS',
                        render: (_: any, p: InterestRatePolicy) => (
                            <button
                                onClick={() => onToggleActive('interestRates', p.id)}
                                className="flex items-center gap-2"
                            >
                                {p.isActive ? (
                                    <ToggleRight className="text-[#345E85] w-5 h-5" />
                                ) : (
                                    <ToggleLeft className="text-slate-300 w-5 h-5" />
                                )}
                                <span className={`text-[9px] font-black uppercase ${p.isActive ? 'text-[#345E85]' : 'text-slate-400'}`}>
                                    {p.isActive ? 'Active' : 'Disabled'}
                                </span>
                            </button>
                        )
                    },
                    {
                        key: 'actions',
                        label: '',
                        render: (_: any, p: InterestRatePolicy) => (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onEdit(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <EnhancedTable
                        columns={irColumns}
                        data={policies.interestRates}
                        loading={loading}
                    />
                );

            case 'loan-limits':
                const limitColumns = [
                    {
                        key: 'name',
                        label: 'POLICY',
                        render: (_: any, p: LoanLimitPolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-[11px]">{p.name}</span>
                                <span className="text-[9px] font-bold text-[#345E85] uppercase">{p.businessType}</span>
                            </div>
                        )
                    },
                    {
                        key: 'limits',
                        label: 'FUNDING LIMITS (RWF)',
                        render: (_: any, p: LoanLimitPolicy) => (
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Min</p>
                                    <p className="text-[11px] font-black">{(p.minAmount / 1000).toLocaleString()}K</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Max</p>
                                    <p className="text-[11px] font-black text-rose-600">{(p.maxAmount / 1000000).toFixed(1)}M</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'requirements',
                        label: 'REQUIREMENTS',
                        render: (_: any, p: LoanLimitPolicy) => (
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Score</p>
                                    <p className="text-[11px] font-bold">{p.creditScoreRequirement}+</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Collateral</p>
                                    <p className="text-[11px] font-bold">{p.collateralRequirement}%</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        label: 'STATUS',
                        render: (_: any, p: LoanLimitPolicy) => (
                            <button
                                onClick={() => onToggleActive('loanLimits', p.id)}
                                className="flex items-center gap-2"
                            >
                                {p.isActive ? (
                                    <ToggleRight className="text-[#345E85] w-5 h-5" />
                                ) : (
                                    <ToggleLeft className="text-slate-300 w-5 h-5" />
                                )}
                            </button>
                        )
                    }
                ];
                return (
                    <EnhancedTable
                        columns={limitColumns}
                        data={policies.loanLimits}
                        loading={loading}
                    />
                );

            case 'global-settings':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Automation & Thresholds</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 uppercase">Auto-Approval Limit</p>
                                        <p className="text-[10px] text-slate-500 font-bold">Requests below this bypass manual check</p>
                                    </div>
                                    <p className="text-sm font-black text-[#345E85]">RWF {(policies.globalSettings.autoApprovalLimit / 1000).toLocaleString()}K</p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 uppercase">Manual Review Threshold</p>
                                        <p className="text-[10px] text-slate-500 font-bold">Critical review for large amounts</p>
                                    </div>
                                    <p className="text-sm font-black text-rose-600">RWF {(policies.globalSettings.manualReviewThreshold / 1000).toLocaleString()}K</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Compliance & Security</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Shield className="text-emerald-500" size={18} />
                                        <p className="text-[11px] font-black text-slate-900 uppercase">Strict Compliance Mode</p>
                                    </div>
                                    <ToggleRight className="text-emerald-500" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="text-[#345E85]" size={18} />
                                        <p className="text-[11px] font-black text-slate-900 uppercase">Real-time Audit Trail</p>
                                    </div>
                                    <ToggleRight className="text-[#345E85]" />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'eligibility':
                const eligibilityColumns = [
                    {
                        key: 'name',
                        label: 'CRITERIA NAME',
                        render: (_: any, p: EligibilityCriteria) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-[11px]">{p.name}</span>
                                <span className="text-[9px] font-bold text-[#345E85] uppercase">{p.category.replace('_', ' ')}</span>
                            </div>
                        )
                    },
                    {
                        key: 'requirement',
                        label: 'REQUIREMENT',
                        render: (_: any, p: EligibilityCriteria) => (
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-900">{p.requirement}</span>
                                {p.minimumValue && (
                                    <span className="text-[8px] text-slate-500">Min: {p.minimumValue}</span>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'required',
                        label: 'REQUIRED',
                        render: (_: any, p: EligibilityCriteria) => (
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                                p.required ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'
                            }`}>
                                {p.required ? 'Mandatory' : 'Optional'}
                            </span>
                        )
                    },
                    {
                        key: 'status',
                        label: 'STATUS',
                        render: (_: any, p: EligibilityCriteria) => (
                            <button
                                onClick={() => onToggleActive('eligibilityCriteria', p.id)}
                                className="flex items-center gap-2"
                            >
                                {p.isActive ? (
                                    <ToggleRight className="text-[#345E85] w-5 h-5" />
                                ) : (
                                    <ToggleLeft className="text-slate-300 w-5 h-5" />
                                )}
                            </button>
                        )
                    },
                    {
                        key: 'actions',
                        label: '',
                        render: (_: any, p: EligibilityCriteria) => (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onEdit(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <EnhancedTable
                        columns={eligibilityColumns}
                        data={policies.eligibilityCriteria}
                        loading={loading}
                    />
                );

            case 'risk-assessment':
                const riskColumns = [
                    {
                        key: 'factor',
                        label: 'RISK FACTOR',
                        render: (_: any, p: RiskAssessmentRule) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-[11px]">{p.factor.replace('_', ' ')}</span>
                                <span className="text-[9px] font-bold text-[#345E85]">Weight: {p.weight}%</span>
                            </div>
                        )
                    },
                    {
                        key: 'scoring',
                        label: 'SCORING RANGE',
                        render: (_: any, p: RiskAssessmentRule) => (
                            <div className="flex gap-2">
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-emerald-600 uppercase">Excellent</p>
                                    <p className="text-[10px] font-bold">{p.scoringCriteria.excellent.score}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-amber-600 uppercase">Good</p>
                                    <p className="text-[10px] font-bold">{p.scoringCriteria.good.score}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] font-black text-rose-600 uppercase">Poor</p>
                                    <p className="text-[10px] font-bold">{p.scoringCriteria.poor.score}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        label: 'STATUS',
                        render: (_: any, p: RiskAssessmentRule) => (
                            <button
                                onClick={() => onToggleActive('riskAssessment', p.id)}
                                className="flex items-center gap-2"
                            >
                                {p.isActive ? (
                                    <ToggleRight className="text-[#345E85] w-5 h-5" />
                                ) : (
                                    <ToggleLeft className="text-slate-300 w-5 h-5" />
                                )}
                            </button>
                        )
                    },
                    {
                        key: 'actions',
                        label: '',
                        render: (_: any, p: RiskAssessmentRule) => (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onEdit(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <EnhancedTable
                        columns={riskColumns}
                        data={policies.riskAssessment}
                        loading={loading}
                    />
                );

            case 'repayment':
                const repaymentColumns = [
                    {
                        key: 'name',
                        label: 'POLICY NAME',
                        render: (_: any, p: RepaymentPolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-[11px]">{p.name}</span>
                                <span className="text-[9px] font-bold text-[#345E85] uppercase">{p.frequency}</span>
                            </div>
                        )
                    },
                    {
                        key: 'terms',
                        label: 'TERMS',
                        render: (_: any, p: RepaymentPolicy) => (
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Grace</p>
                                    <p className="text-[11px] font-bold">{p.gracePeriod} days</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Late Fee</p>
                                    <p className="text-[11px] font-bold text-rose-600">RWF {p.lateFee.toLocaleString()}</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'penalties',
                        label: 'PENALTIES',
                        render: (_: any, p: RepaymentPolicy) => (
                            <div className="flex gap-3">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Rate</p>
                                    <p className="text-[10px] font-bold">{p.penaltyRate}%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Default</p>
                                    <p className="text-[10px] font-bold">{p.defaultThreshold} days</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        label: 'STATUS',
                        render: (_: any, p: RepaymentPolicy) => (
                            <button
                                onClick={() => onToggleActive('repaymentPolicies', p.id)}
                                className="flex items-center gap-2"
                            >
                                {p.isActive ? (
                                    <ToggleRight className="text-[#345E85] w-5 h-5" />
                                ) : (
                                    <ToggleLeft className="text-slate-300 w-5 h-5" />
                                )}
                            </button>
                        )
                    },
                    {
                        key: 'actions',
                        label: '',
                        render: (_: any, p: RepaymentPolicy) => (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onEdit(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <EnhancedTable
                        columns={repaymentColumns}
                        data={policies.repaymentPolicies}
                        loading={loading}
                    />
                );

            case 'cargo-types':
                const cargoColumns = [
                    {
                        key: 'cargoType',
                        label: 'CARGO TYPE',
                        render: (_: any, p: CargoTypePolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 uppercase text-[11px]">{p.cargoType}</span>
                                <span className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black border w-fit uppercase ${getRiskColor(p.riskLevel)}`}>
                                    {p.riskLevel} RISK
                                </span>
                            </div>
                        )
                    },
                    {
                        key: 'limits',
                        label: 'LOAN LIMITS',
                        render: (_: any, p: CargoTypePolicy) => (
                            <div className="flex flex-col">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Max Amount</p>
                                    <p className="text-[11px] font-black text-rose-600">RWF {(p.maxLoanAmount / 1000000).toFixed(1)}M</p>
                                </div>
                                <div className="mt-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Risk Multiplier</p>
                                    <p className="text-[10px] font-bold">{p.riskMultiplier}x</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'requirements',
                        label: 'REQUIREMENTS',
                        render: (_: any, p: CargoTypePolicy) => (
                            <div className="flex flex-col gap-1">
                                {p.insuranceRequired && (
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[8px] font-black uppercase">
                                        Insurance Required
                                    </span>
                                )}
                                {p.specialConditions && p.specialConditions.length > 0 && (
                                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[8px] font-black uppercase">
                                        {p.specialConditions.length} Conditions
                                    </span>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'status',
                        label: 'STATUS',
                        render: (_: any, p: CargoTypePolicy) => (
                            <button
                                onClick={() => onToggleActive('cargoTypePolicies', p.id)}
                                className="flex items-center gap-2"
                            >
                                {p.isActive ? (
                                    <ToggleRight className="text-[#345E85] w-5 h-5" />
                                ) : (
                                    <ToggleLeft className="text-slate-300 w-5 h-5" />
                                )}
                            </button>
                        )
                    },
                    {
                        key: 'actions',
                        label: '',
                        render: (_: any, p: CargoTypePolicy) => (
                            <div className="flex justify-end">
                                <button
                                    onClick={() => onEdit(p.id)}
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <EnhancedTable
                        columns={cargoColumns}
                        data={policies.cargoTypePolicies}
                        loading={loading}
                    />
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <AlertTriangle size={32} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Selected module content is under modernization</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Active Rate Policies"
                    value={policies.interestRates.filter(p => p.isActive).length}
                    subtitle={`Total: ${policies.interestRates.length}`}
                    icon={<Percent size={24} />}
                    color="primary"
                />
                <StatCard
                    title="Avg Base Rate"
                    value={`${(policies.interestRates.reduce((acc, curr) => acc + curr.baseRate, 0) / policies.interestRates.length || 0).toFixed(1)}%`}
                    trend="+0.2% vs last month"
                    trendDirection="up"
                    icon={<TrendingUp size={24} />}
                    color="secondary"
                />
                <StatCard
                    title="Max Exposure"
                    value={`RWF ${(policies.globalSettings.manualReviewThreshold / 1000000).toFixed(1)}M`}
                    subtitle="System Soft-Limit"
                    icon={<Shield size={24} />}
                    color="success"
                />
                <StatCard
                    title="Policy Health"
                    value="98.2%"
                    trend="Stable"
                    trendDirection="up"
                    icon={<Settings size={24} />}
                    color="warning"
                />
            </div>

            {/* Main Configuration Console */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm">
                        <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Configuration Tiers</p>
                        <div className="space-y-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${activeTab === tab.id
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                        : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                        {tab.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tight">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#345E85] rounded-2xl p-6 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <Shield className="mb-4 opacity-50" size={32} />
                            <h4 className="text-sm font-black uppercase tracking-tighter leading-tight">Policy Assurance Mode Enabled</h4>
                            <p className="text-[10px] font-bold text-blue-100/70 mt-2 uppercase tracking-widest leading-relaxed">
                                All changes go through consensus verification before deployment.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3">
                    <DataCard
                        title={currentTabInfo?.label || 'POLICY ENGINE'}
                        subtitle={`Manage your ${currentTabInfo?.label.toLowerCase()} configurations`}
                        actions={
                            <button
                                onClick={() => onAdd(currentTabInfo?.category || '')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all"
                            >
                                <Plus size={14} /> New Configuration
                            </button>
                        }
                    >
                        {renderTabContent()}
                    </DataCard>
                </div>
            </div>
        </div>
    );
};

export default LendingPoliciesEnlite;
