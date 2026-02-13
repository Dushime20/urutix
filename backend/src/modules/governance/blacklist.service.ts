import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, IsNull, Or } from 'typeorm';
import { UserBlacklist } from './entities/user-blacklist.entity';
import { User } from '../../entities/user.entity';
import { AddToBlacklistDto } from './dto/add-to-blacklist.dto';
import { CheckBlacklistDto } from './dto/check-blacklist.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * BlacklistService
 * 
 * Manages user blacklist for permanent or temporary bans.
 * Prevents blacklisted users from creating new accounts or accessing the platform.
 * 
 * Key Features:
 * - Multiple identifier types (email, phone, company, tax ID, device, IP)
 * - Domain-level blocking (block entire email domains)
 * - Temporary or permanent bans
 * - Automatic expiration handling
 * - Registration check integration
 * - Tenant isolation
 * 
 * Blacklist Types:
 * - Email: Blocks specific email addresses
 * - Email Domain: Blocks entire domains (e.g., @spam.com)
 * - Phone: Blocks phone numbers
 * - Company: Blocks company names
 * - Tax ID: Blocks tax identification numbers
 * - Device: Blocks device fingerprints
 * - IP Address: Blocks IP addresses
 */
@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(UserBlacklist)
    private blacklistRepository: Repository<UserBlacklist>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * Add user/identifier to blacklist
   * 
   * Creates a blacklist entry to prevent future access.
   * Can block by email, phone, company, tax ID, device, or IP.
   * Supports temporary bans with expiration dates.
   * 
   * @param adminId - ID of the admin adding to blacklist
   * @param tenantId - ID of the tenant
   * @param dto - Blacklist details (identifiers, reason, expiration)
   * @returns The created blacklist entry
   * 
   * @throws BadRequestException if no identifiers provided
   */
  async addToBlacklist(
    adminId: string,
    tenantId: string,
    dto: AddToBlacklistDto,
  ): Promise<UserBlacklist> {
    // Validate at least one identifier is provided
    const hasIdentifier = dto.email || dto.emailDomain || dto.phoneNumber || 
                          dto.companyName || dto.taxId || dto.deviceFingerprint || 
                          dto.ipAddress;

    if (!hasIdentifier) {
      throw new BadRequestException('At least one identifier must be provided');
    }

    // Check for duplicate active entries
    const existingEntry = await this.findExistingEntry(tenantId, dto);
    if (existingEntry) {
      throw new BadRequestException('An active blacklist entry already exists for this identifier');
    }

    // Create blacklist entry
    const blacklistEntry = this.blacklistRepository.create({
      email: dto.email,
      emailDomain: dto.emailDomain,
      phoneNumber: dto.phoneNumber,
      companyName: dto.companyName,
      taxId: dto.taxId,
      deviceFingerprint: dto.deviceFingerprint,
      ipAddress: dto.ipAddress,
      reason: dto.reason,
      violationCategory: dto.violationCategory,
      addedBy: adminId,
      tenantId,
      relatedUserId: dto.relatedUserId,
      relatedEnforcementActionId: dto.relatedEnforcementActionId,
      expiresAt: dto.expiresAt,
      isActive: true,
    });

    return await this.blacklistRepository.save(blacklistEntry);
  }

  /**
   * Check if user/identifier is blacklisted
   * 
   * Checks multiple identifiers against the blacklist.
   * Returns true if ANY identifier is blacklisted.
   * Automatically handles expired entries.
   * 
   * @param tenantId - ID of the tenant
   * @param dto - Identifiers to check
   * @returns Object with blacklisted status and matching entries
   */
  async checkBlacklist(
    tenantId: string,
    dto: CheckBlacklistDto,
  ): Promise<{
    isBlacklisted: boolean;
    matchingEntries: UserBlacklist[];
    reason?: string;
  }> {
    const queryBuilder = this.blacklistRepository
      .createQueryBuilder('blacklist')
      .where('blacklist.tenantId = :tenantId', { tenantId })
      .andWhere('blacklist.isActive = :isActive', { isActive: true })
      .andWhere(
        '(blacklist.expiresAt IS NULL OR blacklist.expiresAt > :now)',
        { now: new Date() },
      );

    // Build OR conditions for each identifier
    const conditions: string[] = [];
    const parameters: Record<string, any> = {};

    if (dto.email) {
      conditions.push('blacklist.email = :email');
      parameters.email = dto.email;

      // Also check email domain
      const domain = dto.email.split('@')[1];
      if (domain) {
        conditions.push('blacklist.emailDomain = :emailDomain');
        parameters.emailDomain = domain;
      }
    }

    if (dto.phoneNumber) {
      conditions.push('blacklist.phoneNumber = :phoneNumber');
      parameters.phoneNumber = dto.phoneNumber;
    }

    if (dto.companyName) {
      conditions.push('blacklist.companyName = :companyName');
      parameters.companyName = dto.companyName;
    }

    if (dto.taxId) {
      conditions.push('blacklist.taxId = :taxId');
      parameters.taxId = dto.taxId;
    }

    if (dto.deviceFingerprint) {
      conditions.push('blacklist.deviceFingerprint = :deviceFingerprint');
      parameters.deviceFingerprint = dto.deviceFingerprint;
    }

    if (dto.ipAddress) {
      conditions.push('blacklist.ipAddress = :ipAddress');
      parameters.ipAddress = dto.ipAddress;
    }

    if (conditions.length === 0) {
      return {
        isBlacklisted: false,
        matchingEntries: [],
      };
    }

    // Add OR conditions
    queryBuilder.andWhere(`(${conditions.join(' OR ')})`, parameters);

    const matchingEntries = await queryBuilder.getMany();

    return {
      isBlacklisted: matchingEntries.length > 0,
      matchingEntries,
      reason: matchingEntries[0]?.reason,
    };
  }

  /**
   * Remove entry from blacklist
   * 
   * Deactivates a blacklist entry (soft delete).
   * Does not permanently delete for audit trail purposes.
   * 
   * @param adminId - ID of the admin removing from blacklist
   * @param entryId - ID of the blacklist entry
   * @returns The updated blacklist entry
   * 
   * @throws NotFoundException if entry not found
   * @throws BadRequestException if entry already inactive
   */
  async removeFromBlacklist(
    adminId: string,
    entryId: string,
  ): Promise<UserBlacklist> {
    const entry = await this.blacklistRepository.findOne({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException(`Blacklist entry ${entryId} not found`);
    }

    if (!entry.isActive) {
      throw new BadRequestException('Blacklist entry is already inactive');
    }

    entry.isActive = false;
    entry.deactivatedAt = new Date();
    entry.deactivatedBy = adminId;

    return await this.blacklistRepository.save(entry);
  }

  /**
   * Get all blacklist entries for a tenant
   * 
   * Retrieves blacklist entries with optional filtering.
   * 
   * @param tenantId - ID of the tenant
   * @param activeOnly - Whether to return only active entries (default: true)
   * @returns Array of blacklist entries
   */
  async getBlacklistEntries(
    tenantId: string,
    activeOnly: boolean = true,
  ): Promise<UserBlacklist[]> {
    const query: any = { tenantId };

    if (activeOnly) {
      query.isActive = true;
    }

    return await this.blacklistRepository.find({
      where: query,
      relations: ['addedByUser', 'relatedUser', 'deactivatedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific blacklist entry by ID
   * 
   * @param entryId - ID of the blacklist entry
   * @returns The blacklist entry
   * 
   * @throws NotFoundException if entry not found
   */
  async getBlacklistEntryById(entryId: string): Promise<UserBlacklist> {
    const entry = await this.blacklistRepository.findOne({
      where: { id: entryId },
      relations: ['addedByUser', 'relatedUser', 'relatedEnforcementAction', 'deactivatedByUser'],
    });

    if (!entry) {
      throw new NotFoundException(`Blacklist entry ${entryId} not found`);
    }

    return entry;
  }

  /**
   * Search blacklist entries
   * 
   * Searches by email, phone, company name, etc.
   * 
   * @param tenantId - ID of the tenant
   * @param searchTerm - Search term
   * @returns Array of matching blacklist entries
   */
  async searchBlacklist(
    tenantId: string,
    searchTerm: string,
  ): Promise<UserBlacklist[]> {
    return await this.blacklistRepository
      .createQueryBuilder('blacklist')
      .where('blacklist.tenantId = :tenantId', { tenantId })
      .andWhere('blacklist.isActive = :isActive', { isActive: true })
      .andWhere(
        '(blacklist.email ILIKE :search OR ' +
        'blacklist.emailDomain ILIKE :search OR ' +
        'blacklist.phoneNumber ILIKE :search OR ' +
        'blacklist.companyName ILIKE :search OR ' +
        'blacklist.reason ILIKE :search)',
        { search: `%${searchTerm}%` },
      )
      .orderBy('blacklist.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get blacklist statistics
   * 
   * Provides summary statistics for reporting.
   * 
   * @param tenantId - ID of the tenant
   * @returns Statistics object
   */
  async getBlacklistStatistics(tenantId: string): Promise<{
    totalActive: number;
    totalInactive: number;
    byType: Record<string, number>;
    expiringThisMonth: number;
  }> {
    const totalActive = await this.blacklistRepository.count({
      where: { tenantId, isActive: true },
    });

    const totalInactive = await this.blacklistRepository.count({
      where: { tenantId, isActive: false },
    });

    // Count by type
    const allActive = await this.blacklistRepository.find({
      where: { tenantId, isActive: true },
    });

    const byType = {
      email: allActive.filter(e => e.email).length,
      emailDomain: allActive.filter(e => e.emailDomain).length,
      phone: allActive.filter(e => e.phoneNumber).length,
      company: allActive.filter(e => e.companyName).length,
      taxId: allActive.filter(e => e.taxId).length,
      device: allActive.filter(e => e.deviceFingerprint).length,
      ip: allActive.filter(e => e.ipAddress).length,
    };

    // Count expiring this month
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const expiringThisMonth = await this.blacklistRepository.count({
      where: {
        tenantId,
        isActive: true,
        expiresAt: LessThan(endOfMonth),
      },
    });

    return {
      totalActive,
      totalInactive,
      byType,
      expiringThisMonth,
    };
  }

  /**
   * Automatic expiration handling (scheduled job)
   * 
   * Runs daily to deactivate expired blacklist entries.
   * Scheduled via @Cron decorator.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredEntries(): Promise<void> {
    const expiredEntries = await this.blacklistRepository.find({
      where: {
        isActive: true,
        expiresAt: LessThan(new Date()),
      },
    });

    for (const entry of expiredEntries) {
      entry.isActive = false;
      entry.deactivatedAt = new Date();
      entry.deactivatedBy = 'system'; // System-initiated
      await this.blacklistRepository.save(entry);
    }

    if (expiredEntries.length > 0) {
      console.log(`Deactivated ${expiredEntries.length} expired blacklist entries`);
    }
  }

  /**
   * Check blacklist during user registration
   * 
   * Integration point for registration flow.
   * Should be called before allowing new user registration.
   * 
   * @param tenantId - ID of the tenant
   * @param email - User's email
   * @param phoneNumber - User's phone number (optional)
   * @returns Object with blacklisted status and reason
   */
  async checkRegistration(
    tenantId: string,
    email: string,
    phoneNumber?: string,
  ): Promise<{
    isBlacklisted: boolean;
    reason?: string;
    blockedBy?: string; // 'email', 'domain', 'phone'
  }> {
    const result = await this.checkBlacklist(tenantId, {
      email,
      phoneNumber,
    });

    if (result.isBlacklisted) {
      const entry = result.matchingEntries[0];
      let blockedBy = 'unknown';

      if (entry.email === email) {
        blockedBy = 'email';
      } else if (entry.emailDomain && email.includes(entry.emailDomain)) {
        blockedBy = 'domain';
      } else if (entry.phoneNumber === phoneNumber) {
        blockedBy = 'phone';
      }

      return {
        isBlacklisted: true,
        reason: entry.reason,
        blockedBy,
      };
    }

    return {
      isBlacklisted: false,
    };
  }

  /**
   * Bulk add to blacklist
   * 
   * Adds multiple entries at once (useful for importing lists).
   * 
   * @param adminId - ID of the admin
   * @param tenantId - ID of the tenant
   * @param entries - Array of blacklist entries
   * @returns Array of created entries
   */
  async bulkAddToBlacklist(
    adminId: string,
    tenantId: string,
    entries: AddToBlacklistDto[],
  ): Promise<UserBlacklist[]> {
    const created: UserBlacklist[] = [];

    for (const entry of entries) {
      try {
        const blacklistEntry = await this.addToBlacklist(adminId, tenantId, entry);
        created.push(blacklistEntry);
      } catch (error) {
        // Log error but continue with other entries
        console.error(`Failed to add blacklist entry: ${error.message}`);
      }
    }

    return created;
  }

  // Helper method to find existing entry
  private async findExistingEntry(
    tenantId: string,
    dto: AddToBlacklistDto,
  ): Promise<UserBlacklist | null> {
    const conditions: any[] = [];

    if (dto.email) {
      conditions.push({ tenantId, email: dto.email, isActive: true });
    }
    if (dto.emailDomain) {
      conditions.push({ tenantId, emailDomain: dto.emailDomain, isActive: true });
    }
    if (dto.phoneNumber) {
      conditions.push({ tenantId, phoneNumber: dto.phoneNumber, isActive: true });
    }
    if (dto.companyName) {
      conditions.push({ tenantId, companyName: dto.companyName, isActive: true });
    }
    if (dto.taxId) {
      conditions.push({ tenantId, taxId: dto.taxId, isActive: true });
    }

    if (conditions.length === 0) {
      return null;
    }

    return await this.blacklistRepository.findOne({
      where: conditions,
    });
  }
}
