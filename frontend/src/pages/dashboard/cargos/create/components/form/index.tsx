import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  FaSave,
  FaMapMarkerAlt,
  FaCalendar,
  FaBox,
  FaMapPin,
  FaThermometerHalf,
  FaShieldAlt,
  FaTruck,
  FaClock,
  FaCameraRetro,
  FaCogs,
  FaRulerCombined,
  FaLocationArrow,
  FaCheck,
} from "react-icons/fa";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import CargoFormSections from "./CargoFormSections";
import TruckSelectionModal from "./TruckSelectionModal";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import HelpTooltip from "@/components/common/HelpTooltip";

import "leaflet/dist/leaflet.css";
import type {
  CargoFormData,
  ICargoBody,
  ICargoResponse,
} from "../../types/cargo";
import { CARGO_TYPES } from "@/constants/cargo";
import LocationItem from "../LocationItem";

interface Location {
  id?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface EnhancedCargoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ICargoBody) => Promise<ICargoResponse>;
  initialData?: any;
  mode: "create" | "edit";
  onTruckSelected?: (truckMatch: any) => void;
  showTruckSelection?: boolean;
  onSaveDraft?: (formData: any) => Promise<void>;
  uploadedPhotos?: string[];
  aiSuggestions?: any;
}

const generateTempId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const EnhancedCargoForm: React.FC<EnhancedCargoFormProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  initialData,
  onSaveDraft,
  onTruckSelected,
  showTruckSelection = false,
  uploadedPhotos = [],
  aiSuggestions,
}) => {
  // Debug logging
  console.log("EnhancedCargoForm rendered with:", {
    isOpen,
    mode,
    onClose: typeof onClose,
  });
  const [formData, setFormData] = useState<CargoFormData>({
    title: "",
    description: "",
    weight: 0,
    volume: 0,
    cargoType: "GENERAL",
    loadType: "FTL",
    equipmentType: "DRY_VAN",
    visibility: "public",
    unitsRequired: 1,
    pickupLocationId: "",
    deliveryLocationId: "",
    pickupDate: "",
    deliveryDate: "",
    loadValue: 0,
    offeredPrice: 0,
    currencyCode: "USD",
    paymentTerms: "Net30",
    isFragile: false,
    isHazardous: false,
    requiresRefrigeration: false,
    specialRequirements: "",
    autoMatchEnabled: true,
    loadingInstructions: "",
    unloadingInstructions: "",
    // Contact info fields
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    // Enhanced fields with defaults
    urgencyLevel: "NORMAL",
    isTimeCritical: false,
    isStackable: false,
    requiresHumidityControl: false,
    requiresForklift: false,
    requiresCrane: false,
    requiresLoadingDock: false,
    requiresGpsMonitoring: false,
    requiresTemperatureMonitoring: false,
    requiresLowClearanceRoute: false,
    requiresEscortVehicle: false,
    requiresPreShipmentInspection: false,
    requiresDeliveryInspection: false,
    requiresPhotographicDocumentation: false,
    // Initialize complex objects
    truckRequirements: {},
    carrierPreferences: {},
    costPreferences: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("basic");
  // Track completed sections
  const [completedSections, setCompletedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Scroll to top on section change
  useEffect(() => {
    const content = document.getElementById("cargo-form-content");
    if (content) content.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Location | null>(
    null
  );
  const [activeLocation, setActiveLocation] = useState<
    "pickup" | "delivery" | null
  >(null);
  const [showTruckSelectionModal, setShowTruckSelectionModal] = useState(false);
  const [createdCargoId, setCreatedCargoId] = useState<string | null>(null);
  const [createdCargoData, setCreatedCargoData] = useState<any>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [photos, setPhotos] = useState<string[]>(uploadedPhotos);
  const [suggestions, setSuggestions] = useState<any>(aiSuggestions);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Apply template data when initialData changes (for editing)
  useEffect(() => {
    console.log("🔄 Form useEffect triggered:", { isOpen, mode, hasInitialData: !!initialData });
    if (initialData && mode === "edit") {
      console.log("📝 Applying edit data to form:", initialData);
      // Transform and apply all cargo data to form
      const transformedData: any = {
        ...initialData,
        // Ensure defaults for fields that might be missing
        loadType: initialData.loadType || "FTL",
        equipmentType: initialData.equipmentType || "DRY_VAN",
        visibility: initialData.visibility || "public",
        unitsRequired: initialData.unitsRequired !== undefined ? initialData.unitsRequired : 1,
        paymentTerms: initialData.paymentTerms || "Net30",
        // Ensure boolean fields are properly set
        isFragile: initialData.isFragile ?? false,
        isHazardous: initialData.isHazardous ?? false,
        requiresRefrigeration: initialData.requiresRefrigeration ?? false,
        autoMatchEnabled: initialData.autoMatchEnabled !== undefined ? initialData.autoMatchEnabled : true,
        isStackable: initialData.isStackable ?? false,
        isTimeCritical: initialData.isTimeCritical ?? false,
        requiresHumidityControl: initialData.requiresHumidityControl ?? false,
        requiresForklift: initialData.requiresForklift ?? false,
        requiresCrane: initialData.requiresCrane ?? false,
        requiresLoadingDock: initialData.requiresLoadingDock ?? false,
        requiresGpsMonitoring: initialData.requiresGpsMonitoring ?? false,
        requiresTemperatureMonitoring: initialData.requiresTemperatureMonitoring ?? false,
        requiresLowClearanceRoute: initialData.requiresLowClearanceRoute ?? false,
        requiresEscortVehicle: initialData.requiresEscortVehicle ?? false,
        requiresPreShipmentInspection: initialData.requiresPreShipmentInspection ?? false,
        requiresDeliveryInspection: initialData.requiresDeliveryInspection ?? false,
        requiresPhotographicDocumentation: initialData.requiresPhotographicDocumentation ?? false,
        // Ensure complex objects are properly initialized
        truckRequirements: initialData.truckRequirements || {},
        carrierPreferences: initialData.carrierPreferences || {},
        costPreferences: initialData.costPreferences || {},
        // Ensure urgency level has a default
        urgencyLevel: initialData.urgencyLevel || "NORMAL",
      };

      setFormData((prev) => ({
        ...prev,
        ...transformedData,
      }));

      // Set location data if available
      if (initialData.pickupLocation) {
        setPickupLocation({
          name: initialData.pickupLocation.name || "",
          address: initialData.pickupLocation.address || "",
          latitude: initialData.pickupLocation.latitude || 0,
          longitude: initialData.pickupLocation.longitude || 0,
        });
      }

      if (initialData.deliveryLocation) {
        setDeliveryLocation({
          name: initialData.deliveryLocation.name || "",
          address: initialData.deliveryLocation.address || "",
          latitude: initialData.deliveryLocation.latitude || 0,
          longitude: initialData.deliveryLocation.longitude || 0,
        });
      }

      // Apply AI suggestions if available
      if (aiSuggestions) {
        setSuggestions(aiSuggestions);
        applyAISuggestions(aiSuggestions);
      }
    } else if (initialData && mode === "create") {
      // For create mode with template (like from loadItem)
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        loadType: initialData.loadType || prev.loadType,
        equipmentType: initialData.equipmentType || prev.equipmentType,
        visibility: initialData.visibility || prev.visibility,
        unitsRequired:
          initialData.unitsRequired !== undefined
            ? initialData.unitsRequired
            : prev.unitsRequired,
        paymentTerms: initialData.paymentTerms || prev.paymentTerms,
      }));

      // Apply AI suggestions if available
      if (aiSuggestions) {
        setSuggestions(aiSuggestions);
        applyAISuggestions(aiSuggestions);
      }
    }
  }, [initialData, aiSuggestions, mode]);

  // Reset form when modal closes (but not when opening with initialData)
  useEffect(() => {
    if (!isOpen && !initialData) {
      // Only reset if modal is closed and there's no initial data
      // This prevents resetting when we're about to open with edit data
      setFormData({
        title: "",
        description: "",
        weight: 0,
        volume: 0,
        cargoType: "GENERAL",
        loadType: "FTL",
        equipmentType: "DRY_VAN",
        visibility: "public",
        unitsRequired: 1,
        pickupLocationId: "",
        deliveryLocationId: "",
        pickupDate: "",
        deliveryDate: "",
        loadValue: 0,
        offeredPrice: 0,
        currencyCode: "USD",
        paymentTerms: "Net30",
        isFragile: false,
        isHazardous: false,
        requiresRefrigeration: false,
        specialRequirements: "",
        autoMatchEnabled: true,
        loadingInstructions: "",
        unloadingInstructions: "",
        contactPerson: "",
        contactPhone: "",
        contactEmail: "",
        urgencyLevel: "NORMAL",
        isTimeCritical: false,
        isStackable: false,
        requiresHumidityControl: false,
        requiresForklift: false,
        requiresCrane: false,
        requiresLoadingDock: false,
        requiresGpsMonitoring: false,
        requiresTemperatureMonitoring: false,
        requiresLowClearanceRoute: false,
        requiresEscortVehicle: false,
        requiresPreShipmentInspection: false,
        requiresDeliveryInspection: false,
        requiresPhotographicDocumentation: false,
        truckRequirements: {},
        carrierPreferences: {},
        costPreferences: {},
      });
      setPickupLocation(null);
      setDeliveryLocation(null);
      setError(null);
    }
  }, [isOpen, initialData]);

  // Apply photos when uploadedPhotos changes
  useEffect(() => {
    if (uploadedPhotos.length > 0) {
      setPhotos(uploadedPhotos);
    }
  }, [uploadedPhotos]);

  const applyAISuggestions = (suggestions: any) => {
    if (!suggestions?.suggestions) return;

    const newFormData = { ...formData };

    suggestions.suggestions.forEach((suggestion: any) => {
      switch (suggestion.type) {
        case "packaging":
          if (suggestion.implementation.includes("anti-static")) {
            newFormData.packagingType = "ANTI_STATIC";
          }
          break;
        case "truck":
          if (suggestion.implementation.includes("refrigerated")) {
            newFormData.requiresRefrigeration = true;
            newFormData.truckRequirements = {
              ...newFormData.truckRequirements,
              requiredTruckTypes: ["REFRIGERATED", "BOX_TRUCK"],
              requiredFeatures: ["GPS", "TEMPERATURE_MONITORING"],
            };
          }
          break;
        case "timing":
          // Apply timing suggestions
          break;
        case "cost":
          // Apply cost optimization suggestions
          break;
      }
    });

    setFormData(newFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : parseFloat(value),
    }));
  };

  // Map click handler component
  const MapClickHandler: React.FC<{
    onMapClick: (lat: number, lng: number) => void;
  }> = ({ onMapClick }) => {
    useMapEvents({
      click: (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    if (!activeLocation) return;

    const newLocation: Location = {
      name: `${activeLocation === "pickup" ? "Pickup" : "Delivery"} Location`,
      address: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
    };

    if (activeLocation === "pickup") {
      setPickupLocation(newLocation);
      setFormData((prev) => ({
        ...prev,
        pickupLocationId: newLocation.id || "",
      }));
    } else {
      setDeliveryLocation(newLocation);
      setFormData((prev) => ({
        ...prev,
        deliveryLocationId: newLocation.id || "",
      }));
    }

    setActiveLocation(null);
  };

  // Custom marker icon
  const createCustomIcon = (color: string) =>
    new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>
    `)}`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;

    setLoading(true);
    try {
      await onSaveDraft({
        ...formData,
        photos,
        suggestions,
        status: "DRAFT",
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save draft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Transform data to match backend expectations
      const submissionData: ICargoBody = {
        ...(formData as any),
        // Transform locations to match backend LoadLocationDto format
        locations: [
          {
            id:
              pickupLocation?.id ||
              formData.pickupLocationId ||
              generateTempId("pickup"),
            type: "PICKUP" as const,
            sequence: 1,
            locationData: {
              name: pickupLocation?.name || "Pickup Location",
              address: pickupLocation?.address || "",
              coordinates: {
                latitude: pickupLocation?.latitude || 0,
                longitude: pickupLocation?.longitude || 0,
              },
              contactInfo: {
                contactPerson: formData.contactPerson,
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail,
              },
              operatingHours: {},
              specialInstructions: formData.loadingInstructions,
              accessInstructions: "",
            },
            scheduledDate: formData.pickupDate,
            estimatedTime: formData.loadingTimeEstimate || 60, // Default 1 hour
            requirements: {
              requiresForklift: formData.requiresForklift,
              requiresCrane: formData.requiresCrane,
              requiresLoadingDock: formData.requiresLoadingDock,
              hazmatCertified: formData.isHazardous,
              temperatureControlled: formData.requiresRefrigeration,
              securityClearance: "STANDARD",
            },
            status: "PENDING" as const,
          },
          {
            id:
              deliveryLocation?.id ||
              formData.deliveryLocationId ||
              generateTempId("delivery"),
            type: "DELIVERY" as const,
            sequence: 2,
            locationData: {
              name: deliveryLocation?.name || "Delivery Location",
              address: deliveryLocation?.address || "",
              coordinates: {
                latitude: deliveryLocation?.latitude || 0,
                longitude: deliveryLocation?.longitude || 0,
              },
              contactInfo: {
                contactPerson: formData.contactPerson,
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail,
              },
              operatingHours: {},
              specialInstructions: formData.unloadingInstructions,
              accessInstructions: "",
            },
            scheduledDate: formData.deliveryDate,
            estimatedTime: formData.unloadingTimeEstimate || 60, // Default 1 hour
            requirements: {
              requiresForklift: formData.requiresForklift,
              requiresCrane: formData.requiresCrane,
              requiresLoadingDock: formData.requiresLoadingDock,
              hazmatCertified: formData.isHazardous,
              temperatureControlled: formData.requiresRefrigeration,
              securityClearance: "STANDARD",
            },
            status: "PENDING" as const,
          },
        ],
        // Ensure cargoType is a valid enum value
        cargoType:
          formData.cargoType === "ELECTRONICS" ? "FRAGILE" : formData.cargoType,
        // Add missing fields that backend expects
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        contactInfo: {
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
        },
        matchingCriteria: {},
      };

      const result = await onSubmit(submissionData);

      // If this is a create operation and truck selection is enabled, show truck selection modal
      if (mode === "create" && showTruckSelection && result && result.id) {
        setCreatedCargoId(result.id);
        setCreatedCargoData(submissionData);
        setShowTruckSelectionModal(true);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save cargo");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: "basic", label: "Basic Information", icon: FaBox },
    {
      id: "dimensions",
      label: "Dimensions & Packaging",
      icon: FaRulerCombined,
    },
    {
      id: "environmental",
      label: "Environmental Requirements",
      icon: FaThermometerHalf,
    },
    { id: "loading", label: "Loading & Unloading", icon: FaTruck },
    { id: "security", label: "Security & Insurance", icon: FaShieldAlt },
    { id: "route", label: "Route & Access", icon: FaLocationArrow },
    { id: "urgency", label: "Urgency & Timing", icon: FaClock },
    { id: "matching", label: "Matching Criteria", icon: FaCogs },
    { id: "quality", label: "Quality & Inspection", icon: FaCameraRetro },
  ];

  // Simple section validation (customize as needed)
  const isSectionComplete = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return (
          !!formData.title &&
          !!formData.cargoType &&
          formData.weight > 0 &&
          formData.loadValue > 0
        );
      case "route":
        return (
          !!pickupLocation &&
          !!deliveryLocation &&
          !!formData.pickupDate &&
          !!formData.deliveryDate
        );
      default:
        return true; // For demo, mark others as complete
    }
  };

  useEffect(() => {
    // Update completed sections on formData/location change
    setCompletedSections((prev) => {
      const updated: { [key: string]: boolean } = { ...prev };
      sections.forEach((s) => {
        updated[s.id] = isSectionComplete(s.id);
      });
      return updated;
    });
    // eslint-disable-next-line
  }, [formData, pickupLocation, deliveryLocation]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const completedCount = sections.filter(s => completedSections[s.id]).length;
    return Math.round((completedCount / sections.length) * 100);
  }, [completedSections, sections]);

  // Auto-save functionality
  const handleAutoSave = useCallback(async () => {
    if (!onSaveDraft || mode === 'edit') return;
    
    setIsAutoSaving(true);
    try {
      await onSaveDraft({
        ...formData,
        pickupLocation,
        deliveryLocation,
      });
      setDraftSaved(true);
      setLastSaved(new Date());
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, pickupLocation, deliveryLocation, onSaveDraft, mode]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if there's meaningful data
    const hasData = formData.title || formData.description || pickupLocation || deliveryLocation;
    if (hasData && mode === 'create' && onSaveDraft) {
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, pickupLocation, deliveryLocation, handleAutoSave, mode, onSaveDraft]);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 sm:p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base sm:text-lg font-bold text-gray-900">
              {mode === "create" ? "Create Cargo" : "Edit Cargo"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 mt-0.5">
              Enter detailed cargo information for optimal matching
            </DialogDescription>
            
            {/* Progress Indicator */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Form Completion</span>
                <span className="font-medium text-gray-900">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                {isAutoSaving ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-2.5 w-2.5 border-b border-primary-600"></div>
                    Auto-saving...
                  </span>
                ) : draftSaved ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <FaCheck className="w-2.5 h-2.5" />
                    Draft saved
                  </span>
                ) : lastSaved ? (
                  <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
                ) : null}
                <span>{sections.filter(s => completedSections[s.id]).length} of {sections.length} sections complete</span>
              </div>
            </div>
          </div>
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation"
          >
            <FaCogs className="w-5 h-5 text-gray-600" />
          </button>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)] min-h-0">
          {/* Sidebar Navigation */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-56 bg-gray-50 border-r border-gray-200 overflow-y-auto lg:sticky lg:top-0 flex-shrink-0`}>
            <nav className="p-2 sm:p-3 space-y-1.5">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? "bg-primary-100 text-primary-700 border border-primary-200"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title={
                      completedSections[section.id]
                        ? "Section complete"
                        : "Section incomplete"
                    }
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{section.label}</span>
                    {completedSections[section.id] ? (
                      <span className="ml-auto text-green-500 text-xs flex-shrink-0" title="Complete">
                        &#10003;
                      </span>
                    ) : (
                      <span
                        className="ml-auto text-gray-300 text-xs flex-shrink-0"
                        title="Incomplete"
                      >
                        &#9675;
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-w-0" id="cargo-form-content">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              )}

              {/* Basic Information Section */}
              {activeSection === "basic" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <FaBox className="w-4 h-4 mr-2" />
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <Label
                        htmlFor="title"
                        className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5"
                      >
                        Cargo Title *
                        <HelpTooltip
                          content="Enter a clear, descriptive title for your cargo. This helps transporters quickly understand what they'll be shipping."
                          title="Cargo Title"
                        />
                      </Label>
                      <Input
                        id="title"
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Enter cargo title"
                        className="text-sm w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="cargoType"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Cargo Type *
                      </Label>
                      <Select
                        name="cargoType"
                        value={formData.cargoType}
                        onValueChange={(value) =>
                          handleChange({
                            target: { name: "cargoType", value },
                          } as any)
                        }
                      >
                        <SelectTrigger className="text-sm w-full">
                          <SelectValue placeholder="Select cargo type" />
                        </SelectTrigger>
                        <SelectContent>
                          {CARGO_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="weight"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Weight (kg) *
                      </Label>
                      <Input
                        id="weight"
                        type="number"
                        name="weight"
                        value={formData.weight || ""}
                        onChange={handleNumberChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter weight in kg"
                        className="text-sm w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="volume"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Volume (m³)
                      </Label>
                      <Input
                        id="volume"
                        type="number"
                        name="volume"
                        value={formData.volume || ""}
                        onChange={handleNumberChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter volume in m³"
                        className="text-sm w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="loadValue"
                        className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5"
                      >
                        Load Value ($) *
                        <HelpTooltip
                          content="The total declared value of your cargo. This is used for insurance purposes and helps determine appropriate pricing."
                          title="Load Value"
                        />
                      </Label>
                      <Input
                        id="loadValue"
                        type="number"
                        name="loadValue"
                        value={formData.loadValue || ""}
                        onChange={handleNumberChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter load value"
                        className="text-sm w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="offeredPrice"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Offered Price ($)
                      </Label>
                      <Input
                        id="offeredPrice"
                        type="number"
                        name="offeredPrice"
                        value={formData.offeredPrice || ""}
                        onChange={handleNumberChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter offered price"
                        className="text-sm w-full"
                      />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <Label
                      htmlFor="description"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Description
                    </Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
                      placeholder="Enter cargo description"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isFragile"
                        checked={formData.isFragile}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span className="text-xs text-gray-700">
                        Fragile Cargo
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isHazardous"
                        checked={formData.isHazardous}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span className="text-xs text-gray-700">
                        Hazardous Materials
                      </span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="requiresRefrigeration"
                        checked={formData.requiresRefrigeration}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                      />
                      <span className="text-xs text-gray-700">
                        Requires Refrigeration
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Route Information Section */}
              {activeSection === "route" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <FaLocationArrow className="w-4 h-4 mr-2" />
                    Route Information
                  </h3>

                  {/* Location Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
                      <FaMapMarkerAlt className="inline w-3.5 h-3.5 mr-1.5" />
                      Locations *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <LocationItem
                        type="pickup"
                        location={pickupLocation}
                        isActive={activeLocation === "pickup"}
                        onSelect={() => setActiveLocation("pickup")}
                      />
                      <LocationItem
                        type="delivery"
                        location={deliveryLocation}
                        isActive={activeLocation === "delivery"}
                        onSelect={() => setActiveLocation("delivery")}
                      />
                    </div>

                    {/* Map */}
                    <div className="h-48 sm:h-64 rounded-lg overflow-hidden border border-gray-300 w-full">
                      <MapContainer
                        center={[0, 0]}
                        zoom={2}
                        style={{ height: "100%", width: "100%" }}
                        scrollWheelZoom={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} />

                        {/* Pickup Marker */}
                        {pickupLocation && (
                          <Marker
                            position={[
                              pickupLocation.latitude,
                              pickupLocation.longitude,
                            ]}
                            icon={createCustomIcon("#3B82F6")}
                          />
                        )}

                        {/* Delivery Marker */}
                        {deliveryLocation && (
                          <Marker
                            position={[
                              deliveryLocation.latitude,
                              deliveryLocation.longitude,
                            ]}
                            icon={createCustomIcon("#10B981")}
                          />
                        )}
                      </MapContainer>
                    </div>

                    {activeLocation && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm text-yellow-800">
                          <FaMapPin className="inline w-4 h-4 mr-1" />
                          Click on the map to set{" "}
                          {activeLocation === "pickup"
                            ? "pickup"
                            : "delivery"}{" "}
                          location
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="min-w-0">
                      <Label
                        htmlFor="pickupDate"
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                      >
                        <FaCalendar className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        Pickup Date *
                      </Label>
                      <Input
                        id="pickupDate"
                        type="date"
                        name="pickupDate"
                        value={formData.pickupDate}
                        onChange={handleChange}
                        required
                        className="w-full text-sm"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label
                        htmlFor="deliveryDate"
                        className="block text-xs sm:text-sm font-medium text-gray-700 mb-2"
                      >
                        <FaCalendar className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                        Delivery Date *
                      </Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        required
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Import and use the form sections component */}
              <CargoFormSections
                formData={formData}
                handleChange={handleChange}
                handleNumberChange={handleNumberChange}
                activeSection={activeSection}
              />

              {/* Stepper Navigation & Form Actions */}
              <DialogFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = sections.findIndex(
                        (s) => s.id === activeSection
                      );
                      if (idx > 0) setActiveSection(sections[idx - 1].id);
                    }}
                    disabled={
                      sections.findIndex((s) => s.id === activeSection) === 0
                    }
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idx = sections.findIndex(
                        (s) => s.id === activeSection
                      );
                      if (idx < sections.length - 1)
                        setActiveSection(sections[idx + 1].id);
                    }}
                    disabled={
                      sections.findIndex((s) => s.id === activeSection) ===
                        sections.length - 1 || !completedSections[activeSection]
                    }
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Draft Save Button */}
                  {onSaveDraft && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={loading}
                      className="flex-1 sm:flex-initial px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                      <FaSave className="w-3.5 h-3.5 mr-1.5" />
                      <span className="hidden sm:inline">Save Draft</span>
                      <span className="sm:hidden">Draft</span>
                    </button>
                  )}

                  {/* Draft Saved Indicator */}
                  {draftSaved && (
                    <div className="flex items-center text-green-600 text-xs">
                      <FaCheck className="w-3.5 h-3.5 mr-1" />
                      Draft saved
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      console.log("Cancel button clicked");
                      e.preventDefault();
                      e.stopPropagation();
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 sm:flex-initial px-3 py-2 text-xs sm:text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-1.5"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <FaSave className="w-3.5 h-3.5 mr-1.5" />
                        <span>{mode === "create" ? "Create" : "Update"}</span>
                      </>
                    )}
                  </button>
                </div>
              </DialogFooter>

              {/* Photos Display */}
              {photos.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-900 mb-2">
                    Uploaded Photos
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Cargo photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions Display */}
              {suggestions && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-xs font-medium text-blue-900 mb-2">
                    Applied AI Suggestions
                  </h4>
                  <div className="space-y-1.5">
                    {suggestions.suggestions?.map(
                      (suggestion: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center text-xs text-blue-800"
                        >
                          <FaCheck className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                          {suggestion.title}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </DialogContent>

      {/* Truck Selection Modal */}
      {showTruckSelectionModal && createdCargoId && (
        <TruckSelectionModal
          isOpen={showTruckSelectionModal}
          onClose={() => {
            setShowTruckSelectionModal(false);
            setCreatedCargoId(null);
            setCreatedCargoData(null);
            onClose();
          }}
          loadId={createdCargoId}
          onTruckSelected={(truckMatch) => {
            if (onTruckSelected) {
              onTruckSelected(truckMatch);
            }
            setShowTruckSelectionModal(false);
            setCreatedCargoId(null);
            setCreatedCargoData(null);
            onClose();
          }}
          cargoData={createdCargoData}
        />
      )}
    </Dialog>
  );
};

export default EnhancedCargoForm;
