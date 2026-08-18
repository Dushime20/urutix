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
  GuestIshemaPayDto,
  GuestIshemaPayStatusDto,
  GuestParkingPaymentDto,
  InitiateIshemaPayDto,
  IshemaPayStatusDto,
  LookupParkingReservationDto,
  ParkingReservationFilterDto,
  PreviewParkingQuoteDto,
  RejectParkingReservationDto,
  RequestInformationDto,
  SubmitParkingPaymentDto,
  UpdateParkingFacilityDto,
  UpdateParkingFeesDto,
  WaiveParkingPaymentDto,
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
        ? result.emailSent
          ? `Your truck parking reservation request has been successfully submitted. A confirmation email with your reservation reference was sent to ${(result.emailedTo || []).join(', ') || 'the driver email'}.`
          : 'Your truck parking reservation request was submitted, but we could not send the confirmation email. Save your reservation reference and contact the parking team if you do not receive an email.'
        : 'Your truck parking reservation request was already received.',
      data: result.reservation,
      possibleDuplicate: result.possibleDuplicate,
      emailSent: result.emailSent,
      emailedTo: result.emailedTo,
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

  @Post('lookup/pay')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Submit parking fee payment confirmation as a guest' })
  async guestPay(@Body() dto: GuestParkingPaymentDto) {
    const data = await this.service.guestPay(dto);
    return {
      success: true,
      message: 'Payment confirmation submitted. The parking team will verify the payment.',
      data,
    };
  }

  @Post('lookup/pay-now')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Start Ishema mobile money payment for a confirmed reservation' })
  async guestPayNow(@Body() dto: GuestIshemaPayDto) {
    const data = await this.service.guestInitiateIshema(dto);
    return {
      success: true,
      message: data.message,
      data,
    };
  }

  @Post('lookup/pay-status')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Check Ishema payment status for a guest reservation' })
  async guestPayStatus(@Body() dto: GuestIshemaPayStatusDto) {
    const data = await this.service.guestIshemaStatus(dto);
    return { success: true, data };
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
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.PARKING_RESERVATION_MANAGER)
  @RequirePermissions('parking:manage_capacity')
  @UsePipes(pipe)
  async updateFacility(@Body() dto: UpdateParkingFacilityDto, @Request() req) {
    const data = await this.service.updateFacility(dto, req.user);
    return { success: true, message: 'Parking facility capacity updated.', data };
  }

  @Get('fees')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:view', 'parking:manage_fees')
  async fees(@Request() req) {
    return { success: true, data: await this.service.getFeeSchedule(req.user) };
  }

  @Patch('fees')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:manage_fees')
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Configure parking reservation fees' })
  async updateFees(@Body() dto: UpdateParkingFeesDto, @Request() req) {
    const data = await this.service.updateFeeSchedule(dto, req.user);
    return { success: true, message: 'Parking reservation fees updated.', data };
  }

  @Get('fees/schedules')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:view', 'parking:manage_fees')
  async listFeeSchedules(@Request() req) {
    return { success: true, data: await this.service.listFeeSchedules(req.user) };
  }

  @Get('fees/schedules/:id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:view', 'parking:manage_fees')
  async getFeeScheduleById(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return { success: true, data: await this.service.getFeeScheduleById(id, req.user) };
  }

  @Post('fees/schedules/:id/activate')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:manage_fees')
  @ApiOperation({ summary: 'Activate a parking fee schedule' })
  async activateFeeSchedule(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const data = await this.service.activateFeeSchedule(id, req.user);
    return { success: true, message: 'Fee schedule activated.', data };
  }

  @Post('fees/schedules/:id/archive')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:manage_fees')
  @ApiOperation({ summary: 'Archive a parking fee schedule' })
  async archiveFeeSchedule(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const data = await this.service.archiveFeeSchedule(id, req.user);
    return { success: true, message: 'Fee schedule archived.', data };
  }

  @Post('fees/preview')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:view', 'parking:manage_fees')
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Preview a reservation quote from the applicable fee schedule' })
  async previewFees(@Body() dto: PreviewParkingQuoteDto, @Request() req) {
    const data = await this.service.previewFeeQuote(dto, req.user);
    return { success: true, data };
  }

  @Get('public-pricing')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Public parking pricing notes and contract limits' })
  async publicPricing() {
    return { success: true, data: await this.service.getPublicPricing() };
  }

  @Post('public-quote')
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UsePipes(pipe)
  @ApiOperation({ summary: 'Public live quote preview' })
  async publicQuote(@Body() dto: PreviewParkingQuoteDto) {
    const data = await this.service.previewFeeQuote(dto);
    return { success: true, data };
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

  @Post(':id/pay')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view_own', 'parking:create', 'parking:review')
  @UsePipes(pipe)
  async pay(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitParkingPaymentDto,
    @Request() req,
  ) {
    const data = await this.service.payAsUser(id, dto, req.user);
    return {
      success: true,
      message: 'Payment confirmation submitted. The parking team will verify the payment.',
      data,
    };
  }

  @Post(':id/pay-now')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view_own', 'parking:create', 'parking:review')
  @UsePipes(pipe)
  async payNow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiateIshemaPayDto,
    @Request() req,
  ) {
    const data = await this.service.initiateIshemaAsUser(id, dto.phoneNumber, req.user);
    return { success: true, message: data.message, data };
  }

  @Post(':id/pay-status')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...AUTH_ROLES)
  @RequirePermissions('parking:view_own', 'parking:create', 'parking:review')
  @UsePipes(pipe)
  async payStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IshemaPayStatusDto,
    @Request() req,
  ) {
    const data = await this.service.refreshIshemaStatusAsUser(id, dto.referenceId, req.user);
    return { success: true, data };
  }

  @Post(':id/confirm-payment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:confirm_payment', 'parking:approve')
  @UsePipes(pipe)
  async confirmPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitParkingPaymentDto,
    @Request() req,
  ) {
    const data = await this.service.confirmPayment(id, dto, req.user);
    return { success: true, message: 'Payment confirmed.', data };
  }

  @Post(':id/waive-payment')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...STAFF_ROLES)
  @RequirePermissions('parking:confirm_payment', 'parking:approve')
  @UsePipes(pipe)
  async waivePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: WaiveParkingPaymentDto,
    @Request() req,
  ) {
    const data = await this.service.waivePayment(id, dto, req.user);
    return { success: true, message: 'Parking fees waived.', data };
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
