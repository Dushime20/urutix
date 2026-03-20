# Unified Document and Notification Management System - API Documentation

## Overview

The Unified Document and Notification Management System provides a centralized, polymorphic approach to managing all documents and notifications across the Cargo AI Matching platform. This system eliminates duplication, provides consistent APIs, and enables unified search and reporting capabilities.

## System Architecture

### Core Entities

1. **Document Entity** - Manages all types of documents (driver licenses, vehicle registrations, cargo manifests, etc.)
2. **Notification Entity** - Handles all types of notifications (emails, SMS, push notifications, webhooks, etc.)

### Polymorphic Association

Both entities use a polymorphic association pattern:
- `entityType`: The type of entity (USER, DRIVER, TRUCK, CARGO, TRIP, etc.)
- `entityId`: The UUID of the specific entity instance

## API Endpoints

### Document Management

#### Base URL: `/api/documents`

#### 1. Create Document
- **POST** `/`
- **Description**: Upload and create a new document
- **Content-Type**: `multipart/form-data`
- **Authentication**: Required (JWT + Role-based access)
- **File Upload**: Supports various file types (PDF, images, documents)

**Request Body**:
```json
{
  "entityType": "DRIVER",
  "entityId": "uuid",
  "documentType": "DRIVERS_LICENSE",
  "category": "DRIVER",
  "title": "Driver License - John Doe",
  "description": "Valid driver license for John Doe",
  "documentNumber": "DL123456789",
  "issueDate": "2024-01-01",
  "expiryDate": "2029-01-01",
  "priority": "HIGH",
  "tags": ["license", "driver", "compliance"],
  "metadata": {
    "licenseClass": "CDL-A",
    "state": "CA"
  },
  "sendNotification": true
}
```

**Response**:
```json
{
  "id": "uuid",
  "fileName": "generated_filename.pdf",
  "fileUrl": "https://api.example.com/uploads/documents/filename.pdf",
  "thumbnailUrl": "https://api.example.com/uploads/documents/thumbnails/filename.jpg",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Documents (with filtering)
- **GET** `/`
- **Description**: Retrieve documents with advanced filtering, sorting, and pagination
- **Authentication**: Required

**Query Parameters**:
- `entityType`: Filter by entity type
- `entityId`: Filter by specific entity
- `documentType`: Filter by document type
- `category`: Filter by category
- `status`: Filter by status
- `priority`: Filter by priority
- `search`: Full-text search
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response**:
```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Driver License - John Doe",
      "documentType": "DRIVERS_LICENSE",
      "status": "VERIFIED",
      "priority": "HIGH",
      "expiryDate": "2029-01-01",
      "isExpired": false,
      "requiresRenewal": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

#### 3. Search Documents
- **GET** `/search`
- **Description**: Full-text search across document fields with relevance scoring
- **Authentication**: Required

**Query Parameters**:
- `query`: Search query string
- `entityTypes`: Array of entity types to search in
- `categories`: Array of categories to search in
- `limit`: Maximum results (default: 50, max: 100)

#### 4. Get Documents by Entity
- **GET** `/entity/:entityType/:entityId`
- **Description**: Retrieve all documents for a specific entity
- **Authentication**: Required

#### 5. Get Document by ID
- **GET** `/:id`
- **Description**: Retrieve a specific document by ID
- **Authentication**: Required

#### 6. Update Document
- **PUT** `/:id`
- **Description**: Update document details and optionally re-upload file
- **Authentication**: Required
- **Content-Type**: `multipart/form-data` (if file re-upload)

#### 7. Verify Document
- **POST** `/:id/verify`
- **Description**: Mark a document as verified
- **Authentication**: Required (Admin roles)

#### 8. Reject Document
- **POST** `/:id/reject`
- **Description**: Mark a document as rejected with reason
- **Authentication**: Required (Admin roles)

#### 9. Archive Document
- **POST** `/:id/archive`
- **Description**: Archive a document (soft delete)
- **Authentication**: Required

#### 10. Delete Document
- **DELETE** `/:id`
- **Description**: Permanently delete a document (soft delete)
- **Authentication**: Required

#### 11. Bulk Operations
- **POST** `/bulk/status`
- **Description**: Bulk update status of multiple documents
- **Authentication**: Required (Admin roles)

### Notification Management

#### Base URL: `/api/notifications`

#### 1. Create Notification
- **POST** `/`
- **Description**: Create and send a notification through specified channels
- **Authentication**: Required

