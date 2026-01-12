import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText } from 'lucide-react';
import { documentApi } from '../../services/documents/documentApi';
import type { CreateDocumentRequest } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import EntitySelector from './EntitySelector';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  initialEntityType?: string;
  initialEntityId?: string | null;
  lockEntity?: boolean;
}

// Map document type to category for automatic categorization
const getCategoryFromDocumentType = (docType: string): string => {
  if (docType.startsWith('DRIVER_')) return 'DRIVER';
  if (docType.startsWith('VEHICLE_')) return 'VEHICLE';
  if (docType.startsWith('CARGO_')) return 'CARGO';
  if (docType.startsWith('TRIP_') || docType === 'POD') return 'TRIP';
  if (docType.startsWith('BUSINESS_')) return 'BUSINESS';
  if (['INVOICE', 'RECEIPT', 'PAYMENT_PROOF', 'EXPENSE_RECEIPT'].includes(docType)) return 'FINANCIAL';
  if (['SAFETY_CERT', 'ENVIRONMENTAL_CERT', 'QUALITY_CERT'].includes(docType)) return 'COMPLIANCE';
  if (['CONTRACT', 'AGREEMENT', 'POLICY'].includes(docType)) return 'LEGAL';
  if (['USER_ID_PROOF', 'USER_ADDRESS_PROOF', 'USER_BANK_DETAILS'].includes(docType)) return 'IDENTITY';
  return 'OTHER';
};

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialEntityType = 'CARGO',
  initialEntityId = '',
  lockEntity = false,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadForm, setUploadForm] = useState<Partial<CreateDocumentRequest>>({
    entityType: initialEntityType,
    entityId: initialEntityId || '',
    category: initialEntityType,
    documentType: 'OTHER',
    priority: 'NORMAL',
  });

  useEffect(() => {
    if (isOpen) {
      setUploadForm({
        entityType: initialEntityType,
        entityId: initialEntityId || '',
        category: initialEntityType,
        documentType: 'OTHER',
        priority: 'NORMAL',
      });
      setSelectedFile(null);
    }
  }, [isOpen, initialEntityType, initialEntityId]);

  const uploadMutation = useMutation({
    mutationFn: (data: { request: CreateDocumentRequest; file: File }) =>
      documentApi.createDocument(data.request, data.file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
      toast.success(`Document "${data.title || 'uploaded'}" uploaded successfully!`);
      onSuccess?.(data);
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload document';
      toast.error(errorMessage);
    },
  });

  const validateAndSetFile = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }
    const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      toast.error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    setSelectedFile(file);
    if (!uploadForm.title) {
        setUploadForm(prev => ({ ...prev, title: file.name.split('.')[0] }));
    }
  }, [uploadForm.title]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const handleUpload = () => {
    if (!selectedFile || !uploadForm.title || !uploadForm.entityId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isValidUUID(uploadForm.entityId)) {
      toast.error('Invalid Entity ID format');
      return;
    }

    const cleanRequest: CreateDocumentRequest = {
      entityType: uploadForm.entityType || 'CARGO',
      entityId: uploadForm.entityId.trim(),
      documentType: uploadForm.documentType || 'OTHER',
      category: uploadForm.category || uploadForm.entityType || 'CARGO',
      title: uploadForm.title || '',
      priority: uploadForm.priority || 'NORMAL',
      description: uploadForm.description,
      expiryDate: uploadForm.expiryDate,
    };

    uploadMutation.mutate({
      request: cleanRequest,
      file: selectedFile,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Upload New Document</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
            disabled={uploadMutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">File *</label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{documentApi.formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-2 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-gray-400" />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 font-medium"
                      type="button"
                    >
                      Click to upload
                    </button>
                    <p className="text-xs text-gray-400">PDF, DOC, JPG, PNG (MAX. 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={uploadForm.title || ''}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
                placeholder="Document title"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Entity Type *</label>
              <select
                value={uploadForm.entityType || ''}
                onChange={(e) => {
                  if (!lockEntity) {
                    setUploadForm(prev => ({ ...prev, entityType: e.target.value, entityId: '' }));
                  }
                }}
                className={`w-full border border-gray-300 rounded-lg p-1.5 text-sm ${lockEntity ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={lockEntity}
              >
                <option value="CARGO">Cargo</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="DRIVER">Driver</option>
                <option value="TRIP">Trip</option>
                <option value="USER">User</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Entity *</label>
              <EntitySelector
                entityType={uploadForm.entityType || 'CARGO'}
                value={uploadForm.entityId}
                onChange={(entity) => {
                  if (entity) {
                    setUploadForm(prev => ({ ...prev, entityId: entity.id }));
                  } else {
                    setUploadForm(prev => ({ ...prev, entityId: '' }));
                  }
                }}
                disabled={lockEntity}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Document Type</label>
              <select
                value={uploadForm.documentType || 'OTHER'}
                onChange={(e) => {
                  const docType = e.target.value;
                  const category = getCategoryFromDocumentType(docType);
                  setUploadForm(prev => ({ ...prev, documentType: docType, category }));
                }}
                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
              >
                <optgroup label="Cargo Documents">
                  <option value="CARGO_MANIFEST">Cargo Manifest</option>
                  <option value="CARGO_INSURANCE">Cargo Insurance</option>
                  <option value="CARGO_CUSTOMS">Cargo Customs</option>
                  <option value="CARGO_WEIGHT_CERT">Cargo Weight Certificate</option>
                </optgroup>
                <optgroup label="Financial Documents">
                  <option value="INVOICE">Invoice</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="PAYMENT_PROOF">Payment Proof</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="POD">Proof of Delivery (POD)</option>
                  <option value="OTHER">Other</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={uploadForm.priority || 'NORMAL'}
                onChange={(e) => setUploadForm(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg p-1.5 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={uploadMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !uploadForm.title || !uploadForm.entityId || uploadMutation.isPending}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
