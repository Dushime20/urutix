# Matching Algorithm Documentation

## Overview

The UrutiX matching algorithm is a comprehensive AI-powered system that matches cargo loads with available trucks based on multiple scoring factors. The algorithm uses weighted scoring to determine the best matches, ensuring optimal utilization, cost efficiency, and compliance with all requirements.

## Algorithm Architecture

### Core Components

1. **MatchingService** (`matching.service.ts`)
   - Main matching orchestration
   - Supports multiple algorithms: WEIGHTED_SCORE, HUNGARIAN, GENETIC, TOPSIS, HYBRID
   - Default algorithm: HYBRID (combines multiple approaches)

2. **Scoring Factors**
   - 11 different scoring factors evaluated for each truck-load pair
   - Dynamic weights based on load requirements
   - Comprehensive match reason generation

3. **Filtering & Validation**
   - Capacity checks (weight and volume)
   - Equipment requirements validation
   - Status and availability checks
   - Tenant isolation

## Scoring Factors

### 1. Capacity Score (Weight: 20%)

**Purpose**: Evaluates how well the truck's capacity matches the load requirements.

**Calculation**:
- Weight utilization = `load.weight / truck.capacityWeight`
- Volume utilization = `load.volume / truck.capacityVolume`
- Max utilization = `max(weightUtilization, volumeUtilization)`

**Scoring Curve**:
- **70-90% utilization**: Score = 1.0 (Optimal - best fuel efficiency and cost)
- **50-70% utilization**: Score = 0.8 (Good - acceptable utilization)
- **90-100% utilization**: Score = 0.6 (Acceptable - high utilization)
- **30-50% utilization**: Score = 0.6 (Acceptable - low utilization)
- **<30% utilization**: Score = 0.4 (Poor - underutilized)

**Example**:
- Truck capacity: 20,000 kg
- Load weight: 15,000 kg
- Utilization: 75% → **Score: 1.0** ✅

### 2. Distance Score (Weight: 15%)

**Purpose**: Evaluates proximity of truck to pickup location.

**Calculation**:
- Distance = Haversine distance between truck location and load pickup location
- Score based on distance thresholds

**Scoring Curve**:
- **≤25 km**: Score = 1.0 (Perfect - very close)
- **≤50 km**: Score = 0.9 (Excellent - close)
- **≤100 km**: Score = 0.7 (Good - acceptable)
- **≤150 km**: Score = 0.5 (Fair - moderate distance)
- **>150 km**: Score = 0.3 (Poor - far distance)

**Example**:
- Truck location: Manhattan, NY
- Pickup location: Brooklyn, NY
- Distance: 15 km → **Score: 1.0** ✅

### 3. Equipment Score (Weight: 25%)

**Purpose**: Validates that truck has all required equipment and capabilities.

**Critical Requirements** (Deal Breakers - Score = 0 if missing):
- `requiresRefrigeration` → `hasRefrigeration` must be true
- `isHazardous` → `hasHazmatPermit` must be true

**Soft Requirements** (Partial Penalties):
- `requiresForklift` → `hasLiftGate` (20% penalty if missing)
- `requiresCrane` → `hasWinch` (30% penalty if missing)
- `requiresLoadingDock` → `hasTailLift` (10% penalty if missing)

**Dimensional Compatibility**:
- Checks if load dimensions fit within truck dimensions
- Score multiplied by dimensional compatibility factor

**Example**:
- Load requires refrigeration → Truck has refrigeration ✅
- Load requires forklift → Truck has lift gate ✅
- All requirements met → **Score: 1.0** ✅

### 4. Rating Score (Weight: 10%)

**Purpose**: Evaluates truck/driver reliability based on historical performance.

**Calculation**:
- Score = `truck.averageRating / 5.0`
- Default: 0.5 if no rating available

**Example**:
- Truck rating: 4.8/5.0
- Score = 4.8 / 5.0 = **0.96** ✅

### 5. Price Score (Weight: 10%)

**Purpose**: Evaluates cost competitiveness compared to market average.

**Calculation**:
- Estimated cost = `estimateCost(distance, weight, truck)`
- Market average = `getMarketAverageCost(load)`
- Cost ratio = `estimatedCost / marketAverage`

**Scoring Curve**:
- **≤0.8x market**: Score = 1.0 (Very competitive)
- **≤0.9x market**: Score = 0.9 (Competitive)
- **≤1.0x market**: Score = 0.8 (At market rate)
- **≤1.1x market**: Score = 0.6 (Slightly above)
- **≤1.2x market**: Score = 0.4 (Above market)
- **>1.2x market**: Score = 0.2 (Expensive)