**Request Body**:
```json
{
  "recipientId": "uuid",
  "recipientEmail": "driver@example.com",
  "recipientPhone": "+1234567890",
  "entityType": "TRIP",
  "entityId": "uuid",
  "notificationType": "DRIVER_ASSIGNMENT",
  "category": "DRIVER",
  "title": "New Trip Assignment",
  "message": "You have been assigned to a new trip from New York to Los Angeles",
  "shortMessage": "New trip assignment",
  "channels": ["EMAIL", "SMS", "PUSH"],
  "priority": "HIGH",
  "requiresAction": true,
  "actionUrl": "/trips/123",
  "actionText": "View Trip Details",
  "scheduledAt": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Notifications (with filtering)
- **GET** `/`
- **Description**: Retrieve notifications with advanced filtering and pagination
- **Authentication**: Required

**Query Parameters**:
- `recipientId`: Filter by recipient
- `entityType`: Filter by entity type
- `entityId`: Filter by specific entity
- `notificationType`: Filter by notification type
- `category`: Filter by category
- `status`: Filter by status
- `priority`: Filter by priority
- `isRead`: Filter by read status
- `requiresAction`: Filter by action requirement
- `search`: Full-text search
- `page`: Page number
- `limit`: Items per page

#### 3. Search Notifications
- **GET** `/search`
- **Description**: Full-text search across notification fields
- **Authentication**: Required

#### 4. Get User Notifications
- **GET** `/my`
- **Description**: Get notifications for the current user
- **Authentication**: Required

#### 5. Get Unread Count
- **GET** `/my/unread-count`
- **Description**: Get count of unread notifications for current user
- **Authentication**: Required

#### 6. Get Notifications by Entity
- **GET** `/entity/:entityType/:entityId`
- **Description**: Get all notifications for a specific entity
- **Authentication**: Required

#### 7. Get Scheduled Notifications
- **GET** `/scheduled`
- **Description**: Get all scheduled notifications (Admin only)
- **Authentication**: Required (Admin roles)

#### 8. Get Expired Notifications
- **GET** `/expired`
- **Description**: Get all expired notifications (Admin only)
- **Authentication**: Required (Admin roles)

#### 9. Update Notification
- **PUT** `/:id`
- **Description**: Update notification details
- **Authentication**: Required

#### 10. Mark as Read
- **POST** `/:id/read`
- **Description**: Mark notification as read
- **Authentication**: Required

#### 11. Bulk Mark as Read
- **POST** `/bulk/read`
- **Description**: Mark multiple notifications as read
- **Authentication**: Required

#### 12. Delete Notification
- **DELETE** `/:id`
- **Description**: Delete a notification (Admin only)
- **Authentication**: Required (Admin roles)

#### 13. Process Scheduled Notifications
- **POST** `/process-scheduled`
- **Description**: Process all scheduled notifications (Admin only)
- **Authentication**: Required (Admin roles)

#### 14. Cleanup Expired Notifications
- **POST** `/cleanup-expired`
- **Description**: Clean up expired notifications (Admin only)
- **Authentication**: Required (Admin roles)

#### 15. Test Notification Channel
- **POST** `/test/:channel`
- **Description**: Test a specific notification channel (Admin only)
- **Authentication**: Required (Admin roles)

## Data Models

### Document Entity

```typescript
interface Document {
  id: string;
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  documentType: DocumentType;
  category: DocumentCategory;
  status: DocumentStatus;
  priority: DocumentPriority;
  documentNumber?: string;
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  issueDate?: Date;
  expiryDate?: Date;
  isExpired: boolean;
  requiresRenewal: boolean;
  renewalReminderDays: number;
  metadata: Record<string, any>;
  tags: string[];
  verificationData: Record<string, any>;
  versions: DocumentVersion[];
  currentVersion: number;
  accessControl: Record<string, any>;
  auditTrail: AuditTrailEntry[];
  isPublic: boolean;
  isConfidential: boolean;
  encryptionKey?: string;
  ocrData: Record<string, any>;
  digitalSignature?: string;
  complianceInfo: Record<string, any>;
  workflowInfo: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deleted_at?: Date;
}
```

### Notification Entity

```typescript
interface Notification {
  id: string;
  tenantId: string;
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientDeviceTokens: string[];
  entityType?: EntityType;
  entityId?: string;
  notificationType: NotificationType;
  category: NotificationCategory;
  status: NotificationStatus;
  priority: NotificationPriority;
  title: string;
  message: string;
  shortMessage?: string;
  channels: NotificationChannel[];
  channelData: Record<string, any>;
  tags: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  expiresAt?: Date;
  requiresAction: boolean;
  actionUrl?: string;
  actionText?: string;
  actionData: Record<string, any>;
  attachments: NotificationAttachment[];
  deliveryAttempts: DeliveryAttempt[];
  userPreferences: Record<string, any>;
  analytics: Record<string, any>;
  relatedNotifications: string[];
  workflowInfo: Record<string, any>;
  escalationInfo: Record<string, any>;
  complianceInfo: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deleted_at?: Date;
}
```

## Enums

### Document Types
- `DRIVERS_LICENSE` - Driver's license
- `VEHICLE_REGISTRATION` - Vehicle registration
- `INSURANCE_CERTIFICATE` - Insurance certificate
- `CARGO_MANIFEST` - Cargo manifest
- `BILL_OF_LADING` - Bill of lading
- `INVOICE` - Invoice
- `CONTRACT` - Contract
- `COMPLIANCE_DOCUMENT` - Compliance document
- `OTHER` - Other document types

### Document Categories
- `DRIVER` - Driver-related documents
- `VEHICLE` - Vehicle-related documents
- `CARGO` - Cargo-related documents
- `BUSINESS` - Business documents
- `USER` - User-related documents
- `TRIP` - Trip-related documents
- `FINANCIAL` - Financial documents
- `COMPLIANCE` - Compliance documents
- `OTHER` - Other categories

### Document Status
- `DRAFT` - Document in draft state
- `PENDING` - Document pending verification
- `VERIFIED` - Document verified
- `REJECTED` - Document rejected
- `EXPIRED` - Document expired
- `ARCHIVED` - Document archived
- `DELETED` - Document deleted

### Notification Types
- `DRIVER_ASSIGNMENT` - Driver trip assignment
- `VEHICLE_MAINTENANCE_DUE` - Vehicle maintenance reminder
- `DOCUMENT_EXPIRY` - Document expiry warning
- `TRIP_UPDATE` - Trip status update
- `PAYMENT_RECEIVED` - Payment confirmation
- `SYSTEM_UPDATE` - System maintenance/update
- `SECURITY_ALERT` - Security alert
- `COMPLIANCE_REMINDER` - Compliance reminder

### Notification Channels
- `EMAIL` - Email notification
- `SMS` - SMS notification
- `PUSH` - Push notification
- `WEBHOOK` - Webhook notification
- `IN_APP` - In-app notification
- `SLACK` - Slack notification
- `TEAMS` - Microsoft Teams notification

## Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Tenant isolation
- Resource ownership validation

### File Security
- Secure file upload with validation
- File type and size restrictions
- Virus scanning (can be integrated)
- Encryption support for sensitive documents
- Access control based on user permissions

### Audit Trail
- Complete audit trail for all operations
- User action tracking
- Document version history
- Access log maintenance

## Performance Considerations

### Database Indexing
- Composite indexes on frequently queried fields
- Partial indexes for soft-deleted records
- Full-text search indexes
- Spatial indexes for location-based queries

### Caching Strategy
- Redis caching for frequently accessed documents
- CDN integration for file delivery
- Query result caching
- User preference caching

### File Storage
- Local file system (development)
- Cloud storage integration (production)
- Thumbnail generation
- File compression for large documents

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity
- `500` - Internal Server Error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Rate Limiting

- API rate limiting per user/IP
- File upload size limits
- Concurrent request limits
- Burst request handling

## Monitoring & Analytics

### Metrics Tracked
- API response times
- File upload success rates
- Notification delivery rates
- User engagement metrics
- Storage usage statistics

### Logging
- Structured logging with correlation IDs
- Error tracking and alerting
- Performance monitoring
- Security event logging

## Integration Examples

### Creating a Driver Document
```typescript
// Frontend example
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('entityType', 'DRIVER');
formData.append('entityId', driverId);
formData.append('documentType', 'DRIVERS_LICENSE');
formData.append('category', 'DRIVER');
formData.append('title', 'Driver License - John Doe');
formData.append('priority', 'HIGH');

