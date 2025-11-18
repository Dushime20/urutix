# Enhanced Cargo-Truck Matching System

## Overview

The enhanced matching system provides sophisticated algorithms and comprehensive scoring mechanisms to match cargo loads with the most suitable trucks. The system incorporates multiple advanced algorithms, dynamic weighting, and detailed analysis capabilities.

## Key Features

### 1. Multiple Matching Algorithms

#### Weighted Scoring (Default)
- **Purpose**: Standard matching with configurable weights
- **Best for**: General cargo matching with balanced criteria
- **Features**: 
  - Dynamic weight adjustment based on cargo characteristics
  - Comprehensive scoring across multiple dimensions
  - Real-time filtering and ranking

#### Hungarian Algorithm
- **Purpose**: Optimal assignment for multiple loads and trucks
- **Best for**: Fleet optimization and batch assignments
- **Features**:
  - Minimizes total cost across all assignments
  - Handles unbalanced load-truck scenarios
  - Provides efficiency metrics

#### Genetic Algorithm
- **Purpose**: Evolutionary optimization for complex scenarios
- **Best for**: Large-scale matching with multiple constraints
- **Features**:
  - Population-based optimization
  - Configurable parameters (population size, generations, mutation rate)
  - Convergence detection
  - Multi-objective fitness evaluation

#### TOPSIS Algorithm
- **Purpose**: Multi-criteria decision making
- **Best for**: Complex scenarios with conflicting criteria
- **Features**:
  - Ideal and negative-ideal solution analysis
  - Normalized decision matrix
  - Relative closeness scoring
  - Configurable criteria weights

#### Hybrid Algorithm
- **Purpose**: Combines multiple algorithms for optimal results
- **Best for**: High-accuracy matching requirements
- **Features**:
  - Ensemble approach
  - Deduplication of results
  - Re-scoring with hybrid methodology

### 2. Enhanced Scoring Factors

#### Core Compatibility Scores
- **Distance Score**: Proximity-based scoring with configurable thresholds
- **Capacity Score**: Weight and volume utilization optimization
- **Equipment Score**: Specialized equipment compatibility
- **Temperature Score**: Refrigeration and temperature control matching
- **Security Score**: GPS tracking, monitoring, and insurance requirements
- **Route Score**: Clearance, escort, and route-specific requirements
- **Time Score**: Urgency and availability-based scoring

#### Advanced Scoring Factors
- **Experience Score**: Driver and truck experience with cargo types
- **Availability Score**: Real-time availability and estimated availability time
- **Special Requirements Score**: Fragile, hazardous, and specialized handling
- **Rating Score**: Historical performance and reliability metrics
- **Cost Score**: Market-competitive pricing analysis

### 3. Dynamic Weighting System

The system automatically adjusts scoring weights based on cargo characteristics:

#### Cargo Type Adjustments
- **Hazardous Cargo**: Increases equipment and security weights
- **Time-Critical Cargo**: Prioritizes availability and distance
- **Fragile Cargo**: Emphasizes equipment and experience
- **Refrigerated Cargo**: Focuses on temperature control and equipment
- **High-Value Cargo**: Prioritizes security and experience

#### Urgency Level Adjustments
- **CRITICAL**: Maximum time and distance priority
- **HIGH**: Increased time and availability weights
- **NORMAL**: Balanced weighting
- **LOW**: Cost and efficiency focus

### 4. Comprehensive Data Models

#### Enhanced Load Entity
```typescript
// Dimensional specifications
length?: number;
width?: number;
height?: number;
stackableHeight?: number;
isStackable: boolean;

// Temperature & Environmental requirements
temperatureMin?: number;
temperatureMax?: number;
requiresHumidityControl: boolean;

// Loading & Unloading requirements
requiresForklift: boolean;
requiresCrane: boolean;
requiresLoadingDock: boolean;
loadingTimeEstimate?: number;
unloadingTimeEstimate?: number;

// Hazmat & Regulatory compliance
hazmatClass?: string;
hazmatNumber?: string;

// Urgency & Time sensitivity
urgencyLevel: UrgencyLevel;
isTimeCritical: boolean;
maxTransitTime?: number;

// Security & Insurance requirements
requiresGpsMonitoring: boolean;
requiresTemperatureMonitoring: boolean;
insuranceValue?: number;

// Route & Access requirements
requiresLowClearanceRoute: boolean;
maxClearanceHeight?: number;
requiresEscortVehicle: boolean;
```

