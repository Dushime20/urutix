import api from './api';

export interface FleetItem {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: string;
  currentLocation?: any;
  capacityWeight: number;
  capacityVolume: number;
  assignedDrivers: DriverAssignment[];
  assignedRoutes: RouteAssignment[];
  totalTrips: number;
  totalRevenue: number;
  fuelEfficiency?: number;
  averageRating: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  mileage: number;
  createdAt: string;
  updatedAt: string;
}

export interface DriverAssignment {
  driverId: string;
  driverName: string;
  assignmentDate: string;
  status: string;
  notes?: string;
}

export interface RouteAssignment {
  routeId: string;
  routeName: string;
  assignmentDate: string;
  status: string;
  notes?: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  status: string;
  availabilityStatus: string;
  experience: number;
  dateOfBirth?: string;
  licenseType?: string;
  licenseIssueDate?: string;
  licenseExpiry?: string;
  hireDate?: string;
  currentTruckId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedTime: number;
  status: string;
  assignedTrucks: string[];
  assignedDrivers: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FleetAnalytics {
  totalTrucks: number;
  totalDrivers: number;
  totalRoutes: number;
  availableTrucks: number;
  activeDrivers: number;
  utilizationRate: number;
  totalRevenue: number;
  averageRating: number;
  maintenanceAlerts: number;
  upcomingInspections: number;
}

export interface FuelEntry {
  id: string;
  truckId: string;
  driverId: string;
  tripId?: string; // Link to specific trip
  date: string;
  gallons: number;
  costPerGallon: number;
  totalCost: number;
  odometer: number;
  location: string;
  fuelCardId?: string;
  fuelType: 'Diesel' | 'DEF' | 'Premium' | 'Regular';
  isFullTank: boolean;
  jurisdiction: string; // State/Province for IFTA
  receiptUrl?: string;
  odometerImageUrl?: string;
  notes?: string;
  status: 'verified' | 'flagged' | 'pending';
}

// --- Routes ---
export interface RouteLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'origin' | 'destination' | 'cargostop' | 'fuelstop' | 'rest';
  eta?: string;
}

export interface OptimizedRoute {
  id: string;
  name: string;
  status: 'planned' | 'active' | 'completed';
  origin: RouteLocation;
  destination: RouteLocation;
  stops: RouteLocation[];
  totalDistance: number; // km
  totalDuration: number; // minutes
  totalCost: number;
  assignedTruckId?: string;
  assignedDriverId?: string;
  createdAt: string;
}

export interface TCOAnalysis {
  period: string;
  totalCost: number;
  costPerMile: number;
  breakdown: {
    fuel: number;
    maintenance: number;
    fixed: number; // Insurance, Licenses, etc.
    labor: number;
  };
  vehicleBreakdown: {
    truckId: string;
    plateNumber: string;
    totalCost: number;
    cpm: number; // Cost Per Mile
    topExpenseCategory: 'Fuel' | 'Maintenance' | 'Fixed';
  }[];
}

