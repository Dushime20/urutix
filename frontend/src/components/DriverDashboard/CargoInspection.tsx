import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  FileText, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  User,
  AlertCircle,
  Info,
  Shield,
  Thermometer,
  Weight,
  Ruler,
  Palette,
  Eye,
  Edit3,
  Save,
  Upload
} from 'lucide-react';

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
  const [inspectionStep, setInspectionStep] = useState<'overview' | 'physical' | 'documentation' | 'final'>('overview');
  const [inspectionResult, setInspectionResult] = useState<Partial<InspectionResult>>({
    cargoId,
    status: 'PASSED',
    timestamp: new Date().toISOString(),
    inspector: 'Driver Name', // This would come from auth context
    notes: '',
    issues: [],
    photos: [],
    recommendations: [],
    signature: ''
  });

  // Mock cargo data - in real app this would come from API
  useEffect(() => {
    setTimeout(() => {
      setCargo({
        id: cargoId,
        name: 'Electronics Components',
        description: 'High-value electronic components requiring careful handling',
        quantity: 150,
        unit: 'pieces',
        weight: 750,
        dimensions: { length: 120, width: 80, height: 60 },
        category: 'Electronics',
        specialRequirements: ['Fragile', 'Temperature controlled', 'Anti-static packaging'],
        fragility: 'HIGH',
        temperature: { min: 15, max: 25, unit: 'C' },
        hazardous: false,
        images: [],
        documents: ['Packing list', 'Safety data sheet', 'Customs declaration']
      });
      setLoading(false);
    }, 1000);
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

  const addPhoto = (photoUrl: string) => {
    setInspectionResult(prev => ({
      ...prev,
      photos: [...(prev.photos || []), photoUrl]
    }));
  };

  const addRecommendation = (recommendation: string) => {
    setInspectionResult(prev => ({
      ...prev,
      recommendations: [...(prev.recommendations || []), recommendation]
    }));
  };

  const handleInspectionComplete = () => {
    if (inspectionResult.status && inspectionResult.notes) {
      onInspectionComplete(inspectionResult as InspectionResult);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Cargo not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Cargo Inspection</h2>
            <p className="text-blue-100">#{cargo.id} - {cargo.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span className="text-sm">Pre-Load Inspection</span>
          </div>
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
            const isCompleted = ['overview', 'physical', 'documentation', 'final'].indexOf(inspectionStep) > index;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  isActive ? 'bg-blue-600 text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
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
                    <span className="font-medium">{cargo.quantity} {cargo.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium">{cargo.weight} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimensions:</span>
                    <span className="font-medium">{cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{cargo.category}</span>
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
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-5 h-5 text-orange-600" />
                    <span className="text-sm">Temperature: {cargo.temperature.min}°{cargo.temperature.unit} - {cargo.temperature.max}°{cargo.temperature.unit}</span>
                  </div>
                  {cargo.hazardous && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-sm text-red-600 font-medium">Hazardous Material - Class {cargo.hazmatClass}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Requirements:</span>
                    <div className="flex flex-wrap gap-2">
                      {cargo.specialRequirements.map((req, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {req}
                        </span>
                      ))}
                    </div>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                ].map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.label}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            // Mark as passed
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            addIssue({
                              type: 'DAMAGE',
                              severity: 'MEDIUM',
                              description: `Issue with ${item.label.toLowerCase()}`,
                              location: 'General',
                              actionRequired: 'Document and report issue'
                            });
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Documentation */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Photo Documentation</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">Add Photo</span>
                </button>
                {inspectionResult.photos?.map((photo, index) => (
                  <div key={index} className="relative">
                    <img src={photo} alt={`Inspection photo ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                    <button className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                {cargo.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{doc}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue to Final Review
              </button>
            </div>
          </div>
        )}

        {inspectionStep === 'final' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Final Review & Submission</h3>
            
            {/* Inspection Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Inspection Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">
                    <select
                      value={inspectionResult.status}
                      onChange={(e) => setInspectionResult(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="PASSED">Passed</option>
                      <option value="FAILED">Failed</option>
                      <option value="CONDITIONAL">Conditional</option>
                    </select>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Issues Found:</span>
                  <p className="font-medium">{inspectionResult.issues?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Photos:</span>
                  <p className="font-medium">{inspectionResult.photos?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-600">Inspector:</span>
                  <p className="font-medium">{inspectionResult.inspector}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recommendations</h4>
              <div className="space-y-3">
                {inspectionResult.recommendations?.map((rec, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Info className="w-5 h-5 text-blue-600" />
                    <span className="flex-1">{rec}</span>
                    <button
                      onClick={() => {
                        setInspectionResult(prev => ({
                          ...prev,
                          recommendations: prev.recommendations?.filter((_, i) => i !== index)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add a recommendation..."
                    className="flex-1 p-2 border rounded"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        addRecommendation(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value.trim()) {
                        addRecommendation(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Digital Signature</h4>
              <div className="border rounded-lg p-4">
                <textarea
                  placeholder="Type your full name to confirm this inspection..."
                  className="w-full p-3 border rounded-lg"
                  rows={2}
                  value={inspectionResult.signature || ''}
                  onChange={(e) => setInspectionResult(prev => ({ ...prev, signature: e.target.value }))}
                />
                <p className="text-sm text-gray-600 mt-2">
                  By typing your name above, you confirm that this inspection has been completed accurately and completely.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setInspectionStep('documentation')}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleInspectionComplete}
                disabled={!inspectionResult.status || !inspectionResult.notes || !inspectionResult.signature}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Complete Inspection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
