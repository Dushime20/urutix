import {
  Injectable, Logger, NotFoundException,
  ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from '../../entities/api-key.entity';
import { WebhookConfig } from '../../entities/webhook-config.entity';

const AVAILABLE_EVENTS = [
  'load.created', 'load.published', 'load.assigned', 'load.completed', 'load.cancelled',
  'trip.started', 'trip.completed', 'trip.cancelled', 'trip.delayed',
  'bid.placed', 'bid.accepted', 'bid.rejected',
  'payment.completed', 'payment.failed',
  'driver.assigned', 'truck.status_changed',
  'dispute.opened', 'dispute.resolved',
];

@Injectable()
export class ApiMarketplaceService {
  private readonly logger = new Logger(ApiMarketplaceService.name);

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(WebhookConfig)
    private readonly webhookRepository: Repository<WebhookConfig>,
  ) {}

  // ─── API Key Management ───────────────────────────────────────────────────────

  async generateApiKey(
    tenantId: string,
    userId: string,
    name: string,
    permissions: string[] = ['read'],
    expiresAt?: Date,
  ): Promise<{ id: string; key: string; prefix: string }> {
    const rawKey = `urx_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = this.apiKeyRepository.create({
      tenantId,
      createdBy: userId,
      name,
      keyHash,
      keyPrefix,
      permissions,
      expiresAt,
      isActive: true,
    });

    const saved = await this.apiKeyRepository.save(apiKey);
    this.logger.log(`API key created: ${saved.id} for tenant ${tenantId}`);

    // Return plaintext key ONCE — never stored
    return { id: saved.id, key: rawKey, prefix: keyPrefix };
  }

  async listApiKeys(tenantId: string): Promise<Omit<ApiKey, 'keyHash'>[]> {
    const keys = await this.apiKeyRepository.find({
      where: { tenantId, isActive: true },
      order: { createdAt: 'DESC' },
    });
    // Never return the hash
    return keys.map(({ keyHash, ...rest }) => rest);
  }

  async revokeApiKey(id: string, tenantId: string): Promise<void> {
    const key = await this.apiKeyRepository.findOne({ where: { id, tenantId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.apiKeyRepository.update(id, { isActive: false });
  }

  async validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const key = await this.apiKeyRepository.findOne({ where: { keyHash, isActive: true } });
    if (!key) return null;
    if (key.expiresAt && key.expiresAt < new Date()) return null;
    // Update lastUsedAt
    await this.apiKeyRepository.update(key.id, { lastUsedAt: new Date() });
    return key;
  }

  // ─── Webhook Config Management ────────────────────────────────────────────────

  async createWebhook(
    tenantId: string,
    userId: string,
    name: string,
    url: string,
    events: string[],
  ): Promise<WebhookConfig> {
    // Validate URL
    try { new URL(url); } catch { throw new BadRequestException('Invalid webhook URL'); }

    // Validate events
    const invalid = events.filter((e) => !AVAILABLE_EVENTS.includes(e));
    if (invalid.length > 0) {
      throw new BadRequestException(`Unknown event types: ${invalid.join(', ')}`);
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const webhook = this.webhookRepository.create({
      tenantId, createdBy: userId, name, url, events, secret, isActive: true,
    });
    return this.webhookRepository.save(webhook);
  }

  async listWebhooks(tenantId: string): Promise<WebhookConfig[]> {
    return this.webhookRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateWebhook(id: string, tenantId: string, updates: Partial<{ name: string; url: string; events: string[]; isActive: boolean }>): Promise<WebhookConfig> {
    const webhook = await this.webhookRepository.findOne({ where: { id, tenantId } });
    if (!webhook) throw new NotFoundException('Webhook not found');
    Object.assign(webhook, updates);
    return this.webhookRepository.save(webhook);
  }

  async deleteWebhook(id: string, tenantId: string): Promise<void> {
    await this.webhookRepository.delete({ id, tenantId });
  }

  async sendTestPayload(id: string, tenantId: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const webhook = await this.webhookRepository.findOne({ where: { id, tenantId } });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const payload = {
      event: 'test.ping',
      timestamp: new Date().toISOString(),
      tenantId,
      data: { message: 'This is a test webhook delivery from Urutix' },
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Urutix-Event': 'test.ping',
          'X-Urutix-Signature': this.signPayload(JSON.stringify(payload), webhook.secret!),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      return { success: response.ok, statusCode: response.status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deliverWebhookEvent(tenantId: string, event: string, data: any): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { tenantId, isActive: true },
    });

    for (const webhook of webhooks) {
      if (!webhook.events.includes(event) && !webhook.events.includes('*')) continue;

      const payload = { event, timestamp: new Date().toISOString(), tenantId, data };
      const body = JSON.stringify(payload);
      const start = Date.now();

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Urutix-Event': event,
            'X-Urutix-Signature': this.signPayload(body, webhook.secret!),
          },
          body,
          signal: AbortSignal.timeout(15000),
        });

        const log = {
          deliveredAt: new Date().toISOString(),
          event,
          statusCode: response.status,
          success: response.ok,
          responseMs: Date.now() - start,
        };

        webhook.deliveryLogs = [...(webhook.deliveryLogs || []).slice(-49), log];
        webhook.lastDeliveredAt = new Date();
        if (!response.ok) webhook.failureCount++;
        else webhook.failureCount = 0;

        await this.webhookRepository.save(webhook);
      } catch (err) {
        this.logger.error(`Webhook delivery failed for ${webhook.id}: ${err.message}`);
        webhook.failureCount++;
        await this.webhookRepository.save(webhook);
      }
    }
  }

  getAvailableEvents(): string[] {
    return AVAILABLE_EVENTS;
  }

  private signPayload(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }
}
