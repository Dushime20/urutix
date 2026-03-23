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
  tenantId: string;
  experienceYears?: number;
  experience?: number; // Years of driving experience
  rating?: number;
  totalTrips?: number;
  totalDistance?: number;
  safetyScore?: number;
  onTimeDeliveryRate?: number;
  hoursWorkedThisWeek?: number;
  hoursWorkedThisMonth?: number;
  medicalCertExpiry?: string;
  drugTestDate?: string;
  backgroundCheckDate?: string;
  trainingCompletionDate?: string;
  hourlyRate?: number;
  mileageRate?: number;
  driverNotes?: string; // Additional notes about the driver
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
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

export interface UpdateTruckDto {
  plateNumber?: string;
  status?: string;
  truckType?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  capacityWeight?: number;
  capacityVolume?: number;
  fuelType?: string;
  currentAddress?: string;
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
  routeIds?: string[]; // Array of route IDs to assign to the driver
  experience?: number; // Years of experience
  medicalCertExpiry?: string;
  drugTestDate?: string;
  backgroundCheckDate?: string;
  trainingCompletionDate?: string;
  hourlyRate?: number;
  mileageRate?: number;
  driverNotes?: string; // Additional notes
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

export interface FleetApiResponse<T> {
  message: string;
  trucks?: T;
  truck?: T;
  drivers?: T;
  driver?: T;
  data?: T;
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

  createDriver: async (data: CreateDriverDto): Promise<Driver> => {
    const response = await api.post<FleetApiResponse<Driver>>('/fleet/drivers', data);
    const driver = response.data.driver || response.data.data || response.data.drivers;
    if (!driver) {
      throw new Error('Failed to create driver');
    }
    return driver as Driver;
  },

  updateDriver: async (id: string, data: Partial<CreateDriverDto>): Promise<Driver> => {
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

  // Truck owner operations
  getTruckOwners: async (): Promise<TruckOwner[]> => {
    const response = await api.get<{ users: TruckOwner[] }>('/admin/users');
    const allUsers = response.data.users || [];
    // Filter for truck owners only
    return allUsers.filter(user => user.role === 'TRUCK_OWNER');
  },

  // Assignment operations
  assignDriverToTruck: async (truckId: string, driverId: string): Promise<void> => {
    await api.post(`/fleet/trucks/${truckId}/assign-driver`, { driverId });
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

  assignRouteToTruck: async (truckId: string, routeId: string): Promise<void> => {
    await api.post(`/fleet/trucks/${truckId}/assign-route`, { routeId });
  },

  unassignRouteFromTruck: async (truckId: string, routeId: string): Promise<void> => {
    await api.delete(`/fleet/trucks/${truckId}/routes/${routeId}`);
  },
};

export default fleetApi;