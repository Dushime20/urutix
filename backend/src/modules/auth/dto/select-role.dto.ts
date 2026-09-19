import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '../../../entities/user.entity';

export class SelectRoleDto {
  @ApiProperty({
    description: 'The role selected by the user',
    example: 'CARGO_OWNER',
    enum: UserRole,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: string;

  @ApiProperty({
    description: 'The pre-auth token received from the initial login step',
    example: 'eyJhbGciOiJIUzI1NiIsIn...',
  })
  @IsNotEmpty()
  @IsString()
  preAuthToken: string;

  @ApiProperty({
    description: 'Optional tenant ID to disambiguate the same role across companies',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
