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

export class UpdateExpenseItemDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amountDollars?: number;

  @IsString()
  @IsOptional()
  @IsIn(FREQUENCIES)
  frequency?: string;

  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;
}
