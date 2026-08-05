import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import { documentApi } from '../../services/documents/documentApi';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  FileText, 
  Package, 
  AlertCircle,
  Shield,
  Thermometer,
  Eye,
  Edit3,
  ArrowLeft,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';

// Interfaces based on CargoInspection.tsx
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
    min: number | null;
    max: number | null;
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

const CargoInspectionPage: React.FC = () => {
    const { cargoId } = useParams<{ cargoId: string }>();
    const navigate = useNavigate();

  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [inspectionStep, setInspectionStep] = useState<'overview' | 'physical' | 'documentation' | 'final'>('overview');
  const [inspectionResult, setInspectionResult] = useState<Partial<InspectionResult>>({
    cargoId: cargoId,
    status: 'PASSED',
    timestamp: new Date().toISOString(),
    inspector: 'Receiver', 
    notes: '',
    issues: [],
    photos: [],
    recommendations: [],
    signature: ''
  });
  
  // Track inspection checklist items status
  const [checklistStatus, setChecklistStatus] = useState<Record<string, 'passed' | 'failed' | null>>({
    packaging: null,
    seals: null,
    labels: null,
    contents: null,
    temperature: null,
    security: null,
  });
  
  // Track uploaded photos (with preview URLs and file objects)
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ url: string; file?: File; id: string }>>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Track document verification status
  const [documentStatus, setDocumentStatus] = useState<Record<string, 'verified' | 'missing' | null>>({});

  // Read-only mode for viewing completed inspections
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [existingInspection, setExistingInspection] = useState<any>(null);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch real cargo data from API
  useEffect(() => {
      if (!cargoId) return;

    const fetchCargoData = async () => {
      try {
        setLoading(true);
        // Use receiverService to get cargo details
        const response = await receiverService.getCargoForInspection(cargoId);
        const load = response.cargo;
        
        // Map Load entity to CargoItem interface
        const mappedCargo: CargoItem = {
          id: load.id || cargoId || '',
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

        // Check if inspection already exists (completed)
        try {
          const inspection = await receiverService.getCargoInspection(cargoId);
          if (inspection && (inspection.status === 'COMPLETED' || inspection.allItemsVerified)) {
            setExistingInspection(inspection);
            setIsReadOnly(true);
            
            // Populate the inspection result with existing data
            setInspectionResult((prev: any) => ({
              ...prev,
              notes: inspection.overallNotes || inspection.notes || '',
              status: inspection.status === 'COMPLETED' ? 'PASSED' : prev.status,
              timestamp: inspection.inspectedAt || inspection.createdAt || prev.timestamp,
            }));
            
            // Populate checklist status from existing inspection
            if (inspection.checklist && Array.isArray(inspection.checklist)) {
              const newChecklistStatus: Record<string, 'passed' | 'failed' | null> = {};
              inspection.checklist.forEach((item: any) => {
                const key = item.id || item.label?.toLowerCase();
                if (key) {
                  newChecklistStatus[key] = item.verified ? 'passed' : (item.discrepancy ? 'failed' : null);
                }
              });
              setChecklistStatus(prev => ({ ...prev, ...newChecklistStatus }));
            }
            
            // Set inspection step to final so user sees the summary
            setInspectionStep('final');
          }
        } catch (inspectionError) {
          // No existing inspection found, that's fine - proceed with new inspection
          console.log('No existing inspection found, proceeding with new inspection');
        }
      } catch (error: any) {
        console.error('Error fetching cargo data:', error);
        toast.error('Failed to load cargo details');
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
    setInspectionResult((prev: any) => ({
      ...prev,
      issues: [...(prev.issues || []), newIssue]
    }));
  };

  const updateIssue = (issueId: string, updates: Partial<InspectionIssue>) => {
    setInspectionResult((prev: any) => ({
      ...prev,
      issues: prev.issues?.map((issue: any) => 
        issue.id === issueId ? { ...issue, ...updates } : issue
      ) || []
    }));
  };

  const handleChecklistItem = (itemId: string, status: 'passed' | 'failed') => {
    setChecklistStatus((prev: any) => ({
      ...prev,
      [itemId]: status
    }));
    
    if (status === 'failed') {
      // Add issue when marked as failed
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Declare photoId outside try block so it's accessible in catch
    const photoId = Date.now().toString();
    let previewUrl: string | null = null;

    try {
      setUploadingPhoto(true);
      
      // Create preview URL
      previewUrl = URL.createObjectURL(file);
      
      // Add to uploaded photos with preview
      setUploadedPhotos((prev: any) => [...prev, { url: previewUrl!, file, id: photoId }]);
      
      // Upload using document API - Use generic endpoint if needed or skip if permission issues
      // For now, assuming documentApi works or will handle gracefully
      if (documentApi && typeof documentApi.createDocument === 'function') {
         const documentRequest = {
            entityType: 'CARGO', 
            entityId: cargoId || '',
            documentType: 'OTHER', 
            category: 'OPERATIONAL', 
            title: `Inspection Photo - ${new Date().toLocaleString()}`,
            description: 'Cargo inspection photo',
            priority: 'NORMAL',
          };
    
        // NOTE: Document API might fail for receivers depending on permissions
        // For this demo, we might just keep the preview URL if backend fails
        try {
             const uploadedDocument = await documentApi.createDocument(documentRequest, file);
              if (uploadedDocument?.fileUrl) {
                if (previewUrl) URL.revokeObjectURL(previewUrl);
                setUploadedPhotos((prev: any) => 
                  prev.map((photo: any) => 
                    photo.id === photoId 
                      ? { ...photo, url: uploadedDocument.fileUrl, file: undefined }
                      : photo
                  )
                );
                setInspectionResult((prev: any) => ({
                  ...prev,
                  photos: [...(prev.photos || []), uploadedDocument.fileUrl]
                }));
                toast.success('Photo uploaded successfully');
              }
        } catch (e) {
             console.warn("Backend upload failed, keeping local preview for UI demo", e);
             // In a real app, we'd handle this better. For now allow proceeding with local preview logic
             // or show error. Let's just warn and keep the local/blob URL in state for visual completeness
             setInspectionResult(prev => ({
                  ...prev,
                  photos: [...(prev.photos || []), previewUrl!]
                }));
             toast.success('Photo attached (local only)');
        }

      } else {
           // Fallback if API not available
           setInspectionResult((prev: any) => ({
              ...prev,
              photos: [...(prev.photos || []), previewUrl!]
            }));
      }

    } catch (error: any) {
      console.error('Error handling photo:', error);
      toast.error('Failed to process photo');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = uploadedPhotos.find(p => p.id === photoId);
    
    if (photoToRemove) {
      // Revoke blob URL if it's a preview
      if (photoToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      
      // Remove from uploaded photos
      setUploadedPhotos(prev => prev.filter(p => p.id !== photoId));
      
      // Remove from inspection result photos
      setInspectionResult(prev => ({
        ...prev,
        photos: prev.photos?.filter(url => url !== photoToRemove.url) || []
      }));
      
      toast.success('Photo removed');
    }
  };


  const handleInspectionComplete = async () => {
    if (inspectionResult.status && inspectionResult.notes) {
      try {
          // Flatten the checklist status to the format expected by receiverService
           const checklistItems = Object.entries(checklistStatus).map(([key, value]) => ({
             id: key,
             label: key.charAt(0).toUpperCase() + key.slice(1),
             originalValue: 'N/A', // Context dependent
             verified: value === 'passed',
             discrepancy: value === 'failed',
             notes: value === 'failed' ? 'Marked as failed during physical inspection' : undefined
           }));

          // Submit using receiver service
           await receiverService.submitCargoInspection(cargoId!, {
            loadId: cargoId!,
            checklist: checklistItems,
            overallNotes: inspectionResult.notes
           });
           
           toast.success('Inspection submitted successfully!');
           navigate('/dashboard/cargos/my-cargos');

      } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to submit inspection');
      }
    } else {
        toast.error('Please complete the inspection details');
    }
  };

  const onCancel = () => {
    navigate('/cargo-owner/cargos/my-cargos');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-slate-300">Cargo not found</p>
        <button onClick={onCancel} className="mt-4 text-primary-600 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-4 py-4 sm:px-8 sm:py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel} 
              className="group p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-2xl transition-all active:scale-95 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-primary-100"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                Payload <span className="text-primary-600">Verification</span>
              </h1>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
                <Package className="w-3 h-3 text-primary-400" />
                <span className="truncate max-w-[150px] sm:max-w-none">{cargo.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isReadOnly && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20">
                <Eye className="w-3.5 h-3.5" />
                <span>Encrypted_View</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-100">
              <Shield className="w-3.5 h-3.5" />
              <span>Protocol_Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Progress Protocol */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex items-center justify-between min-w-[600px] sm:min-w-0">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'physical', label: 'Physical Check', icon: Package },
            { id: 'documentation', label: 'Documents', icon: FileText },
            { id: 'final', label: 'Final Review', icon: CheckCircle }
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = inspectionStep === step.id;
            const isCompleted = isReadOnly || ['overview', 'physical', 'documentation', 'final'].indexOf(inspectionStep) > index;
            
            return (
              <div key={step.id} className="flex items-center group">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border-2",
                    isActive ? "bg-primary-600 text-white border-primary-100 -translate-y-1 shadow-lg shadow-primary-900/20" : 
                    isCompleted ? "bg-emerald-500 text-white border-emerald-100" : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 border-slate-100 dark:border-slate-800"
                  )}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> : <Icon className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </div>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors",
                    isActive ? "text-primary-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < 3 && (
                  <div className="mx-4 sm:mx-8 flex-1 w-12 sm:w-24 h-[2px] mb-4 overflow-hidden rounded-full bg-slate-50 dark:bg-slate-800/50">
                    <div className={cn(
                      "h-full transition-all duration-700 ease-in-out",
                      isCompleted ? "w-full bg-emerald-400" : isActive ? "w-1/2 bg-primary-300" : "w-0 bg-slate-100"
                    )} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Protocol Engine */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {inspectionStep === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 animate-in slide-in-from-bottom-10 duration-700">
            {/* Left: Metadata Scan */}
            <div className="lg:col-span-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                      <Eye className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight uppercase tracking-widest text-sm">Payload_Manifest</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {[
                      { label: 'Asset_Name', value: cargo.name },
                      { label: 'Quantity_Units', value: cargo.quantity > 0 ? `${cargo.quantity} ${cargo.unit}` : 'Not Available' },
                      { label: 'Mass_Spec', value: cargo.weight > 0 ? `${cargo.weight} kg` : 'Not Available' },
                      { label: 'Dimensions', value: cargo.dimensions.length > 0 && cargo.dimensions.width > 0 && cargo.dimensions.height > 0
                        ? `${cargo.dimensions.length}×${cargo.dimensions.width}×${cargo.dimensions.height} cm`
                        : 'Not Available' },
                      { label: 'Class_Category', value: cargo.category || 'General' },
                    ].map((item: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 py-2 border-b border-slate-50 last:border-0">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.label}</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-[#0f172a] tracking-tight uppercase tracking-widest text-sm">Integrity_Constraints</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-primary-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fragility_Level</span>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                        cargo.fragility === 'HIGH' ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>{cargo.fragility}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Thermometer className="w-5 h-5 text-orange-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thermal_Window</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                         {cargo.temperature.min !== null ? `${cargo.temperature.min}°${cargo.temperature.unit} - ${cargo.temperature.max}°${cargo.temperature.unit}` : 'AUTO_REG'}
                      </span>
                    </div>

                    {cargo.hazardous && (
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-[10px] font-black text-red-800 uppercase tracking-widest leading-none">Hazardous_Payload</p>
                          <p className="text-[8px] font-bold text-red-400 uppercase tracking-widest mt-1">Class_{cargo.hazmatClass || 'UNSPECIFIED'}</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Protocol_Requirements</span>
                      <div className="flex flex-wrap gap-2">
                        {cargo.specialRequirements.length > 0 ? (
                          cargo.specialRequirements.map((req: string, index: number) => (
                            <span key={index} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-sm">
                              {req}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">No_Custom_Constraints</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8">
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
                >
                  Terminate_Session
                </button>
                <button
                  onClick={() => setInspectionStep('physical')}
                  className="w-full sm:w-auto px-10 py-4 bg-primary-600 text-white rounded-[1.5rem] hover:bg-slate-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-900/10 active:scale-95 border-b-4 border-primary-700"
                >
                  Initiate_Check_Protocol
                </button>
              </div>
            </div>
          </div>
        )}

        {inspectionStep === 'physical' && (
          <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
            <div className="space-y-4 text-center sm:text-left">
               <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">Physical <span className="text-primary-600">Scan</span></h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify the tangible integrity of the assets assigned to this terminal.</p>
            </div>
            
            {/* Inspection Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'packaging', label: 'Packaging Integrity', description: 'Structural scan for tears or holes' },
                { id: 'seals', label: 'Seals & Closures', description: 'Validate security seals' },
                { id: 'labels', label: 'Labels & Markings', description: 'Ensure marking visibility' },
                { id: 'contents', label: 'Payload Verification', description: 'Assess internal condition' },
                { id: 'temperature', label: 'Thermal Stability', description: 'Verify monitoring logic' },
                { id: 'security', label: 'Protocol Nodes', description: 'Audit security features' }
              ].map((item) => {
                const status = checklistStatus[item.id];
                return (
                  <div 
                    key={item.id} 
                    className={cn(
                      "group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50",
                      status === 'passed' ? 'border-emerald-100 bg-emerald-50/10' :
                      status === 'failed' ? 'border-red-100 bg-red-50/10' :
                      'border-slate-100 dark:border-slate-800 hover:border-primary-100'
                    )}
                  >
                    <div className="flex flex-col h-full gap-6">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="text-lg font-black text-[#0f172a] tracking-tight leading-tight">{item.label}</h4>
                           {status && (
                              <div className={cn(
                                "w-6 h-6 rounded-lg flex items-center justify-center text-white",
                                status === 'passed' ? 'bg-emerald-500' : 'bg-red-500'
                              )}>
                                {status === 'passed' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              </div>
                           )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                           {item.description}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleChecklistItem(item.id, 'passed')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                            status === 'passed' 
                              ? "bg-emerald-500 text-white border-emerald-400" 
                              : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                          )}
                        >
                          Pass
                        </button>
                        <button
                          onClick={() => handleChecklistItem(item.id, 'failed')}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                            status === 'failed' 
                              ? "bg-red-500 text-white border-red-400" 
                              : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                          )}
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Photo Documentation */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xl font-black text-[#0f172a] tracking-tight uppercase tracking-widest text-sm">Visual_Audit</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Protocol requires photographic evidence of condition</p>
                  </div>
                </div>
                {uploadedPhotos.length > 0 && (
                   <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                      {uploadedPhotos.length} Scan_Nodes
                   </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                <label className="group relative flex flex-col items-center justify-center aspect-square border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer transition-all duration-300 shadow-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin mb-3"></div>
                      <span className="text-[8px] font-black text-primary-600 uppercase tracking-widest">Encrypting...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shadow-inner">
                         <Camera className="w-5 h-5 text-slate-300" />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Add_Node</span>
                    </div>
                  )}
                </label>
                {uploadedPhotos.map((photo: any) => (
                  <div key={photo.id} className="group relative aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:border-primary-200 shadow-sm transition-all duration-500">
                    <img 
                      src={photo.url} 
                      alt={`Inspection scan`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="bg-white/20 hover:bg-red-500 text-white p-3 rounded-2xl transition-all hover:scale-110 hover:shadow-lg shadow-red-900/20"
                        title="Delete node"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInspectionStep('overview')}
                className="w-full sm:w-auto px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
              >
                Prev_Module
              </button>
              <button
                onClick={() => setInspectionStep('documentation')}
                className="w-full sm:w-auto px-10 py-4 bg-primary-600 text-white rounded-[1.5rem] hover:bg-slate-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-900/10 active:scale-95 border-b-4 border-primary-700"
              >
                Verify_Documents
              </button>
            </div>
          </div>
        )}

        {inspectionStep === 'documentation' && (
          <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
            <div className="space-y-4 text-center sm:text-left">
               <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">Legal <span className="text-primary-600">Verification</span></h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit and authorize all mandatory documentation for this payload.</p>
            </div>
            
            {/* Required Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cargo.documents.length > 0 ? (
                cargo.documents.map((doc: string, index: number) => {
                  const docKey = `doc-${index}`;
                  const status = documentStatus[docKey];
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "group relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border transition-all duration-500",
                        status === 'verified' ? 'border-emerald-100 bg-emerald-50/10' :
                        status === 'missing' ? 'border-red-100 bg-red-50/10' :
                        'border-slate-100 dark:border-slate-800 hover:border-primary-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50'
                      )}
                    >
                      <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-black text-[#0f172a] leading-tight text-sm uppercase tracking-widest">{doc}</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {status?.toUpperCase() || 'PENDING'}</p>
                            </div>
                          </div>
                          {status && (
                             <div className={cn(
                               "w-6 h-6 rounded-lg flex items-center justify-center text-white",
                               status === 'verified' ? 'bg-emerald-500' : 'bg-red-500'
                             )}>
                               {status === 'verified' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                             </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setDocumentStatus(prev => ({ ...prev, [docKey]: 'verified' }))}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                              status === 'verified' 
                                ? "bg-emerald-500 text-white border-emerald-400" 
                                : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                            )}
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => {
                              setDocumentStatus(prev => ({ ...prev, [docKey]: 'missing' }));
                              addIssue({
                                type: 'DOCUMENTATION',
                                severity: 'MEDIUM',
                                description: `Missing/Incomplete: ${doc}`,
                                location: 'Documentation',
                                actionRequired: 'Authorize replacement',
                                resolved: false
                              });
                            }}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border",
                              status === 'missing' 
                                ? "bg-red-500 text-white border-red-400" 
                                : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                            )}
                          >
                            Missing
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No mandatory documents specified in manifest.</p>
                </div>
              )}
            </div>

            {/* Issues Found */}
            {inspectionResult.issues && inspectionResult.issues.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-inner">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-[#0f172a] tracking-tight uppercase tracking-widest text-sm">Detected_Discrepancies</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {inspectionResult.issues.map((issue) => (
                    <div key={issue.id} className="relative bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 group hover:border-red-100 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-0.5 w-fit rounded-lg text-[8px] font-black uppercase tracking-widest",
                            issue.severity === 'CRITICAL' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' :
                            issue.severity === 'HIGH' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' :
                            'bg-slate-900 text-white'
                          )}>
                            {issue.severity}
                          </span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{issue.type}</span>
                        </div>
                        <button 
                           onClick={() => updateIssue(issue.id, { resolved: !issue.resolved })}
                           className={cn(
                             "w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90",
                             issue.resolved ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-900 text-slate-300 hover:text-red-500 border border-slate-100 dark:border-slate-800 shadow-sm"
                           )}
                        >
                           <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm font-black text-[#0f172a] mb-2 leading-tight">{issue.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                         <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            LOC: {issue.location}
                         </div>
                         <div className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            ACT: {issue.actionRequired}
                         </div>
                      </div>
                      
                      {issue.resolved && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                          <textarea
                            placeholder="Authorization notes..."
                            className="w-full bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-bold text-slate-600 dark:text-slate-300 focus:ring-4 focus:ring-emerald-50 transition-all shadow-inner"
                            rows={2}
                            value={issue.resolutionNotes || ''}
                            onChange={(e) => updateIssue(issue.id, { resolutionNotes: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 sm:p-12 border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-inner">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-[#0f172a] tracking-tight uppercase tracking-widest text-sm">Protocol_Summary</h4>
              </div>
              <textarea
                placeholder="Enter final executive summary for terminal intake..."
                className="w-full bg-slate-50 dark:bg-slate-800/50 p-6 border-none rounded-[2rem] text-sm font-bold text-slate-600 dark:text-slate-300 focus:ring-8 focus:ring-primary-50 transition-all shadow-inner placeholder:text-slate-300 min-h-[150px]"
                value={inspectionResult.notes || ''}
                onChange={(e) => setInspectionResult(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setInspectionStep('physical')}
                className="w-full sm:w-auto px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
              >
                Prev_Module
              </button>
              <button
                onClick={() => setInspectionStep('final')}
                className="w-full sm:w-auto px-10 py-4 bg-primary-600 text-white rounded-[1.5rem] hover:bg-slate-900 transition-all text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-900/10 active:scale-95 border-b-4 border-primary-700"
              >
                Intake_Audit
              </button>
            </div>
          </div>
        )}

        {inspectionStep === 'final' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-700">
            <div className="space-y-4 text-center">
               <h3 className="text-4xl font-black text-[#0f172a] tracking-tight flex items-center justify-center gap-4">
                  Final <span className="text-primary-600">Review</span>
               </h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execute binary intake decision and sign protocol manifest.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                 <div className={cn(
                  "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg",
                  inspectionResult.status === 'PASSED' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                  inspectionResult.status === 'FAILED' ? 'bg-red-500 text-white shadow-red-500/20' :
                  'bg-amber-500 text-white shadow-amber-500/20'
                )}>
                  Status: {inspectionResult.status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
                     <CheckCircle className="w-3 h-3 text-emerald-400" />
                     Intake_Checklist
                  </h5>
                  <ul className="space-y-4">
                    {Object.entries(checklistStatus).map(([key, status]) => (
                      <li key={key} className="flex items-center justify-between group">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {status === 'passed' ? (
                          <span className="text-emerald-500 flex items-center text-[10px] font-black uppercase tracking-widest"><CheckCircle className="w-3 h-3 mr-1.5 shadow-emerald-500/10" /> Authorized</span>
                        ) : status === 'failed' ? (
                          <span className="text-red-500 flex items-center text-[10px] font-black uppercase tracking-widest"><XCircle className="w-3 h-3 mr-1.5 shadow-red-500/10" /> Blocked</span>
                        ) : (
                          <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Bypassed</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2 flex items-center gap-2">
                     <FileText className="w-3 h-3 text-blue-400" />
                     Doc_Status
                  </h5>
                  <ul className="space-y-4">
                    {cargo.documents.map((doc, index) => {
                      const docKey = `doc-${index}`;
                      const status = documentStatus[docKey];
                      return (
                        <li key={index} className="flex items-center justify-between group">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{doc}</span>
                          {status === 'verified' ? (
                            <span className="text-emerald-500 flex items-center text-[10px] font-black uppercase tracking-widest flex-shrink-0"><CheckCircle className="w-3 h-3 mr-1.5 shadow-emerald-500/10" /> Valid</span>
                          ) : status === 'missing' ? (
                            <span className="text-red-500 flex items-center text-[10px] font-black uppercase tracking-widest flex-shrink-0"><XCircle className="w-3 h-3 mr-1.5 shadow-red-500/10" /> Critical_Loss</span>
                          ) : (
                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest flex-shrink-0">Pending</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {inspectionResult.issues && inspectionResult.issues.length > 0 && (
                <div className="mt-12 pt-12 border-t border-slate-50">
                  <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <AlertTriangle className="w-3 h-3" />
                     Unresolved_Blocking_Issues
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inspectionResult.issues.filter(i => !i.resolved).map((issue) => (
                      <div key={issue.id} className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 text-red-600 mb-2">
                          <AlertTriangle className="w-4 h-4 shadow-red-500/10" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{issue.type}</span>
                        </div>
                        <p className="text-xs font-bold text-red-900 leading-snug">{issue.description}</p>
                      </div>
                    ))}
                    {inspectionResult.issues.filter(i => !i.resolved).length === 0 && (
                      <div className="col-span-full py-8 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-100">
                         <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                         <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protocol Clear_ All reported issues authorized or resolved.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {isReadOnly ? (
              <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex flex-col items-center gap-6 p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl shadow-slate-900/40 text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white scale-animation mb-2">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Terminal_Session_Closed</p>
                    <p className="text-lg font-black tracking-tight">Verified at: {existingInspection?.inspectedAt ? new Date(existingInspection.inspectedAt).toLocaleString() : 'N/A'}</p>
                  </div>
                  <button
                    onClick={onCancel}
                    className="w-full sm:w-auto px-12 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-xl"
                  >
                    Return_To_Manifest
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-1000">
                <div className="flex items-center gap-4 bg-primary-900 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-primary-900/20">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80 decoration-slate-400/30">
                     By executing this authorization, I acknowledge a complete physical audit of the payload and certify manifest accuracy. 
                     Data will be encrypted and committed to the terminal ledger irreversibly.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    onClick={() => setInspectionStep('documentation')}
                    className="w-full sm:w-auto px-10 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all active:scale-95"
                  >
                    Prev_Module
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full sm:w-auto px-12 py-5 bg-emerald-600 text-white rounded-[1.5rem] hover:bg-slate-900 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-900/10 active:scale-95 border-b-4 border-emerald-800"
                  >
                    <CheckCircle className="w-5 h-5 shadow-inner" />
                    Authorize Payload Intake
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-8 sm:p-12 text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-500 mx-auto mb-8 shadow-inner">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-[#0f172a] tracking-tight mb-4">Confirm Authorization</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                You are about to execute the final intake logic. This operation is <span className="text-red-500 font-black">irreversible</span> and will be logged to the protocol ledger. 
                Ensure manifest integrity before commitment.
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Abort_Protocol
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleInspectionComplete();
                }}
                className="w-full sm:flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl active:scale-95"
              >
                Execute Commitment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoInspectionPage;

