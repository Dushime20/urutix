import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantVerificationMiddleware } from '../tenant-verification.middleware';
import { User } from '../../entities/user.entity';
import { Request, Response, NextFunction } from 'express';

describe('TenantVerificationMiddleware', () => {
  let middleware: TenantVerificationMiddleware;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantVerificationMiddleware,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    middleware = module.get<TenantVerificationMiddleware>(TenantVerificationMiddleware);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (user: any = null, path: string = '/api/loads'): Partial<Request> => {
    return {
      user,
      path,
      method: 'GET',
      ip: '127.0.0.1',
    } as Partial<Request>;
  };

  const mockResponse = {} as Response;
  const mockNext: NextFunction = jest.fn();

  describe('use', () => {
    it('should call next() for public routes', async () => {
      const req = createMockRequest(null, '/auth/login');

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should call next() when no user is present', async () => {
      const req = createMockRequest(null);

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should call next() when no tenantId is present', async () => {
      const req = createMockRequest({ id: 'user-123' });

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should allow super_admin to access any tenant', async () => {
      const req = createMockRequest({
        id: 'super-admin-123',
        tenantId: 'tenant-123',
        role: 'SUPER_ADMIN',
      });

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should verify user belongs to tenant and call next()', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const req = createMockRequest(user);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      });

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', tenantId: 'tenant-123' },
        select: ['id', 'tenantId', 'role'],
        cache: {
          id: 'user_tenant_verification_user-123_tenant-123',
          milliseconds: 60000,
        },
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user does not belong to tenant', async () => {
      const user = {
        id: 'user-123',
        userId: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const req = createMockRequest(user);

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        middleware.use(req as Request, mockResponse, mockNext),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        middleware.use(req as Request, mockResponse, mockNext),
      ).rejects.toThrow('Access denied: You do not have permission to access this tenant\'s resources');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle userId from sub field', async () => {
      const user = {
        sub: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const req = createMockRequest(user);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      });

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123', tenantId: 'tenant-123' },
        select: ['id', 'tenantId', 'role'],
        cache: expect.any(Object),
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw ForbiddenException on database error', async () => {
      const user = {
        id: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const req = createMockRequest(user);

      mockUserRepository.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        middleware.use(req as Request, mockResponse, mockNext),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        middleware.use(req as Request, mockResponse, mockNext),
      ).rejects.toThrow('Unable to verify tenant access. Please try again.');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip verification for /health route', async () => {
      const req = createMockRequest(null, '/health');

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should skip verification for /auth/register route', async () => {
      const req = createMockRequest(null, '/auth/register');

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should skip verification for /auth/refresh route', async () => {
      const req = createMockRequest(null, '/auth/refresh');

      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should use cache for repeated requests', async () => {
      const user = {
        id: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      };

      const req = createMockRequest(user);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'user-123',
        tenantId: 'tenant-123',
        role: 'CARGO_OWNER',
      });

      // First request
      await middleware.use(req as Request, mockResponse, mockNext);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          cache: {
            id: 'user_tenant_verification_user-123_tenant-123',
            milliseconds: 60000,
          },
        }),
      );
    });
  });
});
