import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  AlertTriangle,
  Weight,
  Volume,
  TrendingUp,
  FileText,
  Globe,
  Navigation,
  Clock3,
  AlertCircle,
  Zap,
  Target,
  Upload,
  Download,
  Info,
  Star,
  Users,
  Mail,
  Edit,
  Trash2,
  Eye,
  Route,
  Award,
  Search,
  Filter,
  Shield,
  CheckCircle,
  MessageSquare
} from 'lucide-react';

import { loadsAPI } from '@/services/load';
import { matchingAPI } from '@/services/api';
import { documentApi, type Document as DocumentType } from '@/services/documents/documentApi';
import { enhancedMatchingApi } from '@/services/enhancedMatchingApi';
import receiverService from '@/services/receiverService';
import toast from 'react-hot-toast';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import DocumentPreviewModal from '@/components/documents/DocumentPreviewModal';
import DocumentUploadModal from '@/components/documents/DocumentUploadModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCargoTypeIcon,
  getStatusColor,
  getStatusDisplayName,
  getCargoTypeDisplayName,
  formatWeight,
  formatVolume,
  formatCurrency,
  getUrgencyColor,
  getSpecialRequirements,
  getEnrichedLocationDetails
} from '@/pages/dashboard/cargos/list/utils';
import { cn } from '@/utils/cn';

interface CargoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cargoId: string | null;
  cargoData?: any; // Pass full cargo object from list to avoid extra fetch
}

import BottomSheet from '@/components/common/BottomSheet';
import CargoHistoryTab from '@/components/Cargo/CargoHistoryTab';

// Helper: safe date format
const fmtDate = (d: any) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Helper: extract lat/lng from GeoJSON or plain object
const extractCoords = (loc: any): { lat: number; lng: number } | null => {
  if (!loc?.coordinates) return null;
  const c = loc.coordinates;
  if (Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
    return { lng: c.coordinates[0], lat: c.coordinates[1] };
  }
  if (c.latitude != null && c.longitude != null) return { lat: c.latitude, lng: c.longitude };
  if (c.lat != null && c.lng != null) return { lat: c.lat, lng: c.lng };
  return null;
};

