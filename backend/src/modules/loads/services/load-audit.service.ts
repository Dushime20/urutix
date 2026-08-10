import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditEvent,
  AuditAction,
  AuditEntityType,
} from '../../../entities/audit-event.entity';

export type CreateLoadAuditInput = {
  loadId: string;
  entityType?: AuditEntityType;
  entityId?: string;
  action: AuditAction;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  description?: string;
  reason?: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'modified';
  }>;
  metadata?: Record<string, any>;
  isAutomated?: boolean;
  automationSource?: string;
};

@Injectable()
export class LoadAuditService {
  private readonly logger = new Logger(LoadAuditService.name);

  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
  ) {}

  async create(auditData: CreateLoadAuditInput): Promise<AuditEvent | null> {
    if (!auditData.loadId || !auditData.actorId) {
      this.logger.warn(
        `Skipping audit event: missing loadId or actorId (${auditData.description})`,
      );
      return null;
    }
    try {
      const auditEvent = this.auditEventRepository.create({
        entityType: AuditEntityType.LOAD,
        isAutomated: false,
        ...auditData,
        metadata: {
          ...(auditData.metadata || {}),
        },
      });
      return await this.auditEventRepository.save(auditEvent);
    } catch (error) {
      this.logger.error(
        `Failed to create audit event for load ${auditData.loadId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }
}
