# Cargo Owner Backend - Critical Fixes Implementation Guide

## Priority 1: Security Fixes (IMMEDIATE)

### Fix 1: Add Authorization Guards

**File**: `backend/src/guards/cargo-owner.guard.ts` (NEW)

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Load } from '../entities/load.entity';

@Injectable()
export class CargoOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
  ) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const loadId = request.params.id || request.body.loadId;

    if (!loadId) {
      return true; // Let controller handle missing ID
    }

    const load = await this.loadRepository.findOne({
      where: { id: loadId },
      select: ['id', 'cargoOwnerId', 'tenantId'],
    });

    if (!load) {
      throw new ForbiddenException('Load not found');
    }

    // Verify tenant isolation
    if (load.tenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    // Verify ownership (unless admin/super_admin)
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(user.role) && load.cargoOwnerId !== user.id) {
      throw new ForbiddenException('Access denied: not the cargo owner');
    }

    return true;
  }
}
```

**Usage**:
```typescript
// loads.controller.ts
@Patch(':id')
@UseGuards(JwtAuthGuard, CargoOwnerGuard)
async update(@Param('id') id: string, @Body() updateDto: UpdateLoadDto) {
  // Now safe - user is verified as owner
}
```

### Fix 2: Add Tenant Verification Middleware

**File**: `backend/src/middleware/tenant-verification.middleware.ts` (NEW)

```typescript
import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class TenantVerificationMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const userId = req.user?.id || req.user?.sub;
    const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

    if (!userId || !tenantId) {
      return next();
    }

    // Verify user belongs to tenant
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      select: ['id', 'tenantId'],
      cache: {
        id: `user_tenant_${userId}_${tenantId}`,
        milliseconds: 60000, // 1 minute cache
      },
    });

    if (!user) {
      throw new ForbiddenException('User does not belong to this tenant');
    }

    next();
  }
}
```

### Fix 3: Add Input Validation

**File**: `backend/src/modules/loads/dto/create-load.dto.ts` (UPDATE)

```typescript
import { 
  IsString, IsNumber, IsOptional, IsEnum, IsArray, 
  ValidateNested, Min, Max, MaxLength, IsPositive, IsDate 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoadDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @Max(100000) // 100 tons max
  weight: number;

  @IsNumber()
  @IsPositive()
  @Max(1000000000) // 1 billion max
  @IsOptional()
  loadValue?: number;

  @IsEnum(LoadType)
  loadType: LoadType;

  @IsEnum(CargoType)
  cargoType: CargoType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoadLocationDto)
  locations: LoadLocationDto[];

  @IsDate()
  @Type(() => Date)
  pickupDate: Date;

  @IsDate()
  @Type(() => Date)
  deliveryDate: Date;
}
```

---

## Priority 1: Performance Fixes (IMMEDIATE)

### Fix 4: Add Eager Loading

**File**: `backend/src/modules/loads/loads-v2.service.ts` (UPDATE)

```typescript
async findAll(queryDto: LoadQueryV2Dto, user: User) {
  const queryBuilder = this.loadRepository.createQueryBuilder('load');

  // Add eager loading to prevent N+1
  queryBuilder
    .leftJoinAndSelect('load.cargoOwner', 'cargoOwner')
    .leftJoinAndSelect('cargoOwner.profile', 'cargoOwnerProfile')
    .leftJoinAndSelect('load.broker', 'broker')
    .leftJoinAndSelect('broker.profile', 'brokerProfile');

  // Apply filters...
  this.applyTenantFilter(queryBuilder, user);
  this.applyFilters(queryBuilder, filters);

  // Pagination with max limit
  const MAX_LIMIT = 100;
  const limit = Math.min(queryDto.limit || 20, MAX_LIMIT);
  const skip = (queryDto.page - 1) * limit;
  
  queryBuilder.skip(skip).take(limit);

  const [loads, total] = await queryBuilder.getManyAndCount();

  return {
    data: loads.map(load => this.mapToResponseDto(load)),
    meta: {
      total,
      page: queryDto.page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: queryDto.page < Math.ceil(total / limit),
      hasPreviousPage: queryDto.page > 1,
    },
  };
}
```

### Fix 5: Add Database Constraints

**File**: `backend/migrations/XXX_add_load_constraints.sql` (NEW)

```sql
-- Add check constraints
ALTER TABLE loads 
  ADD CONSTRAINT check_weight_positive CHECK (weight > 0),
  ADD CONSTRAINT check_load_value_non_negative CHECK (load_value >= 0),
  ADD CONSTRAINT check_dates_logical CHECK (delivery_date >= pickup_date),
  ADD CONSTRAINT check_volume_positive CHECK (volume IS NULL OR volume > 0);

