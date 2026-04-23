import api from './api';
import { tripsAPI } from './api';

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  status: string;
  availabilityStatus: string;
  currentLocation?: string;
  rating: number;
  safetyScore: number;
  totalTrips: number;
  totalDistance: number;
  totalEarnings: number;
  hoursWorkedThisWeek: number;
  hoursWorkedThisMonth: number;
  consecutiveDrivingHours: number;
  onTimeDeliveryRate: number;
  currentTruckId?: string;
  currentTripId?: string;
}

export interface DriverStats {
  totalTrips: number;
  totalDistance: number;
  totalEarnings: number;
  safetyScore: number;
  onTimeDeliveryRate: number;
  hoursWorkedThisWeek: number;
  hoursWorkedThisMonth: number;
  rating: number;
  consecutiveDrivingHours: number;
  // Additional stats for dashboard
  milesThisWeek?: number;
  fuelEfficiency?: number;
  completedTrips?: number;
  cancelledTrips?: number;
  averageRating?: number;
  totalFuelUsed?: number;
  averageSpeed?: number;
  violationsCount?: number;
  lastTripDate?: string | null;
  nextTripDate?: string | null;
}

export interface Trip {
  id: string;
  tripNumber: string;
  status: string;
  origin: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    city: string;
    state: string;
    coordinates: [number, number];
  };
  scheduledDeparture: string;
  estimatedArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  distance: number;
  estimatedDuration: number;
  currentLocation?: [number, number];
  progress: number;
  cargo: {
    description: string;
    weight: number;
    type: string;
    specialInstructions?: string;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  truck: {
    id: string;
    plateNumber: string;
    model: string;
  };
  earnings: number;
  notes?: string;
  pod?: {
    recipientName: string;
    signatureBase64: string;
    completedAt: string;
    completedBy: string;
    photoUrl?: string;
  };
}

// Normalize a raw backend trip to the frontend Trip interface
function normalizeTrip(raw: any): Trip {
  const load = raw.load || {};

  // Location data lives in load.locations array
  const locations: any[] = load.locations || [];
  const pickupLoc = locations.find((l: any) => l.type === 'PICKUP')?.locationData || {};
  const deliveryLoc = locations.find((l: any) => l.type === 'DELIVERY')?.locationData || {};

  // Fallback to direct trip relations if present
  const pickup = Object.keys(pickupLoc).length ? pickupLoc : (raw.pickupLocation || {});
  const delivery = Object.keys(deliveryLoc).length ? deliveryLoc : (raw.deliveryLocation || {});

  return {
    id: raw.id,
    tripNumber: raw.tripNumber,
    status: raw.status,
    origin: {
      address: pickup.address || pickup.name || 'N/A',
      city: pickup.city || '',
      state: pickup.state || pickup.country || '',
      coordinates: pickup.coordinates
        ? [pickup.coordinates.latitude ?? pickup.coordinates[0], pickup.coordinates.longitude ?? pickup.coordinates[1]]
        : [0, 0],
    },
    destination: {
      address: delivery.address || delivery.name || 'N/A',
      city: delivery.city || '',
      state: delivery.state || delivery.country || '',
      coordinates: delivery.coordinates
        ? [delivery.coordinates.latitude ?? delivery.coordinates[0], delivery.coordinates.longitude ?? delivery.coordinates[1]]
        : [0, 0],
    },
    scheduledDeparture: raw.plannedStartTime || raw.scheduledDeparture || '',
    estimatedDeparture: raw.plannedStartTime || raw.estimatedDeparture || '',
    estimatedArrival: raw.estimatedArrival || raw.plannedEndTime || '',
    actualDeparture: raw.actualStartTime,
    actualArrival: raw.actualEndTime,
    distance: Number(raw.totalDistance || raw.distance || 0),
    estimatedDuration: Number(raw.duration || raw.estimatedDuration || 0),
    progress: Number(raw.progress || 0),
    currentLocation: raw.currentLocation,
    cargo: {
      description: load.title || load.description || 'N/A',
      weight: Number(load.weight || 0),
      type: load.cargoType || 'General',
      specialInstructions: load.specialHandlingInstructions || undefined,
    },
    customer: {
      name: load.cargoOwner?.profile
        ? `${load.cargoOwner.profile.firstName} ${load.cargoOwner.profile.lastName}`
        : (load.customerName || 'N/A'),
      phone: load.cargoOwner?.phone || '',
      email: load.cargoOwner?.email || '',
    },
    truck: raw.truck
      ? { id: raw.truck.id, plateNumber: raw.truck.plateNumber, model: `${raw.truck.make || ''} ${raw.truck.model || ''}`.trim() }
      : { id: raw.truckId, plateNumber: '', model: '' },
    earnings: Number(raw.agreedPrice || 0),
    notes: raw.notes,
    pod: load.metadata?.pod,
  };
}

