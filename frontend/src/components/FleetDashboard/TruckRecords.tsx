import React, { useState, useEffect } from 'react';
import { 
  FaTruck, FaFileAlt, FaTools, FaShieldAlt, FaGasPump, FaTachometerAlt, 
  FaUserGraduate, FaExclamationTriangle, FaCheckCircle, FaClock, FaCalendarAlt,
  FaDownload, FaUpload, FaEye, FaEdit, FaTrash, FaPlus, FaSearch, FaFilter,
  FaRoute, FaUsers, FaCog, FaChartLine, FaBell, FaCertificate, FaClipboardCheck,
  FaCamera, FaFileImage
} from 'react-icons/fa';
import type { FleetItem, TruckDocument, MaintenanceRecord, InspectionRecord, InsuranceRecord, FuelRecord, TireRecord, ComplianceRecord, DriverQualification } from '../../types/fleet';
import { OcrDocumentUpload } from '../OCR/OcrDocumentUpload';
import type { OcrExtractionResult } from '../../services/ocrApi';

interface TruckRecordsProps {
  truckId: string;
}

export const TruckRecords: React.FC<TruckRecordsProps> = ({ truckId }) => {
  const [truck, setTruck] = useState<FleetItem | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showOcrUpload, setShowOcrUpload] = useState(false);
  const [ocrDocumentType, setOcrDocumentType] = useState('general');
  const [ocrResult, setOcrResult] = useState<OcrExtractionResult | null>(null);

  // Mock data for demonstration
  const mockTruck: FleetItem = {
    id: truckId,
    type: 'truck',
    name: 'Truck 001',
    status: 'available',
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
        vendor: 'NY DMV'
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
        vendor: 'Progressive'
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
        type: 'liability',
        policyNumber: 'POL-2024-001',
        insuranceCompany: 'Progressive Insurance',
        coverageAmount: 1000000,
        premium: 2500,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: 'active',
        deductible: 1000,
        policyHolder: 'Fleet Company LLC',
        agent: 'John Doe',
        claims: [
          {
            id: 'claim-1',
            date: new Date('2024-02-15'),
            amount: 5000,
            description: 'Minor accident repair',
            status: 'settled',
            claimNumber: 'CLM-2024-001'
          }
        ]
      }
    ],
    fuel: [
      {
        id: 'fuel-1',
        date: new Date('2024-01-20'),
        gallons: 150,
        costPerGallon: 3.50,
        totalCost: 525,
        fuelType: 'Diesel',
        location: 'Fleet Fuel Station',
        odometerReading: 46000,
        driver: 'Mike Johnson',
        receiptNumber: 'RCP-2024-001'
      }
    ],
    tires: [
      {
        id: 'tire-1',
        position: 'Front Left',
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
        lastReviewDate: new Date('2024-01-15'),
        nextReviewDate: new Date('2025-01-15'),
        complianceStatus: 'compliant'
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
            { id: 'tires', label: 'Tires', icon: FaTachometerAlt },
            { id: 'compliance', label: 'Compliance', icon: FaCertificate }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
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
                    <span className="font-medium">{truck.capacity?.toLocaleString()} lbs</span>
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
                <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                  <FaPlus className="w-3 h-3 inline mr-1" />
                  Add Document
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {truck.documents?.map(doc => (
                <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaFileAlt className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{doc.name}</h3>
                        <p className="text-sm text-gray-500">#{doc.documentNumber} • {doc.issuingAuthority}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <FaEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Issue Date:</span>
                      <span className="ml-2">{doc.issueDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expiry Date:</span>
                      <span className="ml-2">{doc.expiryDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost:</span>
                      <span className="ml-2">${doc.cost}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Vendor:</span>
                      <span className="ml-2">{doc.vendor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
                <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                  <FaPlus className="w-3 h-3 inline mr-1" />
                  Schedule Maintenance
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {truck.maintenance?.map(record => (
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
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{record.date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost:</span>
                      <span className="ml-2">${record.cost}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Technician:</span>
                      <span className="ml-2">{record.assignedTechnician}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mileage:</span>
                      <span className="ml-2">{record.mileage.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
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
                <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                  <FaPlus className="w-3 h-3 inline mr-1" />
                  Schedule Inspection
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {truck.inspections?.map(record => (
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Score: {record.score}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{record.inspectionDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Next Due:</span>
                      <span className="ml-2">{record.nextInspectionDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost:</span>
                      <span className="ml-2">${record.cost}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mileage:</span>
                      <span className="ml-2">{record.mileage.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
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
                <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                  <FaPlus className="w-3 h-3 inline mr-1" />
                  Add Insurance
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {truck.insurance?.map(record => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaShieldAlt className="w-6 h-6 text-blue-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{record.type} Insurance</h3>
                        <p className="text-sm text-gray-500">Policy: {record.policyNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Company:</span>
                      <span className="ml-2">{record.insuranceCompany}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Coverage:</span>
                      <span className="ml-2">${record.coverageAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Premium:</span>
                      <span className="ml-2">${record.premium}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Deductible:</span>
                      <span className="ml-2">${record.deductible}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Fuel Records</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Add Fuel Record
              </button>
            </div>
            <div className="space-y-4">
              {truck.fuel?.map(record => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaGasPump className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">Fuel Purchase</h3>
                        <p className="text-sm text-gray-500">{record.gallons} gallons • ${record.costPerGallon}/gallon</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">${record.totalCost}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <span className="ml-2">{record.date.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-2">{record.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2">{record.driver}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Odometer:</span>
                      <span className="ml-2">{record.odometerReading.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tires' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tire Records</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Add Tire Record
              </button>
            </div>
            <div className="space-y-4">
              {truck.tires?.map(tire => (
                <div key={tire.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaTachometerAlt className="w-6 h-6 text-purple-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{tire.brand} {tire.model}</h3>
                        <p className="text-sm text-gray-500">{tire.position} • {tire.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tire.status)}`}>
                        {tire.status}
                      </span>
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
                      <span className="ml-2">{tire.currentMileage.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Expected Life:</span>
                      <span className="ml-2">{tire.expectedLifespan.toLocaleString()} miles</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Compliance Records</h2>
              <button className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700">
                <FaPlus className="w-3 h-3 inline mr-1" />
                Add Compliance Record
              </button>
            </div>
            <div className="space-y-4">
              {truck.compliance?.map(record => (
                <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaCertificate className="w-6 h-6 text-indigo-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{record.requirement}</h3>
                        <p className="text-sm text-gray-500">{record.regulation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <span className="ml-2">{record.dueDate.toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Responsible:</span>
                      <span className="ml-2">{record.responsibleParty}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OCR Upload Modal */}
      {showOcrUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <OcrDocumentUpload
              documentType={ocrDocumentType}
              onExtractionComplete={(result) => {
                setOcrResult(result);
                console.log('OCR Result:', result);
                // Here you would typically save the extracted data to the database
                // For now, we'll just log it
              }}
              onClose={() => {
                setShowOcrUpload(false);
                setOcrResult(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}; 