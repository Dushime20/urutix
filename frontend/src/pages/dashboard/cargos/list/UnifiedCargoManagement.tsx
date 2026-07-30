import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Grid,
  Table,
  Search,
  List,
  Activity,
  Gavel,
  Package,
  FileText,
  Users,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { CargoLoadConfirmation } from "@/components/LoanRequest";
import CargoDetailsModal from "@/components/CargoDetailsModal";
import { loadsAPI } from "@/services/load";
import receiverService from "@/services/receiverService";
import EnhancedCargoForm from "../create/components/form";
import BiddingDashboard from "@/components/Bidding/BiddingDashboard";
import { useAuth } from "@/contexts/AuthContext";
import LoadItem from "./components/loadItem";
import { ReceiverAssignmentModal } from "./components/ReceiverAssignmentModal";
import TemplateSelectionModal from "../create/components/TemplateSelectionModal";
import type { CargoFormSchemaType } from "../create/components/form/cargoFormSchema";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import type { ICargoBody, ICargoResponse } from "../create/types/cargo";
import FilterSelect from "@/components/common/FilterSelect";
import { FaLayerGroup, FaBox } from "react-icons/fa";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { loadStatusWebSocket } from "@/services/loadStatusWebSocket";
import { BrokerAssignmentWizard } from "@/components/Cargo/BrokerAssignmentWizard";
import { getStatusColor, getStatusDisplayName } from "./utils";
import { useCurrencyFormat } from "@/hooks/useCurrencyFormat";
import { compactNumber } from "@/utils/formatNumber";
import { brokerAPI } from "@/services/brokerApi";

type TabType = "all" | "active" | "drafts" | "broker-managed" | "create" | "template" | "bidding";

