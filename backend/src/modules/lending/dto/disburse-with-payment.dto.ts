import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum DisbursementPaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
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
    description: 'Phone number for mobile money payment (required if paymentMethod is mobile_money)',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ 
    description: 'Truck owner phone number (where to send the payment)',
    required: false,
  })
  @IsOptional()
  @IsString()
  truckOwnerPhoneNumber?: string;
}

