import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CarrierMarketplaceService } from './carrier-marketplace.service';

class InviteCarrierDto {
  @IsString() @IsOptional() notes?: string;
}

class BackhaulDto {
  @IsString() returnOriginCity: string;
  @IsString() returnDestinationCity: string;
  @IsString() availableDate: string;
}

@ApiTags('Carrier Marketplace')
@Controller('carrier-marketplace')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class CarrierMarketplaceController {
  constructor(private readonly service: CarrierMarketplaceService) {}

  // ─── Directory ────────────────────────────────────────────────────────────────

  @Get('carriers')
  @ApiOperation({ summary: 'Browse carrier directory with filters' })
  @ApiQuery({ name: 'truckType', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'tier', required: false })
  @ApiQuery({ name: 'available', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  browseCarriers(
    @Req() req: any,
    @Query('truckType') truckType?: string,
    @Query('minRating') minRating?: string,
    @Query('tier') tier?: string,
    @Query('available') available?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.browseCarriers(req.user.tenantId, req.user.id, {
      truckType,
      minRating: minRating ? Number(minRating) : undefined,
      tier,
      available: available === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('carriers/featured')
  @ApiOperation({ summary: 'Get featured (Platinum) carriers' })
  getFeatured(@Req() req: any) {
    return this.service.getFeaturedCarriers(req.user.tenantId);
  }

  @Get('carriers/:id')
  @ApiOperation({ summary: 'Get public profile of a specific carrier' })
  getProfile(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.getCarrierProfile(id, req.user.tenantId, req.user.id);
  }

  // ─── Backhaul ─────────────────────────────────────────────────────────────────

  @Post('backhaul')
  @ApiOperation({ summary: 'Find loads matching a truck owner\'s return route (backhaul)' })
  findBackhaul(@Body() dto: BackhaulDto, @Req() req: any) {
    return this.service.findBackhaulMatches(
      req.user.id,
      req.user.tenantId,
      dto.returnOriginCity,
      dto.returnDestinationCity,
      dto.availableDate,
    );
  }

  // ─── Private Network ──────────────────────────────────────────────────────────

  @Get('network')
  @ApiOperation({ summary: 'Get my private carrier network' })
  getNetwork(@Req() req: any) {
    return this.service.getMyNetwork(req.user.id, req.user.tenantId);
  }

  @Post('network/:truckOwnerId')
  @ApiOperation({ summary: 'Invite a carrier to private network' })
  invite(
    @Param('truckOwnerId', ParseUUIDPipe) truckOwnerId: string,
    @Body() dto: InviteCarrierDto,
    @Req() req: any,
  ) {
    return this.service.inviteToNetwork(req.user.id, truckOwnerId, req.user.tenantId, dto.notes);
  }

  @Delete('network/:truckOwnerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a carrier from private network' })
  removeFromNetwork(
    @Param('truckOwnerId', ParseUUIDPipe) truckOwnerId: string,
    @Req() req: any,
  ) {
    return this.service.removeFromNetwork(req.user.id, truckOwnerId, req.user.tenantId);
  }
}
