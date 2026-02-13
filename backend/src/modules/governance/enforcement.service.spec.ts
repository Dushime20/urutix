import { Test, TestingModule } from '@nestjs/testing';
import { EnforcementService } from './enforcement.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DataSource, Repository } from 'typeorm';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SuspendUserDto } from './dto/suspend-user.dto';

describe('EnforcementService', () => {
  let service: EnforcementService;
  let enforcementActionRepository: Repository<EnforcementAction>;
  let userSubscriptionRepository: Repository<UserSubscription>;
  let cacheManager: any;
  let dataSource: any;

  const mockEnforcementActionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserSubscriptionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnforcementService,
        {
          provide: getRepositoryToken(EnforcementAction),
          useValue: mockEnforcementActionRepository,
        },
        {
          provide: getRepositoryToken(UserSubscription),
          useValue: mockUserSubscriptionRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<EnforcementService>(EnforcementService);
    enforcementActionRepository = module.get(getRepositoryToken(EnforcementAction));
    userSubscriptionRepository = module.get(getRepositoryToken(UserSubscription));
    cacheManager = module.get(CACHE_MANAGER);
    dataSource = module.get(DataSource);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('suspendUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';
    const subscriptionId = 'sub-789';

    const suspendDto: SuspendUserDto = {
      reason: 'User violated terms of service by posting spam content repeatedly',
      violationCategory: 'spam',
      severity: 'high',
      adminNotes: 'Multiple warnings issued',
    };

    it('should successfully suspend a user', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'normal',
      };

      const mockEnforcementAction = {
        id: 'action-123',
        adminId,
        targetUserId: userId,
        subscriptionId,
        actionType: 'suspend',
        reason: suspendDto.reason,
        violationCategory: suspendDto.violationCategory,
        severity: suspendDto.severity,
        createdAt: new Date(),
      };

      // Mock transaction
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
          query: jest.fn().mockResolvedValue(undefined),
          create: jest.fn().mockReturnValue(mockEnforcementAction),
          save: jest.fn().mockResolvedValue(mockEnforcementAction),
        };
        return callback(mockManager);
      });

      const result = await service.suspendUser(adminId, userId, suspendDto);

      expect(result).toBeDefined();
      expect(result.actionType).toBe('suspend');
      expect(result.targetUserId).toBe(userId);
      expect(mockCacheManager.del).toHaveBeenCalledWith(`enforcement:${userId}`);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return callback(mockManager);
      });

      await expect(
        service.suspendUser(adminId, userId, suspendDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already suspended', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'suspended',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
        };
        return callback(mockManager);
      });

      await expect(
        service.suspendUser(adminId, userId, suspendDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user is terminated', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'terminated',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
        };
        return callback(mockManager);
      });

      await expect(
        service.suspendUser(adminId, userId, suspendDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle suspension with expiration date', async () => {
      const expiresAt = new Date('2026-12-31');
      const dtoWithExpiry = {
        ...suspendDto,
        expiresAt,
      };

      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'normal',
      };

      const mockEnforcementAction = {
        id: 'action-123',
        adminId,
        targetUserId: userId,
        subscriptionId,
        actionType: 'suspend',
        expiresAt,
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
          query: jest.fn().mockResolvedValue(undefined),
          create: jest.fn().mockReturnValue(mockEnforcementAction),
          save: jest.fn().mockResolvedValue(mockEnforcementAction),
        };
        return callback(mockManager);
      });

      const result = await service.suspendUser(adminId, userId, dtoWithExpiry);

      expect(result.expiresAt).toEqual(expiresAt);
    });
  });
});

  describe('unsuspendUser', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';
    const subscriptionId = 'sub-789';
    const notes = 'User has appealed successfully and provided evidence of innocence';

    it('should successfully unsuspend a user', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'suspended',
        suspended_by: 'admin-000',
        suspended_at: new Date('2026-01-01'),
        suspension_reason: 'Previous violation',
      };

      const mockEnforcementAction = {
        id: 'action-123',
        adminId,
        targetUserId: userId,
        subscriptionId,
        actionType: 'unsuspend',
        reason: notes,
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
          query: jest.fn().mockResolvedValue(undefined),
          create: jest.fn().mockReturnValue(mockEnforcementAction),
          save: jest.fn().mockResolvedValue(mockEnforcementAction),
        };
        return callback(mockManager);
      });

      const result = await service.unsuspendUser(adminId, userId, notes);

      expect(result).toBeDefined();
      expect(result.actionType).toBe('unsuspend');
      expect(mockCacheManager.del).toHaveBeenCalledWith(`enforcement:${userId}`);
    });

    it('should throw BadRequestException if user is not suspended', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'normal',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
        };
        return callback(mockManager);
      });

      await expect(
        service.unsuspendUser(adminId, userId, notes),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('restrictFeatures', () => {
    const adminId = 'admin-123';
    const userId = 'user-456';
    const subscriptionId = 'sub-789';

    const restrictDto = {
      restrictions: { canPostCargo: false, canBid: false },
      reason: 'User has been flagged for suspicious pricing patterns',
    };

    it('should successfully restrict features', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'normal',
        restrictions: {},
      };

      const mockEnforcementAction = {
        id: 'action-123',
        adminId,
        targetUserId: userId,
        subscriptionId,
        actionType: 'restrict',
        restrictionsApplied: restrictDto.restrictions,
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
          query: jest.fn().mockResolvedValue(undefined),
          create: jest.fn().mockReturnValue(mockEnforcementAction),
          save: jest.fn().mockResolvedValue(mockEnforcementAction),
        };
        return callback(mockManager);
      });

      const result = await service.restrictFeatures(adminId, userId, restrictDto);

      expect(result).toBeDefined();
      expect(result.actionType).toBe('restrict');
      expect(mockCacheManager.del).toHaveBeenCalledWith(`enforcement:${userId}`);
    });

    it('should throw BadRequestException if user is terminated', async () => {
      const mockSubscription = {
        id: subscriptionId,
        userId,
        enforcement_status: 'terminated',
      };

      mockDataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockSubscription),
        };
        return callback(mockManager);
      });

      await expect(
        service.restrictFeatures(adminId, userId, restrictDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEnforcementStatus', () => {
    const userId = 'user-456';

    it('should return cached status if available', async () => {
      const cachedStatus = {
        enforcement_status: 'normal',
        restrictions: {},
      };

      mockCacheManager.get.mockResolvedValue(cachedStatus);

      const result = await service.getEnforcementStatus(userId);

      expect(result).toEqual(cachedStatus);
      expect(mockUserSubscriptionRepository.findOne).not.toHaveBeenCalled();
    });

    it('should query database and cache result if not cached', async () => {
      const mockSubscription = {
        userId,
        enforcement_status: 'normal',
        restrictions: {},
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockUserSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getEnforcementStatus(userId);

      expect(result.enforcement_status).toBe('normal');
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `enforcement:${userId}`,
        expect.any(Object),
        60,
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockUserSubscriptionRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getEnforcementStatus(userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('canAccessFeature', () => {
    const userId = 'user-456';

    it('should return false if user is suspended', async () => {
      mockCacheManager.get.mockResolvedValue({
        enforcement_status: 'suspended',
        restrictions: {},
      });

      const result = await service.canAccessFeature(userId, 'canPostCargo');

      expect(result).toBe(false);
    });

    it('should return false if user is terminated', async () => {
      mockCacheManager.get.mockResolvedValue({
        enforcement_status: 'terminated',
        restrictions: {},
      });

      const result = await service.canAccessFeature(userId, 'canPostCargo');

      expect(result).toBe(false);
    });

    it('should return false if feature is restricted', async () => {
      mockCacheManager.get.mockResolvedValue({
        enforcement_status: 'restricted',
        restrictions: { canPostCargo: false },
      });

      const result = await service.canAccessFeature(userId, 'canPostCargo');

      expect(result).toBe(false);
    });

    it('should return true if feature is not restricted', async () => {
      mockCacheManager.get.mockResolvedValue({
        enforcement_status: 'normal',
        restrictions: {},
      });

      const result = await service.canAccessFeature(userId, 'canPostCargo');

      expect(result).toBe(true);
    });

    it('should return false on error (fail-safe)', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Cache error'));

      const result = await service.canAccessFeature(userId, 'canPostCargo');

      expect(result).toBe(false);
    });
  });
});
