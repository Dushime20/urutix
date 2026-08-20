import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CapacityService } from './capacity.service';
import {
  BookCapacityDto,
  CancelBookingDto,
  CreateCapacityOfferDto,
  QuoteCapacityDto,
  RejectBookingDto,
  SearchCapacityDto,
  UpdateCapacityOfferDto,
} from './dto/capacity.dto';

const OWNERS = [UserRole.TRUCK_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN];
const SHIPPERS = [UserRole.CARGO_OWNER, UserRole.BROKER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN];

@ApiTags('Capacity Marketplace')
@ApiBearerAuth('JWT-auth')
@Controller('capacity')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CapacityController {
  constructor(private readonly capacity: CapacityService) {}

  @Get('cities')
  @Roles(...OWNERS, ...SHIPPERS)
  @ApiOperation({ summary: 'Search cities for leftover-space corridors' })
  cities(@Query('q') q?: string) {
    return this.capacity.searchCities(q || '', 20);
  }

  @Get('sellable')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'Trucks and under-filled trips that can sell leftover space' })
  sellable(@Request() req: any) {
    return this.capacity.sellable(req.user.tenantId, req.user.userId || req.user.id);
  }

  @Get('stats')
  @Roles(...OWNERS, ...SHIPPERS)
  @ApiOperation({ summary: 'Capacity marketplace totals for the signed-in side' })
  stats(@Request() req: any) {
    return this.capacity.stats(req.user.tenantId, req.user.userId || req.user.id, req.user.role);
  }

  @Get('offers')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'List leftover-space listings owned by this fleet' })
  listOffers(@Request() req: any) {
    return this.capacity.listOwnerOffers(req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post('offers')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'Publish unused kg/m³ on a corridor (Airbnb for cargo capacity)' })
  createOffer(@Body() dto: CreateCapacityOfferDto, @Request() req: any) {
    return this.capacity.createOffer(dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Get('offers/:id')
  @Roles(...OWNERS, ...SHIPPERS)
  @ApiOperation({ summary: 'Get a leftover-space listing' })
  getOffer(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.capacity.getOffer(id, req.user.tenantId, req.user.userId || req.user.id, req.user.role);
  }

  @Patch('offers/:id')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'Update price or booking mode on an open listing' })
  updateOffer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCapacityOfferDto,
    @Request() req: any,
  ) {
    return this.capacity.updateOffer(id, dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post('offers/:id/close')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'Withdraw an open leftover-space listing' })
  closeOffer(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.capacity.closeOffer(id, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Get('marketplace')
  @Roles(...SHIPPERS)
  @ApiOperation({ summary: 'Browse leftover truck space as bookable inventory' })
  marketplace(@Query() query: SearchCapacityDto, @Request() req: any) {
    return this.capacity.marketplace(query, req.user.tenantId);
  }

  @Post('offers/:id/quote')
  @Roles(...SHIPPERS)
  @ApiOperation({ summary: 'Quote freight + platform commission for a leftover-space slice' })
  quote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QuoteCapacityDto,
    @Request() req: any,
  ) {
    return this.capacity.quote(id, dto, req.user.tenantId);
  }

  @Post('offers/:id/book')
  @Roles(...SHIPPERS)
  @ApiOperation({ summary: 'Book unused space. Instant listings confirm; request listings wait for the owner.' })
  book(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: BookCapacityDto,
    @Request() req: any,
  ) {
    return this.capacity.book(id, dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Get('bookings')
  @Roles(...OWNERS, ...SHIPPERS)
  @ApiOperation({ summary: 'Capacity bookings for the signed-in cargo owner or fleet' })
  bookings(@Request() req: any) {
    const userId = req.user.userId || req.user.id;
    if (req.user.role === 'TRUCK_OWNER') {
      return this.capacity.listOwnerBookings(req.user.tenantId, userId);
    }
    return this.capacity.listCargoBookings(req.user.tenantId, userId);
  }

  @Post('bookings/:id/accept')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'Accept a request-to-book leftover-space request' })
  accept(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.capacity.acceptBooking(id, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post('bookings/:id/reject')
  @Roles(...OWNERS)
  @ApiOperation({ summary: 'Reject a leftover-space request and release kg/m³' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectBookingDto,
    @Request() req: any,
  ) {
    return this.capacity.rejectBooking(id, req.user.tenantId, req.user.userId || req.user.id, dto.reason);
  }

  @Post('bookings/:id/cancel')
  @Roles(...SHIPPERS)
  @ApiOperation({ summary: 'Cancel a leftover-space booking and release remaining capacity' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @Request() req: any,
  ) {
    return this.capacity.cancelBooking(id, req.user.tenantId, req.user.userId || req.user.id, dto.reason);
  }
}
