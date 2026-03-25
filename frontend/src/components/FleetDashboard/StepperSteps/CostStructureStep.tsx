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
    <div className="space-y-6 text-gray-900 dark:text-white">
      <div className="flex items-center gap-2 mb-6">
        <FaDollarSign className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Financial Architecture & Tariff Configuration</h3>
      </div>

      {/* Cost Categories */}
      <div className="space-y-8">
        {costCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="text-blue-600 dark:text-blue-500">{category.icon}</span>
              <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{category.title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.fields.map(({ key, label, placeholder, description }) => (
                <div key={key} className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{label}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costStructure?.[key] || ''}
                    onChange={(e) => handleCostInputChange(key, e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                    placeholder={placeholder}
                  />
                  <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium italic px-1 opacity-70 uppercase tracking-tighter">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cost Summary */}
      <div className="bg-blue-600/5 dark:bg-blue-600/10 rounded-lg p-4 border border-blue-600/10">
        <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-4">Financial Yield Projections</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Base Hourly', value: `$${formData.costStructure?.baseRate || 0}` },
            { label: 'Distance Unit', value: `$${formData.costStructure?.perKmRate || 0}` },
            { label: 'Daily Ceiling', value: `$${formData.costStructure?.dailyRate || 0}` },
            { label: 'Fuel Factor', value: `${formData.costStructure?.fuelSurcharge || 0}%` },
            { label: 'Hazmat Load', value: `${formData.costStructure?.hazmatSurcharge || 0}%` },
            { label: 'Thermal Load', value: `${formData.costStructure?.refrigeratedSurcharge || 0}%` },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <span className="block text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
              <span className="block text-sm font-black text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
        
        {/* Example Cost Calculation */}
        <div className="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 shadow-none">
          <h5 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3 flex items-center justify-between">
            Operational Matrix Projection (100KM)
            <span className="text-blue-600 font-black">ESTIMATION</span>
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">
              <span>Base Formula</span>
              <span>${formData.costStructure?.baseRate || 0} + (${formData.costStructure?.perKmRate || 0} × 100)</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Total Projected Yield</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">${calculateTotalCost().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Notes */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700">
        <h4 className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3">Operational Directives</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-tight">
          <p>• BASE RATES MANDATORY FOR ALL SORTIES</p>
          <p>• SURCHARGES SCALED TO BASE COMPUTATION</p>
          <p>• SPECIAL HANDLING REQUIRES ASSET VALIDATION</p>
          <p>• FUEL FLUCTUATIONS ADJUSTED IN REAL-TIME</p>
          <p>• MARKET VOLATILITY LIMITS RATE DURABILITY</p>
        </div>
      </div>
    </div>
  );
};

