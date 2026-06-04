import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, Req,
  ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ApiMarketplaceService } from './api-marketplace.service';

class CreateApiKeyDto {
  @IsString() name: string;
  @IsOptional() @IsArray() permissions?: string[];
  @IsOptional() expiresAt?: string;
}

class CreateWebhookDto {
  @IsString() name: string;
  @IsString() url: string;
  @IsArray() events: string[];
}

class UpdateWebhookDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsArray() events?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('API Marketplace & Webhooks')
@Controller('api-marketplace')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth('JWT-auth')
export class ApiMarketplaceController {
  constructor(private readonly service: ApiMarketplaceService) {}

  // ─── API Keys ─────────────────────────────────────────────────────────────────

  @Post('api-keys')
  @ApiOperation({ summary: 'Generate a new API key (returned once)' })
  generateKey(@Body() dto: CreateApiKeyDto, @Req() req: any) {
    return this.service.generateApiKey(
      req.user.tenantId,
      req.user.id,
      dto.name,
      dto.permissions,
      dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    );
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'List API keys for tenant (masked)' })
  listKeys(@Req() req: any) {
    return this.service.listApiKeys(req.user.tenantId);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key' })
  revokeKey(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.revokeApiKey(id, req.user.tenantId);
  }

  // ─── Webhooks ─────────────────────────────────────────────────────────────────

  @Get('events')
  @ApiOperation({ summary: 'List all available webhook event types' })
  getEvents() {
    return this.service.getAvailableEvents();
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Register a webhook endpoint' })
  createWebhook(@Body() dto: CreateWebhookDto, @Req() req: any) {
    return this.service.createWebhook(req.user.tenantId, req.user.id, dto.name, dto.url, dto.events);
  }

  @Get('webhooks')
  @ApiOperation({ summary: 'List configured webhooks' })
  listWebhooks(@Req() req: any) {
    return this.service.listWebhooks(req.user.tenantId);
  }

  @Put('webhooks/:id')
  @ApiOperation({ summary: 'Update a webhook' })
  updateWebhook(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookDto,
    @Req() req: any,
  ) {
    return this.service.updateWebhook(id, req.user.tenantId, dto);
  }

  @Delete('webhooks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook' })
  deleteWebhook(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.deleteWebhook(id, req.user.tenantId);
  }

  @Post('webhooks/:id/test')
  @ApiOperation({ summary: 'Send a test payload to a webhook' })
  testWebhook(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.sendTestPayload(id, req.user.tenantId);
  }

  @Get('webhooks/:id/logs')
  @ApiOperation({ summary: 'Get delivery logs for a webhook' })
  async getWebhookLogs(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const webhooks = await this.service.listWebhooks(req.user.tenantId);
    const webhook = webhooks.find((w) => w.id === id);
    return webhook?.deliveryLogs ?? [];
  }
}
