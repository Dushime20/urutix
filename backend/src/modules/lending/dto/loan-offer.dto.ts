import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Lender submits a formal loan offer — does NOT disburse funds. */
export class SubmitLoanOfferDto {
  @ApiProperty({ description: 'Approved principal amount (≤ requested amount unless partial approval)' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  approved_amount: number;

  @ApiProperty({ description: 'Repayment due date (ISO 8601)' })
  @IsDateString()
  due_date: string;

  @ApiProperty({ description: 'Loan term in months' })
  @IsInt()
  @Min(1)
  @Max(360)
  loan_term_months: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  external_loan_ref?: string;
}

/** Borrower accepts the lender's formal offer. */
export class AcceptLoanTermsDto {
  @ApiPropertyOptional({ description: 'Electronic consent acknowledgement reference' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  consent_reference?: string;
}

/** Borrower declines the lender's formal offer. */
export class DeclineLoanTermsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
