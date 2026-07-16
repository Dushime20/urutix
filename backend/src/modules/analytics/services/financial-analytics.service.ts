import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditTransaction } from '../../../entities/credit-transaction.entity';
import { Trip } from '../../../entities/trip.entity';
import { Load } from '../../../entities/load.entity';
import {
  CostFiltersDto,
  ProfitabilityFiltersDto,
  CostTrendsResponseDto,
  ProfitabilityAnalysisResponseDto,
  RouteSpecDto,
  PricingRecommendationDto,
  FinancialSummaryDto,
  TimeRange,
  GroupBy,
} from '../dto/financial-analytics.dto';

@Injectable()
export class FinancialAnalyticsService {
  constructor(
    @InjectRepository(CreditTransaction)
    private creditTransactionRepository: Repository<CreditTransaction>,
    @InjectRepository(Trip)
    private tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private loadRepository: Repository<Load>,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────

  private buildDateRange(timeRange?: TimeRange, customRange?: { startDate: string; endDate: string }) {
    if (timeRange === TimeRange.CUSTOM && customRange) {
      return { start: new Date(customRange.startDate), end: new Date(customRange.endDate) };
    }
    const now = new Date();
    const days: Record<string, number> = {
      [TimeRange.LAST_7_DAYS]: 7,
      [TimeRange.LAST_30_DAYS]: 30,
      [TimeRange.LAST_90_DAYS]: 90,
      [TimeRange.LAST_6_MONTHS]: 180,
      [TimeRange.LAST_YEAR]: 365,
    };
    const d = days[timeRange || TimeRange.LAST_30_DAYS] || 30;
    return { start: new Date(now.getTime() - d * 86400000), end: now };
  }

  private calculatePreviousPeriod(dateRange: { start: Date; end: Date }) {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return { start: new Date(dateRange.start.getTime() - duration), end: dateRange.start };
  }

  private determineTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
    const pct = previous > 0 ? Math.abs((current - previous) / previous) * 100 : 0;
    if (pct < 5) return 'stable';
    return current > previous ? 'increasing' : 'decreasing';
  }

  private mapTrendToEfficiency(t: 'increasing' | 'decreasing' | 'stable'): 'stable' | 'improving' | 'declining' {
    if (t === 'decreasing') return 'improving';
    if (t === 'increasing') return 'declining';
    return 'stable';
  }

  // ── Core queries against real tables ─────────────────────────────────────

  private scopeToCargoOwner(role?: string): boolean {
    return String(role || '').toUpperCase() === 'CARGO_OWNER';
  }

