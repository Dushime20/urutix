import React from 'react';
import { FaDollarSign, FaCalculator, FaGasPump, FaTools, FaThermometerHalf } from 'react-icons/fa';

interface CostStructureStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const CostStructureStep: React.FC<CostStructureStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleCostInputChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange('costStructure', {
      ...formData.costStructure,
      [field]: numValue,
    });
  };

  const costCategories = [
    {
      title: 'Base Rates',
      icon: <FaCalculator className="w-4 h-4" />,
      fields: [
        { key: 'baseRate', label: 'Base Rate ($/hour)', placeholder: '50.00', description: 'Standard hourly rate' },
        { key: 'perKmRate', label: 'Per KM Rate ($/km)', placeholder: '2.50', description: 'Rate per kilometer' },
        { key: 'perMileRate', label: 'Per Mile Rate ($/mile)', placeholder: '4.00', description: 'Rate per mile' },
        { key: 'dailyRate', label: 'Daily Rate ($/day)', placeholder: '400.00', description: 'Daily rental rate' },
        { key: 'weeklyRate', label: 'Weekly Rate ($/week)', placeholder: '2500.00', description: 'Weekly rental rate' },
        { key: 'monthlyRate', label: 'Monthly Rate ($/month)', placeholder: '9000.00', description: 'Monthly rental rate' },
      ],
    },
    {
      title: 'Fuel & Operating Costs',
      icon: <FaGasPump className="w-4 h-4" />,
      fields: [
        { key: 'fuelSurcharge', label: 'Fuel Surcharge (%)', placeholder: '15.0', description: 'Fuel cost surcharge' },
        { key: 'idleTimeRate', label: 'Idle Time Rate ($/hour)', placeholder: '25.00', description: 'Rate for idle time' },
        { key: 'waitingTimeRate', label: 'Waiting Time Rate ($/hour)', placeholder: '30.00', description: 'Rate for waiting time' },
        { key: 'detentionRate', label: 'Detention Rate ($/hour)', placeholder: '40.00', description: 'Detention charge rate' },
        { key: 'tollSurcharge', label: 'Toll Surcharge (%)', placeholder: '10.0', description: 'Toll road surcharge' },
        { key: 'parkingSurcharge', label: 'Parking Surcharge ($)', placeholder: '20.00', description: 'Parking fee surcharge' },
      ],
    },
    {
      title: 'Special Handling Surcharges',
      icon: <FaTools className="w-4 h-4" />,
      fields: [
        { key: 'hazmatSurcharge', label: 'Hazmat Surcharge (%)', placeholder: '25.0', description: 'Hazardous materials surcharge' },
        { key: 'refrigeratedSurcharge', label: 'Refrigerated Surcharge (%)', placeholder: '20.0', description: 'Refrigeration surcharge' },
        { key: 'oversizedSurcharge', label: 'Oversized Surcharge (%)', placeholder: '30.0', description: 'Oversized load surcharge' },
        { key: 'fragileSurcharge', label: 'Fragile Surcharge (%)', placeholder: '15.0', description: 'Fragile cargo surcharge' },
        { key: 'valuableSurcharge', label: 'Valuable Surcharge (%)', placeholder: '35.0', description: 'Valuable cargo surcharge' },
        { key: 'urgentSurcharge', label: 'Urgent Surcharge (%)', placeholder: '40.0', description: 'Urgent delivery surcharge' },
      ],
    },
    {
      title: 'Equipment & Service Surcharges',
      icon: <FaThermometerHalf className="w-4 h-4" />,
      fields: [
        { key: 'forkliftSurcharge', label: 'Forklift Surcharge ($)', placeholder: '50.00', description: 'Forklift service charge' },
        { key: 'craneSurcharge', label: 'Crane Surcharge ($)', placeholder: '100.00', description: 'Crane service charge' },
        { key: 'loadingDockSurcharge', label: 'Loading Dock Surcharge ($)', placeholder: '30.00', description: 'Loading dock fee' },
        { key: 'temperatureMonitoringSurcharge', label: 'Temperature Monitoring ($)', placeholder: '25.00', description: 'Temperature monitoring fee' },
        { key: 'gpsTrackingSurcharge', label: 'GPS Tracking Surcharge ($)', placeholder: '15.00', description: 'GPS tracking fee' },
        { key: 'insuranceSurcharge', label: 'Insurance Surcharge (%)', placeholder: '5.0', description: 'Additional insurance cost' },
      ],
    },
  ];

  const calculateTotalCost = () => {
    const baseRate = formData.costStructure?.baseRate || 0;
    const perKmRate = formData.costStructure?.perKmRate || 0;
    const fuelSurcharge = formData.costStructure?.fuelSurcharge || 0;
    const hazmatSurcharge = formData.costStructure?.hazmatSurcharge || 0;
    const refrigeratedSurcharge = formData.costStructure?.refrigeratedSurcharge || 0;

    const baseCost = baseRate + (perKmRate * 100); // Example: 100km trip
    const surcharges = (baseCost * (fuelSurcharge + hazmatSurcharge + refrigeratedSurcharge)) / 100;
    
    return baseCost + surcharges;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <FaDollarSign className="w-5 h-5 text-gray-600" />
          Cost Structure Configuration
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure pricing rates and surcharges for this truck.
        </p>
      </div>

      {/* Cost Categories */}
      <div className="space-y-6">
        {costCategories.map((category) => (
          <div key={category.title} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              {category.icon}
              <h4 className="text-md font-medium text-gray-900">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {category.fields.map(({ key, label, placeholder, description }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-600 mb-1">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure?.[key] || ''}
                    onChange={(e) => handleCostInputChange(key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder={placeholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cost Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Cost Structure Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Base Rate:</span>
            <span className="ml-2 font-medium">${formData.costStructure?.baseRate || 0}/hour</span>
          </div>
          <div>
            <span className="text-gray-600">Per KM Rate:</span>
            <span className="ml-2 font-medium">${formData.costStructure?.perKmRate || 0}/km</span>
          </div>
          <div>
            <span className="text-gray-600">Daily Rate:</span>
            <span className="ml-2 font-medium">${formData.costStructure?.dailyRate || 0}/day</span>
          </div>
          <div>
            <span className="text-gray-600">Fuel Surcharge:</span>
            <span className="ml-2 font-medium">{formData.costStructure?.fuelSurcharge || 0}%</span>
          </div>
          <div>
            <span className="text-gray-600">Hazmat Surcharge:</span>
            <span className="ml-2 font-medium">{formData.costStructure?.hazmatSurcharge || 0}%</span>
          </div>
          <div>
            <span className="text-gray-600">Refrigerated Surcharge:</span>
            <span className="ml-2 font-medium">{formData.costStructure?.refrigeratedSurcharge || 0}%</span>
          </div>
        </div>
        
        {/* Example Cost Calculation */}
        <div className="mt-4 p-3 bg-white rounded border">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Example Cost Calculation (100km trip)</h5>
          <div className="text-sm text-gray-600">
            <div>Base Cost: ${formData.costStructure?.baseRate || 0} + (${formData.costStructure?.perKmRate || 0} × 100km)</div>
            <div>Total Estimated Cost: <span className="font-medium text-gray-900">${calculateTotalCost().toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      {/* Pricing Notes */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Pricing Notes</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Base rates are applied to all trips</p>
          <p>• Surcharges are calculated as percentages of the base cost</p>
          <p>• Special handling surcharges apply when cargo requires specific equipment</p>
          <p>• Fuel surcharges may vary based on current fuel prices</p>
          <p>• All rates are subject to negotiation and market conditions</p>
        </div>
      </div>
    </div>
  );
};
