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
 * Upload a single document for a cargo/load
 */
export const uploadCargoDocument = async (
  loadId: string,
  document: PendingDocument
): Promise<DocumentUploadResult> => {
  try {
    const formData = new FormData();
    
    // Add file
    formData.append('file', document.file);
    
    // Add metadata
    formData.append('entityType', 'CARGO');
    formData.append('entityId', loadId);
    formData.append('documentType', document.documentType);
    formData.append('category', document.category);
    formData.append('title', document.title);
    formData.append('fileName', document.file.name);
    formData.append('originalFileName', document.file.name);
    formData.append('fileSize', document.file.size.toString());
    formData.append('mimeType', document.file.type);
    
    // Add optional fields
    if (document.description) {
      formData.append('description', document.description);
    }
    if (document.priority) {
      formData.append('priority', document.priority);
    }
    if (document.issueDate) {
      formData.append('issueDate', document.issueDate);
    }
    if (document.expiryDate) {
      formData.append('expiryDate', document.expiryDate);
    }
    if (document.requiresRenewal !== undefined) {
      formData.append('requiresRenewal', document.requiresRenewal.toString());
    }
    if (document.tags && document.tags.length > 0) {
      formData.append('tags', JSON.stringify(document.tags));
    }

    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      success: true,
      documentId: response.data?.id || response.data?.data?.id,
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
