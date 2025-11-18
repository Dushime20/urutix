import { locationMap } from "@/constants/locations";
import { cn } from "@/utils/cn";
import {
  AlertTriangle,
  Anchor,
  Factory,
  Home,
  MapPin,
  Package,
  Plane,
  Shield,
  Star,
  Store,
  Thermometer,
  Truck,
} from "lucide-react";

export const getStatusColor = (status: any) => {
  const className2 = "transition-all ease duration-500";
  let className = "";

  if (!status) {
    className = "bg-gray-100 text-gray-800";
    return cn(className2, className);
  }

  const statusStr = String(status).toUpperCase();

  switch (statusStr) {
    case "PUBLISHED":
      className = "bg-blue-100 text-blue-800";
      break;
    case "ASSIGNED":
      className = "bg-yellow-100 text-yellow-800";
      break;
    case "IN_TRANSIT":
      className = "bg-purple-100 text-purple-800";
      break;
    case "DELIVERED":
      className = "bg-green-100 text-green-800";
      break;
    case "COMPLETED":
      className = "bg-green-100 text-green-800";
      break;
    case "CANCELLED":
      className = "bg-red-100 text-red-800";
      break;
    case "CREATED":
      className = "bg-cyan-100/50 text-cyan-800";
      break;
    case "DRAFT":
      className = "bg-white group-hover:bg-gray-100 text-gray-800";
      break;
    default:
      className = "bg-gray-100 text-gray-800";
  }

  return cn(className2, className);
};

export const getStatusDisplayName = (status: any) => {
  if (!status) return "Unknown";

  const statusStr = String(status).toUpperCase();

  switch (statusStr) {
    case "PUBLISHED":
      return "Published";
    case "ASSIGNED":
      return "Assigned";
    case "IN_TRANSIT":
      return "In Transit";
    case "DELIVERED":
      return "Delivered";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "DRAFT":
      return "Draft";
    default:
      return String(status) || "Unknown";
  }
};

export const getCargoTypeIcon = (cargoType: any) => {
  const className = "size-10 p-2.5 rounded-xl text-white";

  if (!cargoType) return <Package className={cn("bg-gray-500", className)} />;
  const cargoTypeStr = String(cargoType).toUpperCase();

  switch (cargoTypeStr) {
    case "FRAGILE":
      return <AlertTriangle className={cn("bg-orange-500", className)} />;
    case "HAZARDOUS":
      return <Shield className={cn("bg-red-500", className)} />;
    case "REFRIGERATED":
      return <Thermometer className={cn("bg-blue-500", className)} />;
    case "LIQUID":
      return <Package className={cn("bg-purple-500", className)} />;
    case "OVERSIZED":
      return <Truck className={cn("bg-indigo-500", className)} />;
    case "VALUABLE":
      return <Star className={cn("bg-yellow-500", className)} />;
    default:
      return <Package className={cn("bg-gray-500", className)} />;
  }
};

export const getCargoTypeDisplayName = (cargoType: any) => {
  if (!cargoType) return "General Cargo";

  const cargoTypeStr = String(cargoType).toUpperCase();

  switch (cargoTypeStr) {
    case "GENERAL":
      return "General Cargo";
    case "FRAGILE":
      return "Fragile Items";
    case "HAZARDOUS":
      return "Hazardous Materials";
    case "REFRIGERATED":
      return "Refrigerated Goods";
    case "LIQUID":
      return "Liquid Cargo";
    case "OVERSIZED":
      return "Oversized Load";
    case "VALUABLE":
      return "Valuable Items";
    default:
      return "General Cargo";
  }
};

export const getUrgencyColor = (urgencyLevel: any) => {
  const className2 = "transition-all ease duration-500";

  let className = "";

  if (!urgencyLevel) {
    className = "bg-gray-100 text-gray-800";
    return cn(className2, className);
  }

  const urgencyStr = String(urgencyLevel).toUpperCase();

  switch (urgencyStr) {
    case "CRITICAL":
      className = "bg-red-100 text-red-800";
      break;
    case "HIGH":
      className = "bg-orange-100 text-orange-800";
      break;
    case "NORMAL":
      className =
        "bg-primary-50 group-hover:bg-primary-100/75 text-primary-800";
      break;
    case "LOW":
      className = "bg-green-100 text-green-800";
      break;
    default:
      className = "bg-gray-100 text-gray-800";
  }

  return cn(className2, className);
};

