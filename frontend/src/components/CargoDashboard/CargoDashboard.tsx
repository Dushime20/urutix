import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaSync,
  FaDownload,
  FaExclamationTriangle,
  FaPlus,
} from "react-icons/fa";
import { FiGrid, FiList } from "react-icons/fi";
import { ChevronLeft, ChevronRight, Package, TrendingUp, MapPin, BarChart3, Home, ChevronRight as ChevronRightIcon, X } from "lucide-react";

import { CargoFilters } from "./CargoFilters";
import { CargoModal } from "./CargoModal";
import { CargoSkeleton } from "./CargoSkeleton";
import { CargoTable } from "./CargoTable";
import { ErrorBoundary } from "../ErrorBoundary";
import EnhancedCargoForm from "../../pages/dashboard/cargos/create/components/form";
import { useConfirmDialog } from "../../hooks/useConfirmDialog";
import { AssignBrokerModal } from "./AssignBrokerModal";
import { useCargoOwnerLayout } from "../../contexts/CargoOwnerLayoutContext";
import DashboardHeader from "../Dashboard/Layout/DashboardHeader";



import {
  fetchCargos,
  exportCargos,
  subscribeCargoUpdates,
  createCargo,
  updateCargo,
  deleteCargo,
  publishCargo,
} from "../../services/cargoApi";
import api from "../../services/api";
import toast from "react-hot-toast";
import { TranslatedText } from "../translated-text";
// import type { Cargo, CargoFilters as CargoFiltersType, CargoData } from '../../types/cargo';

// Temporary local interfaces to bypass module resolution issue
interface Cargo {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupLocation?: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  deliveryLocation?: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  pickupDate: string;
  deliveryDate: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  specialRequirements?: string;
  autoMatchEnabled: boolean;
  loadingInstructions?: string;
  unloadingInstructions?: string;
  contactInfo?: {
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced fields
  length?: number;
  width?: number;
  height?: number;
  stackableHeight?: number;
  isStackable?: boolean;
  temperatureMin?: number;
  temperatureMax?: number;
  requiresHumidityControl?: boolean;
  requiresForklift?: boolean;
  requiresCrane?: boolean;
  requiresLoadingDock?: boolean;
  loadingTimeEstimate?: number;
  unloadingTimeEstimate?: number;
  hazmatClass?: string;
  hazmatNumber?: string;
  urgencyLevel?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  isTimeCritical?: boolean;
  maxTransitTime?: number;
  packagingType?: string;
  numberOfPieces?: number;
  numberOfPallets?: number;
  requiresGpsMonitoring?: boolean;
  requiresTemperatureMonitoring?: boolean;
  insuranceValue?: number;
  requiresLowClearanceRoute?: boolean;
  maxClearanceHeight?: number;
  requiresEscortVehicle?: boolean;
  specialHandlingInstructions?: string;
  emergencyContactInfo?: string;
  truckRequirements?: {
    minCapacityWeight?: number;
    minCapacityVolume?: number;
    requiredTruckTypes?: string[];
    requiredFeatures?: string[];
    maxTruckAge?: number;
    minDriverExperience?: number;
    requiredCertifications?: string[];
    minInsuranceCoverage?: number;
  };
  carrierPreferences?: {
    preferredCarriers?: string[];
    excludedCarriers?: string[];
    minCarrierRating?: number;
    maxDistance?: number;
    maxHoursToAvailability?: number;
  };
  costPreferences?: {
    maxBudget?: number;
    preferredPaymentTerms?: string;
    requiresInsurance?: boolean;
    requiresTracking?: boolean;
  };
  requiresPreShipmentInspection?: boolean;
  requiresDeliveryInspection?: boolean;
  requiresPhotographicDocumentation?: boolean;
  // Location data structures
  enrichedLocations?: Array<{
    type: string;
    locationData?: any;
  }>;
  locations?: Array<{
    type: string;
    locationData?: any;
  }>;
  broker?: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      companyName?: string;
    };
  };
  brokerId?: string;
}

