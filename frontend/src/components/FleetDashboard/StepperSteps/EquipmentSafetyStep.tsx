import React from 'react';
import { FaShieldAlt, FaTools, FaLink, FaTruck } from 'react-icons/fa';

interface EquipmentSafetyStepProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const EquipmentSafetyStep: React.FC<EquipmentSafetyStepProps> = ({
  formData,
  handleInputChange
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <FaShieldAlt className="w-4 h-4 text-blue-600 dark:text-blue-500" />
        <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Equipment & Safety Configuration</h3>
      </div>

      {/* Core Requirements */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaShieldAlt className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Core Requirements
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
            <input
              type="checkbox"
              checked={formData.hasRefrigeration || false}
              onChange={(e) => handleInputChange('hasRefrigeration', e.target.checked)}
              className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
            />
            <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
              Refrigeration
            </span>
          </label>

          <label className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
            <input
              type="checkbox"
              checked={formData.hasLiftGate || false}
              onChange={(e) => handleInputChange('hasLiftGate', e.target.checked)}
              className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
            />
            <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
              Lift Gate
            </span>
          </label>

          <label className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
            <input
              type="checkbox"
              checked={formData.hasGps || false}
              onChange={(e) => handleInputChange('hasGps', e.target.checked)}
              className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
            />
            <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
              GPS System
            </span>
          </label>

          <label className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
            <input
              type="checkbox"
              checked={formData.hasHazmatPermit || false}
              onChange={(e) => handleInputChange('hasHazmatPermit', e.target.checked)}
              className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
            />
            <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
              Hazmat Permit
            </span>
          </label>
        </div>
      </div>

      {/* Essential Cargo Equipment */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaTools className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Essential Cargo Equipment
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'hasSideRails', label: 'Side Rails' },
            { key: 'hasTarps', label: 'Tarps' },
            { key: 'hasStraps', label: 'Straps' },
            { key: 'hasChains', label: 'Chains' },
            { key: 'hasWinch', label: 'Winch' },
            { key: 'hasRam', label: 'Loading Ramps' },
          ].map(({ key, label }) => (
            <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData[key] || false}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Loading Equipment */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Loading Equipment</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'hasTailLift', label: 'Tail Lift' },
            { key: 'hasSideLift', label: 'Side Lift' },
            { key: 'hasRollerBed', label: 'Roller Bed' },
            { key: 'hasDropDeck', label: 'Drop Deck' },
            { key: 'hasExtendable', label: 'Extendable' },
            { key: 'hasLowbed', label: 'Lowbed' },
          ].map(({ key, label }) => (
            <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData[key] || false}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Specialized Equipment */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaTruck className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Specialized Equipment
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'hasStepDeck', label: 'Step Deck' },
            { key: 'hasPowerOnly', label: 'Power Only' },
            { key: 'hasContainerChassis', label: 'Container Chassis' },
          ].map(({ key, label }) => (
            <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData[key] || false}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Safety Systems */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center mb-4">
          <FaShieldAlt className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-500" />
          Safety Systems
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'hasLeakDetection', label: 'Leak Detection' },
            { key: 'hasOverfillProtection', label: 'Overfill Protection' },
            { key: 'hasEmergencyShutdown', label: 'Emergency Shutdown' },
            { key: 'hasFireSuppression', label: 'Fire Suppression' },
            { key: 'hasExplosionProof', label: 'Explosion Proof' },
          ].map(({ key, label }) => (
            <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData[key] || false}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Material Specifications */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Material Specifications</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: 'hasCorrosionResistant', label: 'Corrosion Resistant' },
            { key: 'hasStainlessSteel', label: 'Stainless Steel' },
            { key: 'hasAluminum', label: 'Aluminum' },
            { key: 'hasCarbonSteel', label: 'Carbon Steel' },
            { key: 'hasFiberglass', label: 'Fiberglass' },
            { key: 'hasPlastic', label: 'Plastic' },
            { key: 'hasComposite', label: 'Composite' },
            { key: 'hasInsulated', label: 'Insulated' },
          ].map(({ key, label }) => (
            <label key={key} className="group flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-600/30 transition-all shadow-none">
              <input
                type="checkbox"
                checked={formData[key] || false}
                onChange={(e) => handleInputChange(key, e.target.checked)}
                className="w-4 h-4 rounded border-gray-200 dark:border-gray-600 text-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:ring-offset-0 bg-white dark:bg-gray-700 transition-all"
              />
              <span className="text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EquipmentSafetyStep;