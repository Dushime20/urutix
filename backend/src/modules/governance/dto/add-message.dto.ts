import { IsString, IsNotEmpty, MinLength } from 'class-validator';

/**
 * AddMessageDto
 * 
 * Data transfer object for adding a message to an appeal thread.
 */
export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  message: string;
}
