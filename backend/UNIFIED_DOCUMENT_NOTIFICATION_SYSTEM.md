# Unified Document & Notification Management System

## 🎯 Overview

This document outlines the design of a unified document and notification management system that replaces separate document/notification entities for each role (driver, truck, cargo, etc.) with a single, flexible system that can handle all use cases.

## 🏗️ System Architecture

### **Core Principle: Polymorphic Association**
Instead of having separate tables like:
- `driver_documents`
- `truck_documents` 
- `cargo_documents`
- `user_documents`

We use a single `documents` table with:
- `entityType` - What type of entity owns this document
- `entityId` - The specific entity's UUID
- `documentType` - The specific type of document

### **Same Pattern for Notifications**
- Single `notifications` table
- `entityType` + `entityId` to link to any entity
- `notificationType` for specific notification types

## 📋 Document Entity Design

### **Key Fields**
```typescript
@Entity('documents')
export class Document {
  // Core identification
  id: string (UUID)
  tenantId: string (UUID)
  
  // Polymorphic association
  entityType: EntityType // DRIVER, TRUCK, CARGO, USER, etc.
  entityId: string (UUID) // The actual entity's ID
  
  // Document classification
  documentType: DocumentType // DRIVER_LICENSE, VEHICLE_REGISTRATION, etc.
  category: DocumentCategory // LICENSE, INSURANCE, CERTIFICATION, etc.
  
  // File information
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  
  // Status and workflow
  status: DocumentStatus // PENDING, VERIFIED, REJECTED, EXPIRED
  priority: DocumentPriority // LOW, NORMAL, HIGH, URGENT
  
  // Metadata
  title: string
  description: string
  tags: string[]
  metadata: Record<string, any>
  
  // Versioning
  versions: Array<DocumentVersion>
  currentVersion: number
  
  // Audit trail
  auditTrail: Array<AuditEntry>
  
  // Access control
  accessControl: Array<AccessControlEntry>
  
  // Compliance
  issueDate?: Date
  expiryDate?: Date
  requiresRenewal: boolean
  complianceInfo?: ComplianceInfo
  
  // OCR and digital features
  ocrData?: OCRData
  digitalSignature?: DigitalSignature
}
```

### **Entity Types Supported**
```typescript
enum EntityType {
  USER = 'USER',
  DRIVER = 'DRIVER',
  TRUCK = 'TRUCK',
  CARGO = 'CARGO',
  TRIP = 'TRIP',
  COMPANY = 'COMPANY',
  TENANT = 'TENANT',
  SYSTEM = 'SYSTEM',
  DOCUMENT = 'DOCUMENT',
  PAYMENT = 'PAYMENT',
  EXPENSE = 'EXPENSE'
}
```

### **Document Types (Examples)**
```typescript
enum DocumentType {
  // Driver documents
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  DRIVER_MEDICAL_CERT = 'DRIVER_MEDICAL_CERT',
  DRIVER_DRUG_TEST = 'DRIVER_DRUG_TEST',
  
  // Vehicle documents
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  VEHICLE_INSURANCE = 'VEHICLE_INSURANCE',
  VEHICLE_INSPECTION = 'VEHICLE_INSPECTION',
  
  // Cargo documents
  CARGO_MANIFEST = 'CARGO_MANIFEST',
  CARGO_INSURANCE = 'CARGO_INSURANCE',
  CARGO_CUSTOMS = 'CARGO_CUSTOMS',
  
  // Business documents
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  CONTRACT = 'CONTRACT',
  AGREEMENT = 'AGREEMENT'
}
```

## 🔔 Notification Entity Design

