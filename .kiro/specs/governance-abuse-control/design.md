# Governance / Abuse Control System - Design Document

## System Architecture

### Overview
The Governance / Abuse Control system is built as a separate module that integrates with the existing subscription system. It maintains a clear separation between financial operations and enforcement actions while providing comprehensive audit trails.

### Architecture Principles
1. **Separation of Concerns**: Financial status ≠ Enforcement status
2. **Immutable Audit Trail**: All actions are logged and cannot be modified
3. **Defense in Depth**: Multiple layers of enforcement (DB, API, UI, Middleware)
4. **Fail-Safe**: System defaults to blocking access when enforcement status is unclear
5. **Performance First**: Enforcement checks are cached and optimized

## Database Schema

### 1. Enhanced user_subscriptions Table

```sql
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS
  -- Enforcement fields
  enforcement_status VARCHAR(50) DEFAULT 'normal' CHECK (enforcement_status IN ('normal', 'suspended', 'restricted', 'terminated')),
  suspended_by UUID REFERENCES users(id),
  suspended_at TIMESTAMP,
  suspension_reason TEXT,
  suspension_expires_at TIMESTAMP,
  terminated_by UUID REFERENCES users(id),
  terminated_at TIMESTAMP,
  termination_reason TEXT,
  
  -- Restriction flags (JSONB for flexibility)
  restrictions JSONB DEFAULT '{}',
  -- Example: {"canPostCargo": false, "canAddTrucks": false, "canBid": false, "readOnly": true}
  
  -- Reinstatement tracking
  last_reinstated_by UUID REFERENCES users(id),
  last_reinstated_at TIMESTAMP,
  reinstatement_notes TEXT,
  
  -- Metadata
  enforcement_metadata JSONB DEFAULT '{}';
  -- Example: {"riskScore": 85, "violationType": "fraud", "autoFlagged": true}

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_enforcement_status ON user_subscriptions(enforcement_status);
CREATE INDEX idx_user_subscriptions_suspended_by ON user_subscriptions(suspended_by);
CREATE INDEX idx_user_subscriptions_suspension_expires ON user_subscriptions(suspension_expires_at) WHERE suspension_expires_at IS NOT NULL;
```

### 2. enforcement_actions Table (Audit Log)

```sql
CREATE TABLE enforcement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who, What, When
  admin_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
    'suspend', 'unsuspend', 'restrict', 'unrestrict', 
    'terminate', 'reinstate', 'flag', 'unflag'
  )),
  
  -- Details
  reason TEXT NOT NULL,
  violation_category VARCHAR(50) CHECK (violation_category IN (
    'fraud', 'platform_abuse', 'spam', 'illegal_listing', 
    'policy_violation', 'payment_dispute', 'system_exploitation', 'other'
  )),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Before/After state
  previous_state JSONB,
  new_state JSONB,
  
  -- Restrictions applied (if action_type = 'restrict')
  restrictions_applied JSONB,
  
  -- Duration (for temporary actions)
  expires_at TIMESTAMP,
  
  -- Evidence and notes
  evidence JSONB, -- URLs, screenshots, transaction IDs, etc.
  admin_notes TEXT,
  internal_notes TEXT, -- Not visible to user
  
  -- Appeal tracking
  is_appealed BOOLEAN DEFAULT FALSE,
  appeal_id UUID REFERENCES appeals(id),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Immutability
  is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete only, never hard delete
  deleted_at TIMESTAMP,
  deleted_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_enforcement_actions_admin ON enforcement_actions(admin_id);
CREATE INDEX idx_enforcement_actions_target_user ON enforcement_actions(target_user_id);
CREATE INDEX idx_enforcement_actions_type ON enforcement_actions(action_type);
CREATE INDEX idx_enforcement_actions_created ON enforcement_actions(created_at DESC);
CREATE INDEX idx_enforcement_actions_violation ON enforcement_actions(violation_category);
```

### 3. appeals Table

