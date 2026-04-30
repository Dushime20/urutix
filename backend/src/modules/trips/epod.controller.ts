import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';

import { EpodService } from './epod.service';
import { SubmitEpodDto } from './dto/submit-epod.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('ePOD')
@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EpodController {
  constructor(private readonly epodService: EpodService) {}

  /**
   * POST /trips/:id/epod
   * Driver submits ePOD — signature + photos + metadata.
   * Automatically marks trip COMPLETED and generates invoice.
   */
  @Post(':id/epod')
  @Roles(UserRole.DRIVER, UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER, UserRole.FLEET_DISPATCHER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Submit ePOD for a trip', description: 'Driver submits electronic proof of delivery with signature and photos. Automatically completes the trip and generates an invoice.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recipientName'],
      properties: {
        recipientName: { type: 'string', description: 'Full name of the delivery recipient' },
        recipientPhone: { type: 'string' },
        deliveryNotes: { type: 'string' },
        odometerReading: { type: 'string' },
        deliveryAddress: { type: 'string' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        signature: { type: 'string', format: 'binary', description: 'Signature image file (PNG)' },
        photos: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Delivery photos (up to 5)' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'signature', maxCount: 1 },
        { name: 'photos', maxCount: 5 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async submitEpod(
    @Param('id') tripId: string,
    @Body() dto: SubmitEpodDto,
    @Request() req,
    @UploadedFiles() files: { signature?: Express.Multer.File[]; photos?: Express.Multer.File[] },
  ) {
    const signatureFile = files?.signature?.[0];
    const photoFiles = files?.photos || [];

    const epod = await this.epodService.submitEpod(
      tripId,
      req.user.tenantId,
      req.user.userId,
      dto,
      signatureFile,
      photoFiles,
    );

    return {
      success: true,
      message: 'ePOD submitted successfully. Trip completed and invoice generated.',
      data: epod,
      statusCode: 201,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /trips/:id/epod
   * Get the ePOD for a trip.
   */
  @Get(':id/epod')
  @Roles(UserRole.DRIVER, UserRole.TRUCK_OWNER, UserRole.CARGO_OWNER, UserRole.CARGO_RECEIVER, UserRole.FLEET_MANAGER, UserRole.FLEET_DISPATCHER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get ePOD for a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiOkResponse({ description: 'ePOD retrieved successfully' })
  async getEpod(@Param('id') tripId: string, @Request() req) {
    const epod = await this.epodService.getEpodByTrip(tripId, req.user.tenantId);
    return {
      success: true,
      message: 'ePOD retrieved successfully',
      data: epod,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /trips/:id/epod/confirm
   * Cargo owner confirms the ePOD.
   */
  @Patch(':id/epod/confirm')
  @Roles(UserRole.CARGO_OWNER, UserRole.CARGO_RECEIVER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cargo owner confirms ePOD' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  async confirmEpod(@Param('id') tripId: string, @Request() req) {
    const epod = await this.epodService.getEpodByTrip(tripId, req.user.tenantId);
    const confirmed = await this.epodService.confirmEpod(epod.id, req.user.tenantId);
    return {
      success: true,
      message: 'ePOD confirmed successfully',
      data: confirmed,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /trips/:id/invoice
   * Get the auto-generated invoice for a trip.
   */
  @Get(':id/invoice')
  @Roles(UserRole.CARGO_OWNER, UserRole.CARGO_RECEIVER, UserRole.TRUCK_OWNER, UserRole.FLEET_MANAGER, UserRole.FLEET_DISPATCHER, UserRole.TENANT_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get invoice for a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiOkResponse({ description: 'Invoice retrieved successfully' })
  async getInvoice(@Param('id') tripId: string, @Request() req) {
    const invoice = await this.epodService.getInvoiceByTrip(tripId, req.user.tenantId);
    return {
      success: true,
      message: 'Invoice retrieved successfully',
      data: invoice,
      statusCode: 200,
      timestamp: new Date().toISOString(),
    };
  }
}
