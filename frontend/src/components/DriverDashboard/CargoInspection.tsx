import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  FileText,
  Package,
  AlertCircle,
  Info,
  Eye,
  Save,
  Upload,
  ArrowRight,
  X,
  ShieldCheck
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import { documentApi } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TranslatedText } from '../translated-text';
import { useTranslation } from '../../hooks/useTranslation';

interface CargoItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  category: string;
  specialRequirements: string[];
  fragility: 'LOW' | 'MEDIUM' | 'HIGH';
  temperature: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  hazardous: boolean;
  hazmatClass?: string;
  images: string[];
  documents: string[];
}

interface InspectionResult {
  cargoId: string;
  status: 'PASSED' | 'FAILED' | 'CONDITIONAL';
  timestamp: string;
  inspector: string;
  notes: string;
  issues: InspectionIssue[];
  photos: string[];
  recommendations: string[];
  signature: string;
}

interface InspectionIssue {
  id: string;
  type: 'DAMAGE' | 'MISSING' | 'INCOMPLETE' | 'SAFETY' | 'DOCUMENTATION' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location: string;
  actionRequired: string;
  resolved: boolean;
  resolutionNotes?: string;
}

interface CargoInspectionProps {
  cargoId: string;
  driverId?: string;
  embedded?: boolean;
  onInspectionComplete: (result: InspectionResult) => void;
  onCancel: () => void;
}

