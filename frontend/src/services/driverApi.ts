import api from './api';

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
  async getDriverProfile(driverId: string): Promise<Driver> {
    const response = await api.get(`/drivers/${driverId}`);
    return response.data;
  }

  async updateDriverProfile(driverId: string, updateDto: UpdateDriverDto): Promise<Driver> {
    const response = await api.put(`/drivers/${driverId}`, updateDto);
    return response.data;
  }

  async deleteDriver(driverId: string): Promise<void> {
    await api.delete(`/drivers/${driverId}`);
  }

  // Driver List and Search
  async getDrivers(filter: DriverFilterDto = {}): Promise<Driver[]> {
    const response = await api.get('/drivers', { params: filter });
    return response.data;
  }

  async createDriver(createDto: CreateDriverDto): Promise<Driver> {
    const response = await api.post('/drivers', createDto);
    return response.data;
  }

  // Trip Management
  async getCurrentTrip(driverId: string): Promise<Trip | null> {
    try {
      const response = await api.get(`/drivers/${driverId}/current-trip`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // No current trip
      }
      throw error;
    }
  }

  async getUpcomingTrips(driverId: string): Promise<Trip[]> {
    const response = await api.get(`/drivers/${driverId}/upcoming-trips`);
    return response.data;
  }

  async getTripHistory(driverId: string, period: string): Promise<Trip[]> {
    const response = await api.get(`/drivers/${driverId}/trip-history`, {
      params: { period }
    });
    return response.data;
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
    const response = await api.get(`/drivers/${driverId}/stats`);
    return response.data;
  }

  async getEarnings(driverId: string, period: string): Promise<EarningsData[]> {
    const response = await api.get(`/drivers/${driverId}/earnings`, {
      params: { period }
    });
    return response.data;
  }

  // Safety and Compliance
  async getSafetyMetrics(driverId: string, period: string): Promise<SafetyData> {
    const response = await api.get(`/drivers/${driverId}/safety`, {
      params: { period }
    });
    return response.data;
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
    const response = await api.get(`/drivers/${driverId}/notifications`);
    return response.data;
  }

  async markNotificationAsRead(driverId: string, notificationId: string): Promise<void> {
    await api.put(`/drivers/${driverId}/notifications/${notificationId}/read`);
  }

  async deleteNotification(driverId: string, notificationId: string): Promise<void> {
    await api.delete(`/drivers/${driverId}/notifications/${notificationId}`);
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
}

export const driverApi = new DriverApiService();
