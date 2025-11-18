# Backend Endpoints Documentation

## Overview
This document provides a comprehensive overview of all backend endpoints available in the CargoAI Matching platform. The backend is built with NestJS and provides RESTful APIs for fleet management, financial management, safety management, and more.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints (except auth endpoints) require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Response Format
All endpoints return responses in the following format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "statusCode": 200
}
```

---

## 🔐 Authentication Endpoints

### POST /auth/login
**Description**: Authenticate user and get JWT token
**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "TRUCK_OWNER"
    }
  }
}
```

### POST /auth/register
**Description**: Register new user
**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "TRUCK_OWNER"
}
```

### GET /auth/profile
**Description**: Get current user profile
**Headers**: Authorization: Bearer <token>

---

## 🚛 Fleet Management Endpoints

### Trucks

#### GET /fleet/trucks
**Description**: Get all trucks for the current user
**Query Parameters**:
- `status` (optional): Filter by truck status
- `location` (optional): Filter by location
- `page` (optional): Page number for pagination
- `limit` (optional): Items per page

#### POST /fleet/trucks
**Description**: Create a new truck
**Body**:
```json
{
  "plateNumber": "ABC-123",
  "make": "Volvo",
  "model": "FH16",
  "year": 2020,
  "capacityWeight": 20000,
  "capacityVolume": 1000,
  "fuelType": "Diesel"
}
```

#### GET /fleet/trucks/:id
**Description**: Get truck by ID
**Parameters**: `id` - Truck UUID

#### PATCH /fleet/trucks/:id
**Description**: Update truck
**Parameters**: `id` - Truck UUID
**Body**: Partial truck data

#### DELETE /fleet/trucks/:id
**Description**: Delete truck
**Parameters**: `id` - Truck UUID

### Drivers

#### GET /fleet/drivers
**Description**: Get all drivers for the current user
**Query Parameters**:
- `status` (optional): Filter by driver status
- `experience` (optional): Filter by experience level

#### POST /fleet/drivers
**Description**: Create a new driver
**Body**:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john.smith@fleet.com",
  "phone": "+1-555-0123",
  "licenseNumber": "DL-123456",
  "licenseType": "CDL-A",
  "experience": 5
}
```

#### GET /fleet/drivers/:id
**Description**: Get driver by ID
**Parameters**: `id` - Driver UUID

#### PATCH /fleet/drivers/:id
**Description**: Update driver
**Parameters**: `id` - Driver UUID
**Body**: Partial driver data

#### DELETE /fleet/drivers/:id
**Description**: Delete driver
**Parameters**: `id` - Driver UUID

### Analytics

#### GET /fleet/analytics
**Description**: Get fleet analytics
**Response**:
```json
{
  "success": true,
  "message": "Fleet analytics retrieved successfully",
  "data": {
    "analytics": {
      "totalTrucks": 15,
      "activeTrucks": 12,
      "totalDrivers": 20,
      "availableDrivers": 8,
      "utilizationRate": 85.5,
      "averageRevenue": 125000,
      "maintenanceAlerts": 3
    }
  }
}
```

---

## 💰 Financial Management Endpoints

### Invoices

#### GET /financial/invoices
**Description**: Get all invoices
**Query Parameters**:
- `status` (optional): Filter by invoice status
- `customerId` (optional): Filter by customer
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)

#### POST /financial/invoices
**Description**: Create a new invoice
**Body**:
```json
{
  "invoiceNumber": "INV-2024-001",
  "customerId": "customer-123",
  "customerName": "ABC Logistics",
  "tripId": "trip-456",
  "issueDate": "2024-01-15T00:00:00Z",
  "dueDate": "2024-02-15T00:00:00Z",
  "status": "draft",
  "subtotal": 2500.00,
  "taxAmount": 250.00,
  "totalAmount": 2750.00,
  "currency": "USD",
  "paymentTerms": "Net 30",
  "items": [
    {
      "description": "Freight charges",
      "quantity": 1,
      "unitPrice": 2000.00,
      "totalPrice": 2000.00,
      "type": "freight"
    },
    {
      "description": "Fuel surcharge",
      "quantity": 1,
      "unitPrice": 500.00,
      "totalPrice": 500.00,
      "type": "fuel_surcharge"
    }
  ]
}
```

#### GET /financial/invoices/:id
**Description**: Get invoice by ID
**Parameters**: `id` - Invoice UUID

#### PATCH /financial/invoices/:id
**Description**: Update invoice
**Parameters**: `id` - Invoice UUID
**Body**: Partial invoice data

#### DELETE /financial/invoices/:id
**Description**: Delete invoice
**Parameters**: `id` - Invoice UUID

### Expenses

#### GET /financial/expenses
**Description**: Get all expenses
**Query Parameters**:
- `type` (optional): Filter by expense type
- `status` (optional): Filter by expense status
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

