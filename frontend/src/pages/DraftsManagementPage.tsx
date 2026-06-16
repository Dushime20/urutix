import React, { useState, useEffect } from 'react';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { useNavigate } from 'react-router-dom';
import { 
  FaEdit, FaTrash, FaRocket, FaSave, FaMapMarkerAlt, 
  FaBox, FaWeightHanging, FaDollarSign, FaCalendar, FaTimes, FaPlus 
} from 'react-icons/fa';
import { draftCargoApi, type DraftCargoResponse } from '../services/draftCargoApi';
import EnhancedCargoForm from './dashboard/cargos/create/components/form';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import toast from 'react-hot-toast';

const DraftsManagementPage: React.FC = () => {
  const { compact: fmtMoney } = useCurrencyFormat();
  const navigate = useNavigate();
  const { confirm, DialogComponent } = useConfirmDialog();
  const [drafts, setDrafts] = useState<DraftCargoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDraft, setSelectedDraft] = useState<DraftCargoResponse | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load drafts on component mount
  useEffect(() => {
    loadDrafts();
  }, [currentPage]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await draftCargoApi.getUserDrafts(currentPage, 20);
      setDrafts(response.items);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      setError(`Failed to load drafts: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = (draft: DraftCargoResponse) => {
    setSelectedDraft(draft);
    setShowEditForm(true);
  };

  const handleUpdateDraft = async (formData: any): Promise<any> => {
    if (!selectedDraft) return;

    try {
      setActionLoading('updating');
      const result = await draftCargoApi.updateDraft(selectedDraft.id, formData);
      setShowEditForm(false);
      setSelectedDraft(null);
      loadDrafts();
      setError(null);
      return result;
    } catch (error: any) {
      setError(`Failed to update draft: ${error.message}`);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishDraft = async (draftId: string) => {
    try {
      setActionLoading(`publishing-${draftId}`);
      const response = await draftCargoApi.publishDraft(draftId);
      console.log('Draft moved to created status successfully:', response);
      
      // Remove from drafts list and refresh
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      setError(null);
      
      // Show success message
      toast.success('Cargo moved to created status! It is now ready for matching and publishing to truck owners.');
    } catch (error: any) {
      setError(`Failed to move draft to created status: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    const confirmed = await confirm({
      title: "Delete Draft",
      message: "Are you sure you want to delete this draft? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(`deleting-${draftId}`);
      await draftCargoApi.deleteDraft(draftId);
      
      // Remove from drafts list
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      setError(null);
    } catch (error: any) {
      setError(`Failed to delete draft: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading drafts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Draft Cargo Management</h1>
              <p className="mt-2 text-gray-600">
                Manage your incomplete cargo drafts. Edit, move to created status, or delete as needed.
              </p>
            </div>
            <button
              onClick={() => navigate('/cargo/create')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
            >
              <FaPlus className="w-4 h-4 mr-2" />
              Create New Cargo
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <FaTimes className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Drafts List */}
        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <FaSave className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts found</h3>
            <p className="text-gray-600 mb-6">
              You don't have any saved drafts yet. Start creating cargo to save drafts, then move them to created status when ready.
            </p>
            <button
              onClick={() => navigate('/cargo/create')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Your First Cargo
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{draft.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(draft.status)}`}>
                        {draft.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{draft.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaBox className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.cargoType}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaWeightHanging className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.weight} kg
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaDollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.loadValue != null ? fmtMoney(draft.loadValue) : 'N/A'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCalendar className="w-4 h-4 mr-2 text-gray-400" />
                        {draft.pickupDate ? formatDate(draft.pickupDate) : 'Not set'}
                      </div>
                    </div>

                    {draft.pickupLocation && draft.deliveryLocation && (
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-green-500" />
                          <span className="font-medium">From:</span> {draft.pickupLocation.name}
                        </div>
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="w-4 h-4 mr-2 text-red-500" />
                          <span className="font-medium">To:</span> {draft.deliveryLocation.name}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Last updated: {formatDate(draft.updatedAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditDraft(draft)}
                      disabled={actionLoading === `updating`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Draft"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handlePublishDraft(draft.id)}
                      disabled={actionLoading === `publishing-${draft.id}`}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Move to Created Status"
                    >
                      {actionLoading === `publishing-${draft.id}` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <FaRocket className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      disabled={actionLoading === `deleting-${draft.id}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Draft"
                    >
                      {actionLoading === `deleting-${draft.id}` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-3 py-2 text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Edit Draft Modal */}
        {showEditForm && selectedDraft && (
          <EnhancedCargoForm
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false);
              setSelectedDraft(null);
            }}
            onSubmit={handleUpdateDraft}
            mode="edit"
            initialData={selectedDraft}
            showTruckSelection={false}
            onSaveDraft={handleUpdateDraft}
          />
        )}

        {/* Confirmation Dialog */}
        {DialogComponent}
      </div>
    </div>
  );
};

export default DraftsManagementPage;
