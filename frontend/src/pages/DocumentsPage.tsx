import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, Search, Eye, Trash2, Download, FileText, Box, Truck, CreditCard, X, Upload } from 'lucide-react';
import { documentApi } from '../services/documents/documentApi';
import type { CreateDocumentRequest } from '../services/documents/documentApi';
import toast from 'react-hot-toast';

interface DocumentsPageProps {
  entityTypeOverride?: string;
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ entityTypeOverride }) => {
  const { entityType: urlEntityType, entityId } = useParams();
  const entityType = entityTypeOverride || urlEntityType;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState<Partial<CreateDocumentRequest>>({
    entityType: entityType || 'CARGO',
    category: entityType || 'CARGO',
    documentType: 'OTHER',
    priority: 'NORMAL',
  });
  const [filters, setFilters] = useState({
    entityType: entityType || '',
    category: entityType || '',
    status: '',
    priority: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Update filters when URL params change
  useEffect(() => {
    if (entityType) {
      setFilters(prev => ({ ...prev, entityType, category: entityType }));
      setUploadForm(prev => ({ ...prev, entityType, category: entityType }));
    }
    // Auto-populate entityId from URL if available
    if (entityId) {
      setUploadForm(prev => ({ ...prev, entityId }));
    }
  }, [entityType, entityId]);

  // Get entity display name and icon
  const getEntityInfo = (type: string) => {
    const entityInfo = {
      CARGO: { name: 'Cargo', icon: Box, color: 'text-blue-600' },
      TRIP: { name: 'Trip', icon: Truck, color: 'text-green-600' },
      FINANCIAL: { name: 'Financial', icon: CreditCard, color: 'text-purple-600' },
      DRIVER: { name: 'Driver', icon: Truck, color: 'text-orange-600' },
      VEHICLE: { name: 'Vehicle', icon: Truck, color: 'text-red-600' },
      USER: { name: 'User', icon: FileText, color: 'text-gray-600' },
    };
    return entityInfo[type as keyof typeof entityInfo] || { name: 'Document', icon: FileText, color: 'text-gray-600' };
  };

  const entityInfo = getEntityInfo(entityType || 'CARGO');
  const EntityIcon = entityInfo.icon;

  // Fetch documents
  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', filters, currentPage],
    queryFn: () => documentApi.getDocuments({
      ...filters,
      page: currentPage,
      limit: 20,
    }),
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Fetch document statistics
  const { data: statistics } = useQuery({
    queryKey: ['documentStatistics'],
    queryFn: () => documentApi.getDocumentStatistics(),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 10 * 60 * 1000, // Statistics can be cached longer
  });

  // Provide fallback data if API fails
  const safeDocumentsData = documentsData || {
    documents: [],
    total: 0,
    page: currentPage,
    limit: 20,
    totalPages: 0,
  };

  const safeStatistics = statistics || {
    totalDocuments: 0,
    documentsByStatus: {},
    documentsByCategory: {},
    documentsByType: {},
    recentUploads: [],
  };

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: (data: { request: CreateDocumentRequest; file: File }) =>
      documentApi.createDocument(data.request, data.file),
    onSuccess: (data) => {
      // Invalidate all document-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
      
      // Show success notification
      toast.success(`Document "${data.title || 'uploaded'}" uploaded successfully!`, {
        duration: 4000,
        icon: '✅',
      });
      
      // Close modal and reset form
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadForm({
        entityType: entityType || 'CARGO',
        category: entityType || 'CARGO',
        documentType: 'OTHER', // Always reset to valid enum value
        priority: 'NORMAL',
        title: undefined,
        entityId: entityId || undefined, // Keep entityId if from URL
      });
      
      // Refetch documents to show the new document immediately
      refetch();
    },
    onError: (error: any) => {
      // Show error notification
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to upload document';
      toast.error(errorMessage, {
        duration: 5000,
        icon: '❌',
      });
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
      toast.success('Document deleted successfully', {
        duration: 3000,
        icon: '🗑️',
      });
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete document';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌',
      });
    },
  });

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => documentApi.deleteDocument(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
      toast.success(`${selectedDocuments.length} document(s) deleted successfully`, {
        duration: 3000,
        icon: '🗑️',
      });
      setSelectedDocuments([]);
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete documents';
      toast.error(errorMessage, {
        duration: 4000,
        icon: '❌',
      });
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Don't auto-fill documentType as it should be selected by user
      // The backend enum doesn't have PDF_DOCUMENT or IMAGE types
    }
  }, []);

  // UUID validation function
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Handle upload
  const handleUpload = useCallback(() => {
    if (!selectedFile) {
      toast.error('Please select a file to upload', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }
    
    if (!uploadForm.title) {
      toast.error('Please enter a document title', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }
    
    if (!uploadForm.entityId) {
      toast.error('Please enter an entity ID', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }
    
    // Validate UUID format
    if (!isValidUUID(uploadForm.entityId.trim())) {
      toast.error('Entity ID must be a valid UUID format (e.g., 550e8400-e29b-41d4-a716-446655440000)', {
        duration: 5000,
        icon: '⚠️',
      });
      return;
    }
    
    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit. Please choose a smaller file.', {
        duration: 4000,
        icon: '⚠️',
      });
      return;
    }
    
    // Ensure documentType is set to a valid value (default to 'OTHER' if not set or invalid)
    const validDocumentTypes = [
      'DRIVER_LICENSE', 'DRIVER_MEDICAL_CERT', 'DRIVER_DRUG_TEST', 'DRIVER_BACKGROUND_CHECK', 
      'DRIVER_TRAINING_CERT', 'DRIVER_INSURANCE', 'VEHICLE_REGISTRATION', 'VEHICLE_INSURANCE', 
      'VEHICLE_INSPECTION', 'VEHICLE_MAINTENANCE', 'VEHICLE_PERMIT', 'CARGO_MANIFEST', 
      'CARGO_INSURANCE', 'CARGO_CUSTOMS', 'CARGO_WEIGHT_CERT', 'TRIP_PERMIT', 'TRIP_ROUTE_PLAN', 
      'TRIP_WEIGHT_TICKET', 'POD', 'INVOICE', 'RECEIPT', 'PAYMENT_PROOF', 'EXPENSE_RECEIPT', 
      'BUSINESS_LICENSE', 'BUSINESS_INSURANCE', 'BUSINESS_TAX_CERT', 'BUSINESS_PERMIT', 
      'SAFETY_CERT', 'ENVIRONMENTAL_CERT', 'QUALITY_CERT', 'CONTRACT', 'AGREEMENT', 'POLICY', 
      'USER_ID_PROOF', 'USER_ADDRESS_PROOF', 'USER_BANK_DETAILS', 'MANUAL', 'OTHER'
    ];
    
    const documentType = uploadForm.documentType && validDocumentTypes.includes(uploadForm.documentType)
      ? uploadForm.documentType
      : 'OTHER';
    
    // Create a clean request object with only valid values - explicitly set documentType
    const cleanRequest: CreateDocumentRequest = {
      entityType: uploadForm.entityType || 'CARGO',
      entityId: uploadForm.entityId.trim(),
      documentType: documentType, // Always use validated documentType (never PDF_DOCUMENT or IMAGE)
      category: uploadForm.category || uploadForm.entityType || 'CARGO',
      title: uploadForm.title || '',
      priority: uploadForm.priority || 'NORMAL',
      description: uploadForm.description,
      expiryDate: uploadForm.expiryDate,
      tags: uploadForm.tags,
      metadata: uploadForm.metadata,
      sendNotification: uploadForm.sendNotification,
    };
    
    // Debug: Log to ensure we're not sending invalid values
    if (!validDocumentTypes.includes(cleanRequest.documentType)) {
      console.error('Invalid documentType detected:', cleanRequest.documentType);
      toast.error('Invalid document type. Please select a valid document type.', {
        duration: 4000,
        icon: '⚠️',
      });
      return;
    }
    
    uploadMutation.mutate({
      request: cleanRequest,
      file: selectedFile,
    });
  }, [selectedFile, uploadForm, uploadMutation]);

  // Handle document selection
  const handleDocumentSelect = useCallback((documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocuments(prev => [...prev, documentId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    }
  }, []);

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedDocuments.length > 0) {
      if (window.confirm(`Are you sure you want to delete ${selectedDocuments.length} documents?`)) {
        bulkDeleteMutation.mutate(selectedDocuments);
      }
    }
  }, [selectedDocuments, bulkDeleteMutation]);

  // Handle filter change
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  // Handle select all documents
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedDocuments(safeDocumentsData.documents.map(d => d.id) || []);
    } else {
      setSelectedDocuments([]);
    }
  }, [safeDocumentsData.documents]);
  
  // Use handleSelectAll in the checkbox
  const handleSelectAllChange = (checked: boolean) => {
    handleSelectAll(checked);
  };

  // Check if all documents are selected
  const allSelected = selectedDocuments.length > 0 && selectedDocuments.length === (safeDocumentsData.documents.length || 0);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Error Loading Documents
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="mb-3">{error.message}</p>
                
                {/* Provide specific guidance based on error type */}
                {error.message?.includes('Tenant ID not found') && (
                  <div className="bg-red-100 p-3 rounded-md mb-3">
                    <p className="font-medium">Authentication Issue:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Please ensure you are logged in</li>
                      <li>Check if your session has expired</li>
                      <li>Try refreshing the page or logging in again</li>
                    </ul>
                  </div>
                )}
                
                {error.message?.includes('Server error') && (
                  <div className="bg-red-100 p-3 rounded-md mb-3">
                    <p className="font-medium">Server Issue:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>The documents service may be temporarily unavailable</li>
                      <li>Please try again in a few moments</li>
                      <li>Contact support if the issue persists</li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => refetch()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-gray-100 ${entityInfo.color}`}>
              <EntityIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {entityType ? `${entityInfo.name} Documents` : 'Document Management'}
              </h1>
              <p className="text-gray-600">
                {entityType 
                  ? `Manage all ${entityInfo.name.toLowerCase()} documents and files`
                  : 'Manage all documents across the platform'
                }
              </p>
            </div>
          </div>
          {entityType && (
            <div className="text-sm text-gray-500">
              Entity Type: <span className="font-medium text-gray-700">{entityType}</span>
              {entityId && (
                <> • ID: <span className="font-medium text-gray-700">{entityId}</span></>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? '...' : safeStatistics.totalDocuments || 0}
          </div>
          <div className="text-gray-600">Total Documents</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {isLoading ? '...' : safeStatistics.documentsByStatus?.PENDING || 0}
          </div>
          <div className="text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? '...' : safeStatistics.documentsByStatus?.VERIFIED || 0}
          </div>
          <div className="text-gray-600">Verified</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-red-600">
            {isLoading ? '...' : safeStatistics.documentsByStatus?.EXPIRED || 0}
          </div>
          <div className="text-gray-600">Expired</div>
        </div>
      </div>
      
      {/* Show warning if using fallback data */}
      {!statistics && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-yellow-800">
              Statistics temporarily unavailable. Showing default values.
            </span>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
            >
              <option value="">All Entity Types</option>
              <option value="DRIVER">Driver</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="CARGO">Cargo</option>
              <option value="TRIP">Trip</option>
              <option value="USER">User</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="DRIVER">Driver</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="CARGO">Cargo</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="FINANCIAL">Financial</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocuments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-800">
              {selectedDocuments.length} document(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => handleSelectAllChange(e.target.checked)}
                    checked={allSelected}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Loading documents...
                  </td>
                </tr>
              ) : safeDocumentsData.documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No documents found
                  </td>
                </tr>
              ) : (
                safeDocumentsData.documents.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedDocuments.includes(document.id)}
                        onChange={(e) => handleDocumentSelect(document.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-lg">{documentApi.getFileTypeIcon(document.mimeType)}</span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {document.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {documentApi.formatFileSize(document.fileSize)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{document.documentType}</div>
                      <div className="text-sm text-gray-500">{document.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${documentApi.getDocumentStatusColor(document.status)}`}>
                        {document.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${documentApi.getDocumentPriorityColor(document.priority)}`}>
                        {document.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {document.expiryDate ? (
                        <div>
                          <div>{new Date(document.expiryDate).toLocaleDateString()}</div>
                          {document.isExpired && (
                            <span className="text-red-600 text-xs">Expired</span>
                          )}
                          {document.requiresRenewal && (
                            <span className="text-yellow-600 text-xs">Renewal Required</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(document.fileUrl, '_blank')}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => documentApi.downloadDocument(document.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(document.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {safeDocumentsData.totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: safeDocumentsData.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(safeDocumentsData.totalPages, prev + 1))}
              disabled={currentPage === safeDocumentsData.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
                  <p className="text-gray-600 mt-1">Add a new document to your collection</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={uploadMutation.isPending}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-5">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File *
                  </label>
                  <div className="mt-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, TXT (MAX. 10MB)</p>
                      </div>
                      <input
                        type="file"
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                        disabled={uploadMutation.isPending}
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">{selectedFile.name}</p>
                            <p className="text-xs text-blue-700">{documentApi.formatFileSize(selectedFile.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={uploadMutation.isPending}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title || ''}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter document title"
                    disabled={uploadMutation.isPending}
                  />
                </div>

                {/* Entity Type and Entity ID in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entity Type
                    </label>
                    <select
                      value={uploadForm.entityType || ''}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, entityType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      disabled={uploadMutation.isPending}
                    >
                      <option value="DRIVER">Driver</option>
                      <option value="VEHICLE">Vehicle</option>
                      <option value="CARGO">Cargo</option>
                      <option value="TRIP">Trip</option>
                      <option value="USER">User</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entity ID *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.entityId || ''}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, entityId: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        uploadForm.entityId && !isValidUUID(uploadForm.entityId.trim())
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
                      disabled={uploadMutation.isPending}
                    />
                    {uploadForm.entityId && !isValidUUID(uploadForm.entityId.trim()) && (
                      <p className="mt-1 text-xs text-red-600">
                        Invalid UUID format. Must be in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                      </p>
                    )}
                    {entityId && (
                      <p className="mt-1 text-xs text-gray-500">
                        Current entity ID from URL: {entityId}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter the UUID of the {uploadForm.entityType?.toLowerCase() || 'entity'} this document belongs to
                    </p>
                  </div>
                </div>

                {/* Document Type and Priority in Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={uploadForm.documentType || 'OTHER'}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, documentType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      disabled={uploadMutation.isPending}
                    >
                      <optgroup label="Driver Documents">
                        <option value="DRIVER_LICENSE">Driver License</option>
                        <option value="DRIVER_MEDICAL_CERT">Driver Medical Certificate</option>
                        <option value="DRIVER_DRUG_TEST">Driver Drug Test</option>
                        <option value="DRIVER_BACKGROUND_CHECK">Driver Background Check</option>
                        <option value="DRIVER_TRAINING_CERT">Driver Training Certificate</option>
                        <option value="DRIVER_INSURANCE">Driver Insurance</option>
                      </optgroup>
                      <optgroup label="Vehicle Documents">
                        <option value="VEHICLE_REGISTRATION">Vehicle Registration</option>
                        <option value="VEHICLE_INSURANCE">Vehicle Insurance</option>
                        <option value="VEHICLE_INSPECTION">Vehicle Inspection</option>
                        <option value="VEHICLE_MAINTENANCE">Vehicle Maintenance</option>
                        <option value="VEHICLE_PERMIT">Vehicle Permit</option>
                      </optgroup>
                      <optgroup label="Cargo Documents">
                        <option value="CARGO_MANIFEST">Cargo Manifest</option>
                        <option value="CARGO_INSURANCE">Cargo Insurance</option>
                        <option value="CARGO_CUSTOMS">Cargo Customs</option>
                        <option value="CARGO_WEIGHT_CERT">Cargo Weight Certificate</option>
                      </optgroup>
                      <optgroup label="Trip Documents">
                        <option value="TRIP_PERMIT">Trip Permit</option>
                        <option value="TRIP_ROUTE_PLAN">Trip Route Plan</option>
                        <option value="TRIP_WEIGHT_TICKET">Trip Weight Ticket</option>
                        <option value="POD">Proof of Delivery (POD)</option>
                      </optgroup>
                      <optgroup label="Financial Documents">
                        <option value="INVOICE">Invoice</option>
                        <option value="RECEIPT">Receipt</option>
                        <option value="PAYMENT_PROOF">Payment Proof</option>
                        <option value="EXPENSE_RECEIPT">Expense Receipt</option>
                      </optgroup>
                      <optgroup label="Business Documents">
                        <option value="BUSINESS_LICENSE">Business License</option>
                        <option value="BUSINESS_INSURANCE">Business Insurance</option>
                        <option value="BUSINESS_TAX_CERT">Business Tax Certificate</option>
                        <option value="BUSINESS_PERMIT">Business Permit</option>
                      </optgroup>
                      <optgroup label="Compliance Documents">
                        <option value="SAFETY_CERT">Safety Certificate</option>
                        <option value="ENVIRONMENTAL_CERT">Environmental Certificate</option>
                        <option value="QUALITY_CERT">Quality Certificate</option>
                      </optgroup>
                      <optgroup label="Legal Documents">
                        <option value="CONTRACT">Contract</option>
                        <option value="AGREEMENT">Agreement</option>
                        <option value="POLICY">Policy</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="USER_ID_PROOF">User ID Proof</option>
                        <option value="USER_ADDRESS_PROOF">User Address Proof</option>
                        <option value="USER_BANK_DETAILS">User Bank Details</option>
                        <option value="MANUAL">Manual</option>
                        <option value="OTHER">Other</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={uploadForm.priority || ''}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      disabled={uploadMutation.isPending}
                    >
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={uploadForm.expiryDate || ''}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={uploadMutation.isPending}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploadMutation.isPending}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !uploadForm.title || !uploadForm.entityId || uploadMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;