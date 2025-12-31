# Broker Feature Implementation Plan

## 📋 Overview

This document outlines the implementation plan for adding broker functionality where each tenant can have brokers who work under them. Brokers will act as intermediaries between cargo owners and truck owners, managing loads, negotiating deals, and earning commissions.

## 🎯 Business Requirements

### Core Functionality
1. **Tenant-Broker Relationship**: Each tenant can have multiple brokers
2. **Broker Hierarchy**: Brokers work under a tenant (similar to how receivers work under cargo owners)
3. **Load Management**: Brokers can create and manage loads on behalf of cargo owners
4. **Commission Tracking**: Track commissions earned by brokers on successful transactions
5. **Access Control**: Brokers have specific permissions and access levels
6. **Broker Dashboard**: Dedicated interface for brokers to manage their operations

## 🏗️ Architecture Design

### Option 1: Use Existing AGENT Role (Recommended)
**Pros:**
- Role already exists in the system
- Minimal schema changes needed
- Faster implementation

**Cons:**
- AGENT role might be too generic if used for other purposes

### Option 2: Create New BROKER Role
**Pros:**
- Clear separation of concerns
- More specific to broker functionality
- Better for future expansion

**Cons:**
- Requires enum update and migration
- More initial setup

**Recommendation: Use Option 1 (AGENT role) initially, can migrate to BROKER later if needed**

## 📊 Database Schema Changes

### 1. User Entity Updates

Add broker relationship fields to `User` entity:

```typescript
// In user.entity.ts

@Column('uuid', { nullable: true })
brokerTenantId?: string; // ID of tenant this broker works for

@ManyToOne(() => Tenant, (tenant) => tenant.brokers, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'brokerTenantId' })
brokerTenant?: Tenant;

@OneToMany(() => Tenant, (tenant) => tenant.brokers)
brokerTenants?: Tenant[]; // If a user can be a broker for multiple tenants

// Broker commission tracking
@Column('decimal', { precision: 10, scale: 2, nullable: true, default: 0 })
totalCommissionEarned?: number;

@Column('decimal', { precision: 5, scale: 2, nullable: true })
defaultCommissionRate?: number; // Default commission percentage (e.g., 5.00 for 5%)
```

### 2. Tenant Entity Updates

Add broker relationship to `Tenant` entity:

```typescript
// In tenant.entity.ts

@OneToMany(() => User, (user) => user.brokerTenant)
brokers: User[]; // All brokers working for this tenant

@Column('jsonb', { default: {} })
brokerSettings?: {
  allowBrokers: boolean;
  defaultCommissionRate?: number;
  maxBrokers?: number;
  brokerPermissions?: string[];
};
```

### 3. Load Entity Updates

Add broker relationship to `Load` entity:

```typescript
// In load.entity.ts

@Column('uuid', { nullable: true })
brokerId?: string; // Broker who created/manages this load

@ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'brokerId' })
broker?: User;

@Column('decimal', { precision: 5, scale: 2, nullable: true })
brokerCommissionRate?: number; // Commission rate for this specific load

@Column('decimal', { precision: 15, scale: 2, nullable: true })
brokerCommissionAmount?: number; // Calculated commission amount
```

### 4. New BrokerCommission Entity

Create a new entity to track broker commissions:

```typescript
// New file: broker-commission.entity.ts

@Entity('broker_commissions')
@Index(['brokerId', 'status'])
@Index(['loadId'])
@Index(['tenantId', 'createdAt'])
export class BrokerCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  brokerId: string;

  @Column('uuid')
  loadId: string;

  @Column('uuid', { nullable: true })
  tripId?: string;

  @Column('decimal', { precision: 15, scale: 2 })
  loadAmount: number; // Total load value

  @Column('decimal', { precision: 5, scale: 2 })
  commissionRate: number; // Commission percentage

  @Column('decimal', { precision: 15, scale: 2 })
  commissionAmount: number; // Calculated commission

  @Column({
    type: 'enum',
    enum: CommissionStatus,
    default: CommissionStatus.PENDING,
  })
  status: CommissionStatus; // PENDING, APPROVED, PAID, CANCELLED

  @Column({ nullable: true })
  paidAt?: Date;

  @Column({ nullable: true })
  paymentReference?: string;

  @Column('jsonb', { default: {} })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.brokerCommissions)
  broker: User;

  @ManyToOne(() => Load)
  load: Load;

  @ManyToOne(() => Tenant)
  tenant: Tenant;
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
```

