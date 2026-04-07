import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ActivityLog } from '../../entities/activity-log.entity';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  async getActivityLogs(
    tenantId: string,
    filters: {
      category?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .where('user.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC');

    if (filters.category) {
      queryBuilder.andWhere('log.resource = :category', { category: filters.category });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(log.action ILIKE :search OR user.username ILIKE :search OR log.details::text ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.limit) {
      queryBuilder.take(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.skip(filters.offset);
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      logs: logs.map(log => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.user?.email || 'System',
        userRole: log.user?.role || 'System',
        action: log.action,
        category: this.mapResourceToCategory(log.resource),
        description: this.generateDescription(log),
        status: this.determineStatus(log),
        ipAddress: log.ipAddress,
        details: log.details,
      })),
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  async getActivityStats(tenantId: string) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const totalActivities = await this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt > :date', { date: last24Hours })
      .getCount();

    const userActions = await this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt > :date', { date: last24Hours })
      .andWhere('log.resource = :resource', { resource: 'user' })
      .getCount();

    const securityEvents = await this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt > :date', { date: last24Hours })
      .andWhere('(log.isSuspicious = true OR log.action LIKE :action)', { action: '%login%' })
      .getCount();

    const systemEvents = await this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .where('user.tenantId = :tenantId', { tenantId })
      .andWhere('log.createdAt > :date', { date: last24Hours })
      .andWhere('log.resource = :resource', { resource: 'system' })
      .getCount();

    return {
      totalActivities,
      userActions,
      securityEvents,
      systemEvents,
    };
  }

  private mapResourceToCategory(resource: string): string {
    const mapping: Record<string, string> = {
      user: 'user',
      cargo: 'cargo',
      load: 'cargo',
      payment: 'payment',
      system: 'system',
      auth: 'security',
      tenant: 'tenant',
      document: 'document',
    };
    return mapping[resource] || 'system';
  }

  private generateDescription(log: ActivityLog): string {
    const action = log.action;
    const resource = log.resource;
    const resourceId = log.resourceId;
    const details = log.details || {};

    if (action.includes('CREATE')) {
      return `Created new ${resource} ${resourceId ? `#${resourceId}` : ''}`;
    } else if (action.includes('UPDATE')) {
      return `Updated ${resource} ${resourceId ? `#${resourceId}` : ''}`;
    } else if (action.includes('DELETE')) {
      return `Deleted ${resource} ${resourceId ? `#${resourceId}` : ''}`;
    } else if (action.includes('LOGIN')) {
      return details.success ? 'Successful login' : 'Failed login attempt';
    } else {
      return `${action} on ${resource} ${resourceId ? `#${resourceId}` : ''}`;
    }
  }

  private determineStatus(log: ActivityLog): string {
    if (log.isSuspicious) return 'error';
    if (log.action.includes('FAIL') || log.action.includes('ERROR')) return 'error';
    if (log.action.includes('WARN') || log.action.includes('SUSPEND')) return 'warning';
    if (log.action.includes('INFO')) return 'info';
    return 'success';
  }
}