```sql
CREATE TABLE appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  enforcement_action_id UUID NOT NULL REFERENCES enforcement_actions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID REFERENCES user_subscriptions(id),
  
  -- Appeal details
  appeal_reason TEXT NOT NULL,
  user_statement TEXT,
  supporting_evidence JSONB, -- Documents, links, etc.
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'denied', 'withdrawn'
  )),
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  admin_response TEXT,
  
  -- Outcome
  outcome VARCHAR(50) CHECK (outcome IN (
    'enforcement_lifted', 'enforcement_modified', 'enforcement_upheld', 'no_action'
  )),
  outcome_details JSONB,
  
  -- Communication
  messages JSONB DEFAULT '[]', -- Thread of messages between user and admin
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_appeals_user ON appeals(user_id);
CREATE INDEX idx_appeals_status ON appeals(status);
CREATE INDEX idx_appeals_enforcement_action ON appeals(enforcement_action_id);
CREATE INDEX idx_appeals_created ON appeals(created_at DESC);
```

### 4. user_blacklist Table

```sql
CREATE TABLE user_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identifiers to block
  email VARCHAR(255),
  email_domain VARCHAR(255), -- Block entire domain
  phone_number VARCHAR(50),
  company_name VARCHAR(255),
  tax_id VARCHAR(100),
  device_fingerprint TEXT,
  ip_address INET,
  
  -- Reason
  reason TEXT NOT NULL,
  violation_category VARCHAR(50),
  
  -- Who added
  added_by UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Related enforcement
  related_user_id UUID REFERENCES users(id),
  related_enforcement_action_id UUID REFERENCES enforcement_actions(id),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP, -- NULL = permanent
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  deactivated_at TIMESTAMP,
  deactivated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_blacklist_email ON user_blacklist(email) WHERE is_active = TRUE;
CREATE INDEX idx_blacklist_domain ON user_blacklist(email_domain) WHERE is_active = TRUE;
CREATE INDEX idx_blacklist_phone ON user_blacklist(phone_number) WHERE is_active = TRUE;
CREATE INDEX idx_blacklist_tenant ON user_blacklist(tenant_id);
```

### 5. risk_flags Table (Auto-detection)

```sql
CREATE TABLE risk_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Target
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- Flag details
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN (
    'suspicious_activity', 'rapid_posting', 'price_anomaly', 
    'payment_pattern', 'duplicate_account', 'bot_behavior', 'other'
  )),
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  
  -- Detection
  detected_by VARCHAR(50) DEFAULT 'system', -- 'system', 'admin', 'user_report'
  detection_method VARCHAR(100), -- 'ml_model', 'rule_engine', 'manual'
  
  -- Details
  description TEXT,
  evidence JSONB,
  related_entities JSONB, -- Related loads, transactions, etc.
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending', 'investigating', 'confirmed', 'false_positive', 'resolved'
  )),
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  
  -- Action taken
  enforcement_action_id UUID REFERENCES enforcement_actions(id),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_risk_flags_user ON risk_flags(user_id);
CREATE INDEX idx_risk_flags_status ON risk_flags(status);
CREATE INDEX idx_risk_flags_severity ON risk_flags(severity);
CREATE INDEX idx_risk_flags_created ON risk_flags(created_at DESC);
```

## Backend Architecture

### Module Structure

```
backend/src/modules/governance/
├── governance.module.ts
├── governance.controller.ts
├── governance.service.ts
├── enforcement.service.ts
├── appeals.service.ts
├── risk-detection.service.ts
├── audit.service.ts
├── guards/
│   ├── enforcement.guard.ts
│   └── feature-restriction.guard.ts
├── middleware/
│   └── enforcement-check.middleware.ts
├── dto/
│   ├── suspend-user.dto.ts
│   ├── restrict-features.dto.ts
│   ├── terminate-subscription.dto.ts
│   ├── create-appeal.dto.ts
│   └── review-appeal.dto.ts
├── entities/
│   ├── enforcement-action.entity.ts
│   ├── appeal.entity.ts
│   ├── user-blacklist.entity.ts
│   └── risk-flag.entity.ts
└── interfaces/
    ├── enforcement-status.interface.ts
    └── restriction.interface.ts
```

### Core Services

#### 1. EnforcementService

