import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateLenderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsOptional()
  callback_url?: string;

  @IsEmail()
  @IsNotEmpty()
  contact_email: string;
}

export class LenderResponseDto {
  id: string;
  api_key: string;
}
