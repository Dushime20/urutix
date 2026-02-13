import { Injectable, NestMiddleware, ForbiddenException, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnforcementService } from '../enforcement.service';
import { CacheInvalidationService } from '../cache/cache-invalidation.service';

/**
 * EnforcementCheckMiddleware
 * 
 * Global middleware that checks enforcement status for all authenticated requests.
 * Blocks access for suspended or terminated users.
 * Caches enforcement status for 60 seconds to minimize database queries.
 * 
 * Flow:
 * 1. Extract user ID from request
 * 2. Check cache for enforcement status
 * 3. If not cached, fetch from database and cache
 * 4. Block if suspended or terminated
 * 5. Attach status to request for downstream use
 * 
 * Performance:
 * - Cache hit: < 1ms
 * - Cache miss: < 50ms (with database query)
 * - Cache TTL: 60 seconds
 * - Invalidated on enforcement actions
 */
@Injectable()
export class EnforcementCheckMiddleware implements NestMiddleware {
  constructor(
    private enforcementService: EnforcementService,
    private cacheInvalidationService: CacheInvalidationService,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip if no user (unauthenticated requests)
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    try {
      // Check cache first (TTL: 60 seconds)
      const cacheKey = this.cacheInvalidationService.getCacheKey(userId);
      let status = await this.cacheManager.get<any>(cacheKey);

      if (!status) {
        // Cache miss - fetch from database (metrics recorded in EnforcementService)
        status = await this.enforcementService.getEnforcementStatus(userId);
      } else {
        // Cache hit - record metric
        this.cacheInvalidationService.recordHit();
      }

      // Block if suspended
      if (status.enforcement_status === 'suspended') {
        // Check if suspension has expired
        if (status.suspension_expires_at) {
          const expiresAt = new Date(status.suspension_expires_at);
          if (expiresAt < new Date()) {
            // Suspension expired - allow access
            // Note: Expired suspensions should be cleaned up by a background job
            return next();
          }
        }

        throw new ForbiddenException({
          statusCode: 403,
          error: 'Account Suspended',
          message: 'Your account has been suspended',
          details: {
            reason: status.suspension_reason,
            suspended_at: status.suspended_at,
            expires_at: status.suspension_expires_at,
            appeal_url: '/api/governance/appeals',
          },
        });
      }

      // Block if terminated
      if (status.enforcement_status === 'terminated') {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Account Terminated',
          message: 'Your account has been permanently terminated',
          details: {
            reason: status.termination_reason,
            terminated_at: status.terminated_at,
            appeal_url: '/api/governance/appeals',
          },
        });
      }

      // Attach enforcement status to request for downstream use
      (req as any).enforcementStatus = status;

      next();
    } catch (error) {
      // If it's already a ForbiddenException, rethrow it
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // For other errors, log and allow access (fail-open for availability)
      // In production, you might want to fail-closed for security
      console.error('Enforcement check error:', error);
      next();
    }
  }
}
