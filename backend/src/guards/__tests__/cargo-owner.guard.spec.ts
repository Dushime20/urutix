import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CargoOwnerGuard } from '../cargo-owner.guard';
import { Load } from '../../entities/load.entity';

describe('CargoOwnerGuard', () => {
  let guard: CargoOwnerGuard;
  let loadRepository: Repository<Load>;

  const mockLoadRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CargoOwnerGuard,
        {
          provide: getRepositoryToken(Load),
          useValue: mockLoadRepository,
        },
      ],
    }).compile();

    guard = module.get<CargoOwnerGuard>(CargoOwnerGuard);
    loadRepository = module.get<Repository<Load>>(getRepositoryToken(Load));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any, params: any = {}, body: any = {}): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body,
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when user is the cargo owner', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-123',
        tenantId: 'tenant-123',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockLoadRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'load-123' },
        select: ['id', 'cargoOwnerId', 'tenantId'],
      });
    });

    it('should allow access when user is admin in same tenant', async () => {
      const user = {
        id: 'admin-123',
        userId: 'admin-123',
        tenantId: 'tenant-123',
        role: 'ADMIN',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-456',
        tenantId: 'tenant-123',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user is super admin', async () => {
      const user = {
        id: 'super-admin-123',
        userId: 'super-admin-123',
        tenantId: 'tenant-123',
        role: 'SUPER_ADMIN',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-456',
        tenantId: 'tenant-456',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when user is not the cargo owner', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-456',
        tenantId: 'tenant-123',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('Access denied: not the cargo owner');
    });

    it('should deny access when tenant does not match', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-123',
        tenantId: 'tenant-456',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('Access denied: tenant mismatch');
    });

    it('should throw NotFoundException when load does not exist', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('Load not found');
    });

    it('should return true when no loadId is provided', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const context = createMockExecutionContext(user, {}, {});

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockLoadRepository.findOne).not.toHaveBeenCalled();
    });

    it('should extract loadId from body when not in params', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-123',
        tenantId: 'tenant-123',
      };

      const context = createMockExecutionContext(user, {}, { loadId: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(mockLoadRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'load-123' },
        select: ['id', 'cargoOwnerId', 'tenantId'],
      });
    });

    it('should throw ForbiddenException when user is not authenticated', async () => {
      const context = createMockExecutionContext(null, { id: 'load-123' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('User not authenticated');
    });

    it('should handle userId field correctly', async () => {
      const user = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const load = {
        id: 'load-123',
        cargoOwnerId: 'user-123',
        tenantId: 'tenant-123',
      };

      const context = createMockExecutionContext(user, { id: 'load-123' });
      mockLoadRepository.findOne.mockResolvedValue(load);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
