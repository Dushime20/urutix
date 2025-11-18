// Cargo type options
export const CARGO_TYPES = [
  "GENERAL",
  "FRAGILE",
  "HAZARDOUS",
  "REFRIGERATED",
  "LIQUID",
  "OVERSIZED",
  "VALUABLE",
] as const;

// Urgency level options
export const URGENCY_LEVELS = ["LOW", "NORMAL", "HIGH", "CRITICAL"] as const;

// Packaging type options
export const PACKAGING_TYPES = [
  "PALLETS",
  "CRATES",
  "BOXES",
  "LOOSE",
  "CONTAINERS",
  "DRUMS",
  "BAGS",
  "ROLLS",
  "CYLINDERS",
  "OTHER",
] as const;

// Truck type options for requirements
export const TRUCK_TYPES = [
  "FLATBED",
  "BOX_TRUCK",
  "TANKER",
  "REFRIGERATED",
  "CONTAINER",
  "CAR_CARRIER",
  "HEAVY_HAUL",
  "LOWBED",
  "STEP_DECK",
  "POWER_ONLY",
  "CURTAIN_SIDE",
  "VAN",
  "PLATFORM",
  "BULK",
  "DUMP",
  "CEMENT_MIXER",
  "CRANE",
  "FIRE_TRUCK",
  "AMBULANCE",
  "TOW_TRUCK",
  "GARBAGE",
  "MILITARY",
  "SPECIALIZED",
] as const;

// Feature options for truck requirements
export const TRUCK_FEATURES = [
  "SIDE_RAILS",
  "TARPS",
  "STRAPS",
  "CHAINS",
  "WINCH",
  "RAM",
  "TAIL_LIFT",
  "SIDE_LIFT",
  "ROLLER_BED",
  "LIFT_GATE",
  "GPS",
  "REFRIGERATION",
  "HAZMAT_PERMIT",
  "TEMPERATURE_MONITORING",
  "SECURITY_SYSTEM",
] as const;