# Multi-Tenant Authentication System Guide

## Overview

This guide covers the comprehensive multi-tenant authentication system implemented in the UrutiX cargo management platform. The system provides secure tenant isolation, flexible tenant resolution, and enterprise-grade tenant management capabilities.

## 🏗️ Architecture

### Core Components

1. **Tenant Entity** (`src/entities/tenant.entity.ts`)
   - Comprehensive tenant data model
   - Support for subdomains, domains, and custom configurations
   - Tenant status management (ACTIVE, SUSPENDED, PENDING_ACTIVATION, DEACTIVATED)
   - Tenant type classification (ENTERPRISE, SMALL_BUSINESS, INDIVIDUAL, PARTNER)

2. **Tenant Service** (`src/modules/auth/tenant.service.ts`)
   - CRUD operations for tenant management
   - Tenant resolution by subdomain, domain, and ID
   - Tenant activation/suspension with audit trails
   - Tenant statistics and monitoring

3. **Tenant Guard** (`src/modules/auth/tenant.guard.ts`)
   - Automatic tenant access control
   - Super admin bypass for cross-tenant operations
   - Tenant ID validation and isolation enforcement

4. **Tenant Middleware** (`src/modules/auth/tenant.middleware.ts`)
   - Automatic tenant information extraction
   - Subdomain and domain-based tenant resolution
   - Request enrichment with tenant context

5. **Tenant Controller** (`src/modules/auth/tenant.controller.ts`)
   - RESTful API for tenant management
   - Swagger documentation for all endpoints
   - Proper error handling and validation

## 🔐 Security Features

### Tenant Isolation
- **Data Isolation**: All entities include `tenantId` with proper indexing
- **Access Control**: Users can only access their assigned tenant
- **Super Admin**: Cross-tenant access for system administrators
- **Audit Logging**: Comprehensive tenant activity tracking

### Authentication Integration
- **JWT Tokens**: Include tenant information in token payload
- **Token Refresh**: Maintains tenant context across sessions
- **Rate Limiting**: Tenant-aware rate limiting
- **Session Management**: Tenant-scoped session handling

## 📊 Database Schema

### Tenant Table
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  subdomain VARCHAR UNIQUE,
  domain VARCHAR,
  type tenant_type_enum DEFAULT 'SMALL_BUSINESS',
  status tenant_status_enum DEFAULT 'PENDING_ACTIVATION',
  description TEXT,
  logo_url VARCHAR,
  website_url VARCHAR,
  contact_email VARCHAR,
  contact_phone VARCHAR,
  address TEXT,
  city VARCHAR,
  state VARCHAR,
  country VARCHAR,
  postal_code VARCHAR,
  tax_id VARCHAR,
  business_license VARCHAR,
  settings JSONB DEFAULT '{}',
  features JSONB DEFAULT '{}',
  billing_info JSONB DEFAULT '{}',
  max_users INTEGER,
  max_trucks INTEGER,
  max_drivers INTEGER,
  max_loads_per_month INTEGER,
  subscription_plan VARCHAR,
  subscription_expires_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  is_active BOOLEAN DEFAULT FALSE,
  activated_at TIMESTAMP,
  suspended_at TIMESTAMP,
  suspended_reason VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### User-Tenant Relationship
```sql
-- Users table includes tenantId
ALTER TABLE users ADD CONSTRAINT FK_users_tenant 
FOREIGN KEY (tenantId) REFERENCES tenants(id);

-- Unique constraint on tenant + email
CREATE UNIQUE INDEX idx_users_tenant_email 
ON users (tenantId, email) WHERE deleted_at IS NULL;
```

## 🚀 API Endpoints

### Tenant Management (Super Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tenants` | Create new tenant |
| GET | `/api/tenants` | Get all tenants |
| GET | `/api/tenants/active` | Get active tenants |
| GET | `/api/tenants/:id` | Get tenant by ID |
| GET | `/api/tenants/:id/stats` | Get tenant statistics |
| PUT | `/api/tenants/:id` | Update tenant |
| POST | `/api/tenants/:id/activate` | Activate tenant |
| POST | `/api/tenants/:id/suspend` | Suspend tenant |
| DELETE | `/api/tenants/:id` | Delete tenant |

### Authentication (Multi-Tenant)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with tenant |
| POST | `/api/auth/login` | Login with tenant context |
| POST | `/api/auth/refresh` | Refresh token with tenant |
| POST | `/api/auth/logout` | Logout with tenant |

## 🔧 Configuration

### Environment Variables
```env
# Multi-tenant configuration
DEFAULT_TENANT_ID=default-tenant
TENANT_RESOLUTION_STRATEGY=subdomain
ALLOW_CROSS_TENANT_ACCESS=false
TENANT_RATE_LIMIT_PER_MINUTE=100
TENANT_SESSION_TIMEOUT_HOURS=24

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=urutix
```

### Tenant Resolution Strategies

1. **Subdomain-based** (Default)
   ```
   acme.urutix.com → tenant: acme
   logistics.urutix.com → tenant: logistics
   ```

2. **Domain-based**
   ```
   urutix.com/acme → tenant: acme
   urutix.com/logistics → tenant: logistics
   ```

3. **Header-based**
   ```
   X-Tenant-ID: acme-tenant-id
   ```

4. **Query Parameter**
   ```
   ?tenantId=acme-tenant-id
   ```

## 📝 Usage Examples

### 1. Tenant Creation
```typescript
// Create a new tenant
const tenant = await tenantService.createTenant({
  name: 'Acme Logistics',
  subdomain: 'acme',
  type: 'ENTERPRISE',
  contactEmail: 'admin@acme.com',
  maxUsers: 100,
  maxTrucks: 50,
  maxDrivers: 25,
  subscriptionPlan: 'enterprise',
});
```

