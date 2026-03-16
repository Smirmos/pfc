import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  currency!: string;

  @IsNumber()
  @Min(0)
  primaryIncomeDollars!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  partnerIncomeDollars?: number;

  @IsNumber()
  @Min(0)
  rentDollars!: number;

  @IsNumber()
  @Min(0)
  debtPaymentsDollars!: number;

  @IsNumber()
  @Min(0)
  emergencyFundDollars!: number;

  @IsNumber()
  @Min(0)
  savingsTargetDollars!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999_999.99)
  bufferAmountDollars?: number | null;
}
