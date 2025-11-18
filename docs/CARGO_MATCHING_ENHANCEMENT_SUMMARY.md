# Cargo Matching Enhancement Analysis & Proposal

## Current Truck Records Analysis

### Comprehensive Truck Data Captured:
The current truck entity captures extensive information for matching:

**Core Identification:**
- Plate number, VIN, Make, Model, Year
- Owner ID, Tenant ID
- Registration and insurance details

**Capacity & Dimensions:**
- Weight capacity (kg)
- Volume capacity (m³)
- Maximum dimensions (length, width, height)
- Fuel type and efficiency

**Equipment & Capabilities:**
- Truck type (FLATBED, BOX_TRUCK, TANKER, etc.)
- Trailer type (FLATBED, DRY_VAN, REFRIGERATED, etc.)
- Specialized equipment (side rails, tarps, straps, chains, winch, ram, tail lift, side lift, roller bed)
- Refrigeration capability
- Lift gate availability
- GPS tracking
- Hazmat permits

**Operational Status:**
- Current status (AVAILABLE, IN_TRANSIT, MAINTENANCE, OUT_OF_SERVICE)
- Current location with coordinates
- Driver assignment
- Maintenance history and schedules
- Performance metrics (total trips, revenue, ratings)

**Compliance & Safety:**
- Registration expiry dates
- Insurance coverage and expiry
- Roadworthy certificates
- Driver qualifications and endorsements

## Current Cargo Records Analysis

### Current Cargo Data Captured:
The current load entity captures basic information:

**Basic Information:**
- Title, description
- Weight, volume (optional)
- Cargo type (GENERAL, FRAGILE, HAZARDOUS, REFRIGERATED, etc.)
- Load value and offered price

**Location & Timing:**
- Pickup and delivery locations
- Pickup and delivery dates
- Contact information

**Special Requirements:**
- Fragile flag
- Hazardous flag
- Refrigeration requirement
- Auto-match enabled flag

**Matching Criteria:**
- JSON field for matching criteria
- Rating and view count

## Proposed Enhanced Cargo Records for Optimal Matching

### 1. **Dimensional Specifications** (Critical for Matching)
```typescript
// Add to Load entity
@Column('decimal', { precision: 8, scale: 2, nullable: true })
length?: number; // meters

@Column('decimal', { precision: 8, scale: 2, nullable: true })
width?: number; // meters

@Column('decimal', { precision: 8, scale: 2, nullable: true })
height?: number; // meters

@Column('decimal', { precision: 8, scale: 2, nullable: true })
stackableHeight?: number; // meters - for stacking considerations

@Column({ default: false })
isStackable: boolean;

@Column({ default: false })
requiresSpecialHandling: boolean;
```

### 2. **Temperature & Environmental Requirements**
```typescript
@Column('decimal', { precision: 5, scale: 2, nullable: true })
temperatureMin?: number; // Celsius

@Column('decimal', { precision: 5, scale: 2, nullable: true })
temperatureMax?: number; // Celsius

@Column({ default: false })
requiresHumidityControl: boolean;

@Column('decimal', { precision: 5, scale: 2, nullable: true })
humidityMin?: number; // percentage

@Column('decimal', { precision: 5, scale: 2, nullable: true })
humidityMax?: number; // percentage

@Column({ default: false })
requiresVentilation: boolean;

@Column({ default: false })
requiresProtectionFromElements: boolean;
```

### 3. **Loading & Unloading Requirements**
```typescript
@Column({ default: false })
requiresForklift: boolean;

@Column({ default: false })
requiresCrane: boolean;

@Column({ default: false })
requiresLoadingDock: boolean;

@Column({ default: false })
requiresGroundLevelLoading: boolean;

@Column('decimal', { precision: 5, scale: 2, nullable: true })
loadingTimeEstimate?: number; // hours

@Column('decimal', { precision: 5, scale: 2, nullable: true })
unloadingTimeEstimate?: number; // hours

@Column({ default: false })
requiresSpecializedEquipment: boolean;

@Column('jsonb', { default: [] })
requiredEquipment?: string[]; // ['pallet jack', 'straps', 'dolly']
```

