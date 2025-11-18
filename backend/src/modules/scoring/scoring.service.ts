import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  UserScore,
  ScoreCategory,
  ScoreAlgorithm,
} from '../../entities/user-score.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(UserScore)
    private readonly userScoreRepository: Repository<UserScore>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async calculateFinancialHealthScore(userId: string): Promise<UserScore> {
    // Simulate AI calculation for financial health
    const factors = {
      transactionVolume: 850000,
      paymentHistory: 'excellent',
      creditUtilization: 0.35,
      debtToIncomeRatio: 0.28,
      savingsRate: 0.15,
    };

    const score = this.calculateScoreFromFactors(factors, 'financial');
    const normalizedScore = (score / 1000) * 100;

    return await this.createScore(
      userId,
      ScoreCategory.FINANCIAL_HEALTH,
      score,
      normalizedScore,
      ScoreAlgorithm.FINANCIAL_ANALYSIS,
      factors,
      'Strong financial profile with excellent payment history and healthy debt ratios.',
    );
  }

  async calculateTransactionHistoryScore(userId: string): Promise<UserScore> {
    // Simulate AI calculation for transaction history
    const factors = {
      totalTransactions: 45,
      averageTransactionValue: 75000,
      transactionFrequency: 'high',
      disputeRate: 0.02,
      completionRate: 0.98,
      onTimePaymentRate: 0.95,
    };

    const score = this.calculateScoreFromFactors(factors, 'transaction');
    const normalizedScore = (score / 1000) * 100;

    return await this.createScore(
      userId,
      ScoreCategory.TRANSACTION_HISTORY,
      score,
      normalizedScore,
      ScoreAlgorithm.BEHAVIORAL_PATTERN,
      factors,
      'Excellent transaction history with high completion rates and minimal disputes.',
    );
  }

  async calculatePaymentBehaviorScore(userId: string): Promise<UserScore> {
    // Simulate AI calculation for payment behavior
    const factors = {
      onTimePayments: 42,
      latePayments: 2,
      earlyPayments: 8,
      paymentAmounts: 'consistent',
      gracePeriodUsage: 0.05,
      paymentMethodDiversity: 3,
    };

    const score = this.calculateScoreFromFactors(factors, 'payment');
    const normalizedScore = (score / 1000) * 100;

    return await this.createScore(
      userId,
      ScoreCategory.PAYMENT_BEHAVIOR,
      score,
      normalizedScore,
      ScoreAlgorithm.BEHAVIORAL_PATTERN,
      factors,
      'Strong payment behavior with consistent on-time payments and diverse payment methods.',
    );
  }

  async calculateCargoQualityScore(userId: string): Promise<UserScore> {
    // Simulate AI calculation for cargo quality
    const factors = {
      cargoCondition: 'excellent',
      packagingQuality: 'high',
      documentationCompleteness: 0.95,
      insuranceCoverage: 'comprehensive',
      specialHandlingCompliance: 0.98,
      damageClaims: 0.01,
    };

    const score = this.calculateScoreFromFactors(factors, 'cargo');
    const normalizedScore = (score / 1000) * 100;

    return await this.createScore(
      userId,
      ScoreCategory.CARGO_QUALITY,
      score,
      normalizedScore,
      ScoreAlgorithm.RISK_ASSESSMENT,
      factors,
      'Excellent cargo quality with comprehensive insurance and minimal damage claims.',
    );
  }

  async calculateCommunicationScore(userId: string): Promise<UserScore> {
    // Simulate AI calculation for communication
    const factors = {
      responseTime: 'fast',
      messageClarity: 'high',
      documentationQuality: 'excellent',
      issueResolutionSpeed: 'quick',
      feedbackResponsiveness: 0.92,
      proactiveCommunication: 0.88,
    };

    const score = this.calculateScoreFromFactors(factors, 'communication');
    const normalizedScore = (score / 1000) * 100;

    return await this.createScore(
      userId,
      ScoreCategory.COMMUNICATION_SCORE,
      score,
      normalizedScore,
      ScoreAlgorithm.BEHAVIORAL_PATTERN,
      factors,
      'Excellent communication with fast response times and proactive issue resolution.',
    );
  }

  async calculateReliabilityScore(userId: string): Promise<UserScore> {
    // Simulate AI calculation for reliability
    const factors = {
      commitmentFulfillment: 0.96,
      deadlineAdherence: 0.94,
      qualityConsistency: 'high',
      problemSolvingAbility: 'excellent',
      adaptabilityScore: 0.89,
      trustworthiness: 0.97,
    };

    const score = this.calculateScoreFromFactors(factors, 'reliability');
    const normalizedScore = (score / 1000) * 100;

    return await this.createScore(
      userId,
      ScoreCategory.RELIABILITY_SCORE,
      score,
      normalizedScore,
      ScoreAlgorithm.RISK_ASSESSMENT,
      factors,
      'Highly reliable with excellent commitment fulfillment and strong problem-solving abilities.',
    );
  }

  async calculateOverallCreditScore(userId: string): Promise<UserScore> {
    // Get all category scores
    const [
      financialScore,
      transactionScore,
      paymentScore,
      cargoScore,
      communicationScore,
      reliabilityScore,
    ] = await Promise.all([
      this.calculateFinancialHealthScore(userId),
      this.calculateTransactionHistoryScore(userId),
      this.calculatePaymentBehaviorScore(userId),
      this.calculateCargoQualityScore(userId),
      this.calculateCommunicationScore(userId),
      this.calculateReliabilityScore(userId),
    ]);

    // Calculate weighted average for overall score
    const weights = {
      financial: 0.25,
      transaction: 0.2,
      payment: 0.2,
      cargo: 0.15,
      communication: 0.1,
      reliability: 0.1,
    };

    const overallScore =
      financialScore.score * weights.financial +
      transactionScore.score * weights.transaction +
      paymentScore.score * weights.payment +
      cargoScore.score * weights.cargo +
      communicationScore.score * weights.communication +
      reliabilityScore.score * weights.reliability;

    const normalizedOverallScore = (overallScore / 1000) * 100;

    const factors = {
      financialHealth: financialScore.score,
      transactionHistory: transactionScore.score,
      paymentBehavior: paymentScore.score,
      cargoQuality: cargoScore.score,
      communication: communicationScore.score,
      reliability: reliabilityScore.score,
      weights,
    };

    return await this.createScore(
      userId,
      ScoreCategory.OVERALL_CREDIT_SCORE,
      overallScore,
      normalizedOverallScore,
      ScoreAlgorithm.COMPREHENSIVE,
      factors,
      'Comprehensive credit score based on financial health, transaction history, payment behavior, cargo quality, communication, and reliability.',
    );
  }

  async createScore(
    userId: string,
    category: ScoreCategory,
    score: number,
    normalizedScore: number,
    algorithm: ScoreAlgorithm,
    factors: Record<string, any>,
    explanation: string,
    metadata?: Record<string, any>,
  ): Promise<UserScore> {
    // Deactivate previous scores for this category
    await this.userScoreRepository.update(
      { userId, category, isActive: true },
      { isActive: false },
    );

    const userScore = this.userScoreRepository.create({
      userId,
      category,
      score,
      normalizedScore,
      algorithm,
      factors,
      explanation,
      metadata,
      isActive: true,
    });

    return await this.userScoreRepository.save(userScore);
  }

  async getUserScores(
    userId: string,
    category?: ScoreCategory,
  ): Promise<UserScore[]> {
    const query = this.userScoreRepository
      .createQueryBuilder('score')
      .where('score.userId = :userId', { userId });

    if (category) {
      query.andWhere('score.category = :category', { category });
    }

    return await query.orderBy('score.createdAt', 'DESC').getMany();
  }

  async getActiveScores(userId: string): Promise<UserScore[]> {
    return await this.userScoreRepository.find({
      where: { userId, isActive: true },
      order: { category: 'ASC' },
    });
  }

  async getScoreHistory(
    userId: string,
    category: ScoreCategory,
  ): Promise<UserScore[]> {
    return await this.userScoreRepository.find({
      where: { userId, category },
      order: { createdAt: 'DESC' },
    });
  }

  private calculateScoreFromFactors(
    factors: Record<string, any>,
    type: string,
  ): number {
    // Simulate AI scoring algorithm
    let baseScore = 500; // Base score out of 1000

    switch (type) {
      case 'financial':
        baseScore += factors.transactionVolume > 500000 ? 200 : 100;
        baseScore += factors.paymentHistory === 'excellent' ? 150 : 75;
        baseScore += factors.debtToIncomeRatio < 0.4 ? 100 : 50;
        break;

      case 'transaction':
        baseScore += factors.totalTransactions > 30 ? 150 : 75;
        baseScore += factors.completionRate > 0.95 ? 200 : 100;
        baseScore += factors.disputeRate < 0.05 ? 150 : 75;
        break;

      case 'payment':
        baseScore +=
          factors.onTimePayments /
            (factors.onTimePayments + factors.latePayments) >
          0.9
            ? 200
            : 100;
        baseScore += factors.paymentMethodDiversity > 2 ? 100 : 50;
        break;

      case 'cargo':
        baseScore += factors.cargoCondition === 'excellent' ? 200 : 100;
        baseScore += factors.damageClaims < 0.05 ? 200 : 100;
        baseScore += factors.insuranceCoverage === 'comprehensive' ? 150 : 75;
        break;

      case 'communication':
        baseScore += factors.responseTime === 'fast' ? 150 : 75;
        baseScore += factors.feedbackResponsiveness > 0.9 ? 150 : 75;
        baseScore += factors.proactiveCommunication > 0.8 ? 100 : 50;
        break;

      case 'reliability':
        baseScore += factors.commitmentFulfillment > 0.9 ? 200 : 100;
        baseScore += factors.trustworthiness > 0.9 ? 200 : 100;
        baseScore += factors.adaptabilityScore > 0.8 ? 100 : 50;
        break;
    }

    return Math.min(Math.max(baseScore, 0), 1000); // Ensure score is between 0 and 1000
  }
}
