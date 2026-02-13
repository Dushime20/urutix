import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan, LessThan, Between } from 'typeorm';
import { RiskFlag } from './entities/risk-flag.entity';
import { User } from '../../entities/user.entity';
import { Load } from '../../entities/load.entity';
import { EnforcementService } from './enforcement.service';
import { CreateRiskFlagDto } from './dto/create-risk-flag.dto';
import { ReviewRiskFlagDto } from './dto/review-risk-flag.dto';

/**
 * RiskDetectionService
 * 
 * Automated risk detection and flagging service.
 * Detects suspicious patterns, generates risk scores, and can auto-suspend high-risk users.
 * 
 * Detection Methods:
 * - Rapid posting detection (spam/bot behavior)
 * - Price anomaly detection (fraud indicators)
 * - Bot behavior detection (automated patterns)
 * - Suspicious activity patterns
 * 
 * Risk Scoring:
 * - 0-25: Low risk (normal user)
 * - 26-50: Medium risk (monitor)
 * - 51-75: High risk (review required)
 * - 76-100: Critical risk (auto-suspend)
 */
@Injectable()
export class RiskDetectionService {
  // Configurable thresholds
  private readonly RAPID_POSTING_THRESHOLD = 10; // posts per hour
  private readonly RAPID_POSTING_WINDOW = 3600000; // 1 hour in ms
  private readonly PRICE_ANOMALY_MULTIPLIER = 3; // 3x average price
  private readonly BOT_ACTION_THRESHOLD = 50; // actions per hour
  private readonly AUTO_SUSPEND_THRESHOLD = 76; // risk score for auto-suspend
  private readonly HIGH_RISK_THRESHOLD = 51; // risk score for high risk

  constructor(
    @InjectRepository(RiskFlag)
    private riskFlagRepository: Repository<RiskFlag>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
    private enforcementService: EnforcementService,
    private dataSource: DataSource,
  ) {}

  /**
   * Manually flag a user for review
   * 
   * Allows admins to manually create risk flags for suspicious users.
   * Can be used when automated detection misses something.
   * 
   * @param dto - Risk flag details
   * @returns The created RiskFlag
   * 
   * @throws NotFoundException if user not found
   */
  async flagUser(dto: CreateRiskFlagDto): Promise<RiskFlag> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    // Create risk flag
    const riskFlag = this.riskFlagRepository.create({
      userId: dto.userId,
      tenantId: (user as any).tenantId,
      flagType: dto.flagType,
      severity: dto.severity,
      riskScore: dto.riskScore,
      description: dto.description,
      evidence: dto.evidence,
      relatedEntities: dto.relatedEntities,
      detectedBy: dto.detectedBy || 'manual',
      detectionMethod: dto.detectionMethod || 'manual_review',
      status: 'pending',
    });

