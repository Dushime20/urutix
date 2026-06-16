"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Package,
  Check,
  Star,
  Send,
  Download,
  Upload,
  Briefcase,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  User,
  ExternalLink,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Cargo } from "@/types/cargo";
import { loadsAPI } from "@/services/load";
import { documentApi } from "@/services/documents/documentApi";
import { cargoOwnerAPI } from "@/services/cargoOwnerAPI";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";

// Import new components
import CargoDetailsHeader from "../components/CargoDetailsModal/CargoDetailsHeader";
import CargoDetailsTabs from "../components/CargoDetailsModal/CargoDetailsTabs";
import CargoOverviewSection from "../components/CargoDetailsModal/CargoOverviewSection";
import CargoTrackingSection from "../components/CargoDetailsModal/CargoTrackingSection";
import {
  formatCurrency,
  formatVolume,
  formatWeight,
  getCargoTypeDisplayName,
} from "../utils";
import { useParams } from "react-router-dom";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";

// ─── AssignedBrokerCard ──────────────────────────────────────────────────────
const AssignedBrokerCard: React.FC<{ cargo: any }> = ({ cargo }) => {
  if (!cargo?.brokerId && !cargo?.broker) return null;

  const broker = cargo.broker || {};
  const profile = broker.profile || {};

  const brokerName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : profile.firstName || profile.lastName || broker.email || "Assigned Broker";

  const companyName = profile.companyName;
  const email = broker.email;
  const phone = broker.phone;
  const status = broker.status;
  const brokerId = broker.id || cargo.brokerId;
  const assignedAt = cargo.updatedAt;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    SUSPENDED: "bg-red-100 text-red-700",
    INACTIVE: "bg-gray-100 text-gray-600",
    PENDING_VERIFICATION: "bg-yellow-100 text-yellow-700",
  };
  const statusLabel = status ? status.replace(/_/g, " ") : "Active";
  const statusClass = statusColors[status] || "bg-emerald-100 text-emerald-700";

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden">
      {/* Header band */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-black text-purple-200 uppercase tracking-widest">Assigned Broker</p>
          <p className="text-base font-black text-white leading-tight">{brokerName}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {companyName && (
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company</p>
              <p className="text-sm font-semibold text-gray-900">{companyName}</p>
            </div>
          </div>
        )}

        {email && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
              <a href={`mailto:${email}`} className="text-sm font-semibold text-purple-600 hover:underline break-all">
                {email}
              </a>
            </div>
          </div>
        )}

        {phone && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</p>
              <a href={`tel:${phone}`} className="text-sm font-semibold text-gray-900 hover:text-purple-600">
                {phone}
              </a>
            </div>
          </div>
        )}

        {brokerId && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Broker ID</p>
              <p className="text-xs font-mono text-gray-600 break-all">{brokerId}</p>
            </div>
          </div>
        )}

        {assignedAt && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assignment Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(assignedAt).toLocaleDateString(undefined, {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 pb-4 flex flex-wrap gap-2">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-black rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Contact Broker
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-purple-200 text-purple-700 text-xs font-black rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Broker
          </a>
        )}
      </div>

      {/* Footer notice */}
      <div className="px-6 py-3 bg-purple-50 border-t border-purple-100">
        <p className="text-[10px] text-purple-600 font-semibold">
          This cargo is managed by the assigned broker. Contact them for status updates and operational changes.
        </p>
      </div>
    </div>
  );
};

// ─── TopMatchCandidates ────────────────────────────────────────────────────
// Fetches and renders the top-5 POTENTIAL match candidates for a load.
// These are the engine-scored candidates the cargo owner reviews and selects from.
const rankBorder = [
  'border-yellow-400',
  'border-slate-300',
  'border-amber-500',
  'border-green-400',
  'border-blue-300',
];
const rankLabel = ['#1 Best', '#2', '#3', '#4', '#5'];

