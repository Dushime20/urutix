import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentType,
} from '../../../entities/payment.entity';

export interface PaymentTrend {
  period: string;
  totalAmount: number;
  totalCount: number;
  successRate: number;
  averageAmount: number;
  growthRate: number;
}

export interface PaymentInsight {
  type: 'trend' | 'anomaly' | 'recommendation' | 'risk';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  data: any;
  timestamp: Date;
}

export interface PaymentPrediction {
  period: string;
  predictedAmount: number;
  predictedCount: number;
  confidence: number;
  factors: string[];
}

@Injectable()
export class PaymentAnalyticsService {
  private readonly logger = new Logger(PaymentAnalyticsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Get comprehensive payment analytics
   */
  async getComprehensiveAnalytics(
    tenantId: string,
    period: string = '30d',
    userId?: string,
  ): Promise<any> {
    try {
      const dateRange = this.getDateRange(period);

      const [
        basicStats,
        trends,
        insights,
        predictions,
        riskAnalysis,
        performanceMetrics,
      ] = await Promise.all([
        this.getBasicStats(tenantId, dateRange, userId),
        this.getPaymentTrends(tenantId, dateRange, userId),
        this.generateInsights(tenantId, dateRange, userId),
        this.getPredictions(tenantId, period, userId),
        this.analyzeRisk(tenantId, dateRange, userId),
        this.getPerformanceMetrics(tenantId, dateRange, userId),
      ]);

      return {
        period,
        dateRange,
        basicStats,
        trends,
        insights,
        predictions,
        riskAnalysis,
        performanceMetrics,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generating comprehensive analytics:', error);
      throw error;
    }
  }

  /**
   * Get basic payment statistics
   */
  async getBasicStats(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    userId?: string,
  ): Promise<any> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :start AND :end', dateRange);

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    const payments = await query.getMany();

    const totalPayments = payments.length;
    const completedPayments = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    ).length;
    const pendingPayments = payments.filter(
      (p) => p.status === PaymentStatus.PENDING,
    ).length;
    const failedPayments = payments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    ).length;
    const escrowPayments = payments.filter(
      (p) => p.status === PaymentStatus.ESCROW,
    ).length;

    const totalAmount = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalProcessingFees = payments
      .filter((p) => p.status === PaymentStatus.COMPLETED && p.processingFee)
      .reduce((sum, p) => sum + Number(p.processingFee), 0);

    const successRate =
      totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
    const averageAmount =
      completedPayments > 0 ? totalAmount / completedPayments : 0;

