import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X,
  Package, 
  MapPin, 
  Calendar, 
  DollarSign,
  Truck,
  AlertTriangle,
  Thermometer,
  Shield,
  Weight,
  Volume,
  Star,
  TrendingUp,
  Users,
  FileText,
  Edit,
  Trash2,
  Eye,
  Mail,
  Globe,
  Navigation,
  Clock3,
  AlertCircle,
  Info,
  Zap,
  Camera,
  Route,
  Target,
  Search,
  Filter,
  Heart,
  MessageSquare,
  Award,
  CheckCircle,
  Upload,
  Download
} from 'lucide-react';
import type { Cargo } from '../types/cargo';
import { loadsAPI } from '@/services/load';
import { matchingAPI } from '@/services/api';
import { documentApi } from '@/services/documents/documentApi';
import type { Document } from '@/services/documents/documentApi';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import DocumentPreviewModal from '@/components/documents/DocumentPreviewModal';
import { useAuth } from '@/contexts/AuthContext';

interface CargoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargoId: string | null;
}

const CargoDetailsModal = ({ isOpen, onClose, cargoId }: CargoDetailsModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'documents' | 'history' | 'matching'>('overview');
  const [matches, setMatches] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const { confirm, DialogComponent } = useConfirmDialog();
  const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string; fileName: string } | null>(null);

  const { data: cargoResponse, isLoading, error } = useQuery({
    queryKey: ['cargo', cargoId],
    queryFn: async () => {
      try {
        // Try to get enriched location data first
        const enrichedResponse = await loadsAPI.getCargoWithEnrichedLocations(cargoId!);
        console.log('📦 Enriched cargo data:', enrichedResponse);
        return enrichedResponse;
      } catch (error) {
        console.log('⚠️ Enriched data not available, falling back to regular cargo data');
        // Fallback to regular cargo data
        return loadsAPI.getById(cargoId!);
      }
    },
    enabled: !!cargoId && isOpen,
  });

  // Extract cargo from response - handle both enriched and regular response structures
  type CargoWithEnriched = Cargo & { enrichedLocations?: any[] };
  const cargo: CargoWithEnriched | null = (() => {
    if (!cargoResponse?.data) return null;
    
    const responseData = cargoResponse.data;
    
    if (responseData.cargo) {
      return { ...responseData.cargo, enrichedLocations: responseData.enrichedLocations };
    }
    if (responseData.load) {
      return { ...responseData.load, enrichedLocations: responseData.enrichedLocations };
    }
    if (responseData.id) {
      // Direct cargo object
      return { ...responseData, enrichedLocations: responseData.enrichedLocations };
    }
    return null;
  })();

  // Fetch matches when matching tab is active and cargo is loaded
  useEffect(() => {
    const fetchMatches = async () => {
      if (activeTab === 'matching' && cargo?.id && !matchesLoading) {
        setMatchesLoading(true);
        setMatchesError(null);
        try {
          console.log('🔍 Fetching matches for cargo:', cargo.id);
          const response = await matchingAPI.findMatches({
            loadId: cargo.id,
            algorithm: 'WEIGHTED_SCORE',
            maxDistance: 1000, // 1000km max distance
            minRating: 0.0, // No minimum rating requirement
            limit: 20, // Top 20 matches
            includeDrivers: true,
          });
          
          console.log('✅ Matches received:', response.data);
          // Handle both response formats: { data: [...] } or { matches: [...] }
          const matchesData = response.data?.data || response.data?.matches || response.data || [];
          setMatches(matchesData);
        } catch (error: any) {
          console.error('❌ Error fetching matches:', error);
          console.error('❌ Error response:', error.response);
          console.error('❌ Error response data:', error.response?.data);
          console.error('❌ Error response status:', error.response?.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Full error:', JSON.stringify(error, null, 2));
          
          // Check if it's a "not found" or "no matches" scenario vs actual error
          const status = error.response?.status;
          const errorData = error.response?.data;
          
          // If it's a 404 (load not found) or empty matches array, treat as no matches
          if (status === 404 || (status === 200 && Array.isArray(errorData?.data) && errorData.data.length === 0)) {
            console.log('ℹ️ No matches found (not an error)');
            setMatches([]);
            setMatchesError(null); // Clear error, show "no matches" message instead
          } else {
            // Actual error occurred
            const errorMessage = errorData?.message || 
                                errorData?.error || 
                                error.message || 
                                'Failed to fetch truck matches. Please try again.';
            setMatchesError(errorMessage);
            setMatches([]);
          }
        } finally {
          setMatchesLoading(false);
        }
      }
    };

    fetchMatches();
  }, [activeTab, cargo?.id]);

  // Fetch documents for the cargo
  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['cargoDocuments', cargoId],
    queryFn: () => documentApi.getDocumentsByEntity('CARGO', cargoId!),
    enabled: !!cargoId && isOpen && activeTab === 'documents',
  });

  const documents = (documentsData as unknown as Document[]) || [];

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    const statusStr = String(status).toUpperCase();
    
    switch (statusStr) {
      case 'PUBLISHED':
        return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    if (!status) return 'Unknown';
    
    const statusStr = String(status).toUpperCase();
    
    switch (statusStr) {
      case 'PUBLISHED':
        return 'Published';
      case 'ASSIGNED':
        return 'Assigned';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'DRAFT':
        return 'Draft';
      default:
        return String(status) || 'Unknown';
    }
  };

  const getCargoTypeIcon = (cargoType: string) => {
    if (!cargoType) return <Package className="w-5 h-5 text-gray-500" />;
    
    const cargoTypeStr = String(cargoType).toUpperCase();
    
    switch (cargoTypeStr) {
      case 'FRAGILE':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'HAZARDOUS':
        return <Shield className="w-5 h-5 text-red-500" />;
      case 'REFRIGERATED':
        return <Thermometer className="w-5 h-5 text-blue-500" />;
      case 'LIQUID':
        return <Package className="w-5 h-5 text-purple-500" />;
      case 'OVERSIZED':
        return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'VALUABLE':
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCargoTypeDisplayName = (cargoType: string) => {
    if (!cargoType) return 'General Cargo';
    
    const cargoTypeStr = String(cargoType).toUpperCase();
    
    switch (cargoTypeStr) {
      case 'GENERAL':
        return 'General Cargo';
      case 'FRAGILE':
        return 'Fragile Items';
      case 'HAZARDOUS':
        return 'Hazardous Materials';
      case 'REFRIGERATED':
        return 'Refrigerated Goods';
      case 'LIQUID':
        return 'Liquid Cargo';
      case 'OVERSIZED':
        return 'Oversized Load';
      case 'VALUABLE':
        return 'Valuable Items';
      default:
        return 'General Cargo';
    }
  };

  const formatCurrency = (amount: number | string, currency: string = 'USD') => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  };

  const formatWeight = (weight: number | string) => {
    const numWeight = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (isNaN(numWeight)) return '0 kg';
    
    if (numWeight >= 1000) {
      return `${(numWeight / 1000).toFixed(1)} tons`;
    }
    return `${numWeight} kg`;
  };

  const formatVolume = (volume: number | string) => {
    const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
    if (isNaN(numVolume)) return '0 L';
    
    if (numVolume >= 1000) {
      return `${(numVolume / 1000).toFixed(1)} m³`;
    }
    return `${numVolume} L`;
  };

  const getSpecialRequirements = (cargo: Cargo) => {
    const requirements = [];
    
    if (cargo.isFragile) requirements.push('Fragile');
    if (cargo.isHazardous) requirements.push('Hazardous');
    if (cargo.requiresRefrigeration) requirements.push('Refrigerated');
    if (cargo.requiresForklift) requirements.push('Forklift');
    if (cargo.requiresCrane) requirements.push('Crane');
    if (cargo.requiresLoadingDock) requirements.push('Loading Dock');
    if (cargo.isTimeCritical) requirements.push('Time Critical');
    if (cargo.requiresGpsMonitoring) requirements.push('GPS Monitoring');
    if (cargo.requiresTemperatureMonitoring) requirements.push('Temperature Monitoring');
    if (cargo.requiresEscortVehicle) requirements.push('Escort Vehicle');
    if (cargo.requiresLowClearanceRoute) requirements.push('Low Clearance Route');
    
    return requirements;
  };

  const getEnrichedLocationDetails = (cargo: CargoWithEnriched) => {
    if (!cargo.enrichedLocations || cargo.enrichedLocations.length === 0) {
      return null;
    }

    const pickupLocation = cargo.enrichedLocations.find((loc: any) => loc.type === 'PICKUP');
    const deliveryLocation = cargo.enrichedLocations.find((loc: any) => loc.type === 'DELIVERY');

    return {
      pickup: pickupLocation?.locationData || null,
      delivery: deliveryLocation?.locationData || null
    };
  };

  const getUrgencyColor = (urgencyLevel: string) => {
    if (!urgencyLevel) return 'bg-gray-100 text-gray-800';
    
    const urgencyStr = String(urgencyLevel).toUpperCase();
    
    switch (urgencyStr) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              {cargo && getCargoTypeIcon(cargo.cargoType)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {cargo?.title || 'Cargo Details'}
              </h2>
              <p className="text-gray-600">Cargo ID: {cargoId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {cargo && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cargo.status)}`}>
                {getStatusDisplayName(cargo.status)}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading cargo details...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Cargo</h3>
                <p className="text-red-600">{error.message}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : !cargo ? (
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <Package className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cargo Not Found</h3>
                <p className="text-yellow-600">The requested cargo shipment could not be found.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2 md:gap-4 lg:gap-8 sm:overflow-x-auto sm:scrollbar-hide sm:scroll-smooth">
                  {[
                    { id: 'overview', label: 'Overview', icon: Package },
                    { id: 'tracking', label: 'Tracking', icon: Navigation },
                    { id: 'documents', label: 'Documents', icon: FileText },
                    { id: 'history', label: 'History', icon: Clock3 },
                    { id: 'matching', label: 'Matching', icon: Target, roles: ['CARGO_OWNER', 'BROKER', 'ADMIN', 'SUPER_ADMIN'] },
                  ].filter(tab => !tab.roles || (user?.role && tab.roles.includes(user.role))).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center justify-center space-x-1 sm:space-x-2 py-2.5 sm:py-3 md:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex-1 sm:flex-initial min-w-0 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate text-[11px] sm:text-sm">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Cargo Information */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Cargo Information</h3>
                        {getCargoTypeIcon(cargo.cargoType)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-2">{cargo.title}</h4>
                          <p className="text-gray-600 mb-4">{cargo.description || 'No description provided'}</p>
                          
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Type: {getCargoTypeDisplayName(cargo.cargoType)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <Weight className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Weight: {formatWeight(cargo.weight)}
                              </span>
                            </div>
                            
                            {cargo.volume && (
                              <div className="flex items-center space-x-3">
                                <Volume className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Volume: {formatVolume(cargo.volume)}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-3">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Value: {formatCurrency(cargo.loadValue, cargo.currencyCode)}
                              </span>
                            </div>
                            
                            {cargo.offeredPrice && (
                              <div className="flex items-center space-x-3">
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Offered Price: {formatCurrency(cargo.offeredPrice, cargo.currencyCode)}
                                </span>
                              </div>
                            )}

                            {cargo.urgencyLevel && (
                              <div className="flex items-center space-x-3">
                                <Zap className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Urgency: <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(cargo.urgencyLevel)}`}>
                                    {cargo.urgencyLevel}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Special Requirements</h4>
                          <div className="space-y-2">
                            {getSpecialRequirements(cargo).length > 0 ? (
                              getSpecialRequirements(cargo).map((req, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                                  <span className="text-sm text-gray-600">{req}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No special requirements</p>
                            )}
                          </div>

                          {/* Additional Cargo Details */}
                          {(cargo.length || cargo.width || cargo.height) && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Dimensions</h4>
                              <div className="space-y-1 text-sm text-gray-600">
                                {cargo.length && <div>Length: {cargo.length} cm</div>}
                                {cargo.width && <div>Width: {cargo.width} cm</div>}
                                {cargo.height && <div>Height: {cargo.height} cm</div>}
                                {cargo.isStackable && <div className="text-green-600">✓ Stackable</div>}
                              </div>
                            </div>
                          )}

                          {(cargo.temperatureMin || cargo.temperatureMax) && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Temperature Range</h4>
                              <div className="text-sm text-gray-600">
                                {cargo.temperatureMin}°C - {cargo.temperatureMax}°C
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-green-600" />
                        Locations
                      </h3>
                      
                      {(() => {
                        const enrichedDetails = getEnrichedLocationDetails(cargo);
                        return (
                          <div className="space-y-4">
                            {/* Enhanced OSM Location Data */}
                            {enrichedDetails && (
                              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Globe className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Real Location Data (OpenStreetMap)</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Pickup Location Enhanced */}
                                  {enrichedDetails.pickup && (
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <h4 className="font-medium text-gray-900">Pickup Location</h4>
                                      </div>
                                      
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Address:</strong> {enrichedDetails.pickup.fullAddress || enrichedDetails.pickup.address}</div>
                                        {enrichedDetails.pickup.administrativeAreas && (
                                          <>
                                            <div><strong>District:</strong> {enrichedDetails.pickup.administrativeAreas.district}</div>
                                            <div><strong>Province:</strong> {enrichedDetails.pickup.administrativeAreas.province}</div>
                                            <div><strong>Country:</strong> {enrichedDetails.pickup.administrativeAreas.county}</div>
                                          </>
                                        )}
                                        {enrichedDetails.pickup.locationCategory && (
                                          <div><strong>Category:</strong> {enrichedDetails.pickup.locationCategory}</div>
                                        )}
                                        {enrichedDetails.pickup.accessType && (
                                          <div><strong>Access Type:</strong> {enrichedDetails.pickup.accessType}</div>
                                        )}
                                        {enrichedDetails.pickup.securityLevel && (
                                          <div><strong>Security:</strong> {enrichedDetails.pickup.securityLevel}</div>
                                        )}
                                        {enrichedDetails.pickup.specialInstructions && (
                                          <div><strong>Instructions:</strong> {enrichedDetails.pickup.specialInstructions}</div>
                                        )}
                                      </div>
                                      
                                      {/* Nearby POIs for Pickup */}
                                      {enrichedDetails.pickup.nearbyPOIs && (
                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                          <div className="text-xs font-medium text-blue-800 mb-2">Nearby Points of Interest:</div>
                                          <div className="text-xs text-gray-600 space-y-1">
                                            {enrichedDetails.pickup.nearbyPOIs.transportHubs?.length > 0 && (
                                              <div>• {enrichedDetails.pickup.nearbyPOIs.transportHubs.length} transport hubs</div>
                                            )}
                                            {enrichedDetails.pickup.nearbyPOIs.commercialAreas?.length > 0 && (
                                              <div>• {enrichedDetails.pickup.nearbyPOIs.commercialAreas.length} commercial areas</div>
                                            )}
                                            {enrichedDetails.pickup.nearbyPOIs.serviceFacilities?.length > 0 && (
                                              <div>• {enrichedDetails.pickup.nearbyPOIs.serviceFacilities.length} service facilities</div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Delivery Location Enhanced */}
                                  {enrichedDetails.delivery && (
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <h4 className="font-medium text-gray-900">Delivery Location</h4>
                                      </div>
                                      
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Address:</strong> {enrichedDetails.delivery.fullAddress || enrichedDetails.delivery.address}</div>
                                        {enrichedDetails.delivery.administrativeAreas && (
                                          <>
                                            <div><strong>District:</strong> {enrichedDetails.delivery.administrativeAreas.district}</div>
                                            <div><strong>Province:</strong> {enrichedDetails.delivery.administrativeAreas.province}</div>
                                            <div><strong>Country:</strong> {enrichedDetails.delivery.administrativeAreas.county}</div>
                                          </>
                                        )}
                                        {enrichedDetails.delivery.locationCategory && (
                                          <div><strong>Category:</strong> {enrichedDetails.delivery.locationCategory}</div>
                                        )}
                                        {enrichedDetails.delivery.accessType && (
                                          <div><strong>Access Type:</strong> {enrichedDetails.delivery.accessType}</div>
                                        )}
                                        {enrichedDetails.delivery.securityLevel && (
                                          <div><strong>Security:</strong> {enrichedDetails.delivery.securityLevel}</div>
                                        )}
                                        {enrichedDetails.delivery.specialInstructions && (
                                          <div><strong>Instructions:</strong> {enrichedDetails.delivery.specialInstructions}</div>
                                        )}
                                      </div>
                                      
                                      {/* Nearby POIs for Delivery */}
                                      {enrichedDetails.delivery.nearbyPOIs && (
                                        <div className="mt-3 pt-3 border-t border-blue-200">
                                          <div className="text-xs font-medium text-blue-800 mb-2">Nearby Points of Interest:</div>
                                          <div className="text-xs text-gray-600 space-y-1">
                                            {enrichedDetails.delivery.nearbyPOIs.transportHubs?.length > 0 && (
                                              <div>• {enrichedDetails.delivery.nearbyPOIs.transportHubs.length} transport hubs</div>
                                            )}
                                            {enrichedDetails.delivery.nearbyPOIs.commercialAreas?.length > 0 && (
                                              <div>• {enrichedDetails.delivery.nearbyPOIs.commercialAreas.length} commercial areas</div>
                                            )}
                                            {enrichedDetails.delivery.nearbyPOIs.serviceFacilities?.length > 0 && (
                                              <div>• {enrichedDetails.delivery.nearbyPOIs.serviceFacilities.length} service facilities</div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Original Location Data (Fallback) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Pickup Location */}
                              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <h4 className="font-medium text-gray-900">Pickup Location</h4>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {cargo.pickupLocation?.address || 'Address not specified'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      Date: {new Date(cargo.pickupDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {cargo.pickupLocation?.coordinates && (
                                    <div className="text-xs text-gray-500">
                                      Coordinates: {cargo.pickupLocation.coordinates.latitude.toFixed(4)}, {cargo.pickupLocation.coordinates.longitude.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Delivery Location */}
                              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                <div className="flex items-center space-x-2 mb-3">
                                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                  <h4 className="font-medium text-gray-900">Delivery Location</h4>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {cargo.deliveryLocation?.address || 'Address not specified'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      Date: {new Date(cargo.deliveryDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {cargo.deliveryLocation?.coordinates && (
                                    <div className="text-xs text-gray-500">
                                      Coordinates: {cargo.deliveryLocation.coordinates.latitude.toFixed(4)}, {cargo.deliveryLocation.coordinates.longitude.toFixed(4)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Info className="w-4 h-4 mr-2 text-purple-600" />
                        Status Information
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Current Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cargo.status)}`}>
                              {getStatusDisplayName(cargo.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">Urgency Level</span>
                          <p className="text-sm font-medium text-gray-900">{cargo.urgencyLevel || 'Normal'}</p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">Created</span>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(cargo.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-600">Last Updated</span>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(cargo.updatedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {cargo.viewCount > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Views</span>
                            <p className="text-sm font-medium text-gray-900">{cargo.viewCount}</p>
                          </div>
                        )}

                        {cargo.rating > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Rating</span>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-900">{cargo.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cargo Owner */}
                    {cargo.cargoOwner && (
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-blue-600" />
                          Cargo Owner
                        </h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{cargo.cargoOwner.email}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{cargo.cargoOwner.email}</span>
                          </div>

                          {cargo.cargoOwner.profile && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {cargo.cargoOwner.profile.firstName} {cargo.cargoOwner.profile.lastName}
                                </span>
                              </div>
                              
                              {cargo.cargoOwner.profile.companyName && (
                                <div className="flex items-center space-x-2">
                                  <Globe className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">{cargo.cargoOwner.profile.companyName}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-green-600" />
                        Actions
                      </h3>
                      
                      <div className="space-y-3">
                        {(user?.role === 'CARGO_OWNER' || user?.role === 'BROKER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                          <button className="w-full btn btn-outline btn-sm hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Cargo
                          </button>
                        )}
                        
                        <button className="w-full btn btn-outline btn-sm hover:bg-purple-50 hover:text-purple-700 transition-colors">
                          <Eye className="w-4 h-4 mr-2" />
                          View Documents
                        </button>
                        
                        <button className="w-full btn btn-outline btn-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          <Navigation className="w-4 h-4 mr-2" />
                          Track Shipment
                        </button>

                        <button className="w-full btn btn-outline btn-sm hover:bg-orange-50 hover:text-orange-700 transition-colors">
                          <Camera className="w-4 h-4 mr-2" />
                          Photo Documentation
                        </button>

                        {(user?.role === 'CARGO_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                          <button className="w-full btn btn-outline btn-sm hover:bg-red-50 hover:text-red-700 transition-colors">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Cargo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tracking' && (
                <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-indigo-600" />
                    Tracking Information
                  </h3>
                  <div className="text-center py-8">
                    <Route className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Real-time tracking functionality will be implemented here.</p>
                    <p className="text-sm text-gray-500">This will include GPS tracking, status updates, and delivery notifications.</p>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-yellow-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-yellow-600" />
                        Documents
                      </h3>
                      {(user?.role === 'CARGO_OWNER' || user?.role === 'BROKER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                        <button 
                          onClick={() => {/* Trigger upload modal or logic */}}
                          className="btn btn-primary btn-sm flex items-center"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </button>
                      )}
                    </div>

                    {documentsLoading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading documents...</p>
                      </div>
                    ) : documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                          <div 
                            key={doc.id}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="p-2 bg-yellow-50 rounded-lg">
                                <FileText className="w-6 h-6 text-yellow-600" />
                              </div>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => setPreviewDoc({
                                    id: doc.id,
                                    title: doc.title,
                                    fileName: doc.fileName
                                  })}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                  title="View Document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={async () => {
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
                                  }}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                {(user?.role === 'CARGO_OWNER' || user?.role === 'BROKER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                  <button 
                                    onClick={async () => {
                                      const confirmed = await confirm({
                                        title: "Delete Document",
                                        message: `Are you sure you want to delete "${doc.title}"?`,
                                        variant: "danger"
                                      });
                                      if (confirmed) {
                                        try {
                                          await documentApi.deleteDocument(doc.id);
                                          toast.success('Document deleted');
                                          refetchDocuments();
                                        } catch (error) {
                                          toast.error('Failed to delete document');
                                        }
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 truncate" title={doc.title}>
                                {doc.title}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {doc.fileName}
                              </p>
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                  doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                  doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {doc.status}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(doc.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-yellow-200 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-1">No documents found</h4>
                        <p className="text-gray-500 max-w-xs mx-auto">
                          No documents have been uploaded for this cargo yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock3 className="w-5 h-5 mr-2 text-purple-600" />
                    History
                  </h3>
                  <div className="text-center py-8">
                    <Clock3 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Cargo history and audit trail will be implemented here.</p>
                    <p className="text-sm text-gray-500">This will include status changes, updates, and activity logs.</p>
                  </div>
                </div>
              )}

              {activeTab === 'matching' && (
                <div className="space-y-6">
                  {/* Matching Overview */}
                  <div className="bg-gradient-to-r from-gray-50 to-green-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-green-600" />
                      AI Matching Overview
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      <Zap className="w-4 h-4 inline mr-1" />
                      Our <strong>AI-powered matching system</strong> evaluates trucks based on multiple criteria including capacity, equipment compatibility, distance, ratings, pricing, and special requirements to find the best matches for your cargo.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Matches</p>
                            <p className="text-2xl font-bold text-green-600">
                              {matchesLoading ? '...' : matches.length}
                            </p>
                          </div>
                          <Target className="w-8 h-8 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Available Trucks</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {matchesLoading ? '...' : matches.filter(m => m.truckStatus === 'AVAILABLE').length}
                            </p>
                          </div>
                          <Award className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Best Match Score</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {matchesLoading ? '...' : matches.length > 0 ? `${Math.round(matches[0].overallScore * 100)}%` : 'N/A'}
                            </p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-purple-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setMatchesLoading(true);
                          setMatchesError(null);
                          if (cargo?.id) {
                            matchingAPI.findMatches({
                              loadId: cargo.id,
                              algorithm: 'WEIGHTED_SCORE',
                              maxDistance: 1000,
                              minRating: 0.0,
                              limit: 20,
                              includeDrivers: true,
                            }).then(response => {
                              // Handle both response formats: { data: [...] } or { matches: [...] }
                              const matchesData = response.data?.data || response.data?.matches || response.data || [];
                              setMatches(matchesData);
                              setMatchesLoading(false);
                            }).catch(error => {
                              setMatchesError(error.response?.data?.message || 'Failed to fetch matches');
                              setMatchesLoading(false);
                            });
                          }
                        }}
                        disabled={matchesLoading || !cargo?.id}
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {matchesLoading ? 'Loading...' : 'Refresh Matches'}
                      </button>
                    </div>
                    
                    {matchesError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-red-800">{matchesError}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Matching Criteria */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                      <Filter className="w-5 h-5 mr-2 text-blue-600" />
                      AI Matching Criteria
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      <Zap className="w-4 h-4 inline mr-1" />
                      The AI evaluates trucks using <strong>multiple criteria</strong> to find the best matches. Each match is scored based on how well it meets your cargo requirements.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Weight/Capacity Criteria */}
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Weight className="w-4 h-4 mr-2 text-blue-600" />
                          Capacity Matching
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Required Weight</span>
                            <span className="text-xs font-bold text-blue-900">≥ {formatWeight(cargo.weight)}</span>
                          </div>
                          {cargo.volume && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-600">Required Volume</span>
                              <span className="text-xs font-bold text-blue-900">≥ {formatVolume(cargo.volume)}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-2">
                            Trucks must have sufficient capacity to carry your cargo.
                          </div>
                        </div>
                      </div>

                      {/* Equipment Criteria */}
                      <div className="bg-white p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-purple-600" />
                          Equipment Requirements
                        </h4>
                        <div className="space-y-1">
                          {cargo.requiresForklift && (
                            <div className="flex items-center text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              Forklift Required
                            </div>
                          )}
                          {cargo.requiresCrane && (
                            <div className="flex items-center text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              Crane Required
                            </div>
                          )}
                          {cargo.requiresLoadingDock && (
                            <div className="flex items-center text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              Loading Dock Required
                            </div>
                          )}
                          {cargo.requiresRefrigeration && (
                            <div className="flex items-center text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              Refrigeration Required
                            </div>
                          )}
                          {cargo.isHazardous && (
                            <div className="flex items-center text-xs text-gray-700">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              Hazmat Permit Required
                            </div>
                          )}
                          {!cargo.requiresForklift && !cargo.requiresCrane && !cargo.requiresLoadingDock && !cargo.requiresRefrigeration && !cargo.isHazardous && (
                            <div className="text-xs text-gray-500">No special equipment required</div>
                          )}
                        </div>
                      </div>

                      {/* Cargo Type & Special Requirements */}
                      <div className="bg-white p-4 rounded-lg border border-orange-200">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Package className="w-4 h-4 mr-2 text-orange-600" />
                          Cargo Type & Requirements
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Cargo Type</span>
                            <span className="text-xs font-medium text-gray-900">{getCargoTypeDisplayName(cargo.cargoType)}</span>
                          </div>
                          {cargo.isFragile && (
                            <div className="flex items-center text-xs text-gray-700">
                              <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" />
                              Fragile Handling
                            </div>
                          )}
                          {cargo.isTimeCritical && (
                            <div className="flex items-center text-xs text-gray-700">
                              <Clock3 className="w-3 h-3 mr-1 text-red-500" />
                              Time Critical
                            </div>
                          )}
                          {cargo.requiresGpsMonitoring && (
                            <div className="flex items-center text-xs text-gray-700">
                              <Navigation className="w-3 h-3 mr-1 text-blue-500" />
                              GPS Monitoring
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Scoring Factors Explanation */}
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-indigo-600" />
                        AI Scoring Factors
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-700">
                        <div className="flex items-center">
                          <Weight className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Capacity Score</span>
                        </div>
                        <div className="flex items-center">
                          <Route className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Distance Score</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Equipment Score</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Rating Score</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Price Score</span>
                        </div>
                        <div className="flex items-center">
                          <Clock3 className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Time Score</span>
                        </div>
                        <div className="flex items-center">
                          <Thermometer className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Temperature Score</span>
                        </div>
                        <div className="flex items-center">
                          <Target className="w-3 h-3 mr-1 text-indigo-500" />
                          <span>Overall Score</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Matches */}
                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Award className="w-5 h-5 mr-2 text-purple-600" />
                      AI-Recommended Trucks
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Trucks are ranked by AI matching score based on all criteria. Higher scores indicate better overall compatibility with your cargo requirements.
                    </p>
                    
                    {matchesLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <p className="mt-4 text-sm text-gray-600">Finding matching trucks...</p>
                      </div>
                    ) : matchesError ? (
                      <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-red-900 mb-2">Error Loading Matches</h4>
                        <p className="text-sm text-red-700 mb-4">
                          {matchesError}
                        </p>
                        <button
                          onClick={() => {
                            setMatchesLoading(true);
                            setMatchesError(null);
                            if (cargo?.id) {
                              matchingAPI.findMatches({
                                loadId: cargo.id,
                                algorithm: 'WEIGHTED_SCORE',
                                maxDistance: 1000,
                                minRating: 0.0,
                                limit: 20,
                                includeDrivers: true,
                              }).then(response => {
                                const matchesData = response.data?.data || response.data?.matches || response.data || [];
                                setMatches(matchesData);
                                setMatchesLoading(false);
                              }).catch(error => {
                                const errorMessage = error.response?.data?.message || 'Failed to fetch matches';
                                setMatchesError(errorMessage);
                                setMatchesLoading(false);
                              });
                            }
                          }}
                          className="btn btn-primary btn-sm mt-4"
                        >
                          <Search className="w-4 h-4 mr-2" />
                          Try Again
                        </button>
                      </div>
                    ) : matches.length === 0 ? (
                      <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                        <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Available Matches</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          We searched for trucks but couldn't find any that match your cargo requirements at this time.
                        </p>
                        <div className="text-left max-w-md mx-auto bg-gray-50 rounded-lg p-4">
                          <p className="text-xs font-medium text-gray-700 mb-2">Your cargo requirements:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            <li>• Weight: {formatWeight(cargo.weight)}</li>
                            {cargo.volume && <li>• Volume: {formatVolume(cargo.volume)}</li>}
                            {cargo.requiresRefrigeration && <li>• Requires Refrigeration</li>}
                            {cargo.isHazardous && <li>• Requires Hazmat Permit</li>}
                            {cargo.requiresForklift && <li>• Requires Forklift/Lift Gate</li>}
                          </ul>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">
                          Try adjusting your requirements or check back later for available trucks.
                        </p>
                        <div className="mt-4 text-xs text-gray-500">
                          <p>💡 <strong>Tip:</strong> You can try:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Increasing your budget</li>
                            <li>Adjusting pickup/delivery dates</li>
                            <li>Relaxing special requirements</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {matches.map((match: any, index: number) => {
                          const matchScore = Math.round((match.overallScore || match.confidence || 0) * 100);
                          const getScoreColorClass = (score: number) => {
                            if (score >= 90) return { bg: 'bg-green-500', badge: 'bg-green-100 text-green-800', text: 'text-green-600' };
                            if (score >= 70) return { bg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800', text: 'text-blue-600' };
                            return { bg: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800', text: 'text-yellow-600' };
                          };
                          const scoreColor = getScoreColorClass(matchScore);
                          
                          // Extract scoring breakdown if available
                          const scoringBreakdown = match.scoringBreakdown || {};
                          const capacityScore = Math.round((match.capacityScore || 0) * 100);
                          const distanceScore = Math.round((match.distanceScore || 0) * 100);
                          const equipmentScore = Math.round((match.equipmentScore || 0) * 100);
                          const ratingScore = Math.round((match.ratingScore || 0) * 100);
                          const priceScore = Math.round((match.priceScore || 0) * 100);
                          const routeScore = Math.round((match.routeScore || 0) * 100);
                          const timeScore = Math.round((match.timeScore || 0) * 100);
                          
                          const getIndividualScoreColor = (score: number) => {
                            if (score >= 80) return 'text-green-600';
                            if (score >= 60) return 'text-blue-600';
                            return 'text-yellow-600';
                          };
                          
                          return (
                            <div key={match.truckId || index} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-purple-300 transition-colors shadow-sm">
                              {/* Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-4 h-4 ${scoreColor.bg} rounded-full`}></div>
                                  <div>
                                    <span className="font-semibold text-gray-900 text-lg">
                                      {match.truckMake} {match.truckModel}
                                    </span>
                                    <p className="text-sm text-gray-600">{match.plateNumber}</p>
                                  </div>
                                  <span className={`px-3 py-1 ${scoreColor.badge} text-sm font-bold rounded-full`}>
                                    {matchScore}% Match
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {match.truckRating ? Number(match.truckRating).toFixed(1) : 'N/A'}
                                  </span>
                                </div>
                              </div>

                              {/* AI Scoring Breakdown */}
                              <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                  <Target className="w-4 h-4 mr-2 text-indigo-600" />
                                  AI Scoring Breakdown
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600 mb-1">Capacity</div>
                                    <div className={`text-lg font-bold ${capacityScore >= 80 ? 'text-green-600' : capacityScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                      {capacityScore}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600 mb-1">Distance</div>
                                    <div className={`text-lg font-bold ${distanceScore >= 80 ? 'text-green-600' : distanceScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                      {distanceScore}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600 mb-1">Equipment</div>
                                    <div className={`text-lg font-bold ${equipmentScore >= 80 ? 'text-green-600' : equipmentScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                      {equipmentScore}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-600 mb-1">Rating</div>
                                    <div className={`text-lg font-bold ${ratingScore >= 80 ? 'text-green-600' : ratingScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                      {ratingScore}%
                                    </div>
                                  </div>
                                  {priceScore > 0 && (
                                    <div className="text-center">
                                      <div className="text-xs text-gray-600 mb-1">Price</div>
                                      <div className={`text-lg font-bold ${priceScore >= 80 ? 'text-green-600' : priceScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                        {priceScore}%
                                      </div>
                                    </div>
                                  )}
                                  {routeScore > 0 && (
                                    <div className="text-center">
                                      <div className="text-xs text-gray-600 mb-1">Route</div>
                                      <div className={`text-lg font-bold ${routeScore >= 80 ? 'text-green-600' : routeScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                        {routeScore}%
                                      </div>
                                    </div>
                                  )}
                                  {timeScore > 0 && (
                                    <div className="text-center">
                                      <div className="text-xs text-gray-600 mb-1">Time</div>
                                      <div className={`text-lg font-bold ${timeScore >= 80 ? 'text-green-600' : timeScore >= 60 ? 'text-blue-600' : 'text-yellow-600'}`}>
                                        {timeScore}%
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Truck Details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <span className="text-xs text-gray-500 block mb-1">Truck Type</span>
                                  <p className="text-sm font-medium text-gray-900">{match.truckType || 'Standard Truck'}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <span className="text-xs text-gray-500 block mb-1">Weight Capacity</span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatWeight(match.capacityWeight || 0)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Utilization: {Math.round(((cargo.weight / (match.capacityWeight || 1)) * 100))}%
                                  </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <span className="text-xs text-gray-500 block mb-1">Distance</span>
                                  <p className="text-sm font-medium text-gray-900">
                                    {match.distanceKm ? `${match.distanceKm.toFixed(0)} km` : 'N/A'}
                                  </p>
                                </div>
                              </div>

                              {/* Equipment Match Indicators */}
                              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                <h5 className="text-xs font-semibold text-gray-900 mb-2">Equipment Compatibility</h5>
                                <div className="flex flex-wrap gap-2">
                                  {match.hasRefrigeration && cargo.requiresRefrigeration && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      ✓ Refrigeration
                                    </span>
                                  )}
                                  {match.hasLiftGate && cargo.requiresForklift && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      ✓ Lift Gate
                                    </span>
                                  )}
                                  {match.hasHazmatPermit && cargo.isHazardous && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      ✓ Hazmat Permit
                                    </span>
                                  )}
                                  {(!match.hasRefrigeration && !match.hasLiftGate && !match.hasHazmatPermit) && (
                                    <span className="text-xs text-gray-500">Standard equipment</span>
                                  )}
                                </div>
                              </div>

                              {/* Match Reason */}
                              {match.matchReason && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <h5 className="text-xs font-semibold text-gray-900 mb-1 flex items-center">
                                    <Info className="w-3 h-3 mr-1 text-blue-600" />
                                    Why This Match?
                                  </h5>
                                  <p className="text-xs text-gray-700">
                                    {match.matchReason}
                                  </p>
                                </div>
                              )}
                              
                              {/* Driver Information */}
                              {match.driverName && (
                                <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <h5 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                                    <Users className="w-3 h-3 mr-1 text-purple-600" />
                                    Driver Information
                                  </h5>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-gray-600">Name:</span>
                                      <span className="ml-2 font-medium text-gray-900">{match.driverName}</span>
                                    </div>
                                    {match.driverRating && (
                                      <div>
                                        <span className="text-gray-600">Rating:</span>
                                        <span className="ml-2 font-medium text-gray-900">{match.driverRating.toFixed(1)}/5</span>
                                      </div>
                                    )}
                                    {match.driverLicenseNumber && (
                                      <div>
                                        <span className="text-gray-600">License:</span>
                                        <span className="ml-2 font-medium text-gray-900">{match.driverLicenseNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Cost & Time Estimates */}
                              <div className="mb-4 grid grid-cols-2 gap-3">
                                {match.estimatedCost && (
                                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                    <span className="text-xs text-gray-600 block mb-1">Estimated Cost</span>
                                    <p className="text-sm font-bold text-yellow-900">
                                      {formatCurrency(match.estimatedCost, cargo.currencyCode)}
                                    </p>
                                  </div>
                                )}
                                {match.estimatedDeliveryTime && (
                                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <span className="text-xs text-gray-600 block mb-1">Est. Delivery Time</span>
                                    <p className="text-sm font-bold text-blue-900">
                                      {match.estimatedDeliveryTime.toFixed(1)} hours
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Success Probability & Confidence */}
                              {(match.successProbability || match.confidence) && (
                                <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-700">AI Confidence</span>
                                    <span className="text-sm font-bold text-indigo-900">
                                      {Math.round((match.successProbability || match.confidence || 0) * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                    <div 
                                      className="bg-indigo-600 h-2 rounded-full" 
                                      style={{ width: `${(match.successProbability || match.confidence || 0) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                                <button className="flex-1 btn btn-primary btn-sm">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Contact Driver
                                </button>
                                <button className="flex-1 btn btn-outline btn-sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Full Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Matching Analytics */}
                  <div className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                      Matching Analytics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Match Quality Distribution</h4>
                        <div className="space-y-2">
                          {(() => {
                            const excellent = matches.filter(m => (m.overallScore || 0) >= 0.9).length;
                            const good = matches.filter(m => (m.overallScore || 0) >= 0.8 && (m.overallScore || 0) < 0.9).length;
                            const fair = matches.filter(m => (m.overallScore || 0) >= 0.7 && (m.overallScore || 0) < 0.8).length;
                            const total = matches.length;
                            const excellentPercent = total > 0 ? (excellent / total) * 100 : 0;
                            const goodPercent = total > 0 ? (good / total) * 100 : 0;
                            const fairPercent = total > 0 ? (fair / total) * 100 : 0;
                            
                            return (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Excellent (90%+)</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${excellentPercent}%` }}></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{excellent}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Good (80-89%)</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${goodPercent}%` }}></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{good}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Fair (70-79%)</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${fairPercent}%` }}></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{fair}</span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Price Comparison</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Your Budget</span>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(cargo.offeredPrice || 0)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Average Market Price</span>
                            <span className="text-sm font-medium text-blue-600">
                              {matches.length > 0 
                                ? formatCurrency(matches.reduce((sum, m) => sum + (m.estimatedCost || m.recommendedPrice || 0), 0) / matches.length)
                                : formatCurrency((cargo.offeredPrice || 0) * 1.05)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Lowest Offer</span>
                            <span className="text-sm font-medium text-green-600">
                              {matches.length > 0 
                                ? formatCurrency(Math.min(...matches.map(m => m.estimatedCost || m.recommendedPrice || 0)))
                                : formatCurrency((cargo.offeredPrice || 0) * 0.88)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Highest Offer</span>
                            <span className="text-sm font-medium text-red-600">
                              {matches.length > 0 
                                ? formatCurrency(Math.max(...matches.map(m => m.estimatedCost || m.recommendedPrice || 0)))
                                : formatCurrency((cargo.offeredPrice || 0) * 1.15)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {DialogComponent}

        {previewDoc && (
          <DocumentPreviewModal
            isOpen={!!previewDoc}
            onClose={() => setPreviewDoc(null)}
            documentId={previewDoc.id}
            title={previewDoc.title}
            fileName={previewDoc.fileName}
          />
        )}
      </div>
    </div>
  );
};

export default CargoDetailsModal;