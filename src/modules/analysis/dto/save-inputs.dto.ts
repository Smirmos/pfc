import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SaveInputsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cash_price_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  down_payment_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  loan_amount_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  interest_rate_pct?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  term_months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_payment_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  insurance_monthly_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenance_monthly_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fees_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_rent_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  upfront_costs_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthly_extras_cents?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  duration_months?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  balloon_payment_cents?: number;

  @IsOptional()
  @IsBoolean()
  is_variable_rate?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_monthly_costs_cents?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