    // Payment method breakdown
    const paymentMethods = this.groupByField(payments, 'paymentMethod');
    const paymentTypes = this.groupByField(payments, 'paymentType');

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      escrowPayments,
      successRate: Math.round(successRate * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalProcessingFees: Math.round(totalProcessingFees * 100) / 100,
      averageAmount: Math.round(averageAmount * 100) / 100,
      paymentMethods,
      paymentTypes,
    };
  }

  /**
   * Get payment trends over time
   */
  async getPaymentTrends(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    userId?: string,
  ): Promise<PaymentTrend[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'DATE(payment.createdAt) as date',
        'SUM(CASE WHEN payment.status = :completed THEN payment.amount ELSE 0 END) as totalAmount',
        'COUNT(*) as totalCount',
        'COUNT(CASE WHEN payment.status = :completed THEN 1 END) as completedCount',
      ])
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :start AND :end', dateRange)
      .setParameter('completed', PaymentStatus.COMPLETED)
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC');

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    const results = await query.getRawMany();

    return results.map((result, index) => {
      const successRate =
        result.totalCount > 0
          ? (result.completedCount / result.totalCount) * 100
          : 0;
      const averageAmount =
        result.completedCount > 0
          ? result.totalAmount / result.completedCount
          : 0;

      // Calculate growth rate
      const growthRate =
        index > 0
          ? ((result.totalAmount - results[index - 1].totalAmount) /
              results[index - 1].totalAmount) *
            100
          : 0;

      return {
        period: result.date,
        totalAmount: Math.round(result.totalAmount * 100) / 100,
        totalCount: parseInt(result.totalCount),
        successRate: Math.round(successRate * 100) / 100,
        averageAmount: Math.round(averageAmount * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100,
      };
    });
  }

  /**
   * Generate payment insights using ML-like analysis
   */
  async generateInsights(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    userId?: string,
  ): Promise<PaymentInsight[]> {
    const insights: PaymentInsight[] = [];

    try {
      const payments = await this.getPaymentsInRange(
        tenantId,
        dateRange,
        userId,
      );
      const trends = await this.getPaymentTrends(tenantId, dateRange, userId);

      // Analyze success rate trends
      const successRateInsight = this.analyzeSuccessRateTrend(payments, trends);
      if (successRateInsight) insights.push(successRateInsight);

      // Analyze payment method preferences
      const methodInsight = this.analyzePaymentMethodPreferences(payments);
      if (methodInsight) insights.push(methodInsight);

      // Detect anomalies
      const anomalyInsights = this.detectAnomalies(payments, trends);
      insights.push(...anomalyInsights);

      // Generate recommendations
      const recommendations = this.generateRecommendations(payments, trends);
      insights.push(...recommendations);

      return insights;
    } catch (error) {
      this.logger.error('Error generating insights:', error);
      return [];
    }
  }

  /**
   * Get payment predictions using trend analysis
   */
  async getPredictions(
    tenantId: string,
    period: string,
    userId?: string,
  ): Promise<PaymentPrediction[]> {
    try {
      const dateRange = this.getDateRange(period);
      const trends = await this.getPaymentTrends(tenantId, dateRange, userId);

      if (trends.length < 3) {
        return [];
      }

      // Simple linear regression for prediction
      const predictions: PaymentPrediction[] = [];
      const periods = ['7d', '14d', '30d'];

      for (const futurePeriod of periods) {
        const prediction = this.calculatePrediction(trends, futurePeriod);
        if (prediction) {
          predictions.push(prediction);
        }
      }

      return predictions;
    } catch (error) {
      this.logger.error('Error generating predictions:', error);
      return [];
    }
  }

  /**
   * Analyze payment risk factors
   */
  async analyzeRisk(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    userId?: string,
  ): Promise<any> {
    try {
      const payments = await this.getPaymentsInRange(
        tenantId,
        dateRange,
        userId,
      );

      const riskFactors = {
        highValuePayments: payments.filter((p) => Number(p.amount) > 1000)
          .length,
        failedPayments: payments.filter(
          (p) => p.status === PaymentStatus.FAILED,
        ).length,
        pendingPayments: payments.filter(
          (p) => p.status === PaymentStatus.PENDING,
        ).length,
        escrowPayments: payments.filter(
          (p) => p.status === PaymentStatus.ESCROW,
        ).length,
        averageProcessingTime: this.calculateAverageProcessingTime(payments),
        fraudRiskScore: this.calculateFraudRiskScore(payments),
        chargebackRisk: this.calculateChargebackRisk(payments),
      };

      const overallRiskScore = this.calculateOverallRiskScore(riskFactors);

      return {
        riskFactors,
        overallRiskScore,
        riskLevel: this.getRiskLevel(overallRiskScore),
        recommendations: this.getRiskRecommendations(riskFactors),
      };
    } catch (error) {
      this.logger.error('Error analyzing risk:', error);
      return null;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    userId?: string,
  ): Promise<any> {
    try {
      const payments = await this.getPaymentsInRange(
        tenantId,
        dateRange,
        userId,
      );

      return {
        averageProcessingTime: this.calculateAverageProcessingTime(payments),
        peakHours: this.analyzePeakHours(payments),
        providerPerformance: this.analyzeProviderPerformance(payments),
        userBehavior: this.analyzeUserBehavior(payments),
        systemPerformance: this.analyzeSystemPerformance(payments),
      };
    } catch (error) {
      this.logger.error('Error calculating performance metrics:', error);
      return null;
    }
  }

  /**
   * Helper methods
   */
  public getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '1d':
        start.setDate(end.getDate() - 1);
        break;
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }

    return { start, end };
  }

  private async getPaymentsInRange(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    userId?: string,
  ): Promise<Payment[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .where('payment.tenantId = :tenantId', { tenantId })
      .andWhere('payment.createdAt BETWEEN :start AND :end', dateRange);

    if (userId) {
      query.andWhere('payment.payerId = :userId', { userId });
    }

    return query.getMany();
  }

  private groupByField(
    payments: Payment[],
    field: string,
  ): Record<string, number> {
    return payments.reduce(
      (acc, payment) => {
        const value = payment[field];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private analyzeSuccessRateTrend(
    payments: Payment[],
    trends: PaymentTrend[],
  ): PaymentInsight | null {
    if (trends.length < 2) return null;

    const recentTrends = trends.slice(-3);
    const avgSuccessRate =
      recentTrends.reduce((sum, t) => sum + t.successRate, 0) /
      recentTrends.length;

    if (avgSuccessRate < 80) {
      return {
        type: 'trend',
        title: 'Low Success Rate Detected',
        description: `Average success rate is ${avgSuccessRate.toFixed(1)}%, which is below the recommended 80% threshold.`,
        severity: 'high',
        confidence: 0.85,
        data: { averageSuccessRate: avgSuccessRate },
        timestamp: new Date(),
      };
    }

    return null;
  }

  private analyzePaymentMethodPreferences(
    payments: Payment[],
  ): PaymentInsight | null {
    const methodCounts = this.groupByField(payments, 'paymentMethod');
    const totalPayments = payments.length;

    if (totalPayments === 0) return null;

    const mostPopular = Object.entries(methodCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];

    const percentage = (mostPopular[1] / totalPayments) * 100;

    return {
      type: 'trend',
      title: 'Payment Method Preference',
      description: `${mostPopular[0]} is the most popular payment method with ${percentage.toFixed(1)}% usage.`,
      severity: 'low',
      confidence: 0.95,
      data: { method: mostPopular[0], percentage, totalPayments },
      timestamp: new Date(),
    };
  }

  private detectAnomalies(
    payments: Payment[],
    trends: PaymentTrend[],
  ): PaymentInsight[] {
    const insights: PaymentInsight[] = [];

    // Detect unusual payment amounts
    const amounts = payments.map((p) => Number(p.amount));
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) /
        amounts.length,
    );

    const anomalies = payments.filter((p) => {
      const amount = Number(p.amount);
      return Math.abs(amount - avgAmount) > 2 * stdDev;
    });

    if (anomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        title: 'Unusual Payment Amounts Detected',
        description: `${anomalies.length} payments have amounts significantly different from the average.`,
        severity: 'medium',
        confidence: 0.8,
        data: { anomalies: anomalies.length, averageAmount: avgAmount },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  private generateRecommendations(
    payments: Payment[],
    trends: PaymentTrend[],
  ): PaymentInsight[] {
    const recommendations: PaymentInsight[] = [];

    // Analyze success rate
    const successRate =
      payments.filter((p) => p.status === PaymentStatus.COMPLETED).length /
      payments.length;

    if (successRate < 0.9) {
      recommendations.push({
        type: 'recommendation',
        title: 'Improve Payment Success Rate',
        description:
          'Consider reviewing failed payment reasons and optimizing the payment flow.',
        severity: 'medium',
        confidence: 0.75,
        data: { currentSuccessRate: successRate },
        timestamp: new Date(),
      });
    }

    // Analyze payment method diversity
    const methodCounts = this.groupByField(payments, 'paymentMethod');
    if (Object.keys(methodCounts).length < 2) {
      recommendations.push({
        type: 'recommendation',
        title: 'Diversify Payment Methods',
        description:
          'Consider adding more payment methods to improve user experience.',
        severity: 'low',
        confidence: 0.7,
        data: { currentMethods: Object.keys(methodCounts) },
        timestamp: new Date(),
      });
    }

    return recommendations;
  }

  private calculatePrediction(
    trends: PaymentTrend[],
    period: string,
  ): PaymentPrediction | null {
    if (trends.length < 3) return null;

    // Simple linear regression
    const n = trends.length;
    const xValues = trends.map((_, i) => i);
    const yValues = trends.map((t) => t.totalAmount);

    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const futureX = n + this.getPeriodDays(period);
    const predictedAmount = slope * futureX + intercept;

    return {
      period,
      predictedAmount: Math.max(0, Math.round(predictedAmount * 100) / 100),
      predictedCount: Math.round(trends[trends.length - 1].totalCount * 1.1), // Simple growth assumption
      confidence: 0.7,
      factors: ['historical_trends', 'seasonal_patterns', 'growth_rate'],
    };
  }

  private getPeriodDays(period: string): number {
    const daysMap = { '7d': 7, '14d': 14, '30d': 30 };
    return daysMap[period] || 7;
  }

  private calculateAverageProcessingTime(payments: Payment[]): number {
    const completedPayments = payments.filter(
      (p) =>
        p.status === PaymentStatus.COMPLETED && p.processedAt && p.createdAt,
    );

    if (completedPayments.length === 0) return 0;

    const totalTime = completedPayments.reduce((sum, p) => {
      const processingTime = p.processedAt
        ? p.processedAt.getTime() - p.createdAt.getTime()
        : 0;
      return sum + processingTime;
    }, 0);

    return Math.round(totalTime / completedPayments.length / 1000 / 60); // Convert to minutes
  }

  private calculateFraudRiskScore(payments: Payment[]): number {
    // Simple fraud risk calculation
    const highValuePayments = payments.filter(
      (p) => Number(p.amount) > 1000,
    ).length;
    const failedPayments = payments.filter(
      (p) => p.status === PaymentStatus.FAILED,
    ).length;
    const totalPayments = payments.length;

    if (totalPayments === 0) return 0;

    const riskScore =
      ((highValuePayments * 0.3 + failedPayments * 0.7) / totalPayments) * 100;
    return Math.min(100, Math.round(riskScore));
  }

  private calculateChargebackRisk(payments: Payment[]): number {
    // Simplified chargeback risk calculation
    const completedPayments = payments.filter(
      (p) => p.status === PaymentStatus.COMPLETED,
    ).length;
    const totalPayments = payments.length;

    if (totalPayments === 0) return 0;

    // Assume 1% chargeback rate for completed payments
    return Math.round(((completedPayments * 0.01) / totalPayments) * 100);
  }

  private calculateOverallRiskScore(riskFactors: any): number {
    const weights = {
      highValuePayments: 0.2,
      failedPayments: 0.3,
      pendingPayments: 0.1,
      escrowPayments: 0.1,
      averageProcessingTime: 0.1,
      fraudRiskScore: 0.15,
      chargebackRisk: 0.05,
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [factor, weight] of Object.entries(weights)) {
      if (riskFactors[factor] !== undefined) {
        totalScore += riskFactors[factor] * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  private getRiskLevel(score: number): string {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }

  private getRiskRecommendations(riskFactors: any): string[] {
    const recommendations: string[] = [];

    if (riskFactors.failedPayments > 10) {
      recommendations.push(
        'Review failed payment reasons and optimize payment flow',
      );
    }

    if (riskFactors.fraudRiskScore > 50) {
      recommendations.push('Implement additional fraud detection measures');
    }

    if (riskFactors.averageProcessingTime > 30) {
      recommendations.push('Optimize payment processing pipeline');
    }

    return recommendations;
  }

  private analyzePeakHours(payments: Payment[]): any {
    const hourCounts = new Array(24).fill(0);

    payments.forEach((payment) => {
      const hour = payment.createdAt.getHours();
      hourCounts[hour]++;
    });

    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    return {
      peakHour,
      peakHourCount: hourCounts[peakHour],
      hourlyDistribution: hourCounts,
    };
  }

  private analyzeProviderPerformance(payments: Payment[]): any {
    const providerStats: Record<string, any> = {};

    payments.forEach((payment) => {
      const method = payment.paymentMethod;
      if (!providerStats[method]) {
        providerStats[method] = {
          total: 0,
          completed: 0,
          failed: 0,
          totalAmount: 0,
        };
      }

      providerStats[method].total++;
      providerStats[method].totalAmount += Number(payment.amount);

      if (payment.status === PaymentStatus.COMPLETED) {
        providerStats[method].completed++;
      } else if (payment.status === PaymentStatus.FAILED) {
        providerStats[method].failed++;
      }
    });

    // Calculate success rates
    Object.keys(providerStats).forEach((method) => {
      const stats = providerStats[method];
      stats.successRate =
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      stats.averageAmount =
        stats.completed > 0 ? stats.totalAmount / stats.completed : 0;
    });

    return providerStats;
  }

  private analyzeUserBehavior(payments: Payment[]): any {
    const userStats: Record<string, any> = {};

    payments.forEach((payment) => {
      const userId = payment.payerId;
      if (!userStats[userId]) {
        userStats[userId] = {
          totalPayments: 0,
          totalAmount: 0,
          averageAmount: 0,
          preferredMethod: '',
          lastPayment: null,
        };
      }

      userStats[userId].totalPayments++;
      userStats[userId].totalAmount += Number(payment.amount);

      if (
        !userStats[userId].lastPayment ||
        payment.createdAt > userStats[userId].lastPayment
      ) {
        userStats[userId].lastPayment = payment.createdAt;
      }
    });

    // Calculate averages and preferences
    Object.keys(userStats).forEach((userId) => {
      const stats = userStats[userId];
      stats.averageAmount = stats.totalAmount / stats.totalPayments;

      // Find preferred payment method
      const userPayments = payments.filter((p) => p.payerId === userId);
      const methodCounts = this.groupByField(userPayments, 'paymentMethod');
      stats.preferredMethod =
        Object.entries(methodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        '';
    });

    return userStats;
  }

  private analyzeSystemPerformance(payments: Payment[]): any {
    const processingTimes = payments
      .filter(
        (p) =>
          p.status === PaymentStatus.COMPLETED && p.processedAt && p.createdAt,
      )
      .map((p) =>
        p.processedAt ? p.processedAt.getTime() - p.createdAt.getTime() : 0,
      );

    return {
      averageProcessingTime:
        processingTimes.length > 0
          ? processingTimes.reduce((sum, time) => sum + time, 0) /
            processingTimes.length
          : 0,
      minProcessingTime:
        processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
      maxProcessingTime:
        processingTimes.length > 0 ? Math.max(...processingTimes) : 0,
      totalProcessed: processingTimes.length,
    };
  }
}
