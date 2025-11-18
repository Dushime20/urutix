import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLoadDto } from './create-load.dto';

export class BulkCreateLoadDto {
  @ApiProperty({
    description: 'Array of loads to create',
    type: [CreateLoadDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLoadDto)
  loads: CreateLoadDto[];
}

export class BulkUpdateLoadDto {
  @ApiProperty({
    description: 'Array of load IDs to update',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  loadIds: string[];

  @ApiProperty({
    description: 'Updates to apply to all loads',
  })
  @ValidateNested()
  @Type(() => CreateLoadDto)
  updates: Partial<CreateLoadDto>;
}

export class BulkDeleteLoadDto {
  @ApiProperty({
    description: 'Array of load IDs to delete',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  loadIds: string[];
}
