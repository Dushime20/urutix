import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BrokerTransporterCredit,
  CreditStatus,
  PaymentTermType,
} from '../../../entities/broker-intelligence.entity';
import { User } from '../../../entities/user.entity';
import { Trip } from '../../../entities/trip.entity';

@Injectable()
export class CreditManagementService {
  private readonly logger = new Logger(CreditManagementService.name);

  constructor(
    @InjectRepository(BrokerTransporterCredit)
    private creditRepo: Repository<BrokerTransporterCredit>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Trip)
    private tripRepo: Repository<Trip>,
  ) {}

  /**
   * Perform credit check on transporter
   */
  async performCreditCheck(
    brokerId: string,
    transporterId: string,
    tenantId: string,
  ): Promise<BrokerTransporterCredit> {
    const transporter = await this.userRepo.findOne({
      where: { id: transporterId },
    });

    if (!transporter) {
      throw new Error('Transporter not found');
    }

    // Get payment history from trips
    // Note: Trip doesn't have transporterId directly, need to join through truck
    // For now, we'll use a simplified approach - get all trips and filter by truck owner
    // In production, use a proper join query
    const trips = await this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .where('truck.ownerId = :transporterId', { transporterId })
      .take(100)
      .getMany();

    const paymentHistory = this.analyzePaymentHistory(trips);
    const creditScore = this.calculateCreditScore(paymentHistory);
    const riskAssessment = this.assessRisk(paymentHistory, creditScore);

    // Determine credit limit based on score
    const creditLimit = this.calculateCreditLimit(creditScore);

    // Check if credit record exists
    let credit = await this.creditRepo.findOne({
      where: { brokerId, transporterId, tenantId },
    });

    if (credit) {
      credit.creditCheck = {
        creditScore,
        riskLevel: riskAssessment.overallRisk,
        checkDate: new Date(),
        factors: riskAssessment.riskFactors,
      };
      credit.paymentHistory = paymentHistory;
      credit.riskAssessment = riskAssessment;
      credit.creditLimit = creditLimit;
      credit.availableCredit = creditLimit - credit.currentBalance;
    } else {
      credit = this.creditRepo.create({
        tenantId,
        brokerId,
        transporterId,
        status: CreditStatus.APPROVED,
        creditLimit,
        currentBalance: 0,
        availableCredit: creditLimit,
        paymentTerms: PaymentTermType.NET_30,
        creditCheck: {
          creditScore,
          riskLevel: riskAssessment.overallRisk,
          checkDate: new Date(),
          factors: riskAssessment.riskFactors,
        },
        paymentHistory,
        riskAssessment,
      });
    }

    return this.creditRepo.save(credit);
  }

  /**
   * Analyze payment history
   */
  private analyzePaymentHistory(trips: Trip[]): BrokerTransporterCredit['paymentHistory'] {
    if (trips.length === 0) {
      return {
        totalTransactions: 0,
        onTimePayments: 0,
        latePayments: 0,
        averageDaysToPay: 0,
        paymentTrend: 'STABLE',
      };
    }

    // Simplified analysis - in production, use actual payment records
    const totalTransactions = trips.length;
    const onTimePayments = Math.floor(totalTransactions * 0.85); // 85% on-time
    const latePayments = totalTransactions - onTimePayments;
    const averageDaysToPay = 28; // Simplified

    const recentTrips = trips.slice(0, 10);
    const olderTrips = trips.slice(10, 20);
    const recentOnTime = Math.floor(recentTrips.length * 0.9);
    const olderOnTime = Math.floor(olderTrips.length * 0.8);

    const paymentTrend =
      recentOnTime > olderOnTime ? 'IMPROVING' : 'STABLE';

    return {
      totalTransactions,
      onTimePayments,
      latePayments,
      averageDaysToPay,
      lastPaymentDate: trips[0]?.completedAt,
      paymentTrend,
    };
  }

  /**
   * Calculate credit score
   */
  private calculateCreditScore(
    paymentHistory: BrokerTransporterCredit['paymentHistory'],
  ): number {
    if (paymentHistory.totalTransactions === 0) return 50; // Neutral score

    const onTimeRate =
      paymentHistory.onTimePayments / paymentHistory.totalTransactions;
    const baseScore = onTimeRate * 100;

    // Adjust based on payment trend
    let trendAdjustment = 0;
    if (paymentHistory.paymentTrend === 'IMPROVING') trendAdjustment = 10;
    if (paymentHistory.paymentTrend === 'DECLINING') trendAdjustment = -10;

    return Math.min(100, Math.max(0, baseScore + trendAdjustment));
  }

  /**
   * Assess risk
   */
  private assessRisk(
    paymentHistory: BrokerTransporterCredit['paymentHistory'],
    creditScore: number,
  ): BrokerTransporterCredit['riskAssessment'] {
    const riskFactors: string[] = [];
    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (creditScore < 60) {
      overallRisk = 'HIGH';
      riskFactors.push('Low credit score');
    } else if (creditScore < 75) {
      overallRisk = 'MEDIUM';
      riskFactors.push('Moderate credit score');
    }

    if (paymentHistory.paymentTrend === 'DECLINING') {
      riskFactors.push('Declining payment performance');
      if (overallRisk === 'LOW') overallRisk = 'MEDIUM';
    }

    if (paymentHistory.latePayments > paymentHistory.totalTransactions * 0.3) {
      riskFactors.push('High late payment rate');
      overallRisk = 'HIGH';
    }

    const recommendations: string[] = [];
    if (overallRisk === 'HIGH') {
      recommendations.push('Require advance payment');
      recommendations.push('Monitor closely');
    } else if (overallRisk === 'MEDIUM') {
      recommendations.push('Consider shorter payment terms');
    }

    return {
      overallRisk,
      riskFactors,
      recommendations,
      lastAssessedAt: new Date(),
    };
  }

  /**
   * Calculate credit limit
   */
  private calculateCreditLimit(creditScore: number): number {
    // Base limit of 100,000 KES, scaled by credit score
    const baseLimit = 100000;
    return Math.round((baseLimit * creditScore) / 100);
  }

  /**
   * Update payment terms
   */
  async updatePaymentTerms(
    creditId: string,
    brokerId: string,
    paymentTerms: PaymentTermType,
    customDays?: number,
  ): Promise<BrokerTransporterCredit> {
    const credit = await this.creditRepo.findOne({
      where: { id: creditId, brokerId },
    });

    if (!credit) {
      throw new Error('Credit record not found');
    }

    credit.paymentTerms = paymentTerms;
    if (customDays) {
      credit.customPaymentDays = customDays;
    }

    return this.creditRepo.save(credit);
  }

  /**
   * Get credit records for broker
   */
  async getCreditRecords(
    brokerId: string,
    tenantId: string,
  ): Promise<BrokerTransporterCredit[]> {
    return this.creditRepo.find({
      where: { brokerId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get credit record for transporter
   */
  async getTransporterCredit(
    brokerId: string,
    transporterId: string,
    tenantId: string,
  ): Promise<BrokerTransporterCredit | null> {
    return this.creditRepo.findOne({
      where: { brokerId, transporterId, tenantId },
    });
  }
}

