import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceLog, MaintenanceStatus } from '../../entities/maintenance-log.entity';
import { Truck } from '../../entities/truck.entity';
import { CreateMaintenanceLogDto, UpdateMaintenanceLogDto } from './dto/maintenance.dto';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceLog)
    private maintenanceRepository: Repository<MaintenanceLog>,
    @InjectRepository(Truck)
    private truckRepository: Repository<Truck>,
  ) {}

  async createLog(
    tenantId: string,
    userId: string,
    role: UserRole,
    userIdFromToken: string,
    createDto: CreateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    // Check if truck belongs to the tenant
    const truck = await this.truckRepository.findOne({
      where: { id: createDto.truckId, tenantId },
    });

    if (!truck) {
      throw new NotFoundException('Truck not found or unauthorized');
    }

    // Drivers can only report faults for their assigned truck? 
    // In a real app we would check truck.currentDriverId === userId, 
    // but here we allow any driver for simplicity as long as it's the correct tenant
    
    const log = this.maintenanceRepository.create({
      ...createDto,
      tenantId,
      driverId: role === UserRole.DRIVER ? userIdFromToken : createDto.driverId,
    });

    return await this.maintenanceRepository.save(log);
  }

  async findByTruck(
    tenantId: string,
    truckId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const [logs, total] = await this.maintenanceRepository.findAndCount({
      where: { tenantId, truckId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findByDriver(tenantId: string, driverId: string) {
    return await this.maintenanceRepository.find({
      where: { tenantId, driverId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<MaintenanceLog> {
    const log = await this.maintenanceRepository.findOne({
      where: { id, tenantId },
      relations: ['truck'],
    });

    if (!log) {
      throw new NotFoundException('Maintenance log not found');
    }

    return log;
  }

  async update(
    tenantId: string,
    id: string,
    updateDto: UpdateMaintenanceLogDto,
  ): Promise<MaintenanceLog> {
    const log = await this.findOne(tenantId, id);

    Object.assign(log, updateDto);

    return await this.maintenanceRepository.save(log);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const log = await this.findOne(tenantId, id);
    await this.maintenanceRepository.remove(log);
  }

  async findFleetLogs(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    status?: string,
  ) {
    const where: any = { tenantId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const [logs, total] = await this.maintenanceRepository.findAndCount({
      where,
      relations: ['truck'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
