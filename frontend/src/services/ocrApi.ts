import api from './api';

export interface OcrExtractionResult {
  text: string;
  confidence?: number;
  extractedData?: any;
  documentType?: string;
}

export interface DocumentUploadResult {
  text: string;
  confidence: number;
  extractedData?: any;
  documentType?: string;
}

export const ocrApi = {
  // Extract text from URL
  async extractFromUrl(url: string): Promise<OcrExtractionResult> {
    const response = await api.post('/ocr/extract', { url });
    return response.data;
  },

  // Upload file and extract text
  async uploadAndExtract(file: File): Promise<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/ocr/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Extract specific document data
  async extractDocumentData(url: string, documentType: string): Promise<OcrExtractionResult> {
    const response = await api.post('/ocr/extract-document', { url, documentType });
    return response.data;
  },

  // Upload and extract document data
  async uploadAndExtractDocument(file: File, documentType: string): Promise<DocumentUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    const response = await api.post('/ocr/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
