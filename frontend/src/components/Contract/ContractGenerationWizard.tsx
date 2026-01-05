import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  X,
  DollarSign,
  Calendar,
  Package,
  Truck,
  MapPin,
  Shield,
  Users,
  Eye,
  Send,
  Download,
  Clock
} from 'lucide-react';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
  icon: string;
  clauses: string[];
  estimatedTime: string;
}

export interface ContractData {
  // Load Information
  loadId: string;
  loadTitle: string;
  cargoType: string;
  weight: number;
  value: number;
  currency: string;
  
  // Route
  pickupLocation: string;
  deliveryLocation: string;
  pickupDate: string;
  deliveryDate: string;
  distance: number;
  
  // Parties
  cargoOwner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  
  transporter: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    dotNumber?: string;
    mcNumber?: string;
  };
  
  broker: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    commissionRate: number;
  };
  
  // Financial
  agreedRate: number;
  paymentTerms: string;
  brokerCommission: number;
  
  // Additional
  specialInstructions?: string;
  insuranceRequired: boolean;
  insuranceAmount?: number;
}

interface ContractGenerationWizardProps {
  contractData: ContractData;
  onGenerate: (template: ContractTemplate, customizations: any) => void;
  onCancel: () => void;
}

export const ContractGenerationWizard: React.FC<ContractGenerationWizardProps> = ({
  contractData,
  onGenerate,
  onCancel
}) => {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customizations, setCustomizations] = useState({
    agreedRate: contractData.agreedRate,
    paymentTerms: contractData.paymentTerms,
    brokerCommission: contractData.brokerCommission,
    specialClauses: [] as string[],
    insuranceRequired: contractData.insuranceRequired,
    insuranceAmount: contractData.insuranceAmount || 0,
  });

  const templates: ContractTemplate[] = [
    {
      id: 'standard',
      name: 'Standard Load Agreement',
      description: 'Perfect for general cargo with standard terms and conditions',
      recommended: contractData.value < 50000,
      icon: '📋',
      clauses: [
        'Basic liability coverage',
        'Standard payment terms (Net 30)',
        'General cargo handling procedures',
        'Basic dispute resolution',
      ],
      estimatedTime: '2 minutes'
    },
    {
      id: 'high-value',
      name: 'High-Value Cargo Contract',
      description: 'Enhanced protection for valuable shipments requiring special handling',
      recommended: contractData.value >= 50000,
      icon: '💎',
      clauses: [
        'Enhanced liability coverage',
        'Additional insurance requirements',
        'Special handling protocols',
        'Photo documentation mandatory',
        'Real-time GPS tracking',
        'Enhanced dispute resolution',
      ],
      estimatedTime: '3 minutes'
    },
    {
      id: 'multi-stop',
      name: 'Multi-Stop Agreement',
      description: 'For loads with multiple pickup or delivery locations',
      recommended: false,
      icon: '🗺️',
      clauses: [
        'Multiple location handling',
        'Milestone-based payments',
        'Stop sequence requirements',
        'Time windows per stop',
        'Partial delivery protocols',
      ],
      estimatedTime: '4 minutes'
    },
    {
      id: 'hazmat',
      name: 'Hazardous Materials Contract',
      description: 'Specialized contract for hazardous cargo with strict compliance',
      recommended: contractData.cargoType.toLowerCase().includes('hazard'),
      icon: '☢️',
      clauses: [
        'HAZMAT compliance certification',
        'Special safety protocols',
        'Emergency response procedures',
        'Enhanced liability insurance',
        'Regulatory documentation',
      ],
      estimatedTime: '5 minutes'
    }
  ];

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleCustomizationChange = (field: string, value: any) => {
    setCustomizations({ ...customizations, [field]: value });
  };

  const handleGenerate = () => {
    if (selectedTemplate) {
      onGenerate(selectedTemplate, customizations);
    }
  };

  const calculateTotalAmount = () => {
    return customizations.agreedRate + customizations.brokerCommission;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Contract Template</h2>
        <p className="text-gray-600">Choose the best template for your load requirements</p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template)}
            className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
              template.recommended
                ? 'border-violet-400 bg-violet-50 hover:shadow-xl'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
            }`}
          >
            {template.recommended && (
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                  RECOMMENDED
                </span>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="text-4xl">{template.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="space-y-2 mb-4">
                  {template.clauses.slice(0, 3).map((clause, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{clause}</span>
                    </div>
                  ))}
                  {template.clauses.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{template.clauses.length - 3} more clauses
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {template.estimatedTime}
                  </span>
                  <ArrowRight className="w-5 h-5 text-violet-600" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-violet-600" />
          Load Summary
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Load Value</p>
            <p className="font-semibold text-gray-900">
              {contractData.currency} {contractData.value.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Weight</p>
            <p className="font-semibold text-gray-900">{contractData.weight} kg</p>
          </div>
          <div>
            <p className="text-gray-500">Distance</p>
            <p className="font-semibold text-gray-900">{contractData.distance} km</p>
          </div>
          <div>
            <p className="text-gray-500">Cargo Type</p>
            <p className="font-semibold text-gray-900">{contractData.cargoType}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Customize Contract Details</h2>
        <p className="text-gray-600">Review and adjust the contract terms</p>
      </div>

      {/* Selected Template */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{selectedTemplate?.icon}</div>
          <div>
            <h3 className="font-bold text-gray-900">{selectedTemplate?.name}</h3>
            <p className="text-sm text-gray-600">{selectedTemplate?.description}</p>
          </div>
        </div>
      </div>

      {/* Financial Terms */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Financial Terms
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agreed Transport Rate
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={customizations.agreedRate}
                onChange={(e) => handleCustomizationChange('agreedRate', parseFloat(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Broker Commission ({contractData.broker.commissionRate}%)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                value={customizations.brokerCommission}
                onChange={(e) => handleCustomizationChange('brokerCommission', parseFloat(e.target.value))}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms
            </label>
            <select
              value={customizations.paymentTerms}
              onChange={(e) => handleCustomizationChange('paymentTerms', e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            >
              <option value="Net 15">Net 15 days</option>
              <option value="Net 30">Net 30 days</option>
              <option value="Net 60">Net 60 days</option>
              <option value="Upon Delivery">Upon Delivery</option>
              <option value="Advance Payment">50% Advance, 50% on Delivery</option>
            </select>
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Contract Value</p>
            <p className="text-3xl font-bold text-violet-600">
              ${calculateTotalAmount().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Insurance Requirements
        </h4>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={customizations.insuranceRequired}
              onChange={(e) => handleCustomizationChange('insuranceRequired', e.target.checked)}
              className="w-5 h-5 text-violet-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Require additional cargo insurance
            </span>
          </label>

          {customizations.insuranceRequired && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Coverage Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={customizations.insuranceAmount}
                  onChange={(e) => handleCustomizationChange('insuranceAmount', parseFloat(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Enter coverage amount"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: ${contractData.value.toLocaleString()} (load value)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Parties Information */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-600" />
          Contract Parties
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 mb-2">CARGO OWNER</p>
            <p className="font-bold text-gray-900">{contractData.cargoOwner.name}</p>
            <p className="text-sm text-gray-600">{contractData.cargoOwner.email}</p>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-emerald-900 mb-2">TRANSPORTER</p>
            <p className="font-bold text-gray-900">{contractData.transporter.name}</p>
            <p className="text-sm text-gray-600">{contractData.transporter.email}</p>
            {contractData.transporter.dotNumber && (
              <p className="text-xs text-gray-500 mt-1">
                DOT: {contractData.transporter.dotNumber}
              </p>
            )}
          </div>

          <div className="bg-violet-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-violet-900 mb-2">BROKER</p>
            <p className="font-bold text-gray-900">{contractData.broker.name}</p>
            <p className="text-sm text-gray-600">{contractData.broker.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Commission: {contractData.broker.commissionRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Generate Contract</h2>
        <p className="text-gray-600">Review all details before generating the contract</p>
      </div>

      {/* Contract Preview */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-h-96 overflow-y-auto">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {selectedTemplate?.name}
          </h3>
          <p className="text-sm text-gray-500">Contract ID: {contractData.loadId}-CONTRACT</p>
        </div>

        <div className="space-y-6 text-sm">
          {/* Parties */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">PARTIES TO THIS AGREEMENT</h4>
            <p className="text-gray-700 leading-relaxed">
              This Transportation Agreement ("Agreement") is entered into on {new Date().toLocaleDateString()}
              between <strong>{contractData.cargoOwner.name}</strong> ("Shipper"),
              <strong> {contractData.transporter.name}</strong> ("Carrier"), and
              <strong> {contractData.broker.name}</strong> ("Broker").
            </p>
          </div>

          {/* Load Details */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">LOAD SPECIFICATIONS</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Cargo Type: {contractData.cargoType}</li>
              <li>• Weight: {contractData.weight} kg</li>
              <li>• Declared Value: {contractData.currency} {contractData.value.toLocaleString()}</li>
              <li>• Pickup: {contractData.pickupLocation} on {new Date(contractData.pickupDate).toLocaleDateString()}</li>
              <li>• Delivery: {contractData.deliveryLocation} on {new Date(contractData.deliveryDate).toLocaleDateString()}</li>
            </ul>
          </div>

          {/* Financial Terms */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">FINANCIAL TERMS</h4>
            <ul className="space-y-1 text-gray-700">
              <li>• Transport Rate: ${customizations.agreedRate.toLocaleString()}</li>
              <li>• Broker Commission: ${customizations.brokerCommission.toLocaleString()} ({contractData.broker.commissionRate}%)</li>
              <li>• Total Contract Value: ${calculateTotalAmount().toLocaleString()}</li>
              <li>• Payment Terms: {customizations.paymentTerms}</li>
              {customizations.insuranceRequired && (
                <li>• Insurance: ${customizations.insuranceAmount.toLocaleString()} coverage required</li>
              )}
            </ul>
          </div>

          {/* Clauses */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">KEY TERMS & CONDITIONS</h4>
            <ul className="space-y-2 text-gray-700">
              {selectedTemplate?.clauses.map((clause, index) => (
                <li key={index}>• {clause}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Actions Summary */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-emerald-600" />
          Next Steps
        </h4>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-600">1.</span>
            <span>Contract will be generated as a PDF document</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-600">2.</span>
            <span>E-signature requests sent to all parties via email</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-600">3.</span>
            <span>Escrow account will be created upon full execution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-emerald-600">4.</span>
            <span>You'll receive notifications as parties sign</span>
          </li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">One-Click Contract Generation</h2>
                <p className="text-violet-100 text-sm">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !selectedTemplate}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Generate Contract
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractGenerationWizard;

