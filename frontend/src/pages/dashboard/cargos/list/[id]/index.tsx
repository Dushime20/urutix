"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Package,
  Check,
  Star,
  Send,
  Download,
} from "lucide-react";
import type { Cargo } from "@/types/cargo";
import { loadsAPI } from "@/services/load";
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
                        <Button size="sm" className="h-9 px-4 rounded-lg">
                          <Download className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 px-3 rounded-lg"
                        >
                          Download All
                        </Button>
                      </div>
                    </div>

                    {/* Document Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 text-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-xs font-semibold">
                            I
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Invoices
                        </p>
                        <p className="text-xs text-gray-500">3 documents</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 text-center">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-xs font-semibold">
                            R
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Receipts
                        </p>
                        <p className="text-xs text-gray-500">2 documents</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200 text-center">
                        <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-xs font-semibold">
                            C
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Contracts
                        </p>
                        <p className="text-xs text-gray-500">1 document</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200 text-center">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white text-xs font-semibold">
                            C
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Compliance
                        </p>
                        <p className="text-xs text-gray-500">4 documents</p>
                      </div>
                    </div>

                    {/* Document List */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            All Documents
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Input
                              placeholder="Search documents..."
                              className="w-64 h-9 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                            />
                            <Select value="all" onValueChange={() => {}}>
                              <SelectTrigger className="h-9 border-gray-200">
                                <SelectValue placeholder="Select Format" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="invoice">
                                  Invoices
                                </SelectItem>
                                <SelectItem value="receipt">
                                  Receipts
                                </SelectItem>
                                <SelectItem value="contract">
                                  Contracts
                                </SelectItem>
                                <SelectItem value="compliance">
                                  Compliance
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {/* Document Items */}
                        {[
                          {
                            id: "doc1",
                            name: "Invoice_001.pdf",
                            size: "2.3 MB",
                            type: "blue",
                            uploaded: "2 days ago",
                          },
                          {
                            id: "doc2",
                            name: "Delivery_Receipt.pdf",
                            size: "1.8 MB",
                            type: "green",
                            uploaded: "1 day ago",
                          },
                          {
                            id: "doc3",
                            name: "Transport_Contract.pdf",
                            size: "3.1 MB",
                            type: "purple",
                            uploaded: "3 days ago",
                          },
                        ].map((doc) => (
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
                                      setSelectedDocuments([
                                        ...selectedDocuments,
                                        doc.id,
                                      ]);
                                    } else {
                                      setSelectedDocuments(
                                        selectedDocuments.filter(
                                          (id) => id !== doc.id
                                        )
                                      );
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <div
                                  className={`w-8 h-8 bg-${doc.type}-500 rounded-lg flex items-center justify-center`}
                                >
                                  <span className="text-white text-xs font-semibold">
                                    {doc.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {doc.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {doc.size} • Uploaded {doc.uploaded}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg"
                                >
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
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
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download Selected
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3 rounded-lg"
                              >
                                Share Selected
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-9 px-3 rounded-lg"
                              >
                                Delete Selected
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                            <Select value="all" onValueChange={() => {}}>
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
                          ].map((req, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm text-gray-600">
                                {req.label}
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  req.highlight === "green"
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

                  {/* Top Matches */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mr-3"></div>
                      Top Matches
                    </h3>

                    <div className="space-y-4">
                      {[
                        {
                          name: "Premium Transport Co.",
                          matchScore: "94%",
                          rating: "4.8",
                          truckType: "Refrigerated Box Truck",
                          capacity: `${formatWeight(
                            cargo.weight + 500
                          )} / ${formatVolume((cargo.volume || 0) + 200)}`,
                          price: formatCurrency(
                            (cargo.offeredPrice || 0) * 1.1
                          ),
                          color: "green",
                        },
                        {
                          name: "Express Logistics Ltd.",
                          matchScore: "87%",
                          rating: "4.6",
                          truckType: "Flatbed Truck",
                          capacity: `${formatWeight(
                            cargo.weight + 300
                          )} / ${formatVolume((cargo.volume || 0) + 150)}`,
                          price: formatCurrency(
                            (cargo.offeredPrice || 0) * 0.95
                          ),
                          color: "blue",
                        },
                        {
                          name: "Reliable Haulage",
                          matchScore: "82%",
                          rating: "4.4",
                          truckType: "Box Truck",
                          capacity: `${formatWeight(
                            cargo.weight + 200
                          )} / ${formatVolume((cargo.volume || 0) + 100)}`,
                          price: formatCurrency(
                            (cargo.offeredPrice || 0) * 0.88
                          ),
                          color: "yellow",
                        },
                      ].map((match, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-3 h-3 bg-${match.color}-500 rounded-full`}
                              ></div>
                              <span className="font-medium text-gray-900">
                                {match.name}
                              </span>
                              <span
                                className={`px-2 py-1 bg-${match.color}-100 text-${match.color}-800 text-xs rounded-full font-medium`}
                              >
                                {match.matchScore} Match
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm text-gray-600">
                                {match.rating}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div>
                              <span className="text-xs text-gray-500">
                                Truck Type
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {match.truckType}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Capacity
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {match.capacity}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                Price
                              </span>
                              <p className="text-sm font-medium text-gray-900">
                                {match.price}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button size="sm" className="h-8 px-3 rounded-lg">
                              Contact
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 rounded-lg"
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 rounded-lg"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
                    className={`p-1 transition-colors ${
                      rating >= star
                        ? "text-yellow-500"
                        : "text-gray-300 hover:text-yellow-400"
                    }`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating >= star ? "fill-current" : ""
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
