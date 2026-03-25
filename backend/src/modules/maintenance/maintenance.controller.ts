import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceLogDto, UpdateMaintenanceLogDto } from './dto/maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.FLEET_MANAGER, UserRole.DRIVER)
  create(
    @CurrentUser() user: any,
    @Body() createDto: CreateMaintenanceLogDto,
  ) {
    return this.maintenanceService.createLog(
      user.tenantId,
      user.id,
      user.role,
      user.id,
      createDto,
    );
  }

  @Get('truck/:truckId')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.FLEET_MANAGER, UserRole.DRIVER)
  findByTruck(
    @CurrentUser() user: any,
    @Param('truckId') truckId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.maintenanceService.findByTruck(user.tenantId, truckId, page, limit);
  }

  @Get('driver/my-logs')
  @Roles(UserRole.DRIVER)
  findMyLogs(@CurrentUser() user: any) {
    return this.maintenanceService.findByDriver(user.tenantId, user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.FLEET_MANAGER, UserRole.DRIVER)
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.maintenanceService.findOne(user.tenantId, id);
  }

  @Get('fleet/all')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.FLEET_MANAGER)
  findFleetLogs(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
    @Query('status') status?: string,
  ) {
    return this.maintenanceService.findFleetLogs(user.tenantId, page, limit, status);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN, UserRole.FLEET_MANAGER)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceLogDto,
  ) {
    return this.maintenanceService.update(user.tenantId, id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.TENANT_ADMIN)
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.maintenanceService.delete(user.tenantId, id);
  }
}