### **Key Fields**
```typescript
@Entity('notifications')
export class Notification {
  // Core identification
  id: string (UUID)
  tenantId: string (UUID)
  recipientId: string (UUID)
  
  // Polymorphic association
  entityType: EntityType
  entityId?: string (UUID)
  
  // Notification classification
  notificationType: NotificationType
  category: NotificationCategory
  priority: NotificationPriority
  
  // Content
  title: string
  message: string
  shortMessage?: string
  
  // Delivery
  channels: NotificationChannel[] // EMAIL, SMS, PUSH, IN_APP
  status: NotificationStatus // PENDING, SENT, DELIVERED, READ
  
  // Scheduling and expiry
  scheduledAt?: Date
  expiresAt?: Date
  
  // User preferences and analytics
  userPreferences: UserPreferences
  analytics: Analytics
  
  // Workflow and escalation
  workflowInfo?: WorkflowInfo
  escalationInfo?: EscalationInfo
}
```

### **Notification Types (Examples)**
```typescript
enum NotificationType {
  // Driver notifications
  DRIVER_ASSIGNMENT = 'DRIVER_ASSIGNMENT',
  DRIVER_TRIP_START = 'DRIVER_TRIP_START',
  DRIVER_SAFETY_ALERT = 'DRIVER_SAFETY_ALERT',
  
  // Vehicle notifications
  VEHICLE_MAINTENANCE_DUE = 'VEHICLE_MAINTENANCE_DUE',
  VEHICLE_INSPECTION_DUE = 'VEHICLE_INSPECTION_DUE',
  
  // Cargo notifications
  CARGO_PICKUP_REMINDER = 'CARGO_PICKUP_REMINDER',
  CARGO_DELIVERY_UPDATE = 'CARGO_DELIVERY_UPDATE',
  
  // System notifications
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE'
}
```

## 🚀 Benefits of Unified System

### **1. Eliminates Duplication**
- **Before**: 8 separate document tables with similar schemas
- **After**: 1 document table handling all entities
- **Result**: 70% reduction in database tables and code duplication

### **2. Consistent API**
```typescript
// Single service for all document operations
documentService.createDocument(createDto, uploadedBy, tenantId);
documentService.getDocumentsByEntity('DRIVER', driverId, tenantId);
documentService.getDocumentsByEntity('TRUCK', truckId, tenantId);
documentService.getDocumentsByEntity('CARGO', cargoId, tenantId);
```

### **3. Unified Search & Reporting**
```typescript
// Search across all document types
documentService.searchDocuments({
  query: 'license',
  entityTypes: ['DRIVER', 'TRUCK'],
  categories: ['LICENSE', 'INSURANCE']
}, tenantId);

// Get compliance overview
documentService.getDocumentsExpiringSoon(30, tenantId);
documentService.getDocumentStatistics(tenantId);
```

### **4. Centralized Workflow**
- Single verification process for all documents
- Unified audit trail
- Centralized access control
- Consistent notification system

### **5. Easier Maintenance**
- One place to update document logic
- Single point for compliance rules
- Unified backup and archival processes

## 🔧 Implementation Examples

### **Creating a Driver License Document**
```typescript
const driverLicense = await documentService.createDocument({
  entityType: EntityType.DRIVER,
  entityId: driverId,
  documentType: DocumentType.DRIVER_LICENSE,
  category: DocumentCategory.LICENSE,
  title: 'Commercial Driver License',
  description: 'CDL Class A license for John Doe',
  fileName: 'john_doe_cdl.pdf',
  fileSize: 2048576,
  mimeType: 'application/pdf',
  expiryDate: new Date('2025-12-31'),
  requiresRenewal: true,
  tags: ['license', 'driver', 'cdl'],
  sendNotification: true
}, uploadedBy, tenantId);
```

### **Creating a Vehicle Registration Notification**
```typescript
const vehicleNotification = await notificationService.createNotification({
  recipientId: truckOwnerId,
  notificationType: NotificationType.VEHICLE_REGISTRATION_EXPIRY,
  category: NotificationCategory.VEHICLE,
  title: 'Vehicle Registration Expiring Soon',
  message: 'Your truck registration expires in 30 days. Please renew to avoid penalties.',
  entityType: EntityType.TRUCK,
  entityId: truckId,
  priority: NotificationPriority.HIGH,
  channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  scheduledAt: new Date(),
  requiresAction: true,
  actionUrl: '/vehicles/renew-registration',
  actionText: 'Renew Now'
});
```

