import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
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
}
