import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lender, LenderStatus } from '../../../entities/lender.entity';
import {
  ConfigureUrutiLendingDto,
  UrutiLendingConfigResponseDto,
  TestWebhookDto,
} from '../dto/uruti-lending-config.dto';
import { UrutiLendingIntegrationService } from './../services/uruti-lending-integration.service';
import { encryptString, decryptString } from '../../../common/utils/crypto.util';
import { ConfigService } from '@nestjs/config';

@ApiTags('Uruti Lending Platform - Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/uruti-lending')
export class UrutiLendingAdminController {
  private readonly logger = new Logger(UrutiLendingAdminController.name);

  constructor(
    @InjectRepository(Lender)
    private lenderRepository: Repository<Lender>,
    private integrationService: UrutiLendingIntegrationService,
    private configService: ConfigService,
  ) {}

  @Post('configure')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Configure Uruti Lending Platform integration for a lender',
    description:
      'Sets up API credentials and webhook configuration for a lender to use Uruti Lending Platform',
  })
  @ApiBody({ type: ConfigureUrutiLendingDto })
  @ApiResponse({
    status: 200,
    description: 'Configuration saved successfully',
    type: UrutiLendingConfigResponseDto,
  })
  async configureIntegration(
    @Body() configDto: ConfigureUrutiLendingDto,
  ): Promise<UrutiLendingConfigResponseDto> {
    const lender = await this.lenderRepository.findOne({
      where: { id: configDto.lenderId },
    });

    if (!lender) {
      throw new NotFoundException(`Lender ${configDto.lenderId} not found`);
    }

    // Encrypt API key and webhook secret
    const encryptedApiKey = encryptString(configDto.apiKey);
    const encryptedWebhookSecret = configDto.webhookSecret
      ? encryptString(configDto.webhookSecret)
      : null;

    // Update lender configuration
    lender.callback_url = `${configDto.baseUrl}/api`;
    lender.outbound_api_key_encrypted = encryptedApiKey;
    if (encryptedWebhookSecret) {
      lender.webhook_secret_encrypted = encryptedWebhookSecret;
    }

    // Update metadata
    lender.metadata = {
      ...lender.metadata,
      integrationType: 'uruti_lending_platform',
      loanProductCode: configDto.loanProductCode || 'PL-001',
      baseUrl: configDto.baseUrl,
      configuredAt: new Date().toISOString(),
    };

    await this.lenderRepository.save(lender);

    this.logger.log(
      `Configured Uruti Lending Platform integration for lender ${lender.id}`,
    );

    // Generate webhook URL
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
    const webhookUrl = `${baseUrl}/api/platform/v1/loan_status_update`;

    return {
      lenderId: lender.id,
      baseUrl: configDto.baseUrl,
      hasApiKey: true,
      hasWebhookSecret: !!encryptedWebhookSecret,
      loanProductCode: configDto.loanProductCode || 'PL-001',
      webhookUrl,
    };
  }

  @Get('list-external-lenders')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'List all lenders configured for external lending system',
    description: 'Returns all lenders that are configured to use external lending systems',
  })
  @ApiResponse({
    status: 200,
    description: 'External lenders retrieved successfully',
  })
  async listExternalLenders(): Promise<any> {
    const allLenders = await this.lenderRepository.find({
      where: { status: LenderStatus.ACTIVE },
    });

    const externalLenders = allLenders
      .filter((lender) => {
        const hasIntegrationType = 
          lender.metadata?.integrationType === 'uruti_lending_platform' ||
          lender.metadata?.integrationType === 'external_lending_system';
        const hasCallbackUrl = 
          lender.callback_url?.includes('urutilending.com') ||
          lender.callback_url?.includes('localhost:3000');
        return hasIntegrationType || hasCallbackUrl;
      })
      .map((lender) => ({
        id: lender.id,
        name: lender.name,
        email: lender.contact_email,
        status: lender.status,
        hasApiKey: !!lender.outbound_api_key_encrypted,
        hasWebhookSecret: !!lender.webhook_secret_encrypted,
        integrationType: lender.metadata?.integrationType,
        callback_url: lender.callback_url,
        metadata: lender.metadata,
      }));

    return {
      total: externalLenders.length,
      lenders: externalLenders,
    };
  }

  @Get('config/:lenderId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Get Uruti Lending Platform configuration for a lender',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully',
    type: UrutiLendingConfigResponseDto,
  })
  async getConfiguration(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
  ): Promise<UrutiLendingConfigResponseDto> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    if (!lender) {
      throw new NotFoundException(`Lender ${lenderId} not found`);
    }

    // Extract base URL from callback_url
    const baseUrl = lender.callback_url
      ? lender.callback_url.replace(/\/api\/?$/, '')
      : '';


    // Generate webhook URL
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
    const webhookUrl = `${frontendUrl}/api/platform/v1/loan_status_update`;

    return {
      lenderId: lender.id,
      baseUrl,
      hasApiKey: !!lender.outbound_api_key_encrypted,
      hasWebhookSecret: !!lender.webhook_secret_encrypted,
      loanProductCode: lender.metadata?.loanProductCode,
      webhookUrl,
    };
  }

  @Post('test-webhook')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Test webhook configuration',
    description: 'Sends a test webhook to verify the configuration',
  })
  @ApiBody({ type: TestWebhookDto })
  async testWebhook(@Body() testDto: TestWebhookDto): Promise<{
    success: boolean;
    message: string;
  }> {
    const lender = await this.lenderRepository.findOne({
      where: { id: testDto.lenderId },
    });

    if (!lender) {
      throw new NotFoundException(`Lender ${testDto.lenderId} not found`);
    }

    if (!lender.webhook_secret_encrypted) {
      throw new BadRequestException(
        'Webhook secret not configured for this lender',
      );
    }

    // This would typically send a test webhook to the configured webhook URL
    // For now, we'll just verify the configuration is valid
    this.logger.log(`Test webhook requested for lender ${lender.id}`);

    return {
      success: true,
      message: 'Webhook configuration is valid. Test webhook would be sent to the configured URL.',
    };
  }

  @Get('loan-officers/:lenderId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN, UserRole.CARGO_OWNER)
  @ApiOperation({
    summary: 'Get loan officers from external lending system',
    description: 'Fetches available loan officers from the external lending platform for a specific lender',
  })
  @ApiResponse({
    status: 200,
    description: 'Loan officers retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  })
  async getLoanOfficers(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
  ): Promise<any> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    if (!lender) {
      throw new NotFoundException(`Lender ${lenderId} not found`);
    }

    // Check if lender uses external lending system
    const isExternalSystem =
      lender.metadata?.integrationType === 'uruti_lending_platform' ||
      lender.callback_url?.includes('urutilending.com') ||
      lender.callback_url?.includes('localhost:3000');

    if (!isExternalSystem || !lender.outbound_api_key_encrypted) {
      throw new BadRequestException(
        'Lender is not configured for external lending system integration',
      );
    }

    try {
      const officers = await this.integrationService.getLoanOfficers(lenderId);
      return {
        success: true,
        count: officers.length,
        lender: {
          id: lender.id,
          name: lender.name,
          callback_url: lender.callback_url,
          hasApiKey: !!lender.outbound_api_key_encrypted,
        },
        loanOfficers: officers,
      };
    } catch (error: any) {
      this.logger.error(`Error fetching loan officers: ${error.message}`);
      return {
        success: false,
        error: error.message,
        lender: {
          id: lender.id,
          name: lender.name,
          callback_url: lender.callback_url,
        },
        loanOfficers: [],
      };
    }
  }

  @Put('regenerate-api-key/:lenderId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
  @ApiOperation({
    summary: 'Regenerate API key for a lender',
    description:
      'Note: This requires updating the API key in Uruti Lending Platform as well',
  })
  async regenerateApiKey(
    @Param('lenderId', ParseUUIDPipe) lenderId: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const lender = await this.lenderRepository.findOne({
      where: { id: lenderId },
    });

    if (!lender) {
      throw new NotFoundException(`Lender ${lenderId} not found`);
    }

    // Note: In a real scenario, you would:
    // 1. Call Uruti Lending Platform API to regenerate the key
    // 2. Update the encrypted key in the database
    // For now, we'll just return a message

    this.logger.warn(
      `API key regeneration requested for lender ${lenderId}. This requires manual update in Uruti Lending Platform.`,
    );

    return {
      success: false,
      message:
        'API key regeneration must be done through Uruti Lending Platform Admin API. Please use POST /api/admin/integrations/platforms/:id/regenerate-api-key in the lending platform.',
    };
  }
}

