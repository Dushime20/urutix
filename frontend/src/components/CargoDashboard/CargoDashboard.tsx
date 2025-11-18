import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Icon } from "leaflet";
import {
  FaSync,
  FaDownload,
  FaExclamationTriangle,
  FaPlus,
} from "react-icons/fa";
import { FiGrid, FiList } from "react-icons/fi";
import { CargoFilters } from "./CargoFilters";
import { CargoModal } from "./CargoModal";
import { CargoSkeleton } from "./CargoSkeleton";
import { CargoTable } from "./CargoTable";
import { ErrorBoundary } from "../ErrorBoundary";
import EnhancedCargoForm from "../../pages/dashboard/cargos/create/components/form";

import "leaflet/dist/leaflet.css";
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
}

interface CargoFilters {
  status?: string;
  cargoType?: string;
  urgencyLevel?: string;
  isHazardous?: boolean;
  requiresRefrigeration?: boolean;
  isTimeCritical?: boolean;
}

interface CargoData {
  items: Cargo[];
  total: number;
  hasMore: boolean;
}

type CargoFiltersType = CargoFilters;

// Fix default marker icon for Leaflet in React
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { Button } from "../ui";

const cargoIcon = new Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const CargoDashboard: React.FC = () => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCargo, setSelectedCargo] = useState<Cargo | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");
  const [filters, setFilters] = useState<CargoFiltersType>({});
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const observer = useRef<IntersectionObserver | null>(null);

  // CRUD state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  // Fetch cargos with filters, search, and pagination

  const loadCargos = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        // Only send search to API if it's not empty (to avoid 500 errors)
        const apiSearch = search && search.trim() ? search.trim() : undefined;
        const items = await fetchCargos(page, apiSearch, filters);
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
        
        setCargos((prev) => (reset ? filteredItems : [...prev, ...filteredItems]));
        setHasMore(filteredItems.length > 0);
        setPage((prev) => (reset ? 2 : prev + 1));
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
            
            setCargos((prev) => (reset ? filteredItems : [...prev, ...filteredItems]));
            setHasMore(filteredItems.length > 0);
            setPage((prev) => (reset ? 2 : prev + 1));
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
    [filters, search, page]
  );

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
    alert(`Bulk action: ${action} on ${selectedIds.length} cargos`);
  };

  // CRUD Functions
  const handleCreateCargo = useCallback(async (cargoData: any) => {
    try {
      const newCargo = await createCargo(cargoData);
      setCargos((prev) => [newCargo, ...prev]);
      setShowForm(false);
    } catch (error: any) {
      console.error("Error creating cargo:", error);
      throw error;
    }
  }, []);

  const handleUpdateCargo = useCallback(
    async (cargoData: any) => {
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
      } catch (error: any) {
        console.error("Error updating cargo:", error);
        throw error;
      }
    },
    [editingCargo]
  );

  const handleDeleteCargo = useCallback(async (cargoId: string) => {
    if (!window.confirm("Are you sure you want to delete this cargo?")) return;

    try {
      await deleteCargo(cargoId);
      setCargos((prev) => prev.filter((cargo) => cargo.id !== cargoId));
    } catch (error: any) {
      console.error("Error deleting cargo:", error);
      setError("Failed to delete cargo");
    }
  }, []);

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
    alert(
      `Truck ${truckMatch.truckMake} ${truckMatch.truckModel} has been booked for your cargo!`
    );
  }, []);

  // Accessibility: focus management for modal
  useEffect(() => {
    if (selectedCargo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [selectedCargo]);

  return (
    <ErrorBoundary>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">Cargo Dashboard</h1>
          <div className="flex gap-2 items-center">
            <Button
              onClick={handleCreateNew}
              className="flex items-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Create New Cargo
            </Button>
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              aria-label="Grid view"
              onClick={() => setView("grid")}
            >
              <FiGrid />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              aria-label="List view"
              onClick={() => setView("list")}
            >
              <FiList />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Export"
              onClick={handleExport}
            >
              <FaDownload />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Refresh"
              onClick={() => loadCargos(true)}
            >
              <FaSync />
            </Button>
          </div>
        </div>
        <CargoFilters
          filters={filters}
          setFilters={setFilters}
          search={search}
          setSearch={setSearch}
        />
        <div className="my-4 relative z-10 fleet-map-container">
          <MapContainer
            center={[0, 0]}
            zoom={2}
            style={{ width: "100%", height: 300 }}
            scrollWheelZoom={true}
            aria-label="Cargo locations map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {(cargos || []).map((cargo) => {
              const pickupCoords = cargo.pickupLocation?.coordinates;
              if (
                pickupCoords &&
                pickupCoords.latitude &&
                pickupCoords.longitude
              ) {
                return (
                  <Marker
                    key={cargo.id}
                    position={[pickupCoords.latitude, pickupCoords.longitude]}
                    icon={cargoIcon}
                  />
                );
              }
              return null;
            })}
          </MapContainer>
        </div>
        {error && (
          <div
            className="bg-red-100 text-red-700 p-4 rounded flex items-center gap-2 mb-4"
            role="alert"
          >
            <FaExclamationTriangle /> {error}
          </div>
        )}
        {loading && (cargos || []).length === 0 ? (
          <CargoSkeleton />
        ) : (
          <CargoTable
            cargos={cargos || []}
            lastCargoRef={lastCargoRef}
            view={view}
            onRowClick={setSelectedCargo}
            onBulkAction={handleBulkAction}
            onEditCargo={handleEditCargo}
            onDeleteCargo={handleDeleteCargo}
            onPublishCargo={handlePublishCargo}
          />
        )}
        <CargoModal
          cargo={selectedCargo}
          onClose={() => setSelectedCargo(null)}
        />

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
      </div>
    </ErrorBoundary>
  );
};