export const getEnrichedLocationDetails = (load: any) => {
  console.log("🔍 Checking enriched locations for load:", load.id, load);
  console.log("📍 Load enrichedLocations:", load.enrichedLocations);

  // Prefer enrichedLocations when available
  if (load.enrichedLocations && load.enrichedLocations.length > 0) {
    const pickupLocation = load.enrichedLocations.find(
      (loc: any) => loc.type === "PICKUP"
    );
    const deliveryLocation = load.enrichedLocations.find(
      (loc: any) => loc.type === "DELIVERY"
    );

    console.log("📍 Pickup location (enriched):", pickupLocation);
    console.log("📍 Delivery location (enriched):", deliveryLocation);

    return {
      pickup: pickupLocation?.locationData || null,
      delivery: deliveryLocation?.locationData || null,
    };
  }

  // Fallback: use v2 locations array on the load
  console.log("❌ No enriched locations found for load:", load.id);
  if (Array.isArray(load.locations) && load.locations.length > 0) {
    const pickup = load.locations.find((loc: any) => loc.type === "PICKUP");
    const delivery = load.locations.find((loc: any) => loc.type === "DELIVERY");

    console.log("📍 Pickup location (fallback from locations):", pickup);
    console.log("📍 Delivery location (fallback from locations):", delivery);

    if (pickup || delivery) {
      return {
        pickup: pickup?.locationData || null,
        delivery: delivery?.locationData || null,
      };
    }
  }

  return null;
};

// Function to get detailed location information
export const getDetailedLocationInfo = (load: any) => {
  const enrichedDetails = getEnrichedLocationDetails(load);

  if (enrichedDetails?.pickup || enrichedDetails?.delivery) {
    return {
      pickup: {
        name:
          enrichedDetails.pickup?.city ||
          enrichedDetails.pickup?.administrativeAreas?.district ||
          "Unknown",
        address:
          enrichedDetails.pickup?.fullAddress ||
          enrichedDetails.pickup?.address ||
          "Address not available",
        type: enrichedDetails.pickup?.locationCategory || "General",
        access: enrichedDetails.pickup?.accessType || "Standard",
        security: enrichedDetails.pickup?.securityLevel || "Standard",
      },
      delivery: {
        name:
          enrichedDetails.delivery?.city ||
          enrichedDetails.delivery?.administrativeAreas?.district ||
          "Unknown",
        address:
          enrichedDetails.delivery?.fullAddress ||
          enrichedDetails.delivery?.address ||
          "Address not available",
        type: enrichedDetails.delivery?.locationCategory || "General",
        access: enrichedDetails.delivery?.accessType || "Standard",
        security: enrichedDetails.delivery?.securityLevel || "Standard",
      },
      hasEnrichedData: true,
    };
  }

  // Fallback to basic location data
  return {
    pickup: {
      name:
        getLocationNameFromCoordinates(load.pickupLocation) ||
        load.pickupLocation?.address ||
        "Unknown",
      address: load.pickupLocation?.address || "Address not available",
      type: "General",
      access: "Standard",
      security: "Standard",
    },
    delivery: {
      name:
        getLocationNameFromCoordinates(load.deliveryLocation) ||
        load.deliveryLocation?.address ||
        "Unknown",
      address: load.deliveryLocation?.address || "Address not available",
      type: "General",
      access: "Standard",
      security: "Standard",
    },
    hasEnrichedData: false,
  };
};

export const getLocationTypeIcon = (locationType: string) => {
  if (!locationType) return <MapPin className="size-4 text-gray-500" />;

  const type = locationType.toLowerCase();

  if (type.includes("warehouse") || type.includes("storage"))
    return <Package className="size-4 text-blue-500" />;

  if (type.includes("port") || type.includes("terminal"))
    return <Anchor className="size-4 text-indigo-500" />;

  if (type.includes("airport"))
    return <Plane className="size-4 text-purple-500" />;

  if (type.includes("factory") || type.includes("industrial"))
    return <Factory className="size-4 text-orange-500" />;

  if (type.includes("commercial") || type.includes("retail"))
    return <Store className="size-4 text-green-500" />;

  if (type.includes("residential"))
    return <Home className="size-4 text-pink-500" />;

  return <MapPin className="size-4 text-gray-500" />;
};

export const getAccessTypeColor = (accessType: string) => {
  if (!accessType) return "text-gray-600";

  const type = accessType.toLowerCase();

  if (type.includes("easy") || type.includes("good")) {
    return "text-green-600";
  }
  if (type.includes("moderate") || type.includes("standard")) {
    return "text-blue-600";
  }
  if (type.includes("difficult") || type.includes("restricted")) {
    return "text-orange-600";
  }
  if (type.includes("very difficult") || type.includes("limited")) {
    return "text-red-600";
  }

  return "text-gray-600";
};

