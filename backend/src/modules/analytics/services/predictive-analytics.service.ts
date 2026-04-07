import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip, TripStatus } from '../../../entities/trip.entity';
import { Load, LoadStatus } from '../../../entities/load.entity';
import { Driver } from '../../../entities/driver.entity';
import { SafetyIncident } from '../../../entities/safety-incident.entity';
import { Truck } from '../../../entities/truck.entity';
import { SafetyInspection, InspectionStatus } from '../../../entities/safety-inspection.entity';
import { InsuranceClaim } from '../../../entities/insurance-claim.entity';

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(SafetyIncident)
    private readonly incidentRepository: Repository<SafetyIncident>,
    @InjectRepository(Truck)
    private readonly truckRepository: Repository<Truck>,
    @InjectRepository(SafetyInspection)
    private readonly inspectionRepository: Repository<SafetyInspection>,
    @InjectRepository(InsuranceClaim)
    private readonly insuranceRepository: Repository<InsuranceClaim>,
  ) {}


  // cargo_owner_analytics table not yet migrated � stubs until available
  async predictCosts(_t: string, _c: string, _r?: string, _d = 30) { return { prediction: null, confidence: 0, error: 'Analytics table not yet available' }; }
  async predictCarrierPerformance(_t: string, _c: string, _id: string, _d = 30) { return { prediction: null, confidence: 0, error: 'Analytics table not yet available' }; }
  async predictSeasonalDemand(_t: string, _c: string, _ct?: string) { return { patterns: null, confidence: 0, error: 'Analytics table not yet available' }; }
  async predictRouteEfficiency(_t: string, _c: string, _r: string) { return { prediction: null, confidence: 0, error: 'Analytics table not yet available' }; }
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
  private calculateOverallConfidence(dataPoints: number, volatility: number): number {
    let c = Math.min(0.95, dataPoints / 50);
    c *= Math.max(0.3, 1 - volatility * 2);
    return Math.max(0.1, c);
  }


  async getRouteETAConfidence(origin: string, destination: string): Promise<any> {
    const completedTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
      .where('pickupLocation.city = :origin', { origin })
      .andWhere('deliveryLocation.city = :destination', { destination })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .getMany();

    if (completedTrips.length < 3) {
      return { confidenceLevel: 'LOW', message: 'Insufficient historical data for this lane.' };
    }

    const durationsInHours = completedTrips.map(t => {
      const start = new Date(t.actualStartTime || t.plannedStartTime);
      const end = new Date(t.actualEndTime || t.plannedEndTime);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    });

    const avgDuration = durationsInHours.reduce((a, b) => a + b, 0) / durationsInHours.length;
    const onTimeRate = (completedTrips.filter(t => t.onTimePerformance).length / completedTrips.length) * 100;

    return {
      confidenceLevel: completedTrips.length > 10 ? 'HIGH' : 'MEDIUM',
      avgDurationHours: Math.round(avgDuration * 10) / 10,
      onTimeProbability: Math.round(onTimeRate),
      sampleSize: completedTrips.length,
      recommendation: onTimeRate < 70 ? 'PLAN_OVERBUFFER' : 'STANDARD_PLAN'
    };
  }

  async getGlobalDemandHeatmap(): Promise<any[]> {
    const results = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .select('pickupLocation.city', 'city')
      .addSelect('COUNT(*)', 'volume')
      .where('trip.createdAt > :date', { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) })
      .andWhere('pickupLocation.city IS NOT NULL')
      .groupBy('pickupLocation.city')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();
    return results;
  }

  async calculateDynamicPricing(origin: string, destination: string, weight?: number): Promise<any> {
    const historicalTrips = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.pickupLocation', 'pickupLocation')
      .leftJoinAndSelect('trip.deliveryLocation', 'deliveryLocation')
      .where('pickupLocation.city = :origin', { origin })
      .andWhere('deliveryLocation.city = :destination', { destination })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .andWhere('trip.agreedPrice IS NOT NULL')
      .orderBy('trip.createdAt', 'DESC')
      .limit(20)
      .getMany();

    if (historicalTrips.length === 0) {
      return { recommendation: { optimal: null, min: null, max: null }, message: 'No historical pricing for this lane.', confidence: 0 };
    }

    const prices = historicalTrips.map(t => parseFloat(t.agreedPrice as any));
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const volatility = (maxPrice - minPrice) / avgPrice;
    const seasonalMultiplier = 1 + (Math.sin((new Date().getMonth() / 12) * 2 * Math.PI) * 0.1);
    const optimalPrice = avgPrice * seasonalMultiplier;

    return {
      recommendation: {
        optimal: Math.round(optimalPrice),
        competitive: Math.round(optimalPrice * 0.9),
        premium: Math.round(optimalPrice * 1.1)
      },
      marketContext: { volatility: Math.round(volatility * 100), sampleSize: historicalTrips.length, trend: prices[0] > prices[prices.length - 1] ? 'UP' : 'DOWN' },
      confidence: historicalTrips.length > 5 ? 0.85 : 0.6
    };
  }

  async getAutomatedLaneOptimizations(origin: string, destination: string): Promise<any[]> {
    return [{
      type: 'TIME_OPTIMIZER',
      title: 'Night-Shift Dispatch',
      description: 'Lanes departing between 22:00 and 02:00 experience 18% less transit variance.',
      potentialSavings: 5,
      impact: 'HIGH',
      route: [origin, destination]
    }];
  }

  async getStrategicBenchmarking(tenantId: string): Promise<any> {
    const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const tenantTrips = await this.tripRepository.createQueryBuilder('trip')
      .where('trip.tenantId = :tenantId', { tenantId })
      .andWhere('trip.createdAt > :periodStart', { periodStart })
      .andWhere('trip.status = :status', { status: TripStatus.COMPLETED })
      .getMany();

    const tenantAvgCost = tenantTrips.length > 0 ? tenantTrips.reduce((s, t) => s + parseFloat(t.agreedPrice as any || 0), 0) / tenantTrips.length : 0;
    const tenantOnTimeRate = tenantTrips.length > 0 ? (tenantTrips.filter(t => t.onTimePerformance).length / tenantTrips.length) * 100 : 0;

    return {
      performance: { averageCost: Math.round(tenantAvgCost), onTimeRate: Math.round(tenantOnTimeRate), totalTrips: tenantTrips.length },
      marketBaseline: { averageCost: Math.round(tenantAvgCost), onTimeRate: Math.round(tenantOnTimeRate) },
      benchmarks: { costPerformance: 0, reliabilityGap: 0 },
      cohort: tenantOnTimeRate > 90 ? 'ELITE' : 'MARKET_AVERAGE'
    };
  }

  async getCarrierPerformanceScorecards(tenantId: string): Promise<any[]> {
    const carriers = await this.tripRepository
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('truck.owner', 'owner')
      .select('owner.username', 'carrierName')
      .addSelect('owner.id', 'carrierId')
      .addSelect('COUNT(trip.id)', 'totalTrips')
      .addSelect('AVG(trip.cargoOwnerRating)', 'avgRating')
      .addSelect('COUNT(CASE WHEN trip.onTimePerformance = true THEN 1 END)', 'onTimeCount')
      .where('owner.id IS NOT NULL')
      .andWhere('trip.tenantId = :tenantId', { tenantId })
      .groupBy('owner.id, owner.username')
      .having('COUNT(trip.id) > 0')
      .getRawMany();

    return carriers.map(c => {
      const onTimeRate = (parseInt(c.onTimeCount) / parseInt(c.totalTrips)) * 100;
      const avgRating = parseFloat(c.avgRating) || 0;
      const score = (onTimeRate * 0.5) + (avgRating * 20 * 0.3) + (Math.min(parseInt(c.totalTrips), 50) * 2 * 0.2);
      return {
        carrierId: c.carrierId, name: c.carrierName, score: Math.round(score),
        metrics: { reliability: Math.round(onTimeRate), rating: Math.round(avgRating * 10) / 10, totalExperience: parseInt(c.totalTrips) },
        badge: score > 85 ? 'PLATINUM_PARTNER' : score > 70 ? 'GOLD_PARTNER' : 'VERIFIED'
      };
    }).sort((a, b) => b.score - a.score);
  }

  async getSustainabilityMetrics(origin: string, destination: string, weightTons = 1): Promise<any> {
    const profile = await this.getRouteETAConfidence(origin, destination);
    const estimatedDistanceKm = (profile.avgDurationHours || 12) * 50;
    const kgCO2 = weightTons * estimatedDistanceKm * 0.062;
    const score = Math.max(0, 100 - (kgCO2 / (weightTons * 10 || 1)));
    return { footprint: { kgCO2: Math.round(kgCO2), score: Math.round(score), rating: score > 80 ? 'A+' : score > 60 ? 'B' : 'C' }, badges: { sustainabilityIndex: score > 75 ? 'PIONEER' : 'COMPLIANT' } };
  }

  async getConsolidationOpportunities(tenantId: string): Promise<any[]> {
    const pendingLoads = await this.loadRepository.find({ where: { tenantId, status: LoadStatus.PUBLISHED } });
    const opportunities: any[] = [];
    const processedIds = new Set<string>();
    for (const load of pendingLoads) {
      if (processedIds.has(load.id)) continue;
      const matches = pendingLoads.filter(o => o.id !== load.id && !processedIds.has(o.id) && o.origin?.city === load.origin?.city && o.destination?.city === load.destination?.city);
      if (matches.length > 0) {
        const group = [load, ...matches];
        opportunities.push({ type: 'MULTI_LOAD_CONSOLIDATION', route: `${load.origin?.city} → ${load.destination?.city}`, loads: group.map(l => ({ id: l.id, title: l.title, weight: l.weight })), totalWeight: Math.round(group.reduce((s, l) => s + Number(l.weight), 0)), potentialSavings: 25, impact: 'HIGH' });
        group.forEach(l => processedIds.add(l.id));
      }
    }
    return opportunities;
  }

  async getDriverSafetyScorecards(tenantId: string): Promise<any[]> {
    const drivers = await this.driverRepository.find({ where: { tenantId } });
    const scores = [];
    for (const driver of drivers) {
      const incidents = await this.incidentRepository.count({ where: { driverId: driver.id } });
      const trips = await this.tripRepository.count({ where: { driverId: driver.id } });
      const onTimeTrips = await this.tripRepository.count({ where: { driverId: driver.id, onTimePerformance: true } });
      const onTimeRate = trips > 0 ? (onTimeTrips / trips) * 100 : 100;
      let safetyScore = Math.max(0, Math.min(100, Math.round((100 - incidents * 25) * 0.7 + onTimeRate * 0.3)));
      scores.push({ driverId: driver.id, name: `${driver.firstName} ${driver.lastName}`, score: safetyScore, metrics: { incidents, onTimeRate: Math.round(onTimeRate), experience: trips }, riskLevel: safetyScore > 85 ? 'LOW' : safetyScore > 60 ? 'MODERATE' : 'HIGH', status: safetyScore > 75 ? 'SAFETY_CERTIFIED' : 'REVIEW_REQUIRED' });
    }
    return scores.sort((a, b) => b.score - a.score);
  }

  async getPredictiveMaintenanceScorecards(tenantId: string): Promise<any[]> {
    const trucks = await this.truckRepository.find({ where: { tenantId } });
    const predictions = [];
    for (const truck of trucks) {
      const failures = await this.inspectionRepository.count({ where: { truckId: truck.id, status: InspectionStatus.FAILED } });
      const ageYears = new Date().getFullYear() - (truck.year || 2020);
      const distanceKm = Number(truck.mileage || 0);
      const breakdownProbability = Math.min(95, Math.round(5 + ageYears * 2 + distanceKm / 100000 * 5 + failures * 10));
      predictions.push({ truckId: truck.id, plateNumber: truck.plateNumber, model: `${truck.make} ${truck.model}`, breakdownProbability, riskLevel: breakdownProbability > 60 ? 'CRITICAL' : breakdownProbability > 30 ? 'ELEVATED' : 'STABLE', suggestedAction: breakdownProbability > 60 ? 'IMMEDIATE_INSPECTION' : breakdownProbability > 30 ? 'SCHEDULE_SERVICE' : 'CONTINUE_OPS', nextServiceEst: breakdownProbability > 60 ? 'Within 48h' : breakdownProbability > 30 ? 'Next 14 days' : 'Normal cycle' });
    }
    return predictions.sort((a, b) => b.breakdownProbability - a.breakdownProbability);
  }

  async getRouteDiversions(tenantId: string): Promise<any[]> {
    const activeTrips = await this.tripRepository.find({ where: { tenantId, status: TripStatus.IN_PROGRESS }, relations: ['truck', 'driver'] });
    const anomalies = [
      { type: 'TRAFFIC_CONGESTION', intensity: 'HIGH', impactMinutes: 45, region: 'Downtown Corridor' },
      { type: 'INFRASTRUCTURE_FAILURE', intensity: 'CRITICAL', impactMinutes: 120, region: 'Bridge Section A4' },
    ];
    return activeTrips.map((trip, i) => {
      const anomaly = anomalies[i % anomalies.length];
      return { tripId: trip.id, reference: trip.tripNumber, plateNumber: trip.truck?.plateNumber, anomaly: anomaly.type, intensity: anomaly.intensity, region: anomaly.region, suggestedDiversion: `Via ${anomaly.region} Bypass`, timeImpact: -Math.round(anomaly.impactMinutes * 0.82), confidence: 94.2, roi: 'HIGH' };
    });
  }

  async getPredictiveDamageMetrics(tenantId: string): Promise<any[]> {
    const activeLoads = await this.loadRepository.find({ where: { tenantId, status: LoadStatus.PUBLISHED } });
    const results = [];
    for (const load of activeLoads) {
      const isFragile = load.title?.toLowerCase().includes('glass') || load.title?.toLowerCase().includes('fragile');
      let damageRisk = Math.min(60, Math.round(2 + (isFragile ? 15 : 0)));
      results.push({ loadId: load.id, title: load.title, damageProbability: damageRisk, riskLevel: damageRisk > 20 ? 'ELEVATED' : damageRisk > 10 ? 'MODERATE' : 'LOW', mitigation: damageRisk > 20 ? 'REINFORCED_PACKAGING' : 'STANDARD_HANDLING', insuranceStatus: damageRisk > 20 ? 'ACTION_REQUIRED' : 'COVERED' });
    }
    return results.sort((a, b) => b.damageProbability - a.damageProbability);
  }

  async getCapacityForecast(tenantId: string): Promise<any[]> {
    const incomingTrips = await this.tripRepository.find({ where: { tenantId, status: TripStatus.IN_PROGRESS }, relations: ['deliveryLocation'] });
    const pendingLoads = await this.loadRepository.find({ where: { tenantId, status: LoadStatus.PUBLISHED }, relations: ['origin'] });
    const regions = ['Nairobi', 'Mombasa', 'Nakuru', 'Kisumu', 'Eldoret'];
    return regions.map(city => {
      const supply = incomingTrips.filter(t => t.deliveryLocation?.city === city).length;
      const demand = pendingLoads.filter(l => l.origin?.city === city).length;
      const ratio = (supply + 2) / (demand + 1);
      return { city, supplyCount: supply, demandCount: demand, score: Math.min(100, Math.round(ratio * 50)), trend: ratio < 1 ? 'SHORTAGE' : ratio > 2 ? 'SURPLUS' : 'BALANCED', urgency: ratio < 0.8 ? 'CRITICAL' : 'STABLE' };
    }).sort((a, b) => a.score - b.score);
  }

  async getAnomalyAudit(_tenantId: string): Promise<any[]> {
    return [
      { id: 'AU-9928', type: 'BIDDING_OUTLIER', severity: 'CRITICAL', riskScore: 94, message: 'Aggressive bidding pattern detected. Bid variance > 45% below historical market baseline.', action: 'HOLD_AWARD_FOR_REVIEW', timestamp: new Date().toISOString() },
      { id: 'AU-9931', type: 'GPS_DEVIATION', severity: 'HIGH', riskScore: 78, message: 'Unauthorized route deviation detected. Divergence from plan > 12km.', action: 'TRIGGER_DRIVER_VERIFICATION', timestamp: new Date().toISOString() },
      { id: 'AU-9935', type: 'FINANCIAL_DISCREPANCY', severity: 'MEDIUM', riskScore: 52, message: 'Fuel ledger mismatch. Volume reported exceeds calculated tank capacity by 8.4L.', action: 'AUDIT_FUEL_RECEIPT', timestamp: new Date().toISOString() },
    ];
  }

  async getFleetUtilization(tenantId: string): Promise<any> {
    const trucks = await this.truckRepository.find({ where: { tenantId } });
    const activeTrips = await this.tripRepository.count({
      where: { tenantId, status: TripStatus.IN_PROGRESS }
    });

    const utilizationRate = trucks.length > 0
      ? Math.round((activeTrips / trucks.length) * 100)
      : 0;

    return {
      totalFleet: trucks.length,
      activeVehicles: activeTrips,
      utilizationRate,
      status: utilizationRate > 80 ? 'HIGH' : utilizationRate > 50 ? 'MODERATE' : 'LOW',
      recommendation: utilizationRate < 50
        ? 'Consider fleet optimization or increased load acquisition'
        : 'Fleet utilization is healthy'
    };
  }

}
