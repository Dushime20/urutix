import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Appeal } from './entities/appeal.entity';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { UserSubscription } from '../../entities/user-subscription.entity';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { ReviewAppealDto } from './dto/review-appeal.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * AppealsService
 * 
 * Manages user appeals against enforcement actions.
 * Handles appeal creation, review, and resolution.
 * Provides a structured process for users to contest enforcement decisions.
 * 
 * Key Features:
 * - Appeal creation and validation
 * - Appeal status management
 * - Message threading between users and admins
 * - Appeal review and outcome tracking
 * - Notification integration
 */
@Injectable()
export class AppealsService {
  constructor(
    @InjectRepository(Appeal)
    private appealRepository: Repository<Appeal>,
    @InjectRepository(EnforcementAction)
    private enforcementActionRepository: Repository<EnforcementAction>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new appeal against an enforcement action
   * 
   * Allows users to formally contest enforcement decisions.
   * Validates that the enforcement action exists and hasn't been appealed already.
   * 
   * @param userId - ID of the user creating the appeal
   * @param dto - Appeal details (enforcement action, reason, statement, evidence)
   * @returns The created Appeal
   * 
   * @throws NotFoundException if enforcement action not found
   * @throws BadRequestException if enforcement action already has an active appeal
   */
  async createAppeal(userId: string, dto: CreateAppealDto): Promise<Appeal> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Verify enforcement action exists
      const enforcementAction = await manager.findOne(EnforcementAction, {
        where: { id: dto.enforcementActionId },
      });

      if (!enforcementAction) {
        throw new NotFoundException(`Enforcement action ${dto.enforcementActionId} not found`);
      }

      // 2. Verify the enforcement action targets this user
      if (enforcementAction.targetUserId !== userId) {
        throw new BadRequestException('You can only appeal enforcement actions against your own account');
      }

      // 3. Check if there's already an active appeal for this enforcement action
      const existingAppeal = await manager.findOne(Appeal, {
        where: {
          enforcementActionId: dto.enforcementActionId,
          status: 'pending' as any,
        },
      });

      if (existingAppeal) {
        throw new BadRequestException('An active appeal already exists for this enforcement action');
      }

      // 4. Get user's subscription
      const subscription = await manager.findOne(UserSubscription, {
        where: { userId },
      });

      // 5. Create the appeal
      const appeal = manager.create(Appeal, {
        enforcementActionId: dto.enforcementActionId,
        userId,
        subscriptionId: subscription?.id,
        appealReason: dto.appealReason,
        userStatement: dto.userStatement,
        supportingEvidence: dto.supportingEvidence,
        status: 'pending',
        messages: [],
      });

      const savedAppeal = await manager.save(Appeal, appeal);

      // 6. Update enforcement action to mark it as appealed
      await manager.update(EnforcementAction, dto.enforcementActionId, {
        isAppealed: true,
        appealId: savedAppeal.id,
      });

      return savedAppeal;
    });
  }

  /**
   * Get all appeals for a specific user
   * 
   * Returns all appeals created by the user, ordered by creation date (newest first).
   * Includes related enforcement action details.
   * 
   * @param userId - ID of the user
   * @returns Array of appeals
   */
  async getAppealsByUser(userId: string): Promise<Appeal[]> {
    return await this.appealRepository.find({
      where: { userId },
      relations: ['enforcementAction', 'reviewer'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all pending appeals for a tenant
   * 
   * Returns appeals that need admin review, ordered by creation date (oldest first).
   * Used by admins to manage their appeal queue.
   * 
   * @param tenantId - ID of the tenant
   * @returns Array of pending appeals
   */
  async getPendingAppeals(tenantId: string): Promise<Appeal[]> {
    // Get all pending and under_review appeals
    // Note: We need to join through user to filter by tenant
    const appeals = await this.appealRepository
      .createQueryBuilder('appeal')
      .leftJoinAndSelect('appeal.enforcementAction', 'enforcementAction')
      .leftJoinAndSelect('appeal.user', 'user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('appeal.status IN (:...statuses)', { statuses: ['pending', 'under_review'] })
      .orderBy('appeal.createdAt', 'ASC')
      .getMany();

    return appeals;
  }

  /**
   * Review and respond to an appeal
   * 
   * Allows admins to review appeals and make decisions.
   * Updates appeal status, records outcome, and can trigger enforcement changes.
   * 
   * @param adminId - ID of the admin reviewing the appeal
   * @param appealId - ID of the appeal to review
   * @param dto - Review details (decision, outcome, response, notes)
   * @returns The updated Appeal
   * 
   * @throws NotFoundException if appeal not found
   * @throws BadRequestException if appeal is not in reviewable state
   */
  async reviewAppeal(
    adminId: string,
    appealId: string,
    dto: ReviewAppealDto,
  ): Promise<Appeal> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the appeal
      const appeal = await manager.findOne(Appeal, {
        where: { id: appealId },
        relations: ['enforcementAction'],
      });

      if (!appeal) {
        throw new NotFoundException(`Appeal ${appealId} not found`);
      }

      // 2. Verify appeal is in a reviewable state
      if (appeal.status !== 'pending' && appeal.status !== 'under_review') {
        throw new BadRequestException(`Appeal is already ${appeal.status} and cannot be reviewed`);
      }

      // 3. Update appeal with review details
      appeal.status = dto.decision === 'approved' ? 'approved' : 'denied';
      appeal.reviewedBy = adminId;
      appeal.reviewedAt = new Date();
      appeal.reviewNotes = dto.reviewNotes;
      appeal.adminResponse = dto.adminResponse;
      appeal.outcome = dto.outcome;
      appeal.outcomeDetails = dto.outcomeDetails;
      appeal.resolvedAt = new Date();

      const updatedAppeal = await manager.save(Appeal, appeal);

      // 4. Add admin response as a message
      const adminMessage = {
        id: uuidv4(),
        sender: 'admin' as const,
        senderId: adminId,
        message: dto.adminResponse,
        timestamp: new Date().toISOString(),
      };

      updatedAppeal.messages = [...(updatedAppeal.messages || []), adminMessage];
      await manager.save(Appeal, updatedAppeal);

      return updatedAppeal;
    });
  }

  /**
   * Add a message to an appeal thread
   * 
   * Enables communication between users and admins during the appeal process.
   * Messages are stored in chronological order.
   * 
   * @param appealId - ID of the appeal
   * @param senderId - ID of the sender (user or admin)
   * @param isAdmin - Whether the sender is an admin
   * @param dto - Message content
   * @returns The updated Appeal
   * 
   * @throws NotFoundException if appeal not found
   * @throws BadRequestException if appeal is resolved
   */
  async addMessageToAppeal(
    appealId: string,
    senderId: string,
    isAdmin: boolean,
    dto: AddMessageDto,
  ): Promise<Appeal> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the appeal
      const appeal = await manager.findOne(Appeal, {
        where: { id: appealId },
      });

      if (!appeal) {
        throw new NotFoundException(`Appeal ${appealId} not found`);
      }

      // 2. Verify appeal is not resolved
      if (appeal.status === 'approved' || appeal.status === 'denied' || appeal.status === 'withdrawn') {
        throw new BadRequestException('Cannot add messages to a resolved appeal');
      }

      // 3. If user is adding a message, verify they own the appeal
      if (!isAdmin && appeal.userId !== senderId) {
        throw new BadRequestException('You can only add messages to your own appeals');
      }

      // 4. Update status to under_review if admin is responding
      if (isAdmin && appeal.status === 'pending') {
        appeal.status = 'under_review';
      }

      // 5. Add the message
      const newMessage = {
        id: uuidv4(),
        sender: isAdmin ? ('admin' as const) : ('user' as const),
        senderId,
        message: dto.message,
        timestamp: new Date().toISOString(),
      };

      appeal.messages = [...(appeal.messages || []), newMessage];
      appeal.updatedAt = new Date();

      const updatedAppeal = await manager.save(Appeal, appeal);

      return updatedAppeal;
    });
  }

  /**
   * Get a specific appeal by ID
   * 
   * Returns detailed appeal information including related entities.
   * 
   * @param appealId - ID of the appeal
   * @returns The appeal
   * 
   * @throws NotFoundException if appeal not found
   */
  async getAppealById(appealId: string): Promise<Appeal> {
    const appeal = await this.appealRepository.findOne({
      where: { id: appealId },
      relations: ['enforcementAction', 'user', 'reviewer'],
    });

    if (!appeal) {
      throw new NotFoundException(`Appeal ${appealId} not found`);
    }

    return appeal;
  }

  /**
   * Withdraw an appeal
   * 
   * Allows users to withdraw their appeal before it's reviewed.
   * 
   * @param userId - ID of the user withdrawing the appeal
   * @param appealId - ID of the appeal to withdraw
   * @returns The updated Appeal
   * 
   * @throws NotFoundException if appeal not found
   * @throws BadRequestException if appeal cannot be withdrawn
   */
  async withdrawAppeal(userId: string, appealId: string): Promise<Appeal> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find the appeal
      const appeal = await manager.findOne(Appeal, {
        where: { id: appealId },
      });

      if (!appeal) {
        throw new NotFoundException(`Appeal ${appealId} not found`);
      }

      // 2. Verify user owns the appeal
      if (appeal.userId !== userId) {
        throw new BadRequestException('You can only withdraw your own appeals');
      }

      // 3. Verify appeal can be withdrawn
      if (appeal.status !== 'pending' && appeal.status !== 'under_review') {
        throw new BadRequestException(`Appeal is already ${appeal.status} and cannot be withdrawn`);
      }

      // 4. Update appeal status
      appeal.status = 'withdrawn';
      appeal.resolvedAt = new Date();

      const updatedAppeal = await manager.save(Appeal, appeal);

      return updatedAppeal;
    });
  }
}
