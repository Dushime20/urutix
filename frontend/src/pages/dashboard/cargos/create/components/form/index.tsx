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
  onSuccess?: () => void;
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

/** Convert ISO / Date / datetime-local values to yyyy-MM-dd for <input type="date"> */
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
    return { latitude: Number(c.coordinates[1]) || 0, longitude: Number(c.coordinates[0]) || 0 };
  }
  if (Array.isArray(c) && c.length >= 2) {
    return { latitude: Number(c[1]) || 0, longitude: Number(c[0]) || 0 };
  }
  return { latitude: 0, longitude: 0 };
};

const EnhancedCargoForm: React.FC<EnhancedCargoFormProps> = ({
  mode,
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  initialData,
  onSaveDraft,
  onTruckSelected,
  showTruckSelection = false,
  uploadedPhotos = [],
  aiSuggestions,
}) => {
  const { tSync } = useTranslation();
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
  const [activeSection, setActiveSection] = useState("cargo");
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
    // Full data population for: edit mode OR create mode with existing cargo/draft (has id)
    const shouldFullyPopulate = initialData && (mode === "edit" || initialData.id);

    if (shouldFullyPopulate) {
      const contact = initialData.contactInfo || {};
      const pickupCoords = extractLatLng(initialData.pickupLocation);
      const deliveryCoords = extractLatLng(initialData.deliveryLocation);

      // Transform and apply all cargo data to form
      const transformedData: any = {
        ...initialData,
        // Normalize dates for <input type="date">
        pickupDate: toDateInputValue(initialData.pickupDate),
        deliveryDate: toDateInputValue(initialData.deliveryDate),
        // Ensure defaults for fields that might be missing
        loadType: initialData.loadType || "FTL",
        equipmentType: initialData.equipmentType || "DRY_VAN",
        visibility: initialData.visibility || "public",
        unitsRequired: initialData.unitsRequired !== undefined ? initialData.unitsRequired : 1,
        paymentTerms: initialData.paymentTerms || "Net30",
        contactPerson: initialData.contactPerson || contact.contactPerson || "",
        contactPhone: initialData.contactPhone || contact.contactPhone || "",
        contactEmail: initialData.contactEmail || contact.contactEmail || "",
        specialRequirements:
          initialData.specialRequirements ||
          initialData.specialHandlingInstructions ||
          "",
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
        // Numeric fields
        length: initialData.length != null ? Number(initialData.length) : undefined,
        width: initialData.width != null ? Number(initialData.width) : undefined,
        height: initialData.height != null ? Number(initialData.height) : undefined,
        stackableHeight: initialData.stackableHeight != null ? Number(initialData.stackableHeight) : undefined,
        temperatureMin: initialData.temperatureMin != null ? Number(initialData.temperatureMin) : undefined,
        temperatureMax: initialData.temperatureMax != null ? Number(initialData.temperatureMax) : undefined,
        loadingTimeEstimate: initialData.loadingTimeEstimate != null ? Number(initialData.loadingTimeEstimate) : undefined,
        unloadingTimeEstimate: initialData.unloadingTimeEstimate != null ? Number(initialData.unloadingTimeEstimate) : undefined,
        maxTransitTime: initialData.maxTransitTime != null ? Number(initialData.maxTransitTime) : undefined,
        maxClearanceHeight: initialData.maxClearanceHeight != null ? Number(initialData.maxClearanceHeight) : undefined,
        insuranceValue: initialData.insuranceValue != null ? Number(initialData.insuranceValue) : undefined,
        numberOfPieces: initialData.numberOfPieces != null ? Number(initialData.numberOfPieces) : undefined,
        numberOfPallets: initialData.numberOfPallets != null ? Number(initialData.numberOfPallets) : undefined,
        // Ensure complex objects are properly initialized
        truckRequirements: initialData.truckRequirements || {},
        carrierPreferences: initialData.carrierPreferences || {},
        costPreferences: initialData.costPreferences || {},
        // Prefill existing documents (edit mode)
        documents: Array.isArray(initialData.documents) ? initialData.documents : [],
        // Ensure urgency level has a default
        urgencyLevel: initialData.urgencyLevel || "NORMAL",
      };

      setFormData((prev) => ({
        ...prev,
        ...transformedData,
      }));
      setActiveSection("cargo");

      // Set location data if available
      if (initialData.pickupLocation) {
        setPickupLocation({
          id: initialData.pickupLocation.id,
          name: initialData.pickupLocation.name || "",
          address: initialData.pickupLocation.address || "",
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
        });
      }

      if (initialData.deliveryLocation) {
        setDeliveryLocation({
          id: initialData.deliveryLocation.id,
          name: initialData.deliveryLocation.name || "",
          address: initialData.deliveryLocation.address || "",
          latitude: deliveryCoords.latitude,
          longitude: deliveryCoords.longitude,
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
      iconUrl: `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}"/>
      </svg>
    `)))}`,
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

  const [submitStatus, setSubmitStatus] = useState<string>("");

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitStatus(mode === "edit" ? "Updating cargo..." : "Creating cargo...");

    try {
      // Basic validation on submit
      if (!formData.title?.trim()) {
        setError("Cargo title is required. Please go back to Cargo Details.");
        setActiveSection("cargo");
        setLoading(false);
        return;
      }
      if (!formData.weight || formData.weight <= 0) {
        setError("Weight must be greater than 0. Please go back to Cargo Details.");
        setActiveSection("cargo");
        setLoading(false);
        return;
      }
      if (!formData.loadValue || formData.loadValue <= 0) {
        setError("Load value must be greater than 0. Please go back to Cargo Details.");
        setActiveSection("cargo");
        setLoading(false);
        return;
      }

      // Validate documents: create requires new uploads; edit accepts existing docs or new uploads
      const allDocs = formData.documents || [];
      const pendingDocsCheck = allDocs.filter(
        (doc: any) => "isPending" in doc && doc.isPending
      );
      const existingDocs = allDocs.filter(
        (doc: any) => !("isPending" in doc && doc.isPending)
      );
      if (mode === "create" && pendingDocsCheck.length === 0) {
        setError("At least one cargo document is required. Please go back to the Documentation step and upload a document.");
        setActiveSection("documents");
        setLoading(false);
        return;
      }
      if (mode === "edit" && pendingDocsCheck.length === 0 && existingDocs.length === 0) {
        setError("At least one cargo document is required. Please go back to the Documentation step and upload a document.");
        setActiveSection("documents");
        setLoading(false);
        return;
      }

      // ── DB precision / backend constraint validation ──────────────────────
      // precision(5,2) columns → max 999.99
      const p52Fields: { key: keyof typeof formData; label: string }[] = [
        { key: 'loadingTimeEstimate',   label: 'Loading time estimate' },
        { key: 'unloadingTimeEstimate', label: 'Unloading time estimate' },
        { key: 'maxTransitTime',        label: 'Max transit time' },
        { key: 'maxClearanceHeight',    label: 'Max clearance height' },
        { key: 'temperatureMin',        label: 'Min temperature' },
        { key: 'temperatureMax',        label: 'Max temperature' },
      ];
      for (const { key, label } of p52Fields) {
        const val = formData[key] as number | undefined;
        if (val !== undefined && val !== null && Math.abs(val) > 999.99) {
          setError(`${label} must be between -999.99 and 999.99.`);
          setLoading(false);
          return;
        }
      }

      // weight max 100 t (backend @Max(100000 kg), stored as tonnes on frontend)
      if (formData.weight > 100) {
        setError("Weight must be at most 100 t (100,000 kg). Please go back to Cargo Details.");
        setActiveSection("cargo");
        setLoading(false);
        return;
      }

      // volume max 1000 m³ (backend @Max(1000))
      if (formData.volume && formData.volume > 1000) {
        setError("Volume must be at most 1,000 m³. Please go back to Cargo Details.");
        setActiveSection("cargo");
        setLoading(false);
        return;
      }

      // title max 200 chars
      if (formData.title.length > 200) {
        setError("Cargo title must be at most 200 characters.");
        setActiveSection("cargo");
        setLoading(false);
        return;
      }

      // numberOfPieces max 10,000 | numberOfPallets max 1,000
      if (formData.numberOfPieces && formData.numberOfPieces > 10000) {
        setError("Number of pieces must be at most 10,000.");
        setLoading(false);
        return;
      }
      if (formData.numberOfPallets && formData.numberOfPallets > 1000) {
        setError("Number of pallets must be at most 1,000.");
        setLoading(false);
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      const submissionData: ICargoBody = {
        ...(formData as any),
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
            estimatedTime: formData.loadingTimeEstimate || 60,
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
            estimatedTime: formData.unloadingTimeEstimate || 60,
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
        cargoType:
          formData.cargoType === "ELECTRONICS" ? "FRAGILE" : formData.cargoType,
        pickupDate: formData.pickupDate,
        deliveryDate: formData.deliveryDate,
        contactInfo: {
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
        },
        matchingCriteria: {},
        // Carry pending documents so loadsAPI.create() can extract File objects
        documents: formData.documents || [],
      } as any;

      // Single request: cargo + documents sent together as multipart/form-data
      const pendingDocs = (formData.documents || []).filter(
        (doc: any) => 'isPending' in doc && doc.isPending
      ) as PendingDocument[];

      if (pendingDocs.length > 0) {
        setSubmitStatus(
          mode === "edit"
            ? `Updating cargo & uploading ${pendingDocs.length} document${pendingDocs.length > 1 ? "s" : ""}...`
            : `Creating cargo & uploading ${pendingDocs.length} document${pendingDocs.length > 1 ? "s" : ""}...`
        );
      }

      const result = await onSubmit(submissionData);

      // Parent handlers (list update) already toast — avoid duplicate noise on edit
      if (mode === "create") {
        toast.success(
          pendingDocs.length > 0
            ? `Cargo and ${pendingDocs.length} document${pendingDocs.length > 1 ? "s" : ""} saved successfully!`
            : "Cargo created successfully!"
        );
      }

      // Step 3 — advance UI
      if (mode === "create" && showTruckSelection && result?.id) {
        setCreatedCargoId(result.id);
        setCreatedCargoData(submissionData);
        setShowTruckSelectionModal(true);
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save cargo");
    } finally {
      setLoading(false);
      setSubmitStatus("");
    }
  };

  // 5-step wizard: Cargo → Schedule → Handling → Documents → Review
  const sections = [
    { id: "cargo", label: "Cargo Details", icon: FaBox },
    { id: "schedule", label: "Route & Schedule", icon: FaLocationArrow },
    { id: "handling", label: "Handling & Security", icon: FaTruck },
    { id: "documents", label: "Quality & Documents", icon: FileText },
  ];

  // Simple section validation (customize as needed)
  const isSectionComplete = (sectionId: string) => {
    switch (sectionId) {
      case "cargo":
      case "basic":
        return (
          !!formData.title &&
          !!formData.cargoType &&
          formData.weight > 0 &&
          formData.loadValue > 0
        );
      case "schedule":
      case "route":
        return (
          !!formData.pickupDate &&
          !!formData.deliveryDate
        );
      case "documents":
        return (formData.documents || []).length > 0;
      default:
        return true;
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

  // ─── Wizard steps (content steps + final Review) ───────────────────────────
  const STEPS = [...sections, { id: "review", label: "Review & Submit", icon: FaCheck }];
  const currentStepIndex = STEPS.findIndex((s) => s.id === activeSection);
  const isFirstStep = currentStepIndex === 0;
  const isReviewStep = activeSection === "review";
  const isLastContentStep = currentStepIndex === STEPS.length - 2; // step before review

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      // Validate documents are attached before allowing proceed to review
      if (activeSection === "documents") {
        const hasDocs = (formData.documents || []).length > 0;
        if (!hasDocs) {
          setError("At least one document is required. Please upload a cargo document before proceeding.");
          return;
        }
        setError(null);
      }
      if (activeSection === "cargo") {
        if (!formData.title?.trim() || !formData.weight || formData.weight <= 0 || !formData.loadValue || formData.loadValue <= 0) {
          setError("Please fill in title, weight, and load value before continuing.");
          return;
        }
        setError(null);
      }
      if (activeSection === "schedule") {
        if (!formData.pickupDate || !formData.deliveryDate) {
          setError("Pickup and delivery dates are required.");
          return;
        }
        setError(null);
      }
      setActiveSection(STEPS[currentStepIndex + 1].id);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setActiveSection(STEPS[currentStepIndex - 1].id);
    }
  };

  // ─── Review Panel ────────────────────────────────────────────────────────────
  const ReviewRow = ({ label, value }: { label: string; value: any }) => {
    if (value === undefined || value === null || value === "" || value === 0 || value === false) return null;
    return (
      <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex-shrink-0 w-40">{label}</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 text-right">{String(value)}</span>
      </div>
    );
  };

  const ReviewSection = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
        <div className="w-7 h-7 rounded-lg bg-[#345E85]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#345E85] dark:text-blue-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{title}</span>
      </div>
      <div className="px-5 py-3">{children}</div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="rounded-2xl p-5 flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
          <FaCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
            {mode === "edit" ? "Ready to Update" : "Ready to Create"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {mode === "edit"
              ? "Review all details carefully before saving your changes."
              : "Review all details carefully before submitting. You cannot undo this action."}
          </p>
        </div>
        <div className="ml-auto text-right flex-shrink-0">
          <div className="text-2xl font-black text-[#345E85] dark:text-blue-400">{completionPercentage}%</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Complete</div>
        </div>
      </div>

      {/* Basic Info */}
      <ReviewSection title="Basic Information" icon={FaBox}>
        <ReviewRow label="Title" value={formData.title} />
        <ReviewRow label="Cargo Type" value={formData.cargoType} />
        <ReviewRow label="Weight" value={formData.weight ? `${formData.weight} t` : null} />
        <ReviewRow label="Volume" value={formData.volume ? `${formData.volume} m³` : null} />
        <ReviewRow label="Load Value" value={formData.loadValue ? `$${formData.loadValue.toLocaleString()}` : null} />
        <ReviewRow label="Offered Price" value={formData.offeredPrice ? `$${formData.offeredPrice.toLocaleString()}` : null} />
        <ReviewRow label="Description" value={formData.description} />
        <ReviewRow label="Fragile" value={formData.isFragile ? "Yes" : null} />
        <ReviewRow label="Hazardous" value={formData.isHazardous ? "Yes" : null} />
        <ReviewRow label="Refrigeration" value={formData.requiresRefrigeration ? "Required" : null} />
      </ReviewSection>

      {/* Route */}
      <ReviewSection title="Route & Dates" icon={FaLocationArrow}>
        <ReviewRow label="Pickup Location" value={pickupLocation ? `${pickupLocation.name} — ${pickupLocation.address}` : null} />
        <ReviewRow label="Delivery Location" value={deliveryLocation ? `${deliveryLocation.name} — ${deliveryLocation.address}` : null} />
        <ReviewRow label="Pickup Date" value={formData.pickupDate} />
        <ReviewRow label="Delivery Date" value={formData.deliveryDate} />
      </ReviewSection>

      {/* Dimensions */}
      <ReviewSection title="Dimensions & Packaging" icon={FaRulerCombined}>
        <ReviewRow label="Length" value={formData.length ? `${formData.length} m` : null} />
        <ReviewRow label="Width" value={formData.width ? `${formData.width} m` : null} />
        <ReviewRow label="Height" value={formData.height ? `${formData.height} m` : null} />
        <ReviewRow label="Packaging Type" value={formData.packagingType} />
        <ReviewRow label="Pieces" value={formData.numberOfPieces} />
        <ReviewRow label="Pallets" value={formData.numberOfPallets} />
        <ReviewRow label="Stackable" value={formData.isStackable ? "Yes" : null} />
      </ReviewSection>

      {/* Environmental */}
      <ReviewSection title="Environmental Requirements" icon={FaThermometerHalf}>
        <ReviewRow label="Temp Min" value={formData.temperatureMin !== undefined ? `${formData.temperatureMin}°C` : null} />
        <ReviewRow label="Temp Max" value={formData.temperatureMax !== undefined ? `${formData.temperatureMax}°C` : null} />
        <ReviewRow label="Hazmat Class" value={formData.hazmatClass} />
        <ReviewRow label="Hazmat Number" value={formData.hazmatNumber} />
        <ReviewRow label="Humidity Control" value={formData.requiresHumidityControl ? "Required" : null} />
      </ReviewSection>

      {/* Security */}
      <ReviewSection title="Security & Insurance" icon={FaShieldAlt}>
        <ReviewRow label="Insurance Value" value={formData.insuranceValue ? `$${formData.insuranceValue.toLocaleString()}` : null} />
        <ReviewRow label="GPS Monitoring" value={formData.requiresGpsMonitoring ? "Required" : null} />
        <ReviewRow label="Temp Monitoring" value={formData.requiresTemperatureMonitoring ? "Required" : null} />
        <ReviewRow label="Emergency Contact" value={formData.emergencyContactInfo} />
      </ReviewSection>

      {/* Urgency */}
      <ReviewSection title="Urgency & Timing" icon={FaClock}>
        <ReviewRow label="Urgency Level" value={formData.urgencyLevel} />
        <ReviewRow label="Max Transit" value={formData.maxTransitTime ? `${formData.maxTransitTime} hrs` : null} />
        <ReviewRow label="Time Critical" value={formData.isTimeCritical ? "Yes" : null} />
      </ReviewSection>

      {/* Documents */}
      {(formData.documents || []).length > 0 && (
        <ReviewSection title="Documents" icon={FileText}>
          {(formData.documents || []).map((doc: any, i: number) => (
            <div key={doc.id || i} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3 h-3 text-[#345E85] dark:text-blue-400" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {doc.title || doc.file?.name || 'Document'}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex-shrink-0">
                {doc.documentType || doc.category || '—'}
              </span>
            </div>
          ))}
        </ReviewSection>
      )}

      {/* Draft saved notice */}
      {draftSaved && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <FaCheck className="text-blue-600 dark:text-blue-400 w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">Draft Saved</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Your progress is secure. Click <b>Create Cargo</b> below to publish.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="6xl"
      className="p-0"
    >
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-none">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 gap-4">
          <div className="flex items-center justify-between">
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
            <div className="text-right">
              <div className="text-xs font-black text-[#345E85] dark:text-blue-400 uppercase tracking-widest">
                Step {currentStepIndex + 1} of {STEPS.length}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {STEPS[currentStepIndex]?.label}
              </div>
            </div>
          </div>

          {/* ── Progress Bar ─────────────────────────────────────────────────── */}
          <div className="space-y-2">
            {/* Step dots */}
            <div className="hidden sm:flex items-center gap-1">
              {STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isDone = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => idx < currentStepIndex && setActiveSection(step.id)}
                      disabled={idx > currentStepIndex}
                      title={step.label}
                      className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 transition-all duration-300 text-[10px] font-black border-2
                        ${isDone ? 'bg-primary-500 border-primary-500 text-white cursor-pointer' : ''}
                        ${isActive ? 'bg-primary-600 border-primary-600 text-white scale-110 shadow-md shadow-primary-900/20' : ''}
                        ${!isDone && !isActive ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed' : ''}
                      `}
                    >
                      {isDone ? <FaCheck className="w-2.5 h-2.5" /> : <StepIcon className="w-2.5 h-2.5" />}
                    </button>
                    {idx < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                          idx < currentStepIndex
                            ? 'bg-primary-400'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            {/* Thin bar for mobile */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500 bg-primary-500"
                style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Form Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0" id="cargo-form-content">
          <form id="cargo-form" className="space-y-4 max-w-3xl mx-auto">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start justify-between gap-3">
                <p className="text-xs text-red-800 dark:text-red-400">{error}</p>
                {isReviewStep && error.toLowerCase().includes("document") && (
                  <button
                    type="button"
                    onClick={() => { setActiveSection("documents"); setError(null); }}
                    className="flex-shrink-0 text-xs font-bold text-red-700 dark:text-red-400 underline hover:no-underline"
                  >
                    Go to Documents →
                  </button>
                )}
              </div>
            )}

            {/* Photos Display */}
            {photos.length > 0 && activeSection !== "review" && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center">
                  <FaCameraRetro className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Suggestions Display */}
            {suggestions && activeSection !== "review" && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3 flex items-center">
                  <FaCheck className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                  Applied AI Suggestions
                </h4>
                <div className="space-y-2">
                  {suggestions.suggestions?.map((suggestion: any, index: number) => (
                    <div key={index} className="flex items-start text-sm text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg p-2">
                      <FaCheck className="w-4 h-4 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{suggestion.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Review Step ──────────────────────────────────────────────────── */}
            {isReviewStep && renderReviewStep()}

            {/* ── Cargo Details (basic + dimensions) ─────────────────────────── */}
            {activeSection === "cargo" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
                  <FaBox className="w-4 h-4 mr-2" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <Label htmlFor="title" className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      Cargo Title *
                      <HelpTooltip content="Enter a clear, descriptive title for your cargo. This helps transporters quickly understand what they'll be shipping." title="Cargo Title" />
                    </Label>
                    <Input id="title" type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Enter cargo title" className="text-sm w-full" />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="cargoType" className="block text-xs font-medium text-gray-700 mb-1">Cargo Type *</Label>
                    <Select name="cargoType" value={formData.cargoType} onValueChange={(value) => handleChange({ target: { name: "cargoType", value } } as any)}>
                      <SelectTrigger className="text-sm w-full"><SelectValue placeholder="Select cargo type" /></SelectTrigger>
                      <SelectContent>{CARGO_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="weight" className="block text-xs font-medium text-gray-700 mb-1">Weight (t) *</Label>
                    <Input id="weight" type="number" name="weight" value={formData.weight || ""} onChange={handleNumberChange} required min="0.001" max="100" step="0.001" placeholder="e.g. 1.5 (= 1,500 kg)" className="text-sm w-full" />
                    <p className="text-[10px] text-slate-400 mt-0.5">Enter in tonnes — 1 t = 1,000 kg. Max: 100 t</p>
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="volume" className="block text-xs font-medium text-gray-700 mb-1">Volume (m³)</Label>
                    <Input id="volume" type="number" name="volume" value={formData.volume || ""} onChange={handleNumberChange} min="0" max="1000" step="0.01" placeholder="e.g. 2.5" className="text-sm w-full" />
                    <p className="text-[10px] text-slate-400 mt-0.5">Max: 1,000 m³</p>
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="loadValue" className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                      Load Value ($) *
                      <HelpTooltip content="The total declared value of your cargo. This is used for insurance purposes and helps determine appropriate pricing." title="Load Value" />
                    </Label>
                    <Input id="loadValue" type="number" name="loadValue" value={formData.loadValue || ""} onChange={handleNumberChange} required min="0" step="0.01" placeholder="Enter load value" className="text-sm w-full" />
                  </div>

                  <div className="min-w-0">
                    <Label htmlFor="offeredPrice" className="block text-xs font-medium text-gray-700 mb-1">Offered Price ($)</Label>
                    <Input id="offeredPrice" type="number" name="offeredPrice" value={formData.offeredPrice || ""} onChange={handleNumberChange} min="0" step="0.01" placeholder="Enter offered price" className="text-sm w-full" />
                  </div>
                </div>

                <div className="min-w-0">
                  <Label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">Description</Label>
                  <textarea id="description" name="description" value={formData.description || ""} onChange={handleChange} rows={3} className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0" placeholder="Enter cargo description" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="isFragile" checked={formData.isFragile} onChange={handleChange} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                    <span className="text-xs text-gray-700">Fragile Cargo</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="isHazardous" checked={formData.isHazardous} onChange={handleChange} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                    <span className="text-xs text-gray-700">Hazardous Materials</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" name="requiresRefrigeration" checked={formData.requiresRefrigeration} onChange={handleChange} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4" />
                    <span className="text-xs text-gray-700">Requires Refrigeration</span>
                  </label>
                </div>

                {/* Dimensions rendered via CargoFormSections for cargo step */}
                <CargoFormSections formData={formData} handleChange={handleChange} handleNumberChange={handleNumberChange} activeSection="cargo" />
              </div>
            )}

            {/* ── Route & Schedule ────────────────────────────────────────────── */}
            {activeSection === "schedule" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center">
                  <FaLocationArrow className="w-4 h-4 mr-2" />
                  Route Information
                </h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1 flex items-center">
                    <FaMapMarkerAlt className="inline w-3.5 h-3.5 mr-1.5" />
                    Locations *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <LocationItem type="pickup" location={pickupLocation} isActive={activeLocation === "pickup"} onSelect={() => setActiveLocation("pickup")} />
                    <LocationItem type="delivery" location={deliveryLocation} isActive={activeLocation === "delivery"} onSelect={() => setActiveLocation("delivery")} />
                  </div>
                  <div className="h-48 sm:h-64 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-700 w-full">
                    <MapContainer center={[0, 0]} zoom={2} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
                      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapClickHandler onMapClick={handleMapClick} />
                      {pickupLocation && <Marker position={[pickupLocation.latitude, pickupLocation.longitude]} icon={createCustomIcon("#3B82F6")} />}
                      {deliveryLocation && <Marker position={[deliveryLocation.latitude, deliveryLocation.longitude]} icon={createCustomIcon("#10B981")} />}
                    </MapContainer>
                  </div>
                  <RouteIntelligenceCard insight={routeInsight} loading={isRouteLoading} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {pickupLocation && (
                      <div>
                        {loadingIntelligence && activeLocation === 'pickup' ? <LocationIntelligenceCard intelligence={null} loading={true} /> : (locationIntelligence.pickup && <LocationIntelligenceCard intelligence={locationIntelligence.pickup} />)}
                      </div>
                    )}
                    {deliveryLocation && (
                      <div>
                        {loadingIntelligence && activeLocation === 'delivery' ? <LocationIntelligenceCard intelligence={null} loading={true} /> : (locationIntelligence.delivery && <LocationIntelligenceCard intelligence={locationIntelligence.delivery} />)}
                      </div>
                    )}
                  </div>
                  {activeLocation && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <FaMapPin className="inline w-4 h-4 mr-1" />
                        Click on the map to set {activeLocation === "pickup" ? "pickup" : "delivery"} location
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="min-w-0">
                    <Label htmlFor="pickupDate" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <FaCalendar className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      Pickup Date *
                    </Label>
                    <Input id="pickupDate" type="date" name="pickupDate" value={formData.pickupDate} onChange={handleChange} required className="w-full text-sm" />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor="deliveryDate" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      <FaCalendar className="inline w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      Delivery Date *
                    </Label>
                    <Input id="deliveryDate" type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} required className="w-full text-sm" />
                  </div>
                </div>

                <CargoFormSections formData={formData} handleChange={handleChange} handleNumberChange={handleNumberChange} activeSection="schedule" />
              </div>
            )}

            {/* ── Handling & Security ─────────────────────────────────────────── */}
            {activeSection === "handling" && (
              <CargoFormSections formData={formData} handleChange={handleChange} handleNumberChange={handleNumberChange} activeSection="handling" />
            )}

            {/* ── Quality & Documentation ─────────────────────────────────────── */}
            {activeSection === "documents" && (
              <div className="space-y-8">
                <CargoFormSections formData={formData} handleChange={handleChange} handleNumberChange={handleNumberChange} activeSection="documents" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800">
                      <FileText className="w-4 h-4 text-[#345E85] dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-[#0f172a] dark:text-slate-100 tracking-tight uppercase">Documentation</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Upload Permits, Invoices & Photos</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                    <DocumentUploadSection
                      cargoId={createdCargoId || initialData?.id || null}
                      documents={formData.documents || []}
                      onDocumentsChange={(docs) => setFormData(prev => ({ ...prev, documents: docs }))}
                      allowPendingDocuments={true}
                    />
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* ── Footer Navigation — sticky, always visible ───────────────────────── */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Left: Back + Draft */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirstStep}
              className="px-4 py-2.5 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              ← Back
            </button>
            {onSaveDraft && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-xs flex items-center gap-1.5"
              >
                <FaSave className="w-3.5 h-3.5" />
                Save Draft
              </button>
            )}
          </div>

          {/* Right: Cancel + Next/Create */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-xs"
            >
              Cancel
            </button>

            {!isReviewStep ? (
              /* Next button — visible on all non-review steps */
              <button
                type="button"
                onClick={goNext}
                className="px-6 py-2.5 bg-[#345E85] dark:bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-md shadow-blue-900/15 flex items-center gap-1.5"
              >
                {isLastContentStep ? "Review →" : "Next →"}
              </button>
            ) : (
              /* Create Cargo — only this button triggers the API call */
              <button
                type="button"
                onClick={handleSubmit as any}
                disabled={loading}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-emerald-900/20 transition-all"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    <span>{submitStatus || "SAVING..."}</span>
                  </>
                ) : (
                  <>
                    <FaCheck className="w-3.5 h-3.5" />
                    <span>{mode === "create" ? "CREATE CARGO" : "UPDATE CARGO"}</span>
                  </>
                )}
              </button>
            )}
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
