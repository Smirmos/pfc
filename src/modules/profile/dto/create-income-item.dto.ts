import { IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';
import { FREQUENCIES } from '../baseline-calculator';

export class CreateIncomeItemDto {
  @IsString()
  @MaxLength(100)
  label!: string;

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsString()
  @IsIn(FREQUENCIES)
  frequency!: string;
}