#### POST /financial/expenses
**Description**: Create a new expense
**Body**:
```json
{
  "type": "fuel",
  "category": "Fuel",
  "amount": 450.00,
  "date": "2024-01-15T00:00:00Z",
  "description": "Fuel purchase at truck stop",
  "truckId": "truck-123",
  "driverId": "driver-456",
  "receipt": "receipt-url",
  "status": "pending",
  "taxDeductible": true
}
```

#### GET /financial/expenses/:id
**Description**: Get expense by ID
**Parameters**: `id` - Expense UUID

#### PATCH /financial/expenses/:id
**Description**: Update expense
**Parameters**: `id` - Expense UUID
**Body**: Partial expense data

#### DELETE /financial/expenses/:id
**Description**: Delete expense
**Parameters**: `id` - Expense UUID

### Payments

#### GET /financial/payments
**Description**: Get all payments
**Query Parameters**:
- `status` (optional): Filter by payment status
- `customerId` (optional): Filter by customer
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

#### POST /financial/payments
**Description**: Create a new payment
**Body**:
```json
{
  "invoiceId": "invoice-123",
  "invoiceNumber": "INV-2024-001",
  "customerId": "customer-123",
  "customerName": "ABC Logistics",
  "amount": 2750.00,
  "paymentDate": "2024-01-20T00:00:00Z",
  "paymentMethod": "ach",
  "referenceNumber": "REF-123456",
  "status": "completed"
}
```

#### GET /financial/payments/:id
**Description**: Get payment by ID
**Parameters**: `id` - Payment UUID

### Financial Reports

#### GET /financial/reports
**Description**: Get financial reports
**Query Parameters**:
- `type` (optional): Filter by report type
- `period` (optional): Filter by period