const TopMatchCandidates: React.FC<{ cargoId: string; offeredPrice?: number }> = ({ cargoId, offeredPrice }) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (!cargoId) return;
    setLoading(true);
    cargoOwnerAPI.getCandidatesForLoad(cargoId)
      .then((res: any) => {
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        setCandidates(data);
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, [cargoId]);

  const handleSelect = async (truckId: string) => {
    setRequesting(truckId);
    try {
      await cargoOwnerAPI.requestMatch(cargoId, truckId);
      toast.success('Match request sent to truck owner');
      // Refresh list so the requested truck shows updated status
      const res: any = await cargoOwnerAPI.getCandidatesForLoad(cargoId);
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setCandidates(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send match request');
    } finally {
      setRequesting(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" />
          <h3 className="text-lg font-semibold text-gray-900">Top Match Candidates</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-sm text-gray-500">Loading candidates…</span>
        </div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" />
          <h3 className="text-lg font-semibold text-gray-900">Top Match Candidates</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">No candidates yet. Run Smart Matching to find trucks.</p>
          <a
            href={`/dashboard/smart-matching?cargoId=${cargoId}`}
            className="mt-3 inline-block text-xs font-semibold text-blue-600 hover:underline"
          >
            Go to Smart Matching →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full" />
          <h3 className="text-lg font-semibold text-gray-900">
            Top {candidates.length} Match Candidates
          </h3>
        </div>
        <a
          href={`/dashboard/smart-matching?cargoId=${cargoId}`}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Run new match →
        </a>
      </div>

      <div className="space-y-3">
        {candidates.map((c: any, idx: number) => {
          const matchDetails = c.matchDetails || {};
          const truck = c.truck || {};
          const owner = truck.owner || {};
          const profile = owner.profile || {};
          const ownerName = c.ownerName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown Carrier';
          const score = Math.round((c.score || matchDetails.overallScore || 0) * 100);
          const estimatedCost = matchDetails.estimatedCost ?? matchDetails.recommendedPrice ?? 0;
          const distanceKm = matchDetails.distanceKm ?? 0;
          const isRequested = c.status === 'REQUESTED' || c.status === 'ACCEPTED';

          return (
            <div
              key={c.id}
              className={`rounded-xl border-2 ${rankBorder[idx] || 'border-gray-200'} bg-gradient-to-r from-gray-50 to-white p-4`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      {rankLabel[idx]}
                    </span>
                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      {score}% match
                    </span>
                    {isRequested && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {c.status === 'ACCEPTED' ? '✓ Accepted' : 'Requested'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{ownerName}</p>
                  <p className="text-xs text-gray-500">
                    {truck.truckType || 'Truck'} · {truck.make || ''} {truck.model || ''} · {truck.plateNumber || ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {estimatedCost > 0 ? formatCurrency(estimatedCost) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">{distanceKm > 0 ? `${distanceKm.toLocaleString()} km` : ''}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                {truck.hasGps && <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">GPS</span>}
                {truck.hasRefrigeration && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Fridge</span>}
                {truck.hasHazmatPermit && <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Hazmat</span>}
                {truck.averageRating > 0 && (
                  <span className="text-[9px] font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded border border-yellow-200">
                    ★ {Number(truck.averageRating).toFixed(1)}
                  </span>
                )}
                {c.ownerVerified && <span className="text-[9px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Verified</span>}
              </div>

              {!isRequested && (
                <Button
                  size="sm"
                  className="w-full h-8 text-xs font-bold"
                  onClick={() => handleSelect(truck.id)}
                  disabled={requesting === truck.id}
                >
                  {requesting === truck.id ? 'Sending…' : 'Select This Truck'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
const CargoDetails = () => {
  const { cargoId: id } = useParams();
  const cargoId = useMemo(() => id || "", [id]);

  const [activeTab, setActiveTab] = useSearchParamsState<
    "overview" | "tracking" | "documents" | "history" | "matching"
  >("t", "overview");

  // Additional state for interactive features
  // const [isEditing, setIsEditing] = useState(false);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  // const [commentText, setCommentText] = useState("");
  // const [showCommentForm, setShowCommentForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);

  const {
    data: cargoResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cargo", cargoId],
    queryFn: async () => {
      try {
        // Try to get enriched location data first
        const enrichedResponse = await loadsAPI.getCargoWithEnrichedLocations(
          cargoId!
        );
        console.log("📦 Enriched cargo data:", enrichedResponse);
        return enrichedResponse;
      } catch (error) {
        console.log(
          "⚠️ Enriched data not available, falling back to regular cargo data"
        );
        // Fallback to regular cargo data
        return loadsAPI.getById(cargoId!);
      }
    },
    enabled: !!cargoId,
  });

  // Fetch documents for this cargo
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ["cargo-documents", cargoId],
    queryFn: async () => {
      if (!cargoId) return [];
      try {
        console.log('🔍 Fetching documents for cargo:', cargoId);
        // Fetch documents stored under both CARGO and LOAD entity types
        // (some documents may have been uploaded with entityType 'LOAD' historically)
        const [cargoDocs, loadDocs] = await Promise.all([
          documentApi.getDocumentsByEntity("CARGO", cargoId).catch(() => []),
          documentApi.getDocumentsByEntity("LOAD", cargoId).catch(() => []),
        ]);
        // Merge and deduplicate by document ID
        const allDocs = [...(cargoDocs || []), ...(loadDocs || [])];
        const uniqueDocs = allDocs.filter(
          (doc, index, self) => self.findIndex(d => d.id === doc.id) === index
        );
        console.log('📄 Fetched documents for cargo:', uniqueDocs);
        console.log('📄 Number of documents:', uniqueDocs?.length || 0);
        return uniqueDocs || [];
      } catch (error) {
        console.error("❌ Failed to fetch documents:", error);
        // Return empty array instead of throwing to prevent UI break
        return [];
      }
    },
    enabled: !!cargoId,
    refetchOnWindowFocus: false,
  });

  // Log documents data for debugging
  useEffect(() => {
    if (documentsData) {
      console.log('📊 Documents data updated:', {
        count: documentsData.length,
        documents: documentsData,
      });
    }
    if (documentsError) {
      console.error('📊 Documents error:', documentsError);
    }
  }, [documentsData, documentsError]);

  // Extract cargo from response - handle both enriched and regular response structures
  const cargo = useMemo<Cargo | null>(() => {
    if (cargoResponse?.data?.cargo) return cargoResponse.data.cargo;
    if (cargoResponse?.cargo) return cargoResponse.cargo;
    if (cargoResponse?.data) return cargoResponse.data;
    if (cargoResponse) return cargoResponse;

    return null;
  }, [cargoResponse]);

  // const requirements = useMemo(() => {
  //   return getSpecialRequirements?.(cargo);
  // }, [cargo]);

  // Handler functions
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as any);
  };

  const handleAdvancedOptionsToggle = () => {
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleNotificationToggle = () => {
    setNotificationEnabled(!notificationEnabled);
  };

  const handleTrackingToggle = () => {
    setIsTrackingEnabled(!isTrackingEnabled);
  };

  // const handleEditToggle = () => {
  //   setIsEditing(!isEditing);
  // };

  // const handleViewDocuments = () => {
  //   setActiveTab("documents");
  // };

  // const handleCommentFormToggle = () => {
  //   setShowCommentForm(!showCommentForm);
  // };

  // const handleCommentTextChange = (text: string) => {
  //   setCommentText(text);
  // };

  // const handleCommentSubmit = () => {
  //   // Handle comment submission
  //   setCommentText("");
  //   setShowCommentForm(false);
  // };

  // const handleRatingModalOpen = () => {
  //   setShowRatingModal(true);
  // };

  return (
    <>
      <div className="w-full p-0 gap-0">
        <div className="sticky top-6 bg-gray-50 shadow-[0_-3rem_0_2rem] shadow-gray-50 z-10">
          {/* Header */}
          <CargoDetailsHeader
            cargo={cargo}
            cargoId={cargoId}
            isBookmarked={isBookmarked}
            notificationEnabled={notificationEnabled}
            onBookmarkToggle={handleBookmarkToggle}
            onShare={handleShare}
            onExport={handleExport}
            onNotificationToggle={handleNotificationToggle}
          />

          {/* Tabs */}
          <CargoDetailsTabs
            activeTab={activeTab}
            showAdvancedOptions={showAdvancedOptions}
            autoRefresh={autoRefresh}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
            onTabChange={handleTabChange}
            onAdvancedOptionsToggle={handleAdvancedOptionsToggle}
            onAutoRefreshToggle={handleAutoRefreshToggle}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Content */}
        <div className="">
          {isLoading ? (
            <div className="flex items-center justify-center p-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Loading cargo details...
                </h3>
                <p className="text-gray-600">
                  Please wait while we fetch the information
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-red-800 mb-3">
                  Error Loading Cargo
                </h3>
                <p className="text-red-600 mb-6">{error.message}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : !cargo ? (
            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center max-w-md mx-auto">
                <Package className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-yellow-800 mb-3">
                  Cargo Not Found
                </h3>
                <p className="text-yellow-600">
                  The requested cargo shipment could not be found.
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-6 px-px space-y-6">
              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <CargoOverviewSection cargo={cargo} />
                  {/* Assigned Broker Section — only shown when a broker is assigned */}
                  <AssignedBrokerCard cargo={cargo} />
                  {/* <CargoActionsSection
                    isEditing={isEditing}
                    isTrackingEnabled={isTrackingEnabled}
                    showCommentForm={showCommentForm}
                    commentText={commentText}
                    onEditToggle={handleEditToggle}
                    onViewDocuments={handleViewDocuments}
                    onTrackingToggle={handleTrackingToggle}
                    onCommentFormToggle={handleCommentFormToggle}
                    onCommentTextChange={handleCommentTextChange}
                    onCommentSubmit={handleCommentSubmit}
                    onRatingModalOpen={handleRatingModalOpen}
                  /> */}
                </div>
              )}

              {activeTab === "tracking" && (
                <CargoTrackingSection
                  isTrackingEnabled={isTrackingEnabled}
                  onTrackingToggle={handleTrackingToggle}
                />
              )}

              {activeTab === "documents" && (
                <div className="space-y-6">
                  {/* Document Management */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mr-3"></div>
                        Documents
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="h-9 px-4 rounded-lg"
                          onClick={() => setShowUploadModal(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                        {documentsData && documentsData.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 rounded-lg"
                            onClick={() => {
                              // Download all documents
                              documentsData.forEach((doc: any) => {
                                if (doc.fileUrl) {
                                  window.open(doc.fileUrl, '_blank');
                                }
                              });
                            }}
                          >
                            Download All
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Loading State */}
                    {isLoadingDocuments && (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!isLoadingDocuments && (!documentsData || documentsData.length === 0) && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Yet</h4>
                        <p className="text-sm text-gray-500 mb-4">
                          Upload documents related to this cargo shipment
                        </p>
                        <Button
                          size="sm"
                          onClick={() => setShowUploadModal(true)}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload First Document
                        </Button>
                      </div>
                    )}

                    {/* Document List */}
                    {!isLoadingDocuments && documentsData && documentsData.length > 0 && (
                      <>
                        {/* Document Categories Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          {[
                            { category: 'CARGO', label: 'Cargo Docs', color: 'blue' },
                            { category: 'INVOICE', label: 'Invoices', color: 'green' },
                            { category: 'COMPLIANCE', label: 'Compliance', color: 'orange' },
                            { category: 'OTHER', label: 'Other', color: 'purple' },
                          ].map(({ category, label, color }) => {
                            const count = documentsData.filter((doc: any) => doc.category === category).length;
                            return (
                              <div key={category} className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-lg p-4 border border-${color}-200 text-center`}>
                                <div className={`w-8 h-8 bg-${color}-500 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                                  <span className="text-white text-xs font-semibold">
                                    {label.charAt(0)}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900">{label}</p>
                                <p className="text-xs text-gray-500">{count} document{count !== 1 ? 's' : ''}</p>
                              </div>
                            );
                          })}
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200">
                          <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">
                                All Documents ({documentsData.length})
                              </h4>
                              <div className="flex items-center space-x-2">
                                <Input
                                  placeholder="Search documents..."
                                  className="w-64 h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                                  <SelectTrigger className="h-9 border-gray-200">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="CARGO">Cargo</SelectItem>
                                    <SelectItem value="INVOICE">Invoices</SelectItem>
                                    <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>

                          <div className="divide-y divide-gray-200">
                            {documentsData
                              .filter((doc: any) => {
                                if (searchQuery && !doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                  !doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase())) {
                                  return false;
                                }
                                if (selectedFilter !== 'all' && doc.category !== selectedFilter) {
                                  return false;
                                }
                                return true;
                              })
                              .map((doc: any) => {
                                const categoryColors: Record<string, string> = {
                                  CARGO: 'blue',
                                  INVOICE: 'green',
                                  COMPLIANCE: 'orange',
                                  OTHER: 'purple',
                                };
                                const color = categoryColors[doc.category] || 'gray';

                                return (
                                  <div
                                    key={doc.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={selectedDocuments.includes(doc.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedDocuments([...selectedDocuments, doc.id]);
                                            } else {
                                              setSelectedDocuments(
                                                selectedDocuments.filter((id) => id !== doc.id)
                                              );
                                            }
                                          }}
                                          className="rounded border-gray-300"
                                        />
                                        <div className={`w-8 h-8 bg-${color}-500 rounded-lg flex items-center justify-center`}>
                                          <span className="text-white text-xs font-semibold">
                                            {(doc.title || doc.fileName).charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">
                                            {doc.title || doc.fileName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB •
                                            Uploaded {new Date(doc.createdAt).toLocaleDateString()} •
                                            {doc.status === 'VERIFIED' && <span className="text-green-600 ml-1">✓ Verified</span>}
                                            {doc.status === 'PENDING' && <span className="text-yellow-600 ml-1">⏳ Pending</span>}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 rounded-lg"
                                          onClick={() => {
                                            if (doc.fileUrl) {
                                              window.open(doc.fileUrl, '_blank');
                                            }
                                          }}
                                          title="View document"
                                        >
                                          <Package className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0 rounded-lg"
                                          onClick={() => {
                                            if (doc.fileUrl) {
                                              window.open(doc.fileUrl, '_blank');
                                            }
                                          }}
                                          title="Download document"
                                        >
                                          <Download className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>

                          {/* Bulk Actions */}
                          {selectedDocuments.length > 0 && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                  {selectedDocuments.length} document(s) selected
                                </p>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 rounded-lg"
                                    onClick={() => {
                                      selectedDocuments.forEach((docId) => {
                                        const doc = documentsData.find((d: any) => d.id === docId);
                                        if (doc?.fileUrl) {
                                          window.open(doc.fileUrl, '_blank');
                                        }
                                      });
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Selected
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-3 rounded-lg"
                                    onClick={() => setSelectedDocuments([])}
                                  >
                                    Clear Selection
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-6">
                  {/* History Overview */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-3"></div>
                        Cargo History
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-lg"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-lg"
                        >
                          Filter
                        </Button>
                      </div>
                    </div>

                    {/* History Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      {[
                        {
                          icon: "🕒",
                          label: "Total Events",
                          value: "24 events",
                          color: "purple",
                        },
                        {
                          icon: "📊",
                          label: "Status Changes",
                          value: "8 changes",
                          color: "blue",
                        },
                        {
                          icon: "💬",
                          label: "Comments",
                          value: "12 comments",
                          color: "green",
                        },
                        {
                          icon: "👥",
                          label: "Participants",
                          value: "6 users",
                          color: "orange",
                        },
                      ].map((stat, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 text-center"
                        >
                          <div className="text-2xl mb-2">{stat.icon}</div>
                          <p className="text-sm font-medium text-gray-900">
                            {stat.label}
                          </p>
                          <p className="text-xs text-gray-500">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            Activity Timeline
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Select value="all" onValueChange={() => { }}>
                              <SelectTrigger className="h-9 border-gray-200">
                                <SelectValue placeholder="Select Format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                <SelectItem value="status">
                                  Status Changes
                                </SelectItem>
                                <SelectItem value="comments">
                                  Comments
                                </SelectItem>
                                <SelectItem value="updates">Updates</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Search events..."
                              className="w-48 h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {[
                          {
                            status: "delivered",
                            title: "Cargo delivered successfully",
                            description:
                              "Cargo was delivered to the final destination in Nairobi, Kenya",
                            time: "2 hours ago",
                            type: "Status Change",
                            user: "John Doe",
                            color: "emerald",
                          },
                          {
                            status: "comment",
                            title: "Comment added",
                            description:
                              '"Driver reported minor delay due to traffic. ETA updated to 2 hours."',
                            time: "4 hours ago",
                            type: "Comment",
                            user: "Jane Smith",
                            color: "blue",
                          },
                          {
                            status: "picked",
                            title: "Cargo picked up",
                            description:
                              "Cargo was picked up from the pickup location in Kigali, Rwanda",
                            time: "6 hours ago",
                            type: "Status Change",
                            user: "Driver App",
                            color: "yellow",
                          },
                        ].map((event, index) => (
                          <div
                            key={index}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-3 h-3 bg-${event.color}-500 rounded-full mt-2 flex-shrink-0`}
                              ></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {event.title}
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {event.time}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {event.description}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`px-2 py-1 bg-${event.color}-100 text-${event.color}-800 text-xs rounded-full`}
                                  >
                                    {event.type}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    by {event.user}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Load More */}
                      <div className="p-4 border-t border-gray-200 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-lg"
                        >
                          Load More History
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "matching" && (
                <div className="space-y-6">
                  {/* Matching Overview */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mr-3"></div>
                      Matching Overview
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {[
                        {
                          label: "Total Matches",
                          value: "12",
                          color: "green",
                          icon: "🎯",
                        },
                        {
                          label: "Active Bids",
                          value: "5",
                          color: "blue",
                          icon: "🏆",
                        },
                        {
                          label: "Best Match Score",
                          value: "94%",
                          color: "purple",
                          icon: "📈",
                        },
                      ].map((stat, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                {stat.label}
                              </p>
                              <p
                                className={`text-2xl font-bold text-${stat.color}-600`}
                              >
                                {stat.value}
                              </p>
                            </div>
                            <div className="text-2xl">{stat.icon}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 mb-6">
                      <Button size="sm" className="h-9 px-4 rounded-lg">
                        Find Matches
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg"
                      >
                        Filter Matches
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 rounded-lg"
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>

                  {/* Matching Criteria */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mr-3"></div>
                      Matching Criteria
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                          Cargo Requirements
                        </h4>
                        <div className="space-y-3">
                          {[
                            {
                              label: "Weight Capacity",
                              value: `≥ ${formatWeight(cargo.weight)}`,
                            },
                            {
                              label: "Volume Capacity",
                              value: `≥ ${formatVolume(cargo.volume || 0)}`,
                            },
                            {
                              label: "Cargo Type",
                              value: getCargoTypeDisplayName(cargo.cargoType),
                            },
                            ...(cargo.requiresRefrigeration
                              ? [
                                {
                                  label: "Refrigeration",
                                  value: "Required",
                                  highlight: "green",
                                },
                              ]
                              : []),
                            ...(cargo.isHazardous
                              ? [
                                {
                                  label: "Hazmat Permit",
                                  value: "Required",
                                  highlight: "red",
                                },
                              ]
                              : []),
                          ].map((req: any, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm text-gray-600">
                                {req.label}
                              </span>
                              <span
                                className={`text-sm font-medium ${req.highlight === "green"
                                  ? "text-green-600"
                                  : req.highlight === "red"
                                    ? "text-red-600"
                                    : "text-gray-900"
                                  }`}
                              >
                                {req.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                          Route Preferences
                        </h4>
                        <div className="space-y-3">
                          {[
                            {
                              label: "Pickup Location",
                              value:
                                cargo.pickupLocation?.name || "Kigali, Rwanda",
                            },
                            {
                              label: "Delivery Location",
                              value:
                                cargo.deliveryLocation?.name ||
                                "Nairobi, Kenya",
                            },
                            {
                              label: "Pickup Date",
                              value: new Date(
                                cargo.pickupDate
                              ).toLocaleDateString(),
                            },
                            {
                              label: "Delivery Date",
                              value: new Date(
                                cargo.deliveryDate
                              ).toLocaleDateString(),
                            },
                          ].map((route, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm text-gray-600">
                                {route.label}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {route.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Match Candidates — hidden when broker is managing this cargo */}
                  {!cargo.brokerId && !cargo.broker && (
                    <TopMatchCandidates cargoId={cargoId} offeredPrice={cargo.offeredPrice} />
                  )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="w-full max-w-lg p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-gray-100">
              <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Upload Document
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-5">
              {/* Drop zone */}
              <div
                onClick={() => !isUploading && uploadFileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isUploading
                  ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                  : "border-blue-300 hover:border-blue-500 hover:bg-blue-50/50 bg-blue-50/30"
                  }`}
              >
                <input
                  ref={uploadFileRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  disabled={isUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !cargoId) return;

                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File size exceeds 10MB limit");
                      return;
                    }

                    setIsUploading(true);
                    try {
                      await documentApi.createDocument(
                        {
                          entityType: "CARGO",
                          entityId: cargoId,
                          documentType: "OTHER",
                          category: "CARGO",
                          title: file.name,
                        },
                        file
                      );
                      toast.success("Document uploaded successfully!");
                      refetchDocuments();
                      setShowUploadModal(false);
                    } catch (error) {
                      console.error("Upload error:", error);
                      toast.error("Failed to upload document");
                    } finally {
                      setIsUploading(false);
                      if (uploadFileRef.current) uploadFileRef.current.value = "";
                    }
                  }}
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {isUploading ? "Uploading..." : "Click to select a file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, PNG, JPG, DOC up to 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="h-10 px-4 rounded-lg"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
          <DialogContent className="w-full max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Share Cargo Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="share-email"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Email Address
                </Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="Enter email address"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="h-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => {
                    setShareEmail("");
                    setShowShareModal(false);
                  }}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 h-10 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent className="w-full max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Export Cargo Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="export-format"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Export Format
                </Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV File</SelectItem>
                    <SelectItem value="json">JSON Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 h-10 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
          <DialogContent className="w-full max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Rate This Cargo
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-colors ${rating >= star
                      ? "text-yellow-500"
                      : "text-gray-300 hover:text-yellow-400"
                      }`}
                  >
                    <Star
                      className={`w-8 h-8 ${rating >= star ? "fill-current" : ""
                        }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => {
                    setRating(0);
                    setShowRatingModal(false);
                  }}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Submit Rating
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 h-10 border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CargoDetails;