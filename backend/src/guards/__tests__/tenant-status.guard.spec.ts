import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantStatusGuard } from '../tenant-status.guard';
import { Tenant, TenantStatus } from '../../entities/tenant.entity';

describe('TenantStatusGuard - Task 4.2: Access Control', () => {
  let guard: TenantStatusGuard;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-1',
    status: TenantStatus.ACTIVE,
    isActive: true,
  };

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantStatusGuard,
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<TenantStatusGuard>(TenantStatusGuard);
    tenantRepository = module.get(getRepositoryToken(Tenant));
  });

  describe('canActivate', () => {
    it('should allow access for active tenant', async () => {
      const user = {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'tenant_admin',
      };

      tenantRepository.findOne.mockResolvedValue(mockTenant as Tenant);

      const context = createMockExecutionContext(user);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        select: ['id', 'status', 'isActive', 'suspendedReason'],
      });
    });

    it('should deny access for deactivated tenant', async () => {
      const user = {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'tenant_admin',
      };

      const deactivatedTenant = {
        ...mockTenant,
        status: TenantStatus.DEACTIVATED,
        isActive: false,
        suspendedReason: 'Account suspended for policy violation',
      };

      tenantRepository.findOne.mockResolvedValue(deactivatedTenant as Tenant);

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            message: 'Access denied',
            reason: 'Account suspended for policy violation',
            tenantStatus: TenantStatus.DEACTIVATED,
          }),
        })
      );
    });

    it('should deny access for suspended tenant', async () => {
      const user = {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'tenant_admin',
      };

      const suspendedTenant = {
        ...mockTenant,
        status: TenantStatus.SUSPENDED,
        isActive: false,
        suspendedReason: 'Payment overdue',
      };

      tenantRepository.findOne.mockResolvedValue(suspendedTenant as Tenant);

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow access for super admin regardless of tenant status', async () => {
      const superAdminUser = {
        id: 'super-admin-1',
        tenantId: 'tenant-1',
        role: 'super_admin',
      };

      const context = createMockExecutionContext(superAdminUser);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(tenantRepository.findOne).not.toHaveBeenCalled();
    });

    it('should deny access when user has no tenantId', async () => {
      const user = {
        id: 'user-1',
        role: 'tenant_admin',
        // no tenantId
      };

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'User is not associated with a tenant'
      );
    });

    it('should deny access when tenant not found', async () => {
      const user = {
        id: 'user-1',
        tenantId: 'non-existent',
        role: 'tenant_admin',
      };

      tenantRepository.findOne.mockResolvedValue(null);

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('Tenant not found');
    });

    it('should deny access when no user in request', async () => {
      const context = createMockExecutionContext(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should use default message when no suspension reason provided', async () => {
      const user = {
        id: 'user-1',
        tenantId: 'tenant-1',
        role: 'tenant_admin',
      };

      const deactivatedTenant = {
        ...mockTenant,
        status: TenantStatus.DEACTIVATED,
        isActive: false,
        suspendedReason: null,
      };

      tenantRepository.findOne.mockResolvedValue(deactivatedTenant as Tenant);

      const context = createMockExecutionContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(
        expect.objectContaining({
          response: expect.objectContaining({
            reason: "Your organization's account is currently inactive",
          }),
        })
      );
    });
  });
});
