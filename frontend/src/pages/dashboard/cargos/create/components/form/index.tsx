import React, { useState, useEffect, useMemo } from "react";
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
} from "@/components/ui";
import CargoFormSections from "./CargoFormSections";
import TruckSelectionModal from "./TruckSelectionModal";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { FileText } from "lucide-react";
import { Icon } from "leaflet";
import HelpTooltip from "@/components/common/HelpTooltip";
import { TranslatedText } from "@/components/translated-text";
import { useTranslation } from "@/hooks/useTranslation";
import BottomSheet from "@/components/common/BottomSheet";

import "leaflet/dist/leaflet.css";
import type {
  CargoFormData,
  ICargoBody,
  ICargoResponse,
} from "../../types/cargo";
import { CARGO_TYPES } from "@/constants/cargo";
import LocationItem from "../LocationItem";
import { RouteIntelligenceService, type RouteInsight } from "@/services/routeIntelligence";
import RouteIntelligenceCard from "./RouteIntelligenceCard";
import { getLocationSuggestions, type LocationIntelligence } from "@/services/enhancedCargoApi";
import LocationIntelligenceCard from "./LocationIntelligenceCard";
import DocumentUploadSection, { type PendingDocument } from "./DocumentUploadSection";
import { uploadCargoDocumentsWithRetry } from "@/services/documentUploadService";
import toast from "react-hot-toast";

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
  const { tSync } = useTranslation();
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
    documents: [],
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
  const [lastSaved] = useState<Date | null>(null);
  const [routeInsight, setRouteInsight] = useState<RouteInsight | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [locationIntelligence, setLocationIntelligence] = useState<{
    pickup: LocationIntelligence | null;
    delivery: LocationIntelligence | null;
  }>({ pickup: null, delivery: null });
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);

  // Apply template data when initialData changes (for editing or continuing drafts)
  useEffect(() => {
    console.log("🔄 Form useEffect triggered:", { isOpen, mode, hasInitialData: !!initialData, initialDataId: initialData?.id });

    // Full data population for: edit mode OR create mode with existing cargo/draft (has id)
    const shouldFullyPopulate = initialData && (mode === "edit" || initialData.id);

    if (shouldFullyPopulate) {
      console.log("📝 Applying full cargo/draft data to form:", initialData);
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
  const handleMapClick = async (lat: number, lng: number) => {
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

    // Fetch location intelligence
    setLoadingIntelligence(true);
    try {
      // In a real app, this would use the coordinates to find nearby facilities
      // For demo purposes, we'll try to find suggestions based on coordinates
      const suggestions = await getLocationSuggestions({ latitude: lat, longitude: lng });

      if (suggestions && suggestions.length > 0) {
        // Use the first suggestion as the facility match
        const match = suggestions[0];
        setLocationIntelligence(prev => ({
          ...prev,
          [activeLocation === 'pickup' ? 'pickup' : 'delivery']: match
        }));

        // Optionally update the location name if it's a known facility
        if (match.name) {
          if (activeLocation === 'pickup') {
            setPickupLocation(prev => prev ? { ...prev, name: match.name } : null);
          } else {
            setDeliveryLocation(prev => prev ? { ...prev, name: match.name } : null);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch location intelligence", err);
    } finally {
      setLoadingIntelligence(false);
    }
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

      // Upload pending documents if any
      const pendingDocs = (formData.documents || []).filter(
        (doc: any) => 'isPending' in doc && doc.isPending
      ) as PendingDocument[];

      if (pendingDocs.length > 0 && result && result.id) {
        try {
          const uploadResult = await uploadCargoDocumentsWithRetry(
            result.id,
            pendingDocs,
            2, // max retries
            (current, total, status) => {
              console.log(`Uploading documents: ${current}/${total} - ${status}`);
            }
          );

          if (uploadResult.failed > 0) {
            toast.error(
              `${uploadResult.successful} of ${uploadResult.total} documents uploaded. ${uploadResult.failed} failed.`,
              { duration: 5000 }
            );
          } else {
            toast.success(`All ${uploadResult.successful} documents uploaded successfully!`);
          }
        } catch (uploadError) {
          console.error('Failed to upload documents:', uploadError);
          toast.error('Cargo created but some documents failed to upload');
        }
      }

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
    { id: "quality", label: "Quality & Inspection", icon: FaCameraRetro },
    { id: "documents", label: "Documentation", icon: FileText },
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
          !!formData.pickupDate &&
          !!formData.deliveryDate
        );
      default:
        return true; // For demo, mark others as complete
    }
  };

  // Effect to fetch Route Insights when cities change
  useEffect(() => {
    const fetchRouteInsights = async () => {
      // Check if we have valid pickup and delivery locations with cities
      const pickupCity = pickupLocation?.name || (formData.pickupLocationId ? 'Unknown' : '');
      const deliveryCity = deliveryLocation?.name || (formData.deliveryLocationId ? 'Unknown' : '');

      // We need at least names to try searching
      if (pickupCity && deliveryCity && pickupCity !== 'Pickup Location' && deliveryCity !== 'Delivery Location') {
        setIsRouteLoading(true);
        try {
          // Extract city names more reliably if possible, or just use the location name
          // In a real app, we'd have structured address data
          const insight = RouteIntelligenceService.getRouteInsights(pickupCity, deliveryCity);
          setRouteInsight(insight);
        } catch (err) {
          console.error("Failed to fetch route insights", err);
        } finally {
          setIsRouteLoading(false);
        }
      } else {
        setRouteInsight(null);
      }
    };

    const timeoutId = setTimeout(fetchRouteInsights, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [pickupLocation, deliveryLocation, formData.pickupLocationId, formData.deliveryLocationId]);

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


  // Auto-save disabled - drafts are only saved when user clicks "Save Draft" button
  // To re-enable auto-save, uncomment the useEffect below:
  /*
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
  */

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="6xl"
      className="p-0"
    >
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none">
        {/* Header - Ported from DialogHeader */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <FaBox className="w-5 h-5 text-[#345E85] dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#0f172a] dark:text-white tracking-tight leading-none">
                  {mode === "create" ? "Create Cargo" : "Edit Cargo"}
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Detailed Specifications & Intelligence
                </p>
              </div>
            </div>

            {/* Progress Indicator - COMPACT */}
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#345E85] dark:text-blue-400 mb-1">
                <span>Completion Status</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                <div
                  className="bg-[#345E85] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
          {/* Mobile Sidebar Toggle */}
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation"
            >
              <FaCogs className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 bg-slate-50 border-r border-slate-100 overflow-y-auto lg:sticky lg:top-0 flex-shrink-0`}>
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
                    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-left transition-all ${activeSection === section.id
                      ? "bg-[#345E85] text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-500 hover:bg-slate-100 font-bold"
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

              {/* Photos Display - Moved to Top */}
              {photos.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <FaCameraRetro className="w-4 h-4 mr-2 text-blue-600" />
                    Uploaded Photos ({photos.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Cargo photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-white shadow-md group-hover:shadow-lg transition-shadow"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions Display - Moved to Top */}
              {suggestions && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <FaCheck className="w-4 h-4 mr-2 text-green-600" />
                    Applied AI Suggestions
                  </h4>
                  <div className="space-y-2">
                    {suggestions.suggestions?.map(
                      (suggestion: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-start text-sm text-gray-700 bg-white rounded-lg p-2"
                        >
                          <FaCheck className="w-4 h-4 mr-2 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{suggestion.title}</span>
                        </div>
                      )
                    )}
                  </div>
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

                    {/* Route Intelligence Widget */}
                    <RouteIntelligenceCard insight={routeInsight} loading={isRouteLoading} />

                    {/* Location Intelligence Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {pickupLocation && (
                        <div>
                          {loadingIntelligence && activeLocation === 'pickup' ? (
                            <LocationIntelligenceCard intelligence={null} loading={true} />
                          ) : (
                            locationIntelligence.pickup && <LocationIntelligenceCard intelligence={locationIntelligence.pickup} />
                          )}
                        </div>
                      )}
                      {deliveryLocation && (
                        <div>
                          {loadingIntelligence && activeLocation === 'delivery' ? (
                            <LocationIntelligenceCard intelligence={null} loading={true} />
                          ) : (
                            locationIntelligence.delivery && <LocationIntelligenceCard intelligence={locationIntelligence.delivery} />
                          )}
                        </div>
                      )}
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

              {/* Documentation Section - MOVED FROM FOOTER TO TAB */}
              {activeSection === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50">
                      <FileText className="w-4 h-4 text-[#345E85]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#0f172a] tracking-tight uppercase">
                        Documentation
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Upload Permits, Invoices & Photos
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none">
                    <DocumentUploadSection
                      cargoId={createdCargoId || initialData?.id || null}
                      documents={formData.documents || []}
                      onDocumentsChange={(docs) => setFormData(prev => ({ ...prev, documents: docs }))}
                      allowPendingDocuments={true}
                    />
                  </div>
                </div>
              )}

              {/* Ready to Submit Indicator - Moved inside content área for better flow */}
              {draftSaved && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FaCheck className="text-blue-600 w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-sm">Draft Saved Successfully</h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Your progress is secure. Once you're ready, click the <b>Submit</b> button below to publish this cargo.
                    </p>
                  </div>
                </div>
              )}

              {/* Stepper Navigation & Form Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
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
                {/* Unified Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                  {onSaveDraft && (
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={loading}
                      className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all font-bold text-sm flex items-center justify-center gap-2"
                    >
                      <FaSave className="w-4 h-4" />
                      <span>SAVE DRAFT</span>
                    </button>
                  )}

                  <div className="flex-1" />

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-2.5 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all font-bold text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-10 py-2.5 bg-[#345E85] text-white rounded-2xl transition-all font-black text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-slate-800"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>SAVING...</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === "create" ? "CREATE CARGO" : "UPDATE CARGO"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </BottomSheet>

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
    </>
  );
};

export default EnhancedCargoForm;
