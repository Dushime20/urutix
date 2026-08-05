import React, { useState, useEffect, useRef } from 'react';
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
  const [formData, setFormData] = useState<any>({
    // Initialize with default values to ensure checkboxes work
    hasForklift: false,
    hasCrane: false,
    hasLoadingDock: false,
    maxLoadingTime: '',
    maxUnloadingTime: '',
  });
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Reset initialization flag when form closes
    if (!isOpen) {
      initializedRef.current = false;
      return;
    }

    // Only initialize once when form opens
    if (initializedRef.current) {
      return; // Don't reset if already initialized
    }

    console.log('🔄 useEffect triggered:', { hasInitialData: !!initialData, activeTab, isOpen });

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
        truckType: initialData.truckType || '',
        trailerType: initialData.trailerType || '',
        maxLength: initialData.maxLength || '',
        maxWidth: initialData.maxWidth || '',
        maxHeight: initialData.maxHeight || '',
        hasRefrigeration: initialData.hasRefrigeration || false,
        hasLiftGate: initialData.hasLiftGate || false,
        hasGps: initialData.hasGps || initialData.hasGPS || false,
        hasHazmatPermit: initialData.hasHazmatPermit || false,
        isActive: initialData.isActive !== undefined ? initialData.isActive : true,
        status: initialData.status || 'AVAILABLE',
        equipmentList: initialData.equipmentList || [],
        // Essential cargo equipment
        hasSideRails: initialData.hasSideRails || false,
        hasTarps: initialData.hasTarps || false,
        hasStraps: initialData.hasStraps || false,
        hasChains: initialData.hasChains || false,
        hasWinch: initialData.hasWinch || false,
        hasRam: initialData.hasRam || false,
        hasTailLift: initialData.hasTailLift || false,
        hasSideLift: initialData.hasSideLift || false,
        hasRollerBed: initialData.hasRollerBed || false,
        hasDropDeck: initialData.hasDropDeck || false,
        hasExtendable: initialData.hasExtendable || false,
        hasLowbed: initialData.hasLowbed || false,
        hasStepDeck: initialData.hasStepDeck || false,
        hasPowerOnly: initialData.hasPowerOnly || false,
        hasContainerChassis: initialData.hasContainerChassis || false,
        // Loading equipment - check both nested and top-level
        hasForklift: initialData.loadingCapabilities?.hasForklift || initialData.hasForklift || false,
        hasCrane: initialData.loadingCapabilities?.hasCrane || initialData.hasCrane || false,
        hasLoadingDock: initialData.loadingCapabilities?.hasLoadingDock || initialData.hasLoadingDock || false,
        maxLoadingTime: initialData.loadingCapabilities?.maxLoadingTime || initialData.maxLoadingTime || '',
        maxUnloadingTime: initialData.loadingCapabilities?.maxUnloadingTime || initialData.maxUnloadingTime || '',
        // Cargo type capabilities
        hasTanker: initialData.hasTanker || false,
        hasBulk: initialData.hasBulk || false,
        hasRefrigerated: initialData.hasRefrigerated || false,
        hasHeated: initialData.hasHeated || false,
        hasVentilated: initialData.hasVentilated || false,
        hasCurtainSide: initialData.hasCurtainSide || false,
        hasBox: initialData.hasBox || false,
        hasVan: initialData.hasVan || false,
        hasPlatform: initialData.hasPlatform || false,
        hasCarCarrier: initialData.hasCarCarrier || false,
        hasHeavyHaul: initialData.hasHeavyHaul || false,
        hasOversized: initialData.hasOversized || false,
        // Specialized cargo capabilities
        hasHazmat: initialData.hasHazmat || false,
        hasDangerousGoods: initialData.hasDangerousGoods || false,
        hasFoodGrade: initialData.hasFoodGrade || false,
        hasPharmaceutical: initialData.hasPharmaceutical || false,
        hasLiquid: initialData.hasLiquid || false,
        hasDryBulk: initialData.hasDryBulk || false,
        hasGas: initialData.hasGas || false,
        hasChemical: initialData.hasChemical || false,
        hasWaste: initialData.hasWaste || false,
        // Temperature control
        hasReefer: initialData.hasReefer || false,
        hasFrozen: initialData.hasFrozen || false,
        hasChilled: initialData.hasChilled || false,
        hasAmbient: initialData.hasAmbient || false,
        hasControlledAtmosphere: initialData.hasControlledAtmosphere || false,
        hasHumidityControl: initialData.hasHumidityControl || false,
        hasTemperatureMonitoring: initialData.hasTemperatureMonitoring || false,
        // Technology and tracking
        hasGPS: initialData.hasGPS || initialData.hasGps || false,
        hasTracking: initialData.hasTracking || initialData.securityFeatures?.hasTracking || false,
        hasTelematics: initialData.hasTelematics || initialData.securityFeatures?.hasTelematics || false,
        hasELD: initialData.hasELD || initialData.securityFeatures?.hasELD || false,
        hasDashCam: initialData.hasDashCam || initialData.securityFeatures?.hasDashCam || false,
        hasSafetyCameras: initialData.hasSafetyCameras || initialData.securityFeatures?.hasSafetyCameras || false,
        // Safety features
        hasCollisionAvoidance: initialData.hasCollisionAvoidance || initialData.securityFeatures?.hasCollisionAvoidance || false,
        hasLaneDeparture: initialData.hasLaneDeparture || initialData.securityFeatures?.hasLaneDeparture || false,
        hasAdaptiveCruise: initialData.hasAdaptiveCruise || initialData.securityFeatures?.hasAdaptiveCruise || false,
        hasBlindSpot: initialData.hasBlindSpot || initialData.securityFeatures?.hasBlindSpot || false,
        hasBackupCamera: initialData.hasBackupCamera || initialData.securityFeatures?.hasBackupCamera || false,
        // Monitoring systems
        hasTirePressureMonitoring: initialData.hasTirePressureMonitoring || initialData.securityFeatures?.hasTirePressureMonitoring || false,
        hasEngineMonitoring: initialData.hasEngineMonitoring || initialData.securityFeatures?.hasEngineMonitoring || false,
        hasFuelMonitoring: initialData.hasFuelMonitoring || initialData.securityFeatures?.hasFuelMonitoring || false,
        hasMaintenanceAlerts: initialData.hasMaintenanceAlerts || initialData.securityFeatures?.hasMaintenanceAlerts || false,
        hasDriverMonitoring: initialData.hasDriverMonitoring || initialData.securityFeatures?.hasDriverMonitoring || false,
        hasFatigueMonitoring: initialData.hasFatigueMonitoring || initialData.securityFeatures?.hasFatigueMonitoring || false,
        hasSpeedMonitoring: initialData.hasSpeedMonitoring || initialData.securityFeatures?.hasSpeedMonitoring || false,
        hasIdleMonitoring: initialData.hasIdleMonitoring || initialData.securityFeatures?.hasIdleMonitoring || false,
        // Route and tracking
        hasRouteOptimization: initialData.hasRouteOptimization || initialData.securityFeatures?.hasRouteOptimization || false,
        hasRealTimeTracking: initialData.hasRealTimeTracking || initialData.securityFeatures?.hasRealTimeTracking || false,
        hasGeofencing: initialData.hasGeofencing || initialData.securityFeatures?.hasGeofencing || false,
        // Cargo monitoring
        hasTemperatureAlerts: initialData.hasTemperatureAlerts || initialData.securityFeatures?.hasTemperatureAlerts || false,
        hasHumidityAlerts: initialData.hasHumidityAlerts || initialData.securityFeatures?.hasHumidityAlerts || false,
        hasShockMonitoring: initialData.hasShockMonitoring || initialData.securityFeatures?.hasShockMonitoring || false,
        hasTiltMonitoring: initialData.hasTiltMonitoring || initialData.securityFeatures?.hasTiltMonitoring || false,
        hasDoorMonitoring: initialData.hasDoorMonitoring || initialData.securityFeatures?.hasDoorMonitoring || false,
        hasCargoMonitoring: initialData.hasCargoMonitoring || initialData.securityFeatures?.hasCargoMonitoring || false,
        hasWeightMonitoring: initialData.hasWeightMonitoring || initialData.securityFeatures?.hasWeightMonitoring || false,
        hasVolumeMonitoring: initialData.hasVolumeMonitoring || initialData.securityFeatures?.hasVolumeMonitoring || false,
        // Specialized monitoring
        hasPressureMonitoring: initialData.hasPressureMonitoring || initialData.securityFeatures?.hasPressureMonitoring || false,
        hasFlowMonitoring: initialData.hasFlowMonitoring || initialData.securityFeatures?.hasFlowMonitoring || false,
        hasLevelMonitoring: initialData.hasLevelMonitoring || initialData.securityFeatures?.hasLevelMonitoring || false,
        hasQualityMonitoring: initialData.hasQualityMonitoring || initialData.securityFeatures?.hasQualityMonitoring || false,
        hasContaminationMonitoring: initialData.hasContaminationMonitoring || initialData.securityFeatures?.hasContaminationMonitoring || false,
        // Safety systems
        hasLeakDetection: initialData.hasLeakDetection || initialData.securityFeatures?.hasLeakDetection || false,
        hasOverfillProtection: initialData.hasOverfillProtection || initialData.securityFeatures?.hasOverfillProtection || false,
        hasEmergencyShutdown: initialData.hasEmergencyShutdown || initialData.securityFeatures?.hasEmergencyShutdown || false,
        hasFireSuppression: initialData.hasFireSuppression || initialData.securityFeatures?.hasFireSuppression || false,
        hasExplosionProof: initialData.hasExplosionProof || initialData.securityFeatures?.hasExplosionProof || false,
        // Material specifications
        hasCorrosionResistant: initialData.hasCorrosionResistant || initialData.securityFeatures?.hasCorrosionResistant || false,
        hasStainlessSteel: initialData.hasStainlessSteel || initialData.securityFeatures?.hasStainlessSteel || false,
        hasAluminum: initialData.hasAluminum || initialData.securityFeatures?.hasAluminum || false,
        hasCarbonSteel: initialData.hasCarbonSteel || initialData.securityFeatures?.hasCarbonSteel || false,
        hasFiberglass: initialData.hasFiberglass || initialData.securityFeatures?.hasFiberglass || false,
        hasPlastic: initialData.hasPlastic || initialData.securityFeatures?.hasPlastic || false,
        hasComposite: initialData.hasComposite || initialData.securityFeatures?.hasComposite || false,
        hasInsulated: initialData.hasInsulated || initialData.securityFeatures?.hasInsulated || false,
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
      initializedRef.current = true;
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
        // Loading equipment
        hasForklift: false,
        hasCrane: false,
        hasLoadingDock: false,
        maxLoadingTime: '',
        maxUnloadingTime: '',
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
      initializedRef.current = true;
    }
  }, [initialData, activeTab, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setLoading(true);

    try {
      // Structure the form data to match backend DTO
      const structuredData: any = { ...formData };

      // Build loadingCapabilities object
      if (activeTab === 'trucks') {
        console.log('🚛 Building loadingCapabilities from formData:', {
          hasForklift: formData.hasForklift,
          hasCrane: formData.hasCrane,
          hasLoadingDock: formData.hasLoadingDock,
          maxLoadingTime: formData.maxLoadingTime,
          maxUnloadingTime: formData.maxUnloadingTime,
        });
        structuredData.loadingCapabilities = {
          hasForklift: Boolean(formData.hasForklift),
          hasCrane: Boolean(formData.hasCrane),
          hasLoadingDock: Boolean(formData.hasLoadingDock),
          hasSideLift: formData.hasSideLift || false,
          hasTailLift: formData.hasTailLift || false,
          hasRollerBed: formData.hasRollerBed || false,
          hasDropDeck: formData.hasDropDeck || false,
          hasExtendable: formData.hasExtendable || false,
          hasLowbed: formData.hasLowbed || false,
          hasStepDeck: formData.hasStepDeck || false,
          hasPowerOnly: formData.hasPowerOnly || false,
          hasContainerChassis: formData.hasContainerChassis || false,
          maxLoadingTime: formData.maxLoadingTime || undefined,
          maxUnloadingTime: formData.maxUnloadingTime || undefined,
        };

        // Build cargoCapabilities object
        structuredData.cargoCapabilities = {
          supportedCargoTypes: formData.supportedCargoTypes || [],
          maxFragileHandling: formData.maxFragileHandling || false,
          maxHazardousHandling: formData.maxHazardousHandling || false,
          maxRefrigeratedHandling: formData.maxRefrigeratedHandling || false,
          maxLiquidHandling: formData.maxLiquidHandling || false,
          maxOversizedHandling: formData.maxOversizedHandling || false,
          maxValuableHandling: formData.maxValuableHandling || false,
          temperatureRange: formData.temperatureRange || undefined,
          humidityControl: formData.humidityControl || false,
          maxStackableHeight: formData.maxStackableHeight || undefined,
          maxClearanceHeight: formData.maxClearanceHeight || undefined,
          maxWeightPerAxle: formData.maxWeightPerAxle || undefined,
          maxVolumeCapacity: formData.capacityVolume || undefined,
          maxLengthCapacity: formData.maxLength || undefined,
          maxWidthCapacity: formData.maxWidth || undefined,
          maxHeightCapacity: formData.maxHeight || undefined,
        };

        // Build securityFeatures object
        structuredData.securityFeatures = {
          hasGps: formData.hasGPS || formData.hasGps || false,
          hasTracking: formData.hasTracking || false,
          hasTelematics: formData.hasTelematics || false,
          hasELD: formData.hasELD || false,
          hasDashCam: formData.hasDashCam || false,
          hasSafetyCameras: formData.hasSafetyCameras || false,
          hasCollisionAvoidance: formData.hasCollisionAvoidance || false,
          hasLaneDeparture: formData.hasLaneDeparture || false,
          hasAdaptiveCruise: formData.hasAdaptiveCruise || false,
          hasBlindSpot: formData.hasBlindSpot || false,
          hasBackupCamera: formData.hasBackupCamera || false,
          hasTirePressureMonitoring: formData.hasTirePressureMonitoring || false,
          hasEngineMonitoring: formData.hasEngineMonitoring || false,
          hasFuelMonitoring: formData.hasFuelMonitoring || false,
          hasMaintenanceAlerts: formData.hasMaintenanceAlerts || false,
          hasDriverMonitoring: formData.hasDriverMonitoring || false,
          hasFatigueMonitoring: formData.hasFatigueMonitoring || false,
          hasSpeedMonitoring: formData.hasSpeedMonitoring || false,
          hasIdleMonitoring: formData.hasIdleMonitoring || false,
          hasRouteOptimization: formData.hasRouteOptimization || false,
          hasRealTimeTracking: formData.hasRealTimeTracking || false,
          hasGeofencing: formData.hasGeofencing || false,
          hasTemperatureAlerts: formData.hasTemperatureAlerts || false,
          hasHumidityAlerts: formData.hasHumidityAlerts || false,
          hasShockMonitoring: formData.hasShockMonitoring || false,
          hasTiltMonitoring: formData.hasTiltMonitoring || false,
          hasDoorMonitoring: formData.hasDoorMonitoring || false,
          hasCargoMonitoring: formData.hasCargoMonitoring || false,
          hasWeightMonitoring: formData.hasWeightMonitoring || false,
          hasVolumeMonitoring: formData.hasVolumeMonitoring || false,
        };
      }

      console.log('📤 Submitting structured data:', structuredData);
      console.log('📤 Loading capabilities:', structuredData.loadingCapabilities);
      await onSubmit(structuredData);
      initializedRef.current = false; // Reset for next time
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    console.log('🔄 handleInputChange:', field, value);
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev: any) => {
        const updated = {
          ...prev,
          [parent]: {
            ...(prev[parent] || {}),
            [child]: value
          }
        };
        console.log('📝 Updated formData (nested):', updated);
        return updated;
      });
    } else {
      setFormData((prev: any) => {
        const updated = {
          ...prev,
          [field]: value
        };
        console.log('📝 Updated formData (flat):', updated);
        return updated;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center modal-overlay">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {activeTab === 'trucks' ? (
                <FaTruck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <FaUser className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {mode === 'create' ? `Add New ${activeTab === 'trucks' ? 'Truck' : 'Driver'}` : `Edit ${activeTab === 'trucks' ? 'Truck' : 'Driver'}`}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>

              {activeTab === 'trucks' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      License Plate *
                    </label>
                    <input
                      type="text"
                      value={formData.plateNumber || ''}
                      onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                      required
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      VIN *
                    </label>
                    <input
                      type="text"
                      value={formData.vin || ''}
                      onChange={(e) => {
                        // Only allow alphanumeric characters (excluding I, O, Q as per VIN standards)
                        const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                        // Limit to 17 characters
                        if (value.length <= 17) {
                          handleInputChange('vin', value);
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formData.vin?.length === 17
                          ? 'border-green-500 bg-green-50'
                          : formData.vin?.length > 0
                            ? 'border-yellow-400'
                            : 'border-gray-300'
                        }`}
                      required
                      maxLength={17}
                      placeholder="Enter 17-character VIN"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-xs ${formData.vin?.length === 17
                          ? 'text-green-600'
                          : formData.vin?.length > 0
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                        }`}>
                        {formData.vin?.length || 0} / 17 characters
                      </span>
                      {formData.vin?.length === 17 && (
                        <span className="text-xs text-green-600 font-medium">✓ Valid VIN length</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange('year', value === '' ? '' : parseInt(value) || '');
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear()
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300'
                        }`}
                      required
                      min={1900}
                      max={2030}
                    />
                    {formData.year && typeof formData.year === 'number' && formData.year > new Date().getFullYear() && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <span>⚠</span>
                        <span>Year cannot be in the future. Current year is {new Date().getFullYear()}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Capacity Weight (kg) *
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Truck Type & Cargo Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Essential Cargo Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasSideRails"
                          checked={formData.hasSideRails || false}
                          onChange={(e) => handleInputChange('hasSideRails', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasSideRails" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasTarps" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasStraps" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasChains" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasWinch" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasRam" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasTailLift" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasSideLift" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasRollerBed" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                          Roller Bed
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Loading Equipment */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loading Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasForklift"
                          name="hasForklift"
                          checked={Boolean(formData.hasForklift)}
                          onChange={(e) => {
                            console.log('✅ Forklift checkbox clicked:', e.target.checked);
                            handleInputChange('hasForklift', e.target.checked);
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasForklift" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                          Forklift
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasCrane"
                          name="hasCrane"
                          checked={Boolean(formData.hasCrane)}
                          onChange={(e) => {
                            console.log('✅ Crane checkbox clicked:', e.target.checked);
                            handleInputChange('hasCrane', e.target.checked);
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasCrane" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                          Crane
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasLoadingDock"
                          name="hasLoadingDock"
                          checked={Boolean(formData.hasLoadingDock)}
                          onChange={(e) => {
                            console.log('✅ Loading Dock checkbox clicked:', e.target.checked);
                            handleInputChange('hasLoadingDock', e.target.checked);
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasLoadingDock" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                          Loading Dock
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Max Loading Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.maxLoadingTime || ''}
                          onChange={(e) => handleInputChange('maxLoadingTime', parseInt(e.target.value) || '')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min={0}
                          placeholder="e.g., 60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                          Max Unloading Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.maxUnloadingTime || ''}
                          onChange={(e) => handleInputChange('maxUnloadingTime', parseInt(e.target.value) || '')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          min={0}
                          placeholder="e.g., 60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cargo Type Capabilities */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cargo Type Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasTanker"
                          checked={formData.hasTanker || false}
                          onChange={(e) => handleInputChange('hasTanker', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasTanker" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasBulk" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasRefrigerated" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasCarCarrier" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasHeavyHaul" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasOversized" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasHazmat" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasFoodGrade" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasPharmaceutical" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                          Pharmaceutical
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Technology & Safety Features */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Technology & Safety Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hasGPS"
                          checked={formData.hasGPS || false}
                          onChange={(e) => handleInputChange('hasGPS', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="hasGPS" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasRealTimeTracking" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasTemperatureMonitoring" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasCollisionAvoidance" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasDashCam" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
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
                        <label htmlFor="hasSafetyCameras" className="ml-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                          Safety Cameras
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Equipment List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Equipment</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
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
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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