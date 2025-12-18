import api from '../api';

export interface Document {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  documentType: string;
  category: string;
  status: string;
  priority: string;
  documentNumber?: string;
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  issueDate?: string;
  expiryDate?: string;
  isExpired: boolean;
  requiresRenewal: boolean;
  renewalReminderDays: number;
  metadata: Record<string, any>;
  tags: string[];
  verificationData: Record<string, any>;
  versions: DocumentVersion[];
  currentVersion: number;
  accessControl: Record<string, any>;
  auditTrail: AuditTrailEntry[];
  isPublic: boolean;
  isConfidential: boolean;
  encryptionKey?: string;
  ocrData: Record<string, any>;
  digitalSignature?: string;
  complianceInfo: Record<string, any>;
  workflowInfo: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deleted_at?: string;
}

export interface DocumentVersion {
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  changeReason?: string;
  metadata: Record<string, any>;
}

export interface AuditTrailEntry {
  action: string;
  performedBy: string;
  performedAt: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateDocumentRequest {
  entityType: string;
  entityId: string;
  documentType: string;
  category: string;
  title: string;
  description?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  priority?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  sendNotification?: boolean;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  priority?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentFilterRequest {
  entityType?: string;
  entityId?: string;
  documentType?: string;
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DocumentSearchRequest {
  query: string;
  entityTypes?: string[];
  categories?: string[];
  limit?: number;
}

export interface DocumentResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DocumentVerificationRequest {
  verificationData: Record<string, any>;
  notes?: string;
}

export interface DocumentRejectionRequest {
  rejectionReason: string;
  rejectionDetails?: Record<string, any>;
  notes?: string;
}

export interface BulkDocumentUpdateRequest {
  documentIds: string[];
  status: string;
  notes?: string;
}

export class DocumentApiService {
  private readonly baseUrl = '/documents';

  // Helper method to get tenant ID from localStorage
  private getTenantId(): string | null {
    // Try to get from user context first, fallback to localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenantId) {
          return user.tenantId;
        }
      } catch (e) {
        console.warn('Failed to parse user from localStorage:', e);
      }
    }
    
    // Fallback to direct localStorage access
    return localStorage.getItem('tenantId');
  }

