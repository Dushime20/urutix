export const FleetStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_TRANSIT: 'IN_TRANSIT',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
} as const;

export type FleetStatus = typeof FleetStatus[keyof typeof FleetStatus];

export const DocumentType = {
  INSURANCE: 'insurance',
  REGISTRATION: 'registration',
  INSPECTION: 'inspection',
  PERMIT: 'permit',
  LICENSE: 'license',
  CERTIFICATE: 'certificate',
  CONTRACT: 'contract',
  MANUAL: 'manual',
  WARRANTY: 'warranty',
  OTHER: 'other'
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export const DocumentStatus = {
  VALID: 'valid',
  EXPIRED: 'expired',
  EXPIRING_SOON: 'expiring_soon',
  PENDING: 'pending',
  REJECTED: 'rejected',
  UNDER_REVIEW: 'under_review'
} as const;

export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];

export const InspectionType = {
  SAFETY: 'safety',
  EMISSIONS: 'emissions',
  WEIGHT: 'weight',
  BRAKE: 'brake',
  TIRE: 'tire',
  ELECTRICAL: 'electrical',
  HYDRAULIC: 'hydraulic',
  PRE_TRIP: 'pre_trip',
  POST_TRIP: 'post_trip',
  ANNUAL: 'annual',
  BIENNIAL: 'biennial'
} as const;

export type InspectionType = typeof InspectionType[keyof typeof InspectionType];

export const MaintenanceType = {
  PREVENTIVE: 'preventive',
  CORRECTIVE: 'corrective',
  EMERGENCY: 'emergency',
  SCHEDULED: 'scheduled',
  INSPECTION: 'inspection',
  REPAIR: 'repair',
  REPLACEMENT: 'replacement',
  UPGRADE: 'upgrade'
} as const;

export type MaintenanceType = typeof MaintenanceType[keyof typeof MaintenanceType];

export const ComplianceStatus = {
  COMPLIANT: 'compliant',
  NON_COMPLIANT: 'non_compliant',
  WARNING: 'warning',
  CRITICAL: 'critical',
  PENDING: 'pending'
} as const;

export type ComplianceStatus = typeof ComplianceStatus[keyof typeof ComplianceStatus];

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number; // in miles/km
  estimatedDuration: number; // in hours
  status: 'active' | 'inactive' | 'maintenance';
  assignedDrivers?: string[]; // driver IDs
  assignedTrucks?: string[]; // truck IDs
}

export interface DriverAssignment {
  id: string;
  driverId: string;
  driverName: string;
  assignmentDate: Date;
  status: 'active' | 'inactive' | 'temporary';
  notes?: string;
}

export interface RouteAssignment {
  id: string;
  routeId: string;
  routeName: string;
  assignmentDate: Date;
  status: 'active' | 'inactive' | 'scheduled';
  notes?: string;
}

// Enhanced document interface with comprehensive tracking
export interface TruckDocument {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  documentNumber?: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority?: string;
  fileUrl?: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt: Date;
  lastModified: Date;
  notes?: string;
  tags?: string[];
  isRequired: boolean;
  complianceStatus: ComplianceStatus;
  renewalReminder?: Date;
  autoRenewal?: boolean;
  cost?: number;
  vendor?: string;
}

// Enhanced maintenance record with detailed tracking
export interface MaintenanceRecord {
  id: string;
  type: MaintenanceType;
  title: string;
  description: string;
  date: Date;
  cost: number;
  nextDueDate?: Date;
  status: 'completed' | 'scheduled' | 'overdue' | 'in_progress' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTechnician?: string;
  location?: string;
  partsUsed?: string[];
  laborHours?: number;
  warranty?: {
    covered: boolean;
    warrantyPeriod?: number;
    warrantyExpiry?: Date;
  };
  attachments?: string[];
  notes?: string;
  mileage?: number;
  fuelConsumption?: number;
  complianceImpact?: ComplianceStatus;
}

// Comprehensive inspection record
export interface InspectionRecord {
  id: string;
  type: InspectionType;
  title: string;
  inspector: string;
  inspectionDate: Date;
  nextInspectionDate: Date;
  status: 'passed' | 'failed' | 'conditional' | 'pending';
  score?: number; // 0-100
  violations?: string[];
  correctiveActions?: string[];
  complianceStatus: ComplianceStatus;
  location?: string;
  weatherConditions?: string;
  mileage?: number;
  attachments?: string[];
  notes?: string;
  cost?: number;
  isRequired: boolean;
  autoSchedule?: boolean;
}