  private async getTripsInRange(
    tenantId: string,
    dateRange: { start: Date; end: Date },
    cargoOwnerId?: string,
  ) {
    const qb = this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.load', 'load')
      .leftJoinAndSelect('trip.pickupLocation', 'pickup')
      .leftJoinAndSelect('trip.deliveryLocation', 'delivery')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.plannedStartTime BETWEEN :start AND :end', dateRange);

    if (cargoOwnerId) {
      qb.andWhere('load.cargoOwnerId = :cargoOwnerId', { cargoOwnerId });
    }

    return qb.getMany();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async getCostTrends(
    tenantId: string,
    cargoOwnerId: string,
    filters: CostFiltersDto,
    role?: string,
  ): Promise<CostTrendsResponseDto> {
    const dateRange = this.buildDateRange(filters.timeRange, filters.dateRange);
    const ownerFilter = this.scopeToCargoOwner(role) ? cargoOwnerId : undefined;
    const trips = await this.getTripsInRange(tenantId, dateRange, ownerFilter);

    // Group by time bucket
    const groupBy = filters.groupBy || GroupBy.WEEK;
    const bucketMs: Record<GroupBy, number> = {
      [GroupBy.DAY]: 86400000,
      [GroupBy.WEEK]: 7 * 86400000,
      [GroupBy.MONTH]: 30 * 86400000,
      [GroupBy.QUARTER]: 90 * 86400000,
      [GroupBy.YEAR]: 365 * 86400000,
    };
    const bucket = bucketMs[groupBy] || bucketMs[GroupBy.WEEK];

    const bucketMap = new Map<string, { totalCost: number; count: number }>();
    for (const trip of trips) {
      const ts = new Date(trip.plannedStartTime);
      const key = new Date(Math.floor(ts.getTime() / bucket) * bucket).toISOString().slice(0, 10);
      const cost = Number(trip.agreedPrice || 0);
      const existing = bucketMap.get(key) || { totalCost: 0, count: 0 };
      bucketMap.set(key, { totalCost: existing.totalCost + cost, count: existing.count + 1 });
    }

    const trends = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        totalCost: v.totalCost,
        averageCost: v.count > 0 ? v.totalCost / v.count : 0,
        shipmentCount: v.count,
        costPerKm: 0,
        costPerKg: 0,
      }));

    const totalCost = trips.reduce((s, t) => s + Number(t.agreedPrice || 0), 0);
    const prevRange = this.calculatePreviousPeriod(dateRange);
    const prevTrips = await this.getTripsInRange(tenantId, prevRange, ownerFilter);
    const prevTotal = prevTrips.reduce((s, t) => s + Number(t.agreedPrice || 0), 0);

    return {
      trends,
      totalCost,
      averageCostPerShipment: trips.length > 0 ? totalCost / trips.length : 0,
      totalShipments: trips.length,
      costChangePercentage: prevTotal > 0 ? ((totalCost - prevTotal) / prevTotal) * 100 : 0,
      comparisonPeriod: 'Previous Period',
    };
  }

  async getShipmentProfitability(
    tenantId: string,
    cargoOwnerId: string,
    filters: ProfitabilityFiltersDto,
    role?: string,
  ): Promise<ProfitabilityAnalysisResponseDto> {
    const dateRange = this.buildDateRange(filters.timeRange, filters.dateRange);
    const ownerFilter = this.scopeToCargoOwner(role) ? cargoOwnerId : undefined;
    const trips = await this.getTripsInRange(tenantId, dateRange, ownerFilter);

    const shipments = trips.map(trip => {
      const revenue = Number(trip.load?.loadValue || trip.agreedPrice || 0);
      const cost = Number(trip.totalCost || trip.agreedPrice || 0);
      const profit = revenue - cost;
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const pickupCity = (trip as any).pickupLocation?.city || '';
      const deliveryCity = (trip as any).deliveryLocation?.city || '';
      return {
        loadId: trip.loadId,
        route: `${pickupCity || 'Origin'} → ${deliveryCity || 'Destination'}`,
        totalCost: cost,
        revenue,
        profitMargin,
        cargoWeightKg: Number(trip.load?.weight || 0),
        costPerKg: 0,
        distanceKm: Number(trip.totalDistance || 0),
        costPerKm: 0,
        bookingDate: trip.plannedStartTime,
        deliveryStatus: trip.status,
      };
    });

    const profitable = shipments.filter(s => s.profitMargin > 0).length;
    const avgMargin = shipments.length > 0
      ? shipments.reduce((s, x) => s + x.profitMargin, 0) / shipments.length
      : 0;

    const routeMap = new Map<string, number[]>();
    shipments.forEach(s => {
      if (!routeMap.has(s.route)) routeMap.set(s.route, []);
      routeMap.get(s.route)!.push(s.profitMargin);
    });
    const routeAvgs = Array.from(routeMap.entries())
      .map(([route, margins]) => ({ route, avg: margins.reduce((a, b) => a + b, 0) / margins.length }))
      .sort((a, b) => b.avg - a.avg);

    return {
      shipments,
      averageProfitMargin: avgMargin,
      mostProfitableRoute: routeAvgs[0]?.route,
      leastProfitableRoute: routeAvgs[routeAvgs.length - 1]?.route,
      profitableShipments: profitable,
      unprofitableShipments: shipments.length - profitable,
      trend: 'stable',
    };
  }

  async getPricingRecommendations(
    tenantId: string,
    routeSpec: RouteSpecDto,
  ): Promise<PricingRecommendationDto> {
    const trips = await this.tripRepository
      .createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.plannedStartTime >= :since', { since: new Date(Date.now() - 90 * 86400000) })
      .getMany();

    const prices = trips.map(t => Number(t.agreedPrice || 0)).filter(p => p > 0);
    const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const recommended = Math.round(avg * 1.1 * 100) / 100;

    return {
      currentPrice: avg,
      recommendedPrice: recommended,
      potentialSavings: 0,
      confidence: prices.length >= 10 ? 0.8 : prices.length >= 5 ? 0.6 : 0.3,
      reasoning: prices.length < 3
        ? 'Limited data. Based on current market estimates.'
        : `Based on ${prices.length} historical trips in this tenant.`,
      alternatives: [
        { option: 'Budget Option', price: recommended * 0.9, savings: recommended * 0.1, tradeoffs: ['Longer transit'] },
        { option: 'Premium Option', price: recommended * 1.1, savings: 0, tradeoffs: ['Faster delivery'] },
      ],
      marketFactors: ['Fuel price variations', 'Seasonal demand'],
    };
  }

  async getFinancialSummary(
    tenantId: string,
    cargoOwnerId: string,
    filters: CostFiltersDto,
    role?: string,
  ): Promise<FinancialSummaryDto> {
    const dateRange = this.buildDateRange(filters.timeRange, filters.dateRange);
    const prevRange = this.calculatePreviousPeriod(dateRange);
    const ownerFilter = this.scopeToCargoOwner(role) ? cargoOwnerId : undefined;

    const [trips, prevTrips] = await Promise.all([
      this.getTripsInRange(tenantId, dateRange, ownerFilter),
      this.getTripsInRange(tenantId, prevRange, ownerFilter),
    ]);

    const totalSpending = trips.reduce((s, t) => s + Number(t.agreedPrice || 0), 0);
    const prevSpending = prevTrips.reduce((s, t) => s + Number(t.agreedPrice || 0), 0);
    const avgCost = trips.length > 0 ? totalSpending / trips.length : 0;

    // Group by cargo type for top categories
    const catMap = new Map<string, number>();
    trips.forEach(t => {
      const cat = t.load?.cargoType || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + Number(t.agreedPrice || 0));
    });
    const topCategories = Array.from(catMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
      }));

    return {
      totalSpending,
      averageCostPerShipment: avgCost,
      averageCostPerKg: 0,
      averageCostPerKm: 0,
      spendingChange: {
        amount: totalSpending - prevSpending,
        percentage: prevSpending > 0 ? ((totalSpending - prevSpending) / prevSpending) * 100 : 0,
        trend: this.determineTrend(totalSpending, prevSpending),
      },
      topCategories,
      efficiency: {
        costPerKgTrend: 'stable',
        costPerKmTrend: 'stable',
        overallEfficiency: 50,
      },
    };
  }
}
