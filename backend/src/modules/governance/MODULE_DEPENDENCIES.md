# Governance Module Dependencies

## Overview
The Governance module has been configured with the necessary dependencies to support enforcement status caching, notifications, and cross-module integration.

## Configured Dependencies

### 1. CacheModule (@nestjs/cache-manager)
**Purpose**: Enforcement status caching to minimize database queries and meet performance requirements (<10ms per request).

**Configuration**:
- **TTL**: 60 seconds (as per design document)
- **Max Entries**: 10,000 cached entries
- **Cache Key Format**: `enforcement:{userId}`

**Usage**:
- Caches enforcement status for authenticated users
- Invalidated automatically on enforcement actions (suspend, restrict, terminate, etc.)
- Reduces database load for frequently accessed user status checks

**Cache Invalidation Triggers**:
- User suspension/unsuspension
- Feature restrictions applied/lifted
- Subscription termination/reinstatement
- Blacklist additions

### 2. NotificationModule
**Purpose**: Send notifications to users and admins about enforcement actions and appeal updates.

**Exported Services**:
- `NotificationService`: Main service for sending notifications

**Use Cases**:
- User suspension notifications
- Termination notifications with appeal information
- Restriction notifications
- Reinstatement notifications
- Appeal status updates
- Admin alerts for high-risk users

### 3. TypeORM Entities
**Purpose**: Database access for governance and related entities.

**Governance Entities**:
- `EnforcementAction`: Immutable audit log of all enforcement actions
- `Appeal`: User appeals against enforcement actions
- `UserBlacklist`: Permanent bans and blacklist entries
- `RiskFlag`: Automated risk detection flags

**Related Entities**:
- `UserSubscription`: For enforcement status fields
- `User`: For admin and target user references
- `Tenant`: For tenant isolation

## Integration with App Module

The GovernanceModule has been added to `app.module.ts` and is now available throughout the application.

**Import Order**:
```typescript
import { GovernanceModule } from './modules/governance/governance.module';

@Module({
  imports: [
    // ... other modules
    TenantSubscriptionsModule,
    GovernanceModule, // Added after TenantSubscriptionsModule
  ],
})
export class AppModule {}
```

## Exported Services

The following services are exported and can be injected into other modules:

1. **GovernanceService**: Main governance orchestration service
2. **EnforcementService**: Suspension, restriction, and termination operations
3. **AppealsService**: Appeal creation and review
4. **RiskDetectionService**: Automated risk detection and flagging
5. **AuditService**: Audit trail management and export
6. **BlacklistService**: Blacklist management

## Usage Example

To use governance services in another module:

```typescript
import { Module } from '@nestjs/common';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [GovernanceModule],
  // ... controllers and providers
})
export class MyModule {
  constructor(
    private readonly enforcementService: EnforcementService,
  ) {}
}
```

## Performance Considerations

### Cache Strategy
- **Read-Through**: Check cache first, then database if miss
- **Write-Through**: Update database, then invalidate cache
- **TTL**: 60 seconds balances freshness with performance

### Expected Performance
- Cached enforcement checks: <5ms
- Uncached enforcement checks: <10ms (design requirement)
- Cache hit rate target: >90%

## Security Considerations

### Tenant Isolation
- All enforcement actions are scoped to tenant
- Cross-tenant enforcement is blocked
- Audit logs are filtered by tenant

### Authorization
- Only TENANT_ADMIN and SUPER_ADMIN can perform enforcement actions
- Role-based access control enforced at controller level
- All actions logged with admin ID and IP address

## Next Steps

With module dependencies configured, the next tasks are:

1. **Task 2.2**: Implement EnforcementService methods
2. **Task 2.3**: Implement AppealsService methods
3. **Task 2.4**: Implement RiskDetectionService methods
4. **Task 2.5**: Implement AuditService methods
5. **Task 2.6**: Implement BlacklistService methods

## Monitoring

### Metrics to Track
- Cache hit rate
- Enforcement check latency
- Notification delivery rate
- Database query performance

### Alerts
- Cache hit rate <80%
- Enforcement check latency >10ms
- Notification failures
- Database connection issues
