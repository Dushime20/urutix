import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // Hide header when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';

      // Add a style tag to hide the header
      const styleTag = document.createElement('style');
      styleTag.id = 'document-upload-modal-style';
      styleTag.innerHTML = `
        .modal-open [data-header="dashboard-header"],
        .modal-open header,
        .modal-open nav {
          display: none !important;
        }
      `;
      document.head.appendChild(styleTag);

      return () => {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        const existingStyle = document.getElementById('document-upload-modal-style');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Upload Document</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Add a new file to your repository</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center group"
            disabled={uploadMutation.isPending}
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* File Upload Area */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">File Attachment *</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[1.5rem] p-8 text-center transition-all duration-200 group ${dragActive
                ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/30'
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
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 shadow-sm">
                    <FileText className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                    <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wide">{documentApi.formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="mt-2 px-4 py-2 bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 text-slate-400 group-hover:text-blue-500 group-hover:border-blue-200 flex items-center justify-center shadow-sm transition-all group-hover:scale-110">
                    <Upload className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      PDF, DOC, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Document Title *</label>
              <input
                type="text"
                value={uploadForm.title || ''}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                placeholder="Enter document title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Entity Type *</label>
                <div className="relative">
                  <select
                    value={uploadForm.entityType || ''}
                    onChange={(e) => {
                      if (!lockEntity) {
                        setUploadForm(prev => ({ ...prev, entityType: e.target.value, entityId: '' }));
                      }
                    }}
                    className={`w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm ${lockEntity ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                    disabled={lockEntity}
                  >
                    <option value="CARGO">Cargo</option>
                    <option value="VEHICLE">Vehicle</option>
                    <option value="DRIVER">Driver</option>
                    <option value="TRIP">Trip</option>
                    <option value="USER">User</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <select
                  value={uploadForm.priority || 'NORMAL'}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Target Entity *</label>
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
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
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Document Type</label>
              <select
                value={uploadForm.documentType || 'OTHER'}
                onChange={(e) => {
                  const docType = e.target.value;
                  const category = getCategoryFromDocumentType(docType);
                  setUploadForm(prev => ({ ...prev, documentType: docType, category }));
                }}
                className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              >
                {uploadForm.entityType === 'DRIVER' && (
                  <optgroup label="Driver Documents">
                    <option value="DRIVER_LICENSE">Driver License</option>
                    <option value="DRIVER_ID">Driver ID</option>
                    <option value="DRIVER_MEDICAL_CERT">Medical Certificate</option>
                    <option value="DRIVER_TRAINING_CERT">Training Certificate</option>
                    <option value="DRIVER_BACKGROUND_CHECK">Background Check</option>
                    <option value="DRIVER_DRUG_TEST">Drug Test Results</option>
                    <option value="DRIVER_CONTRACT">Employment Contract</option>
                    <option value="DRIVER_PHOTO">Driver Photo</option>
                  </optgroup>
                )}
                {/* ... existing types ... */}
                <optgroup label="Financial Documents">
                  <option value="INVOICE">Invoice</option>
                  <option value="RECEIPT">Receipt</option>
                  <option value="PAYMENT_PROOF">Payment Proof</option>
                </optgroup>
                <optgroup label="General">
                  <option value="CONTRACT">Contract</option>
                  <option value="AGREEMENT">Agreement</option>
                  <option value="OTHER">Other</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-50 bg-slate-50/50 rounded-b-[2rem]">
          <button
            onClick={onClose}
            className="h-12 px-6 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm transition-all"
            disabled={uploadMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !uploadForm.title || !uploadForm.entityId || uploadMutation.isPending}
            className="h-12 px-8 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] hover:shadow-lg hover:shadow-blue-900/10 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DocumentUploadModal;
