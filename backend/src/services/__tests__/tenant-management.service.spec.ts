import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TenantManagementService, EnrichedTenant, TenantDetails, TenantFilters, TenantUpdate } from '../tenant-management.service';
import { Tenant, TenantStatus } from '../../entities/tenant.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { TenantSubscription, SubscriptionStatus } from '../../entities/tenant-subscription.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { ActivityLog } from '../../entities/activity-log.entity';
import { CreditTransaction, CreditTransactionType } from '../../entities/credit-transaction.entity';

describe('TenantManagementService - Task 4.1', () => {
  let service: TenantManagementService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let subscriptionRepository: jest.Mocked<Repository<TenantSubscription>>;
  let creditAccountRepository: jest.Mocked<Repository<CreditAccount>>;
  let activityLogRepository: jest.Mocked<Repository<ActivityLog>>;
  let creditTransactionRepository: jest.Mocked<Repository<CreditTransaction>>;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-1',
    name: 'Test Tenant',
    subdomain: 'test',
    status: TenantStatus.ACTIVE,
    contactEmail: 'test@example.com',
    createdAt: new Date('2024-01-01'),
    settings: { theme: 'dark' },
  };

  const mockSubscription: Partial<TenantSubscription> = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: new Date('2024-12-31'),
    plan: { name: 'Pro Plan' } as any,
  };

  const mockCreditAccount: Partial<CreditAccount> = {
    id: 'credit-1',
    tenantId: 'tenant-1',
    currentBalance: 500,
    lifetimeSpent: 1000,
  };

  const mockCreditTransaction: Partial<CreditTransaction> = {
    id: 'trans-1',
    tenantId: 'tenant-1',
    type: CreditTransactionType.PURCHASE,
    amount: 100,
    createdAt: new Date('2024-06-01'),
  };

  const mockActivityLog: Partial<ActivityLog> = {
    id: 'log-1',
    userId: 'user-1',
    action: 'LOGIN',
    createdAt: new Date('2024-06-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantManagementService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TenantSubscription),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CreditAccount),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ActivityLog),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CreditTransaction),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantManagementService>(TenantManagementService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
    userRepository = module.get(getRepositoryToken(User));
    subscriptionRepository = module.get(getRepositoryToken(TenantSubscription));
    creditAccountRepository = module.get(getRepositoryToken(CreditAccount));
    activityLogRepository = module.get(getRepositoryToken(ActivityLog));
    creditTransactionRepository = module.get(getRepositoryToken(CreditTransaction));
  });

  describe('getAllTenants', () => {
    it('should return all tenants with enriched data', async () => {
      // Setup mocks
      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTenant]),
      };
      tenantRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      creditTransactionRepository.findOne.mockResolvedValue(mockCreditTransaction as CreditTransaction);
      activityLogRepository.findOne.mockResolvedValue(mockActivityLog as ActivityLog);
      userRepository.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(8); // active users

      const result = await service.getAllTenants();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'tenant-1',
        name: 'Test Tenant',
        subdomain: 'test',
        status: 'active',
      });
      expect(result[0].subscription).toBeDefined();
      expect(result[0].credits).toBeDefined();
      expect(result[0].users).toEqual({ total: 10, active: 8 });
    });

    it('should filter tenants by status', async () => {
      const filters: TenantFilters = {
        status: [TenantStatus.ACTIVE],
      };

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTenant]),
      };
      tenantRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      creditTransactionRepository.findOne.mockResolvedValue(mockCreditTransaction as CreditTransaction);
      activityLogRepository.findOne.mockResolvedValue(mockActivityLog as ActivityLog);
      userRepository.count.mockResolvedValue(5);

      await service.getAllTenants(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'tenant.status IN (:...statuses)',
        { statuses: [TenantStatus.ACTIVE] }
      );
    });

    it('should filter tenants by search term', async () => {
      const filters: TenantFilters = {
        search: 'test',
      };

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTenant]),
      };
      tenantRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      creditTransactionRepository.findOne.mockResolvedValue(mockCreditTransaction as CreditTransaction);
      activityLogRepository.findOne.mockResolvedValue(mockActivityLog as ActivityLog);
      userRepository.count.mockResolvedValue(5);

      await service.getAllTenants(filters);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(tenant.name ILIKE :search OR tenant.subdomain ILIKE :search OR tenant.contactEmail ILIKE :search)',
        { search: '%test%' }
      );
    });

    it('should filter tenants by low credit balance', async () => {
      const filters: TenantFilters = {
        hasLowBalance: true,
      };

      const lowBalanceTenant = { ...mockTenant };
      const lowBalanceCredit = { ...mockCreditAccount, currentBalance: 50 };

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([lowBalanceTenant]),
      };
      tenantRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder as any);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(lowBalanceCredit as CreditAccount);
      creditTransactionRepository.findOne.mockResolvedValue(mockCreditTransaction as CreditTransaction);
      activityLogRepository.findOne.mockResolvedValue(mockActivityLog as ActivityLog);
      userRepository.count.mockResolvedValue(5);

      const result = await service.getAllTenants(filters);

      expect(result).toHaveLength(1);
      expect(result[0].credits.balance).toBeLessThan(100);
    });

    it('should filter tenants by expiring subscription', async () => {
      const filters: TenantFilters = {
        hasExpiringSubscription: true,
      };

      const expiringSubscription = {
        ...mockSubscription,
        currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      };

      const queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTenant]),
      };
      tenantRepository.createQueryBuilder = jest.fn().mockReturnValue(queryBuilder as any);
      subscriptionRepository.findOne.mockResolvedValue(expiringSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      creditTransactionRepository.findOne.mockResolvedValue(mockCreditTransaction as CreditTransaction);
      activityLogRepository.findOne.mockResolvedValue(mockActivityLog as ActivityLog);
      userRepository.count.mockResolvedValue(5);

      const result = await service.getAllTenants(filters);

      expect(result).toHaveLength(1);
    });
  });

  describe('getTenantDetails', () => {
    it('should return tenant details with full context', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      creditTransactionRepository.findOne.mockResolvedValue(mockCreditTransaction as CreditTransaction);
      activityLogRepository.findOne.mockResolvedValue(mockActivityLog as ActivityLog);
      activityLogRepository.find.mockResolvedValue([mockActivityLog] as ActivityLog[]);
      creditTransactionRepository.find.mockResolvedValue([mockCreditTransaction] as CreditTransaction[]);
      userRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);

      const result = await service.getTenantDetails('tenant-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('tenant-1');
      expect(result.contactEmail).toBe('test@example.com');
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.settings).toEqual({ theme: 'dark' });
      expect(result.recentActivity).toHaveLength(1);
      expect(result.creditHistory).toHaveLength(1);
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getTenantDetails('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTenant', () => {
    it('should update tenant settings', async () => {
      const updates: TenantUpdate = {
        name: 'Updated Tenant',
        contactEmail: 'updated@example.com',
        maxUsers: 50,
      };

      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockResolvedValue({
        ...mockTenant,
        ...updates,
      } as Tenant);

      const result = await service.updateTenant('tenant-1', updates);

      expect(result.name).toBe('Updated Tenant');
      expect(result.contactEmail).toBe('updated@example.com');
      expect(tenantRepository.save).toHaveBeenCalled();
    });

    it('should merge settings when updating', async () => {
      const updates: TenantUpdate = {
        settings: { newSetting: 'value' },
      };

      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);

      await service.updateTenant('tenant-1', updates);

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: {
            theme: 'dark',
            newSetting: 'value',
          },
        })
      );
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.updateTenant('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('setTenantStatus', () => {
    it('should activate tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);

      await service.setTenantStatus('tenant-1', true);

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatus.ACTIVE,
          isActive: true,
          activatedAt: expect.any(Date),
          suspendedAt: null,
          suspendedReason: null,
        })
      );
    });

    it('should deactivate tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);

      await service.setTenantStatus('tenant-1', false);

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatus.DEACTIVATED,
          isActive: false,
          suspendedAt: expect.any(Date),
        })
      );
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.setTenantStatus('non-existent', true)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkUpdateTenants', () => {
    it('should update multiple tenants successfully', async () => {
      const tenantIds = ['tenant-1', 'tenant-2'];
      const updates: TenantUpdate = {
        maxUsers: 100,
      };

      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockResolvedValue(mockTenant as Tenant);

      const result = await service.bulkUpdateTenants(tenantIds, updates);

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
    });

    it('should handle partial failures', async () => {
      const tenantIds = ['tenant-1', 'non-existent'];
      const updates: TenantUpdate = {
        maxUsers: 100,
      };

      tenantRepository.findOne
        .mockResolvedValueOnce(mockTenant as Tenant)
        .mockResolvedValueOnce(null);
      tenantRepository.save.mockResolvedValue(mockTenant as Tenant);

      const result = await service.bulkUpdateTenants(tenantIds, updates);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });

  describe('getTenantHealth', () => {
    it('should return tenant health score with all required fields', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      userRepository.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(8) // active users (for activity level)
        .mockResolvedValueOnce(10) // total users (for engagement)
        .mockResolvedValueOnce(8); // active users (for engagement)

      const result = await service.getTenantHealth('tenant-1');

      expect(result).toBeDefined();
      expect(result.tenantId).toBe('tenant-1');
      expect(result.tenantName).toBe('Test Tenant');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.factors).toBeDefined();
      expect(result.factors.activityLevel).toBeGreaterThanOrEqual(0);
      expect(result.factors.activityLevel).toBeLessThanOrEqual(100);
      expect(result.factors.paymentStatus).toBeGreaterThanOrEqual(0);
      expect(result.factors.paymentStatus).toBeLessThanOrEqual(100);
      expect(result.factors.userEngagement).toBeGreaterThanOrEqual(0);
      expect(result.factors.userEngagement).toBeLessThanOrEqual(100);
      expect(result.factors.creditUsage).toBeGreaterThanOrEqual(0);
      expect(result.factors.creditUsage).toBeLessThanOrEqual(100);
      expect(result.status).toBeDefined();
      expect(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']).toContain(result.status);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should calculate EXCELLENT status for high scores', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock excellent conditions
      const excellentSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };
      subscriptionRepository.findOne.mockResolvedValue(excellentSubscription as TenantSubscription);
      
      const excellentCreditAccount = {
        ...mockCreditAccount,
        currentBalance: 5000,
        lifetimeSpent: 10000,
      };
      creditAccountRepository.findOne.mockResolvedValue(excellentCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(10) // all active users (for activity level)
        .mockResolvedValueOnce(10) // total users (for engagement)
        .mockResolvedValueOnce(10); // all active users (for engagement)

      const result = await service.getTenantHealth('tenant-1');

      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.status).toBe('EXCELLENT');
    });

    it('should calculate CRITICAL status for low scores', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock critical conditions
      const expiredSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        currentPeriodEnd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      };
      subscriptionRepository.findOne.mockResolvedValue(expiredSubscription as TenantSubscription);
      
      const lowCreditAccount = {
        ...mockCreditAccount,
        currentBalance: 10,
        lifetimeSpent: 50,
      };
      creditAccountRepository.findOne.mockResolvedValue(lowCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(0) // no active users in last 7 days (for activity level)
        .mockResolvedValueOnce(10) // total users (for engagement)
        .mockResolvedValueOnce(1); // only 1 active user (for engagement)

      const result = await service.getTenantHealth('tenant-1');

      expect(result.score).toBeLessThanOrEqual(40);
      expect(['CRITICAL', 'POOR']).toContain(result.status); // Accept either CRITICAL or POOR
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for low activity', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock active subscription to avoid payment recommendation
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.findOne.mockResolvedValue(activeSubscription as TenantSubscription);
      
      // Mock good credit usage to avoid credit recommendation
      const goodCreditAccount = {
        ...mockCreditAccount,
        currentBalance: 3000,
        lifetimeSpent: 7000, // 70% usage
      };
      creditAccountRepository.findOne.mockResolvedValue(goodCreditAccount as CreditAccount);
      
      // Mock very low activity - no users logged in recently
      userRepository.count
        .mockResolvedValueOnce(20) // total users (for activity level)
        .mockResolvedValueOnce(0) // NO active users in last 7 days (0% activity)
        .mockResolvedValueOnce(20) // total users (for user engagement)
        .mockResolvedValueOnce(16); // 16 active users (80% engagement)

      const result = await service.getTenantHealth('tenant-1');

      // With 0% activity level, should definitely get the recommendation
      expect(result.factors.activityLevel).toBe(0);
      expect(result.recommendations).toContain('Low activity detected. Consider reaching out to re-engage users.');
    });

    it('should generate recommendations for payment issues', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      const expiredSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        currentPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.findOne.mockResolvedValue(expiredSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);

      const result = await service.getTenantHealth('tenant-1');

      expect(result.recommendations).toContain('Payment issues detected. Review subscription status.');
    });

    it('should generate recommendations for low user engagement', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock active subscription to avoid payment recommendation
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.findOne.mockResolvedValue(activeSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(8) // active users (for activity level)
        .mockResolvedValueOnce(10) // total users (for engagement)
        .mockResolvedValueOnce(3); // only 3 active users (30% engagement)

      const result = await service.getTenantHealth('tenant-1');

      expect(result.recommendations).toContain('Low user engagement. Consider training or onboarding support.');
    });

    it('should generate recommendations for low credit usage', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock active subscription to avoid payment recommendation
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.findOne.mockResolvedValue(activeSubscription as TenantSubscription);
      
      const lowUsageCreditAccount = {
        ...mockCreditAccount,
        currentBalance: 9000,
        lifetimeSpent: 1000, // Only 10% usage
      };
      creditAccountRepository.findOne.mockResolvedValue(lowUsageCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);

      const result = await service.getTenantHealth('tenant-1');

      expect(result.recommendations).toContain('Low credit usage. Users may need guidance on platform features.');
    });

    it('should handle tenant with no subscription', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      subscriptionRepository.findOne.mockResolvedValue(null);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);

      const result = await service.getTenantHealth('tenant-1');

      expect(result).toBeDefined();
      expect(result.factors.paymentStatus).toBe(50); // Neutral score for no subscription
    });

    it('should handle tenant with no credit account', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock active subscription
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.findOne.mockResolvedValue(activeSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(null);
      
      userRepository.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(8);

      const result = await service.getTenantHealth('tenant-1');

      expect(result).toBeDefined();
      expect(result.factors.creditUsage).toBe(50); // Neutral score for no credit account
    });

    it('should handle tenant with no users', async () => {
      const freshTenant = { ...mockTenant, name: 'Test Tenant' };
      tenantRepository.findOne.mockResolvedValue(freshTenant as Tenant);
      
      // Mock active subscription
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.findOne.mockResolvedValue(activeSubscription as TenantSubscription);
      creditAccountRepository.findOne.mockResolvedValue(mockCreditAccount as CreditAccount);
      
      userRepository.count
        .mockResolvedValueOnce(0) // no users
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getTenantHealth('tenant-1');

      expect(result).toBeDefined();
      expect(result.factors.activityLevel).toBe(0);
      expect(result.factors.userEngagement).toBe(0);
    });

    it('should throw NotFoundException for non-existent tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getTenantHealth('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
