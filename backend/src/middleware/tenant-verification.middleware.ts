import { Injectable, NestMiddleware, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './../entities/user.entity';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to verify that the authenticated user belongs to the tenant
 * they are trying to access. This prevents cross-tenant data access.
 * 
 * Security Features:
 * - Verifies user-tenant relationship
 * - Caches verification results for performance
 * - Logs suspicious access attempts
 * - Allows super_admin to bypass for administrative tasks
 */
@Injectable()
export class TenantVerificationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantVerificationMiddleware.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Skip verification for public routes
    const publicRoutes = ['/auth/login', '/auth/register', '/auth/refresh', '/health'];
    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    const user = (req as any).user;
    
    // Skip if no user (will be caught by auth guard)
    if (!user) {
      return next();
    }

    const userId = user.id || user.userId || user.sub;
    const tenantId = user.tenantId;

    // Skip if no tenant context (some routes don't require tenant)
    if (!tenantId) {
      return next();
    }

    // Allow super_admin to access any tenant for administrative purposes
    if (user.role === 'SUPER_ADMIN') {
      this.logger.debug(`Super admin ${userId} accessing tenant ${tenantId}`);
      return next();
    }

    try {
      // Verify user belongs to tenant with caching
      const userExists = await this.userRepository.findOne({
        where: { id: userId, tenantId },
        select: ['id', 'tenantId', 'role'],
        cache: {
          id: `user_tenant_verification_${userId}_${tenantId}`,
          milliseconds: 60000, // 1 minute cache
        },
      });

      if (!userExists) {
        this.logger.warn(
          `Tenant verification failed: User ${userId} does not belong to tenant ${tenantId}`,
          {
            userId,
            tenantId,
            path: req.path,
            method: req.method,
            ip: req.ip,
          },
        );

        throw new ForbiddenException(
          'Access denied: You do not have permission to access this tenant\'s resources',
        );
      }

      // Verification successful
      this.logger.debug(`Tenant verification successful for user ${userId} in tenant ${tenantId}`);
      next();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error during tenant verification: ${error.message}`,
        error.stack,
      );

      // Fail securely - deny access on error
      throw new ForbiddenException(
        'Unable to verify tenant access. Please try again.',
      );
    }
  }
}
