import api from './api';

// Broker API Service
export const brokerAPI = {
  // Broker Management
  getBrokers: (params?: any) => 
    api.get('/brokers', { params }),

  getBroker: (brokerId: string) => 
    api.get(`/brokers/${brokerId}`),

  updateBroker: (brokerId: string, data: any) => 
    api.put(`/brokers/${brokerId}`, data),

  // Broker Loads
  getBrokerLoads: (brokerId: string, params?: any) => 
    api.get(`/brokers/${brokerId}/loads`, { params }),

  // Broker Commissions
  getBrokerCommissions: (brokerId: string, params?: any) => 
    api.get(`/brokers/${brokerId}/commissions`, { params }),

  updateCommissionStatus: (commissionId: string, data: { status: string; paymentReference?: string }) => 
    api.put(`/brokers/commissions/${commissionId}/status`, data),

  // Broker Statistics
  getBrokerStatistics: (brokerId: string) => 
    api.get(`/brokers/${brokerId}/statistics`),

  // Load Assignment
  assignBrokerToLoad: (loadId: string, data: { brokerId: string; commissionRate?: number }) => 
    api.post(`/brokers/loads/${loadId}/assign`, { brokerId: data.brokerId, commissionRate: data.commissionRate }),

  unassignBrokerFromLoad: (loadId: string) => 
    api.patch(`/loads-v2/${loadId}`, { brokerId: null, brokerCommissionRate: null }),

  // Available Loads (for discovery)
  getAvailableLoads: (params?: any) => 
    api.get('/loads', { params }),

  getLoad: (loadId: string) => 
    api.get(`/loads/${loadId}`),

  // Transporter Search (for matching)
  searchTransporters: (params?: any) => 
    api.get('/fleet/trucks', { params }),

  getTransporterProfile: (truckOwnerId: string) => 
    api.get(`/users/${truckOwnerId}`),

  // Commission Payout
  requestPayout: (commissionId: string, data: any) => 
    api.post(`/brokers/commissions/${commissionId}/payout`, data),

  getPayoutRequests: (brokerId: string, params?: any) => 
    api.get(`/brokers/${brokerId}/payouts`, { params }),

  // Load Tracking
  getLoadTracking: (loadId: string) => 
    api.get(`/loads/${loadId}/tracking`),

  // ==================== CONTRACT MANAGEMENT ====================
  createContract: (data: CreateContractData) => 
    api.post('/brokers/contracts', data),
  
  getContracts: (params?: { status?: string; loadId?: string; transporterId?: string }) => 
    api.get('/brokers/contracts', { params }),
  
  getContract: (contractId: string) => 
    api.get(`/brokers/contracts/${contractId}`),
  
  signContract: (contractId: string, data: SignContractData) => 
    api.put(`/brokers/contracts/${contractId}/sign`, data),

  acceptContract: (contractId: string) => 
    api.put(`/brokers/contracts/${contractId}/accept`),

  // ==================== INSURANCE VERIFICATION ====================
  verifyInsurance: (data: VerifyInsuranceData) => 
    api.post('/brokers/insurance/verify', data),
  
  getVerifications: (transporterId: string, loadId?: string) => 
    api.get(`/brokers/insurance/verify/${transporterId}`, { params: { loadId } }),
  
  checkCompliance: (transporterId: string, types: string[]) => 
    api.get(`/brokers/insurance/compliance/${transporterId}`, { params: { types: types.join(',') } }),

  // ==================== DISPUTE RESOLUTION ====================
  createDispute: (data: CreateDisputeData) => 
    api.post('/brokers/disputes', data),
  
  getDisputes: (params?: { status?: string; category?: string; loadId?: string }) => 
    api.get('/brokers/disputes', { params }),
  
  getDispute: (disputeId: string) => 
    api.get(`/brokers/disputes/${disputeId}`),
  
  startMediation: (disputeId: string, notes?: string) => 
    api.put(`/brokers/disputes/${disputeId}/mediate`, { notes }),
  
  resolveDispute: (disputeId: string, data: ResolveDisputeData) => 
    api.put(`/brokers/disputes/${disputeId}/resolve`, data),

  // ==================== ESCROW MANAGEMENT ====================
  createEscrow: (data: CreateEscrowData) => 
    api.post('/brokers/escrow', data),
  
  getEscrows: (params?: { status?: string; loadId?: string }) => 
    api.get('/brokers/escrow', { params }),
  
  getEscrow: (escrowId: string) => 
    api.get(`/brokers/escrow/${escrowId}`),
  
  fundEscrow: (escrowId: string, data: FundEscrowData) => 
    api.put(`/brokers/escrow/${escrowId}/fund`, data),
  
  releaseEscrow: (escrowId: string, data: ReleaseEscrowData) => 
    api.put(`/brokers/escrow/${escrowId}/release`, data),

  // ==================== DOCUMENT MANAGEMENT ====================
  uploadDocument: (data: CreateDocumentData) => 
    api.post('/brokers/documents', data),
  
  generateBOL: (loadId: string, data?: Record<string, any>) => 
    api.post(`/brokers/documents/bol/${loadId}`, data || {}),
  
  generatePOD: (loadId: string, tripId: string, data?: Record<string, any>) => 
    api.post(`/brokers/documents/pod/${loadId}`, data || {}, { params: { tripId } }),
  
  getLoadDocuments: (loadId: string, type?: string) => 
    api.get(`/brokers/documents/load/${loadId}`, { params: { type } }),
  
  verifyDocument: (documentId: string, notes?: string) => 
    api.put(`/brokers/documents/${documentId}/verify`, { notes }),

  // ==================== BROKER INTELLIGENCE ====================
  
  // Smart Matching
  generateRecommendations: (loadId: string, limit?: number) =>
    api.post('/brokers/intelligence/matching/generate', { loadId, limit }),
  
  getRecommendations: (loadId: string) =>
    api.get(`/brokers/intelligence/matching/recommendations/${loadId}`),
  
  acceptRecommendation: (recommendationId: string, notes?: string) =>
    api.put(`/brokers/intelligence/matching/recommendations/${recommendationId}/accept`, { notes }),

  // Market Intelligence
  analyzeMarketRate: (route: MarketRoute, loadId?: string) =>
    api.post('/brokers/intelligence/market/analyze', { route, loadId }),
  
  getMarketHistory: (limit?: number) =>
    api.get('/brokers/intelligence/market/history', { params: { limit } }),
  
  getMarketForecast: (route: MarketRoute) =>
    api.post('/brokers/intelligence/market/forecast', { route }),

  // Credit Management
  performCreditCheck: (transporterId: string) =>
    api.post('/brokers/intelligence/credit/check', { transporterId }),
  
  getCreditRecords: (transporterId?: string, status?: string) =>
    api.get('/brokers/intelligence/credit/records', { params: { transporterId, status } }),
  
  updatePaymentTerms: (creditId: string, data: UpdatePaymentTermsData) =>
    api.put(`/brokers/intelligence/credit/${creditId}/terms`, data),

  // Multi-Stop
  createMultiStopLoad: (data: CreateMultiStopLoadData) =>
    api.post('/brokers/intelligence/multi-stop', data),
  
  getMultiStopLoad: (loadId: string) =>
    api.get(`/brokers/intelligence/multi-stop/${loadId}`),
  
  updateMultiStopLoad: (multiStopId: string, data: UpdateMultiStopLoadData) =>
    api.put(`/brokers/intelligence/multi-stop/${multiStopId}`, data),

  // Performance Analytics
  calculatePerformance: (transporterId: string) =>
    api.post(`/brokers/intelligence/performance/calculate/${transporterId}`),
  
  getTransporterPerformance: (transporterId: string) =>
    api.get(`/brokers/intelligence/performance/${transporterId}`),
  
  getPerformanceRecords: (transporterId?: string, minReliabilityScore?: number) =>
    api.get('/brokers/intelligence/performance', { params: { transporterId, minReliabilityScore } }),
};