// Insurance record with comprehensive coverage
export interface InsuranceRecord {
  id: string;
  policyNumber: string;
  insuranceCompany: string;
  policyType: 'liability' | 'comprehensive' | 'cargo' | 'physical_damage' | 'umbrella';
  coverageAmount: number;
  deductible: number;
  premium: number;
  startDate: Date;
  endDate: Date;
  status: DocumentStatus;
  agent?: string;
  agentContact?: string;
  claims?: InsuranceClaim[];
  documents?: string[];
  autoRenewal?: boolean;
  notes?: string;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  incidentDate: Date;
  claimDate: Date;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'settled';
  adjuster?: string;
  notes?: string;
}

// Fuel and cost tracking
export interface FuelRecord {
  id: string;
  date: Date;
  fuelType: 'diesel' | 'gasoline' | 'electric' | 'hybrid';
  quantity: number; // gallons/liters
  cost: number;
  mileage: number;
  location: string;
  fuelEfficiency?: number; // mpg
  driver?: string;
  receipt?: string;
  notes?: string;
}

// Tire management
export interface TireRecord {
  id: string;
  position: 'front_left' | 'front_right' | 'rear_left' | 'rear_right' | 'spare';
  brand: string;
  model: string;
  size: string;
  serialNumber?: string;
  installationDate: Date;
  expectedLifespan: number; // miles
  currentMileage: number;
  treadDepth: number;
  pressure: number;
  status: 'good' | 'fair' | 'poor' | 'replaced';
  rotationHistory?: Date[];
  replacementDate?: Date;
  cost?: number;
  notes?: string;
}

// Driver qualification and training
export interface DriverQualification {
  id: string;
  driverId: string;
  qualificationType: 'cdl' | 'hazmat' | 'passenger' | 'tanker' | 'doubles_triples' | 'school_bus';
  licenseNumber: string;
  issueDate: Date;
  expiryDate: Date;
  issuingState: string;
  status: DocumentStatus;
  restrictions?: string[];
  endorsements?: string[];
  medicalCertificate?: {
    issueDate: Date;
    expiryDate: Date;
    examiner: string;
    status: DocumentStatus;
  };
  drugTest?: {
    date: Date;
    result: 'negative' | 'positive' | 'pending';
    facility: string;
  };
  alcoholTest?: {
    date: Date;
    result: 'negative' | 'positive' | 'pending';
    facility: string;
  };
  trainingRecords?: TrainingRecord[];
}

export interface TrainingRecord {
  id: string;
  type: 'safety' | 'defensive_driving' | 'hazmat' | 'first_aid' | 'cpr' | 'custom';
  title: string;
  provider: string;
  date: Date;
  expiryDate?: Date;
  score?: number;
  status: 'completed' | 'in_progress' | 'scheduled' | 'expired';
  certificate?: string;
  notes?: string;
}

// Compliance and regulatory tracking
export interface ComplianceRecord {
  id: string;
  regulation: string;
  requirement: string;
  dueDate: Date;
  status: ComplianceStatus;
  lastChecked: Date;
  nextCheck: Date;
  responsibleParty: string;
  documentation?: string[];
  notes?: string;
  penalties?: {
    amount: number;
    date: Date;
    reason: string;
  }[];
}

// Enhanced FleetItem with comprehensive records
export interface FleetItem {
  id: string;
  type: 'truck' | 'driver';
  name: string;
  status: FleetStatus;
  currentLocation?: {
    coordinates: {
      coordinates: number[];
    };
    address?: string;
  };
  createdAt: Date;
  updatedAt: Date;

  // Truck specific fields
  licensePlate?: string;
  plateNumber?: string; // Added for form compatibility
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  capacityWeight?: number; // Added for form compatibility
  capacityVolume?: number; // Added for form compatibility
  fuelType?: string;
  vin?: string;
  engineNumber?: string;
  transmissionType?: string;
  axleConfiguration?: string;
  grossVehicleWeight?: number;
  emptyWeight?: number;
  color?: string; // Added for form compatibility
  mileage?: number; // Added for form compatibility
  truckType?: string; // Added for form compatibility
  trailerType?: string; // Added for form compatibility
  registrationNumber?: string; // Added for form compatibility
  registrationExpiry?: string; // Added for form compatibility
  insurancePolicy?: string; // Added for form compatibility
  insuranceExpiry?: string; // Added for form compatibility
  roadworthyCertExpiry?: string; // Added for form compatibility

