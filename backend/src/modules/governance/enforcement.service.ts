import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { CacheInvalidationService } from './cache/cache-invalidation.service';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { RestrictFeaturesDto } from './dto/restrict-features.dto';
import { TerminateSubscriptionDto } from './dto/terminate-subscription.dto';
import { ReinstateUserDto } from './dto/reinstate-user.dto';

/**
 * EnforcementService
 * 
 * Handles user suspension, restriction, termination, and reinstatement operations.
 * Manages enforcement status and feature restrictions.
 * 
 * Key Methods (to be implemented in Task 2.2):
 * - suspendUser: Temporarily suspend a user's account
 * - unsuspendUser: Lift suspension from a user
 * - restrictFeatures: Apply feature-level restrictions
 * - liftRestrictions: Remove specific restrictions
 * - terminateSubscription: Permanently terminate a user
 * - reinstateUser: Reinstate a terminated user
 * - getEnforcementStatus: Get current enforcement status
 * - canAccessFeature: Check if user can access a feature
 */
@Injectable()
export class EnforcementService {
  constructor(
    @InjectRepository(EnforcementAction)
    private enforcementActionRepository: Repository<EnforcementAction>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private cacheInvalidationService: CacheInvalidationService,
    private dataSource: DataSource,
  ) {}

  /**
   * Suspend a user's account
   * 
   * This method temporarily blocks all platform access for a user.
   * It updates the user_subscriptions table with suspension details,
   * creates an immutable audit record, and invalidates the cache.
   * 
   * @param adminId - ID of the admin performing the suspension
   * @param userId - ID of the user to suspend
   * @param dto - Suspension details (reason, category, severity, duration)
   * @returns The created EnforcementAction audit record
   * 
   * @throws NotFoundException if user subscription not found
   * @throws BadRequestException if user is already suspended or terminated
   */
  async suspendUser(
    adminId: string,
    userId: string,
    dto: SuspendUserDto,
  ): Promise<EnforcementAction> {
    // Use transaction for atomicity
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException(`User subscription not found for user ${userId}`);
      }

      // 2. Check if user is already suspended or terminated
      const currentStatus = (subscription as any).enforcement_status || 'normal';
      if (currentStatus === 'suspended') {
        throw new BadRequestException('User is already suspended');
      }
      if (currentStatus === 'terminated') {
        throw new BadRequestException('Cannot suspend a terminated user');
      }

      // 3. Capture previous state for audit trail
      const previousState = {
        enforcement_status: currentStatus,
        suspended_by: (subscription as any).suspended_by,
        suspended_at: (subscription as any).suspended_at,
        suspension_reason: (subscription as any).suspension_reason,
        suspension_expires_at: (subscription as any).suspension_expires_at,
      };

      // 4. Update user_subscriptions with suspension details
      await manager.query(
        `UPDATE user_subscriptions 
         SET enforcement_status = $1,
             suspended_by = $2,
             suspended_at = $3,
             suspension_reason = $4,
             suspension_expires_at = $5
         WHERE id = $6`,
        [
          'suspended',
          adminId,
          new Date(),
          dto.reason,
          dto.expiresAt || null,
          subscription.id,
        ],
      );

      // 5. Create new state for audit trail
      const newState = {
        enforcement_status: 'suspended',
        suspended_by: adminId,
        suspended_at: new Date(),
        suspension_reason: dto.reason,
        suspension_expires_at: dto.expiresAt || null,
      };

      // 6. Create EnforcementAction audit record
      const enforcementAction = manager.create(EnforcementAction, {
        adminId,
        targetUserId: userId,
        subscriptionId: subscription.id,
        actionType: 'suspend',
        reason: dto.reason,
        violationCategory: dto.violationCategory,
        severity: dto.severity,
        previousState,
        newState,
        expiresAt: dto.expiresAt,
        adminNotes: dto.adminNotes,
        internalNotes: dto.internalNotes,
        evidence: dto.evidence,
      });

      const savedAction = await manager.save(EnforcementAction, enforcementAction);

      // 7. Invalidate cache for this user
      const cacheKey = `enforcement:${userId}`;
      await this.cacheManager.del(cacheKey);

