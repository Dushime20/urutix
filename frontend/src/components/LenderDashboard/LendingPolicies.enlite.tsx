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
import DataCard from '../EnliteUI/Cards/DataCard';
import { StandardDataTable } from '../EnliteUI/Tables';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

// Reuse interfaces from the original page
export interface InterestRatePolicy {
    id: string;
    name: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    baseRate: number;
    minRate: number;
    maxRate: number;
    originationFeeRate?: number;
    businessTypeRates?: {
        individual?: number;
        sme?: number;
        corporation?: number;
        cooperative?: number;
    };
    // legacy shape — kept for backward compat with existing saved policies
    adjustmentFactors?: {
        creditScore?: number;
        loanHistory?: number;
        collateral?: number;
        businessType?: number;
    };
    isActive: boolean;
}

export interface LoanLimitPolicy {
    id: string;
    name: string;
    currency: string;
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
    frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually';
    gracePeriod: number;
    lateFee: number;
    lateFeeType?: string;
    penaltyRate: number;
    maxExtensions: number;
    defaultThreshold: number;
    earlyPaymentDiscount?: number | null;
    allowPartialPayments?: boolean;
    minimumPaymentPercentage?: number | null;
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
    const { format, compact } = useCurrencyFormat();
    const fmtRwf = (amount: number) => format(amount, 'RWF');
    const cptRwf = (amount: number) => compact(amount, 'RWF');
    const { tSync: t } = useTranslation();

    const tabs = [
        { id: 'interest-rates', label: 'Interest Rates', icon: <Percent size={14} />, category: 'interestRates' },
        { id: 'loan-limits', label: 'Loan Limits', icon: <DollarSign size={14} />, category: 'loanLimits' },
        { id: 'eligibility', label: 'Eligibility', icon: <Users size={14} />, category: 'eligibilityCriteria' },
        { id: 'risk-assessment', label: 'Risk Rules', icon: <Scale size={14} />, category: 'riskAssessment' },
        { id: 'repayment', label: 'Repayment', icon: <Calendar size={14} />, category: 'repaymentPolicies' },
        { id: 'cargo-types', label: 'Cargo Policies', icon: <Truck size={14} />, category: 'cargoTypePolicies' },
        { id: 'global-settings', label: 'System Config', icon: <Settings size={14} />, category: 'globalSettings' }
    ];

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'critical': return 'bg-slate-900 text-white border-slate-700';
            default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    const currentTabInfo = tabs.find(tab => tab.id === activeTab);