### 2. User Registration with Tenant
```typescript
// Register user with specific tenant
const user = await authService.register({
  email: 'user@acme.com',
  password: 'securePassword123',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Acme Logistics',
  tenantId: 'acme-tenant-id', // Optional
});
```

### 3. Protected Routes with Tenant Guard
```typescript
@Controller('loads')
@UseGuards(JwtAuthGuard, TenantGuard)
export class LoadsController {
  @Get()
  async findAll(@Request() req) {
    // req.user.tenantId is automatically validated
    return this.loadsService.findAll(req.user.tenantId);
  }
}
```

### 4. Tenant-Aware Service Methods
```typescript
async findAll(tenantId: string): Promise<Load[]> {
  return this.loadRepository.find({
    where: { tenantId },
    relations: ['cargoOwner', 'pickupLocation', 'deliveryLocation'],
  });
}
```

## 🔄 Migration Guide

### From Single-Tenant to Multi-Tenant

1. **Run Database Migration**
   ```bash
   npm run migration:run
   ```

2. **Update Environment Variables**
   ```env
   DEFAULT_TENANT_ID=default-tenant
   TENANT_RESOLUTION_STRATEGY=subdomain
   ```

3. **Update Frontend API Calls**
   ```typescript
   // Add tenant ID to headers
   const api = axios.create({
     headers: {
       'X-Tenant-ID': getCurrentTenantId(),
     },
   });
   ```

4. **Update Service Methods**
   ```typescript
   // Add tenantId parameter to all service methods
   async findAll(tenantId: string): Promise<Entity[]> {
     return this.repository.find({ where: { tenantId } });
   }
   ```

## 🛡️ Security Best Practices

### Implemented
- ✅ Tenant data isolation
- ✅ JWT token tenant validation
- ✅ Tenant-aware rate limiting
- ✅ Super admin cross-tenant access
- ✅ Tenant audit logging
- ✅ Secure tenant resolution

### Recommended for Production
- 🔄 HTTPS enforcement
- 🔄 Tenant-specific CORS policies
- 🔄 Advanced threat detection
- 🔄 Behavioral analysis
- 🔄 Geographic restrictions
- 🔄 Device fingerprinting

## 🧪 Testing

### Unit Tests
```typescript
describe('TenantService', () => {
  it('should create tenant with valid data', async () => {
    const tenant = await tenantService.createTenant({
      name: 'Test Tenant',
      subdomain: 'test',
    });
    expect(tenant.name).toBe('Test Tenant');
  });
});
```

### Integration Tests
```typescript
describe('Tenant Guard', () => {
  it('should allow super admin access', async () => {
    const request = createMockRequest({
      user: { role: 'SUPER_ADMIN', tenantId: 'tenant-1' },
      headers: { 'x-tenant-id': 'tenant-2' },
    });
    expect(tenantGuard.canActivate(request)).toBe(true);
  });
});
```

### API Tests
```bash
# Test tenant creation
curl -X POST http://localhost:3000/api/tenants \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tenant",
    "subdomain": "test",
    "type": "SMALL_BUSINESS"
  }'

# Test tenant-specific login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: test-tenant-id" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }'
```

## 📈 Monitoring & Analytics

### Tenant Metrics
- User count per tenant
- Load count per tenant
- Revenue per tenant
- API usage per tenant
- Error rates per tenant

### Health Checks
- Tenant database connectivity
- Tenant service availability
- Tenant-specific rate limiting
- Tenant audit log integrity

## 🚀 Deployment

### Production Checklist
- [ ] Run database migrations
- [ ] Configure environment variables
- [ ] Set up tenant monitoring
- [ ] Configure tenant-specific domains
- [ ] Set up tenant backup procedures
- [ ] Configure tenant-specific rate limits
- [ ] Set up tenant audit logging
- [ ] Configure tenant-specific CORS

### Scaling Considerations
- **Database**: Consider tenant-specific database sharding
- **Caching**: Implement tenant-aware caching strategies
- **CDN**: Configure tenant-specific CDN rules
- **Load Balancing**: Implement tenant-aware load balancing
- **Monitoring**: Set up tenant-specific monitoring dashboards

## 🔧 Troubleshooting

### Common Issues

1. **Tenant Not Found**
   ```bash
   # Check tenant exists
   curl -X GET http://localhost:3000/api/tenants/tenant-id
   
   # Check subdomain resolution
   curl -X GET http://tenant.urutix.com/api/health
   ```

2. **Tenant Access Denied**
   ```bash
   # Verify user tenant assignment
   curl -X GET http://localhost:3000/api/auth/profile \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Rate Limiting Issues**
   ```bash
   # Check tenant rate limits
   curl -X GET http://localhost:3000/api/tenants/tenant-id/stats
   ```

### Debug Mode
```typescript
// Enable tenant debugging
const tenantDebug = {
  tenantId: req.user?.tenantId,
  subdomain: req.headers['x-subdomain'],
  resolvedTenant: req['tenantInfo']?.resolvedTenant,
};
console.log('Tenant Debug:', tenantDebug);
```

## 📚 Additional Resources

- [NestJS Multi-tenancy Guide](https://docs.nestjs.com/techniques/database#multiple-databases)
- [TypeORM Multi-tenant Patterns](https://typeorm.io/#/multiple-connections)
- [JWT Multi-tenant Security](https://auth0.com/blog/implementing-multi-tenancy-with-jwt/)
- [Database Sharding Strategies](https://www.postgresql.org/docs/current/ddl-partitioning.html)

---

This multi-tenant authentication system provides enterprise-grade security, flexibility, and scalability for the UrutiX cargo management platform. The system is designed to handle multiple organizations while maintaining strict data isolation and security compliance. 