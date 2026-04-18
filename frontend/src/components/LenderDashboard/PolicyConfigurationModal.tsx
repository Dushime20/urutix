import React, { useState } from 'react';
import {
  X,
  Plus,
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
import type {
  InterestRatePolicy,
  LoanLimitPolicy,
  EligibilityCriteria,
  RiskAssessmentRule,
  RepaymentPolicy,
  CargoTypePolicy
} from './LendingPolicies.enlite';

interface PolicyConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policyData: any) => void;
  category: string;
  loading?: boolean;
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

  const getCategoryConfig = () => {
    switch (category) {
      case 'interestRates':
        return {
          title: 'New Interest Rate Policy',
          icon: <Percent size={20} />,
          fields: [
            { key: 'name', label: 'Policy Name', type: 'text', required: true },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
            { key: 'baseRate', label: 'Base Rate (%)', type: 'number', step: '0.1', required: true },
            { key: 'minRate', label: 'Minimum Rate (%)', type: 'number', step: '0.1', required: true },
            { key: 'maxRate', label: 'Maximum Rate (%)', type: 'number', step: '0.1', required: true },
            { key: 'creditScore', label: 'Credit Score Factor', type: 'number', step: '0.1', group: 'adjustmentFactors' },
            { key: 'loanHistory', label: 'Loan History Factor', type: 'number', step: '0.1', group: 'adjustmentFactors' },
            { key: 'collateral', label: 'Collateral Factor', type: 'number', step: '0.1', group: 'adjustmentFactors' },
            { key: 'businessType', label: 'Business Type Factor', type: 'number', step: '0.1', group: 'adjustmentFactors' }
          ]
        };
      case 'loanLimits':
        return {
          title: 'New Loan Limit Policy',
          icon: <DollarSign size={20} />,
          fields: [
            { key: 'name', label: 'Policy Name', type: 'text', required: true },
            { key: 'businessType', label: 'Business Type', type: 'select', options: ['individual', 'sme', 'corporation', 'cooperative'], required: true },
            { key: 'minAmount', label: 'Minimum Amount (RWF)', type: 'number', required: true },
            { key: 'maxAmount', label: 'Maximum Amount (RWF)', type: 'number', required: true },
            { key: 'creditScoreRequirement', label: 'Credit Score Requirement', type: 'number', required: true },
            { key: 'collateralRequirement', label: 'Collateral Requirement (%)', type: 'number', required: true },
            { key: 'maxUtilization', label: 'Max Utilization (%)', type: 'number', required: true }
          ]
        };
      case 'eligibilityCriteria':
        return {
          title: 'New Eligibility Criteria',
          icon: <Users size={20} />,
          fields: [
            { key: 'name', label: 'Criteria Name', type: 'text', required: true },
            { key: 'category', label: 'Category', type: 'select', options: ['credit_score', 'business_age', 'revenue', 'collateral', 'guarantor', 'documents', 'industry', 'location'], required: true },
            { key: 'description', label: 'Description', type: 'textarea', required: true },
            { key: 'requirement', label: 'Requirement', type: 'text', required: true },
            { key: 'minimumValue', label: 'Minimum Value', type: 'number' },
            { key: 'maximumValue', label: 'Maximum Value', type: 'number' },
            { key: 'required', label: 'Required', type: 'checkbox' }
          ]
        };
      case 'riskAssessment':
        return {
          title: 'New Risk Assessment Rule',
          icon: <Scale size={20} />,
          fields: [
            { key: 'factor', label: 'Risk Factor', type: 'select', options: ['credit_score', 'payment_history', 'debt_to_income', 'business_age', 'industry_risk', 'collateral_value', 'cash_flow', 'market_conditions'], required: true },
            { key: 'weight', label: 'Weight (%)', type: 'number', required: true },
            { key: 'excellentMin', label: 'Excellent Min Score', type: 'number', group: 'excellent' },
            { key: 'excellentMax', label: 'Excellent Max Score', type: 'number', group: 'excellent' },
            { key: 'excellentScore', label: 'Excellent Points', type: 'number', group: 'excellent' },
            { key: 'goodMin', label: 'Good Min Score', type: 'number', group: 'good' },
            { key: 'goodMax', label: 'Good Max Score', type: 'number', group: 'good' },
            { key: 'goodScore', label: 'Good Points', type: 'number', group: 'good' },
            { key: 'fairMin', label: 'Fair Min Score', type: 'number', group: 'fair' },
            { key: 'fairMax', label: 'Fair Max Score', type: 'number', group: 'fair' },
            { key: 'fairScore', label: 'Fair Points', type: 'number', group: 'fair' },
            { key: 'poorMin', label: 'Poor Min Score', type: 'number', group: 'poor' },
            { key: 'poorMax', label: 'Poor Max Score', type: 'number', group: 'poor' },
            { key: 'poorScore', label: 'Poor Points', type: 'number', group: 'poor' }
          ]
        };
      case 'repaymentPolicies':
        return {
          title: 'New Repayment Policy',
          icon: <Calendar size={20} />,
          fields: [
            { key: 'name', label: 'Policy Name', type: 'text', required: true },
            { key: 'frequency', label: 'Frequency', type: 'select', options: ['weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually'], required: true },
            { key: 'gracePeriod', label: 'Grace Period (days)', type: 'number', required: true },
            { key: 'lateFee', label: 'Late Fee (RWF)', type: 'number', required: true },
            { key: 'penaltyRate', label: 'Penalty Rate (%)', type: 'number', step: '0.1', required: true },
            { key: 'maxExtensions', label: 'Max Extensions', type: 'number', required: true },
            { key: 'defaultThreshold', label: 'Default Threshold (days)', type: 'number', required: true }
          ]
        };
      case 'cargoTypePolicies':
        return {
          title: 'New Cargo Type Policy',
          icon: <Truck size={20} />,
          fields: [
            { key: 'cargoType', label: 'Cargo Type', type: 'text', required: true },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'], required: true },
            { key: 'riskMultiplier', label: 'Risk Multiplier', type: 'number', step: '0.1', required: true },
            { key: 'maxLoanAmount', label: 'Max Loan Amount (RWF)', type: 'number', required: true },
            { key: 'insuranceRequired', label: 'Insurance Required', type: 'checkbox' },
            { key: 'specialConditions', label: 'Special Conditions (comma-separated)', type: 'textarea' }
          ]
        };
      case 'globalSettings':
        return {
          title: 'System Configuration',
          icon: <Settings size={20} />,
          fields: [
            { key: 'name', label: 'Configuration Name', type: 'text', required: true },
            { key: 'autoApprovalLimit', label: 'Auto Approval Limit (RWF)', type: 'number', required: true },
            { key: 'manualReviewThreshold', label: 'Manual Review Threshold (RWF)', type: 'number', required: true },
            { key: 'maxConcurrentLoans', label: 'Max Concurrent Loans', type: 'number', required: true },
            { key: 'totalExposureLimit', label: 'Total Exposure Limit (RWF)', type: 'number', required: true },
            { key: 'cooldownPeriod', label: 'Cooldown Period (days)', type: 'number', required: true },
            { key: 'complianceMode', label: 'Strict Compliance Mode', type: 'checkbox' },
            { key: 'auditTrail', label: 'Audit Trail Enabled', type: 'checkbox' }
          ]
        };
      default:
        return {
          title: 'New Configuration',
          icon: <Settings size={20} />,
          fields: []
        };
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

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    config.fields.forEach(field => {
      if (field.required) {
        const value = field.group ? formData[field.group]?.[field.key] : formData[field.key];
        if (!value && value !== 0) {
          newErrors[field.key] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    // Generate ID and set defaults
    const policyData = {
      id: `${category.toUpperCase().slice(0, 2)}-${Date.now().toString().slice(-6)}`,
      ...formData,
      isActive: true,
      created_at: new Date().toISOString()
    };

    // Handle special cases for different policy types
    if (category === 'cargoTypePolicies' && formData.specialConditions) {
      policyData.specialConditions = formData.specialConditions.split(',').map((s: string) => s.trim());
    }

    // Handle risk assessment scoring criteria
    if (category === 'riskAssessment') {
      policyData.scoringCriteria = {
        excellent: {
          min: formData.excellent?.excellentMin || 0,
          max: formData.excellent?.excellentMax || 0,
          score: formData.excellent?.excellentScore || 0
        },
        good: {
          min: formData.good?.goodMin || 0,
          max: formData.good?.goodMax || 0,
          score: formData.good?.goodScore || 0
        },
        fair: {
          min: formData.fair?.fairMin || 0,
          max: formData.fair?.fairMax || 0,
          score: formData.fair?.fairScore || 0
        },
        poor: {
          min: formData.poor?.poorMin || 0,
          max: formData.poor?.poorMax || 0,
          score: formData.poor?.poorScore || 0
        }
      };
      
      // Remove the grouped data from the main object
      delete policyData.excellent;
      delete policyData.good;
      delete policyData.fair;
      delete policyData.poor;
    }

    onSave(policyData);
  };

  const renderField = (field: any) => {
    const value = field.group ? formData[field.group]?.[field.key] || '' : formData[field.key] || '';
    const error = errors[field.key];

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value, field.group)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${error ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select {field.label}</option>
            {field.options.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value, field.group)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${error ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            rows={3}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(field.key, e.target.checked, field.group)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-slate-600">Yes</span>
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            step={field.step}
            value={value}
            onChange={(e) => handleInputChange(field.key, field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value, field.group)}
            className={`w-full px-3 py-2 border rounded-lg text-sm ${error ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              {config.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{config.title}</h2>
              <p className="text-sm text-slate-500">Configure new policy parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.key] && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {errors[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={16} />
                Create Policy
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyConfigurationModal;