import api from '../api';

export interface LoanRequest {
  id: string;
  tenant_id: string;
  cargo_id: string;
  trip_id: string;
  lender_id?: string;
  requested_amount: number;
  approved_amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed' | 'repaid' | 'failed' | 'defaulted';
  idempotency_key: string;
  interest_amount?: number;
  due_date?: string;
  created_by: string;
  external_loan_ref?: string;
  rejection_reason?: string;
  requested_split: Beneficiary[];
  metadata?: any;
  created_at: string;
  updated_at: string;
  lender?: Lender;
  disbursements?: LoanDisbursement[];
  repayments?: LoanRepayment[];
}

export interface Beneficiary {
  type: string;
  id: string;
  amount: number;
}

export interface Lender {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'suspended';
  contact_email: string;
  created_at: string;
}

export interface LoanDisbursement {
  id: string;
  loan_request_id: string;
  disbursement_date?: string;
  beneficiaries: Beneficiary[];
  status: 'initiated' | 'pending' | 'approved' | 'disbursed' | 'failed' | 'rejected' | 'on_hold';
  external_txn_ref?: string;
  attempts: number;
  failure_reason?: string;
  created_at: string;
}

export interface LoanRepayment {
  id: string;
  loan_request_id: string;
  amount: number;
  interest_paid: number;
  principal_paid: number;
  repayment_date: string;
  external_txn_ref?: string;
  created_at: string;
}

export interface CreateLoanRequestDto {
  tenant_id: string;
  cargo_id: string;
  trip_id: string;
  requested_amount: number;
  requested_split: Beneficiary[];
  lender_id?: string;
  created_by?: string;
  due_date?: string;
  metadata?: any;
}

export interface LenderDashboardData {
  totalLoansIssued: number;
  totalOutstandingPrincipal: number;
  recoveryRate: number;
  defaultRate: number;
  averageLoanSize: number;
  roi: number;
  totalInterestCollected: number;
  loans: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
    due_date?: string;
  }>;
}