  // Equipment and capabilities
  hasRefrigeration?: boolean;
  hasLiftGate?: boolean;
  hasGps?: boolean;
  hasHazmatPermit?: boolean;
  hasSideRails?: boolean;
  hasTarps?: boolean;
  hasStraps?: boolean;
  hasChains?: boolean;
  hasWinch?: boolean;
  hasRam?: boolean;
  hasTailLift?: boolean;
  hasSideLift?: boolean;
  hasRollerBed?: boolean;
  hasDropDeck?: boolean;
  hasExtendable?: boolean;
  hasLowbed?: boolean;
  hasStepDeck?: boolean;
  hasPowerOnly?: boolean;
  hasContainerChassis?: boolean;
  hasTanker?: boolean;
  hasBulk?: boolean;
  hasRefrigerated?: boolean;
  hasHeated?: boolean;
  hasVentilated?: boolean;
  hasCurtainSide?: boolean;
  hasBox?: boolean;
  hasVan?: boolean;
  hasPlatform?: boolean;
  hasCarCarrier?: boolean;
  hasHeavyHaul?: boolean;
  hasOversized?: boolean;
  hasHazmat?: boolean;
  hasDangerousGoods?: boolean;
  hasFoodGrade?: boolean;
  hasPharmaceutical?: boolean;
  hasLiquid?: boolean;
  hasDryBulk?: boolean;
  hasGas?: boolean;
  hasChemical?: boolean;
  hasWaste?: boolean;
  hasReefer?: boolean;
  hasFrozen?: boolean;
  hasChilled?: boolean;
  hasAmbient?: boolean;
  hasControlledAtmosphere?: boolean;
  hasHumidityControl?: boolean;
  hasTemperatureMonitoring?: boolean;
  hasGPS?: boolean;
  hasTracking?: boolean;
  hasTelematics?: boolean;
  hasELD?: boolean;
  hasDashCam?: boolean;
  hasSafetyCameras?: boolean;
  hasCollisionAvoidance?: boolean;
  hasLaneDeparture?: boolean;
  hasAdaptiveCruise?: boolean;
  hasBlindSpot?: boolean;
  hasBackupCamera?: boolean;
  hasTirePressureMonitoring?: boolean;
  hasEngineMonitoring?: boolean;
  hasFuelMonitoring?: boolean;
  hasMaintenanceAlerts?: boolean;
  hasDriverMonitoring?: boolean;
  hasFatigueMonitoring?: boolean;
  hasSpeedMonitoring?: boolean;
  hasIdleMonitoring?: boolean;
  hasRouteOptimization?: boolean;
  hasRealTimeTracking?: boolean;
  hasGeofencing?: boolean;
  hasTemperatureAlerts?: boolean;
  hasHumidityAlerts?: boolean;
  hasShockMonitoring?: boolean;
  hasTiltMonitoring?: boolean;
  hasDoorMonitoring?: boolean;
  hasCargoMonitoring?: boolean;
  hasWeightMonitoring?: boolean;
  hasVolumeMonitoring?: boolean;
  hasPressureMonitoring?: boolean;
  hasFlowMonitoring?: boolean;
  hasLevelMonitoring?: boolean;
  hasQualityMonitoring?: boolean;
  hasContaminationMonitoring?: boolean;
  hasLeakDetection?: boolean;
  hasOverfillProtection?: boolean;
  hasEmergencyShutdown?: boolean;
  hasFireSuppression?: boolean;
  hasExplosionProof?: boolean;
  hasCorrosionResistant?: boolean;
  hasStainlessSteel?: boolean;
  hasAluminum?: boolean;
  hasCarbonSteel?: boolean;
  hasFiberglass?: boolean;
  hasPlastic?: boolean;
  hasComposite?: boolean;
  hasInsulated?: boolean;
  hasHumidityMonitoring?: boolean;

  // Added for form compatibility (top-level overrides)
  hasForklift?: boolean;
  hasCrane?: boolean;
  hasLoadingDock?: boolean;
  maxLoadingTime?: string | number;
  maxUnloadingTime?: string | number;
  isActive?: boolean;
  maxLength?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Equipment list
  // Equipment list
  equipmentList?: string[];