    const addAction = (
        <button
            onClick={() => onAdd(currentTabInfo?.category || '')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
        >
            <Plus size={14} /> <TranslatedText text={`Add ${currentTabInfo?.label ?? 'New'}`} />
        </button>
    );

    const tableDefaults = {
        headerColor: 'primary' as const,
        loading,
        searchable: true,
        pagination: true,
        pageSize: 10,
        columnVisibility: true,
        stickyHeader: true,
        striped: true,
        hoverable: true,
        getRowId: (row: { id: string }) => row.id,
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'interest-rates': {
                const irColumns = [
                    {
                        key: 'name',
                        label: 'POLICY NAME',
                        render: (_: any, p: InterestRatePolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{p.name}</span>
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
                                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{p.minRate}% - {p.maxRate}%</p>
                                </div>
                            </div>
                        )
                    },
                    {
                        key: 'factors',
                        label: 'RATE BY BUSINESS TYPE',
                        render: (_: any, p: InterestRatePolicy) => {
                            const rates = p.businessTypeRates;
                            if (!rates || Object.keys(rates).length === 0) {
                                return <span className="text-[9px] text-slate-400 italic">Not configured</span>;
                            }
                            return (
                                <div className="flex gap-3 flex-wrap">
                                    {rates.individual != null && (
                                        <div title="Individual">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Indiv.</p>
                                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{rates.individual}%</p>
                                        </div>
                                    )}
                                    {rates.sme != null && (
                                        <div title="SME">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">SME</p>
                                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{rates.sme}%</p>
                                        </div>
                                    )}
                                    {rates.corporation != null && (
                                        <div title="Corporation">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Corp.</p>
                                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{rates.corporation}%</p>
                                        </div>
                                    )}
                                    {rates.cooperative != null && (
                                        <div title="Cooperative">
                                            <p className="text-[8px] font-black text-slate-400 uppercase">Coop.</p>
                                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{rates.cooperative}%</p>
                                        </div>
                                    )}
                                </div>
                            );
                        }
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
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <StandardDataTable
                        {...tableDefaults}
                        title={currentTabInfo?.label || 'Interest Rates'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <Percent className="w-5 h-5" />}
                        headerActions={addAction}
                        columns={irColumns}
                        data={policies.interestRates}
                        searchKeys={['name', 'riskLevel']}
                        emptyMessage={t('No interest rate policies configured')}
                    />
                );
            }

            case 'loan-limits': {
                const limitColumns = [
                    {
                        key: 'name',
                        label: 'POLICY',
                        render: (_: any, p: LoanLimitPolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{p.name}</span>
                                <span className="text-[9px] font-bold text-[#345E85] uppercase">{p.businessType}</span>
                            </div>
                        )
                    },
                    {
                        key: 'limits',
                        label: 'FUNDING LIMITS',
                        render: (_: any, p: LoanLimitPolicy) => (
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Min</p>
                                    <p className="text-[11px] font-black">{cptRwf(p.minAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Max</p>
                                    <p className="text-[11px] font-black text-rose-600">{cptRwf(p.maxAmount)}</p>
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
                    <StandardDataTable
                        {...tableDefaults}
                        title={currentTabInfo?.label || 'Loan Limits'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <DollarSign className="w-5 h-5" />}
                        headerActions={addAction}
                        columns={limitColumns}
                        data={policies.loanLimits}
                        searchKeys={['name', 'businessType']}
                        emptyMessage={t('No loan limit policies configured')}
                    />
                );
            }

            case 'global-settings':
                return (
                    <DataCard
                        title={currentTabInfo?.label || 'System Config'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <Settings className="w-5 h-5" />}
                        headerColor="primary"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Automation & Thresholds</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">Auto-Approval Limit</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Requests below this bypass manual check</p>
                                        </div>
                                        <p className="text-sm font-black text-[#345E85]">{cptRwf(policies.globalSettings.autoApprovalLimit)}</p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">Manual Review Threshold</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Critical review for large amounts</p>
                                        </div>
                                        <p className="text-sm font-black text-rose-600">{cptRwf(policies.globalSettings.manualReviewThreshold)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Compliance & Security</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <Shield className="text-emerald-500" size={18} />
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">Strict Compliance Mode</p>
                                        </div>
                                        <ToggleRight className="text-emerald-500" />
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="text-[#345E85]" size={18} />
                                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase">Real-time Audit Trail</p>
                                        </div>
                                        <ToggleRight className="text-[#345E85]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DataCard>
                );

            case 'eligibility': {
                const eligibilityColumns = [
                    {
                        key: 'name',
                        label: 'CRITERIA NAME',
                        render: (_: any, p: EligibilityCriteria) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{p.name}</span>
                                <span className="text-[9px] font-bold text-[#345E85] uppercase">{p.category.replace(/_/g, ' ')}</span>
                            </div>
                        )
                    },
                    {
                        key: 'requirement',
                        label: 'REQUIREMENT',
                        render: (_: any, p: EligibilityCriteria) => (
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-900 dark:text-white">{p.requirement}</span>
                                {p.minimumValue && (
                                    <span className="text-[8px] text-slate-500 dark:text-slate-400">Min: {p.minimumValue}</span>
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'required',
                        label: 'REQUIRED',
                        render: (_: any, p: EligibilityCriteria) => (
                            <span className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                                p.required ? 'bg-red-50 text-red-700' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
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
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <StandardDataTable
                        {...tableDefaults}
                        title={currentTabInfo?.label || 'Eligibility'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <Users className="w-5 h-5" />}
                        headerActions={addAction}
                        columns={eligibilityColumns}
                        data={policies.eligibilityCriteria}
                        searchKeys={['name', 'category', 'requirement']}
                        emptyMessage={t('No eligibility criteria configured')}
                    />
                );
            }

            case 'risk-assessment': {
                const riskColumns = [
                    {
                        key: 'factor',
                        label: 'RISK FACTOR',
                        render: (_: any, p: RiskAssessmentRule) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{p.factor.replace(/_/g, ' ')}</span>
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
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <StandardDataTable
                        {...tableDefaults}
                        title={currentTabInfo?.label || 'Risk Rules'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <Scale className="w-5 h-5" />}
                        headerActions={addAction}
                        columns={riskColumns}
                        data={policies.riskAssessment}
                        searchKeys={['factor']}
                        emptyMessage={t('No risk assessment rules configured')}
                    />
                );
            }

            case 'repayment': {
                const repaymentColumns = [
                    {
                        key: 'name',
                        label: 'POLICY NAME',
                        render: (_: any, p: RepaymentPolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{p.name}</span>
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
                                    <p className="text-[11px] font-bold text-rose-600">
                                        {p.lateFeeType === 'percentage'
                                            ? `${(p.lateFee ?? 0)}%`
                                            : fmtRwf(p.lateFee ?? 0)}
                                    </p>
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
                                    <p className="text-[10px] font-bold">{p.penaltyRate ?? 0}%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase">Default</p>
                                    <p className="text-[10px] font-bold">{p.defaultThreshold ?? 0} days</p>
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
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <StandardDataTable
                        {...tableDefaults}
                        title={currentTabInfo?.label || 'Repayment'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <Calendar className="w-5 h-5" />}
                        headerActions={addAction}
                        columns={repaymentColumns}
                        data={policies.repaymentPolicies}
                        searchKeys={['name', 'frequency']}
                        emptyMessage={t('No repayment policies configured')}
                    />
                );
            }

            case 'cargo-types': {
                const cargoColumns = [
                    {
                        key: 'cargoType',
                        label: 'CARGO TYPE',
                        render: (_: any, p: CargoTypePolicy) => (
                            <div className="flex flex-col">
                                <span className="font-black text-slate-900 dark:text-white uppercase text-[11px]">{p.cargoType}</span>
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
                                    <p className="text-[11px] font-black text-rose-600">{cptRwf(p.maxLoanAmount)}</p>
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
                                    className="p-1.5 text-slate-400 hover:text-[#345E85] hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <Edit size={14} />
                                </button>
                            </div>
                        )
                    }
                ];
                return (
                    <StandardDataTable
                        {...tableDefaults}
                        title={currentTabInfo?.label || 'Cargo Policies'}
                        subtitle={`Manage your ${(currentTabInfo?.label || 'policy').toLowerCase()} configurations`}
                        icon={currentTabInfo?.icon ?? <Truck className="w-5 h-5" />}
                        headerActions={addAction}
                        columns={cargoColumns}
                        data={policies.cargoTypePolicies}
                        searchKeys={['cargoType', 'riskLevel']}
                        emptyMessage={t('No cargo type policies configured')}
                    />
                );
            }

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
        <div className="space-y-12">
            <div className="flex items-center gap-2 px-1 overflow-x-auto pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-[#2c5173] text-white shadow-lg shadow-[#2c5173]/20'
                                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {renderTabContent()}
        </div>
    );
};

export default LendingPoliciesEnlite;
