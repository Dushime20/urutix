import api from './api';

export interface BidData {
  loadId: string;
  bidAmount: number;
  bidCurrency: string;
  proposedPickupDate?: string;
  proposedDeliveryDate?: string;
  bidNotes?: string;
  advancePaymentPercentage?: number; // Percentage of transportation fee to be paid before trip starts (0-100)
  requireAdvancePayment?: boolean; // Whether advance payment is required before trip starts
  bidDetails?: {
    truckSpecifications?: {
      truckId?: string;
      capacityWeight?: number;
      capacityVolume?: number;
      truckType?: string;
      hasRefrigeration?: boolean;
      hasHazmatPermit?: boolean;
    };
    driverInfo?: {
      driverId?: string;
      experience?: number;
      rating?: number;
      certifications?: string[];
    };
    routeOptimization?: {
      estimatedDistance?: number;
      estimatedFuelCost?: number;
      estimatedTime?: number;
    };
    additionalServices?: {
      insurance?: boolean;
      tracking?: boolean;
      loadingAssistance?: boolean;
      unloadingAssistance?: boolean;
    };
  };
  isAutoBid?: boolean;
  isCounterOffer?: boolean;
  parentBidId?: string;
}

export interface AuctionData {
  loadId: string;
  auctionType: 'REVERSE' | 'FORWARD' | 'DUTCH' | 'SEALED';
  auctionStart: string;
  auctionEnd: string;
  reservePrice?: number;
  minimumBidIncrement?: number;
  maximumBidAmount?: number;
  auctionRules?: any;
  notificationSettings?: any;
}

export interface AuctionFilters {
  status?: string;
  auctionType?: string;
  minValue?: string;
  maxValue?: string;
  page?: number;
  limit?: number;
}

export const biddingAPI = {
  // Auction Management
  createAuction: (data: AuctionData) => 
    api.post('/bidding/auctions', data),

  getAuctions: (filters?: AuctionFilters) => 
    api.get('/bidding/auctions', { params: filters }),

  getAuction: (auctionId: string) => 
    api.get(`/bidding/auctions/${auctionId}`),

  updateAuction: (auctionId: string, data: Partial<AuctionData>) => 
    api.put(`/bidding/auctions/${auctionId}`, data),

  deleteAuction: (auctionId: string) => 
    api.delete(`/bidding/auctions/${auctionId}`),

  // Bid Management
  submitBid: (data: BidData) => 
    api.post('/bidding/bids', data),

  getBids: (filters?: any) => 
    api.get('/bidding/bids', { params: filters }),

  getBid: (bidId: string) => 
    api.get(`/bidding/bids/${bidId}`),

  updateBid: (bidId: string, data: Partial<BidData>) => 
    api.put(`/bidding/bids/${bidId}`, data),

  withdrawBid: (bidId: string) => 
    api.delete(`/bidding/bids/${bidId}`),

  acceptBid: (bidId: string) => 
    api.post(`/bidding/bids/${bidId}/accept`),

  // Load-specific operations
  getBidsForLoad: (loadId: string) => 
    api.get(`/bidding/loads/${loadId}/bids`),

  getAuctionForLoad: (loadId: string) => 
    api.get(`/bidding/loads/${loadId}/auction`),

  // Dashboard and Analytics
  getDashboardStats: () => 
    api.get('/bidding/dashboard/stats'),

  getBidHistory: (filters?: any) => 
    api.get('/bidding/history', { params: filters }),

  getBidAnalytics: (filters?: any) => 
    api.get('/bidding/analytics', { params: filters }),

  // Market Intelligence
  getMarketInsights: () => 
    api.get('/bidding/market-insights'),

  getBidRecommendations: (loadId: string) => 
    api.get(`/bidding/recommendations/${loadId}`),

  // Notifications
  getBidNotifications: () => 
    api.get('/bidding/notifications'),

  markNotificationRead: (notificationId: string) => 
    api.put(`/bidding/notifications/${notificationId}/read`),

  // Auto-bidding
  setAutoBid: (bidId: string, settings: any) => 
    api.post(`/bidding/bids/${bidId}/auto-bid`, settings),

  getAutoBidSettings: (bidId: string) => 
    api.get(`/bidding/bids/${bidId}/auto-bid`),

  // Counter-offers
  submitCounterOffer: (bidId: string, counterOffer: any) => 
    api.post(`/bidding/bids/${bidId}/counter-offer`, counterOffer),

  getCounterOffers: (bidId: string) => 
    api.get(`/bidding/bids/${bidId}/counter-offers`),

  // Auction monitoring
  watchAuction: (auctionId: string) => 
    api.post(`/bidding/auctions/${auctionId}/watch`),

  unwatchAuction: (auctionId: string) => 
    api.delete(`/bidding/auctions/${auctionId}/watch`),

  getWatchedAuctions: () => 
    api.get('/bidding/auctions/watched'),

  // Real-time updates (WebSocket endpoints)
  subscribeToAuction: (auctionId: string) => 
    api.post(`/bidding/auctions/${auctionId}/subscribe`),

  unsubscribeFromAuction: (auctionId: string) => 
    api.delete(`/bidding/auctions/${auctionId}/subscribe`),

  // Bulk operations
  submitBulkBids: (bids: BidData[]) => 
    api.post('/bidding/bids/bulk', { bids }),

  getBulkBidStatus: (batchId: string) => 
    api.get(`/bidding/bids/bulk/${batchId}`),

  // Export functionality
  exportBidHistory: (filters?: any) => 
    api.get('/bidding/export/history', {
      params: filters,
      responseType: 'blob'
    }),

  exportAuctionReport: (auctionId: string) => 
    api.get(`/bidding/export/auction/${auctionId}`, {
      responseType: 'blob'
    }),

  // Views & My bids
  recordAuctionView: (auctionId: string) => api.post(`/bidding/auctions/${auctionId}/view`),
  getMyBids: () => api.get('/bidding/bids'),
  
  // Admin endpoints
  getAllBidsForAdmin: () => api.get('/bidding/admin/all-bids'),
};