#### POST /financial/reports
**Description**: Generate a new financial report
**Body**:
```json
{
  "type": "pl_statement",
  "period": "monthly",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

### Financial Analytics

#### GET /financial/analytics/performance
**Description**: Get performance metrics
**Query Parameters**:
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis

#### GET /financial/analytics/customers
**Description**: Get customer analytics
**Query Parameters**:
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis

#### GET /financial/analytics/drivers
**Description**: Get driver analytics
**Query Parameters**:
- `startDate` (optional): Start date for analysis
- `endDate` (optional): End date for analysis

#### GET /financial/analytics/predictive
**Description**: Get predictive analytics
**Query Parameters**:
- `forecastPeriod` (optional): Period for forecasting

---

## 🛡️ Safety Management Endpoints

### Safety Incidents

#### GET /safety/incidents
**Description**: Get all safety incidents
**Query Parameters**:
- `status` (optional): Filter by incident status
- `severity` (optional): Filter by severity level
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

#### POST /safety/incidents
**Description**: Create a new safety incident
**Body**:
```json
{
  "title": "Minor collision",
  "description": "Truck backed into loading dock",
  "severity": "minor",
  "date": "2024-01-15T10:30:00Z",
  "location": "Warehouse A",
  "truckId": "truck-123",
  "driverId": "driver-456",
  "witnesses": ["John Doe", "Jane Smith"],
  "damage": "Minor bumper damage",
  "estimatedCost": 500.00,
  "status": "investigating"
}
```

### Safety Inspections

#### GET /safety/inspections
**Description**: Get all safety inspections
**Query Parameters**:
- `status` (optional): Filter by inspection status
- `truckId` (optional): Filter by truck
- `inspectorId` (optional): Filter by inspector

#### POST /safety/inspections
**Description**: Create a new safety inspection
**Body**:
```json
{
  "truckId": "truck-123",
  "inspectorId": "inspector-456",
  "inspectionDate": "2024-01-15T09:00:00Z",
  "type": "pre_trip",
  "status": "passed",
  "score": 95,
  "items": [
    {
      "category": "Brakes",
      "item": "Brake system",
      "status": "pass",
      "notes": "All brakes functioning properly"
    }
  ],
  "notes": "Vehicle in good condition"
}
```

### Driver Safety Scores

#### GET /safety/driver-scores
**Description**: Get driver safety scores
**Query Parameters**:
- `driverId` (optional): Filter by driver
- `period` (optional): Filter by time period

#### POST /safety/driver-scores
**Description**: Create/update driver safety score
**Body**:
```json
{
  "driverId": "driver-123",
  "score": 88,
  "period": "monthly",
  "date": "2024-01-31T00:00:00Z",
  "factors": [
    {
      "factor": "Safe driving",
      "score": 90,
      "weight": 0.4
    },
    {
      "factor": "Vehicle maintenance",
      "score": 85,
      "weight": 0.3
    }
  ]
}
```

---

## 📊 Analytics Endpoints

### Dashboard Analytics

#### GET /analytics/dashboard
**Description**: Get comprehensive dashboard data
**Query Parameters**:
- `period` (optional): Analytics period (day, week, month, quarter, year)
- `metrics` (optional): Comma-separated list of metrics
- `userId` (optional): User ID for user-specific analytics

#### GET /analytics/revenue
**Description**: Get revenue analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `groupBy` (optional): Group by (day, week, month, customer)

#### GET /analytics/trips
**Description**: Get trip analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `status` (optional): Trip status

#### GET /analytics/loads
**Description**: Get load analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `status` (optional): Load status

#### GET /analytics/payments
**Description**: Get payment analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `status` (optional): Payment status

#### GET /analytics/users
**Description**: Get user analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `role` (optional): User role

#### GET /analytics/fleet
**Description**: Get fleet analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `type` (optional): Fleet type (trucks, drivers)

#### GET /analytics/matching
**Description**: Get matching analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `status` (optional): Match status

#### GET /analytics/notifications
**Description**: Get notification analytics
**Query Parameters**:
- `startDate` (optional): Start date
- `endDate` (optional): End date
- `type` (optional): Notification type

---

## 🔍 OCR Endpoints

### POST /ocr/upload
**Description**: Upload and extract text from document
**Content-Type**: `multipart/form-data`
**Body**: Form data with file field
**Response**:
```json
{
  "success": true,
  "message": "Text extracted successfully",
  "data": {
    "text": "Extracted text content",
    "confidence": 95.5,
    "structuredData": {
      "licenseNumber": "DL-123456",
      "expiryDate": "2025-12-31",
      "name": "John Smith"
    }
  }
}
```

### POST /ocr/extract-document
**Description**: Extract structured data from document URL
**Body**:
```json
{
  "url": "https://example.com/document.pdf",
  "documentType": "driver_license"
}
```

---

## 📍 Location Endpoints

### GET /locations
**Description**: Get all locations
**Query Parameters**:
- `type` (optional): Location type
- `search` (optional): Search term

### POST /locations
**Description**: Create a new location
**Body**:
```json
{
  "name": "Warehouse A",
  "type": "warehouse",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "coordinates": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

### GET /locations/:id
**Description**: Get location by ID
**Parameters**: `id` - Location UUID

### PATCH /locations/:id
**Description**: Update location
**Parameters**: `id` - Location UUID
**Body**: Partial location data

### DELETE /locations/:id
**Description**: Delete location
**Parameters**: `id` - Location UUID

### GET /locations/search
**Description**: Search locations
**Query Parameters**:
- `q` (required): Search query
- `type` (optional): Location type

---

## 🔔 Notification Endpoints

### GET /notifications
**Description**: Get all notifications
**Query Parameters**:
- `type` (optional): Notification type
- `status` (optional): Notification status
- `page` (optional): Page number
- `limit` (optional): Items per page

### POST /notifications
**Description**: Create a new notification
**Body**:
```json
{
  "type": "alert",
  "title": "Maintenance Due",
  "message": "Truck ABC-123 requires maintenance",
  "priority": "high",
  "recipients": ["user-123", "user-456"],
  "metadata": {
    "truckId": "truck-123",
    "maintenanceType": "oil_change"
  }
}
```

### GET /notifications/:id
**Description**: Get notification by ID
**Parameters**: `id` - Notification UUID

### PATCH /notifications/:id
**Description**: Update notification
**Parameters**: `id` - Notification UUID
**Body**: Partial notification data

### DELETE /notifications/:id
**Description**: Delete notification
**Parameters**: `id` - Notification UUID

### PATCH /notifications/:id/read
**Description**: Mark notification as read
**Parameters**: `id` - Notification UUID

### PATCH /notifications/read/all
**Description**: Mark all notifications as read

### PATCH /notifications/:id/archive
**Description**: Archive notification
**Parameters**: `id` - Notification UUID

### GET /notifications/unread/count
**Description**: Get unread notification count

### GET /notifications/stats
**Description**: Get notification statistics

---

## 💳 Payment Endpoints

### GET /payments
**Description**: Get all payments
**Query Parameters**:
- `status` (optional): Payment status
- `method` (optional): Payment method
- `startDate` (optional): Start date
- `endDate` (optional): End date

### POST /payments
**Description**: Create a new payment
**Body**:
```json
{
  "amount": 2750.00,
  "currency": "USD",
  "method": "ach",
  "description": "Payment for invoice INV-2024-001",
  "metadata": {
    "invoiceId": "invoice-123",
    "customerId": "customer-123"
  }
}
```

### GET /payments/:id
**Description**: Get payment by ID
**Parameters**: `id` - Payment UUID

### PATCH /payments/:id/status
**Description**: Update payment status
**Parameters**: `id` - Payment UUID
**Body**:
```json
{
  "status": "completed",
  "transactionId": "txn-123456"
}
```

### POST /payments/:id/process
**Description**: Process payment
**Parameters**: `id` - Payment UUID

### POST /payments/:id/refund
**Description**: Process refund
**Parameters**: `id` - Payment UUID
**Body**:
```json
{
  "amount": 500.00,
  "reason": "Customer request"
}
```

### GET /payments/analytics
**Description**: Get payment analytics

### GET /payments/trip/:tripId/history
**Description**: Get payment history for trip
**Parameters**: `tripId` - Trip UUID

---

## 🚚 Trip Endpoints

### GET /trips
**Description**: Get all trips
**Query Parameters**:
- `status` (optional): Trip status
- `driverId` (optional): Driver ID
- `truckId` (optional): Truck ID
- `startDate` (optional): Start date
- `endDate` (optional): End date

### POST /trips
**Description**: Create a new trip
**Body**:
```json
{
  "origin": "New York, NY",
  "destination": "Chicago, IL",
  "driverId": "driver-123",
  "truckId": "truck-456",
  "loadId": "load-789",
  "startDate": "2024-01-15T08:00:00Z",
  "estimatedEndDate": "2024-01-16T20:00:00Z",
  "distance": 800,
  "estimatedFuelCost": 400.00
}
```

### GET /trips/:id
**Description**: Get trip by ID
**Parameters**: `id` - Trip UUID

### PATCH /trips/:id
**Description**: Update trip
**Parameters**: `id` - Trip UUID
**Body**: Partial trip data

### PATCH /trips/:id/status
**Description**: Update trip status
**Parameters**: `id` - Trip UUID
**Body**:
```json
{
  "status": "in_progress",
  "currentLocation": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "address": "New York, NY"
  }
}
```

### GET /trips/analytics/summary
**Description**: Get trip analytics summary

### GET /trips/active
**Description**: Get active trips

---

## 📦 Load Endpoints

### GET /loads
**Description**: Get all loads
**Query Parameters**:
- `status` (optional): Load status
- `origin` (optional): Origin location
- `destination` (optional): Destination location
- `startDate` (optional): Start date
- `endDate` (optional): End date

### POST /loads
**Description**: Create a new load
**Body**:
```json
{
  "origin": "New York, NY",
  "destination": "Chicago, IL",
  "weight": 15000,
  "volume": 800,
  "description": "Electronics shipment",
  "customerId": "customer-123",
  "pickupDate": "2024-01-15T08:00:00Z",
  "deliveryDate": "2024-01-16T20:00:00Z",
  "rate": 2500.00
}
```

### GET /loads/:id
**Description**: Get load by ID
**Parameters**: `id` - Load UUID

### PATCH /loads/:id
**Description**: Update load
**Parameters**: `id` - Load UUID
**Body**: Partial load data

### DELETE /loads/:id
**Description**: Delete load
**Parameters**: `id` - Load UUID

---

## 🔄 Matching Endpoints

### POST /matching/find
**Description**: Find matching loads for trucks/drivers
**Body**:
```json
{
  "truckId": "truck-123",
  "origin": "New York, NY",
  "destination": "Chicago, IL",
  "capacity": 20000,
  "preferences": {
    "maxDistance": 1000,
    "minRate": 2000.00,
    "preferredLanes": ["NYC-CHI", "CHI-LAX"]
  }
}
```

### GET /matching/market-insights
**Description**: Get market insights for matching

### GET /matching/history
**Description**: Get matching history
**Query Parameters**:
- `truckId` (optional): Truck ID
- `driverId` (optional): Driver ID
- `startDate` (optional): Start date
- `endDate` (optional): End date

---

## 🏥 Health Check Endpoints

### GET /health
**Description**: Health check endpoint
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Forbidden - Insufficient permissions",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "statusCode": 404
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "statusCode": 500
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Analytics endpoints**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

---

## WebSocket Endpoints

### Real-time Updates
**URL**: `ws://localhost:3000/ws`
**Authentication**: Include JWT token in query parameter
```
ws://localhost:3000/ws?token=<jwt-token>
```

**Events**:
- `trip_update`: Real-time trip status updates
- `location_update`: Real-time location updates
- `notification`: Real-time notifications
- `payment_update`: Real-time payment status updates

---

## Testing

### Swagger Documentation
Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

### Postman Collection
A Postman collection is available for testing all endpoints:
```
https://api.postman.com/collections/your-collection-id
```

---

## Versioning

The API uses URL versioning:
- Current version: `/api/v1/` (default)
- Future versions: `/api/v2/`, `/api/v3/`, etc.

To use a specific version, include it in the URL:
```
GET /api/v1/fleet/trucks
```

---

## Support

For API support and questions:
- **Email**: api-support@cargoaimatching.com
- **Documentation**: https://docs.cargoaimatching.com
- **Status Page**: https://status.cargoaimatching.com 