export const CargoInspection: React.FC<CargoInspectionProps> = ({
  cargoId,
  driverId,
  embedded = false,
  onInspectionComplete,
  onCancel
}) => {
  const { tSync: t } = useTranslation();
  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectionStep, setInspectionStep] = useState<'overview' | 'physical' | 'documentation' | 'securement' | 'final'>('overview');
  const [inspectionResult, setInspectionResult] = useState<Partial<InspectionResult>>({
    cargoId,
    status: 'PASSED',
    timestamp: new Date().toISOString(),
    inspector: 'Driver Name',
    notes: '',
    issues: [],
    photos: [],
    recommendations: [],
    signature: ''
  });

  const [checklistStatus, setChecklistStatus] = useState<Record<string, 'passed' | 'failed' | null>>({
    packaging: null,
    seals: null,
    labels: null,
    contents: null,
    security: null,
    straps: null,
    weightDist: null,
    blocking: null,
    currentTemp: null,
    currentHumidity: null
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; file?: File; id: string }>>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<Record<string, 'verified' | 'missing' | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [verification, setVerification] = useState({
    identityVerified: false,
    quantityVerified: false,
    actualQuantity: 0,
    weightVerified: false,
    actualWeight: 0,
    dimensionsVerified: false,
    actualLength: 0,
    actualWidth: 0,
    actualHeight: 0,
    packagingVerified: false,
    conditionVerified: false,
    documentationVerified: false,
    sealVerified: false,
    sealNumber: '',
  });

  useEffect(() => {
    const fetchCargoData = async () => {
      try {
        setLoading(true);
        const load = await driverApi.getLoadById(cargoId);

        const mappedCargo: CargoItem = {
          id: load.id || cargoId,
          name: load.title || 'Cargo',
          description: load.description || 'No description available',
          quantity: load.numberOfPieces || load.unitsRequired || 0,
          unit: 'pieces',
          weight: load.weight || 0,
          dimensions: {
            length: load.length || 0,
            width: load.width || 0,
            height: load.height || 0,
          },
          category: load.cargoType || 'General',
          specialRequirements: [
            ...(load.isFragile ? ['Fragile'] : []),
            ...(load.requiresRefrigeration ? ['Temperature controlled'] : []),
            ...(load.isHazardous ? ['Hazardous material'] : []),
            ...(load.requiresForklift ? ['Requires forklift'] : []),
            ...(load.requiresCrane ? ['Requires crane'] : []),
            ...(load.requiresLoadingDock ? ['Requires loading dock'] : []),
            ...(load.requiresHumidityControl ? ['Humidity control'] : []),
          ],
          fragility: load.isFragile ? 'HIGH' : (load.cargoType === 'FRAGILE' ? 'HIGH' : 'MEDIUM'),
          temperature: {
            min: load.temperatureMin || null,
            max: load.temperatureMax || null,
            unit: 'C'
          },
          hazardous: load.isHazardous || false,
          hazmatClass: load.hazmatClass || undefined,
          images: [],
          documents: load.requiredDocuments || []
        };

        setCargo(mappedCargo);
        setVerification((prev) => ({
          ...prev,
          actualQuantity: mappedCargo.quantity,
          actualWeight: mappedCargo.weight,
          actualLength: mappedCargo.dimensions.length,
          actualWidth: mappedCargo.dimensions.width,
          actualHeight: mappedCargo.dimensions.height,
        }));
      } catch (error: any) {
        console.error('Error fetching cargo data:', error);
        toast.error(t('Failed to load cargo details'));
      } finally {
        setLoading(false);
      }
    };

    fetchCargoData();
  }, [cargoId]);

  const addIssue = (issue: Omit<InspectionIssue, 'id'>) => {
    const newIssue: InspectionIssue = {
      ...issue,
      id: Date.now().toString(),
      resolved: false
    };
    setInspectionResult(prev => ({
      ...prev,
      issues: [...(prev.issues || []), newIssue]
    }));
  };


  const handleChecklistItem = (itemId: string, status: 'passed' | 'failed') => {
    setChecklistStatus(prev => ({
      ...prev,
      [itemId]: status
    }));

    if (status === 'failed') {
      addIssue({
        type: 'DAMAGE',
        severity: 'MEDIUM',
        description: `Issue found with ${itemId.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
        location: 'General',
        actionRequired: 'Document and report issue',
        resolved: false
      });
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('Please upload an image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Image size must be less than 5MB'));
      return;
    }

    const photoId = Date.now().toString();
    let previewUrl: string | null = null;

    try {
      setUploadingPhoto(true);
      previewUrl = URL.createObjectURL(file);
      setUploadedPhotos(prev => [...prev, { url: previewUrl!, file, id: photoId }]);

      const documentRequest = {
        entityType: 'CARGO',
        entityId: cargoId,
        documentType: 'OTHER',
        category: 'OPERATIONAL',
        title: `Inspection Photo - ${new Date().toLocaleString()}`,
        description: 'Cargo inspection photo',
        priority: 'NORMAL',
      };

      const uploadedDocument = await documentApi.createDocument(documentRequest, file);

      if (uploadedDocument?.fileUrl) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setUploadedPhotos(prev =>
          prev.map(photo =>
            photo.id === photoId
              ? { ...photo, url: uploadedDocument.fileUrl, file: undefined }
              : photo
          )
        );

        setInspectionResult(prev => ({
          ...prev,
          photos: [...(prev.photos || []), uploadedDocument.fileUrl]
        }));

        toast.success(t('Photo uploaded successfully'));
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload photo';
      toast.error(errorMessage);

      setUploadedPhotos(prev => {
        const photo = prev.find(p => p.id === photoId);
        if (photo && photo.url.startsWith('blob:') && previewUrl) {
          URL.revokeObjectURL(photo.url);
        }
        return prev.filter(p => p.id !== photoId);
      });
    } finally {
      setUploadingPhoto(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = uploadedPhotos.find(p => p.id === photoId);
    if (photoToRemove) {
      if (photoToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
      setInspectionResult(prev => ({
        ...prev,
        photos: prev.photos?.filter(url => url !== photoToRemove.url) || []
      }));
      toast.success(t('Photo removed'));
    }
  };

  const buildChecklistPayload = () => {
    const physicalItems = [
      'packaging', 'seals', 'labels', 'contents', 'security', 'straps', 'weightDist', 'blocking', 'currentTemp', 'currentHumidity', 'tarping', 'temperature'
    ];
    return physicalItems.map((itemId) => ({
      id: itemId,
      label: itemId.replace(/([A-Z])/g, ' $1'),
      verified: checklistStatus[itemId] === 'passed',
      discrepancy: checklistStatus[itemId] === 'failed',
      notes: checklistStatus[itemId] === 'failed' ? 'Failed during inspection' : undefined,
    }));
  };

  const submitInspection = async (decision: 'PASSED' | 'FAILED') => {
    if (!inspectionResult.notes?.trim()) {
      toast.error(t('Please add inspection notes before submitting.'));
      return;
    }

    if (decision === 'FAILED' && (!inspectionResult.issues || inspectionResult.issues.length === 0)) {
      toast.error(t('Please report at least one issue when failing an inspection.'));
      return;
    }

    const payload = {
      decision,
      notes: inspectionResult.notes,
      checklist: buildChecklistPayload(),
      verification: {
        identityVerified: verification.identityVerified,
        quantityVerified: verification.quantityVerified,
        actualQuantity: verification.actualQuantity,
        weightVerified: verification.weightVerified,
        actualWeight: verification.actualWeight,
        dimensionsVerified: verification.dimensionsVerified,
        actualDimensions: {
          length: verification.actualLength,
          width: verification.actualWidth,
          height: verification.actualHeight,
        },
        packagingVerified: verification.packagingVerified,
        conditionVerified: verification.conditionVerified,
        documentationVerified: verification.documentationVerified,
        sealVerified: verification.sealVerified,
        sealNumber: verification.sealNumber || undefined,
      },
      issues: (inspectionResult.issues || []).map((issue) => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        location: issue.location,
        actionRequired: issue.actionRequired,
      })),
      photos: inspectionResult.photos || [],
    };

    try {
      setSubmitting(true);
      if (driverId) {
        await driverApi.submitPreTripInspection(driverId, cargoId, payload);
        toast.success(
          decision === 'PASSED'
            ? t('Pre-trip inspection approved!')
            : t('Inspection failed — shipment blocked pending resolution.'),
        );
        onInspectionComplete({
          ...(inspectionResult as InspectionResult),
          status: decision === 'PASSED' ? 'PASSED' : 'FAILED',
        });
        return;
      }

      onInspectionComplete({
        ...(inspectionResult as InspectionResult),
        status: decision === 'PASSED' ? 'PASSED' : 'FAILED',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Failed to submit inspection'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleInspectionComplete = () => {
    submitInspection('PASSED');
  };

  const handleInspectionFail = () => {
    submitInspection('FAILED');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Cargo not found</p>
      </div>
    );
  }

  const steps = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'physical', label: 'Condition', icon: Package },
    { id: 'documentation', label: 'Documents', icon: FileText },
    { id: 'securement', label: 'Securement', icon: ShieldCheck },
    { id: 'final', label: 'Review', icon: CheckCircle }
  ];

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-5'}>
      {!embedded && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] uppercase tracking-tight">Pre-Trip Cargo Inspection</h2>
              <p className="text-slate-400 font-medium text-xs sm:text-sm">Mandatory verification before loading and trip start</p>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[320px] relative px-2 sm:px-8">
          <div className="absolute left-4 right-4 top-5 h-0.5 bg-slate-100 -z-10" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = inspectionStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === inspectionStep) > index;
            return (
              <div key={step.id} className="flex flex-col items-center gap-1.5 bg-white px-1">
                <button
                  onClick={() => {
                    const stepIdx = steps.findIndex(s => s.id === step.id);
                    const currentIdx = steps.findIndex(s => s.id === inspectionStep);
                    if (stepIdx < currentIdx) setInspectionStep(step.id as any);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive ? 'border-[#345E85] bg-[#345E85] text-white scale-110 shadow-lg shadow-blue-900/20' :
                    isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' :
                    'border-slate-200 bg-slate-50 text-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </button>
                <span className={`text-[9px] font-black uppercase tracking-wider whitespace-nowrap hidden sm:block ${
                  isActive ? 'text-[#345E85]' : isCompleted ? 'text-emerald-600' : 'text-slate-300'
                }`}>
                  <TranslatedText text={step.label} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={inspectionStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* OVERVIEW STEP */}
          {inspectionStep === 'overview' && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" /> Verify Cargo Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div className="space-y-3">
                  {[
                    { label: 'Name', value: cargo.name },
                    { label: 'Qty / Weight', value: `${cargo.quantity} units / ${cargo.weight} kg` },
                    { label: 'Category', value: cargo.category },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl gap-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide flex-shrink-0">{item.label}</span>
                      <span className="text-xs font-bold text-slate-900 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verification Fields</h4>
                  {[
                    { key: 'identityVerified', label: 'Cargo identity verified' },
                    { key: 'quantityVerified', label: 'Quantity verified' },
                    { key: 'weightVerified', label: 'Weight verified' },
                    { key: 'dimensionsVerified', label: 'Dimensions verified' },
                    { key: 'packagingVerified', label: 'Packaging inspected' },
                    { key: 'conditionVerified', label: 'Cargo condition acceptable' },
                    { key: 'documentationVerified', label: 'Documentation verified' },
                    { key: 'sealVerified', label: 'Container seal verified' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verification[key as keyof typeof verification] as boolean}
                        onChange={(e) => setVerification(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-slate-300"
                      />
                      <span className="text-xs font-semibold text-slate-700">{label}</span>
                    </label>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Actual qty"
                      value={verification.actualQuantity || ''}
                      onChange={(e) => setVerification(prev => ({ ...prev, actualQuantity: Number(e.target.value) }))}
                      className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Actual weight (kg)"
                      value={verification.actualWeight || ''}
                      onChange={(e) => setVerification(prev => ({ ...prev, actualWeight: Number(e.target.value) }))}
                      className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Seal number (if applicable)"
                    value={verification.sealNumber}
                    onChange={(e) => setVerification(prev => ({ ...prev, sealNumber: e.target.value }))}
                    className="h-9 px-3 w-full bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Special Handling</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {cargo.specialRequirements.map((req, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-[#345E85] text-[10px] font-bold rounded-lg border border-blue-100">{req}</span>
                    ))}
                    {cargo.hazardous && (
                      <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Hazardous
                      </span>
                    )}
                    {cargo.specialRequirements.length === 0 && !cargo.hazardous && (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setInspectionStep('physical')}
                  className="w-full sm:w-auto px-5 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  Begin Physical Check <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* PHYSICAL STEP */}
          {inspectionStep === 'physical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'packaging', label: 'Packaging Integrity', description: 'Visibly intact, no dents' },
                  { id: 'seals', label: 'Seals & Closures', description: 'Tamper-proof seals present' },
                  { id: 'labels', label: 'Labels & Markings', description: 'Legible and correct placement' },
                  { id: 'contents', label: 'Content Verification', description: 'Matches manifest quantity' },
                  { id: 'temperature', label: 'Temp Control', description: 'Within required range' },
                  { id: 'security', label: 'Security Features', description: 'Locks and safety checks' },
                  { id: 'currentTemp', label: 'Actual Temperature', description: 'Real-time cargo temp reading' },
                  { id: 'currentHumidity', label: 'Actual Humidity', description: 'Storage area humidity level' }
                ].map((item) => {
                  const status = checklistStatus[item.id];
                  return (
                    <div key={item.id} className={`p-3 rounded-xl border-2 transition-all ${status === 'passed' ? 'bg-emerald-50/50 border-emerald-100' : status === 'failed' ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-700 truncate">{item.label}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">{item.description}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleChecklistItem(item.id, 'passed')}
                            className={`p-1.5 rounded-lg transition-colors ${status === 'passed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}>
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleChecklistItem(item.id, 'failed')}
                            className={`p-1.5 rounded-lg transition-colors ${status === 'failed' ? 'bg-red-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}>
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" /> Photo Evidence
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-[#345E85] hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="hidden" />
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                      {uploadingPhoto ? <div className="w-4 h-4 border-2 border-[#345E85] border-t-transparent rounded-full animate-spin" /> : <Upload className="w-4 h-4 text-[#345E85]" />}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 group-hover:text-[#345E85]">Upload</span>
                  </label>
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                      <img src={photo.url} alt="Evidence" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button onClick={() => setInspectionStep('overview')}
                  className="flex-1 sm:flex-none px-5 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button onClick={() => setInspectionStep('documentation')}
                  className="flex-1 px-5 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  Next Step <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* DOCUMENTATION STEP */}
          {inspectionStep === 'documentation' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Required Documentation
                </h3>

                <div className="space-y-4">
                  {cargo.documents.length > 0 ? (
                    cargo.documents.map((doc, idx) => {
                      const docKey = `doc-${idx}`;
                      const status = documentStatus[docKey];
                      return (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${status === 'verified' ? 'bg-emerald-50 border-emerald-100' :
                            status === 'missing' ? 'bg-red-50 border-red-100' :
                              'bg-slate-50 border-slate-100'
                          }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${status === 'verified' ? 'bg-white text-emerald-500' : 'bg-white text-slate-400'}`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700">{doc}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDocumentStatus(prev => ({ ...prev, [docKey]: 'verified' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${status === 'verified' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-emerald-50 hover:text-emerald-500'}`}
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => {
                                setDocumentStatus(prev => ({ ...prev, [docKey]: 'missing' }));
                                // Add missing issue logic...
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${status === 'missing' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-red-50 hover:text-red-500'}`}
                            >
                              Missing
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400 italic">No documents required for this cargo.</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button onClick={() => setInspectionStep('physical')}
                  className="flex-1 sm:flex-none px-5 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                  <TranslatedText text="Back" />
                </button>
                <button onClick={() => setInspectionStep('securement')}
                  className="flex-1 px-5 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  <TranslatedText text="Securement Check" /> <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* SECUREMENT STEP */}
          {inspectionStep === 'securement' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <TranslatedText text="Loading & Securement Check" />
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'straps', label: 'Ratchet Straps & Chains', description: 'Tensioned and double-locked' },
                    { id: 'weightDist', label: 'Load Distribution', description: 'Weight centered over axles' },
                    { id: 'blocking', label: 'Blocking & Bracing', description: 'No lateral movement possible' },
                    { id: 'tarping', label: 'Tarping & Protection', description: 'Weatherproofed and secured' }
                  ].map((item) => {
                    const status = checklistStatus[item.id];
                    return (
                      <div key={item.id} className={`p-3 rounded-xl border-2 transition-all ${status === 'passed' ? 'bg-emerald-50 border-emerald-100' : status === 'failed' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-700 truncate"><TranslatedText text={item.label} /></h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic"><TranslatedText text={item.description} /></p>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleChecklistItem(item.id, 'passed')}
                              className={`p-1.5 rounded-lg transition-colors ${status === 'passed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}>
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleChecklistItem(item.id, 'failed')}
                              className={`p-1.5 rounded-lg transition-colors ${status === 'failed' ? 'bg-red-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}>
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button onClick={() => setInspectionStep('documentation')}
                  className="flex-1 sm:flex-none px-5 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                  <TranslatedText text="Back" />
                </button>
                <button onClick={() => setInspectionStep('final')}
                  className="flex-1 px-5 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                  <TranslatedText text="Review & Sign" /> <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* FINAL STEP */}
          {inspectionStep === 'final' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">Final Remarks</h3>
                    <p className="text-slate-400 text-xs mb-3">Add any final notes or observations about this inspection.</p>
                    <textarea
                      value={inspectionResult.notes}
                      onChange={(e) => setInspectionResult(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter detailed inspection notes here..."
                      className="w-full h-28 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] resize-none transition-all"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Inspection Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Physical Checks Passed</span>
                        <span className="font-bold text-slate-900">
                          {Object.values(checklistStatus).filter(s => s === 'passed').length} / {Object.keys(checklistStatus).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Documents Verified</span>
                        <span className="font-bold text-slate-900">
                          {Object.values(documentStatus).filter(s => s === 'verified').length} / {cargo.documents.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button onClick={() => setInspectionStep('securement')}
                  className="flex-1 sm:flex-none px-5 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button
                  onClick={handleInspectionFail}
                  disabled={submitting || !inspectionResult.notes}
                  className="flex-1 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-3.5 h-3.5" /> Fail Inspection
                </button>
                <button
                  onClick={handleInspectionComplete}
                  disabled={submitting || !inspectionResult.notes}
                  className={`flex-1 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                    !inspectionResult.notes || submitting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting...' : 'Approve Inspection'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
