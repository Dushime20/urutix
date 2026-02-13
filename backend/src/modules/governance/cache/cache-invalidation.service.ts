import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * CacheInvalidationService
 * 
 * Manages cache invalidation for enforcement status.
 * Ensures cache consistency when enforcement actions are taken.
 * 
 * Key Features:
 * - Invalidate on enforcement actions
 * - Invalidate on restriction changes
 * - Warm cache for frequently accessed users
 * - Monitor cache performance
 * 
 * Cache Strategy:
 * - Key format: enforcement:{userId}
 * - TTL: 60 seconds
 * - Invalidation: On-demand
 * - Warming: Proactive for hot users
 */
@Injectable()
export class CacheInvalidationService {
  // Track cache metrics
  private metrics = {
    invalidations: 0,
    warmings: 0,
    hits: 0,
    misses: 0,
  };

  constructor(
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  /**
   * Invalidate enforcement cache for a user
   * 
   * Called when enforcement actions are taken.
   * Ensures next request fetches fresh data.
   * 
   * @param userId - ID of the user
   */
  async invalidateUser(userId: string): Promise<void> {
    const cacheKey = `enforcement:${userId}`;
    await this.cacheManager.del(cacheKey);
    this.metrics.invalidations++;
  }

  /**
   * Invalidate enforcement cache for multiple users
   * 
   * Bulk invalidation for efficiency.
   * 
   * @param userIds - Array of user IDs
   */
  async invalidateUsers(userIds: string[]): Promise<void> {
    const promises = userIds.map(userId => this.invalidateUser(userId));
    await Promise.all(promises);
  }

  /**
   * Warm cache for a user
   * 
   * Proactively loads enforcement status into cache.
   * Useful for frequently accessed users.
   * 
   * @param userId - ID of the user
   * @param status - Enforcement status to cache
   */
  async warmCache(userId: string, status: any): Promise<void> {
    const cacheKey = `enforcement:${userId}`;
    await this.cacheManager.set(cacheKey, status, 60);
    this.metrics.warmings++;
  }

  /**
   * Warm cache for multiple users
   * 
   * Bulk warming for efficiency.
   * 
   * @param users - Array of {userId, status} objects
   */
  async warmCacheBulk(users: Array<{ userId: string; status: any }>): Promise<void> {
    const promises = users.map(({ userId, status }) => 
      this.warmCache(userId, status)
    );
    await Promise.all(promises);
  }

  /**
   * Clear all enforcement caches
   * 
   * Nuclear option - clears all enforcement caches.
   * Use sparingly (e.g., after system maintenance).
   */
  async clearAll(): Promise<void> {
    // Note: This requires cache manager to support pattern-based deletion
    // For production, implement pattern-based deletion or track keys
    console.warn('clearAll() called - this may impact performance');
    await this.cacheManager.reset();
  }

  /**
   * Get cache metrics
   * 
   * Returns cache performance metrics.
   * 
   * @returns Metrics object
   */
  getMetrics(): {
    invalidations: number;
    warmings: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Reset metrics
   * 
   * Resets cache metrics to zero.
   */
  resetMetrics(): void {
    this.metrics = {
      invalidations: 0,
      warmings: 0,
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Record cache hit
   * 
   * Called by middleware when cache hit occurs.
   */
  recordHit(): void {
    this.metrics.hits++;
  }

  /**
   * Record cache miss
   * 
   * Called by middleware when cache miss occurs.
   */
  recordMiss(): void {
    this.metrics.misses++;
  }

  /**
   * Get cache key for user
   * 
   * Utility method to get consistent cache keys.
   * 
   * @param userId - ID of the user
   * @returns Cache key
   */
  getCacheKey(userId: string): string {
    return `enforcement:${userId}`;
  }

  /**
   * Check if user is cached
   * 
   * Checks if enforcement status is in cache.
   * 
   * @param userId - ID of the user
   * @returns true if cached, false otherwise
   */
  async isCached(userId: string): Promise<boolean> {
    const cacheKey = this.getCacheKey(userId);
    const value = await this.cacheManager.get(cacheKey);
    return value !== null && value !== undefined;
  }

  /**
   * Get cache TTL for user
   * 
   * Gets remaining TTL for cached enforcement status.
   * 
   * @param userId - ID of the user
   * @returns TTL in seconds, or null if not cached
   */
  async getCacheTTL(userId: string): Promise<number | null> {
    const cacheKey = this.getCacheKey(userId);
    // Note: TTL retrieval depends on cache manager implementation
    // This is a placeholder - implement based on your cache manager
    const value = await this.cacheManager.get(cacheKey);
    return value ? 60 : null; // Default TTL
  }
}
