import { Controller, Get, Post, Body, Param, Put, Request, UseGuards } from '@nestjs/common';
import { MultiModalService } from './multi-modal.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { LegStatus } from './entities/multi-modal.entity';

@ApiTags('Multi-Modal Freight')
@Controller('multi-modal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class MultiModalController {
  constructor(private readonly multiModalService: MultiModalService) {}

  @Post('shipments')
  @ApiOperation({ summary: 'Create a new multi-modal shipment' })
  async createShipment(@Request() req, @Body('loadId') loadId: string): Promise<ApiResponseDto> {
    const data = await this.multiModalService.createShipment(req.user.tenantId, loadId);
    return {
      success: true,
      message: 'Multi-modal shipment initiated successfully',
      data,
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('shipments')
  @ApiOperation({ summary: 'List all multi-modal shipments for tenant' })
  async getAllShipments(@Request() req): Promise<ApiResponseDto> {
    const data = await this.multiModalService.getAllShipments(req.user.tenantId);
    return {
      success: true,
      message: 'Multi-modal shipments retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('shipments/:id')
  @ApiOperation({ summary: 'Get multi-modal shipment details' })
  async getShipmentDetails(@Request() req, @Param('id') id: string): Promise<ApiResponseDto> {
    const data = await this.multiModalService.getShipmentDetails(id, req.user.tenantId);
    return {
      success: true,
      message: 'Multi-modal shipment details retrieved successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Put('legs/:id/status')
  @ApiOperation({ summary: 'Update the status of a specific journey leg' })
  async updateLegStatus(@Param('id') id: string, @Body('status') status: LegStatus): Promise<ApiResponseDto> {
    const data = await this.multiModalService.updateLegStatus(id, status);
    return {
      success: true,
      message: 'Leg status updated successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('shipments/:id/strategies')
  @ApiOperation({ summary: 'Analyze and optimize transport mode strategy' })
  async getStrategies(@Param('id') id: string): Promise<ApiResponseDto> {
    const data = await this.multiModalService.getModeOptimization(id);
    return {
      success: true,
      message: 'Multi-modal strategies generated successfully',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('shipments/:id/execute')
  @ApiOperation({ summary: 'Execute AI Dispatcher implementation (e.g., re-routing)' })
  async executeStrategy(@Request() req, @Param('id') id: string): Promise<ApiResponseDto> {
    const data = await this.multiModalService.executeStrategy(id, req.user.tenantId);
    return {
      success: true,
      message: 'AI Dispatcher implementation successful',
      data,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
