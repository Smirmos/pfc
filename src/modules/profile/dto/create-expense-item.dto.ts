import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { FREQUENCIES } from '../baseline-calculator';

export class CreateExpenseItemDto {
  @IsString()
  @MaxLength(100)
  label!: string;

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsString()
  @IsIn(FREQUENCIES)
  frequency!: string;

  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;
}
