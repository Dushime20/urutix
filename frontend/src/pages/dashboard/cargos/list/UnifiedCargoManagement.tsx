import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  List,
  Activity,
  Gavel,
  Package,
  FileText,
} from "lucide-react";
import { CargoLoadConfirmation } from "@/components/LoanRequest";
import CargoDetailsModal from "@/components/CargoDetailsModal";
import { loadsAPI } from "@/services/load";
import EnhancedCargoForm from "../create/components/form";
import BiddingDashboard from "@/components/Bidding/BiddingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import LoadItem from "./components/loadItem";
import TemplateSelectionModal from "../create/components/TemplateSelectionModal";
import type { CargoFormSchemaType } from "../create/components/form/cargoFormSchema";
// Removed unused imports - statistics are now in analytics page
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import type { ICargoBody, ICargoResponse } from "../create/types/cargo";
import FilterSelect from "@/components/common/FilterSelect";
import { FaLayerGroup, FaBox } from "react-icons/fa";
import logoUrutiX from "@/assets/logo-urutix.svg";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { loadStatusWebSocket } from "@/services/loadStatusWebSocket";
import { AssignBrokerModal } from "@/components/CargoDashboard/AssignBrokerModal";

type TabType = "all" | "active" | "create" | "template" | "bidding";

const UnifiedCargoManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm, DialogComponent } = useConfirmDialog();

  // Determine initial tab based on route and query params
  const getInitialTab = (): TabType => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam === "template") return "template";
    if (location.pathname.includes("/cargos/create")) return "create";
    if (location.pathname.includes("/cargos/active")) return "active";
    if (location.pathname.includes("/bidding")) return "bidding";
    return "all";
  };

  const [selectedTemplate, setSelectedTemplate] = useState<Partial<CargoFormSchemaType> | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());

  // Update tab when route or query params changes
  useEffect(() => {
    const tab = getInitialTab();
    setActiveTab(tab);

    // Handle status filter from query params
    const searchParams = new URLSearchParams(location.search);
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [location.pathname, location.search]);

  // Update route when tab changes (for navigation)
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Extract base path (either /dashboard or /cargo-owner)
    const pathParts = location.pathname.split("/").filter(Boolean);
    const basePath = pathParts[0] ? `/${pathParts[0]}` : "/dashboard";

    if (tab === "create") {
      navigate(`${basePath}/cargos/create`, { replace: true });
    } else if (tab === "template") {
      // Open template selection modal immediately
      setShowTemplateModal(true);
      // Don't navigate, keep on current route
    } else if (tab === "active") {
      navigate(`${basePath}/cargos/active`, { replace: true });
    } else if (tab === "bidding") {
      navigate(`${basePath}/bidding`, { replace: true });
    } else {
      navigate(`${basePath}/cargos/list`, { replace: true });
    }
  };

  const handleTemplateSelected = (template: Partial<CargoFormSchemaType>) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    setActiveTab("create");
    // Navigate to create tab with template data
    const pathParts = location.pathname.split("/").filter(Boolean);
    const basePath = pathParts[0] ? `/${pathParts[0]}` : "/dashboard";
    navigate(`${basePath}/cargos/create`, { replace: true });
  };

  // Auto-open template modal when template tab becomes active
  useEffect(() => {
    if (activeTab === "template" && !showTemplateModal) {
      setShowTemplateModal(true);
    }
  }, [activeTab, showTemplateModal]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cargoTypeFilter, setCargoTypeFilter] = useState("");
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadConfirmationOpen, setIsLoadConfirmationOpen] = useState(false);
  const [selectedCargoForConfirmation, setSelectedCargoForConfirmation] =
    useState<any>(null);
  const [editingCargo, setEditingCargo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Broker assignment state
  const [showAssignBrokerModal, setShowAssignBrokerModal] = useState(false);
  const [selectedLoadForBroker, setSelectedLoadForBroker] = useState<any>(null);

  const queryClient = useQueryClient();
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  const {
    data: loadsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loads", searchTerm, statusFilter, cargoTypeFilter],
    queryFn: async () => {
      // Use the regular /loads endpoint which includes broker data
      const response = await loadsAPI.getAll({
        search: searchTerm,
        status: statusFilter || undefined,
        cargoType: cargoTypeFilter || undefined,
      });
      return response;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Extract loads array from response
  const loadsData = useMemo(() => {
    if (loadsResponse?.data?.cargos) {
      return loadsResponse.data.cargos;
    }
    if (loadsResponse?.data?.items) {
      return loadsResponse.data.items;
    }
    if (Array.isArray(loadsResponse?.data)) {
      return loadsResponse.data;
    }
    if (Array.isArray(loadsResponse)) {
      return loadsResponse;
    }
    return [];
  }, [loadsResponse]);

  // Real-time status updates via WebSocket
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token || !loadsData || loadsData.length === 0) {
      return;
    }

    // Connect to WebSocket
    loadStatusWebSocket.connect(token).catch((error) => {
      console.warn('Failed to connect to load status WebSocket:', error);
      // Continue without WebSocket - not critical
    });

    // Subscribe to status updates for all loads
    loadsData.forEach((load: any) => {
      if (load.id) {
        const unsubscribe = loadStatusWebSocket.onStatusUpdate(load.id, (update) => {
          console.log(`📦 Real-time status update for load ${update.loadId}: ${update.status}`);

          // Update the query cache with the new status
          queryClient.setQueryData(
            ["loads", searchTerm, statusFilter, cargoTypeFilter],
            (oldData: any) => {
              if (!oldData) return oldData;

              // Helper function to update load in nested structures
              const updateLoadInData = (data: any): any => {
                if (Array.isArray(data)) {
                  return data.map((item: any) =>
                    item.id === update.loadId
                      ? { ...item, status: update.status, updatedAt: update.timestamp }
                      : item
                  );
                }
                if (data?.data?.cargos) {
                  return {
                    ...data,
                    data: {
                      ...data.data,
                      cargos: data.data.cargos.map((item: any) =>
                        item.id === update.loadId
                          ? { ...item, status: update.status, updatedAt: update.timestamp }
                          : item
                      ),
                    },
                  };
                }
                if (data?.data?.items) {
                  return {
                    ...data,
                    data: {
                      ...data.data,
                      items: data.data.items.map((item: any) =>
                        item.id === update.loadId
                          ? { ...item, status: update.status, updatedAt: update.timestamp }
                          : item
                      ),
                    },
                  };
                }
                if (data?.data && Array.isArray(data.data)) {
                  return {
                    ...data,
                    data: data.data.map((item: any) =>
                      item.id === update.loadId
                        ? { ...item, status: update.status, updatedAt: update.timestamp }
                        : item
                    ),
                  };
                }
                return data;
              };

              return updateLoadInData(oldData);
            }
          );

          // Show a subtle notification for status changes
          toast.success(`Cargo "${load.title || 'Untitled'}" status updated to ${update.status}`, {
            duration: 3000,
            icon: '📦',
          });
        });

        // Store unsubscribe function
        unsubscribeRefs.current.set(load.id, unsubscribe);
      }
    });

    // Cleanup on unmount or when loads change
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current.clear();

      // Unsubscribe from all loads
      loadsData.forEach((load: any) => {
        if (load.id) {
          loadStatusWebSocket.unsubscribeFromLoad(load.id);
        }
      });
    };
  }, [loadsData, queryClient, searchTerm, statusFilter, cargoTypeFilter]);

  // Filter for active shipments
  const activeLoads = useMemo(() => {
    return loadsData.filter(
      (load: any) =>
        load.status === "IN_TRANSIT" ||
        load.status === "ASSIGNED" ||
        load.status === "PUBLISHED"
    );
  }, [loadsData]);

  // Filter loads based on search and filters
  const filteredLoads = useMemo(() => {
    let filtered = activeTab === "active" ? activeLoads : loadsData;

    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (load: any) => {
          // Primary search by cargo name/title (most important)
          const titleMatch = load.title?.toLowerCase().includes(searchLower);
          // Also search by description, reference/ID, and cargo type as fallback
          const descriptionMatch = load.description?.toLowerCase().includes(searchLower);
          const referenceMatch = load.reference?.toLowerCase().includes(searchLower) ||
            load.id?.toLowerCase().includes(searchLower);
          const cargoTypeMatch = load.cargoType?.toLowerCase().includes(searchLower);

          // Prioritize title match - if title matches, return true immediately
          if (titleMatch) return true;
          // Otherwise check other fields
          return descriptionMatch || referenceMatch || cargoTypeMatch;
        }
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((load: any) => load.status === statusFilter);
    }

    if (cargoTypeFilter) {
      filtered = filtered.filter(
        (load: any) => load.cargoType === cargoTypeFilter
      );
    }

    return filtered;
  }, [loadsData, activeLoads, activeTab, searchTerm, statusFilter, cargoTypeFilter]);

  // Statistics - only calculate what's needed for tab badges
  // Full statistics are available in the analytics page
  const stats = useMemo(() => {
    return {
      total: loadsData.length,
    };
  }, [loadsData]);

  const handleViewClick = (load: any) => {
    setSelectedLoad(load);
    setIsModalOpen(true);
  };

  const handleConfirmLoading = (load: any) => {
    setSelectedCargoForConfirmation(load);
    setIsLoadConfirmationOpen(true);
  };

  const handleDeleteCargo = async (load: any) => {
    const confirmed = await confirm({
      title: "Delete Cargo",
      message: `Are you sure you want to delete "${load.title || "this cargo"}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      await loadsAPI.delete(load.id);
      toast.success("Cargo deleted successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete cargo");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoad(null);
  };

  const handleCloseLoadConfirmation = () => {
    setIsLoadConfirmationOpen(false);
    setSelectedCargoForConfirmation(null);
  };

  const handleCargoSubmit = async (data: ICargoBody): Promise<ICargoResponse> => {
    try {
      const response = await loadsAPI.create(data);
      setActiveTab("all");
      refetch();
      toast.success("Cargo created successfully!");
      return response;
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.join(", ")
          : undefined);
      const message = backendMessage || error?.message || "Failed to create cargo";
      toast.error(message);
      throw new Error(message);
    }
  };

  const handleAssignBroker = (load: any) => {
    console.log('handleAssignBroker called with load:', load);
    setSelectedLoadForBroker(load);
    setShowAssignBrokerModal(true);
  };

  const handleBrokerAssignmentSuccess = async () => {
    console.log('🔄 handleBrokerAssignmentSuccess called - refreshing data...');
    // Refresh loads after successful broker assignment
    try {
      await refetch();
      console.log('✅ Data refreshed successfully');
      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  };

  const handleUnassignBroker = async (load: any) => {
    const confirmed = await confirm({
      title: "Unassign Broker",
      message: `Are you sure you want to unassign the broker from "${load.title || "this cargo"}"?`,
      confirmText: "Unassign",
      cancelText: "Cancel",
      variant: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      const { brokerAPI } = await import('@/services/brokerApi');
      await brokerAPI.unassignBrokerFromLoad(load.id);
      toast.success("Broker unassigned successfully");
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to unassign broker");
    }
  };

  const handleEditCargo = (load: any) => {
    // Transform the load data to match the form schema
    const editData: Partial<CargoFormSchemaType> = {
      id: load.id,
      title: load.title,
      description: load.description,
      weight: load.weight,
      volume: load.volume,
      cargoType: load.cargoType,
      loadType: load.loadType || "FTL",
      equipmentType: load.equipmentType || "DRY_VAN",
      visibility: load.visibility || "public",
      unitsRequired: load.unitsRequired || 1,
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      loadValue: load.loadValue,
      offeredPrice: load.offeredPrice,
      currencyCode: load.currencyCode || "USD",
      paymentTerms: load.paymentTerms || "Net30",
      isFragile: load.isFragile ?? false,
      isHazardous: load.isHazardous ?? false,
      requiresRefrigeration: load.requiresRefrigeration ?? false,
      specialRequirements: load.specialHandlingInstructions,
      autoMatchEnabled: load.autoMatchEnabled ?? true,
      loadingInstructions: load.loadingInstructions,
      unloadingInstructions: load.unloadingInstructions,
      contactPerson: load.contactInfo?.contactPerson,
      contactPhone: load.contactInfo?.contactPhone,
      contactEmail: load.contactInfo?.contactEmail,
      length: Number(load.length) || undefined,
      width: Number(load.width) || undefined,
      height: Number(load.height) || undefined,
      stackableHeight: Number(load.stackableHeight) || undefined,
      isStackable: load.isStackable ?? false,
      temperatureMin: Number(load.temperatureMin) || undefined,
      temperatureMax: Number(load.temperatureMax) || undefined,
      requiresHumidityControl: load.requiresHumidityControl ?? false,
      requiresForklift: load.requiresForklift ?? false,
      requiresCrane: load.requiresCrane ?? false,
      requiresLoadingDock: load.requiresLoadingDock ?? false,
      loadingTimeEstimate: Number(load.loadingTimeEstimate) || undefined,
      unloadingTimeEstimate: Number(load.unloadingTimeEstimate) || undefined,
      hazmatClass: load.hazmatClass,
      hazmatNumber: load.hazmatNumber,
      urgencyLevel: load.urgencyLevel || "NORMAL",
      isTimeCritical: load.isTimeCritical ?? false,
      maxTransitTime: Number(load.maxTransitTime) || undefined,
      packagingType: load.packagingType,
      numberOfPieces: load.numberOfPieces,
      numberOfPallets: load.numberOfPallets,
      requiresGpsMonitoring: load.requiresGpsMonitoring ?? false,
      requiresTemperatureMonitoring: load.requiresTemperatureMonitoring ?? false,
      insuranceValue: load.insuranceValue,
      requiresLowClearanceRoute: load.requiresLowClearanceRoute ?? false,
      maxClearanceHeight: Number(load.maxClearanceHeight) || undefined,
      requiresEscortVehicle: load.requiresEscortVehicle ?? false,
      specialHandlingInstructions: load.specialHandlingInstructions,
      emergencyContactInfo: load.emergencyContactInfo,
      truckRequirements: load.truckRequirements || {},
      carrierPreferences: load.carrierPreferences || {},
      costPreferences: load.costPreferences || {},
      requiresPreShipmentInspection: load.requiresPreShipmentInspection ?? false,
      requiresDeliveryInspection: load.requiresDeliveryInspection ?? false,
      requiresPhotographicDocumentation: load.requiresPhotographicDocumentation ?? false,
      // Transform locations if available
      locations: load.locations || [],
      pickupLocation: load.pickupLocation ? {
        name: load.pickupLocation.name || "",
        address: load.pickupLocation.address || "",
        latitude: load.pickupLocation.coordinates?.coordinates?.[1] || load.pickupLocation.latitude || 0,
        longitude: load.pickupLocation.coordinates?.coordinates?.[0] || load.pickupLocation.longitude || 0,
      } : undefined,
      deliveryLocation: load.deliveryLocation ? {
        name: load.deliveryLocation.name || "",
        address: load.deliveryLocation.address || "",
        latitude: load.deliveryLocation.coordinates?.coordinates?.[1] || load.deliveryLocation.latitude || 0,
        longitude: load.deliveryLocation.coordinates?.coordinates?.[0] || load.deliveryLocation.longitude || 0,
      } : undefined,
    };

    setEditingCargo(editData);
    setIsEditModalOpen(true);
  };

  const handleUpdateCargo = async (data: ICargoBody): Promise<ICargoResponse> => {
    if (!editingCargo?.id) {
      throw new Error("No cargo ID found for update");
    }

    try {
      const response = await loadsAPI.update(editingCargo.id, data);
      setIsEditModalOpen(false);
      setEditingCargo(null);
      refetch();
      toast.success("Cargo updated successfully!");
      // Backend returns { message, load }, extract the load
      return (response as any).load || response;
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.join(", ")
          : undefined);
      const message = backendMessage || error?.message || "Failed to update cargo";
      toast.error(message);
      throw new Error(message);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCargo(null);
  };

  const handleSaveDraft = async (formData: any) => {
    try {
      await loadsAPI.saveDraft({
        ...formData,
        status: "DRAFT",
      });
      toast.success("Draft saved successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save draft");
    }
  };

  const tabs = [
    {
      id: "all" as TabType,
      label: "All Cargo",
      icon: List,
      count: stats.total,
    },
    {
      id: "active" as TabType,
      label: "Active",
      icon: Activity,
      count: activeLoads.length,
    },
    {
      id: "create" as TabType,
      label: "Create Cargo",
      icon: Plus,
    },
    {
      id: "template" as TabType,
      label: "Create from Template",
      icon: FileText,
    },
    {
      id: "bidding" as TabType,
      label: "Bidding",
      icon: Gavel,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Logo */}
      <img
        src={logoUrutiX}
        alt="UrutiX Logo Background"
        className="pointer-events-none select-none fixed inset-0 w-full h-full object-cover opacity-10 z-0"
        style={{ objectPosition: 'center' }}
      />
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 relative z-10">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cargo Management</h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Manage shipments, create new cargo, and track bidding
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-3 sm:mb-4 overflow-hidden">
          <nav className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-1 sm:space-x-1 p-1.5 sm:p-1 sm:overflow-x-auto sm:scrollbar-hide sm:scroll-smooth">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "group px-2.5 sm:px-3 md:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 transition-all relative whitespace-nowrap flex-1 sm:flex-initial min-w-0 touch-manipulation min-h-[44px] sm:min-h-0",
                    isActive
                      ? "bg-gray-100 text-gray-900 border border-gray-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                  title={tab.label}
                >
                  <Icon className={cn(
                    "w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0",
                    isActive ? "text-gray-700" : "text-gray-500"
                  )} />
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                  {/* Mobile tooltip - shows on hover/touch */}
                  <span className="sm:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 whitespace-nowrap">
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 text-white text-[10px] font-semibold rounded-full">
                        {tab.count}
                      </span>
                    )}
                    {/* Tooltip arrow */}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></span>
                  </span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "hidden sm:inline ml-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0",
                        isActive
                          ? "bg-gray-200 text-gray-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-lg border border-gray-200 mb-4 sm:mb-6">

          {/* Tab Content */}
          <div className="p-3 sm:p-4 md:p-6 pt-3 sm:pt-4 md:pt-6">
            {/* Filters - Only show for list views */}
            {(activeTab === "all" || activeTab === "active") && (
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-end">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <input
                      type="text"
                      placeholder="Search cargo by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-lg sm:rounded-xl border border-transparent bg-white px-3 sm:px-4 py-2.5 sm:py-3 pl-9 sm:pl-11 text-sm text-gray-700 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 touch-manipulation min-h-[44px] sm:min-h-0"
                      aria-label="Search cargo by name"
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <FilterSelect
                      label="Status"
                      icon={<FaLayerGroup className="text-purple-500" />}
                      value={statusFilter}
                      placeholder="All Status"
                      options={[
                        { value: "DRAFT", label: "Draft" },
                        { value: "PUBLISHED", label: "Published" },
                        { value: "ASSIGNED", label: "Assigned" },
                        { value: "IN_TRANSIT", label: "In Transit" },
                        { value: "DELIVERED", label: "Delivered" },
                        { value: "COMPLETED", label: "Completed" },
                        { value: "CANCELLED", label: "Cancelled" },
                      ]}
                      onChange={setStatusFilter}
                      className="w-full sm:min-w-[180px]"
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <FilterSelect
                      label="Cargo Type"
                      icon={<FaBox className="text-blue-500" />}
                      value={cargoTypeFilter}
                      placeholder="All Types"
                      options={[
                        { value: "GENERAL", label: "General" },
                        { value: "FRAGILE", label: "Fragile" },
                        { value: "HAZARDOUS", label: "Hazardous" },
                        { value: "REFRIGERATED", label: "Refrigerated" },
                        { value: "LIQUID", label: "Liquid" },
                        { value: "OVERSIZED", label: "Oversized" },
                        { value: "VALUABLE", label: "Valuable" },
                      ]}
                      onChange={setCargoTypeFilter}
                      className="w-full sm:min-w-[180px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* All Cargo / Active Tab */}
            {(activeTab === "all" || activeTab === "active") && (
              <div>
                {isLoading ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-xs sm:text-sm text-gray-600">Loading...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-red-700 break-words">
                      {error?.message || "Error loading cargo"}
                    </p>
                  </div>
                ) : filteredLoads.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      No cargo found
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      {activeTab === "active"
                        ? "No active shipments at the moment."
                        : "Create your first cargo shipment to get started."}
                    </p>
                    {activeTab === "all" && (
                      <button
                        onClick={() => setActiveTab("create")}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                      >
                        <Plus className="w-4 h-4" />
                        Create Cargo
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3 w-full overflow-hidden">
                    {filteredLoads.map((load: any) => (
                      <LoadItem
                        key={load.id}
                        load={load}
                        handleViewClick={handleViewClick}
                        handleConfirmLoading={handleConfirmLoading}
                        handleDeleteCargo={handleDeleteCargo}
                        handleEditCargo={handleEditCargo}
                        handleAssignBroker={handleAssignBroker}
                        handleUnassignBroker={handleUnassignBroker}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Tab */}
            {activeTab === "create" && (
              <div>
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Create Cargo
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {selectedTemplate
                      ? "Edit the template details below to create your cargo shipment"
                      : "Fill in the form below to create a new cargo shipment"}
                  </p>
                </div>
                <EnhancedCargoForm
                  isOpen={true}
                  onClose={() => {
                    setActiveTab("all");
                    setSelectedTemplate(null);
                  }}
                  onSubmit={handleCargoSubmit}
                  mode="create"
                  initialData={selectedTemplate}
                  showTruckSelection={false}
                  onSaveDraft={handleSaveDraft}
                />
              </div>
            )}

            {/* Template Tab - Shows template selection modal */}
            {activeTab === "template" && (
              <div>
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Create from Template
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Select a template to quickly create cargo with pre-filled information
                  </p>
                </div>
                <TemplateSelectionModal
                  isOpen={showTemplateModal}
                  onClose={() => {
                    setShowTemplateModal(false);
                    setActiveTab("all");
                  }}
                  onTemplateSelected={handleTemplateSelected}
                />
              </div>
            )}

            {/* Bidding Tab */}
            {activeTab === "bidding" && (
              <div>
                {user ? (
                  <BiddingDashboard
                    userRole={(user.role as "CARGO_OWNER" | "TRUCK_OWNER") || "CARGO_OWNER"}
                  />
                ) : (
                  <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
                    <p className="text-sm sm:text-base text-gray-600">
                      Please log in to access the bidding system.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && selectedLoad && (
        <CargoDetailsModal
          cargoId={selectedLoad.id}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {isLoadConfirmationOpen && selectedCargoForConfirmation && (
        <CargoLoadConfirmation
          cargo={selectedCargoForConfirmation}
          isOpen={isLoadConfirmationOpen}
          onClose={handleCloseLoadConfirmation}
          onConfirm={() => {
            handleCloseLoadConfirmation();
            refetch();
          }}
        />
      )}

      {/* Assign Broker Modal */}
      {selectedLoadForBroker && (
        <AssignBrokerModal
          key={`broker-modal-${selectedLoadForBroker.id}-${selectedLoadForBroker.brokerId || 'none'}`}
          isOpen={showAssignBrokerModal}
          onClose={async () => {
            // Refresh data when closing to get latest broker assignment
            await refetch();
            setShowAssignBrokerModal(false);
            // Update selectedLoadForBroker with fresh data
            const freshLoads = loadsData || [];
            const freshLoad = freshLoads.find((l: any) => l.id === selectedLoadForBroker.id);
            if (freshLoad) {
              setSelectedLoadForBroker(freshLoad);
            } else {
              setSelectedLoadForBroker(null);
            }
          }}
          loadId={selectedLoadForBroker.id}
          loadTitle={selectedLoadForBroker.title}
          loadValue={selectedLoadForBroker.loadValue}
          currentBrokerId={selectedLoadForBroker.brokerId || selectedLoadForBroker.broker?.id}
          onSuccess={handleBrokerAssignmentSuccess}
        />
      )}

      {/* Edit Cargo Modal */}
      {isEditModalOpen && editingCargo && (
        <EnhancedCargoForm
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleUpdateCargo}
          mode="edit"
          initialData={editingCargo}
          showTruckSelection={false}
        />
      )}

      {/* Confirmation Dialog */}
      {DialogComponent}
    </div>
  );
};

export default UnifiedCargoManagement;

