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
  onInspectionComplete: (result: InspectionResult) => void;
  onCancel: () => void;
}

export const CargoInspection: React.FC<CargoInspectionProps> = ({
  cargoId,
  onInspectionComplete,
  onCancel
}) => {
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
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
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

        toast.success('Photo uploaded successfully');
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
      toast.success('Photo removed');
    }
  };

  const handleInspectionComplete = () => {
    if (inspectionResult.status && inspectionResult.notes) {
      onInspectionComplete(inspectionResult as InspectionResult);
    } else {
      toast.error("Please add inspection notes before completing.");
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-[#0f172a] uppercase tracking-tight">Cargo Inspection</h2>
          <p className="text-slate-400 font-medium text-sm">Follow protocol to ensure safe transport</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Modern Stepper */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-between min-w-[500px] relative px-4 md:px-12">
          {/* Line Background */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = inspectionStep === step.id;
            const isCompleted = steps.findIndex(s => s.id === inspectionStep) > index;

            return (
              <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                <button 
                  onClick={() => {
                    const stepIdx = steps.findIndex(s => s.id === step.id);
                    const currentIdx = steps.findIndex(s => s.id === inspectionStep);
                    if (stepIdx < currentIdx) setInspectionStep(step.id as any);
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-[#345E85] bg-[#345E85] text-white scale-110 shadow-lg shadow-blue-900/20' :
                    isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </button>
                <span className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-[#345E85]' : isCompleted ? 'text-emerald-600' : 'text-slate-300'
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
            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Verify Cargo Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Name</span>
                    <span className="font-bold text-slate-900">{cargo.name}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Qty / Weight</span>
                    <span className="font-bold text-slate-900">{cargo.quantity} units / {cargo.weight} kg</span>
                  </div>
                  <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Category</span>
                    <span className="font-bold text-slate-900">{cargo.category}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Special Handling</h4>
                  <div className="flex flex-wrap gap-2">
                    {cargo.specialRequirements.map((req, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-50 text-[#345E85] text-xs font-bold rounded-lg border border-blue-100">
                        {req}
                      </span>
                    ))}
                    {cargo.hazardous && (
                      <span className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Hazardous
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setInspectionStep('physical')}
                  className="px-6 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  Begin Physical Check <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PHYSICAL STEP */}
          {inspectionStep === 'physical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div key={item.id} className={`p-4 rounded-xl border-2 transition-all ${status === 'passed' ? 'bg-emerald-50/50 border-emerald-100' :
                        status === 'failed' ? 'bg-red-50/50 border-red-100' :
                          'bg-white border-slate-100'
                      }`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-700">{item.label}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleChecklistItem(item.id, 'passed')}
                            className={`p-1.5 rounded-lg transition-colors ${status === 'passed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleChecklistItem(item.id, 'failed')}
                            className={`p-1.5 rounded-lg transition-colors ${status === 'failed' ? 'bg-red-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{item.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white rounded-[1.5rem] border border-slate-100 p-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" /> Photo Evidence
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-[#345E85] hover:bg-blue-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group">
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="hidden" />
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                      {uploadingPhoto ? <div className="w-5 h-5 border-2 border-[#345E85] border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5 text-[#345E85]" />}
                    </div>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-[#345E85]">Upload</span>
                  </label>

                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-100 shadow-sm">
                      <img src={photo.url} alt="Evidence" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setInspectionStep('overview')}
                  className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={() => setInspectionStep('documentation')}
                  className="px-6 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
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

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setInspectionStep('physical')}
                  className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  <TranslatedText text="Back" />
                </button>
                <button
                  onClick={() => setInspectionStep('securement')}
                  className="px-6 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <TranslatedText text="Securement Check" /> <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* SECUREMENT STEP */}
          {inspectionStep === 'securement' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <TranslatedText text="Loading & Securement Check" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'straps', label: 'Ratchet Straps & Chains', description: 'Tensioned and double-locked' },
                    { id: 'weightDist', label: 'Load Distribution', description: 'Weight centered over axles' },
                    { id: 'blocking', label: 'Blocking & Bracing', description: 'No lateral movement possible' },
                    { id: 'tarping', label: 'Tarping & Protection', description: 'Weatherproofed and secured' }
                  ].map((item) => {
                    const status = checklistStatus[item.id];
                    return (
                      <div key={item.id} className={`p-4 rounded-xl border-2 transition-all ${status === 'passed' ? 'bg-emerald-50 border-emerald-100' :
                          status === 'failed' ? 'bg-red-50 border-red-100' :
                            'bg-white border-slate-100'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-slate-700 text-sm">
                            <TranslatedText text={item.label} />
                          </h4>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleChecklistItem(item.id, 'passed')}
                              className={`p-1.5 rounded-lg transition-colors ${status === 'passed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleChecklistItem(item.id, 'failed')}
                              className={`p-1.5 rounded-lg transition-colors ${status === 'failed' ? 'bg-red-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-50'}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">
                           <TranslatedText text={item.description} />
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setInspectionStep('documentation')}
                  className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  <TranslatedText text="Back" />
                </button>
                <button
                  onClick={() => setInspectionStep('final')}
                  className="px-6 py-3 bg-[#345E85] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#2a4b6d] transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
                >
                  <TranslatedText text="Review & Sign" /> <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FINAL STEP */}
          {inspectionStep === 'final' && (
            <div className="space-y-6">
              <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Final Remarks</h3>
                    <p className="text-slate-500 text-sm mb-4">Please provide any final notes or observations regarding this inspection.</p>
                    <textarea
                      value={inspectionResult.notes}
                      onChange={(e) => setInspectionResult(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Enter detailed inspection notes here..."
                      className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#345E85]/20 focus:border-[#345E85] resize-none transition-all"
                    />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Inspection Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Physical Checks Passed</span>
                        <span className="font-bold text-slate-900">{Object.values(checklistStatus).filter(s => s === 'passed').length} / {Object.keys(checklistStatus).length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Documents Verified</span>
                        <span className="font-bold text-slate-900">{Object.values(documentStatus).filter(s => s === 'verified').length} / {cargo.documents.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setInspectionStep('documentation')}
                  className="px-6 py-3 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleInspectionComplete}
                  className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${!inspectionResult.notes
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
                    }`}
                  disabled={!inspectionResult.notes}
                >
                  <Save className="w-4 h-4" />
                  Submit Inspection
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