export interface EarningsData {
  period: string;
  trips: number;
  distance: number;
  hours: number;
  earnings: number;
  bonuses: number;
  deductions: number;
  netEarnings: number;
}

export interface SafetyData {
  overallScore: number;
  drivingScore: number;
  complianceScore: number;
  vehicleScore: number;
  lastUpdated: string;
  trends: {
    period: string;
    score: number;
    change: number;
  }[];
  violations: {
    id: string;
    type: string;
    description: string;
    date: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'PENDING' | 'RESOLVED' | 'APPEALED';
    points: number;
  }[];
  certifications: {
    id: string;
    name: string;
    issueDate: string;
    expiryDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
  }[];
  inspections: {
    id: string;
    type: string;
    date: string;
    result: 'PASS' | 'FAIL' | 'CONDITIONAL';
    notes?: string;
  }[];
}

export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'URGENT';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'TRIP' | 'SAFETY' | 'PAYMENT' | 'SYSTEM' | 'MAINTENANCE';
  actionRequired?: boolean;
  actionUrl?: string;
}

export interface DriverFilterDto {
  search?: string;
  status?: string;
  availabilityStatus?: string;
  employmentType?: string;
  minRating?: number;
  maxRating?: number;
  minSafetyScore?: number;
  maxSafetyScore?: number;
  page?: number;
  limit?: number;
}

export interface CreateDriverDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  licenseNumber: string;
  licenseClasses: any[];
  licenseIssueDate: string;
  licenseExpiry: string;
  licenseState: string;
  licenseCountry: string;
  endorsements: any[];
  restrictions: any[];
  employmentType: string;
  hireDate: string;
  medicalCertExpiry?: string;
  drugTestDate?: string;
  backgroundCheckDate?: string;
  trainingCompletionDate?: string;
  hourlyRate?: number;
  mileageRate?: number;
  preferences: Record<string, any>;
}

export interface UpdateDriverDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  availabilityStatus?: string;
  hourlyRate?: number;
  mileageRate?: number;
  preferences?: Record<string, any>;
}

export interface TelematicsEventDto {
  eventType: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  speed?: number;
  heading?: number;
  engineRpm?: number;
  fuelLevel?: number;
  temperature?: number;
  additionalData?: Record<string, any>;
}

export interface EmergencyReportDto {
  type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresImmediate: boolean;
  additionalDetails?: string;
}

class DriverApiService {
  // Driver Profile Management
  async getCurrentDriver(): Promise<Driver> {
    const response = await api.get('/drivers/me');
    return response.data.driver;
  }

  async getDriverProfile(driverId: string): Promise<Driver> {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data.driver;
  }

  async updateDriverProfile(driverId: string, updateDto: UpdateDriverDto): Promise<Driver> {
    const response = await api.put(`/drivers/${driverId}`, updateDto);
    return response.data.driver;
  }

  async deleteDriver(driverId: string): Promise<void> {
    await api.delete(`/drivers/${driverId}`);
  }

  // Driver List and Search
  async getDrivers(filter: DriverFilterDto = {}): Promise<Driver[]> {
    const response = await api.get('/drivers', { params: filter });
    return response.data.drivers;
  }

  async createDriver(createDto: CreateDriverDto): Promise<Driver> {
    const response = await api.post('/drivers', createDto);
    return response.data.driver;
  }

  // Trip Management
  async getCurrentTrip(driverId: string): Promise<Trip | null> {
    try {
      const response = await api.get('/trips/my-trips');
      const raw = response.data?.data?.current;
      return raw ? normalizeTrip(raw) : null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      console.error('Error fetching current trip:', error);
      return null;
    }
  }

  async getUpcomingTrips(driverId: string): Promise<Trip[]> {
    try {
      const response = await api.get('/trips/my-trips');
      const raw: any[] = response.data?.data?.upcoming || [];
      return raw.map(normalizeTrip);
    } catch (error: any) {
      if (error.response?.status === 404) return [];
      console.error('Error fetching upcoming trips:', error);
      return [];
    }
  }

