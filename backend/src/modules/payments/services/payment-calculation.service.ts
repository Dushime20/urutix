import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bid, BidStatus } from '../../../entities/bid.entity';
import { Trip } from '../../../entities/trip.entity';

export interface AdvancePaymentCalculation {
  transportationFee: number;
  advancePaymentPercentage: number;
  advanceAmount: number;
  finalAmount: number;
  requireAdvancePayment: boolean;
  currency: string;
}

@Injectable()
export class PaymentCalculationService {
  private readonly logger = new Logger(PaymentCalculationService.name);

  constructor(
    @InjectRepository(Bid)
    private readonly bidRepository: Repository<Bid>,
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
  ) {}

  /**
   * Calculate advance payment amounts based on transportation fee and bid preferences
   * @param tripId - Trip ID to get transportation fee and bid information
   * @returns Calculation result with advance and final amounts
   */
  async calculateAdvancePaymentForTrip(
    tripId: string,
  ): Promise<AdvancePaymentCalculation | null> {
    try {
      // Get trip to find transportation fee
      const trip = await this.tripRepository.findOne({
        where: { id: tripId },
      });

      if (!trip) {
        this.logger.warn(`Trip not found: ${tripId}`);
        return null;
      }

      const transportationFee = trip.agreedPrice || 0;
      const currency = trip.currencyCode || 'USD';

      // Get accepted bid for this trip's load
      const acceptedBid = await this.bidRepository.findOne({
        where: {
          loadId: trip.loadId,
          status: BidStatus.ACCEPTED,
        },
        order: { updatedAt: 'DESC' },
      });

      // If no bid found, use default values
      if (!acceptedBid) {
        this.logger.warn(
          `No accepted bid found for trip ${tripId}, using default advance payment settings`,
        );
        return this.calculateAdvancePayment(
          transportationFee,
          null,
          true,
          currency,
        );
      }

      return this.calculateAdvancePayment(
        transportationFee,
        acceptedBid.advancePaymentPercentage,
        acceptedBid.requireAdvancePayment !== undefined
          ? acceptedBid.requireAdvancePayment
          : true,
        currency,
      );
    } catch (error) {
      this.logger.error(
        `Error calculating advance payment for trip ${tripId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Calculate advance payment amounts based on transportation fee and percentage
   * @param transportationFee - The total transportation fee
   * @param advancePaymentPercentage - Percentage of advance payment (0-100)
   * @param requireAdvancePayment - Whether advance payment is required
   * @param currency - Currency code
   * @returns Calculation result with advance and final amounts
   */
  calculateAdvancePayment(
    transportationFee: number,
    advancePaymentPercentage: number | null | undefined,
    requireAdvancePayment: boolean = true,
    currency: string = 'USD',
  ): AdvancePaymentCalculation {
    // If advance payment is not required, return full amount as final
    if (!requireAdvancePayment) {
      return {
        transportationFee,
        advancePaymentPercentage: 0,
        advanceAmount: 0,
        finalAmount: transportationFee,
        requireAdvancePayment: false,
        currency,
      };
    }

    // Use provided percentage or default to 70%
    const percentage =
      advancePaymentPercentage !== undefined && advancePaymentPercentage !== null
        ? advancePaymentPercentage
        : 70;

    // Validate percentage
    if (percentage < 0 || percentage > 100) {
      throw new Error('Advance payment percentage must be between 0 and 100');
    }

    // Calculate amounts with proper rounding to avoid floating point issues
    const advanceAmount =
      Math.round(transportationFee * (percentage / 100) * 100) / 100;
    const finalAmount =
      Math.round((transportationFee - advanceAmount) * 100) / 100;

    // Ensure total adds up correctly (adjust final if needed due to rounding)
    const total = Math.round((advanceAmount + finalAmount) * 100) / 100;
    const adjustedFinal =
      Math.abs(total - transportationFee) > 0.01
        ? Math.round((transportationFee - advanceAmount) * 100) / 100
        : finalAmount;

    return {
      transportationFee,
      advancePaymentPercentage: percentage,
      advanceAmount,
      finalAmount: adjustedFinal,
      requireAdvancePayment: true,
      currency,
    };
  }
}

