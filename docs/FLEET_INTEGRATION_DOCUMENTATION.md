# Fleet Integration Documentation

## Overview

The fleet integration provides comprehensive truck and driver management capabilities for the cargo matching platform. This document outlines the implementation details, API endpoints, and usage instructions.

## Backend Implementation

### Database Schema

#### Truck Entity (`backend/src/entities/truck.entity.ts`)

```typescript
@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  ownerId: string;

  @Column({ length: 20 })
  plateNumber: string;

  @Column({ length: 17, unique: true })
  vin: string;

  @Column({ length: 100 })
  make: string;

  @Column({ length: 100 })
  model: string;

  @Column()
  year: number;

  @Column({ length: 50, nullable: true })
  color?: string;

  @Column({
    type: 'enum',
    enum: FuelType,
    default: FuelType.DIESEL,
  })
  fuelType: FuelType;

  @Column('decimal', { precision: 10, scale: 2 })
  capacityWeight: number;

  @Column('decimal', { precision: 10, scale: 2 })
  capacityVolume: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.AVAILABLE,
  })
  status: VehicleStatus;

  // ... additional fields for compliance, equipment, etc.
}
```

### API Endpoints

#### Truck Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fleet/trucks` | Create a new truck |
| GET | `/api/fleet/trucks` | Get all trucks with filtering |
| GET | `/api/fleet/trucks/:id` | Get truck by ID |
| PATCH | `/api/fleet/trucks/:id` | Update truck |
| DELETE | `/api/fleet/trucks/:id` | Delete truck |

#### Driver Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fleet/drivers` | Create a new driver |
| GET | `/api/fleet/drivers` | Get all drivers with filtering |
| GET | `/api/fleet/drivers/:id` | Get driver by ID |
| PATCH | `/api/fleet/drivers/:id` | Update driver |
| DELETE | `/api/fleet/drivers/:id` | Delete driver |

#### Assignment Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fleet/trucks/:id/assign-driver` | Assign driver to truck |
| DELETE | `/api/fleet/trucks/:id/assign-driver/:driverId` | Unassign driver from truck |
| POST | `/api/fleet/trucks/:id/assign-route` | Assign route to truck |
| DELETE | `/api/fleet/trucks/:id/assign-route/:routeId` | Unassign route from truck |

### Validation Rules

#### Truck Creation Validation

- **Plate Number**: Required, max 20 characters, unique within tenant
- **VIN**: Required, exactly 17 characters, globally unique
- **Make**: Required, max 100 characters
- **Model**: Required, max 100 characters
- **Year**: Required, between 1900-2030
- **Fuel Type**: Required, must be valid enum value
- **Capacity Weight**: Required, minimum 1
- **Capacity Volume**: Required, minimum 1
- **Registration Number**: Required, max 50 characters
- **Registration Expiry**: Required, valid date
- **Insurance Policy**: Required, max 50 characters
- **Insurance Expiry**: Required, valid date

### Business Logic

#### Truck Creation Process

1. **Validation**: Check for duplicate plate numbers within tenant
2. **VIN Validation**: Check for duplicate VIN globally
3. **Data Preparation**: Set default values for new trucks
4. **Persistence**: Save to database with proper relationships
5. **Response**: Return created truck with success message

#### Status Management

- **AVAILABLE**: Truck is ready for assignment
- **IN_TRANSIT**: Truck is currently on a trip
- **MAINTENANCE**: Truck is under maintenance
- **OUT_OF_SERVICE**: Truck is temporarily unavailable

## Frontend Implementation

### Components Structure

```
frontend/src/components/FleetDashboard/
├── FleetDashboard.tsx      # Main dashboard component
├── FleetForm.tsx          # Truck/Driver creation/editing form
├── FleetTable.tsx         # Data table for fleet items
├── FleetFilters.tsx       # Search and filtering
├── FleetModal.tsx         # Detail view modal
├── TrucksList.tsx         # Truck-specific list view
├── SafetyManagement.tsx   # Safety and compliance
├── FinancialManagement.tsx # Financial tracking
└── TruckRecords.tsx       # Maintenance and records
```

### Form Fields

#### Truck Creation Form

**Basic Information:**
- License Plate (required)
- VIN (required)
- Make (required)
- Model (required)
- Year (required)
- Color (optional)
- Fuel Type (required)

**Capacity & Dimensions:**
- Capacity Weight (required)
- Capacity Volume (required)

**Registration & Insurance:**
- Registration Number (required)
- Registration Expiry (required)
- Insurance Policy (required)
- Insurance Expiry (required)
- Roadworthy Cert Expiry (optional)

**Equipment & Features:**
- Has Refrigeration (checkbox)
- Has Lift Gate (checkbox)
- Has GPS Tracking (checkbox)
- Has Hazmat Permit (checkbox)
- Equipment List (textarea)

### API Integration

#### Fleet API Service (`frontend/src/services/fleetApi.ts`)

