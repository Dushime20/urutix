import axios from 'axios';
import { config } from '../config/environment';

const API_BASE_URL = config.api.baseUrl || 'http://localhost:3001';

// Create axios instance with auth interceptor
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserKycSubmissionData {
  // Personal Information
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  
  // Contact Information
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  
  // Business Information (for business roles)
  companyName?: string;
  businessType?: string;
  businessRegistrationNumber?: string;
  taxId?: string;
  businessAddress?: string;
  
  // Financial Information
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  annualIncome?: number;
  
  // Professional Information
  licenseNumber?: string;
  licenseExpiryDate?: string;
  yearsOfExperience?: number;
  previousEmployer?: string;
  
  // Role-specific data
  roleSpecificData?: Record<string, any>;
}

export interface UserKycDocument {
  id: string;
  documentType: string;
  documentCategory: string;
  documentName: string;
  verified: boolean;
  verifiedAt?: string;
  expiryDate?: string;
  notes?: string;
  createdAt: string;
}

export interface KycRequirements {
  id: string;
  role: string;
  requirementLevel: 'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM';
  requiredDocuments: string[];
  optionalDocuments: string[];
  verificationSteps: string[];
  autoApprovalEligible: boolean;
  description?: string;
}

export interface UserKycProfile {
  id: string;
  kycStatus: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  kycRequirementLevel: 'BASIC' | 'STANDARD' | 'ENHANCED' | 'PREMIUM';
  kycSubmittedAt?: string;
  kycVerifiedAt?: string;
  kycNotes?: string;
  identityVerified: boolean;
  addressVerified: boolean;
  financialVerified: boolean;
  businessVerified: boolean;
  backgroundCheckCompleted: boolean;
  complianceScore: number;
  kycData: Record<string, any>;
  firstName?: string;
  lastName?: string;
  user?: {
    email: string;
    role: string;
  };
}

export interface KycStats {
  total: number;
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
  byRole?: Record<string, number>;
}

export const userKycApi = {
  // User endpoints
  async submitKyc(kycData: UserKycSubmissionData) {
    const response = await apiClient.post('/user-kyc/submit', kycData);
    return response.data;
  },

  async getMyKyc() {
    const response = await apiClient.get('/user-kyc/my-kyc');
    return response.data;
  },

  async getKycRequirements(role: string): Promise<{ data: KycRequirements }> {
    const response = await apiClient.get(`/user-kyc/requirements/${role}`);
    return response.data;
  },

  async uploadDocument(file: File, documentData: {
    documentType: string;
    documentCategory: string;
    expiryDate?: string;
    metadata?: Record<string, any>;
  }) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentData.documentType);
    formData.append('documentCategory', documentData.documentCategory);
    
    if (documentData.expiryDate) {
      formData.append('expiryDate', documentData.expiryDate);
    }
    
    if (documentData.metadata) {
      formData.append('metadata', JSON.stringify(documentData.metadata));
    }

    const response = await apiClient.post('/user-kyc/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMyDocuments(): Promise<{ data: UserKycDocument[] }> {
    const response = await apiClient.get('/user-kyc/documents');
    return response.data;
  },

  async getMyAuditLog() {
    const response = await apiClient.get('/user-kyc/audit-log');
    return response.data;
  },

  // Admin endpoints
  async getUsersByKycStatus(status: string, role?: string): Promise<{ data: UserKycProfile[] }> {
    const params = new URLSearchParams({ status });
    if (role) params.append('role', role);
    
    const response = await apiClient.get(`/user-kyc/admin/users?${params}`);
    return response.data;
  },

  async getKycStats(role?: string): Promise<{ data: KycStats }> {
    const params = role ? `?role=${role}` : '';
    const response = await apiClient.get(`/user-kyc/admin/stats${params}`);
    return response.data;
  },

  async updateUserKycStatus(userId: string, status: string, notes?: string) {
    const response = await apiClient.put(`/user-kyc/${userId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  async verifyDocument(documentId: string, verified: boolean, notes?: string) {
    const response = await apiClient.put(`/user-kyc/documents/${documentId}/verify`, {
      verified,
      notes,
    });
    return response.data;
  },

  async getUserKycProfile(userId: string) {
    const response = await apiClient.get(`/user-kyc/${userId}/profile`);
    return response.data;
  },
};