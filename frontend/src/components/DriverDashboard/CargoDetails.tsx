import React, { useState, useEffect } from 'react';
import { 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  AlertTriangle, 
  Shield, 
  Thermometer, 
  Weight, 
  Ruler, 
  FileText, 
  Truck, 
  Route, 
  Info, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  Camera,
  MessageSquare,
  Navigation,
  Calendar,
  DollarSign,
  Star,
  Flag,
  Zap,
  Snowflake,
  Flame,
  Droplets,
  Sun
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import toast from 'react-hot-toast';

interface CargoDetailsProps {
  cargoId: string;
  onInspect: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  onContactShipper: () => void;
}

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
  inspectionStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  temperature: {
    min: number;
    max: number;
    unit: 'C' | 'F';
    monitoring: boolean;
  };
  hazardous: boolean;
  hazmatClass?: string;
  hazmatCode?: string;
  images: string[];
  documents: string[];
  value: number;
  insurance: {
    required: boolean;
    amount: number;
    provider: string;
  };
  shipper: {
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
  };
  route: {
    pickup: {
      address: string;
      coordinates: [number, number];
      timeWindow: string;
      contact: string;
      phone: string;
      instructions: string;
    };
    delivery: {
      address: string;
      coordinates: [number, number];
      timeWindow: string;
      contact: string;
      phone: string;
      instructions: string;
    };
    estimatedDistance: number;
    estimatedDuration: number;
    tolls: number;
    fuelStops: number;
  };
  restrictions: {
    timeSensitive: boolean;
    requiresEscort: boolean;
    restrictedAreas: string[];
    customsRequired: boolean;
    permits: string[];
  };
  handling: {
    loadingEquipment: string[];
    stackingInstructions: string;
    securingRequirements: string[];
    specialTools: string[];
    safetyGear: string[];
  };
  compliance: {
    certifications: string[];
    permits: string[];
    inspections: string[];
    regulations: string[];
  };
}