```typescript
export const fleetApi = {
  // Truck operations
  async fetchFleet(): Promise<FleetItem[]>
  async createTruck(truckData: Partial<FleetItem>): Promise<FleetItem>
  async updateTruck(id: string, truckData: Partial<FleetItem>): Promise<FleetItem>
  async deleteTruck(id: string): Promise<void>
  
  // Driver operations
  async fetchDrivers(): Promise<Driver[]>
  async createDriver(driverData: Partial<Driver>): Promise<Driver>
  async updateDriver(id: string, driverData: Partial<Driver>): Promise<Driver>
  async deleteDriver(id: string): Promise<void>
  
  // Assignment operations
  async assignDriverToTruck(truckId: string, driverId: string, notes?: string): Promise<void>
  async unassignDriverFromTruck(truckId: string, driverId: string): Promise<void>
  
  // Analytics
  async fetchAnalytics(): Promise<FleetAnalytics>
};
```

## Testing

### Backend Testing

Run the truck creation test:

```bash
cd backend
node test-truck-creation.js
```

This test verifies:
- ✅ Successful truck creation
- ✅ Duplicate plate number rejection
- ✅ Duplicate VIN rejection
- ✅ Data validation
- ✅ API response format

### Frontend Testing

The frontend includes comprehensive form validation and error handling:

- **Real-time validation**: Form fields validate as user types
- **Required field highlighting**: Missing required fields are highlighted
- **Error messages**: Clear error messages for validation failures
- **Success feedback**: Confirmation messages for successful operations

## Usage Examples

### Creating a Truck via API

```bash
curl -X POST http://localhost:3000/api/fleet/trucks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "ABC-123",
    "vin": "1HGBH41JXMN109186",
    "make": "Volvo",
    "model": "VNL 760",
    "year": 2023,
    "color": "White",
    "fuelType": "DIESEL",
    "capacityWeight": 26000,
    "capacityVolume": 53,
    "registrationNumber": "REG-123456",
    "registrationExpiry": "2025-12-31",
    "insurancePolicy": "INS-789012",
    "insuranceExpiry": "2025-12-31",
    "hasRefrigeration": false,
    "hasLiftGate": true,
    "hasGps": true,
    "hasHazmatPermit": false,
    "equipmentList": ["pallet jack", "straps", "tarps"],
    "mileage": 50000
  }'
```

### Creating a Truck via Frontend

1. Navigate to Fleet Dashboard
2. Click "Add Truck" button
3. Fill in required fields:
   - License Plate: ABC-123
   - VIN: 1HGBH41JXMN109186
   - Make: Volvo
   - Model: VNL 760
   - Year: 2023
   - Fuel Type: Diesel
   - Capacity Weight: 26000
   - Capacity Volume: 53
   - Registration Number: REG-123456
   - Registration Expiry: 2025-12-31
   - Insurance Policy: INS-789012
   - Insurance Expiry: 2025-12-31
4. Optionally configure equipment and features
5. Click "Create" to save

## Security Features

### Authentication & Authorization

- **JWT Authentication**: All fleet endpoints require valid JWT token
- **Tenant Isolation**: Users can only access their own fleet data
- **Owner Validation**: Users can only modify their own trucks/drivers

### Data Validation

- **Input Sanitization**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Using TypeORM parameterized queries
- **XSS Protection**: Frontend input validation and sanitization

## Performance Considerations

### Database Optimization

- **Indexes**: Proper indexing on frequently queried fields
- **Soft Deletes**: Using `deletedAt` for data retention
- **Pagination**: Large result sets are paginated

### Frontend Optimization

- **Lazy Loading**: Components load on demand
- **Caching**: React Query for API response caching
- **Debounced Search**: Search inputs are debounced for performance

## Future Enhancements

### Planned Features

1. **Real-time Tracking**: GPS integration for live truck locations
2. **Maintenance Scheduling**: Automated maintenance reminders
3. **Fuel Management**: Fuel consumption tracking and optimization
4. **Driver Performance**: Driver analytics and performance metrics
5. **Route Optimization**: AI-powered route planning
6. **Compliance Monitoring**: Automated compliance checking

### Technical Improvements

1. **WebSocket Integration**: Real-time fleet updates
2. **File Upload**: Document management for trucks
3. **Bulk Operations**: Mass import/export capabilities
4. **Advanced Filtering**: Complex search and filter options
5. **Mobile App**: Native mobile application for drivers

## Troubleshooting

### Common Issues

1. **Duplicate Plate Number Error**
   - Ensure plate number is unique within your tenant
   - Check for soft-deleted trucks with same plate

2. **Duplicate VIN Error**
   - VIN must be globally unique across all tenants
   - Verify VIN format (17 characters)

3. **Validation Errors**
   - Check all required fields are filled
   - Ensure date formats are correct (YYYY-MM-DD)
   - Verify numeric fields are positive numbers

4. **Authentication Errors**
   - Ensure valid JWT token
   - Check token expiration
   - Verify user has proper permissions

### Debug Mode

Enable debug logging in backend:

```typescript
// In fleet.service.ts
console.log('Creating truck:', createTruckDto);
console.log('User ID:', userId);
console.log('Tenant ID:', tenantId);
```

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team. 