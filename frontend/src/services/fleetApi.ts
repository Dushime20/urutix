import api from './api';

// Types for Fleet API
export interface Truck {
  id: string;
  plateNumber: string;
  vin: string;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  truckType: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  capacityWeight?: number;
  capacityVolume?: number;
  fuelType?: string;
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
  currentAddress?: string;
  currentDriverId?: string;
  currentDriver?: Driver;
  ownerId: string;
  owner?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
  };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  assignedRoutes?: Array<{
    routeId: string;
    routeName: string;
    origin?: string;
    destination?: string;
    distance?: number;
    assignmentDate: string;
    status: string;
  }>;
  assignedDrivers?: DriverAssignment[];
  registrationNumber?: string;
  registrationExpiry?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  roadworthyCertExpiry?: string;
  trailerType?: string;
  maxLength?: number;
  maxWidth?: number;
  maxHeight?: number;
  hasRefrigeration?: boolean;
  hasLiftGate?: boolean;
  hasGps?: boolean;
  hasGPS?: boolean;
  hasHazmatPermit?: boolean;
  isActive?: boolean;
  totalRevenue?: number;
  totalTrips?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface DriverAssignment {
  driverId: string;
  driverName?: string;
  assignmentDate?: string;
  status?: string;
  notes?: string;
}

export type FleetItem = Truck;

