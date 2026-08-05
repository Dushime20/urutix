import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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

  async calculateAdvancePaymentForTrip(
    tripId: string,
    tenantId?: string,
  ): Promise<AdvancePaymentCalculation | null> {
    try {
      const whereClause: any = { id: tripId };
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }

      const trip = await this.tripRepository.findOne({
        where: whereClause,
      });

      if (!trip) {
        this.logger.warn(`Trip not found: ${tripId}`);
        return null;
      }

      const transportationFee = Number(trip.agreedPrice);
      if (!Number.isFinite(transportationFee) || transportationFee <= 0) {
        throw new BadRequestException(
          `Trip ${tripId} has no valid agreedPrice for advance calculation.`,
        );
      }

      const currency = String(trip.currencyCode || '').trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(currency)) {
        throw new BadRequestException(
          `Trip ${tripId} is missing a valid ISO 4217 currencyCode.`,
        );
      }

      const acceptedBid = await this.bidRepository.findOne({
        where: {
          loadId: trip.loadId,
          status: BidStatus.ACCEPTED,
        },
        order: { updatedAt: 'DESC' },
      });

      if (!acceptedBid) {
        throw new BadRequestException(
          `No accepted bid found for trip ${tripId}; cannot calculate advance payment.`,
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
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error calculating advance payment for trip ${tripId}:`,
        error,
      );
      return null;
    }
  }

  calculateAdvancePayment(
    transportationFee: number,
    advancePaymentPercentage: number | null | undefined,
    requireAdvancePayment: boolean = true,
    currency?: string,
  ): AdvancePaymentCalculation {
    const resolvedCurrency = String(currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(resolvedCurrency)) {
      throw new BadRequestException(
        'A valid ISO 4217 currency code is required for advance payment calculation.',
      );
    }

    if (!requireAdvancePayment) {
      return {
        transportationFee,
        advancePaymentPercentage: 0,
        advanceAmount: 0,
        finalAmount: transportationFee,
        requireAdvancePayment: false,
        currency: resolvedCurrency,
      };
    }

    if (
      advancePaymentPercentage === undefined ||
      advancePaymentPercentage === null ||
      !Number.isFinite(Number(advancePaymentPercentage))
    ) {
      throw new BadRequestException(
        'advancePaymentPercentage is required when advance payment is required.',
      );
    }

    const percentage = Number(advancePaymentPercentage);
    if (percentage <= 0 || percentage > 100) {
      throw new BadRequestException(
        'Advance payment percentage must be between 0 (exclusive) and 100.',
      );
    }

    const advanceAmount =
      Math.round(transportationFee * (percentage / 100) * 100) / 100;
    const finalAmount =
      Math.round((transportationFee - advanceAmount) * 100) / 100;

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
      currency: resolvedCurrency,
    };
  }
}
