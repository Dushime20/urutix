# 🚛 Fleet Management API Endpoints Documentation

## 📋 Overview

This document provides a comprehensive overview of all fleet management endpoints available in the Cargo AI Matching application. The fleet management system supports complete truck and driver lifecycle management with advanced assignment capabilities.

## 🎯 Base URL
```
http://localhost:3000/api/fleet
```

## 🔐 Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🚛 Truck Management Endpoints

### **Create Truck**
```http
POST /fleet/trucks
```

**Request Body:**
```json
{
  "plateNumber": "ABC-123",
  "make": "Volvo",
  "model": "FH16",
  "year": 2020,
  "capacityWeight": 20000,
  "capacityVolume": 1000,
  "fuelType": "Diesel",
  "vin": "1HGBH41JXMN109186",
  "engineNumber": "ENG123456",
  "transmissionType": "Automatic",
  "axleConfiguration": "6x4",
  "grossVehicleWeight": 25000,
  "emptyWeight": 8000,
  "equipmentList": ["GPS", "Camera", "ELD"]
}
```

**Response:**
```json
{
  "message": "Truck created successfully",
  "truck": {
    "id": "uuid",
    "plateNumber": "ABC-123",
    "make": "Volvo",
    "model": "FH16",
    "status": "available",
    "capacityWeight": 20000,
    "capacityVolume": 1000
  }
}
```

### **Get All Trucks**
```http
GET /fleet/trucks?search=volvo&status=available&location=NYC&page=1&limit=10
```

**Query Parameters:**
- `search` (optional): Search in plate number, make, model
- `status` (optional): Filter by status
- `location` (optional): Filter by location
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page

**Response:**
```json
{
  "message": "Trucks retrieved successfully",
  "trucks": [
    {
      "id": "uuid",
      "plateNumber": "ABC-123",
      "make": "Volvo",
      "model": "FH16",
      "status": "available",
      "assignedDrivers": [...],
      "assignedRoutes": [...]
    }
  ]
}
```

### **Get Specific Truck**
```http
GET /fleet/trucks/{id}
```

**Response:**
```json
{
  "message": "Truck retrieved successfully",
  "truck": {
    "id": "uuid",
    "plateNumber": "ABC-123",
    "make": "Volvo",
    "model": "FH16",
    "status": "available",
    "assignedDrivers": [...],
    "assignedRoutes": [...],
    "documents": [...],
    "maintenance": [...]
  }
}
```

### **Update Truck**
```http
PATCH /fleet/trucks/{id}
```

**Request Body:**
```json
{
  "status": "maintenance",
  "currentLocation": "New York, NY"
}
```

### **Delete Truck**
```http
DELETE /fleet/trucks/{id}
```

---

## 👤 Driver Management Endpoints

### **Create Driver**
```http
POST /fleet/drivers
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@company.com",
  "phone": "+1234567890",
  "licenseNumber": "DL123456789",
  "licenseType": "CDL-A",
  "experience": 5,
  "emergencyContact": {
    "name": "Jane Smith",
    "phone": "+1234567891",
    "relationship": "Spouse"
  }
}
```

### **Get All Drivers**
```http
GET /fleet/drivers?search=john&status=active&location=NYC&page=1&limit=10
```

### **Get Specific Driver**
```http
GET /fleet/drivers/{id}
```

### **Update Driver**
```http
PATCH /fleet/drivers/{id}
```

### **Delete Driver**
```http
DELETE /fleet/drivers/{id}
```

---

## 🔗 Assignment Management Endpoints

### **Assign Driver to Truck**
```http
POST /fleet/trucks/{truckId}/assign-driver
```

**Request Body:**
```json
{
  "driverId": "driver-uuid",
  "notes": "Primary driver assignment"
}
```

**Response:**
```json
{
  "message": "Driver assigned to truck successfully",
  "assignment": {
    "truckId": "truck-uuid",
    "driverId": "driver-uuid",
    "driverName": "John Smith",
    "assignmentDate": "2024-01-15T10:00:00Z",
    "status": "active",
    "notes": "Primary driver assignment"
  }
}
```

### **Unassign Driver from Truck**
```http
DELETE /fleet/trucks/{truckId}/assign-driver/{driverId}
```

### **Assign Route to Truck**
```http
POST /fleet/trucks/{truckId}/assign-route
```

**Request Body:**
```json
{
  "routeId": "route-uuid",
  "notes": "Primary route assignment"
}
```

### **Unassign Route from Truck**
```http
DELETE /fleet/trucks/{truckId}/assign-route/{routeId}
```

---

## 🛣️ Route Management Endpoints

### **Create Route**
```http
POST /fleet/routes
```

