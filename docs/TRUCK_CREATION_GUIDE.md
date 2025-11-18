# 🚛 Truck Creation Guide

## **API Endpoint**
```
POST http://localhost:3000/api/fleet/trucks
```

## **Authentication Required**
You need to be logged in with a valid JWT token. Add this header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## **Required Fields (Must be provided)**

### **Basic Information**
```json
{
  "plateNumber": "ABC123",           // String (max 20 chars)
  "vin": "1HGBH41JXMN109186",       // String (max 17 chars) - Vehicle Identification Number
  "make": "Freightliner",            // String (max 100 chars)
  "model": "Cascadia",               // String (max 100 chars)
  "year": 2022,                      // Number (1900-2030)
  "fuelType": "DIESEL",              // Enum: DIESEL, GASOLINE, ELECTRIC, HYBRID, CNG, LNG
  "capacityWeight": 80000,           // Number (in pounds)
  "capacityVolume": 3000,            // Number (in cubic feet)
  "registrationNumber": "REG123456", // String (max 50 chars)
  "registrationExpiry": "2025-12-31", // Date string (YYYY-MM-DD)
  "insurancePolicy": "INS789012",    // String (max 50 chars)
  "insuranceExpiry": "2025-12-31",  // Date string (YYYY-MM-DD)
  "hasRefrigeration": false,         // Boolean
  "hasLiftGate": false,              // Boolean
  "hasGps": true,                    // Boolean
  "hasHazmatPermit": false,          // Boolean
  "truckType": "FLATBED"             // Enum: see TruckType options below
}
```

## **Optional Fields**

### **Physical Specifications**
```json
{
  "color": "White",                  // String (max 50 chars)
  "maxLength": 53.0,                 // Number (in feet)
  "maxWidth": 8.5,                   // Number (in feet)
  "maxHeight": 13.5,                 // Number (in feet)
  "trailerType": "FLATBED",          // Enum: see TrailerType options below
  "roadworthyCertExpiry": "2025-06-30", // Date string
  "mileage": 150000,                 // Number (in miles)
  "lastMaintenanceDate": "2024-01-15", // Date string
  "nextMaintenanceDate": "2024-07-15"  // Date string
}
```

### **Equipment & Features**
```json
{
  "hasSideRails": true,              // Boolean
  "hasTarps": true,                  // Boolean
  "hasStraps": true,                 // Boolean
  "hasChains": false,                // Boolean
  "hasWinch": false,                 // Boolean
  "hasRam": false,                   // Boolean
  "hasTailLift": false,              // Boolean
  "hasSideLift": false,              // Boolean
  "hasRollerBed": false,             // Boolean
  "hasDropDeck": false,              // Boolean
  "hasExtendable": false,            // Boolean
  "hasLowbed": false,                // Boolean
  "hasStepDeck": false,              // Boolean
  "hasPowerOnly": false,             // Boolean
  "hasContainerChassis": false       // Boolean
}
```

### **Cargo Capabilities**
```json
{
  "hasTanker": false,                // Boolean
  "hasBulk": false,                  // Boolean
  "hasRefrigerated": false,          // Boolean
  "hasHeated": false,                // Boolean
  "hasVentilated": false,            // Boolean
  "hasCurtainSide": false,           // Boolean
  "hasBox": false,                   // Boolean
  "hasVan": false,                   // Boolean
  "hasPlatform": false,              // Boolean
  "hasCarCarrier": false,            // Boolean
  "hasHeavyHaul": false,             // Boolean
  "hasOversized": false              // Boolean
}
```

### **Specialized Cargo**
```json
{
  "hasHazmat": false,                // Boolean
  "hasDangerousGoods": false,        // Boolean
  "hasFoodGrade": false,             // Boolean
  "hasPharmaceutical": false,        // Boolean
  "hasLiquid": false,                // Boolean
  "hasDryBulk": false,               // Boolean
  "hasGas": false,                   // Boolean
  "hasChemical": false,              // Boolean
  "hasWaste": false                  // Boolean
}
```

### **Temperature Control**
```json
{
  "hasReefer": false,                // Boolean
  "hasFrozen": false,                // Boolean
  "hasChilled": false,               // Boolean
  "hasAmbient": true,                // Boolean
  "hasControlledAtmosphere": false,  // Boolean
  "hasHumidityControl": false,       // Boolean
  "hasTemperatureMonitoring": false  // Boolean
}
```

### **Technology & Tracking**
```json
{
  "hasGPS": true,                    // Boolean
  "hasTracking": true,               // Boolean
  "hasTelematics": true,             // Boolean
  "hasELD": true,                    // Boolean (Electronic Logging Device)
  "hasDashCam": false,               // Boolean
  "hasSafetyCameras": false          // Boolean
}
```

### **Safety Features**
```json
{
  "hasCollisionAvoidance": false,    // Boolean
  "hasLaneDeparture": false,         // Boolean
  "hasAdaptiveCruise": false,        // Boolean
  "hasBlindSpot": false,             // Boolean
  "hasBackupCamera": true            // Boolean
}
```

