import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * AddAppealMessageDto
 * 
 * DTO for adding a message to an appeal.
 * Creates a conversation thread between user and admin.
 */
export class AddAppealMessageDto {
  @ApiProperty({
    description: 'Message content',
    example: 'Thank you for reviewing my appeal. I have additional evidence to support my case.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Attachments or references',
    example: ['screenshot-url-1', 'document-url-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
