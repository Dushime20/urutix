import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import { documentApi } from '../../services/documents/documentApi';
import { formatLocation } from '../../utils/formatLocation';
import { cn } from '@/utils/cn';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle,
  ChevronRight,
  ClipboardCheck,
  Edit3,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Package,
  Shield,
  Thermometer,
  X,
  XCircle,
} from 'lucide-react';

type InspectionStep = 'overview' | 'physical' | 'documentation' | 'final';
type ChecklistValue = 'passed' | 'failed' | null;
type DocumentValue = 'verified' | 'missing' | null;

interface CargoItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  weight: number;
  volume?: number;
  packagingType?: string;
  dimensions: { length: number; width: number; height: number };
  category: string;
  specialRequirements: string[];
  fragility: 'LOW' | 'MEDIUM' | 'HIGH';
  temperature: { min: number | null; max: number | null; unit: 'C' | 'F' };
  hazardous: boolean;
  hazmatClass?: string;
  documents: string[];
  pickupLocation?: string;
  deliveryLocation?: string;
  pickupDate?: string;
  deliveryDate?: string;
  ownerName?: string;
  status?: string;
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

const STEPS: { id: InspectionStep; label: string; short: string }[] = [
  { id: 'overview', label: 'Overview', short: 'Details' },
  { id: 'physical', label: 'Physical check', short: 'Physical' },
  { id: 'documentation', label: 'Documents', short: 'Docs' },
  { id: 'final', label: 'Review & submit', short: 'Review' },
];

const CHECKLIST_ITEMS = [
  {
    id: 'packaging',
    label: 'Packaging integrity',
    description: 'Outer packaging is intact — no tears, crushing, or water damage.',
  },
  {
    id: 'seals',
    label: 'Seals & closures',
    description: 'Security seals and closures are present and have not been tampered with.',
  },
  {
    id: 'labels',
    label: 'Labels & markings',
    description: 'Shipping labels and handling marks are readable and match the shipment.',
  },
  {
    id: 'contents',
    label: 'Contents condition',
    description: 'Contents appear complete, undamaged, and consistent with the manifest.',
  },
  {
    id: 'temperature',
    label: 'Temperature control',
    description: 'Temperature is within the required range, or ambient storage is acceptable.',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'No signs of tampering, unauthorized access, or missing pieces.',
  },
];

const CARGO_TYPE_LABELS: Record<string, string> = {
  GENERAL: 'General',
  FRAGILE: 'Fragile',
  HAZARDOUS: 'Hazardous',
  REFRIGERATED: 'Refrigerated',
  LIQUID: 'Liquid',
  OVERSIZED: 'Oversized',
  VALUABLE: 'Valuable',
  CONTAINER: 'Container',
  BULK: 'Bulk',
  LIVESTOCK: 'Livestock',
  VEHICLE: 'Vehicle',
  ELECTRONICS: 'Electronics',
  PHARMACEUTICALS: 'Pharmaceuticals',
};

const FRAGILITY_STYLES: Record<string, string> = {
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
};

const STATUS_STYLES: Record<string, string> = {
  PASSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  CONDITIONAL: 'bg-amber-50 text-amber-700 border-amber-200',
};

const MY_CARGOS_PATH = '/dashboard/cargos/my-cargos';