### **Monitoring Systems**
```json
{
  "hasTirePressureMonitoring": true, // Boolean
  "hasEngineMonitoring": true,       // Boolean
  "hasFuelMonitoring": true,         // Boolean
  "hasMaintenanceAlerts": true,      // Boolean
  "hasDriverMonitoring": false,      // Boolean
  "hasFatigueMonitoring": false,     // Boolean
  "hasSpeedMonitoring": true,        // Boolean
  "hasIdleMonitoring": true          // Boolean
}
```

### **Route & Tracking**
```json
{
  "hasRouteOptimization": true,      // Boolean
  "hasRealTimeTracking": true,       // Boolean
  "hasGeofencing": true              // Boolean
}
```

### **Cargo Monitoring**
```json
{
  "hasTemperatureAlerts": false,     // Boolean
  "hasHumidityAlerts": false,        // Boolean
  "hasShockMonitoring": false,       // Boolean
  "hasTiltMonitoring": false,        // Boolean
  "hasDoorMonitoring": true,         // Boolean
  "hasCargoMonitoring": false,       // Boolean
  "hasWeightMonitoring": false,      // Boolean
  "hasVolumeMonitoring": false       // Boolean
}
```

### **Specialized Monitoring**
```json
{
  "hasPressureMonitoring": false,    // Boolean
  "hasFlowMonitoring": false,        // Boolean
  "hasLevelMonitoring": false,       // Boolean
  "hasQualityMonitoring": false,     // Boolean
  "hasContaminationMonitoring": false // Boolean
}
```

### **Safety Systems**
```json
{
  "hasLeakDetection": false,         // Boolean
  "hasOverfillProtection": false,    // Boolean
  "hasEmergencyShutdown": false,     // Boolean
  "hasFireSuppression": false,       // Boolean
  "hasExplosionProof": false         // Boolean
}
```

### **Material Specifications**
```json
{
  "hasCorrosionResistant": false,    // Boolean
  "hasStainlessSteel": false,        // Boolean
  "hasAluminum": false,              // Boolean
  "hasCarbonSteel": true,            // Boolean
  "hasFiberglass": false,            // Boolean
  "hasPlastic": false,               // Boolean
  "hasComposite": false,             // Boolean
  "hasInsulated": false              // Boolean
}
```

## **Enum Values**

### **TruckType Options**
- `FLATBED` - Flatbed truck
- `BOX_TRUCK` - Box truck
- `TANKER` - Tanker truck
- `REFRIGERATED` - Refrigerated truck
- `CONTAINER` - Container truck
- `CAR_CARRIER` - Car carrier
- `HEAVY_HAUL` - Heavy haul truck
- `LOWBED` - Lowbed trailer
- `STEP_DECK` - Step deck trailer
- `POWER_ONLY` - Power only (tractor)
- `CURTAIN_SIDE` - Curtain side truck
- `VAN` - Van truck
- `PLATFORM` - Platform truck
- `BULK` - Bulk carrier
- `DUMP` - Dump truck
- `CEMENT_MIXER` - Cement mixer
- `CRANE` - Crane truck
- `FIRE_TRUCK` - Fire truck
- `AMBULANCE` - Ambulance
- `TOW_TRUCK` - Tow truck
- `GARBAGE` - Garbage truck
- `MILITARY` - Military truck
- `SPECIALIZED` - Specialized truck

### **TrailerType Options**
- `FLATBED` - Flatbed trailer
- `DRY_VAN` - Dry van trailer
- `REFRIGERATED` - Refrigerated trailer
- `TANKER` - Tanker trailer
- `BULK` - Bulk trailer
- `CONTAINER` - Container trailer
- `CAR_CARRIER` - Car carrier trailer
- `HEAVY_HAUL` - Heavy haul trailer
- `LOWBED` - Lowbed trailer
- `STEP_DECK` - Step deck trailer
- `POWER_ONLY` - Power only
- `CURTAIN_SIDE` - Curtain side trailer
- `PLATFORM` - Platform trailer
- `DUMP` - Dump trailer
- `CEMENT_MIXER` - Cement mixer trailer
- `CRANE` - Crane trailer
- `SPECIALIZED` - Specialized trailer

### **FuelType Options**
- `DIESEL` - Diesel fuel
- `GASOLINE` - Gasoline
- `ELECTRIC` - Electric
- `HYBRID` - Hybrid
- `CNG` - Compressed Natural Gas
- `LNG` - Liquefied Natural Gas

## **Complete Example**

Here's a complete example of creating a flatbed truck:

```json
{
  "plateNumber": "ABC123",
  "vin": "1HGBH41JXMN109186",
  "make": "Freightliner",
  "model": "Cascadia",
  "year": 2022,
  "color": "White",
  "fuelType": "DIESEL",
  "capacityWeight": 80000,
  "capacityVolume": 3000,
  "maxLength": 53.0,
  "maxWidth": 8.5,
  "maxHeight": 13.5,
  "registrationNumber": "REG123456",
  "registrationExpiry": "2025-12-31",
  "insurancePolicy": "INS789012",
  "insuranceExpiry": "2025-12-31",
  "roadworthyCertExpiry": "2025-06-30",
  "hasRefrigeration": false,
  "hasLiftGate": false,
  "hasGps": true,
  "hasHazmatPermit": false,
  "mileage": 150000,
  "lastMaintenanceDate": "2024-01-15",
  "nextMaintenanceDate": "2024-07-15",
  "truckType": "FLATBED",
  "trailerType": "FLATBED",
  "hasSideRails": true,
  "hasTarps": true,
  "hasStraps": true,
  "hasChains": false,
  "hasWinch": false,
  "hasRam": false,
  "hasTailLift": false,
  "hasSideLift": false,
  "hasRollerBed": false,
  "hasDropDeck": false,
  "hasExtendable": false,
  "hasLowbed": false,
  "hasStepDeck": false,
  "hasPowerOnly": false,
  "hasContainerChassis": false,
  "hasTanker": false,
  "hasBulk": false,
  "hasRefrigerated": false,
  "hasHeated": false,
  "hasVentilated": false,
  "hasCurtainSide": false,
  "hasBox": false,
  "hasVan": false,
  "hasPlatform": false,
  "hasCarCarrier": false,
  "hasHeavyHaul": false,
  "hasOversized": false,
  "hasHazmat": false,
  "hasDangerousGoods": false,
  "hasFoodGrade": false,
  "hasPharmaceutical": false,
  "hasLiquid": false,
  "hasDryBulk": false,
  "hasGas": false,
  "hasChemical": false,
  "hasWaste": false,
  "hasReefer": false,
  "hasFrozen": false,
  "hasChilled": false,
  "hasAmbient": true,
  "hasControlledAtmosphere": false,
  "hasHumidityControl": false,
  "hasTemperatureMonitoring": false,
  "hasGPS": true,
  "hasTracking": true,
  "hasTelematics": true,
  "hasELD": true,
  "hasDashCam": false,
  "hasSafetyCameras": false,
  "hasCollisionAvoidance": false,
  "hasLaneDeparture": false,
  "hasAdaptiveCruise": false,
  "hasBlindSpot": false,
  "hasBackupCamera": true,
  "hasTirePressureMonitoring": true,
  "hasEngineMonitoring": true,
  "hasFuelMonitoring": true,
  "hasMaintenanceAlerts": true,
  "hasDriverMonitoring": false,
  "hasFatigueMonitoring": false,
  "hasSpeedMonitoring": true,
  "hasIdleMonitoring": true,
  "hasRouteOptimization": true,
  "hasRealTimeTracking": true,
  "hasGeofencing": true,
  "hasTemperatureAlerts": false,
  "hasHumidityAlerts": false,
  "hasShockMonitoring": false,
  "hasTiltMonitoring": false,
  "hasDoorMonitoring": true,
  "hasCargoMonitoring": false,
  "hasWeightMonitoring": false,
  "hasVolumeMonitoring": false,
  "hasPressureMonitoring": false,
  "hasFlowMonitoring": false,
  "hasLevelMonitoring": false,
  "hasQualityMonitoring": false,
  "hasContaminationMonitoring": false,
  "hasLeakDetection": false,
  "hasOverfillProtection": false,
  "hasEmergencyShutdown": false,
  "hasFireSuppression": false,
  "hasExplosionProof": false,
  "hasCorrosionResistant": false,
  "hasStainlessSteel": false,
  "hasAluminum": false,
  "hasCarbonSteel": true,
  "hasFiberglass": false,
  "hasPlastic": false,
  "hasComposite": false,
  "hasInsulated": false
}
```

## **Testing with cURL**

```bash
curl -X POST http://localhost:3000/api/fleet/trucks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plateNumber": "ABC123",
    "vin": "1HGBH41JXMN109186",
    "make": "Freightliner",
    "model": "Cascadia",
    "year": 2022,
    "fuelType": "DIESEL",
    "capacityWeight": 80000,
    "capacityVolume": 3000,
    "registrationNumber": "REG123456",
    "registrationExpiry": "2025-12-31",
    "insurancePolicy": "INS789012",
    "insuranceExpiry": "2025-12-31",
    "hasRefrigeration": false,
    "hasLiftGate": false,
    "hasGps": true,
    "hasHazmatPermit": false,
    "truckType": "FLATBED"
  }'
```

## **Response Format**

```json
{
  "success": true,
  "message": "Truck created successfully",
  "data": {
    "truck": {
      "id": "uuid-here",
      "plateNumber": "ABC123",
      "make": "Freightliner",
      "model": "Cascadia",
      "status": "AVAILABLE",
      "capacityWeight": 80000
    }
  }
}
```

## **Common Errors**

1. **401 Unauthorized** - You're not logged in or token is invalid
2. **400 Bad Request** - Missing required fields or invalid data
3. **409 Conflict** - VIN already exists (must be unique)
4. **403 Forbidden** - Insufficient permissions

## **Next Steps**

After creating a truck, you can:
1. Assign drivers to it
2. Create trips for it
3. Track its location
4. Monitor its performance
5. Schedule maintenance 