### 4. **Security & Insurance Requirements**
```typescript
@Column({ default: false })
requiresArmedSecurity: boolean;

@Column({ default: false })
requiresGPSMonitoring: boolean;

@Column({ default: false })
requiresTemperatureMonitoring: boolean;

@Column('decimal', { precision: 15, scale: 2, nullable: true })
insuranceValue?: number;

@Column({ default: false })
requiresChainOfCustody: boolean;

@Column({ default: false })
requiresTamperEvidentSeals: boolean;
```

### 5. **Hazmat & Regulatory Compliance**
```typescript
@Column({ nullable: true })
hazmatClass?: string; // UN classification

@Column({ nullable: true })
hazmatNumber?: string; // UN number

@Column({ default: false })
requiresHazmatCertification: boolean;

@Column({ default: false })
requiresSpecialPermits: boolean;

@Column('jsonb', { default: [] })
requiredPermits?: string[];

@Column({ default: false })
requiresCustomsClearance: boolean;

@Column({ default: false })
requiresBorderCrossing: boolean;
```

### 6. **Packaging & Handling Details**
```typescript
@Column({ nullable: true })
packagingType?: string; // 'pallets', 'crates', 'boxes', 'loose'

@Column({ default: 0 })
numberOfPieces?: number;

@Column({ default: 0 })
numberOfPallets?: number;

@Column({ default: false })
requiresStretchWrapping: boolean;

@Column({ default: false })
requiresShrinkWrapping: boolean;

@Column({ default: false })
requiresCornerProtection: boolean;

@Column({ default: false })
requiresEdgeProtection: boolean;
```

### 7. **Urgency & Time Sensitivity**
```typescript
@Column({
  type: 'enum',
  enum: UrgencyLevel,
  default: UrgencyLevel.NORMAL,
})
urgencyLevel: UrgencyLevel;

@Column({ default: false })
isTimeCritical: boolean;

@Column('decimal', { precision: 5, scale: 2, nullable: true })
maxTransitTime?: number; // hours

@Column({ default: false })
requiresExpeditedService: boolean;

@Column({ default: false })
allowsPartialDelivery: boolean;
```

### 8. **Route & Access Requirements**
```typescript
@Column({ default: false })
requiresLowClearanceRoute: boolean;

@Column('decimal', { precision: 5, scale: 2, nullable: true })
maxClearanceHeight?: number; // meters

@Column({ default: false })
requiresWideLoadRoute: boolean;

@Column({ default: false })
requiresEscortVehicle: boolean;

@Column({ default: false })
requiresSpecialRoutePlanning: boolean;

@Column('jsonb', { default: [] })
restrictedAreas?: string[]; // areas to avoid

@Column('jsonb', { default: [] })
preferredRoutes?: string[]; // preferred highways/roads
```

### 9. **Documentation & Compliance**
```typescript
@Column({ default: false })
requiresCustomsDocumentation: boolean;

@Column({ default: false })
requiresCommercialInvoice: boolean;

@Column({ default: false })
requiresPackingList: boolean;

@Column({ default: false })
requiresCertificateOfOrigin: boolean;

@Column({ default: false })
requiresPhytosanitaryCertificate: boolean;

@Column('jsonb', { default: [] })
requiredDocuments?: string[];
```

### 10. **Advanced Matching Criteria**
```typescript
@Column('jsonb', { default: {} })
truckRequirements: {
  minCapacityWeight?: number;
  minCapacityVolume?: number;
  requiredTruckTypes?: string[];
  requiredFeatures?: string[];
  maxTruckAge?: number;
  minDriverExperience?: number;
  requiredCertifications?: string[];
  minInsuranceCoverage?: number;
};

@Column('jsonb', { default: {} })
carrierPreferences: {
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minCarrierRating?: number;
  maxDistance?: number;
  maxHoursToAvailability?: number;
};

@Column('jsonb', { default: {} })
costPreferences: {
  maxBudget?: number;
  preferredPaymentTerms?: string;
  requiresInsurance?: boolean;
  requiresTracking?: boolean;
};
```

