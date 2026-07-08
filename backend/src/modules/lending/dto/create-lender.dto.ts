import {
  IsString,
  IsEmail,
  IsUrl,
  IsOptional,
  IsNotEmpty,
  IsUUID,
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

  /**
   * Only honoured when called by SUPER_ADMIN via POST /admin/lenders.
   * TENANT_ADMIN always has their tenantId injected from the JWT — this
   * field is ignored for them at the controller level.
   * Without this declaration, ValidationPipe(whitelist:true) would strip
   * it before the controller reads (createLenderDto as any).tenantId.
   */
  @IsUUID()
  @IsOptional()
  tenantId?: string;
}

export class LenderResponseDto {
  id: string;
  api_key: string;
}
