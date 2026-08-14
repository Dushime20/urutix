import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../entities/user.entity';
import { ParkingReservationsService } from './parking-reservations.service';
import {
  AddParkingNoteDto,
  AssignParkingReservationDto,
  CancelParkingReservationDto,
  CreateParkingReservationDto,
  GuestInformationResponseDto,
  LookupParkingReservationDto,
  ParkingReservationFilterDto,
  RejectParkingReservationDto,
  RequestInformationDto,
  UpdateParkingFacilityDto,
} from './dto/parking-reservation.dto';

const STAFF_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TENANT_ADMIN,
  UserRole.PARKING_RESERVATION_MANAGER,
];

const AUTH_ROLES = [
  ...STAFF_ROLES,
  UserRole.CARGO_OWNER,
  UserRole.TRUCK_OWNER,
  UserRole.FLEET_MANAGER,
  UserRole.DRIVER,
];

const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

@ApiTags('Parking Reservations')
@Controller('parking-reservations')
export class ParkingReservationsController {
  constructor(private readonly service: ParkingReservationsService) {}

  @Post()
  @Public()
  @UseGuards(OptionalJwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Submit a truck parking reservation (public)' })
  async create(
    @Body() dto: CreateParkingReservationDto,
    @Request() req,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const result = await this.service.create(
      dto,
      req.user,
      req.ip || req.headers['x-forwarded-for'],
      idempotencyKey,
    );
    if ('success' in result) {
      return result;
    }
    return {
      success: true,
      message: result.created
        ? 'Your truck parking reservation request has been successfully submitted.'
        : 'Your truck parking reservation request was already received.',
      data: result.reservation,
      possibleDuplicate: result.possibleDuplicate,
    };
  }

  @Post('lookup')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Look up a guest reservation by reference and email' })
  async lookup(@Body() dto: LookupParkingReservationDto) {
    const data = await this.service.lookup(dto);
    return { success: true, data };
  }

  @Post('lookup/respond')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @UsePipes(pipe)
  async guestRespond(@Body() dto: GuestInformationResponseDto) {
    const data = await this.service.guestRespond(dto);
    return { success: true, message: 'Your response has been submitted.', data };
  }

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view', 'parking:view_own', 'parking:view_details')
  async findAll(@Query() filter: ParkingReservationFilterDto, @Request() req) {
    const result = await this.service.findAll(filter, req.user);
    return {
      success: true,
      data: result.items,
      pagination: { total: result.total, page: result.page, limit: result.limit },
    };
  }

  @Get('stats')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:view')
  async stats(@Request() req) {
    return { success: true, data: await this.service.getStats(req.user) };
  }

  @Get('officers')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:assign', 'parking:view')
  async officers(@Request() req) {
    return { success: true, data: await this.service.listOfficers(req.user) };
  }

  @Get('facility')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:view')
  async facility(@Request() req) {
    return { success: true, data: await this.service.getFacility(req.user.tenantId) };
  }

  @Patch('facility')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN)
  @RequirePermissions('parking:manage_capacity')
  @UsePipes(pipe)
  async updateFacility(@Body() dto: UpdateParkingFacilityDto, @Request() req) {
    const data = await this.service.updateFacility(dto, req.user);
    return { success: true, message: 'Parking facility capacity updated.', data };
  }

  @Get('export')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:export')
  async export(@Query() filter: ParkingReservationFilterDto, @Request() req, @Res() res: Response) {
    const csv = await this.service.exportCsv(filter, req.user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="parking-reservations.csv"');
    res.send(csv);
  }

  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view', 'parking:view_own', 'parking:view_details')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return { success: true, data: await this.service.findOne(id, req.user) };
  }

  @Get(':id/activity')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view', 'parking:view_own', 'parking:view_details')
  async activity(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return { success: true, data: await this.service.getActivity(id, req.user) };
  }

  @Patch(':id/review')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:review')
  async startReview(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const data = await this.service.startReview(id, req.user);
    return { success: true, message: 'Review started.', data };
  }

  @Post(':id/assign')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:assign')
  @UsePipes(pipe)
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignParkingReservationDto,
    @Request() req,
  ) {
    const data = await this.service.assign(id, dto, req.user);
    return { success: true, message: 'Reservation assigned.', data };
  }

  @Post(':id/approve')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:approve')
  async approve(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const data = await this.service.approve(id, req.user);
    return { success: true, message: 'Reservation approved.', data };
  }

  @Post(':id/reject')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:reject')
  @UsePipes(pipe)
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectParkingReservationDto,
    @Request() req,
  ) {
    const data = await this.service.reject(id, dto, req.user);
    return { success: true, message: 'Reservation rejected.', data };
  }

  @Post(':id/request-information')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:request_information')
  @UsePipes(pipe)
  async requestInformation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestInformationDto,
    @Request() req,
  ) {
    const data = await this.service.requestInformation(id, dto, req.user);
    return { success: true, message: 'Additional information requested.', data };
  }

  @Post(':id/review-response')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:review')
  async reviewResponse(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const data = await this.service.reviewResponse(id, req.user);
    return { success: true, message: 'Applicant response reviewed.', data };
  }

  @Post(':id/respond')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view_own', 'parking:create', 'parking:review')
  @UsePipes(pipe)
  async respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { response: string },
    @Request() req,
  ) {
    const data = await this.service.respondAsUser(id, body.response, req.user);
    return { success: true, message: 'Your response has been submitted.', data };
  }

  @Post(':id/cancel')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:cancel')
  @UsePipes(pipe)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelParkingReservationDto,
    @Request() req,
  ) {
    const data = await this.service.cancel(id, dto, req.user);
    return { success: true, message: 'Reservation cancelled.', data };
  }

  @Post(':id/notes')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:add_note')
  @UsePipes(pipe)
  async addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddParkingNoteDto,
    @Request() req,
  ) {
    const data = await this.service.addNote(id, dto, req.user);
    return { success: true, message: 'Internal note added.', data };
  }
}
