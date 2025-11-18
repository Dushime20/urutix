# 🚛 Fleet Management API - Swagger/OpenAPI Documentation

## 📋 Overview

This document provides comprehensive Swagger/OpenAPI documentation for all fleet management endpoints. The API is fully documented with proper schemas, examples, and response codes.

## 🎯 Swagger UI Access

Once the application is running, you can access the Swagger UI at:
```
http://localhost:3000/api
```

## 🔐 Authentication

All fleet endpoints require JWT authentication. The Swagger UI will prompt for the Bearer token.

## 📊 API Endpoints Summary

### **Truck Management (8 endpoints)**
- ✅ `POST /fleet/trucks` - Create truck
- ✅ `GET /fleet/trucks` - Get all trucks (with search/filtering)
- ✅ `GET /fleet/trucks/:id` - Get specific truck
- ✅ `PATCH /fleet/trucks/:id` - Update truck
- ✅ `DELETE /fleet/trucks/:id` - Delete truck
- ✅ `POST /fleet/trucks/:id/assign-driver` - Assign driver
- ✅ `DELETE /fleet/trucks/:id/assign-driver/:driverId` - Unassign driver
- ✅ `POST /fleet/trucks/:id/assign-route` - Assign route
- ✅ `DELETE /fleet/trucks/:id/assign-route/:routeId` - Unassign route

### **Driver Management (5 endpoints)**
- ✅ `POST /fleet/drivers` - Create driver
- ✅ `GET /fleet/drivers` - Get all drivers (with search/filtering)
- ✅ `GET /fleet/drivers/:id` - Get specific driver
- ✅ `PATCH /fleet/drivers/:id` - Update driver
- ✅ `DELETE /fleet/drivers/:id` - Delete driver

### **Route Management (5 endpoints)**
- ✅ `POST /fleet/routes` - Create route
- ✅ `GET /fleet/routes` - Get all routes
- ✅ `GET /fleet/routes/:id` - Get specific route
- ✅ `PATCH /fleet/routes/:id` - Update route
- ✅ `DELETE /fleet/routes/:id` - Delete route

### **Records Management (4 endpoints)**
- ✅ `GET /fleet/trucks/:id/records` - Get truck records
- ✅ `POST /fleet/trucks/:id/documents` - Add truck document
- ✅ `GET /fleet/trucks/:id/maintenance` - Get maintenance records
- ✅ `POST /fleet/trucks/:id/maintenance` - Add maintenance record

### **Analytics & Bulk Operations (3 endpoints)**
- ✅ `GET /fleet/analytics` - Get fleet analytics
- ✅ `POST /fleet/trucks/bulk-assign` - Bulk assign
- ✅ `DELETE /fleet/trucks/bulk-unassign` - Bulk unassign

## 🎯 Swagger Features Implemented

### **1. Complete API Documentation**
- ✅ **@ApiTags**: Organized endpoints by category
- ✅ **@ApiOperation**: Detailed descriptions for each endpoint
- ✅ **@ApiParam**: Parameter documentation with examples
- ✅ **@ApiQuery**: Query parameter documentation
- ✅ **@ApiBody**: Request body schemas
- ✅ **@ApiResponse**: Response documentation with status codes

### **2. Data Transfer Objects (DTOs)**
- ✅ **CreateTruckDto**: Truck creation with validation
- ✅ **CreateDriverDto**: Driver creation with validation
- ✅ **AssignDriverDto**: Driver assignment with validation
- ✅ **AssignRouteDto**: Route assignment with validation
- ✅ **BulkAssignDto**: Bulk operations with validation
- ✅ **CreateRouteDto**: Route creation with validation

### **3. Validation & Error Handling**
- ✅ **Class-validator**: Input validation with proper error messages
- ✅ **UUID Validation**: Proper UUID format validation
- ✅ **Enum Validation**: Status and type validation
- ✅ **Required/Optional Fields**: Clear field requirements

### **4. Response Documentation**
- ✅ **Success Responses**: 200, 201 status codes with examples
- ✅ **Error Responses**: 400, 401, 403, 404 status codes
- ✅ **Response Schemas**: Detailed response structure documentation

## 📋 Example API Calls

### **Create Truck**
```bash
curl -X POST "http://localhost:3000/api/fleet/trucks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "ABC-123",
    "make": "Volvo",
    "model": "FH16",
    "year": 2020,
    "capacityWeight": 20000,
    "capacityVolume": 1000,
    "fuelType": "Diesel"
  }'
```

### **Get All Trucks with Filtering**
```bash
curl -X GET "http://localhost:3000/api/fleet/trucks?search=volvo&status=available&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **Assign Driver to Truck**
```bash
curl -X POST "http://localhost:3000/api/fleet/trucks/TRUCK_ID/assign-driver" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRIVER_ID",
    "notes": "Primary driver assignment"
  }'
