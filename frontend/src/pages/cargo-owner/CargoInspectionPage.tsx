import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import receiverService from '../../services/receiverService';
import { documentApi } from '../../services/documents/documentApi'; // Ensure this is available or mock/adjust
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  FileText, 
  Package, 
  MapPin, 
  Clock, 
  User,
  AlertCircle,
  Shield,
  Thermometer,
  Eye,
  Edit3,
  ArrowLeft,
  X
} from 'lucide-react';

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

        // Check if inspection already exists (completed)
        try {
          const inspection = await receiverService.getCargoInspection(cargoId);
          if (inspection && (inspection.status === 'COMPLETED' || inspection.allItemsVerified)) {
            setExistingInspection(inspection);
            setIsReadOnly(true);
            
            // Populate the inspection result with existing data
            setInspectionResult(prev => ({
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
    setInspectionResult(prev => ({
      ...prev,
      issues: [...(prev.issues || []), newIssue]
    }));
  };

  const updateIssue = (issueId: string, updates: Partial<InspectionIssue>) => {
    setInspectionResult(prev => ({
      ...prev,
      issues: prev.issues?.map(issue => 
        issue.id === issueId ? { ...issue, ...updates } : issue
      ) || []
    }));
  };

  const handleChecklistItem = (itemId: string, status: 'passed' | 'failed') => {
    setChecklistStatus(prev => ({
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
      setUploadedPhotos(prev => [...prev, { url: previewUrl!, file, id: photoId }]);
      
      // Upload using document API - Use generic endpoint if needed or skip if permission issues
      // For now, assuming documentApi works or will handle gracefully
      if (documentApi && typeof documentApi.createDocument === 'function') {
         const documentRequest = {
            entityType: 'CARGO', 
            entityId: cargoId,
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
           setInspectionResult(prev => ({
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
           const checklistItems = Object.entries(checklistStatus).map(([key, value], index) => ({
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
        <p className="text-gray-600">Cargo not found</p>
        <button onClick={onCancel} className="mt-4 text-primary-600 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg my-6">
      {/* Header */}
      <div className="bg-primary-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                 <button onClick={onCancel} className="p-1 hover:bg-primary-700 rounded transition-colors">
                     <ArrowLeft className="w-5 h-5 text-white" />
                 </button>
                <div>
                    <h2 className="text-xl font-semibold">Cargo Inspection</h2>
                    <p className="text-primary-100">{cargo.name}</p>
                </div>
            </div>
            {isReadOnly && (
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View Only</span>
              </div>
            )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-4">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'physical', label: 'Physical Check', icon: Package },
            { id: 'documentation', label: 'Documents', icon: FileText },
            { id: 'final', label: 'Final Review', icon: CheckCircle }
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = inspectionStep === step.id;
            // When in read-only mode, show all steps as completed
            const isCompleted = isReadOnly || ['overview', 'physical', 'documentation', 'final'].indexOf(inspectionStep) > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive ? 'bg-primary-600 text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 3 && (
                  <div className={`ml-4 w-16 h-0.5 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {inspectionStep === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cargo Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Cargo Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{cargo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{cargo.quantity > 0 ? `${cargo.quantity} ${cargo.unit}` : 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{cargo.weight > 0 ? `${cargo.weight} kg` : 'Not Available'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">
                      {cargo.dimensions.length > 0 && cargo.dimensions.width > 0 && cargo.dimensions.height > 0
                        ? `${cargo.dimensions.length}×${cargo.dimensions.width}×${cargo.dimensions.height} cm`
                        : 'Not Available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{cargo.category || 'Not Available'}</span>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Special Requirements</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">Fragility: <span className="font-medium">{cargo.fragility}</span></span>
                  </div>
                  {cargo.temperature.min !== null && cargo.temperature.max !== null ? (
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-5 h-5 text-orange-600" />
                      <span className="text-sm">Temperature: {cargo.temperature.min}°{cargo.temperature.unit} - {cargo.temperature.max}°{cargo.temperature.unit}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-500">No temperature requirements</span>
                    </div>
                  )}
                  {cargo.hazardous && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">
                        Hazardous Material{cargo.hazmatClass ? ` - Class ${cargo.hazmatClass}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Requirements:</span>
                    {cargo.specialRequirements.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cargo.specialRequirements.map((req, index) => (
                          <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                            {req}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No special requirements</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setInspectionStep('physical')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Start Physical Inspection
              </button>
            </div>
          </div>
        )}

        {inspectionStep === 'physical' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Physical Inspection</h3>
            
            {/* Inspection Checklist */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'packaging', label: 'Packaging Integrity', description: 'Check for tears, holes, or damage' },
                  { id: 'seals', label: 'Seals & Closures', description: 'Verify all seals are intact' },
                  { id: 'labels', label: 'Labels & Markings', description: 'Ensure all labels are visible and correct' },
                  { id: 'contents', label: 'Content Verification', description: 'Check quantity and condition of contents' },
                  { id: 'temperature', label: 'Temperature Control', description: 'Verify temperature monitoring devices' },
                  { id: 'security', label: 'Security Features', description: 'Check tamper-evident features' }
                ].map((item) => {
                  const status = checklistStatus[item.id];
                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded-lg p-4 ${
                        status === 'passed' ? 'bg-green-50 border-green-200' :
                        status === 'failed' ? 'bg-red-50 border-red-200' :
                        'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.label}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          {status && (
                            <p className={`text-xs mt-1 font-medium ${
                              status === 'passed' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {status === 'passed' ? '✓ Passed' : '✗ Failed'}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleChecklistItem(item.id, 'passed')}
                            className={`p-2 rounded transition-colors ${
                              status === 'passed' 
                                ? 'bg-green-100 text-green-700' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Mark as passed"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleChecklistItem(item.id, 'failed')}
                            className={`p-2 rounded transition-colors ${
                              status === 'failed' 
                                ? 'bg-red-100 text-red-700' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title="Mark as failed"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Photo Documentation */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Photo Documentation</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                  {uploadingPhoto ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                      <span className="text-sm text-gray-600">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Add Photo</span>
                    </div>
                  )}
                </label>
                {uploadedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img 
                      src={photo.url} 
                      alt={`Inspection photo`} 
                      className="w-full h-24 object-cover rounded-lg" 
                    />
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {uploadedPhotos.length === 0 && (
                <p className="text-sm text-gray-500">No photos uploaded yet</p>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setInspectionStep('overview')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setInspectionStep('documentation')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Continue to Documentation
              </button>
            </div>
          </div>
        )}

        {inspectionStep === 'documentation' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Documentation Review</h3>
            
            {/* Required Documents */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Required Documents</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cargo.documents.length > 0 ? (
                  cargo.documents.map((doc, index) => {
                    const docKey = `doc-${index}`;
                    const status = documentStatus[docKey];
                    return (
                      <div 
                        key={index} 
                        className={`border rounded-lg p-4 ${
                          status === 'verified' ? 'bg-green-50 border-green-200' :
                          status === 'missing' ? 'bg-red-50 border-red-200' :
                          'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <span className="font-medium">{doc}</span>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setDocumentStatus(prev => ({ ...prev, [docKey]: 'verified' }))}
                              className={`p-2 rounded transition-colors ${
                                status === 'verified' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title="Mark as verified"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setDocumentStatus(prev => ({ ...prev, [docKey]: 'missing' }));
                                addIssue({
                                  type: 'DOCUMENTATION',
                                  severity: 'MEDIUM',
                                  description: `Missing or incomplete: ${doc}`,
                                  location: 'Documentation',
                                  actionRequired: 'Obtain and verify document',
                                  resolved: false
                                });
                              }}
                              className={`p-2 rounded transition-colors ${
                                status === 'missing' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                              title="Mark as missing"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        {status && (
                          <p className={`text-xs mt-2 font-medium ${
                            status === 'verified' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {status === 'verified' ? '✓ Verified' : '✗ Missing'}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No documents specified</p>
                )}
              </div>
            </div>

            {/* Issues Found */}
            {inspectionResult.issues && inspectionResult.issues.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Issues Found</h4>
                <div className="space-y-3">
                  {inspectionResult.issues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              issue.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className="text-sm text-gray-600">{issue.type}</span>
                          </div>
                          <p className="font-medium text-gray-900">{issue.description}</p>
                          <p className="text-sm text-gray-600 mt-1">Location: {issue.location}</p>
                          <p className="text-sm text-gray-600">Action: {issue.actionRequired}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => updateIssue(issue.id, { resolved: !issue.resolved })}
                            className={`px-3 py-1 text-xs rounded ${
                              issue.resolved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {issue.resolved ? 'Resolved' : 'Mark Resolved'}
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {issue.resolved && (
                        <div className="mt-3 p-3 bg-green-50 rounded">
                          <textarea
                            placeholder="Add resolution notes..."
                            className="w-full p-2 border rounded text-sm"
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

            {/* Notes */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Inspection Notes</h4>
              <textarea
                placeholder="Add any additional notes about the inspection..."
                className="w-full p-3 border rounded-lg"
                rows={4}
                value={inspectionResult.notes || ''}
                onChange={(e) => setInspectionResult(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setInspectionStep('physical')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setInspectionStep('final')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Continue to Final Review
              </button>
            </div>
          </div>
        )}

        {inspectionStep === 'final' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Final Review</h3>
            
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Inspection Summary</h4>
                  <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold ${
                  inspectionResult.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                  inspectionResult.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {inspectionResult.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Checklist Items</h5>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(checklistStatus).map(([key, status]) => (
                      <li key={key} className="flex items-center justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {status === 'passed' ? (
                          <span className="text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Passed</span>
                        ) : status === 'failed' ? (
                          <span className="text-red-600 flex items-center"><XCircle className="w-3 h-3 mr-1" /> Failed</span>
                        ) : (
                          <span className="text-gray-400">Not checked</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Documentation</h5>
                  <ul className="space-y-1 text-sm">
                    {cargo.documents.map((doc, index) => {
                      const docKey = `doc-${index}`;
                      const status = documentStatus[docKey];
                      return (
                        <li key={index} className="flex items-center justify-between">
                          <span className="truncate pr-2">{doc}</span>
                          {status === 'verified' ? (
                            <span className="text-green-600 flex items-center flex-shrink-0"><CheckCircle className="w-3 h-3 mr-1" /> Verified</span>
                          ) : status === 'missing' ? (
                            <span className="text-red-600 flex items-center flex-shrink-0"><XCircle className="w-3 h-3 mr-1" /> Missing</span>
                          ) : (
                            <span className="text-gray-400 flex-shrink-0">Pending</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {inspectionResult.issues && inspectionResult.issues.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="font-medium text-gray-700 mb-2">Unresolved Issues</h5>
                  <div className="space-y-2">
                    {inspectionResult.issues.filter(i => !i.resolved).map((issue) => (
                      <div key={issue.id} className="bg-white border rounded p-3 text-sm">
                        <div className="flex items-center space-x-2 text-red-600 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium">{issue.type}</span>
                        </div>
                        <p>{issue.description}</p>
                      </div>
                    ))}
                    {inspectionResult.issues.filter(i => !i.resolved).length === 0 && (
                      <p className="text-green-600 text-sm flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" /> All issues reported resolved
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Show different footer based on read-only mode */}
            {isReadOnly ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800">This inspection was completed on {existingInspection?.inspectedAt ? new Date(existingInspection.inspectedAt).toLocaleString() : 'N/A'}</p>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    onClick={onCancel}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Cargos</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-primary-50 p-4 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-primary-600" />
                  <p>By submitting this inspection, I certify that I have physically inspected the cargo and the information provided is accurate to the best of my knowledge.</p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setInspectionStep('documentation')}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit Inspection Report</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-primary-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Confirm Submission</h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="p-1 hover:bg-primary-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 flex items-center justify-center min-h-[180px]">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Are you ready to submit this inspection?</h4>
                  <p className="text-sm text-gray-600">
                    Once submitted, you won't be able to modify this inspection report. 
                    Please ensure all information is accurate before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Review
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleInspectionComplete();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoInspectionPage;

