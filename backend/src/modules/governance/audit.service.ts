import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { EnforcementAction } from './entities/enforcement-action.entity';
import { AuditFilterDto } from './dto/audit-filter.dto';
import { ExportAuditDto } from './dto/export-audit.dto';

/**
 * AuditService
 * 
 * Manages immutable audit trail of all enforcement actions.
 * Provides comprehensive audit log querying, filtering, and export capabilities.
 * 
 * Key Features:
 * - Immutable audit records
 * - Advanced filtering (admin, user, date range, action type, etc.)
 * - Multiple export formats (CSV, Excel, JSON)
 * - Pagination support
 * - Compliance-ready reporting
 * 
 * Audit Trail Properties:
 * - Complete: Every enforcement action is logged
 * - Immutable: Records cannot be modified or deleted
 * - Timestamped: Precise action timestamps
 * - Attributed: Links to admin who performed action
 * - Detailed: Includes before/after state
 */
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(EnforcementAction)
    private enforcementActionRepository: Repository<EnforcementAction>,
  ) {}

  /**
   * Log an enforcement action
   * 
   * Creates an immutable audit record for an enforcement action.
   * This method is typically called automatically by EnforcementService.
   * 
   * @param action - The enforcement action to log
   * @returns The saved enforcement action
   */
  async logEnforcementAction(action: Partial<EnforcementAction>): Promise<EnforcementAction> {
    const auditRecord = this.enforcementActionRepository.create(action);
    return await this.enforcementActionRepository.save(auditRecord);
  }

  /**
   * Get audit trail with advanced filtering
   * 
   * Retrieves enforcement actions with comprehensive filtering options.
   * Supports pagination for large result sets.
   * 
   * @param filters - Filter criteria (admin, user, dates, action type, etc.)
   * @returns Paginated audit records
   */
  async getAuditTrail(filters: AuditFilterDto): Promise<{
    data: EnforcementAction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    // Build query
    const queryBuilder = this.enforcementActionRepository
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.admin', 'admin')
      .leftJoinAndSelect('action.targetUser', 'targetUser');

    // Apply filters
    if (filters.adminId) {
      queryBuilder.andWhere('action.adminId = :adminId', { adminId: filters.adminId });
    }

    if (filters.targetUserId) {
      queryBuilder.andWhere('action.targetUserId = :targetUserId', { targetUserId: filters.targetUserId });
    }

    if (filters.actionType) {
      queryBuilder.andWhere('action.actionType = :actionType', { actionType: filters.actionType });
    }

    if (filters.violationCategory) {
      queryBuilder.andWhere('action.violationCategory = :violationCategory', { 
        violationCategory: filters.violationCategory 
      });
    }

    if (filters.severity) {
      queryBuilder.andWhere('action.severity = :severity', { severity: filters.severity });
    }

    // Date range filtering
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('action.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('action.createdAt >= :startDate', { startDate: filters.startDate });
    } else if (filters.endDate) {
      queryBuilder.andWhere('action.createdAt <= :endDate', { endDate: filters.endDate });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const data = await queryBuilder
      .orderBy('action.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Export audit log in various formats
   * 
   * Exports filtered audit records to CSV, Excel, or JSON format.
   * Useful for compliance reporting and external analysis.
   * 
   * @param filters - Filter criteria and export format
   * @returns Buffer containing the exported data
   */
  async exportAuditLog(filters: ExportAuditDto): Promise<Buffer> {
    const format = filters.format || 'csv';

    // Get all matching records (no pagination for export)
    const queryBuilder = this.enforcementActionRepository
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.admin', 'admin')
      .leftJoinAndSelect('action.targetUser', 'targetUser');

    // Apply same filters as getAuditTrail
    if (filters.adminId) {
      queryBuilder.andWhere('action.adminId = :adminId', { adminId: filters.adminId });
    }

    if (filters.targetUserId) {
      queryBuilder.andWhere('action.targetUserId = :targetUserId', { targetUserId: filters.targetUserId });
    }

    if (filters.actionType) {
      queryBuilder.andWhere('action.actionType = :actionType', { actionType: filters.actionType });
    }

    if (filters.violationCategory) {
      queryBuilder.andWhere('action.violationCategory = :violationCategory', { 
        violationCategory: filters.violationCategory 
      });
    }

    if (filters.severity) {
      queryBuilder.andWhere('action.severity = :severity', { severity: filters.severity });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('action.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters.startDate) {
      queryBuilder.andWhere('action.createdAt >= :startDate', { startDate: filters.startDate });
    } else if (filters.endDate) {
      queryBuilder.andWhere('action.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const records = await queryBuilder
      .orderBy('action.createdAt', 'DESC')
      .getMany();

    // Export based on format
    switch (format) {
      case 'csv':
        return this.exportToCSV(records);
      case 'excel':
        return this.exportToExcel(records);
      case 'json':
        return this.exportToJSON(records);
      default:
        return this.exportToCSV(records);
    }
  }

  /**
   * Get all enforcement actions by a specific admin
   * 
   * Retrieves all actions performed by an admin.
   * Useful for admin accountability and performance review.
   * 
   * @param adminId - ID of the admin
   * @param limit - Maximum number of records to return (default: 100)
   * @returns Array of enforcement actions
   */
  async getActionsByAdmin(adminId: string, limit: number = 100): Promise<EnforcementAction[]> {
    return await this.enforcementActionRepository.find({
      where: { adminId },
      relations: ['targetUser'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get all enforcement actions for a specific user
   * 
   * Retrieves complete enforcement history for a user.
   * Useful for user profile review and appeal processing.
   * 
   * @param userId - ID of the user
   * @param limit - Maximum number of records to return (default: 100)
   * @returns Array of enforcement actions
   */
  async getActionsByUser(userId: string, limit: number = 100): Promise<EnforcementAction[]> {
    return await this.enforcementActionRepository.find({
      where: { targetUserId: userId },
      relations: ['admin'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get a specific enforcement action by ID
   * 
   * @param actionId - ID of the enforcement action
   * @returns The enforcement action
   * 
   * @throws NotFoundException if action not found
   */
  async getActionById(actionId: string): Promise<EnforcementAction> {
    const action = await this.enforcementActionRepository.findOne({
      where: { id: actionId },
      relations: ['admin', 'targetUser', 'appeal'],
    });

    if (!action) {
      throw new NotFoundException(`Enforcement action ${actionId} not found`);
    }

    return action;
  }

  /**
   * Get audit statistics for a date range
   * 
   * Provides summary statistics for audit reporting.
   * 
   * @param startDate - Start of date range
   * @param endDate - End of date range
   * @returns Statistics object
   */
  async getAuditStatistics(startDate: Date, endDate: Date): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    actionsBySeverity: Record<string, number>;
    actionsByCategory: Record<string, number>;
    topAdmins: Array<{ adminId: string; count: number }>;
  }> {
    const queryBuilder = this.enforcementActionRepository
      .createQueryBuilder('action')
      .where('action.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    // Total actions
    const totalActions = await queryBuilder.getCount();

    // Actions by type
    const actionsByTypeRaw = await this.enforcementActionRepository
      .createQueryBuilder('action')
      .select('action.actionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('action.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('action.actionType')
      .getRawMany();

    const actionsByType = actionsByTypeRaw.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Actions by severity
    const actionsBySeverityRaw = await this.enforcementActionRepository
      .createQueryBuilder('action')
      .select('action.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('action.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('action.severity IS NOT NULL')
      .groupBy('action.severity')
      .getRawMany();

    const actionsBySeverity = actionsBySeverityRaw.reduce((acc, row) => {
      acc[row.severity] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Actions by category
    const actionsByCategoryRaw = await this.enforcementActionRepository
      .createQueryBuilder('action')
      .select('action.violationCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('action.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('action.violationCategory IS NOT NULL')
      .groupBy('action.violationCategory')
      .getRawMany();

    const actionsByCategory = actionsByCategoryRaw.reduce((acc, row) => {
      acc[row.category] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Top admins
    const topAdminsRaw = await this.enforcementActionRepository
      .createQueryBuilder('action')
      .select('action.adminId', 'adminId')
      .addSelect('COUNT(*)', 'count')
      .where('action.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('action.adminId')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topAdmins = topAdminsRaw.map(row => ({
      adminId: row.adminId,
      count: parseInt(row.count),
    }));

    return {
      totalActions,
      actionsByType,
      actionsBySeverity,
      actionsByCategory,
      topAdmins,
    };
  }

  /**
   * Get recent enforcement actions
   * 
   * @param limit - Number of recent actions to retrieve (default: 20)
   * @returns Array of recent enforcement actions
   */
  async getRecentActions(limit: number = 20): Promise<EnforcementAction[]> {
    return await this.enforcementActionRepository.find({
      relations: ['admin', 'targetUser'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // Export helper methods

  /**
   * Export audit records to CSV format
   */
  private exportToCSV(records: EnforcementAction[]): Buffer {
    const headers = [
      'ID',
      'Date',
      'Admin ID',
      'Admin Email',
      'Target User ID',
      'Target User Email',
      'Action Type',
      'Violation Category',
      'Severity',
      'Reason',
      'IP Address',
    ];

    const rows = records.map(record => [
      record.id,
      record.createdAt.toISOString(),
      record.adminId,
      (record as any).admin?.email || 'N/A',
      record.targetUserId,
      (record as any).targetUser?.email || 'N/A',
      record.actionType,
      record.violationCategory || 'N/A',
      record.severity || 'N/A',
      record.reason,
      record.ipAddress || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Export audit records to Excel format
   * Note: This is a simplified implementation. For production, use a library like 'exceljs'
   */
  private exportToExcel(records: EnforcementAction[]): Buffer {
    // For now, return CSV format with .xlsx extension
    // In production, implement proper Excel export using exceljs library
    return this.exportToCSV(records);
  }

  /**
   * Export audit records to JSON format
   */
  private exportToJSON(records: EnforcementAction[]): Buffer {
    const jsonData = records.map(record => ({
      id: record.id,
      date: record.createdAt.toISOString(),
      adminId: record.adminId,
      adminEmail: (record as any).admin?.email,
      targetUserId: record.targetUserId,
      targetUserEmail: (record as any).targetUser?.email,
      actionType: record.actionType,
      violationCategory: record.violationCategory,
      severity: record.severity,
      reason: record.reason,
      previousState: record.previousState,
      newState: record.newState,
      evidence: record.evidence,
      adminNotes: record.adminNotes,
      ipAddress: record.ipAddress,
      userAgent: record.userAgent,
    }));

    return Buffer.from(JSON.stringify(jsonData, null, 2), 'utf-8');
  }
}