```

### **Bulk Assign Drivers**
```bash
curl -X POST "http://localhost:3000/api/fleet/trucks/bulk-assign" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "truckIds": ["TRUCK_1", "TRUCK_2"],
    "driverIds": ["DRIVER_1", "DRIVER_2"],
    "type": "driver"
  }'
```

## 🎯 Swagger UI Features

### **Interactive Documentation**
- ✅ **Try it out**: Test endpoints directly from Swagger UI
- ✅ **Request/Response Examples**: Real examples for all endpoints
- ✅ **Parameter Validation**: Automatic validation of input parameters
- ✅ **Authentication**: JWT token input in Swagger UI
- ✅ **Response Codes**: Clear documentation of all possible responses

### **Schema Documentation**
- ✅ **Request Schemas**: Detailed input validation rules
- ✅ **Response Schemas**: Complete response structure documentation
- ✅ **Error Schemas**: Error response format documentation
- ✅ **Enum Values**: Clear documentation of valid enum values

### **Search and Filter**
- ✅ **Endpoint Search**: Search through all endpoints
- ✅ **Tag Filtering**: Filter by endpoint categories
- ✅ **Method Filtering**: Filter by HTTP methods
- ✅ **Status Filtering**: Filter by response status codes

## 🔧 Testing with Swagger UI

### **1. Authentication**
1. Click the "Authorize" button in Swagger UI
2. Enter your JWT token: `Bearer YOUR_TOKEN`
3. Click "Authorize"

### **2. Testing Endpoints**
1. Find the endpoint you want to test
2. Click "Try it out"
3. Fill in the required parameters
4. Click "Execute"
5. View the response

### **3. Example Test Flow**
1. **Create a Truck**: Use `POST /fleet/trucks`
2. **Create a Driver**: Use `POST /fleet/drivers`
3. **Assign Driver to Truck**: Use `POST /fleet/trucks/{id}/assign-driver`
4. **Get Truck Details**: Use `GET /fleet/trucks/{id}`
5. **View Analytics**: Use `GET /fleet/analytics`

## 📊 Response Examples

### **Successful Truck Creation**
```json
{
  "message": "Truck created successfully",
  "truck": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "plateNumber": "ABC-123",
    "make": "Volvo",
    "model": "FH16",
    "status": "available",
    "capacityWeight": 20000,
    "capacityVolume": 1000
  }
}
```

### **Truck List with Assignments**
```json
{
  "message": "Trucks retrieved successfully",
  "trucks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "plateNumber": "ABC-123",
      "make": "Volvo",
      "model": "FH16",
      "status": "available",
      "assignedDrivers": [
        {
          "driverId": "987fcdeb-51a2-43d1-b456-426614174000",
          "driverName": "John Smith",
          "assignmentDate": "2024-01-15T10:00:00Z",
          "status": "active",
          "notes": "Primary driver"
        }
      ],
      "assignedRoutes": [
        {
          "routeId": "456e7890-e89b-12d3-a456-426614174000",
          "routeName": "NYC to Chicago",
          "assignmentDate": "2024-01-15T10:00:00Z",
          "status": "active",
          "notes": "Primary route"
        }
      ]
    }
  ]
}
```

### **Fleet Analytics**
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

## 🎯 Benefits of Swagger Documentation

### **1. Developer Experience**
- ✅ **Self-Documenting API**: Clear documentation for all endpoints
- ✅ **Interactive Testing**: Test endpoints directly from documentation
- ✅ **Code Generation**: Generate client SDKs from OpenAPI spec
- ✅ **Validation**: Automatic input validation and error handling

### **2. Team Collaboration**
- ✅ **API Contract**: Clear contract between frontend and backend
- ✅ **Version Control**: Track API changes through documentation
- ✅ **Onboarding**: New developers can understand API quickly
- ✅ **Testing**: Automated testing based on OpenAPI spec

### **3. Production Benefits**
- ✅ **Monitoring**: Track API usage and performance
- ✅ **Debugging**: Clear error messages and response codes
- ✅ **Security**: Proper authentication and authorization documentation
- ✅ **Compliance**: Audit trail and documentation for compliance

## 🚀 Next Steps

### **1. Generate Client SDKs**
```bash
# Generate TypeScript client
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-json \
  -g typescript-fetch \
  -o ./generated-client
```

### **2. Automated Testing**
```bash
# Generate test cases from OpenAPI spec
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-json \
  -g typescript-jest \
  -o ./generated-tests
```

### **3. API Monitoring**
- Set up API monitoring using the OpenAPI spec
- Track endpoint usage and performance
- Monitor error rates and response times

**The fleet management API is now fully documented and ready for production use!** 🎉 