### **Querying Documents by Entity**
```typescript
// Get all documents for a driver
const driverDocuments = await documentService.getDocumentsByEntity(
  EntityType.DRIVER, 
  driverId, 
  tenantId
);

// Get all documents for a truck
const truckDocuments = await documentService.getDocumentsByEntity(
  EntityType.TRUCK, 
  truckId, 
  tenantId
);

// Get all documents for a cargo shipment
const cargoDocuments = await documentService.getDocumentsByEntity(
  EntityType.CARGO, 
  cargoId, 
  tenantId
);
```

### **Advanced Filtering**
```typescript
// Get all expiring licenses across all entities
const expiringLicenses = await documentService.getDocuments({
  category: DocumentCategory.LICENSE,
  isExpired: false,
  expiresBefore: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  status: DocumentStatus.VERIFIED
}, tenantId);

// Get all high-priority documents for a specific entity
const highPriorityDocs = await documentService.getDocuments({
  entityType: EntityType.DRIVER,
  entityId: driverId,
  priority: DocumentPriority.HIGH,
  status: DocumentStatus.PENDING
}, tenantId);
```

## 📊 Database Schema Benefits

### **Before (Separate Tables)**
```sql
-- 8 separate tables with similar schemas
CREATE TABLE driver_documents (...);
CREATE TABLE truck_documents (...);
CREATE TABLE cargo_documents (...);
CREATE TABLE user_documents (...);
CREATE TABLE company_documents (...);
CREATE TABLE trip_documents (...);
CREATE TABLE payment_documents (...);
CREATE TABLE expense_documents (...);

-- Each table needs its own indexes
CREATE INDEX idx_driver_documents_driver_id ON driver_documents(driver_id);
CREATE INDEX idx_truck_documents_truck_id ON truck_documents(truck_id);
-- ... 6 more similar indexes
```

### **After (Unified Table)**
```sql
-- Single table with polymorphic association
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id UUID NOT NULL,
  -- ... other fields
);

-- Efficient composite indexes
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_type_status ON documents(document_type, status);
CREATE INDEX idx_documents_category_priority ON documents(category, priority);
CREATE INDEX idx_documents_expiry ON documents(expiry_date, status);
```

## 🔍 Search and Analytics

### **Full-Text Search Across All Documents**
```typescript
// Search for "license" across all document types
const licenseDocs = await documentService.searchDocuments({
  query: 'license',
  limit: 50
}, tenantId);

// Results include:
// - Driver licenses
// - Vehicle licenses  
// - Business licenses
// - Any document containing "license"
```

### **Compliance Analytics**
```typescript
const complianceStats = await documentService.getDocumentStatistics(tenantId);

// Returns:
{
  total: 1250,
  verified: 980,
  expired: 45,
  pending: 225,
  breakdown: [
    { status: 'VERIFIED', category: 'LICENSE', count: 156 },
    { status: 'VERIFIED', category: 'INSURANCE', count: 89 },
    { status: 'PENDING', category: 'LICENSE', count: 23 },
    // ... more breakdowns
  ]
}
```

### **Expiry Monitoring**
```typescript
// Get all documents expiring in next 30 days
const expiringDocs = await documentService.getDocumentsExpiringSoon(30, tenantId);

// Group by entity type for targeted notifications
const expiringByEntity = expiringDocs.reduce((acc, doc) => {
  if (!acc[doc.entityType]) acc[doc.entityType] = [];
  acc[doc.entityType].push(doc);
  return acc;
}, {});

// Send targeted notifications
for (const [entityType, documents] of Object.entries(expiringByEntity)) {
  await notificationService.sendExpiryNotifications(entityType, documents);
}
```

## 🛡️ Security and Access Control

