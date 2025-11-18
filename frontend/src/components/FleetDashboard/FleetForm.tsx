import React, { useState, useEffect } from 'react';
import { FaTimes, FaTruck, FaUser, FaSave } from 'react-icons/fa';
import type { FleetItem } from '../../types/fleet';

interface FleetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: FleetItem | null;
  mode: 'create' | 'edit';
  activeTab: 'trucks' | 'drivers';
}

const FleetForm: React.FC<FleetFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  activeTab
}) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        // Truck fields
        plateNumber: initialData.plateNumber || '',
        vin: initialData.vin || '',
        make: initialData.make || '',
        model: initialData.model || '',
        year: initialData.year || '',
        color: initialData.color || '',
        fuelType: initialData.fuelType || '',
        capacityWeight: initialData.capacityWeight || '',
        capacityVolume: initialData.capacityVolume || '',
        registrationNumber: initialData.registrationNumber || '',
        registrationExpiry: initialData.registrationExpiry || '',
        insurancePolicy: initialData.insurancePolicy || '',
        insuranceExpiry: initialData.insuranceExpiry || '',
        roadworthyCertExpiry: initialData.roadworthyCertExpiry || '',
        mileage: initialData.mileage || '',
        hasRefrigeration: initialData.hasRefrigeration || false,
        hasLiftGate: initialData.hasLiftGate || false,
        hasGps: initialData.hasGps || false,
        hasHazmatPermit: initialData.hasHazmatPermit || false,
        equipmentList: initialData.equipmentList || [],
        // Driver fields
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        licenseNumber: initialData.licenseNumber || '',
        licenseType: initialData.licenseType || '',
        experience: initialData.experience || '',
        contactInfo: {
          phone: initialData.contactInfo?.phone || '',
          email: initialData.contactInfo?.email || ''
        }
      });
    } else {
      setFormData({
        // Truck fields
        plateNumber: '',
        vin: '',
        make: '',
        model: '',
        year: '',
        color: '',
        fuelType: '',
        capacityWeight: '',
        capacityVolume: '',
        registrationNumber: '',
        registrationExpiry: '',
        insurancePolicy: '',
        insuranceExpiry: '',
        roadworthyCertExpiry: '',
        mileage: '',
        truckType: '',
        trailerType: '',
        // Essential cargo equipment
        hasSideRails: false,
        hasTarps: false,
        hasStraps: false,
        hasChains: false,
        hasWinch: false,
        hasRam: false,
        hasTailLift: false,
        hasSideLift: false,
        hasRollerBed: false,
        hasDropDeck: false,
        hasExtendable: false,
        hasLowbed: false,
        hasStepDeck: false,
        hasPowerOnly: false,
        hasContainerChassis: false,
        // Cargo type capabilities
        hasTanker: false,
        hasBulk: false,
        hasRefrigerated: false,
        hasHeated: false,
        hasVentilated: false,
        hasCurtainSide: false,
        hasBox: false,
        hasVan: false,
        hasPlatform: false,
        hasCarCarrier: false,
        hasHeavyHaul: false,
        hasOversized: false,
        // Specialized cargo capabilities
        hasHazmat: false,
        hasDangerousGoods: false,
        hasFoodGrade: false,
        hasPharmaceutical: false,
        hasLiquid: false,
        hasDryBulk: false,
        hasGas: false,
        hasChemical: false,
        hasWaste: false,
        // Temperature control
        hasReefer: false,
        hasFrozen: false,
        hasChilled: false,
        hasAmbient: false,
        hasControlledAtmosphere: false,
        hasHumidityControl: false,
        hasTemperatureMonitoring: false,
        // Technology and tracking
        hasGPS: false,
        hasTracking: false,
        hasTelematics: false,
        hasELD: false,
        hasDashCam: false,
        hasSafetyCameras: false,
        // Safety features
        hasCollisionAvoidance: false,
        hasLaneDeparture: false,
        hasAdaptiveCruise: false,
        hasBlindSpot: false,
        hasBackupCamera: false,
        // Monitoring systems
        hasTirePressureMonitoring: false,
        hasEngineMonitoring: false,
        hasFuelMonitoring: false,
        hasMaintenanceAlerts: false,
        hasDriverMonitoring: false,
        hasFatigueMonitoring: false,
        hasSpeedMonitoring: false,
        hasIdleMonitoring: false,
        // Route and tracking
        hasRouteOptimization: false,
        hasRealTimeTracking: false,
        hasGeofencing: false,
        // Cargo monitoring
        hasTemperatureAlerts: false,
        hasHumidityAlerts: false,
        hasShockMonitoring: false,
        hasTiltMonitoring: false,
        hasDoorMonitoring: false,
        hasCargoMonitoring: false,
        hasWeightMonitoring: false,
        hasVolumeMonitoring: false,
        // Specialized monitoring
        hasPressureMonitoring: false,
        hasFlowMonitoring: false,
        hasLevelMonitoring: false,
        hasQualityMonitoring: false,
        hasContaminationMonitoring: false,
        // Safety systems
        hasLeakDetection: false,
        hasOverfillProtection: false,
        hasEmergencyShutdown: false,
        hasFireSuppression: false,
        hasExplosionProof: false,
        // Material specifications
        hasCorrosionResistant: false,
        hasStainlessSteel: false,
        hasAluminum: false,
        hasCarbonSteel: false,
        hasFiberglass: false,
        hasPlastic: false,
        hasComposite: false,
        hasInsulated: false,
        equipmentList: [],
        // Driver fields
        firstName: '',
        lastName: '',
        licenseNumber: '',
        licenseType: '',
        experience: '',
        contactInfo: {
          phone: '',
          email: ''
        }
      });
    }
  }, [initialData, activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setLoading(true);
    
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-overlay">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {activeTab === 'trucks' ? (
                <FaTruck className="w-6 h-6 text-primary-600" />
              ) : (
                <FaUser className="w-6 h-6 text-primary-600" />
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'create' ? `Add New ${activeTab === 'trucks' ? 'Truck' : 'Driver'}` : `Edit ${activeTab === 'trucks' ? 'Truck' : 'Driver'}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              {activeTab === 'trucks' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      value={formData.plateNumber || ''}
                      onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VIN *
                    </label>
                    <input
                      type="text"
                      value={formData.vin || ''}
                      onChange={(e) => handleInputChange('vin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={17}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Make *
                    </label>
                    <input
                      type="text"
                      value={formData.make || ''}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      value={formData.model || ''}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => handleInputChange('year', parseInt(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min={1900}
                      max={2030}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.color || ''}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type *
                    </label>
                    <select
                      value={formData.fuelType || ''}
                      onChange={(e) => handleInputChange('fuelType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select fuel type</option>
                      <option value="DIESEL">Diesel</option>
                      <option value="GASOLINE">Gasoline</option>
                      <option value="ELECTRIC">Electric</option>
                      <option value="HYBRID">Hybrid</option>
                      <option value="CNG">CNG</option>
                      <option value="LNG">LNG</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity Weight (lbs) *
                    </label>
                    <input
                      type="number"
                      value={formData.capacityWeight || ''}
                      onChange={(e) => handleInputChange('capacityWeight', parseFloat(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min={1}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity Volume (cubic ft) *
                    </label>
                    <input
                      type="number"
                      value={formData.capacityVolume || ''}
                      onChange={(e) => handleInputChange('capacityVolume', parseFloat(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      min={1}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber || ''}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Expiry *
                    </label>
                    <input
                      type="date"
                      value={formData.registrationExpiry || ''}
                      onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Policy *
                    </label>
                    <input
                      type="text"
                      value={formData.insurancePolicy || ''}
                      onChange={(e) => handleInputChange('insurancePolicy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                      maxLength={50}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance Expiry *
                    </label>
                    <input
                      type="date"
                      value={formData.insuranceExpiry || ''}
                      onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Roadworthy Cert Expiry
                    </label>
                    <input
                      type="date"
                      value={formData.roadworthyCertExpiry || ''}
                      onChange={(e) => handleInputChange('roadworthyCertExpiry', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mileage
                    </label>
                    <input
                      type="number"
                      value={formData.mileage || ''}
                      onChange={(e) => handleInputChange('mileage', parseFloat(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min={0}
                      step={0.1}
                    />
                  </div>
                  
                  {/* Truck Type and Cargo Capabilities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Truck Type & Cargo Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Truck Type *
                        </label>
                        <select
                          value={formData.truckType || ''}
                          onChange={(e) => handleInputChange('truckType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select truck type</option>
                          <option value="FLATBED">Flatbed</option>
                          <option value="BOX_TRUCK">Box Truck</option>
                          <option value="TANKER">Tanker</option>
                          <option value="REFRIGERATED">Refrigerated</option>
                          <option value="CONTAINER">Container</option>
                          <option value="CAR_CARRIER">Car Carrier</option>
                          <option value="HEAVY_HAUL">Heavy Haul</option>
                          <option value="LOWBED">Lowbed</option>
                          <option value="STEP_DECK">Step Deck</option>
                          <option value="POWER_ONLY">Power Only</option>
                          <option value="CURTAIN_SIDE">Curtain Side</option>
                          <option value="VAN">Van</option>
                          <option value="PLATFORM">Platform</option>
                          <option value="BULK">Bulk</option>
                          <option value="DUMP">Dump</option>
                          <option value="CEMENT_MIXER">Cement Mixer</option>
                          <option value="CRANE">Crane</option>
                          <option value="SPECIALIZED">Specialized</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trailer Type
                        </label>
                        <select
                          value={formData.trailerType || ''}
                          onChange={(e) => handleInputChange('trailerType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select trailer type</option>
                          <option value="FLATBED">Flatbed</option>
                          <option value="DRY_VAN">Dry Van</option>
                          <option value="REFRIGERATED">Refrigerated</option>
                          <option value="TANKER">Tanker</option>
                          <option value="BULK">Bulk</option>
                          <option value="CONTAINER">Container</option>
                          <option value="CAR_CARRIER">Car Carrier</option>
                          <option value="HEAVY_HAUL">Heavy Haul</option>
                          <option value="LOWBED">Lowbed</option>
                          <option value="STEP_DECK">Step Deck</option>
                          <option value="POWER_ONLY">Power Only</option>
                          <option value="CURTAIN_SIDE">Curtain Side</option>
                          <option value="PLATFORM">Platform</option>
                          <option value="DUMP">Dump</option>
                          <option value="CEMENT_MIXER">Cement Mixer</option>
                          <option value="CRANE">Crane</option>
                          <option value="SPECIALIZED">Specialized</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Essential Cargo Equipment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Essential Cargo Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasSideRails"
                          checked={formData.hasSideRails || false}
                          onChange={(e) => handleInputChange('hasSideRails', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasRam" className="ml-2 text-sm font-medium text-gray-700">
                          Loading Ram
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasTailLift"
                          checked={formData.hasTailLift || false}
                          onChange={(e) => handleInputChange('hasTailLift', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasRollerBed" className="ml-2 text-sm font-medium text-gray-700">
                          Roller Bed
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cargo Type Capabilities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cargo Type Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasTanker"
                          checked={formData.hasTanker || false}
                          onChange={(e) => handleInputChange('hasTanker', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasTanker" className="ml-2 text-sm font-medium text-gray-700">
                          Tanker (Liquids)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasBulk"
                          checked={formData.hasBulk || false}
                          onChange={(e) => handleInputChange('hasBulk', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasBulk" className="ml-2 text-sm font-medium text-gray-700">
                          Bulk Cargo
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasRefrigerated"
                          checked={formData.hasRefrigerated || false}
                          onChange={(e) => handleInputChange('hasRefrigerated', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasRefrigerated" className="ml-2 text-sm font-medium text-gray-700">
                          Refrigerated
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasCarCarrier"
                          checked={formData.hasCarCarrier || false}
                          onChange={(e) => handleInputChange('hasCarCarrier', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasCarCarrier" className="ml-2 text-sm font-medium text-gray-700">
                          Car Carrier
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasHeavyHaul"
                          checked={formData.hasHeavyHaul || false}
                          onChange={(e) => handleInputChange('hasHeavyHaul', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasHeavyHaul" className="ml-2 text-sm font-medium text-gray-700">
                          Heavy Haul
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasOversized"
                          checked={formData.hasOversized || false}
                          onChange={(e) => handleInputChange('hasOversized', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasOversized" className="ml-2 text-sm font-medium text-gray-700">
                          Oversized
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasHazmat"
                          checked={formData.hasHazmat || false}
                          onChange={(e) => handleInputChange('hasHazmat', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasHazmat" className="ml-2 text-sm font-medium text-gray-700">
                          Hazmat
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasFoodGrade"
                          checked={formData.hasFoodGrade || false}
                          onChange={(e) => handleInputChange('hasFoodGrade', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasFoodGrade" className="ml-2 text-sm font-medium text-gray-700">
                          Food Grade
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasPharmaceutical"
                          checked={formData.hasPharmaceutical || false}
                          onChange={(e) => handleInputChange('hasPharmaceutical', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasPharmaceutical" className="ml-2 text-sm font-medium text-gray-700">
                          Pharmaceutical
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Technology & Safety Features */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Technology & Safety Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasGPS"
                          checked={formData.hasGPS || false}
                          onChange={(e) => handleInputChange('hasGPS', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasGPS" className="ml-2 text-sm font-medium text-gray-700">
                          GPS Tracking
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasRealTimeTracking"
                          checked={formData.hasRealTimeTracking || false}
                          onChange={(e) => handleInputChange('hasRealTimeTracking', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasRealTimeTracking" className="ml-2 text-sm font-medium text-gray-700">
                          Real-time Tracking
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasTemperatureMonitoring"
                          checked={formData.hasTemperatureMonitoring || false}
                          onChange={(e) => handleInputChange('hasTemperatureMonitoring', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasTemperatureMonitoring" className="ml-2 text-sm font-medium text-gray-700">
                          Temperature Monitoring
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasCollisionAvoidance"
                          checked={formData.hasCollisionAvoidance || false}
                          onChange={(e) => handleInputChange('hasCollisionAvoidance', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasCollisionAvoidance" className="ml-2 text-sm font-medium text-gray-700">
                          Collision Avoidance
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasDashCam"
                          checked={formData.hasDashCam || false}
                          onChange={(e) => handleInputChange('hasDashCam', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasDashCam" className="ml-2 text-sm font-medium text-gray-700">
                          Dash Cam
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasSafetyCameras"
                          checked={formData.hasSafetyCameras || false}
                          onChange={(e) => handleInputChange('hasSafetyCameras', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasSafetyCameras" className="ml-2 text-sm font-medium text-gray-700">
                          Safety Cameras
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Equipment List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Equipment</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Equipment List (comma-separated)
                      </label>
                      <textarea
                        value={formData.equipmentList?.join(', ') || ''}
                        onChange={(e) => handleInputChange('equipmentList', e.target.value.split(',').map(item => item.trim()).filter(item => item))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                        placeholder="e.g., pallet jack, straps, tarps, loading ramps, hydraulic lift"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      value={formData.licenseNumber || ''}
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Type
                    </label>
                    <select
                      value={formData.licenseType || ''}
                      onChange={(e) => handleInputChange('licenseType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select license type</option>
                      <option value="CDL-A">CDL-A</option>
                      <option value="CDL-B">CDL-B</option>
                      <option value="CDL-C">CDL-C</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      value={formData.experience || ''}
                      onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo?.phone || ''}
                    onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo?.email || ''}
                    onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaSave className="w-4 h-4" />
                {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { FleetForm }; 