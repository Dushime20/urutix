# Enhanced Matching System - OpenAPI Documentation

## Overview

The Enhanced Matching System provides sophisticated algorithms and comprehensive scoring mechanisms to match cargo loads with the most suitable trucks. The system incorporates multiple advanced algorithms, dynamic weighting, and detailed analysis capabilities.

## API Base URL

```
Development: http://localhost:3000
Production: https://api.urutix.com
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Enhanced Matching Endpoints

### 1. Main Matching Endpoint

#### POST /matching/find-matches

**Description**: Enhanced cargo-truck matching with multiple algorithms and comprehensive multi-dimensional scoring.

**Request Body**:
```json
{
  "loadId": "string (required)",
  "algorithm": "WEIGHTED_SCORE | HUNGARIAN | GENETIC | TOPSIS | HYBRID",
  "maxDistance": "number (optional)",
  "minRating": "number (optional, 0-1)",
  "maxPrice": "number (optional)",
  "requiresRefrigeration": "boolean (optional)",
  "requiresHazmat": "boolean (optional)",
  "requiresLiftGate": "boolean (optional)",
  "preferredTruckType": "string (optional)",
  "limit": "number (optional, 1-50)",
  "includeDrivers": "boolean (optional)",
  "includeRouteOptimization": "boolean (optional)",
  "includeEnvironmentalImpact": "boolean (optional)",
  "includeRiskAnalysis": "boolean (optional)",
  "includeSuccessProbability": "boolean (optional)",
  "minCompatibilityScore": "number (optional, 0-1)",
  "maxRiskScore": "number (optional, 0-1)",
  "prioritizeCost": "boolean (optional)",
  "prioritizeSpeed": "boolean (optional)",
  "prioritizeQuality": "boolean (optional)",
  "preferredCarrierId": "string (optional)",
  "excludedCarrierId": "string (optional)",
  "maxHoursToAvailability": "number (optional)",
  "includeUnavailable": "boolean (optional)",
  "maxTruckAge": "number (optional)",
  "minDriverExperience": "number (optional)",
  "requiredCertifications": "string[] (optional)",
  "requireInsurance": "boolean (optional)",
  "minInsuranceCoverage": "number (optional)",
  "requiredFeatures": "string[] (optional)",
  "preferredCarriers": "string[] (optional)",
  "excludedCarriers": "string[] (optional)",
  "minCarrierRating": "number (optional, 0-1)",
  "maxBudget": "number (optional)",
  "preferredPaymentTerms": "string (optional)",
  "requiresTracking": "boolean (optional)",
  "maxTransitTime": "number (optional)",
  "isTimeCritical": "boolean (optional)",
  "urgencyLevel": "LOW | NORMAL | HIGH | CRITICAL (optional)",
  "includeDetailedScoring": "boolean (optional)",
  "includeAlternativeMatches": "boolean (optional)",
  "maxProcessingTime": "number (optional, 1-100)"
}
```

**Example Requests**:

**Basic Matching**:
```json
{
  "loadId": "load-123",
  "maxDistance": 200,
  "minRating": 0.8,
  "limit": 10,
  "includeDrivers": true
}
```

**Advanced Matching with Hybrid Algorithm**:
```json
{
  "loadId": "load-456",
  "algorithm": "HYBRID",
  "maxDistance": 150,
  "minRating": 0.9,
  "requiresRefrigeration": true,
  "requiresHazmat": true,
  "maxPrice": 5000,
  "isTimeCritical": true,
  "urgencyLevel": "CRITICAL",
  "includeRouteOptimization": true,
  "includeEnvironmentalImpact": true,
  "includeRiskAnalysis": true,
  "includeSuccessProbability": true,
  "includeDetailedScoring": true,
  "limit": 5
}
```

**Genetic Algorithm Configuration**:
```json
{
  "loadId": "load-789",
  "algorithm": "GENETIC",
  "maxProcessingTime": 30,
  "limit": 20
}
```

**Response**:
```json
{
  "message": "Enhanced matches found successfully",
  "matches": [
    {
      "truckId": "truck-123",
      "loadId": "load-456",
      "overallScore": 0.92,
      "capacityScore": 0.90,
      "distanceScore": 0.85,
      "equipmentScore": 0.88,
      "ratingScore": 0.85,
      "priceScore": 0.75,
      "temperatureScore": 0.85,
      "securityScore": 0.90,
      "routeScore": 0.80,
      "timeScore": 0.95,
      "experienceScore": 0.88,
      "availabilityScore": 0.92,
      "specialRequirementsScore": 0.95,
      "distanceKm": 150,
      "estimatedCost": 375,
      "estimatedRevenue": 450,
      "profitMargin": 0.17,
      "successProbability": 0.88,
      "estimatedDeliveryTime": 3.5,
      "riskScore": 0.12,
      "recommendedPrice": 425,
      "confidence": 0.85,
      "truckMake": "Freightliner",
      "truckModel": "Cascadia",
      "plateNumber": "ABC-123",
      "capacityWeight": 20000,
      "capacityVolume": 100,
      "truckRating": 4.5,
      "hasRefrigeration": true,
      "hasLiftGate": false,
      "hasHazmatPermit": true,
      "matchReason": "Excellent dimensional match, Optimal capacity utilization, High-rated truck with required features",
      "driverId": "driver-456",
      "driverName": "John Smith",
      "driverRating": 4.8,
      "driverLicenseNumber": "DL123456789",
      "truckType": "REFRIGERATED",
      "fuelType": "DIESEL",
      "truckAge": 3,
      "mileage": 150000,
      "ownerName": "ABC Trucking",
      "ownerRating": 4.6,
      "estimatedPickupTime": 2.5,
      "estimatedTransitTime": 3.5,
      "totalEstimatedTime": 6.0,
      "fuelCost": 150,
      "laborCost": 200,
      "maintenanceCost": 25,
      "insuranceCost": 50,
      "tollsCost": 30,
      "co2Emissions": 450.5,
      "fuelConsumption": 45.2,
      "ecoScore": 0.78,
      "routeInfo": {
        "distance": 150,
        "duration": 3.5,
        "tolls": 30,
        "fuelCost": 150,
        "waypoints": [
          {
            "latitude": 40.7128,
            "longitude": -74.0060,
            "name": "Pickup Location"
          },
          {
            "latitude": 34.0522,
            "longitude": -118.2437,
            "name": "Delivery Location"
          }
        ]
      },
      "riskFactors": {
        "equipmentRisk": 0.05,
        "capacityRisk": 0.08,
        "ratingRisk": 0.03,
        "availabilityRisk": 0.02,
        "costRisk": 0.12,
        "totalRisk": 0.12
      },
      "scoringBreakdown": {
        "dimensionalCompatibility": 0.95,
        "capacityUtilization": 0.90,
        "equipmentMatch": 0.88,
        "temperatureControl": 0.85,
        "securityRequirements": 0.90,
        "routeCompatibility": 0.80,
        "timeCompatibility": 0.95,
        "distance": 0.85,
        "reliability": 0.88,
        "costEfficiency": 0.75
      },
      "marketContext": {
        "averageCost": 400,
        "costPercentile": 75,
        "availabilityPercentile": 85,
        "qualityPercentile": 90,
        "marketBalance": "Truck Surplus"
      },
      "performanceMetrics": {
        "processingTime": 245,
        "algorithmUsed": "HYBRID",
        "confidenceLevel": 0.85,
        "dataQuality": 0.92
      },
      "compliance": {
        "hasRequiredCertifications": true,
        "insuranceCoverage": 1000000,
        "safetyRating": 4.5,
        "environmentalCompliance": true,
        "regulatoryCompliance": true
      },
      "specialCapabilities": {
        "hasTemperatureControl": true,
        "hasHumidityControl": false,
        "hasShockMonitoring": true,
        "hasTiltMonitoring": true,
        "hasDoorMonitoring": true,
        "hasCargoMonitoring": true,
        "hasWeightMonitoring": false,
        "hasVolumeMonitoring": false
      },
      "historicalPerformance": {
        "totalTrips": 150,
        "successfulDeliveries": 148,
        "onTimeDeliveries": 145,
        "averageRating": 4.5,
        "totalRevenue": 75000,
        "fuelEfficiency": 0.78
      },
      "realTimeStatus": {
        "currentLocation": {
          "latitude": 40.7128,
          "longitude": -74.0060
        },
        "lastUpdated": "2024-01-15T10:30:00.000Z",
        "estimatedAvailableTime": "2024-01-15T14:00:00.000Z",
        "currentStatus": "AVAILABLE",
        "isOnline": true
      }
    }
  ]
}
```

### 2. Algorithm-Specific Endpoints

#### POST /matching/find-matches/hungarian

**Description**: Find optimal assignments using the Hungarian algorithm for multiple loads and trucks.

**Request Body**: Same as main endpoint
**Response**: Same structure as main endpoint

#### POST /matching/find-matches/genetic

**Description**: Find optimal matches using genetic algorithm for complex scenarios.

**Request Body**: Same as main endpoint
**Response**: Same structure as main endpoint

#### POST /matching/find-matches/topsis

**Description**: Find optimal matches using TOPSIS (Technique for Order of Preference by Similarity to Ideal Solution).

**Request Body**: Same as main endpoint
**Response**: Same structure as main endpoint

#### POST /matching/find-matches/hybrid

**Description**: Find optimal matches using hybrid algorithm that combines multiple approaches.

**Request Body**: Same as main endpoint
**Response**: Same structure as main endpoint

### 3. Analytics Endpoints

#### GET /matching/market-insights

**Description**: Get comprehensive market analytics for matching insights.

**Response**:
```json
{
  "message": "Market insights retrieved successfully",
  "insights": {
    "totalPublishedLoads": 150,
    "totalAvailableTrucks": 200,
    "totalActiveDrivers": 180,
    "marketBalance": "Truck Surplus",
    "averageLoadWeight": 1500,
    "averageTruckCapacity": 20000
  }
}
```

#### GET /matching/comprehensive-metrics

**Description**: Get comprehensive metrics including enhanced matching performance.

**Response**:
```json
{
  "message": "Comprehensive metrics retrieved successfully",
  "metrics": {
    "loads": 150,
    "trucks": 200,
    "drivers": 180,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET /matching/algorithms

**Description**: Get list of all available matching algorithms with descriptions.

**Response**:
```json
{
  "message": "Available algorithms retrieved successfully",
  "algorithms": [
    {
      "name": "WEIGHTED_SCORE",
      "description": "Standard matching with configurable weights",
      "bestFor": "General cargo matching with balanced criteria"
    },
    {
      "name": "HUNGARIAN",
      "description": "Optimal assignment for multiple loads and trucks",
      "bestFor": "Fleet optimization and batch assignments"
    },
    {
      "name": "GENETIC",
      "description": "Evolutionary optimization for complex scenarios",
      "bestFor": "Large-scale matching with multiple constraints"
    },
    {
      "name": "TOPSIS",
      "description": "Multi-criteria decision making",
      "bestFor": "Complex scenarios with conflicting criteria"
    },
    {
      "name": "HYBRID",
      "description": "Combines multiple algorithms for optimal results",
      "bestFor": "High-accuracy matching requirements"
    }
  ]
}
```

#### GET /matching/scoring-factors

**Description**: Get list of all available scoring factors with descriptions and weights.

**Response**:
```json
{
  "message": "Scoring factors retrieved successfully",
  "factors": [
    {
      "name": "distance",
      "description": "Proximity-based scoring with configurable thresholds",
      "defaultWeight": 0.15,
      "beneficial": false
    },
    {
      "name": "capacity",
      "description": "Weight and volume utilization optimization",
      "defaultWeight": 0.20,
      "beneficial": true
    },
    {
      "name": "equipment",
      "description": "Specialized equipment compatibility",
      "defaultWeight": 0.25,
      "beneficial": true
    },
    {
      "name": "temperature",
      "description": "Refrigeration and temperature control matching",
      "defaultWeight": 0.10,
      "beneficial": true
    },
    {
      "name": "security",
      "description": "GPS tracking, monitoring, and insurance requirements",
      "defaultWeight": 0.10,
      "beneficial": true
    },
    {
      "name": "route",
      "description": "Clearance, escort, and route-specific requirements",
      "defaultWeight": 0.05,
      "beneficial": true
    },
    {
      "name": "time",
      "description": "Urgency and availability-based scoring",
      "defaultWeight": 0.05,
      "beneficial": true
    },
    {
      "name": "experience",
      "description": "Driver and truck experience with cargo types",
      "defaultWeight": 0.02,
      "beneficial": true
    },
    {
      "name": "availability",
      "description": "Real-time availability and estimated availability time",
      "defaultWeight": 0.02,
      "beneficial": true
    },
    {
      "name": "specialRequirements",
      "description": "Fragile, hazardous, and specialized handling",
      "defaultWeight": 0.01,
      "beneficial": true
    },
    {
      "name": "rating",
      "description": "Historical performance and reliability metrics",
      "defaultWeight": 0.03,
      "beneficial": true
    },
    {
      "name": "cost",
      "description": "Market-competitive pricing analysis",
      "defaultWeight": 0.02,
      "beneficial": false
    }
  ]
}
```

### 4. Utility Endpoints

#### POST /matching/clear-caches

**Description**: Clear all enhanced matching and optimization caches to refresh data.

**Response**:
```json
{
  "message": "Caches cleared successfully"
}
```

## Data Models

### MatchRequestDto

```typescript
{
  loadId: string (required);
  algorithm?: MatchingAlgorithm;
  maxDistance?: number;
  minRating?: number;
  maxPrice?: number;
  requiresRefrigeration?: boolean;
  requiresHazmat?: boolean;
  requiresLiftGate?: boolean;
  preferredTruckType?: string;
  limit?: number;
  includeDrivers?: boolean;
  includeRouteOptimization?: boolean;
  includeEnvironmentalImpact?: boolean;
  includeRiskAnalysis?: boolean;
  includeSuccessProbability?: boolean;
  minCompatibilityScore?: number;
  maxRiskScore?: number;
  prioritizeCost?: boolean;
  prioritizeSpeed?: boolean;
  prioritizeQuality?: boolean;
  preferredCarrierId?: string;
  excludedCarrierId?: string;
  maxHoursToAvailability?: number;
  includeUnavailable?: boolean;
  maxTruckAge?: number;
  minDriverExperience?: number;
  requiredCertifications?: string[];
  requireInsurance?: boolean;
  minInsuranceCoverage?: number;
  requiredFeatures?: string[];
  preferredCarriers?: string[];
  excludedCarriers?: string[];
  minCarrierRating?: number;
  maxBudget?: number;
  preferredPaymentTerms?: string;
  requiresTracking?: boolean;
  maxTransitTime?: number;
  isTimeCritical?: boolean;
  urgencyLevel?: string;
  includeDetailedScoring?: boolean;
  includeAlternativeMatches?: boolean;
  maxProcessingTime?: number;
}
```

### MatchResultDto

```typescript
{
  truckId: string;
  loadId: string;
  overallScore: number;
  capacityScore: number;
  distanceScore: number;
  equipmentScore: number;
  ratingScore: number;
  priceScore: number;
  temperatureScore?: number;
  securityScore?: number;
  routeScore?: number;
  timeScore?: number;
  experienceScore?: number;
  availabilityScore?: number;
  specialRequirementsScore?: number;
  distanceKm: number;
  estimatedCost: number;
  estimatedRevenue: number;
  profitMargin: number;
  successProbability?: number;
  estimatedDeliveryTime?: number;
  riskScore?: number;
  recommendedPrice?: number;
  confidence?: number;
  truckMake: string;
  truckModel: string;
  plateNumber: string;
  capacityWeight: number;
  capacityVolume: number;
  truckRating: number;
  hasRefrigeration: boolean;
  hasLiftGate: boolean;
  hasHazmatPermit: boolean;
  driverId?: string;
  driverName?: string;
  driverRating?: number;
  driverLicenseNumber?: string;
  matchReason: string;
  truckType?: string;
  fuelType?: string;
  truckAge?: number;
  mileage?: number;
  ownerName?: string;
  ownerRating?: number;
  estimatedPickupTime?: number;
  estimatedTransitTime?: number;
  totalEstimatedTime?: number;
  fuelCost?: number;
  laborCost?: number;
  maintenanceCost?: number;
  insuranceCost?: number;
  tollsCost?: number;
  co2Emissions?: number;
  fuelConsumption?: number;
  ecoScore?: number;
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
  riskFactors?: {
    equipmentRisk: number;
    capacityRisk: number;
    ratingRisk: number;
    availabilityRisk: number;
    costRisk: number;
    totalRisk: number;
  };
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
  marketContext?: {
    averageCost: number;
    costPercentile: number;
    availabilityPercentile: number;
    qualityPercentile: number;
    marketBalance: string;
  };
  performanceMetrics?: {
    processingTime: number;
    algorithmUsed: string;
    confidenceLevel: number;
    dataQuality: number;
  };
  compliance?: {
    hasRequiredCertifications: boolean;
    insuranceCoverage: number;
    safetyRating: number;
    environmentalCompliance: boolean;
    regulatoryCompliance: boolean;
  };
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
  historicalPerformance?: {
    totalTrips: number;
    successfulDeliveries: number;
    onTimeDeliveries: number;
    averageRating: number;
    totalRevenue: number;
    fuelEfficiency: number;
  };
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
}
```

### MatchingAlgorithm Enum

```typescript
enum MatchingAlgorithm {
  WEIGHTED_SCORE = 'WEIGHTED_SCORE',
  HUNGARIAN = 'HUNGARIAN',
  GENETIC = 'GENETIC',
  TOPSIS = 'TOPSIS',
  HYBRID = 'HYBRID'
}
```

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request parameters",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Load not found",
  "error": "Not Found"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

- **Standard endpoints**: 100 requests per minute
- **Matching endpoints**: 50 requests per minute
- **Analytics endpoints**: 30 requests per minute

## Versioning

- **Current Version**: 3.0.0
- **API Version Header**: `X-API-Version: 3.0.0`

## Support

For API support and questions:
- **Email**: support@urutix.com
- **Documentation**: https://docs.urutix.com
- **Status Page**: https://status.urutix.com 