### 6. Temperature Score (Weight: 10%)

**Purpose**: Validates temperature control capabilities for refrigerated cargo.

**Calculation**:
- If no temperature requirements → Score = 1.0
- If requires refrigeration but truck doesn't have it → Score = 0
- If truck has refrigeration → Score = 0.8 (default for refrigerated trucks)

**Example**:
- Load requires 2-8°C temperature control
- Truck has refrigeration → **Score: 0.8** ✅

### 7. Security Score (Weight: 10%)

**Purpose**: Validates security and monitoring capabilities.

**Penalties**:
- `requiresGpsMonitoring` but no GPS → 50% penalty
- `requiresTemperatureMonitoring` but no refrigeration → 60% penalty
- High-value cargo (>$100k) → 10% penalty (insurance check)

**Example**:
- Load requires GPS monitoring
- Truck has GPS → **Score: 1.0** ✅

### 8. Route Score (Weight: 5%)

**Purpose**: Validates route compatibility and special route requirements.

**Checks**:
- Low clearance requirements
- Escort vehicle requirements
- Special route restrictions

### 9. Time Score (Weight: 5%)

**Purpose**: Evaluates time-critical delivery capabilities.

**Calculation**:
- If not time-critical → Score = 1.0
- If time-critical → Score = 0.9 (default, considers availability)

### 10. Availability Score (Weight: 5%)

**Purpose**: Evaluates truck availability status.

**Scoring**:
- `AVAILABLE` → Score = 1.0
- `IN_TRANSIT` / `MAINTENANCE` / `OUT_OF_SERVICE` → Score = 0 (hard reject; never enter the score pool or become a top/favorite match)

Smart Matching is for idle trucks only. A truck already on a trip must not be ranked against cargo that still needs a carrier.

### 11. Special Requirements Score (Weight: 10%)

**Purpose**: Validates special handling requirements.

**Hard Requirements** (Score = 0 if missing):
- Refrigeration requirement
- Hazmat requirement

**Soft Requirements** (Partial penalties):
- Fragile cargo → Side rails/tarps (30% penalty if missing)
- Required features from `truckRequirements.requiredFeatures`

## Dynamic Weights

The algorithm adjusts weights based on load characteristics:

**Base Weights**:
```typescript
{
  distance: 0.15,
  capacity: 0.20,
  equipment: 0.25,
  temperature: 0.10,
  security: 0.10,
  route: 0.05,
  time: 0.05,
  rating: 0.10,
  cost: 0.10,
  availability: 0.05,
  specialRequirements: 0.10
}
```

**Adjusted Weights** (based on load requirements):
- If refrigerated cargo → Increase temperature weight
- If time-critical → Increase time weight
- If high-value → Increase security weight
- If long distance → Increase distance weight

## Overall Score Calculation

```typescript
overallScore = 
  capacityScore * weights.capacity +
  distanceScore * weights.distance +
  equipmentScore * weights.equipment +
  ratingScore * weights.rating +
  priceScore * weights.cost +
  temperatureScore * weights.temperature +
  securityScore * weights.security +
  routeScore * weights.route +
  timeScore * weights.time +
  availabilityScore * weights.availability +
  specialRequirementsScore * weights.specialRequirements
```

**Score Range**: 0.0 to 1.0 (0% to 100%)

## Match Quality Tiers

Based on overall score:

- **95-100%**: Perfect Match - All requirements met, optimal utilization, excellent ratings
- **85-95%**: Excellent Match - Most requirements met, good utilization
- **70-85%**: Good Match - Requirements met with minor compromises
- **50-70%**: Acceptable Match - Basic requirements met, not optimal
- **<50%**: Poor Match - May have significant compromises

## Filtering & Validation

### Pre-Scoring Filters

1. **Capacity Check**:
   - Load weight ≤ Truck capacity weight
   - Load volume ≤ Truck capacity volume (if specified)
   - If fails → Truck rejected (no score calculated)

2. **Status Check**:
   - Truck status must be `AVAILABLE` (`IN_TRANSIT` is excluded from Smart Matching)
   - Load status must allow matching (`CREATED`, `PUBLISHED`, `PENDING_CONFIRMATION`)

3. **Tenant Isolation**:
   - Truck and load must belong to same tenant

4. **Equipment Hard Requirements**:
   - If load requires refrigeration → Truck must have refrigeration
   - If load is hazardous → Truck must have hazmat permit
   - If fails → Truck rejected

## Example Scenarios

### Scenario 1: Perfect Match (95%+)

