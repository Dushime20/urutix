# Cargo/Load System Analysis: Database to Backend to Frontend Mapping

## Overview
This document provides a comprehensive analysis of the cargo/load system, mapping database fields to backend entities, DTOs, and frontend components.

## Database Schema Analysis

### Core Fields (Database → Backend Entity → Frontend)

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `id` | UUID | `@PrimaryGeneratedColumn('uuid')` | `string` | Unique identifier |
| `tenantId` | UUID | `@Column('uuid') @Index()` | `string` | Multi-tenant isolation |
| `cargoOwnerId` | UUID | `@Column('uuid') @Index()` | `string` | Owner reference |
| `title` | VARCHAR | `@Column()` | `string` | Cargo title |
| `description` | TEXT | `@Column('text', { nullable: true })` | `string?` | Detailed description |
| `weight` | DECIMAL(10,2) | `@Column('decimal', { precision: 10, scale: 2 })` | `number` | Weight in kg |
| `volume` | DECIMAL(10,2) | `@Column('decimal', { precision: 10, scale: 2, nullable: true })` | `number?` | Volume in m³ |

### Cargo Classification Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `cargoType` | ENUM | `@Column({ type: 'enum', enum: CargoType })` | `string` | Type classification |
| `status` | ENUM | `@Column({ type: 'enum', enum: LoadStatus })` | `string` | Current status |
| `urgencyLevel` | ENUM | `@Column({ type: 'enum', enum: UrgencyLevel })` | `string` | Urgency classification |

### Location Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `pickupLocationId` | UUID | `@Column('uuid')` | `string` | Pickup location reference |
| `deliveryLocationId` | UUID | `@Column('uuid')` | `string` | Delivery location reference |
| `pickupDate` | TIMESTAMP | `@Column('timestamp with time zone')` | `string` | Pickup date/time |
| `deliveryDate` | TIMESTAMP | `@Column('timestamp with time zone')` | `string` | Delivery date/time |

### Financial Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `loadValue` | DECIMAL(15,2) | `@Column('decimal', { precision: 15, scale: 2 })` | `number` | Cargo value |
| `offeredPrice` | DECIMAL(15,2) | `@Column('decimal', { precision: 15, scale: 2, nullable: true })` | `number?` | Offered price |
| `currencyCode` | VARCHAR(3) | `@Column({ length: 3, default: 'USD' })` | `string` | Currency code |
| `insuranceValue` | DECIMAL(15,2) | `@Column('decimal', { precision: 15, scale: 2, nullable: true })` | `number?` | Insurance value |

### Safety & Compliance Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `isFragile` | BOOLEAN | `@Column({ default: false })` | `boolean` | Fragile cargo flag |
| `isHazardous` | BOOLEAN | `@Column({ default: false })` | `boolean` | Hazardous cargo flag |
| `requiresRefrigeration` | BOOLEAN | `@Column({ default: false })` | `boolean` | Refrigeration required |
| `hazmatClass` | VARCHAR(50) | `@Column({ length: 50, nullable: true })` | `string?` | UN hazmat class |
| `hazmatNumber` | VARCHAR(20) | `@Column({ length: 20, nullable: true })` | `string?` | UN hazmat number |

### Dimensional Specifications

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `length` | DECIMAL(8,2) | `@Column('decimal', { precision: 8, scale: 2, nullable: true })` | `number?` | Length in meters |
| `width` | DECIMAL(8,2) | `@Column('decimal', { precision: 8, scale: 2, nullable: true })` | `number?` | Width in meters |
| `height` | DECIMAL(8,2) | `@Column('decimal', { precision: 8, scale: 2, nullable: true })` | `number?` | Height in meters |
| `stackableHeight` | DECIMAL(8,2) | `@Column('decimal', { precision: 8, scale: 2, nullable: true })` | `number?` | Max stackable height |
| `isStackable` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Stackable flag |

