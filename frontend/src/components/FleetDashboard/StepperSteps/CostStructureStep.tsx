import React from 'react';
import { FaDollarSign, FaCalculator, FaGasPump, FaTools, FaThermometerHalf, FaWrench, FaUser, FaPhone } from 'react-icons/fa';
import { useCurrencyFormat } from '../../../hooks/useCurrencyFormat';

interface CostStructureStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const CostStructureStep: React.FC<CostStructureStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const { currency } = useCurrencyFormat();
  const currencyLabel = currency || 'USD';

  const handleCostInputChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    handleInputChange('costStructure', {
      ...formData.costStructure,
      [field]: numValue,
    });
  };

  const emergencyContacts = Array.isArray(formData.emergencyContacts) && formData.emergencyContacts.length > 0
    ? formData.emergencyContacts
    : [{ name: '', phone: '', relationship: '', email: '' }];

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    const next = emergencyContacts.map((contact: any, i: number) =>
      i === index ? { ...contact, [field]: value } : contact
    );
    handleInputChange('emergencyContacts', next);
  };

  const addEmergencyContact = () => {
    if (emergencyContacts.length >= 3) return;
    handleInputChange('emergencyContacts', [
      ...emergencyContacts,
      { name: '', phone: '', relationship: '', email: '' },
    ]);
  };

  const costCategories = [
    {
      title: 'Base Rates',
      icon: <FaCalculator className="w-4 h-4" />,
      fields: [
        { key: 'baseRate', label: `Base Rate (${currencyLabel}/hour)`, placeholder: '50.00', description: 'Standard hourly rate' },
        { key: 'perKmRate', label: `Per KM Rate (${currencyLabel}/km)`, placeholder: '2.50', description: 'Rate per kilometer' },
        { key: 'perMileRate', label: `Per Mile Rate (${currencyLabel}/mile)`, placeholder: '4.00', description: 'Rate per mile' },
        { key: 'dailyRate', label: `Daily Rate (${currencyLabel}/day)`, placeholder: '400.00', description: 'Daily rental rate' },
        { key: 'weeklyRate', label: `Weekly Rate (${currencyLabel}/week)`, placeholder: '2500.00', description: 'Weekly rental rate' },
        { key: 'monthlyRate', label: `Monthly Rate (${currencyLabel}/month)`, placeholder: '9000.00', description: 'Monthly rental rate' },
      ],
    },
    {
      title: 'Fuel Surcharges, Tolls, Parking & Detention',
      icon: <FaGasPump className="w-4 h-4" />,
      fields: [
        { key: 'fuelSurcharge', label: 'Fuel Surcharge (%)', placeholder: '15.0', description: 'Fuel cost surcharge' },
        { key: 'idleTimeRate', label: `Idle Time Rate (${currencyLabel}/hour)`, placeholder: '25.00', description: 'Rate for idle time' },
        { key: 'waitingTimeRate', label: `Waiting Time Rate (${currencyLabel}/hour)`, placeholder: '30.00', description: 'Rate for waiting time' },
        { key: 'detentionRate', label: `Detention Rate (${currencyLabel}/hour)`, placeholder: '40.00', description: 'Detention charge rate' },
        { key: 'tollSurcharge', label: 'Tolls (%)', placeholder: '10.0', description: 'Toll surcharge' },
        { key: 'parkingSurcharge', label: `Parking (${currencyLabel})`, placeholder: '20.00', description: 'Parking fee' },
      ],
    },
    {
      title: 'Special Handling Charges',
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
      title: 'Equipment Charges',
      icon: <FaThermometerHalf className="w-4 h-4" />,
      fields: [
        { key: 'forkliftSurcharge', label: `Forklift (${currencyLabel})`, placeholder: '50.00', description: 'Forklift service charge' },
        { key: 'craneSurcharge', label: `Crane (${currencyLabel})`, placeholder: '100.00', description: 'Crane service charge' },
        { key: 'loadingDockSurcharge', label: `Loading Dock (${currencyLabel})`, placeholder: '30.00', description: 'Loading dock fee' },
        { key: 'temperatureMonitoringSurcharge', label: `Temperature Monitoring (${currencyLabel})`, placeholder: '25.00', description: 'Temperature monitoring fee' },
        { key: 'gpsTrackingSurcharge', label: `GPS Tracking (${currencyLabel})`, placeholder: '15.00', description: 'GPS tracking fee' },
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
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Costing & Operations</h3>
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
            { label: 'Base Hourly', value: `${currencyLabel} ${formData.costStructure?.baseRate || 0}` },
            { label: 'Distance Unit', value: `${currencyLabel} ${formData.costStructure?.perKmRate || 0}` },
            { label: 'Daily Ceiling', value: `${currencyLabel} ${formData.costStructure?.dailyRate || 0}` },
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
              <span>{currencyLabel} {formData.costStructure?.baseRate || 0} + ({formData.costStructure?.perKmRate || 0} × 100)</span>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-widest">Total Projected Yield</span>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">{currencyLabel} {calculateTotalCost().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Scheduling */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaWrench className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Maintenance Scheduling
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Last Maintenance Date</label>
            <input
              type="date"
              value={formData.lastMaintenanceDate || ''}
              onChange={(e) => handleInputChange('lastMaintenanceDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Next Maintenance Date</label>
            <input
              type="date"
              value={formData.nextMaintenanceDate || ''}
              onChange={(e) => handleInputChange('nextMaintenanceDate', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaUser className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Driver Requirements
        </h4>
        <textarea
          value={formData.driverRequirements || ''}
          onChange={(e) => handleInputChange('driverRequirements', e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none min-h-[90px] resize-none"
          placeholder="e.g. Valid Class C license, minimum 3 years experience, hazmat endorsement"
          maxLength={2000}
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
          <FaPhone className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Emergency Contacts
        </h4>
        <div className="space-y-4">
          {emergencyContacts.map((contact: any, index: number) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-700">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Name</label>
                <input
                  type="text"
                  value={contact.name || ''}
                  onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="Contact name"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Phone</label>
                <input
                  type="tel"
                  value={contact.phone || ''}
                  onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="+254 700 000 000"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Relationship</label>
                <input
                  type="text"
                  value={contact.relationship || ''}
                  onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="e.g. Fleet manager"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Email</label>
                <input
                  type="email"
                  value={contact.email || ''}
                  onChange={(e) => updateEmergencyContact(index, 'email', e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                  placeholder="email@example.com"
                  maxLength={100}
                />
              </div>
            </div>
          ))}
          {emergencyContacts.length < 3 && (
            <button
              type="button"
              onClick={addEmergencyContact}
              className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:underline"
            >
              + Add another contact
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          Asset Value
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Purchase Date</label>
            <input
              type="date"
              value={formData.assetDetails?.purchaseDate || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), purchaseDate: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Purchase Price ({currencyLabel})</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.assetDetails?.purchasePrice || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), purchasePrice: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Current Value ({currencyLabel})</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.assetDetails?.currentValue || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), currentValue: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>

      {(formData.ownershipType === 'LEASED' || formData.ownershipType === 'RENTED' || formData.ownershipType === 'FINANCED') && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
            Lease Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Lessor</label>
              <input
                type="text"
                value={formData.assetDetails?.leaseLessor || ''}
                onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), leaseLessor: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Contract Number</label>
              <input
                type="text"
                value={formData.assetDetails?.leaseContractNumber || ''}
                onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), leaseContractNumber: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Monthly Payment ({currencyLabel})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.assetDetails?.leaseMonthlyPayment || ''}
                onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), leaseMonthlyPayment: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Start Date</label>
              <input
                type="date"
                value={formData.assetDetails?.leaseStartDate || ''}
                onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), leaseStartDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">End Date</label>
              <input
                type="date"
                value={formData.assetDetails?.leaseEndDate || ''}
                onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), leaseEndDate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          Fuel Card Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Provider</label>
            <input
              type="text"
              value={formData.assetDetails?.fuelCardProvider || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), fuelCardProvider: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="e.g. Shell, Total"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Card Number</label>
            <input
              type="text"
              value={formData.assetDetails?.fuelCardNumber || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), fuelCardNumber: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="Last 4 or tokenized number"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Expiry</label>
            <input
              type="date"
              value={formData.assetDetails?.fuelCardExpiry || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), fuelCardExpiry: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
          Retirement Workflow
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Status</label>
            <select
              value={formData.assetDetails?.retirementStatus || 'ACTIVE'}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), retirementStatus: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            >
              <option value="ACTIVE" className="dark:bg-gray-900">Active</option>
              <option value="SCHEDULED" className="dark:bg-gray-900">Scheduled</option>
              <option value="RETIRED" className="dark:bg-gray-900">Retired</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Planned Date</label>
            <input
              type="date"
              value={formData.assetDetails?.retirementDate || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), retirementDate: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">Reason</label>
            <input
              type="text"
              value={formData.assetDetails?.retirementReason || ''}
              onChange={(e) => handleInputChange('assetDetails', { ...(formData.assetDetails || {}), retirementReason: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
              placeholder="e.g. End of useful life"
            />
          </div>
        </div>
      </div>

      {(formData.createdBy || formData.updatedBy || formData.assetDetails?.createdBy) && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Audit</h4>
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">
            Created by {formData.createdBy || formData.assetDetails?.createdBy || '—'}
            {formData.updatedBy || formData.assetDetails?.updatedBy
              ? ` · Updated by ${formData.updatedBy || formData.assetDetails?.updatedBy}`
              : ''}
          </p>
        </div>
      )}

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

