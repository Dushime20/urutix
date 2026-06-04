import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoadTemplate } from '../../entities/load-template.entity';
import { Load } from '../../entities/load.entity';
import {
  CreateLoadTemplateDto,
  UpdateLoadTemplateDto,
  CreateLoadFromTemplateDto,
  ScheduleTemplateDto,
  RecurrenceFrequency,
} from './dto/load-template.dto';

@Injectable()
export class LoadTemplateService {
  private readonly logger = new Logger(LoadTemplateService.name);

  constructor(
    @InjectRepository(LoadTemplate)
    private readonly templateRepository: Repository<LoadTemplate>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async create(
    dto: CreateLoadTemplateDto,
    userId: string,
    tenantId: string,
  ): Promise<LoadTemplate> {
    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description,
      templateData: dto.templateData,
      createdBy: userId,
      tenantId,
      isActive: true,
      usageCount: 0,
    });
    return this.templateRepository.save(template);
  }

  async findAll(tenantId: string, userId: string): Promise<LoadTemplate[]> {
    return this.templateRepository.find({
      where: { tenantId, createdBy: userId, isActive: true },
      order: { usageCount: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<LoadTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id, tenantId, isActive: true },
    });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async update(
    id: string,
    dto: UpdateLoadTemplateDto,
    tenantId: string,
    userId: string,
  ): Promise<LoadTemplate> {
    const template = await this.findOne(id, tenantId);
    if (template.createdBy !== userId)
      throw new ForbiddenException('You can only edit your own templates');
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    const template = await this.findOne(id, tenantId);
    if (template.createdBy !== userId)
      throw new ForbiddenException('You can only delete your own templates');
    await this.templateRepository.softDelete(id);
  }

  // ─── Instantiate load from template ─────────────────────────────────────────

  async createLoadFromTemplate(
    templateId: string,
    dto: CreateLoadFromTemplateDto,
    userId: string,
    tenantId: string,
  ): Promise<Load> {
    const template = await this.findOne(templateId, tenantId);

    const loadData = {
      ...template.templateData,
      ...(dto.overrides || {}),
      tenantId,
      cargoOwnerId: userId,
      status: 'CREATED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const load = this.loadRepository.create(loadData as any);
    const saved = await this.loadRepository.save(load);
    const savedLoad = Array.isArray(saved) ? saved[0] : saved;

    // Increment usage count
    await this.templateRepository.increment({ id: templateId }, 'usageCount', 1);

    this.logger.log(`Created load ${savedLoad.id} from template ${templateId}`);
    return savedLoad;
  }

  // ─── Recurring schedule ──────────────────────────────────────────────────────

  async setSchedule(
    templateId: string,
    dto: ScheduleTemplateDto,
    tenantId: string,
    userId: string,
  ): Promise<LoadTemplate> {
    const template = await this.findOne(templateId, tenantId);
    if (template.createdBy !== userId)
      throw new ForbiddenException('You can only schedule your own templates');

    template.templateData = {
      ...template.templateData,
      _schedule: {
        frequency: dto.frequency,
        startDate: dto.startDate,
        endDate: dto.endDate,
        dayOfWeek: dto.dayOfWeek,
        dayOfMonth: dto.dayOfMonth,
        lastRunAt: null,
      },
    };
    return this.templateRepository.save(template);
  }

  async getScheduledLoads(templateId: string, tenantId: string): Promise<any[]> {
    const template = await this.findOne(templateId, tenantId);
    const schedule = template.templateData?._schedule;
    if (!schedule) return [];

    // Return upcoming scheduled dates
    const upcoming: string[] = [];
    const start = new Date(schedule.startDate);
    const end = schedule.endDate ? new Date(schedule.endDate) : null;
    const now = new Date();
    let cursor = new Date(start);

    while (cursor <= (end || new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000))) {
      if (cursor > now) upcoming.push(cursor.toISOString());
      if (upcoming.length >= 10) break;

      if (schedule.frequency === RecurrenceFrequency.DAILY) {
        cursor.setDate(cursor.getDate() + 1);
      } else if (schedule.frequency === RecurrenceFrequency.WEEKLY) {
        cursor.setDate(cursor.getDate() + 7);
      } else if (schedule.frequency === RecurrenceFrequency.MONTHLY) {
        cursor.setMonth(cursor.getMonth() + 1);
      } else {
        break;
      }
    }

    return upcoming.map((date) => ({ scheduledDate: date, templateId }));
  }

  // ─── Daily cron: auto-create loads from scheduled templates ─────────────────

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processRecurringTemplates(): Promise<void> {
    this.logger.log('Processing recurring load templates...');

    const templates = await this.templateRepository
      .createQueryBuilder('t')
      .where(`t."templateData"->>'_schedule' IS NOT NULL`)
      .andWhere('t."isActive" = true')
      .getMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const template of templates) {
      try {
        const schedule = template.templateData?._schedule;
        if (!schedule) continue;

        const startDate = new Date(schedule.startDate);
        const endDate = schedule.endDate ? new Date(schedule.endDate) : null;

        if (today < startDate) continue;
        if (endDate && today > endDate) continue;

        const lastRun = schedule.lastRunAt ? new Date(schedule.lastRunAt) : null;
        const shouldRun = this.shouldRunToday(schedule, today, lastRun);

        if (shouldRun) {
          await this.createLoadFromTemplate(
            template.id,
            {},
            template.createdBy,
            template.tenantId,
          );

          // Update lastRunAt
          template.templateData._schedule.lastRunAt = today.toISOString();
          await this.templateRepository.save(template);

          this.logger.log(`Auto-created load from template ${template.id} (${template.name})`);
        }
      } catch (err) {
        this.logger.error(`Failed to process template ${template.id}: ${err.message}`);
      }
    }
  }

  private shouldRunToday(
    schedule: any,
    today: Date,
    lastRun: Date | null,
  ): boolean {
    if (lastRun) {
      const lastRunDay = new Date(lastRun);
      lastRunDay.setHours(0, 0, 0, 0);
      if (lastRunDay.getTime() === today.getTime()) return false; // already ran today
    }

    if (schedule.frequency === RecurrenceFrequency.DAILY) return true;

    if (schedule.frequency === RecurrenceFrequency.WEEKLY) {
      return schedule.dayOfWeek !== undefined
        ? today.getDay() === schedule.dayOfWeek
        : true;
    }

    if (schedule.frequency === RecurrenceFrequency.MONTHLY) {
      return schedule.dayOfMonth !== undefined
        ? today.getDate() === schedule.dayOfMonth
        : today.getDate() === 1;
    }

    return false;
  }
}