#### Enhanced Truck Entity
```typescript
// Cargo-specific specifications
truckType: TruckType;
trailerType?: TrailerType;

// Essential cargo equipment
hasSideRails: boolean;
hasTarps: boolean;
hasStraps: boolean;
hasChains: boolean;
hasWinch: boolean;
hasRam: boolean;
hasTailLift: boolean;
hasSideLift: boolean;
hasRollerBed: boolean;
hasDropDeck: boolean;
hasExtendable: boolean;
hasLowbed: boolean;
hasStepDeck: boolean;
hasPowerOnly: boolean;
hasContainerChassis: boolean;

// Cargo type capabilities
hasTanker: boolean;
hasBulk: boolean;
hasRefrigerated: boolean;
hasHeated: boolean;
hasVentilated: boolean;
hasCurtainSide: boolean;
hasBox: boolean;
hasVan: boolean;
hasPlatform: boolean;
hasCarCarrier: boolean;
hasHeavyHaul: boolean;
hasOversized: boolean;

// Specialized cargo capabilities
hasHazmat: boolean;
hasDangerousGoods: boolean;
hasFoodGrade: boolean;
hasPharmaceutical: boolean;
hasLiquid: boolean;
hasDryBulk: boolean;
hasGas: boolean;
hasChemical: boolean;
hasWaste: boolean;

// Temperature control
hasReefer: boolean;
hasFrozen: boolean;
hasChilled: boolean;
hasAmbient: boolean;
hasControlledAtmosphere: boolean;
hasHumidityControl: boolean;
hasTemperatureMonitoring: boolean;

// Technology and tracking
hasGPS: boolean;
hasTracking: boolean;
hasTelematics: boolean;
hasELD: boolean;
hasDashCam: boolean;
hasSafetyCameras: boolean;

// Safety features
hasCollisionAvoidance: boolean;
hasLaneDeparture: boolean;
hasAdaptiveCruise: boolean;
hasBlindSpot: boolean;
hasBackupCamera: boolean;

// Monitoring systems
hasTirePressureMonitoring: boolean;
hasEngineMonitoring: boolean;
hasFuelMonitoring: boolean;
hasMaintenanceAlerts: boolean;
hasDriverMonitoring: boolean;
hasFatigueMonitoring: boolean;
hasSpeedMonitoring: boolean;
hasIdleMonitoring: boolean;

// Route and tracking
hasRouteOptimization: boolean;
hasRealTimeTracking: boolean;
hasGeofencing: boolean;

// Cargo monitoring
hasTemperatureAlerts: boolean;
hasHumidityAlerts: boolean;
hasShockMonitoring: boolean;
hasTiltMonitoring: boolean;
hasDoorMonitoring: boolean;
hasCargoMonitoring: boolean;
hasWeightMonitoring: boolean;
hasVolumeMonitoring: boolean;

// Specialized monitoring
hasPressureMonitoring: boolean;
hasFlowMonitoring: boolean;
hasLevelMonitoring: boolean;
hasQualityMonitoring: boolean;
hasContaminationMonitoring: boolean;

// Safety systems
hasLeakDetection: boolean;
hasOverfillProtection: boolean;
hasEmergencyShutdown: boolean;
hasFireSuppression: boolean;
hasExplosionProof: boolean;

// Material specifications
hasCorrosionResistant: boolean;
hasStainlessSteel: boolean;
hasAluminum: boolean;
hasCarbonSteel: boolean;
hasFiberglass: boolean;
hasPlastic: boolean;
hasComposite: boolean;
hasInsulated: boolean;
```

### 5. Advanced Request Options

#### Algorithm Selection
```typescript
algorithm?: MatchingAlgorithm; // WEIGHTED_SCORE | HUNGARIAN | GENETIC | TOPSIS | HYBRID
```

#### Enhanced Filtering
```typescript
// Distance and availability
maxDistance?: number;
maxHoursToAvailability?: number;
includeUnavailable?: boolean;

// Quality requirements
minRating?: number;
maxTruckAge?: number;
minDriverExperience?: number;
requiredCertifications?: string[];

// Equipment and features
requiredFeatures?: string[];
requiresRefrigeration?: boolean;
requiresHazmat?: boolean;
requiresLiftGate?: boolean;

// Cost and budget
maxPrice?: number;
maxBudget?: number;
preferredPaymentTerms?: string;

// Carrier preferences
preferredCarriers?: string[];
excludedCarriers?: string[];
minCarrierRating?: number;

// Time and urgency
maxTransitTime?: number;
isTimeCritical?: boolean;
urgencyLevel?: string;

// Analysis options
includeRouteOptimization?: boolean;
includeEnvironmentalImpact?: boolean;
includeRiskAnalysis?: boolean;
includeSuccessProbability?: boolean;
includeDetailedScoring?: boolean;
includeAlternativeMatches?: boolean;
```

### 6. Comprehensive Result Data