      return savedAction;
    });
  }

  /**
   * Unsuspend a user's account
   * 
   * Lifts the suspension from a user, restoring normal platform access.
   * Creates an audit record and invalidates the cache.
   * 
   * @param adminId - ID of the admin performing the unsuspension
   * @param userId - ID of the user to unsuspend
   * @param notes - Notes explaining the unsuspension
   * @returns The created EnforcementAction audit record
   * 
   * @throws NotFoundException if user subscription not found
   * @throws BadRequestException if user is not currently suspended
   */
  async unsuspendUser(
    adminId: string,
    userId: string,
    notes: string,
  ): Promise<EnforcementAction> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException(`User subscription not found for user ${userId}`);
      }

      // 2. Check if user is currently suspended
      const currentStatus = (subscription as any).enforcement_status || 'normal';
      if (currentStatus !== 'suspended') {
        throw new BadRequestException('User is not currently suspended');
      }

      // 3. Capture previous state for audit trail
      const previousState = {
        enforcement_status: currentStatus,
        suspended_by: (subscription as any).suspended_by,
        suspended_at: (subscription as any).suspended_at,
        suspension_reason: (subscription as any).suspension_reason,
        suspension_expires_at: (subscription as any).suspension_expires_at,
      };

      // 4. Update user_subscriptions to lift suspension
      await manager.query(
        `UPDATE user_subscriptions 
         SET enforcement_status = $1,
             suspended_by = NULL,
             suspended_at = NULL,
             suspension_reason = NULL,
             suspension_expires_at = NULL,
             last_reinstated_by = $2,
             last_reinstated_at = $3,
             reinstatement_notes = $4
         WHERE id = $5`,
        [
          'normal',
          adminId,
          new Date(),
          notes,
          subscription.id,
        ],
      );

      // 5. Create new state for audit trail
      const newState = {
        enforcement_status: 'normal',
        last_reinstated_by: adminId,
        last_reinstated_at: new Date(),
        reinstatement_notes: notes,
      };

      // 6. Create EnforcementAction audit record
      const enforcementAction = manager.create(EnforcementAction, {
        adminId,
        targetUserId: userId,
        subscriptionId: subscription.id,
        actionType: 'unsuspend',
        reason: notes,
        previousState,
        newState,
        adminNotes: notes,
      });

      const savedAction = await manager.save(EnforcementAction, enforcementAction);

      // 7. Invalidate cache for this user
      await this.cacheInvalidationService.invalidateUser(userId);

      return savedAction;
    });
  }

  /**
   * Restrict specific features for a user
   * 
   * Applies granular feature-level restrictions without full suspension.
   * Allows users to access some features while blocking others.
   * 
   * @param adminId - ID of the admin applying restrictions
   * @param userId - ID of the user to restrict
   * @param dto - Restriction details (features, reason, expiration)
   * @returns The created EnforcementAction audit record
   * 
   * @throws NotFoundException if user subscription not found
   * @throws BadRequestException if user is terminated
   */
  async restrictFeatures(
    adminId: string,
    userId: string,
    dto: RestrictFeaturesDto,
  ): Promise<EnforcementAction> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException(`User subscription not found for user ${userId}`);
      }

      // 2. Check if user is terminated
      const currentStatus = (subscription as any).enforcement_status || 'normal';
      if (currentStatus === 'terminated') {
        throw new BadRequestException('Cannot restrict features for a terminated user');
      }

      // 3. Get current restrictions
      const currentRestrictions = (subscription as any).restrictions || {};

      // 4. Merge new restrictions with existing ones
      const mergedRestrictions = {
        ...currentRestrictions,
        ...dto.restrictions,
      };

      // 5. Capture previous state for audit trail
      const previousState = {
        enforcement_status: currentStatus,
        restrictions: currentRestrictions,
      };

      // 6. Update user_subscriptions with restrictions
      await manager.query(
        `UPDATE user_subscriptions 
         SET enforcement_status = $1,
             restrictions = $2
         WHERE id = $3`,
        [
          'restricted',
          JSON.stringify(mergedRestrictions),
          subscription.id,
        ],
      );

      // 7. Create new state for audit trail
      const newState = {
        enforcement_status: 'restricted',
        restrictions: mergedRestrictions,
      };

      // 8. Create EnforcementAction audit record
      const enforcementAction = manager.create(EnforcementAction, {
        adminId,
        targetUserId: userId,
        subscriptionId: subscription.id,
        actionType: 'restrict',
        reason: dto.reason,
        previousState,
        newState,
        restrictionsApplied: dto.restrictions,
        expiresAt: dto.expiresAt,
        adminNotes: dto.adminNotes,
        evidence: dto.evidence,
      });

      const savedAction = await manager.save(EnforcementAction, enforcementAction);

      // 9. Invalidate cache for this user
      await this.cacheInvalidationService.invalidateUser(userId);

      return savedAction;
    });
  }

  /**
   * Lift specific restrictions from a user
   * 
   * Removes specified feature restrictions, potentially restoring full access.
   * 
   * @param adminId - ID of the admin lifting restrictions
   * @param userId - ID of the user
   * @param restrictions - Array of restriction keys to remove
   * @returns The created EnforcementAction audit record
   * 
   * @throws NotFoundException if user subscription not found
   */
  async liftRestrictions(
    adminId: string,
    userId: string,
    restrictions: string[],
  ): Promise<EnforcementAction> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException(`User subscription not found for user ${userId}`);
      }

      // 2. Get current restrictions
      const currentRestrictions = (subscription as any).restrictions || {};
      const currentStatus = (subscription as any).enforcement_status || 'normal';

      // 3. Remove specified restrictions
      const updatedRestrictions = { ...currentRestrictions };
      restrictions.forEach(key => {
        delete updatedRestrictions[key];
      });

      // 4. Determine new enforcement status
      const hasRemainingRestrictions = Object.keys(updatedRestrictions).length > 0;
      const newStatus = hasRemainingRestrictions ? 'restricted' : 'normal';

      // 5. Capture previous state for audit trail
      const previousState = {
        enforcement_status: currentStatus,
        restrictions: currentRestrictions,
      };

      // 6. Update user_subscriptions
      await manager.query(
        `UPDATE user_subscriptions 
         SET enforcement_status = $1,
             restrictions = $2
         WHERE id = $3`,
        [
          newStatus,
          JSON.stringify(updatedRestrictions),
          subscription.id,
        ],
      );

      // 7. Create new state for audit trail
      const newState = {
        enforcement_status: newStatus,
        restrictions: updatedRestrictions,
      };

      // 8. Create EnforcementAction audit record
      const enforcementAction = manager.create(EnforcementAction, {
        adminId,
        targetUserId: userId,
        subscriptionId: subscription.id,
        actionType: 'unrestrict',
        reason: `Lifted restrictions: ${restrictions.join(', ')}`,
        previousState,
        newState,
      });

      const savedAction = await manager.save(EnforcementAction, enforcementAction);

      // 9. Invalidate cache for this user
      await this.cacheInvalidationService.invalidateUser(userId);

      return savedAction;
    });
  }

  /**
   * Terminate a user's subscription permanently
   * 
   * This is the most severe enforcement action. It permanently blocks
   * all platform access and optionally adds the user to the blacklist.
   * 
   * @param adminId - ID of the admin performing termination
   * @param userId - ID of the user to terminate
   * @param dto - Termination details (reason, category, blacklist option)
   * @returns The created EnforcementAction audit record
   * 
   * @throws NotFoundException if user subscription not found
   * @throws BadRequestException if user is already terminated
   */
  async terminateSubscription(
    adminId: string,
    userId: string,
    dto: TerminateSubscriptionDto,
  ): Promise<EnforcementAction> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException(`User subscription not found for user ${userId}`);
      }

      // 2. Check if user is already terminated
      const currentStatus = (subscription as any).enforcement_status || 'normal';
      if (currentStatus === 'terminated') {
        throw new BadRequestException('User is already terminated');
      }

      // 3. Capture previous state for audit trail
      const previousState = {
        enforcement_status: currentStatus,
        suspended_by: (subscription as any).suspended_by,
        suspended_at: (subscription as any).suspended_at,
        suspension_reason: (subscription as any).suspension_reason,
        restrictions: (subscription as any).restrictions,
      };

      // 4. Update user_subscriptions with termination details
      await manager.query(
        `UPDATE user_subscriptions 
         SET enforcement_status = $1,
             terminated_by = $2,
             terminated_at = $3,
             termination_reason = $4,
             suspended_by = NULL,
             suspended_at = NULL,
             suspension_reason = NULL,
             suspension_expires_at = NULL,
             restrictions = '{}'
         WHERE id = $5`,
        [
          'terminated',
          adminId,
          new Date(),
          dto.reason,
          subscription.id,
        ],
      );

      // 5. Create new state for audit trail
      const newState = {
        enforcement_status: 'terminated',
        terminated_by: adminId,
        terminated_at: new Date(),
        termination_reason: dto.reason,
      };

      // 6. Create EnforcementAction audit record
      const enforcementAction = manager.create(EnforcementAction, {
        adminId,
        targetUserId: userId,
        subscriptionId: subscription.id,
        actionType: 'terminate',
        reason: dto.reason,
        violationCategory: dto.violationCategory,
        severity: 'critical',
        previousState,
        newState,
        adminNotes: dto.adminNotes,
        internalNotes: dto.internalNotes,
        evidence: dto.evidence,
      });

      const savedAction = await manager.save(EnforcementAction, enforcementAction);

      // 7. Invalidate cache for this user
      await this.cacheInvalidationService.invalidateUser(userId);

      return savedAction;
    });
  }

  /**
   * Reinstate a terminated user
   * 
   * Restores platform access to a previously terminated user.
   * This is a rare action that requires strong justification.
   * 
   * @param adminId - ID of the admin performing reinstatement
   * @param userId - ID of the user to reinstate
   * @param dto - Reinstatement details (notes)
   * @returns The created EnforcementAction audit record
   * 
   * @throws NotFoundException if user subscription not found
   * @throws BadRequestException if user is not currently terminated
   */
  async reinstateUser(
    adminId: string,
    userId: string,
    dto: ReinstateUserDto,
  ): Promise<EnforcementAction> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      if (!subscription) {
        throw new NotFoundException(`User subscription not found for user ${userId}`);
      }

      // 2. Check if user is currently terminated
      const currentStatus = (subscription as any).enforcement_status || 'normal';
      if (currentStatus !== 'terminated') {
        throw new BadRequestException('User is not currently terminated');
      }

      // 3. Capture previous state for audit trail
      const previousState = {
        enforcement_status: currentStatus,
        terminated_by: (subscription as any).terminated_by,
        terminated_at: (subscription as any).terminated_at,
        termination_reason: (subscription as any).termination_reason,
      };

      // 4. Update user_subscriptions to reinstate
      await manager.query(
        `UPDATE user_subscriptions 
         SET enforcement_status = $1,
             terminated_by = NULL,
             terminated_at = NULL,
             termination_reason = NULL,
             last_reinstated_by = $2,
             last_reinstated_at = $3,
             reinstatement_notes = $4
         WHERE id = $5`,
        [
          'normal',
          adminId,
          new Date(),
          dto.notes,
          subscription.id,
        ],
      );

      // 5. Create new state for audit trail
      const newState = {
        enforcement_status: 'normal',
        last_reinstated_by: adminId,
        last_reinstated_at: new Date(),
        reinstatement_notes: dto.notes,
      };

      // 6. Create EnforcementAction audit record
      const enforcementAction = manager.create(EnforcementAction, {
        adminId,
        targetUserId: userId,
        subscriptionId: subscription.id,
        actionType: 'reinstate',
        reason: dto.notes,
        previousState,
        newState,
        adminNotes: dto.notes,
      });

      const savedAction = await manager.save(EnforcementAction, enforcementAction);

      // 7. Invalidate cache for this user
      await this.cacheInvalidationService.invalidateUser(userId);

      return savedAction;
    });
  }

  /**
   * Get the current enforcement status for a user
   * 
   * Returns the complete enforcement status including restrictions.
   * Results are cached for 60 seconds to minimize database queries.
   * 
   * @param userId - ID of the user
   * @returns Enforcement status object
   * 
   * @throws NotFoundException if user subscription not found
   */
  async getEnforcementStatus(userId: string): Promise<any> {
    // Check cache first
    const cacheKey = this.cacheInvalidationService.getCacheKey(userId);
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      this.cacheInvalidationService.recordHit();
      return cached;
    }

    // Cache miss - record and fetch from database
    this.cacheInvalidationService.recordMiss();

    // Query database
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException(`User subscription not found for user ${userId}`);
    }

    const status = {
      enforcement_status: (subscription as any).enforcement_status || 'normal',
      suspended_by: (subscription as any).suspended_by,
      suspended_at: (subscription as any).suspended_at,
      suspension_reason: (subscription as any).suspension_reason,
      suspension_expires_at: (subscription as any).suspension_expires_at,
      terminated_by: (subscription as any).terminated_by,
      terminated_at: (subscription as any).terminated_at,
      termination_reason: (subscription as any).termination_reason,
      restrictions: (subscription as any).restrictions || {},
      last_reinstated_by: (subscription as any).last_reinstated_by,
      last_reinstated_at: (subscription as any).last_reinstated_at,
      reinstatement_notes: (subscription as any).reinstatement_notes,
    };

    // Cache for 60 seconds using CacheInvalidationService
    await this.cacheInvalidationService.warmCache(userId, status);

    return status;
  }

  /**
   * Check if a user can access a specific feature
   * 
   * Checks both enforcement status and feature-level restrictions.
   * Returns false if user is suspended, terminated, or feature is restricted.
   * 
   * @param userId - ID of the user
   * @param feature - Feature key to check (e.g., 'canPostCargo')
   * @returns true if user can access the feature, false otherwise
   */
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    try {
      const status = await this.getEnforcementStatus(userId);

      // Block if suspended or terminated
      if (status.enforcement_status === 'suspended' || status.enforcement_status === 'terminated') {
        return false;
      }

      // Check feature-level restrictions
      const restrictions = status.restrictions || {};
      
      // If feature is explicitly set to false, deny access
      if (restrictions[feature] === false) {
        return false;
      }

      // Otherwise, allow access
      return true;
    } catch (error) {
      // If user not found or any error, deny access (fail-safe)
      return false;
    }
  }
}
