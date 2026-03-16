import {
  IsBoolean,
  IsIn,
  IsNumber,
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

  @IsNumber()
  @Min(0.01)
  amountDollars!: number;

  @IsString()
  @IsIn(FREQUENCIES)
  frequency!: string;

  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;
}
