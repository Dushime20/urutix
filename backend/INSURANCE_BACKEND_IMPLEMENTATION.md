# 🏗️ Insurance Management Backend Implementation

## 📋 Overview

This document outlines the complete backend implementation for the Insurance Management System in the CargoAI Transport application. The system provides comprehensive insurance policy, claim, and renewal management capabilities with a robust API layer.

## 🏛️ Architecture

### **Technology Stack**
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with role-based access control
- **API Documentation**: Swagger/OpenAPI
- **Validation**: Built-in NestJS validation pipes

### **Module Structure**
```
backend/src/modules/insurance/
├── insurance.module.ts          # Module configuration
├── insurance.controller.ts      # API endpoints
├── insurance.service.ts         # Business logic
└── entities/                    # Database models
    ├── insurance-policy.entity.ts
    ├── insurance-claim.entity.ts
    └── insurance-renewal.entity.ts
```

## 🗄️ Database Schema

### **Insurance Policies Table**
```sql
CREATE TABLE insurance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policyNumber VARCHAR UNIQUE NOT NULL,
  truckId UUID NOT NULL REFERENCES trucks(id),
  insuranceCompany VARCHAR NOT NULL,
  policyType ENUM(...) NOT NULL,
  coverageAmount DECIMAL(15,2) NOT NULL,
  premium DECIMAL(15,2) NOT NULL,
  deductible DECIMAL(15,2) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  status ENUM(...) DEFAULT 'pending',
  coverageTypes TEXT[],
  autoRenew BOOLEAN DEFAULT false,
  notes TEXT,
  documents JSONB,
  agent JSONB,
  paymentMethod ENUM(...) DEFAULT 'monthly',
  lastPaymentDate DATE,
  nextPaymentDate DATE,
  claimsCount INTEGER DEFAULT 0,
  totalClaimsAmount DECIMAL(15,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Insurance Claims Table**
```sql
CREATE TABLE insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claimNumber VARCHAR UNIQUE NOT NULL,
  policyId UUID NOT NULL REFERENCES insurance_policies(id),
  truckId UUID NOT NULL REFERENCES trucks(id),
  claimType ENUM(...) NOT NULL,
  description TEXT NOT NULL,
  incidentDate DATE NOT NULL,
  reportedDate DATE DEFAULT CURRENT_DATE,
  estimatedAmount DECIMAL(15,2) NOT NULL,
  approvedAmount DECIMAL(15,2),
  paidAmount DECIMAL(15,2) DEFAULT 0,
  status ENUM(...) DEFAULT 'pending',
  priority ENUM(...) DEFAULT 'medium',
  adjuster JSONB,
  notes JSONB,
  documents JSONB,
  location JSONB,
  witnesses JSONB,
  policeReport JSONB,
  repairEstimates JSONB,
  timeline JSONB,
  settlement JSONB,
  appeal JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Insurance Renewals Table**
```sql
CREATE TABLE insurance_renewals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  renewalNumber VARCHAR UNIQUE NOT NULL,
  policyId UUID NOT NULL REFERENCES insurance_policies(id),
  truckId UUID NOT NULL REFERENCES trucks(id),
  currentPolicyEndDate DATE NOT NULL,
  renewalDate DATE NOT NULL,
  status ENUM(...) DEFAULT 'pending',
  currentPremium DECIMAL(15,2) NOT NULL,
  estimatedPremium DECIMAL(15,2),
  finalPremium DECIMAL(15,2),
  autoRenew BOOLEAN DEFAULT false,
  coverageChanges JSONB,
  renewalTerms JSONB NOT NULL,
  agent JSONB,
  customerResponse JSONB,
  documents JSONB,
  reminders JSONB,
  timeline JSONB,
  notes JSONB,
  riskAssessment JSONB,
  competitorQuotes JSONB,
  finalDecision JSONB,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### **Base URL**: `/api/insurance`

#### **Policies Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/policies` | Get all policies with filters | ✅ |
| `GET` | `/policies/:id` | Get policy by ID | ✅ |
| `POST` | `/policies` | Create new policy | Admin/Manager |
| `PUT` | `/policies/:id` | Update policy | Admin/Manager |
| `DELETE` | `/policies/:id` | Delete policy | Admin |

#### **Claims Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/claims` | Get all claims with filters | ✅ |
| `GET` | `/claims/:id` | Get claim by ID | ✅ |
| `POST` | `/claims` | Create new claim | All Users |
| `PUT` | `/claims/:id` | Update claim | Admin/Manager |
| `DELETE` | `/claims/:id` | Delete claim | Admin |