  loadingCapabilities?: {
    hasForklift?: boolean;
    hasCrane?: boolean;
    hasTailLift?: boolean;
    hasSideLift?: boolean;
    hasLoadingDock?: boolean;
    maxLoadingTime?: string | number;
    maxUnloadingTime?: string | number;
    [key: string]: any;
  };
  securityFeatures?: {
    hasGps?: boolean;
    hasTracking?: boolean;
    hasTemperatureAlerts?: boolean;
    hasCargoMonitoring?: boolean;
    [key: string]: boolean | undefined;
  };

  // Multiple assignments
  assignedDrivers?: DriverAssignment[];
  primaryDriver?: {
    id: string;
    name: string;
  };
  assignedRoutes?: RouteAssignment[];

  // Comprehensive records
  documents?: TruckDocument[];
  maintenance?: MaintenanceRecord[];
  inspections?: InspectionRecord[];
  insurance?: InsuranceRecord[];
  fuelRecords?: FuelRecord[];
  tireRecords?: TireRecord[];
  compliance?: ComplianceRecord[];

  // Driver specific fields
  firstName?: string;
  lastName?: string;
  licenseNumber?: string;
  licenseType?: string;
  experience?: number;
  currentTruck?: {
    id: string;
    licensePlate: string;
  };
  qualifications?: DriverQualification[];

  // Common fields
  contactInfo?: {
    phone?: string;
    email?: string;
  };
  dateOfBirth?: string | Date;
  address?: string;
  licenseIssueDate?: string | Date;
  licenseExpiry?: string | Date;
  licenseState?: string;
  licenseCountry?: string;
  employmentType?: string;
  hireDate?: string | Date;
  trips?: TripRecord[];
}

export interface FleetFilters {
  status?: FleetStatus;
  location?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  type?: 'truck' | 'driver';
  complianceStatus?: ComplianceStatus;
  documentStatus?: DocumentStatus;
  maintenanceStatus?: 'completed' | 'scheduled' | 'overdue';
}

export interface FleetData {
  items: FleetItem[];
  hasMore: boolean;
  total: number;
}

export interface TripRecord {
  id: string;
  origin: string;
  destination: string;
  startDate: Date;
  endDate?: Date;
  status: 'completed' | 'in_progress' | 'scheduled';
  revenue: number;
}

// Safety Management Interfaces
export interface SafetyIncident {
  id: string;
  type: 'accident' | 'near_miss' | 'injury' | 'property_damage' | 'traffic_violation';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  date: Date;
  location: string;
  description: string;
  driverId: string;
  driverName: string;
  truckId: string;
  truckPlate: string;
  weatherConditions: string;
  roadConditions: string;
  injuries: string;
  propertyDamage: number;
  policeReport: boolean;
  reportNumber: string;
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  assignedTo: string;
  correctiveActions: string[];
  cost: number;
  insuranceClaim: boolean;
  claimNumber?: string;
}

export interface SafetyInspection {
  id: string;
  type: 'pre_trip' | 'post_trip' | 'weekly' | 'monthly' | 'annual' | 'random';
  inspector: string;
  inspectionDate: Date;
  truckId: string;
  truckPlate: string;
  driverId: string;
  driverName: string;
  status: 'passed' | 'failed' | 'conditional';
  score: number;
  maxScore: number;
  items: SafetyInspectionItem[];
  notes: string;
  nextInspectionDate: Date;
  complianceStatus: 'compliant' | 'non_compliant';
}

export interface SafetyInspectionItem {
  id: string;
  category: 'brakes' | 'tires' | 'lights' | 'engine' | 'transmission' | 'safety_equipment' | 'documentation';
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes: string;
  critical: boolean;
}

export interface DriverSafetyScore {
  id: string;
  driverId: string;
  driverName: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  score: number;
  maxScore: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: {
    incidents: number;
    violations: number;
    inspections: number;
    trainingHours: number;
    milesDriven: number;
  };
  trends: {
    previousScore: number;
    improvement: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

export interface SafetyTraining {
  id: string;
  type: 'defensive_driving' | 'hazmat' | 'first_aid' | 'emergency_procedures' | 'regulations' | 'technology';
  title: string;
  description: string;
  duration: number; // hours
  required: boolean;
  frequency: 'once' | 'annually' | 'biannually' | 'quarterly';
  lastCompleted?: Date;
  nextDue: Date;
  status: 'completed' | 'pending' | 'overdue';
  driverId: string;
  driverName: string;
  instructor: string;
  score?: number;
  certificate?: string;
}

export interface SafetyAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  relatedTo: 'driver' | 'truck' | 'incident' | 'inspection' | 'training';
  relatedId: string;
  assignedTo: string;
  dueDate?: Date;
}

// Financial Management Interfaces
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  tripId?: string;
  truckId?: string;
  driverId?: string;
  issueDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms: string;
  paymentMethod?: string;
  paidDate?: Date;
  lateFees?: number;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  type: 'freight' | 'fuel_surcharge' | 'toll' | 'detention' | 'lumper' | 'accessorial';
  tripId?: string;
  notes?: string;
}

