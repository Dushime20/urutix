import api from './api';
import type { PendingDocument } from '../components/CargoDashboard/DocumentUploadSection';

export interface DocumentUploadResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  results: DocumentUploadResult[];
}

/**
 * Map a frontend documentType string to a backend DocumentType enum value.
 * The backend POST /loads/:loadId/documents endpoint requires the `type` field
 * to be a valid DocumentType enum value.
 */
const toBackendDocumentType = (frontendType: string): string => {
  const VALID_TYPES = new Set([
    'DRIVER_LICENSE', 'DRIVER_MEDICAL_CERT', 'DRIVER_DRUG_TEST',
    'DRIVER_BACKGROUND_CHECK', 'DRIVER_TRAINING_CERT', 'DRIVER_INSURANCE',
    'VEHICLE_REGISTRATION', 'VEHICLE_INSURANCE', 'VEHICLE_INSPECTION',
    'VEHICLE_MAINTENANCE', 'VEHICLE_PERMIT',
    'CARGO_MANIFEST', 'CARGO_INSURANCE', 'CARGO_CUSTOMS', 'CARGO_WEIGHT_CERT',
    'BUSINESS_LICENSE', 'BUSINESS_INSURANCE', 'BUSINESS_TAX_CERT', 'BUSINESS_PERMIT',
    'USER_ID_PROOF', 'USER_ADDRESS_PROOF', 'USER_BANK_DETAILS',
    'TRIP_PERMIT', 'TRIP_ROUTE_PLAN', 'TRIP_WEIGHT_TICKET', 'POD',
    'INVOICE', 'RECEIPT', 'PAYMENT_PROOF', 'EXPENSE_RECEIPT',
    'SAFETY_CERT', 'ENVIRONMENTAL_CERT', 'QUALITY_CERT',
    'CONTRACT', 'AGREEMENT', 'POLICY', 'MANUAL', 'OTHER',
  ]);
  return VALID_TYPES.has(frontendType) ? frontendType : 'OTHER';
};

/**
 * Upload a single document for a cargo/load.
 * Uses the load-specific endpoint POST /loads/:loadId/documents which
 * the backend controller already supports.
 */
export const uploadCargoDocument = async (
  loadId: string,
  document: PendingDocument
): Promise<DocumentUploadResult> => {
  try {
    const formData = new FormData();

    formData.append('file', document.file);
    formData.append('type', toBackendDocumentType(document.documentType));

    if (document.description) {
      formData.append('description', document.description);
    }

    // Pass title, category, priority as JSON metadata so they're preserved
    const metadata: Record<string, any> = {
      title: document.title,
      category: document.category,
      ...(document.priority && { priority: document.priority }),
    };
    formData.append('metadata', JSON.stringify(metadata));

    const response = await api.post(`/loads/${loadId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return {
      success: true,
      documentId: response.data?.document?.id || response.data?.id,
    };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to upload document',
    };
  }
};

/**
 * Upload multiple documents for a cargo/load
 */
export const uploadCargoDocuments = async (
  loadId: string,
  documents: PendingDocument[],
  onProgress?: (current: number, total: number) => void
): Promise<BulkUploadResult> => {
  const results: DocumentUploadResult[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    
    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, documents.length);
    }

    const result = await uploadCargoDocument(loadId, document);
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return {
    total: documents.length,
    successful,
    failed,
    results,
  };
};

/**
 * Upload documents with retry logic
 */
export const uploadCargoDocumentsWithRetry = async (
  loadId: string,
  documents: PendingDocument[],
  maxRetries: number = 2,
  onProgress?: (current: number, total: number, status: string) => void
): Promise<BulkUploadResult> => {
  const results: DocumentUploadResult[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i];
    let result: DocumentUploadResult | null = null;
    let retries = 0;

    // Try uploading with retries
    while (retries <= maxRetries && (!result || !result.success)) {
      if (onProgress) {
        const status = retries === 0 
          ? `Uploading ${document.title}...` 
          : `Retrying ${document.title} (${retries}/${maxRetries})...`;
        onProgress(i + 1, documents.length, status);
      }

      result = await uploadCargoDocument(loadId, document);

      if (!result.success && retries < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        retries++;
      } else {
        break;
      }
    }

    results.push(result!);

    if (result!.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return {
    total: documents.length,
    successful,
    failed,
    results,
  };
};

/**
 * Validate document before upload
 */
export const validateDocument = (
  document: PendingDocument,
  maxFileSize: number = 10 * 1024 * 1024 // 10MB
): { valid: boolean; error?: string } => {
  // Check file size
  if (document.file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`,
    };
  }

  // Check required fields
  if (!document.title || document.title.trim() === '') {
    return {
      valid: false,
      error: 'Document title is required',
    };
  }

  if (!document.documentType) {
    return {
      valid: false,
      error: 'Document type is required',
    };
  }

  if (!document.category) {
    return {
      valid: false,
      error: 'Document category is required',
    };
  }

  return { valid: true };
};

/**
 * Get document upload progress message
 */
export const getUploadProgressMessage = (
  current: number,
  total: number,
  successful: number,
  failed: number
): string => {
  if (current === total) {
    if (failed === 0) {
      return `All ${successful} documents uploaded successfully`;
    } else if (successful === 0) {
      return `Failed to upload ${failed} documents`;
    } else {
      return `Uploaded ${successful} of ${total} documents (${failed} failed)`;
    }
  }
  return `Uploading documents: ${current}/${total}`;
};