// Real API calls using the backend
export const fleetApi = {
  // ===== DASHBOARD HELPER METHODS =====

  // Get top performing drivers (mock logic using existing data)
  async getTopDrivers(limit: number = 3): Promise<any[]> {
    try {
      const drivers = await this.getDrivers();
      // Mock scoring logic: prioritize active drivers, then by experience
      const sorted = drivers
        .map(d => ({
          ...d,
          rating: 4.5 + (Math.random() * 0.5), // Mock rating 4.5-5.0
          trips: Math.floor(Math.random() * 50) + 10,
          performanceStatus: Math.random() > 0.3 ? 'On Time' : 'Efficient'
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);

      return sorted;
    } catch (error) {
      console.error('❌ Error getting top drivers:', error);
      return [];
    }
  },

  // Get maintenance alerts from truck data
  async getMaintenanceAlerts(): Promise<any[]> {
    try {
      const trucks = await this.getTrucks();
      const alerts: any[] = [];

      trucks.forEach(truck => {
        // Check for maintenance status
        if (['maintenance', 'repair', 'service'].includes(truck.status?.toLowerCase())) {
          alerts.push({
            id: `alert-${truck.id}`,
            truckId: truck.id,
            plateNumber: truck.plateNumber,
            type: 'Critical',
            message: 'Vehicle currently in maintenance',
            date: new Date().toISOString()
          });
        }

        // Check for upcoming maintenance (mock logic if date is missing)
        if (truck.nextMaintenanceDate) {
          const nextDate = new Date(truck.nextMaintenanceDate);
          const today = new Date();
          const daysDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff < 7) {
            alerts.push({
              id: `warn-${truck.id}`,
              truckId: truck.id,
              plateNumber: truck.plateNumber,
              type: 'Warning',
              message: `Scheduled service due in ${daysDiff} days`,
              date: truck.nextMaintenanceDate
            });
          }
        }
      });

      return alerts;
    } catch (error) {
      console.error('❌ Error getting maintenance alerts:', error);
      return [];
    }
  },

  // Get trucks with optional filters
  async getTrucks(filters?: { search?: string; status?: string; limit?: number; page?: number }): Promise<FleetItem[]> {
    try {
      console.log('🔑 Fetching trucks with authenticated API');
      console.log('🔑 Filters:', filters);

      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const url = `/fleet/trucks${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔑 Request URL:', url);

      const response = await api.get(url);
      console.log('✅ Trucks fetch successful - Full response:', response);
      console.log('✅ Trucks fetch - response.data:', response.data);
      console.log('✅ Trucks fetch - response.data.trucks:', response.data?.trucks);
      console.log('✅ Trucks fetch - response.data.trucks is array?', Array.isArray(response.data?.trucks));
      console.log('✅ Trucks fetch - response.data.trucks length:', response.data?.trucks?.length);

      // Backend returns { message, trucks }
      const trucks = response.data?.trucks || response.data || [];
      console.log('✅ Returning trucks:', Array.isArray(trucks) ? trucks.length : 'Not an array');
      return Array.isArray(trucks) ? trucks : [];
    } catch (error: any) {
      console.error('❌ Error fetching trucks:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      return [];
    }
  },

  // Get truck by ID
  async getTruckById(truckId: string): Promise<FleetItem | null> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}`);
      return response.data.truck || response.data || null;
    } catch (error) {
      console.error('❌ Error fetching truck by ID:', error);
      return null;
    }
  },

  // Create new truck
  async createTruck(truckData: Partial<FleetItem>): Promise<FleetItem> {
    try {
      console.log('🚛 Creating truck with data:', truckData);

      const response = await api.post('/fleet/trucks', truckData);
      console.log('✅ Truck created successfully:', response.data);
      return response.data.truck || response.data;
    } catch (error: any) {
      console.error('❌ Error creating truck:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Update existing truck
  async updateTruck(truckId: string, updateData: Partial<FleetItem>): Promise<FleetItem> {
    try {
      console.log('🔄 Updating truck:', truckId, 'with data:', updateData);
      const response = await api.patch(`/fleet/trucks/${truckId}`, updateData);
      console.log('✅ Truck updated successfully:', response.data);
      return response.data.truck || response.data;
    } catch (error: any) {
      console.error('❌ Error updating truck:', error);
      throw error;
    }
  },

  // Delete truck
  async deleteTruck(truckId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting truck:', truckId);
      await api.delete(`/fleet/trucks/${truckId}`);
      console.log('✅ Truck deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting truck:', error);
      throw error;
    }
  },

  // Bulk operations for trucks
  async bulkUpdateTruckStatus(truckIds: string[], status: string): Promise<boolean> {
    try {
      console.log('🔄 Bulk updating truck status:', truckIds, 'to:', status);
      const response = await api.patch('/fleet/trucks/bulk/status', {
        truckIds,
        status
      });
      console.log('✅ Bulk truck status update successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Error bulk updating truck status:', error);
      throw error;
    }
  },

  async bulkDeleteTrucks(truckIds: string[]): Promise<boolean> {
    try {
      console.log('🗑️ Bulk deleting trucks:', truckIds);
      await api.delete('/fleet/trucks/bulk', {
        data: { truckIds }
      });
      console.log('✅ Bulk truck deletion successful');
      return true;
    } catch (error: any) {
      console.error('❌ Error bulk deleting trucks:', error);
      throw error;
    }
  },

  // ===== DRIVER MANAGEMENT APIs =====

  // Get drivers with optional filters
  async getDrivers(filters?: { search?: string; status?: string; availabilityStatus?: string; limit?: number; page?: number }): Promise<Driver[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.availabilityStatus) params.append('availabilityStatus', filters.availabilityStatus);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.page) params.append('page', filters.page.toString());

      const response = await api.get(`/fleet/drivers?${params.toString()}`);
      console.log('✅ Drivers fetch successful:', response.data);
      return response.data.drivers || [];
    } catch (error) {
      console.error('❌ Error fetching drivers:', error);
      return [];
    }
  },

  // Get driver by ID
  async getDriverById(driverId: string): Promise<Driver | null> {
    try {
      const response = await api.get(`/fleet/drivers/${driverId}`);
      return response.data.driver || null;
    } catch (error) {
      console.error('❌ Error fetching driver by ID:', error);
      return null;
    }
  },

  // Create new driver
  async createDriver(driverData: Partial<Driver>): Promise<Driver> {
    try {
      console.log('👤 Creating driver with data:', driverData);
      const response = await api.post('/fleet/drivers', driverData);
      console.log('✅ Driver created successfully:', response.data);
      return response.data.driver || response.data;
    } catch (error: any) {
      console.error('❌ Error creating driver:', error);
      throw error;
    }
  },

  // Update existing driver
  async updateDriver(driverId: string, updateData: Partial<Driver>): Promise<Driver> {
    try {
      console.log('🔄 Updating driver:', driverId, 'with data:', updateData);
      const response = await api.patch(`/fleet/drivers/${driverId}`, updateData);
      console.log('✅ Driver updated successfully:', response.data);
      return response.data.driver || response.data;
    } catch (error: any) {
      console.error('❌ Error updating driver:', error);
      throw error;
    }
  },

  // Delete driver
  async deleteDriver(driverId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting driver:', driverId);
      await api.delete(`/fleet/drivers/${driverId}`);
      console.log('✅ Driver deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting driver:', error);
      throw error;
    }
  },

  // Bulk operations for drivers
  async bulkUpdateDriverStatus(driverIds: string[], status: string): Promise<boolean> {
    try {
      console.log('🔄 Bulk updating driver status:', driverIds, 'to:', status);
      const response = await api.patch('/fleet/drivers/bulk/status', {
        driverIds,
        status
      });
      console.log('✅ Bulk driver status update successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Error bulk updating driver status:', error);
      throw error;
    }
  },

  async bulkDeleteDrivers(driverIds: string[]): Promise<boolean> {
    try {
      console.log('🗑️ Bulk deleting drivers:', driverIds);
      await api.delete('/fleet/drivers/bulk', {
        data: { driverIds }
      });
      console.log('✅ Bulk driver deletion successful');
      return true;
      return true;
    } catch (error: any) {
      console.error('❌ Error bulk deleting drivers:', error);
      throw error;
    }
  },



  // Driver Compliance/Documents (Mocked implementation for now)
  async getDriverDocuments(driverId: string): Promise<any[]> {
    try {
      console.log('📄 Fetching documents for driver:', driverId);
      // In a real app, this would be: await api.get(`/fleet/drivers/${driverId}/documents`);
      // For now, return mock data or reuse compliance structure
      return [
        {
          id: 'doc-1',
          regulation: 'Driver License',
          requirement: 'DL-12345678',
          status: 'COMPLIANT',
          dueDate: '2025-12-31',
          lastChecked: '2023-01-01',
          notes: 'Class A Commercial License'
        },
        {
          id: 'doc-2',
          regulation: 'Medical Certificate',
          requirement: 'Med-554433',
          status: 'COMPLIANT',
          dueDate: '2024-06-30',
          lastChecked: '2023-06-01',
          notes: 'Annual physical'
        }
      ];
    } catch (error) {
      console.error('❌ Error fetching driver documents:', error);
      return [];
    }
  },

  async addDriverDocument(driverId: string, docData: any): Promise<any> {
    try {
      console.log('➕ Adding document for driver:', driverId, docData);
      // In a real app: await api.post(`/fleet/drivers/${driverId}/documents`, docData);
      return { id: `new-${Date.now()}`, ...docData };
    } catch (error) {
      console.error('❌ Error adding driver document:', error);
      throw error;
    }
  },

  // ===== ROUTE MANAGEMENT APIs =====

  // Get all routes
  async fetchRoutes(): Promise<Route[]> {
    console.log('🛣️ FleetApi.fetchRoutes Debug:');
    console.log('🛣️ Method called at:', new Date().toISOString());
    console.log('🛣️ This object:', this);
    console.log('🛣️ API instance:', api);
    console.log('🔗 Making request to /fleet/routes');
    console.log('🔗 Full URL will be: http://localhost:3000/api/fleet/routes');
    console.log('🔗 About to make API call...');

    try {
      const response = await api.get('/fleet/routes');
      console.log('✅ Routes response received!');
      console.log('✅ Routes response:', response.data);
      console.log('✅ Routes response type:', typeof response.data);
      console.log('✅ Routes response keys:', Object.keys(response.data));
      console.log('✅ Routes count:', response.data.routes?.length || 0);
      console.log('✅ Direct routes array:', Array.isArray(response.data) ? response.data.length : 'Not an array');

      // Check if response.data is directly an array of routes
      if (Array.isArray(response.data)) {
        console.log('✅ Response is direct array of routes');
        return response.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          origin: r.origin,
          destination: r.destination,
          distance: r.distance ?? 0,
          estimatedTime: r.estimatedTime ?? r.estimatedDuration ?? r.estimatedHours ?? 0,
          status: r.status ?? 'active',
          assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
          assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
          isActive: r.isActive ?? true,
          createdAt: r.createdAt ?? new Date().toISOString(),
          updatedAt: r.updatedAt ?? new Date().toISOString(),
        } as Route));
      }

      // Check if response.data has a routes property
      if (response.data.routes && Array.isArray(response.data.routes)) {
        console.log('✅ Response has routes property with array');
        return response.data.routes.map((r: any) => ({
          id: r.id,
          name: r.name,
          origin: r.origin,
          destination: r.destination,
          distance: r.distance ?? 0,
          estimatedTime: r.estimatedTime ?? r.estimatedDuration ?? r.estimatedHours ?? 0,
          status: r.status ?? 'active',
          assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
          assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
          isActive: r.isActive ?? true,
          createdAt: r.createdAt ?? new Date().toISOString(),
          updatedAt: r.updatedAt ?? new Date().toISOString(),
        } as Route));
      }

      // Check if response.data has a data property (nested response)
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log('✅ Response has data property with array');
        return response.data.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          origin: r.origin,
          destination: r.destination,
          distance: r.distance ?? 0,
          estimatedTime: r.estimatedTime ?? r.estimatedDuration ?? r.estimatedHours ?? 0,
          status: r.status ?? 'active',
          assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
          assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
          isActive: r.isActive ?? true,
          createdAt: r.createdAt ?? new Date().toISOString(),
          updatedAt: r.updatedAt ?? new Date().toISOString(),
        } as Route));
      }

      console.log('⚠️ No valid routes array found in response');
      console.log('⚠️ Response structure:', JSON.stringify(response.data, null, 2));
      console.log('⚠️ Returning empty array');
      return [];
    } catch (error: any) {
      console.error('❌ Error fetching routes:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.response?.data?.message);
      console.error('❌ Error config:', error.config);
      return [];
    }
  },

  // Get route by ID
  async getRouteById(routeId: string): Promise<Route | null> {
    try {
      const response = await api.get(`/fleet/routes/${routeId}`);
      return response.data.route || null;
    } catch (error) {
      console.error('❌ Error fetching route by ID:', error);
      return null;
    }
  },

  // Create new route
  async createRoute(routeData: Partial<Route>): Promise<Route> {
    try {
      console.log('🛣️ Creating route with data:', routeData);
      const response = await api.post('/fleet/routes', routeData);
      console.log('✅ Route created successfully:', response.data);
      return response.data.route || response.data;
    } catch (error: any) {
      console.error('❌ Error creating route:', error);
      throw error;
    }
  },

  // Update existing route
  async updateRoute(routeId: string, updateData: Partial<Route>): Promise<Route> {
    try {
      console.log('🔄 Updating route:', routeId, 'with data:', updateData);
      const response = await api.patch(`/fleet/routes/${routeId}`, updateData);
      console.log('✅ Route updated successfully:', response.data);
      return response.data.route || response.data;
    } catch (error: any) {
      console.error('❌ Error updating route:', error);
      throw error;
    }
  },

  // Delete route
  async deleteRoute(routeId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting route:', routeId);
      await api.delete(`/fleet/routes/${routeId}`);
      console.log('✅ Route deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting route:', error);
      throw error;
    }
  },

  // ===== ASSIGNMENT MANAGEMENT APIs =====

  // Assign driver to truck (align with backend controller route)
  async assignDriverToTruck(truckId: string, driverId: string, assignmentData?: { notes?: string }): Promise<boolean> {
    try {
      console.log('👤 Assigning driver:', driverId, 'to truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/assign-driver`, {
        driverId,
        ...assignmentData,
      });
      console.log('✅ Driver assignment successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Error assigning driver to truck:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error message:', error.message);

      // Re-throw with enhanced error info
      const enhancedError = new Error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to assign driver to truck'
      );
      (enhancedError as any).response = error.response;
      (enhancedError as any).request = error.request;
      throw enhancedError;
    }
  },

  // Unassign driver from truck (align with backend controller route)
  async unassignDriverFromTruck(truckId: string, driverId: string): Promise<boolean> {
    try {
      console.log('🚫 Unassigning driver:', driverId, 'from truck:', truckId);
      await api.delete(`/fleet/trucks/${truckId}/assign-driver/${driverId}`);
      console.log('✅ Driver unassignment successful');
      return true;
    } catch (error: any) {
      console.error('❌ Error unassigning driver from truck:', error);
      throw error;
    }
  },

  // Assign route to truck using new fleet endpoint
  async assignRouteToTruck(truckId: string, routeId: string, assignmentData?: { notes?: string }): Promise<boolean> {
    try {
      console.log('🛣️ Assigning route:', routeId, 'to truck:', truckId);

      const response = await api.post(`/fleet/routes/${routeId}/assign-truck/${truckId}`, assignmentData || {});

      console.log('✅ Route assignment successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Error assigning route to truck:', error);
      throw error;
    }
  },

  // Unassign route from truck using new fleet endpoint
  async unassignRouteFromTruck(truckId: string, routeId: string): Promise<boolean> {
    try {
      console.log('🚫 Unassigning route:', routeId, 'from truck:', truckId);

      const response = await api.delete(`/fleet/routes/${routeId}/unassign-truck/${truckId}`);

      console.log('✅ Route unassignment successful:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Error unassigning route from truck:', error);
      throw error;
    }
  },

  // Get all routes assigned to a truck
  async getTruckRoutes(truckId: string): Promise<Route[]> {
    try {
      console.log('📋 Fetching routes for truck:', truckId);

      const response = await api.get(`/fleet/trucks/${truckId}/routes`);

      console.log('✅ Truck routes fetch successful:', response.data);
      const raw = response.data.routes || [];
      // Normalize to Route shape expected by UI
      return raw.map((r: any) => ({
        id: r.id,
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        distance: r.distance ?? r.distanceKm ?? 0,
        estimatedTime: r.estimatedTime ?? r.estimatedDuration ?? 0,
        status: r.status ?? 'active',
        assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
        assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
        description: r.description,
        isActive: r.isActive ?? true,
        createdAt: r.createdAt ?? new Date().toISOString(),
        updatedAt: r.updatedAt ?? new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error('❌ Error fetching truck routes:', error);
      throw error;
    }
  },

  // Get all truck assignments for a route
  async getRouteAssignments(routeId: string): Promise<any[]> {
    try {
      console.log('� Fetching assignments for route:', routeId);

      const response = await api.get(`/fleet/routes/${routeId}/assignments`);

      console.log('✅ Route assignments fetch successful:', response.data);
      return response.data.assignments || [];
    } catch (error: any) {
      console.error('❌ Error fetching route assignments:', error);
      throw error;
    }
  },

  // Bulk assign routes to trucks
  async bulkAssignRoutes(assignments: { routeId: string; truckId: string }[]): Promise<any> {
    try {
      console.log('📦 Bulk assigning routes:', assignments);

      const response = await api.post('/fleet/routes/bulk-assign', { assignments });

      console.log('✅ Bulk route assignment successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error bulk assigning routes:', error);
      throw error;
    }
  },

  // ===== TRIP MANAGEMENT & POD APIs =====

  // Complete a trip with POD data
  async completeTrip(tripId: string, podData: any): Promise<boolean> {
    try {
      console.log('🏁 Completing trip:', tripId, 'with POD:', podData);
      // In a real app: await api.post(`/fleet/trips/${tripId}/complete`, podData);
      // For now, we simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error: any) {
      console.error('❌ Error completing trip:', error);
      throw error;
    }
  },

  // Upload POD File (Image/PDF)
  async uploadPOD(tripId: string, file: File): Promise<string> {
    try {
      console.log(' Uploading POD file for trip:', tripId);
      const formData = new FormData();
      formData.append('file', file);

      // In real app: const res = await api.post(`/fleet/trips/${tripId}/pod/upload`, formData);
      // return res.data.url;

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      return URL.createObjectURL(file); // Return local preview URL
    } catch (error: any) {
      console.error('❌ Error uploading POD:', error);
      throw error;
    }
  },

  // ===== FUEL MANAGEMENT APIs =====

  // Get fuel logs with filters
  async getFuelLogs(filters?: { truckId?: string; startDate?: string; endDate?: string }): Promise<FuelEntry[]> {
    try {
      console.log('⛽ Fetching fuel logs with filters:', filters);
      // In real app: await api.get('/fleet/fuel', { params: filters });

      // Mock Data
      return [
        {
          id: 'fuel-1',
          truckId: 'truck-123',
          driverId: 'driver-456',
          tripId: 'trip-789',
          date: new Date(Date.now() - 86400000).toISOString(),
          gallons: 50,
          costPerGallon: 4.20,
          totalCost: 210.00,
          odometer: 15000,
          location: 'Shell #402, TX',
          jurisdiction: 'TX',
          fuelType: 'Diesel',
          isFullTank: true,
          status: 'verified'
        },
        {
          id: 'fuel-2',
          truckId: 'truck-123',
          driverId: 'driver-456',
          date: new Date(Date.now() - 172800000).toISOString(),
          gallons: 120,
          costPerGallon: 4.15,
          totalCost: 498.00,
          odometer: 15600, // 600 miles / 120 gallons = 5 MPG (Normal)
          location: 'Love\'s Travel Stop, OK',
          jurisdiction: 'OK',
          fuelType: 'Diesel',
          isFullTank: true,
          status: 'verified'
        },
        {
          id: 'fuel-3',
          truckId: 'truck-789',
          driverId: 'driver-789',
          date: new Date(Date.now() - 200000000).toISOString(),
          gallons: 200,
          costPerGallon: 4.50,
          totalCost: 900.00,
          odometer: 20010, // Suspiciously low mileage for high fuel? Fraud detection mock test.
          location: 'Unknown Station',
          jurisdiction: 'Unknown',
          fuelType: 'Diesel',
          isFullTank: false,
          notes: 'High volume relative to mileage delta.',
          status: 'flagged' // Mock flagged status
        }
      ];
    } catch (error) {
      console.error('❌ Error fetching fuel logs:', error);
      return [];
    }
  },

  // Add new fuel entry with Fraud Detection
  async addFuelLog(entry: Omit<FuelEntry, 'id' | 'status'>): Promise<FuelEntry> {
    try {
      console.log('⛽ Adding fuel log:', entry);

      // --- MOCK FRAUD DETECTION LOGIC ---
      // Simple rule: If MPG is < 3 or > 12, flag it.
      // In real app, this would be backend logic checking previous odometer.
      let status: FuelEntry['status'] = 'verified';

      // We don't have previous odometer easily here without fetching, so we'll just mock random
      // "smart" checks or rely on user input if we had 'lastOdometer'.
      // For demo, let's flag if cost > $1000 or gallons > 250 as "Suspicious"
      if (entry.totalCost > 1000 || entry.gallons > 250) {
        status = 'flagged';
        console.warn('⚠️ FRAUD ALERT: Abnormal fuel transaction detected.');
      }

      const newEntry: FuelEntry = {
        ...entry,
        id: `fuel-${Date.now()}`,
        status
      };

      // In real app: await api.post('/fleet/fuel', newEntry);

      await new Promise(resolve => setTimeout(resolve, 800)); // Sim network
      return newEntry;
    } catch (error) {
      console.error('❌ Error adding fuel log:', error);
      throw error;
    }
  },

  // Get aggregated fuel stats
  async getFuelStats(): Promise<any> {
    try {
      // Mock aggregated stats
      return {
        totalCost: 12450.00, // Monthly
        avgCostPerGallon: 4.18,
        totalGallons: 2980,
        avgMpg: 6.2,
        theftRisk: 'Low',
        flaggedTransactions: 2
      };
    } catch (error) {
      console.error('❌ Error getting fuel stats:', error);
      return {};
    }
  },

  // --- Route Planning ---

  async getRoutes(): Promise<OptimizedRoute[]> {
    try {
      // Mock data
      return [
        {
          id: 'route-101',
          name: 'Nairobi - Mombasa Express',
          status: 'planned',
          origin: { id: 'loc-1', name: 'Nairobi ICD', lat: -1.2921, lng: 36.8219, type: 'origin' },
          destination: { id: 'loc-2', name: 'Mombasa Port', lat: -4.0435, lng: 39.6682, type: 'destination' },
          stops: [
            { id: 'loc-3', name: 'Sultan Hamud', lat: -2.0226, lng: 37.3756, type: 'rest', eta: '2024-03-20T10:00:00Z' }
          ],
          totalDistance: 485,
          totalDuration: 540, // 9 hours
          totalCost: 45000,
          createdAt: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching routes:', error);
      return [];
    }
  },

  async calculateRoute(stops: RouteLocation[]): Promise<OptimizedRoute> {
    // Mock optimization logic
    const totalDistance = stops.length * 150 + Math.random() * 50;
    const totalDuration = totalDistance * 1.5;

    return {
      id: `temp-${Date.now()}`,
      name: `New Route ${new Date().toLocaleDateString()}`,
      status: 'planned',
      origin: stops[0],
      destination: stops[stops.length - 1],
      stops: stops.slice(1, -1),
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration),
      totalCost: Math.round(totalDistance * 120), // Approx cost calc
      createdAt: new Date().toISOString()
    };
  },

  async saveRoute(route: OptimizedRoute): Promise<OptimizedRoute> {
    console.log('Saving route:', route);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { ...route, id: `route-${Date.now()}` };
  },

  // --- TCO Analysis ---

  async getTCOAnalysis(period: string = 'monthly'): Promise<TCOAnalysis> {
    try {
      // Mock TCO Data
      return {
        period,
        totalCost: 124500,
        costPerMile: 1.85,
        breakdown: {
          fuel: 48000,
          maintenance: 22000,
          fixed: 15000,
          labor: 39500
        },
        vehicleBreakdown: [
          { truckId: 't-1', plateNumber: 'KCD 123A', totalCost: 12500, cpm: 1.75, topExpenseCategory: 'Fuel' },
          { truckId: 't-2', plateNumber: 'KDA 892J', totalCost: 18200, cpm: 2.10, topExpenseCategory: 'Maintenance' },
          { truckId: 't-3', plateNumber: 'KCA 450L', totalCost: 9800, cpm: 1.65, topExpenseCategory: 'Fuel' },
          { truckId: 't-4', plateNumber: 'KDB 771M', totalCost: 11000, cpm: 1.80, topExpenseCategory: 'Fixed' },
          { truckId: 't-5', plateNumber: 'KCC 333X', totalCost: 14500, cpm: 1.95, topExpenseCategory: 'Fuel' },
        ]
      };
    } catch (error) {
      console.error('Error fetching TCO analysis:', error);
      throw error;
    }
  },

  // ===== ANALYTICS & PERFORMANCE APIs =====

  // Get fleet analytics
  async fetchAnalytics(): Promise<FleetAnalytics> {
    try {
      const response = await api.get('/fleet/analytics');
      return response.data.analytics || {
        totalTrucks: 0,
        totalDrivers: 0,
        totalRoutes: 0,
        availableTrucks: 0,
        activeDrivers: 0,
        utilizationRate: 0,
        totalRevenue: 0,
        averageRating: 0,
        maintenanceAlerts: 0,
        upcomingInspections: 0,
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        totalTrucks: 0,
        totalDrivers: 0,
        totalRoutes: 0,
        availableTrucks: 0,
        activeDrivers: 0,
        utilizationRate: 0,
        totalRevenue: 0,
        averageRating: 0,
        maintenanceAlerts: 0,
        upcomingInspections: 0,
      };
    }
  },

  // Get truck performance metrics
  async getTruckPerformance(truckId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/performance`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching truck performance:', error);
      return {
        utilization: 0,
        completedTrips: 0,
        averageTime: 0,
        revenue: 0,
        costs: 0,
        profit: 0
      };
    }
  },

  // Get driver performance metrics
  async getDriverPerformance(driverId: string, period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<any> {
    try {
      const response = await api.get(`/fleet/drivers/${driverId}/performance`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching driver performance:', error);
      return {
        completedTrips: 0,
        averageRating: 0,
        totalDistance: 0,
        totalHours: 0,
        safetyScore: 0
      };
    }
  },

  // ===== MAINTENANCE & INSPECTION APIs =====

  // Schedule maintenance
  async scheduleMaintenance(truckId: string, maintenanceData: {
    type: string;
    title: string;
    description: string;
    date: string;
    cost: number;
    nextDueDate?: string;
    status?: string;
    priority?: string;
    assignedTechnician?: string;
    location?: string;
    mileage?: number;
    laborHours?: number;
    notes?: string;
  }): Promise<any> {
    try {
      console.log('🔧 Scheduling maintenance for truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/maintenance`, maintenanceData);
      console.log('✅ Maintenance scheduled successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error scheduling maintenance:', error);
      throw error;
    }
  },

  // ===== SMART MATCHING BOOKINGS (MOCK) =====
  async getBookingRequests(): Promise<any[]> {
    console.log('🔮 Fetching smart matching booking requests...');
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock Data: Inbound bookings from "Smart Matching"
    return [
      {
        id: 'bk_123456',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        matchScore: 0.98,
        price: 3200,
        load: {
          id: 'ld_88291',
          title: 'Electronics Shipment - High Priority',
          origin: { city: 'Kigali', country: 'Rwanda' },
          destination: { city: 'Nairobi', country: 'Kenya' },
          pickupDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
          weight: 4500, // kg
          cargoType: 'ELECTRONICS'
        },
        cargoOwner: {
          name: 'TechImports Ltd.',
          rating: 4.9,
          verified: true
        },
        requestedTruckId: 'tr_9912', // Specifically matched to this truck
        requestedTruckPlate: 'RAB 123 A'
      },
      {
        id: 'bk_778291',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        matchScore: 0.92,
        price: 1850,
        load: {
          id: 'ld_11029',
          title: 'Fresh Produce (Avocados)',
          origin: { city: 'Musanze', country: 'Rwanda' },
          destination: { city: 'Kampala', country: 'Uganda' },
          pickupDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
          weight: 8000,
          cargoType: 'PERISHABLE'
        },
        cargoOwner: {
          name: 'FreshFarm Co-op',
          rating: 4.7,
          verified: true
        },
        requestedTruckId: 'tr_5521',
        requestedTruckPlate: 'RAC 555 B'
      },
      {
        id: 'bk_992102',
        status: 'ACCEPTED', // History item
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        matchScore: 0.95,
        price: 2100,
        load: {
          id: 'ld_55102',
          title: 'Construction Materials',
          origin: { city: 'Huye', country: 'Rwanda' },
          destination: { city: 'Bujumbura', country: 'Burundi' },
          pickupDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          weight: 12000,
          cargoType: 'CONSTRUCTION'
        },
        cargoOwner: {
          name: 'BuildRight Construction',
          rating: 4.5,
          verified: true
        },
        requestedTruckId: 'tr_9912',
        requestedTruckPlate: 'RAB 123 A'
      }
    ];
  },

  // Get maintenance history
  async getMaintenanceHistory(truckId: string): Promise<any[]> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/maintenance`);
      return response.data.maintenance || [];
    } catch (error) {
      console.error('❌ Error fetching maintenance history:', error);
      return [];
    }
  },

  // Update maintenance record
  async updateMaintenance(
    truckId: string,
    maintenanceId: string,
    maintenanceData: {
      type: string;
      title: string;
      description: string;
      date: string;
      cost: number;
      nextDueDate?: string;
      status?: string;
      priority?: string;
      assignedTechnician?: string;
      location?: string;
      mileage?: number;
      laborHours?: number;
      notes?: string;
    },
  ): Promise<any> {
    try {
      console.log('🔧 Updating maintenance record:', maintenanceId);
      const response = await api.put(
        `/fleet/trucks/${truckId}/maintenance/${maintenanceId}`,
        maintenanceData,
      );
      console.log('✅ Maintenance updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating maintenance:', error);
      throw error;
    }
  },

  // Delete maintenance record
  async deleteMaintenance(truckId: string, maintenanceId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting maintenance record:', maintenanceId);
      await api.delete(`/fleet/trucks/${truckId}/maintenance/${maintenanceId}`);
      console.log('✅ Maintenance record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting maintenance record:', error);
      throw error;
    }
  },

  // Schedule inspection
  async scheduleInspection(truckId: string, inspectionData: {
    type: string;
    title: string;
    inspector: string;
    inspectionDate: string;
    nextInspectionDate: string;
    status: string;
    score?: number;
    cost?: number;
    location?: string;
    mileage?: number;
    notes?: string;
    isRequired?: boolean;
  }): Promise<any> {
    try {
      console.log('🔍 Scheduling inspection for truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/inspections`, inspectionData);
      console.log('✅ Inspection scheduled successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error scheduling inspection:', error);
      throw error;
    }
  },

  // Get inspection history
  async getInspectionHistory(truckId: string): Promise<any[]> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/inspections`);
      return response.data.inspections || [];
    } catch (error) {
      console.error('❌ Error fetching inspection history:', error);
      return [];
    }
  },

  // Update inspection record
  async updateInspection(
    truckId: string,
    inspectionId: string,
    inspectionData: {
      type: string;
      title: string;
      inspector: string;
      inspectionDate: string;
      nextInspectionDate: string;
      status: string;
      score?: number;
      cost?: number;
      location?: string;
      mileage?: number;
      notes?: string;
      isRequired?: boolean;
    },
  ): Promise<any> {
    try {
      console.log('🔍 Updating inspection record:', inspectionId);
      const response = await api.put(
        `/fleet/trucks/${truckId}/inspections/${inspectionId}`,
        inspectionData,
      );
      console.log('✅ Inspection updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating inspection:', error);
      throw error;
    }
  },

  // Delete inspection record
  async deleteInspection(truckId: string, inspectionId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting inspection record:', inspectionId);
      await api.delete(`/fleet/trucks/${truckId}/inspections/${inspectionId}`);
      console.log('✅ Inspection record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting inspection record:', error);
      throw error;
    }
  },

  // Schedule insurance
  async scheduleInsurance(truckId: string, insuranceData: {
    policyNumber: string;
    insuranceCompany: string;
    policyType: string;
    coverageAmount: number;
    startDate: string;
    endDate: string;
    status: string;
    deductible?: number;
    premium?: number;
    agent?: string;
    agentContact?: string;
    autoRenewal?: boolean;
    notes?: string;
    documentUrl?: string;
    documents?: string[];
  }): Promise<any> {
    try {
      console.log('🛡️ Scheduling insurance for truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/insurance`, insuranceData);
      console.log('✅ Insurance scheduled successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error scheduling insurance:', error);
      throw error;
    }
  },

  // Get insurance history
  async getInsuranceHistory(truckId: string): Promise<any[]> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/insurance`);
      return response.data.insurance || [];
    } catch (error) {
      console.error('❌ Error fetching insurance history:', error);
      return [];
    }
  },

  // Update insurance record
  async updateInsurance(
    truckId: string,
    insuranceId: string,
    insuranceData: {
      policyNumber: string;
      insuranceCompany: string;
      policyType: string;
      coverageAmount: number;
      startDate: string;
      endDate: string;
      status: string;
      deductible?: number;
      premium?: number;
      agent?: string;
      agentContact?: string;
      autoRenewal?: boolean;
      notes?: string;
      documentUrl?: string;
      documents?: string[];
    },
  ): Promise<any> {
    try {
      console.log('🛡️ Updating insurance record:', insuranceId);
      const response = await api.put(
        `/fleet/trucks/${truckId}/insurance/${insuranceId}`,
        insuranceData,
      );
      console.log('✅ Insurance updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating insurance:', error);
      throw error;
    }
  },

  // Delete insurance record
  async deleteInsurance(truckId: string, insuranceId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting insurance record:', insuranceId);
      await api.delete(`/fleet/trucks/${truckId}/insurance/${insuranceId}`);
      console.log('✅ Insurance record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting insurance record:', error);
      throw error;
    }
  },

  // Add fuel record
  async addFuelRecord(truckId: string, fuelData: {
    date: string;
    fuelType: string;
    quantity: number;
    cost: number;
    mileage: number;
    location: string;
    fuelEfficiency?: number;
    driver?: string;
    receipt?: string;
    notes?: string;
  }): Promise<any> {
    try {
      console.log('⛽ Adding fuel record for truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/fuel`, fuelData);
      console.log('✅ Fuel record added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding fuel record:', error);
      throw error;
    }
  },

  // Get fuel history
  async getFuelHistory(truckId: string): Promise<any[]> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/fuel`);
      return response.data.fuel || [];
    } catch (error) {
      console.error('❌ Error fetching fuel history:', error);
      return [];
    }
  },

  // Update fuel record
  async updateFuelRecord(
    truckId: string,
    fuelId: string,
    fuelData: {
      date: string;
      fuelType: string;
      quantity: number;
      cost: number;
      mileage: number;
      location: string;
      fuelEfficiency?: number;
      driver?: string;
      receipt?: string;
      notes?: string;
    },
  ): Promise<any> {
    try {
      console.log('⛽ Updating fuel record:', fuelId);
      const response = await api.put(
        `/fleet/trucks/${truckId}/fuel/${fuelId}`,
        fuelData,
      );
      console.log('✅ Fuel record updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating fuel record:', error);
      throw error;
    }
  },

  // Delete fuel record
  async deleteFuelRecord(truckId: string, fuelId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting fuel record:', fuelId);
      await api.delete(`/fleet/trucks/${truckId}/fuel/${fuelId}`);
      console.log('✅ Fuel record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting fuel record:', error);
      throw error;
    }
  },

  // Add tire record
  async addTireRecord(truckId: string, tireData: {
    position: string;
    brand: string;
    model: string;
    size: string;
    serialNumber?: string;
    installationDate: string;
    expectedLifespan: number;
    currentMileage: number;
    treadDepth: number;
    pressure: number;
    status: string;
    replacementDate?: string;
    cost?: number;
    notes?: string;
  }): Promise<any> {
    try {
      console.log('🛞 Adding tire record for truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/tires`, tireData);
      console.log('✅ Tire record added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding tire record:', error);
      throw error;
    }
  },

  // Get tire history
  async getTireHistory(truckId: string): Promise<any[]> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/tires`);
      return response.data.tires || [];
    } catch (error) {
      console.error('❌ Error fetching tire history:', error);
      return [];
    }
  },

  // Update tire record
  async updateTireRecord(
    truckId: string,
    tireId: string,
    tireData: {
      position: string;
      brand: string;
      model: string;
      size: string;
      serialNumber?: string;
      installationDate: string;
      expectedLifespan: number;
      currentMileage: number;
      treadDepth: number;
      pressure: number;
      status: string;
      replacementDate?: string;
      cost?: number;
      notes?: string;
    },
  ): Promise<any> {
    try {
      console.log('🛞 Updating tire record:', tireId);
      const response = await api.put(
        `/fleet/trucks/${truckId}/tires/${tireId}`,
        tireData,
      );
      console.log('✅ Tire record updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating tire record:', error);
      throw error;
    }
  },

  // Delete tire record
  async deleteTireRecord(truckId: string, tireId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting tire record:', tireId);
      await api.delete(`/fleet/trucks/${truckId}/tires/${tireId}`);
      console.log('✅ Tire record deleted successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting tire record:', error);
      throw error;
    }
  },

  // Add compliance record
  async addComplianceRecord(truckId: string, complianceData: {
    regulation: string;
    requirement: string;
    dueDate: string;
    status: string;
    lastChecked: string;
    nextCheck: string;
    responsibleParty: string;
    documentation?: string[];
    notes?: string;
  }): Promise<any> {
    try {
      console.log('📋 Adding compliance record for truck:', truckId);
      const response = await api.post(`/fleet/trucks/${truckId}/compliance`, complianceData);
      console.log('✅ Compliance record added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding compliance record:', error);
      throw error;
    }
  },

  // Get compliance history
  async getComplianceHistory(truckId: string): Promise<any[]> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}/compliance`);
      return response.data.compliance || [];
    } catch (error) {
      console.error('❌ Error fetching compliance history:', error);
      return [];
    }
  },

  // Update compliance record
  async updateComplianceRecord(
    truckId: string,
    complianceId: string,
    complianceData: {
      regulation: string;
      requirement: string;
      dueDate: string;
      status: string;
      lastChecked: string;
      nextCheck: string;
      responsibleParty: string;
      documentation?: string[];
      notes?: string;
    },
  ): Promise<any> {
    try {
      console.log('📋 Updating compliance record:', complianceId);
      const response = await api.put(
        `/fleet/trucks/${truckId}/compliance/${complianceId}`,
        complianceData,
      );
      console.log('✅ Compliance record updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating compliance record:', error);
      throw error;
    }
  },

  // ===== SEARCH & FILTERING APIs =====

  // Advanced search across fleet
  async searchFleet(query: string, filters?: {
    type?: 'trucks' | 'drivers' | 'routes' | 'all';
    status?: string;
    location?: string;
    dateRange?: { start: string; end: string };
  }): Promise<{
    trucks: FleetItem[];
    drivers: Driver[];
    routes: Route[];
  }> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.location) params.append('location', filters.location);
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start);
        params.append('endDate', filters.dateRange.end);
      }

      const response = await api.get(`/fleet/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error searching fleet:', error);
      return { trucks: [], drivers: [], routes: [] };
    }
  },

  // Export fleet data
  async exportFleetData(format: 'csv' | 'excel' | 'pdf', filters?: any): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }

      const response = await api.get(`/fleet/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error exporting fleet data:', error);
      throw error;
    }
  },

  // Export fleet (alias for exportFleetData with default CSV format)
  async exportFleet(): Promise<Blob> {
    return this.exportFleetData('csv');
  },

  // ===== REAL-TIME SUBSCRIPTION APIs =====

  // Subscribe to fleet updates (WebSocket or Server-Sent Events)
  async subscribeFleetUpdates(callback: (update: Partial<FleetItem>) => void): Promise<() => void> {
    try {
      console.log('🔌 Setting up fleet updates subscription');

      // For now, we'll use a polling approach since WebSocket isn't implemented yet
      // In a real implementation, this would connect to a WebSocket or use Server-Sent Events
      const intervalId = setInterval(async () => {
        try {
          // Poll for updates every 30 seconds
          const response = await api.get('/fleet/updates');
          if (response.data.updates && response.data.updates.length > 0) {
            response.data.updates.forEach((update: Partial<FleetItem>) => {
              callback(update);
            });
          }
        } catch (error) {
          console.warn('❌ Error polling for fleet updates:', error);
        }
      }, 30000); // 30 seconds

      // Return unsubscribe function
      return () => {
        console.log('🔌 Unsubscribing from fleet updates');
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error('❌ Error setting up fleet subscription:', error);
      // Return a no-op unsubscribe function
      return () => { };
    }
  },

  // Subscribe to specific truck updates
  async subscribeTruckUpdates(truckId: string, callback: (update: Partial<FleetItem>) => void): Promise<() => void> {
    try {
      console.log('🔌 Setting up truck updates subscription for:', truckId);

      const intervalId = setInterval(async () => {
        try {
          const response = await api.get(`/fleet/trucks/${truckId}/updates`);
          if (response.data.update) {
            callback(response.data.update);
          }
        } catch (error) {
          console.warn('❌ Error polling for truck updates:', error);
        }
      }, 30000);

      return () => {
        console.log('🔌 Unsubscribing from truck updates for:', truckId);
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error('❌ Error setting up truck subscription:', error);
      return () => { };
    }
  },

  // Subscribe to driver updates
  async subscribeDriverUpdates(driverId: string, callback: (update: Partial<Driver>) => void): Promise<() => void> {
    try {
      console.log('🔌 Setting up driver updates subscription for:', driverId);

      const intervalId = setInterval(async () => {
        try {
          const response = await api.get(`/fleet/drivers/${driverId}/updates`);
          if (response.data.update) {
            callback(response.data.update);
          }
        } catch (error) {
          console.warn('❌ Error polling for driver updates:', error);
        }
      }, 30000);

      return () => {
        console.log('🔌 Unsubscribing from driver updates for:', driverId);
        clearInterval(intervalId);
      };
    } catch (error) {
      console.error('❌ Error setting up driver subscription:', error);
      return () => { };
    }
  },

  // ===== SAFETY INCIDENTS APIs =====

  // Get all safety incidents
  async getSafetyIncidents(filters?: { status?: string; severity?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.severity) params.append('severity', filters.severity);

      const response = await api.get(`/safety/incidents?${params.toString()}`);
      return response.data.incidents || response.data || [];
    } catch (error) {
      console.error('❌ Error fetching safety incidents:', error);
      return [];
    }
  },

  // Create a new safety incident
  async createSafetyIncident(incidentData: any): Promise<any> {
    try {
      const response = await api.post('/safety/incidents', incidentData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating safety incident:', error);
      throw new Error(error.response?.data?.message || 'Failed to create safety incident');
    }
  },

  // Update a safety incident
  async updateSafetyIncident(incidentId: string, incidentData: any): Promise<any> {
    try {
      const response = await api.put(`/safety/incidents/${incidentId}`, incidentData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating safety incident:', error);
      throw new Error(error.response?.data?.message || 'Failed to update safety incident');
    }
  },

  // Delete a safety incident
  async deleteSafetyIncident(incidentId: string): Promise<boolean> {
    try {
      await api.delete(`/safety/incidents/${incidentId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting safety incident:', error);
      throw error;
    }
  },

  // ===== SAFETY INSPECTIONS APIs =====

  // Get all safety inspections
  async getSafetyInspections(filters?: { status?: string; truckId?: string; inspectorId?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.truckId) params.append('truckId', filters.truckId);
      if (filters?.inspectorId) params.append('inspectorId', filters.inspectorId);

      const response = await api.get(`/safety/inspections?${params.toString()}`);
      return response.data.inspections || response.data || [];
    } catch (error) {
      console.error('❌ Error fetching safety inspections:', error);
      return [];
    }
  },

  // Create a new safety inspection
  async createSafetyInspection(inspectionData: any): Promise<any> {
    try {
      const response = await api.post('/safety/inspections', inspectionData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating safety inspection:', error);
      throw new Error(error.response?.data?.message || 'Failed to create safety inspection');
    }
  },

  // Update a safety inspection
  async updateSafetyInspection(inspectionId: string, inspectionData: any): Promise<any> {
    try {
      const response = await api.put(`/safety/inspections/${inspectionId}`, inspectionData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating safety inspection:', error);
      throw new Error(error.response?.data?.message || 'Failed to update safety inspection');
    }
  },

  // Delete a safety inspection
  async deleteSafetyInspection(inspectionId: string): Promise<boolean> {
    try {
      await api.delete(`/safety/inspections/${inspectionId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting safety inspection:', error);
      throw error;
    }
  },

  // ===== SAFETY TRAININGS APIs =====

  // Get all safety trainings
  async getSafetyTrainings(filters?: { status?: string; driverId?: string; type?: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.driverId) params.append('driverId', filters.driverId);
      if (filters?.type) params.append('type', filters.type);

      const response = await api.get(`/safety/trainings?${params.toString()}`);
      return response.data.trainings || response.data || [];
    } catch (error) {
      console.error('❌ Error fetching safety trainings:', error);
      return [];
    }
  },

  // Create a new safety training
  async createSafetyTraining(trainingData: any): Promise<any> {
    try {
      const response = await api.post('/safety/trainings', trainingData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creating safety training:', error);
      throw new Error(error.response?.data?.message || 'Failed to create safety training');
    }
  },

  // Update a safety training
  async updateSafetyTraining(trainingId: string, trainingData: any): Promise<any> {
    try {
      const response = await api.put(`/safety/trainings/${trainingId}`, trainingData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating safety training:', error);
      throw new Error(error.response?.data?.message || 'Failed to update safety training');
    }
  },

  // Delete a safety training
  async deleteSafetyTraining(trainingId: string): Promise<boolean> {
    try {
      await api.delete(`/safety/trainings/${trainingId}`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting safety training:', error);
      throw error;
    }
  },

  // ===== TRUCK LOCATION APIs =====

  // Update truck current location
  async updateTruckLocation(truckId: string, locationData: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<FleetItem> {
    try {
      console.log('📍 Updating truck location:', truckId, locationData);
      const response = await api.patch(`/fleet/trucks/${truckId}/location`, locationData);
      console.log('✅ Truck location updated successfully:', response.data);
      return response.data.truck || response.data;
    } catch (error: any) {
      console.error('❌ Error updating truck location:', error);
      throw error;
    }
  },
}; 