export interface DriverDocument {
  id: string;
  entityId: string;
  entityType: string;
  documentType: string;
  category?: string;
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  expiryDate?: string;
  uploadedBy: string;
  tenantId: string;
  status: string;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  licenseNumber: string;
  licenseClasses?: string[];
  licenseIssueDate?: string;
  licenseExpiry?: string;
  licenseState?: string;
  licenseCountry?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED' | 'IN_TRANSIT';
  availabilityStatus: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'OWNER_OPERATOR' | 'FREELANCE';
  hireDate?: string;
  terminationDate?: string;
  currentTruckId?: string;
  currentTripId?: string;
  locationUpdatedAt?: string;
  tenantId: string;
  experienceYears?: number;
  experience?: number;
  rating?: number;
  totalTrips?: number;
  totalDistance?: number;
  safetyScore?: number;
  onTimeDeliveryRate?: number;
  hoursWorkedThisWeek?: number;
  hoursWorkedThisMonth?: number;
  consecutiveDrivingHours?: number;
  lastBreakTime?: string;
  medicalCertExpiry?: string;
  drugTestDate?: string;
  backgroundCheckDate?: string;
  trainingCompletionDate?: string;
  hourlyRate?: number;
  mileageRate?: number;
  totalEarnings?: number;
  driverNotes?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  certifications?: string[];
  endorsements?: string[];
  restrictions?: string[];
  preferences?: Record<string, any>;
  /** Documents attached to this driver — populated by GET /fleet/drivers and GET /fleet/drivers/:id */
  documents?: DriverDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface TruckOwner {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface Route {
  id: string;
  tenantId?: string;
  name: string;
  origin: string;
  destination: string;
  // Exact geo-coordinates stored in DB
  originLat?: number;
  originLng?: number;
  originAddress?: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationAddress?: string;
  distance: number; // in kilometers
  estimatedTime: number; // in hours
  routeType?: 'highway' | 'city' | 'rural' | 'mixed';
  status: 'active' | 'inactive' | 'maintenance';
  assignedTrucks?: string[];
  assignedDrivers?: string[];
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTruckDto {
  plateNumber: string;
  vin: string;
  truckType: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  capacityWeight?: number;
  capacityVolume?: number;
  fuelType?: string;
  currentAddress?: string;
  ownerId?: string; // Add truck owner selection
  // Insurance and registration
  registrationNumber?: string;
  registrationExpiry?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  roadworthyCertExpiry?: string;
  // Equipment features
  hasRefrigeration?: boolean;
  hasLiftGate?: boolean;
  hasGps?: boolean;
  hasHazmatPermit?: boolean;
  hasSideRails?: boolean;
  hasTarps?: boolean;
  hasStraps?: boolean;
  hasChains?: boolean;
  hasWinch?: boolean;
  // Maintenance
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  fuelEfficiency?: number;
  // Dimensions
  maxLength?: number;
  maxWidth?: number;
  maxHeight?: number;
  // Additional details
  color?: string;
  equipmentList?: string[];
}

export interface OptimizedRoute {
  id: string;
  name: string;
  origin: { latitude: number; longitude: number; name: string };
  destination: { latitude: number; longitude: number; name: string };
  stops: Array<{ latitude: number; longitude: number; name: string }>;
  totalDistance: number;
  totalDuration: number;
  status: 'active' | 'completed' | 'draft';
  createdAt: string;
}

export interface FuelEntry {
  id: string;
  truckId: string;
  driverId: string;
  date: string;
  gallons: number;
  costPerGallon: number;
  totalCost: number;
  odometer: number;
  location: string;
  fuelType: string;
  isFullTank: boolean;
  jurisdiction: string;
  status: 'verified' | 'pending' | 'flagged' | 'rejected';
  notes?: string;
  receiptUrl?: string;
  odometerImageUrl?: string;
}

export interface UpdateTruckDto {
  // Basic info
  plateNumber?: string;
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  fuelType?: string;
  status?: string;
  truckType?: string;
  trailerType?: string;
  // Capacity & dimensions
  capacityWeight?: number;
  capacityVolume?: number;
  maxLength?: number;
  maxWidth?: number;
  maxHeight?: number;
  mileage?: number;
  // Registration & compliance
  registrationNumber?: string;
  registrationExpiry?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  roadworthyCertExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  // Location
  currentAddress?: string;
  currentLocation?: any;
  // Core capability flags
  hasRefrigeration?: boolean;
  hasLiftGate?: boolean;
  hasGps?: boolean;
  hasHazmatPermit?: boolean;
  isActive?: boolean;
  // Loading equipment
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
  // Cargo type capabilities
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
  // Temperature control
  hasReefer?: boolean;
  hasFrozen?: boolean;
  hasChilled?: boolean;
  hasAmbient?: boolean;
  hasControlledAtmosphere?: boolean;
  hasHumidityControl?: boolean;
  hasTemperatureMonitoring?: boolean;
  hasInsulated?: boolean;
  // Technology & tracking
  hasGPS?: boolean;
  hasTracking?: boolean;
  hasTelematics?: boolean;
  hasELD?: boolean;
  hasDashCam?: boolean;
  hasSafetyCameras?: boolean;
  // Safety features
  hasCollisionAvoidance?: boolean;
  hasLaneDeparture?: boolean;
  hasAdaptiveCruise?: boolean;
  hasBlindSpot?: boolean;
  hasBackupCamera?: boolean;
  // Monitoring systems
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
  // Cargo monitoring
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
  // Safety systems
  hasLeakDetection?: boolean;
  hasOverfillProtection?: boolean;
  hasEmergencyShutdown?: boolean;
  hasFireSuppression?: boolean;
  hasExplosionProof?: boolean;
  // Material specs
  hasCorrosionResistant?: boolean;
  hasStainlessSteel?: boolean;
  hasAluminum?: boolean;
  hasCarbonSteel?: boolean;
  hasFiberglass?: boolean;
  hasPlastic?: boolean;
  hasComposite?: boolean;
  // Nested objects
  equipmentList?: string[];
  securityFeatures?: Record<string, any>;
  certifications?: Record<string, any>;
  routeCapabilities?: Record<string, any>;
  costStructure?: Record<string, any>;
  loadingCapabilities?: Record<string, any>;
  cargoCapabilities?: Record<string, any>;
}

export interface CreateDriverDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth: string;
  address?: string;
  licenseNumber: string;
  licenseClasses?: string[];
  licenseIssueDate: string;
  licenseExpiry: string;
  licenseState?: string;
  licenseCountry?: string;
  hireDate: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'OWNER_OPERATOR' | 'FREELANCE';
  status?: string;
  availabilityStatus?: string;
  routeIds?: string[];
  experience?: number;
  medicalCertExpiry?: string;
  drugTestDate?: string;
  backgroundCheckDate?: string;
  trainingCompletionDate?: string;
  hourlyRate?: number;
  mileageRate?: number;
  driverNotes?: string;
  certifications?: string[];
  endorsements?: string[];
  restrictions?: string[];
  preferences?: Record<string, any>;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

export interface FleetFilters {
  search?: string;
  status?: string;
  availabilityStatus?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface ComplianceRecord {
  id?: string;
  regulation: string;
  requirement: string;
  dueDate: string;
  lastChecked: string;
  nextCheck: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'EXPIRED' | 'PENDING';
  responsibleParty?: string;
  documentation?: string[];
}

export interface FleetApiResponse<T> {
  message: string;
  trucks?: T;
  truck?: T;
  drivers?: T;
  driver?: T;
  routes?: T;
  route?: T;
  data?: T;
}

export interface TCOAnalysis {
  fuelCost: number;
  maintenanceCost: number;
  insuranceCost: number;
  otherCosts: number;
  totalCost: number;
  costPerMile: number;
  breakdown: {
    fuel: number;
    maintenance: number;
    fixed: number;
    labor: number;
  };
  vehicleBreakdown: Array<{
    truckId: string;
    plateNumber: string;
    cpm: number;
    totalCost: number;
    topExpenseCategory: string;
  }>;
}

export interface UpdateDriverDto extends Partial<CreateDriverDto> {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'TERMINATED' | 'IN_TRANSIT';
  availabilityStatus?: string;
}

// Fleet API Service
export const fleetApi = {
  // Truck operations
  getTrucks: async (filters?: FleetFilters): Promise<Truck[]> => {
    const response = await api.get<FleetApiResponse<Truck[]>>('/fleet/trucks', {
      params: filters,
    });
    return response.data.trucks || response.data.data || [];
  },

  getTruck: async (id: string): Promise<Truck> => {
    const response = await api.get<FleetApiResponse<Truck>>(`/fleet/trucks/${id}`);
    const truck = response.data.truck || response.data.data || response.data.trucks;
    if (!truck) {
      throw new Error('Truck not found');
    }
    return truck as Truck;
  },

  createTruck: async (data: CreateTruckDto): Promise<Truck> => {
    const response = await api.post<FleetApiResponse<Truck>>('/fleet/trucks', data);
    const truck = response.data.truck || response.data.data || response.data.trucks;
    if (!truck) {
      throw new Error('Failed to create truck');
    }
    return truck as Truck;
  },

  updateTruck: async (id: string, data: UpdateTruckDto): Promise<Truck> => {
    const response = await api.patch<FleetApiResponse<Truck>>(`/fleet/trucks/${id}`, data);
    const truck = response.data.truck || response.data.data || response.data.trucks;
    if (!truck) {
      throw new Error('Failed to update truck');
    }
    return truck as Truck;
  },

  deleteTruck: async (id: string): Promise<void> => {
    await api.delete(`/fleet/trucks/${id}`);
  },

  updateTruckLocation: async (id: string, locationData: { latitude: number; longitude: number; address?: string }): Promise<Truck> => {
    const response = await api.patch<FleetApiResponse<Truck>>(`/fleet/trucks/${id}/location`, locationData);
    const truck = response.data.truck || response.data.data || response.data.trucks;
    if (!truck) {
      throw new Error('Failed to update truck location');
    }
    return truck as Truck;
  },

  // Driver operations
  getDrivers: async (filters?: FleetFilters): Promise<Driver[]> => {
    const response = await api.get<FleetApiResponse<Driver[]>>('/fleet/drivers', {
      params: filters,
    });
    return response.data.drivers || response.data.data || [];
  },

  getDriver: async (id: string): Promise<Driver> => {
    const response = await api.get<FleetApiResponse<Driver>>(`/fleet/drivers/${id}`);
    const driver = response.data.driver || response.data.data || response.data.drivers;
    if (!driver) {
      throw new Error('Driver not found');
    }
    return driver as Driver;
  },

  createDriver: async (data: CreateDriverDto & { documents?: { file: File; documentType: string; title: string; description?: string; expiryDate?: string }[] }): Promise<Driver> => {
    const { documents, ...driverData } = data;

    // Always send as multipart/form-data so the backend FilesInterceptor('documents', 20)
    // can process the request whether or not files are attached.
    const formData = new FormData();

    // Append all driver scalar and object fields.
    // Arrays and plain objects are JSON-stringified so they survive the multipart boundary.
    Object.entries(driverData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof File))) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    // Append each document file under the "documents" field name that
    // FilesInterceptor('documents', 20) listens for.
    if (documents && documents.length > 0) {
      documents.forEach((doc) => {
        formData.append('documents', doc.file);
      });

      // Append document metadata as a JSON array so the controller can pair
      // each file with its documentType / title / description / expiryDate.
      const meta = documents.map(({ file: _f, ...rest }) => rest);
      formData.append('documentsMeta', JSON.stringify(meta));
    }

    // Pass undefined so the browser sets the correct multipart Content-Type + boundary.
    const response = await api.post<FleetApiResponse<Driver>>('/fleet/drivers', formData, {
      headers: { 'Content-Type': undefined as any },
    });
    const driver = response.data.driver || response.data.data || (response.data as any).drivers;
    if (!driver) throw new Error('Failed to create driver');
    return driver as Driver;
  },

  updateDriver: async (id: string, data: UpdateDriverDto): Promise<Driver> => {
    const response = await api.patch<FleetApiResponse<Driver>>(`/fleet/drivers/${id}`, data);
    const driver = response.data.driver || response.data.data || response.data.drivers;
    if (!driver) {
      throw new Error('Failed to update driver');
    }
    return driver as Driver;
  },

  deleteDriver: async (id: string): Promise<void> => {
    await api.delete(`/fleet/drivers/${id}`);
  },

  getDriverDocuments: async (driverId: string): Promise<DriverDocument[]> => {
    const response = await api.get(`/fleet/drivers/${driverId}/documents`);
    return response.data.documents || response.data.data || response.data || [];
  },

  addDriverDocument: async (driverId: string, data: any): Promise<any> => {
    const response = await api.post(`/fleet/drivers/${driverId}/documents`, data);
    return response.data.data || response.data || [];
  },

  // Truck owner operations
  getTruckOwners: async (): Promise<TruckOwner[]> => {
    const response = await api.get<{ users: TruckOwner[] }>('/admin/users');
    const allUsers = response.data.users || [];
    // Filter for truck owners only
    return allUsers.filter(user => user.role === 'TRUCK_OWNER');
  },

  // Assignment operations
  assignDriverToTruck: async (
    truckId: string, 
    driverIdOrData: string | { driverId: string; notes?: string }, 
    maybeData?: { notes?: string }
  ): Promise<void> => {
    let payload;
    if (typeof driverIdOrData === 'string') {
      payload = { driverId: driverIdOrData, ...maybeData };
    } else {
      payload = driverIdOrData;
    }
    await api.post(`/fleet/trucks/${truckId}/assign-driver`, payload);
  },

  unassignDriverFromTruck: async (truckId: string): Promise<void> => {
    await api.post(`/fleet/trucks/${truckId}/unassign-driver`);
  },

  // Analytics operations
  fetchAnalytics: async (): Promise<any> => {
    try {
      const response = await api.get('/fleet/analytics');
      return response.data.data || response.data || {};
    } catch (error) {
      console.warn('Analytics endpoint not available, returning empty data');
      return {};
    }
  },

  // Route operations
  fetchRoutes: async (): Promise<Route[]> => {
    console.log('🌐 FleetAPI: Fetching routes from /fleet/routes');
    try {
      const response = await api.get('/fleet/routes');
      console.log('✅ FleetAPI: Raw response received:', response);
      console.log('✅ FleetAPI: Response status:', response.status);
      console.log('✅ FleetAPI: Response headers:', response.headers);
      console.log('✅ FleetAPI: Response data:', response.data);
      console.log('✅ FleetAPI: Response data type:', typeof response.data);
      console.log('✅ FleetAPI: Response data keys:', Object.keys(response.data || {}));
      
      const routes = response.data.routes || response.data.data || [];
      console.log('📋 FleetAPI: Processed routes:', routes);
      console.log('📋 FleetAPI: Routes type:', typeof routes);
      console.log('📋 FleetAPI: Routes is array:', Array.isArray(routes));
      console.log('📋 FleetAPI: Routes length:', routes.length);
      
      if (routes.length > 0) {
        console.log('📋 FleetAPI: First route sample:', routes[0]);
      }
      
      return routes;
    } catch (error: any) {
      console.error('❌ FleetAPI: Routes fetch error:', error);
      console.error('❌ FleetAPI: Error response:', error.response?.data);
      console.error('❌ FleetAPI: Error status:', error.response?.status);
      console.error('❌ FleetAPI: Error message:', error.message);
      console.warn('⚠️ FleetAPI: Routes endpoint not available, returning empty array');
      return [];
    }
  },

  createRoute: async (routeData: Partial<Route>): Promise<Route> => {
    console.log('🌐 FleetAPI: Creating route with data:', routeData);
    console.log('🌐 FleetAPI: Sending POST request to /fleet/routes');
    
    try {
      const response = await api.post<FleetApiResponse<Route>>('/fleet/routes', routeData);
      console.log('✅ FleetAPI: Route creation response:', response);
      console.log('✅ FleetAPI: Response data:', response.data);
      
      const route = response.data.route || response.data.data;
      if (!route) {
        console.error('❌ FleetAPI: No route in response data');
        throw new Error('Failed to create route - no route returned');
      }
      
      console.log('🎉 FleetAPI: Route created successfully:', route);
      return route as Route;
    } catch (error: any) {
      console.error('❌ FleetAPI: Route creation failed:', error);
      console.error('❌ FleetAPI: Error response:', error.response?.data);
      console.error('❌ FleetAPI: Error status:', error.response?.status);
      throw error;
    }
  },

  updateRoute: async (id: string, routeData: Partial<Route>): Promise<Route> => {
    const response = await api.patch<FleetApiResponse<Route>>(`/fleet/routes/${id}`, routeData);
    const route = response.data.route || response.data.data;
    if (!route) {
      throw new Error('Failed to update route');
    }
    return route as Route;
  },

  deleteRoute: async (id: string): Promise<void> => {
    await api.delete(`/fleet/routes/${id}`);
  },

  getRoutes: async (): Promise<OptimizedRoute[]> => {
    const response = await api.get('/fleet/routes');
    return response.data.routes || response.data.data || [];
  },

  saveRoute: async (route: OptimizedRoute): Promise<void> => {
    await api.post('/fleet/routes', route);
  },

  calculateRoute: async (origin: any, destination: any, stops: any[]): Promise<OptimizedRoute> => {
    const response = await api.post('/fleet/routes/calculate', { origin, destination, stops });
    return response.data.route || response.data.data;
  },

  getTruckRoutes: async (truckId: string): Promise<Route[]> => {
    console.log(`🚛 FleetAPI: Getting routes for truck ${truckId}`);
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/routes`);
      console.log(`✅ FleetAPI: Truck ${truckId} routes response:`, response.data);
      const routes = response.data.routes || response.data.data || [];
      console.log(`📋 FleetAPI: Processed truck ${truckId} routes:`, routes);
      return routes;
    } catch (error: any) {
      console.error(`❌ FleetAPI: Failed to get routes for truck ${truckId}:`, error);
      console.error(`❌ FleetAPI: Error response:`, error.response?.data);
      console.error(`❌ FleetAPI: Error status:`, error.response?.status);
      console.warn(`⚠️ FleetAPI: Truck routes endpoint not available for truck ${truckId}, returning empty array`);
      return [];
    }
  },

  assignTruckToRoute: async (
    truckId: string, 
    routeIdOrData: string | { routeId: string; startDate?: string; notes?: string },
    maybeData?: { startDate?: string; notes?: string }
  ): Promise<void> => {
    let payload;
    if (typeof routeIdOrData === 'string') {
      payload = { routeId: routeIdOrData, ...maybeData };
    } else {
      payload = routeIdOrData;
    }
    await api.post(`/fleet/trucks/${truckId}/assign-route`, payload);
  },

  assignRouteToTruck: async (truckId: string, routeId: string): Promise<void> => {
    await api.post(`/fleet/trucks/${truckId}/assign-route`, { routeId });
  },

  unassignRouteFromTruck: async (truckId: string, routeId: string): Promise<void> => {
    await api.delete(`/fleet/trucks/${truckId}/routes/${routeId}`);
  },

  // ===== COMPLIANCE =====
  addComplianceRecord: async (truckId: string, data: ComplianceRecord): Promise<ComplianceRecord> => {
    const response = await api.post<FleetApiResponse<ComplianceRecord>>(`/fleet/trucks/${truckId}/compliance`, data);
    const compliance = response.data.data || (response.data as any).compliance;
    if (!compliance) {
      throw new Error('Failed to add compliance record');
    }
    return compliance;
  },

  getComplianceHistory: async (truckId: string): Promise<ComplianceRecord[]> => {
    const response = await api.get(`/fleet/trucks/${truckId}/compliance`);
    return response.data.data || response.data.compliance || response.data || [];
  },

  // ===== MAINTENANCE =====
  createMaintenance: async (data: any): Promise<any> => {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  getMaintenanceHistory: async (truckId: string): Promise<any[]> => {
    const response = await api.get(`/maintenance/truck/${truckId}`);
    return response.data.logs;
  },

  getFleetMaintenance: async (page = 1, limit = 50, status = 'ALL'): Promise<any> => {
    const response = await api.get('/maintenance/fleet/all', {
      params: { page, limit, status }
    });
    return response.data;
  },

  updateMaintenance: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  },

  deleteMaintenance: async (id: string): Promise<void> => {
    await api.delete(`/maintenance/${id}`);
  },

  getTCOAnalysis: async (): Promise<TCOAnalysis> => {
    const response = await api.get('/fleet/analytics/tco');
    return response.data;
  }
};

export default fleetApi;