```typescript
@Injectable()
export class EnforcementService {
  // Suspension
  async suspendUser(adminId: string, userId: string, dto: SuspendUserDto): Promise<EnforcementAction>
  async unsuspendUser(adminId: string, userId: string, notes: string): Promise<EnforcementAction>
  
  // Restrictions
  async restrictFeatures(adminId: string, userId: string, dto: RestrictFeaturesDto): Promise<EnforcementAction>
  async liftRestrictions(adminId: string, userId: string, restrictions: string[]): Promise<EnforcementAction>
  
  // Termination
  async terminateSubscription(adminId: string, userId: string, dto: TerminateDto): Promise<EnforcementAction>
  async reinstateUser(adminId: string, userId: string, notes: string): Promise<EnforcementAction>
  
  // Blacklist
  async addToBlacklist(adminId: string, dto: BlacklistDto): Promise<UserBlacklist>
  async checkBlacklist(email: string, phone?: string): Promise<boolean>
  
  // Status checks
  async getEnforcementStatus(userId: string): Promise<EnforcementStatus>
  async canAccessFeature(userId: string, feature: string): Promise<boolean>
}
```

#### 2. AppealsService

```typescript
@Injectable()
export class AppealsService {
  async createAppeal(userId: string, dto: CreateAppealDto): Promise<Appeal>
  async getAppealsByUser(userId: string): Promise<Appeal[]>
  async getPendingAppeals(tenantId: string): Promise<Appeal[]>
  async reviewAppeal(adminId: string, appealId: string, dto: ReviewAppealDto): Promise<Appeal>
  async addMessageToAppeal(appealId: string, message: string, isAdmin: boolean): Promise<Appeal>
}
```

#### 3. RiskDetectionService

```typescript
@Injectable()
export class RiskDetectionService {
  async flagUser(userId: string, dto: CreateRiskFlagDto): Promise<RiskFlag>
  async getRiskScore(userId: string): Promise<number>
  async detectSuspiciousActivity(userId: string): Promise<RiskFlag[]>
  async autoSuspendIfHighRisk(userId: string): Promise<void>
  
  // Detection methods
  private async detectRapidPosting(userId: string): Promise<boolean>
  private async detectPriceAnomalies(userId: string): Promise<boolean>
  private async detectBotBehavior(userId: string): Promise<boolean>
}
```

#### 4. AuditService

```typescript
@Injectable()
export class AuditService {
  async logEnforcementAction(action: EnforcementAction): Promise<void>
  async getAuditTrail(filters: AuditFilters): Promise<EnforcementAction[]>
  async exportAuditLog(filters: AuditFilters): Promise<Buffer>
  async getActionsByAdmin(adminId: string): Promise<EnforcementAction[]>
  async getActionsByUser(userId: string): Promise<EnforcementAction[]>
}
```

### Middleware & Guards

#### EnforcementCheckMiddleware

```typescript
@Injectable()
export class EnforcementCheckMiddleware implements NestMiddleware {
  constructor(
    private enforcementService: EnforcementService,
    private cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) return next();

    // Check cache first (TTL: 60 seconds)
    const cacheKey = `enforcement:${userId}`;
    let status = await this.cacheManager.get<EnforcementStatus>(cacheKey);

    if (!status) {
      status = await this.enforcementService.getEnforcementStatus(userId);
      await this.cacheManager.set(cacheKey, status, 60);
    }

    // Block if suspended or terminated
    if (status.enforcement_status === 'suspended') {
      throw new ForbiddenException({
        message: 'Account suspended',
        reason: status.suspension_reason,
        suspended_at: status.suspended_at,
        expires_at: status.suspension_expires_at,
        appeal_url: '/appeals/create',
      });
    }

    if (status.enforcement_status === 'terminated') {
      throw new ForbiddenException({
        message: 'Account terminated',
        reason: status.termination_reason,
        terminated_at: status.terminated_at,
        appeal_url: '/appeals/create',
      });
    }

    // Attach enforcement status to request
    req.enforcementStatus = status;
    next();
  }
}
```

#### FeatureRestrictionGuard

```typescript
@Injectable()
export class FeatureRestrictionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<string>(
      'feature',
      context.getHandler(),
    );

    if (!requiredFeature) return true;

    const request = context.switchToHttp().getRequest();
    const enforcementStatus = request.enforcementStatus;

    if (!enforcementStatus) return true;

    const restrictions = enforcementStatus.restrictions || {};
    
    // Check if feature is restricted
    if (restrictions[requiredFeature] === false) {
      throw new ForbiddenException({
        message: `Feature '${requiredFeature}' is restricted`,
        restricted_features: Object.keys(restrictions).filter(k => !restrictions[k]),
      });
    }

    return true;
  }
}
```