    return await this.riskFlagRepository.save(riskFlag);
  }

  /**
   * Calculate comprehensive risk score for a user
   * 
   * Aggregates multiple risk factors to generate a score from 0-100.
   * Higher scores indicate higher risk.
   * 
   * Risk Factors:
   * - Active risk flags (weighted by severity)
   * - Recent enforcement actions
   * - Rapid posting patterns
   * - Price anomalies
   * - Bot-like behavior
   * 
   * @param userId - ID of the user
   * @returns Risk score (0-100)
   */
  async getRiskScore(userId: string): Promise<number> {
    let totalScore = 0;

    // 1. Check active risk flags (max 40 points)
    const activeFlags = await this.riskFlagRepository.find({
      where: {
        userId,
        status: 'pending' as any,
      },
    });

    const flagScore = activeFlags.reduce((score, flag) => {
      const severityWeights = { low: 5, medium: 10, high: 15, critical: 20 };
      return score + (severityWeights[flag.severity] || 0);
    }, 0);
    totalScore += Math.min(flagScore, 40);

    // 2. Check recent enforcement actions (max 30 points)
    const recentEnforcements = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM enforcement_actions 
       WHERE target_user_id = $1 
       AND created_at > NOW() - INTERVAL '30 days'`,
      [userId],
    );
    const enforcementCount = parseInt(recentEnforcements[0]?.count || '0');
    totalScore += Math.min(enforcementCount * 10, 30);

    // 3. Check rapid posting (max 15 points)
    const rapidPostingScore = await this.detectRapidPostingScore(userId);
    totalScore += Math.min(rapidPostingScore, 15);

    // 4. Check price anomalies (max 15 points)
    const priceAnomalyScore = await this.detectPriceAnomalyScore(userId);
    totalScore += Math.min(priceAnomalyScore, 15);

    return Math.min(totalScore, 100);
  }

  /**
   * Detect suspicious activity patterns for a user
   * 
   * Runs all detection methods and creates risk flags for any issues found.
   * Returns array of detected issues.
   * 
   * @param userId - ID of the user to check
   * @returns Array of created risk flags
   */
  async detectSuspiciousActivity(userId: string): Promise<RiskFlag[]> {
    const detectedFlags: RiskFlag[] = [];

    // Run all detection methods
    const rapidPosting = await this.detectRapidPosting(userId);
    if (rapidPosting) {
      detectedFlags.push(rapidPosting);
    }

    const priceAnomaly = await this.detectPriceAnomalies(userId);
    if (priceAnomaly) {
      detectedFlags.push(priceAnomaly);
    }

    const botBehavior = await this.detectBotBehavior(userId);
    if (botBehavior) {
      detectedFlags.push(botBehavior);
    }

    return detectedFlags;
  }

  /**
   * Detect rapid cargo posting (spam/bot indicator)
   * 
   * Flags users who post cargo at an unusually high rate.
   * Indicates potential spam or bot activity.
   * 
   * @param userId - ID of the user to check
   * @returns RiskFlag if detected, null otherwise
   */
  async detectRapidPosting(userId: string): Promise<RiskFlag | null> {
    const oneHourAgo = new Date(Date.now() - this.RAPID_POSTING_WINDOW);

    // Count posts in the last hour
    const recentPosts = await this.loadRepository.count({
      where: {
        userId,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentPosts >= this.RAPID_POSTING_THRESHOLD) {
      // Check if flag already exists
      const existingFlag = await this.riskFlagRepository.findOne({
        where: {
          userId,
          flagType: 'rapid_posting',
          status: 'pending' as any,
        },
      });

      if (existingFlag) {
        return null; // Already flagged
      }

      // Get user for tenant ID
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      // Create risk flag
      const riskFlag = this.riskFlagRepository.create({
        userId,
        tenantId: (user as any).tenantId,
        flagType: 'rapid_posting',
        severity: recentPosts >= 20 ? 'critical' : 'high',
        riskScore: Math.min((recentPosts / this.RAPID_POSTING_THRESHOLD) * 50, 100),
        description: `User posted ${recentPosts} cargo listings in the last hour`,
        evidence: {
          postCount: recentPosts,
          timeWindow: '1 hour',
          threshold: this.RAPID_POSTING_THRESHOLD,
        },
        detectedBy: 'system',
        detectionMethod: 'rapid_posting_detection',
        status: 'pending',
      });

      return await this.riskFlagRepository.save(riskFlag);
    }

    return null;
  }

  /**
   * Detect price anomalies (fraud indicator)
   * 
   * Flags users who post cargo with prices significantly different from market average.
   * Can indicate fraud or pricing manipulation.
   * 
   * @param userId - ID of the user to check
   * @returns RiskFlag if detected, null otherwise
   */
  async detectPriceAnomalies(userId: string): Promise<RiskFlag | null> {
    // Get user's recent posts
    const userPosts = await this.loadRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (userPosts.length < 3) {
      return null; // Not enough data
    }

    // Calculate average market price for similar routes
    const avgPriceResult = await this.dataSource.query(
      `SELECT AVG(price) as avg_price 
       FROM loads 
       WHERE created_at > NOW() - INTERVAL '30 days'
       AND price IS NOT NULL
       AND price > 0`,
    );

    const marketAverage = parseFloat(avgPriceResult[0]?.avg_price || '0');
    if (marketAverage === 0) {
      return null; // No market data
    }

    // Check for anomalies
    const anomalies = userPosts.filter(post => {
      const price = parseFloat((post as any).price || '0');
      return price > marketAverage * this.PRICE_ANOMALY_MULTIPLIER || 
             price < marketAverage / this.PRICE_ANOMALY_MULTIPLIER;
    });

    if (anomalies.length >= 2) {
      // Check if flag already exists
      const existingFlag = await this.riskFlagRepository.findOne({
        where: {
          userId,
          flagType: 'price_anomaly',
          status: 'pending' as any,
        },
      });

      if (existingFlag) {
        return null; // Already flagged
      }

      // Get user for tenant ID
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      // Create risk flag
      const riskFlag = this.riskFlagRepository.create({
        userId,
        tenantId: (user as any).tenantId,
        flagType: 'price_anomaly',
        severity: anomalies.length >= 5 ? 'high' : 'medium',
        riskScore: Math.min((anomalies.length / userPosts.length) * 60, 100),
        description: `User has ${anomalies.length} cargo listings with unusual pricing`,
        evidence: {
          anomalyCount: anomalies.length,
          totalPosts: userPosts.length,
          marketAverage,
          anomalousListings: anomalies.map(a => ({
            id: a.id,
            price: (a as any).price,
          })),
        },
        detectedBy: 'system',
        detectionMethod: 'price_anomaly_detection',
        status: 'pending',
      });

      return await this.riskFlagRepository.save(riskFlag);
    }

    return null;
  }

  /**
   * Detect bot-like behavior patterns
   * 
   * Flags users with automated/bot-like activity patterns.
   * Looks for consistent timing, rapid actions, and repetitive behavior.
   * 
   * @param userId - ID of the user to check
   * @returns RiskFlag if detected, null otherwise
   */
  async detectBotBehavior(userId: string): Promise<RiskFlag | null> {
    const oneHourAgo = new Date(Date.now() - 3600000);

    // Count recent actions (posts, updates, etc.)
    const recentActions = await this.loadRepository.count({
      where: {
        userId,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    // Check for bot-like patterns
    if (recentActions >= this.BOT_ACTION_THRESHOLD) {
      // Get timing patterns
      const recentPosts = await this.loadRepository.find({
        where: {
          userId,
          createdAt: MoreThan(oneHourAgo),
        },
        order: { createdAt: 'ASC' },
        select: ['id', 'createdAt'],
      });

      // Calculate time intervals between posts
      const intervals: number[] = [];
      for (let i = 1; i < recentPosts.length; i++) {
        const interval = recentPosts[i].createdAt.getTime() - recentPosts[i - 1].createdAt.getTime();
        intervals.push(interval);
      }

      // Check for consistent intervals (bot indicator)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2);
      }, 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Low variance indicates bot-like consistency
      const isConsistent = stdDev < avgInterval * 0.2;

      if (isConsistent) {
        // Check if flag already exists
        const existingFlag = await this.riskFlagRepository.findOne({
          where: {
            userId,
            flagType: 'bot_behavior',
            status: 'pending' as any,
          },
        });

        if (existingFlag) {
          return null; // Already flagged
        }

        // Get user for tenant ID
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });

        // Create risk flag
        const riskFlag = this.riskFlagRepository.create({
          userId,
          tenantId: (user as any).tenantId,
          flagType: 'bot_behavior',
          severity: 'critical',
          riskScore: 85,
          description: `User exhibits bot-like behavior with ${recentActions} actions in 1 hour`,
          evidence: {
            actionCount: recentActions,
            timeWindow: '1 hour',
            avgInterval: Math.round(avgInterval / 1000), // seconds
            consistency: 'high',
            threshold: this.BOT_ACTION_THRESHOLD,
          },
          detectedBy: 'system',
          detectionMethod: 'bot_behavior_detection',
          status: 'pending',
        });

        return await this.riskFlagRepository.save(riskFlag);
      }
    }

    return null;
  }

  /**
   * Auto-suspend user if risk score exceeds critical threshold
   * 
   * Automatically suspends users with critical risk scores.
   * Creates enforcement action and notifies admins.
   * 
   * @param userId - ID of the user to check
   * @returns true if user was auto-suspended, false otherwise
   */
  async autoSuspendIfHighRisk(userId: string): Promise<boolean> {
    const riskScore = await this.getRiskScore(userId);

    if (riskScore >= this.AUTO_SUSPEND_THRESHOLD) {
      // Get active flags for evidence
      const activeFlags = await this.riskFlagRepository.find({
        where: {
          userId,
          status: 'pending' as any,
        },
      });

      // Auto-suspend the user
      await this.enforcementService.suspendUser(
        'system', // System-initiated
        userId,
        {
          reason: `Automatic suspension due to critical risk score (${riskScore}/100). Multiple risk indicators detected.`,
          violationCategory: 'platform_abuse',
          severity: 'critical',
          adminNotes: 'Auto-suspended by risk detection system',
          internalNotes: `Risk score: ${riskScore}. Active flags: ${activeFlags.length}`,
          evidence: {
            riskScore,
            activeFlags: activeFlags.map(f => ({
              id: f.id,
              type: f.flagType,
              severity: f.severity,
            })),
            autoSuspended: true,
          },
        },
      );

      return true;
    }

    return false;
  }

  /**
   * Review a risk flag
   * 
   * Allows admins to review and resolve risk flags.
   * 
   * @param adminId - ID of the admin reviewing
   * @param flagId - ID of the risk flag
   * @param dto - Review details
   * @returns Updated RiskFlag
   */
  async reviewRiskFlag(
    adminId: string,
    flagId: string,
    dto: ReviewRiskFlagDto,
  ): Promise<RiskFlag> {
    const flag = await this.riskFlagRepository.findOne({
      where: { id: flagId },
    });

    if (!flag) {
      throw new NotFoundException(`Risk flag ${flagId} not found`);
    }

    flag.status = dto.status;
    flag.reviewedBy = adminId;
    flag.reviewedAt = new Date();
    flag.reviewNotes = dto.reviewNotes;
    flag.resolvedAt = new Date();

    if (dto.enforcementActionId) {
      flag.enforcementActionId = dto.enforcementActionId;
    }

    return await this.riskFlagRepository.save(flag);
  }

  /**
   * Get all risk flags for a user
   * 
   * @param userId - ID of the user
   * @returns Array of risk flags
   */
  async getRiskFlagsByUser(userId: string): Promise<RiskFlag[]> {
    return await this.riskFlagRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get pending risk flags for a tenant
   * 
   * @param tenantId - ID of the tenant
   * @returns Array of pending risk flags
   */
  async getPendingRiskFlags(tenantId: string): Promise<RiskFlag[]> {
    return await this.riskFlagRepository.find({
      where: {
        tenantId,
        status: 'pending' as any,
      },
      relations: ['user'],
      order: { severity: 'DESC', createdAt: 'ASC' },
    });
  }

  // Helper methods for risk scoring
  private async detectRapidPostingScore(userId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - this.RAPID_POSTING_WINDOW);
    const recentPosts = await this.loadRepository.count({
      where: {
        userId,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentPosts >= this.RAPID_POSTING_THRESHOLD) {
      return Math.min((recentPosts / this.RAPID_POSTING_THRESHOLD) * 15, 15);
    }

    return 0;
  }

  private async detectPriceAnomalyScore(userId: string): Promise<number> {
    const userPosts = await this.loadRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    if (userPosts.length < 3) {
      return 0;
    }

    const avgPriceResult = await this.dataSource.query(
      `SELECT AVG(price) as avg_price 
       FROM loads 
       WHERE created_at > NOW() - INTERVAL '30 days'
       AND price IS NOT NULL
       AND price > 0`,
    );

    const marketAverage = parseFloat(avgPriceResult[0]?.avg_price || '0');
    if (marketAverage === 0) {
      return 0;
    }

    const anomalies = userPosts.filter(post => {
      const price = parseFloat((post as any).price || '0');
      return price > marketAverage * this.PRICE_ANOMALY_MULTIPLIER || 
             price < marketAverage / this.PRICE_ANOMALY_MULTIPLIER;
    });

    if (anomalies.length >= 2) {
      return Math.min((anomalies.length / userPosts.length) * 15, 15);
    }

    return 0;
  }
}
