import { ApiProperty } from '@nestjs/swagger';

export class PaginatorDto {
  @ApiProperty({ required: false, default: 10 })
  size?: number;

  @ApiProperty({ required: false, default: 0 })
  start?: number;

  @ApiProperty({
    required: false,
    description:
      'Specify the field to be sorted, (start with `-` for descending order) eg: `-names, price`',
  })
  sort_by?: string;
}

export function Paginators(params: Partial<PaginatorDto>) {
  const { start, size, sort_by } = params;

  const skip = Number(start) || 0;
  const sorts = sortFields(`${sort_by || ''}`);

  let limit = (Number(size) < 0 ? 0 : Number(size)) ?? 10;
  limit = isNaN(limit) ? 10 : limit;

  return { start, size, skip, limit, sorts, sort_by };
}

export function sortFields(str?: string) {
  if (!str) str = '-createdAt';

  const fields = str
    ?.split?.(',')
    ?.map?.((word) => {
      word = word?.trim?.();
      if (!word) return [];

      const [sign, ...f] = word;
      if (!['-', '+'].includes(sign)) {
        return [[sign, ...f].join(''), 1];
      } else if (['+'].includes(sign)) {
        return [f.join(''), 1];
      } else {
        return [f.join(''), -1];
      }
    })
    ?.filter?.((word) => word?.length == 2 && !!word?.[0]);

  const output: Record<string, number> = Object.fromEntries(
    fields as [string, number][],
  );
  return output;
}

export function PaginatorResponse<T>(
  data: T[] = [],
  total: number = 0,
  size: number = 10,
  skip: number = 0,
) {
  return {
    results: data,
    total,
    start: skip,
    end: skip + data?.length,
    size,
  };
}

export type TPaginatorResponse<T> = {
  results: T[];
  total: number;
  start: number;
  end: number;
  size: number;
};

export class PaginatorResponseDto<T = object> {
  @ApiProperty({ isArray: true, type: [Object] })
  results!: T[];

  @ApiProperty({ type: Number })
  total!: number;

  @ApiProperty({ type: Number })
  start!: number;

  @ApiProperty({ type: Number })
  end!: number;

  @ApiProperty({ type: Number })
  size!: number;
}
