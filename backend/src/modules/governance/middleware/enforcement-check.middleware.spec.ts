import { Test, TestingModule } from '@nestjs/testing';
import { EnforcementCheckMiddleware } from './enforcement-check.middleware';
import { EnforcementService } from '../enforcement.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ForbiddenException } from '@nestjs/common';

describe('EnforcementCheckMiddleware', () => {
  let middleware: EnforcementCheckMiddleware;
  let enforcementService: EnforcementService;
  let cacheManager: any;

  const mockEnforcementService = {
    getEnforcementStatus: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnforcementCheckMiddleware,
        {
          provide: EnforcementService,
          useValue: mockEnforcementService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    middleware = module.get<EnforcementCheckMiddleware>(EnforcementCheckMiddleware);
    enforcementService = module.get<EnforcementService>(EnforcementService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('use', () => {
    let mockRequest: any;
    let mockResponse: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        user: { id: 'user-123' },
      };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it('should allow access for unauthenticated requests', async () => {
      mockRequest.user = undefined;

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockCacheManager.get).not.toHaveBeenCalled();
    });

    it('should allow access for normal users', async () => {
      const mockStatus = {
        enforcement_status: 'normal',
        restrictions: {},
      };

      mockCacheManager.get.mockResolvedValue(mockStatus);

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.enforcementStatus).toEqual(mockStatus);
    });

    it('should use cached enforcement status', async () => {
      const mockStatus = {
        enforcement_status: 'normal',
      };

      mockCacheManager.get.mockResolvedValue(mockStatus);

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockCacheManager.get).toHaveBeenCalledWith('enforcement:user-123');
      expect(mockEnforcementService.getEnforcementStatus).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fetch and cache enforcement status on cache miss', async () => {
      const mockStatus = {
        enforcement_status: 'normal',
      };

      mockCacheManager.get.mockResolvedValue(null); // Cache miss
      mockEnforcementService.getEnforcementStatus.mockResolvedValue(mockStatus);

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockEnforcementService.getEnforcementStatus).toHaveBeenCalledWith('user-123');
      expect(mockCacheManager.set).toHaveBeenCalledWith('enforcement:user-123', mockStatus, 60);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block suspended users', async () => {
      const mockStatus = {
        enforcement_status: 'suspended',
        suspension_reason: 'Violation of terms',
        suspended_at: new Date(),
        suspension_expires_at: new Date(Date.now() + 86400000), // Tomorrow
      };

      mockCacheManager.get.mockResolvedValue(mockStatus);

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(ForbiddenException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should block terminated users', async () => {
      const mockStatus = {
        enforcement_status: 'terminated',
        termination_reason: 'Permanent ban',
        terminated_at: new Date(),
      };

      mockCacheManager.get.mockResolvedValue(mockStatus);

      await expect(
        middleware.use(mockRequest, mockResponse, mockNext),
      ).rejects.toThrow(ForbiddenException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access if suspension has expired', async () => {
      const mockStatus = {
        enforcement_status: 'suspended',
        suspension_reason: 'Temporary suspension',
        suspended_at: new Date(Date.now() - 172800000), // 2 days ago
        suspension_expires_at: new Date(Date.now() - 86400000), // Yesterday (expired)
      };

      mockCacheManager.get.mockResolvedValue(mockStatus);

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access on error (fail-open)', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should attach enforcement status to request', async () => {
      const mockStatus = {
        enforcement_status: 'restricted',
        restrictions: { canPostCargo: false },
      };

      mockCacheManager.get.mockResolvedValue(mockStatus);

      await middleware.use(mockRequest, mockResponse, mockNext);

      expect(mockRequest.enforcementStatus).toEqual(mockStatus);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
