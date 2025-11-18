import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
    example: {},
  })
  data?: T;

  @ApiProperty({
    description: 'Error details if any',
    example: null,
    required: false,
  })
  error?: string;

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;
}

export class PaginatedResponseDto<T = any> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Data retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of items',
    example: [],
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
    },
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;
}