### **Role-Based Access Control**
```typescript
// Document access control
const accessControl = [
  {
    role: 'DRIVER',
    permissions: ['READ', 'UPDATE_OWN'],
    grantedAt: new Date(),
    grantedBy: adminId
  },
  {
    role: 'FLEET_MANAGER', 
    permissions: ['READ', 'UPDATE', 'VERIFY'],
    grantedAt: new Date(),
    grantedBy: adminId
  },
  {
    role: 'ADMIN',
    permissions: ['READ', 'UPDATE', 'VERIFY', 'DELETE'],
    grantedAt: new Date(),
    grantedBy: systemId
  }
];
```

### **Audit Trail**
```typescript
// Every action is logged
const auditTrail = [
  {
    action: 'CREATED',
    performedBy: userId,
    performedAt: new Date(),
    details: { method: 'upload', ipAddress: '192.168.1.100' }
  },
  {
    action: 'VERIFIED',
    performedBy: managerId,
    performedAt: new Date(),
    details: { method: 'verification', notes: 'All checks passed' }
  }
];
```

## 🔄 Migration Strategy

### **Phase 1: Create New Unified Tables**
```sql
-- Create new unified tables
CREATE TABLE documents (...);
CREATE TABLE notifications (...);

-- Keep existing tables during transition
-- (driver_documents, truck_documents, etc.)
```

### **Phase 2: Data Migration**
```typescript
// Migrate existing data
await migrateDriverDocuments();
await migrateTruckDocuments();
await migrateCargoDocuments();
// ... etc.
```

### **Phase 3: Update Application Code**
```typescript
// Replace specific service calls
// OLD: driverDocumentService.createDocument(...)
// NEW: documentService.createDocument({ entityType: 'DRIVER', ... })

// Replace specific queries
// OLD: driverDocumentRepository.findByDriverId(driverId)
// NEW: documentRepository.findByEntity('DRIVER', driverId)
```

### **Phase 4: Remove Old Tables**
```sql
-- After verification, drop old tables
DROP TABLE driver_documents;
DROP TABLE truck_documents;
DROP TABLE cargo_documents;
-- ... etc.
```

## 📈 Performance Considerations

### **Indexing Strategy**
```sql
-- Primary indexes for common queries
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);

-- Composite indexes for complex queries
CREATE INDEX idx_documents_type_status_priority ON documents(document_type, status, priority);
CREATE INDEX idx_documents_category_expiry ON documents(category, expiry_date);

-- Full-text search index
CREATE INDEX idx_documents_search ON documents USING gin(to_tsvector('english', title || ' ' || description));
```

### **Partitioning Strategy**
```sql
-- Partition by entity_type for large datasets
CREATE TABLE documents_driver PARTITION OF documents FOR VALUES IN ('DRIVER');
CREATE TABLE documents_truck PARTITION OF documents FOR VALUES IN ('TRUCK');
CREATE TABLE documents_cargo PARTITION OF documents FOR VALUES IN ('CARGO');
```

## 🎯 Future Enhancements

### **1. AI-Powered Document Processing**
- Automatic document classification
- OCR text extraction
- Compliance validation
- Expiry prediction

### **2. Advanced Workflow Engine**
- Multi-step approval processes
- Conditional routing
- SLA monitoring
- Escalation rules

### **3. Integration Capabilities**
- External document systems
- E-signature integration
- Cloud storage providers
- Regulatory compliance APIs

### **4. Advanced Analytics**
- Document lifecycle analysis
- Compliance risk scoring
- Renewal prediction models
- Cost optimization insights

## 🏁 Conclusion

The unified document and notification management system provides:

1. **Scalability**: Easy to add new entity types without schema changes
2. **Maintainability**: Single codebase for all document operations
3. **Consistency**: Uniform API and behavior across all entities
4. **Efficiency**: Reduced database complexity and improved query performance
5. **Flexibility**: Easy to implement new document types and workflows
6. **Compliance**: Centralized audit trail and verification processes

This approach eliminates the need for separate document/notification systems for each role while maintaining all the functionality and adding powerful new capabilities for search, analytics, and workflow management.
