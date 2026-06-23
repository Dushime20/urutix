import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, AlertTriangle, Camera, FileText, ArrowLeft,
  Loader2, Package, MapPin, User, Clock, Image as ImageIcon,
  PenTool, X,
} from 'lucide-react';
import { tripsAPI } from '../services/api';
import toast from 'react-hot-toast';

interface InspectionData {
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'DAMAGED' | '';
  notes: string;
  photos: File[];
}

interface IssueData {
  issueType: string;
  description: string;
  photos: File[];
}

const DeliveryConfirmation: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [inspection, setInspection] = useState<InspectionData>({
    condition: '',
    notes: '',
    photos: [],
  });

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issue, setIssue] = useState<IssueData>({
    issueType: '',
    description: '',
    photos: [],
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Fetch ePOD data
  const { data: epodRes, isLoading: epodLoading, error: epodError } = useQuery({
    queryKey: ['epod', tripId],
    queryFn: () => tripsAPI.getEpod(tripId!).then(r => r.data),
    enabled: !!tripId,
    retry: false,
  });

  // Confirm delivery mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!epodRes?.data?.id) throw new Error('ePOD not found');
      
      // If photos were added, upload them first
      // For now, just confirm without photos (can be enhanced later)
      return tripsAPI.confirmEpod(tripId!);
    },
    onSuccess: () => {
      toast.success('✅ Delivery confirmed successfully!');
      queryClient.invalidateQueries({ queryKey: ['epod', tripId] });
      setTimeout(() => navigate('/dashboard'), 2000);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to confirm delivery');
    },
  });

  // Report issue mutation
  const reportIssueMutation = useMutation({
    mutationFn: async () => {
      if (!epodRes?.data?.id) throw new Error('ePOD not found');
      if (!issue.issueType || !issue.description) {
        throw new Error('Please fill in all required fields');
      }

      // For now, use the dispute endpoint
      // Can be enhanced to upload photos
      return tripsAPI.disputeEpod(epodRes.data.id, {
        reason: issue.issueType,
        description: issue.description,
      });
    },
    onSuccess: () => {
      toast.success('⚠️ Issue reported to cargo owner');
      queryClient.invalidateQueries({ queryKey: ['epod', tripId] });
      setShowIssueModal(false);
      setTimeout(() => navigate('/dashboard'), 2000);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to report issue');
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setInspection(prev => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));
  };

  const handleIssuePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setIssue(prev => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));
  };

  const removePhoto = (index: number) => {
    setInspection(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const removeIssuePhoto = (index: number) => {
    setIssue(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleConfirm = () => {
    if (!inspection.condition) {
      toast.error('Please select cargo condition');
      return;
    }
    confirmMutation.mutate();
  };

  const handleReportIssue = () => {
    reportIssueMutation.mutate();
  };

  const apiBase = (import.meta as any).env?.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3005';

  if (epodLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (epodError || !epodRes?.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Delivery Found</h2>
          <p className="text-slate-600 mb-6">
            The driver hasn't submitted proof of delivery yet, or this delivery doesn't exist.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full h-11 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const epod = epodRes.data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Confirm Delivery</h1>
            <p className="text-sm text-slate-500">Trip #{tripId?.slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Driver's ePOD */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} />
              Driver's Proof of Delivery
            </h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Recipient Info */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Recipient</p>
                <p className="text-base font-bold text-slate-800">{epod.recipientName}</p>
                {epod.recipientPhone && <p className="text-sm text-slate-600">{epod.recipientPhone}</p>}
              </div>
            </div>

            {/* Delivery Time */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Delivered At</p>
                <p className="text-base font-bold text-slate-800">
                  {new Date(epod.submittedAt).toLocaleString('en-US', { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>

            {/* GPS Location */}
            {epod.deliveryCoordinates && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">GPS Location</p>
                  <p className="text-base font-bold text-slate-800">
                    {epod.deliveryCoordinates.latitude.toFixed(5)}, {epod.deliveryCoordinates.longitude.toFixed(5)}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${epod.deliveryCoordinates.latitude},${epod.deliveryCoordinates.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on map →
                  </a>
                </div>
              </div>
            )}

            {/* Delivery Notes */}
            {epod.deliveryNotes && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Driver's Notes</p>
                <p className="text-sm text-slate-700">{epod.deliveryNotes}</p>
              </div>
            )}

            {/* Signature */}
            {epod.signatureFileUrl && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <PenTool size={12} /> Recipient Signature
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 inline-block">
                  <img
                    src={`${apiBase}${epod.signatureFileUrl}`}
                    alt="Signature"
                    className="max-h-24 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Photos */}
            {epod.photoUrls?.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ImageIcon size={12} /> Delivery Photos ({epod.photoUrls.length})
                </p>
                <div className="flex gap-2 flex-wrap">
                  {epod.photoUrls.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setPhotoPreview(`${apiBase}${url}`)}
                      className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-400 transition-colors"
                    >
                      <img src={`${apiBase}${url}`} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cargo Inspection Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
              <Package size={16} />
              Inspect Cargo
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Cargo Condition */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                Cargo Condition *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'EXCELLENT', label: 'Excellent', color: 'emerald' },
                  { value: 'GOOD', label: 'Good', color: 'green' },
                  { value: 'FAIR', label: 'Fair', color: 'amber' },
                  { value: 'DAMAGED', label: 'Damaged', color: 'red' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setInspection(prev => ({ ...prev, condition: value as any }))}
                    className={`h-14 rounded-xl border-2 font-bold text-sm transition-all ${
                      inspection.condition === value
                        ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                Take Photos (Optional)
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center gap-2 h-14 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <Camera size={20} className="text-slate-500" />
                  <span className="text-sm font-bold text-slate-600">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {inspection.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {inspection.photos.map((photo, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Upload ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                Notes (Optional)
              </label>
              <textarea
                value={inspection.notes}
                onChange={e => setInspection(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any additional notes about the delivery..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          <button
            onClick={handleConfirm}
            disabled={!inspection.condition || confirmMutation.isPending}
            className="w-full h-14 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
          >
            {confirmMutation.isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                Confirm Receipt
              </>
            )}
          </button>

          <button
            onClick={() => setShowIssueModal(true)}
            className="w-full h-14 rounded-xl bg-white border-2 border-red-200 text-red-600 font-bold text-base hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle size={20} />
            Report Issue
          </button>
        </div>
      </div>

      {/* Issue Report Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pb-24 lg:pb-8">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Report Issue</h3>
              <button
                onClick={() => setShowIssueModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Issue Type */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Issue Type *
                </label>
                <select
                  value={issue.issueType}
                  onChange={e => setIssue(prev => ({ ...prev, issueType: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-sm font-medium"
                >
                  <option value="">Select issue type</option>
                  <option value="DAMAGED_CARGO">Damaged Cargo</option>
                  <option value="MISSING_ITEMS">Missing Items</option>
                  <option value="WRONG_ITEMS">Wrong Items Delivered</option>
                  <option value="INCOMPLETE_DELIVERY">Incomplete Delivery</option>
                  <option value="LATE_DELIVERY">Late Delivery</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Description *
                </label>
                <textarea
                  value={issue.description}
                  onChange={e => setIssue(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Evidence Photos
                </label>
                <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                  <Camera size={18} className="text-slate-500" />
                  <span className="text-sm font-bold text-slate-600">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={handleIssuePhotoUpload}
                    className="hidden"
                  />
                </label>

                {issue.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {issue.photos.map((photo, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-200">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Evidence ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeIssuePhoto(i)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleReportIssue}
                disabled={!issue.issueType || !issue.description || reportIssueMutation.isPending}
                className="w-full h-12 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportIssueMutation.isPending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle size={18} />
                    Submit Issue Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {photoPreview && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPhotoPreview(null)}
        >
          <img src={photoPreview} alt="Preview" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
};

export default DeliveryConfirmation;