interface CargoFilters {
  status?: string;
  cargoType?: string;
  urgencyLevel?: string;
  isHazardous?: boolean;
  requiresRefrigeration?: boolean;
  isTimeCritical?: boolean;
}



type CargoFiltersType = CargoFilters;

// Fix default marker icon for Leaflet in React

import { Button } from "../ui";



export const CargoDashboard: React.FC = () => {
  const { confirm, DialogComponent } = useConfirmDialog();
  const layoutContext = useCargoOwnerLayout();
  const setHideHeader = layoutContext?.setHideHeader;
  const navigate = useNavigate();


  // Debug: Log context availability
  useEffect(() => {
    console.log('🔍 CargoDashboard - Layout context:', {
      hasContext: !!layoutContext,
      hasSetHideHeader: typeof setHideHeader === 'function',
      hideHeader: layoutContext?.hideHeader
    });
  }, [layoutContext, setHideHeader]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<CargoFiltersType>({});
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCargos, setTotalCargos] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [allCargos, setAllCargos] = useState<Cargo[]>([]); // Store all fetched cargos

  const observer = useRef<IntersectionObserver | null>(null);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = allCargos.length;
    const published = allCargos.filter(c => c.status === 'PUBLISHED').length;
    const inTransit = allCargos.filter(c => c.status === 'IN_TRANSIT').length;
    const completed = allCargos.filter(c => c.status === 'DELIVERED' || c.status === 'COMPLETED').length;
    const totalValue = allCargos.reduce((sum, c) => sum + (Number(c.loadValue) || 0), 0);

    return { total, published, inTransit, completed, totalValue };
  }, [allCargos]);

  // CRUD state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  // Broker assignment state
  const [showAssignBrokerModal, setShowAssignBrokerModal] = useState(false);
  const [selectedLoadForBroker, setSelectedLoadForBroker] = useState<Cargo | null>(null);

  // Hide header when any modal is open
  useEffect(() => {
    const hasModalOpen = !!(selectedCargo || showAssignBrokerModal || showForm || selectedLoadForBroker);
    console.log('🔍 Modal state check:', {
      selectedCargo: !!selectedCargo,
      showAssignBrokerModal,
      showForm,
      selectedLoadForBroker: !!selectedLoadForBroker,
      hasModalOpen,
      setHideHeaderAvailable: typeof setHideHeader === 'function'
    });

    if (typeof setHideHeader === 'function') {
      setHideHeader(hasModalOpen);
    } else {
      console.warn('⚠️ setHideHeader is not available in context');
    }

    // Cleanup: show header when component unmounts
    return () => {
      if (typeof setHideHeader === 'function') {
        setHideHeader(false);
      }
    };
  }, [selectedCargo, showAssignBrokerModal, showForm, selectedLoadForBroker, setHideHeader]);

  // Fetch cargos with filters, search, and pagination

  const loadCargos = useCallback(
    async (reset = false, targetPage?: number) => {
      setLoading(true);
      setError(null);
      const currentPage = targetPage !== undefined ? targetPage : (reset ? 1 : page);
      try {
        // Only send search to API if it's not empty (to avoid 500 errors)
        const apiSearch = search && search.trim() ? search.trim() : undefined;
        const items = await fetchCargos(currentPage, apiSearch, filters);
        const itemsArray = Array.isArray(items) ? items : [];

        // Always apply client-side filtering to ensure search works by cargo name
        // This provides a fallback if API search fails or doesn't work as expected
        let filteredItems = itemsArray;
        if (search && search.trim()) {
          const searchLower = search.toLowerCase().trim();
          filteredItems = filteredItems.filter((cargo: Cargo) => {
            // Primary search by cargo name/title (most important)
            const titleMatch = cargo.title?.toLowerCase().includes(searchLower);
            // Also search by description, cargo type, and ID as fallback
            const descriptionMatch = cargo.description?.toLowerCase().includes(searchLower);
            const cargoTypeMatch = cargo.cargoType?.toLowerCase().includes(searchLower);
            const idMatch = cargo.id?.toLowerCase().includes(searchLower);

            // Prioritize title match - if title matches, return true immediately
            if (titleMatch) return true;
            // Otherwise check other fields
            return descriptionMatch || cargoTypeMatch || idMatch;
          });
        }

        // Store all fetched cargos - for pagination, we need all items
        if (targetPage !== undefined || reset) {
          setAllCargos(filteredItems);
          setTotalCargos(filteredItems.length);
          setTotalPages(Math.ceil(filteredItems.length / itemsPerPage));
        } else {
          // Infinite scroll mode - append to all cargos
          setAllCargos((prev) => {
            const updated = [...prev, ...filteredItems];
            setTotalCargos(updated.length);
            setTotalPages(Math.ceil(updated.length / itemsPerPage));
            return updated;
          });
        }
        setHasMore(filteredItems.length >= itemsPerPage);
        if (reset) {
          setPage(1);
        } else if (targetPage !== undefined) {
          setPage(targetPage);
        } else {
          setPage((prev) => prev + 1);
        }
      } catch (e: any) {
        // If API fails, try to fetch without search and filter client-side
        if (search && search.trim()) {
          try {
            console.warn("API search failed, falling back to client-side search:", e);
            const items = await fetchCargos(page, undefined, filters);
            const itemsArray = Array.isArray(items) ? items : [];

            // Apply client-side filtering - prioritize cargo name/title
            const searchLower = search.toLowerCase().trim();
            const filteredItems = itemsArray.filter((cargo: Cargo) => {
              // Primary search by cargo name/title (most important)
              const titleMatch = cargo.title?.toLowerCase().includes(searchLower);
              // Also search by description, cargo type, and ID as fallback
              const descriptionMatch = cargo.description?.toLowerCase().includes(searchLower);
              const cargoTypeMatch = cargo.cargoType?.toLowerCase().includes(searchLower);
              const idMatch = cargo.id?.toLowerCase().includes(searchLower);

              // Prioritize title match - if title matches, return true immediately
              if (titleMatch) return true;
              // Otherwise check other fields
              return descriptionMatch || cargoTypeMatch || idMatch;
            });

            setCargos(reset ? filteredItems : [...cargos, ...filteredItems]);
            setHasMore(filteredItems.length >= itemsPerPage);
            setTotalCargos((prev) => reset ? filteredItems.length : prev + filteredItems.length);
            setTotalPages(Math.ceil((reset ? filteredItems.length : cargos.length + filteredItems.length) / itemsPerPage));
            if (reset) {
              setPage(1);
            } else {
              setPage((prev) => prev + 1);
            }
            return;
          } catch (fallbackError) {
            console.error("Fallback search also failed:", fallbackError);
          }
        }

        setError("Failed to load cargos. Please try again.");
        console.error("Error loading cargos:", e);
        // Keep existing cargos on error instead of clearing
        if (reset) {
          setCargos([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, search, page, itemsPerPage]
  );

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1); // Reset to first page when changing page size
  }, []);

  useEffect(() => {
    loadCargos(true);
    // eslint-disable-next-line
  }, [filters, search]);

  // Real-time updates
  useEffect(() => {
    const unsubscribe = subscribeCargoUpdates((update: Partial<Cargo>) => {
      setCargos((prev) => {
        const idx = prev.findIndex((c) => c.id === update.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...update };
          return updated;
        }
        return prev;
      });
    });
    return unsubscribe;
  }, []);

  // Infinite scroll
  const lastCargoRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadCargos();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadCargos]
  );

  // Export functionality
  const handleExport = () => {
    exportCargos();
  };

  // Bulk actions (example: delete)
  const handleBulkAction = (
    action: "delete" | "export" | "update",
    selectedIds: string[]
  ) => {
    // Implement bulk action logic
    console.log(`Bulk action: ${action} on ${selectedIds.length} cargos`);
    toast.success(`Bulk action: ${action} on ${selectedIds.length} cargos`);
  };

  // CRUD Functions
  const handleCreateCargo = useCallback(async (cargoData: any): Promise<any> => {
    try {
      const newCargo = await createCargo(cargoData);
      setCargos((prev) => [newCargo, ...prev]);
      setShowForm(false);
      return newCargo;
    } catch (error: any) {
      console.error("Error creating cargo:", error);
      throw error;
    }
  }, []);

  const handleUpdateCargo = useCallback(
    async (cargoData: any): Promise<any> => {
      if (!editingCargo) return;

      try {
        const updatedCargo = await updateCargo(editingCargo.id, cargoData);
        setCargos((prev) =>
          prev.map((cargo) =>
            cargo.id === editingCargo.id ? updatedCargo : cargo
          )
        );
        setShowForm(false);
        setEditingCargo(null);
        return updatedCargo;
      } catch (error: any) {
        console.error("Error updating cargo:", error);
        throw error;
      }
    },
    [editingCargo]
  );

  const handleDeleteCargo = useCallback(async (cargoId: string) => {
    const confirmed = await confirm({
      title: "Delete Cargo",
      message: "Are you sure you want to delete this cargo? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });

    if (!confirmed) return;

    // Double check status before deletion
    const cargoToDelete = allCargos.find(c => c.id === cargoId);
    if (cargoToDelete && cargoToDelete.status !== 'DRAFT') {
      toast.error("Only draft cargos can be deleted");
      return;
    }

    try {
      await deleteCargo(cargoId);
      // Remove from list immediately
      setAllCargos((prev) => prev.filter((c) => c.id !== cargoId));
      setCargos((prev) => prev.filter((cargo) => cargo.id !== cargoId));
      toast.success("Cargo deleted successfully");
    } catch (error: any) {
      console.error("Error deleting cargo:", error);
      setError("Failed to delete cargo");
    }
  }, [allCargos, confirm]);

  const handlePublishCargo = useCallback(async (cargoId: string) => {
    try {
      const publishedCargo = await publishCargo(cargoId);
      setCargos((prev) =>
        prev.map((cargo) => (cargo.id === cargoId ? publishedCargo : cargo))
      );
    } catch (error: any) {
      console.error("Error publishing cargo:", error);
      setError("Failed to publish cargo");
    }
  }, []);

  // Transform cargo data to form data format
  const transformCargoToFormData = useCallback((cargo: Cargo): any => {
    return {
      id: cargo.id,
      title: cargo.title || "",
      description: cargo.description || "",
      weight: cargo.weight || 0,
      volume: cargo.volume || 0,
      cargoType: cargo.cargoType || "GENERAL",
      pickupLocationId: cargo.pickupLocationId || "",
      deliveryLocationId: cargo.deliveryLocationId || "",
      pickupDate: cargo.pickupDate || "",
      deliveryDate: cargo.deliveryDate || "",
      loadValue: cargo.loadValue || 0,
      offeredPrice: cargo.offeredPrice || 0,
      currencyCode: cargo.currencyCode || "USD",
      isFragile: cargo.isFragile || false,
      isHazardous: cargo.isHazardous || false,
      requiresRefrigeration: cargo.requiresRefrigeration || false,
      specialRequirements: cargo.specialRequirements || cargo.specialHandlingInstructions || "",
      autoMatchEnabled: cargo.autoMatchEnabled !== undefined ? cargo.autoMatchEnabled : true,
      loadingInstructions: cargo.loadingInstructions || "",
      unloadingInstructions: cargo.unloadingInstructions || "",
      // Contact info
      contactPerson: cargo.contactInfo?.contactPerson || "",
      contactPhone: cargo.contactInfo?.contactPhone || "",
      contactEmail: cargo.contactInfo?.contactEmail || "",
      // Dimensions
      length: cargo.length ? Number(cargo.length) : undefined,
      width: cargo.width ? Number(cargo.width) : undefined,
      height: cargo.height ? Number(cargo.height) : undefined,
      stackableHeight: cargo.stackableHeight ? Number(cargo.stackableHeight) : undefined,
      isStackable: cargo.isStackable || false,
      // Temperature
      temperatureMin: cargo.temperatureMin ? Number(cargo.temperatureMin) : undefined,
      temperatureMax: cargo.temperatureMax ? Number(cargo.temperatureMax) : undefined,
      requiresHumidityControl: cargo.requiresHumidityControl || false,
      // Loading requirements
      requiresForklift: cargo.requiresForklift || false,
      requiresCrane: cargo.requiresCrane || false,
      requiresLoadingDock: cargo.requiresLoadingDock || false,
      loadingTimeEstimate: cargo.loadingTimeEstimate ? Number(cargo.loadingTimeEstimate) : undefined,
      unloadingTimeEstimate: cargo.unloadingTimeEstimate ? Number(cargo.unloadingTimeEstimate) : undefined,
      // Hazmat
      hazmatClass: cargo.hazmatClass || "",
      hazmatNumber: cargo.hazmatNumber || "",
      // Urgency
      urgencyLevel: cargo.urgencyLevel || "NORMAL",
      isTimeCritical: cargo.isTimeCritical || false,
      maxTransitTime: cargo.maxTransitTime ? Number(cargo.maxTransitTime) : undefined,
      // Packaging
      packagingType: cargo.packagingType || "",
      numberOfPieces: cargo.numberOfPieces ? Number(cargo.numberOfPieces) : undefined,
      numberOfPallets: cargo.numberOfPallets ? Number(cargo.numberOfPallets) : undefined,
      // Monitoring
      requiresGpsMonitoring: cargo.requiresGpsMonitoring || false,
      requiresTemperatureMonitoring: cargo.requiresTemperatureMonitoring || false,
      insuranceValue: cargo.insuranceValue ? Number(cargo.insuranceValue) : undefined,
      // Route
      requiresLowClearanceRoute: cargo.requiresLowClearanceRoute || false,
      maxClearanceHeight: cargo.maxClearanceHeight ? Number(cargo.maxClearanceHeight) : undefined,
      requiresEscortVehicle: cargo.requiresEscortVehicle || false,
      // Special handling
      specialHandlingInstructions: cargo.specialHandlingInstructions || "",
      emergencyContactInfo: cargo.emergencyContactInfo || "",
      // Requirements
      truckRequirements: cargo.truckRequirements || {},
      carrierPreferences: cargo.carrierPreferences ? {
        carrierName: cargo.carrierPreferences.preferredCarriers?.[0] || "",
        carrierType: undefined,
      } : {},
      costPreferences: cargo.costPreferences || {},
      // Inspections
      requiresPreShipmentInspection: cargo.requiresPreShipmentInspection || false,
      requiresDeliveryInspection: cargo.requiresDeliveryInspection || false,
      requiresPhotographicDocumentation: cargo.requiresPhotographicDocumentation || false,
      // Location data for form - handle multiple location data structures
      pickupLocation: (() => {
        // Try enriched locations first
        if (cargo.enrichedLocations && Array.isArray(cargo.enrichedLocations)) {
          const enrichedPickup = cargo.enrichedLocations.find((loc: any) => loc.type === "PICKUP");
          if (enrichedPickup?.locationData) {
            const locData = enrichedPickup.locationData;
            return {
              name: locData.name || locData.city || "",
              address: locData.address || locData.formattedAddress || "",
              latitude: locData.coordinates?.latitude || locData.latitude || 0,
              longitude: locData.coordinates?.longitude || locData.longitude || 0,
            };
          }
        }
        // Try regular pickupLocation
        if (cargo.pickupLocation) {
          return {
            name: cargo.pickupLocation.name || "",
            address: cargo.pickupLocation.address || "",
            latitude: cargo.pickupLocation.coordinates?.latitude || 0,
            longitude: cargo.pickupLocation.coordinates?.longitude || 0,
          };
        }
        // Try locations array
        if (Array.isArray(cargo.locations)) {
          const pickupLoc = cargo.locations.find((loc: any) => loc.type === "PICKUP");
          if (pickupLoc?.locationData) {
            const locData = pickupLoc.locationData;
            return {
              name: locData.name || locData.city || "",
              address: locData.address || locData.formattedAddress || "",
              latitude: locData.coordinates?.latitude || locData.latitude || 0,
              longitude: locData.coordinates?.longitude || locData.longitude || 0,
            };
          }
        }
        return null;
      })(),
      deliveryLocation: (() => {
        // Try enriched locations first
        if (cargo.enrichedLocations && Array.isArray(cargo.enrichedLocations)) {
          const enrichedDelivery = cargo.enrichedLocations.find((loc: any) => loc.type === "DELIVERY");
          if (enrichedDelivery?.locationData) {
            const locData = enrichedDelivery.locationData;
            return {
              name: locData.name || locData.city || "",
              address: locData.address || locData.formattedAddress || "",
              latitude: locData.coordinates?.latitude || locData.latitude || 0,
              longitude: locData.coordinates?.longitude || locData.longitude || 0,
            };
          }
        }
        // Try regular deliveryLocation
        if (cargo.deliveryLocation) {
          return {
            name: cargo.deliveryLocation.name || "",
            address: cargo.deliveryLocation.address || "",
            latitude: cargo.deliveryLocation.coordinates?.latitude || 0,
            longitude: cargo.deliveryLocation.coordinates?.longitude || 0,
          };
        }
        // Try locations array
        if (Array.isArray(cargo.locations)) {
          const deliveryLoc = cargo.locations.find((loc: any) => loc.type === "DELIVERY");
          if (deliveryLoc?.locationData) {
            const locData = deliveryLoc.locationData;
            return {
              name: locData.name || locData.city || "",
              address: locData.address || locData.formattedAddress || "",
              latitude: locData.coordinates?.latitude || locData.latitude || 0,
              longitude: locData.coordinates?.longitude || locData.longitude || 0,
            };
          }
        }
        return null;
      })(),
    };
  }, []);

  const handleEditCargo = useCallback(async (cargo: Cargo) => {
    console.log("✏️ Edit cargo clicked:", cargo.id);
    console.log("📦 Cargo data:", cargo);
    console.log("📍 Pickup location:", cargo.pickupLocation);
    console.log("📍 Delivery location:", cargo.deliveryLocation);
    console.log("📍 Enriched locations:", cargo.enrichedLocations);
    console.log("📍 Locations array:", cargo.locations);

    try {
      // Try to fetch full cargo details with relations if locations are missing
      let fullCargo = cargo;
      if (!cargo.pickupLocation || !cargo.deliveryLocation) {
        console.log("⚠️ Locations missing, fetching full cargo details...");
        try {
          const response = await api.get(`/loads/${cargo.id}`);
          if (response.data) {
            fullCargo = { ...cargo, ...response.data };
            console.log("✅ Fetched full cargo:", fullCargo);
          }
        } catch (fetchError) {
          console.warn("⚠️ Could not fetch full cargo, using existing data:", fetchError);
        }
      }

      const formData = transformCargoToFormData(fullCargo);
      console.log("📝 Transformed form data:", formData);

      setEditingCargo(formData);
      setFormMode("edit");
      setShowForm(true);
      console.log("✅ Form should be open now, showForm:", true);
    } catch (error) {
      console.error("❌ Error preparing edit form:", error);
      setError("Failed to load cargo details for editing");
    }
  }, [transformCargoToFormData]);

  const handleCreateNew = useCallback(() => {
    setEditingCargo(null);
    setFormMode("create");
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingCargo(null);
  }, []);

  const handleTruckSelected = useCallback((truckMatch: any) => {
    console.log("Truck selected:", truckMatch);
    // Here you can implement the booking logic
    // For now, just show a success message
    toast.success(
      `Truck ${truckMatch.truckMake} ${truckMatch.truckModel} has been booked for your cargo!`
    );
  }, []);

  const handleAssignBroker = useCallback((cargo: Cargo) => {
    console.log('handleAssignBroker called with cargo:', cargo);
    setSelectedLoadForBroker(cargo);
    setShowAssignBrokerModal(true);
    console.log('Modal state updated - showAssignBrokerModal:', true);
  }, []);

  const handleBrokerAssignmentSuccess = useCallback(() => {
    // Refresh cargos after successful broker assignment
    loadCargos(true);
  }, [loadCargos]);

  // Accessibility: focus management for modal
  useEffect(() => {
    if (selectedCargo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [selectedCargo]);


  // Hide default header on mount
  useEffect(() => {
    if (setHideHeader) {
      setHideHeader(true);
      return () => setHideHeader(false);
    }
  }, [setHideHeader]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 font-['Manrope',sans-serif] antialiased">
        <DashboardHeader onCreateClick={handleCreateNew} />

        {/* Main Content */}
        <div className="max-w-[1536px] mx-auto px-4 md:px-8 lg:px-12 xl:px-20 py-8 md:py-12">
          {/* Breadcrumb Navigation - Styled to match premium theme */}
          <nav className="mb-6 flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 hover:text-teal-600 transition-colors font-medium"
            >
              <Home className="size-3.5 sm:size-4" />
              <span>Dashboard</span>
            </button>
            <ChevronRightIcon className="size-3 sm:size-3.5 text-slate-300" />
            <span className="text-slate-900 font-bold">Cargo Management</span>
          </nav>

          {/* Stats Cards */}
          {/* Stats Cards - Premium Command Center Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] p-5 shadow-lg shadow-slate-900/10 group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-800">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 translate-y-[-10px] bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl transition-all group-hover:from-indigo-500/20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Cargos</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white tracking-tight">{stats.total}</span>
                    <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">+12%</span>
                  </div>
                </div>
                <div className="rounded-xl bg-indigo-500/20 p-2.5 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  <Package className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-800/50">
                <div className="h-full w-[70%] rounded-full bg-indigo-500" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/50 group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-100">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 translate-y-[-10px] bg-gradient-to-br from-emerald-500/10 to-transparent blur-2xl transition-all group-hover:from-emerald-500/20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active / Published</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">{stats.published}</span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-full w-[45%] rounded-full bg-emerald-500" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/50 group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-100">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 translate-y-[-10px] bg-gradient-to-br from-blue-500/10 to-transparent blur-2xl transition-all group-hover:from-blue-500/20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">In Transit</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">{stats.inTransit}</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">En Route</span>
                  </div>
                </div>
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-full w-[20%] rounded-full bg-blue-500" />
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-lg shadow-slate-200/50 group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl border border-slate-100">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 translate-y-[-10px] bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl transition-all group-hover:from-orange-500/20" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Value</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      ${stats.totalValue.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-full w-[85%] rounded-full bg-orange-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-sm">
            {/* Header Section */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                    <span className="truncate"><TranslatedText text="Cargo Dashboard" /></span>
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage and track all your cargo shipments</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center flex-wrap">
                  <Button
                    onClick={handleCreateNew}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white touch-manipulation min-h-[44px] sm:min-h-0 order-1"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span className="hidden sm:inline"><TranslatedText text="Create New Cargo" /></span>
                    <span className="sm:hidden"><TranslatedText text="Create" /></span>
                  </Button>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 order-2">
                    <Button
                      variant={view === "list" ? "default" : "ghost"}
                      size="sm"
                      aria-label="List view"
                      onClick={() => setView("list")}
                      className="h-8 sm:h-8 touch-manipulation min-w-[44px] sm:min-w-0"
                    >
                      <FiList className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={view === "grid" ? "default" : "ghost"}
                      size="sm"
                      aria-label="Grid view"
                      onClick={() => setView("grid")}
                      className="h-8 sm:h-8 touch-manipulation min-w-[44px] sm:min-w-0"
                    >
                      <FiGrid className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Export"
                    onClick={handleExport}
                    className="h-9 sm:h-9 touch-manipulation min-h-[44px] sm:min-h-0 order-3 flex-1 sm:flex-initial"
                  >
                    <FaDownload className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Export</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Refresh"
                    onClick={() => loadCargos(true)}
                    className="h-9 sm:h-9 touch-manipulation min-h-[44px] sm:min-h-0 order-4 flex-1 sm:flex-initial"
                    disabled={loading}
                  >
                    <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline ml-2">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
            <CargoFilters
              filters={filters}
              setFilters={setFilters}
              search={search}
              setSearch={setSearch}
            />

            {error && (
              <div
                className="bg-red-50 border border-red-200 text-red-800 p-3 sm:p-4 rounded-lg flex items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4 shadow-sm"
                role="alert"
              >
                <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                  <FaExclamationTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base">Error loading cargos</p>
                  <p className="text-xs sm:text-sm text-red-600 mt-1 break-words">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center flex-shrink-0"
                  aria-label="Dismiss error"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
            {loading && allCargos.length === 0 ? (
              <CargoSkeleton />
            ) : allCargos.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-3 sm:px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No cargos found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto">
                  {search || Object.keys(filters).length > 0
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by creating your first cargo shipment."}
                </p>
                {(!search && Object.keys(filters).length === 0) && (
                  <Button
                    onClick={handleCreateNew}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white mx-auto touch-manipulation min-h-[44px] sm:min-h-0"
                  >
                    <FaPlus className="w-4 h-4" />
                    <TranslatedText text="Create New Cargo" />
                  </Button>
                )}
              </div>
            ) : (
              <>
                <CargoTable
                  cargos={allCargos.slice((page - 1) * itemsPerPage, page * itemsPerPage) || []}
                  lastCargoRef={lastCargoRef}
                  view={view}
                  onRowClick={setSelectedCargo}
                  onBulkAction={handleBulkAction}
                  onEditCargo={handleEditCargo}
                  onDeleteCargo={handleDeleteCargo}
                  onPublishCargo={handlePublishCargo}
                  onAssignBroker={handleAssignBroker}
                />

                {/* Pagination */}
                {allCargos.length > 0 && (
                  <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 px-3 sm:px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 w-full">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-xs sm:text-sm text-gray-700">
                          Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(page * itemsPerPage, totalCargos)}
                          </span>{' '}
                          of <span className="font-medium">{totalCargos}</span> cargos
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Show:</span>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                            className="h-9 sm:h-9 rounded-md border border-gray-300 bg-white px-2 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 touch-manipulation min-h-[44px] sm:min-h-0"
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1 || loading}
                          className="flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden sm:inline">Previous</span>
                          <span className="sm:hidden">Prev</span>
                        </Button>

                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }

                            return (
                              <Button
                                key={pageNum}
                                variant={page === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                disabled={loading}
                                className={`min-w-[40px] sm:min-w-[40px] touch-manipulation min-h-[44px] sm:min-h-0 ${page === pageNum
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "hover:bg-gray-50"
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= totalPages || loading}
                          className="flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0 flex-1 sm:flex-initial"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <span className="sm:hidden">Next</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <CargoModal
              cargo={selectedCargo}
              onClose={() => setSelectedCargo(null)}
            />

            {/* Assign Broker Modal */}
            {selectedLoadForBroker && (
              <AssignBrokerModal
                isOpen={showAssignBrokerModal}
                onClose={() => {
                  setShowAssignBrokerModal(false);
                  setSelectedLoadForBroker(null);
                }}
                loadId={selectedLoadForBroker.id}
                loadTitle={selectedLoadForBroker.title}
                loadValue={selectedLoadForBroker.loadValue}
                currentBrokerId={(selectedLoadForBroker as any).brokerId}
                onSuccess={handleBrokerAssignmentSuccess}
              />
            )}

            {/* CRUD Form */}
            <EnhancedCargoForm
              isOpen={showForm}
              onClose={handleCloseForm}
              onSubmit={
                formMode === "create" ? handleCreateCargo : handleUpdateCargo
              }
              initialData={editingCargo}
              mode={formMode}
              showTruckSelection={formMode === "create"}
              onTruckSelected={handleTruckSelected}
            />

            {/* Confirmation Dialog */}
            {DialogComponent}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
