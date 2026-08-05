import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../../../entities/tenant.entity';
import { PaymentMethod } from '../../../entities/payment.entity';

export interface TenantPaymentConfig {
  escrowEnabled: boolean;
  /** Advance share as decimal 0–1; null means require bid percentage */
  advancePercentage: number | null;
  finalPercentage: number | null;
  fraudCheckEnabled: boolean;
  microLendingEnabled: boolean;
  allowedPaymentMethods: PaymentMethod[];
  maxAmount: number | null;
  minAmount: number;
}

/**
 * Resolves tenant payment settings from tenant.metadata.paymentConfig
 * with optional platform env overrides. Never invents money ratios.
 */
@Injectable()
export class TenantPaymentConfigService {
  constructor(private readonly configService: ConfigService) {}

  async getConfig(tenant: Tenant): Promise<TenantPaymentConfig> {
    const meta = (tenant as any)?.metadata?.paymentConfig || {};
    const envMax = Number(this.configService.get<string>('PAYMENT_MAX_AMOUNT'));
    const envMin = Number(this.configService.get<string>('PAYMENT_MIN_AMOUNT'));

    const advanceFromMeta =
      meta.advancePercentage != null ? Number(meta.advancePercentage) : null;
    const finalFromMeta =
      meta.finalPercentage != null ? Number(meta.finalPercentage) : null;

    return {
      escrowEnabled: meta.escrowEnabled !== false,
      advancePercentage:
        Number.isFinite(advanceFromMeta) && advanceFromMeta > 0
          ? advanceFromMeta <= 1
            ? advanceFromMeta
            : advanceFromMeta / 100
          : null,
      finalPercentage:
        Number.isFinite(finalFromMeta) && finalFromMeta > 0
          ? finalFromMeta <= 1
            ? finalFromMeta
            : finalFromMeta / 100
          : null,
      fraudCheckEnabled: meta.fraudCheckEnabled !== false,
      microLendingEnabled: meta.microLendingEnabled === true,
      allowedPaymentMethods: Array.isArray(meta.allowedPaymentMethods)
        ? meta.allowedPaymentMethods
        : Object.values(PaymentMethod),
      maxAmount:
        meta.maxAmount != null && Number(meta.maxAmount) > 0
          ? Number(meta.maxAmount)
          : Number.isFinite(envMax) && envMax > 0
            ? envMax
            : null,
      minAmount:
        meta.minAmount != null && Number(meta.minAmount) > 0
          ? Number(meta.minAmount)
          : Number.isFinite(envMin) && envMin > 0
            ? envMin
            : 0.01,
    };
  }
}