import { formatCurrency } from '../utils/formatNumber';

// Helper functions for common operations
export const biddingHelpers = {
  // Format currency for display
  formatCurrency: (amount: number, currency: string = 'USD') => {
    return formatCurrency(amount, currency);
  },

  // Calculate time remaining for auction
  getTimeRemaining: (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },

  // Calculate bid success probability
  calculateSuccessProbability: (bidAmount: number, currentBid: number, loadValue: number) => {
    let probability = 50; // Base probability

    if (bidAmount < currentBid) {
      probability += 30; // Higher chance if bidding lower
    } else if (bidAmount < loadValue * 0.8) {
      probability += 20; // Good value proposition
    }

    return Math.min(probability, 95);
  },

  // Validate bid amount
  validateBidAmount: (amount: number, currentBid?: number, minIncrement?: number) => {
    if (amount <= 0) return 'Bid amount must be greater than 0';

    if (currentBid && minIncrement) {
      const minBid = currentBid + minIncrement;
      if (amount < minBid) {
        return `Minimum bid amount is ${biddingHelpers.formatCurrency(minBid)}`;
      }
    }

    return null;
  },

  // Get status color for badges
  getStatusColor: (status: string) => {
    const colors: { [key: string]: string } = {
      ACTIVE: 'success',
      SCHEDULED: 'warning',
      CLOSED: 'secondary',
      CANCELLED: 'danger',
      PAUSED: 'info',
      PENDING: 'warning',
      ACCEPTED: 'success',
      REJECTED: 'danger',
      WITHDRAWN: 'secondary',
      EXPIRED: 'secondary',
    };
    return colors[status] || 'secondary';
  },

  // Get auction type color
  getAuctionTypeColor: (type: string) => {
    const colors: { [key: string]: string } = {
      REVERSE: 'primary',
      FORWARD: 'success',
      DUTCH: 'warning',
      SEALED: 'info',
    };
    return colors[type] || 'secondary';
  },
}; 