const response = await fetch('/api/documents', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Sending a Trip Notification
```typescript
// Backend service example
const notification = await this.notificationService.createNotification({
  recipientId: driverId,
  entityType: 'TRIP',
  entityId: tripId,
  notificationType: 'TRIP_UPDATE',
  category: 'TRIP',
  title: 'Trip Status Updated',
  message: `Your trip to ${destination} has been updated to ${status}`,
  channels: ['EMAIL', 'PUSH'],
  priority: 'NORMAL'
});
```

## Migration Guide

### From Legacy Systems
1. **Phase 1**: Deploy new unified system alongside existing
2. **Phase 2**: Migrate data from legacy tables
3. **Phase 3**: Update frontend to use new APIs
4. **Phase 4**: Remove legacy tables and code

### Data Migration Scripts
- Document migration utilities
- Notification migration utilities
- Data validation scripts
- Rollback procedures

## Future Enhancements

### AI Integration
- Document OCR and text extraction
- Intelligent document classification
- Automated compliance checking
- Smart notification routing

### Advanced Workflows
- Multi-step approval processes
- Conditional notifications
- Escalation procedures
- SLA monitoring

### Integrations
- Third-party document providers
- Electronic signature services
- Compliance monitoring systems
- Business intelligence tools

## Support & Maintenance

### Troubleshooting
- Common error scenarios
- Debug logging configuration
- Performance optimization tips
- Security best practices

### Maintenance Tasks
- Database cleanup procedures
- File storage maintenance
- Index optimization
- Cache invalidation

---

This unified system provides a robust, scalable foundation for managing all documents and notifications across the Cargo AI Matching platform, with comprehensive APIs, security features, and monitoring capabilities.
