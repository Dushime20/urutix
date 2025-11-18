# Driver API Documentation

This document provides comprehensive documentation for all driver-related API endpoints in the Cargo AI Matching platform.

## Overview

The driver management system consists of two main controllers:
- **`DriverController`** (`/drivers`) - Dedicated driver operations and analytics
- **`FleetController`** (`/fleet/drivers`) - Fleet management driver operations

## Authentication & Authorization

All driver endpoints require:
- **JWT Bearer Token** in the `Authorization` header
- **User Role**: `TRUCK_OWNER`, `ADMIN`, `SUPER_ADMIN`, or `DRIVER` (for self-access)

## Driver Controller Endpoints (`/drivers`)

### 1. Create Driver
- **POST** `/drivers`
- **Description**: Creates a new driver with comprehensive information
- **Body**: `CreateDriverDto`
- **Response**: Driver object with success message
- **Swagger**: ✅ Fully documented with request/response schemas

### 2. Get All Drivers
- **GET** `/drivers`
- **Description**: Retrieves paginated list of drivers with filtering
- **Query Parameters**: 
  - `status` (enum: ACTIVE, INACTIVE, SUSPENDED, ON_LEAVE, TERMINATED, IN_TRANSIT)
  - `employmentType` (enum: FULL_TIME, PART_TIME, CONTRACT, OWNER_OPERATOR, FREELANCE)
  - `availabilityStatus` (string)
  - `minRating` (number, 0-5)
  - `minSafetyScore` (number, 0-100)
  - `search` (string)
  - `page` (number, min: 1)
  - `limit` (number, min: 1, max: 100)
- **Response**: Paginated drivers list with total count
- **Swagger**: ✅ Fully documented with query parameters and response schema

### 3. Get Driver by ID
- **GET** `/drivers/:id`
- **Description**: Retrieves detailed driver information
- **Path Parameter**: `id` (UUID)
- **Response**: Complete driver object
- **Swagger**: ✅ Fully documented with path parameter and response schema

### 4. Update Driver
- **PUT** `/drivers/:id`
- **Description**: Updates driver information (partial updates supported)
- **Path Parameter**: `id` (UUID)
- **Body**: `UpdateDriverDto`
- **Response**: Updated driver object
- **Swagger**: ✅ Fully documented with request/response schemas

### 5. Delete Driver
- **DELETE** `/drivers/:id`
- **Description**: Soft deletes a driver (cannot delete if on trip)
- **Path Parameter**: `id` (UUID)
- **Response**: Success message
- **Swagger**: ✅ Fully documented with path parameter and response schema

### 6. Process Telematics Event
- **POST** `/drivers/:id/telematics`
- **Description**: Processes real-time telematics data and updates safety score
- **Path Parameter**: `id` (UUID)
- **Body**: `TelematicsEventDto`
- **Response**: Safety score and alerts
- **Swagger**: ✅ Fully documented with request/response schemas

### 7. Check Driver Fatigue
- **GET** `/drivers/:id/fatigue`
- **Description**: Analyzes driver fatigue based on consecutive driving hours
- **Path Parameter**: `id` (UUID)
- **Response**: Fatigue status, risk level, and recommendations
- **Swagger**: ✅ Fully documented with response schema

### 8. Get Compliance Status
- **GET** `/drivers/:id/compliance`
- **Description**: Checks driver compliance with license, medical, drug test, and training requirements
- **Path Parameter**: `id` (UUID)
- **Response**: Compliance status for all requirements
- **Swagger**: ✅ Fully documented with response schema

### 9. Report Emergency
- **POST** `/drivers/:id/emergency`
- **Description**: Reports emergency situation and triggers response protocols
- **Path Parameter**: `id` (UUID)
- **Body**: `EmergencyReportDto`
- **Response**: Emergency status and response actions
- **Swagger**: ✅ Fully documented with request/response schemas

### 10. Predict Accident Risk
- **GET** `/drivers/:id/risk`
- **Description**: Analyzes driver data to predict accident risk
- **Path Parameter**: `id` (UUID)
- **Response**: Risk score, level, factors, and recommendations
- **Swagger**: ✅ Fully documented with response schema

### 11. Get Driver Statistics
- **GET** `/drivers/:id/stats`
- **Description**: Retrieves comprehensive driver performance metrics
- **Path Parameter**: `id` (UUID)
- **Response**: Trips, earnings, ratings, and performance data
- **Swagger**: ✅ Fully documented with response schema

### 12. Update Driver Location
- **PUT** `/drivers/:id/location`
- **Description**: Updates driver's current GPS location for real-time tracking
- **Path Parameter**: `id` (UUID)
- **Body**: `{ latitude: number, longitude: number }`
- **Response**: Success message
- **Swagger**: ✅ Fully documented with request/response schemas

### 13. Assign Truck to Driver
- **PUT** `/drivers/:id/assign-truck`
- **Description**: Assigns a specific truck to a driver
- **Path Parameter**: `id` (UUID)
- **Body**: `{ truckId: string }`
- **Response**: Success message
- **Swagger**: ✅ Fully documented with request/response schemas

### 14. Unassign Truck from Driver
- **PUT** `/drivers/:id/unassign-truck`
- **Description**: Removes truck assignment from a driver
- **Path Parameter**: `id` (UUID)
- **Response**: Success message
- **Swagger**: ✅ Fully documented with response schema

### 15. Extract Driver Document Text (OCR)
- **POST** `/drivers/:id/document-ocr`
- **Description**: Extracts text from driver documents using OCR
- **Path Parameter**: `id` (UUID)
- **Body**: `{ documentUrl: string }`
- **Response**: Extracted text content
- **Swagger**: ⚠️ Basic documentation (needs enhancement)

## Fleet Controller Driver Endpoints (`/fleet/drivers`)