const CargoDetailsModal = ({ isOpen, onClose, cargoId, cargoData: propCargoData }: CargoDetailsModalProps) => {
  const { user } = useAuth();
  const { confirm, DialogComponent } = useConfirmDialog();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ id: string, title: string, fileName: string } | null>(null);

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['cargo', cargoId, user?.role],
    queryFn: async () => {
      if (user?.role === 'CARGO_RECEIVER') {
        const res = await receiverService.getCargoForInspection(cargoId!);
        return { data: { load: res.cargo } };
      }
      return loadsAPI.getById(cargoId!);
    },
    // Skip fetch if we already have the full cargo object from the list
    enabled: !!cargoId && !propCargoData,
    retry: 1,
  });

  // Use passed cargoData first, then try all known response shapes
  const cargo = propCargoData
    ?? response?.data?.load
    ?? response?.data?.data
    ?? response?.data;

  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents', cargoId, user?.role],
    queryFn: async () => {
      if (!cargoId) return [];

      // Receivers currently don't have access to the documents API
      if (user?.role === 'CARGO_RECEIVER') {
        return [];
      }

      try {
        // Check if documentApi exists and has getDocumentsByEntity
        if (documentApi && typeof documentApi.getDocumentsByEntity === 'function') {
          return await documentApi.getDocumentsByEntity('CARGO', cargoId);
        }
        return [];
      } catch (e) {
        console.error(e);
        return [];
      }
    },
    enabled: !!cargoId,
  });

  // Extract documents array from the response
  const documents: DocumentType[] = Array.isArray(documentsData) ? documentsData : [];

  const { data: matches = [], isLoading: matchesLoading, error: matchesError, refetch: refetchMatches } = useQuery({
    queryKey: ['matches', cargoId],
    queryFn: async () => {
      if (!cargoId) return [];
      // Use matchingAPI if available
      if (matchingAPI && typeof matchingAPI.findMatches === 'function') {
        const res = await matchingAPI.findMatches({
          loadId: cargoId,
          algorithm: 'WEIGHTED_SCORE',
          minRating: 0.0,
          limit: 20,
          includeDrivers: true,
        });
        return res.data?.data || res.data?.matches || res.data || [];
      }
      return [];
    },
    enabled: !!cargoId && activeTab === 'matching',
    retry: 1,
  });

  return (
    <>
      <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="6xl"
      className="p-0"
    >
      <div className="flex flex-col h-full bg-[#f8fafc]">
        {/* Header - Integrating into the content since it has complex logic */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              {cargo && <div className="text-[#345E85]">{getCargoTypeIcon(cargo.cargoType)}</div>}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
                {cargo?.title || 'Cargo Details'}
              </h2>
              <p className="hidden sm:block text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Cargo ID: {cargoId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cargo && (
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(cargo.status)}`}>
                {getStatusDisplayName(cargo.status)}
              </span>
            )}
            {/* Standard modal closes button is in the BottomSheet wrapper, but we keep this one for consistency if needed, though usually redundant */}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
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
                <div className="mb-8">
                  <nav className="flex flex-wrap gap-2">
                    {[
                      { id: 'overview', label: 'OVERVIEW', icon: Package },
                      { id: 'tracking', label: 'TRACKING', icon: Navigation },
                      { id: 'documents', label: 'DOCUMENTS', icon: FileText },
                      { id: 'history', label: 'HISTORY', icon: Clock3 },
                      { id: 'matching', label: 'MATCHING', icon: Target, roles: ['CARGO_OWNER', 'BROKER', 'ADMIN', 'SUPER_ADMIN'] },
                    ].filter(tab => !tab.roles || (user?.role && tab.roles.includes(user.role))).map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={cn(
                            "px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all",
                            isActive
                              ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/20"
                              : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
                          )}
                        >
                          <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                          <span className="uppercase tracking-wider">{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* ── Cargo Information ─────────────────────────── */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#345E85]" />
                            Cargo Information
                          </h3>
                          <div className="text-[#345E85]">{getCargoTypeIcon(cargo.cargoType)}</div>
                        </div>

                        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                          {cargo.description || <span className="italic text-slate-400">No description provided</span>}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { icon: Package,    label: 'Type',          value: getCargoTypeDisplayName(cargo.cargoType) },
                            { icon: Weight,     label: 'Weight',        value: formatWeight(cargo.weight) },
                            { icon: Volume,     label: 'Volume',        value: formatVolume(cargo.volume) },
                            { icon: DollarSign, label: 'Cargo Value',   value: formatCurrency(cargo.loadValue, cargo.currencyCode) },
                            { icon: TrendingUp, label: 'Offered Price', value: formatCurrency(cargo.offeredPrice, cargo.currencyCode) },
                            { icon: Shield,     label: 'Insurance',     value: formatCurrency(cargo.insuranceValue, cargo.currencyCode) },
                            { icon: Zap,        label: 'Urgency',       value: cargo.urgencyLevel || 'NORMAL' },
                            { icon: Globe,      label: 'Currency',      value: cargo.currencyCode || 'USD' },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl">
                              <div className="p-1.5 bg-white rounded-xl shadow-sm flex-shrink-0">
                                <Icon className="w-3.5 h-3.5 text-[#345E85]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                                <p className="text-xs font-bold text-[#0f172a] truncate">{value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Special Requirements ──────────────────────── */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2 mb-4">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Special Requirements
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'isFragile',                       label: '🫙 Fragile' },
                            { key: 'isHazardous',                     label: '☢️ Hazardous' },
                            { key: 'requiresRefrigeration',           label: '❄️ Refrigeration' },
                            { key: 'isTimeCritical',                  label: '⏱ Time Critical' },
                            { key: 'requiresGpsMonitoring',           label: '📡 GPS Monitoring' },
                            { key: 'requiresTemperatureMonitoring',   label: '🌡 Temp Monitoring' },
                            { key: 'requiresLowClearanceRoute',       label: '🚧 Low Clearance' },
                            { key: 'requiresEscortVehicle',           label: '🚔 Escort Vehicle' },
                            { key: 'requiresPreShipmentInspection',   label: '🔍 Pre-Shipment Inspection' },
                            { key: 'requiresDeliveryInspection',      label: '✅ Delivery Inspection' },
                            { key: 'requiresPhotographicDocumentation', label: '📷 Photo Documentation' },
                          ].filter(r => cargo[r.key]).map(r => (
                            <span key={r.key} className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-wider">
                              {r.label}
                            </span>
                          ))}
                          {[
                            'isFragile','isHazardous','requiresRefrigeration','isTimeCritical',
                            'requiresGpsMonitoring','requiresTemperatureMonitoring','requiresLowClearanceRoute',
                            'requiresEscortVehicle','requiresPreShipmentInspection','requiresDeliveryInspection',
                            'requiresPhotographicDocumentation',
                          ].every(k => !cargo[k]) && (
                            <span className="text-sm text-slate-400 italic">No special requirements</span>
                          )}
                        </div>

                        {/* Loading / Unloading instructions */}
                        {(cargo.loadingInstructions || cargo.unloadingInstructions) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {cargo.loadingInstructions && (
                              <div className="p-3 bg-slate-50 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Loading Instructions</p>
                                <p className="text-xs text-slate-700">{cargo.loadingInstructions}</p>
                              </div>
                            )}
                            {cargo.unloadingInstructions && (
                              <div className="p-3 bg-slate-50 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unloading Instructions</p>
                                <p className="text-xs text-slate-700">{cargo.unloadingInstructions}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Route Intelligence ────────────────────────── */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2 mb-5">
                          <Navigation className="w-4 h-4 text-[#345E85]" />
                          Route Intelligence
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Pickup */}
                          {(() => {
                            const loc = cargo.pickupLocation;
                            const coords = extractCoords(loc);
                            return (
                              <div className="border border-emerald-100 bg-emerald-50/40 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0" />
                                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pickup Location</span>
                                </div>
                                <p className="text-sm font-bold text-[#0f172a] mb-1 leading-snug">
                                  {loc?.address || loc?.name || <span className="text-slate-400 font-normal italic">Not specified</span>}
                                </p>
                                {coords && (
                                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                                    📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-emerald-100">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs text-slate-600 font-medium">{fmtDate(cargo.pickupDate)}</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Delivery */}
                          {(() => {
                            const loc = cargo.deliveryLocation;
                            const coords = extractCoords(loc);
                            return (
                              <div className="border border-red-100 bg-red-50/40 rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0" />
                                  <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Delivery Location</span>
                                </div>
                                <p className="text-sm font-bold text-[#0f172a] mb-1 leading-snug">
                                  {loc?.address || loc?.name || <span className="text-slate-400 font-normal italic">Not specified</span>}
                                </p>
                                {coords && (
                                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                                    📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-100">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs text-slate-600 font-medium">{fmtDate(cargo.deliveryDate)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                      {/* Status Card */}
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-6 flex items-center">
                          <Info className="w-4 h-4 mr-3 text-[#345E85]" />
                          Logistics Context
                        </h3>

                        <div className="space-y-6">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${getStatusColor(cargo.status)}`}>
                                {getStatusDisplayName(cargo.status)}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Created</span>
                              <p className="text-xs font-black text-[#0f172a]">{fmtDate(cargo.createdAt)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Updated</span>
                              <p className="text-xs font-black text-[#0f172a]">{fmtDate(cargo.updatedAt)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Pickup Date</span>
                              <p className="text-xs font-black text-[#0f172a]">{fmtDate(cargo.pickupDate)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Delivery Date</span>
                              <p className="text-xs font-black text-[#0f172a]">{fmtDate(cargo.deliveryDate)}</p>
                            </div>
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
                      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-6 flex items-center">
                          <Zap className="w-4 h-4 mr-3 text-[#345E85]" />
                          Dynamic Actions
                        </h3>

                        <div className="space-y-2">
                          {(user?.role === 'CARGO_OWNER' || user?.role === 'BROKER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#345E85] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all">
                              <Edit className="w-4 h-4" />
                              Edit Cargo
                            </button>
                          )}

                          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                            <Eye className="w-4 h-4" />
                            View Documents
                          </button>

                          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                            <Navigation className="w-4 h-4" />
                            Track Shipment
                          </button>

                          {(user?.role === 'CARGO_OWNER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all mt-4">
                              <Trash2 className="w-4 h-4" />
                              Delete Shipment
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
                            onClick={() => setShowUploadModal(true)}
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
                          {documents.map((doc: DocumentType) => (
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
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${doc.status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
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
                  <div className="bg-white rounded-lg p-4 md:p-6 border border-gray-200">
                    <CargoHistoryTab
                      cargoId={cargoId}
                      enabled={isOpen && activeTab === 'history'}
                    />
                  </div>
                )}

                {activeTab === 'matching' && (
                  <div className="space-y-8">
                    {/* Matching Overview */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                          <Target className="w-6 h-6 text-[#345E85]" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#0f172a] tracking-tight">AI Matching Intelligence</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                            Neural-optimized carrier selection & compatibility analysis
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Signals</p>
                              <p className="text-2xl font-black text-[#0f172a]">
                                {matchesLoading ? '...' : matches.length}
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                              <Target className="w-5 h-5 text-[#345E85]" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Carriers</p>
                              <p className="text-2xl font-black text-[#345E85]">
                                {matchesLoading ? '...' : matches.filter((m: any) => m.truckStatus === 'AVAILABLE').length}
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                              <Award className="w-5 h-5 text-[#345E85]" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Fidelity</p>
                              <p className="text-2xl font-black text-emerald-600">
                                {matchesLoading ? '...' : matches.length > 0 ? `${Math.round((matches[0].overallScore || matches[0].confidence || 0) * 100)}%` : 'N/A'}
                              </p>
                            </div>
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                              <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-8">
                        <button
                          className="flex items-center gap-2 px-6 py-3 bg-[#345E85] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all flex-1 md:flex-none justify-center"
                          onClick={() => refetchMatches()}
                          disabled={matchesLoading || !cargo?.id}
                        >
                          <Search className="w-4 h-4" />
                          {matchesLoading ? 'PROCESSING...' : 'REFRESH MATCHES'}
                        </button>
                      </div>
                    </div>

                    {/* AI Matching Criteria & Dimensions */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Filter className="w-6 h-6 text-[#345E85]" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Strategic Criteria</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                              Parameters used to calibrate carrier compatibility
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                              <Weight className="w-4 h-4 mr-2 text-[#345E85]" />
                              Capacity
                            </h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required</span>
                                <span className="text-xs font-black text-[#0f172a]">≥ {formatWeight(cargo.weight)}</span>
                              </div>
                              {cargo.volume && (
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume</span>
                                  <span className="text-xs font-black text-[#0f172a]">≥ {formatVolume(cargo.volume)}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                              <Shield className="w-4 h-4 mr-2 text-[#345E85]" />
                              Equipment
                            </h4>
                            <div className="space-y-2">
                              {cargo.requiresForklift && (
                                <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                  <CheckCircle className="w-3.5 h-3.5 mr-2" /> Forklift
                                </div>
                              )}
                              {cargo.requiresCrane && (
                                <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                  <CheckCircle className="w-3.5 h-3.5 mr-2" /> Crane
                                </div>
                              )}
                              {cargo.requiresLoadingDock && (
                                <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                  <CheckCircle className="w-3.5 h-3.5 mr-2" /> Loading Dock
                                </div>
                              )}
                              {cargo.requiresRefrigeration && (
                                <div className="flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                                  <CheckCircle className="w-3.5 h-3.5 mr-2" /> Refrigeration
                                </div>
                              )}
                              {!cargo.requiresForklift && !cargo.requiresCrane && !cargo.requiresLoadingDock && !cargo.requiresRefrigeration && (
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Standard Configuration</div>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                              <Package className="w-4 h-4 mr-2 text-[#345E85]" />
                              Shipment Type
                            </h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class</span>
                                <span className="text-xs font-black text-[#0f172a]">{getCargoTypeDisplayName(cargo.cargoType)}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {cargo.isFragile && (
                                  <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-black rounded-lg border border-orange-100 uppercase tracking-widest">
                                    Fragile
                                  </span>
                                )}
                                {cargo.isTimeCritical && (
                                  <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-black rounded-lg border border-red-100 uppercase tracking-widest">
                                    Critical
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl shadow-slate-900/20">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
                          <Zap className="w-4 h-4 mr-3 text-blue-400" />
                          Neural Dimensions
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { icon: Weight, label: 'Payload Capacity', detail: 'Weight/Volume parity' },
                            { icon: Route, label: 'Geospatial Proximity', detail: 'Current location distance' },
                            { icon: Shield, label: 'Hardware Alignment', detail: 'Equipment & accessories' },
                            { icon: Star, label: 'Carrier Authority', detail: 'Rating & reliability' },
                            { icon: DollarSign, label: 'Yield Optimization', detail: 'Rate competitiveness' },
                            { icon: Clock3, label: 'Temporal Velocity', detail: 'ETA & pickup window' }
                          ].map((dim, idx) => (
                            <div key={idx} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 group hover:bg-slate-800 transition-colors">
                              <div className="p-2 bg-slate-700 rounded-xl group-hover:bg-[#345E85] transition-colors">
                                <dim.icon className="w-4 h-4 text-slate-300" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-white uppercase tracking-tight">{dim.label}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{dim.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top Recommendations */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                            <Award className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Tier-1 Recommendations</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                              Elite carrier matches optimized for high-fidelity logistics
                            </p>
                          </div>
                        </div>
                      </div>

                      {matchesLoading ? (
                        <div className="text-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                          <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-50 border-t-[#345E85] animate-spin"></div>
                            <div className="absolute inset-4 rounded-full border-4 border-slate-50 border-b-[#345E85] animate-spin-slow"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Target className="w-6 h-6 text-[#345E85]" />
                            </div>
                          </div>
                          <h4 className="text-lg font-black text-[#0f172a] tracking-tight mb-2">Synthesizing Match Data</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Applying neural weights to market signals...</p>
                        </div>
                      ) : matchesError ? (
                        <div className="text-center py-12 bg-red-50 rounded-[2rem] border border-red-100">
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <h4 className="text-lg font-black text-red-900 tracking-tight mb-2">Analysis Interrupted</h4>
                          <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-6">
                            {matchesError instanceof Error ? matchesError.message : 'Failed to synchronize matching engine'}
                          </p>
                          <button
                            onClick={() => refetchMatches()}
                            className="px-6 py-2.5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                          >
                            RE-INITIALIZE ENGINE
                          </button>
                        </div>
                      ) : matches.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                            <Truck className="w-10 h-10 text-slate-200" />
                          </div>
                          <h4 className="text-xl font-black text-[#0f172a] tracking-tight mb-2">Zero Compatibility Signals</h4>
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto mb-8">
                            No carrier profiles currently meet the critical architecture of your requirements
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {matches.map((match: any, index: number) => {
                            const matchScore = Math.round((match.overallScore || match.confidence || 0) * 100);
                            const level = matchScore >= 90
                              ? { label: 'ELITE', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' }
                              : matchScore >= 75
                                ? { label: 'OPTIMAL', color: 'text-[#345E85]', bg: 'bg-blue-50', border: 'border-blue-100' }
                                : { label: 'COMPATIBLE', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };

                            return (
                              <div key={match.truckId || index} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden relative">
                                <div className="flex flex-col lg:flex-row gap-8 relative z-10">
                                  {/* Truck Identity */}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-6">
                                      <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#345E85] group-hover:border-[#345E85] transition-colors">
                                        <Truck className="w-7 h-7 text-[#345E85] group-hover:text-white transition-colors" />
                                      </div>
                                      <div>
                                        <h4 className="text-xl font-black text-[#0f172a] tracking-tight">
                                          {match.truckMake} {match.truckModel}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{match.plateNumber}</span>
                                          <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                          <span className="text-[10px] font-black text-[#345E85] uppercase tracking-widest">{match.truckType || 'Standard'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payload</p>
                                        <p className="text-sm font-black text-[#0f172a]">{formatWeight(match.capacityWeight || 0)}</p>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reputation</p>
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                          <p className="text-sm font-black text-[#0f172a]">{match.truckRating ? Number(match.truckRating).toFixed(1) : '5.0'}</p>
                                        </div>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                                        <p className="text-sm font-black text-[#0f172a]">{match.distanceKm ? `${match.distanceKm.toFixed(0)} KM` : 'N/A'}</p>
                                      </div>
                                    </div>

                                    {/* Neural Decomposition - Scoring Breakdown */}
                                    <div className="mt-8 pt-8 border-t border-slate-50">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                        <Zap className="w-3.5 h-3.5 mr-2 text-purple-500" />
                                        Neural Compatibility Decomposition
                                      </p>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                          { label: 'Capacity', score: match.capacityScore },
                                          { label: 'Distance', score: match.distanceScore },
                                          { label: 'Equipment', score: match.equipmentScore },
                                          { label: 'Rating', score: match.ratingScore },
                                          { label: 'Price', score: match.priceScore },
                                          { label: 'Route', score: match.routeScore },
                                          { label: 'Velocity', score: match.timeScore }
                                        ].filter(s => s.score !== undefined).map((s, i) => (
                                          <div key={i} className="px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100">
                                            <div className="flex justify-between items-center mb-1">
                                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{s.label}</span>
                                              <span className="text-[9px] font-black text-[#345E85]">{Math.round(s.score * 100)}%</span>
                                            </div>
                                            <div className="h-1 bg-white rounded-full overflow-hidden border border-slate-100">
                                              <div
                                                className={cn(
                                                  "h-full rounded-full transition-all duration-1000",
                                                  s.score >= 0.8 ? "bg-emerald-500" : s.score >= 0.6 ? "bg-blue-500" : "bg-amber-500"
                                                )}
                                                style={{ width: `${s.score * 100}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Match Score & Actions */}
                                  <div className="lg:w-72 flex flex-col justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                    <div className="text-center mb-6">
                                      <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl ${level.bg} ${level.border} mb-4`}>
                                        <Zap className={`w-3.5 h-3.5 ${level.color}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${level.color}`}>{level.label} MATCH</span>
                                      </div>
                                      <div className="relative inline-block">
                                        <p className="text-5xl font-black text-[#0f172a] tracking-tighter">{matchScore}%</p>
                                      </div>
                                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Confidence Index</p>
                                      {match.estimatedCost && (
                                        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quota Estimate</p>
                                          <p className="text-lg font-black text-[#345E85]">
                                            {formatCurrency(match.estimatedCost, cargo.currencyCode)}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <button
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-[#345E85] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-slate-800 transition-all"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            toast.loading('Initializing carrier request...', { id: 'request-match' });
                                            await enhancedMatchingApi.requestMatch(cargoId!, match.truckId);
                                            toast.success('Carrier request dispatched!', { id: 'request-match' });
                                          } catch (err: any) {
                                            const msg = err.response?.data?.message || 'Synchronization failure';
                                            toast.error(msg, { id: 'request-match' });
                                          }
                                        }}
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Secure Carrier
                                      </button>
                                      <button className="w-full flex items-center justify-center gap-2 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                        <MessageSquare className="w-4 h-4" />
                                        Message
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Market Intelligence */}
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Market Intelligence</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                            Comparative analytics and rate benchmarks
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Quality Distribution */}
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Fidelity Distribution</h4>
                          <div className="space-y-6">
                            {(() => {
                              const excellent = matches.filter((m: any) => (m.overallScore || 0) >= 0.9).length;
                              const good = matches.filter((m: any) => (m.overallScore || 0) >= 0.8 && (m.overallScore || 0) < 0.9).length;
                              const fair = matches.filter((m: any) => (m.overallScore || 0) >= 0.7 && (m.overallScore || 0) < 0.8).length;
                              const total = matches.length;

                              const items = [
                                { label: 'Elite (90%+)', count: excellent, color: 'bg-emerald-500' },
                                { label: 'Optimal (80-89%)', count: good, color: 'bg-[#345E85]' },
                                { label: 'Compatible (70-79%)', count: fair, color: 'bg-amber-500' }
                              ];

                              return items.map((item, idx) => {
                                const percent = total > 0 ? (item.count / total) * 100 : 0;
                                return (
                                  <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">{item.label}</span>
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.count} UNITS</span>
                                    </div>
                                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>

                        {/* Price Benchmarks */}
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Rate Benchmarks</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { label: 'Your Offer', value: cargo.offeredPrice || 0, color: 'text-[#0f172a]' },
                              {
                                label: 'Market Mean',
                                value: matches.length > 0
                                  ? matches.reduce((sum: number, m: any) => sum + (m.estimatedCost || m.recommendedPrice || 0), 0) / matches.length
                                  : (cargo.offeredPrice || 0) * 1.05,
                                color: 'text-blue-600'
                              },
                              {
                                label: 'Competitive Floor',
                                value: matches.length > 0
                                  ? Math.min(...matches.map((m: any) => m.estimatedCost || m.recommendedPrice || 0))
                                  : (cargo.offeredPrice || 0) * 0.88,
                                color: 'text-emerald-600'
                              }
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                <span className={`text-sm font-black ${item.color}`}>{formatCurrency(item.value, cargo.currencyCode)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
            }
        </div>
      </div>
    </BottomSheet>

    {/* Document Preview Modal */}
    {previewDoc && (
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        documentId={previewDoc!.id}
        title={previewDoc!.title}
        fileName={previewDoc!.fileName}
      />
    )}

    {/* Document Upload Modal */}
    <DocumentUploadModal
      isOpen={showUploadModal}
      onClose={() => setShowUploadModal(false)}
      onSuccess={() => refetchDocuments()}
      initialEntityType="CARGO"
      initialEntityId={cargoId}
      lockEntity={true}
    />

    {/* Confirmation Dialog */}
    {DialogComponent}
  </>
);
};

export default CargoDetailsModal;