#### **Renewals Management**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/renewals` | Get all renewals with filters | ✅ |
| `GET` | `/renewals/:id` | Get renewal by ID | ✅ |
| `POST` | `/renewals` | Create new renewal | Admin/Manager |
| `PUT` | `/renewals/:id` | Update renewal | Admin/Manager |
| `DELETE` | `/renewals/:id` | Delete renewal | Admin |

#### **Analytics & Dashboard**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/dashboard/stats` | Get dashboard statistics | ✅ |
| `GET` | `/alerts/urgent` | Get urgent alerts | ✅ |

#### **Bulk Operations**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `PATCH` | `/policies/bulk/status` | Bulk update policy status | Admin/Manager |
| `DELETE` | `/policies/bulk` | Bulk delete policies | Admin |
| `PATCH` | `/claims/bulk/status` | Bulk update claim status | Admin/Manager |
| `PATCH` | `/claims/bulk/assign-adjuster` | Bulk assign adjuster | Admin/Manager |

#### **Data Export**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/export/policies` | Export policies data | Admin/Manager |
| `GET` | `/export/claims` | Export claims data | Admin/Manager |

## 🔐 Authentication & Authorization

### **JWT Authentication**
- All endpoints require valid JWT token
- Token must be included in `Authorization: Bearer <token>` header

### **Role-Based Access Control**
- **Admin**: Full access to all operations
- **Manager**: Create, read, update operations (no deletion)
- **User**: Read access + create claims only

### **Protected Endpoints**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MANAGER)
```

## 📊 Query Parameters & Filtering

### **Policies Filtering**
```typescript
interface PolicyFilters {
  search?: string;              // Search in policy number or company
  status?: PolicyStatus;        // Filter by status
  truckId?: string;            // Filter by truck
  insuranceCompany?: string;   // Filter by company
  startDate?: Date;            // Filter by start date
  endDate?: Date;              // Filter by end date
  policyType?: PolicyType;     // Filter by type
}
```

### **Claims Filtering**
```typescript
interface ClaimFilters {
  search?: string;              // Search in claim number or description
  status?: ClaimStatus;         // Filter by status
  claimType?: ClaimType;        // Filter by type
  policyId?: string;            // Filter by policy
  truckId?: string;             // Filter by truck
  startDate?: Date;             // Filter by incident date
  endDate?: Date;               // Filter by incident date
  priority?: ClaimPriority;     // Filter by priority
}
```

### **Pagination & Sorting**
```typescript
// Query parameters
page?: number;                  // Page number (default: 1)
limit?: number;                 // Items per page (default: 10)
sortBy?: string;                // Sort field (default: createdAt)
sortOrder?: 'ASC' | 'DESC';     // Sort order (default: DESC)
```

## 🚀 Business Logic Features

### **Policy Management**
- **Auto-numbering**: Automatic policy number generation
- **Date validation**: Prevents overlapping policy dates
- **Status calculation**: Automatic status based on dates
- **Claims tracking**: Maintains claims count and total amount

### **Claim Management**
- **Workflow tracking**: Timeline and status progression
- **Adjuster assignment**: Assign claims to insurance adjusters
- **Document management**: Support for multiple document types
- **Location tracking**: Incident location with coordinates

### **Renewal Management**
- **Urgency detection**: Automatic urgent status for expiring policies
- **Premium calculation**: Estimated renewal premium based on history
- **Risk assessment**: Scoring system for renewal decisions
- **Customer communication**: Response tracking and reminders

### **Analytics & Reporting**
- **Dashboard statistics**: Real-time metrics and KPIs
- **Urgent alerts**: Automated detection of critical items
- **Data export**: CSV and JSON export capabilities
- **Performance metrics**: Claims processing time analysis

## 🗃️ Database Indexes

### **Performance Optimizations**
```sql
-- Policies
CREATE INDEX IDX_INSURANCE_POLICIES_TRUCK_STATUS ON insurance_policies(truckId, status);
CREATE INDEX IDX_INSURANCE_POLICIES_POLICY_NUMBER ON insurance_policies(policyNumber);
CREATE INDEX IDX_INSURANCE_POLICIES_END_DATE ON insurance_policies(endDate);
CREATE INDEX IDX_INSURANCE_POLICIES_INSURANCE_COMPANY ON insurance_policies(insuranceCompany);

