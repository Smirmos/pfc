import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(3)
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  primaryIncomeCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  rentCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  debtPaymentsCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  emergencyFundCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  savingsTargetCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99_999_999)
  bufferAmountCents?: number | null;
}
