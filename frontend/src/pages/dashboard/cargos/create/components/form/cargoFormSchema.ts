import { z } from 'zod';

// ─── Backend constraint reference ────────────────────────────────────────────
// weight      : @Max(100000) kg — entered directly in kg
// volume      : @Max(1000) m³
// title       : @MaxLength(200)
// description : @MaxLength(2000)
// unitsRequired: @Min(1) @Max(100)
// loadValue / offeredPrice: @Max(1_000_000_000)
// numberOfPieces: @Max(10_000)
// numberOfPallets: @Max(1_000)
// specialHandlingInstructions / loadingInstructions / unloadingInstructions: @MaxLength(1000)
// emergencyContactInfo: @MaxLength(500)
// currencyCode: @MaxLength(3)
// DB precision(5,2) → max  999.99: temperatureMin/Max, loadingTimeEstimate, unloadingTimeEstimate, maxTransitTime, maxClearanceHeight
// DB precision(8,2) → max 999999.99: length, width, height, stackableHeight
// ─────────────────────────────────────────────────────────────────────────────

export const cargoFormSchema = z.object({
  id: z.string().optional(),

  // ── Core identity ──────────────────────────────────────────────────────────
  title: z
    .string()
    .min(1, { message: 'Cargo title is required' })
    .max(200, { message: 'Title must be at most 200 characters' }),

  description: z
    .string()
    .max(2000, { message: 'Description must be at most 2,000 characters' })
    .optional(),

  // ── Physical ───────────────────────────────────────────────────────────────
  // Stored as kg in DB; displayed in kg. @Max(100000 kg)
  weight: z
    .number()
    .min(1, { message: 'Weight must be at least 1 kg' })
    .max(100000, { message: 'Weight must be at most 100,000 kg' }),

  volume: z
    .number()
    .min(0)
    .max(1000, { message: 'Volume must be at most 1,000 m³' })
    .optional(),

  // ── Enums ──────────────────────────────────────────────────────────────────
  cargoType: z.string().min(1, { message: 'Cargo type is required' }),
  loadType: z.enum(['FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER']).default('FTL'),
  equipmentType: z.enum(['DRY_VAN', 'REEFER', 'FLATBED', 'TANKER', 'CONTAINER', 'OTHER']).default('DRY_VAN'),
  visibility: z.enum(['public', 'private']).default('public'),

  unitsRequired: z
    .number()
    .min(1, { message: 'At least 1 unit required' })
    .max(100, { message: 'Maximum 100 units allowed' })
    .default(1),

  // ── Locations & dates ─────────────────────────────────────────────────────
  pickupLocationId: z.string().optional(),
  deliveryLocationId: z.string().optional(),
  pickupDate: z.string().min(1, { message: 'Pickup date is required' }),
  deliveryDate: z.string().min(1, { message: 'Delivery date is required' }),

  // ── Financials ────────────────────────────────────────────────────────────
  loadValue: z
    .number()
    .min(0.01, { message: 'Load value must be greater than 0' })
    .max(1_000_000_000, { message: 'Load value must be at most $1,000,000,000' }),

  offeredPrice: z
    .number()
    .min(0)
    .max(1_000_000_000, { message: 'Offered price must be at most $1,000,000,000' })
    .optional(),

  currencyCode: z
    .string()
    .max(3, { message: 'Currency code must be 3 characters' })
    .default('USD'),

  paymentTerms: z.enum(['Prepaid', 'OnDelivery', 'Net15', 'Net30', 'Net45', 'Net60']).default('Net30'),

  // ── Flags ─────────────────────────────────────────────────────────────────
  isFragile: z.boolean().default(false),
  isHazardous: z.boolean().default(false),
  requiresRefrigeration: z.boolean().default(false),
  autoMatchEnabled: z.boolean().default(true),

  // ── Instructions (MaxLength 1000) ─────────────────────────────────────────
  specialRequirements: z.string().max(1000, { message: 'Max 1,000 characters' }).optional(),
  loadingInstructions: z.string().max(1000, { message: 'Loading instructions: max 1,000 characters' }).optional(),
  unloadingInstructions: z.string().max(1000, { message: 'Unloading instructions: max 1,000 characters' }).optional(),
  specialHandlingInstructions: z.string().max(1000, { message: 'Special handling: max 1,000 characters' }).optional(),

  // ── Contact ───────────────────────────────────────────────────────────────
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  emergencyContactInfo: z.string().max(500, { message: 'Emergency contact: max 500 characters' }).optional(),

  // ── Dimensions — DB precision(8,2) → max 999,999.99 m ────────────────────
  length: z.number().min(0).max(999999.99, { message: 'Length must be at most 999,999.99 m' }).optional(),
  width: z.number().min(0).max(999999.99, { message: 'Width must be at most 999,999.99 m' }).optional(),
  height: z.number().min(0).max(999999.99, { message: 'Height must be at most 999,999.99 m' }).optional(),
  stackableHeight: z.number().min(0).max(999999.99, { message: 'Stackable height must be at most 999,999.99 m' }).optional(),
  isStackable: z.boolean().default(false),

  // ── Environmental — DB precision(5,2) → max 999.99 ───────────────────────
  temperatureMin: z
    .number()
    .min(-999.99, { message: 'Min temperature must be at least -999.99°C' })
    .max(999.99, { message: 'Min temperature must be at most 999.99°C' })
    .optional(),
  temperatureMax: z
    .number()
    .min(-999.99, { message: 'Max temperature must be at least -999.99°C' })
    .max(999.99, { message: 'Max temperature must be at most 999.99°C' })
    .optional(),
  requiresHumidityControl: z.boolean().default(false),

  // ── Hazmat ────────────────────────────────────────────────────────────────
  hazmatClass: z.string().optional(),
  hazmatNumber: z.string().optional(),

  // ── Loading — DB precision(5,2) → max 999.99 hrs ─────────────────────────
  requiresForklift: z.boolean().default(false),
  requiresCrane: z.boolean().default(false),
  requiresLoadingDock: z.boolean().default(false),
  loadingTimeEstimate: z
    .number()
    .min(0)
    .max(999.99, { message: 'Loading time must be at most 999.99 hours' })
    .optional(),
  unloadingTimeEstimate: z
    .number()
    .min(0)
    .max(999.99, { message: 'Unloading time must be at most 999.99 hours' })
    .optional(),

  // ── Urgency — DB precision(5,2) → max 999.99 hrs ─────────────────────────
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  isTimeCritical: z.boolean().default(false),
  maxTransitTime: z
    .number()
    .min(0)
    .max(999.99, { message: 'Max transit time must be at most 999.99 hours' })
    .optional(),

  // ── Packaging ─────────────────────────────────────────────────────────────
  packagingType: z.string().optional(),
  numberOfPieces: z
    .number()
    .min(0)
    .max(10000, { message: 'Number of pieces must be at most 10,000' })
    .optional(),
  numberOfPallets: z
    .number()
    .min(0)
    .max(1000, { message: 'Number of pallets must be at most 1,000' })
    .optional(),

  // ── Security / Insurance ──────────────────────────────────────────────────
  requiresGpsMonitoring: z.boolean().default(false),
  requiresTemperatureMonitoring: z.boolean().default(false),
  insuranceValue: z.number().min(0).optional(),

  // ── Route — DB precision(5,2) → max 999.99 m ─────────────────────────────
  requiresLowClearanceRoute: z.boolean().default(false),
  maxClearanceHeight: z
    .number()
    .min(0)
    .max(999.99, { message: 'Max clearance height must be at most 999.99 m' })
    .optional(),
  requiresEscortVehicle: z.boolean().default(false),

  // ── Matching preferences ──────────────────────────────────────────────────
  truckRequirements: z.object({
    requiredTruckTypes: z.array(z.string()).optional(),
    requiredFeatures: z.array(z.string()).optional(),
  }).optional(),

  carrierPreferences: z.object({
    carrierName: z.string().optional(),
    carrierType: z.string().optional(),
    minCarrierRating: z.number().min(0).max(5, { message: 'Rating must be between 0 and 5' }).optional(),
  }).optional(),

  costPreferences: z.object({}).optional(),

  // ── Quality / Inspection ──────────────────────────────────────────────────
  requiresPreShipmentInspection: z.boolean().default(false),
  requiresDeliveryInspection: z.boolean().default(false),
  requiresPhotographicDocumentation: z.boolean().default(false),

}).refine((data) => {
  if (data.pickupDate && data.deliveryDate) {
    return new Date(data.deliveryDate) > new Date(data.pickupDate);
  }
  return true;
}, {
  message: 'Delivery date must be after pickup date',
  path: ['deliveryDate'],
}).refine((data) => {
  if (data.temperatureMin !== undefined && data.temperatureMax !== undefined) {
    return data.temperatureMax >= data.temperatureMin;
  }
  return true;
}, {
  message: 'Max temperature must be greater than or equal to min temperature',
  path: ['temperatureMax'],
});

export type CargoFormSchemaType = z.infer<typeof cargoFormSchema>;
