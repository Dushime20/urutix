import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditService } from './credit.service';
import { PricingService } from './pricing.service';
import { PricingRuleType } from './../entities/credit-pricing-rule.entity';
import { Trip, TripStatus } from './../entities/trip.entity';
import { Load } from './../entities/load.entity';

export interface TripCompletedEvent {
  tripId: string;
  tenantId: string;
  loadId: string;
  weight: number;
  truckId?: string;
  driverId?: string;
}

@Injectable()
export class CreditConsumptionListener {
  private readonly logger = new Logger(CreditConsumptionListener.name);

  constructor(
    private readonly creditService: CreditService,
    private readonly pricingService: PricingService,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  /**
   * Handle trip completion and deduct credits based on cargo weight
   */
  async handleTripCompleted(event: TripCompletedEvent): Promise<void> {
    this.logger.log(`Processing credit deduction for trip: ${event.tripId}`);

    try {
      // Get pricing rule for this tenant
      const rule = await this.pricingService.getPricingRule(
        event.tenantId,
        PricingRuleType.WEIGHT,
        event.weight,
      );

      this.logger.debug(
        `Using pricing rule: ${rule.ruleName} (${rule.creditCost} credits/${rule.unit})`,
      );

      // Calculate cost
      const { totalCost, breakdown } = await this.pricingService.calculateCost(
        event.tenantId,
        PricingRuleType.WEIGHT,
        event.weight,
      );

      this.logger.debug(
        `Calculated cost: ${totalCost} credits for ${event.weight} tons`,
      );

      // Check if tenant has enough credits
      const hasEnoughCredits = await this.creditService.hasSufficientCredits(
        event.tenantId,
        totalCost,
      );

      if (!hasEnoughCredits) {
        this.logger.warn(
          `Tenant ${event.tenantId} has insufficient credits for trip ${event.tripId}. Required: ${totalCost}`,
        );
        // TODO: Send notification to tenant about insufficient credits
        // For now, we'll still record the transaction as a negative balance
      }

      // Deduct credits
      const transaction = await this.creditService.deductCredits({
        tenantId: event.tenantId,
        amount: totalCost,
        description: `Trip completed: ${event.weight} tons @ ${rule.creditCost} credits/ton`,
        referenceType: 'trip',
        referenceId: event.tripId,
        calculationDetails: {
          weight_tons: event.weight,
          rate_per_ton: Number(rule.creditCost),
          total_cost: totalCost,
          rule_id: rule.id,
          rule_name: rule.ruleName,
          truck_id: event.truckId,
          load_id: event.loadId,
          driver_id: event.driverId,
          breakdown,
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Successfully deducted ${totalCost} credits from tenant ${event.tenantId}. Transaction ID: ${transaction.id}`,
      );

      // Check for low balance and send alert
      const balance = await this.creditService.getCreditBalance(event.tenantId);
      if (balance.currentBalance < 100) {
        this.logger.warn(
          `Low credit balance for tenant ${event.tenantId}: ${balance.currentBalance} credits remaining`,
        );
        // TODO: Send low balance notification
      }
    } catch (error) {
      this.logger.error(
        `Failed to deduct credits for trip ${event.tripId}: ${error.message}`,
        error.stack,
      );
      // TODO: Queue for retry or send alert to admin
      throw error;
    }
  }

  /**
   * Process trip completion directly (without event emitter)
   * This can be called directly from the trips service
   */
  async processTripCompletion(tripId: string, tenantId: string): Promise<void> {
    this.logger.log(`Processing trip completion: ${tripId}`);

    try {
      // Get trip with load details
      const trip = await this.tripRepository.findOne({
        where: { id: tripId, tenantId },
        relations: ['load'],
      });

      if (!trip) {
        throw new Error(`Trip not found: ${tripId}`);
      }

      if (trip.status !== TripStatus.COMPLETED) {
        this.logger.warn(
          `Trip ${tripId} is not completed. Current status: ${trip.status}`,
        );
        return;
      }

      // Get load details
      const load = trip.load || (await this.loadRepository.findOne({
        where: { id: trip.loadId },
      }));

      if (!load) {
        throw new Error(`Load not found for trip: ${tripId}`);
      }

      if (!load.weight || load.weight <= 0) {
        this.logger.warn(
          `Load ${load.id} has no weight specified. Skipping credit deduction.`,
        );
        return;
      }

      // Create event and process
      const event: TripCompletedEvent = {
        tripId: trip.id,
        tenantId: trip.tenantId,
        loadId: load.id,
        weight: Number(load.weight),
        truckId: trip.truckId,
        driverId: trip.driverId,
      };

      await this.handleTripCompleted(event);
    } catch (error) {
      this.logger.error(
        `Failed to process trip completion for ${tripId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Preview credit cost for a load before trip completion
   */
  async previewCreditCost(
    tenantId: string,
    weight: number,
  ): Promise<{
    cost: number;
    breakdown: any[];
    hasEnoughCredits: boolean;
    currentBalance: number;
    balanceAfter: number;
  }> {
    const { totalCost, breakdown } = await this.pricingService.calculateCost(
      tenantId,
      PricingRuleType.WEIGHT,
      weight,
    );

    const balance = await this.creditService.getCreditBalance(tenantId);
    const hasEnoughCredits = balance.currentBalance >= totalCost;

    return {
      cost: totalCost,
      breakdown,
      hasEnoughCredits,
      currentBalance: balance.currentBalance,
      balanceAfter: balance.currentBalance - totalCost,
    };
  }
}