**Request Body:**
```json
{
  "name": "NYC to Chicago",
  "origin": "New York, NY",
  "destination": "Chicago, IL",
  "distance": 800,
  "estimatedDuration": 12,
  "status": "active"
}
```

### **Get All Routes**
```http
GET /fleet/routes
```

### **Get Specific Route**
```http
GET /fleet/routes/{id}
```

### **Update Route**
```http
PATCH /fleet/routes/{id}
```

### **Delete Route**
```http
DELETE /fleet/routes/{id}
```

---

## 📋 Truck Records Endpoints

### **Get Truck Records**
```http
GET /fleet/trucks/{truckId}/records
```

**Response:**
```json
{
  "message": "Truck records retrieved successfully",
  "records": {
    "documents": [...],
    "maintenance": [...],
    "inspections": [...],
    "insurance": [...],
    "fuelRecords": [...],
    "tireRecords": [...],
    "compliance": [...]
  }
}
```

### **Add Truck Document**
```http
POST /fleet/trucks/{truckId}/documents
```

**Request Body:**
```json
{
  "name": "Insurance Certificate",
  "type": "insurance",
  "status": "valid",
  "issueDate": "2024-01-01",
  "expiryDate": "2025-01-01",
  "fileUrl": "https://example.com/document.pdf",
  "notes": "Annual insurance certificate"
}
```

### **Get Truck Maintenance**
```http
GET /fleet/trucks/{truckId}/maintenance
```

### **Add Truck Maintenance**
```http
POST /fleet/trucks/{truckId}/maintenance
```

**Request Body:**
```json
{
  "type": "preventive",
  "title": "Oil Change",
  "description": "Regular oil change and filter replacement",
  "date": "2024-01-15",
  "cost": 150.00,
  "nextDueDate": "2024-04-15",
  "status": "completed",
  "priority": "medium"
}
```

---

## 📊 Analytics Endpoints

### **Get Fleet Analytics**
```http
GET /fleet/analytics
```

**Response:**
```json
{
  "message": "Fleet analytics retrieved successfully",
  "analytics": {
    "totalTrucks": 25,
    "totalDrivers": 30,
    "availableTrucks": 15,
    "activeDrivers": 28,
    "utilizationRate": 60.0,
    "averageTruckAge": 3.2
  }
}
```

---

## 🔄 Bulk Operations Endpoints

### **Bulk Assign to Trucks**
```http
POST /fleet/trucks/bulk-assign
```

**Request Body:**
```json
{
  "truckIds": ["truck-1", "truck-2", "truck-3"],
  "driverIds": ["driver-1", "driver-2"],
  "routeIds": ["route-1"],
  "type": "driver"
}
```

**Response:**
```json
{
  "message": "Bulk assignment completed successfully",
  "result": {
    "results": [
      {
        "truckId": "truck-1",
        "driverId": "driver-1",
        "driverName": "John Smith",
        "assignmentDate": "2024-01-15T10:00:00Z",
        "status": "active"
      }
    ]
  }
}
```

### **Bulk Unassign from Trucks**
```http
DELETE /fleet/trucks/bulk-unassign
```

**Request Body:**
```json
{
  "truckIds": ["truck-1", "truck-2"],
  "driverIds": ["driver-1"],
  "routeIds": ["route-1"],
  "type": "driver"
}
```

---

## 🎯 Business Rules

### **Truck Assignment Rules:**
1. **One-to-Many Relationships**: A truck can be assigned to multiple drivers and routes
2. **Assignment Validation**: Cannot assign the same driver/route to a truck twice
3. **Status Validation**: Can only delete trucks in AVAILABLE status
4. **Ownership Validation**: Users can only manage their own trucks and drivers

### **Driver Assignment Rules:**
1. **Multiple Assignments**: A driver can be assigned to multiple trucks
2. **Assignment History**: All assignments are tracked with dates and notes
3. **Status Tracking**: Assignment status (active, inactive, temporary)

### **Route Assignment Rules:**
1. **Flexible Routing**: Routes can be assigned to multiple trucks
2. **Route Management**: Routes have status (active, inactive, maintenance)
3. **Assignment Tracking**: Route assignments include dates and notes

---

## 🔧 Error Handling

### **Common Error Responses:**

