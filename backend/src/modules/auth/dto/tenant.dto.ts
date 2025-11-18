import { ApiProperty, PartialType } from '@nestjs/swagger';
import { PaginatorDto } from 'src/utils/paginator';

export class FindTenantsDto extends PartialType(PaginatorDto) {
  @ApiProperty({ description: 'Search', required: false })
  q?: string;
}
