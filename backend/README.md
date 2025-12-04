# UrutiX Backend - Comprehensive Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Schema & Relationships](#database-schema--relationships)
4. [Module Structure](#module-structure)
5. [Business Logic Flow](#business-logic-flow)
6. [Migrations](#migrations)
7. [API Endpoints](#api-endpoints)
8. [Key Features](#key-features)
9. [Development Setup](#development-setup)

---

## 🎯 Project Overview

**UrutiX** is a comprehensive freight and logistics management platform that connects cargo owners with truck owners through an intelligent matching and bidding system. The backend is built with **NestJS** (TypeScript) and uses **PostgreSQL** as the primary database with **TypeORM** for database management.

### Core Purpose
- **Cargo Management**: Cargo owners can create, publish, and manage loads
- **Fleet Management**: Truck owners can manage their fleet and bid on loads
- **Intelligent Matching**: AI-powered algorithm matches loads with suitable trucks
- **Auction System**: Multiple auction types (Reverse, Forward, Dutch, Sealed) for load allocation
- **Trip Tracking**: Real-time GPS tracking and trip management
- **Financial Management**: Invoicing, payments, expenses, and lending
- **Document Management**: Comprehensive document storage and verification
- **Safety & Compliance**: Safety incidents, inspections, and training tracking

---

## 🏗️ Architecture

### Technology Stack
- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL (with PostGIS for geospatial data)
- **ORM**: TypeORM 0.3.x
- **Authentication**: JWT with Passport
- **Real-time**: WebSocket (Socket.IO)
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **OCR**: Tesseract.js
- **PDF Processing**: pdf-parse, pdfjs-dist

### Architecture Pattern
- **Modular Architecture**: Feature-based modules
- **Multi-tenant**: Tenant isolation at database level
- **RESTful API**: Standard REST endpoints
- **WebSocket**: Real-time updates for tracking
- **Event-Driven**: Event emitter for decoupled communication

---

## 🗄️ Database Schema & Relationships

### Core Entity Relationships

```
Tenant (1) ──< (Many) User
User (1) ──< (1) UserProfile
User (1) ──< (Many) Load (as cargoOwner)
User (1) ──< (Many) Truck (as owner)
User (1) ──< (Many) Bid (as truckOwner)

Load (1) ──< (Many) Trip
Load (1) ──< (1) Auction
Load (1) ──< (Many) Bid

Truck (1) ──< (Many) Trip
Driver (1) ──< (Many) Trip

Trip (1) ──< (Many) TripLocation
Trip (1) ──< (Many) TripEvent
Trip (1) ──< (Many) DriverAlert

LoanRequest (Many) ──> (1) Lender
LoanRequest (Many) ──> (1) Borrower
LoanRequest (1) ──< (Many) LoanDisbursement
LoanRequest (1) ──< (Many) LoanRepayment

Document (Many) ──> (1) Entity (User/Driver/Truck/Cargo/Trip)
Notification (Many) ──> (1) User (recipient)
```

### Key Tables

#### 1. **Users & Authentication**
- **users**: Core user accounts with roles (SUPER_ADMIN, ADMIN, TENANT_ADMIN, CARGO_OWNER, TRUCK_OWNER, DRIVER, LENDER)
- **user_profiles**: Extended user information (KYC, ratings, company details)
- **refresh_tokens**: JWT refresh token management
- **password_reset_tokens**: Password reset functionality
- **email_verification_tokens**: Email verification

#### 2. **Tenant Management**
- **tenants**: Multi-tenant organization structure
  - Types: ENTERPRISE, SMALL_BUSINESS, INDIVIDUAL, PARTNER
  - Status: ACTIVE, SUSPENDED, PENDING_ACTIVATION, DEACTIVATED
  - Subscription management and feature flags

#### 3. **Cargo & Loads**
- **loads**: Cargo shipment requests
  - Status: DRAFT → CREATED → PUBLISHED → ASSIGNED → IN_TRANSIT → DELIVERED → CLOSED
  - Types: FTL, LTL, REEFER, FLATBED, TANKER, INTERMODAL
  - Cargo types: GENERAL, FRAGILE, HAZARDOUS, REFRIGERATED, LIQUID, OVERSIZED, VALUABLE
  - Multi-location support (pickup, delivery, stops)
  - Advanced matching criteria and truck requirements

#### 4. **Fleet Management**
- **trucks**: Vehicle information
  - Status: AVAILABLE, IN_TRANSIT, MAINTENANCE, OUT_OF_SERVICE
  - Extensive capability flags (hazmat, refrigeration, equipment)
  - JSONB fields for cargo capabilities, loading capabilities, security features
  - Cost structure and route capabilities
  - Maintenance and compliance alerts

- **drivers**: Driver profiles
  - License information and certifications
  - Employment type (FULL_TIME, PART_TIME, CONTRACTOR, OWNER_OPERATOR)
  - Current trip and truck assignment
  - Safety records

#### 5. **Bidding & Auctions**
- **auctions**: Auction management
  - Types: REVERSE, FORWARD, DUTCH, SEALED
  - Status: SCHEDULED → ACTIVE → CLOSED
  - Reserve pricing, bid increments, analytics

- **bids**: Individual bids on loads
  - Status: PENDING → ACCEPTED/REJECTED/WITHDRAWN/EXPIRED
  - Bid details (truck specs, driver info, route optimization)
  - Risk assessment and success probability
  - Market context analysis

- **auction_views**: Track auction viewership
- **auction_watches**: Users watching auctions

#### 6. **Trips & Tracking**
- **trips**: Active and completed trips
  - Status: PLANNED → IN_PROGRESS → COMPLETED/CANCELLED/DELAYED
  - Links Load, Truck, and Driver
  - Financial tracking (agreed price, costs, profit margin)
  - Performance metrics (fuel efficiency, on-time performance)

- **trip_locations**: GPS tracking points
- **trip_events**: Significant trip events
- **driver_alerts**: Safety and compliance alerts
- **geofences**: Virtual boundaries for tracking

#### 7. **Financial Management**
- **payments**: Payment transactions
- **invoices**: Invoice generation and management
- **expenses**: Expense tracking
- **financial_reports**: Financial reporting
- **budgets**: Budget management
- **tax_records**: Tax record keeping

#### 8. **Lending System**
- **lenders**: Financial institutions offering loans
- **lender_policies**: Lending policies and terms
- **borrowers**: Loan applicants
- **loan_requests**: Loan applications
  - Status: pending → approved → disbursed → repaid → defaulted
- **loan_disbursements**: Loan disbursement records
- **loan_repayments**: Repayment tracking

#### 9. **Documents**
- **documents**: Unified document management
  - Types: DRIVER_LICENSE, VEHICLE_REGISTRATION, CARGO_MANIFEST, etc.
  - Status: PENDING → VERIFIED → REJECTED/EXPIRED
  - Version control and audit trail
  - OCR data extraction
  - Expiry tracking and renewal reminders

#### 10. **Notifications**
- **notifications**: Multi-channel notification system
  - Channels: IN_APP, EMAIL, SMS, PUSH, WEBHOOK
  - Types: System, User, Driver, Vehicle, Cargo, Trip, Financial, Compliance
  - Priority levels: LOW, NORMAL, HIGH, URGENT, CRITICAL
  - Delivery tracking and analytics

#### 11. **Safety & Compliance**
- **safety_incidents**: Safety incident reporting
- **safety_inspections**: Vehicle/driver inspections
- **safety_trainings**: Training records

#### 12. **Ratings & Rewards**
- **user_ratings**: User rating system
- **user_rewards**: Reward points and achievements
- **user_scores**: Performance scoring

#### 13. **Audit & Logging**
- **audit_logs**: System audit trail
- **audit_events**: Event logging

---

## 📦 Module Structure

### Core Modules

#### 1. **Auth Module** (`modules/auth/`)
- **Enhanced Authentication**: JWT-based authentication with refresh tokens
- **Multi-tenant Support**: Tenant isolation middleware
- **Role-based Access Control**: Guards for different user roles
- **Email Verification**: Email verification flow
- **Password Reset**: Secure password reset mechanism
- **Rate Limiting**: Protection against brute force attacks

#### 2. **Loads Module** (`modules/loads/`)
- **Load Management**: CRUD operations for loads
- **Load Matching**: Automatic matching with trucks
- **Load Templates**: Reusable load templates
- **Status Workflow**: Load status transitions
- **Location Management**: Multi-location support

#### 3. **Fleet Module** (`modules/fleet/`)
- **Truck Management**: Fleet registration and management
- **Driver Management**: Driver profiles and assignments
- **Maintenance Tracking**: Maintenance schedules and alerts
- **Compliance Monitoring**: Document expiry tracking
- **Fleet Analytics**: Performance metrics

#### 4. **Matching Module** (`modules/matching/`)
- **AI Matching Engine**: Intelligent load-truck matching
- **Multiple Algorithms**: 
  - Weighted Scoring
  - Hungarian Algorithm
  - Genetic Algorithm
  - TOPSIS
  - Hybrid Algorithm
- **Route Optimization**: Optimal route calculation
- **ML Predictions**: Success probability prediction
- **Market Intelligence**: Market condition analysis

#### 5. **Bidding Module** (`modules/bidding/`)
- **Auction Management**: Create and manage auctions
- **Bid Submission**: Submit and manage bids
- **Bid Analytics**: Market analysis and insights
- **Risk Assessment**: Bid risk evaluation
- **Counter-offers**: Negotiation support

#### 6. **Tracking Module** (`modules/tracking/`)
- **Real-time GPS Tracking**: WebSocket-based location updates
- **Trip Monitoring**: Trip status and progress
- **Geofencing**: Virtual boundary alerts
- **Driver Alerts**: Safety and compliance alerts
- **Route Optimization**: Real-time route adjustments

#### 7. **Trips Module** (`modules/trips/`)
- **Trip Management**: Create and manage trips
- **Status Updates**: Trip status transitions
- **Performance Tracking**: Metrics and analytics
- **Completion Handling**: Trip completion workflow

#### 8. **Financial Module** (`modules/financial/`)
- **Invoice Management**: Generate and manage invoices
- **Payment Processing**: Payment tracking
- **Expense Management**: Expense recording
- **Financial Reports**: Reporting and analytics
- **Budget Management**: Budget planning and tracking

#### 9. **Lending Module** (`modules/lending/`)
- **Loan Requests**: Loan application management
- **Lender Management**: Lender profiles and policies
- **Disbursement**: Loan disbursement processing
- **Repayment Tracking**: Repayment management
- **Risk Assessment**: Credit evaluation

#### 10. **Insurance Module** (`modules/insurance/`)
- **Policy Management**: Insurance policy tracking
- **Claims Processing**: Insurance claim management
- **Renewal Tracking**: Policy renewal reminders

#### 11. **Document Module** (`modules/documents/`)
- **Document Upload**: File upload and storage
- **Document Verification**: Verification workflow
- **Version Control**: Document versioning
- **OCR Processing**: Text extraction from documents
- **Expiry Management**: Expiry tracking and alerts

#### 12. **Notification Module** (`modules/notifications/`)
- **Multi-channel Notifications**: Email, SMS, Push, In-app
- **Notification Templates**: Template management
- **Delivery Tracking**: Delivery status tracking
- **User Preferences**: Notification preferences
- **Scheduling**: Scheduled notifications

#### 13. **OCR Module** (`modules/ocr/`)
- **Document OCR**: Text extraction from images/PDFs
- **Data Extraction**: Structured data extraction
- **Verification**: Document verification using OCR

#### 14. **Safety Module** (`modules/safety/`)
- **Incident Reporting**: Safety incident management
- **Inspections**: Inspection scheduling and tracking
- **Training**: Training record management

#### 15. **Admin Module** (`modules/admin/`)
- **System Administration**: System-wide management
- **User Management**: User administration
- **Tenant Management**: Tenant administration
- **Analytics**: System analytics

#### 16. **Analytics Module** (`modules/analytics/`)
- **Business Analytics**: Business intelligence
- **Performance Metrics**: KPI tracking
- **Reporting**: Custom reports

---

## 🔄 Business Logic Flow

### 1. Load Lifecycle

```
1. Cargo Owner creates Load (DRAFT)
   ↓
2. Load details filled (pickup, delivery, cargo specs)
   ↓
3. Load published (PUBLISHED)
   ↓
4a. Auto-matching finds suitable trucks
   OR
4b. Auction created for bidding
   ↓
5. Truck Owner bids or accepts match
   ↓
6. Cargo Owner accepts bid/match (ASSIGNED)
   ↓
7. Trip created and started (IN_TRANSIT)
   ↓
8. Real-time tracking during transit
   ↓
9. Delivery completed (DELIVERED)
   ↓
10. Payment processed and load closed (CLOSED)
```

### 2. Matching Algorithm Flow

```
1. Load published with requirements
   ↓
2. System queries available trucks
   ↓
3. Filters by:
   - Availability status
   - Location proximity
   - Capacity (weight/volume)
   - Equipment requirements
   - Certifications
   ↓
4. Scoring algorithm applied:
   - Capacity match (30%)
   - Location proximity (20%)
   - Equipment compatibility (20%)
   - Historical performance (15%)
   - Price competitiveness (10%)
   - Driver rating (5%)
   ↓
5. Top matches returned
   ↓
6. Cargo owner reviews and selects
```

### 3. Auction Flow

```
1. Load published with auction enabled
   ↓
2. Auction created (SCHEDULED)
   ↓
3. Auction starts (ACTIVE)
   ↓
4. Truck owners submit bids
   ↓
5. Real-time bid updates
   ↓
6. Auction ends (CLOSED)
   ↓
7. Winning bid selected
   ↓
8. Load assigned to winning bidder
```

### 4. Trip Tracking Flow

```
1. Trip created from assigned load
   ↓
2. Driver assigned and trip started
   ↓
3. GPS tracking begins
   ↓
4. Location updates via WebSocket
   ↓
5. Geofence alerts triggered
   ↓
6. Trip events logged
   ↓
7. Driver alerts generated
   ↓
8. Delivery confirmed
   ↓
9. Trip completed
```

### 5. Document Workflow

```
1. User uploads document
   ↓
2. OCR processing (if applicable)
   ↓
3. Document status: PENDING
   ↓
4. Admin/System verifies
   ↓
5. Status: VERIFIED or REJECTED
   ↓
6. Expiry tracking begins
   ↓
7. Renewal reminders sent
   ↓
8. Document updated/renewed
```

---

## 🔄 Migrations

### Migration System
- **TypeORM Migrations**: TypeScript-based migrations
- **Location**: `src/database/migrations/`
- **Naming**: Timestamp-based naming convention

### Key Migrations

1. **InitMigration** (`1756907351439-InitMigration.ts`)
   - Initial database schema creation
   - All core entities and relationships

2. **AddNotificationMetadataAndIsRead** (`1732560000000-AddNotificationMetadataAndIsRead.ts`)
   - Added metadata and isRead columns to notifications

### SQL Migrations (Legacy)
Located in `backend/` root:
- `001_add_lending_tables.sql` - Lending system tables
- `002_enhance_lending_schema.sql` - Lending enhancements
- `unified-document-notification-migration.sql` - Document/notification system
- Safety tables: `create_safety_incidents_table.sql`, etc.
- Alert columns: `add-compliance-alerts-column.sql`, etc.

### Running Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Linux alternative
npm run migration:generate:linux -- -n MigrationName
npm run migration:run:linux
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Authentication
```
POST   /auth/register          # User registration
POST   /auth/login             # User login
POST   /auth/refresh           # Refresh token
POST   /auth/logout            # Logout
POST   /auth/forgot-password   # Password reset request
POST   /auth/reset-password    # Password reset
```

### Loads
```
GET    /loads                  # List loads
POST   /loads                  # Create load
GET    /loads/:id              # Get load details
PUT    /loads/:id              # Update load
DELETE /loads/:id              # Delete load
POST   /loads/:id/publish      # Publish load
POST   /loads/:id/match        # Find matching trucks
```

### Fleet
```
GET    /fleet/trucks           # List trucks
POST   /fleet/trucks           # Register truck
GET    /fleet/trucks/:id        # Get truck details
PUT    /fleet/trucks/:id        # Update truck
GET    /fleet/drivers           # List drivers
POST   /fleet/drivers           # Register driver
```

### Bidding
```
POST   /bidding/auctions        # Create auction
GET    /bidding/loads/:id/auction  # Get auction
POST   /bidding/bids            # Submit bid
GET    /bidding/loads/:id/bids  # Get bids for load
PUT    /bidding/bids/:id         # Update bid
DELETE /bidding/bids/:id        # Withdraw bid
POST   /bidding/bids/:id/accept # Accept bid
```

### Matching
```
POST   /matching/find           # Find matches
GET    /matching/loads/:id      # Get matches for load
```

### Trips
```
GET    /trips                   # List trips
POST   /trips                   # Create trip
GET    /trips/:id               # Get trip details
PUT    /trips/:id/status        # Update trip status
```

### Tracking (WebSocket)
```
WS     /tracking                # WebSocket connection
Events:
  - location-update
  - trip-status
  - driver-alert
```

### Documents
```
GET    /documents               # List documents
POST   /documents               # Upload document
GET    /documents/:id           # Get document
PUT    /documents/:id/verify    # Verify document
DELETE /documents/:id           # Delete document
```

### Notifications
```
GET    /notifications           # List notifications
GET    /notifications/unread    # Unread notifications
PUT    /notifications/:id/read  # Mark as read
POST   /notifications           # Create notification
```

### Financial
```
GET    /financial/invoices      # List invoices
POST   /financial/invoices     # Create invoice
GET    /financial/payments      # List payments
POST   /financial/payments     # Record payment
GET    /financial/expenses      # List expenses
POST   /financial/expenses      # Record expense
```

### Lending
```
GET    /lending/loan-requests   # List loan requests
POST   /lending/loan-requests   # Create loan request
GET    /lending/lenders         # List lenders
POST   /lending/disburse        # Disburse loan
POST   /lending/repay            # Record repayment
```

### Admin
```
GET    /admin/users             # List users
PUT    /admin/users/:id        # Update user
GET    /admin/tenants           # List tenants
POST   /admin/tenants           # Create tenant
GET    /admin/analytics         # System analytics
```

### Swagger Documentation
```
GET    /api/docs                # Swagger UI
```

---

## ✨ Key Features

### 1. **Intelligent Matching**
- Multi-algorithm matching system
- AI-powered scoring
- Route optimization
- ML-based predictions
- Market intelligence integration

### 2. **Auction System**
- Multiple auction types (Reverse, Forward, Dutch, Sealed)
- Real-time bid tracking
- Analytics and insights
- Risk assessment

### 3. **Real-time Tracking**
- WebSocket-based GPS tracking
- Geofencing alerts
- Driver safety alerts
- Route optimization

### 4. **Document Management**
- Unified document system
- OCR processing
- Version control
- Expiry tracking
- Automated renewal reminders

### 5. **Multi-tenant Architecture**
- Complete tenant isolation
- Tenant-specific configurations
- Subscription management

### 6. **Comprehensive Notifications**
- Multi-channel delivery (Email, SMS, Push, In-app)
- Template system
- Delivery tracking
- User preferences

### 7. **Financial Management**
- Invoice generation
- Payment tracking
- Expense management
- Financial reporting
- Budget management

### 8. **Lending System**
- Loan request management
- Lender policies
- Disbursement tracking
- Repayment management

### 9. **Safety & Compliance**
- Incident reporting
- Inspection tracking
- Training management
- Compliance monitoring

### 10. **Advanced Fleet Management**
- Comprehensive truck specifications
- Driver management
- Maintenance tracking
- Compliance alerts

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+ (with PostGIS extension)
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your database credentials
```

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=urutix

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5713
```

### Database Setup

```bash
# Create database
createdb urutix

# Enable PostGIS extension
psql -d urutix -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations
npm run migration:run
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

### Useful Commands

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Create admin user
npm run create:admin

# Seed database
npm run seed:all

# List users
npm run users:list

# Set user password
npm run user:set-password
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### API Documentation

Once the server is running, access Swagger documentation at:
```
http://localhost:3000/api/docs
```

---

## 📝 Additional Notes

### Database Indexes
The system uses comprehensive indexing for performance:
- Tenant-based indexes for multi-tenant isolation
- Status-based indexes for filtering
- Composite indexes for common queries
- Unique indexes with soft-delete support

### Soft Deletes
Most entities support soft deletes using `deleted_at` column, allowing data recovery and audit trails.

### JSONB Fields
Extensive use of JSONB for flexible schema:
- Truck capabilities and features
- Load requirements and preferences
- Document metadata
- Notification channel data

### Geospatial Data
PostGIS integration for:
- Truck current locations
- Trip location tracking
- Geofencing
- Route optimization

### Event-Driven Architecture
Event emitter used for:
- Notification triggers
- Audit logging
- Status change notifications
- Workflow automation

---

## 🔒 Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- Rate limiting
- Role-based access control
- Tenant isolation
- Input validation
- SQL injection prevention (TypeORM)
- CORS configuration

---

## 📚 Related Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Docker Setup](./DOCKERIZATION_SUMMARY.md)
- [Driver API Documentation](./DRIVER_API_DOCUMENTATION.md)
- [Insurance Backend Implementation](./INSURANCE_BACKEND_IMPLEMENTATION.md)
- [Lending Setup Guide](./LENDING_SETUP_GUIDE.md)
- [NGINX Setup](./NGINX_SETUP.md)
- [Quick Start Guide](./QUICK_START.md)

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure migrations are created if schema changes
5. Submit a pull request

---

## 📄 License

[Your License Here]

---

**Last Updated**: 2024
**Version**: 1.0.0
