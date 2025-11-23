import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Namespace for cache keys
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<
    string,
    { data: any; expiry: number; metadata: any }
  >();
  private readonly defaultTTL = 300; // 5 minutes
  private readonly maxCacheSize = 1000; // Maximum number of cached items

  constructor(private readonly configService: ConfigService) {
    // Start cleanup interval
    setInterval(() => this.cleanupExpired(), 60000); // Clean up every minute
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = this.cache.get(key);

      if (!cached) {
        return null;
      }

      // Check if expired
      if (Date.now() > cached.expiry) {
        this.cache.delete(key);
        return null;
      }

      // Update access metadata
      cached.metadata.lastAccessed = Date.now();
      cached.metadata.accessCount = (cached.metadata.accessCount || 0) + 1;

      this.logger.debug(`Cache hit for key: ${key}`);
      return cached.data as T;
    } catch (error) {
      this.logger.warn(`Cache get failed for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(
    key: string,
    value: any,
    ttl?: number,
    options?: CacheOptions,
  ): Promise<void> {
    try {
      const finalTTL = ttl || options?.ttl || this.defaultTTL;
      const expiry = Date.now() + finalTTL * 1000;

      // Check cache size limit
      if (this.cache.size >= this.maxCacheSize) {
        this.evictLeastUsed();
      }

      const metadata = {
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
        ttl: finalTTL,
        namespace: options?.namespace || 'default',
        size: this.estimateSize(value),
      };

      this.cache.set(key, {
        data: value,
        expiry,
        metadata,
      });

      this.logger.debug(`Cached value for key: ${key}, TTL: ${finalTTL}s`);
    } catch (error) {
      this.logger.warn(`Cache set failed for key ${key}: ${error.message}`);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.logger.debug(`Deleted cache key: ${key}`);
      }
      return deleted;
    } catch (error) {
      this.logger.warn(`Cache delete failed for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const cached = this.cache.get(key);
      if (!cached) {
        return false;
      }

      // Check if expired
      if (Date.now() > cached.expiry) {
        this.cache.delete(key);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `Cache has check failed for key ${key}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    hitRate: number;
    namespaceStats: Record<string, { count: number; size: number }>;
  }> {
    try {
      const totalItems = this.cache.size;
      let totalSize = 0;
      const namespaceStats: Record<string, { count: number; size: number }> =
        {};

      for (const [key, cached] of this.cache.entries()) {
        const namespace = cached.metadata.namespace;
        const size = cached.metadata.size;

        if (!namespaceStats[namespace]) {
          namespaceStats[namespace] = { count: 0, size: 0 };
        }

        namespaceStats[namespace].count++;
        namespaceStats[namespace].size += size;
        totalSize += size;
      }

      // Calculate hit rate (simplified - in production you'd track actual hits/misses)
      const hitRate = 0.75; // Placeholder

      return {
        totalItems,
        totalSize,
        hitRate,
        namespaceStats,
      };
    } catch (error) {
      this.logger.warn(`Failed to get cache stats: ${error.message}`);
      return {
        totalItems: 0,
        totalSize: 0,
        hitRate: 0,
        namespaceStats: {},
      };
    }
  }

  /**
   * Clear all cache or specific namespace
   */
  async clear(namespace?: string): Promise<number> {
    try {
      let deletedCount = 0;

      if (namespace) {
        // Clear specific namespace
        for (const [key, cached] of this.cache.entries()) {
          if (cached.metadata.namespace === namespace) {
            this.cache.delete(key);
            deletedCount++;
          }
        }
        this.logger.log(
          `Cleared cache namespace: ${namespace}, deleted ${deletedCount} items`,
        );
      } else {
        // Clear all cache
        deletedCount = this.cache.size;
        this.cache.clear();
        this.logger.log(`Cleared entire cache, deleted ${deletedCount} items`);
      }

      return deletedCount;
    } catch (error) {
      this.logger.warn(`Cache clear failed: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get cache keys by pattern
   */
  async getKeys(pattern?: string): Promise<string[]> {
    try {
      const keys = Array.from(this.cache.keys());

      if (!pattern) {
        return keys;
      }

      // Simple pattern matching (you could use more sophisticated regex)
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return keys.filter((key) => regex.test(key));
    } catch (error) {
      this.logger.warn(`Failed to get cache keys: ${error.message}`);
      return [];
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.getKeys(pattern);
      let invalidatedCount = 0;

      for (const key of keys) {
        if (await this.delete(key)) {
          invalidatedCount++;
        }
      }

      this.logger.log(
        `Invalidated ${invalidatedCount} cache keys matching pattern: ${pattern}`,
      );
      return invalidatedCount;
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate cache pattern ${pattern}: ${error.message}`,
      );
      return 0;
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpired(): void {
    try {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, cached] of this.cache.entries()) {
        if (now > cached.expiry) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
      }
    } catch (error) {
      this.logger.warn(`Cache cleanup failed: ${error.message}`);
    }
  }

  /**
   * Evict least used cache entries when size limit is reached
   */
  private evictLeastUsed(): void {
    try {
      const entries = Array.from(this.cache.entries());

      // Sort by access count and last accessed time
      entries.sort((a, b) => {
        const aScore =
          (a[1].metadata.accessCount || 0) +
          a[1].metadata.lastAccessed / 1000000;
        const bScore =
          (b[1].metadata.accessCount || 0) +
          b[1].metadata.lastAccessed / 1000000;
        return aScore - bScore;
      });

      // Remove 20% of least used entries
      const removeCount = Math.ceil(this.maxCacheSize * 0.2);
      for (let i = 0; i < removeCount && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }

      this.logger.debug(`Evicted ${removeCount} least used cache entries`);
    } catch (error) {
      this.logger.warn(`Cache eviction failed: ${error.message}`);
    }
  }

  /**
   * Estimate size of cached value
   */
  private estimateSize(value: any): number {
    try {
      const jsonString = JSON.stringify(value);
      return new Blob([jsonString]).size;
    } catch (error) {
      return 1024; // Default size if estimation fails
    }
  }

  /**
   * Preload cache with frequently accessed data
   */
  async preload(
    namespace: string,
    data: Record<string, any>,
    ttl?: number,
  ): Promise<void> {
    try {
      const promises = Object.entries(data).map(([key, value]) =>
        this.set(`${namespace}:${key}`, value, ttl, { namespace }),
      );

      await Promise.all(promises);
      this.logger.log(
        `Preloaded ${Object.keys(data).length} items for namespace: ${namespace}`,
      );
    } catch (error) {
      this.logger.warn(
        `Cache preload failed for namespace ${namespace}: ${error.message}`,
      );
    }
  }

  /**
   * Warm up cache with common queries
   */
  async warmup(): Promise<void> {
    try {
      // Add common cache warming logic here
      // For example, cache frequently accessed matching results
      this.logger.log('Cache warmup completed');
    } catch (error) {
      this.logger.warn(`Cache warmup failed: ${error.message}`);
    }
  }
}
