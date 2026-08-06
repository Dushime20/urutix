import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum DisbursementPaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
}

export class DisburseWithPaymentDto {
  @ApiProperty({
    description: 'Payment method for disbursement',
    enum: DisbursementPaymentMethod,
    default: DisbursementPaymentMethod.MOBILE_MONEY,
  })
  @IsEnum(DisbursementPaymentMethod)
  paymentMethod: DisbursementPaymentMethod;

  @ApiProperty({
    description:
      'Lender MoMo number that will pay (receives the Ishema PIN popup). Required for mobile_money.',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Truck owner phone number (beneficiary — receives the funds)',
    required: false,
  })
  @IsOptional()
  @IsString()
  truckOwnerPhoneNumber?: string;

  @ApiProperty({ description: 'Bank account number (bank_transfer)', required: false })
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiProperty({ description: 'Bank name (bank_transfer)', required: false })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({ description: 'Bank account holder name (bank_transfer)', required: false })
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiProperty({ description: 'Card number (card)', required: false })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiProperty({ description: 'Cardholder name (card)', required: false })
  @IsOptional()
  @IsString()
  cardName?: string;

  @ApiProperty({ description: 'Card expiry MM/YY (card)', required: false })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiProperty({ description: 'Card CVV (card)', required: false })
  @IsOptional()
  @IsString()
  cvv?: string;

  @ApiProperty({
    description:
      'ISO 4217 currency the lender pays in (e.g. RWF when paying via MoMo, USD for bank). ' +
      'Loan principal stays in loan.currency; FX converts at settlement time.',
    required: false,
    example: 'RWF',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}

