import { IsOptional, IsIn, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DisbursementQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by disbursement status',
    enum: ['pending', 'approved', 'disbursed', 'rejected', 'on_hold'],
  })
  @IsOptional()
  @IsIn(['pending', 'approved', 'disbursed', 'rejected', 'on_hold'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    enum: ['urgent', 'high', 'medium', 'low'],
  })
  @IsOptional()
  @IsIn(['urgent', 'high', 'medium', 'low'])
  priority?: string;

  @ApiPropertyOptional({
    description: 'Search term for borrower name, loan ID, or disbursement ID',
    example: 'TransGlobal',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['amount', 'requestedDate', 'borrowerName', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsIn(['amount', 'requestedDate', 'borrowerName', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