  // Helper method to add tenant header to requests
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const tenantId = this.getTenantId();
    
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    
    return headers;
  }

  // Create a new document
  async createDocument(
    createRequest: CreateDocumentRequest,
    file: File
  ): Promise<Document> {
    const formData = new FormData();
    
    // Add file
    formData.append('file', file);
    
    // Add document data
    Object.entries(createRequest).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const response = await api.post(this.baseUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...this.getHeaders(),
      },
    });
    return response.data;
  }

  // Get documents with filtering and pagination
  async getDocuments(filter: DocumentFilterRequest = {}): Promise<DocumentResponse> {
    const params = new URLSearchParams();
    
    // Clean up filter parameters - remove empty/undefined values
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    try {
      const response = await api.get(`${this.baseUrl}?${params.toString()}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      
      // If it's a 500 error, return a safe empty response to avoid UI breakage
      if (error?.response?.status === 500) {
        console.warn('Documents endpoint returned 500. Returning empty list as fallback.');
        return {
          documents: [],
          total: 0,
          page: Number(filter.page) || 1,
          limit: Number(filter.limit) || 20,
          totalPages: 0,
        } as DocumentResponse;
      }
      
      // If unauthorized, return empty list to fail gracefully
      if (error?.response?.status === 401) {
        console.warn('Unauthorized when fetching documents. Returning empty list.');
        return {
          documents: [],
          total: 0,
          page: Number(filter.page) || 1,
          limit: Number(filter.limit) || 20,
          totalPages: 0,
        } as DocumentResponse;
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  // Search documents
  async searchDocuments(searchRequest: DocumentSearchRequest): Promise<Document[]> {
    const params = new URLSearchParams();
    
    Object.entries(searchRequest).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });

    const response = await api.get(`${this.baseUrl}/search?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get documents by entity
  async getDocumentsByEntity(
    entityType: string,
    entityId: string
  ): Promise<Document[]> {
    const response = await api.get(`${this.baseUrl}/entity/${entityType}/${entityId}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get documents expiring soon
  async getDocumentsExpiringSoon(days: number = 30): Promise<Document[]> {
    const response = await api.get(`${this.baseUrl}/expiring?days=${days}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get documents requiring renewal
  async getDocumentsRequiringRenewal(): Promise<Document[]> {
    const response = await api.get(`${this.baseUrl}/renewal`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get document statistics
  async getDocumentStatistics(): Promise<Record<string, any>> {
    try {
      const response = await api.get(`${this.baseUrl}/statistics`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching document statistics:', error);
      
      // If it's a 500 error, return empty statistics
      if (error?.response?.status === 500) {
        console.warn('Document statistics endpoint returned 500, returning empty stats');
        return {
          totalDocuments: 0,
          documentsByStatus: {},
          documentsByCategory: {},
          documentsByType: {},
          recentUploads: [],
        };
      }
      
      throw error;
    }
  }

  // Get document by ID
  async getDocumentById(id: string): Promise<Document> {
    const response = await api.get(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Update document
  async updateDocument(
    id: string,
    updateRequest: UpdateDocumentRequest,
    file?: File
  ): Promise<Document> {
    const formData = new FormData();
    
    // Add file if provided
    if (file) {
      formData.append('file', file);
    }
    
    // Add update data
    Object.entries(updateRequest).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const headers: Record<string, string> = {
      ...this.getHeaders(),
    };
    if (file) {
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await api.put(`${this.baseUrl}/${id}`, formData, { headers });
    return response.data;
  }

  // Verify document
  async verifyDocument(
    id: string,
    verificationRequest: DocumentVerificationRequest
  ): Promise<Document> {
    const response = await api.post(
      `${this.baseUrl}/${id}/verify`,
      verificationRequest,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Reject document
  async rejectDocument(
    id: string,
    rejectionRequest: DocumentRejectionRequest
  ): Promise<Document> {
    const response = await api.post(
      `${this.baseUrl}/${id}/reject`,
      rejectionRequest,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Archive document
  async archiveDocument(id: string): Promise<void> {
    await api.post(`${this.baseUrl}/${id}/archive`, {}, {
      headers: this.getHeaders(),
    });
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  // Bulk update document status
  async bulkUpdateStatus(
    bulkUpdateRequest: BulkDocumentUpdateRequest
  ): Promise<Document[]> {
    const response = await api.post(
      `${this.baseUrl}/bulk/status`,
      bulkUpdateRequest,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  // Download document
  async downloadDocument(id: string): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/download/${id}`, {
      responseType: 'blob',
      headers: this.getHeaders(),
    });
    return response.data;
  }

  // Get document file URL for viewing (uses API endpoint)
  getDocumentViewUrl(documentId: string): string {
    const baseUrl = api.defaults.baseURL || 'http://localhost:3002/api';
    return `${baseUrl}/documents/serve/${documentId}`;
  }

  // Get document preview URL
  getDocumentPreviewUrl(document: Document): string {
    // For images, return the file URL directly
    if (document.mimeType.startsWith('image/')) {
      return document.fileUrl;
    }
    
    // For PDFs and other documents, return the file URL
    // In production, you might want to use a document preview service
    return document.fileUrl;
  }

  // Check if document is expiring soon
  isDocumentExpiringSoon(document: Document, days: number = 30): boolean {
    if (!document.expiryDate) return false;
    
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= days && diffDays > 0;
  }

  // Get document status color
  getDocumentStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      DRAFT: 'text-gray-500',
      PENDING: 'text-yellow-600',
      VERIFIED: 'text-green-600',
      REJECTED: 'text-red-600',
      EXPIRED: 'text-red-800',
      ARCHIVED: 'text-gray-600',
      DELETED: 'text-gray-400',
    };
    
    return statusColors[status] || 'text-gray-500';
  }

  // Get document priority color
  getDocumentPriorityColor(priority: string): string {
    const priorityColors: Record<string, string> = {
      LOW: 'text-gray-500',
      NORMAL: 'text-blue-600',
      HIGH: 'text-orange-600',
      URGENT: 'text-red-600',
      CRITICAL: 'text-red-800',
    };
    
    return priorityColors[priority] || 'text-gray-500';
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file type icon
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    if (mimeType.startsWith('text/')) return '📄';
    
    return '📎';
  }
}

export const documentApi = new DocumentApiService();
