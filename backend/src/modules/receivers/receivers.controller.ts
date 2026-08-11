import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Epod } from '../../entities/epod.entity';
import { CargoInspection } from '../../entities/cargo-inspection.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ReceiversService } from './receivers.service';
import { CreateReceiverDto } from './dto/create-receiver.dto';
import { AssignCargoDto } from './dto/assign-cargo.dto';
import { Load } from '../../entities/load.entity';

@Controller('receivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiversController {
  constructor(
    private readonly receiversService: ReceiversService,
    @InjectRepository(Epod)
    private readonly epodRepository: Repository<Epod>,
    @InjectRepository(CargoInspection)
    private readonly cargoInspectionRepository: Repository<CargoInspection>,
    @InjectRepository(Load)
    private readonly loadRepository: Repository<Load>,
  ) {}

  /**
   * Create a new receiver
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CARGO_OWNER)
  async createReceiver(
    @Request() req: any,
    @Body() createReceiverDto: CreateReceiverDto,
  ) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.createReceiver(cargoOwnerId, createReceiverDto);
  }

  /**
   * Get all receivers created by the cargo owner
   */
  @Get()
  @Roles(UserRole.CARGO_OWNER)
  async getReceivers(@Request() req: any) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.getReceiversByCargoOwner(cargoOwnerId);
  }

  /**
   * Get a single receiver by ID
   */
  @Get(':receiverId')
  @Roles(UserRole.CARGO_OWNER)
  async getReceiver(@Request() req: any, @Param('receiverId') receiverId: string) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.getReceiverById(receiverId, cargoOwnerId);
  }

  /**
   * Update receiver information
   */
  @Put(':receiverId')
  @Roles(UserRole.CARGO_OWNER)
  async updateReceiver(
    @Request() req: any,
    @Param('receiverId') receiverId: string,
    @Body() updateData: Partial<CreateReceiverDto>,
  ) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.updateReceiver(receiverId, cargoOwnerId, updateData);
  }

  /**
   * Delete a receiver
   */
  @Delete(':receiverId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CARGO_OWNER)
  async deleteReceiver(
    @Request() req: any,
    @Param('receiverId') receiverId: string,
  ) {
    const cargoOwnerId = req.user.userId;
    await this.receiversService.deleteReceiver(receiverId, cargoOwnerId);
  }

  /**
   * Get all cargos for assignment (cargo owner's cargos)
   */
  @Get('cargos/available')
  @Roles(UserRole.CARGO_OWNER)
  async getCargosForAssignment(@Request() req: any) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.getCargosForAssignment(cargoOwnerId);
  }

  /**
   * Assign cargo to a receiver
   */
  @Post('cargos/:cargoId/assign')
  @Roles(UserRole.CARGO_OWNER)
  async assignCargoToReceiver(
    @Request() req: any,
    @Param('cargoId') cargoId: string,
    @Body() assignCargoDto: AssignCargoDto,
  ) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.assignCargoToReceiver(
      cargoId,
      cargoOwnerId,
      assignCargoDto,
    );
  }

  /**
   * Unassign cargo from receiver
   */
  @Post('cargos/:cargoId/unassign')
  @Roles(UserRole.CARGO_OWNER)
  async unassignCargoFromReceiver(
    @Request() req: any,
    @Param('cargoId') cargoId: string,
  ) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.unassignCargoFromReceiver(cargoId, cargoOwnerId);
  }

  /**
   * Get all cargos assigned to the logged-in receiver (for receiver users)
   * This route must come before :receiverId/cargos to avoid route matching conflicts
   */
  @Get('my/cargos')
  @Roles(UserRole.CARGO_RECEIVER)
  async getMyCargos(@Request() req: any) {
    const receiverId = req.user.userId;
    return this.receiversService.getCargosByReceiverId(receiverId);
  }

  /**
   * Get all cargos assigned to a receiver
   */
  @Get(':receiverId/cargos')
  @Roles(UserRole.CARGO_OWNER)
  async getCargosByReceiver(
    @Request() req: any,
    @Param('receiverId') receiverId: string,
  ) {
    const cargoOwnerId = req.user.userId;
    return this.receiversService.getCargosByReceiver(receiverId, cargoOwnerId);
  }

  /**
   * Get cargo details for inspection (for receiver users)
   */
  @Get('cargos/:cargoId/inspect')
  @Roles(UserRole.CARGO_RECEIVER)
  async getCargoForInspection(
    @Request() req: any,
    @Param('cargoId') cargoId: string,
  ) {
    const receiverId = req.user.userId;
    return this.receiversService.getCargoForInspection(cargoId, receiverId);
  }

  /**
   * Submit cargo inspection (for receiver users)
   */
  @Post('cargos/:cargoId/inspect')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CARGO_RECEIVER)
  @UseGuards(PermissionsGuard)
  @RequirePermissions('receivers:inspect')
  async submitCargoInspection(
    @Request() req: any,
    @Param('cargoId') cargoId: string,
    @Body() inspectionData: any,
  ) {
    const receiverId = req.user.userId;
    return this.receiversService.submitCargoInspection(cargoId, receiverId, inspectionData);
  }

  /**
   * Get inspection history for a cargo (for receiver users)
   */
  @Get('cargos/:cargoId/inspection')
  @Roles(UserRole.CARGO_RECEIVER)
  async getCargoInspection(
    @Request() req: any,
    @Param('cargoId') cargoId: string,
  ) {
    const receiverId = req.user.userId;
    return this.receiversService.getCargoInspection(cargoId, receiverId);
  }

  /**
   * Get ePODs for the logged-in receiver (loads assigned to them)
   */
  @Get('my/epods')
  @Roles(UserRole.CARGO_RECEIVER)
  async getMyEpods(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const receiverId = req.user.userId;
    const tenantId = req.user.tenantId;

    const query = this.epodRepository
      .createQueryBuilder('epod')
      .leftJoinAndSelect('epod.trip', 'trip')
      .leftJoinAndSelect('trip.load', 'load')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.driver', 'driver')
      .where('epod.tenantId = :tenantId', { tenantId })
      .andWhere('load.receiverId = :receiverId', { receiverId });

    if (status) {
      query.andWhere('epod.status = :status', { status });
    }

    query.orderBy('epod.submittedAt', 'DESC');

    const epods = await query.getMany();

    return {
      success: true,
      data: {
        epods: epods.map(epod => ({
          id: epod.id,
          tripId: epod.tripId,
          tripNumber: epod.trip?.tripNumber,
          loadId: epod.trip?.loadId,
          loadTitle: epod.trip?.load?.title,
          truckNumber: epod.trip?.truck?.plateNumber,
          driverName: epod.trip?.driver
            ? `${epod.trip.driver.firstName} ${epod.trip.driver.lastName}`
            : null,
          recipientName: epod.recipientName,
          recipientPhone: epod.recipientPhone,
          status: epod.status,
          submittedAt: epod.submittedAt,
          confirmedAt: epod.confirmedAt,
          deliveryCoordinates: epod.deliveryCoordinates,
          deliveryNotes: epod.deliveryNotes,
          signatureFileUrl: epod.signatureFileUrl,
          photoUrls: epod.photoUrls,
        })),
      },
    };
  }

  /**
   * Get all cargo receiver inspections for loads owned by the current cargo owner
   */
  @Get('inspections/my-loads')
  @Roles(UserRole.CARGO_OWNER)
  async getMyLoadInspections(@Request() req: any) {
    const cargoOwnerId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Get all loads owned by this cargo owner that have been assigned to receivers
    const loads = await this.loadRepository.find({
      where: { cargoOwnerId, tenantId },
      relations: ['receiver', 'receiver.profile'],
      order: { createdAt: 'DESC' },
    });

    // Get inspections for these loads
    const loadIds = loads.map(l => l.id);
    
    let inspections: CargoInspection[] = [];
    if (loadIds.length > 0) {
      inspections = await this.cargoInspectionRepository
        .createQueryBuilder('inspection')
        .leftJoinAndSelect('inspection.load', 'load')
        .leftJoinAndSelect('inspection.receiver', 'receiver')
        .leftJoinAndSelect('receiver.profile', 'profile')
        .where('inspection.loadId IN (:...loadIds)', { loadIds })
        .orderBy('inspection.createdAt', 'DESC')
        .getMany();
    }

    // Map inspections with load details
    const mappedInspections = inspections.map(inspection => ({
      id: inspection.id,
      status: inspection.status,
      loadId: inspection.loadId,
      loadTitle: inspection.load?.title,
      loadReference: inspection.load?.reference,
      receiverId: inspection.receiverId,
      receiverName: inspection.receiver?.profile
        ? `${inspection.receiver.profile.firstName || ''} ${inspection.receiver.profile.lastName || ''}`.trim()
        : null,
      receiverEmail: inspection.receiver?.email,
      receiverPhone: inspection.receiver?.phone,
      checklist: inspection.checklist,
      overallNotes: inspection.overallNotes,
      allItemsVerified: inspection.allItemsVerified,
      verifiedCount: inspection.verifiedCount,
      totalItems: inspection.totalItems,
      discrepancyCount: inspection.discrepancyCount,
      discrepancies: inspection.discrepancies,
      documents: inspection.documents || [],
      completedAt: inspection.completedAt,
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt,
    }));

    return {
      success: true,
      data: {
        inspections: mappedInspections,
        total: mappedInspections.length,
        summary: {
          pending: mappedInspections.filter(i => i.status === 'PENDING').length,
          inProgress: mappedInspections.filter(i => i.status === 'IN_PROGRESS').length,
          completed: mappedInspections.filter(i => i.status === 'COMPLETED').length,
          disputed: mappedInspections.filter(i => i.status === 'DISPUTED').length,
          withDiscrepancies: mappedInspections.filter(i => i.discrepancyCount > 0).length,
        },
      },
    };
  }
}
