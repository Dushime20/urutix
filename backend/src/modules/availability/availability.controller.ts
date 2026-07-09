import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AvailabilityService } from './availability.service';
import {
  TruckAvailabilityQueryDto,
  DriverAvailabilityQueryDto,
} from './dto/availability-query.dto';

@ApiTags('Availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ─── GET /availability/trucks ────────────────────────────────────────────────

  @Get('trucks')
  @ApiOperation({
    summary: 'Get available trucks for a date window',
    description:
      'Returns only trucks that have no confirmed shipment overlapping the requested pickup–delivery window ' +
      'and are not in MAINTENANCE or OUT_OF_SERVICE status. ' +
      'When called by a TRUCK_OWNER or FLEET_MANAGER, only their own trucks are returned.',
  })
  @ApiOkResponse({ description: 'List of available trucks' })
  async getAvailableTrucks(
    @Query() query: TruckAvailabilityQueryDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    const role: string = req.user.role ?? '';

    // Truck owners and fleet managers can only see their own trucks
    const ownerId =
      role === 'TRUCK_OWNER' || role === 'FLEET_MANAGER'
        ? req.user.userId
        : undefined;

    const trucks = await this.availabilityService.getAvailableTrucks({
      tenantId,
      pickupDateTime:   new Date(query.pickupDateTime),
      deliveryDateTime: new Date(query.deliveryDateTime),
      capacityWeight:   query.capacityWeight,
      truckType:        query.truckType,
      ownerId,
    });

    return {
      success: true,
      message: `${trucks.length} available truck(s) found`,
      data: trucks,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── GET /availability/drivers ───────────────────────────────────────────────

  @Get('drivers')
  @ApiOperation({
    summary: 'Get available drivers for a date window',
    description:
      'Returns only drivers that have no confirmed shipment overlapping the requested window ' +
      'and are not SUSPENDED / INACTIVE / TERMINATED / ON_LEAVE.',
  })
  @ApiOkResponse({ description: 'List of available drivers' })
  async getAvailableDrivers(
    @Query() query: DriverAvailabilityQueryDto,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    const drivers = await this.availabilityService.getAvailableDrivers({
      tenantId,
      pickupDateTime:   new Date(query.pickupDateTime),
      deliveryDateTime: new Date(query.deliveryDateTime),
    });

    return {
      success: true,
      message: `${drivers.length} available driver(s) found`,
      data: drivers,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── GET /availability/summary ───────────────────────────────────────────────

  @Get('summary')
  @ApiOperation({ summary: 'Fleet utilization summary for broker/fleet dashboard' })
  async getUtilizationSummary(@Request() req) {
    const tenantId = req.user.tenantId;
    const summary = await this.availabilityService.getUtilizationSummary(tenantId);

    return {
      success: true,
      message: 'Utilization summary retrieved',
      data: summary,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── POST /availability/backfill ─────────────────────────────────────────────

  @Post('backfill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Backfill reservations from existing trips (run once after deployment)',
    description: 'Seeds ShipmentReservation records for all PLANNED/IN_PROGRESS trips that predate the scheduling engine.',
  })
  async backfill(@Request() req) {
    const tenantId = req.user.tenantId;
    const count = await this.availabilityService.backfillReservationsFromTrips(tenantId);

    return {
      success: true,
      message: `Backfill complete: ${count} reservation(s) created`,
      data: { count },
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── GET /availability/trucks/:truckId/schedule ──────────────────────────────

  @Get('trucks/:truckId/schedule')
  @ApiOperation({ summary: 'Get the reservation schedule for a specific truck' })
  async getTruckSchedule(@Param('truckId') truckId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    // Return all active reservations for this truck
    const reservations = await this.availabilityService['reservationRepo'].find({
      where: {
        tenantId,
        truckId,
        status: 'ACTIVE' as any,
      },
      order: { pickupDateTime: 'ASC' },
    });

    return {
      success: true,
      message: 'Truck schedule retrieved',
      data: reservations,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── GET /availability/drivers/:driverId/schedule ────────────────────────────

  @Get('drivers/:driverId/schedule')
  @ApiOperation({ summary: 'Get the reservation schedule for a specific driver' })
  async getDriverSchedule(@Param('driverId') driverId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    const reservations = await this.availabilityService['reservationRepo'].find({
      where: {
        tenantId,
        driverId,
        status: 'ACTIVE' as any,
      },
      order: { pickupDateTime: 'ASC' },
    });

    return {
      success: true,
      message: 'Driver schedule retrieved',
      data: reservations,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