**Truck**:
- Capacity: 20,000 kg
- Location: 15 km from pickup
- Has refrigeration: ✅
- Has lift gate: ✅
- Has GPS: ✅
- Rating: 4.8/5.0

**Load**:
- Weight: 15,000 kg (75% utilization)
- Requires refrigeration: ✅
- Requires forklift: ✅
- Requires GPS monitoring: ✅

**Scores**:
- Capacity: 1.0 (75% utilization - optimal)
- Distance: 1.0 (15 km - perfect)
- Equipment: 1.0 (all requirements met)
- Rating: 0.96 (4.8/5.0)
- Price: 0.9 (competitive)
- Temperature: 0.8 (refrigerated)
- Security: 1.0 (GPS available)
- **Overall: ~95%** ✅

### Scenario 2: Good Match (75-85%)

**Truck**:
- Capacity: 30,000 kg
- Location: 75 km from pickup
- Has refrigeration: ✅
- Rating: 4.0/5.0

**Load**:
- Weight: 16,500 kg (55% utilization)
- Requires refrigeration: ✅

**Scores**:
- Capacity: 0.8 (55% utilization - good)
- Distance: 0.7 (75 km - acceptable)
- Equipment: 1.0 (requirements met)
- Rating: 0.8 (4.0/5.0)
- Price: 0.8 (market rate)
- **Overall: ~78%** ✅

### Scenario 3: Poor Match (<50%)

**Truck**:
- Capacity: 10,000 kg
- Location: 200 km from pickup
- No refrigeration
- Rating: 3.5/5.0

**Load**:
- Weight: 9,500 kg (95% utilization)
- Requires refrigeration: ❌ (truck doesn't have it)

**Scores**:
- Capacity: 0.6 (95% utilization - high)
- Distance: 0.3 (200 km - far)
- Equipment: 0 (missing refrigeration - deal breaker)
- Rating: 0.7 (3.5/5.0)
- **Overall: ~35%** ❌ (Rejected due to missing equipment)

## Testing the Algorithm

### Using Seed Data

Run the comprehensive seed script:

```bash
npm run seed:matching-demo
```

This creates 6 different scenarios:
1. Perfect Match (95%+)
2. Excellent Match (85-95%)
3. Good Match (70-85%)
4. Hazmat Match (80-90%)
5. Fragile Cargo (75-85%)
6. Long Distance (65-75%)

### Manual Testing

1. Create a cargo load with specific requirements
2. Ensure trucks with varying capabilities exist
3. Call matching API: `POST /matching/find-matches`
4. Review detailed scoring breakdown
5. Compare scores across different trucks

### API Endpoint

```typescript
POST /matching/find-matches
Body: {
  loadId: "uuid",
  maxDistance?: number,
  minRating?: number,
  algorithm?: "HYBRID" | "WEIGHTED_SCORE" | "HUNGARIAN" | "GENETIC" | "TOPSIS",
  includeDetailedScoring?: boolean
}
```

## Algorithm Selection

### HYBRID (Default)
- Combines multiple algorithms
- Best overall performance
- Recommended for production

### WEIGHTED_SCORE
- Simple weighted scoring
- Fastest execution
- Good for basic matching

### HUNGARIAN
- Optimal assignment algorithm
- Best for multiple loads/trucks
- Slower for large datasets

### GENETIC
- Evolutionary algorithm
- Good for complex optimization
- Requires tuning

### TOPSIS
- Multi-criteria decision making
- Good for trade-off analysis
- Moderate performance

## Performance Considerations

- **Caching**: Truck availability and ratings are cached
- **Parallel Processing**: Multiple trucks scored in parallel
- **Early Rejection**: Trucks failing hard requirements are rejected immediately
- **Limit Results**: Default limit of 50 matches to prevent overload

## Future Enhancements

1. **Machine Learning**: Learn from successful matches
2. **Real-time Updates**: Live truck location tracking
3. **Predictive Analytics**: Predict match success probability
4. **Market Dynamics**: Adjust weights based on market conditions
5. **Multi-objective Optimization**: Balance cost, time, and quality

## Troubleshooting

### No Matches Found

1. Check truck capacity vs load weight
2. Verify equipment requirements are met
3. Check truck status (must be AVAILABLE — IN_TRANSIT trucks are excluded)
4. Verify tenant isolation
5. Check distance constraints

### Low Match Scores

1. Review capacity utilization (aim for 70-90%)
2. Check distance from pickup location
3. Verify all equipment requirements
4. Review truck ratings
5. Compare pricing to market average

### Unexpected Rejections

1. Check hard requirements (refrigeration, hazmat)
2. Verify capacity constraints
3. Check truck status
4. Review tenant matching