### API Endpoints

```typescript
// Enforcement Management
POST   /api/governance/enforcement/suspend
POST   /api/governance/enforcement/unsuspend
POST   /api/governance/enforcement/restrict
POST   /api/governance/enforcement/lift-restrictions
POST   /api/governance/enforcement/terminate
POST   /api/governance/enforcement/reinstate

// Blacklist Management
POST   /api/governance/blacklist
GET    /api/governance/blacklist
DELETE /api/governance/blacklist/:id

// Risk Flags
GET    /api/governance/risk-flags
POST   /api/governance/risk-flags
PATCH  /api/governance/risk-flags/:id/review

// Appeals
POST   /api/governance/appeals
GET    /api/governance/appeals
GET    /api/governance/appeals/:id
PATCH  /api/governance/appeals/:id/review
POST   /api/governance/appeals/:id/messages

// Audit Trail
GET    /api/governance/audit
GET    /api/governance/audit/export
GET    /api/governance/audit/user/:userId
GET    /api/governance/audit/admin/:adminId

// Dashboard
GET    /api/governance/dashboard/stats
GET    /api/governance/dashboard/flagged-users
GET    /api/governance/dashboard/pending-appeals
```

## Frontend Architecture

### Component Structure

```
frontend/src/components/Governance/
├── GovernanceDashboard.tsx
├── FlaggedUsersTable.tsx
├── UserEnforcementPanel.tsx
├── SuspendUserModal.tsx
├── RestrictFeaturesModal.tsx
├── TerminateSubscriptionModal.tsx
├── AppealsList.tsx
├── AppealReviewModal.tsx
├── AuditTrailViewer.tsx
├── RiskFlagsPanel.tsx
└── BlacklistManager.tsx
```

### Key UI Flows

#### 1. Suspend User Flow

```
1. Admin views flagged user or searches for user
2. Clicks "Suspend Account" button
3. Modal opens with:
   - User information summary
   - Violation category dropdown (required)
   - Reason text area (required, min 20 chars)
   - Duration selector (temporary/indefinite)
   - Severity indicator
   - Evidence upload (optional)
4. Admin confirms action
5. System validates and executes suspension
6. Success notification shown
7. User receives email notification
8. Action logged in audit trail
```

#### 2. Review Appeal Flow

```
1. Admin navigates to Appeals queue
2. Sees list of pending appeals with priority indicators
3. Clicks on appeal to review
4. Modal shows:
   - Original enforcement action details
   - User's appeal statement
   - Supporting evidence
   - User history
   - Risk score
   - Message thread
5. Admin can:
   - Approve (lift enforcement)
   - Deny (uphold enforcement)
   - Modify (change restrictions)
   - Request more information
6. Admin adds resolution notes
7. System updates enforcement status
8. User receives notification
9. Appeal marked as resolved
```

### Dashboard Widgets

1. **Flagged Users Widget**
   - Count of users by severity
   - Recent flags
   - Quick action buttons

2. **Active Enforcements Widget**
   - Suspended: X users
   - Restricted: Y users
   - Terminated: Z users

3. **Pending Appeals Widget**
   - Count by status
   - Average resolution time
   - Oldest pending appeal

4. **Audit Activity Widget**
   - Recent actions
   - Actions by admin
   - Action type breakdown

## Correctness Properties

### Property 1: Enforcement Immutability
**Description**: Once an enforcement action is logged, it cannot be deleted or modified, only superseded by new actions.

**Validation**: 
- All enforcement_actions records have is_deleted flag but are never hard deleted
- Updates create new records rather than modifying existing ones
- Audit trail shows complete history

### Property 2: Financial Integrity
**Description**: Enforcement actions never directly modify subscription financial records (price, payment status, billing).

**Validation**:
- Enforcement only modifies enforcement_status and restrictions fields
- Subscription status (active/expired/cancelled) remains independent
- Financial reports exclude enforcement status

### Property 3: Access Control Consistency
**Description**: A user with enforcement_status = 'suspended' or 'terminated' cannot access any protected resources.

