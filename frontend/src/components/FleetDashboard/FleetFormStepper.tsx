import React, { useState, useEffect, useRef } from 'react';
import {
  FaTruck,
  FaCog,
  FaShieldAlt,
  FaUser,
  FaCheck,
  FaArrowLeft,
  FaArrowRight,
  FaBox,
  FaTools,
  FaCertificate,
  FaRoute,
  FaDollarSign,
  FaSearch,
  FaCheckCircle
} from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { FleetItem } from '../../types/fleet';
import { driverApi } from '../../services/driverApi';
import { fleetApi } from '../../services/fleetApi';
import type { Driver } from '../../services/fleetApi';
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
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return false;
  });

  // Driver creation mode: 'new' or 'existing'
  const [driverCreationMode, setDriverCreationMode] = useState<'new' | 'existing'>('new');
  const [existingDriverSearch, setExistingDriverSearch] = useState('');
  const [selectedExistingDriver, setSelectedExistingDriver] = useState<Driver | null>(null);

  // Debug loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed to:', loading);
  }, [loading]);

  // Reset driver creation mode when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setDriverCreationMode('new');
      setSelectedExistingDriver(null);
      setExistingDriverSearch('');
      setCurrentStep(1);
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false); // Close sidebar on mobile when dialog closes
      }
    }
  }, [isOpen]);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && !sidebarOpen) {
        setSidebarOpen(true);
      } else if (!isDesktop && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Fetch all available drivers for selection (when adding existing driver)
  const { data: allAvailableDrivers = [] } = useQuery({
    queryKey: ['all-available-drivers-fleet', existingDriverSearch],
    queryFn: async () => {
      try {
        const data = await driverApi.getDrivers({
          search: existingDriverSearch,
          status: 'ACTIVE'
        });
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching available drivers:', error);
        return [];
      }
    },
    enabled: activeTab === 'drivers' && mode === 'create' && driverCreationMode === 'existing' && existingDriverSearch.length > 0,
  });

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
        // cargoCapabilities removed (not in type)
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
  // Helper function to convert date to ISO 8601 format
  const toISOString = (date: any): string | undefined => {
    // Handle empty/null/undefined
    if (!date || date === '' || date === null || date === undefined) {
      return undefined;
    }

    // If it's already an ISO string, return it
    if (typeof date === 'string' && date.includes('T')) {
      return date;
    }

    // If it's a date string in YYYY-MM-DD format (from HTML date input), convert to ISO
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Create date at midnight UTC to avoid timezone issues
      const isoDate = new Date(date + 'T00:00:00.000Z').toISOString();
      console.log(`📅 Converted date "${date}" to ISO: "${isoDate}"`);
      return isoDate;
    }

    // If it's a Date object, convert to ISO
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ Invalid Date object:`, date);
        return undefined;
      }
      return date.toISOString();
    }

    // Try to parse as date
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    console.warn(`⚠️ Could not parse date:`, date, typeof date);
    return undefined;
  };

  const convertFormDataForSubmission = (data: Partial<FleetFormData>): any => {
    // Normalize driver payload to backend CreateDriverDto if submitting a driver
    if (activeTab === 'drivers') {
      const d: any = data || {};

      // Log raw date values for debugging
      console.log('📅 Raw date values from form:', {
        dateOfBirth: d.dateOfBirth,
        licenseIssueDate: d.licenseIssueDate,
        licenseExpiry: d.licenseExpiry,
        hireDate: d.hireDate,
      });

      // Convert dates - ensure they are valid ISO strings
      const dateOfBirthISO = toISOString(d.dateOfBirth);
      const licenseIssueDateISO = toISOString(d.licenseIssueDate);
      const licenseExpiryISO = toISOString(d.licenseExpiry);
      const hireDateISO = toISOString(d.hireDate);

      // Validate required dates
      if (!dateOfBirthISO) {
        console.error('❌ dateOfBirth is missing or invalid:', d.dateOfBirth);
        throw new Error('Date of birth is required and must be a valid date');
      }
      if (!licenseIssueDateISO) {
        console.error('❌ licenseIssueDate is missing or invalid:', d.licenseIssueDate);
        throw new Error('License issue date is required and must be a valid date');
      }
      if (!licenseExpiryISO) {
        console.error('❌ licenseExpiry is missing or invalid:', d.licenseExpiry);
        throw new Error('License expiry date is required and must be a valid date');
      }
      if (!hireDateISO) {
        console.error('❌ hireDate is missing or invalid:', d.hireDate);
        throw new Error('Hire date is required and must be a valid date');
      }

      // Log converted dates
      console.log('📅 Converted ISO dates:', {
        dateOfBirth: dateOfBirthISO,
        licenseIssueDate: licenseIssueDateISO,
        licenseExpiry: licenseExpiryISO,
        hireDate: hireDateISO,
      });

      const payload = {
        // required by backend DTO
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: d.contactInfo?.email || '',
        phone: d.contactInfo?.phone || '',
        dateOfBirth: dateOfBirthISO,
        address: d.address || '',
        employeeId: d.employeeId, // optional
        licenseNumber: d.licenseNumber || '',
        licenseIssueDate: licenseIssueDateISO,
        licenseExpiry: licenseExpiryISO,
        licenseState: d.licenseState || 'N/A',
        licenseCountry: d.licenseCountry || 'N/A',
        employmentType: d.employmentType || 'FULL_TIME',
        hireDate: hireDateISO,
        terminationDate: toISOString(d.terminationDate),
        status: d.status || 'ACTIVE',
        hourlyRate: d.hourlyRate ? Number(d.hourlyRate) : undefined,
        mileageRate: d.mileageRate ? Number(d.mileageRate) : undefined,
        medicalCertExpiry: toISOString(d.medicalCertExpiry),
        drugTestDate: toISOString(d.drugTestDate),
        backgroundCheckDate: toISOString(d.backgroundCheckDate),
        trainingCompletionDate: toISOString(d.trainingCompletionDate),
      };

      console.log('📦 Final payload with dates:', payload);
      return payload;
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

    // Handle existing driver selection
    if (activeTab === 'drivers' && mode === 'create' && driverCreationMode === 'existing') {
      if (!selectedExistingDriver) {
        toast.error('Please select a driver to add');
        return;
      }

      setLoading(true);
      const loadingToast = toast.loading('Adding driver...');

      try {
        await fleetApi.updateDriver(selectedExistingDriver.id, {
          status: 'ACTIVE',
          availabilityStatus: 'AVAILABLE',
        });

        toast.dismiss(loadingToast);
        toast.success('Driver added successfully');
        onClose();

        // Reset form
        setSelectedExistingDriver(null);
        setExistingDriverSearch('');
        setDriverCreationMode('new');
      } catch (error: any) {
        toast.dismiss(loadingToast);
        toast.error(error?.response?.data?.message || 'Failed to add existing driver');
        setLoading(false);
      }
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
    console.log(' Setting loading to true (manual)...');
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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setSidebarOpen(false); // Close sidebar on mobile when dialog closes
      }
    }}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base sm:text-lg font-semibold text-gray-900">
              {mode === 'create'
                ? `Create ${activeTab === 'drivers' ? 'Driver' : 'Truck'}`
                : `Edit ${activeTab === 'drivers' ? 'Driver' : 'Truck'}`
              }
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-0.5">
              Enter detailed {activeTab === 'drivers' ? 'driver' : 'truck'} information
            </DialogDescription>
          </div>
          {/* Mobile Sidebar Toggle */}
          {!(activeTab === 'drivers' && mode === 'create' && driverCreationMode === 'existing') && (
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation"
            >
              <FaCog className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </DialogHeader>

        {/* Driver Mode Selection (only for create driver mode) */}
        {activeTab === 'drivers' && mode === 'create' && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Option
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="driverMode"
                  value="new"
                  checked={driverCreationMode === 'new'}
                  onChange={(e) => {
                    setDriverCreationMode(e.target.value as 'new' | 'existing');
                    setSelectedExistingDriver(null);
                    setExistingDriverSearch('');
                    setCurrentStep(1);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Create New Driver</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="driverMode"
                  value="existing"
                  checked={driverCreationMode === 'existing'}
                  onChange={(e) => {
                    setDriverCreationMode(e.target.value as 'new' | 'existing');
                    setCurrentStep(1);
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Add Existing Driver</span>
              </label>
            </div>
          </div>
        )}

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Overlay - only on mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Vertical Sidebar Navigation */}
          {!(activeTab === 'drivers' && mode === 'create' && driverCreationMode === 'existing') && (
            <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-56 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0 lg:relative fixed inset-y-0 left-0 z-50 lg:z-auto`}>
              <nav className="p-2 sm:p-3 space-y-1">
                {steps.map((step) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = isStepComplete(step.id);
                  // StepIcon removed (unused)

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        setCurrentStep(step.id);
                        setSidebarOpen(false); // Close sidebar on mobile after selection
                      }}
                      className={`w-full flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-md text-left transition-colors ${isActive
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
                        <p className={`text-xs font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-600'
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
          )}

          {/* Form Content - Responsive */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-3 sm:p-4">
              <form
                onSubmit={handleSubmit}
                id="fleet-form-stepper"
              >
                <div ref={stepContentRef} className="max-w-3xl mx-auto w-full min-w-0">
                  {/* Existing Driver Selection UI */}
                  {activeTab === 'drivers' && mode === 'create' && driverCreationMode === 'existing' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search for Driver *
                        </label>
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            value={existingDriverSearch}
                            onChange={(e) => setExistingDriverSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search by name, email, phone, or license number..."
                          />
                        </div>
                      </div>

                      {/* Driver Results */}
                      {existingDriverSearch.length > 0 && (
                        <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                          {allAvailableDrivers.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No drivers found. Try a different search term.
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {allAvailableDrivers.map((driver) => (
                                <div
                                  key={driver.id}
                                  onClick={() => {
                                    setSelectedExistingDriver({
                                      ...driver,
                                      experience: (driver as any).experience || 0,
                                      createdAt: (driver as any).createdAt || new Date().toISOString(),
                                      updatedAt: (driver as any).updatedAt || new Date().toISOString()
                                    } as any);
                                    setExistingDriverSearch(`${driver.firstName} ${driver.lastName} - ${driver.email}`);
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedExistingDriver?.id === driver.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                                    }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {driver.firstName} {driver.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {driver.email} • {driver.phone}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        License: {driver.licenseNumber}
                                      </div>
                                    </div>
                                    {selectedExistingDriver?.id === driver.id && (
                                      <FaCheckCircle className="w-5 h-5 text-blue-600" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {selectedExistingDriver && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <FaCheckCircle className="w-5 h-5" />
                            <span className="font-medium">
                              Selected: {selectedExistingDriver.firstName} {selectedExistingDriver.lastName}
                            </span>
                          </div>
                        </div>
                      )}

                      {!selectedExistingDriver && existingDriverSearch.length === 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Search for an existing driver by name, email, phone, or license number to add them to your fleet.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    renderStepContent()
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer - Responsive */}
        <DialogFooter className="flex-shrink-0 bg-gray-50 px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center justify-center px-3 py-2 rounded-md border text-xs sm:text-sm ${currentStep === 1
              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
          >
            <FaArrowLeft className="w-3 h-3 mr-1.5" />
            <span>Previous</span>
          </button>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-3 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100 text-xs sm:text-sm"
            >
              Cancel
            </button>

            {activeTab === 'drivers' && mode === 'create' && driverCreationMode === 'existing' ? (
              <button
                type="submit"
                disabled={loading || !selectedExistingDriver}
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-3 h-3 mr-1.5" />
                    Add Driver
                  </>
                )}
              </button>
            ) : currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-xs sm:text-sm"
              >
                <span>Next</span>
                <FaArrowRight className="w-3 h-3 ml-1.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                onClick={() => {
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
                className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
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