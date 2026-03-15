import {
  IsInt,
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

  @IsInt()
  @Min(0)
  primaryIncomeCents!: number;

  @IsInt()
  @Min(0)
  rentCents!: number;

  @IsInt()
  @Min(0)
  debtPaymentsCents!: number;

  @IsInt()
  @Min(0)
  emergencyFundCents!: number;

  @IsInt()
  @Min(0)
  savingsTargetCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99_999_999)
  bufferAmountCents?: number | null;
}