export const getSecurityLevelColor = (securityLevel: string) => {
  if (!securityLevel) return "text-gray-600";

  const level = securityLevel.toLowerCase();

  if (level.includes("high") || level.includes("secure")) {
    return "text-red-600";
  }
  if (level.includes("medium") || level.includes("standard")) {
    return "text-orange-600";
  }
  if (level.includes("low") || level.includes("basic")) {
    return "text-green-600";
  }

  return "text-gray-600";
};

export const getSpecialRequirements = (load: any) => {
  const requirements = [];

  if (load?.isFragile) requirements.push("Fragile");
  if (load?.isHazardous) requirements.push("Hazardous");
  if (load?.requiresRefrigeration) requirements.push("Refrigerated");
  if (load?.requiresForklift) requirements.push("Forklift");
  if (load?.requiresCrane) requirements.push("Crane");
  if (load?.requiresLoadingDock) requirements.push("Loading Dock");
  if (load?.isTimeCritical) requirements.push("Time Critical");

  return requirements;
};

export const formatWeight = (weight: number | string) => {
  const numWeight = typeof weight === "string" ? parseFloat(weight) : weight;
  if (isNaN(numWeight)) return "0 kg";

  if (numWeight >= 1000) {
    return `${(numWeight / 1000).toFixed(1)} tons`;
  }
  return `${numWeight} kg`;
};

export const formatVolume = (volume: number | string) => {
  const numVolume = typeof volume === "string" ? parseFloat(volume) : volume;
  if (isNaN(numVolume)) return "0 L";

  if (numVolume >= 1000) {
    return `${(numVolume / 1000).toFixed(1)} m³`;
  }
  return `${numVolume} L`;
};

// Function to convert coordinates to readable location names
export const getLocationNameFromCoordinates = (location: any) => {
  if (!location || !location.coordinates) return null;

  const { coordinates } = location;
  let lat, lng;

  console.log("🔍 Converting coordinates:", coordinates);

  // Handle different coordinate formats
  if (coordinates.latitude && coordinates.longitude) {
    lat = coordinates.latitude;
    lng = coordinates.longitude;
  } else if (Array.isArray(coordinates)) {
    [lng, lat] = coordinates; // GeoJSON format: [longitude, latitude]
  } else if (
    coordinates.coordinates &&
    Array.isArray(coordinates.coordinates)
  ) {
    [lng, lat] = coordinates.coordinates; // GeoJSON format
  } else {
    console.log("❌ Unknown coordinate format:", coordinates);
    return null;
  }

  console.log("📍 Extracted lat/lng:", lat, lng);

  // Convert coordinates to readable location names
  const locationName = convertCoordinatesToLocationName(lat, lng);
  console.log("📍 Converted to location name:", locationName);

  return locationName;
};

// Function to convert coordinates to location names using reverse geocoding
export const convertCoordinatesToLocationName = (lat: number, lng: number) => {
  console.log("🔍 Converting coordinates to location name:", lat, lng);

  // This would typically call a reverse geocoding service
  // For now, we'll use a simple mapping for common coordinates

  // Try exact match first
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  console.log("🔍 Trying exact match with key:", key);
  if (locationMap[key]) {
    console.log("✅ Found exact match:", locationMap[key]);
    return locationMap[key];
  }

  // Try with 2 decimal places (like the coordinates in the image)
  const key2dp = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  console.log("🔍 Trying 2dp match with key:", key2dp);
  if (locationMap[key2dp]) {
    console.log("✅ Found 2dp match:", locationMap[key2dp]);
    return locationMap[key2dp];
  }

  // Try approximate match (within 0.1 degrees for broader matching)
  for (const [coordKey, locationName] of Object.entries(locationMap)) {
    const [mapLat, mapLng] = coordKey.split(",").map(Number);
    if (Math.abs(lat - mapLat) < 0.1 && Math.abs(lng - mapLng) < 0.1) {
      return locationName;
    }
  }

  // Try region-based matching for common areas
  if (lat >= -3 && lat <= -1 && lng >= 29 && lng <= 31) {
    console.log("✅ Region match: Kigali, Rwanda");
    return "Kigali, Rwanda";
  }
  if (lat >= 0 && lat <= 3 && lng >= 32 && lng <= 34) {
    console.log("✅ Region match: Kampala, Uganda");
    return "Kampala, Uganda";
  }
  if (lat >= -2 && lat <= 0 && lng >= 30 && lng <= 32) {
    console.log("✅ Region match: Kigali, Rwanda");
    return "Kigali, Rwanda";
  }
  if (lat >= -2 && lat <= 0 && lng >= 36 && lng <= 37) {
    console.log("✅ Region match: Nairobi, Kenya");
    return "Nairobi, Kenya";
  }
  if (lat >= -7 && lat <= -6 && lng >= 39 && lng <= 40) {
    console.log("✅ Region match: Dar es Salaam, Tanzania");
    return "Dar es Salaam, Tanzania";
  }

  // Fallback to coordinates if no match found
  console.log("❌ No location match found, falling back to coordinates");
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
};

