import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MultiModalShipment, MultiModalLeg, MultiModalStatus, LegStatus, TransportMode } from './entities/multi-modal.entity';
import { Load } from '../../entities/load.entity';

@Injectable()
export class MultiModalService {
  private readonly logger = new Logger(MultiModalService.name);

  constructor(
    @InjectRepository(MultiModalShipment)
    private readonly shipmentRepository: Repository<MultiModalShipment>,
    @InjectRepository(MultiModalLeg)
    private readonly legRepository: Repository<MultiModalLeg>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  async createShipment(tenantId: string, loadId: string): Promise<MultiModalShipment> {
    const load = await this.loadRepository.findOne({ where: { id: loadId } });
    if (!load) throw new NotFoundException('Load not found');

    const shipmentNumber = `MM-${Date.now().toString().slice(-8)}`;
    const shipment = this.shipmentRepository.create({
      tenantId,
      loadId,
      shipmentNumber,
      status: MultiModalStatus.PLANNING,
    });

    return this.shipmentRepository.save(shipment);
  }

  async addLeg(shipmentId: string, legData: Partial<MultiModalLeg>): Promise<MultiModalLeg> {
    const shipment = await this.shipmentRepository.findOne({ where: { id: shipmentId } });
    if (!shipment) throw new NotFoundException('Shipment not found');

    const leg = this.legRepository.create({
      ...legData,
      shipmentId,
    });

    return this.legRepository.save(leg);
  }

  async getShipmentDetails(shipmentId: string, tenantId: string): Promise<MultiModalShipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id: shipmentId, tenantId },
      relations: ['legs', 'load'],
      order: {
        legs: {
          sequence: 'ASC',
        },
      },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  async getAllShipments(tenantId: string): Promise<MultiModalShipment[]> {
    return this.shipmentRepository.find({
      where: { tenantId },
      relations: ['legs', 'load'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateLegStatus(legId: string, status: LegStatus): Promise<MultiModalLeg> {
    const leg = await this.legRepository.findOne({ where: { id: legId } });
    if (!leg) throw new NotFoundException('Leg not found');

    leg.status = status;
    return this.legRepository.save(leg);
  }

  /**
   * AI-Driven Multi-Modal Optimization Strategy (Refinement)
   * Simulated logic to suggest mode switching based on port congestion or rail delays
   */
  async getModeOptimization(shipmentId: string): Promise<any> {
     // Simulated optimization engine
     return {
        shipmentId,
        recommendation: 'CARGO_X_RAIL_DEVIATION',
        reason: 'Mombasa Port Congestion +48h',
        optimalMode: TransportMode.RAIL,
        costImpact: -150, // Savings
        timeImpact: -12, // Hours saved
        urgency: 'HIGH'
     };
  }

  /**
   * AI Dispatcher - Execute predicted strategy (e.g., re-routing a leg)
   */
  async executeStrategy(shipmentId: string, tenantId: string): Promise<any> {
    const shipment = await this.getShipmentDetails(shipmentId, tenantId);
    
    // Simulate re-sequencing the journey
    // In a real scenario, this would involve cancels on current legs and new booking creation
    const strategy = await this.getModeOptimization(shipmentId);
    
    this.logger.log(`Executing AI Strategy: ${strategy.recommendation} for shipment ${shipmentId}`);
    
    // Find the relevant leg to modify (simulated)
    const legToModify = shipment.legs[0];
    if (legToModify) {
       legToModify.mode = strategy.optimalMode;
       legToModify.carrierName = `RAIL_GLOBAL_EXPRESS_${Math.floor(Math.random() * 1000)}`;
       legToModify.status = LegStatus.ACTIVE;
       await this.legRepository.save(legToModify);
    }
    
    return {
       success: true,
       implemented: strategy.recommendation,
       newEta: new Date(Date.now() + (strategy.timeImpact * 60 * 60 * 1000)),
       savingsImplemented: strategy.costImpact
    };
  }
}
