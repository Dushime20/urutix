import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * FeatureRestrictionGuard
 * 
 * Guard that checks if a user has access to a specific feature.
 * Works in conjunction with @RequireFeature() decorator.
 * 
 * Usage:
 * ```typescript
 * @Post('cargo')
 * @RequireFeature('canPostCargo')
 * @UseGuards(FeatureRestrictionGuard)
 * async createCargo() { ... }
 * ```
 * 
 * Flow:
 * 1. Extract required feature from decorator metadata
 * 2. Get enforcement status from request (set by middleware)
 * 3. Check if feature is restricted
 * 4. Block if restricted, allow if not
 * 
 * Note: Requires EnforcementCheckMiddleware to run first
 */
@Injectable()
export class FeatureRestrictionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required feature from decorator metadata
    const requiredFeature = this.reflector.get<string>(
      'feature',
      context.getHandler(),
    );

    // If no feature specified, allow access
    if (!requiredFeature) {
      return true;
    }

    // Get request object
    const request = context.switchToHttp().getRequest();
    
    // Get enforcement status (set by EnforcementCheckMiddleware)
    const enforcementStatus = request.enforcementStatus;

    // If no enforcement status, allow access (user not authenticated or middleware didn't run)
    if (!enforcementStatus) {
      return true;
    }

    // Get restrictions from enforcement status
    const restrictions = enforcementStatus.restrictions || {};
    
    // Check if feature is explicitly restricted (set to false)
    if (restrictions[requiredFeature] === false) {
      // Get list of all restricted features
      const restrictedFeatures = Object.keys(restrictions).filter(
        key => restrictions[key] === false
      );

      throw new ForbiddenException({
        statusCode: 403,
        error: 'Feature Restricted',
        message: `Access to '${requiredFeature}' is restricted`,
        details: {
          restricted_feature: requiredFeature,
          all_restricted_features: restrictedFeatures,
          enforcement_status: enforcementStatus.enforcement_status,
          appeal_url: '/api/governance/appeals',
        },
      });
    }

    // Feature not restricted - allow access
    return true;
  }
}