### 5. Migration File

Create migration: `1738000000000-AddBrokerFeatures.ts`

```typescript
// Migration to add broker features
export class AddBrokerFeatures1738000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add broker fields to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "brokerTenantId" uuid,
      ADD COLUMN "totalCommissionEarned" decimal(10,2) DEFAULT 0,
      ADD COLUMN "defaultCommissionRate" decimal(5,2);
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_broker_tenant"
      FOREIGN KEY ("brokerTenantId")
      REFERENCES "tenants"("id")
      ON DELETE SET NULL;
    `);

    // Add broker fields to loads table
    await queryRunner.query(`
      ALTER TABLE "loads"
      ADD COLUMN "brokerId" uuid,
      ADD COLUMN "brokerCommissionRate" decimal(5,2),
      ADD COLUMN "brokerCommissionAmount" decimal(15,2);
    `);

    // Add foreign key
    await queryRunner.query(`
      ALTER TABLE "loads"
      ADD CONSTRAINT "FK_loads_broker"
      FOREIGN KEY ("brokerId")
      REFERENCES "users"("id")
      ON DELETE SET NULL;
    `);

    // Add broker settings to tenants
    await queryRunner.query(`
      ALTER TABLE "tenants"
      ADD COLUMN "brokerSettings" jsonb DEFAULT '{}';
    `);

    // Create broker_commissions table
    await queryRunner.query(`
      CREATE TYPE "broker_commissions_status_enum" AS ENUM('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
      
      CREATE TABLE "broker_commissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "brokerId" uuid NOT NULL,
        "loadId" uuid NOT NULL,
        "tripId" uuid,
        "loadAmount" decimal(15,2) NOT NULL,
        "commissionRate" decimal(5,2) NOT NULL,
        "commissionAmount" decimal(15,2) NOT NULL,
        "status" "broker_commissions_status_enum" NOT NULL DEFAULT 'PENDING',
        "paidAt" TIMESTAMP,
        "paymentReference" character varying,
        "metadata" jsonb DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broker_commissions" PRIMARY KEY ("id")
      );
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_broker_commissions_broker_status" ON "broker_commissions" ("brokerId", "status");
      CREATE INDEX "IDX_broker_commissions_load" ON "broker_commissions" ("loadId");
      CREATE INDEX "IDX_broker_commissions_tenant_created" ON "broker_commissions" ("tenantId", "createdAt");
    `);

    // Add foreign keys
    await queryRunner.query(`
      ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_broker"
      FOREIGN KEY ("brokerId") REFERENCES "users"("id") ON DELETE CASCADE;
      
      ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_load"
      FOREIGN KEY ("loadId") REFERENCES "loads"("id") ON DELETE CASCADE;
      
      ALTER TABLE "broker_commissions"
      ADD CONSTRAINT "FK_broker_commissions_tenant"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse migration
    await queryRunner.query(`DROP TABLE IF EXISTS "broker_commissions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "broker_commissions_status_enum"`);
    await queryRunner.query(`ALTER TABLE "loads" DROP COLUMN IF EXISTS "brokerId", "brokerCommissionRate", "brokerCommissionAmount"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "brokerTenantId", "totalCommissionEarned", "defaultCommissionRate"`);
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN IF EXISTS "brokerSettings"`);
  }
}
```

## 🔧 Implementation Steps

### Phase 1: Database & Entities (Week 1)

1. **Create BrokerCommission Entity**
   - File: `backend/src/entities/broker-commission.entity.ts`
   - Define entity with all relationships

2. **Update User Entity**
   - Add broker relationship fields
   - Add commission tracking fields

3. **Update Tenant Entity**
   - Add brokers relationship
   - Add brokerSettings field

4. **Update Load Entity**
   - Add broker relationship
   - Add commission fields

5. **Create Migration**
   - Generate and test migration
   - Run migration on development database

### Phase 2: Service Layer (Week 2)

1. **Create Broker Service**
   - File: `backend/src/modules/brokers/broker.service.ts`
   - Methods:
     - `createBroker()` - Assign user as broker to tenant
     - `getBrokersByTenant()` - Get all brokers for a tenant
     - `updateBrokerSettings()` - Update broker commission rates
     - `removeBroker()` - Remove broker from tenant
     - `calculateCommission()` - Calculate commission for a load
     - `recordCommission()` - Create commission record
     - `getBrokerCommissions()` - Get commission history
     - `approveCommission()` - Approve commission payment
     - `payCommission()` - Mark commission as paid

2. **Update Load Service**
   - Add broker assignment when creating loads
   - Calculate commission when load is assigned
   - Update commission when trip is completed

3. **Update Payment Service**
   - Trigger commission calculation on payment completion
   - Link commission payments to load payments

### Phase 3: API Endpoints (Week 2-3)

1. **Create Broker Controller**
   - File: `backend/src/modules/brokers/broker.controller.ts`
   - Endpoints:
     ```
     POST   /api/brokers                    # Create/assign broker
     GET    /api/brokers                    # Get brokers (tenant-scoped)
     GET    /api/brokers/:id                # Get broker details
     PUT    /api/brokers/:id                # Update broker settings
     DELETE /api/brokers/:id                # Remove broker
     GET    /api/brokers/:id/commissions    # Get broker commissions
     POST   /api/brokers/:id/commissions/:commissionId/approve  # Approve commission
     POST   /api/brokers/:id/commissions/:commissionId/pay     # Pay commission
     GET    /api/brokers/stats              # Broker statistics
     ```

2. **Update Load Controller**
   - Add broker assignment in load creation
   - Add broker filter in load queries
   - Add broker commission info in load responses

### Phase 4: Permissions & Guards (Week 3)

1. **Create Broker Guard**
   - File: `backend/src/modules/brokers/guards/broker.guard.ts`
   - Verify user is a broker
   - Verify broker belongs to tenant

2. **Update Roles Guard**
   - Add AGENT role permissions
   - Define broker-specific permissions

3. **Broker Permissions**
   ```typescript
   export enum BrokerPermission {
     CREATE_LOADS = 'CREATE_LOADS',
     MANAGE_OWN_LOADS = 'MANAGE_OWN_LOADS',
     VIEW_ALL_LOADS = 'VIEW_ALL_LOADS',
     MANAGE_BIDS = 'MANAGE_BIDS',
     VIEW_COMMISSIONS = 'VIEW_COMMISSIONS',
     REQUEST_COMMISSION_PAYMENT = 'REQUEST_COMMISSION_PAYMENT',
   }
   ```

### Phase 5: Frontend Integration (Week 4)

1. **Broker Dashboard**
   - Broker list view
   - Broker creation/assignment form
   - Commission tracking view
   - Load management for brokers

2. **Load Management Updates**
   - Broker assignment dropdown
   - Commission rate input
   - Broker commission display

## 📝 Code Examples

### 1. Broker Service Implementation

```typescript
// backend/src/modules/brokers/broker.service.ts

@Injectable()
export class BrokerService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    @InjectRepository(BrokerCommission)
    private commissionRepository: Repository<BrokerCommission>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async createBroker(
    tenantId: string,
    userId: string,
    commissionRate?: number,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user role is AGENT or can be assigned as broker
    if (user.role !== UserRole.AGENT && user.role !== UserRole.TENANT_ADMIN) {
      throw new BadRequestException('User must have AGENT role to be a broker');
    }

    user.brokerTenantId = tenantId;
    if (commissionRate) {
      user.defaultCommissionRate = commissionRate;
    }

    return await this.userRepository.save(user);
  }

  async getBrokersByTenant(tenantId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { brokerTenantId: tenantId },
      relations: ['profile'],
    });
  }

  async calculateCommission(
    loadId: string,
    loadAmount: number,
    commissionRate?: number,
  ): Promise<number> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId },
      relations: ['broker'],
    });

    if (!load || !load.brokerId) {
      return 0;
    }

    const rate = commissionRate || 
                 load.brokerCommissionRate || 
                 load.broker?.defaultCommissionRate || 
                 0;

    return (loadAmount * rate) / 100;
  }

  async recordCommission(
    loadId: string,
    tripId: string,
    loadAmount: number,
  ): Promise<BrokerCommission> {
    const load = await this.loadRepository.findOne({
      where: { id: loadId },
      relations: ['broker', 'tenant'],
    });

    if (!load || !load.brokerId) {
      throw new BadRequestException('Load does not have an assigned broker');
    }

    const commissionAmount = await this.calculateCommission(
      loadId,
      loadAmount,
      load.brokerCommissionRate,
    );

    const commission = this.commissionRepository.create({
      tenantId: load.tenantId,
      brokerId: load.brokerId,
      loadId: loadId,
      tripId: tripId,
      loadAmount: loadAmount,
      commissionRate: load.brokerCommissionRate || load.broker?.defaultCommissionRate || 0,
      commissionAmount: commissionAmount,
      status: CommissionStatus.PENDING,
    });

    return await this.commissionRepository.save(commission);
  }

  async getBrokerCommissions(
    brokerId: string,
    status?: CommissionStatus,
  ): Promise<BrokerCommission[]> {
    const query = this.commissionRepository
      .createQueryBuilder('commission')
      .where('commission.brokerId = :brokerId', { brokerId })
      .leftJoinAndSelect('commission.load', 'load')
      .leftJoinAndSelect('commission.trip', 'trip')
      .orderBy('commission.createdAt', 'DESC');

    if (status) {
      query.andWhere('commission.status = :status', { status });
    }

    return await query.getMany();
  }
}
```

### 2. Broker Controller

```typescript
// backend/src/modules/brokers/broker.controller.ts

@Controller('brokers')
@UseGuards(JwtAuthGuard, TenantGuard)
export class BrokerController {
  constructor(private brokerService: BrokerService) {}

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN)
  async createBroker(
    @CurrentTenant() tenant: Tenant,
    @Body() createBrokerDto: CreateBrokerDto,
  ) {
    return this.brokerService.createBroker(
      tenant.id,
      createBrokerDto.userId,
      createBrokerDto.commissionRate,
    );
  }

  @Get()
  @Roles(UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.AGENT)
  async getBrokers(@CurrentTenant() tenant: Tenant) {
    return this.brokerService.getBrokersByTenant(tenant.id);
  }

  @Get(':id/commissions')
  @Roles(UserRole.AGENT, UserRole.TENANT_ADMIN, UserRole.ADMIN)
  async getCommissions(
    @Param('id') brokerId: string,
    @Query('status') status?: CommissionStatus,
  ) {
    return this.brokerService.getBrokerCommissions(brokerId, status);
  }
}
```

### 3. Load Service Integration

```typescript
// In loads.service.ts - update createLoad method

async createLoad(createLoadDto: CreateLoadDto, userId: string, tenantId: string): Promise<Load> {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  
  const load = this.loadRepository.create({
    ...createLoadDto,
    cargoOwnerId: createLoadDto.cargoOwnerId || userId,
    tenantId,
    brokerId: user?.role === UserRole.AGENT && user.brokerTenantId === tenantId 
      ? userId 
      : createLoadDto.brokerId,
    brokerCommissionRate: createLoadDto.brokerCommissionRate || user?.defaultCommissionRate,
  });

  return await this.loadRepository.save(load);
}
```

## 🔐 Security Considerations

1. **Access Control**
   - Only TENANT_ADMIN and ADMIN can assign brokers
   - Brokers can only manage loads within their tenant
   - Commission approval requires tenant admin

2. **Data Isolation**
   - All queries must be tenant-scoped
   - Brokers can only see their own commissions
   - Tenant admins can see all broker commissions

3. **Validation**
   - Verify broker belongs to tenant before assignment
   - Validate commission rates (0-100%)
   - Ensure load ownership before commission calculation

## 📊 Reporting & Analytics

1. **Broker Performance Metrics**
   - Total loads managed
   - Success rate
   - Total commissions earned
   - Average commission rate

2. **Tenant Broker Analytics**
   - Number of active brokers
   - Total commissions paid
   - Broker utilization rates

## 🚀 Future Enhancements

1. **Multi-Tenant Brokers**: Allow brokers to work for multiple tenants
2. **Broker Hierarchy**: Senior brokers managing junior brokers
3. **Commission Tiers**: Different commission rates based on volume
4. **Broker Marketplace**: Public broker directory
5. **Broker Ratings**: Rating system for brokers
6. **Automated Commission Payments**: Auto-pay commissions on trip completion

## 📚 Related Documentation

- Multi-tenant architecture: `docs/MULTI_TENANT_GUIDE.md`
- User roles: `backend/src/modules/auth/enums/user-role.enum.ts`
- Load management: `backend/src/modules/loads/`
- Payment system: `backend/src/modules/payments/`

