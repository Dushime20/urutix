import { Test, TestingModule } from '@nestjs/testing';
import { CacheInvalidationService } from './cache-invalidation.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('CacheInvalidationService', () => {
  let service: CacheInvalidationService;
  let cacheManager: any;

  const mockCacheManager = {
    del: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheInvalidationService>(CacheInvalidationService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
    service.resetMetrics();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invalidateUser', () => {
    it('should invalidate cache for a user', async () => {
      const userId = 'user-123';

      await service.invalidateUser(userId);

      expect(mockCacheManager.del).toHaveBeenCalledWith('enforcement:user-123');
    });

    it('should increment invalidation metric', async () => {
      const userId = 'user-123';

      await service.invalidateUser(userId);

      const metrics = service.getMetrics();
      expect(metrics.invalidations).toBe(1);
    });
  });

  describe('invalidateUsers', () => {
    it('should invalidate cache for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      await service.invalidateUsers(userIds);

      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
      expect(mockCacheManager.del).toHaveBeenCalledWith('enforcement:user-1');
      expect(mockCacheManager.del).toHaveBeenCalledWith('enforcement:user-2');
      expect(mockCacheManager.del).toHaveBeenCalledWith('enforcement:user-3');
    });

    it('should increment invalidation metric for each user', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      await service.invalidateUsers(userIds);

      const metrics = service.getMetrics();
      expect(metrics.invalidations).toBe(3);
    });
  });

  describe('warmCache', () => {
    it('should warm cache for a user', async () => {
      const userId = 'user-123';
      const status = {
        enforcement_status: 'normal',
        restrictions: {},
      };

      await service.warmCache(userId, status);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'enforcement:user-123',
        status,
        60,
      );
    });

    it('should increment warming metric', async () => {
      const userId = 'user-123';
      const status = { enforcement_status: 'normal' };

      await service.warmCache(userId, status);

      const metrics = service.getMetrics();
      expect(metrics.warmings).toBe(1);
    });
  });

  describe('warmCacheBulk', () => {
    it('should warm cache for multiple users', async () => {
      const users = [
        { userId: 'user-1', status: { enforcement_status: 'normal' } },
        { userId: 'user-2', status: { enforcement_status: 'restricted' } },
      ];

      await service.warmCacheBulk(users);

      expect(mockCacheManager.set).toHaveBeenCalledTimes(2);
    });

    it('should increment warming metric for each user', async () => {
      const users = [
        { userId: 'user-1', status: { enforcement_status: 'normal' } },
        { userId: 'user-2', status: { enforcement_status: 'restricted' } },
      ];

      await service.warmCacheBulk(users);

      const metrics = service.getMetrics();
      expect(metrics.warmings).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should clear all caches', async () => {
      await service.clearAll();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return cache metrics', () => {
      service.recordHit();
      service.recordHit();
      service.recordMiss();

      const metrics = service.getMetrics();

      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should calculate hit rate correctly', () => {
      service.recordHit();
      service.recordHit();
      service.recordHit();
      service.recordMiss();

      const metrics = service.getMetrics();

      expect(metrics.hitRate).toBe(75);
    });

    it('should handle zero hits and misses', () => {
      const metrics = service.getMetrics();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to zero', () => {
      service.recordHit();
      service.recordMiss();

      service.resetMetrics();

      const metrics = service.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.invalidations).toBe(0);
      expect(metrics.warmings).toBe(0);
    });
  });

  describe('recordHit', () => {
    it('should increment hit counter', () => {
      service.recordHit();
      service.recordHit();

      const metrics = service.getMetrics();
      expect(metrics.hits).toBe(2);
    });
  });

  describe('recordMiss', () => {
    it('should increment miss counter', () => {
      service.recordMiss();
      service.recordMiss();

      const metrics = service.getMetrics();
      expect(metrics.misses).toBe(2);
    });
  });

  describe('getCacheKey', () => {
    it('should return consistent cache key', () => {
      const userId = 'user-123';

      const key = service.getCacheKey(userId);

      expect(key).toBe('enforcement:user-123');
    });
  });

  describe('isCached', () => {
    it('should return true if user is cached', async () => {
      const userId = 'user-123';
      mockCacheManager.get.mockResolvedValue({ enforcement_status: 'normal' });

      const result = await service.isCached(userId);

      expect(result).toBe(true);
    });

    it('should return false if user is not cached', async () => {
      const userId = 'user-123';
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.isCached(userId);

      expect(result).toBe(false);
    });
  });

  describe('getCacheTTL', () => {
    it('should return TTL if user is cached', async () => {
      const userId = 'user-123';
      mockCacheManager.get.mockResolvedValue({ enforcement_status: 'normal' });

      const ttl = await service.getCacheTTL(userId);

      expect(ttl).toBe(60);
    });

    it('should return null if user is not cached', async () => {
      const userId = 'user-123';
      mockCacheManager.get.mockResolvedValue(null);

      const ttl = await service.getCacheTTL(userId);

      expect(ttl).toBeNull();
    });
  });
});
