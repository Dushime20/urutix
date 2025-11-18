import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Truck, 
  FileText, 
  Camera, 
  MessageSquare,
  Phone,
  Download,
  Eye,
  Filter,
  Search,
  Calendar,
  Star,
  Flag,
  Zap,
  Shield,
  Thermometer,
  Weight,
  Ruler
} from 'lucide-react';
import { CargoDetails } from './CargoDetails';
import { CargoInspection } from './CargoInspection';

interface CargoItem {
  id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'LOADED' | 'IN_TRANSIT' | 'DELIVERED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  pickupLocation: string;
  deliveryLocation: string;
  pickupTime: string;
  deliveryTime: string;
  value: number;
  fragility: 'LOW' | 'MEDIUM' | 'HIGH';
  temperature: {
    min: number;
    max: number;
    unit: 'C' | 'F';
  };
  hazardous: boolean;
  shipper: {
    name: string;
    contact: string;
    phone: string;
    email: string;
  };
  inspectionStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  inspectionResult?: any;
  notes: string[];
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

interface CargoManagementProps {
  driverId: string;
}

export const CargoManagement: React.FC<CargoManagementProps> = ({ driverId }) => {
  const [cargos, setCargos] = useState<CargoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCargo, setSelectedCargo] = useState<CargoItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details' | 'inspection'>('list');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'pickupTime' | 'value' | 'createdAt'>('priority');

