import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiHeader } from '@nestjs/swagger';
import { UrutiLendingIntegrationService } from './../services/uruti-lending-integration.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lender } from '../../../entities/lender.entity';
import { decryptString } from '../../../common/utils/crypto.util';

export class WebhookPayloadDto {
  event: string;
  timestamp: string;
  data: any;
}

@ApiTags('Uruti Lending Platform Integration')
@Controller('platform/v1')
export class UrutiLendingWebhookController {
  private readonly logger = new Logger(UrutiLendingWebhookController.name);

  constructor(
    private readonly integrationService: UrutiLendingIntegrationService,
    @InjectRepository(Lender)
    private lenderRepository: Repository<Lender>,
  ) {}

  @Post('loan_status_update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive webhook from Uruti Lending Platform',
    description:
      'Endpoint to receive loan status updates from Uruti Lending Platform via webhook',
  })
  @ApiHeader({
    name: 'X-Webhook-Signature',
    description: 'HMAC SHA-256 signature of the webhook payload',
    required: true,
  })
  @ApiBody({ type: WebhookPayloadDto })
  async handleWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-lender-id') lenderIdHeader?: string,
  ) {
    this.logger.log(`Received webhook event: ${payload.event}`);

    try {
      // Validate payload
      if (!payload.event || !payload.data) {
        throw new BadRequestException('Invalid webhook payload');
      }

      // Find lender - try header first, then search by callback URL pattern
      let lender: Lender | null = null;

      if (lenderIdHeader) {
        lender = await this.lenderRepository.findOne({
          where: { id: lenderIdHeader },
        });
      }

      // If not found by header, try to find by matching webhook secret
      // This is a fallback - ideally lender ID should be in header or payload
      if (!lender) {
        // For now, we'll need to get lender ID from payload or metadata
        // This might need to be adjusted based on actual webhook payload structure
        this.logger.warn('Lender ID not provided in header, attempting to find lender');
        
        // Try to find active lenders with webhook secret configured
        const lenders = await this.lenderRepository.find({
          where: { status: 'active' as any },
        });

        // Try to verify signature with each lender's secret
        for (const candidateLender of lenders) {
          if (candidateLender.webhook_secret_encrypted) {
            try {
              const secret = decryptString(candidateLender.webhook_secret_encrypted);
              const payloadString = JSON.stringify(payload);
              const isValid = this.integrationService.verifyWebhookSignature(
                payloadString,
                signature,
                secret,
              );

              if (isValid) {
                lender = candidateLender;
                this.logger.log(`Found matching lender: ${lender.id}`);
                break;
              }
            } catch (error) {
              // Continue to next lender
              continue;
            }
          }
        }
      }

      if (!lender) {
        throw new UnauthorizedException('Lender not found or invalid signature');
      }

      // Verify webhook signature
      if (lender.webhook_secret_encrypted) {
        try {
          const secret = decryptString(lender.webhook_secret_encrypted);
          const payloadString = JSON.stringify(payload);
          const isValid = this.integrationService.verifyWebhookSignature(
            payloadString,
            signature,
            secret,
          );

          if (!isValid) {
            this.logger.warn('Invalid webhook signature');
            throw new UnauthorizedException('Invalid webhook signature');
          }
        } catch (error) {
          if (error instanceof UnauthorizedException) {
            throw error;
          }
          this.logger.error(`Failed to verify signature: ${error.message}`);
          throw new UnauthorizedException('Failed to verify webhook signature');
        }
      } else {
        this.logger.warn(
          `Lender ${lender.id} does not have webhook secret configured`,
        );
        // In development, we might allow unsigned webhooks
        // In production, this should be required
        if (process.env.NODE_ENV === 'production') {
          throw new UnauthorizedException('Webhook secret not configured');
        }
      }

      // Process webhook event
      await this.integrationService.processWebhookEvent(payload, lender.id);

      this.logger.log(`Successfully processed webhook event: ${payload.event}`);

      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process webhook: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