const UnifiedCargoManagement = () => {
  const { user } = useAuth();
  const { format: formatCurrency } = useCurrencyFormat();
  const location = useLocation();
  const navigate = useNavigate();
  const { confirm, DialogComponent } = useConfirmDialog();

  // Helper to format currency in compact format with currency symbol
  const formatCompactCurrency = (value: number) => {
    const formatted = formatCurrency(value);
    const numValue = Number(value);
    
    // Extract currency symbol from formatted string
    const match = formatted.match(/^([^\d]+)/);
    const symbol = match ? match[1] : '$';
    
    if (numValue >= 1_000_000_000) return `${symbol}${(numValue / 1_000_000_000).toFixed(1)}B`;
    if (numValue >= 1_000_000) return `${symbol}${(numValue / 1_000_000).toFixed(1)}M`;
    if (numValue >= 1_000) return `${symbol}${(numValue / 1_000).toFixed(1)}K`;
    
    return formatted;
  };

  // Determine initial tab based on route and query params
  const getInitialTab = (): TabType => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam === "template") return "template";
    if (tabParam === "drafts") return "drafts";
    if (tabParam === "broker-managed") return "broker-managed";
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
    } else if (tab === "drafts") {
      navigate(`${basePath}/cargos/list?tab=drafts`, { replace: true });
    } else if (tab === "broker-managed") {
      navigate(`${basePath}/cargos/list?tab=broker-managed`, { replace: true });
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [contractViewerOpen, setContractViewerOpen] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  // Broker assignment state
  const [showAssignBrokerModal, setShowAssignBrokerModal] = useState(false);
  const [selectedLoadForBroker, setSelectedLoadForBroker] = useState<any>(null);

  // Receiver assignment state
  const [showAssignReceiverModal, setShowAssignReceiverModal] = useState(false);
  const [selectedLoadForReceiver, setSelectedLoadForReceiver] = useState<any>(null);

  const queryClient = useQueryClient();
  const unsubscribeRefs = useRef<Map<string, () => void>>(new Map());

  // CARGO_RECEIVER users see only their assigned cargos via /receivers/my/cargos
  const isReceiver = user?.role === 'CARGO_RECEIVER';

  const {
    data: loadsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["loads", searchTerm, statusFilter, cargoTypeFilter, isReceiver],
    queryFn: async () => {
      if (isReceiver) {
        // Use the receiver-specific endpoint — no role restriction
        const data = await receiverService.getMyCargos();
        // Normalise to the same shape the rest of the component expects
        return { data: { cargos: data } };
      }
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
    const token = localStorage.getItem('accessToken');
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
            ["loads", searchTerm, statusFilter, cargoTypeFilter, isReceiver],
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

  // Filter for active shipments (exclude broker-managed)
  const activeLoads = useMemo(() => {
    return loadsData.filter(
      (load: any) =>
        !load.brokerId &&
        !load.broker &&
        (load.status === "IN_TRANSIT" ||
          load.status === "ASSIGNED" ||
          load.status === "PUBLISHED")
    );
  }, [loadsData]);

  // Filter for drafts (exclude broker-managed)
  const draftLoads = useMemo(() => {
    return loadsData.filter((load: any) => load.status === "DRAFT" && !load.brokerId && !load.broker);
  }, [loadsData]);

  // Broker-managed cargos — cargo owner has no more action on these
  const brokerManagedLoads = useMemo(() => {
    return loadsData.filter((load: any) => !!(load.brokerId || load.broker));
  }, [loadsData]);

  // Filter loads based on search and filters
  const filteredLoads = useMemo(() => {
    // "all" and "active" never show broker-managed cargo (owner has no action)
    // "broker-managed" shows only broker-assigned cargo
    let filtered =
      activeTab === "active"
        ? activeLoads
        : activeTab === "drafts"
        ? draftLoads
        : activeTab === "broker-managed"
        ? brokerManagedLoads
        : loadsData.filter(
            (load: any) =>
              load.status !== "DRAFT" &&
              !load.brokerId &&
              !load.broker
          );

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
    // Exclude broker-managed from the total shown to owners
    const ownerActionable = loadsData.filter((load: any) => !load.brokerId && !load.broker);
    return {
      total: ownerActionable.length,
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

  const handleAssignReceiver = (load: any) => {
    setSelectedLoadForReceiver(load);
    setShowAssignReceiverModal(true);
  };

  const handleViewContract = async (load: any) => {
    if (!load?.id) return;
    try {
      setContractLoading(true);
      const response = await brokerAPI.getContracts({ loadId: load.id });
      const payload = response?.data?.data ?? response?.data ?? [];
      const contracts = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.contracts)
          ? payload.contracts
          : Array.isArray(payload?.items)
            ? payload.items
            : [];

      const signedContract =
        contracts.find((c: any) => c.status === "SIGNED") ||
        contracts.find((c: any) => c.status === "ACTIVE") ||
        contracts.find((c: any) => c.status === "COMPLETED") ||
        contracts[0];

      if (!signedContract) {
        toast.error("No signed contract found for this cargo yet.");
        return;
      }

      setSelectedContract({
        ...signedContract,
        cargoTitle: load.title || "Untitled Cargo",
      });
      setContractViewerOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load contract");
    } finally {
      setContractLoading(false);
    }
  };

  const handleReceiverAssignmentComplete = async () => {
    await refetch();
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

  const handleEditCargo = async (load: any) => {
    try {
      toast.loading("Loading cargo details...", { id: "edit-cargo-load" });

      // Always fetch full cargo so dates, documents, and enhanced fields are complete
      let fullLoad = load;
      try {
        const response = await loadsAPI.getById(load.id);
        const payload = (response as any)?.data ?? response;
        fullLoad = payload?.load || payload || load;
      } catch (fetchError) {
        console.warn("Could not fetch full cargo, using list row data:", fetchError);
      }

      const toDateInputValue = (value?: string | Date | null): string => {
        if (!value) return "";
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
          return match ? match[1] : "";
        }
        return d.toISOString().split("T")[0];
      };

      const extractLatLng = (loc: any): { latitude: number; longitude: number } => {
        if (!loc) return { latitude: 0, longitude: 0 };
        if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
          return { latitude: loc.latitude, longitude: loc.longitude };
        }
        const c = loc.coordinates;
        if (!c) return { latitude: 0, longitude: 0 };
        if (typeof c.latitude === "number") {
          return { latitude: c.latitude, longitude: Number(c.longitude) || 0 };
        }
        if (Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
          return {
            latitude: Number(c.coordinates[1]) || 0,
            longitude: Number(c.coordinates[0]) || 0,
          };
        }
        if (Array.isArray(c) && c.length >= 2) {
          return { latitude: Number(c[1]) || 0, longitude: Number(c[0]) || 0 };
        }
        return { latitude: 0, longitude: 0 };
      };

      const pickupCoords = extractLatLng(fullLoad.pickupLocation);
      const deliveryCoords = extractLatLng(fullLoad.deliveryLocation);
      const contact = fullLoad.contactInfo || {};

      const editData: any = {
        id: fullLoad.id,
        title: fullLoad.title,
        description: fullLoad.description,
        weight: Number(fullLoad.weight) || 0,
        volume: fullLoad.volume != null ? Number(fullLoad.volume) : undefined,
        cargoType: fullLoad.cargoType,
        loadType: fullLoad.loadType || "FTL",
        equipmentType: fullLoad.equipmentType || "DRY_VAN",
        visibility: fullLoad.visibility || "public",
        unitsRequired: fullLoad.unitsRequired || 1,
        pickupDate: toDateInputValue(fullLoad.pickupDate),
        deliveryDate: toDateInputValue(fullLoad.deliveryDate),
        loadValue: Number(fullLoad.loadValue) || 0,
        offeredPrice: fullLoad.offeredPrice != null ? Number(fullLoad.offeredPrice) : undefined,
        currencyCode: fullLoad.currencyCode || "USD",
        paymentTerms: fullLoad.paymentTerms || "Net30",
        isFragile: fullLoad.isFragile ?? false,
        isHazardous: fullLoad.isHazardous ?? false,
        requiresRefrigeration: fullLoad.requiresRefrigeration ?? false,
        specialRequirements: fullLoad.specialHandlingInstructions,
        specialHandlingInstructions: fullLoad.specialHandlingInstructions,
        autoMatchEnabled: fullLoad.autoMatchEnabled ?? true,
        loadingInstructions: fullLoad.loadingInstructions,
        unloadingInstructions: fullLoad.unloadingInstructions,
        contactPerson: contact.contactPerson || fullLoad.contactPerson,
        contactPhone: contact.contactPhone || fullLoad.contactPhone,
        contactEmail: contact.contactEmail || fullLoad.contactEmail,
        length: fullLoad.length != null ? Number(fullLoad.length) : undefined,
        width: fullLoad.width != null ? Number(fullLoad.width) : undefined,
        height: fullLoad.height != null ? Number(fullLoad.height) : undefined,
        stackableHeight: fullLoad.stackableHeight != null ? Number(fullLoad.stackableHeight) : undefined,
        isStackable: fullLoad.isStackable ?? false,
        temperatureMin: fullLoad.temperatureMin != null ? Number(fullLoad.temperatureMin) : undefined,
        temperatureMax: fullLoad.temperatureMax != null ? Number(fullLoad.temperatureMax) : undefined,
        requiresHumidityControl: fullLoad.requiresHumidityControl ?? false,
        requiresForklift: fullLoad.requiresForklift ?? false,
        requiresCrane: fullLoad.requiresCrane ?? false,
        requiresLoadingDock: fullLoad.requiresLoadingDock ?? false,
        loadingTimeEstimate: fullLoad.loadingTimeEstimate != null ? Number(fullLoad.loadingTimeEstimate) : undefined,
        unloadingTimeEstimate: fullLoad.unloadingTimeEstimate != null ? Number(fullLoad.unloadingTimeEstimate) : undefined,
        hazmatClass: fullLoad.hazmatClass,
        hazmatNumber: fullLoad.hazmatNumber,
        urgencyLevel: fullLoad.urgencyLevel || "NORMAL",
        isTimeCritical: fullLoad.isTimeCritical ?? false,
        maxTransitTime: fullLoad.maxTransitTime != null ? Number(fullLoad.maxTransitTime) : undefined,
        packagingType: fullLoad.packagingType,
        numberOfPieces: fullLoad.numberOfPieces,
        numberOfPallets: fullLoad.numberOfPallets,
        requiresGpsMonitoring: fullLoad.requiresGpsMonitoring ?? false,
        requiresTemperatureMonitoring: fullLoad.requiresTemperatureMonitoring ?? false,
        insuranceValue: fullLoad.insuranceValue != null ? Number(fullLoad.insuranceValue) : undefined,
        requiresLowClearanceRoute: fullLoad.requiresLowClearanceRoute ?? false,
        maxClearanceHeight: fullLoad.maxClearanceHeight != null ? Number(fullLoad.maxClearanceHeight) : undefined,
        requiresEscortVehicle: fullLoad.requiresEscortVehicle ?? false,
        emergencyContactInfo: fullLoad.emergencyContactInfo,
        truckRequirements: fullLoad.truckRequirements || {},
        carrierPreferences: fullLoad.carrierPreferences || {},
        costPreferences: fullLoad.costPreferences || {},
        requiresPreShipmentInspection: fullLoad.requiresPreShipmentInspection ?? false,
        requiresDeliveryInspection: fullLoad.requiresDeliveryInspection ?? false,
        requiresPhotographicDocumentation: fullLoad.requiresPhotographicDocumentation ?? false,
        documents: Array.isArray(fullLoad.documents) ? fullLoad.documents : [],
        pickupLocation: fullLoad.pickupLocation
          ? {
              id: fullLoad.pickupLocation.id,
              name: fullLoad.pickupLocation.name || "",
              address: fullLoad.pickupLocation.address || "",
              latitude: pickupCoords.latitude,
              longitude: pickupCoords.longitude,
            }
          : undefined,
        deliveryLocation: fullLoad.deliveryLocation
          ? {
              id: fullLoad.deliveryLocation.id,
              name: fullLoad.deliveryLocation.name || "",
              address: fullLoad.deliveryLocation.address || "",
              latitude: deliveryCoords.latitude,
              longitude: deliveryCoords.longitude,
            }
          : undefined,
      };

      toast.dismiss("edit-cargo-load");
      setEditingCargo(editData);
      setIsEditModalOpen(true);
    } catch (error: any) {
      toast.error(error?.message || "Failed to load cargo for editing", { id: "edit-cargo-load" });
    }
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
      refetch();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save draft");
    }
  };

  // Check if any cargo has broker assigned
  const hasBrokerAssigned = useMemo(() => {
    return loadsData.some((load: any) => load.brokerId || load.broker);
  }, [loadsData]);

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
      id: "drafts" as TabType,
      label: "Drafts",
      icon: FileText,
      count: draftLoads.length,
    },
    // Show broker-managed tab only if at least one cargo has a broker
    ...(brokerManagedLoads.length > 0
      ? [{
          id: "broker-managed" as TabType,
          label: "Managed by Broker",
          icon: Users,
          count: brokerManagedLoads.length,
        }]
      : []),
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
    // Hide bidding tab if any broker is assigned (broker handles bidding)
    ...(!hasBrokerAssigned ? [{
      id: "bidding" as TabType,
      label: "Bidding",
      icon: Gavel,
    }] : []),
  // Receivers only see the list — no create/template/bidding tabs
  ].filter(tab => isReceiver ? (tab.id === 'all' || tab.id === 'active') : true);

  return (
    <>
      <div className="space-y-6">
        {/* Header - Enlite Prime Style */}
        {activeTab !== "bidding" && (
          <div className="mb-6 rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <FaBox className="w-6 h-6 text-[#345E85] dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Cargo Management</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Shipments, Analytics & Intelligence
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right mr-4 px-4 py-2 border-r border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Loads</div>
                <div className="text-lg font-black text-[#345E85] dark:text-primary-400 leading-tight">{activeLoads.length}</div>
              </div>
              {!isReceiver && (
              <button
                onClick={() => handleTabChange("create")}
                className="px-6 py-2.5 bg-[#345E85] dark:bg-primary-600 text-white rounded-2xl transition-all duration-300 font-black text-sm hover:bg-slate-800 dark:hover:bg-primary-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>CREATE CARGO</span>
              </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-6">
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all duration-300 relative",
                    isActive
                      ? "bg-[#345E85] dark:bg-primary-600 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? "text-white" : "text-slate-400"
                  )} />
                  <span className="uppercase tracking-wider">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "ml-1 px-2 py-0.5 text-[10px] font-bold rounded-lg",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
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

        {/* Content Container - Hide for bidding tab */}
        {activeTab !== "bidding" && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mb-8 overflow-hidden transition-colors duration-300">

            {/* Tab Content */}
            <div className="p-3 sm:p-4 md:p-6 pt-3 sm:pt-4 md:pt-6">
              {/* Filters - Only show for owner-action list views */}
              {(activeTab === "all" || activeTab === "active" || activeTab === "drafts") && (
                <div className="mb-4 sm:mb-8">
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-[#345E85] transition-colors" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search cargo by title, reference, or type..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={cn(
                            "w-full pl-14 pr-6 py-4 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem]",
                            "focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-8 focus:ring-blue-500/5 dark:focus:ring-primary-500/10 focus:border-blue-200/60 dark:focus:border-primary-700",
                            "transition-all duration-300 placeholder:text-slate-300 dark:placeholder:text-slate-600 placeholder:font-black placeholder:uppercase placeholder:tracking-widest",
                            "text-slate-900 dark:text-slate-100"
                          )}
                          aria-label="Search cargo"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                          className={cn(
                            "sm:hidden flex-1 px-6 py-4 rounded-[1.5rem] border transition-all flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest",
                            showFiltersMobile 
                              ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20" 
                              : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                          )}
                        >
                          <Filter className="w-4 h-4" />
                          <span>Advanced Filters</span>
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Status Chips for Mobile Quick Filter - Prime Style */}
                    <div className="relative flex sm:hidden">
                      <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 scroll-smooth px-1">
                         {['', 'DRAFT', 'PUBLISHED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].map((status) => (
                           <button
                             key={status}
                             onClick={() => setStatusFilter(status)}
                             className={cn(
                               "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 border-2",
                               statusFilter === status
                                 ? "bg-slate-900 dark:bg-primary-600 border-slate-900 dark:border-primary-600 text-white scale-105"
                                 : "bg-white dark:bg-slate-800 border-slate-50 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-200 dark:hover:border-slate-600"
                             )}
                           >
                             {status === '' ? 'Manifest_All' : status.replace('_', ' ')}
                           </button>
                         ))}
                      </div>
                      <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none" />
                    </div>

                    {/* Desktop Filters / Mobile Expanded Filters */}
                    <div className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 w-full",
                      !showFiltersMobile ? "hidden sm:grid lg:flex" : "grid"
                    )}>
                      <div className="w-full lg:w-64">
                        <FilterSelect
                          label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Status_Scope</span>}
                          icon={<FaLayerGroup className="text-slate-400" />}
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
                          className="w-full"
                          selectClassName="rounded-2xl border-slate-100 bg-slate-50/50 py-3.5 font-bold text-xs"
                        />
                      </div>
                      <div className="w-full lg:w-64">
                        <FilterSelect
                          label={<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payload_Category</span>}
                          icon={<FaBox className="text-slate-400" />}
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
                          className="w-full"
                          selectClassName="rounded-2xl border-slate-100 bg-slate-50/50 py-3.5 font-bold text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* View Mode Toggle - Prime Style */}
                  <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 mt-6 max-w-fit transition-colors duration-300">
                    <button
                      onClick={() => setViewMode('card')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300",
                        viewMode === 'card'
                          ? "bg-white dark:bg-slate-900 text-[#345E85] dark:text-primary-400 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      <Grid className="w-4 h-4" />
                      <span className="uppercase tracking-wider">GRID VIEW</span>
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300",
                        viewMode === 'table'
                          ? "bg-white dark:bg-slate-900 text-[#345E85] dark:text-primary-400 shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      )}
                    >
                      <Table className="w-4 h-4" />
                      <span className="uppercase tracking-wider">LIST VIEW</span>
                    </button>
                  </div>
                </div>
              )}

              {/* All Cargo / Active / Drafts / Broker-Managed Tab */}
              {(activeTab === "all" || activeTab === "active" || activeTab === "drafts" || activeTab === "broker-managed") && (
                <div>
                  {isLoading ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-primary-500 mx-auto"></div>
                      <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-slate-400">Loading...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 break-words">
                        {error?.message || "Error loading cargo"}
                      </p>
                    </div>
                  ) : filteredLoads.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-slate-600 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-slate-100 mb-2">
                        {activeTab === "broker-managed" ? "No broker-managed cargo" : "No cargo found"}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 mb-4">
                        {activeTab === "active"
                          ? "No active shipments at the moment."
                          : activeTab === "drafts"
                          ? "No saved drafts. Start creating cargo to save drafts."
                          : activeTab === "broker-managed"
                          ? "None of your cargo has been assigned to a broker yet."
                          : "Create your first cargo shipment to get started."}
                      </p>
                      {!isReceiver && (activeTab === "all" || activeTab === "drafts") && (
                        <div className="mt-8 flex justify-center">
                          <button
                            onClick={() => setActiveTab("create")}
                            className="inline-flex items-center justify-center gap-3 px-8 py-3 bg-[#345E85] dark:bg-primary-600 text-white rounded-2xl transition-all duration-300 font-black text-sm hover:bg-slate-800 dark:hover:bg-primary-700"
                          >
                            <Plus className="w-5 h-5" />
                            CREATE CARGO
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Broker-managed info banner */}
                      {activeTab === "broker-managed" && (
                        <div className="mb-4 flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
                          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-black text-purple-800 dark:text-purple-300 uppercase tracking-wide">Managed by Broker</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                              These cargo records have been handed off to a broker. You can view details and track progress, but no further owner actions are required.
                            </p>
                          </div>
                        </div>
                      )}
                      {viewMode === 'card' ? (
                        <div className="space-y-2 sm:space-y-3 w-full overflow-hidden">
                          {filteredLoads.map((load: any) => (
                            <LoadItem
                              key={load.id}
                              load={load}
                              handleViewClick={handleViewClick}
                              // No owner actions on broker-managed cargo
                              handleConfirmLoading={isReceiver || activeTab === "broker-managed" ? undefined : handleConfirmLoading}
                              handleDeleteCargo={isReceiver || activeTab === "broker-managed" ? undefined : handleDeleteCargo}
                              handleEditCargo={isReceiver || activeTab === "broker-managed" ? undefined : handleEditCargo}
                              handleAssignBroker={isReceiver || activeTab === "broker-managed" ? undefined : handleAssignBroker}
                              handleUnassignBroker={isReceiver ? undefined : handleUnassignBroker}
                              handleAssignReceiver={isReceiver || activeTab === "broker-managed" ? undefined : handleAssignReceiver}
                              handleViewContract={activeTab === "broker-managed" ? handleViewContract : undefined}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                          {/* Mobile View for "Table" Mode (Compact List) */}
                          <div className="block md:hidden divide-y divide-slate-50 dark:divide-slate-800">
                            {filteredLoads.map((load: any) => (
                              <div key={load.id} className="p-4 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                      <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-black text-slate-800 dark:text-slate-100">{load.title || 'Untitled'}</div>
                                      <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{load.cargoType}</div>
                                    </div>
                                  </div>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                    getStatusColor(load.status)
                                  )}>
                                    {getStatusDisplayName(load.status)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 p-2 rounded-xl">
                                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate" title={load.offeredPrice ? formatCurrency(Number(load.offeredPrice)) : 'N/A'}>
                                    {load.offeredPrice ? formatCompactCurrency(Number(load.offeredPrice)) : 'N/A'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => handleViewClick(load)} className="p-2 text-slate-400 hover:text-[#345E85]"><Eye className="w-4 h-4" /></button>
                                    {activeTab === "broker-managed" && (
                                      <button onClick={() => handleViewContract(load)} className="p-2 text-blue-500 hover:text-blue-700" title="View Signed Contract"><FileText className="w-4 h-4" /></button>
                                    )}
                                    {!isReceiver && !load.broker && <button onClick={() => handleEditCargo(load)} className="p-2 text-slate-400 hover:text-primary-600"><Edit className="w-4 h-4" /></button>}
                                    {!isReceiver && !load.broker && <button onClick={() => handleAssignBroker(load)} className="p-2 text-purple-600"><Users className="w-4 h-4" /></button>}
                                    {!isReceiver && !load.broker && <button onClick={() => handleDeleteCargo(load)} className="p-2 text-red-400"><Trash2 className="w-4 h-4" /></button>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Desktop View (Enhanced Table) */}
                          <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                                <tr>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cargo</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Route</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Details</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Value</th>
                                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredLoads.map((load: any) => (
                                  <tr key={load.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors duration-300">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                                          <Package className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <div className="ml-3">
                                          <div className="text-sm font-black text-slate-800 dark:text-slate-100">{load.title || 'Untitled'}</div>
                                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{load.cargoType}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {load.pickupLocation?.city || load.pickupLocation?.address || 'N/A'}
                                      </div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500">→</div>
                                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {load.deliveryLocation?.city || load.deliveryLocation?.address || 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{load.weight ? `${load.weight} kg` : 'N/A'}</div>
                                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{load.volume ? `${load.volume} L` : ''}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={cn(
                                        "px-3 py-1.5 inline-flex text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm font-semibold",
                                        getStatusColor(load.status)
                                      )}>
                                        {getStatusDisplayName(load.status)}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-700 dark:text-slate-300" title={load.offeredPrice ? formatCurrency(Number(load.offeredPrice)) : 'N/A'}>
                                      {load.offeredPrice ? formatCompactCurrency(Number(load.offeredPrice)) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button
                                          onClick={() => handleViewClick(load)}
                                          className="p-2 text-slate-400 hover:text-[#345E85] hover:bg-blue-50 rounded-lg transition-all"
                                          title="View Details"
                                        >
                                          <Eye className="w-4 h-4" />
                                        </button>
                                        {activeTab === "broker-managed" && (
                                          <button
                                            onClick={() => handleViewContract(load)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Signed Contract"
                                          >
                                            <FileText className="w-4 h-4" />
                                          </button>
                                        )}
                                        {!isReceiver && !load.broker && (
                                          <button
                                            onClick={() => handleEditCargo(load)}
                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                            title="Edit Cargo"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </button>
                                        )}
                                        {!isReceiver && !load.broker && (
                                          <button
                                            onClick={() => handleAssignBroker(load)}
                                            className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                                            title="Assign Broker"
                                          >
                                            <Users className="w-4 h-4" />
                                          </button>
                                        )}
                                        {!isReceiver && (
                                        <button
                                          onClick={() => !load.receiverId && handleAssignReceiver(load)}
                                          className={cn(
                                            "p-2 rounded-lg transition-all",
                                            load.receiverId ? "text-slate-200 cursor-not-allowed" : "text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                                          )}
                                          title={load.receiverId ? "Receiver assigned" : "Assign Receiver"}
                                          disabled={!!load.receiverId}
                                        >
                                          <Users className="w-4 h-4" />
                                        </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Create Tab */}
              {activeTab === "create" && (
                <div>
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      Create Cargo
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
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
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">
                      Create from Template
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400">
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
            </div>
          </div>
        )}

        {activeTab === "bidding" && (
          <div className="space-y-6">
            <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Gavel className="w-6 h-6 text-[#345E85] dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#0f172a] dark:text-slate-100 tracking-tight">Bidding Dashboard</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Auctions, Offers & Negotiations
                  </p>
                </div>
              </div>
            </div>
            {user ? (
              <BiddingDashboard
                userRole={(user.role as "CARGO_OWNER" | "TRUCK_OWNER") || "CARGO_OWNER"}
              />
            ) : (
              <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
                <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">
                  Please log in to access the bidding system.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {
        isModalOpen && selectedLoad && (
          <CargoDetailsModal
            cargoId={selectedLoad.id}
            cargoData={selectedLoad}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )
      }

      {
        isLoadConfirmationOpen && selectedCargoForConfirmation && (
          <CargoLoadConfirmation
            cargo={selectedCargoForConfirmation}
            trip={{
              id: selectedCargoForConfirmation.tripId || 'pending',
              driverName: selectedCargoForConfirmation.driver?.name || 'Assigned Driver',
              driverPhone: selectedCargoForConfirmation.driver?.phone || 'N/A',
              truckPlateNumber: selectedCargoForConfirmation.truck?.plateNumber || 'TBD',
              estimatedDuration: 'Calculated upon start',
              route: `${selectedCargoForConfirmation.pickupLocation?.name || 'Origin'} to ${selectedCargoForConfirmation.deliveryLocation?.name || 'Destination'}`
            }}
            // isOpen prop is not required by CargoLoadConfirmation, it's controlled by conditional rendering
            onCancel={handleCloseLoadConfirmation}
            onConfirmLoaded={() => {
              handleCloseLoadConfirmation();
              refetch();
            }}
          />
        )
      }

      {/* Assign Broker Modal */}
      {
        selectedLoadForBroker && (
          <BrokerAssignmentWizard
            key={`broker-wizard-${selectedLoadForBroker.id}-${selectedLoadForBroker.brokerId || 'none'}`}
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
            targetPrice={selectedLoadForBroker.offeredPrice || selectedLoadForBroker.targetPrice}
            cargoPickupDate={selectedLoadForBroker.pickupDate}
            cargoDeliveryDate={selectedLoadForBroker.deliveryDate}
            onSuccess={handleBrokerAssignmentSuccess}
          />
        )
      }

      {/* Assign Receiver Modal */}
      {
        selectedLoadForReceiver && (
          <ReceiverAssignmentModal
            isOpen={showAssignReceiverModal}
            onClose={() => {
              setShowAssignReceiverModal(false);
              setSelectedLoadForReceiver(null);
            }}
            cargoId={selectedLoadForReceiver.id}
            currentReceiverId={selectedLoadForReceiver.receiverId}
            onAssignmentComplete={handleReceiverAssignmentComplete}
          />
        )
      }

      {/* Edit Cargo Modal */}
      {
        isEditModalOpen && editingCargo && (
          <EnhancedCargoForm
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSubmit={handleUpdateCargo}
            mode="edit"
            initialData={editingCargo}
            showTruckSelection={false}
          />
        )
      }

      {/* Confirmation Dialog */}
      {DialogComponent}

      {contractViewerOpen && selectedContract && (
        <div className="fixed inset-0 z-[400] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Signed Contract</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedContract.cargoTitle}</p>
              </div>
              <button
                onClick={() => {
                  setContractViewerOpen(false);
                  setSelectedContract(null);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <div className="text-slate-400 uppercase tracking-wider font-black">Status</div>
                  <div className="text-slate-900 dark:text-slate-100 font-bold mt-1">{selectedContract.status || "N/A"}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                  <div className="text-slate-400 uppercase tracking-wider font-black">Contract ID</div>
                  <div className="text-slate-900 dark:text-slate-100 font-bold mt-1">{selectedContract.id || "N/A"}</div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-black mb-2">Contract Content</div>
                <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                  {selectedContract.contractContent || "No contract content available."}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {contractLoading && (
        <div className="fixed bottom-4 right-4 z-[410] px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-lg">
          Loading contract...
        </div>
      )}
    </>
  );
};

export default UnifiedCargoManagement;

