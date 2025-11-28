import React, { useState, useEffect, useRef } from 'react';
import { 
  FaTruck, 
  FaCog, 
  FaShieldAlt, 
  FaUser, 
  FaCheck,
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
  FaBox,
  FaTools,
  FaCertificate,
  FaRoute,
  FaDollarSign
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import type { FleetItem } from '../../types/fleet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui';
import {
  BasicInformationStep,
  SpecificationsStep,
  CargoCapabilitiesStep,
  LoadingEquipmentStep,
  SecurityMonitoringStep,
  CertificationsStep,
  RouteCapabilitiesStep,
  CostStructureStep,
  DriverInformationStep,
  ReviewSubmitStep
} from './StepperSteps';


interface FleetFormStepperProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData: FleetItem | null;
  mode: 'create' | 'edit';
  activeTab: 'trucks' | 'drivers';
}

// Form data interface that allows string values for numeric fields during input
interface FleetFormData extends Omit<FleetItem, 'year' | 'capacityWeight' | 'capacityVolume' | 'mileage' | 'experience'> {
  year: string | number;
  capacityWeight: string | number;
  capacityVolume: string | number;
  mileage: string | number;
  experience: string | number;
}

//

const FleetFormStepper: React.FC<FleetFormStepperProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  activeTab
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FleetFormData>>({});
  const [loading, setLoading] = useState(false);

  // Debug loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed to:', loading);
  }, [loading]);

  // Define steps based on activeTab
  const getSteps = () => {
    if (activeTab === 'drivers') {
      return [
        { id: 1, title: 'Driver Information', description: 'Personal details and license information', icon: <FaUser className="w-5 h-5" /> },
        { id: 2, title: 'Certifications', description: 'Driver certifications and endorsements', icon: <FaCertificate className="w-5 h-5" /> },
        { id: 3, title: 'Review & Submit', description: 'Review all information and submit', icon: <FaCheck className="w-5 h-5" /> },
      ];
    }
    
    // Default truck steps
    return [
      { id: 1, title: 'Basic Information', description: 'Vehicle details and identification', icon: <FaTruck className="w-5 h-5" /> },
      { id: 2, title: 'Specifications', description: 'Technical specifications and dimensions', icon: <FaCog className="w-5 h-5" /> },
      { id: 3, title: 'Cargo Capabilities', description: 'Cargo type support and handling', icon: <FaBox className="w-5 h-5" /> },
      { id: 4, title: 'Loading Equipment', description: 'Loading and unloading equipment', icon: <FaTools className="w-5 h-5" /> },
      { id: 5, title: 'Security & Monitoring', description: 'Security features and monitoring', icon: <FaShieldAlt className="w-5 h-5" /> },
      { id: 6, title: 'Certifications', description: 'Certifications and compliance', icon: <FaCertificate className="w-5 h-5" /> },
      { id: 7, title: 'Route Capabilities', description: 'Route types and restrictions', icon: <FaRoute className="w-5 h-5" /> },
      { id: 8, title: 'Cost Structure', description: 'Pricing rates and surcharges', icon: <FaDollarSign className="w-5 h-5" /> },
    ];
  };

  const steps = getSteps();

  useEffect(() => {
    if (initialData) {
      // Initialize loadingCapabilities from initialData
      const loadingCapabilities = initialData.loadingCapabilities || {};
      setFormData({
        // Truck fields
        plateNumber: initialData.plateNumber || '',
        vin: initialData.vin || '',
        make: initialData.make || '',
        model: initialData.model || '',
        year: initialData.year?.toString() || '',
        color: initialData.color || '',
        fuelType: initialData.fuelType || '',
        capacityWeight: initialData.capacityWeight?.toString() || '',
        capacityVolume: initialData.capacityVolume?.toString() || '',
        registrationNumber: initialData.registrationNumber || '',
        registrationExpiry: initialData.registrationExpiry || '',
        insurancePolicy: initialData.insurancePolicy || '',
        insuranceExpiry: initialData.insuranceExpiry || '',
        roadworthyCertExpiry: initialData.roadworthyCertExpiry || '',
        mileage: initialData.mileage?.toString() || '',
        truckType: initialData.truckType || '',
        trailerType: initialData.trailerType || '',
        // Core requirements
        hasRefrigeration: initialData.hasRefrigeration || false,
        hasLiftGate: initialData.hasLiftGate || false,
        hasGps: initialData.hasGps || false,
        hasHazmatPermit: initialData.hasHazmatPermit || false,
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
        hasGPS: initialData.hasGPS || false,
        hasTracking: initialData.hasTracking || false,
        hasTelematics: initialData.hasTelematics || false,
        hasELD: initialData.hasELD || false,
        hasDashCam: initialData.hasDashCam || false,
        hasSafetyCameras: initialData.hasSafetyCameras || false,
        // Safety features
        hasCollisionAvoidance: initialData.hasCollisionAvoidance || false,
        hasLaneDeparture: initialData.hasLaneDeparture || false,
        hasAdaptiveCruise: initialData.hasAdaptiveCruise || false,
        hasBlindSpot: initialData.hasBlindSpot || false,
        hasBackupCamera: initialData.hasBackupCamera || false,
        // Monitoring systems
        hasTirePressureMonitoring: initialData.hasTirePressureMonitoring || false,
        hasEngineMonitoring: initialData.hasEngineMonitoring || false,
        hasFuelMonitoring: initialData.hasFuelMonitoring || false,
        hasMaintenanceAlerts: initialData.hasMaintenanceAlerts || false,
        hasDriverMonitoring: initialData.hasDriverMonitoring || false,
        hasFatigueMonitoring: initialData.hasFatigueMonitoring || false,
        hasSpeedMonitoring: initialData.hasSpeedMonitoring || false,
        hasIdleMonitoring: initialData.hasIdleMonitoring || false,
        // Route and tracking
        hasRouteOptimization: initialData.hasRouteOptimization || false,
        hasRealTimeTracking: initialData.hasRealTimeTracking || false,
        hasGeofencing: initialData.hasGeofencing || false,
        // Cargo monitoring
        hasTemperatureAlerts: initialData.hasTemperatureAlerts || false,
        hasHumidityAlerts: initialData.hasHumidityAlerts || false,
        hasShockMonitoring: initialData.hasShockMonitoring || false,
        hasTiltMonitoring: initialData.hasTiltMonitoring || false,
        hasDoorMonitoring: initialData.hasDoorMonitoring || false,
        hasCargoMonitoring: initialData.hasCargoMonitoring || false,
        hasWeightMonitoring: initialData.hasWeightMonitoring || false,
        hasVolumeMonitoring: initialData.hasVolumeMonitoring || false,
        // Specialized monitoring
        hasPressureMonitoring: initialData.hasPressureMonitoring || false,
        hasFlowMonitoring: initialData.hasFlowMonitoring || false,
        hasLevelMonitoring: initialData.hasLevelMonitoring || false,
        hasQualityMonitoring: initialData.hasQualityMonitoring || false,
        hasContaminationMonitoring: initialData.hasContaminationMonitoring || false,
        // Safety systems
        hasLeakDetection: initialData.hasLeakDetection || false,
        hasOverfillProtection: initialData.hasOverfillProtection || false,
        hasEmergencyShutdown: initialData.hasEmergencyShutdown || false,
        hasFireSuppression: initialData.hasFireSuppression || false,
        hasExplosionProof: initialData.hasExplosionProof || false,
        // Material specifications
        hasCorrosionResistant: initialData.hasCorrosionResistant || false,
        hasStainlessSteel: initialData.hasStainlessSteel || false,
        hasAluminum: initialData.hasAluminum || false,
        hasCarbonSteel: initialData.hasCarbonSteel || false,
        hasFiberglass: initialData.hasFiberglass || false,
        hasPlastic: initialData.hasPlastic || false,
        hasComposite: initialData.hasComposite || false,
        hasInsulated: initialData.hasInsulated || false,
        equipmentList: initialData.equipmentList || [],
        // Nested objects
        loadingCapabilities: loadingCapabilities,
        cargoCapabilities: initialData.cargoCapabilities || {},
        securityFeatures: initialData.securityFeatures || {},
        // Driver fields
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        licenseNumber: initialData.licenseNumber || '',
        licenseType: initialData.licenseType || '',
        experience: initialData.experience?.toString() || '',
        contactInfo: {
          phone: initialData.contactInfo?.phone || '',
          email: initialData.contactInfo?.email || ''
        }
      });
    } else {
      // Initialize with empty nested objects
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
        // Core requirements
        hasRefrigeration: false,
        hasLiftGate: false,
        hasGps: false,
        hasHazmatPermit: false,
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
        // Nested objects - initialize empty
        loadingCapabilities: {},
        cargoCapabilities: {},
        securityFeatures: {},
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
  }, [initialData]);

  // Helper function to build equipmentList from all equipment boolean fields
  const buildEquipmentList = React.useCallback((formData: Partial<FleetFormData>): string[] => {
    const equipmentMap: Record<string, string> = {
      hasRefrigeration: 'Refrigeration',
      hasLiftGate: 'Lift Gate',
      hasGps: 'GPS System',
      hasHazmatPermit: 'Hazmat Permit',
      hasSideRails: 'Side Rails',
      hasTarps: 'Tarps',
      hasStraps: 'Straps',
      hasChains: 'Chains',
      hasWinch: 'Winch',
      hasRam: 'Loading Ramps',
      hasTailLift: 'Tail Lift',
      hasSideLift: 'Side Lift',
      hasRollerBed: 'Roller Bed',
      hasDropDeck: 'Drop Deck',
      hasExtendable: 'Extendable',
      hasLowbed: 'Lowbed',
      hasStepDeck: 'Step Deck',
      hasPowerOnly: 'Power Only',
      hasContainerChassis: 'Container Chassis',
      hasLeakDetection: 'Leak Detection',
      hasOverfillProtection: 'Overfill Protection',
      hasEmergencyShutdown: 'Emergency Shutdown',
      hasFireSuppression: 'Fire Suppression',
      hasExplosionProof: 'Explosion Proof',
      hasCorrosionResistant: 'Corrosion Resistant',
      hasStainlessSteel: 'Stainless Steel',
      hasAluminum: 'Aluminum',
      hasCarbonSteel: 'Carbon Steel',
      hasFiberglass: 'Fiberglass',
      hasInsulated: 'Insulated',
    };

    const equipmentList: string[] = [];
    Object.keys(equipmentMap).forEach((key) => {
      if (formData[key as keyof FleetFormData] === true) {
        equipmentList.push(equipmentMap[key]);
      }
    });

    return equipmentList;
  }, []);

  const handleInputChange = (field: string, value: any) => {
    // Handle nested field updates (e.g., 'cargoCapabilities.supportedCargoTypes')
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      setFormData((prev: Partial<FleetFormData>) => {
        const updated = {
          ...prev,
          [parentField]: {
            ...(prev[parentField as keyof FleetFormData] as any),
            [childField]: value,
          },
        };
        // Update equipmentList if this is an equipment field
        if (parentField.startsWith('has') || field.startsWith('has')) {
          return {
            ...updated,
            equipmentList: buildEquipmentList(updated),
          };
        }
        return updated;
      });
    } else {
      setFormData((prev: Partial<FleetFormData>) => {
        const updated = {
          ...prev,
          [field]: value
        };
        // Update equipmentList if this is an equipment field
        if (field.startsWith('has')) {
          return {
            ...updated,
            equipmentList: buildEquipmentList(updated),
          };
        }
        return updated;
      });
    }
  };

  // Convert form data to proper types for submission
  const convertFormDataForSubmission = (data: Partial<FleetFormData>): any => {
    // Normalize driver payload to backend CreateDriverDto if submitting a driver
    if (activeTab === 'drivers') {
      const d: any = data || {};
      const nowIso = new Date().toISOString();
      const twoYearsIso = new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString();

      return {
        // required by backend DTO
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.contactInfo?.email || '',
        phone: d.contactInfo?.phone || '',
        dateOfBirth: d.dateOfBirth || nowIso,
        address: d.address || '',
        employeeId: d.employeeId, // optional
        licenseNumber: d.licenseNumber || '',
        licenseIssueDate: d.licenseIssueDate || nowIso,
        licenseExpiry: d.licenseExpiry || twoYearsIso,
        licenseState: d.licenseState || 'N/A',
        licenseCountry: d.licenseCountry || 'N/A',
        employmentType: d.employmentType || 'FULL_TIME',
        hireDate: d.hireDate || nowIso,
        terminationDate: d.terminationDate,
        status: d.status || 'ACTIVE',
        hourlyRate: d.hourlyRate ? Number(d.hourlyRate) : undefined,
        mileageRate: d.mileageRate ? Number(d.mileageRate) : undefined,
        medicalCertExpiry: d.medicalCertExpiry,
        drugTestDate: d.drugTestDate,
        backgroundCheckDate: d.backgroundCheckDate,
        trainingCompletionDate: d.trainingCompletionDate,
      };
    }

    // Normalize truck payload to backend CreateTruckDto
    const d: any = data || {};
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    // Helper function to convert date string to ISO format
    const formatDate = (dateValue: any): string | undefined => {
      if (!dateValue) return undefined;
      if (typeof dateValue === 'string') {
        // If it's already in ISO format, return as is
        if (dateValue.includes('T') || dateValue.includes('Z')) {
          return dateValue;
        }
        // Otherwise, try to parse it
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString();
        }
      }
      if (dateValue instanceof Date) {
        return dateValue.toISOString();
      }
      return undefined;
    };

    // Helper function to ensure boolean values
    const toBoolean = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
      }
      return Boolean(value);
    };

    const converted: any = {
      // Required fields
      plateNumber: d.plateNumber || '',
      vin: d.vin || '',
      make: d.make || '',
      model: d.model || '',
      year: typeof d.year === 'string' ? parseInt(d.year) || 2023 : (d.year || 2023),
      fuelType: d.fuelType || 'DIESEL',
      capacityWeight: typeof d.capacityWeight === 'string' ? parseFloat(d.capacityWeight) || 1 : (d.capacityWeight || 1),
      capacityVolume: typeof d.capacityVolume === 'string' ? parseFloat(d.capacityVolume) || 1 : (d.capacityVolume || 1),
      registrationNumber: d.registrationNumber || '',
      registrationExpiry: formatDate(d.registrationExpiry) || oneYearFromNow.toISOString(),
      insurancePolicy: d.insurancePolicy || '',
      insuranceExpiry: formatDate(d.insuranceExpiry) || oneYearFromNow.toISOString(),
      hasRefrigeration: toBoolean(d.hasRefrigeration),
      hasLiftGate: toBoolean(d.hasLiftGate),
      hasGps: toBoolean(d.hasGps),
      hasHazmatPermit: toBoolean(d.hasHazmatPermit),
    };

    // Optional fields
    if (d.color) converted.color = d.color;
    if (d.mileage !== undefined && d.mileage !== null && d.mileage !== '') {
      converted.mileage = typeof d.mileage === 'string' ? parseInt(d.mileage) || 0 : d.mileage;
    }
    if (d.maxLength) converted.maxLength = typeof d.maxLength === 'string' ? parseFloat(d.maxLength) : d.maxLength;
    if (d.maxWidth) converted.maxWidth = typeof d.maxWidth === 'string' ? parseFloat(d.maxWidth) : d.maxWidth;
    if (d.maxHeight) converted.maxHeight = typeof d.maxHeight === 'string' ? parseFloat(d.maxHeight) : d.maxHeight;
    if (d.roadworthyCertExpiry) converted.roadworthyCertExpiry = formatDate(d.roadworthyCertExpiry);
    // Always build equipmentList from checked equipment fields
    converted.equipmentList = buildEquipmentList(d);
    if (d.lastMaintenanceDate) converted.lastMaintenanceDate = formatDate(d.lastMaintenanceDate);
    if (d.nextMaintenanceDate) converted.nextMaintenanceDate = formatDate(d.nextMaintenanceDate);
    if (d.truckType) converted.truckType = d.truckType;
    if (d.trailerType) converted.trailerType = d.trailerType;
    if (d.hasSideRails !== undefined) converted.hasSideRails = toBoolean(d.hasSideRails);
    if (d.hasTarps !== undefined) converted.hasTarps = toBoolean(d.hasTarps);
    if (d.hasStraps !== undefined) converted.hasStraps = toBoolean(d.hasStraps);
    if (d.hasChains !== undefined) converted.hasChains = toBoolean(d.hasChains);
    if (d.hasWinch !== undefined) converted.hasWinch = toBoolean(d.hasWinch);

    // Remove undefined values
    Object.keys(converted).forEach(key => {
      if (converted[key] === undefined) {
        delete converted[key];
      }
    });

    return converted;
  };


  const stepContentRef = useRef<HTMLDivElement | null>(null);

  // Validate if a step is complete based on required fields
  const isStepComplete = (stepId: number): boolean => {
    if (activeTab === 'drivers') {
      switch (stepId) {
        case 1: // Driver Information
          return !!(
            formData.firstName &&
            formData.lastName &&
            formData.dateOfBirth &&
            formData.address &&
            formData.licenseNumber &&
            formData.licenseType &&
            formData.experience &&
            formData.licenseIssueDate &&
            formData.licenseExpiry &&
            formData.licenseState &&
            formData.licenseCountry &&
            formData.contactInfo?.phone &&
            formData.contactInfo?.email &&
            formData.employmentType &&
            formData.hireDate &&
            formData.status
          );
        case 2: // Certifications (optional step, always complete)
          return true;
        case 3: // Review & Submit (always accessible)
          return true;
        default:
          return false;
      }
    } else {
      // Truck steps
      switch (stepId) {
        case 1: // Basic Information
          return !!(
            formData.plateNumber &&
            formData.vin &&
            formData.registrationNumber &&
            formData.make &&
            formData.model &&
            formData.year &&
            formData.capacityWeight &&
            formData.capacityVolume &&
            formData.fuelType &&
            formData.insurancePolicy &&
            formData.insuranceExpiry &&
            formData.registrationExpiry
          );
        case 2: // Specifications (optional fields, always complete)
          return true;
        case 3: // Cargo Capabilities (optional checkboxes, always complete)
          return true;
        case 4: // Loading Equipment (optional checkboxes, always complete)
          return true;
        case 5: // Security & Monitoring (optional checkboxes, always complete)
          return true;
        case 6: // Certifications (optional, always complete)
          return true;
        case 7: // Route Capabilities (optional, always complete)
          return true;
        case 8: // Cost Structure (optional, always complete)
          return true;
        default:
          return false;
      }
    }
  };

  const nextStep = () => {
    // Validate only the visible controls inside the current step content
    const container = stepContentRef.current;
    if (container) {
      const controls = Array.from(
        container.querySelectorAll('input, select, textarea')
      ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
      for (const control of controls) {
        if (!control.checkValidity()) {
          control.reportValidity();
          return;
        }
      }
    } else {
      // Fallback to form-level validity
      const form = document.getElementById('fleet-form-stepper') as HTMLFormElement | null;
      if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
      }
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      // Show progress toast
      if (currentStep === steps.length - 1) {
        toast.success('All steps completed! Ready to submit.');
      } else {
        toast.success(`Step ${currentStep + 1} completed!`);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit called!');
    console.log('Event:', e);
    console.log('Event type:', e.type);
    
    e.preventDefault();
    
    // Prevent double submissions
    if (loading) {
      console.log('⚠️ Already submitting, skipping duplicate request');
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('❌ No access token found');
      toast.error('Please login first to submit the form.');
      return;
    }
    
    console.log('✅ Token found, proceeding with submission');
    console.log('📝 Setting loading to true...');
    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading(`Creating ${activeTab === 'drivers' ? 'driver' : 'truck'}...`);
    
    try {
      console.log('📤 Submitting form data:', formData);
      const convertedData = convertFormDataForSubmission(formData);
      console.log('📦 Converted data for submission:', convertedData);
      await onSubmit(convertedData);
      console.log('✅ Form submitted successfully');
      
      // Dismiss loading toast (success toast is handled by parent component)
      toast.dismiss(loadingToast);
      onClose();
    } catch (error: any) {
      console.error('❌ Error submitting form:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to submit form.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please login first.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid data. Please check your input.';
        } else if (error.response.status === 403) {
          // Use the specific error message from backend instead of generic permission message
          errorMessage = error.response.data?.message || 'Access denied. You don\'t have permission.';
        } else if (error.response.status === 500) {
          // Try to extract more detailed error message from backend
          const backendMessage = error.response.data?.message || error.response.data?.error || error.response.data?.errorMessage;
          if (backendMessage) {
            errorMessage = `Server error: ${backendMessage}`;
          } else {
            errorMessage = 'Server error. Please check the console for details and try again.';
          }
          // Log full error for debugging
          console.error('Full 500 error response:', error.response.data);
        } else {
          errorMessage = error.response.data?.message || `Server error (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage = error.message || 'Unknown error occurred.';
      }
      
      // Show error toast notification
      toast.error(errorMessage);
    } finally {
      // Dismiss loading toast if it exists
      toast.dismiss(loadingToast);
      console.log('📝 Setting loading to false...');
      setLoading(false);
    }
  };

  // Manual submit function as backup
  const handleManualSubmit = async () => {
    console.log('🔧 Manual submit triggered!');
    
    // Prevent double submissions
    if (loading) {
      console.log('⚠️ Already submitting, skipping duplicate request');
      return;
    }
    
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('❌ No access token found');
      toast.error('Please login first to submit the form.');
      return;
    }
    
    console.log('✅ Token found, proceeding with manual submission');
    console.log('�� Setting loading to true (manual)...');
    setLoading(true);
    
    // Show loading toast
    const loadingToast = toast.loading(`Creating ${activeTab === 'drivers' ? 'driver' : 'truck'}...`);
    
    try {
      console.log('📤 Submitting form data manually:', formData);
      const convertedData = convertFormDataForSubmission(formData);
      console.log('📦 Converted data for submission:', convertedData);
      await onSubmit(convertedData);
      console.log('✅ Form submitted successfully');
      
      // Dismiss loading toast (success toast is handled by parent component)
      toast.dismiss(loadingToast);
      onClose();
    } catch (error: any) {
      console.error('❌ Error submitting form:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to submit form.';
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = 'Authentication required. Please login first.';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid data. Please check your input.';
        } else if (error.response.status === 403) {
          // Use the specific error message from backend instead of generic permission message
          errorMessage = error.response.data?.message || 'Access denied. You don\'t have permission.';
        } else if (error.response.status === 500) {
          // Try to extract more detailed error message from backend
          const backendMessage = error.response.data?.message || error.response.data?.error || error.response.data?.errorMessage;
          if (backendMessage) {
            errorMessage = `Server error: ${backendMessage}`;
          } else {
            errorMessage = 'Server error. Please check the console for details and try again.';
          }
          // Log full error for debugging
          console.error('Full 500 error response:', error.response.data);
        } else {
          errorMessage = error.response.data?.message || `Server error (${error.response.status}). Please try again.`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection.';
      } else {
        // Other error
        errorMessage = error.message || 'Unknown error occurred.';
      }
      
      // Show error toast notification
      toast.error(errorMessage);
    } finally {
      // Dismiss loading toast if it exists
      toast.dismiss(loadingToast);
      console.log('📝 Setting loading to false (manual)...');
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    // If activeTab is 'drivers', show driver-specific steps
    if (activeTab === 'drivers') {
      switch (currentStep) {
        case 1:
          return <DriverInformationStep 
            formData={formData} 
            handleInputChange={handleInputChange}
          />;
        case 2:
          return <CertificationsStep 
            formData={formData} 
            handleInputChange={handleInputChange}
          />;
        case 3:
          return <ReviewSubmitStep 
            formData={formData} 
            activeTab="drivers"
          />;
        default:
          return <DriverInformationStep 
            formData={formData} 
            handleInputChange={handleInputChange}
          />;
      }
    }
    
    // Default truck steps
    switch (currentStep) {
      case 1:
        return <BasicInformationStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 2:
        return <SpecificationsStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 3:
        return <CargoCapabilitiesStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 4:
        return <LoadingEquipmentStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 5:
        return <SecurityMonitoringStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 6:
        return <CertificationsStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 7:
        return <RouteCapabilitiesStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      case 8:
        return <CostStructureStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
      default:
        return <BasicInformationStep 
          formData={formData} 
          handleInputChange={handleInputChange}
        />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 flex justify-between p-4 border-b border-gray-200">
          <div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {mode === 'create' 
                ? `Create ${activeTab === 'drivers' ? 'Driver' : 'Truck'}` 
                : `Edit ${activeTab === 'drivers' ? 'Driver' : 'Truck'}`
              }
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">
              Enter detailed {activeTab === 'drivers' ? 'driver' : 'truck'} information
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Vertical Sidebar Navigation */}
          <div className="w-56 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
            <nav className="p-3 space-y-1">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = isStepComplete(step.id);
                const StepIcon = step.icon;
                
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-md text-left transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900 border border-gray-300"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    title={
                      isCompleted
                        ? "Step complete"
                        : isActive
                        ? "Current step"
                        : "Step incomplete"
                    }
                  >
                    <div className="flex items-center justify-center flex-shrink-0">
                      <div className="w-3.5 h-3.5 flex items-center justify-center">
                        {React.cloneElement(step.icon, { 
                          className: "w-3.5 h-3.5 text-gray-500"
                        })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${
                        isActive ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                    {isCompleted ? (
                      <span className="ml-auto text-gray-600 flex-shrink-0 text-xs" title="Complete">
                        &#10003;
                      </span>
                    ) : (
                      <span
                        className="ml-auto text-gray-300 flex-shrink-0 text-xs"
                        title="Incomplete"
                      >
                        &#9675;
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form Content - Responsive */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <form 
                onSubmit={handleSubmit} 
                id="fleet-form-stepper"
              >
                <div ref={stepContentRef} className="max-w-3xl mx-auto">
                  {renderStepContent()}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer - Responsive */}
        <DialogFooter className="flex-shrink-0 bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
                className={`flex items-center px-3 py-1.5 rounded-md border text-xs ${
              currentStep === 1
                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FaArrowLeft className="w-3 h-3 mr-1.5" />
            <span>Previous</span>
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 text-xs"
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-xs"
              >
                <span>Next</span>
                <FaArrowRight className="w-3 h-3 ml-1.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  console.log('Submit button clicked!');
                  console.log('Form data:', formData);
                  console.log('Loading state:', loading);
                  console.log('Current step:', currentStep, 'Total steps:', steps.length);
                  
                  // Check if we're on the final step
                  if (currentStep !== steps.length) {
                    console.log('❌ Not on final step, cannot submit');
                    return;
                  }
                  
                  // Check form validation
                  const form = document.getElementById('fleet-form-stepper') as HTMLFormElement;
                  if (form) {
                    console.log('📋 Form validation check...');
                    const isValid = form.checkValidity();
                    console.log('✅ Form is valid:', isValid);
                    
                    if (!isValid) {
                      console.log('❌ Form validation failed, showing validation errors');
                      form.reportValidity();
                      return;
                    }
                  }
                  
                  // Submit the form
                  console.log('🚀 Triggering form submission...');
                  handleManualSubmit();
                }}
                className="flex items-center px-3 py-1.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              >
                {loading ? (
                  <span>Submitting...</span>
                ) : (
                  <span>Submit {activeTab === 'drivers' ? 'Driver' : 'Truck'}</span>
                )}
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FleetFormStepper; 