**404 Not Found:**
```json
{
  "message": "Truck not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**403 Forbidden:**
```json
{
  "message": "You can only update your own trucks",
  "error": "Forbidden",
  "statusCode": 403
}
```

**400 Bad Request:**
```json
{
  "message": "Driver is already assigned to this truck",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 📈 Performance Considerations

### **Optimization Features:**
1. **Pagination**: All list endpoints support pagination
2. **Search**: Full-text search across multiple fields
3. **Filtering**: Status, location, and custom filters
4. **Caching**: Analytics data is cached for performance
5. **Bulk Operations**: Efficient bulk assignment/unassignment

### **Database Indexes:**
- Primary keys on all entities
- Indexes on frequently searched fields (plateNumber, make, model)
- Composite indexes for assignment queries
- Full-text search indexes for search functionality

---

## 🚀 Frontend Integration

### **API Service Example:**
```typescript
// fleetApi.ts
export const fleetAPI = {
  // Trucks
  getTrucks: (params?: any) => api.get('/fleet/trucks', { params }),
  getTruck: (id: string) => api.get(`/fleet/trucks/${id}`),
  createTruck: (data: any) => api.post('/fleet/trucks', data),
  updateTruck: (id: string, data: any) => api.patch(`/fleet/trucks/${id}`, data),
  deleteTruck: (id: string) => api.delete(`/fleet/trucks/${id}`),
  
  // Drivers
  getDrivers: (params?: any) => api.get('/fleet/drivers', { params }),
  getDriver: (id: string) => api.get(`/fleet/drivers/${id}`),
  createDriver: (data: any) => api.post('/fleet/drivers', data),
  updateDriver: (id: string, data: any) => api.patch(`/fleet/drivers/${id}`, data),
  deleteDriver: (id: string) => api.delete(`/fleet/drivers/${id}`),
  
  // Assignments
  assignDriver: (truckId: string, driverId: string, notes?: string) => 
    api.post(`/fleet/trucks/${truckId}/assign-driver`, { driverId, notes }),
  unassignDriver: (truckId: string, driverId: string) => 
    api.delete(`/fleet/trucks/${truckId}/assign-driver/${driverId}`),
  assignRoute: (truckId: string, routeId: string, notes?: string) => 
    api.post(`/fleet/trucks/${truckId}/assign-route`, { routeId, notes }),
  unassignRoute: (truckId: string, routeId: string) => 
    api.delete(`/fleet/trucks/${truckId}/assign-route/${routeId}`),
  
  // Routes
  getRoutes: () => api.get('/fleet/routes'),
  getRoute: (id: string) => api.get(`/fleet/routes/${id}`),
  createRoute: (data: any) => api.post('/fleet/routes', data),
  updateRoute: (id: string, data: any) => api.patch(`/fleet/routes/${id}`, data),
  deleteRoute: (id: string) => api.delete(`/fleet/routes/${id}`),
  
  // Records
  getTruckRecords: (truckId: string) => api.get(`/fleet/trucks/${truckId}/records`),
  addTruckDocument: (truckId: string, data: any) => api.post(`/fleet/trucks/${truckId}/documents`, data),
  getTruckMaintenance: (truckId: string) => api.get(`/fleet/trucks/${truckId}/maintenance`),
  addTruckMaintenance: (truckId: string, data: any) => api.post(`/fleet/trucks/${truckId}/maintenance`, data),
  
  // Analytics
  getAnalytics: () => api.get('/fleet/analytics'),
  
  // Bulk Operations
  bulkAssign: (data: any) => api.post('/fleet/trucks/bulk-assign', data),
  bulkUnassign: (data: any) => api.delete('/fleet/trucks/bulk-unassign', data),
};
```

---

## ✅ **Complete Fleet Dashboard Support**

The fleet controller now supports **ALL** features required for the fleet dashboard:

### **✅ Core Features:**
- ✅ **Truck Management**: CRUD operations with search and filtering
- ✅ **Driver Management**: Complete driver lifecycle management
- ✅ **Assignment Management**: One-to-many driver and route assignments
- ✅ **Route Management**: Full route CRUD operations
- ✅ **Records Management**: Documents, maintenance, inspections
- ✅ **Analytics**: Comprehensive fleet analytics
- ✅ **Bulk Operations**: Efficient bulk assignment/unassignment

### **✅ Advanced Features:**
- ✅ **Search & Filtering**: Multi-field search with pagination
- ✅ **Business Rules**: Assignment validation and ownership checks
- ✅ **Error Handling**: Comprehensive error responses
- ✅ **Performance**: Optimized queries with proper indexing
- ✅ **Security**: JWT authentication and authorization

### **✅ Frontend Integration:**
- ✅ **API Service**: Complete TypeScript API service
- ✅ **Data Types**: Full TypeScript interface support
- ✅ **Real-time Updates**: Assignment status tracking
- ✅ **User Experience**: Intuitive assignment workflows

**The fleet management system is now enterprise-ready and fully supports the fleet dashboard functionality!** 🚀 