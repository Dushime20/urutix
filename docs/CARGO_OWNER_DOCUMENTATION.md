# Cargo Owner Platform Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication & User Management](#authentication--user-management)
3. [Dashboard & Navigation](#dashboard--navigation)
4. [Cargo Management](#cargo-management)
5. [Payment Management](#payment-management)
6. [Team Management](#team-management)
7. [Profile & Settings](#profile--settings)
8. [Technical Architecture](#technical-architecture)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Security Features](#security-features)
12. [Workflow Documentation](#workflow-documentation)

---

## Overview

The Cargo Owner Platform is a comprehensive logistics management system designed for cargo owners to manage their shipments, payments, and team operations. The platform provides a complete solution for cargo transportation management with integrated payment processing, team collaboration, and financial services.

### Key Features
- **Cargo Management**: Create, edit, and track cargo shipments
- **Payment Processing**: Multi-method payment system with financing options
- **Team Management**: Role-based access control for team members
- **Document Management**: Secure document handling and workflow
- **Financial Services**: Insurance, financing, and third-party payment integration
- **Real-time Tracking**: Live shipment tracking and status updates

---

## Authentication & User Management

### User Registration & Login
- **Registration**: Users can register with email, password, and user type
- **Login**: Secure authentication with JWT tokens
- **Role-based Access**: Different access levels for cargo owners, transporters, and administrators
- **Profile Verification**: Required for payment transactions

### User Profile Management
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bankAccount?: string;
  bankName?: string;
  isVerified: boolean;
  userType: 'CARGO_OWNER' | 'TRANSPORTER' | 'ADMIN';
}
```

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password encryption
- **Session Management**: Configurable session timeouts
- **Two-Factor Authentication**: Optional 2FA for enhanced security

---

## Dashboard & Navigation

### Main Dashboard Layout
The cargo owner dashboard features a comprehensive left sidebar navigation with the following sections:

#### Cargo Management
- **Cargo List**: View and manage all cargo shipments
- **Create Cargo**: Add new cargo shipments
- **Cargo Analytics**: View shipment statistics and reports

#### Analytics & Reports
- **Dashboard Analytics**: Real-time cargo and payment statistics
- **Financial Reports**: Payment and transaction reports
- **Performance Metrics**: Shipment and team performance data

#### Maps & Tracking
- **Live Tracking**: Real-time shipment tracking
- **Route Optimization**: AI-powered route planning
- **Location Management**: Pickup and delivery location management

#### Account & Settings
- **Profile Management**: Update personal and company information
- **Team Management**: Manage team members and permissions
- **System Settings**: Platform configuration and preferences

#### Financial Management
- **Payment Management**: Comprehensive payment processing
- **Financial Reports**: Detailed financial analytics
- **Insurance Management**: Cargo insurance processing
- **Financing Services**: Third-party financing integration

### Navigation Structure
```
Dashboard
├── Cargo Management
│   ├── Cargo List
│   ├── Create Cargo
│   └── Cargo Analytics
├── Analytics & Reports
│   ├── Dashboard Analytics
│   ├── Financial Reports
│   └── Performance Metrics
├── Maps & Tracking
│   ├── Live Tracking
│   ├── Route Optimization
│   └── Location Management
├── Account & Settings
│   ├── Profile Management
│   ├── Team Management
│   └── System Settings
└── Financial Management
    ├── Payment Management
    ├── Financial Reports
    ├── Insurance Management
    └── Financing Services
```

---

## Cargo Management

### Cargo Creation & Management

#### Cargo Interface
```typescript
interface Cargo {
  id: string;
  title: string;
  description?: string;
  weight: number;
  volume?: number;
  cargoType: string;
  pickupLocationId: string;
  deliveryLocationId: string;
  pickupDate: string;
  deliveryDate: string;
  status: string;
  loadValue: number;
  offeredPrice?: number;
  currencyCode: string;
  isFragile: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  contactInfo: Record<string, any>;
  autoMatchEnabled: boolean;
  matchingCriteria: Record<string, any>;
  publishedAt?: string;
  assignedTruckId?: string;
  rating: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  cargoOwner?: UserProfile;
  pickupLocation?: Location;
  deliveryLocation?: Location;
}
```

#### Location Management
```typescript
interface Location {
  id: string;
  name: string;
  address: string;
  coordinates: {
    type: string;
    coordinates: number[]; // [lng, lat]
  };
  locationType: string;
}
```

### Cargo Operations

#### Create Cargo
1. **Basic Information**: Title, description, weight, volume
2. **Cargo Type**: Select from predefined cargo types
3. **Location Selection**: Pickup and delivery locations
4. **Date Selection**: Pickup and delivery dates
5. **Pricing**: Set load value and offered price
6. **Special Requirements**: Fragile, hazardous, refrigeration
7. **Contact Information**: Cargo owner contact details
8. **Auto-match Settings**: Enable automatic transporter matching

#### Edit Cargo
- **Status Updates**: Update cargo status (DRAFT, PUBLISHED, IN_TRANSIT, DELIVERED)
- **Location Changes**: Modify pickup or delivery locations
- **Pricing Updates**: Adjust load value or offered price
- **Requirements Updates**: Modify special handling requirements

#### Cargo Status Workflow
```
DRAFT → PUBLISHED → IN_TRANSIT → DELIVERED
```

### Map Integration
- **Interactive Maps**: Leaflet-based map integration
- **Location Selection**: Click-to-select pickup and delivery points
- **Route Visualization**: Display optimal routes between locations
- **Real-time Updates**: Live location tracking during transit

---

## Payment Management

### Payment System Overview

The payment management system provides comprehensive financial services including direct payments, third-party financing, insurance, and platform services.

#### Payment Transaction Interface
```typescript
interface PaymentTransaction {
  id: string;
  type: 'advance_payment' | 'final_payment' | 'third_party_payment' | 
        'refund' | 'fee' | 'insurance_payment' | 'platform_service' | 
        'direct_payment' | 'financed_payment';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  description: string;
  cargoId: string;
  cargoTitle: string;
  truckOwnerId?: string;
  truckOwnerName?: string;
  thirdPartyId?: string;
  thirdPartyName?: string;
  paymentMethod: 'bank_transfer' | 'mpesa' | 'airtel_money' | 'equitel' | 
                'credit_card' | 'paypal' | 'escrow';
  reference: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  notes?: string;
  
  // User verification
  payerId: string;
  payerName: string;
  payerEmail: string;
  payerPhone?: string;
  payerBankAccount?: string;
  payerBankName?: string;
  
  // Payment source information
  paymentSource: 'own_funds' | 'third_party_financing' | 'mixed_funding';
  ownFundsAmount?: number;
  financedAmount?: number;
  
  // Financing details
  financingDetails?: {
    financierId: string;
    financierName: string;
    interestRate: number;
    loanTerm: string;
    repaymentSchedule: string;
    collateral: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvalDate?: string;
    disbursementDate?: string;
  };
  
  // Insurance details
  insuranceDetails?: {
    policyNumber: string;
    coverageType: string;
    premiumAmount: number;
    coveragePeriod: string;
    insuranceProvider: string;
  };
  
  // Service details
  serviceDetails?: {
    serviceType: string;
    serviceProvider: string;
    serviceDescription: string;
  };
}
```

### Payment Methods

#### Mobile Money Integration
- **M-Pesa**: Safaricom mobile money service
- **Airtel Money**: Airtel mobile money service
- **Equitel**: Equity Bank mobile money service

#### Bank Transfer
- **Direct Bank Transfer**: Traditional bank transfers
- **Account Auto-population**: Bank details from user profile
- **Transaction Tracking**: Complete transfer history

#### Digital Payments
- **Credit Card**: Secure credit card processing
- **PayPal**: International payment processing
- **Escrow**: Secure escrow payment handling

### Payment Sources

#### Own Funds
- **Direct Payment**: Cargo owner pays directly from their funds
- **Profile Integration**: Payment details auto-populated from profile
- **Instant Processing**: Real-time payment processing

#### Third-Party Financing
- **Bank Financing**: Integration with major Kenyan banks
- **Loan Management**: Complete loan lifecycle management
- **Interest Calculation**: Automated interest and fee calculation
- **Repayment Scheduling**: Structured repayment plans

#### Mixed Funding
- **Combined Sources**: Mix of own funds and financing
- **Flexible Allocation**: Configurable fund allocation
- **Risk Management**: Spread financial risk across sources

### Financial Institutions Integration

#### Supported Banks
1. **Kenya Agricultural Bank**: Agricultural sector financing
2. **Equity Bank**: General business financing
3. **KCB Bank**: Corporate financing
4. **Cooperative Bank**: Cooperative financing
5. **NCBA Bank**: Commercial financing
6. **Stanbic Bank**: International financing
7. **CargoAI Financing**: Platform's own financing arm

### Insurance Services

#### Insurance Providers
- **Kenya Insurance Co.**: Leading local insurer
- **AAR Insurance**: Healthcare and general insurance
- **CIC Insurance**: Cooperative insurance
- **Jubilee Insurance**: Comprehensive coverage
- **UAP Insurance**: Pan-African insurance

#### Coverage Types
- **Comprehensive Cargo Insurance**: Full coverage
- **Basic Cargo Insurance**: Essential coverage
- **Hazardous Goods Insurance**: Specialized coverage
- **Fragile Items Insurance**: Delicate cargo protection
- **High Value Cargo Insurance**: Premium coverage

### Platform Services

#### Available Services
- **Premium Tracking**: Real-time GPS tracking with alerts
- **Route Optimization**: AI-powered route planning
- **Documentation Services**: Complete cargo documentation
- **Customs Clearance**: Import/export assistance
- **Warehouse Services**: Storage and handling
- **Loading/Unloading**: Cargo handling services
- **Security Escort**: Armed escort services

---

## Team Management

### Role-Based Access Control

The team management system provides granular permission control for different team roles and responsibilities.

#### Team Member Interface
```typescript
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive';
  joinedDate: string;
  
  // Payment workflow permissions
  paymentPermissions: {
    canInitiatePayments: boolean;
    canApprovePayments: boolean;
    canRequestPayments: boolean;
    canViewTransactions: boolean;
    canManageFinancing: boolean;
    canHandleInsurance: boolean;
    canProcessRefunds: boolean;
    canGenerateReports: boolean;
    canManageTeamPermissions: boolean;
    canHandleEscrow: boolean;
    canProcessThirdPartyPayments: boolean;
    canManageBankAccounts: boolean;
    canHandleMobileMoney: boolean;
    canProcessPlatformServices: boolean;
    canManageDocuments: boolean;
    canHandleCompliance: boolean;
  };
  
  // Document handling permissions
  documentPermissions: {
    canUploadDocuments: boolean;
    canViewDocuments: boolean;
    canEditDocuments: boolean;
    canDeleteDocuments: boolean;
    canShareDocuments: boolean;
    canGenerateReports: boolean;
    canHandleCompliance: boolean;
  };
  
  // Workflow permissions
  workflowPermissions: {
    canCreateWorkflows: boolean;
    canEditWorkflows: boolean;
    canDeleteWorkflows: boolean;
    canAssignTasks: boolean;
    canApproveSteps: boolean;
    canViewWorkflowHistory: boolean;
    canManageApprovals: boolean;
  };
}
```

### Available Roles

#### Cargo Receiver
- **Basic Permissions**: View and create cargo
- **Payment Permissions**: Initiate payments, view transactions
- **Document Permissions**: Upload and view documents
- **Workflow Permissions**: View workflow history

#### Assistant Manager
- **Extended Permissions**: Full cargo management
- **Payment Permissions**: Approve payments, manage financing
- **Document Permissions**: Edit and share documents
- **Workflow Permissions**: Create workflows, assign tasks

#### Manager
- **Full Permissions**: Complete system access
- **Payment Permissions**: All payment operations
- **Document Permissions**: Full document management
- **Workflow Permissions**: Complete workflow control

#### Admin
- **Administrative Access**: System administration
- **User Management**: Create and manage users
- **System Configuration**: Platform settings
- **Security Management**: Access control and security

### Permission Categories

#### Payment Workflow Permissions
1. **Initiate Payments**: Create new payment transactions
2. **Approve Payments**: Approve pending payment requests
3. **Request Payments**: Submit payment requests to third parties
4. **View Transactions**: Access payment history and details
5. **Manage Financing**: Handle third-party financing arrangements
6. **Handle Insurance**: Process cargo insurance payments
7. **Process Refunds**: Handle refund requests and processing
8. **Generate Reports**: Create financial and payment reports
9. **Handle Escrow**: Manage escrow payment arrangements
10. **Process Third Party Payments**: Handle external payment processing
11. **Manage Bank Accounts**: Update and manage bank account details
12. **Handle Mobile Money**: Process mobile wallet transactions
13. **Process Platform Services**: Handle platform service payments

#### Document Handling Permissions
1. **Upload Documents**: Add new documents to the system
2. **View Documents**: Access and view uploaded documents
3. **Edit Documents**: Modify existing documents
4. **Delete Documents**: Remove documents from the system
5. **Share Documents**: Share documents with team members
6. **Generate Reports**: Create document-related reports
7. **Handle Compliance**: Manage compliance-related documents

#### Workflow Permissions
1. **Create Workflows**: Design new workflow processes
2. **Edit Workflows**: Modify existing workflow configurations
3. **Delete Workflows**: Remove workflow configurations
4. **Assign Tasks**: Assign tasks to team members
5. **Approve Steps**: Approve workflow progression steps
6. **View Workflow History**: Access workflow audit trails
7. **Manage Approvals**: Control approval processes

---

## Profile & Settings

### Profile Management

#### User Profile Interface
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bankAccount?: string;
  bankName?: string;
  isVerified: boolean;
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  profileImage?: string;
}
```

#### Profile Features
- **Personal Information**: Name, email, phone number
- **Company Information**: Company name, address, contact details
- **Banking Information**: Bank account and bank details
- **Verification Status**: Profile verification for payments
- **Profile Image**: User profile picture upload

### Settings Management

#### Notification Settings
```typescript
interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  cargoUpdates: boolean;
  priceAlerts: boolean;
  systemUpdates: boolean;
}
```

#### Security Settings
```typescript
interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordChangeRequired: boolean;
}
```

#### Preference Settings
```typescript
interface PreferenceSettings {
  language: string;
  timezone: string;
  currency: string;
  theme: string;
}
```

---

## Technical Architecture

### Frontend Architecture

#### Technology Stack
- **React**: Frontend framework
- **TypeScript**: Type-safe development
- **React Router**: Client-side routing
- **Material-UI**: UI component library
- **React Hook Form**: Form management
- **React Query**: Data fetching and caching
- **React Hot Toast**: Notifications
- **Leaflet**: Map integration
- **React Leaflet**: React map components

#### Component Structure
```
src/
├── components/
│   ├── Layout/
│   │   ├── CargoOwnerLayout.tsx
│   │   └── CargoOwnerSidebar.tsx
│   ├── CargoDashboard/
│   │   ├── CargoDashboard.tsx
│   │   ├── CargoTable.tsx
│   │   └── CargoForm.tsx
│   └── PaymentManagement/
│       └── PaymentManagement.tsx
├── pages/
│   ├── Auth.tsx
│   ├── CargoList.tsx
│   ├── Analytics.tsx
│   ├── Tracking.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   └── PaymentManagement.tsx
├── contexts/
│   └── AuthContext.tsx
├── services/
│   ├── api.ts
│   └── cargoApi.ts
└── types/
    └── cargo.ts
```

### Backend Architecture

#### Technology Stack
- **NestJS**: Backend framework
- **TypeORM**: Database ORM
- **PostgreSQL**: Primary database
- **PostGIS**: Spatial database extension
- **JWT**: Authentication
- **bcrypt**: Password hashing

#### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  user_type VARCHAR NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cargo loads table
CREATE TABLE loads (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  weight DECIMAL,
  volume DECIMAL,
  cargo_type VARCHAR,
  pickup_location_id UUID REFERENCES locations(id),
  delivery_location_id UUID REFERENCES locations(id),
  pickup_date TIMESTAMP,
  delivery_date TIMESTAMP,
  status VARCHAR DEFAULT 'DRAFT',
  load_value DECIMAL,
  offered_price DECIMAL,
  currency_code VARCHAR DEFAULT 'KES',
  is_fragile BOOLEAN DEFAULT FALSE,
  is_hazardous BOOLEAN DEFAULT FALSE,
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  cargo_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  address TEXT,
  coordinates GEOMETRY(POINT, 4326),
  location_type VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  amount DECIMAL NOT NULL,
  currency VARCHAR DEFAULT 'KES',
  description TEXT,
  cargo_id UUID REFERENCES loads(id),
  payer_id UUID REFERENCES users(id),
  payment_method VARCHAR,
  reference VARCHAR UNIQUE,
  payment_source VARCHAR,
  own_funds_amount DECIMAL,
  financed_amount DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh access token
PATCH /api/auth/profile - Update user profile
```

### Cargo Management Endpoints
```
GET /api/loads - Get all cargo loads
POST /api/loads - Create new cargo load
GET /api/loads/:id - Get specific cargo load
PATCH /api/loads/:id - Update cargo load
DELETE /api/loads/:id - Delete cargo load
POST /api/loads/:id/publish - Publish cargo load
```

### Payment Management Endpoints
```
GET /api/payments - Get payment transactions
POST /api/payments - Create payment transaction
GET /api/payments/:id - Get specific payment
PATCH /api/payments/:id - Update payment
DELETE /api/payments/:id - Delete payment
POST /api/payments/:id/approve - Approve payment
POST /api/payments/:id/reject - Reject payment
```

### Team Management Endpoints
```
GET /api/team - Get team members
POST /api/team - Add team member
GET /api/team/:id - Get specific team member
PATCH /api/team/:id - Update team member
DELETE /api/team/:id - Remove team member
PATCH /api/team/:id/permissions - Update permissions
```

### Location Management Endpoints
```
GET /api/locations - Get all locations
POST /api/locations - Create new location
GET /api/locations/:id - Get specific location
PATCH /api/locations/:id - Update location
DELETE /api/locations/:id - Delete location
```

---

## Security Features

### Authentication & Authorization
- **JWT Token Management**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Session Management**: Configurable session timeouts
- **Password Security**: Bcrypt hashing with salt

### Data Protection
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: Cross-Site Request Forgery prevention

### Payment Security
- **User Verification**: Required for payment transactions
- **Auto-population**: Payment details from verified profiles
- **Transaction Encryption**: Secure payment data transmission
- **Audit Trail**: Complete transaction history

### Document Security
- **Secure Storage**: Encrypted document storage
- **Access Control**: Role-based document access
- **Version Control**: Document version tracking
- **Audit Logging**: Document access and modification logs

---

## Workflow Documentation

### Payment Workflow

#### Direct Payment Workflow
1. **User Verification**: Check if user is verified
2. **Payment Initiation**: User creates payment request
3. **Amount Validation**: Verify sufficient funds
4. **Payment Processing**: Process payment through selected method
5. **Confirmation**: Send confirmation to all parties
6. **Transaction Recording**: Store transaction in database

#### Third-Party Financing Workflow
1. **Financing Request**: User requests third-party financing
2. **Document Upload**: Upload required documents
3. **Bank Communication**: System communicates with bank
4. **Approval Process**: Bank reviews and approves/rejects
5. **Fund Disbursement**: Funds transferred to transporter
6. **Repayment Setup**: Establish repayment schedule
7. **Monitoring**: Track repayment progress

#### Insurance Payment Workflow
1. **Insurance Selection**: User selects insurance provider
2. **Coverage Selection**: Choose coverage type and period
3. **Premium Calculation**: System calculates premium amount
4. **Payment Processing**: Process premium payment
5. **Policy Generation**: Create insurance policy
6. **Document Storage**: Store policy documents securely

### Cargo Management Workflow

#### Cargo Creation Workflow
1. **Basic Information**: Enter cargo title, description, weight
2. **Cargo Type Selection**: Choose from predefined types
3. **Location Selection**: Select pickup and delivery locations
4. **Date Selection**: Set pickup and delivery dates
5. **Pricing Configuration**: Set load value and offered price
6. **Special Requirements**: Configure handling requirements
7. **Contact Information**: Add cargo owner contact details
8. **Auto-match Settings**: Configure automatic matching
9. **Review & Save**: Review and save cargo details

#### Cargo Publishing Workflow
1. **Draft Review**: Review cargo details in draft status
2. **Validation**: Validate all required fields
3. **Publishing**: Change status to PUBLISHED
4. **Notification**: Notify relevant parties
5. **Matching**: Initiate transporter matching process

### Document Management Workflow

#### Document Upload Workflow
1. **File Selection**: User selects document file
2. **Format Validation**: Validate file format and size
3. **Content Review**: Review document content
4. **Approval Process**: Manager reviews and approves
5. **Secure Storage**: Store document securely
6. **Access Control**: Set appropriate access permissions
7. **Notification**: Notify relevant team members

#### Document Sharing Workflow
1. **Permission Check**: Verify user has sharing permission
2. **Recipient Selection**: Select document recipients
3. **Access Level**: Set appropriate access levels
4. **Notification**: Send sharing notification
5. **Access Tracking**: Track document access

### Team Management Workflow

#### Team Member Addition Workflow
1. **Invitation**: Send invitation to new team member
2. **Role Assignment**: Assign appropriate role
3. **Permission Configuration**: Set granular permissions
4. **Profile Creation**: Create user profile
5. **Access Grant**: Grant system access
6. **Training**: Provide necessary training
7. **Monitoring**: Monitor team member activity

#### Permission Management Workflow
1. **Permission Review**: Review current permissions
2. **Role Assessment**: Assess role requirements
3. **Permission Updates**: Update permissions as needed
4. **Testing**: Test permission changes
5. **Documentation**: Document permission changes
6. **Notification**: Notify team member of changes

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  bank_account VARCHAR(50),
  bank_name VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  profile_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Cargo Loads Table
```sql
CREATE TABLE loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(10,2),
  volume DECIMAL(10,2),
  cargo_type VARCHAR(100),
  pickup_location_id UUID REFERENCES locations(id),
  delivery_location_id UUID REFERENCES locations(id),
  pickup_date TIMESTAMP,
  delivery_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'DRAFT',
  load_value DECIMAL(12,2),
  offered_price DECIMAL(12,2),
  currency_code VARCHAR(3) DEFAULT 'KES',
  is_fragile BOOLEAN DEFAULT FALSE,
  is_hazardous BOOLEAN DEFAULT FALSE,
  requires_refrigeration BOOLEAN DEFAULT FALSE,
  contact_info JSONB,
  auto_match_enabled BOOLEAN DEFAULT TRUE,
  matching_criteria JSONB,
  published_at TIMESTAMP,
  assigned_truck_id UUID,
  rating DECIMAL(3,2),
  view_count INTEGER DEFAULT 0,
  cargo_owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Locations Table
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  coordinates GEOMETRY(POINT, 4326),
  location_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Payment Transactions Table
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  description TEXT,
  cargo_id UUID REFERENCES loads(id),
  payer_id UUID REFERENCES users(id),
  truck_owner_id UUID REFERENCES users(id),
  third_party_id UUID REFERENCES users(id),
  payment_method VARCHAR(50),
  reference VARCHAR(100) UNIQUE,
  payment_source VARCHAR(50),
  own_funds_amount DECIMAL(12,2),
  financed_amount DECIMAL(12,2),
  financing_details JSONB,
  insurance_details JSONB,
  service_details JSONB,
  due_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Team Members Table
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  team_owner_id UUID REFERENCES users(id),
  role VARCHAR(100),
  permissions JSONB,
  payment_permissions JSONB,
  document_permissions JSONB,
  workflow_permissions JSONB,
  status VARCHAR(50) DEFAULT 'active',
  joined_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_loads_cargo_owner_id ON loads(cargo_owner_id);
CREATE INDEX idx_loads_status ON loads(status);
CREATE INDEX idx_loads_pickup_date ON loads(pickup_date);
CREATE INDEX idx_payment_transactions_payer_id ON payment_transactions(payer_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX idx_team_members_team_owner_id ON team_members(team_owner_id);
CREATE INDEX idx_locations_coordinates ON locations USING GIST(coordinates);
```

---

## Configuration

### Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/cargo_platform
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cargo_platform
DATABASE_USERNAME=username
DATABASE_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# Payment Configuration
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_ENVIRONMENT=sandbox

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
UPLOAD_PATH=./uploads
```

### Application Configuration
```typescript
// config/database.ts
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};

// config/jwt.ts
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
};

// config/payment.ts
export const paymentConfig = {
  mpesa: {
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY,
    environment: process.env.MPESA_ENVIRONMENT,
  },
};
```

---

## Deployment

### Prerequisites
- Node.js 16+ 
- PostgreSQL 13+
- PostGIS extension
- Redis (optional, for caching)

### Installation Steps
1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/cargo-platform.git
   cd cargo-platform
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb cargo_platform
   
   # Run migrations
   cd backend
   npm run migration:run
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment files
   cp .env.example .env
   
   # Update environment variables
   nano .env
   ```

5. **Start Application**
   ```bash
   # Backend
   cd backend
   npm run start:dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

### Production Deployment
1. **Build Application**
   ```bash
   # Backend
   cd backend
   npm run build
   
   # Frontend
   cd frontend
   npm run build
   ```

2. **Docker Deployment**
   ```bash
   # Build Docker images
   docker-compose build
   
   # Start services
   docker-compose up -d
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## Support & Maintenance

### Troubleshooting

#### Common Issues
1. **Database Connection Issues**
   - Verify database credentials
   - Check database service status
   - Ensure PostGIS extension is installed

2. **Payment Processing Issues**
   - Verify payment provider credentials
   - Check network connectivity
   - Review payment logs

3. **File Upload Issues**
   - Check file size limits
   - Verify file type restrictions
   - Ensure upload directory permissions

#### Performance Optimization
1. **Database Optimization**
   - Add appropriate indexes
   - Optimize queries
   - Monitor query performance

2. **Caching Strategy**
   - Implement Redis caching
   - Cache frequently accessed data
   - Use CDN for static assets

3. **Load Balancing**
   - Implement horizontal scaling
   - Use load balancer
   - Monitor server resources

### Monitoring & Logging

#### Application Monitoring
- **Error Tracking**: Implement error monitoring
- **Performance Monitoring**: Monitor application performance
- **User Analytics**: Track user behavior and usage

#### Logging Strategy
- **Application Logs**: Log application events
- **Error Logs**: Log errors and exceptions
- **Audit Logs**: Log user actions and system changes
- **Payment Logs**: Log payment transactions and events

### Security Maintenance

#### Regular Security Updates
- **Dependency Updates**: Regularly update dependencies
- **Security Patches**: Apply security patches promptly
- **Vulnerability Scanning**: Regular vulnerability assessments

#### Access Control Review
- **Permission Audits**: Regular permission reviews
- **User Access Review**: Review user access regularly
- **Security Training**: Regular security training for team

---

## Conclusion

The Cargo Owner Platform provides a comprehensive solution for cargo transportation management with integrated payment processing, team collaboration, and financial services. The platform's modular architecture ensures scalability, maintainability, and security while providing a rich user experience for cargo owners and their teams.

For additional support or questions, please contact the development team or refer to the platform's help documentation. 