  // Mock cargo data - in real app this would come from API
  useEffect(() => {
    setTimeout(() => {
      setCargos([
        {
          id: 'CARGO-001',
          name: 'High-Value Electronics & Pharmaceuticals',
          description: 'Mixed shipment of sensitive electronic components and temperature-controlled pharmaceutical products',
          status: 'PENDING',
          priority: 'HIGH',
          category: 'Mixed Cargo',
          weight: 1250,
          dimensions: { length: 200, width: 150, height: 100 },
          pickupLocation: 'Tech Valley, CA',
          deliveryLocation: 'Logistics Hub, TX',
          pickupTime: '2024-01-20T08:00:00Z',
          deliveryTime: '2024-01-21T14:00:00Z',
          value: 75000,
          fragility: 'HIGH',
          temperature: { min: 15, max: 25, unit: 'C' },
          hazardous: false,
          shipper: {
            name: 'TechPharm Solutions Ltd.',
            contact: 'Sarah Johnson',
            phone: '+1-555-0123',
            email: 'sarah.johnson@techpharm.com'
          },
          inspectionStatus: 'PENDING',
          notes: ['Requires security escort', 'Temperature monitoring needed'],
          documents: ['Packing list', 'Safety data sheet', 'Customs declaration'],
          createdAt: '2024-01-19T10:00:00Z',
          updatedAt: '2024-01-19T10:00:00Z'
        },
        {
          id: 'CARGO-002',
          name: 'Agricultural Products',
          description: 'Fresh produce and grains requiring careful handling',
          status: 'INSPECTED',
          priority: 'MEDIUM',
          category: 'Agricultural',
          weight: 800,
          dimensions: { length: 150, width: 120, height: 80 },
          pickupLocation: 'Farm Valley, CA',
          deliveryLocation: 'Central Market, CA',
          pickupTime: '2024-01-20T06:00:00Z',
          deliveryTime: '2024-01-20T16:00:00Z',
          value: 2500,
          fragility: 'MEDIUM',
          temperature: { min: 2, max: 8, unit: 'C' },
          hazardous: false,
          shipper: {
            name: 'Fresh Harvest Co.',
            contact: 'Mike Rodriguez',
            phone: '+1-555-0124',
            email: 'mike.rodriguez@freshharvest.com'
          },
          inspectionStatus: 'COMPLETED',
          inspectionResult: { status: 'PASSED', issues: [] },
          notes: ['Refrigerated transport required'],
          documents: ['Packing list', 'Temperature log'],
          createdAt: '2024-01-19T08:00:00Z',
          updatedAt: '2024-01-19T15:00:00Z'
        },
        {
          id: 'CARGO-003',
          name: 'Industrial Machinery Parts',
          description: 'Heavy machinery components for manufacturing',
          status: 'APPROVED',
          priority: 'URGENT',
          category: 'Industrial',
          weight: 2500,
          dimensions: { length: 300, width: 200, height: 150 },
          pickupLocation: 'Industrial District, CA',
          deliveryLocation: 'Manufacturing Plant, NV',
          pickupTime: '2024-01-20T07:00:00Z',
          deliveryTime: '2024-01-20T18:00:00Z',
          value: 45000,
          fragility: 'LOW',
          temperature: { min: -10, max: 40, unit: 'C' },
          hazardous: false,
          shipper: {
            name: 'Industrial Supply Co.',
            contact: 'David Chen',
            phone: '+1-555-0125',
            email: 'david.chen@industrialsupply.com'
          },
          inspectionStatus: 'COMPLETED',
          inspectionResult: { status: 'PASSED', issues: [] },
          notes: ['Heavy lifting equipment needed', 'Secure strapping required'],
          documents: ['Packing list', 'Load securing guide'],
          createdAt: '2024-01-19T09:00:00Z',
          updatedAt: '2024-01-19T16:00:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'INSPECTED': return 'text-blue-600 bg-blue-100';
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'LOADED': return 'text-purple-600 bg-purple-100';
      case 'IN_TRANSIT': return 'text-indigo-600 bg-indigo-100';
      case 'DELIVERED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-orange-600 bg-orange-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInspectionStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-gray-600 bg-gray-100';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'FAILED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleInspectCargo = (cargo: CargoItem) => {
    setSelectedCargo(cargo);
    setViewMode('inspection');
  };

  const handleViewDetails = (cargo: CargoItem) => {
    setSelectedCargo(cargo);
    setViewMode('details');
  };

  const handleInspectionComplete = (result: any) => {
    if (selectedCargo) {
      setCargos(prev => prev.map(cargo => 
        cargo.id === selectedCargo.id 
          ? { 
              ...cargo, 
              inspectionStatus: 'COMPLETED', 
              inspectionResult: result,
              status: result.status === 'PASSED' ? 'APPROVED' : 'REJECTED',
              updatedAt: new Date().toISOString()
            }
          : cargo
      ));
      setViewMode('list');
      setSelectedCargo(null);
    }
  };

  const handleAcceptCargo = () => {
    if (selectedCargo) {
      setCargos(prev => prev.map(cargo => 
        cargo.id === selectedCargo.id 
          ? { ...cargo, status: 'APPROVED', updatedAt: new Date().toISOString() }
          : cargo
      ));
      setViewMode('list');
      setSelectedCargo(null);
    }
  };

  const handleRejectCargo = (reason: string) => {
    if (selectedCargo) {
      setCargos(prev => prev.map(cargo => 
        cargo.id === selectedCargo.id 
          ? { 
              ...cargo, 
              status: 'REJECTED', 
              notes: [...cargo.notes, `Rejected: ${reason}`],
              updatedAt: new Date().toISOString()
            }
          : cargo
      ));
      setViewMode('list');
      setSelectedCargo(null);
    }
  };

  const handleContactShipper = () => {
    // In real app, this would open a communication interface
    console.log('Contacting shipper...');
  };

  const filteredCargos = cargos.filter(cargo => {
    const matchesStatus = filterStatus === 'all' || cargo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || cargo.priority === filterPriority;
    const matchesSearch = cargo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cargo.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const sortedCargos = [...filteredCargos].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'pickupTime':
        return new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
      case 'value':
        return b.value - a.value;
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (viewMode === 'details' && selectedCargo) {
    return (
      <CargoDetails
        cargoId={selectedCargo.id}
        onInspect={() => setViewMode('inspection')}
        onAccept={handleAcceptCargo}
        onReject={handleRejectCargo}
        onContactShipper={handleContactShipper}
      />
    );
  }

  if (viewMode === 'inspection' && selectedCargo) {
    return (
      <CargoInspection
        cargoId={selectedCargo.id}
        onInspectionComplete={handleInspectionComplete}
        onCancel={() => setViewMode('list')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cargo Management</h2>
          <p className="text-gray-600">Review and manage assigned cargo shipments</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="INSPECTED">Inspected</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="LOADED">Loaded</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="priority">Priority</option>
              <option value="pickupTime">Pickup Time</option>
              <option value="value">Value</option>
              <option value="createdAt">Created Date</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cargo List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cargo Shipments ({sortedCargos.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {sortedCargos.map((cargo) => (
            <div key={cargo.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-gray-900">{cargo.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cargo.status)}`}>
                      {cargo.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(cargo.priority)}`}>
                      {cargo.priority}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{cargo.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Weight className="w-4 h-4 text-gray-400" />
                      <span>{cargo.weight} kg</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Ruler className="w-4 h-4 text-gray-400" />
                      <span>{cargo.dimensions.length}×{cargo.dimensions.width}×{cargo.dimensions.height} cm</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{cargo.pickupLocation} → {cargo.deliveryLocation}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(cargo.pickupTime).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Special Requirements */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {cargo.fragility !== 'LOW' && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {cargo.fragility} Fragility
                      </span>
                    )}
                    {cargo.temperature && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center space-x-1">
                        <Thermometer className="w-3 h-3" />
                        <span>{cargo.temperature.min}°{cargo.temperature.unit} - {cargo.temperature.max}°{cargo.temperature.unit}</span>
                      </span>
                    )}
                    {cargo.hazardous && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Hazardous</span>
                      </span>
                    )}
                  </div>

                  {/* Inspection Status */}
                  {cargo.inspectionStatus && (
                    <div className="mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInspectionStatusColor(cargo.inspectionStatus)}`}>
                        Inspection: {cargo.inspectionStatus.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <div className="text-right">
                    <span className="text-lg font-semibold text-green-600">${cargo.value.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(cargo)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {cargo.status === 'PENDING' && (
                      <button
                        onClick={() => handleInspectCargo(cargo)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Inspect Cargo"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={handleContactShipper}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                      title="Contact Shipper"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {sortedCargos.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cargo found</h3>
          <p className="text-gray-600">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
};
