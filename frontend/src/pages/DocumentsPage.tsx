import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Search, Eye, Trash2, Download, FileText, Box, Truck, CreditCard, X, Clock, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { documentApi } from '../services/documents/documentApi';
import toast from 'react-hot-toast';
import { DocumentEmptyState } from '../components/documents/DocumentEmptyState';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import { cn } from '../utils/cn';
import { StandardDataTable, StatusBadge, type Column, type TableAction } from '../components/EnliteUI/Tables';

interface DocumentsPageProps {
  entityTypeOverride?: string;
}

const DocumentsPage: React.FC<DocumentsPageProps> = ({ entityTypeOverride }) => {
  const { user } = useAuth();
  const isCargoOwner = user?.role === 'CARGO_OWNER';
  const { confirm, DialogComponent } = useConfirmDialog();
  const { entityType: urlEntityType, entityId } = useParams();

  // For VIEWING/FILTERING: Only use override or URL params
  const entityType = entityTypeOverride || urlEntityType;

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
  const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string; fileName: string } | null>(null);

  const queryClient = useQueryClient();

  // Update filters when URL params change
  useEffect(() => {
    if (entityType) {
      if (entityType === 'FINANCIAL') {
        setFilters(prev => ({ ...prev, entityType: '', category: 'FINANCIAL' }));
      } else {
        setFilters(prev => ({ ...prev, entityType, category: '' }));
      }
    } else {
      setFilters(prev => ({ ...prev, entityType: '', category: '' }));
    }
  }, [entityType]);

  // Get entity display name and icon
  const getEntityInfo = (type: string) => {
    const entityInfo = {
      CARGO: { name: 'Cargo', icon: Box, color: 'text-gray-600' },
      TRIP: { name: 'Trip', icon: Truck, color: 'text-gray-600' },
      FINANCIAL: { name: 'Financial', icon: CreditCard, color: 'text-gray-600' },
      DRIVER: { name: 'Driver', icon: Truck, color: 'text-gray-600' },
      VEHICLE: { name: 'Vehicle', icon: Truck, color: 'text-gray-600' },
      USER: { name: 'User', icon: FileText, color: 'text-gray-600' },
    };
    return entityInfo[type as keyof typeof entityInfo] || { name: 'Document', icon: FileText, color: 'text-gray-600' };
  };

  const entityInfo = getEntityInfo(entityType || 'CARGO');

  // Fetch documents
  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', filters, currentPage],
    queryFn: () => documentApi.getDocuments({
      ...filters,
      page: currentPage,
      limit: 20,
    }),
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch document statistics
  const { data: statistics } = useQuery({
    queryKey: ['documentStatistics', entityType],
    queryFn: () => documentApi.getDocumentStatistics(entityType),
    retry: 2,
    staleTime: 10 * 60 * 1000,
  });

  // Fallback data
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

  const onUploadSuccess = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
  };

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.deleteDocument(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
      toast.success('Document deleted');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete asset');
    },
  });

  // Bulk operations
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => documentApi.deleteDocument(id))),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['documentStatistics'] });
      toast.success(`${selectedDocuments.length} assets removed`);
      setSelectedDocuments([]);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete assets');
    },
  });

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setCurrentPage(1);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedDocuments.length > 0) {
      const confirmed = await confirm({
        title: "Delete Documents?",
        message: `Permanently remove ${selectedDocuments.length} documents?`,
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
      });
      if (confirmed) {
        bulkDeleteMutation.mutate(selectedDocuments);
      }
    }
  }, [selectedDocuments, bulkDeleteMutation, confirm]);

  const documentColumns = useMemo<Column<any>[]>(() => [
    {
      key: 'id',
      label: 'ID',
      render: (_v, document) => (
        <span className="text-[10px] font-black text-[#345E85] bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap">
          DOC-{document.id.slice(0, 6)}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Document',
      sortable: true,
      render: (_v, document) => (
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-sm">
            {documentApi.getFileTypeIcon(document.mimeType)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-800 leading-tight truncate max-w-[200px]">
              {document.title}
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {documentApi.formatFileSize(document.fileSize)} • ARCHIVED
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'documentType',
      label: 'Type',
      render: (_v, document) => (
        <div className="text-left">
          <div className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
            {document.documentType.split('_').join(' ')}
          </div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded">
            {document.category}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_v, document) => <StatusBadge status={document.status} label={document.status} />,
    },
    {
      key: 'expiryDate',
      label: 'Expiry',
      sortable: true,
      render: (_v, document) => (
        document.expiryDate ? (
          <div className="space-y-1 text-left">
            <div className="text-[10px] font-black text-slate-700 uppercase">
              {new Date(document.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            {document.isExpired && (
              <StatusBadge status="expired" label="Expired" variant="error" />
            )}
            {document.requiresRenewal && !document.isExpired && (
              <StatusBadge status="pending" label="Renewal Due" variant="warning" />
            )}
          </div>
        ) : (
          <span className="text-[10px] font-black text-slate-300 uppercase italic">No expiry</span>
        )
      ),
    },
  ], []);

  const documentActions = useMemo<TableAction<any>[]>(() => [
    {
      key: 'view',
      label: 'View',
      icon: <Eye size={14} />,
      onClick: (document) => setPreviewDoc({ id: document.id, title: document.title, fileName: document.fileName }),
    },
    {
      key: 'download',
      label: 'Download',
      icon: <Download size={14} />,
      onClick: (document) => documentApi.downloadDocument(document.id),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 size={14} />,
      variant: 'danger',
      onClick: async (document) => {
        const confirmed = await confirm({
          title: 'Delete Document',
          message: `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'danger',
        });
        if (confirmed) deleteMutation.mutate(document.id);
      },
    },
  ], [confirm, deleteMutation]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-xl font-black text-rose-900 mb-2 uppercase tracking-tight">Error loading documents</h3>
          <p className="text-sm text-rose-700 mb-6 font-medium">{error.message}</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => refetch()} className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">Retry</button>
            <button onClick={() => window.location.reload()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Reload</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 px-2">
      {/* Sub-Header */}
      {!entityTypeOverride && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight">
              {entityType ? `${entityInfo.name} Documents` : 'Documents'}
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {entityType
                ? `Documents for ${entityInfo.name.toLowerCase()}`
                : 'Manage your files and documents'
              }
            </p>
          </div>
        </div>
      )}

      {/* Premium Statistics Grid */}
      {!isCargoOwner && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total Documents', value: safeStatistics.totalDocuments || 0, icon: FileText, color: 'emerald' },
            { label: 'Pending Review', value: safeStatistics.documentsByStatus?.PENDING || 0, icon: Clock, color: 'amber' },
            { label: 'Verified Files', value: safeStatistics.documentsByStatus?.VERIFIED || 0, icon: CheckCircle, color: 'blue' },
            { label: 'Deadlines / Expired', value: safeStatistics.documentsByStatus?.EXPIRED || 0, icon: XCircle, color: 'rose' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform",
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                  stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
                    stat.color === 'blue' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
              )}>
                <stat.icon size={24} />
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900 leading-none">
                  {isLoading ? '...' : stat.value}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Pills */}
      {!isLoading && safeStatistics.documentsByCategory && Object.keys(safeStatistics.documentsByCategory).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(safeStatistics.documentsByCategory)
            .sort((a, b) => (b[1] as number) - (a[1] as number))
            .map(([category, count]) => (
              <div
                key={category}
                className="flex items-center bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm hover:border-[#345E85] transition-all cursor-default group"
              >
                <span className="text-[10px] font-black text-[#345E85] mr-2 group-hover:scale-110 transition-transform">{count as number}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{category.replace('_', ' ')}</span>
              </div>
            ))}
        </div>
      )}

      {/* Premium Search & Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#345E85] transition-colors" />
            <input
              type="text"
              placeholder="SEARCH DOCUMENTS: TITLE, CATEGORY, STATUS..."
              className="w-full h-16 pl-14 pr-32 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all placeholder:text-slate-300"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="h-6 w-px bg-slate-200 mr-2" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total:</span>
              <span className="text-sm font-black text-[#345E85]">{safeDocumentsData.total || 0}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            {!entityType && !isCargoOwner && (
              <select
                className="h-16 pl-8 pr-12 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none cursor-pointer hover:bg-white transition-all min-w-[150px]"
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
              >
                <option value="">All Entities</option>
                <option value="DRIVER">Driver</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="CARGO">Cargo</option>
                <option value="TRIP">Trip</option>
              </select>
            )}

            <select
              className="h-16 pl-8 pr-12 bg-slate-50 border border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none cursor-pointer hover:bg-white transition-all min-w-[150px]"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {(filters.search || filters.category || filters.status || (!entityType && filters.entityType)) && (
              <button
                onClick={() => {
                  setFilters({
                    entityType: entityType || '',
                    category: entityType || '',
                    status: '',
                    priority: '',
                    search: '',
                  });
                  setCurrentPage(1);
                }}
                className="w-16 h-16 bg-slate-900 text-white rounded-3xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center group"
                title="Clear Filters"
              >
                <X size={20} className="group-hover:rotate-90 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedDocuments.length > 0 ? (
        <div className="sticky top-0 bg-[#345E85] text-white rounded-[1.5rem] p-4 shadow-xl z-20 flex justify-between items-center animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest leading-none">
              {selectedDocuments.length} document(s) selected
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => selectedDocuments.forEach(id => documentApi.downloadDocument(id))}
              className="bg-white text-[#345E85] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
            >
              Download
            </button>
            <button
              onClick={handleBulkDelete}
              className="bg-rose-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedDocuments([])}
              className="bg-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : safeDocumentsData.documents.length > 0 && (
        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-3 mb-6">
          <Info className="w-4 h-4 text-[#345E85]" />
          Select multiple to delete or download
        </div>
      )}

      {/* Documents Table */}
      <StandardDataTable<any>
        embedded
        className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-2"
        columns={documentColumns}
        data={safeDocumentsData.documents}
        loading={isLoading}
        getRowId={(row) => row.id}
        searchable={false}
        selectable
        selectedIds={selectedDocuments}
        onSelectionChange={setSelectedDocuments}
        rowActions={documentActions}
        stickyHeader
        columnVisibility
        pagination
        page={currentPage}
        totalItems={safeDocumentsData.total}
        pageSize={20}
        onPageChange={setCurrentPage}
        emptyMessage="No documents found"
        ariaLabel="Documents"
      />
      {!isLoading && safeDocumentsData.documents.length === 0 && (
        <div className="mt-4">
          <DocumentEmptyState
            entityType={entityType}
            hasFilters={!!(filters.search || filters.category || filters.status || (!entityType && filters.entityType))}
            onUpload={() => setShowUploadModal(true)}
            onClearFilters={() => {
              setFilters({
                entityType: entityType || '',
                category: entityType || '',
                status: '',
                priority: '',
                search: '',
              });
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Modals */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={onUploadSuccess}
        initialEntityType={entityType}
        initialEntityId={entityId}
        lockEntity={!!entityType}
      />

      {DialogComponent}

      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          documentId={previewDoc.id}
          title={previewDoc.title}
          fileName={previewDoc.fileName}
        />
      )}
    </div>
  );
};

export default DocumentsPage;