export const lendingApi = {
  // Loan requests
  createLoanRequest: async (data: CreateLoanRequestDto): Promise<LoanRequest> => {
    const response = await api.post('/lending/loan-requests', data);
    // Handle both old and new response formats
    return response.data.data || response.data;
  },

  getLoanRequest: async (loanId: string): Promise<LoanRequest> => {
    const response = await api.get(`/lending/loan-requests/${loanId}`);
    return response.data;
  },

  getTenantLoans: async (tenantId: string, status?: string): Promise<LoanRequest[]> => {
    const params = status ? { status } : {};
    const response = await api.get(`/lending/tenant/${tenantId}/loans`, { params });
    return response.data;
  },

  processRepayment: async (loanId: string, finalPaymentAmount: number): Promise<LoanRepayment> => {
    const response = await api.post(`/lending/repayments/${loanId}`, {
      final_payment_amount: finalPaymentAmount
    });
    return response.data;
  },

  // Admin endpoints
  createLender: async (data: { name: string; callback_url?: string; contact_email: string }) => {
    const response = await api.post('/admin/lenders', data);
    return response.data;
  },

  getAllLenders: async (): Promise<Lender[]> => {
    const response = await api.get('/admin/lenders');
    return response.data;
  },

  // Tenant-specific endpoints
  createTenantLender: async (data: { name: string; callback_url?: string; contact_email: string }) => {
    const response = await api.post('/tenant/lenders', data);
    return response.data;
  },

  getTenantLenders: async (): Promise<Lender[]> => {
    const response = await api.get('/lending/tenant/lenders');
    return response.data;
  },

  getLender: async (lenderId: string): Promise<Lender> => {
    const response = await api.get(`/admin/lenders/${lenderId}`);
    return response.data;
  },

  updateLenderStatus: async (lenderId: string, status: 'active' | 'paused' | 'suspended') => {
    const response = await api.post(`/admin/lenders/${lenderId}/status`, { status });
    return response.data;
  },

  createLenderPolicy: async (lenderId: string, data: {
    interest_rate: number;
    repayment_term_days: number;
    max_advance_per_trip: number;
    max_exposure: number;
    advance_percentage?: number;
  }) => {
    const response = await api.post(`/admin/lenders/${lenderId}/policy`, data);
    return response.data;
  },

  // Lender Profile Management
  getLenderProfile: async (lenderId: string) => {
    const response = await api.get(`/admin/lenders/${lenderId}/profile`);
    return response.data;
  },

  updateLenderProfile: async (lenderId: string, profileData: any) => {
    const response = await api.put(`/admin/lenders/${lenderId}/profile`, profileData);
    return response.data;
  },

  updateLenderPersonal: async (lenderId: string, personalData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    profileImage?: string;
    title?: string;
    bio?: string;
  }) => {
    const response = await api.put(`/admin/lenders/${lenderId}/personal`, personalData);
    return response.data;
  },

  updateLenderBusiness: async (lenderId: string, businessData: {
    companyName: string;
    registrationNumber?: string;
    taxId?: string;
    businessType?: string;
    industry?: string;
    foundedYear?: string;
    website?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    description?: string;
    operationalCountries?: string[];
    supportedCurrencies?: string[];
    lendingCapacity?: {
      minLoanAmount: number;
      maxLoanAmount: number;
      totalCapacity: number;
      availableCapacity: number;
    };
    specializations?: string[];
    certifications?: string[];
  }) => {
    const response = await api.put(`/admin/lenders/${lenderId}/business`, businessData);
    return response.data;
  },

  updateLenderBanking: async (lenderId: string, bankingData: {
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    swiftCode?: string;
  }) => {
    const response = await api.put(`/admin/lenders/${lenderId}/banking`, bankingData);
    return response.data;
  },

  updateLenderPreferences: async (lenderId: string, preferences: {
    language?: string;
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    twoFactorAuth?: boolean;
  }) => {
    const response = await api.put(`/admin/lenders/${lenderId}/preferences`, preferences);
    return response.data;
  },

  // Lender dashboard endpoints
  getLenderDashboard: async (lenderId: string, dateFrom?: string, dateTo?: string): Promise<LenderDashboardData> => {
    const params: any = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    
    const response = await api.get(`/lending/dashboard/${lenderId}`, { params });
    return response.data;
  },

  // Loan management for lenders
  getLenderLoanRequests: async (
    lenderId: string, 
    status?: string, 
    page: number = 1, 
    limit: number = 10
  ) => {
    const params: any = { page, limit };
    if (status) params.status = status;
    
    const response = await api.get(`/lending/lenders/${lenderId}/loan-requests`, { params });
    return response.data;
  },

  approveLoanRequest: async (loanId: string, data: {
    approved_amount: number;
    interest_rate?: number;
    due_date?: string;
  }) => {
    const response = await api.post(`/lending/loan-requests/${loanId}/approve`, data);
    return response.data;
  },

  rejectLoanRequest: async (loanId: string, reason: string) => {
    const response = await api.post(`/lending/loan-requests/${loanId}/reject`, { reason });
    return response.data;
  },

  initiateDisbursement: async (loanId: string) => {
    const response = await api.post(`/lending/loan-requests/${loanId}/disburse`);
    return response.data;
  },

  disburseWithPayment: async (loanId: string, paymentData: {
    paymentMethod: string;
    phoneNumber?: string;
    truckOwnerPhoneNumber?: string;
  }) => {
    const response = await api.post(`/lending/loan-requests/${loanId}/disburse-with-payment`, paymentData);
    return response.data;
  },

  // Analytics
  getLenderAnalytics: async (lenderId: string, period: string = '30d') => {
    const response = await api.get(`/lending/lenders/${lenderId}/analytics`, {
      params: { period }
    });
    return response.data;
  },

  

  // getAllPermissions: async () => {
  //   const response = await api.get('/api/admin/permissions');
  //   return response.data;
  // },

  // ==== CRITICAL APIS FOR FRONTEND PAGES ====

  // Active loans management
  getActiveLoans: async (
    lenderId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const response = await api.get(`/lending/lenders/${lenderId}/active-loans`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Borrower management
  getLenderBorrowers: async (
    lenderId: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const response = await api.get(`/lending/lenders/${lenderId}/borrowers`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Portfolio management
  getPortfolioSummary: async (lenderId: string) => {
    const response = await api.get(`/lending/lenders/${lenderId}/portfolio/summary`);
    return response.data;
  },

  // Loan operations
  extendLoan: async (loanId: string, extensionDays: number, reason: string) => {
    const response = await api.post(`/lending/loans/${loanId}/extend`, {
      extension_days: extensionDays,
      reason
    });
    return response.data;
  },

  // Repayment management
  sendRepaymentReminder: async (loanId: string, message?: string) => {
    const response = await api.post(`/lending/repayments/${loanId}/remind`, {
      message
    });
    return response.data;
  },

  getOverdueRepayments: async (
    lenderId?: string,
    page: number = 1,
    limit: number = 10
  ) => {
    const params: any = { page, limit };
    if (lenderId) params.lenderId = lenderId;
    
    const response = await api.get('/lending/repayments/overdue', { params });
    return response.data;
  },

  // Disbursement Management
  getLenderDisbursements: async (lenderId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get(`/lending/lenders/${lenderId}/disbursements`, { params });
    return response.data;
  },

  getDisbursementDetails: async (disbursementId: string) => {
    const response = await api.get(`/lending/disbursements/${disbursementId}`);
    return response.data;
  },

  updateDisbursementStatus: async (disbursementId: string, data: {
    status: string;
    reason?: string;
    notes?: string;
  }) => {
    const response = await api.put(`/lending/disbursements/${disbursementId}/status`, data);
    return response.data;
  },

  getDisbursementStats: async (lenderId: string, period: string = '30d') => {
    const response = await api.get(`/lending/lenders/${lenderId}/disbursements/stats`, {
      params: { period }
    });
    return response.data;
  },

  // ==== ENHANCED APIS FOR COMPREHENSIVE LENDING ====

  // Trends Analytics (Selected API)
  getLenderTrends: async (lenderId: string, params?: {
    period?: string;
    granularity?: string;
    metrics?: string[];
  }) => {
    const response = await api.get(`/lending/lenders/${lenderId}/trends`, { params });
    return response.data;
  },

  // Repayments for Lenders
  getLenderRepayments: async (lenderId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get(`/lending/lenders/${lenderId}/repayments`, { params });
    return response.data;
  },

  getLenderInterestSummary: async (lenderId: string) => {
    const response = await api.get(`/lending/lenders/${lenderId}/interest-summary`);
    return response.data;
  },

  // Borrower Profile Management
  getBorrowerProfile: async (borrowerId: string) => {
    const response = await api.get(`/lending/borrowers/${borrowerId}/profile`);
    return response.data;
  },

  getBorrowerLoanHistory: async (borrowerId: string, params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await api.get(`/lending/borrowers/${borrowerId}/loan-history`, { params });
    return response.data;
  },

  performCreditCheck: async (
    borrowerId: string,
    params: { checkType: 'basic' | 'comprehensive' | 'refresh'; includeExternalBureaus?: boolean; requestedBy: string; purpose?: string },
  ) => {
    const response = await api.post(`/lending/borrowers/${borrowerId}/credit-check`, params);
    return response.data;
  },

  // Risk Management
  getPortfolioRiskAssessment: async (lenderId: string) => {
    const response = await api.get(`/lending/risk/portfolio-assessment`, {
      params: { lenderId }
    });
    return response.data;
  },

  getMarketTrends: async (region?: string, sector?: string) => {
    const params: any = {};
    if (region) params.region = region;
    if (sector) params.sector = sector;
    
    const response = await api.get('/lending/risk/market-trends', { params });
    return response.data;
  },

  // Additional Operations
  retryDisbursement: async (disbursementId: string) => {
    const response = await api.post(`/lending/disbursements/${disbursementId}/retry`);
    return response.data;
  },

  restructureLoan: async (loanId: string, data: {
    new_amount?: number;
    new_due_date?: string;
    new_interest_rate?: number;
    reason: string;
  }) => {
    const response = await api.post(`/lending/loans/${loanId}/restructure`, data);
    return response.data;
  },

  // Team Management
  getLenderTeam: async (lenderId: string): Promise<any[]> => {
    const response = await api.get(`/admin/lenders/${lenderId}/team`);
    return response.data;
  },

  getLenderTeamStats: async (lenderId: string): Promise<any> => {
    const response = await api.get(`/admin/lenders/${lenderId}/team/stats`);
    return response.data;
  },

  getLenderRoles: async (lenderId: string): Promise<any[]> => {
    const response = await api.get(`/admin/lenders/${lenderId}/roles`);
    return response.data;
  },

  getAllPermissions: async (): Promise<any[]> => {
    const response = await api.get('/admin/permissions');
    return response.data;
  },

  addTeamMember: async (lenderId: string, memberData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    roleId: string;
    department?: string;
    additionalPermissions?: string[];
    avatar?: string;
  }): Promise<any> => {
    const response = await api.post(`/admin/lenders/${lenderId}/team`, memberData);
    return response.data;
  },

  // ===== COMPREHENSIVE LENDING POLICIES API =====

  // Get all policies for a lender
  getLenderPolicies: async (lenderId: string, activeOnly: boolean = false) => {
    try {
      const response = await api.get(`/lending/policies/${lenderId}/all`, {
        params: { activeOnly }
      });
      
      const policies = response.data;
      
      // Transform backend data to frontend format
      return {
        interestRates: policies.interestRates?.map((policy: any) => ({
          id: policy.id,
          name: policy.name,
          riskLevel: policy.risk_level,
          baseRate: policy.base_rate,
          minRate: policy.min_rate,
          maxRate: policy.max_rate,
          adjustmentFactors: policy.adjustment_factors || {},
          isActive: policy.is_active,
          created_at: policy.created_at
        })) || [],
        
        loanLimits: policies.loanLimits?.map((policy: any) => ({
          id: policy.id,
          name: policy.name,
          businessType: policy.business_type,
          minAmount: policy.min_amount,
          maxAmount: policy.max_amount,
          creditScoreRequirement: policy.credit_score_requirement,
          collateralRequirement: policy.collateral_requirement,
          maxUtilization: policy.max_utilization,
          isActive: policy.is_active,
          created_at: policy.created_at
        })) || [],
        
        eligibilityCriteria: policies.eligibilityCriteria?.map((policy: any) => ({
          id: policy.id,
          name: policy.name,
          category: policy.category,
          description: policy.description,
          requirement: policy.requirement,
          minimumValue: policy.minimum_value,
          maximumValue: policy.maximum_value,
          required: policy.is_required,
          isActive: policy.is_active,
          created_at: policy.created_at
        })) || [],
        
        riskAssessment: policies.riskAssessment?.map((policy: any) => ({
          id: policy.id,
          factor: policy.factor,
          weight: policy.weight,
          scoringCriteria: policy.scoring_criteria || {},
          isActive: policy.is_active,
          created_at: policy.created_at
        })) || [],
        
        repaymentPolicies: policies.repaymentPolicies?.map((policy: any) => ({
          id: policy.id,
          name: policy.name,
          frequency: policy.frequency,
          gracePeriod: policy.grace_period,
          lateFee: policy.late_fee,
          penaltyRate: policy.penalty_rate,
          maxExtensions: policy.max_extensions,
          defaultThreshold: policy.default_threshold,
          isActive: policy.is_active,
          created_at: policy.created_at
        })) || [],
        
        cargoTypePolicies: policies.cargoTypePolicies?.map((policy: any) => ({
          id: policy.id,
          cargoType: policy.cargo_type,
          riskLevel: policy.risk_level,
          riskMultiplier: policy.risk_multiplier,
          maxLoanAmount: policy.max_loan_amount,
          insuranceRequired: policy.insurance_required,
          specialConditions: policy.special_conditions || [],
          isActive: policy.is_active,
          created_at: policy.created_at
        })) || [],
        
        globalSettings: policies.systemConfig ? {
          autoApprovalLimit: policies.systemConfig.auto_approval_limit,
          manualReviewThreshold: policies.systemConfig.manual_review_threshold,
          maxConcurrentLoans: policies.systemConfig.max_concurrent_loans,
          totalExposureLimit: policies.systemConfig.total_exposure_limit,
          cooldownPeriod: policies.systemConfig.cooldown_period,
          complianceMode: policies.systemConfig.compliance_mode,
          auditTrail: policies.systemConfig.audit_trail
        } : {
          autoApprovalLimit: 0,
          manualReviewThreshold: 0,
          maxConcurrentLoans: 0,
          totalExposureLimit: 0,
          cooldownPeriod: 0,
          complianceMode: false,
          auditTrail: false
        }
      };
    } catch (error) {
      console.error('Error fetching lender policies:', error);
      return null;
    }
  },

  // Interest Rate Policies
  createInterestRatePolicy: async (lenderId: string, policyData: {
    name: string;
    riskLevel: string;
    baseRate: number;
    minRate: number;
    maxRate: number;
    adjustmentFactors: {
      creditScore: number;
      loanHistory: number;
      collateral: number;
      businessType: number;
    };
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/interest-rates`, {
      name: policyData.name,
      risk_level: policyData.riskLevel,
      base_rate: policyData.baseRate,
      min_rate: policyData.minRate,
      max_rate: policyData.maxRate,
      adjustment_factors: {
        credit_score: policyData.adjustmentFactors.creditScore,
        loan_history: policyData.adjustmentFactors.loanHistory,
        collateral: policyData.adjustmentFactors.collateral,
        business_type: policyData.adjustmentFactors.businessType
      },
      priority: 1,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // Loan Limit Policies
  createLoanLimitPolicy: async (lenderId: string, policyData: {
    name: string;
    businessType: string;
    minAmount: number;
    maxAmount: number;
    creditScoreRequirement: number;
    collateralRequirement: number;
    maxUtilization: number;
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/loan-limits`, {
      name: policyData.name,
      business_type: policyData.businessType,
      min_amount: policyData.minAmount,
      max_amount: policyData.maxAmount,
      credit_score_requirement: policyData.creditScoreRequirement,
      collateral_requirement: policyData.collateralRequirement,
      max_utilization: policyData.maxUtilization,
      priority: 1,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // Eligibility Criteria
  createEligibilityCriteria: async (lenderId: string, policyData: {
    name: string;
    category: string;
    description: string;
    requirement: string;
    minimumValue?: number;
    maximumValue?: number;
    required: boolean;
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/eligibility`, {
      name: policyData.name,
      category: policyData.category,
      description: policyData.description,
      requirement: policyData.requirement,
      minimum_value: policyData.minimumValue,
      maximum_value: policyData.maximumValue,
      is_required: policyData.required,
      priority: 1,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // Risk Assessment Rules
  createRiskAssessmentRule: async (lenderId: string, policyData: {
    factor: string;
    weight: number;
    scoringCriteria: any;
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/risk-assessment`, {
      factor: policyData.factor,
      weight: policyData.weight,
      scoring_criteria: policyData.scoringCriteria,
      priority: 1,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // Repayment Policies
  createRepaymentPolicy: async (lenderId: string, policyData: {
    name: string;
    frequency: string;
    gracePeriod: number;
    lateFee: number;
    penaltyRate: number;
    maxExtensions: number;
    defaultThreshold: number;
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/repayment`, {
      name: policyData.name,
      frequency: policyData.frequency,
      grace_period: policyData.gracePeriod,
      late_fee: policyData.lateFee,
      penalty_rate: policyData.penaltyRate,
      max_extensions: policyData.maxExtensions,
      default_threshold: policyData.defaultThreshold,
      priority: 1,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // Cargo Type Policies
  createCargoTypePolicy: async (lenderId: string, policyData: {
    cargoType: string;
    riskLevel: string;
    riskMultiplier: number;
    maxLoanAmount: number;
    insuranceRequired: boolean;
    specialConditions: string[];
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/cargo-types`, {
      cargo_type: policyData.cargoType,
      risk_level: policyData.riskLevel,
      risk_multiplier: policyData.riskMultiplier,
      max_loan_amount: policyData.maxLoanAmount,
      insurance_required: policyData.insuranceRequired,
      special_conditions: policyData.specialConditions,
      priority: 1,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // System Configuration
  createSystemConfigPolicy: async (lenderId: string, policyData: {
    name: string;
    autoApprovalLimit: number;
    manualReviewThreshold: number;
    maxConcurrentLoans: number;
    totalExposureLimit: number;
    cooldownPeriod: number;
    complianceMode: boolean;
    auditTrail: boolean;
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/system-config`, {
      name: policyData.name,
      auto_approval_limit: policyData.autoApprovalLimit,
      manual_review_threshold: policyData.manualReviewThreshold,
      max_concurrent_loans: policyData.maxConcurrentLoans,
      total_exposure_limit: policyData.totalExposureLimit,
      cooldown_period: policyData.cooldownPeriod,
      compliance_mode: policyData.complianceMode,
      audit_trail: policyData.auditTrail,
      is_active: true
    });
    
    return {
      id: response.data.id,
      ...policyData,
      isActive: true,
      created_at: response.data.created_at
    };
  },

  // Policy Status Management
  updatePolicyStatus: async (lenderId: string, policyType: string, policyId: string, isActive: boolean) => {
    const endpoints = {
      interestRates: 'interest-rates',
      loanLimits: 'loan-limits',
      eligibilityCriteria: 'eligibility',
      riskAssessment: 'risk-assessment',
      repaymentPolicies: 'repayment',
      cargoTypePolicies: 'cargo-types'
    };
    
    const endpoint = endpoints[policyType as keyof typeof endpoints];
    if (!endpoint) {
      throw new Error(`Unknown policy type: ${policyType}`);
    }
    
    const response = await api.patch(`/lending/policies/${lenderId}/${endpoint}/${policyId}/status`, {
      isActive
    });
    
    return response.data;
  },

  // Delete Policy
  deleteLenderPolicy: async (lenderId: string, policyType: string, policyId: string) => {
    const endpoints = {
      interestRates: 'interest-rates',
      loanLimits: 'loan-limits',
      eligibilityCriteria: 'eligibility',
      riskAssessment: 'risk-assessment',
      repaymentPolicies: 'repayment',
      cargoTypePolicies: 'cargo-types'
    };
    
    const endpoint = endpoints[policyType as keyof typeof endpoints];
    if (!endpoint) {
      throw new Error(`Unknown policy type: ${policyType}`);
    }
    
    await api.delete(`/lending/policies/${lenderId}/${endpoint}/${policyId}`);
    return { success: true, message: 'Policy deleted successfully' };
  },

  // Validate Loan Against Policies
  validateLoanAgainstPolicies: async (lenderId: string, loanData: {
    amount: number;
    borrowerData: any;
    cargoType?: string;
    businessType?: string;
  }) => {
    const response = await api.post(`/lending/policies/${lenderId}/validate-loan`, loanData);
    return response.data;
  },
};