### Environmental Requirements

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `temperatureMin` | DECIMAL(5,2) | `@Column('decimal', { precision: 5, scale: 2, nullable: true })` | `number?` | Min temperature (°C) |
| `temperatureMax` | DECIMAL(5,2) | `@Column('decimal', { precision: 5, scale: 2, nullable: true })` | `number?` | Max temperature (°C) |
| `requiresHumidityControl` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Humidity control required |

### Loading & Unloading Requirements

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `requiresForklift` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Forklift required |
| `requiresCrane` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Crane required |
| `requiresLoadingDock` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Loading dock required |
| `loadingTimeEstimate` | DECIMAL(5,2) | `@Column('decimal', { precision: 5, scale: 2, nullable: true })` | `number?` | Loading time (hours) |
| `unloadingTimeEstimate` | DECIMAL(5,2) | `@Column('decimal', { precision: 5, scale: 2, nullable: true })` | `number?` | Unloading time (hours) |

### Time & Urgency Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `isTimeCritical` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Time critical flag |
| `maxTransitTime` | DECIMAL(5,2) | `@Column('decimal', { precision: 5, scale: 2, nullable: true })` | `number?` | Max transit time (hours) |

### Packaging & Handling

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `packagingType` | VARCHAR(50) | `@Column({ length: 50, nullable: true })` | `string?` | Packaging type |
| `numberOfPieces` | INTEGER | `@Column({ default: 0 })` | `number?` | Number of pieces |
| `numberOfPallets` | INTEGER | `@Column({ default: 0 })` | `number?` | Number of pallets |

### Security & Monitoring

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `requiresGpsMonitoring` | BOOLEAN | `@Column({ default: false })` | `boolean?` | GPS monitoring required |
| `requiresTemperatureMonitoring` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Temperature monitoring required |

### Route & Access Requirements

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `requiresLowClearanceRoute` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Low clearance route required |
| `maxClearanceHeight` | DECIMAL(5,2) | `@Column('decimal', { precision: 5, scale: 2, nullable: true })` | `number?` | Max clearance height (m) |
| `requiresEscortVehicle` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Escort vehicle required |

### Instructions & Documentation

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `specialHandlingInstructions` | TEXT | `@Column('text', { nullable: true })` | `string?` | Special handling instructions |
| `loadingInstructions` | TEXT | `@Column('text', { nullable: true })` | `string?` | Loading instructions |
| `unloadingInstructions` | TEXT | `@Column('text', { nullable: true })` | `string?` | Unloading instructions |
| `emergencyContactInfo` | TEXT | `@Column('text', { nullable: true })` | `string?` | Emergency contact information |

### JSON Fields (Complex Objects)

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `contactInfo` | JSONB | `@Column('jsonb', { default: {} })` | `Record<string, any>` | Contact information |
| `matchingCriteria` | JSONB | `@Column('jsonb', { default: {} })` | `Record<string, any>` | Matching criteria |
| `truckRequirements` | JSONB | `@Column('jsonb', { default: {} })` | `object` | Truck requirements |
| `carrierPreferences` | JSONB | `@Column('jsonb', { default: {} })` | `object` | Carrier preferences |
| `costPreferences` | JSONB | `@Column('jsonb', { default: {} })` | `object` | Cost preferences |

### Quality & Inspection Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `requiresPreShipmentInspection` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Pre-shipment inspection required |
| `requiresDeliveryInspection` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Delivery inspection required |
| `requiresPhotographicDocumentation` | BOOLEAN | `@Column({ default: false })` | `boolean?` | Photographic documentation required |

### System Fields

| Database Field | Type | Backend Entity | Frontend Type | Description |
|----------------|------|----------------|---------------|-------------|
| `autoMatchEnabled` | BOOLEAN | `@Column({ default: true })` | `boolean` | Auto-matching enabled |
| `publishedAt` | TIMESTAMP | `@Column({ nullable: true })` | `string?` | Publication timestamp |
| `assignedTruckId` | UUID | `@Column('uuid', { nullable: true })` | `string?` | Assigned truck reference |
| `rating` | DECIMAL(3,2) | `@Column('decimal', { precision: 3, scale: 2, default: 0 })` | `number` | Rating (0-5) |
| `viewCount` | INTEGER | `@Column('int', { default: 0 })` | `number` | View count |
| `createdAt` | TIMESTAMP | `@CreateDateColumn()` | `string` | Creation timestamp |
| `updatedAt` | TIMESTAMP | `@UpdateDateColumn()` | `string` | Last update timestamp |
| `deleted_at` | TIMESTAMP | `@DeleteDateColumn({ name: 'deleted_at' })` | `string?` | Soft delete timestamp |

