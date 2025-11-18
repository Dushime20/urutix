import api from './api';

export interface FleetItem {
  id: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: string;
  currentLocation?: string;
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

// Real API calls using the backend
export const fleetApi = {
  // Get trucks with optional filters
  async getTrucks(filters?: { search?: string; status?: string }): Promise<FleetItem[]> {
    try {
      console.log('🔑 Fetching trucks with authenticated API');

      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);

      const response = await api.get(`/fleet/trucks?${params.toString()}`);
      console.log('✅ Trucks fetch successful:', response.data);
      return response.data.trucks || [];
    } catch (error) {
      console.error('❌ Error fetching trucks:', error);
      return [];
    }
  },

  // Get truck by ID
  async getTruckById(truckId: string): Promise<FleetItem | null> {
    try {
      const response = await api.get(`/fleet/trucks/${truckId}`);
      return response.data.truck || null;
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
  async getDrivers(filters?: { search?: string; status?: string; availabilityStatus?: string }): Promise<Driver[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.availabilityStatus) params.append('availabilityStatus', filters.availabilityStatus);

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
    } catch (error: any) {
      console.error('❌ Error bulk deleting drivers:', error);
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
          estimatedDuration: r.estimatedDuration ?? r.estimatedTime ?? r.estimatedHours ?? 0,
          status: r.status ?? 'active',
          assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
          assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
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
          estimatedDuration: r.estimatedDuration ?? r.estimatedTime ?? r.estimatedHours ?? 0,
          status: r.status ?? 'active',
          assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
          assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
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
          estimatedDuration: r.estimatedDuration ?? r.estimatedTime ?? r.estimatedHours ?? 0,
          status: r.status ?? 'active',
          assignedDrivers: Array.isArray(r.assignedDrivers) ? r.assignedDrivers : [],
          assignedTrucks: Array.isArray(r.assignedTrucks) ? r.assignedTrucks : [],
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
    description: string;
    scheduledDate: string;
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high';
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
      return () => {};
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
      return () => {};
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
      return () => {};
    }
  }
}; 