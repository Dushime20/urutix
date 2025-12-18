import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { ReceiversService } from './receivers.service';
import { CreateReceiverDto } from './dto/create-receiver.dto';
import { AssignCargoDto } from './dto/assign-cargo.dto';

@Controller('receivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiversController {
  constructor(private readonly receiversService: ReceiversService) {}

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
}