### 11. **Quality & Inspection Requirements**
```typescript
@Column({ default: false })
requiresPreShipmentInspection: boolean;

@Column({ default: false })
requiresDeliveryInspection: boolean;

@Column({ default: false })
requiresPhotographicDocumentation: boolean;

@Column({ default: false })
requiresConditionReports: boolean;

@Column({ default: false })
requiresTemperatureLogging: boolean;

@Column({ default: false })
requiresHumidityLogging: boolean;
```

### 12. **Special Handling Instructions**
```typescript
@Column('text', { nullable: true })
specialHandlingInstructions?: string;

@Column('text', { nullable: true })
loadingInstructions?: string;

@Column('text', { nullable: true })
unloadingInstructions?: string;

@Column('text', { nullable: true })
emergencyContactInfo?: string;

@Column('text', { nullable: true })
deliveryInstructions?: string;
```

## Enhanced Matching Algorithm Improvements

### 1. **Multi-Dimensional Scoring**
```typescript
interface EnhancedMatchingFactors {
  // Physical compatibility
  dimensionalCompatibility: number;
  weightCapacityUtilization: number;
  volumeCapacityUtilization: number;
  
  // Equipment compatibility
  equipmentMatchScore: number;
  temperatureControlMatch: number;
  securityRequirementsMatch: number;
  
  // Operational compatibility
  routeCompatibility: number;
  timingCompatibility: number;
  accessCompatibility: number;
  
  // Cost efficiency
  costEfficiencyScore: number;
  profitMarginScore: number;
  
  // Quality & reliability
  carrierRatingScore: number;
  experienceScore: number;
  reliabilityScore: number;
}
```

### 2. **Intelligent Weighting System**
```typescript
interface DynamicWeighting {
  // Adjust weights based on cargo characteristics
  getWeightingFactors(cargo: Load): WeightingFactors {
    const weights = {
      dimensionalCompatibility: 0.15,
      capacityUtilization: 0.20,
      equipmentMatch: 0.25,
      costEfficiency: 0.15,
      reliability: 0.15,
      timing: 0.10
    };
    
    // Adjust for special requirements
    if (cargo.isHazardous) weights.equipmentMatch += 0.10;
    if (cargo.isTimeCritical) weights.timing += 0.15;
    if (cargo.isFragile) weights.equipmentMatch += 0.05;
    
    return weights;
  }
}
```

### 3. **Real-Time Availability Matching**
```typescript
interface AvailabilityMatching {
  checkRealTimeAvailability(truck: Truck, cargo: Load): AvailabilityScore {
    return {
      immediateAvailability: boolean,
      estimatedWaitTime: number,
      alternativeAvailability: Date,
      availabilityConfidence: number
    };
  }
}
```

## Implementation Priority

### Phase 1: Critical Dimensions & Requirements
1. Add dimensional specifications (length, width, height)
2. Add temperature requirements
3. Add loading/unloading requirements
4. Add hazmat classification details

### Phase 2: Advanced Requirements
1. Add security and monitoring requirements
2. Add route and access requirements
3. Add documentation requirements
4. Add quality and inspection requirements

### Phase 3: Enhanced Matching
1. Implement multi-dimensional scoring
2. Add dynamic weighting system
3. Add real-time availability checking
4. Add predictive matching algorithms

## Benefits of Enhanced Cargo Recording

1. **Improved Matching Accuracy**: More precise truck-cargo compatibility
2. **Reduced Manual Intervention**: Automated matching for complex requirements
3. **Better Cost Optimization**: More efficient capacity utilization
4. **Enhanced Safety**: Better handling of hazardous and fragile cargo
5. **Regulatory Compliance**: Proper documentation and permit tracking
6. **Customer Satisfaction**: More reliable and predictable service
7. **Operational Efficiency**: Reduced delays and rework

This enhanced cargo recording system will significantly improve the matching algorithm's ability to find optimal truck-cargo combinations, leading to better operational efficiency and customer satisfaction. 