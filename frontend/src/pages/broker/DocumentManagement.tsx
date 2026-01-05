import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { brokerAPI, type LoadDocument, type CreateDocumentData } from '../../services/brokerApi';
import { FileText, Plus, Search, Filter, Upload, Download, CheckCircle2, Clock, Loader2, Eye, FileCheck, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';

const DocumentManagement: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LoadDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<LoadDocument | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
  });

  useEffect(() => {
    if (user && user.role === 'BROKER' && selectedLoadId) {
      fetchDocuments();
    }
  }, [user, selectedLoadId, filters.type]);

  const fetchDocuments = async () => {
    if (!selectedLoadId) return;
    setLoading(true);
    try {
      const response = await brokerAPI.getLoadDocuments(selectedLoadId, filters.type || undefined);
      // Handle different response structures
      const documentsData = response.data || response || [];
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch documents');
      setDocuments([]); // Ensure documents is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async (data: CreateDocumentData) => {
    try {
      await brokerAPI.uploadDocument(data);
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleGenerateBOL = async (loadId: string) => {
    try {
      await brokerAPI.generateBOL(loadId);
      toast.success('Bill of Lading generated successfully');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate BOL');
    }
  };

  const handleGeneratePOD = async (loadId: string, tripId: string) => {
    try {
      await brokerAPI.generatePOD(loadId, tripId);
      toast.success('Proof of Delivery generated successfully');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate POD');
    }
  };

  const handleVerifyDocument = async (documentId: string) => {
    try {
      await brokerAPI.verifyDocument(documentId, 'Document verified by broker');
      toast.success('Document verified successfully');
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to verify document');
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'BILL_OF_LADING':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'PROOF_OF_DELIVERY':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'INVOICE':
      case 'COMMISSION_INVOICE':
        return <Receipt className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'SIGNED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_SIGNATURE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-600 mt-1">Manage load documents, BOL, POD, and invoices</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Load Selection */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Load ID</label>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter Load ID"
            value={selectedLoadId}
            onChange={(e) => setSelectedLoadId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          {selectedLoadId && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleGenerateBOL(selectedLoadId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Generate BOL</span>
              </button>
              <button
                onClick={() => {
                  const tripId = prompt('Enter Trip ID for POD generation:');
                  if (tripId) handleGeneratePOD(selectedLoadId, tripId);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Generate POD</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {selectedLoadId && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="BILL_OF_LADING">Bill of Lading</option>
            <option value="PROOF_OF_DELIVERY">Proof of Delivery</option>
            <option value="PROOF_OF_PICKUP">Proof of Pickup</option>
            <option value="INVOICE">Invoice</option>
            <option value="COMMISSION_INVOICE">Commission Invoice</option>
            <option value="CONTRACT">Contract</option>
            <option value="WEIGHT_TICKET">Weight Ticket</option>
            <option value="DELIVERY_RECEIPT">Delivery Receipt</option>
          </select>
        </div>
      )}

      {/* Documents List */}
      {!selectedLoadId ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Load</h3>
          <p className="text-gray-600">Enter a Load ID above to view and manage documents</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">Upload or generate documents for this load</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((document) => (
                <tr key={document.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getDocumentTypeIcon(document.documentType)}
                      <span className="text-sm text-gray-900">
                        {document.documentType.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{document.fileName}</div>
                    {document.description && (
                      <div className="text-sm text-gray-500">{document.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                      {document.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {document.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDocument(document)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {document.fileUrl && (
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      )}
                      {document.status === 'DRAFT' && (
                        <button
                          onClick={() => handleVerifyDocument(document.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Verify Document"
                        >
                          <FileCheck className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          loadId={selectedLoadId}
          onClose={() => setShowUploadModal(false)}
          onSubmit={handleUploadDocument}
        />
      )}

      {/* View Document Modal */}
      {selectedDocument && (
        <ViewDocumentModal
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onVerify={handleVerifyDocument}
        />
      )}
    </div>
  );
};

// Upload Document Modal
const UploadDocumentModal: React.FC<{
  loadId: string;
  onClose: () => void;
  onSubmit: (data: CreateDocumentData) => void;
}> = ({ loadId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateDocumentData>({
    loadId: loadId || '',
    documentType: 'OTHER',
    fileName: '',
    fileUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loadId) {
      toast.error('Please enter a Load ID');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load ID</label>
            <input
              type="text"
              required
              value={formData.loadId}
              onChange={(e) => setFormData({ ...formData, loadId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              required
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="BILL_OF_LADING">Bill of Lading</option>
              <option value="PROOF_OF_DELIVERY">Proof of Delivery</option>
              <option value="PROOF_OF_PICKUP">Proof of Pickup</option>
              <option value="INVOICE">Invoice</option>
              <option value="COMMISSION_INVOICE">Commission Invoice</option>
              <option value="CONTRACT">Contract</option>
              <option value="WEIGHT_TICKET">Weight Ticket</option>
              <option value="DELIVERY_RECEIPT">Delivery Receipt</option>
              <option value="DAMAGE_REPORT">Damage Report</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
            <input
              type="text"
              required
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="document.pdf"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
            <input
              type="url"
              required
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="https://storage.example.com/document.pdf"
            />
            <p className="text-xs text-gray-500 mt-1">Upload file to storage first, then paste URL here</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View Document Modal
const ViewDocumentModal: React.FC<{
  document: LoadDocument;
  onClose: () => void;
  onVerify: (id: string) => void;
}> = ({ document, onClose, onVerify }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Document Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="text-gray-900">{document.documentType.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-gray-900">{document.status}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Name</label>
              <p className="text-gray-900">{document.fileName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">File Size</label>
              <p className="text-gray-900">
                {document.fileSize ? `${(document.fileSize / 1024).toFixed(2)} KB` : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="text-gray-900">{new Date(document.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Verified</label>
              <p className="text-gray-900">
                {document.verifiedAt ? new Date(document.verifiedAt).toLocaleString() : 'Not verified'}
              </p>
            </div>
          </div>
          {document.description && (
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900 mt-1">{document.description}</p>
            </div>
          )}
          {document.documentContent && (
            <div>
              <label className="text-sm font-medium text-gray-500">Content</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {document.documentContent}
              </div>
            </div>
          )}
          {document.fileUrl && (
            <div>
              <a
                href={document.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Download className="w-5 h-5" />
                <span>Download Document</span>
              </a>
            </div>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            {document.status === 'DRAFT' && (
              <button
                onClick={() => onVerify(document.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Verify Document
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;

