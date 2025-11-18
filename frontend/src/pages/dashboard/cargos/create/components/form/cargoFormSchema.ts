import { z } from 'zod';

export const cargoFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, { message: 'Cargo title is required' }),
  description: z.string().optional(),
  weight: z.number().min(0.01, { message: 'Weight must be greater than 0' }),
  volume: z.number().min(0).optional(),
  cargoType: z.string().min(1, { message: 'Cargo type is required' }),
  loadType: z.enum(['FTL', 'LTL', 'REEFER', 'FLATBED', 'TANKER', 'INTERMODAL', 'OTHER']).default('FTL'),
  equipmentType: z.enum(['DRY_VAN', 'REEFER', 'FLATBED', 'TANKER', 'CONTAINER', 'OTHER']).default('DRY_VAN'),
  visibility: z.enum(['public', 'private']).default('public'),
  unitsRequired: z.number().min(1).default(1),
  pickupLocationId: z.string().optional(),
  deliveryLocationId: z.string().optional(),
  pickupDate: z.string().min(1, { message: 'Pickup date is required' }),
  deliveryDate: z.string().min(1, { message: 'Delivery date is required' }),
  loadValue: z.number().min(0.01, { message: 'Load value must be greater than 0' }),
  offeredPrice: z.number().min(0).optional(),
  currencyCode: z.string().default('USD'),
  paymentTerms: z.enum(['Prepaid', 'OnDelivery', 'Net15', 'Net30', 'Net45', 'Net60']).default('Net30'),
  isFragile: z.boolean().default(false),
  isHazardous: z.boolean().default(false),
  requiresRefrigeration: z.boolean().default(false),
  specialRequirements: z.string().optional(),
  autoMatchEnabled: z.boolean().default(true),
  loadingInstructions: z.string().optional(),
  unloadingInstructions: z.string().optional(),
  // Contact info fields
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.email({ message: 'Invalid email address' }).optional().or(z.literal('')),
  // Enhanced fields
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  stackableHeight: z.number().min(0).optional(),
  isStackable: z.boolean().default(false),
  temperatureMin: z.number().optional(),
  temperatureMax: z.number().optional(),
  requiresHumidityControl: z.boolean().default(false),
  requiresForklift: z.boolean().default(false),
  requiresCrane: z.boolean().default(false),
  requiresLoadingDock: z.boolean().default(false),
  loadingTimeEstimate: z.number().min(0).optional(),
  unloadingTimeEstimate: z.number().min(0).optional(),
  hazmatClass: z.string().optional(),
  hazmatNumber: z.string().optional(),
  urgencyLevel: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  isTimeCritical: z.boolean().default(false),
  maxTransitTime: z.number().min(0).optional(),
  packagingType: z.string().optional(),
  numberOfPieces: z.number().min(0).optional(),
  numberOfPallets: z.number().min(0).optional(),
  requiresGpsMonitoring: z.boolean().default(false),
  requiresTemperatureMonitoring: z.boolean().default(false),
  insuranceValue: z.number().min(0).optional(),
  requiresLowClearanceRoute: z.boolean().default(false),
  maxClearanceHeight: z.number().min(0).optional(),
  requiresEscortVehicle: z.boolean().default(false),
  specialHandlingInstructions: z.string().optional(),
  emergencyContactInfo: z.string().optional(),
  truckRequirements: z.object({
    requiredTruckTypes: z.array(z.string()).optional(),
    requiredFeatures: z.array(z.string()).optional(),
  }).optional(),
  carrierPreferences: z.object({
    carrierName: z.string().optional(),
    carrierType: z.string().optional(),
  }).optional(),
  costPreferences: z.object({}).optional(),
  requiresPreShipmentInspection: z.boolean().default(false),
  requiresDeliveryInspection: z.boolean().default(false),
  requiresPhotographicDocumentation: z.boolean().default(false),
}).refine((data) => {
  // Ensure delivery date is after pickup date
  if (data.pickupDate && data.deliveryDate) {
    return new Date(data.deliveryDate) > new Date(data.pickupDate);
  }
  return true;
}, {
  message: 'Delivery date must be after pickup date',
  path: ['deliveryDate'],
});

export type CargoFormSchemaType = z.infer<typeof cargoFormSchema>;
