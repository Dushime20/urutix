import { ApiProperty } from '@nestjs/swagger';

export class LoadsStatisticsV2Dto {
  @ApiProperty({ description: 'Total number of loads' })
  total: number;

  @ApiProperty({ description: 'Number of draft loads' })
  draft: number;

  @ApiProperty({ description: 'Number of published loads' })
  published: number;

  @ApiProperty({ description: 'Number of assigned loads' })
  assigned: number;

  @ApiProperty({ description: 'Number of in-transit loads' })
  inTransit: number;

  @ApiProperty({ description: 'Number of delivered loads' })
  delivered: number;

  @ApiProperty({ description: 'Number of cancelled loads' })
  cancelled: number;

  @ApiProperty({ description: 'Total load value' })
  totalValue: number;

  @ApiProperty({ description: 'Average load value' })
  averageValue: number;

  @ApiProperty({ description: 'Total weight' })
  totalWeight: number;

  @ApiProperty({ description: 'Average weight' })
  averageWeight: number;

  @ApiProperty({ description: 'Number of hazardous loads' })
  hazardous: number;

  @ApiProperty({ description: 'Number of refrigerated loads' })
  refrigerated: number;

  @ApiProperty({ description: 'Number of time-critical loads' })
  timeCritical: number;

  @ApiProperty({ description: 'Loads by cargo type' })
  byCargoType: Record<string, number>;

  @ApiProperty({ description: 'Loads by urgency level' })
  byUrgencyLevel: Record<string, number>;

  @ApiProperty({ description: 'Loads by status' })
  byStatus: Record<string, number>;
}
