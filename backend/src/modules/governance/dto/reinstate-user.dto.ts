import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * ReinstateUserDto
 * 
 * Data transfer object for reinstating a terminated user.
 */
export class ReinstateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20, { message: 'Reinstatement notes must be at least 20 characters' })
  notes: string;
}
