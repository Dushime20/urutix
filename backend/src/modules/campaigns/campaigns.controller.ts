import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { CampaignsService } from './campaigns.service';
import { CampaignIntentDto } from './dto/campaign-intent.dto';

@ApiTags('Distribution Campaigns')
@ApiBearerAuth('JWT-auth')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Roles(UserRole.CARGO_OWNER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Search cities worldwide for a warehouse or destination' })
  cities(@Query('q') q?: string) {
    return this.campaignsService.searchCities(q || '', 40);
  }

  @Get()
  @ApiOperation({ summary: 'List distribution campaigns for the cargo owner' })
  list(@Request() req: any) {
    return this.campaignsService.list(req.user.tenantId, req.user.userId || req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a campaign with live load and trip status' })
  get(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.campaignsService.get(id, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post('suggest')
  @ApiOperation({ summary: 'Suggest destination cities from the prompt — user still picks' })
  suggest(@Body() dto: CampaignIntentDto, @Request() req: any) {
    return this.campaignsService.suggestCities(dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a campaign and compute the distribution plan' })
  create(@Body() dto: CampaignIntentDto, @Request() req: any) {
    return this.campaignsService.create(dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update intent and recompute the plan before approval' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CampaignIntentDto,
    @Request() req: any,
  ) {
    return this.campaignsService.updatePlan(id, dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary: 'Approve the plan: create child loads, request matches, flag finance/insurance/customs',
  })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CampaignIntentDto,
    @Request() req: any,
  ) {
    return this.campaignsService.approve(id, dto, req.user.tenantId, req.user.userId || req.user.id);
  }

  @Post(':id/repeat')
  @ApiOperation({ summary: 'Clone this freight plan into the next window (not a goods PO)' })
  repeat(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.campaignsService.repeat(id, req.user.tenantId, req.user.userId || req.user.id);
  }
}
