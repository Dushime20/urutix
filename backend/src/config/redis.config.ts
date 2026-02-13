import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

/**
 * Redis Cache Configuration
 * 
 * Configures Redis as the cache store for the application.
 * Used primarily for enforcement status caching in the governance module.
 * 
 * Configuration:
 * - Host: From REDIS_HOST env var (default: localhost)
 * - Port: From REDIS_PORT env var (default: 6379)
 * - Password: From REDIS_PASSWORD env var (optional)
 * - TTL: 60 seconds (default, can be overridden per cache operation)
 * - Max entries: 10,000 (prevents memory overflow)
 * 
 * Environment Variables:
 * - REDIS_HOST: Redis server hostname
 * - REDIS_PORT: Redis server port
 * - REDIS_PASSWORD: Redis authentication password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - REDIS_TLS: Enable TLS connection (default: false)
 * 
 * Production Considerations:
 * - Use Redis Cluster for high availability
 * - Enable TLS for secure connections
 * - Set appropriate memory limits
 * - Configure eviction policy (allkeys-lru recommended)
 * - Monitor Redis memory usage
 * - Set up Redis persistence (AOF or RDB)
 */
export const redisConfig: CacheModuleOptions = {
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  ttl: 60, // 60 seconds default TTL
  max: 10000, // Maximum 10,000 cached entries
  // Enable TLS for production
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  // Retry strategy for connection failures
  retry_strategy: (options: any) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      // End reconnecting on a specific error and flush all commands with an error
      console.error('Redis connection refused. Please check Redis server.');
      return new Error('Redis connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      // End reconnecting after a specific timeout and flush all commands with an error
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
};

/**
 * Redis Health Check
 * 
 * Utility function to check Redis connection health.
 * Can be used in health check endpoints.
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
    });

    await client.connect();
    await client.ping();
    await client.quit();
    
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

/**
 * Redis Cache Key Patterns
 * 
 * Standardized cache key patterns for different data types.
 * Helps maintain consistency and enables pattern-based operations.
 */
export const REDIS_KEY_PATTERNS = {
  // Enforcement status: enforcement:{userId}
  ENFORCEMENT: (userId: string) => `enforcement:${userId}`,
  
  // User session: session:{sessionId}
  SESSION: (sessionId: string) => `session:${sessionId}`,
  
  // Rate limiting: ratelimit:{userId}:{endpoint}
  RATE_LIMIT: (userId: string, endpoint: string) => `ratelimit:${userId}:${endpoint}`,
  
  // Temporary locks: lock:{resource}:{id}
  LOCK: (resource: string, id: string) => `lock:${resource}:${id}`,
  
  // Blacklist check: blacklist:{email|phone}
  BLACKLIST: (identifier: string) => `blacklist:${identifier}`,
};

/**
 * Redis Cache TTLs
 * 
 * Standardized TTL values for different cache types.
 */
export const REDIS_TTL = {
  ENFORCEMENT: 60, // 60 seconds
  SESSION: 3600, // 1 hour
  RATE_LIMIT: 60, // 1 minute
  LOCK: 30, // 30 seconds
  BLACKLIST: 300, // 5 minutes
};