  async getTripHistory(driverId: string, _period: string): Promise<Trip[]> {
    try {
      const response = await api.get('/trips', {
        params: {
          userId: driverId,
          limit: 20,
        }
      });
      const raw: any[] = response.data?.data || [];
      return raw.map(normalizeTrip);
    } catch (error: any) {
      if (error.response?.status === 404) return [];
      console.error('Error fetching trip history:', error);
      return [];
    }
  }

  async startTrip(tripId: string): Promise<void> {
    await api.post(`/trips/${tripId}/start`);
  }

  async pauseTrip(tripId: string): Promise<void> {
    await api.post(`/trips/${tripId}/pause`);
  }

  async resumeTrip(tripId: string): Promise<void> {
    await api.post(`/trips/${tripId}/resume`);
  }

  async completeTrip(tripId: string): Promise<void> {
    await api.post(`/trips/${tripId}/complete`);
  }

  async updateTripProgress(tripId: string, progress: number, location?: [number, number]): Promise<void> {
    await api.put(`/trips/${tripId}/progress`, { progress, location });
  }

  // Earnings and Performance
  async getDriverStats(driverId: string): Promise<DriverStats> {
    try {
      const response = await api.get(`/drivers/${driverId}/stats`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          totalTrips: 0, totalEarnings: 0, rating: 0,
          onTimeDeliveryRate: 0, safetyScore: 0,
          hoursWorkedThisWeek: 0, hoursWorkedThisMonth: 0,
          consecutiveDrivingHours: 0, milesThisWeek: 0,
          fuelEfficiency: 0, completedTrips: 0, cancelledTrips: 0,
          averageRating: 0, totalDistance: 0, totalFuelUsed: 0,
          averageSpeed: 0, violationsCount: 0, lastTripDate: null, nextTripDate: null,
        };
      }
      throw error;
    }
  }

  async getDriverAnalytics(driverId: string, period: string = '7d'): Promise<{
    earnings: {
      labels: string[];
      earnings: number[];
      trips: number[];
      totalEarnings: number;
      totalTrips: number;
      avgPerTrip: number;
      performanceGrade: string;
    };
    performance: {
      onTimeDelivery: number;
      safetyScore: number;
      customerRating: number;
      fuelEfficiency: number;
      loadUtilization: number;
      responseTime: number;
    };
    hos: {
      hoursWorkedThisWeek: number;
      maxHoursPerShift: number;
      consecutiveDrivingHours: number;
      fatiguePercent: number;
      status: string;
      breakInHours: number | null;
    };
  } | null> {
    try {
      const response = await api.get(`/drivers/${driverId}/analytics`, { params: { period } });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  async getEarnings(driverId: string, period: string): Promise<EarningsData[]> {
    try {
      const response = await api.get(`/drivers/${driverId}/earnings`, {
        params: { period }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  // Safety and Compliance
  async getSafetyMetrics(driverId: string, period: string): Promise<SafetyData | null> {
    try {
      const response = await api.get(`/drivers/${driverId}/safety`, {
        params: { period }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Handle null in component
      }
      throw error;
    }
  }

  async reportViolation(driverId: string, violation: {
    type: string;
    description: string;
    date: string;
    location?: [number, number];
  }): Promise<void> {
    await api.post(`/drivers/${driverId}/violations`, violation);
  }

  async updateCertification(driverId: string, certificationId: string, update: {
    expiryDate?: string;
    status?: string;
  }): Promise<void> {
    await api.put(`/drivers/${driverId}/certifications/${certificationId}`, update);
  }

  // Telematics and Location
  async updateLocation(driverId: string, location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  }): Promise<void> {
    await api.post(`/drivers/${driverId}/location`, location);
  }

  async sendTelematicsEvent(driverId: string, event: TelematicsEventDto): Promise<void> {
    await api.post(`/drivers/${driverId}/telematics`, event);
  }

  async getLocationHistory(driverId: string, startDate: string, endDate: string): Promise<{
    timestamp: string;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  }[]> {
    const response = await api.get(`/drivers/${driverId}/location-history`, {
      params: { startDate, endDate }
    });
    return response.data;
  }

  // Emergency and Safety
  async reportEmergency(driverId: string, report: EmergencyReportDto): Promise<void> {
    await api.post(`/drivers/${driverId}/emergency`, report);
  }

  async getEmergencyContacts(driverId: string): Promise<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }[]> {
    const response = await api.get(`/drivers/${driverId}/emergency-contacts`);
    return response.data;
  }

  async updateEmergencyContacts(driverId: string, contacts: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  }[]): Promise<void> {
    await api.put(`/drivers/${driverId}/emergency-contacts`, { contacts });
  }

  // Notifications
  async getNotifications(driverId: string): Promise<Notification[]> {
    try {
      // Use the general notifications endpoint with recipientId filter
      const response = await api.get('/notifications', {
        params: {
          recipientId: driverId,
          limit: 100,
        },
      });
      const data = response?.data?.notifications || response?.data?.data || response?.data;
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      // Silently handle 404 - endpoint may not be implemented yet
      if (error.response?.status === 404) {
        return [];
      }
      // Only log non-404 errors
      if (error.response?.status !== 404) {
        console.error('Error fetching notifications:', error);
      }
      return [];
    }
  }

  async markNotificationAsRead(_driverId: string, notificationId: string): Promise<void> {
    try {
      await api.put(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      // Silently handle 404
      if (error.response?.status !== 404) {
        console.error('Error marking notification as read:', error);
      }
    }
  }

  async deleteNotification(_driverId: string, notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error: any) {
      // Silently handle 404
      if (error.response?.status !== 404) {
        console.error('Error deleting notification:', error);
      }
    }
  }

  async updateNotificationPreferences(driverId: string, preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    categories: {
      TRIP: boolean;
      SAFETY: boolean;
      PAYMENT: boolean;
      SYSTEM: boolean;
      MAINTENANCE: boolean;
    };
  }): Promise<void> {
    await api.put(`/drivers/${driverId}/notification-preferences`, preferences);
  }

  // Status and Availability
  async updateAvailabilityStatus(driverId: string, status: string): Promise<void> {
    await api.put(`/drivers/${driverId}/availability`, { status });
  }

  async updateDriverStatus(driverId: string, status: string): Promise<void> {
    await api.put(`/drivers/${driverId}/status`, { status });
  }

  async startBreak(driverId: string): Promise<void> {
    await api.post(`/drivers/${driverId}/break/start`);
  }

  async endBreak(driverId: string): Promise<void> {
    await api.post(`/drivers/${driverId}/break/end`);
  }

  async getBreaks(driverId: string, filters?: { startDate?: string; endDate?: string; limit?: number }): Promise<{ breaks: any[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await api.get(`/drivers/${driverId}/breaks?${params.toString()}`);
    return response.data;
  }

  async deleteBreak(driverId: string, breakId: string): Promise<void> {
    await api.delete(`/drivers/${driverId}/breaks/${breakId}`);
  }

  // Documents and Files
  async uploadDocument(driverId: string, file: File, type: string, description?: string): Promise<{
    id: string;
    filename: string;
    type: string;
    description?: string;
    uploadDate: string;
    url: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post(`/drivers/${driverId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getDocuments(driverId: string): Promise<{
    id: string;
    filename: string;
    type: string;
    description?: string;
    uploadDate: string;
    url: string;
  }[]> {
    const response = await api.get(`/drivers/${driverId}/documents`);
    return response.data;
  }

  async deleteDocument(driverId: string, documentId: string): Promise<void> {
    await api.delete(`/drivers/${driverId}/documents/${documentId}`);
  }

  // Preferences and Settings
  async getPreferences(driverId: string): Promise<Record<string, any>> {
    const response = await api.get(`/drivers/${driverId}/preferences`);
    return response.data;
  }

  async updatePreferences(driverId: string, preferences: Record<string, any>): Promise<void> {
    await api.put(`/drivers/${driverId}/preferences`, preferences);
  }

  async notifyCargoLoaded(driverId: string, cargoId: string): Promise<void> {
    await api.post(`/drivers/${driverId}/notify-loaded`, { cargoId });
  }

  async getAnnouncements(driverId: string): Promise<{
    id: string;
    title: string;
    content: string;
    category: 'URGENT' | 'MAINTENANCE' | 'GENERAL' | 'SAFETY';
    timestamp: string;
    read: boolean;
  }[]> {
    try {
      const response = await api.get(`/drivers/${driverId}/announcements`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  // Communication
  async sendMessage(driverId: string, message: {
    recipientId: string;
    subject: string;
    content: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }): Promise<{
    id: string;
    timestamp: string;
    status: string;
  }> {
    const response = await api.post(`/drivers/${driverId}/messages`, message);
    return response.data;
  }

  async getMessages(driverId: string): Promise<{
    id: string;
    senderId: string;
    senderName: string;
    subject: string;
    content: string;
    timestamp: string;
    read: boolean;
    priority: string;
  }[]> {
    const response = await api.get(`/drivers/${driverId}/messages`);
    return response.data;
  }

  async markMessageAsRead(driverId: string, messageId: string): Promise<void> {
    await api.put(`/drivers/${driverId}/messages/${messageId}/read`);
  }

  // Analytics and Reporting
  async getPerformanceReport(driverId: string, startDate: string, endDate: string): Promise<{
    trips: number;
    distance: number;
    earnings: number;
    safetyScore: number;
    onTimeDeliveryRate: number;
    fuelEfficiency: number;
    customerRating: number;
    violations: number;
  }> {
    const response = await api.get(`/drivers/${driverId}/performance-report`, {
      params: { startDate, endDate }
    });
    return response.data;
  }

  async exportReport(driverId: string, reportType: string, startDate: string, endDate: string): Promise<Blob> {
    const response = await api.get(`/drivers/${driverId}/export/${reportType}`, {
      params: { startDate, endDate },
      responseType: 'blob'
    });
    return response.data;
  }

  async reportIncident(driverId: string, data: any): Promise<void> {
    await api.post(`/drivers/${driverId}/report-incident`, data);
  }

  async getAssignedLoads(driverId: string): Promise<any[]> {
    const response = await api.get(`/drivers/${driverId}/assigned-loads`);
    return response.data;
  }

  async getLoadById(loadId: string): Promise<any> {
    const response = await api.get(`/loads-v2/${loadId}`);
    return response.data;
  }

  async acceptAndLoad(driverId: string, loadId: string): Promise<void> {
    await api.post(`/drivers/${driverId}/accept-and-load`, { loadId });
  }

  async proceedWithJourney(driverId: string, loadIds: string[]): Promise<void> {
    await api.post(`/drivers/${driverId}/proceed-journey`, { loadIds });
  }

  async completeDelivery(driverId: string, loadId: string, podData: any): Promise<void> {
    if (podData.photoFile) {
      const formData = new FormData();
      formData.append('loadId', loadId);
      formData.append('recipientName', podData.recipientName);
      formData.append('signatureBase64', podData.signatureBase64);
      if (podData.notes) formData.append('notes', podData.notes);
      formData.append('photo', podData.photoFile);

      await api.post(`/drivers/${driverId}/complete-delivery`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      await api.post(`/drivers/${driverId}/complete-delivery`, { loadId, ...podData });
    }
  }

  async getLeaderboard(period: 'MONTHLY' | 'WEEKLY' | 'YEARLY' = 'MONTHLY'): Promise<Array<{
    driverId: string;
    name: string;
    rank: number;
    safetyScore: number;
    milesCovered: number;
    completionRate: number;
    fuelEfficiency: number;
    avatar?: string;
    trend: 'up' | 'down' | 'stable';
  }>> {
    try {
      const response = await api.get('/drivers/leaderboard', { params: { period } });
      return response.data.leaderboard;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Return mock leaderboard for demonstration/fallback
        return [
          { driverId: '1', name: 'Alex Thompson', rank: 1, safetyScore: 98, milesCovered: 12500, completionRate: 100, fuelEfficiency: 8.2, trend: 'up' },
          { driverId: '2', name: 'Sarah Miller', rank: 2, safetyScore: 96, milesCovered: 11800, completionRate: 98, fuelEfficiency: 7.9, trend: 'up' },
          { driverId: '3', name: 'Michael Chen', rank: 3, safetyScore: 95, milesCovered: 13200, completionRate: 95, fuelEfficiency: 8.5, trend: 'down' },
          { driverId: '4', name: 'James Wilson', rank: 4, safetyScore: 92, milesCovered: 10500, completionRate: 99, fuelEfficiency: 7.6, trend: 'stable' },
          { driverId: '5', name: 'David Brown', rank: 5, safetyScore: 90, milesCovered: 9800, completionRate: 92, fuelEfficiency: 7.4, trend: 'down' },
        ];
      }
      throw error;
    }
  }

  // Maintenance and Repairs
  async getMaintenanceHistory(truckId: string, page: number = 1, limit: number = 20): Promise<any> {
    const response = await api.get(`/maintenance/truck/${truckId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async reportTruckFault(data: {
    truckId: string;
    taskName: string;
    description: string;
    type: string;
    odometerReading?: number;
  }): Promise<void> {
    await api.post('/maintenance', data);
  }

  async getMaintenanceLog(id: string): Promise<any> {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  }
}

export const driverApi = new DriverApiService();
