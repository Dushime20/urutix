import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiMarketplaceService } from './api-marketplace.service';
import { ApiMarketplaceController } from './api-marketplace.controller';
import { ApiKey } from '../../entities/api-key.entity';
import { WebhookConfig } from '../../entities/webhook-config.entity';
import { EnhancedAuthModule } from '../auth/enhanced-auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, WebhookConfig]), EnhancedAuthModule],
  controllers: [ApiMarketplaceController],
  providers: [ApiMarketplaceService],
  exports: [ApiMarketplaceService],
})
export class ApiMarketplaceModule {}