export const CargoDetails: React.FC<CargoDetailsProps> = ({
  cargoId,
  onInspect,
  onAccept,
  onReject,
  onContactShipper
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'handling' | 'compliance' | 'documents'>('overview');
  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to format "Not Available" or "None"
  const formatValue = (value: any, fallback: string = 'Not Available'): string => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      return fallback;
    }
    return value;
  };

  // Fetch real cargo data from API
  useEffect(() => {
    const fetchCargoData = async () => {
      try {
        setLoading(true);
        const load = await driverApi.getLoadById(cargoId);
        
        // Map Load entity to CargoItem interface
        const pickupLoc = load.locations?.find((l: any) => l.type === 'PICKUP') || load.origin;
        const deliveryLoc = load.locations?.find((l: any) => l.type === 'DELIVERY') || load.destination;
        
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
          fragility: load.isFragile ? 'HIGH' : 'MEDIUM',
          temperature: {
            min: load.temperatureMin || null,
            max: load.temperatureMax || null,
            unit: 'C',
            monitoring: load.requiresRefrigeration || false
          },
          hazardous: load.isHazardous || false,
          hazmatClass: load.hazmatClass || undefined,
          hazmatCode: load.hazmatNumber || undefined,
          images: [],
          documents: load.requiredDocuments || [],
          value: load.loadValue || 0,
          insurance: {
            required: true,
            amount: load.loadValue || 0,
            provider: 'Not Available'
          },
          shipper: {
            name: load.cargoOwner?.companyName || 
                  (load.cargoOwner?.profile ? `${load.cargoOwner.profile.firstName || ''} ${load.cargoOwner.profile.lastName || ''}`.trim() : 'Not Available') ||
                  load.cargoOwner?.email?.split('@')[0] || 'Not Available',
            contact: load.cargoOwner?.profile ? 
                    `${load.cargoOwner.profile.firstName || ''} ${load.cargoOwner.profile.lastName || ''}`.trim() || 'Not Available' :
                    load.cargoOwner?.email?.split('@')[0] || 'Not Available',
            phone: load.contactInfo?.contactPhone || 
                   load.cargoOwner?.phone || 
                   'Not Available',
            email: load.contactInfo?.contactEmail || 
                   load.cargoOwner?.email || 
                   'Not Available',
            address: pickupLoc?.locationData?.address || 
                    pickupLoc?.address || 
                    load.origin?.address || 
                    'Not Available'
          },
          route: {
            pickup: {
              address: pickupLoc?.locationData?.address || 
                      pickupLoc?.address || 
                      load.origin?.address || 
                      'Not Available',
              coordinates: pickupLoc?.locationData?.coordinates ? 
                          [pickupLoc.locationData.coordinates.latitude, pickupLoc.locationData.coordinates.longitude] :
                          (load.origin?.coordinates ? [load.origin.coordinates.latitude, load.origin.coordinates.longitude] : [0, 0]),
              timeWindow: load.pickupWindow ? 
                         `${load.pickupWindow.startTime || ''} - ${load.pickupWindow.endTime || ''}` :
                         (load.pickupDate ? new Date(load.pickupDate).toLocaleString() : 'Not Available'),
              contact: pickupLoc?.locationData?.contactInfo?.contactPerson || 
                      load.contactInfo?.pickupContact || 
                      'Not Available',
              phone: pickupLoc?.locationData?.contactInfo?.contactPhone || 
                    load.contactInfo?.pickupPhone || 
                    'Not Available',
              instructions: pickupLoc?.locationData?.specialInstructions || 
                          pickupLoc?.locationData?.accessInstructions || 
                          'None'
            },
            delivery: {
              address: deliveryLoc?.locationData?.address || 
                      deliveryLoc?.address || 
                      load.destination?.address || 
                      'Not Available',
              coordinates: deliveryLoc?.locationData?.coordinates ? 
                          [deliveryLoc.locationData.coordinates.latitude, deliveryLoc.locationData.coordinates.longitude] :
                          (load.destination?.coordinates ? [load.destination.coordinates.latitude, load.destination.coordinates.longitude] : [0, 0]),
              timeWindow: load.deliveryWindow ? 
                         `${load.deliveryWindow.startTime || ''} - ${load.deliveryWindow.endTime || ''}` :
                         (load.deliveryDate ? new Date(load.deliveryDate).toLocaleString() : 'Not Available'),
              contact: deliveryLoc?.locationData?.contactInfo?.contactPerson || 
                      load.contactInfo?.deliveryContact || 
                      'Not Available',
              phone: deliveryLoc?.locationData?.contactInfo?.contactPhone || 
                    load.contactInfo?.deliveryPhone || 
                    'Not Available',
              instructions: deliveryLoc?.locationData?.specialInstructions || 
                          deliveryLoc?.locationData?.accessInstructions || 
                          'None'
            },
            estimatedDistance: 0, // Not available in Load entity
            estimatedDuration: 0, // Not available in Load entity
            tolls: 0, // Not available in Load entity
            fuelStops: 0 // Not available in Load entity
          },
          restrictions: {
            timeSensitive: load.isTimeCritical || load.urgencyLevel === 'URGENT' || false,
            requiresEscort: false, // Not available in Load entity
            restrictedAreas: [], // Not available in Load entity
            customsRequired: false, // Not available in Load entity
            permits: [] // Not available in Load entity
          },
          handling: {
            loadingEquipment: [
              ...(load.requiresForklift ? ['Forklift'] : []),
              ...(load.requiresCrane ? ['Crane'] : []),
              ...(load.requiresLoadingDock ? ['Loading dock'] : [])
            ],
            stackingInstructions: load.isStackable ? 
                                 `Stackable up to ${load.stackableHeight || 'N/A'} height` : 
                                 'Not stackable',
            securingRequirements: ['Standard securing required'], // Default
            specialTools: [], // Not available in Load entity
            safetyGear: load.isHazardous ? ['Hazmat suit', 'Safety glasses', 'Gloves'] : ['Standard safety gear']
          },
          compliance: {
            certifications: [
              ...(load.isHazardous ? ['Hazmat certified driver'] : []),
              ...(load.requiresRefrigeration ? ['Temperature control certified'] : [])
            ],
            permits: load.hazmatClass ? [`Hazmat permit - Class ${load.hazmatClass}`] : [],
            inspections: ['Pre-trip inspection required'],
            regulations: [
              ...(load.isHazardous ? ['DOT hazmat regulations'] : []),
              ...(load.requiresRefrigeration ? ['Temperature control standards'] : [])
            ]
          },
          inspectionStatus: load.metadata?.inspectionStatus || 'PENDING',
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
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Cargo not found</p>
      </div>
    );
  }

  const getFragilityColor = (fragility: string) => {
    switch (fragility) {
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-orange-600 bg-orange-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTemperatureIcon = () => {
    if (cargo.temperature.min < 0) return <Snowflake className="w-4 h-4 text-blue-600" />;
    if (cargo.temperature.max > 30) return <Flame className="w-4 h-4 text-red-600" />;
    return <Thermometer className="w-4 h-4 text-orange-600" />;
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  // Format values with fallbacks
  const formatDisplay = (value: any, fallback: string = 'Not Available'): string => {
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && Object.keys(value).length === 0)) {
      return fallback;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : fallback;
    }
    return String(value);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'route', label: 'Route & Schedule', icon: Route },
    { id: 'handling', label: 'Handling & Safety', icon: Shield },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Cargo Details</h2>
            <p className="text-blue-100">#{cargo.id} - {cargo.name}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6" />
            <span className="text-sm font-medium">Pre-Load Review</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Cargo Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Cargo Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
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
                      <span className="font-medium">{formatDisplay(cargo.category)}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Value:</span>
                      <span className="font-medium text-green-600">
                        {cargo.value > 0 ? `$${cargo.value.toLocaleString()}` : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance:</span>
                      <span className="font-medium">
                        {cargo.insurance.amount > 0 ? `$${cargo.insurance.amount.toLocaleString()}` : 'Not Available'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fragility:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFragilityColor(cargo.fragility)}`}>
                        {cargo.fragility}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hazardous:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cargo.hazardous ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {cargo.hazardous ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Special Requirements</h3>
                <div className="space-y-3">
                  {cargo.temperature.min !== null && cargo.temperature.max !== null ? (
                    <div className="flex items-center space-x-2">
                      {getTemperatureIcon()}
                      <span className="text-sm">
                        {cargo.temperature.min}°{cargo.temperature.unit} - {cargo.temperature.max}°{cargo.temperature.unit}
                        {cargo.temperature.monitoring && <span className="text-blue-600 ml-1">(Monitored)</span>}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Thermometer className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">No temperature requirements</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {cargo.specialRequirements.length > 0 ? (
                      cargo.specialRequirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No special requirements</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Shipper Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipper Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{formatDisplay(cargo.shipper.contact)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <span>{formatDisplay(cargo.shipper.phone)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span>{formatDisplay(cargo.shipper.email)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                    <span className="text-sm">{formatDisplay(cargo.shipper.address)}</span>
                  </div>
                  <button
                    onClick={onContactShipper}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contact Shipper</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Reject Cargo
                </button>
                <button
                  onClick={onInspect}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Inspect Cargo
                </button>
                <button
                  onClick={onAccept}
                  disabled={cargo.inspectionStatus !== 'COMPLETED'}
                  className={`px-4 py-2 rounded-lg ${
                    cargo.inspectionStatus === 'COMPLETED'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                  title={cargo.inspectionStatus !== 'COMPLETED' ? 'Please complete inspection first' : ''}
                >
                  Accept & Load
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'route' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Route & Schedule Information</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pickup Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <span>Pickup Location</span>
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Address:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatDisplay(cargo.route.pickup.address)}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Time Window:</span>
                    <span className="text-sm font-medium text-green-600">{formatDisplay(cargo.route.pickup.timeWindow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Contact:</span>
                    <span className="text-sm font-medium">{formatDisplay(cargo.route.pickup.contact)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Phone:</span>
                    <span className="text-sm font-medium">{formatDisplay(cargo.route.pickup.phone)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Instructions:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatDisplay(cargo.route.pickup.instructions, 'None')}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span>Delivery Location</span>
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Address:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatDisplay(cargo.route.delivery.address)}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Time Window:</span>
                    <span className="text-sm font-medium text-red-600">{formatDisplay(cargo.route.delivery.timeWindow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Contact:</span>
                    <span className="text-sm font-medium">{formatDisplay(cargo.route.delivery.contact)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700">Phone:</span>
                    <span className="text-sm font-medium">{formatDisplay(cargo.route.delivery.phone)}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Instructions:</span>
                    <p className="text-sm text-gray-600 mt-1">{formatDisplay(cargo.route.delivery.instructions, 'None')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Route Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Route className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Distance</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {cargo.route.estimatedDistance > 0 ? `${cargo.route.estimatedDistance} km` : 'Not Available'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Duration</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {cargo.route.estimatedDuration > 0 ? `${cargo.route.estimatedDuration} hrs` : 'Not Available'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Tolls</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {cargo.route.tolls > 0 ? `$${cargo.route.tolls}` : 'Not Available'}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-1">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-700">Fuel Stops</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {cargo.route.fuelStops > 0 ? cargo.route.fuelStops : 'Not Available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Restrictions */}
            {cargo.restrictions.timeSensitive || cargo.restrictions.requiresEscort && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Route Restrictions & Requirements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cargo.restrictions.timeSensitive && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Time Sensitive Delivery</span>
                    </div>
                  )}
                  {cargo.restrictions.requiresEscort && (
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Security Escort Required</span>
                    </div>
                  )}
                  {cargo.restrictions.restrictedAreas.length > 0 && (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Restricted Areas Apply</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'handling' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Handling & Safety Requirements</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loading Equipment */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Required Equipment</h4>
                <div className="space-y-3">
                  {cargo.handling.loadingEquipment.length > 0 ? (
                    cargo.handling.loadingEquipment.map((equipment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <Truck className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">{equipment}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No special equipment required</p>
                  )}
                </div>
              </div>

              {/* Safety Gear */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Required Safety Gear</h4>
                <div className="space-y-3">
                  {cargo.handling.safetyGear.length > 0 ? (
                    cargo.handling.safetyGear.map((gear, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                        <Shield className="w-5 h-5 text-green-600" />
                        <span className="text-sm">{gear}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Standard safety gear required</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stacking & Securing */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Loading Instructions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Stacking Instructions</h5>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-700">{cargo.handling.stackingInstructions}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-700">Securing Requirements</h5>
                  <div className="space-y-2">
                    {cargo.handling.securingRequirements.length > 0 ? (
                      cargo.handling.securingRequirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                          <CheckCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">{req}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Standard securing requirements</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Special Tools */}
            {cargo.handling.specialTools.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Special Tools Required</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {cargo.handling.specialTools.map((tool, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">{tool}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Compliance & Certifications</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Required Certifications */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Required Certifications</h4>
                <div className="space-y-3">
                  {cargo.compliance.certifications.length > 0 ? (
                    cargo.compliance.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No special certifications required</p>
                  )}
                </div>
              </div>

              {/* Required Permits */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Required Permits</h4>
                <div className="space-y-3">
                  {cargo.compliance.permits.length > 0 ? (
                    cargo.compliance.permits.map((permit, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">{permit}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No special permits required</p>
                  )}
                </div>
              </div>
            </div>

            {/* Inspections & Regulations */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Required Inspections</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cargo.compliance.inspections.length > 0 ? (
                  cargo.compliance.inspections.map((inspection, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Eye className="w-5 h-5 text-yellow-600" />
                      <span className="text-sm">{inspection}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Standard inspections required</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Applicable Regulations</h4>
              <div className="space-y-3">
                {cargo.compliance.regulations.length > 0 ? (
                  cargo.compliance.regulations.map((regulation, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <Info className="w-5 h-5 text-gray-600" />
                      <span className="text-sm">{regulation}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Standard regulations apply</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cargo.documents.length > 0 ? (
                cargo.documents.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{doc}</h4>
                          <p className="text-sm text-gray-600">Required document</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No documents specified</p>
              )}
            </div>

            {/* Insurance Information */}
            {cargo.insurance.required && cargo.insurance.amount > 0 && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Insurance Information</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Provider:</span>
                      <p className="font-medium">{formatDisplay(cargo.insurance.provider)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Coverage Amount:</span>
                      <p className="font-medium text-green-600">${cargo.insurance.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Cargo</h3>
            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this cargo:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border rounded-lg mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