export interface Rate {
  id: string;
  customerId: string;
  customerName: string;
  origin: string;
  destination: string;
  rateType: 'per_mile' | 'per_load' | 'flat_rate' | 'percentage';
  baseRate: number;
  fuelSurcharge: number;
  accessorialCharges: AccessorialCharge[];
  effectiveDate: Date;
  expiryDate?: Date;
  status: 'active' | 'inactive' | 'expired';
  notes?: string;
}

export interface AccessorialCharge {
  id: string;
  name: string;
  type: 'detention' | 'lumper' | 'toll' | 'fuel' | 'custom';
  rate: number;
  rateType: 'per_hour' | 'per_day' | 'flat' | 'percentage';
  description?: string;
}

export interface Expense {
  id: string;
  type: 'fuel' | 'maintenance' | 'toll' | 'driver' | 'insurance' | 'tax' | 'other';
  category: string;
  amount: number;
  date: Date;
  description: string;
  truckId?: string;
  driverId?: string;
  tripId?: string;
  receipt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedDate?: Date;
  notes?: string;
  taxDeductible: boolean;
  allocation: {
    customerId?: string;
    tripId?: string;
    percentage: number;
  };
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'check' | 'ach' | 'credit_card' | 'wire' | 'cash';
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  processingFee?: number;
}

export interface FinancialReport {
  id: string;
  type: 'pl_statement' | 'cash_flow' | 'revenue' | 'expense' | 'profitability';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  data: FinancialReportData;
  generatedAt: Date;
  generatedBy: string;
}

export interface FinancialReportData {
  revenue: {
    total: number;
    byCustomer: Record<string, number>;
    byTrip: Record<string, number>;
    byMonth: Record<string, number>;
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    byTruck: Record<string, number>;
    byMonth: Record<string, number>;
  };
  profit: {
    total: number;
    margin: number;
    byCustomer: Record<string, number>;
    byTrip: Record<string, number>;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    netChange: number;
  };
}

export interface Budget {
  id: string;
  year: number;
  month?: number;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  notes?: string;
}

export interface TaxRecord {
  id: string;
  type: 'ifta' | 'fuel_tax' | 'income_tax' | 'sales_tax';
  period: string;
  filingDate: Date;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'filed' | 'paid' | 'overdue';
  jurisdiction: string;
  referenceNumber?: string;
  notes?: string;
}

// Analytics Interfaces
export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercentage: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  date: Date;
}

export interface CustomerAnalytics {
  customerId: string;
  customerName: string;
  totalRevenue: number;
  totalTrips: number;
  averageRate: number;
  profitMargin: number;
  paymentHistory: {
    onTime: number;
    late: number;
    averageDaysToPay: number;
  };
  satisfaction: number;
  churnRisk: 'low' | 'medium' | 'high';
  lastActivity: Date;
}

export interface DriverAnalytics {
  driverId: string;
  driverName: string;
  totalTrips: number;
  totalMiles: number;
  revenue: number;
  expenses: number;
  profit: number;
  efficiency: number;
  safetyScore: number;
  retentionScore: number;
  lastActivity: Date;
}

export interface PredictiveAnalytics {
  demandForecast: {
    period: string;
    predictedVolume: number;
    confidence: number;
    factors: string[];
  };
  priceOptimization: {
    recommendedRate: number;
    marketRate: number;
    competitiveAdvantage: number;
    factors: string[];
  };
  maintenancePrediction: {
    truckId: string;
    nextMaintenanceDate: Date;
    confidence: number;
    recommendedActions: string[];
  };
  fuelOptimization: {
    recommendedRoutes: string[];
    expectedSavings: number;
    efficiencyImprovement: number;
  };
  riskAssessment: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    mitigationStrategies: string[];
  };
} 