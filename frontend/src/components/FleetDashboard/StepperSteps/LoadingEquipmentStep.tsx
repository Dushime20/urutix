import React from 'react';
import { FaTools, FaClock } from 'react-icons/fa';

interface LoadingEquipmentStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

export const LoadingEquipmentStep: React.FC<LoadingEquipmentStepProps> = ({
  formData,
  handleInputChange,
}) => {
  const handleEquipmentToggle = (key: string) => {
    handleInputChange(key, !formData[key]);
  };

  const handleTimeChange = (field: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    // Use dot notation to update nested loadingCapabilities object
    handleInputChange(`loadingCapabilities.${field}`, numValue);
  };

  const equipmentOptions = [
    { key: 'hasSideLift', label: 'Side Lift', icon: '⬆️', description: 'Side-mounted hydraulic lift' },
    { key: 'hasRollerBed', label: 'Roller Bed', icon: '📦', description: 'Roller bed for easy cargo movement' },
    { key: 'hasDropDeck', label: 'Drop Deck', icon: '📉', description: 'Lowerable deck for oversized cargo' },
    { key: 'hasExtendable', label: 'Extendable', icon: '📏', description: 'Extendable trailer length' },
    { key: 'hasLowbed', label: 'Lowbed', icon: '📐', description: 'Low-profile bed for heavy equipment' },
    { key: 'hasStepDeck', label: 'Step Deck', icon: '📋', description: 'Multi-level deck configuration' },
    { key: 'hasPowerOnly', label: 'Power Only', icon: '🔌', description: 'Tractor only, no trailer' },
    { key: 'hasContainerChassis', label: 'Container Chassis', icon: '📦', description: 'Container transport capability' },
    { key: 'hasSideRails', label: 'Side Rails', icon: '🔧', description: 'Side rails for cargo containment' },
    { key: 'hasTarps', label: 'Tarps', icon: '🧵', description: 'Weather-protective tarps' },
    { key: 'hasStraps', label: 'Straps', icon: '🔗', description: 'Cargo securing straps' },
    { key: 'hasChains', label: 'Chains', icon: '⛓️', description: 'Heavy-duty securing chains' },
    { key: 'hasRam', label: 'Loading Ramps', icon: '🛥️', description: 'Portable loading ramps' },
  ];

  const handlingRequirements = [
    {
      key: 'hasLiftGate',
      label: 'Requires Forklift',
      icon: '🔧',
      description: 'Truck has lift gate — can service loads requiring forklift for loading/unloading',
    },
    {
      key: 'hasWinch',
      label: 'Requires Crane',
      icon: '🏗️',
      description: 'Truck has winch/crane — can service loads requiring crane for loading/unloading',
    },
    {
      key: 'hasTailLift',
      label: 'Requires Loading Dock',
      icon: '🚪',
      description: 'Truck has tail lift — can service loads requiring a loading dock',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaTools className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Hydraulic & Loading Systems</h3>
      </div>

      {/* Cargo Handling Requirements */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-3">
          Cargo Handling Requirements
          <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic uppercase tracking-tighter">Match Critical</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {handlingRequirements.map(({ key, label, icon, description }) => (
            <label key={key} className="group flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={formData[key] || false}
                  onChange={() => handleInputChange(key, !formData[key])}
                  className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                    {icon} {label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Equipment Selection */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">Hardware Inventory</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {equipmentOptions.map(({ key, label, icon, description }) => (
              <label key={key} className="group flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
                <div className="pt-1">
                  <input
                    type="checkbox"
                    checked={formData[key] || false}
                    onChange={() => handleEquipmentToggle(key)}
                    className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                      {icon} {label}
                    </span>
                    {(key === 'hasTailLift' || key === 'hasLoadingDock') && (
                      <span className="text-[9px] text-blue-600 dark:text-blue-500 font-bold italic uppercase tracking-tighter">Match Critical</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    {description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Loading/Unloading Time Estimates */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
            <FaClock className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
            Operational Time Matrix
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Loading Latency (MIN)</label>
              <input
                type="number"
                value={formData.loadingCapabilities?.maxLoadingTime || ''}
                onChange={(e) => handleTimeChange('maxLoadingTime', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 px-1">MAX Unloading Latency (MIN)</label>
              <input
                type="number"
                value={formData.loadingCapabilities?.maxUnloadingTime || ''}
                onChange={(e) => handleTimeChange('maxUnloadingTime', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 dark:focus:border-blue-500 transition-all outline-none shadow-none"
                placeholder="30"
              />
            </div>
          </div>
        </div>

        {/* Equipment Summary */}
        <div className="bg-blue-600/5 dark:bg-blue-600/10 rounded-lg p-4 border border-blue-600/10">
          <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-3">Manifest Summary</h4>
          <div className="flex flex-wrap gap-2">
            {handlingRequirements
              .filter(({ key }) => formData[key])
              .map(({ key, label, icon }) => (
                <span key={key} className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-[10px] font-bold text-blue-700 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800 uppercase tracking-wider shadow-none transition-all">
                  <span className="mr-1.5 opacity-70">{icon}</span>
                  {label}
                </span>
              ))}
            {equipmentOptions
              .filter(({ key }) => formData[key])
              .map(({ key, label, icon }) => (
                <span key={key} className="px-2.5 py-1 bg-white dark:bg-gray-800 text-[10px] font-bold text-gray-900 dark:text-white rounded-md border border-gray-100 dark:border-gray-700 uppercase tracking-wider shadow-none transition-all">
                  <span className="mr-1.5 opacity-70">{icon}</span>
                  {label}
                </span>
              ))}
            {handlingRequirements.filter(({ key }) => formData[key]).length === 0 &&
             equipmentOptions.filter(({ key }) => formData[key]).length === 0 && (
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest italic">NO ASSETS REGISTERED</span>
            )}
          </div>
        </div>
    </div>
  );
};

