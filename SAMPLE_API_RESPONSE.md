# 📡 Sample API Response

**Endpoint:** `GET http://localhost:3005/api/users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae?page=1&limit=10`

**Date:** February 12, 2026

---

## 🔐 Request Headers

```http
GET /api/users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae?page=1&limit=10 HTTP/1.1
Host: localhost:3005
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## ✅ Success Response (200 OK)

```json
{
  "success": true,
  "message": "Tenant users retrieved successfully",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "tenant.admin@test.com",
      "role": "TENANT_ADMIN",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-001",
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "Admin",
        "lastName": "User",
        "companyName": "ABC Logistics",
        "rating": 0,
        "totalTrips": 0,
        "kycStatus": "PENDING",
        "createdAt": "2024-02-12T10:00:00.000Z",
        "updatedAt": "2024-02-12T10:00:00.000Z"
      }
    },
    {
      "id": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "cargo1@test.com",
      "role": "CARGO_OWNER",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-002",
        "userId": "b2c3d4e5-f6g7-8901-bcde-fg2345678901",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "John",
        "lastName": "Doe",
        "companyName": "John's Shipping LLC",
        "rating": 4.5,
        "totalTrips": 15,
        "kycStatus": "VERIFIED",
        "createdAt": "2024-02-10T08:30:00.000Z",
        "updatedAt": "2024-02-12T09:15:00.000Z"
      }
    },
    {
      "id": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "cargo2@test.com",
      "role": "CARGO_OWNER",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-003",
        "userId": "c3d4e5f6-g7h8-9012-cdef-gh3456789012",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "Sarah",
        "lastName": "Johnson",
        "companyName": "Global Freight Solutions",
        "rating": 4.8,
        "totalTrips": 28,
        "kycStatus": "VERIFIED",
        "createdAt": "2024-02-08T14:20:00.000Z",
        "updatedAt": "2024-02-11T16:45:00.000Z"
      }
    },
    {
      "id": "d4e5f6g7-h8i9-0123-defg-hi4567890123",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "truck1@test.com",
      "role": "TRUCK_OWNER",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-004",
        "userId": "d4e5f6g7-h8i9-0123-defg-hi4567890123",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "Mike",
        "lastName": "Wilson",
        "companyName": "Wilson Transport Inc",
        "rating": 4.6,
        "totalTrips": 42,
        "kycStatus": "VERIFIED",
        "createdAt": "2024-02-05T11:00:00.000Z",
        "updatedAt": "2024-02-12T07:30:00.000Z"
      }
    },
    {
      "id": "e5f6g7h8-i9j0-1234-efgh-ij5678901234",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "truck2@test.com",
      "role": "TRUCK_OWNER",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-005",
        "userId": "e5f6g7h8-i9j0-1234-efgh-ij5678901234",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "Lisa",
        "lastName": "Anderson",
        "companyName": "Anderson Logistics",
        "rating": 4.9,
        "totalTrips": 56,
        "kycStatus": "VERIFIED",
        "createdAt": "2024-02-03T09:45:00.000Z",
        "updatedAt": "2024-02-12T08:20:00.000Z"
      }
    },
    {
      "id": "f6g7h8i9-j0k1-2345-fghi-jk6789012345",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "driver1@test.com",
      "role": "DRIVER",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-006",
        "userId": "f6g7h8i9-j0k1-2345-fghi-jk6789012345",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "Tom",
        "lastName": "Brown",
        "companyName": null,
        "rating": 4.7,
        "totalTrips": 38,
        "kycStatus": "VERIFIED",
        "createdAt": "2024-02-01T13:15:00.000Z",
        "updatedAt": "2024-02-11T19:00:00.000Z"
      }
    },
    {
      "id": "g7h8i9j0-k1l2-3456-ghij-kl7890123456",
      "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
      "email": "driver2@test.com",
      "role": "DRIVER",
      "status": "ACTIVE",
      "profile": {
        "id": "profile-007",
        "userId": "g7h8i9j0-k1l2-3456-ghij-kl7890123456",
        "tenantId": "797356c8-dcb6-48ab-9969-e0b373dde1ae",
        "firstName": "Emma",
        "lastName": "Davis",
        "companyName": null,
        "rating": 4.4,
        "totalTrips": 22,
        "kycStatus": "VERIFIED",
        "createdAt": "2024-01-28T10:30:00.000Z",
        "updatedAt": "2024-02-10T15:45:00.000Z"
      }
    }
  ],
  "total": 7
}
```

---

## 📊 Response Breakdown

### Response Structure
```typescript
{
  success: boolean;        // Operation success status
  message: string;         // Human-readable message
  data: User[];           // Array of user objects
  total: number;          // Total count of users
}
```

### User Object Structure
```typescript
{
  id: string;             // User ID (UUID)
  tenantId: string;       // Tenant ID (Company ID) - NOW INCLUDED!
  email: string;          // User email
  role: UserRole;         // User role enum
  status: UserStatus;     // User status enum
  profile: UserProfile;   // User profile object
}
```

### Profile Object Structure
```typescript
{
  id: string;             // Profile ID
  userId: string;         // Links to user
  tenantId: string;       // Links to tenant
  firstName: string;      // First name
  lastName: string;       // Last name
  companyName: string;    // Company name (optional)
  rating: number;         // User rating (0-5)
  totalTrips: number;     // Total trips completed
  kycStatus: string;      // KYC verification status
  createdAt: string;      // Creation timestamp
  updatedAt: string;      // Update timestamp
}
```

---

## 🔴 Error Responses

### 403 Forbidden (Access Denied)
```json
{
  "success": false,
  "message": "Access denied - you can only view users from your own tenant",
  "data": []
}
```

**When this happens:**
- User tries to access users from a different tenant
- User's `tenantId` doesn't match the requested `tenantId`
- Only SUPER_ADMIN can bypass this check

---

### 401 Unauthorized (No Token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**When this happens:**
- No Authorization header provided
- Invalid or expired JWT token

---

### 404 Not Found (Tenant Doesn't Exist)
```json
{
  "success": false,
  "message": "Tenant not found",
  "data": []
}
```

**When this happens:**
- The requested tenant ID doesn't exist in the database

---

## 📋 Key Points

### ✅ What's Included in Response:
1. **User ID** - Unique identifier for the user
2. **Tenant ID** - Company/Organization ID (NOW INCLUDED!)
3. **Email** - User's email address
4. **Role** - User's role (TENANT_ADMIN, CARGO_OWNER, etc.)
5. **Status** - User's status (ACTIVE, SUSPENDED, etc.)
6. **Profile** - Complete user profile with personal info

### 🔒 Security:
- ✅ Only returns users from the requested tenant
- ✅ TENANT_ADMIN can only view their own tenant's users
- ✅ SUPER_ADMIN can view any tenant's users
- ✅ JWT token required for authentication

### 📊 Pagination:
- `page=1` - First page
- `limit=10` - 10 users per page
- `total` field shows total count

---

## 🧪 Testing the Endpoint

### Using cURL:
```bash
curl -X GET \
  'http://localhost:3005/api/users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae?page=1&limit=10' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### Using Postman:
1. Method: GET
2. URL: `http://localhost:3005/api/users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae?page=1&limit=10`
3. Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`

### Using JavaScript (fetch):
```javascript
const response = await fetch(
  'http://localhost:3005/api/users/tenant/797356c8-dcb6-48ab-9969-e0b373dde1ae?page=1&limit=10',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data);
```

---

**Document Version:** 1.0  
**Last Updated:** February 12, 2026  
**Status:** Complete ✅
