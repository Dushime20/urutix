import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Bid {
  id: string;
  loadId: string;
  truckOwnerId: string;
  bidAmount: number;
  bidCurrency: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  proposedPickupDate?: Date;
  proposedDeliveryDate?: Date;
  bidNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  truckOwner?: {
    id: string;
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      companyName?: string;
    };
  };
  load?: {
    id: string;
    title: string;
    pickupLocation: any;
    deliveryLocation: any;
    weight: number;
    cargoType: string;
  };
}

export interface BidFilters {
  status?: string;
  loadId?: string;
  page?: number;
  limit?: number;
}

export const bidApi = {
  /**
   * Get all bids for a load
   */
  async getBidsForLoad(loadId: string): Promise<{ success: boolean; data: Bid[] }> {
    const response = await apiClient.get(`/bidding/loads/${loadId}/bids`);
    return { success: true, data: response.data };
  },

  /**
   * Get all bids in tenant (for TENANT_ADMIN)
   */
  async getTenantBids(filters?: BidFilters): Promise<{ success: boolean; data: Bid[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.loadId) params.append('loadId', filters.loadId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/bidding/bids?${params.toString()}`);
    return { 
      success: true, 
      data: Array.isArray(response.data) ? response.data : [],
      total: Array.isArray(response.data) ? response.data.length : 0
    };
  },

  /**
   * Get bid history
   */
  async getBidHistory(): Promise<{ success: boolean; data: Bid[] }> {
    const response = await apiClient.get('/bidding/history');
    return { success: true, data: response.data };
  },

  /**
   * Accept a bid
   */
  async acceptBid(bidId: string): Promise<{ success: boolean; data: Bid; message: string }> {
    const response = await apiClient.post(`/bidding/bids/${bidId}/accept`);
    return { 
      success: true, 
      data: response.data,
      message: 'Bid accepted successfully'
    };
  },

  /**
   * Reject a bid
   */
  async rejectBid(bidId: string, reason?: string): Promise<{ success: boolean; data: Bid; message: string }> {
    const response = await apiClient.post(`/bidding/bids/${bidId}/reject`, { reason });
    return { 
      success: true, 
      data: response.data,
      message: 'Bid rejected successfully'
    };
  },

  /**
   * Get bid details
   */
  async getBidDetails(bidId: string): Promise<{ success: boolean; data: Bid }> {
    // Note: This endpoint might need to be added to backend
    const response = await apiClient.get(`/bidding/bids/${bidId}`);
    return { success: true, data: response.data };
  },

  /**
   * Get dashboard stats
   */
  async getDashboardStats(): Promise<any> {
    const response = await apiClient.get('/bidding/dashboard/stats');
    return response.data;
  },
};

export default bidApi;
