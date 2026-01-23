import React, { useState, useEffect } from 'react';
import {
  FaTruck, FaFileAlt, FaTools, FaShieldAlt, FaGasPump, FaTachometerAlt,
  FaExclamationTriangle, FaDownload, FaUpload, FaEye, FaEdit, FaTrash, FaPlus,
  FaCertificate, FaClipboardCheck, FaCamera, FaTimes, FaTimesCircle
} from 'react-icons/fa';
import type { FleetItem, MaintenanceRecord, InspectionRecord, InsuranceRecord, FuelRecord, TireRecord, ComplianceRecord } from '../../types/fleet';
import { OcrDocumentUpload } from '../OCR/OcrDocumentUpload';
import { DocumentApiService, type Document, type CreateDocumentRequest } from '../../services/documents/documentApi';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui';
import toast from 'react-hot-toast';
import { fleetApi } from '../../services/fleetApi';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';

interface TruckRecordsProps {
  truckId: string;
}

export const TruckRecords: React.FC<TruckRecordsProps> = ({ truckId }) => {
  useAuth();
  const { confirm, DialogComponent } = useConfirmDialog();
  const [truck, setTruck] = useState<FleetItem | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showOcrUpload, setShowOcrUpload] = useState(false);
  const [ocrDocumentType, setOcrDocumentType] = useState('general');
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentViewUrl, setDocumentViewUrl] = useState<string | null>(null);
  const [loadingDocumentView, setLoadingDocumentView] = useState(false);
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceRecord | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  const [showScheduleInspection, setShowScheduleInspection] = useState(false);
  const [editingInspection, setEditingInspection] = useState<InspectionRecord | null>(null);
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [showAddInsurance, setShowAddInsurance] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<InsuranceRecord | null>(null);
  const [insuranceRecords, setInsuranceRecords] = useState<InsuranceRecord[]>([]);
  const [loadingInsurance, setLoadingInsurance] = useState(false);
  const [showAddFuel, setShowAddFuel] = useState(false);
  const [editingFuel, setEditingFuel] = useState<FuelRecord | null>(null);
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [loadingFuel, setLoadingFuel] = useState(false);
  const [showAddTire, setShowAddTire] = useState(false);
  const [editingTire, setEditingTire] = useState<TireRecord | null>(null);
  const [tireRecords, setTireRecords] = useState<TireRecord[]>([]);
  const [loadingTires, setLoadingTires] = useState(false);
  const [showAddCompliance, setShowAddCompliance] = useState(false);
  const [editingCompliance, setEditingCompliance] = useState<ComplianceRecord | null>(null);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [loadingCompliance, setLoadingCompliance] = useState(false);
  const documentApi = new DocumentApiService();

  // Load maintenance records
  const loadMaintenanceRecords = async () => {
    if (!truckId) return;
    setLoadingMaintenance(true);
    try {
      const records = await fleetApi.getMaintenanceHistory(truckId);
      setMaintenanceRecords(records);
    } catch (error: any) {
      console.error('Error loading maintenance records:', error);
      toast.error('Failed to load maintenance records');
      setMaintenanceRecords([]);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  // Load maintenance when tab is active
  useEffect(() => {
    if (activeTab === 'maintenance' && truckId) {
      loadMaintenanceRecords();
    }
  }, [activeTab, truckId]);

  // Load inspection records
  const loadInspectionRecords = async () => {
    if (!truckId) return;
    setLoadingInspections(true);
    try {
      const records = await fleetApi.getInspectionHistory(truckId);
      setInspectionRecords(records);
    } catch (error: any) {
      console.error('Error loading inspection records:', error);
      toast.error('Failed to load inspection records');
      setInspectionRecords([]);
    } finally {
      setLoadingInspections(false);
    }
  };

  // Load inspections when tab is active
  useEffect(() => {
    if (activeTab === 'inspections' && truckId) {
      loadInspectionRecords();
    }
  }, [activeTab, truckId]);

  // Load insurance records
  const loadInsuranceRecords = async () => {
    if (!truckId) return;
    setLoadingInsurance(true);
    try {
      const records = await fleetApi.getInsuranceHistory(truckId);
      setInsuranceRecords(records);
    } catch (error: any) {
      console.error('Error loading insurance records:', error);
      toast.error('Failed to load insurance records');
      setInsuranceRecords([]);
    } finally {
      setLoadingInsurance(false);
    }
  };

  // Load insurance when tab is active
  useEffect(() => {
    if (activeTab === 'insurance' && truckId) {
      loadInsuranceRecords();
    }
  }, [activeTab, truckId]);

  // Load fuel records
  const loadFuelRecords = async () => {
    if (!truckId) return;
    setLoadingFuel(true);
    try {
      const records = await fleetApi.getFuelHistory(truckId);
      // Convert date strings to Date objects
      const processedRecords = records.map((record: any) => ({
        ...record,
        date: record.date ? new Date(record.date) : new Date(),
      }));
      setFuelRecords(processedRecords);
    } catch (error: any) {
      console.error('Error loading fuel records:', error);
      toast.error('Failed to load fuel records');
      setFuelRecords([]);
    } finally {
      setLoadingFuel(false);
    }
  };

  // Load fuel when tab is active
  useEffect(() => {
    if (activeTab === 'fuel' && truckId) {
      loadFuelRecords();
    }
  }, [activeTab, truckId]);

  // Load tire records
  const loadTireRecords = async () => {
    if (!truckId) return;
    setLoadingTires(true);
    try {
      const records = await fleetApi.getTireHistory(truckId);
      // Convert date strings to Date objects
      const processedRecords = records.map((record: any) => ({
        ...record,
        installationDate: record.installationDate ? new Date(record.installationDate) : new Date(),
        replacementDate: record.replacementDate ? new Date(record.replacementDate) : undefined,
        rotationHistory: record.rotationHistory ? record.rotationHistory.map((date: any) => new Date(date)) : undefined,
      }));
      setTireRecords(processedRecords);
    } catch (error: any) {
      console.error('Error loading tire records:', error);
      toast.error('Failed to load tire records');
      setTireRecords([]);
    } finally {
      setLoadingTires(false);
    }
  };

  // Load tires when tab is active
  useEffect(() => {
    if (activeTab === 'tires' && truckId) {
      loadTireRecords();
    }
  }, [activeTab, truckId]);

  // Load compliance records
  const loadComplianceRecords = async () => {
    if (!truckId) return;
    setLoadingCompliance(true);
    try {
      const records = await fleetApi.getComplianceHistory(truckId);
      // Convert date strings to Date objects
      const processedRecords = records.map((record: any) => ({
        ...record,
        dueDate: record.dueDate ? new Date(record.dueDate) : new Date(),
        lastChecked: record.lastChecked ? new Date(record.lastChecked) : new Date(),
        nextCheck: record.nextCheck ? new Date(record.nextCheck) : new Date(),
        penalties: record.penalties ? record.penalties.map((penalty: any) => ({
          ...penalty,
          date: penalty.date ? new Date(penalty.date) : new Date(),
        })) : undefined,
      }));
      setComplianceRecords(processedRecords);
    } catch (error: any) {
      console.error('Error loading compliance records:', error);
      toast.error('Failed to load compliance records');
      setComplianceRecords([]);
    } finally {
      setLoadingCompliance(false);
    }
  };

  // Load compliance when tab is active
  useEffect(() => {
    if (activeTab === 'compliance' && truckId) {
      loadComplianceRecords();
    }
  }, [activeTab, truckId]);

  // Mock data for demonstration
  const mockTruck: FleetItem = {
    id: truckId,
    type: 'truck',
    name: 'Truck 001',
    status: 'AVAILABLE',
    licensePlate: 'ABC-123',
    make: 'Volvo',
    model: 'FH16',
    year: 2020,
    capacity: 20000,
    fuelType: 'Diesel',
    vin: '1HGBH41JXMN109186',
    engineNumber: 'ENG2020001',
    transmissionType: 'Automatic',
    axleConfiguration: '6x4',
    grossVehicleWeight: 80000,
    emptyWeight: 18000,
    currentLocation: {
      coordinates: { coordinates: [-74.006, 40.7128] },
      address: 'New York, NY'
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    documents: [
      {
        id: 'doc-1',
        name: 'Vehicle Registration',
        type: 'registration',
        status: 'valid',
        documentNumber: 'REG-2024-001',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        issuingAuthority: 'NY DMV',
        isRequired: true,
        complianceStatus: 'compliant',
        cost: 150,
        vendor: 'NY DMV',
        uploadedAt: new Date('2024-01-01'),
        lastModified: new Date('2024-01-01')
      },
      {
        id: 'doc-2',
        name: 'Insurance Policy',
        type: 'insurance',
        status: 'valid',
        documentNumber: 'INS-2024-001',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2024-12-31'),
        issuingAuthority: 'Progressive Insurance',
        isRequired: true,
        complianceStatus: 'compliant',
        cost: 2500,
        vendor: 'Progressive',
        uploadedAt: new Date('2024-01-01'),
        lastModified: new Date('2024-01-01')
      }
    ],
    maintenance: [
      {
        id: 'maint-1',
        type: 'preventive',
        title: 'Oil Change & Filter',
        description: 'Regular oil change and filter replacement',
        date: new Date('2024-01-10'),
        cost: 150,
        nextDueDate: new Date('2024-04-10'),
        status: 'completed',
        priority: 'medium',
        assignedTechnician: 'Mike Johnson',
        location: 'Fleet Garage',
        partsUsed: ['Oil Filter', 'Synthetic Oil'],
        laborHours: 2,
        mileage: 45000,
        complianceImpact: 'compliant'
      }
    ],
    inspections: [
      {
        id: 'insp-1',
        type: 'annual',
        title: 'Annual Safety Inspection',
        inspector: 'John Smith',
        inspectionDate: new Date('2024-01-15'),
        nextInspectionDate: new Date('2025-01-15'),
        status: 'passed',
        score: 95,
        complianceStatus: 'compliant',
        location: 'NY Inspection Station',
        mileage: 45000,
        cost: 75,
        isRequired: true
      }
    ],
    insurance: [
      {
        id: 'ins-1',
        policyType: 'liability',
        policyNumber: 'POL-2024-001',
        insuranceCompany: 'Progressive Insurance',
        coverageAmount: 1000000,
        premium: 2500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'valid',
        deductible: 1000,
        agent: 'John Doe',
        claims: [
          {
            id: 'claim-1',
            incidentDate: new Date('2024-02-15'),
            claimDate: new Date('2024-02-16'),
            amount: 5000,
            description: 'Minor accident repair',
            status: 'settled',
            claimNumber: 'CLM-2024-001'
          }
        ]
      }
    ],
    fuelRecords: [
      {
        id: 'fuel-1',
        date: new Date('2024-01-20'),
        fuelType: 'diesel',
        quantity: 150,
        cost: 525,
        mileage: 46000,
        location: 'Fleet Fuel Station',
        driver: 'Mike Johnson',
        receipt: 'RCP-2024-001'
      }
    ],
    tireRecords: [
      {
        id: 'tire-1',
        position: 'front_left',
        brand: 'Michelin',
        model: 'XZA2',
        size: '295/80R22.5',
        status: 'good',
        treadDepth: 8,
        pressure: 110,
        currentMileage: 46000,
        expectedLifespan: 80000,
        installationDate: new Date('2023-06-01'),
        cost: 450
      }
    ],
    compliance: [
      {
        id: 'comp-1',
        requirement: 'Annual Safety Inspection',
        regulation: 'FMCSA 396.17',
        status: 'compliant',
        dueDate: new Date('2025-01-15'),
        responsibleParty: 'Fleet Manager',
        lastChecked: new Date('2024-01-15'),
        nextCheck: new Date('2025-01-15')
      }
    ],
    assignedDrivers: [],
    assignedRoutes: []
  };

  // Load truck data
  useEffect(() => {
    const loadTruckData = async () => {
      console.log('Loading truck data for ID:', truckId);
      setLoading(true);
      try {
        // For now, we'll use mock data
        // In a real app, you would fetch from API
        console.log('Setting truck data:', mockTruck);
        setTruck(mockTruck);
      } catch (error) {
        console.error('Error loading truck data:', error);
      } finally {
        setLoading(false);
        console.log('Truck data loading completed');
      }
    };

    loadTruckData();
  }, [truckId]);

  // Load documents when documents tab is active
  useEffect(() => {
    if (activeTab === 'documents' && truckId) {
      loadDocuments();
    }
  }, [activeTab, truckId]);

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await documentApi.getDocuments({
        entityType: 'TRUCK',
        entityId: truckId,
      });
      setDocuments(response.documents || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  console.log('TruckRecords render - loading:', loading, 'truck:', truck);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading truck records...</p>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="p-6 text-center">
        <FaTruck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Truck Not Found</h3>
        <p className="text-gray-500">The requested truck could not be found.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'compliant':
      case 'passed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'expired':
      case 'non_compliant':
      case 'failed':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'expiring_soon':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{truck.name} - Complete Records</h1>
            <p className="text-gray-600">License: {truck.licensePlate} • VIN: {truck.vin}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
              <FaDownload className="w-4 h-4" />
              Export Records
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <FaPlus className="w-4 h-4" />
              Add Record
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaFileAlt className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Documents</p>
              <p className="text-2xl font-bold text-gray-900">{truck.documents?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaTools className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{truck.maintenance?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaShieldAlt className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inspections</p>
              <p className="text-2xl font-bold text-gray-900">{truck.inspections?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Alerts</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: FaTruck },
            { id: 'documents', label: 'Documents', icon: FaFileAlt },
            { id: 'maintenance', label: 'Maintenance', icon: FaTools },
            { id: 'inspections', label: 'Inspections', icon: FaShieldAlt },
            { id: 'insurance', label: 'Insurance', icon: FaShieldAlt },
            { id: 'fuel', label: 'Fuel & Costs', icon: FaGasPump },
            { id: 'tires', label: 'Tires', icon: FaTachometerAlt }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {activeTab === 'overview' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Truck Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vehicle Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Vehicle Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Make/Model:</span>
                    <span className="font-medium">{truck.make} {truck.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Year:</span>
                    <span className="font-medium">{truck.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Capacity:</span>
                    <span className="font-medium">{truck.capacity?.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fuel Type:</span>
                    <span className="font-medium">{truck.fuelType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transmission:</span>
                    <span className="font-medium">{truck.transmissionType}</span>
                  </div>
                </div>
              </div>

              {/* Compliance Status */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Compliance Status</h3>
                <div className="space-y-2">
                  {truck.compliance?.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{record.requirement}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOcrDocumentType('general');
                    setShowOcrUpload(true);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <FaCamera className="w-3 h-3" />
                  OCR Upload
                </button>
                <button
                  onClick={() => setShowAddDocument(true)}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
                >
                  <FaPlus className="w-3 h-3" />
                  Add Document
                </button>
              </div>
            </div>
            {loadingDocuments ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FaFileAlt className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No documents found</p>
                <p className="text-sm text-gray-400 mt-1">Click "Add Document" to upload a document</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map(doc => (
                  <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.title}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.documentNumber ? `#${doc.documentNumber} • ` : ''}
                            {doc.documentType} • {doc.fileName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {doc.status}
                        </span>
                        {doc.fileUrl && (
                          <div className="relative group">
                            <button
                              onClick={async () => {
                                setViewingDocument(doc);
                                setLoadingDocumentView(true);
                                setDocumentViewUrl(null);

                                try {
                                  // Fetch file as blob with authentication
                                  const blob = await documentApi.downloadDocument(doc.id);
                                  const url = URL.createObjectURL(blob);
                                  setDocumentViewUrl(url);
                                } catch (error: any) {
                                  console.error('Error loading document:', error);
                                  toast.error('Failed to load document');
                                  // Fallback to direct URL
                                  setDocumentViewUrl(doc.fileUrl);
                                } finally {
                                  setLoadingDocumentView(false);
                                }
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FaEye className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              View Document
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                        )}
                        <div className="relative group">
                          <button
                            onClick={async () => {
                              try {
                                await documentApi.deleteDocument(doc.id);
                                toast.success('Document deleted successfully');
                                loadDocuments();
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || 'Failed to delete document');
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Delete Document
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      {doc.issueDate && (
                        <div>
                          <span className="text-gray-500">Issue Date:</span>
                          <span className="ml-2">{new Date(doc.issueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {doc.expiryDate && (
                        <div>
                          <span className="text-gray-500">Expiry Date:</span>
                          <span className="ml-2">{new Date(doc.expiryDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">File Size:</span>
                        <span className="ml-2">{(doc.fileSize / 1024).toFixed(2)} KB</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Uploaded:</span>
                        <span className="ml-2">{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Maintenance Records</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOcrDocumentType('maintenance_record');
                    setShowOcrUpload(true);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <FaCamera className="w-3 h-3" />
                  OCR Upload
                </button>
                <button
                  onClick={() => setShowScheduleMaintenance(true)}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
                >
                  <FaPlus className="w-3 h-3" />
                  Schedule Maintenance
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {loadingMaintenance ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : maintenanceRecords.length === 0 && (!truck.maintenance || truck.maintenance.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <FaTools className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No maintenance records found</p>
                </div>
              ) : (
                (maintenanceRecords.length > 0 ? maintenanceRecords : truck.maintenance || []).map(record => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaTools className="w-6 h-6 text-orange-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{record.title}</h3>
                          <p className="text-sm text-gray-500">{record.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}>
                          {record.priority}
                        </span>
                        <div className="relative group">
                          <button
                            onClick={() => setEditingMaintenance(record)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Edit Maintenance
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Delete Maintenance Record',
                                message: 'Are you sure you want to delete this maintenance record? This action cannot be undone.',
                                confirmText: 'Delete',
                                cancelText: 'Cancel',
                                variant: 'danger',
                              });
                              if (confirmed) {
                                try {
                                  await fleetApi.deleteMaintenance(truckId, record.id);
                                  toast.success('Maintenance record deleted successfully');
                                  loadMaintenanceRecords();
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Failed to delete maintenance record');
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Delete Maintenance
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2">{new Date(record.date).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Cost:</span>
                        <span className="ml-2">${record.cost}</span>
                      </div>
                      {record.location && (
                        <div>
                          <span className="text-gray-500">Garage:</span>
                          <span className="ml-2">{record.location}</span>
                        </div>
                      )}
                      {record.mileage && (
                        <div>
                          <span className="text-gray-500">Mileage:</span>
                          <span className="ml-2">{record.mileage.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'inspections' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Inspection Records</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOcrDocumentType('inspection_report');
                    setShowOcrUpload(true);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <FaCamera className="w-3 h-3" />
                  OCR Upload
                </button>
                <button
                  onClick={() => setShowScheduleInspection(true)}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
                >
                  <FaPlus className="w-3 h-3" />
                  Schedule Inspection
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {loadingInspections ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : inspectionRecords.length === 0 && (!truck.inspections || truck.inspections.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <FaShieldAlt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No inspection records found</p>
                </div>
              ) : (
                (inspectionRecords.length > 0 ? inspectionRecords : truck.inspections || []).map(record => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaShieldAlt className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{record.title}</h3>
                          <p className="text-sm text-gray-500">Inspector: {record.inspector}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        {record.score !== undefined && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Score: {record.score}
                          </span>
                        )}
                        <div className="relative group">
                          <button
                            onClick={() => setEditingInspection(record)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Edit Inspection
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Delete Inspection Record',
                                message: 'Are you sure you want to delete this inspection record? This action cannot be undone.',
                                confirmText: 'Delete',
                                cancelText: 'Cancel',
                                variant: 'danger',
                              });
                              if (confirmed) {
                                try {
                                  await fleetApi.deleteInspection(truckId, record.id);
                                  toast.success('Inspection record deleted successfully');
                                  loadInspectionRecords();
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Failed to delete inspection record');
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Delete Inspection
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-2">{new Date(record.inspectionDate).toLocaleDateString()}</span>
                      </div>
                      {record.location && (
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-2">{record.location}</span>
                        </div>
                      )}
                      {record.cost !== undefined && (
                        <div>
                          <span className="text-gray-500">Cost:</span>
                          <span className="ml-2">${record.cost}</span>
                        </div>
                      )}
                      {record.mileage && (
                        <div>
                          <span className="text-gray-500">Mileage:</span>
                          <span className="ml-2">{record.mileage.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'insurance' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Insurance Records</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setOcrDocumentType('insurance_policy');
                    setShowOcrUpload(true);
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                >
                  <FaCamera className="w-3 h-3" />
                  OCR Upload
                </button>
                <button
                  onClick={() => setShowAddInsurance(true)}
                  className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
                >
                  <FaPlus className="w-3 h-3" />
                  Add Insurance
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {loadingInsurance ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : insuranceRecords.length === 0 && (!truck.insurance || truck.insurance.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <FaShieldAlt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No insurance records found</p>
                </div>
              ) : (
                (insuranceRecords.length > 0 ? insuranceRecords : truck.insurance || []).map(record => (
                  <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaShieldAlt className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">{record.policyType} Insurance</h3>
                          <p className="text-sm text-gray-500">Policy: {record.policyNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                        <div className="relative group">
                          <button
                            onClick={() => setEditingInsurance(record)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Edit Insurance
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                        <div className="relative group">
                          <button
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: 'Delete Insurance Record',
                                message: 'Are you sure you want to delete this insurance record? This action cannot be undone.',
                                confirmText: 'Delete',
                                cancelText: 'Cancel',
                                variant: 'danger',
                              });
                              if (confirmed) {
                                try {
                                  await fleetApi.deleteInsurance(truckId, record.id);
                                  toast.success('Insurance record deleted successfully');
                                  loadInsuranceRecords();
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Failed to delete insurance record');
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Delete Insurance
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Company:</span>
                        <span className="ml-2">{record.insuranceCompany}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Coverage:</span>
                        <span className="ml-2">${record.coverageAmount?.toLocaleString() || '0'}</span>
                      </div>
                      {record.premium !== undefined && (
                        <div>
                          <span className="text-gray-500">Premium:</span>
                          <span className="ml-2">${record.premium}</span>
                        </div>
                      )}
                      {record.deductible !== undefined && (
                        <div>
                          <span className="text-gray-500">Deductible:</span>
                          <span className="ml-2">${record.deductible}</span>
                        </div>
                      )}
                      {record.startDate && (
                        <div>
                          <span className="text-gray-500">Start Date:</span>
                          <span className="ml-2">{new Date(record.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {record.endDate && (
                        <div>
                          <span className="text-gray-500">End Date:</span>
                          <span className="ml-2">{new Date(record.endDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Fuel Records</h2>
              <button
                onClick={() => setShowAddFuel(true)}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Add Fuel Record
              </button>
            </div>
            {loadingFuel ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : fuelRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaGasPump className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No fuel records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fuelRecords.map(record => {
                  const costPerGallon = record.quantity > 0 ? (record.cost / record.quantity).toFixed(2) : '0.00';
                  return (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaGasPump className="w-6 h-6 text-green-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">Fuel Purchase</h3>
                            <p className="text-sm text-gray-500">
                              {record.quantity} {record.fuelType === 'electric' ? 'kWh' : 'gallons'} • ${costPerGallon}/{record.fuelType === 'electric' ? 'kWh' : 'gallon'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">${record.cost.toFixed(2)}</span>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => setEditingFuel(record)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Edit Fuel Record
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={async () => {
                                const confirmed = await confirm({
                                  title: 'Delete Fuel Record',
                                  message: 'Are you sure you want to delete this fuel record? This action cannot be undone.',
                                  confirmText: 'Delete',
                                  cancelText: 'Cancel',
                                  variant: 'danger',
                                });
                                if (confirmed) {
                                  try {
                                    await fleetApi.deleteFuelRecord(truckId, record.id);
                                    toast.success('Fuel record deleted successfully');
                                    loadFuelRecords();
                                  } catch (error: any) {
                                    toast.error(error.response?.data?.message || 'Failed to delete fuel record');
                                  }
                                }
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Delete Fuel Record
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-2">{new Date(record.date).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-2">{record.location}</span>
                        </div>
                        {record.driver && (
                          <div>
                            <span className="text-gray-500">Driver:</span>
                            <span className="ml-2">{record.driver}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Mileage:</span>
                          <span className="ml-2">{record.mileage?.toLocaleString() || 'N/A'}</span>
                        </div>
                        {record.fuelEfficiency && (
                          <div>
                            <span className="text-gray-500">Fuel Efficiency:</span>
                            <span className="ml-2">{record.fuelEfficiency} mpg</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Fuel Type:</span>
                          <span className="ml-2 capitalize">{record.fuelType}</span>
                        </div>
                      </div>
                      {record.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tires' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tire Records</h2>
              <button
                onClick={() => setShowAddTire(true)}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Add Tire Record
              </button>
            </div>
            {loadingTires ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : tireRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaTachometerAlt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No tire records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tireRecords.map(tire => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'good':
                        return 'bg-green-100 text-green-800';
                      case 'fair':
                        return 'bg-yellow-100 text-yellow-800';
                      case 'poor':
                        return 'bg-orange-100 text-orange-800';
                      case 'replaced':
                        return 'bg-gray-100 text-gray-800';
                      default:
                        return 'bg-gray-100 text-gray-800';
                    }
                  };
                  return (
                    <div key={tire.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaTachometerAlt className="w-6 h-6 text-purple-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">{tire.brand} {tire.model}</h3>
                            <p className="text-sm text-gray-500">
                              {tire.position.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} • {tire.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tire.status)}`}>
                            {tire.status.charAt(0).toUpperCase() + tire.status.slice(1)}
                          </span>
                          <div className="relative group">
                            <button
                              onClick={() => setEditingTire(tire)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Edit Tire Record
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={async () => {
                                const confirmed = await confirm({
                                  title: 'Delete Tire Record',
                                  message: 'Are you sure you want to delete this tire record? This action cannot be undone.',
                                  confirmText: 'Delete',
                                  cancelText: 'Cancel',
                                  variant: 'danger',
                                });
                                if (confirmed) {
                                  try {
                                    await fleetApi.deleteTireRecord(truckId, tire.id);
                                    toast.success('Tire record deleted successfully');
                                    loadTireRecords();
                                  } catch (error: any) {
                                    toast.error(error.response?.data?.message || 'Failed to delete tire record');
                                  }
                                }
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Delete Tire Record
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Tread Depth:</span>
                          <span className="ml-2">{tire.treadDepth}/32"</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pressure:</span>
                          <span className="ml-2">{tire.pressure} PSI</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Mileage:</span>
                          <span className="ml-2">{tire.currentMileage?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Expected Life:</span>
                          <span className="ml-2">{tire.expectedLifespan?.toLocaleString() || 'N/A'} miles</span>
                        </div>
                        {tire.serialNumber && (
                          <div>
                            <span className="text-gray-500">Serial Number:</span>
                            <span className="ml-2">{tire.serialNumber}</span>
                          </div>
                        )}
                        {tire.installationDate && (
                          <div>
                            <span className="text-gray-500">Installation Date:</span>
                            <span className="ml-2">{new Date(tire.installationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {tire.cost !== undefined && (
                          <div>
                            <span className="text-gray-500">Cost:</span>
                            <span className="ml-2">${tire.cost.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      {tire.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{tire.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Compliance tab hidden */}
        {false && activeTab === 'compliance' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Compliance Records</h2>
              <button
                onClick={() => setShowAddCompliance(true)}
                className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-1"
              >
                <FaPlus className="w-3 h-3" />
                Add Compliance Record
              </button>
            </div>
            {loadingCompliance ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : complianceRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaCertificate className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No compliance records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complianceRecords.map(record => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'compliant':
                        return 'bg-green-100 text-green-800';
                      case 'non_compliant':
                        return 'bg-red-100 text-red-800';
                      case 'warning':
                        return 'bg-yellow-100 text-yellow-800';
                      case 'critical':
                        return 'bg-red-200 text-red-900';
                      case 'pending':
                        return 'bg-blue-100 text-blue-800';
                      default:
                        return 'bg-gray-100 text-gray-800';
                    }
                  };
                  return (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FaCertificate className="w-6 h-6 text-indigo-600" />
                          <div>
                            <h3 className="font-medium text-gray-900">{record.requirement}</h3>
                            <p className="text-sm text-gray-500">{record.regulation}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="relative group">
                            <button
                              onClick={() => setEditingCompliance(record)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              Edit Compliance Record
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <span className="ml-2">{new Date(record.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Responsible:</span>
                          <span className="ml-2">{record.responsibleParty}</span>
                        </div>
                        {record.lastChecked && (
                          <div>
                            <span className="text-gray-500">Last Checked:</span>
                            <span className="ml-2">{new Date(record.lastChecked).toLocaleDateString()}</span>
                          </div>
                        )}
                        {record.nextCheck && (
                          <div>
                            <span className="text-gray-500">Next Check:</span>
                            <span className="ml-2">{new Date(record.nextCheck).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {record.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* OCR Upload Modal */}
      {showOcrUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <OcrDocumentUpload
              documentType={ocrDocumentType}
              onExtractionComplete={async (result) => {
                console.log('OCR Result:', result);

                // Optionally save the document after OCR extraction
                if (result.file && result.extractedData) {
                  try {
                    // Map OCR document type to document type
                    const documentTypeMap: { [key: string]: string } = {
                      'vehicle_registration': 'VEHICLE_REGISTRATION',
                      'insurance_policy': 'VEHICLE_INSURANCE',
                      'driver_license': 'DRIVER_LICENSE',
                      'maintenance_record': 'VEHICLE_MAINTENANCE',
                      'inspection_report': 'VEHICLE_INSPECTION',
                      'general': 'OTHER',
                    };

                    const docType = documentTypeMap[ocrDocumentType] || 'OTHER';
                    const title = result.extractedData.title ||
                      result.extractedData.documentNumber ||
                      `Document - ${new Date().toLocaleDateString()}`;

                    // Create document from OCR result
                    const createRequest: CreateDocumentRequest = {
                      entityType: 'TRUCK',
                      entityId: truckId,
                      documentType: docType,
                      category: 'OPERATIONAL',
                      title: title,
                      description: `OCR extracted: ${JSON.stringify(result.extractedData)}`,
                      documentNumber: result.extractedData.documentNumber,
                      issueDate: result.extractedData.issueDate,
                      expiryDate: result.extractedData.expiryDate,
                      priority: 'NORMAL',
                      metadata: { ocrData: result.extractedData },
                    };

                    await documentApi.createDocument(createRequest, result.file);
                    toast.success('Document uploaded and saved successfully');
                    loadDocuments();
                  } catch (error: any) {
                    console.error('Error saving OCR document:', error);
                    toast.error('OCR extraction completed, but failed to save document');
                  }
                }
              }}
              onClose={() => {
                setShowOcrUpload(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDocument && (
        <AddDocumentModal
          truckId={truckId}
          onClose={() => setShowAddDocument(false)}
          onSuccess={() => {
            setShowAddDocument(false);
            loadDocuments();
          }}
        />
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{viewingDocument.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {viewingDocument.fileName} • {viewingDocument.documentType}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <button
                    onClick={async () => {
                      try {
                        const blob = await documentApi.downloadDocument(viewingDocument.id);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = viewingDocument.fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } catch (error: any) {
                        toast.error('Failed to download document');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FaDownload className="w-4 h-4" />
                    Download
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Download Document
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => {
                      if (documentViewUrl) {
                        URL.revokeObjectURL(documentViewUrl);
                      }
                      setViewingDocument(null);
                      setDocumentViewUrl(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimesCircle className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-md shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Close
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              {loadingDocumentView ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading document...</p>
                  </div>
                </div>
              ) : documentViewUrl ? (
                <>
                  {viewingDocument.mimeType?.startsWith('image/') ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <img
                        src={documentViewUrl}
                        alt={viewingDocument.title}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : viewingDocument.mimeType === 'application/pdf' ? (
                    <div className="w-full h-full min-h-[500px]">
                      <iframe
                        src={documentViewUrl}
                        title={viewingDocument.title}
                        className="w-full h-full min-h-[500px] border rounded-lg"
                        style={{ minHeight: '70vh' }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                      <FaFileAlt className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                      <button
                        onClick={async () => {
                          try {
                            const blob = await documentApi.downloadDocument(viewingDocument.id);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = viewingDocument.fileName;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch (error: any) {
                            toast.error('Failed to download document');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <FaDownload className="w-4 h-4" />
                        Download to View
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center min-h-[400px]">
                  <p className="text-gray-600">Failed to load document</p>
                </div>
              )}
            </div>

            {/* Footer with document info */}
            {viewingDocument.description && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <p className="text-sm text-gray-600">{viewingDocument.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {showScheduleMaintenance && (
        <ScheduleMaintenanceModal
          truckId={truckId}
          onClose={() => setShowScheduleMaintenance(false)}
          onSuccess={() => {
            setShowScheduleMaintenance(false);
            loadMaintenanceRecords();
          }}
        />
      )}

      {/* Edit Maintenance Modal */}
      {editingMaintenance && (
        <ScheduleMaintenanceModal
          truckId={truckId}
          maintenance={editingMaintenance}
          onClose={() => setEditingMaintenance(null)}
          onSuccess={() => {
            setEditingMaintenance(null);
            loadMaintenanceRecords();
          }}
        />
      )}

      {/* Schedule Inspection Modal */}
      {showScheduleInspection && (
        <ScheduleInspectionModal
          truckId={truckId}
          onClose={() => setShowScheduleInspection(false)}
          onSuccess={() => {
            setShowScheduleInspection(false);
            loadInspectionRecords();
          }}
        />
      )}

      {/* Edit Inspection Modal */}
      {editingInspection && (
        <ScheduleInspectionModal
          truckId={truckId}
          inspection={editingInspection}
          onClose={() => setEditingInspection(null)}
          onSuccess={() => {
            setEditingInspection(null);
            loadInspectionRecords();
          }}
        />
      )}

      {/* Add Insurance Modal */}
      {showAddInsurance && (
        <AddInsuranceModal
          truckId={truckId}
          onClose={() => setShowAddInsurance(false)}
          onSuccess={() => {
            setShowAddInsurance(false);
            loadInsuranceRecords();
          }}
        />
      )}

      {/* Edit Insurance Modal */}
      {editingInsurance && (
        <AddInsuranceModal
          truckId={truckId}
          insurance={editingInsurance}
          onClose={() => setEditingInsurance(null)}
          onSuccess={() => {
            setEditingInsurance(null);
            loadInsuranceRecords();
          }}
        />
      )}

      {/* Add Fuel Record Modal */}
      {showAddFuel && (
        <AddFuelRecordModal
          truckId={truckId}
          onClose={() => setShowAddFuel(false)}
          onSuccess={() => {
            setShowAddFuel(false);
            loadFuelRecords();
          }}
        />
      )}

      {/* Edit Fuel Record Modal */}
      {editingFuel && (
        <AddFuelRecordModal
          truckId={truckId}
          fuel={editingFuel}
          onClose={() => setEditingFuel(null)}
          onSuccess={() => {
            setEditingFuel(null);
            loadFuelRecords();
          }}
        />
      )}

      {/* Add Tire Record Modal */}
      {showAddTire && (
        <AddTireRecordModal
          truckId={truckId}
          onClose={() => setShowAddTire(false)}
          onSuccess={() => {
            setShowAddTire(false);
            loadTireRecords();
          }}
        />
      )}

      {/* Edit Tire Record Modal */}
      {editingTire && (
        <AddTireRecordModal
          truckId={truckId}
          tire={editingTire}
          onClose={() => setEditingTire(null)}
          onSuccess={() => {
            setEditingTire(null);
            loadTireRecords();
          }}
        />
      )}

      {/* Add Compliance Record Modal */}
      {showAddCompliance && (
        <AddComplianceRecordModal
          truckId={truckId}
          onClose={() => setShowAddCompliance(false)}
          onSuccess={() => {
            setShowAddCompliance(false);
            loadComplianceRecords();
          }}
        />
      )}

      {/* Edit Compliance Record Modal */}
      {editingCompliance && (
        <AddComplianceRecordModal
          truckId={truckId}
          compliance={editingCompliance}
          onClose={() => setEditingCompliance(null)}
          onSuccess={() => {
            setEditingCompliance(null);
            loadComplianceRecords();
          }}
        />
      )}
      {DialogComponent}
    </div>
  );
};

// Schedule Maintenance Modal Component
interface ScheduleMaintenanceModalProps {
  truckId: string;
  maintenance?: MaintenanceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({ truckId, maintenance, onClose, onSuccess }) => {
  const isEditMode = !!maintenance;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: maintenance?.type || 'preventive' as string,
    title: maintenance?.title || '',
    description: maintenance?.description || '',
    date: maintenance?.date ? new Date(maintenance.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    cost: maintenance?.cost ? String(maintenance.cost) : '',
    nextDueDate: maintenance?.nextDueDate ? new Date(maintenance.nextDueDate).toISOString().split('T')[0] : '',
    status: maintenance?.status || 'scheduled' as string,
    priority: maintenance?.priority || 'medium' as string,
    assignedTechnician: maintenance?.assignedTechnician || '',
    location: maintenance?.location || '',
    mileage: maintenance?.mileage ? String(maintenance.mileage) : '',
    laborHours: maintenance?.laborHours ? String(maintenance.laborHours) : '',
    notes: maintenance?.notes || '',
  });

  const maintenanceTypes = [
    { value: 'preventive', label: 'Preventive' },
    { value: 'corrective', label: 'Corrective' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'repair', label: 'Repair' },
    { value: 'replacement', label: 'Replacement' },
    { value: 'upgrade', label: 'Upgrade' },
  ];

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Please enter a maintenance title');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    if (!formData.cost || Number(formData.cost) < 0) {
      toast.error('Please enter a valid cost');
      return;
    }

    setSubmitting(true);
    try {
      const maintenanceData: any = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        date: formData.date,
        cost: Number(formData.cost),
        status: formData.status,
        priority: formData.priority,
      };

      // Add optional fields if provided
      if (formData.nextDueDate) {
        maintenanceData.nextDueDate = formData.nextDueDate;
      }
      if (formData.assignedTechnician) {
        maintenanceData.assignedTechnician = formData.assignedTechnician;
      }
      if (formData.location) {
        maintenanceData.location = formData.location;
      }
      if (formData.mileage) {
        maintenanceData.mileage = Number(formData.mileage);
      }
      if (formData.laborHours) {
        maintenanceData.laborHours = Number(formData.laborHours);
      }
      if (formData.notes) {
        maintenanceData.notes = formData.notes;
      }

      if (isEditMode && maintenance?.id) {
        await fleetApi.updateMaintenance(truckId, maintenance.id, maintenanceData);
        toast.success('Maintenance updated successfully');
      } else {
        await fleetApi.scheduleMaintenance(truckId, maintenanceData);
        toast.success('Maintenance scheduled successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error scheduling maintenance:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaTools className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Maintenance Record' : 'Schedule Maintenance'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Maintenance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {maintenanceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Oil Change & Filter Replacement"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe the maintenance work to be performed..."
                required
              />
            </div>

            {/* Date and Cost Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Status and Priority Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {priorityOptions.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Next Due Date and Mileage Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Due Date
                </label>
                <input
                  type="date"
                  name="nextDueDate"
                  value={formData.nextDueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage
                </label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Current mileage"
                />
              </div>
            </div>

            {/* Assigned Technician and Location Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Technician
                </label>
                <input
                  type="text"
                  name="assignedTechnician"
                  value={formData.assignedTechnician}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Technician name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Fleet Garage"
                />
              </div>
            </div>

            {/* Labor Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Labor Hours
              </label>
              <input
                type="number"
                name="laborHours"
                value={formData.laborHours}
                onChange={handleChange}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Estimated labor hours"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes or comments..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? 'Updating...' : 'Scheduling...'}
                  </>
                ) : (
                  <>
                    <FaEdit className="w-4 h-4" />
                    {isEditMode ? 'Update Maintenance' : 'Schedule Maintenance'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Schedule Inspection Modal Component
interface ScheduleInspectionModalProps {
  truckId: string;
  inspection?: InspectionRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({ truckId, inspection, onClose, onSuccess }) => {
  const isEditMode = !!inspection;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: inspection?.type || 'annual' as string,
    title: inspection?.title || '',
    inspector: inspection?.inspector || '',
    inspectionDate: inspection?.inspectionDate ? new Date(inspection.inspectionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    nextInspectionDate: inspection?.nextInspectionDate ? new Date(inspection.nextInspectionDate).toISOString().split('T')[0] : '',
    status: inspection?.status || 'pending' as string,
    score: inspection?.score ? String(inspection.score) : '',
    cost: inspection?.cost ? String(inspection.cost) : '',
    location: inspection?.location || '',
    mileage: inspection?.mileage ? String(inspection.mileage) : '',
    notes: inspection?.notes || '',
    isRequired: inspection?.isRequired !== undefined ? inspection.isRequired : true,
  });

  const inspectionTypes = [
    { value: 'safety', label: 'Safety' },
    { value: 'emissions', label: 'Emissions' },
    { value: 'weight', label: 'Weight' },
    { value: 'brake', label: 'Brake' },
    { value: 'tire', label: 'Tire' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'hydraulic', label: 'Hydraulic' },
    { value: 'pre_trip', label: 'Pre-Trip' },
    { value: 'post_trip', label: 'Post-Trip' },
    { value: 'annual', label: 'Annual' },
    { value: 'biennial', label: 'Biennial' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'conditional', label: 'Conditional' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter an inspection title');
      return;
    }

    if (!formData.inspector.trim()) {
      toast.error('Please enter an inspector name');
      return;
    }

    if (!formData.inspectionDate) {
      toast.error('Please select an inspection date');
      return;
    }

    if (!formData.nextInspectionDate) {
      toast.error('Please select a next inspection date');
      return;
    }

    setSubmitting(true);
    try {
      const inspectionData: any = {
        type: formData.type,
        title: formData.title,
        inspector: formData.inspector,
        inspectionDate: formData.inspectionDate,
        nextInspectionDate: formData.nextInspectionDate,
        status: formData.status,
        isRequired: formData.isRequired,
      };

      if (formData.score) {
        const scoreNum = Number(formData.score);
        if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= 100) {
          inspectionData.score = scoreNum;
        }
      }
      if (formData.cost) {
        inspectionData.cost = Number(formData.cost);
      }
      if (formData.location) {
        inspectionData.location = formData.location;
      }
      if (formData.mileage) {
        inspectionData.mileage = Number(formData.mileage);
      }
      if (formData.notes) {
        inspectionData.notes = formData.notes;
      }

      if (isEditMode && inspection?.id) {
        await fleetApi.updateInspection(truckId, inspection.id, inspectionData);
        toast.success('Inspection updated successfully');
      } else {
        await fleetApi.scheduleInspection(truckId, inspectionData);
        toast.success('Inspection scheduled successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error scheduling inspection:', error);
      toast.error(error.response?.data?.message || 'Failed to schedule inspection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaClipboardCheck className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Inspection Record' : 'Schedule Inspection'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                {inspectionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Annual Safety Inspection"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspector <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="inspector"
                value={formData.inspector}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Inspector name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="inspectionDate"
                  value={formData.inspectionDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Inspection Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="nextInspectionDate"
                  value={formData.nextInspectionDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score (0-100)
                </label>
                <input
                  type="number"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost ($)
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage
                </label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Current mileage"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Inspection Station"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes or comments..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isRequired"
                id="isRequired"
                checked={formData.isRequired}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isRequired" className="ml-2 text-sm font-medium text-gray-700">
                Required Inspection
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? 'Updating...' : 'Scheduling...'}
                  </>
                ) : (
                  <>
                    <FaEdit className="w-4 h-4" />
                    {isEditMode ? 'Update Inspection' : 'Schedule Inspection'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Insurance Modal Component
interface AddInsuranceModalProps {
  truckId: string;
  insurance?: InsuranceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddInsuranceModal: React.FC<AddInsuranceModalProps> = ({ truckId, insurance, onClose, onSuccess }) => {
  const isEditMode = !!insurance;
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const documentApi = new DocumentApiService();
  const [formData, setFormData] = useState({
    policyNumber: insurance?.policyNumber || '',
    insuranceCompany: insurance?.insuranceCompany || '',
    policyType: insurance?.policyType || 'liability' as string,
    coverageAmount: insurance?.coverageAmount ? String(insurance.coverageAmount) : '',
    deductible: insurance?.deductible ? String(insurance.deductible) : '',
    premium: insurance?.premium ? String(insurance.premium) : '',
    startDate: insurance?.startDate ? new Date(insurance.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: insurance?.endDate ? new Date(insurance.endDate).toISOString().split('T')[0] : '',
    status: insurance?.status || 'valid' as string,
    agent: insurance?.agent || '',
    agentContact: insurance?.agentContact || '',
    autoRenewal: insurance?.autoRenewal !== undefined ? insurance.autoRenewal : false,
    notes: insurance?.notes || '',
    documentUrl: insurance?.documents?.[0] || '',
  });

  const policyTypes = [
    { value: 'liability', label: 'Liability' },
    { value: 'comprehensive', label: 'Comprehensive' },
    { value: 'cargo', label: 'Cargo' },
    { value: 'physical_damage', label: 'Physical Damage' },
    { value: 'umbrella', label: 'Umbrella' },
  ];

  const statusOptions = [
    { value: 'valid', label: 'Valid' },
    { value: 'expired', label: 'Expired' },
    { value: 'expiring_soon', label: 'Expiring Soon' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'pending', label: 'Pending' },
  ];

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const uploadDocument = async (): Promise<string | null> => {
    if (!file) return null;

    setUploadingDocument(true);
    try {
      const createRequest: CreateDocumentRequest = {
        entityType: 'TRUCK',
        entityId: truckId,
        documentType: 'VEHICLE_INSURANCE',
        category: 'OPERATIONAL',
        title: `Insurance Policy - ${formData.policyNumber}`,
        description: `Insurance document for ${formData.insuranceCompany}`,
        priority: 'HIGH',
      };

      const document = await documentApi.createDocument(createRequest, file);
      return document.fileUrl;
    } catch (error: any) {
      console.error('Error uploading insurance document:', error);
      toast.error('Failed to upload insurance document');
      return null;
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.policyNumber.trim()) {
      toast.error('Please enter a policy number');
      return;
    }

    if (!formData.insuranceCompany.trim()) {
      toast.error('Please enter an insurance company name');
      return;
    }

    if (!formData.coverageAmount || Number(formData.coverageAmount) <= 0) {
      toast.error('Please enter a valid coverage amount');
      return;
    }

    if (!formData.startDate) {
      toast.error('Please select a start date');
      return;
    }

    if (!formData.endDate) {
      toast.error('Please select an end date');
      return;
    }

    setSubmitting(true);
    try {
      let documentUrl = formData.documentUrl;
      if (file && !isEditMode) {
        const uploadedUrl = await uploadDocument();
        if (uploadedUrl) {
          documentUrl = uploadedUrl;
        }
      }

      const insuranceData: any = {
        policyNumber: formData.policyNumber,
        insuranceCompany: formData.insuranceCompany,
        policyType: formData.policyType,
        coverageAmount: Number(formData.coverageAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        autoRenewal: formData.autoRenewal,
      };

      if (formData.deductible) {
        insuranceData.deductible = Number(formData.deductible);
      }
      if (formData.premium) {
        insuranceData.premium = Number(formData.premium);
      }
      if (formData.agent) {
        insuranceData.agent = formData.agent;
      }
      if (formData.agentContact) {
        insuranceData.agentContact = formData.agentContact;
      }
      if (formData.notes) {
        insuranceData.notes = formData.notes;
      }
      if (documentUrl) {
        insuranceData.documentUrl = documentUrl;
        insuranceData.documents = [documentUrl];
      }

      if (isEditMode && insurance?.id) {
        await fleetApi.updateInsurance(truckId, insurance.id, insuranceData);
        toast.success('Insurance updated successfully');
      } else {
        await fleetApi.scheduleInsurance(truckId, insuranceData);
        toast.success('Insurance added successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving insurance:', error);
      toast.error(error.response?.data?.message || 'Failed to save insurance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Insurance Record' : 'Add Insurance'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Policy number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="insuranceCompany"
                  value={formData.insuranceCompany}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Company name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="policyType"
                  value={formData.policyType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {policyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coverage Amount ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="coverageAmount"
                  value={formData.coverageAmount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deductible ($)
                </label>
                <input
                  type="number"
                  name="deductible"
                  value={formData.deductible}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Premium ($)
              </label>
              <input
                type="number"
                name="premium"
                value={formData.premium}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  name="agent"
                  value={formData.agent}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Agent name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Contact
                </label>
                <input
                  type="text"
                  name="agentContact"
                  value={formData.agentContact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Phone or email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Document
              </label>
              <div className="mt-1">
                {!file && !preview && !formData.documentUrl && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors"
                  >
                    <FaUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
                {preview && (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-contain border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <FaTimesCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {file && !preview && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimesCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {formData.documentUrl && !file && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaFileAlt className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-700">Existing document attached</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, documentUrl: '' }));
                        fileInputRef.current?.click();
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      Replace
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes or comments..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="autoRenewal"
                id="autoRenewal"
                checked={formData.autoRenewal}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="autoRenewal" className="ml-2 text-sm font-medium text-gray-700">
                Auto Renewal
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || uploadingDocument}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingDocument}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting || uploadingDocument ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {uploadingDocument ? 'Uploading...' : isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    {isEditMode ? 'Update Insurance' : 'Add Insurance'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Fuel Record Modal Component
interface AddFuelRecordModalProps {
  truckId: string;
  fuel?: FuelRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddFuelRecordModal: React.FC<AddFuelRecordModalProps> = ({ truckId, fuel, onClose, onSuccess }) => {
  const isEditMode = !!fuel;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: fuel?.date ? new Date(fuel.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fuelType: fuel?.fuelType || 'diesel',
    quantity: fuel?.quantity ? String(fuel.quantity) : '',
    cost: fuel?.cost ? String(fuel.cost) : '',
    mileage: fuel?.mileage ? String(fuel.mileage) : '',
    location: fuel?.location || '',
    fuelEfficiency: fuel?.fuelEfficiency ? String(fuel.fuelEfficiency) : '',
    driver: fuel?.driver || '',
    receipt: fuel?.receipt || '',
    notes: fuel?.notes || '',
  });

  const fuelTypes = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'gasoline', label: 'Gasoline' },
    { value: 'electric', label: 'Electric' },
    { value: 'hybrid', label: 'Hybrid' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fuelData: any = {
        date: formData.date,
        fuelType: formData.fuelType,
        quantity: Number(formData.quantity),
        cost: Number(formData.cost),
        mileage: Number(formData.mileage),
        location: formData.location,
      };

      if (formData.fuelEfficiency) {
        fuelData.fuelEfficiency = Number(formData.fuelEfficiency);
      }
      if (formData.driver) {
        fuelData.driver = formData.driver;
      }
      if (formData.receipt) {
        fuelData.receipt = formData.receipt;
      }
      if (formData.notes) {
        fuelData.notes = formData.notes;
      }

      if (isEditMode && fuel?.id) {
        await fleetApi.updateFuelRecord(truckId, fuel.id, fuelData);
        toast.success('Fuel record updated successfully');
      } else {
        await fleetApi.addFuelRecord(truckId, fuelData);
        toast.success('Fuel record added successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving fuel record:', error);
      toast.error(error.response?.data?.message || 'Failed to save fuel record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaGasPump className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Fuel Record' : 'Add Fuel Record'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {fuelTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity ({formData.fuelType === 'electric' ? 'kWh' : 'gallons'}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mileage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Gas station name or address"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fuel Efficiency (mpg)
                </label>
                <input
                  type="number"
                  name="fuelEfficiency"
                  value={formData.fuelEfficiency}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver
                </label>
                <input
                  type="text"
                  name="driver"
                  value={formData.driver}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Driver name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receipt URL or Reference
              </label>
              <input
                type="text"
                name="receipt"
                value={formData.receipt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Receipt number or URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes about this fuel purchase"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    {isEditMode ? 'Update Fuel Record' : 'Add Fuel Record'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Tire Record Modal Component
interface AddTireRecordModalProps {
  truckId: string;
  tire?: TireRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddTireRecordModal: React.FC<AddTireRecordModalProps> = ({ truckId, tire, onClose, onSuccess }) => {
  const isEditMode = !!tire;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    position: tire?.position || 'front_left',
    brand: tire?.brand || '',
    model: tire?.model || '',
    size: tire?.size || '',
    serialNumber: tire?.serialNumber || '',
    installationDate: tire?.installationDate ? new Date(tire.installationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    expectedLifespan: tire?.expectedLifespan ? String(tire.expectedLifespan) : '',
    currentMileage: tire?.currentMileage ? String(tire.currentMileage) : '',
    treadDepth: tire?.treadDepth ? String(tire.treadDepth) : '',
    pressure: tire?.pressure ? String(tire.pressure) : '',
    status: tire?.status || 'good',
    replacementDate: tire?.replacementDate ? new Date(tire.replacementDate).toISOString().split('T')[0] : '',
    cost: tire?.cost ? String(tire.cost) : '',
    notes: tire?.notes || '',
  });

  const positions = [
    { value: 'front_left', label: 'Front Left' },
    { value: 'front_right', label: 'Front Right' },
    { value: 'rear_left', label: 'Rear Left' },
    { value: 'rear_right', label: 'Rear Right' },
    { value: 'spare', label: 'Spare' },
  ];

  const statusOptions = [
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'replaced', label: 'Replaced' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tireData: any = {
        position: formData.position,
        brand: formData.brand,
        model: formData.model,
        size: formData.size,
        installationDate: formData.installationDate,
        expectedLifespan: Number(formData.expectedLifespan),
        currentMileage: Number(formData.currentMileage),
        treadDepth: Number(formData.treadDepth),
        pressure: Number(formData.pressure),
        status: formData.status,
      };

      if (formData.serialNumber) {
        tireData.serialNumber = formData.serialNumber;
      }
      if (formData.replacementDate) {
        tireData.replacementDate = formData.replacementDate;
      }
      if (formData.cost) {
        tireData.cost = Number(formData.cost);
      }
      if (formData.notes) {
        tireData.notes = formData.notes;
      }

      if (isEditMode && tire?.id) {
        await fleetApi.updateTireRecord(truckId, tire.id, tireData);
        toast.success('Tire record updated successfully');
      } else {
        await fleetApi.addTireRecord(truckId, tireData);
        toast.success('Tire record added successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving tire record:', error);
      toast.error(error.response?.data?.message || 'Failed to save tire record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaTachometerAlt className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Tire Record' : 'Add Tire Record'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position <span className="text-red-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Michelin, Bridgestone"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tire model"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 225/75R16"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tire serial number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installation Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Replacement Date
                </label>
                <input
                  type="date"
                  name="replacementDate"
                  value={formData.replacementDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Lifespan (miles) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="expectedLifespan"
                  value={formData.expectedLifespan}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Mileage <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="currentMileage"
                  value={formData.currentMileage}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tread Depth (32nds) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="treadDepth"
                  value={formData.treadDepth}
                  onChange={handleChange}
                  min="0"
                  max="32"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pressure (PSI) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="pressure"
                  value={formData.pressure}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost ($)
              </label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes about this tire"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    {isEditMode ? 'Update Tire Record' : 'Add Tire Record'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Compliance Record Modal Component
interface AddComplianceRecordModalProps {
  truckId: string;
  compliance?: ComplianceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const AddComplianceRecordModal: React.FC<AddComplianceRecordModalProps> = ({ truckId, compliance, onClose, onSuccess }) => {
  const isEditMode = !!compliance;
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    regulation: compliance?.regulation || '',
    requirement: compliance?.requirement || '',
    dueDate: compliance?.dueDate ? new Date(compliance.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    status: compliance?.status || 'pending',
    lastChecked: compliance?.lastChecked ? new Date(compliance.lastChecked).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    nextCheck: compliance?.nextCheck ? new Date(compliance.nextCheck).toISOString().split('T')[0] : '',
    responsibleParty: compliance?.responsibleParty || '',
    documentation: compliance?.documentation?.join(', ') || '',
    notes: compliance?.notes || '',
  });

  const statusOptions = [
    { value: 'compliant', label: 'Compliant' },
    { value: 'non_compliant', label: 'Non-Compliant' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' },
    { value: 'pending', label: 'Pending' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const complianceData: any = {
        regulation: formData.regulation,
        requirement: formData.requirement,
        dueDate: formData.dueDate,
        status: formData.status,
        lastChecked: formData.lastChecked,
        nextCheck: formData.nextCheck,
        responsibleParty: formData.responsibleParty,
      };

      if (formData.documentation) {
        complianceData.documentation = formData.documentation.split(',').map(url => url.trim()).filter(url => url);
      }
      if (formData.notes) {
        complianceData.notes = formData.notes;
      }

      if (isEditMode && compliance?.id) {
        await fleetApi.updateComplianceRecord(truckId, compliance.id, complianceData);
        toast.success('Compliance record updated successfully');
      } else {
        await fleetApi.addComplianceRecord(truckId, complianceData);
        toast.success('Compliance record added successfully');
      }
      onSuccess();
    } catch (error: any) {
      console.error('Error saving compliance record:', error);
      toast.error(error.response?.data?.message || 'Failed to save compliance record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaCertificate className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Compliance Record' : 'Add Compliance Record'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regulation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="regulation"
                value={formData.regulation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., DOT, FMCSA, OSHA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirement <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="requirement"
                value={formData.requirement}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Compliance requirement description"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Checked <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="lastChecked"
                  value={formData.lastChecked}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Check <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="nextCheck"
                  value={formData.nextCheck}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsible Party <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="responsibleParty"
                value={formData.responsibleParty}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Person or department responsible"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documentation URLs (comma-separated)
              </label>
              <input
                type="text"
                name="documentation"
                value={formData.documentation}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="URL1, URL2, URL3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Additional notes about this compliance requirement"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4" />
                    {isEditMode ? 'Update Compliance Record' : 'Add Compliance Record'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add Document Modal Component
interface AddDocumentModalProps {
  truckId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ truckId, onClose, onSuccess }) => {
  useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateDocumentRequest>({
    entityType: 'TRUCK',
    entityId: truckId,
    documentType: 'OTHER',
    category: 'OPERATIONAL',
    title: '',
    description: '',
    priority: 'NORMAL',
  });
  const documentApi = new DocumentApiService();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const documentTypes = [
    { value: 'VEHICLE_REGISTRATION', label: 'Vehicle Registration' },
    { value: 'VEHICLE_PERMIT', label: 'Vehicle Permit' },
    { value: 'SAFETY_CERT', label: 'Safety Certificate' },
    { value: 'ENVIRONMENTAL_CERT', label: 'Environmental Certificate' },
    { value: 'QUALITY_CERT', label: 'Quality Certificate' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload an image, PDF, or Word document.');
      return;
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size too large. Please upload a file smaller than 10MB.');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setUploading(true);
    try {
      await documentApi.createDocument(formData, file);
      toast.success('Document uploaded successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isOpen = true;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="hidden">
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>Upload a new document for this truck</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaFileAlt className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Add Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter document title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter document description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Document Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Number
              </label>
              <input
                type="text"
                value={formData.documentNumber || ''}
                onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                placeholder="Enter document number (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Issue Date and Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={formData.issueDate || ''}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document File *
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-primary-400'
                  }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!file ? (
                  <div>
                    <FaUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Upload Document
                    </p>
                    <p className="text-gray-500 mb-4">
                      Drag and drop your document here, or click to browse
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                      Choose File
                    </button>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported: PDF, Word, Images (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div>
                    <FaFileAlt className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                    {preview && (
                      <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded border mb-4" />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Remove File
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="w-4 h-4" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 