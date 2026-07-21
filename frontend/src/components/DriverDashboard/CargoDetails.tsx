import React, { useState, useEffect } from 'react';
import {
  Package,
  MapPin,
  User,
  Phone,
  AlertTriangle,
  Shield,
  Thermometer,
  FileText,
  Truck,
  Route,
  Info,
  CheckCircle,
  Download,
  Eye,
  MessageSquare,
  Snowflake,
  Flame,
  ArrowLeft,
  X,
  Activity
} from 'lucide-react';
import { driverApi } from '../../services/driverApi';
import { documentApi, type Document as CargoDocument } from '../../services/documents/documentApi';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  canProceedWithLoad,
  getPreTripStatusFromLoad,
  PRE_TRIP_INSPECTION_BLOCKED_MESSAGE,
} from './preTripInspection';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

interface CargoDetailsProps {
  cargoId: string;
  onBack: () => void;
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
  environmentalStats?: {
    currentTemp: number;
    currentHumidity: number;
    lastUpdated: string;
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
  onBack,
  onInspect,
  onAccept,
  onReject,
  onContactShipper
}) => {
  const { format: formatCurrency } = useCurrencyFormat();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'route' | 'handling' | 'compliance' | 'documents'>('overview');
  const [cargo, setCargo] = useState<CargoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<CargoDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Helper function to format any value including location objects
  const formatValue = (loc: any, fallback: string = 'Not Available'): string => {
    if (!loc) return fallback;
    if (typeof loc === 'string') return loc;

    // Handle coordinates object
    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
      return `Lat: ${loc.latitude.toFixed(4)}, Lng: ${loc.longitude.toFixed(4)}`;
    }

    // Try to get address string from common fields
    const addr = loc.address || loc.locationData?.address || loc.street;
    if (typeof addr === 'string') return addr;

    // If address is itself an object, format its components
    const target = (typeof addr === 'object' && addr !== null) ? addr : loc;

    const parts = [
      target.street || target.address,
      target.city,
      target.state,
      target.postalCode,
      target.country
    ].filter(p => typeof p === 'string' && p.length > 0);

    if (parts.length > 0) return parts.join(', ');

    // Fallback to name
    const name = target.name || target.locationData?.name;
    if (typeof name === 'string') return name;

    if (Array.isArray(loc) && loc.length === 0) return fallback;
    if (typeof loc === 'object' && Object.keys(loc).length === 0) return fallback;

    return fallback;
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
            address: formatValue(pickupLoc)
          },
          route: {
            pickup: {
              address: formatValue(pickupLoc),
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
              address: formatValue(deliveryLoc),
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
            estimatedDistance: 0,
            estimatedDuration: 0,
            tolls: 0,
            fuelStops: 0
          },
          restrictions: {
            timeSensitive: load.isTimeCritical || load.urgencyLevel === 'URGENT' || false,
            requiresEscort: false,
            restrictedAreas: [],
            customsRequired: false,
            permits: []
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
            securingRequirements: ['Standard securing required'],
            specialTools: [],
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
          environmentalStats: load.requiresRefrigeration ? {
            currentTemp: load.temperatureMin ? load.temperatureMin + 2 : 18,
            currentHumidity: 45,
            lastUpdated: new Date().toISOString()
          } : undefined,
          inspectionStatus: getPreTripStatusFromLoad(load),
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

    const fetchDocuments = async () => {
      try {
        setLoadingDocuments(true);
        const docs = await documentApi.getDocumentsByEntity('CARGO', cargoId);
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, [cargoId]);

  const handleDownload = async (doc: CargoDocument) => {
    try {
      const blob = await documentApi.downloadDocument(doc.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#345E85] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!cargo) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-black text-slate-700">Cargo Not Found</h3>
        <p className="text-slate-400">The requested cargo details could not be retrieved.</p>
      </div>
    );
  }

  const getFragilityColor = (fragility: string) => {
    switch (fragility) {
      case 'HIGH': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'MEDIUM': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'LOW': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getTemperatureIcon = () => {
    if (cargo.temperature.min < 0) return <Snowflake className="w-4 h-4 text-cyan-600" />;
    if (cargo.temperature.max > 30) return <Flame className="w-4 h-4 text-rose-600" />;
    return <Thermometer className="w-4 h-4 text-orange-600" />;
  };

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 pb-0">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
                <span className="px-3 py-1 bg-blue-50 text-[#345E85] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
                  Consignment Details
                </span>
              </div>
              <div>
                <h2 className="text-3xl font-black text-[#0f172a] mb-2">{cargo.name}</h2>
                <div className="flex items-center gap-2 text-slate-400 font-medium font-mono text-sm">
                  <Package className="w-4 h-4" />
                  ID: {cargo.id}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-5 py-2.5 text-rose-600 border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all text-xs font-black uppercase tracking-wider"
              >
                Reject Cargo
              </button>
              <button
                onClick={onInspect}
                className="px-5 py-2.5 bg-white border border-slate-200 text-[#345E85] rounded-xl hover:border-[#345E85] hover:bg-blue-50 transition-all text-xs font-black uppercase tracking-wider flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Inspect
              </button>
              <button
                onClick={onAccept}
                disabled={!canProceedWithLoad(cargo.inspectionStatus || 'PENDING')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-blue-900/10 ${
                  canProceedWithLoad(cargo.inspectionStatus || 'PENDING')
                  ? 'bg-[#345E85] text-white hover:bg-[#2a4b6d] active:scale-95'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                title={
                  !canProceedWithLoad(cargo.inspectionStatus || 'PENDING')
                    ? PRE_TRIP_INSPECTION_BLOCKED_MESSAGE
                    : ''
                }
              >
                <CheckCircle className="w-4 h-4" />
                Accept & Load
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-8 border-b border-slate-100 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all relative ${isActive ? 'text-[#345E85]' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#345E85]' : 'text-slate-400'}`} />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-[#345E85]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info Card */}
              <div className="lg:col-span-2 bg-white rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/50 p-6 md:p-8 space-y-8">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400" />
                    Cargo Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quantity</span>
                      <p className="text-base font-bold text-slate-700">{cargo.quantity > 0 ? `${cargo.quantity} ${cargo.unit}` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Weight</span>
                      <p className="text-base font-bold text-slate-700">{cargo.weight > 0 ? `${cargo.weight} kg` : 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dimensions</span>
                      <p className="text-base font-bold text-slate-700">
                        {cargo.dimensions.length > 0 ? `${cargo.dimensions.length}×${cargo.dimensions.width}×${cargo.dimensions.height} cm` : 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</span>
                      <p className="text-base font-bold text-slate-700">{formatDisplay(cargo.category)}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    Shipper Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                          {cargo.shipper.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cargo.shipper.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{formatDisplay(cargo.shipper.contact)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={onContactShipper} className="flex-1 px-3 py-2 bg-blue-50 text-[#345E85] rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-blue-100 transition-colors">
                          Message
                        </button>
                        <button className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 pl-4 border-l border-slate-50">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{formatDisplay(cargo.shipper.address)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <p className="text-sm text-slate-600 font-medium">{formatDisplay(cargo.shipper.email)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Cards */}
              <div className="space-y-6">
                {/* Valuables Card */}
                <div className="bg-slate-900 text-white rounded-[1.5rem] p-6 shadow-xl shadow-slate-900/10">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Financials</h4>
                  <div className="space-y-6">
                    <div>
                      <span className="text-slate-400 text-xs font-semibold mb-1 block">Declared Value</span>
                      <div className="text-3xl font-black text-emerald-400">{formatCurrency(cargo.value)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-semibold mb-1 block">Insurance Coverage</span>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-lg">{formatCurrency(cargo.insurance.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requirements Card */}
                <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Requirements</h4>
                  <div className="space-y-3">
                    <div className={`flex items-center justify-between p-3 rounded-xl border ${cargo.hazardous ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-xs font-bold text-slate-700">Hazardous</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${cargo.hazardous ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                        {cargo.hazardous ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Fragility</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border ${getFragilityColor(cargo.fragility)}`}>
                        {cargo.fragility}
                      </span>
                    </div>
                    {cargo.temperature.min !== null && (
                      <div className="flex items-center justify-between p-3 rounded-xl border bg-cyan-50 border-cyan-100">
                        <span className="text-xs font-bold text-slate-700">Temp Control</span>
                        <div className="flex items-center gap-1 text-cyan-700 font-bold text-xs">
                          {getTemperatureIcon()}
                          {cargo.temperature.min}° - {cargo.temperature.max}°{cargo.temperature.unit}
                        </div>
                      </div>
                    )}
                    {cargo.environmentalStats && (
                      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                         <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/10">
                               <Activity className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">Sensor Intel</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Live Temp</p>
                               <p className="text-lg font-black text-emerald-900">{cargo.environmentalStats.currentTemp}°{cargo.temperature.unit}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">Humidity</p>
                               <p className="text-lg font-black text-emerald-900">{cargo.environmentalStats.currentHumidity}%</p>
                            </div>
                         </div>
                         <p className="text-[9px] font-bold text-emerald-600/40 uppercase mt-3 text-right">Updated {new Date(cargo.environmentalStats.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Route Tab */}
          {activeTab === 'route' && (
            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-lg shadow-slate-200/50 p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-slate-100 -translate-x-1/2"></div>

                {/* Pickup */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-[#345E85]">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#345E85]" />
                    </div>
                    Pickup Location
                  </h4>
                  <div className="pl-4 border-l-2 border-blue-100 space-y-4">
                    <p className="text-lg font-bold text-slate-800">{formatDisplay(cargo.route.pickup.address)}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Time Window</span>
                        <p className="font-mono text-xs font-bold text-slate-700">{formatDisplay(cargo.route.pickup.timeWindow)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Contact</span>
                        <p className="text-xs font-bold text-slate-700">{formatDisplay(cargo.route.pickup.contact)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Instructions</span>
                      <p className="text-sm font-medium text-slate-600 italic bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                        "{formatDisplay(cargo.route.pickup.instructions, 'None')}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="space-y-6">
                  <h4 className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-emerald-600">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    </div>
                    Delivery Location
                  </h4>
                  <div className="pl-4 border-l-2 border-emerald-100 space-y-4">
                    <p className="text-lg font-bold text-slate-800">{formatDisplay(cargo.route.delivery.address)}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Time Window</span>
                        <p className="font-mono text-xs font-bold text-slate-700">{formatDisplay(cargo.route.delivery.timeWindow)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Contact</span>
                        <p className="text-xs font-bold text-slate-700">{formatDisplay(cargo.route.delivery.contact)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">Instructions</span>
                      <p className="text-sm font-medium text-slate-600 italic bg-emerald-50/50 p-3 rounded-xl border border-emerald-50">
                        "{formatDisplay(cargo.route.delivery.instructions, 'None')}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Handling Tab */}
          {activeTab === 'handling' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-400" />
                  Equipment Required
                </h3>
                <div className="space-y-3">
                  {cargo.handling.loadingEquipment.length > 0 ? (
                    cargo.handling.loadingEquipment.map((eq, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-[#345E85]" />
                        <span className="font-bold text-slate-700 text-sm">{eq}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-sm">No special equipment specified.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[1.5rem] p-6 border border-slate-100 shadow-lg shadow-slate-200/50">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-400" />
                  Safety Gear
                </h3>
                <div className="space-y-3">
                  {cargo.handling.safetyGear.length > 0 ? (
                    cargo.handling.safetyGear.map((gear, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-slate-700 text-sm">{gear}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-sm">Standard safety gear only.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 shadow-lg shadow-slate-200/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-slate-400" />
                Compliance Checklist
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#345E85] mb-4">Required Certifications</h4>
                  <ul className="space-y-3">
                    {cargo.compliance.certifications.length > 0 ? cargo.compliance.certifications.map((c, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                        <span className="text-sm font-medium text-slate-700">{c}</span>
                      </li>
                    )) : <li className="text-slate-400 text-sm italic">None required</li>}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#345E85] mb-4">Permits & Regulations</h4>
                  <ul className="space-y-3">
                    {cargo.compliance.permits.concat(cargo.compliance.regulations).length > 0 ?
                      cargo.compliance.permits.concat(cargo.compliance.regulations).map((c, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                          <span className="text-sm font-medium text-slate-700">{c}</span>
                        </li>
                      )) : <li className="text-slate-400 text-sm italic">Standard regulations adhere</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 shadow-lg shadow-slate-200/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Attached Documents
              </h3>

              {loadingDocuments ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#345E85] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="group p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-slate-50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-[#345E85]" />
                        </div>
                        <button onClick={() => handleDownload(doc)} className="p-2 text-slate-400 hover:text-[#345E85] transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="font-bold text-slate-900 text-sm truncate">{doc.fileName}</p>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{doc.documentType}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">No documents available</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tight">Reject Cargo</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500 text-sm font-medium mb-4">
              Please provide a reason for rejecting this cargo. This will be sent to dispatch.
            </p>

            <textarea
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none transition-all"
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