-- Claims
CREATE INDEX IDX_INSURANCE_CLAIMS_POLICY_STATUS ON insurance_claims(policyId, status);
CREATE INDEX IDX_INSURANCE_CLAIMS_TRUCK_ID ON insurance_claims(truckId);
CREATE INDEX IDX_INSURANCE_CLAIMS_CLAIM_NUMBER ON insurance_claims(claimNumber);
CREATE INDEX IDX_INSURANCE_CLAIMS_INCIDENT_DATE ON insurance_claims(incidentDate);

-- Renewals
CREATE INDEX IDX_INSURANCE_RENEWALS_POLICY_STATUS ON insurance_renewals(policyId, status);
CREATE INDEX IDX_INSURANCE_RENEWALS_TRUCK_ID ON insurance_renewals(truckId);
CREATE INDEX IDX_INSURANCE_RENEWALS_RENEWAL_DATE ON insurance_renewals(renewalDate);
```

## 🔄 Migration

### **Run Migration**
```bash
# Generate migration
npm run migration:generate -- -n CreateInsuranceTables

# Run migration
npm run migration:run

# Revert migration
npm run migration:revert
```

### **Migration File**: `1755178063242-CreateInsuranceTables.ts`
- Creates all insurance-related tables
- Establishes foreign key relationships
- Sets up performance indexes
- Includes rollback functionality

## 🧪 Testing

### **Unit Tests**
```bash
# Run unit tests
npm run test insurance

# Run with coverage
npm run test:cov insurance
```

### **E2E Tests**
```bash
# Run e2e tests
npm run test:e2e insurance
```

## 📚 API Documentation

### **Swagger Integration**
- Automatic API documentation generation
- Interactive API testing interface
- Request/response examples
- Authentication requirements

### **Access Swagger UI**
```
http://localhost:3000/api-docs
```

## 🚀 Deployment

### **Environment Variables**
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=cargoai_insurance

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# App
PORT=3000
NODE_ENV=production
```

### **Docker Support**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## 🔧 Configuration

### **Module Registration**
```typescript
// app.module.ts
import { InsuranceModule } from './modules/insurance/insurance.module';

@Module({
  imports: [
    // ... other modules
    InsuranceModule,
  ],
})
export class AppModule {}
```

### **Database Configuration**
```typescript
// database.config.ts
export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
};
```

## 📈 Monitoring & Logging

### **Logging Strategy**
- **Request logging**: All API requests and responses
- **Error logging**: Detailed error information with stack traces
- **Performance logging**: Database query execution times
- **Audit logging**: User actions and data changes

### **Health Checks**
```typescript
@Get('health')
async healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await this.checkDatabaseConnection(),
    services: await this.checkServiceHealth(),
  };
}
```

## 🔒 Security Considerations

### **Input Validation**
- **DTO validation**: Request body validation using class-validator
- **SQL injection prevention**: Parameterized queries with TypeORM
- **XSS protection**: Input sanitization and output encoding

### **Rate Limiting**
```typescript
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,        // 1 minute
      limit: 20,         // 20 requests per minute
    }]),
  ],
})
```

### **CORS Configuration**
```typescript
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
});
```

## 🚀 Future Enhancements

### **Planned Features**
- **Real-time notifications**: WebSocket integration for live updates
- **File upload**: Document management with cloud storage
- **Advanced analytics**: Machine learning for risk assessment
- **Integration APIs**: Third-party insurance provider APIs
- **Mobile app support**: RESTful API for mobile applications

### **Scalability Improvements**
- **Caching**: Redis integration for frequently accessed data
- **Queue system**: Background job processing for heavy operations
- **Microservices**: Service decomposition for better scalability
- **Load balancing**: Horizontal scaling support

## 📞 Support & Maintenance

### **Development Team**
- **Backend Lead**: [Your Name]
- **Database Admin**: [DBA Name]
- **DevOps Engineer**: [DevOps Name]

### **Documentation**
- **API Reference**: Swagger documentation
- **Database Schema**: Entity definitions and migrations
- **Deployment Guide**: Environment setup and deployment
- **Troubleshooting**: Common issues and solutions

---

## 🎯 Quick Start

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd cargoai-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run Database Migration**
   ```bash
   npm run migration:run
   ```

5. **Start Application**
   ```bash
   npm run start:dev
   ```

6. **Access API Documentation**
   ```
   http://localhost:3000/api-docs
   ```

---

**🎉 Insurance Management Backend is now fully implemented and ready for production use!**