// Types
export interface Broker {
  id: string;
  email: string;
  role: 'BROKER';
  defaultCommissionRate: number;
  totalCommissionEarned: number;
  profile?: {
    firstName: string;
    lastName: string;
    companyName?: string;
    phone?: string;
  };
}

export interface BrokerCommission {
  id: string;
  loadId: string;
  loadAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  paidAt?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrokerStatistics {
  totalCommissions: number;
  totalEarned: number;
  totalPending: number;
  totalApproved: number;
  totalLoads: number;
  averageCommissionRate: number;
}

export interface BrokerLoad {
  id: string;
  title: string;
  loadValue: number;
  currencyCode: string;
  status: string;
  brokerCommissionRate?: number;
  brokerCommissionAmount?: number;
  createdAt: string;
}

// ==================== BROKER INTELLIGENCE TYPES ====================

export interface MarketRoute {
  origin: {
    city: string;
    state?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  destination: {
    city: string;
    state?: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  distance: number;
}

export interface MatchRecommendation {
  id: string;
  loadId: string;
  transporterId?: string;
  truckId?: string;
  recommendationType: 'AI_POWERED' | 'ROUTE_OPTIMIZED' | 'BUNDLING_OPPORTUNITY' | 'BACKHAUL_IDENTIFIED' | 'COST_OPTIMIZED';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  matchScore: number;
  confidenceLevel: number;
  matchingFactors: {
    distanceScore?: number;
    capacityUtilization?: number;
    routeEfficiency?: number;
    costSavings?: number;
    reliabilityScore?: number;
  };
  routeOptimization?: {
    optimizedDistance: number;
    estimatedTime: number;
    fuelSavings: number;
  };
  bundlingOpportunity?: {
    bundledLoadIds: string[];
    totalSavings: number;
  };
  backhaulOpportunity?: {
    returnLoadId?: string;
    totalRevenue: number;
    emptyMilesSaved: number;
  };
  aiInsights: {
    predictedSuccessRate: number;
    riskFactors: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface MarketIntelligence {
  id: string;
  route: MarketRoute;
  currentRate: number;
  averageRate?: number;
  medianRate?: number;
  minRate?: number;
  maxRate?: number;
  recommendedRate?: number;
  historicalTrends?: {
    last7Days: number[];
    last30Days: number[];
    last90Days: number[];
    lastYear: number[];
  };
  demandForecast?: {
    next7Days: number;
    next30Days: number;
    confidence: number;
  };
  rateRecommendations?: {
    competitiveRate: number;
    premiumRate: number;
    budgetRate: number;
    reasoning: string;
  };
  pricingInsights?: {
    priceTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volatility: number;
    bestTimeToBook?: string;
  };
  createdAt: string;
}

export interface TransporterCredit {
  id: string;
  transporterId: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'REVIEW_REQUIRED';
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  paymentTerms: 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'DUE_ON_RECEIPT' | 'CUSTOM';
  customPaymentDays?: number;
  creditCheck?: {
    creditScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    checkDate: string;
    factors: string[];
  };
  paymentHistory?: {
    totalTransactions: number;
    onTimePayments: number;
    latePayments: number;
    averageDaysToPay: number;
    paymentTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  riskAssessment?: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    recommendations: string[];
  };
  createdAt: string;
}

export interface UpdatePaymentTermsData {
  paymentTerms: 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'DUE_ON_RECEIPT' | 'CUSTOM';
  customPaymentDays?: number;
  creditLimit?: number;
}

export interface MultiStopLoad {
  id: string;
  loadId: string;
  stops: Array<{
    stopId: string;
    sequence: number;
    type: 'PICKUP' | 'DELIVERY' | 'STOP';
    location: {
      name: string;
      address: string;
      coordinates: { lat: number; lng: number };
    };
    scheduledTime: string;
    estimatedDuration: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  }>;
  optimizedRoute?: {
    totalDistance: number;
    totalTime: number;
    routeSequence: number[];
  };
  routeOptimization?: {
    distanceSavings: number;
    timeSavings: number;
    fuelSavings: number;
    optimizationScore: number;
  };
  createdAt: string;
}

export interface CreateMultiStopLoadData {
  loadId: string;
  stops: MultiStopLoad['stops'];
}

export interface UpdateMultiStopLoadData {
  stops?: MultiStopLoad['stops'];
  notes?: string;
}

export interface TransporterPerformance {
  id: string;
  transporterId: string;
  reliabilityScore: number;
  onTimeDeliveryRate: number;
  damageRate: number;
  predictiveMatchSuccess: number;
  reliabilityMetrics: {
    totalLoads: number;
    completedLoads: number;
    completionRate: number;
    communicationScore: number;
    professionalismScore: number;
  };
  onTimeTracking: {
    totalDeliveries: number;
    onTimeDeliveries: number;
    onTimePercentage: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
  damageAnalysis: {
    totalLoads: number;
    loadsWithDamage: number;
    damageRate: number;
  };
  predictiveMetrics: {
    matchSuccessRate: number;
    acceptanceRate: number;
    riskScore: number;
    recommendedForLoads: boolean;
  };
  historicalTrends?: {
    reliabilityTrend: number[];
    onTimeTrend: number[];
    damageTrend: number[];
    periods: string[];
  };
  comparativeAnalysis?: {
    industryAverage: {
      reliability: number;
      onTime: number;
      damage: number;
    };
    percentileRank: {
      reliability: number;
      onTime: number;
      damage: number;
    };
  };
  calculatedAt: string;
}

// ==================== CONTRACT MANAGEMENT TYPES ====================
export interface LoadContract {
  id: string;
  loadId: string;
  tripId?: string;
  cargoOwnerId: string;
  transporterId: string;
  contractType: 'LOAD_AGREEMENT' | 'TRANSPORT_AGREEMENT' | 'BROKER_AGREEMENT';
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'PARTIALLY_SIGNED' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  agreedRate: number;
  currencyCode: string;
  commissionRate: number;
  commissionAmount: number;
  paymentTerms?: string;
  paymentDueDate?: string;
  pickupDate?: string;
  deliveryDate?: string;
  contractContent: string;
  cargoOwnerSignature?: {
    signedAt: string;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
  };
  transporterSignature?: {
    signedAt: string;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
  };
  brokerSignature?: {
    signedAt: string;
    signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
  };
  fullySignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractData {
  loadId: string;
  transporterId: string;
  tripId?: string;
  contractType?: 'LOAD_AGREEMENT' | 'TRANSPORT_AGREEMENT' | 'BROKER_AGREEMENT';
  agreedRate: number;
  currencyCode?: string;
  commissionRate: number;
  paymentTerms?: string;
  paymentDueDate?: string;
  pickupDate?: string;
  deliveryDate?: string;
  deliveryTerms?: string;
  specialInstructions?: string;
  expiresAt?: string;
}

export interface SignContractData {
  signatureMethod: 'DIGITAL' | 'E_SIGNATURE' | 'MANUAL';
  signatureData?: string;
  metadata?: Record<string, any>;
}

// ==================== INSURANCE VERIFICATION TYPES ====================
export interface InsuranceVerification {
  id: string;
  transporterId: string;
  loadId?: string;
  verificationType: 'INSURANCE' | 'LICENSE' | 'DOT_NUMBER' | 'MC_NUMBER' | 'CARGO_INSURANCE' | 'BOND';
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'INVALID' | 'REQUIRES_UPDATE';
  policyNumber?: string;
  licenseNumber?: string;
  dotNumber?: string;
  mcNumber?: string;
  insuranceCompany?: string;
  coverageAmount?: number;
  effectiveDate?: string;
  expiryDate?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
}

export interface VerifyInsuranceData {
  transporterId: string;
  loadId?: string;
  verificationType: 'INSURANCE' | 'LICENSE' | 'DOT_NUMBER' | 'MC_NUMBER' | 'CARGO_INSURANCE' | 'BOND';
  policyNumber?: string;
  licenseNumber?: string;
  dotNumber?: string;
  mcNumber?: string;
  insuranceCompany?: string;
  coverageAmount?: number;
  effectiveDate?: string;
  expiryDate?: string;
  verificationNotes?: string;
}

export interface ComplianceCheck {
  isCompliant: boolean;
  missingTypes: string[];
  expiredTypes: string[];
  warnings: string[];
}

// ==================== DISPUTE RESOLUTION TYPES ====================
export interface BrokerDispute {
  id: string;
  loadId: string;
  tripId?: string;
  raisedById: string;
  disputedWithId: string;
  category: 'DAMAGE' | 'DELAY' | 'PAYMENT' | 'QUALITY' | 'ROUTE' | 'COMMUNICATION' | 'OTHER';
  status: 'OPEN' | 'UNDER_REVIEW' | 'MEDIATION' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  resolution?: string;
  claimedAmount?: number;
  resolvedAmount?: number;
  evidence: Array<{
    type: 'PHOTO' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';
    url: string;
    description?: string;
    uploadedAt: string;
  }>;
  mediationHistory: Array<{
    timestamp: string;
    mediatorId: string;
    action: string;
    notes?: string;
  }>;
  communications: Array<{
    timestamp: string;
    from: string;
    to: string;
    message: string;
    type: string;
  }>;
  resolvedAt?: string;
  createdAt: string;
}

export interface CreateDisputeData {
  loadId: string;
  tripId?: string;
  disputedWithId: string;
  category: 'DAMAGE' | 'DELAY' | 'PAYMENT' | 'QUALITY' | 'ROUTE' | 'COMMUNICATION' | 'OTHER';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  claimedAmount?: number;
  evidence?: Array<{
    type: 'PHOTO' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';
    url: string;
    description?: string;
  }>;
}

export interface ResolveDisputeData {
  resolution: string;
  resolvedAmount?: number;
  resolutionTerms?: Record<string, any>;
}

// ==================== ESCROW MANAGEMENT TYPES ====================
export interface EscrowAccount {
  id: string;
  loadId: string;
  tripId?: string;
  payerId: string;
  payeeId: string;
  status: 'PENDING' | 'FUNDED' | 'PARTIALLY_RELEASED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED' | 'CANCELLED';
  totalAmount: number;
  currencyCode: string;
  fundedAmount: number;
  releasedAmount: number;
  commissionAmount: number;
  paymentMethod?: string;
  paymentReference?: string;
  fundedAt?: string;
  releaseSchedule: Array<{
    milestone: string;
    amount: number;
    trigger: string;
    released: boolean;
    releasedAt?: string;
  }>;
  releaseHistory: Array<{
    timestamp: string;
    amount: number;
    trigger: string;
    releasedBy: string;
    paymentReference?: string;
  }>;
  createdAt: string;
}

export interface CreateEscrowData {
  loadId: string;
  tripId?: string;
  payerId: string;
  payeeId: string;
  totalAmount: number;
  currencyCode?: string;
  commissionAmount: number;
  paymentMethod?: string;
  releaseSchedule?: Array<{
    milestone: string;
    amount: number;
    percentage?: number;
    trigger: 'DELIVERY_CONFIRMED' | 'MILESTONE_REACHED' | 'MANUAL' | 'DISPUTE_RESOLVED' | 'TIME_BASED';
  }>;
  autoReleaseConfig?: {
    enabled: boolean;
    trigger: string;
    delayHours?: number;
    requireConfirmation?: boolean;
  };
}

export interface FundEscrowData {
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  transactionId?: string;
}

export interface ReleaseEscrowData {
  amount: number;
  trigger: 'DELIVERY_CONFIRMED' | 'MILESTONE_REACHED' | 'MANUAL' | 'DISPUTE_RESOLVED' | 'TIME_BASED';
  paymentReference?: string;
  notes?: string;
}

// ==================== DOCUMENT MANAGEMENT TYPES ====================
export interface LoadDocument {
  id: string;
  loadId: string;
  tripId?: string;
  documentType: 'BILL_OF_LADING' | 'PROOF_OF_DELIVERY' | 'PROOF_OF_PICKUP' | 'INVOICE' | 'COMMISSION_INVOICE' | 'INSURANCE_CERTIFICATE' | 'CONTRACT' | 'WEIGHT_TICKET' | 'DELIVERY_RECEIPT' | 'DAMAGE_REPORT' | 'OTHER';
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  documentContent?: string;
  description?: string;
  signedAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateDocumentData {
  loadId: string;
  tripId?: string;
  documentType: 'BILL_OF_LADING' | 'PROOF_OF_DELIVERY' | 'PROOF_OF_PICKUP' | 'INVOICE' | 'COMMISSION_INVOICE' | 'INSURANCE_CERTIFICATE' | 'CONTRACT' | 'WEIGHT_TICKET' | 'DELIVERY_RECEIPT' | 'DAMAGE_REPORT' | 'OTHER';
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  documentContent?: string;
  documentData?: Record<string, any>;
  description?: string;
  expiresAt?: string;
}