**Validation**:
- Middleware blocks all authenticated requests
- API returns 403 Forbidden
- UI shows enforcement message
- No bypass through direct API calls

### Property 4: Audit Completeness
**Description**: Every enforcement action has a complete audit record with admin, reason, and timestamp.

**Validation**:
- Database constraints require admin_id, reason, action_type
- No enforcement action without corresponding audit log
- Audit logs include before/after state

### Property 5: Appeal Rights
**Description**: Every user subject to enforcement can create an appeal and receive a response.

**Validation**:
- Appeal creation is always available
- Appeals cannot be deleted by admins
- Users receive notification of appeal outcome
- Appeal process is documented

## Performance Optimization

### Caching Strategy

```typescript
// Cache enforcement status for 60 seconds
const ENFORCEMENT_CACHE_TTL = 60;

// Cache structure
{
  "enforcement:{userId}": {
    enforcement_status: "normal",
    restrictions: {},
    risk_score: 25,
    cached_at: "2026-02-13T10:00:00Z"
  }
}

// Invalidation triggers
- Enforcement action created
- Restrictions modified
- Suspension lifted
- User terminated
```

### Database Optimization

1. **Indexes**: All foreign keys and frequently queried fields
2. **Partitioning**: enforcement_actions table by created_at (monthly)
3. **Archival**: Move resolved appeals older than 1 year to archive table
4. **Query Optimization**: Use materialized views for dashboard stats

### API Rate Limiting

```typescript
// Enforcement endpoints (admin only)
@Throttle(100, 60) // 100 requests per minute

// Appeal creation (user)
@Throttle(5, 3600) // 5 appeals per hour

// Audit log export
@Throttle(10, 3600) // 10 exports per hour
```

## Security Considerations

### Authorization

```typescript
// Only TENANT_ADMIN and SUPER_ADMIN can enforce
@Roles('TENANT_ADMIN', 'SUPER_ADMIN')
@UseGuards(RolesGuard)

// Tenant isolation
- Admins can only enforce within their tenant
- Cross-tenant enforcement blocked
- Audit logs filtered by tenant
```

### Data Protection

1. **Encryption**: Sensitive fields (internal_notes, evidence) encrypted at rest
2. **Redaction**: User-facing messages exclude internal notes
3. **Access Logs**: All audit log access is logged
4. **GDPR**: Users can request enforcement history

### Abuse Prevention

1. **Admin Actions Audited**: All admin actions logged with IP, user agent
2. **Rate Limiting**: Prevent mass suspensions
3. **Approval Workflows**: High-severity actions require confirmation
4. **Alerts**: Notify super admins of unusual enforcement patterns

## Testing Strategy

### Unit Tests
- EnforcementService methods
- Guard logic
- Middleware enforcement checks
- DTO validation

### Integration Tests
- End-to-end enforcement flows
- Appeal process
- Audit trail generation
- Cache invalidation

### Property-Based Tests
- Enforcement immutability
- Financial integrity
- Access control consistency
- Audit completeness

## Deployment Plan

### Phase 1: Database Migration
1. Add enforcement columns to user_subscriptions
2. Create new tables (enforcement_actions, appeals, etc.)
3. Create indexes
4. Verify data integrity

### Phase 2: Backend Implementation
1. Implement core services
2. Add middleware and guards
3. Create API endpoints
4. Add tests

### Phase 3: Frontend Implementation
1. Build admin dashboard
2. Create enforcement modals
3. Add appeal interface
4. Implement audit viewer

### Phase 4: Testing & Rollout
1. QA testing
2. Security audit
3. Performance testing
4. Gradual rollout to tenants

## Monitoring & Alerts

### Metrics to Track
- Enforcement actions per day
- Appeal resolution time
- False positive rate
- Admin response time
- System performance impact

### Alerts
- High-risk user detected
- Mass enforcement action (>10 in 1 hour)
- Appeal pending >48 hours
- Enforcement check latency >100ms
- Unusual admin activity

## Documentation Requirements

1. **Admin Guide**: How to use enforcement tools
2. **User Guide**: Understanding enforcement and appeals
3. **API Documentation**: Complete endpoint reference
4. **Compliance Guide**: Audit trail and data retention
5. **Runbook**: Incident response procedures
