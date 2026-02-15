import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TenantManagementService } from '../tenant-management.service';
import { Tenant, TenantStatus } from '../../entities/tenant.entity';
import { User } from '../../entities/user.entity';
import { TenantSubscription } from '../../entities/tenant-subscription.entity';
import { CreditAccount } from '../../entities/credit-account.entity';
import { ActivityLog } from '../../entities/activity-log.entity';
import { CreditTransaction } from '../../entities/credit-transaction.entity';

describe('TenantManagementService - Task 4.2: Status Management', () => {
  let service: TenantManagementService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let activityLogRepository: jest.Mocked<Repository<ActivityLog>>;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-1',
    name: 'Test Tenant',
    subdomain: 'test',
    status: TenantStatus.ACTIVE,
    isActive: true,
    contactEmail: 'test@example.com',
    createdAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantManagementService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
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
            create: jest.fn(),
            save: jest.fn(),
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
    activityLogRepository = module.get(getRepositoryToken(ActivityLog));
  });

  describe('setTenantStatus', () => {
    it('should activate tenant and log the action', async () => {
      const inactiveTenant = { ...mockTenant, status: TenantStatus.DEACTIVATED, isActive: false };
      tenantRepository.findOne.mockResolvedValue(inactiveTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);
      activityLogRepository.create.mockImplementation((log) => log as ActivityLog);
      activityLogRepository.save.mockResolvedValue({} as ActivityLog);
      userRepository.find.mockResolvedValue([]);

      await service.setTenantStatus(
        'tenant-1',
        true,
        'admin-user-1',
        'Reactivating tenant',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatus.ACTIVE,
          isActive: true,
          activatedAt: expect.any(Date),
          suspendedAt: null,
          suspendedReason: null,
        })
      );

      expect(activityLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-user-1',
          action: 'TENANT_STATUS_CHANGE',
          resource: 'tenant',
          resourceId: 'tenant-1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        })
      );

      expect(activityLogRepository.save).toHaveBeenCalled();
    });

    it('should deactivate tenant and log the action', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);
      activityLogRepository.create.mockImplementation((log) => log as ActivityLog);
      activityLogRepository.save.mockResolvedValue({} as ActivityLog);
      userRepository.find.mockResolvedValue([]);

      await service.setTenantStatus(
        'tenant-1',
        false,
        'admin-user-1',
        'Policy violation',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatus.DEACTIVATED,
          isActive: false,
          suspendedAt: expect.any(Date),
          suspendedReason: 'Policy violation',
        })
      );

      expect(activityLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TENANT_STATUS_CHANGE',
          details: expect.objectContaining({
            reason: 'Policy violation',
            oldStatus: TenantStatus.ACTIVE,
            newStatus: TenantStatus.DEACTIVATED,
          }),
        })
      );
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setTenantStatus('non-existent', true)
      ).rejects.toThrow(NotFoundException);
    });

    it('should terminate user sessions when deactivating', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);
      activityLogRepository.create.mockImplementation((log) => log as ActivityLog);
      activityLogRepository.save.mockResolvedValue({} as ActivityLog);
      
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
      ];
      userRepository.find.mockResolvedValue(mockUsers as User[]);

      await service.setTenantStatus('tenant-1', false);

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        select: ['id'],
      });
    });
  });

  describe('suspendTenant', () => {
    it('should suspend tenant with reason and log the action', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);
      activityLogRepository.create.mockImplementation((log) => log as ActivityLog);
      activityLogRepository.save.mockResolvedValue({} as ActivityLog);
      userRepository.find.mockResolvedValue([]);

      await service.suspendTenant(
        'tenant-1',
        'Payment overdue',
        'admin-user-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(tenantRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatus.SUSPENDED,
          isActive: false,
          suspendedAt: expect.any(Date),
          suspendedReason: 'Payment overdue',
        })
      );

      expect(activityLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TENANT_STATUS_CHANGE',
          details: expect.objectContaining({
            reason: 'Payment overdue',
            newStatus: TenantStatus.SUSPENDED,
          }),
        })
      );
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.suspendTenant('non-existent', 'Test reason')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isTenantActive', () => {
    it('should return true for active tenant', async () => {
      const activeTenant = {
        id: 'tenant-1',
        status: TenantStatus.ACTIVE,
        isActive: true,
      };
      tenantRepository.findOne.mockResolvedValue(activeTenant as Tenant);

      const result = await service.isTenantActive('tenant-1');

      expect(result).toBe(true);
    });

    it('should return false for deactivated tenant', async () => {
      const inactiveTenant = { ...mockTenant, status: TenantStatus.DEACTIVATED, isActive: false };
      tenantRepository.findOne.mockResolvedValue(inactiveTenant as Tenant);

      const result = await service.isTenantActive('tenant-1');

      expect(result).toBe(false);
    });

    it('should return false for suspended tenant', async () => {
      const suspendedTenant = { ...mockTenant, status: TenantStatus.SUSPENDED, isActive: false };
      tenantRepository.findOne.mockResolvedValue(suspendedTenant as Tenant);

      const result = await service.isTenantActive('tenant-1');

      expect(result).toBe(false);
    });

    it('should return false when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      const result = await service.isTenantActive('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getTenantStatus', () => {
    it('should return tenant status information', async () => {
      const tenant = {
        id: 'tenant-1',
        status: TenantStatus.ACTIVE,
        isActive: true,
        suspendedAt: new Date('2024-06-01'),
        suspendedReason: 'Test suspension',
        activatedAt: new Date('2024-01-15'),
      };
      tenantRepository.findOne.mockResolvedValue(tenant as Tenant);

      const result = await service.getTenantStatus('tenant-1');

      expect(result).toEqual({
        status: TenantStatus.ACTIVE,
        isActive: true,
        suspendedAt: tenant.suspendedAt,
        suspendedReason: 'Test suspension',
        activatedAt: tenant.activatedAt,
      });
    });

    it('should throw NotFoundException when tenant not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getTenantStatus('non-existent')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTenant with activity logging', () => {
    it('should log changes when updating tenant', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);
      activityLogRepository.create.mockImplementation((log) => log as ActivityLog);
      activityLogRepository.save.mockResolvedValue({} as ActivityLog);

      await service.updateTenant(
        'tenant-1',
        { name: 'Updated Name', maxUsers: 100 },
        'admin-user-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(activityLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'admin-user-1',
          action: 'TENANT_UPDATE',
          resource: 'tenant',
          resourceId: 'tenant-1',
          details: expect.objectContaining({
            changes: expect.objectContaining({
              name: { old: 'Test Tenant', new: 'Updated Name' },
              maxUsers: { old: undefined, new: 100 },
            }),
          }),
        })
      );
    });

    it('should not log when no changes are made', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);

      await service.updateTenant('tenant-1', {});

      expect(activityLogRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdateTenants with activity logging', () => {
    it('should log bulk operation summary', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);
      tenantRepository.save.mockImplementation(async (tenant) => tenant as Tenant);
      activityLogRepository.create.mockImplementation((log) => log as ActivityLog);
      activityLogRepository.save.mockResolvedValue({} as ActivityLog);

      await service.bulkUpdateTenants(
        ['tenant-1', 'tenant-2'],
        { maxUsers: 50 },
        'admin-user-1',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      // Should log individual updates + bulk summary
      expect(activityLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BULK_TENANT_UPDATE',
          resourceId: 'bulk',
          details: expect.objectContaining({
            tenantIds: ['tenant-1', 'tenant-2'],
            tenantCount: 2,
            successCount: 2,
            failedCount: 0,
          }),
        })
      );
    });
  });
});
