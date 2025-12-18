import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import {
  FaCheck,
  FaTimes,
  FaSpinner,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClipboardCheck,
} from 'react-icons/fa';

interface ChecklistItem {
  id: string;
  label: string;
  originalValue: any;
  verified: boolean;
  notes?: string;
  discrepancy?: boolean;
  category?: string;
}

interface CargoDetails {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  length?: number;
  width?: number;
  height?: number;
  cargoType: string;
  loadType: string;
  packagingType: string;
  numberOfPieces: number;
  numberOfPallets: number;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  specialHandlingInstructions?: string;
  loadingInstructions?: string;
  unloadingInstructions?: string;
  loadValue: number;
  currencyCode: string;
  hazmatClass?: string;
}

const CargoInspectionPage: React.FC = () => {
  const { cargoId } = useParams<{ cargoId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cargo, setCargo] = useState<CargoDetails | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [overallNotes, setOverallNotes] = useState('');
  const [existingInspection, setExistingInspection] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (cargoId) {
      loadCargoForInspection();
      loadExistingInspection();
    }
  }, [cargoId]);

  const loadCargoForInspection = async () => {
    try {
      setLoading(true);
      const response = await receiverService.getCargoForInspection(cargoId!);
      setCargo(response.cargo);
      setChecklist(response.checklist.map((item: any) => ({
        ...item,
        verified: false,
        discrepancy: false,
        notes: '',
      })));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load cargo details');
      navigate('/dashboard/cargos/my-cargos');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingInspection = async () => {
    try {
      const inspection = await receiverService.getCargoInspection(cargoId!);
      if (inspection) {
        setExistingInspection(inspection);
        setChecklist(inspection.checklist);
        setOverallNotes(inspection.overallNotes || '');
        setIsCompleted(inspection.status === 'COMPLETED' || inspection.allItemsVerified);
      }
    } catch (error: any) {
      // Inspection doesn't exist yet, that's fine
      console.log('No existing inspection found');
    }
  };

  const handleToggleVerification = (itemId: string) => {
    if (isCompleted) return; // Prevent changes if inspection is completed
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, verified: !item.verified, discrepancy: false }
          : item,
      ),
    );
  };

  const handleToggleDiscrepancy = (itemId: string) => {
    if (isCompleted) return; // Prevent changes if inspection is completed
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, discrepancy: !item.discrepancy, verified: false }
          : item,
      ),
    );
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    if (isCompleted) return; // Prevent changes if inspection is completed
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, notes } : item)),
    );
  };

  const handleSubmit = async () => {
    const verifiedCount = checklist.filter((item) => item.verified).length;
    const totalItems = checklist.length;

    if (verifiedCount === 0) {
      toast.error('Please verify at least one item before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const result = await receiverService.submitCargoInspection(cargoId!, {
        loadId: cargoId!,
        checklist,
        overallNotes,
      });
      toast.success('Inspection submitted successfully!');
      setIsCompleted(result.status === 'COMPLETED' || result.allItemsVerified);
      setExistingInspection(result);
      // Reload inspection to get updated status
      await loadExistingInspection();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = () => {
    const verified = checklist.filter((item) => item.verified).length;
    const total = checklist.length;
    return total > 0 ? Math.round((verified / total) * 100) : 0;
  };

  const getCategoryItems = (category: string) => {
    return checklist.filter((item) => item.category === category);
  };

  const categories = Array.from(new Set(checklist.map((item) => item.category || 'Other')));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-primary-600 text-2xl" />
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Cargo not found</p>
      </div>
    );
  }

  const progress = getProgress();
  const verifiedCount = checklist.filter((item) => item.verified).length;
  const discrepancyCount = checklist.filter((item) => item.discrepancy).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/cargos/my-cargos')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {isCompleted ? 'Cargo Inspection (Completed)' : 'Cargo Inspection'}
              </h1>
              {isCompleted && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  <FaCheckCircle className="text-green-600" />
                  Inspection Completed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{cargo.title}</p>
            {existingInspection?.completedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Completed on: {new Date(existingInspection.completedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaClipboardCheck className="text-primary-600 text-xl" />
            <h2 className="text-lg font-semibold text-gray-900">Inspection Progress</h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {verifiedCount} of {checklist.length} items verified
            </p>
            <p className="text-2xl font-bold text-primary-600">{progress}%</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {discrepancyCount > 0 && (
          <div className="mt-4 flex items-center gap-2 text-yellow-600">
            <FaExclamationTriangle />
            <span className="text-sm">
              {discrepancyCount} discrepancy/discrepancies found
            </span>
          </div>
        )}
      </div>

      {/* Checklist by Category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryItems = getCategoryItems(category);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
              </div>
              <div className="p-4 space-y-4">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all ${
                      item.verified
                        ? 'border-green-300 bg-green-50'
                        : item.discrepancy
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{item.label}</h4>
                          {item.verified && (
                            <FaCheckCircle className="text-green-600" title="Verified" />
                          )}
                          {item.discrepancy && (
                            <FaExclamationTriangle
                              className="text-yellow-600"
                              title="Discrepancy"
                            />
                          )}
                        </div>
                        <div className="bg-gray-50 rounded p-2 mb-3">
                          <p className="text-xs text-gray-500 mb-1">Original Value:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {typeof item.originalValue === 'object'
                              ? JSON.stringify(item.originalValue)
                              : String(item.originalValue || 'N/A')}
                          </p>
                        </div>
                        {!isCompleted && (
                          <div className="flex items-center gap-3 mt-3">
                            <button
                              onClick={() => handleToggleVerification(item.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                item.verified
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <FaCheck />
                              {item.verified ? 'Verified' : 'Mark as Verified'}
                            </button>
                            <button
                              onClick={() => handleToggleDiscrepancy(item.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                item.discrepancy
                                  ? 'bg-yellow-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <FaExclamationTriangle />
                              {item.discrepancy ? 'Discrepancy' : 'Report Discrepancy'}
                            </button>
                          </div>
                        )}
                        {isCompleted && (
                          <div className="mt-3 text-sm text-gray-600">
                            {item.verified ? (
                              <span className="inline-flex items-center gap-2 text-green-700">
                                <FaCheckCircle /> Verified
                              </span>
                            ) : item.discrepancy ? (
                              <span className="inline-flex items-center gap-2 text-yellow-700">
                                <FaExclamationTriangle /> Discrepancy Reported
                              </span>
                            ) : (
                              <span className="text-gray-500">Not verified</span>
                            )}
                          </div>
                        )}
                        {(item.verified || item.discrepancy) && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes {isCompleted ? '' : '(Optional)'}:
                            </label>
                            {isCompleted ? (
                              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                                {item.notes || 'No notes provided'}
                              </div>
                            ) : (
                              <textarea
                                value={item.notes || ''}
                                onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                placeholder="Add optional notes about this item (if needed)..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                rows={2}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall Notes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Overall Notes</h3>
        <p className="text-xs text-gray-500 mb-4">
          {isCompleted ? 'Inspection notes (read-only)' : '(Optional - Add any additional notes if needed)'}
        </p>
        {isCompleted ? (
          <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
            {overallNotes || 'No overall notes provided'}
          </div>
        ) : (
          <textarea
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Add optional notes about the cargo inspection (if needed)..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={4}
          />
        )}
      </div>

      {/* Submit Button */}
      {!isCompleted && (
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => navigate('/dashboard/cargos/my-cargos')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || verifiedCount === 0}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Submit Inspection
              </>
            )}
          </button>
        </div>
      )}
      {isCompleted && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-green-600 rounded-full p-3">
              <FaCheckCircle className="text-white text-2xl" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 mb-2">✓ Inspection Completed & Verified</h3>
              <p className="text-sm text-green-800 mb-3">
                This cargo inspection has been completed and verified. All items have been checked and documented. 
                The inspection record serves as proof that the cargo was received in the state described during creation.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200">
                <div>
                  <p className="text-xs text-green-600 mb-1">Completion Date</p>
                  <p className="text-sm font-semibold text-green-900">
                    {existingInspection?.completedAt 
                      ? new Date(existingInspection.completedAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-green-600 mb-1">Verification Status</p>
                  <p className="text-sm font-semibold text-green-900">
                    {existingInspection?.verifiedCount || 0} of {existingInspection?.totalItems || 0} items verified
                  </p>
                </div>
              </div>
              {existingInspection?.allItemsVerified && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                    ✓ All Items Verified - Inspection Complete
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoInspectionPage;