### 1. Create Driver (Fleet)
- **POST** `/fleet/drivers`
- **Description**: Creates a new driver in the fleet management system
- **Body**: `CreateDriverDto`
- **Response**: Driver object with success message
- **Swagger**: ✅ Enhanced documentation with detailed response schema

### 2. Get All Drivers (Fleet)
- **GET** `/fleet/drivers`
- **Description**: Retrieves all drivers with filtering and pagination
- **Query Parameters**:
  - `search` (string) - Search in first name, last name, license number
  - `status` (string) - Filter by driver status
  - `location` (string) - Filter by location
  - `page` (number, min: 1) - Page number for pagination
  - `limit` (number, min: 1, max: 100) - Items per page
- **Response**: Drivers list with success message
- **Swagger**: ✅ Enhanced documentation with query parameters and response schema

### 3. Get Driver by ID (Fleet)
- **GET** `/fleet/drivers/:id`
- **Description**: Retrieves a specific driver by ID
- **Path Parameter**: `id` (UUID)
- **Response**: Driver object with success message
- **Swagger**: ✅ Enhanced documentation with path parameter and response schema

### 4. Update Driver (Fleet)
- **PATCH** `/fleet/drivers/:id`
- **Description**: Updates an existing driver (partial updates supported)
- **Path Parameter**: `id` (UUID)
- **Body**: `CreateDriverDto` (partial)
- **Response**: Updated driver object
- **Swagger**: ✅ Enhanced documentation with request/response schemas

### 5. Delete Driver (Fleet)
- **DELETE** `/fleet/drivers/:id`
- **Description**: Soft deletes a driver from the fleet
- **Path Parameter**: `id` (UUID)
- **Response**: Success message
- **Swagger**: ✅ Enhanced documentation with path parameter and response schema

## Bulk Operations

### Bulk Assign to Trucks
- **POST** `/fleet/trucks/bulk-assign`
- **Description**: Assigns multiple drivers or routes to multiple trucks
- **Body**: Bulk assignment data with driver IDs
- **Swagger**: ✅ Fully documented

### Bulk Unassign from Trucks
- **DELETE** `/fleet/trucks/bulk-unassign`
- **Description**: Unassigns multiple drivers or routes from multiple trucks
- **Body**: Bulk unassignment data with driver IDs
- **Swagger**: ✅ Fully documented

## Data Models

### Driver Entity
```typescript
{
  id: string (UUID)
  tenantId: string (UUID)
  userId: string (UUID)
  employerId: string (UUID)
  employeeId?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: Date
  address: string
  emergencyContact: Record<string, any>
  licenseNumber: string (unique)
  licenseClasses: any[]
  licenseIssueDate: Date
  licenseExpiry: Date
  licenseState: string
  licenseCountry: string
  endorsements: any[]
  restrictions: any[]
  employmentType: EmploymentType
  hireDate: Date
  terminationDate?: Date
  status: DriverStatus
  availabilityStatus: string
  currentTruckId?: string (UUID)
  currentTripId?: string (UUID)
  currentLocation?: object (Point geometry)
  locationUpdatedAt?: Date
  hoursWorkedThisWeek: number
  hoursWorkedThisMonth: number
  lastBreakTime?: Date
  consecutiveDrivingHours: number
  medicalCertExpiry?: Date
  drugTestDate?: Date
  backgroundCheckDate?: Date
  trainingCompletionDate?: Date
  certifications: any[]
  rating: number (0-5)
  totalTrips: number
  totalDistance: number
  safetyScore: number (0-100)
  onTimeDeliveryRate: number (0-100)
  hourlyRate?: number
  mileageRate?: number
  totalEarnings: number
  preferences: Record<string, any>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}
```

### Enums

#### DriverStatus
```typescript
enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  IN_TRANSIT = 'IN_TRANSIT'
}
```

#### EmploymentType
```typescript
enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  OWNER_OPERATOR = 'OWNER_OPERATOR',
  FREELANCE = 'FREELANCE'
}
```

## Database Schema

The driver system includes the following tables:
- `drivers` - Main driver information
- `driver_alerts` - Driver safety and operational alerts
- `trip_events` - Trip-related events and telematics
- `trip_locations` - GPS location tracking
- `driver_documents` - Driver document management
- `driver_notifications` - Driver notification system
- `driver_earnings` - Driver compensation tracking
- `driver_safety_metrics` - Safety performance metrics

## Security Features

- **JWT Authentication**: All endpoints require valid JWT tokens
- **Role-Based Access Control**: Different access levels based on user roles
- **Tenant Isolation**: Drivers are isolated by tenant ID
- **Input Validation**: Comprehensive DTO validation using class-validator
- **Soft Delete**: Drivers are soft-deleted to maintain data integrity

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

## Rate Limiting

- Standard API rate limiting applies
- Driver location updates: 10 requests per minute per driver
- Telematics events: 60 requests per minute per driver

## Webhooks & Notifications

- Real-time notifications for driver status changes
- Webhook support for external integrations
- Push notifications for mobile drivers

## Testing

- Unit tests for all service methods
- Integration tests for API endpoints
- Mock data generation for development
- Test coverage: >90%

## Migration

To apply the driver database schema:

```bash
# Run the driver migration
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts

# Verify migration status
npx typeorm-ts-node-commonjs migration:show -d src/data-source.ts
```

## Swagger/OpenAPI

All driver endpoints are fully documented in Swagger with:
- Request/response schemas
- Query parameters
- Path parameters
- Response examples
- Error codes
- Authentication requirements

Access the Swagger documentation at: `/api/docs` when the application is running.

## Support

For API support or questions:
- Check the Swagger documentation
- Review this documentation
- Contact the development team
- Check the application logs for detailed error information
