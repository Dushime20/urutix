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
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SafetyService } from './safety.service';
import {
  CreateSafetyIncidentDto,
  IncidentStatus,
  IncidentSeverity,
} from './dto/create-safety-incident.dto';
import {
  CreateSafetyInspectionDto,
  InspectionStatus,
} from './dto/create-safety-inspection.dto';
import {
  CreateSafetyTrainingDto,
  TrainingStatus,
  TrainingType,
} from './dto/create-safety-training.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Safety Management')
@ApiBearerAuth()
@Controller('safety')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('incidents')
  @ApiOperation({ summary: 'Create a new safety incident' })
  @ApiResponse({ status: 201, description: 'Incident created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createIncident(
    @Body() createDto: CreateSafetyIncidentDto,
    @Request() req,
  ) {
    try {
      const incident = await this.safetyService.createIncident(
        createDto,
        req.user.tenantId,
        req.user.userId,
      );
      return {
        message: 'Safety incident created successfully',
        incident,
      };
    } catch (error) {
      console.error('❌ Error in createIncident controller:', error);
      throw error;
    }
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get all safety incidents' })
  @ApiQuery({ name: 'status', required: false, enum: IncidentStatus })
  @ApiQuery({ name: 'severity', required: false, enum: IncidentSeverity })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of incidents' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getIncidents(
    @Query('status') status?: IncidentStatus,
    @Query('severity') severity?: IncidentSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    try {
      const incidents = await this.safetyService.findAllIncidents(
        req.user.tenantId,
        {
          status,
          severity,
          startDate,
          endDate,
        },
      );
      return {
        incidents,
      };
    } catch (error) {
      console.error('❌ Error in getIncidents controller:', error);
      throw error;
    }
  }

  @Get('incidents/:id')
  @ApiOperation({ summary: 'Get a specific safety incident' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Incident details' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getIncident(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    try {
      const incident = await this.safetyService.findOneIncident(
        id,
        req.user.tenantId,
      );
      return { incident };
    } catch (error) {
      console.error('❌ Error in getIncident controller:', error);
      throw error;
    }
  }

  @Put('incidents/:id')
  @ApiOperation({ summary: 'Update a safety incident' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Incident updated successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateIncident(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateSafetyIncidentDto>,
    @Request() req,
  ) {
    try {
      const incident = await this.safetyService.updateIncident(
        id,
        updateDto,
        req.user.tenantId,
      );
      return {
        message: 'Safety incident updated successfully',
        incident,
      };
    } catch (error) {
      console.error('❌ Error in updateIncident controller:', error);
      throw error;
    }
  }

  @Delete('incidents/:id')
  @ApiOperation({ summary: 'Delete a safety incident' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Incident deleted successfully' })
  @ApiResponse({ status: 404, description: 'Incident not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteIncident(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    try {
      await this.safetyService.deleteIncident(id, req.user.tenantId);
      return {
        message: 'Safety incident deleted successfully',
      };
    } catch (error) {
      console.error('❌ Error in deleteIncident controller:', error);
      throw error;
    }
  }

  // ===== INSPECTION ENDPOINTS =====

  @Post('inspections')
  @ApiOperation({ summary: 'Create a new safety inspection' })
  @ApiResponse({ status: 201, description: 'Inspection created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createInspection(
    @Body() createDto: CreateSafetyInspectionDto,
    @Request() req,
  ) {
    try {
      const inspection = await this.safetyService.createInspection(
        createDto,
        req.user.tenantId,
        req.user.userId,
      );
      return {
        message: 'Safety inspection created successfully',
        inspection,
      };
    } catch (error) {
      console.error('❌ Error in createInspection controller:', error);
      throw error;
    }
  }

  @Get('inspections')
  @ApiOperation({ summary: 'Get all safety inspections' })
  @ApiQuery({ name: 'status', required: false, enum: InspectionStatus })
  @ApiQuery({ name: 'truckId', required: false, type: String })
  @ApiQuery({ name: 'inspectorId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of inspections' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInspections(
    @Query('status') status?: InspectionStatus,
    @Query('truckId') truckId?: string,
    @Query('inspectorId') inspectorId?: string,
    @Request() req?,
  ) {
    try {
      const inspections = await this.safetyService.findAllInspections(
        req.user.tenantId,
        {
          status,
          truckId,
          inspectorId,
        },
      );
      return {
        inspections,
      };
    } catch (error) {
      console.error('❌ Error in getInspections controller:', error);
      throw error;
    }
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Get a specific safety inspection' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Inspection details' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInspection(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    try {
      const inspection = await this.safetyService.findOneInspection(
        id,
        req.user.tenantId,
      );
      return { inspection };
    } catch (error) {
      console.error('❌ Error in getInspection controller:', error);
      throw error;
    }
  }

  @Put('inspections/:id')
  @ApiOperation({ summary: 'Update a safety inspection' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Inspection updated successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateSafetyInspectionDto>,
    @Request() req,
  ) {
    try {
      const inspection = await this.safetyService.updateInspection(
        id,
        updateDto,
        req.user.tenantId,
      );
      return {
        message: 'Safety inspection updated successfully',
        inspection,
      };
    } catch (error) {
      console.error('❌ Error in updateInspection controller:', error);
      throw error;
    }
  }

  @Delete('inspections/:id')
  @ApiOperation({ summary: 'Delete a safety inspection' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Inspection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inspection not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
  ) {
    try {
      await this.safetyService.deleteInspection(id, req.user.tenantId);
      return {
        message: 'Safety inspection deleted successfully',
      };
    } catch (error) {
      console.error('❌ Error in deleteInspection controller:', error);
      throw error;
    }
  }

  // ===== TRAINING ENDPOINTS =====

  @Post('trainings')
  @ApiOperation({ summary: 'Create a new safety training' })
  @ApiResponse({ status: 201, description: 'Training created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTraining(
    @Body() createDto: CreateSafetyTrainingDto,
    @Request() req,
  ) {
    try {
      const training = await this.safetyService.createTraining(
        createDto,
        req.user.tenantId,
        req.user.userId,
      );
      return {
        message: 'Safety training created successfully',
        training,
      };
    } catch (error) {
      console.error('❌ Error in createTraining controller:', error);
      throw error;
    }
  }

  @Get('trainings')
  @ApiOperation({ summary: 'Get all safety trainings' })
  @ApiQuery({ name: 'status', required: false, enum: TrainingStatus })
  @ApiQuery({ name: 'driverId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: TrainingType })
  @ApiResponse({ status: 200, description: 'List of trainings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTrainings(
    @Query('status') status?: TrainingStatus,
    @Query('driverId') driverId?: string,
    @Query('type') type?: TrainingType,
    @Request() req?,
  ) {
    try {
      const trainings = await this.safetyService.findAllTrainings(
        req.user.tenantId,
        {
          status,
          driverId,
          type,
        },
      );
      return {
        trainings,
      };
    } catch (error) {
      console.error('❌ Error in getTrainings controller:', error);
      throw error;
    }
  }

  @Get('trainings/:id')
  @ApiOperation({ summary: 'Get a specific safety training' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Training details' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTraining(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    try {
      const training = await this.safetyService.findOneTraining(
        id,
        req.user.tenantId,
      );
      return { training };
    } catch (error) {
      console.error('❌ Error in getTraining controller:', error);
      throw error;
    }
  }

  @Put('trainings/:id')
  @ApiOperation({ summary: 'Update a safety training' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Training updated successfully' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateTraining(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: Partial<CreateSafetyTrainingDto>,
    @Request() req,
  ) {
    try {
      const training = await this.safetyService.updateTraining(
        id,
        updateDto,
        req.user.tenantId,
      );
      return {
        message: 'Safety training updated successfully',
        training,
      };
    } catch (error) {
      console.error('❌ Error in updateTraining controller:', error);
      throw error;
    }
  }

  @Delete('trainings/:id')
  @ApiOperation({ summary: 'Delete a safety training' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Training deleted successfully' })
  @ApiResponse({ status: 404, description: 'Training not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteTraining(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    try {
      await this.safetyService.deleteTraining(id, req.user.tenantId);
      return {
        message: 'Safety training deleted successfully',
      };
    } catch (error) {
      console.error('❌ Error in deleteTraining controller:', error);
      throw error;
    }
  }
}
