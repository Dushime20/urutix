import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreditPricingRule, PricingRuleType } from '../entities/credit-pricing-rule.entity';
import { Tenant } from '../entities/tenant.entity';
import { TenantSubscription, SubscriptionStatus } from '../entities/tenant-subscription.entity';

export interface PricingCalculation {
  totalCost: number;
  breakdown: PricingBreakdownItem[];
}

export interface PricingBreakdownItem {
  ruleId: string;
  ruleName: string;
  value: number;
  rate: number;
  cost: number;
  unit: string;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(CreditPricingRule)
    private pricingRuleRepository: Repository<CreditPricingRule>,
    @InjectRepository(TenantSubscription)
    private subscriptionRepository: Repository<TenantSubscription>,
  ) {}

  /**
   * Get applicable pricing rule for tenant
   * Priority: Tenant-specific > Plan-specific > Default
   */
  async getPricingRule(
    tenantId: string,
    ruleType: PricingRuleType,
    value?: number,
  ): Promise<CreditPricingRule> {
    // 1. Try tenant-specific rule
    let rule = await this.pricingRuleRepository.findOne({
      where: {
        tenantId,
        ruleType,
        isActive: true,
      },
      order: { priority: 'DESC' },
    });

    if (rule && this.isRuleApplicable(rule, value)) {
      return rule;
    }

    // 2. Try plan-specific rule
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });

    if (subscription?.planId) {
      rule = await this.pricingRuleRepository.findOne({
        where: {
          planId: subscription.planId,
          ruleType,
          isActive: true,
        },
        order: { priority: 'DESC' },
      });

      if (rule && this.isRuleApplicable(rule, value)) {
        return rule;
      }
    }

    // 3. Get default rule (no tenant or plan specified)
    rule = await this.pricingRuleRepository.findOne({
      where: {
        ruleType,
        isActive: true,
        tenantId: IsNull(),
        planId: IsNull(),
      },
      order: { priority: 'DESC' },
    });

    if (!rule) {
      throw new NotFoundException(`No pricing rule found for type: ${ruleType}`);
    }

    if (!this.isRuleApplicable(rule, value)) {
      throw new NotFoundException(
        `No applicable pricing rule found for type: ${ruleType} and value: ${value}`,
      );
    }

    return rule;
  }

  /**
   * Check if rule applies to the given value (for tiered pricing)
   */
  private isRuleApplicable(rule: CreditPricingRule, value?: number): boolean {
    if (value === undefined || value === null) return true;

    const meetsMin = rule.minValue === null || rule.minValue === undefined || value >= Number(rule.minValue);
    const meetsMax = rule.maxValue === null || rule.maxValue === undefined || value <= Number(rule.maxValue);

    return meetsMin && meetsMax;
  }

  /**
   * Calculate total cost with tiered pricing support
   */
  async calculateCost(
    tenantId: string,
    ruleType: PricingRuleType,
    value: number,
  ): Promise<PricingCalculation> {
    // Get all applicable rules (for tiered pricing)
    const rules = await this.getApplicableRules(tenantId, ruleType);

    if (rules.length === 0) {
      throw new NotFoundException(`No pricing rules found for type: ${ruleType}`);
    }

    // If only one rule or no tiered pricing, use simple calculation
    if (rules.length === 1 || !this.hasTieredPricing(rules)) {
      const rule = rules[0];
      const cost = value * Number(rule.creditCost);

      return {
        totalCost: cost,
        breakdown: [
          {
            ruleId: rule.id,
            ruleName: rule.ruleName,
            value,
            rate: Number(rule.creditCost),
            cost,
            unit: rule.unit,
          },
        ],
      };
    }

    // Calculate with tiered pricing
    return this.calculateTieredCost(rules, value);
  }

  /**
   * Get all applicable rules for tiered pricing
   */
  private async getApplicableRules(
    tenantId: string,
    ruleType: PricingRuleType,
  ): Promise<CreditPricingRule[]> {
    // Try tenant-specific rules first
    let rules = await this.pricingRuleRepository.find({
      where: {
        tenantId,
        ruleType,
        isActive: true,
      },
      order: { minValue: 'ASC', priority: 'DESC' },
    });

    if (rules.length > 0) return rules;

    // Try plan-specific rules
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenantId, status: SubscriptionStatus.ACTIVE },
    });

    if (subscription?.planId) {
      rules = await this.pricingRuleRepository.find({
        where: {
          planId: subscription.planId,
          ruleType,
          isActive: true,
        },
        order: { minValue: 'ASC', priority: 'DESC' },
      });

      if (rules.length > 0) return rules;
    }

    // Get default rules
    rules = await this.pricingRuleRepository.find({
      where: {
        ruleType,
        isActive: true,
        tenantId: IsNull(),
        planId: IsNull(),
      },
      order: { minValue: 'ASC', priority: 'DESC' },
    });

    return rules;
  }

  /**
   * Check if rules have tiered pricing
   */
  private hasTieredPricing(rules: CreditPricingRule[]): boolean {
    return rules.some((rule) => rule.minValue !== null || rule.maxValue !== null);
  }

  /**
   * Calculate cost with tiered pricing
   */
  private calculateTieredCost(
    rules: CreditPricingRule[],
    totalValue: number,
  ): PricingCalculation {
    let remainingValue = totalValue;
    let totalCost = 0;
    const breakdown: PricingBreakdownItem[] = [];

    for (const rule of rules) {
      if (remainingValue <= 0) break;

      const applicableValue = this.getApplicableValue(
        remainingValue,
        rule.minValue ? Number(rule.minValue) : null,
        rule.maxValue ? Number(rule.maxValue) : null,
      );

      if (applicableValue > 0) {
        const cost = applicableValue * Number(rule.creditCost);
        totalCost += cost;

        breakdown.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          value: applicableValue,
          rate: Number(rule.creditCost),
          cost,
          unit: rule.unit,
        });

        remainingValue -= applicableValue;
      }
    }

    return { totalCost, breakdown };
  }

  /**
   * Get applicable value for a tier
   */
  private getApplicableValue(
    remainingValue: number,
    minValue: number | null,
    maxValue: number | null,
  ): number {
    if (minValue === null && maxValue === null) {
      return remainingValue;
    }

    if (minValue !== null && maxValue !== null) {
      const tierSize = maxValue - minValue;
      return Math.min(remainingValue, tierSize);
    }

    if (maxValue !== null) {
      return Math.min(remainingValue, maxValue);
    }

    return remainingValue;
  }

  /**
   * Get all pricing rules (admin)
   */
  async getAllRules(): Promise<CreditPricingRule[]> {
    return this.pricingRuleRepository.find({
      relations: ['plan', 'tenant'],
      order: { ruleType: 'ASC', priority: 'DESC' },
    });
  }

  /**
   * Create pricing rule (admin)
   */
  async createRule(data: Partial<CreditPricingRule>): Promise<CreditPricingRule> {
    const rule = this.pricingRuleRepository.create(data);
    return this.pricingRuleRepository.save(rule);
  }

  /**
   * Update pricing rule (admin)
   */
  async updateRule(id: string, data: Partial<CreditPricingRule>): Promise<CreditPricingRule> {
    await this.pricingRuleRepository.update(id, data);
    const rule = await this.pricingRuleRepository.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException(`Pricing rule not found: ${id}`);
    }
    return rule;
  }

  /**
   * Delete pricing rule (admin)
   */
  async deleteRule(id: string): Promise<void> {
    await this.pricingRuleRepository.delete(id);
  }
}