-- Add index on deleted_at for soft delete queries
CREATE INDEX idx_loads_deleted_at ON loads(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX idx_loads_tenant_status_pickup ON loads(tenant_id, status, pickup_date) 
  WHERE deleted_at IS NULL;

-- Add index for cargo owner queries
CREATE INDEX idx_loads_cargo_owner_status ON loads(cargo_owner_id, status, created_at DESC) 
  WHERE deleted_at IS NULL;
```

---

## Priority 2: Code Quality Fixes (THIS SPRINT)

### Fix 6: Consolidate Services

**Strategy**: Deprecate LoadsService, migrate to LoadsV2Service

**Step 1**: Add deprecation warnings
```typescript
// loads.service.ts
@Injectable()
@Deprecated('Use LoadsV2Service instead. Will be removed in v3.0')
export class LoadsService {
  // ...
}
```

**Step 2**: Create migration guide
```markdown
# Migration from LoadsService to LoadsV2Service

## Breaking Changes
1. Response format changed from `{ data }` to `{ data, meta }`
2. Query parameters renamed (see table below)
3. Status enum values changed

## Migration Steps
1. Update imports
2. Update method calls
3. Update response handling
4. Test thoroughly
```

### Fix 7: Implement State Machine

**File**: `backend/src/modules/loads/load-state-machine.ts` (NEW)

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { LoadStatus } from '../../entities/load.entity';

interface StateTransition {
  from: LoadStatus;
  to: LoadStatus;
  guard?: (load: Load) => boolean;
  action?: (load: Load) => Promise<void>;
}

@Injectable()
export class LoadStateMachine {
  private transitions: StateTransition[] = [
    { from: LoadStatus.DRAFT, to: LoadStatus.PUBLISHED, guard: (load) => this.canPublish(load) },
    { from: LoadStatus.PUBLISHED, to: LoadStatus.ASSIGNED },
    { from: LoadStatus.ASSIGNED, to: LoadStatus.IN_TRANSIT },
    { from: LoadStatus.IN_TRANSIT, to: LoadStatus.DELIVERED },
    { from: LoadStatus.DELIVERED, to: LoadStatus.COMPLETED },
    // Cancellation paths
    { from: LoadStatus.DRAFT, to: LoadStatus.CANCELLED },
    { from: LoadStatus.PUBLISHED, to: LoadStatus.CANCELLED },
    { from: LoadStatus.ASSIGNED, to: LoadStatus.CANCELLED },
  ];

  canTransition(load: Load, toStatus: LoadStatus): boolean {
    const transition = this.transitions.find(
      t => t.from === load.status && t.to === toStatus
    );

    if (!transition) {
      return false;
    }

    if (transition.guard) {
      return transition.guard(load);
    }

    return true;
  }

  async transition(load: Load, toStatus: LoadStatus): Promise<void> {
    if (!this.canTransition(load, toStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${load.status} to ${toStatus}`
      );
    }

    const transition = this.transitions.find(
      t => t.from === load.status && t.to === toStatus
    );

    if (transition?.action) {
      await transition.action(load);
    }

    load.status = toStatus;
  }

  private canPublish(load: Load): boolean {
    return !!(
      load.pickupLocation &&
      load.deliveryLocation &&
      load.pickupDate &&
      load.deliveryDate
    );
  }
}
```

---

## Testing Requirements

### Unit Tests Required

```typescript
// loads.service.spec.ts
describe('LoadsService', () => {
  describe('create', () => {
    it('should verify user belongs to tenant', async () => {
      // Test tenant isolation
    });

    it('should check user permissions', async () => {
      // Test authorization
    });

    it('should validate dates', async () => {
      // Test business rules
    });
  });
});

// load-state-machine.spec.ts
describe('LoadStateMachine', () => {
  it('should allow valid transitions', () => {
    // Test state transitions
  });

  it('should reject invalid transitions', () => {
    // Test guards
  });
});
```

---

## Deployment Checklist

- [ ] Run database migrations
- [ ] Deploy new guards and middleware
- [ ] Update API documentation
- [ ] Run integration tests
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify tenant isolation
- [ ] Test authorization on all endpoints

---

## Monitoring & Alerts

Add these metrics:
1. Load creation rate per tenant
2. Failed authorization attempts
3. Query performance (p95, p99)
4. Matching algorithm execution time
5. N+1 query detection

---

**Implementation Timeline**: 2-3 sprints
**Estimated Effort**: 40-60 developer hours
