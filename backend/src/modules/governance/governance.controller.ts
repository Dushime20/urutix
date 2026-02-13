import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInvalidationService } from './cache/cache-invalidation.service';
import { EnforcementService } from './enforcement.service';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { RestrictFeaturesDto } from './dto/restrict-features.dto';
import { TerminateSubscriptionDto } from './dto/terminate-subscription.dto';
import { ReinstateUserDto } from './dto/reinstate-user.dto';

/**
 * GovernanceController
 * 
 * Main controller for governance and abuse control endpoints.
 * Handles enforcement actions, appeals, risk flags, audit logs, and blacklist management.
 * 
 * All endpoints require authentication and Tenant Admin role.
 * Enforcement actions are logged in the immutable audit trail.
 * 
 * Base Path: /governance
 */
@ApiTags('Governance')
@ApiBearerAuth()
@Controller('governance')
export class GovernanceController {
  constructor(
    private cacheInvalidationService: CacheInvalidationService,
    private enforcementService: EnforcementService,
  ) {}

  /**
   * Get cache performance metrics
   * 
   * Returns cache hit/miss statistics for monitoring.
   * Useful for performance tuning and debugging.
   * 
   * @returns Cache metrics object
   */
  @Get('cache/metrics')
  @ApiOperation({ summary: 'Get cache performance metrics' })
  @ApiResponse({ status: 200, description: 'Cache metrics retrieved successfully' })
  getCacheMetrics() {
    return this.cacheInvalidationService.getMetrics();
  }

  /**
   * Suspend a user's account
   * 
   * POST /governance/enforcement/suspend
   * 
   * Temporarily blocks all platform access for a user.
   * Creates an immutable audit record and invalidates cache.
   * 
   * @param userId - ID of the user to suspend
   * @param dto - Suspension details (reason, category, severity, duration)
   * @param req - Request object containing admin user info
   * @returns Created enforcement action
   */
  @Post('enforcement/suspend/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Suspend a user account' })
  @ApiResponse({ status: 201, description: 'User suspended successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user already suspended or terminated' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async suspendUser(
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const action = await this.enforcementService.suspendUser(adminId, userId, dto);
    
    return {
      success: true,
      message: 'User suspended successfully',
      data: action,
    };
  }

  /**
   * Unsuspend a user's account
   * 
   * POST /governance/enforcement/unsuspend
   * 
   * Lifts suspension from a user, restoring normal platform access.
   * Creates an audit record and invalidates cache.
   * 
   * @param userId - ID of the user to unsuspend
   * @param notes - Notes explaining the unsuspension
   * @param req - Request object containing admin user info
   * @returns Created enforcement action
   */
  @Post('enforcement/unsuspend/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsuspend a user account' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user not currently suspended' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async unsuspendUser(
    @Param('userId') userId: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const action = await this.enforcementService.unsuspendUser(adminId, userId, notes);
    
    return {
      success: true,
      message: 'User unsuspended successfully',
      data: action,
    };
  }

  /**
   * Restrict specific features for a user
   * 
   * POST /governance/enforcement/restrict
   * 
   * Applies granular feature-level restrictions without full suspension.
   * Allows users to access some features while blocking others.
   * 
   * @param userId - ID of the user to restrict
   * @param dto - Restriction details (features, reason, expiration)
   * @param req - Request object containing admin user info
   * @returns Created enforcement action
   */
  @Post('enforcement/restrict/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Restrict specific features for a user' })
  @ApiResponse({ status: 201, description: 'Features restricted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user is terminated' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async restrictFeatures(
    @Param('userId') userId: string,
    @Body() dto: RestrictFeaturesDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const action = await this.enforcementService.restrictFeatures(adminId, userId, dto);
    
    return {
      success: true,
      message: 'Features restricted successfully',
      data: action,
    };
  }

  /**
   * Lift specific restrictions from a user
   * 
   * POST /governance/enforcement/lift-restrictions
   * 
   * Removes specified feature restrictions, potentially restoring full access.
   * 
   * @param userId - ID of the user
   * @param restrictions - Array of restriction keys to remove
   * @param req - Request object containing admin user info
   * @returns Created enforcement action
   */
  @Post('enforcement/lift-restrictions/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lift specific restrictions from a user' })
  @ApiResponse({ status: 200, description: 'Restrictions lifted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async liftRestrictions(
    @Param('userId') userId: string,
    @Body('restrictions') restrictions: string[],
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const action = await this.enforcementService.liftRestrictions(adminId, userId, restrictions);
    
    return {
      success: true,
      message: 'Restrictions lifted successfully',
      data: action,
    };
  }

  /**
   * Terminate a user's subscription permanently
   * 
   * POST /governance/enforcement/terminate
   * 
   * This is the most severe enforcement action. It permanently blocks
   * all platform access and optionally adds the user to the blacklist.
   * 
   * @param userId - ID of the user to terminate
   * @param dto - Termination details (reason, category, blacklist option)
   * @param req - Request object containing admin user info
   * @returns Created enforcement action
   */
  @Post('enforcement/terminate/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Terminate a user subscription permanently' })
  @ApiResponse({ status: 201, description: 'User terminated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user already terminated' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async terminateSubscription(
    @Param('userId') userId: string,
    @Body() dto: TerminateSubscriptionDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const action = await this.enforcementService.terminateSubscription(adminId, userId, dto);
    
    return {
      success: true,
      message: 'User terminated successfully',
      data: action,
    };
  }

  /**
   * Reinstate a terminated user
   * 
   * POST /governance/enforcement/reinstate
   * 
   * Restores platform access to a previously terminated user.
   * This is a rare action that requires strong justification.
   * 
   * @param userId - ID of the user to reinstate
   * @param dto - Reinstatement details (notes)
   * @param req - Request object containing admin user info
   * @returns Created enforcement action
   */
  @Post('enforcement/reinstate/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reinstate a terminated user' })
  @ApiResponse({ status: 200, description: 'User reinstated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - user not currently terminated' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async reinstateUser(
    @Param('userId') userId: string,
    @Body() dto: ReinstateUserDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    const action = await this.enforcementService.reinstateUser(adminId, userId, dto);
    
    return {
      success: true,
      message: 'User reinstated successfully',
      data: action,
    };
  }

  /**
   * Get enforcement status for a user
   * 
   * GET /governance/enforcement/status/:userId
   * 
   * Returns the complete enforcement status including restrictions.
   * Results are cached for 60 seconds to minimize database queries.
   * 
   * @param userId - ID of the user
   * @returns Enforcement status object
   */
  @Get('enforcement/status/:userId')
  @ApiOperation({ summary: 'Get enforcement status for a user' })
  @ApiResponse({ status: 200, description: 'Enforcement status retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires Tenant Admin role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getEnforcementStatus(@Param('userId') userId: string) {
    const status = await this.enforcementService.getEnforcementStatus(userId);
    
    return {
      success: true,
      data: status,
    };
  }
}
