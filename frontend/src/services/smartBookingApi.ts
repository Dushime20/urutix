import api from './api';

export interface BookingRequest {
  id: string;
  loadId: string;
  truckId: string;
  cargoOwnerName: string;
  cargoType: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  matchScore: number;
  origin: string;
  destination: string;
  offeredPrice: number;
  requestedFor: string;
  createdAt: string;
  updatedAt: string;
}

export const smartBookingApi = {
  /**
   * Get all booking requests for the current truck owner
   */
  getBookingRequests: async (): Promise<BookingRequest[]> => {
    const response = await api.get('/matching/booking-requests');
    return response.data || [];
  },

  /**
   * Get a single booking request by ID
   */
  getBookingRequest: async (requestId: string): Promise<BookingRequest> => {
    const response = await api.get(`/matching/booking-requests/${requestId}`);
    return response.data;
  },

  /**
   * Accept a booking request
   */
  acceptBookingRequest: async (requestId: string, truckId: string): Promise<void> => {
    await api.post(`/matching/booking-requests/${requestId}/accept`, { truckId });
  },

  /**
   * Reject a booking request
   */
  rejectBookingRequest: async (requestId: string, reason?: string): Promise<void> => {
    await api.post(`/matching/booking-requests/${requestId}/reject`, { reason });
  },

  /**
   * Get booking requests by status
   */
  getBookingRequestsByStatus: async (status: 'PENDING' | 'ACCEPTED' | 'REJECTED'): Promise<BookingRequest[]> => {
    const response = await api.get('/matching/booking-requests', { params: { status } });
    return response.data || [];
  },
};

export default smartBookingApi;
