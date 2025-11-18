import { ApiProperty } from '@nestjs/swagger';
import { LoadResponseV2Dto } from './load-response-v2.dto';

export class LoadsPaginatedResponseV2Dto {
  @ApiProperty({ description: 'Array of loads', type: [LoadResponseV2Dto] })
  items: LoadResponseV2Dto[];

  @ApiProperty({ description: 'Total number of loads' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}
