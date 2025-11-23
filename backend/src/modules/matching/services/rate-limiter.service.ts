import { Injectable, Logger } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateLimit } from '../entities/rate-limit.entity';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  tenantId: string;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly inMemoryLimits = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(
    @InjectRepository(RateLimit)
    private readonly rateLimitRepository: Repository<RateLimit>,
  ) {}

  /**
   * Check if tenant has exceeded rate limit
   */
  async checkLimit(tenantId: string): Promise<void> {
    const config = this.getRateLimitConfig(tenantId);
    const key = `matching:${tenantId}`;

    try {
      // Check in-memory cache first
      const inMemoryLimit = this.inMemoryLimits.get(key);
      const now = Date.now();

      if (inMemoryLimit) {
        if (now > inMemoryLimit.resetTime) {
          // Reset window
          this.inMemoryLimits.set(key, {
            count: 1,
            resetTime: now + config.windowMs,
          });
        } else if (inMemoryLimit.count >= config.maxRequests) {
          throw new HttpException(
            `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        } else {
          inMemoryLimit.count++;
        }
      } else {
        // Initialize new window
        this.inMemoryLimits.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
        });
      }

      // Also check database for persistent tracking
      await this.checkDatabaseLimit(tenantId, config);
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error;
      }

      this.logger.warn(
        `Rate limit check failed for tenant ${tenantId}: ${error.message}`,
      );
      // Continue without rate limiting if there's an error
    }
  }

  /**
   * Get rate limit configuration for tenant
   */
  private getRateLimitConfig(tenantId: string): RateLimitConfig {
    // Default configuration
    const defaultConfig: RateLimitConfig = {
      maxRequests: 100, // 100 requests
      windowMs: 60 * 1000, // per minute
      tenantId,
    };

    // You can customize this based on tenant tier or other factors
    if (tenantId.includes('premium')) {
      defaultConfig.maxRequests = 500;
      defaultConfig.windowMs = 60 * 1000;
    } else if (tenantId.includes('enterprise')) {
      defaultConfig.maxRequests = 1000;
      defaultConfig.windowMs = 60 * 1000;
    }

    return defaultConfig;
  }

  /**
   * Check database rate limit
   */
  private async checkDatabaseLimit(
    tenantId: string,
    config: RateLimitConfig,
  ): Promise<void> {
    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Get current request count for the window
      const requestCount = await this.rateLimitRepository.count({
        where: {
          tenantId,
          createdAt: { $gte: windowStart } as any,
        },
      });

      if (requestCount >= config.maxRequests) {
        throw new HttpException(
          `Database rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Record this request
      await this.rateLimitRepository.save({
        tenantId,
        endpoint: 'matching',
        createdAt: now,
      });
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.TOO_MANY_REQUESTS
      ) {
        throw error;
      }

      this.logger.warn(`Database rate limit check failed: ${error.message}`);
      // Continue without database rate limiting if there's an error
    }
  }

  /**
   * Get current usage for tenant
   */
  async getCurrentUsage(
    tenantId: string,
  ): Promise<{ current: number; limit: number; resetTime: number }> {
    const config = this.getRateLimitConfig(tenantId);
    const key = `matching:${tenantId}`;

    const inMemoryLimit = this.inMemoryLimits.get(key);
    const now = Date.now();

    if (!inMemoryLimit || now > inMemoryLimit.resetTime) {
      return {
        current: 0,
        limit: config.maxRequests,
        resetTime: now + config.windowMs,
      };
    }

    return {
      current: inMemoryLimit.count,
      limit: config.maxRequests,
      resetTime: inMemoryLimit.resetTime,
    };
  }

  /**
   * Reset rate limit for tenant (admin function)
   */
  async resetLimit(tenantId: string): Promise<void> {
    const key = `matching:${tenantId}`;
    this.inMemoryLimits.delete(key);

    // Also clear database records
    await this.rateLimitRepository.delete({ tenantId });

    this.logger.log(`Rate limit reset for tenant: ${tenantId}`);
  }

  /**
   * Clean up expired rate limit records
   */
  async cleanupExpiredRecords(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const deletedCount = await this.rateLimitRepository.delete({
        createdAt: { $lt: cutoff } as any,
      });

      if (deletedCount.affected > 0) {
        this.logger.log(
          `Cleaned up ${deletedCount.affected} expired rate limit records`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to cleanup expired rate limit records: ${error.message}`,
      );
    }
  }
}
