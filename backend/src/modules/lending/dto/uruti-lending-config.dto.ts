import {
  IsString,
  IsUrl,
  IsOptional,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfigureUrutiLendingDto {
  @ApiProperty({
    description: 'Lender ID to configure',
    example: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  lenderId: string;

  @ApiProperty({
    description: 'Base URL of Uruti Lending Platform',
    example: 'https://api.urutilending.com',
  })
  @IsUrl()
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({
    description: 'API Key for authentication',
    example: 'your-api-key-here',
  })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiPropertyOptional({
    description: 'Webhook secret for signature verification',
    example: 'your-webhook-secret',
  })
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  @ApiPropertyOptional({
    description: 'Default loan product code',
    example: 'PL-001',
  })
  @IsString()
  @IsOptional()
  loanProductCode?: string;
}

export class TestWebhookDto {
  @ApiProperty({
    description: 'Lender ID to test webhook for',
    example: 'uuid',
  })
  @IsUUID('4')
  @IsNotEmpty()
  lenderId: string;
}

export class UrutiLendingConfigResponseDto {
  lenderId: string;
  baseUrl: string;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  loanProductCode?: string;
  webhookUrl: string;
}

