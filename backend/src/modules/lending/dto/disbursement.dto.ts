import {
  IsString,
  IsUUID,
  IsArray,
  IsDateString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryDto } from './loan-request.dto';

export class ConfirmDisbursementDto {
  @IsUUID()
  loan_id: string;

  @IsString()
  external_disbursement_ref: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BeneficiaryDto)
  beneficiaries: BeneficiaryDto[];

  @IsString()
  status: 'success' | 'failed';

  @IsDateString()
  timestamp: string;

  @IsString()
  @IsOptional()
  failure_reason?: string;
}