## Backend Implementation Analysis

### Entity Relationships
```typescript
// Load Entity Relationships
@ManyToOne('User', 'loads')
@JoinColumn({ name: 'cargoOwnerId' })
cargoOwner: User;

@ManyToOne('Location')
@JoinColumn({ name: 'pickupLocationId' })
pickupLocation: Location;

@ManyToOne('Location')
@JoinColumn({ name: 'deliveryLocationId' })
deliveryLocation: Location;

@OneToMany('Trip', 'load')
trips: Trip[];
```

### DTO Structure
The backend uses comprehensive DTOs with validation:

1. **CreateLoadDto** - For creating new loads
2. **UpdateLoadDto** - For updating existing loads
3. **LoadResponseDto** - For API responses
4. **LoadsQueryDto** - For querying loads with filters

### Service Layer Features
- **Validation**: Location existence, date ranges, weight limits
- **Multi-tenancy**: Tenant isolation for all operations
- **Pagination**: Support for large datasets
- **Filtering**: Multiple filter options
- **Statistics**: Load analytics and reporting

## Frontend Implementation Analysis

### Type Definitions
The frontend has comprehensive TypeScript interfaces:

1. **Cargo Interface** - Main cargo type
2. **CargoFormData** - Form data structure
3. **CargoFilters** - Filter options
4. **CargoData** - Paginated response structure

### Form Components
- **CargoForm** - Main form component with all fields
- **CargoStepper** - Multi-step form wizard
- **EnhancedCargoForm** - Advanced form with all features

### Data Flow
1. **Form Input** → **CargoFormData** → **API Request** → **Backend DTO** → **Database Entity**
2. **Database Entity** → **Backend Response** → **Frontend Cargo Interface** → **UI Display**

## Key Observations & Recommendations

### ✅ Strengths
1. **Comprehensive Field Coverage**: All database fields are properly mapped
2. **Type Safety**: Strong TypeScript typing throughout
3. **Validation**: Comprehensive validation at DTO level
4. **Multi-tenancy**: Proper tenant isolation
5. **Extensibility**: JSON fields allow for flexible data storage

### ⚠️ Areas for Improvement
1. **Field Consistency**: Some fields have different naming conventions
2. **Validation Alignment**: Frontend and backend validation could be more aligned
3. **Error Handling**: Could benefit from more specific error messages
4. **Performance**: Large JSON fields might impact query performance

### 🔧 Recommendations
1. **Standardize Naming**: Use consistent naming across all layers
2. **Add Field Validation**: Implement client-side validation matching backend
3. **Optimize Queries**: Add database indexes for frequently queried fields
4. **Enhance Documentation**: Add JSDoc comments for complex fields
5. **Add Field Groups**: Group related fields for better UX

## Database Indexes
Current indexes:
- `['tenantId', 'status']` - Multi-tenant status queries
- `['cargoOwnerId']` - Owner-specific queries
- `['pickupDate']` - Date-based queries

Recommended additional indexes:
- `['cargoType', 'isHazardous']` - Cargo type filtering
- `['pickupDate', 'deliveryDate']` - Date range queries
- `['weight', 'volume']` - Capacity-based queries
- `['urgencyLevel', 'isTimeCritical']` - Priority queries

## API Endpoints
- `POST /api/loads` - Create load
- `GET /api/loads` - List loads with filters
- `GET /api/loads/:id` - Get specific load
- `PUT /api/loads/:id` - Update load
- `DELETE /api/loads/:id` - Delete load
- `POST /api/loads/:id/publish` - Publish load

This comprehensive mapping ensures data consistency across all layers of the application. 