function formatCargoType(value?: string) {
  if (!value) return 'General';
  return CARGO_TYPE_LABELS[value] ?? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function ownerDisplayName(load: any): string | undefined {
  const profile = load?.cargoOwner?.profile;
  if (profile?.firstName || profile?.lastName) {
    return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  }
  return load?.cargoOwner?.email;
}

const CargoInspectionPage: React.FC = () => {
  const { cargoId } = useParams<{ cargoId: string }>();
  const navigate = useNavigate();

  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inspectionStep, setInspectionStep] = useState<InspectionStep>('overview');
  const [inspectionResult, setInspectionResult] = useState<Partial<InspectionResult>>({
    cargoId,
    status: 'PASSED',
    timestamp: new Date().toISOString(),
    inspector: 'Receiver',
    notes: '',
    issues: [],
    photos: [],
    recommendations: [],
    signature: '',
  });

  const [checklistStatus, setChecklistStatus] = useState<Record<string, ChecklistValue>>({
    packaging: null,
    seals: null,
    labels: null,
    contents: null,
    temperature: null,
    security: null,
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; file?: File; id: string }>>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<Record<string, DocumentValue>>({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [existingInspection, setExistingInspection] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (!cargoId) return;

    const fetchCargoData = async () => {
      try {
        setLoading(true);
        const response = await receiverService.getCargoForInspection(cargoId);
        const load = response.cargo;

        const mappedCargo: CargoItem = {
          id: load.id || cargoId || '',
          name: load.title || 'Untitled cargo',
          description: load.description || '',
          quantity: load.numberOfPieces || load.unitsRequired || 0,
          unit: 'pieces',
          weight: load.weight || 0,
          volume: load.volume || undefined,
          packagingType: load.packagingType || undefined,
          dimensions: {
            length: load.length || 0,
            width: load.width || 0,
            height: load.height || 0,
          },
          category: load.cargoType || 'GENERAL',
          specialRequirements: [
            ...(load.isFragile ? ['Fragile'] : []),
            ...(load.requiresRefrigeration ? ['Temperature controlled'] : []),
            ...(load.isHazardous ? ['Hazardous material'] : []),
            ...(load.requiresForklift ? ['Requires forklift'] : []),
            ...(load.requiresCrane ? ['Requires crane'] : []),
            ...(load.requiresLoadingDock ? ['Requires loading dock'] : []),
            ...(load.requiresHumidityControl ? ['Humidity control'] : []),
          ],
          fragility: load.isFragile || load.cargoType === 'FRAGILE' ? 'HIGH' : 'MEDIUM',
          temperature: {
            min: load.temperatureMin ?? null,
            max: load.temperatureMax ?? null,
            unit: 'C',
          },
          hazardous: load.isHazardous || false,
          hazmatClass: load.hazmatClass || undefined,
          documents: load.requiredDocuments || [],
          pickupLocation: formatLocation(load.pickupLocation, ''),
          deliveryLocation: formatLocation(load.deliveryLocation, ''),
          pickupDate: load.pickupDate,
          deliveryDate: load.deliveryDate,
          ownerName: ownerDisplayName(load),
          status: load.status,
        };

        setCargo(mappedCargo);

        try {
          const inspection = await receiverService.getCargoInspection(cargoId);
          if (inspection && (inspection.status === 'COMPLETED' || inspection.allItemsVerified)) {
            setExistingInspection(inspection);
            setIsReadOnly(true);
            setInspectionResult((prev) => ({
              ...prev,
              notes: inspection.overallNotes || inspection.notes || '',
              status: inspection.discrepancyCount > 0 ? 'CONDITIONAL' : 'PASSED',
              timestamp: inspection.inspectedAt || inspection.completedAt || inspection.createdAt || prev.timestamp,
            }));

            if (inspection.checklist && Array.isArray(inspection.checklist)) {
              const nextChecklist: Record<string, ChecklistValue> = {};
              inspection.checklist.forEach((item: any) => {
                const key = item.id || item.label?.toLowerCase();
                if (key) {
                  nextChecklist[key] = item.verified ? 'passed' : item.discrepancy ? 'failed' : null;
                }
              });
              setChecklistStatus((prev) => ({ ...prev, ...nextChecklist }));
            }

            setInspectionStep('final');
          }
        } catch {
          // No existing inspection — start a new one
        }
      } catch (error) {
        console.error('Error fetching cargo data:', error);
        toast.error('Failed to load cargo details');
      } finally {
        setLoading(false);
      }
    };

    fetchCargoData();
  }, [cargoId]);

  const currentStepIndex = STEPS.findIndex((step) => step.id === inspectionStep);

  const checklistProgress = useMemo(() => {
    const values = Object.values(checklistStatus);
    const answered = values.filter((value) => value !== null).length;
    const passed = values.filter((value) => value === 'passed').length;
    const failed = values.filter((value) => value === 'failed').length;
    return { answered, total: values.length, passed, failed, complete: answered === values.length };
  }, [checklistStatus]);

  const unresolvedIssues = useMemo(
    () => (inspectionResult.issues || []).filter((issue) => !issue.resolved),
    [inspectionResult.issues],
  );

  const suggestedStatus = useMemo((): InspectionResult['status'] => {
    if (checklistProgress.failed === 0 && unresolvedIssues.length === 0) return 'PASSED';
    if (checklistProgress.failed >= 3 || unresolvedIssues.some((issue) => issue.severity === 'CRITICAL' || issue.severity === 'HIGH')) {
      return 'FAILED';
    }
    return 'CONDITIONAL';
  }, [checklistProgress.failed, unresolvedIssues]);

  const goBack = () => navigate(MY_CARGOS_PATH);

  const goToStep = (step: InspectionStep, index: number) => {
    if (isReadOnly || index <= currentStepIndex) {
      setInspectionStep(step);
    }
  };

  const upsertIssue = useCallback((issue: InspectionIssue) => {
    setInspectionResult((prev) => {
      const existing = prev.issues || [];
      const index = existing.findIndex((item) => item.id === issue.id);
      if (index >= 0) {
        const next = [...existing];
        next[index] = { ...next[index], ...issue, resolved: next[index].resolved };
        return { ...prev, issues: next };
      }
      return { ...prev, issues: [...existing, issue] };
    });
  }, []);

  const removeIssue = useCallback((issueId: string) => {
    setInspectionResult((prev) => ({
      ...prev,
      issues: (prev.issues || []).filter((issue) => issue.id !== issueId),
    }));
  }, []);

  const updateIssue = (issueId: string, updates: Partial<InspectionIssue>) => {
    setInspectionResult((prev) => ({
      ...prev,
      issues: prev.issues?.map((issue) => (issue.id === issueId ? { ...issue, ...updates } : issue)) || [],
    }));
  };

  const handleChecklistItem = (itemId: string, status: 'passed' | 'failed') => {
    if (isReadOnly) return;
    setChecklistStatus((prev) => ({ ...prev, [itemId]: status }));

    const item = CHECKLIST_ITEMS.find((entry) => entry.id === itemId);
    const issueId = `checklist-${itemId}`;

    if (status === 'failed') {
      upsertIssue({
        id: issueId,
        type: 'DAMAGE',
        severity: 'MEDIUM',
        description: `Issue found: ${item?.label || itemId}`,
        location: 'Physical inspection',
        actionRequired: 'Document the issue and decide whether to accept, reject, or accept with conditions.',
        resolved: false,
      });
    } else {
      removeIssue(issueId);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} must be under 5MB`);
        continue;
      }

      const photoId = `${Date.now()}-${file.name}`;
      let previewUrl: string | null = null;

      try {
        setUploadingPhoto(true);
        previewUrl = URL.createObjectURL(file);
        setUploadedPhotos((prev) => [...prev, { url: previewUrl!, file, id: photoId }]);

        if (documentApi && typeof documentApi.createDocument === 'function') {
          try {
            const uploadedDocument = await documentApi.createDocument(
              {
                entityType: 'CARGO',
                entityId: cargoId || '',
                documentType: 'OTHER',
                category: 'OPERATIONAL',
                title: `Inspection photo — ${new Date().toLocaleString()}`,
                description: 'Cargo inspection photo',
                priority: 'NORMAL',
              },
              file,
            );

            if (uploadedDocument?.fileUrl) {
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setUploadedPhotos((prev) =>
                prev.map((photo) =>
                  photo.id === photoId ? { ...photo, url: uploadedDocument.fileUrl, file: undefined } : photo,
                ),
              );
              setInspectionResult((prev) => ({
                ...prev,
                photos: [...(prev.photos || []), uploadedDocument.fileUrl],
              }));
              toast.success('Photo uploaded');
            }
          } catch {
            setInspectionResult((prev) => ({
              ...prev,
              photos: [...(prev.photos || []), previewUrl!],
            }));
            toast.success('Photo attached');
          }
        } else {
          setInspectionResult((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), previewUrl!],
          }));
        }
      } catch (error) {
        console.error('Error handling photo:', error);
        toast.error('Failed to process photo');
      } finally {
        setUploadingPhoto(false);
      }
    }

    if (event.target) event.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = uploadedPhotos.find((photo) => photo.id === photoId);
    if (!photoToRemove) return;

    if (photoToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }

    setUploadedPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    setInspectionResult((prev) => ({
      ...prev,
      photos: prev.photos?.filter((url) => url !== photoToRemove.url) || [],
    }));
  };

  const continueFromPhysical = () => {
    if (!checklistProgress.complete) {
      toast.error('Please mark Pass or Fail on every physical check before continuing.');
      return;
    }
    setInspectionStep('documentation');
  };

  const continueFromDocuments = () => {
    if (cargo?.documents.length) {
      const pending = cargo.documents.some((_, index) => !documentStatus[`doc-${index}`]);
      if (pending) {
        toast.error('Please verify or mark missing for every required document.');
        return;
      }
    }
    setInspectionResult((prev) => ({ ...prev, status: prev.status || suggestedStatus }));
    setInspectionStep('final');
  };

  const handleInspectionComplete = async () => {
    if (!inspectionResult.status) {
      toast.error('Please select an inspection result.');
      return;
    }
    if (!inspectionResult.notes?.trim()) {
      toast.error('Please add inspector notes before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const checklistItems = Object.entries(checklistStatus).map(([key, value]) => ({
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        originalValue: 'N/A',
        verified: value === 'passed',
        discrepancy: value === 'failed',
        notes: value === 'failed' ? 'Marked as failed during physical inspection' : undefined,
      }));

      await receiverService.submitCargoInspection(cargoId!, {
        loadId: cargoId!,
        checklist: checklistItems,
        overallNotes: inspectionResult.notes,
      });

      toast.success('Inspection submitted');
      navigate(MY_CARGOS_PATH);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-5 animate-pulse">
          <div className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
          <div className="h-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="h-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
            <div className="h-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cargo not found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This shipment may not be assigned to you, or it is no longer available.
          </p>
          <button
            onClick={goBack}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to my cargos
          </button>
        </div>
      </div>
    );
  }

  const dimensionsLabel =
    cargo.dimensions.length > 0 && cargo.dimensions.width > 0 && cargo.dimensions.height > 0
      ? `${cargo.dimensions.length} × ${cargo.dimensions.width} × ${cargo.dimensions.height} cm`
      : 'Not specified';

  const temperatureLabel =
    cargo.temperature.min !== null || cargo.temperature.max !== null
      ? `${cargo.temperature.min ?? '—'}°${cargo.temperature.unit} to ${cargo.temperature.max ?? '—'}°${cargo.temperature.unit}`
      : 'Ambient';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-40 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary-700 via-primary-500 to-primary-300" />
          <div className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                <button
                  onClick={goBack}
                  className="flex-shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Back to my cargos"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                </button>
                <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <ClipboardCheck className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight truncate">
                      {cargo.name}
                    </h1>
                    {isReadOnly ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                        <Eye className="w-3.5 h-3.5" />
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        In progress
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                    <span>Cargo inspection</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="font-mono text-xs">{cargo.id.slice(0, 8)}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{formatCargoType(cargo.category)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 lg:text-right">
                <span className="font-medium text-slate-700 dark:text-slate-200">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </span>
                <span className="hidden sm:inline">· {STEPS[currentStepIndex].label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <nav className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 shadow-sm">
          <div className="sm:hidden">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-slate-800 dark:text-slate-100">{STEPS[currentStepIndex].label}</span>
              <span className="text-slate-500">{currentStepIndex + 1}/{STEPS.length}</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <ol className="hidden sm:flex items-center">
            {STEPS.map((step, index) => {
              const isActive = inspectionStep === step.id;
              const isComplete = isReadOnly || index < currentStepIndex;
              const canOpen = isReadOnly || index <= currentStepIndex;

              return (
                <li key={step.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    disabled={!canOpen}
                    onClick={() => goToStep(step.id, index)}
                    className={cn(
                      'flex items-center gap-3 text-left min-w-0',
                      canOpen ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <span
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 border',
                        isActive && 'bg-primary-600 text-white border-primary-600',
                        isComplete && !isActive && 'bg-emerald-500 text-white border-emerald-500',
                        !isActive && !isComplete && 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
                      )}
                    >
                      {isComplete && !isActive ? <CheckCircle className="w-4 h-4" /> : index + 1}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-primary-700 dark:text-primary-300' : isComplete ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400',
                      )}
                    >
                      {step.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-px mx-4',
                        isComplete ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-slate-200 dark:bg-slate-700',
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Overview */}
        {inspectionStep === 'overview' && (
          <div className="space-y-5">
            {(cargo.pickupLocation || cargo.deliveryLocation) && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                  <RoutePoint
                    title="Pickup"
                    location={cargo.pickupLocation}
                    date={formatDate(cargo.pickupDate)}
                  />
                  <ChevronRight className="hidden sm:block w-5 h-5 text-slate-300 mx-auto" />
                  <RoutePoint
                    title="Delivery"
                    location={cargo.deliveryLocation}
                    date={formatDate(cargo.deliveryDate)}
                    align="right"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <SectionTitle icon={<Package className="w-4 h-4" />} title="Shipment details" />
                {cargo.description && (
                  <p className="mb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{cargo.description}</p>
                )}
                <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                  <DetailRow label="Cargo" value={cargo.name} />
                  <DetailRow label="Type" value={formatCargoType(cargo.category)} />
                  <DetailRow
                    label="Quantity"
                    value={cargo.quantity > 0 ? `${cargo.quantity} ${cargo.unit}` : 'Not specified'}
                  />
                  <DetailRow
                    label="Weight"
                    value={cargo.weight > 0 ? `${cargo.weight} kg` : 'Not specified'}
                  />
                  {cargo.volume ? <DetailRow label="Volume" value={`${cargo.volume} m³`} /> : null}
                  <DetailRow label="Dimensions" value={dimensionsLabel} />
                  {cargo.packagingType ? (
                    <DetailRow label="Packaging" value={formatCargoType(cargo.packagingType)} />
                  ) : null}
                  {cargo.ownerName ? <DetailRow label="Shipper" value={cargo.ownerName} /> : null}
                </dl>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <SectionTitle icon={<Shield className="w-4 h-4" />} title="Handling requirements" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300">Fragility</span>
                    <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border', FRAGILITY_STYLES[cargo.fragility])}>
                      {cargo.fragility.charAt(0) + cargo.fragility.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                    <span className="text-sm text-slate-600 dark:text-slate-300 inline-flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-slate-400" />
                      Temperature
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{temperatureLabel}</span>
                  </div>
                  {cargo.hazardous && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800 px-4 py-3">
                      <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Hazardous material</p>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                          Class {cargo.hazmatClass || 'not specified'} — inspect with extra care.
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Special requirements</p>
                    {cargo.specialRequirements.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cargo.specialRequirements.map((req) => (
                          <span
                            key={req}
                            className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                          >
                            {req}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No special handling notes.</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* Physical */}
        {inspectionStep === 'physical' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Physical inspection</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Check the shipment against each item. Mark pass or fail before continuing.
                </p>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {checklistProgress.answered} of {checklistProgress.total} complete
                {checklistProgress.failed > 0 && (
                  <span className="text-rose-600"> · {checklistProgress.failed} failed</span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHECKLIST_ITEMS.map((item) => {
                const status = checklistStatus[item.id];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm transition-colors',
                      status === 'passed' && 'border-emerald-200 dark:border-emerald-800',
                      status === 'failed' && 'border-rose-200 dark:border-rose-800',
                      !status && 'border-slate-200 dark:border-slate-800',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                      </div>
                      {status && (
                        <span
                          className={cn(
                            'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                            status === 'passed' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white',
                          )}
                        >
                          {status === 'passed' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleChecklistItem(item.id, 'passed')}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors',
                          status === 'passed'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-700',
                        )}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleChecklistItem(item.id, 'failed')}
                        className={cn(
                          'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors',
                          status === 'failed'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-700',
                        )}
                      >
                        Fail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <SectionTitle icon={<Camera className="w-4 h-4" />} title="Photo evidence" className="mb-0" />
                {uploadedPhotos.length > 0 && (
                  <span className="text-xs font-medium text-slate-500">
                    {uploadedPhotos.length} photo{uploadedPhotos.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Add photos of packaging, seals, and any damage. Max 5MB per image.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-950/20 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto || isReadOnly}
                    className="hidden"
                  />
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-slate-400 mb-1.5" />
                      <span className="text-xs font-medium text-slate-500">Add photo</span>
                    </>
                  )}
                </label>
                {uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                    <img src={photo.url} alt="Inspection" className="w-full h-full object-cover" />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/60 text-white hover:bg-rose-600"
                        aria-label="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Documents */}
        {inspectionStep === 'documentation' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Document verification</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Confirm that required paperwork arrived with the shipment.
              </p>
            </div>

            {cargo.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cargo.documents.map((doc, index) => {
                  const docKey = `doc-${index}`;
                  const status = documentStatus[docKey];
                  return (
                    <div
                      key={docKey}
                      className={cn(
                        'bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-sm',
                        status === 'verified' && 'border-emerald-200 dark:border-emerald-800',
                        status === 'missing' && 'border-rose-200 dark:border-rose-800',
                        !status && 'border-slate-200 dark:border-slate-800',
                      )}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{doc}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {status === 'verified' ? 'Verified' : status === 'missing' ? 'Missing' : 'Pending review'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => {
                            setDocumentStatus((prev) => ({ ...prev, [docKey]: 'verified' }));
                            removeIssue(docKey);
                          }}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors',
                            status === 'verified'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-300 hover:text-emerald-700',
                          )}
                        >
                          Verified
                        </button>
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => {
                            setDocumentStatus((prev) => ({ ...prev, [docKey]: 'missing' }));
                            upsertIssue({
                              id: docKey,
                              type: 'DOCUMENTATION',
                              severity: 'MEDIUM',
                              description: `Missing or incomplete: ${doc}`,
                              location: 'Documentation',
                              actionRequired: 'Request a replacement copy from the shipper.',
                              resolved: false,
                            });
                          }}
                          className={cn(
                            'flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors',
                            status === 'missing'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-700',
                          )}
                        >
                          Missing
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No required documents listed</p>
                <p className="text-sm text-slate-500 mt-1">You can continue to the review step.</p>
              </div>
            )}

            {(inspectionResult.issues?.length || 0) > 0 && (
              <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <SectionTitle icon={<AlertTriangle className="w-4 h-4" />} title="Issues found" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inspectionResult.issues!.map((issue) => (
                    <div
                      key={issue.id}
                      className={cn(
                        'rounded-xl border p-4',
                        issue.resolved
                          ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {issue.severity} · {issue.type.replace(/_/g, ' ')}
                        </span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => updateIssue(issue.id, { resolved: !issue.resolved })}
                            className={cn(
                              'text-xs font-semibold px-2 py-1 rounded-lg border',
                              issue.resolved
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white dark:bg-slate-900 text-slate-600 border-slate-200 dark:border-slate-700',
                            )}
                          >
                            {issue.resolved ? 'Resolved' : 'Mark resolved'}
                          </button>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{issue.description}</p>
                      <p className="text-xs text-slate-500 mt-1">{issue.actionRequired}</p>
                      {issue.resolved && !isReadOnly && (
                        <textarea
                          placeholder="Resolution notes"
                          className="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-200"
                          rows={2}
                          value={issue.resolutionNotes || ''}
                          onChange={(e) => updateIssue(issue.id, { resolutionNotes: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Final review */}
        {inspectionStep === 'final' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isReadOnly ? 'Inspection report' : 'Review & submit'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isReadOnly
                  ? 'This inspection has already been submitted.'
                  : 'Confirm the result, add notes, and submit. This cannot be changed later.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Physical checks</h3>
                    <ul className="space-y-2.5">
                      {CHECKLIST_ITEMS.map((item) => {
                        const status = checklistStatus[item.id];
                        return (
                          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                            <StatusPill status={status} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Documents</h3>
                    {cargo.documents.length > 0 ? (
                      <ul className="space-y-2.5">
                        {cargo.documents.map((doc, index) => {
                          const status = documentStatus[`doc-${index}`];
                          return (
                            <li key={doc} className="flex items-center justify-between gap-3 text-sm">
                              <span className="text-slate-600 dark:text-slate-300 truncate">{doc}</span>
                              <span
                                className={cn(
                                  'text-xs font-semibold flex-shrink-0',
                                  status === 'verified' && 'text-emerald-600',
                                  status === 'missing' && 'text-rose-600',
                                  !status && 'text-slate-400',
                                )}
                              >
                                {status === 'verified' ? 'Verified' : status === 'missing' ? 'Missing' : 'Pending'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">None required</p>
                    )}
                    <p className="mt-4 text-xs text-slate-500">
                      {uploadedPhotos.length} photo{uploadedPhotos.length === 1 ? '' : 's'} attached
                    </p>
                  </div>
                </div>

                {unresolvedIssues.length > 0 && (
                  <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-500 mb-3">Unresolved issues</h3>
                    <div className="space-y-2">
                      {unresolvedIssues.map((issue) => (
                        <div key={issue.id} className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-800 px-4 py-3">
                          <p className="text-sm font-medium text-rose-800 dark:text-rose-300">{issue.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                  <SectionTitle icon={<Edit3 className="w-4 h-4" />} title="Inspector notes" className="mb-3" />
                  {isReadOnly ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {inspectionResult.notes || 'No notes recorded.'}
                    </p>
                  ) : (
                    <>
                      <textarea
                        placeholder="Summarize the condition of the cargo, any discrepancies, and the decision."
                        className="w-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                        value={inspectionResult.notes || ''}
                        onChange={(e) => setInspectionResult((prev) => ({ ...prev, notes: e.target.value }))}
                      />
                      <p className="mt-1.5 text-xs text-slate-400">Required before submitting.</p>
                    </>
                  )}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Inspection result</h3>
                  {isReadOnly ? (
                    <span className={cn('inline-flex px-3 py-1.5 rounded-lg text-sm font-semibold border', STATUS_STYLES[inspectionResult.status || 'PASSED'])}>
                      {inspectionResult.status === 'PASSED' ? 'Passed' : inspectionResult.status === 'FAILED' ? 'Failed' : 'Conditional'}
                    </span>
                  ) : (
                    <div className="space-y-2">
                      {(
                        [
                          { id: 'PASSED', label: 'Pass', hint: 'Cargo accepted as received' },
                          { id: 'CONDITIONAL', label: 'Conditional', hint: 'Accept with noted issues' },
                          { id: 'FAILED', label: 'Fail', hint: 'Do not accept this cargo' },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setInspectionResult((prev) => ({ ...prev, status: option.id }))}
                          className={cn(
                            'w-full text-left rounded-xl border px-3 py-2.5 transition-colors',
                            inspectionResult.status === option.id
                              ? 'border-primary-400 bg-primary-50 dark:bg-primary-950/30'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300',
                          )}
                        >
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{option.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{option.hint}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isReadOnly ? (
                  <div className="bg-slate-900 text-white rounded-2xl p-5">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Completed</p>
                    <p className="mt-1 text-sm font-medium">
                      {existingInspection?.inspectedAt || existingInspection?.completedAt
                        ? new Date(existingInspection.inspectedAt || existingInspection.completedAt).toLocaleString()
                        : 'Date not available'}
                    </p>
                    <button
                      type="button"
                      onClick={goBack}
                      className="mt-4 w-full py-2.5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100"
                    >
                      Back to my cargos
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Submitting certifies that you inspected this cargo and that the notes and result are accurate.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* Footer actions */}
        {!isReadOnly && (
          <div className="fixed bottom-20 lg:static inset-x-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t lg:border lg:rounded-2xl border-slate-200 dark:border-slate-800 px-4 py-3 lg:p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] lg:shadow-sm">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
              {inspectionStep === 'overview' ? (
                <>
                  <button type="button" onClick={goBack} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-2">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectionStep('physical')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                  >
                    Start inspection
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : inspectionStep === 'physical' ? (
                <>
                  <button type="button" onClick={() => setInspectionStep('overview')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={continueFromPhysical}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : inspectionStep === 'documentation' ? (
                <>
                  <button type="button" onClick={() => setInspectionStep('physical')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={continueFromDocuments}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                  >
                    Continue to review
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setInspectionStep('documentation')} className="text-sm font-medium text-slate-500 hover:text-slate-800 px-3 py-2">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Submit inspection
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Submit this inspection?</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                The result will be recorded against this cargo and cannot be edited afterwards.
              </p>
              <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                Result:{' '}
                {inspectionResult.status === 'PASSED'
                  ? 'Pass'
                  : inspectionResult.status === 'FAILED'
                    ? 'Fail'
                    : 'Conditional'}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowConfirmModal(false);
                  handleInspectionComplete();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function SectionTitle({
  icon,
  title,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5 mb-5', className)}>
      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800 dark:text-slate-100 text-right">{value}</dd>
    </div>
  );
}

function RoutePoint({
  title,
  location,
  date,
  align,
}: {
  title: string;
  location?: string;
  date: string | null;
  align?: 'right';
}) {
  return (
    <div className={cn(align === 'right' && 'sm:text-right')}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">{title}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 inline-flex items-start gap-1.5">
        <MapPin className={cn('w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0', align === 'right' && 'sm:order-2')} />
        <span>{location || 'Not specified'}</span>
      </p>
      {date && <p className="text-xs text-slate-500 mt-1">{date}</p>}
    </div>
  );
}

function StatusPill({ status }: { status: ChecklistValue }) {
  if (status === 'passed') {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle className="w-3.5 h-3.5" /> Pass</span>;
  }
  if (status === 'failed') {
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><XCircle className="w-3.5 h-3.5" /> Fail</span>;
  }
  return <span className="text-xs font-medium text-slate-400">Not checked</span>;
}

export default CargoInspectionPage;
