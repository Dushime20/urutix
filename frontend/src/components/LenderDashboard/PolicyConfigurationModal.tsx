import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Save,
  AlertTriangle,
  Percent,
  DollarSign,
  Users,
  Scale,
  Calendar,
  Truck,
  Settings
} from 'lucide-react';

interface PolicyConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policyData: any) => void;
  category: string;
  loading?: boolean;
}

interface PolicyField {
  key: string;
  label: string;
  hint?: string;
  type: string;
  required?: boolean;
  options?: string[];
  step?: string;
  group?: string;
}

const PolicyConfigurationModal: React.FC<PolicyConfigurationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  loading = false
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const getCategoryConfig = (): { title: string; icon: React.ReactNode; fields: PolicyField[] } => {
    switch (category) {

      // ── INTEREST RATES ── 6 fields (was 11)
      case 'interestRates':
        return {
          title: 'New Interest Rate Policy',
          icon: <Percent size={20} />,
          fields: [
            {
              key: 'name',
              label: 'Policy Name',
              type: 'text',
              required: true,
              hint: 'e.g. "Standard Low Risk" or "High Risk — Transport"'
            },
            {
              key: 'riskLevel',
              label: 'Applies to Risk Level',
              type: 'select',
              options: ['low', 'medium', 'high', 'critical'],
              required: true,
              hint: 'Borrowers in this tier will use this policy'
            },
            {
              key: 'baseRate',
              label: 'Base Rate (% / year)',
              type: 'number',
              step: '0.01',
              required: true,
              hint: 'Starting rate before any per-business-type override'
            },
            {
              key: 'minRate',
              label: 'Min Rate (% / year)',
              type: 'number',
              step: '0.01',
              required: true,
              hint: 'Rate will never go below this floor'
            },
            {
              key: 'maxRate',
              label: 'Max Rate (% / year)',
              type: 'number',
              step: '0.01',
              required: true,
              hint: 'Rate will never exceed this ceiling'
            },
            // Single "default business-type rate" — lender sets one override rate, not four
            {
              key: 'sme',
              label: 'SME Override Rate (% / year)',
              type: 'number',
              step: '0.01',
              group: 'businessTypeRates',
              hint: 'Optional — overrides the base rate for SME borrowers only'
            }
          ]
        };

      // ── LOAN LIMITS ── 6 fields (was 8)
      case 'loanLimits':
        return {
          title: 'New Loan Limit Policy',
          icon: <DollarSign size={20} />,
          fields: [
            { key: 'name', label: 'Policy Name', type: 'text', required: true },
            {
              key: 'currency',
              label: 'Currency',
              type: 'select',
              options: ['RWF', 'USD', 'EUR', 'KES', 'UGX', 'TZS', 'BIF'],
              required: true
            },
            {
              key: 'businessType',
              label: 'Business Type',
              type: 'select',
              options: ['individual', 'sme', 'corporation', 'cooperative'],
              required: true,
              hint: 'This limit applies to borrowers of this type only'
            },
            {
              key: 'minAmount',
              label: 'Minimum Loan Amount',
              type: 'number',
              required: true
            },
            {
              key: 'maxAmount',
              label: 'Maximum Loan Amount',
              type: 'number',
              required: true
            },
            {
              key: 'collateralRequirement',
              label: 'Collateral Required (%)',
              type: 'number',
              required: true,
              hint: 'Collateral value as % of the loan amount'
            }
          ]
        };

      // ── ELIGIBILITY ── 5 fields (was 7)
      case 'eligibilityCriteria':
        return {
          title: 'New Eligibility Criteria',
          icon: <Users size={20} />,
          fields: [
            { key: 'name', label: 'Criteria Name', type: 'text', required: true },
            {
              key: 'category',
              label: 'Category',
              type: 'select',
              options: ['credit_score', 'business_age', 'revenue', 'collateral', 'guarantor', 'documents', 'industry', 'location'],
              required: true
            },
            {
              key: 'requirement',
              label: 'Requirement',
              type: 'text',
              required: true,
              hint: 'Plain description of what the borrower must meet (e.g. "Min 2 years in business")'
            },
            {
              key: 'minimumValue',
              label: 'Minimum Value',
              type: 'number',
              hint: 'Numeric threshold (e.g. credit score 600, or 24 months)'
            },
            { key: 'required', label: 'Mandatory Criteria', type: 'checkbox' }
          ]
        };

      // ── RISK ASSESSMENT ── 6 fields (was 14)
      // Collapsed min/max per tier — only weight + score per tier matters at creation time
      case 'riskAssessment':
        return {
          title: 'New Risk Assessment Rule',
          icon: <Scale size={20} />,
          fields: [
            {
              key: 'factor',
              label: 'Risk Factor',
              type: 'select',
              options: ['credit_score', 'payment_history', 'debt_to_income', 'business_age', 'industry_risk', 'collateral_value', 'cash_flow', 'market_conditions'],
              required: true,
              hint: 'The borrower attribute being evaluated'
            },
            {
              key: 'weight',
              label: 'Weight (%)',
              type: 'number',
              required: true,
              hint: 'Contribution to total risk score — all rules should sum to 100%'
            },
            {
              key: 'excellentScore',
              label: 'Excellent Tier Points',
              type: 'number',
              required: true,
              group: 'excellent',
              hint: 'Points awarded when borrower scores in the excellent range'
            },
            {
              key: 'goodScore',
              label: 'Good Tier Points',
              type: 'number',
              required: true,
              group: 'good',
              hint: 'Points awarded for good performance on this factor'
            },
            {
              key: 'fairScore',
              label: 'Fair Tier Points',
              type: 'number',
              required: true,
              group: 'fair',
              hint: 'Points awarded for average/fair performance'
            },
            {
              key: 'poorScore',
              label: 'Poor Tier Points',
              type: 'number',
              required: true,
              group: 'poor',
              hint: 'Points awarded for poor performance (typically lowest)'
            }
          ]
        };

      // ── REPAYMENT ── 7 fields (was 12)
      case 'repaymentPolicies':
        return {
          title: 'New Repayment Policy',
          icon: <Calendar size={20} />,
          fields: [
            { key: 'name', label: 'Policy Name', type: 'text', required: true },
            {
              key: 'frequency',
              label: 'Payment Frequency',
              type: 'select',
              options: ['weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually'],
              required: true,
              hint: 'How often the borrower makes repayments'
            },
            {
              key: 'grace_period_days',
              label: 'Grace Period (days)',
              type: 'number',
              required: true,
              hint: 'Days after due date before a late fee is charged'
            },
            {
              key: 'late_fee_type',
              label: 'Late Fee Type',
              type: 'select',
              options: ['fixed_amount', 'percentage', 'compound_interest'],
              required: true
            },
            {
              key: 'late_fee_amount',
              label: 'Late Fee Amount',
              type: 'number',
              step: '0.01',
              required: true,
              hint: 'Fixed amount or % of outstanding balance'
            },
            {
              key: 'penalty_rate',
              label: 'Penalty Rate (% / year)',
              type: 'number',
              step: '0.01',
              required: true,
              hint: 'Extra interest on overdue balance'
            },
            {
              key: 'default_threshold_days',
              label: 'Default After (days)',
              type: 'number',
              required: true,
              hint: 'Days overdue before loan is classified as defaulted'
            }
          ]
        };

      // ── CARGO TYPE ── 5 fields (was 6)
      case 'cargoTypePolicies':
        return {
          title: 'New Cargo Type Policy',
          icon: <Truck size={20} />,
          fields: [
            {
              key: 'cargoType',
              label: 'Cargo Type',
              type: 'text',
              required: true,
              hint: 'e.g. Perishables, Electronics, Fuel, General Goods'
            },
            {
              key: 'riskLevel',
              label: 'Risk Level',
              type: 'select',
              options: ['low', 'medium', 'high', 'critical'],
              required: true
            },
            {
              key: 'riskMultiplier',
              label: 'Risk Multiplier',
              type: 'number',
              step: '0.1',
              required: true,
              hint: '1.0 = no change, 1.2 = 20% higher rate, 0.9 = 10% lower rate'
            },
            {
              key: 'maxLoanAmount',
              label: 'Max Loan Amount',
              type: 'number',
              required: true
            },
            { key: 'insuranceRequired', label: 'Insurance Required', type: 'checkbox' }
          ]
        };

      // ── GLOBAL SETTINGS ── 5 fields (was 8)
      case 'globalSettings':
        return {
          title: 'System Configuration',
          icon: <Settings size={20} />,
          fields: [
            { key: 'name', label: 'Configuration Name', type: 'text', required: true },
            {
              key: 'autoApprovalLimit',
              label: 'Auto-Approval Limit',
              type: 'number',
              required: true,
              hint: 'Loans below this amount are approved automatically'
            },
            {
              key: 'manualReviewThreshold',
              label: 'Manual Review Threshold',
              type: 'number',
              required: true,
              hint: 'Loans above this amount require a human reviewer'
            },
            {
              key: 'maxConcurrentLoans',
              label: 'Max Active Loans per Borrower',
              type: 'number',
              required: true
            },
            {
              key: 'cooldownPeriod',
              label: 'Cooldown Period (days)',
              type: 'number',
              required: true,
              hint: 'Days borrower must wait after repaying before applying again'
            }
          ]
        };

      default:
        return { title: 'New Configuration', icon: <Settings size={20} />, fields: [] };
    }
  };

  const config = getCategoryConfig();

  const handleInputChange = (key: string, value: any, group?: string) => {
    setFormData((prev: any) => {
      const updated = { ...prev };
      if (group) {
        if (!updated[group]) updated[group] = {};
        updated[group][key] = value;
      } else {
        updated[key] = value;
      }
      return updated;
    });
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    config.fields.forEach((field: PolicyField) => {
      if (field.required) {
        const value = field.group ? formData[field.group]?.[field.key] : formData[field.key];
        if (!value && value !== 0) newErrors[field.key] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const policyData: any = {
      id: `${category.toUpperCase().slice(0, 2)}-${Date.now().toString().slice(-6)}`,
      ...formData,
      isActive: true,
      created_at: new Date().toISOString()
    };

    // Risk assessment: build scoringCriteria from grouped score fields
    if (category === 'riskAssessment') {
      policyData.scoringCriteria = {
        excellent: { min: 0, max: 0, score: formData.excellent?.excellentScore || 0 },
        good:      { min: 0, max: 0, score: formData.good?.goodScore || 0 },
        fair:      { min: 0, max: 0, score: formData.fair?.fairScore || 0 },
        poor:      { min: 0, max: 0, score: formData.poor?.poorScore || 0 }
      };
      delete policyData.excellent;
      delete policyData.good;
      delete policyData.fair;
      delete policyData.poor;
    }

    // Interest rates: expose businessTypeRates as adjustmentFactors for backend compat
    if (category === 'interestRates' && formData.businessTypeRates) {
      policyData.adjustmentFactors = formData.businessTypeRates;
      delete policyData.businessTypeRates;
    }

    onSave(policyData);
  };

  const renderField = (field: PolicyField) => {
    const value = field.group ? formData[field.group]?.[field.key] ?? '' : formData[field.key] ?? '';
    const error = errors[field.key];
    const baseClass = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-300' : 'border-slate-200'
    }`;

    switch (field.type) {
      case 'select':
        return (
          <select value={value} onChange={(e) => handleInputChange(field.key, e.target.value, field.group)} className={baseClass}>
            <option value="">Select…</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value, field.group)}
            className={baseClass}
            rows={3}
            placeholder={field.hint ?? ''}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(field.key, e.target.checked, field.group)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">Yes</span>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            step={field.step}
            value={value}
            onChange={(e) =>
              handleInputChange(field.key, field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value, field.group)
            }
            className={baseClass}
            placeholder={field.hint ?? ''}
          />
        );
    }
  };

  const groupLabels: Record<string, string> = {
    businessTypeRates: 'Rate Override by Business Type',
    excellent: 'Excellent Tier',
    good: 'Good Tier',
    fair: 'Fair Tier',
    poor: 'Poor Tier'
  };

  const renderFields = () => {
    const rendered: React.ReactNode[] = [];
    const seenGroups = new Set<string>();

    config.fields.forEach((field) => {
      if (field.group && !seenGroups.has(field.group)) {
        seenGroups.add(field.group);
        rendered.push(
          <div key={`section-${field.group}`} className="md:col-span-2 mt-2">
            <p className="text-[10px] font-black text-[#345E85] uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">
              {groupLabels[field.group] ?? field.group}
            </p>
          </div>
        );
      }

      rendered.push(
        <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            {field.label}
            {field.required && <span className="text-rose-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {field.hint && field.type !== 'textarea' && field.type !== 'checkbox' && (
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{field.hint}</p>
          )}
          {errors[field.key] && (
            <p className="text-rose-500 text-[10px] font-bold mt-1 flex items-center gap-1 uppercase tracking-tight">
              <AlertTriangle size={12} />
              {errors[field.key]}
            </p>
          )}
        </div>
      );
    });

    return rendered;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#345E85] rounded-lg text-white shadow-lg shadow-blue-100">
              {config.icon}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{config.title}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fill in the required fields to create this policy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors group">
            <X size={20} className="text-slate-400 group-hover:text-slate-900 dark:text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderFields()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-slate-500 hover:text-slate-900 dark:text-white hover:bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-2.5 bg-[#345E85] hover:bg-blue-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100 active:scale-95"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Save size={14} />
                Create Policy
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PolicyConfigurationModal;
