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
      <div className="flex items-center space-x-3 mb-6">
        <FaShieldAlt className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Equipment & Safety</h3>
      </div>

      {/* Core Requirements */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaShieldAlt className="w-5 h-5 mr-2 text-gray-600" />
          Core Requirements
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasRefrigeration"
              checked={formData.hasRefrigeration || false}
              onChange={(e) => handleInputChange('hasRefrigeration', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasRefrigeration" className="ml-2 text-sm font-medium text-gray-700">
              Refrigeration
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasLiftGate"
              checked={formData.hasLiftGate || false}
              onChange={(e) => handleInputChange('hasLiftGate', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasLiftGate" className="ml-2 text-sm font-medium text-gray-700">
              Lift Gate
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasGps"
              checked={formData.hasGps || false}
              onChange={(e) => handleInputChange('hasGps', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasGps" className="ml-2 text-sm font-medium text-gray-700">
              GPS System
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasHazmatPermit"
              checked={formData.hasHazmatPermit || false}
              onChange={(e) => handleInputChange('hasHazmatPermit', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasHazmatPermit" className="ml-2 text-sm font-medium text-gray-700">
              Hazmat Permit
            </label>
          </div>
        </div>
      </div>

      {/* Essential Cargo Equipment */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaTools className="w-5 h-5 mr-2 text-gray-600" />
          Essential Cargo Equipment
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSideRails"
              checked={formData.hasSideRails || false}
              onChange={(e) => handleInputChange('hasSideRails', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasSideRails" className="ml-2 text-sm font-medium text-gray-700">
              Side Rails
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTarps"
              checked={formData.hasTarps || false}
              onChange={(e) => handleInputChange('hasTarps', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasTarps" className="ml-2 text-sm font-medium text-gray-700">
              Tarps
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasStraps"
              checked={formData.hasStraps || false}
              onChange={(e) => handleInputChange('hasStraps', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasStraps" className="ml-2 text-sm font-medium text-gray-700">
              Straps
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasChains"
              checked={formData.hasChains || false}
              onChange={(e) => handleInputChange('hasChains', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasChains" className="ml-2 text-sm font-medium text-gray-700">
              Chains
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasWinch"
              checked={formData.hasWinch || false}
              onChange={(e) => handleInputChange('hasWinch', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasWinch" className="ml-2 text-sm font-medium text-gray-700">
              Winch
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasRam"
              checked={formData.hasRam || false}
              onChange={(e) => handleInputChange('hasRam', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasRam" className="ml-2 text-sm font-medium text-gray-700">
              Loading Ramps
            </label>
          </div>
        </div>
      </div>

      {/* Loading Equipment */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Loading Equipment</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasTailLift"
              checked={formData.hasTailLift || false}
              onChange={(e) => handleInputChange('hasTailLift', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasTailLift" className="ml-2 text-sm font-medium text-gray-700">
              Tail Lift
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasSideLift"
              checked={formData.hasSideLift || false}
              onChange={(e) => handleInputChange('hasSideLift', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasSideLift" className="ml-2 text-sm font-medium text-gray-700">
              Side Lift
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasRollerBed"
              checked={formData.hasRollerBed || false}
              onChange={(e) => handleInputChange('hasRollerBed', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasRollerBed" className="ml-2 text-sm font-medium text-gray-700">
              Roller Bed
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDropDeck"
              checked={formData.hasDropDeck || false}
              onChange={(e) => handleInputChange('hasDropDeck', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasDropDeck" className="ml-2 text-sm font-medium text-gray-700">
              Drop Deck
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasExtendable"
              checked={formData.hasExtendable || false}
              onChange={(e) => handleInputChange('hasExtendable', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasExtendable" className="ml-2 text-sm font-medium text-gray-700">
              Extendable
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasLowbed"
              checked={formData.hasLowbed || false}
              onChange={(e) => handleInputChange('hasLowbed', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasLowbed" className="ml-2 text-sm font-medium text-gray-700">
              Lowbed
            </label>
          </div>
        </div>
      </div>

      {/* Specialized Equipment */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaTruck className="w-5 h-5 mr-2 text-gray-600" />
          Specialized Equipment
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasStepDeck"
              checked={formData.hasStepDeck || false}
              onChange={(e) => handleInputChange('hasStepDeck', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasStepDeck" className="ml-2 text-sm font-medium text-gray-700">
              Step Deck
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasPowerOnly"
              checked={formData.hasPowerOnly || false}
              onChange={(e) => handleInputChange('hasPowerOnly', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasPowerOnly" className="ml-2 text-sm font-medium text-gray-700">
              Power Only
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasContainerChassis"
              checked={formData.hasContainerChassis || false}
              onChange={(e) => handleInputChange('hasContainerChassis', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasContainerChassis" className="ml-2 text-sm font-medium text-gray-700">
              Container Chassis
            </label>
          </div>
        </div>
      </div>

      {/* Safety Systems */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800 flex items-center mb-4">
          <FaShieldAlt className="w-5 h-5 mr-2 text-gray-600" />
          Safety Systems
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasLeakDetection"
              checked={formData.hasLeakDetection || false}
              onChange={(e) => handleInputChange('hasLeakDetection', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasLeakDetection" className="ml-2 text-sm font-medium text-gray-700">
              Leak Detection
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasOverfillProtection"
              checked={formData.hasOverfillProtection || false}
              onChange={(e) => handleInputChange('hasOverfillProtection', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasOverfillProtection" className="ml-2 text-sm font-medium text-gray-700">
              Overfill Protection
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasEmergencyShutdown"
              checked={formData.hasEmergencyShutdown || false}
              onChange={(e) => handleInputChange('hasEmergencyShutdown', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasEmergencyShutdown" className="ml-2 text-sm font-medium text-gray-700">
              Emergency Shutdown
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasFireSuppression"
              checked={formData.hasFireSuppression || false}
              onChange={(e) => handleInputChange('hasFireSuppression', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasFireSuppression" className="ml-2 text-sm font-medium text-gray-700">
              Fire Suppression
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasExplosionProof"
              checked={formData.hasExplosionProof || false}
              onChange={(e) => handleInputChange('hasExplosionProof', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasExplosionProof" className="ml-2 text-sm font-medium text-gray-700">
              Explosion Proof
            </label>
          </div>
        </div>
      </div>

      {/* Material Specifications */}
      <div className="space-y-4">
        <h4 className="text-base font-medium text-gray-800">Material Specifications</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasCorrosionResistant"
              checked={formData.hasCorrosionResistant || false}
              onChange={(e) => handleInputChange('hasCorrosionResistant', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasCorrosionResistant" className="ml-2 text-sm font-medium text-gray-700">
              Corrosion Resistant
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasStainlessSteel"
              checked={formData.hasStainlessSteel || false}
              onChange={(e) => handleInputChange('hasStainlessSteel', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasStainlessSteel" className="ml-2 text-sm font-medium text-gray-700">
              Stainless Steel
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasAluminum"
              checked={formData.hasAluminum || false}
              onChange={(e) => handleInputChange('hasAluminum', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasAluminum" className="ml-2 text-sm font-medium text-gray-700">
              Aluminum
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasCarbonSteel"
              checked={formData.hasCarbonSteel || false}
              onChange={(e) => handleInputChange('hasCarbonSteel', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasCarbonSteel" className="ml-2 text-sm font-medium text-gray-700">
              Carbon Steel
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasFiberglass"
              checked={formData.hasFiberglass || false}
              onChange={(e) => handleInputChange('hasFiberglass', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasFiberglass" className="ml-2 text-sm font-medium text-gray-700">
              Fiberglass
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasInsulated"
              checked={formData.hasInsulated || false}
              onChange={(e) => handleInputChange('hasInsulated', e.target.checked)}
              className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="hasInsulated" className="ml-2 text-sm font-medium text-gray-700">
              Insulated
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSafetyStep; 