#### Enhanced Match Results
```typescript
// Core scoring
overallScore: number;
capacityScore: number;
distanceScore: number;
equipmentScore: number;
ratingScore: number;
priceScore: number;

// Enhanced scoring factors
temperatureScore?: number;
securityScore?: number;
routeScore?: number;
timeScore?: number;
experienceScore?: number;
availabilityScore?: number;
specialRequirementsScore?: number;

// Cost and financial
estimatedCost: number;
estimatedRevenue: number;
profitMargin: number;
recommendedPrice?: number;

// Risk and probability
successProbability?: number;
riskScore?: number;
confidence?: number;

// Timing and delivery
estimatedDeliveryTime?: number;
estimatedPickupTime?: number;
estimatedTransitTime?: number;
totalEstimatedTime?: number;

// Cost breakdown
fuelCost?: number;
laborCost?: number;
maintenanceCost?: number;
insuranceCost?: number;
tollsCost?: number;

// Environmental impact
co2Emissions?: number;
fuelConsumption?: number;
ecoScore?: number;

// Route optimization
routeInfo?: {
  distance: number;
  duration: number;
  tolls: number;
  fuelCost: number;
  waypoints: Array<{
    latitude: number;
    longitude: number;
    name: string;
  }>;
};

// Risk analysis
riskFactors?: {
  equipmentRisk: number;
  capacityRisk: number;
  ratingRisk: number;
  availabilityRisk: number;
  costRisk: number;
  totalRisk: number;
};

// Detailed scoring breakdown
scoringBreakdown?: {
  dimensionalCompatibility: number;
  capacityUtilization: number;
  equipmentMatch: number;
  temperatureControl: number;
  securityRequirements: number;
  routeCompatibility: number;
  timeCompatibility: number;
  distance: number;
  reliability: number;
  costEfficiency: number;
};

// Market context
marketContext?: {
  averageCost: number;
  costPercentile: number;
  availabilityPercentile: number;
  qualityPercentile: number;
  marketBalance: string;
};

// Performance metrics
performanceMetrics?: {
  processingTime: number;
  algorithmUsed: string;
  confidenceLevel: number;
  dataQuality: number;
};

// Compliance and certifications
compliance?: {
  hasRequiredCertifications: boolean;
  insuranceCoverage: number;
  safetyRating: number;
  environmentalCompliance: boolean;
  regulatoryCompliance: boolean;
};

// Special handling capabilities
specialCapabilities?: {
  hasTemperatureControl: boolean;
  hasHumidityControl: boolean;
  hasShockMonitoring: boolean;
  hasTiltMonitoring: boolean;
  hasDoorMonitoring: boolean;
  hasCargoMonitoring: boolean;
  hasWeightMonitoring: boolean;
  hasVolumeMonitoring: boolean;
};

// Historical performance
historicalPerformance?: {
  totalTrips: number;
  successfulDeliveries: number;
  onTimeDeliveries: number;
  averageRating: number;
  totalRevenue: number;
  fuelEfficiency: number;
};

// Real-time status
realTimeStatus?: {
  currentLocation: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
  estimatedAvailableTime: Date;
  currentStatus: string;
  isOnline: boolean;
};
```

### 7. Usage Examples

#### Basic Matching Request
```typescript
const request: MatchRequestDto = {
  loadId: "load-123",
  maxDistance: 200,
  minRating: 0.8,
  limit: 10,
  includeDrivers: true
};
```

#### Advanced Matching Request
```typescript
const advancedRequest: MatchRequestDto = {
  loadId: "load-456",
  algorithm: MatchingAlgorithm.HYBRID,
  maxDistance: 150,
  minRating: 0.9,
  requiresRefrigeration: true,
  requiresHazmat: true,
  maxPrice: 5000,
  isTimeCritical: true,
  urgencyLevel: "CRITICAL",
  includeRouteOptimization: true,
  includeEnvironmentalImpact: true,
  includeRiskAnalysis: true,
  includeSuccessProbability: true,
  includeDetailedScoring: true,
  limit: 5
};
```

#### Genetic Algorithm Configuration
```typescript
const geneticRequest: MatchRequestDto = {
  loadId: "load-789",
  algorithm: MatchingAlgorithm.GENETIC,
  maxProcessingTime: 30,
  limit: 20
};
```

### 8. Performance Optimizations

#### Query Optimization
- Dynamic SQL generation based on request parameters
- Indexed queries for common filtering scenarios
- Geospatial indexing for distance calculations
- Caching for frequently accessed data

#### Algorithm Optimization
- Early termination for impossible matches
- Parallel processing for independent calculations
- Memory-efficient data structures
- Configurable processing time limits

#### Caching Strategy
- Result caching for identical requests
- Truck availability caching
- Market data caching
- Algorithm result caching

### 9. Monitoring and Analytics

#### Performance Metrics
- Processing time per algorithm
- Match quality distribution
- Algorithm selection frequency
- User satisfaction metrics

#### Business Intelligence
- Market balance analysis
- Cost trend analysis
- Equipment utilization rates
- Carrier performance tracking

### 10. Future Enhancements

#### Planned Features
- Machine learning-based matching
- Real-time market price integration
- Advanced route optimization
- Predictive analytics for demand forecasting
- Integration with external logistics platforms

#### Technical Improvements
- GraphQL API for flexible queries
- WebSocket support for real-time updates
- Microservices architecture
- Containerized deployment
- Auto-scaling capabilities

## Conclusion

The enhanced matching system provides a comprehensive, scalable, and intelligent solution for cargo-truck matching. With multiple algorithms, detailed scoring, and extensive configuration options, it can handle a wide range of matching scenarios while providing valuable insights for business optimization. 