export const getLocationDisplay = (load: any) => {
  console.log("🔍 Getting location display for load:", load.id);
  console.log("📍 Load enrichedLocations:", load.enrichedLocations);
  console.log("📍 Load pickupLocation:", load.pickupLocation);
  console.log("📍 Load deliveryLocation:", load.deliveryLocation);

  // Prefer enriched location data when available
  if (load.enrichedLocations && load.enrichedLocations.length > 0) {
    const pickupLocation = load.enrichedLocations.find(
      (loc: any) => loc.type === "PICKUP"
    );
    const deliveryLocation = load.enrichedLocations.find(
      (loc: any) => loc.type === "DELIVERY"
    );

    if (pickupLocation || deliveryLocation) {
      const pickupName =
        pickupLocation?.locationData?.city ||
        pickupLocation?.locationData?.administrativeAreas?.district ||
        pickupLocation?.locationData?.name ||
        (pickupLocation
          ? `${pickupLocation.locationData?.coordinates?.latitude?.toFixed?.(2)}, ${pickupLocation.locationData?.coordinates?.longitude?.toFixed?.(2)}`
          : "Unknown");
      const deliveryName =
        deliveryLocation?.locationData?.city ||
        deliveryLocation?.locationData?.administrativeAreas?.district ||
        deliveryLocation?.locationData?.name ||
        (deliveryLocation
          ? `${deliveryLocation.locationData?.coordinates?.latitude?.toFixed?.(2)}, ${deliveryLocation.locationData?.coordinates?.longitude?.toFixed?.(2)}`
          : "Unknown");

      console.log(
        "📍 Using enriched location names:",
        pickupName,
        "→",
        deliveryName
      );
      return `${pickupName} → ${deliveryName}`;
    }
  }

  // Fallback: use v2 locations array
  if (Array.isArray(load.locations) && load.locations.length > 0) {
    const pickup = load.locations.find((loc: any) => loc.type === "PICKUP");
    const delivery = load.locations.find((loc: any) => loc.type === "DELIVERY");

    if (pickup || delivery) {
      const pickupName =
        pickup?.locationData?.name ||
        getLocationNameFromCoordinates(pickup?.locationData) ||
        pickup?.locationData?.address ||
        "Unknown";
      const deliveryName =
        delivery?.locationData?.name ||
        getLocationNameFromCoordinates(delivery?.locationData) ||
        delivery?.locationData?.address ||
        "Unknown";
      console.log("📍 Using v2 locations array:", pickupName, "→", deliveryName);
      return `${pickupName} → ${deliveryName}`;
    }
  }

  // Fallback to original location fields with improved coordinate handling
  if (load.pickupLocation && load.deliveryLocation) {
    const pickupName =
      getLocationNameFromCoordinates(load.pickupLocation) ||
      load.pickupLocation.address ||
      "Unknown";
    const deliveryName =
      getLocationNameFromCoordinates(load.deliveryLocation) ||
      load.deliveryLocation.address ||
      "Unknown";

    console.log(
      "📍 Using coordinate-based location names:",
      pickupName,
      "→",
      deliveryName
    );
    return `${pickupName} → ${deliveryName}`;
  }

  console.log("📍 No location data found");
  return "No locations";
};

export const formatCurrency = (
  amount: number | string,
  currency: string = "USD"
) => {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

export const isLoadingConfirmable = (status: string) => {
  const statusStr = String(status).toUpperCase();
  return statusStr === "ASSIGNED" || statusStr === "IN_TRANSIT";
};

/**
 * Check if a location has a valid address specified
 * @param location - The location object with optional address property
 * @returns Boolean indicating if address is specified and not empty
 */
export const hasValidAddress = (location: { address?: string } | null | undefined): boolean => {
  return !!(location?.address && location.address.trim() !== "");
};

/**
 * Get address display text with proper fallback
 * @param location - The location object with optional address property
 * @param fallback - Fallback text when address is not available
 * @returns The address if valid, otherwise the fallback text
 */
export const getAddressDisplay = (location: { address?: string } | null | undefined, fallback: string = "Address not specified") => {
  if (!hasValidAddress(location)) return fallback;
  return location!.address;
};
